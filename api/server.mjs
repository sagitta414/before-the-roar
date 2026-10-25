import { VideoDesk, validateVideoInput } from "./video-desk.mjs";
import { EvidenceDesk } from "./evidence-desk.mjs";
import { normalizeStudio } from "../dist/studio-insight.js";
// HTTP routing, input validation, origin/rate controls and synthetic match stream ownership.
import { VisionDesk } from "./vision.mjs";
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, timingSafeEqual } from "node:crypto";
import {
  generateMatch,
  initialState,
  ingest,
  snapshot,
  evidencePacket,
} from "./match.mjs";
import { Narrator, fallback, dailyRequestLimit } from "./azure.mjs";
import { MODES } from "../dist/learning.js";
import { DiscussionDesk, DESK_ROLES } from "./desk.mjs";
import { normalizeQuestion } from "../dist/party-state.js";
import { MatchDesk } from "./match-desk.mjs";
import { PITCHSIDE } from "../dist/pitchside-story.js";
import { BroadcastRooms } from "./broadcast.mjs";
import { ProductionDesk } from "./production.mjs";
import { validateSyntheticMatch } from "./synthetic-validation.mjs";
import { clientIdentity, RateTable } from "./request-guard.mjs";
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".mp4": "video/mp4",
  ".svg": "image/svg+xml",
};
export function createApp({
  narrator = new Narrator(),
  clock = () => Date.now(),
  desk = new DiscussionDesk(narrator),
} = {}) {
  const root = resolve("dist"),
    runs = new Map(),
    rates = new RateTable({ clock }),
    evidenceDesk = new EvidenceDesk(narrator),
    videoDesk = new VideoDesk(narrator),
    matchDesk = new MatchDesk(narrator),
    clipDesk = new MatchDesk(narrator, { clip: true });
  let created = 0;
  let deskStreams = 0;
  let pendingRuns = 0;
  let runSubscribers = 0;
  const broadcasts = new BroadcastRooms({ clock }),
    vision = new VisionDesk(narrator),
    production = new ProductionDesk(narrator, { clock });
  function emit(run, type, data) {
    const item = { id: ++run.serial, type, data };
    run.history.push(item);
    if (run.history.length > 80) run.history.shift();
    for (const client of run.clients) {
      if (client.writableLength > 256000) {
        client.destroy();
        run.clients.delete(client);
      } else
        client.write(`id: ${item.id}\nevent: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
    }
  }
  function explain(run, second) {
    const packet = {
      ...evidencePacket(run.match, run.state, second, run.language),
      priority: run.audience,
    };
    emit(run, "thinking", { cutoff: second, recap: second === 5400 });
    run.explanationQueue = run.explanationQueue.then(async () => {
      if (!runs.has(run.id) || run.stopped || run.completed) return;
      const result = await narrator
        .explain(packet, (draft) => {
          if (runs.has(run.id) && !run.stopped && !run.completed)
            emit(run, "dialogue", { ...draft, cutoff: second });
        })
        .catch(() => fallback(packet));
      if (!runs.has(run.id) || run.stopped || run.completed) return;
      const item = {
        ...result,
        cutoff: second,
        recap: second === 5400,
        evidence: packet.facts,
        stats: packet.stats,
        match_id: run.match.id,
      };
      run.insights.push(item);
      emit(run, second === 5400 ? "recap" : "insight", item);
      if (second === 5400) {
        run.completed = true;
        emit(run, "complete", {
          duration: 5400,
          events: run.state.count,
          score: run.state.score,
        });
        for (const c of run.clients) c.end();
        run.clients.clear();
      }
    });
    return run.explanationQueue;
  }
  function tick() {
    for (const run of runs.values()) {
      if (clock() - run.created > 15 * 60e3) {
        for (const c of run.clients) c.end();
        runs.delete(run.id);
        continue;
      }
      if (!run.clients.size && clock() - (run.disconnected ?? run.created) > 60000)
        run.stopped = true;
      if (run.completed || run.stopped || !run.clients.size || run.fulltime) {
        run.lastTick = clock();
        continue;
      }
      const target = Math.min(
          5400,
          run.current + ((clock() - (run.lastTick ?? clock())) / 1000) * run.speed,
        ),
        batch = [];
      run.lastTick = clock();
      while (run.nextCheckpoint <= target) {
        while (
          run.cursor < run.match.events.length &&
          run.match.events[run.cursor].second <= run.nextCheckpoint
        ) {
          const e = run.match.events[run.cursor++];
          ingest(run.state, e);
          batch.push(e);
        }
        explain(run, run.nextCheckpoint);
        run.nextCheckpoint += 900;
      }
      while (
        run.cursor < run.match.events.length &&
        run.match.events[run.cursor].second <= target
      ) {
        const e = run.match.events[run.cursor++];
        ingest(run.state, e);
        batch.push(e);
      }
      run.current = target;
      emit(run, "state", {
        stats: snapshot(run.state, target),
        batch,
        server_time: clock(),
        processing_ms: Math.round((performance.now() - run.tickStart || 0) * 10) / 10,
      });
      if (target >= 5400) run.fulltime = true;
    }
  }
  const timer = setInterval(() => {
    for (const r of runs.values()) r.tickStart = performance.now();
    tick();
    broadcasts.prune();
    rates.prune();
  }, 500);
  timer.unref();
  const send = (res, status, value) => {
    res
      .writeHead(status, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      })
      .end(JSON.stringify(value));
  };
  const server = http.createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    const origin = req.headers.origin,
      allowed = new Set(
        (
          process.env.ALLOWED_ORIGINS ||
          "https://before-the-roar.sagitta107.chatgpt.site,http://127.0.0.1:4396,http://127.0.0.1:4397"
        ).split(","),
      );
    if (origin && allowed.has(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    }
    if (req.method === "OPTIONS") {
      res.writeHead(origin && !allowed.has(origin) ? 403 : 204).end();
      return;
    }
    let route;
    try {
      route = new URL(req.url, "http://local").pathname;
    } catch {
      return send(res, 400, { error: "Invalid URL" });
    }
    try {
      if (route === "/api/dataset" && req.method === "GET") {
        const seed = Number(
          new URL(req.url, "http://local").searchParams.get("seed") || 7,
        );
        if (!Number.isInteger(seed) || seed < 1 || seed > 1000000)
          return send(res, 400, { error: "Choose a seed from 1 to 1000000" });
        const match = generateMatch(seed);
        return send(res, 200, {
          schema: "btr.synthetic-dataset.v2",
          ...match,
          coverage: {
            kind: "event-only",
            duration_seconds: 5400,
            tracking_samples: false,
            coordinates:
              "Event start and end coordinates; not continuous player tracking",
          },
          validation: validateSyntheticMatch(match),
        });
      }
      if (route === "/api/judge-event" && req.method === "POST") {
        if (
          origin &&
          !allowed.has(origin) &&
          origin !== `https://${req.headers.host}` &&
          origin !== `http://${req.headers.host}`
        )
          return send(res, 403, { error: "Origin not allowed" });
        const received = clock(),
          envelope = randomBytes(10).toString("hex");
        return send(res, 201, {
          schema: "btr.live-event-envelope.v1",
          envelope_id: `judge-${envelope}`,
          received_at: received,
          server_timestamp: new Date(received).toISOString(),
          scenario: "wide",
          sequence_second: 18,
          match_clock: "67:18",
          revision: 1,
          evidence_id: "wide-track-102-450",
          source: "Azure session event · authored synthetic tracking",
          unseen_in_session: true,
          limits: [
            "The envelope is created live by the server.",
            "The underlying football observation belongs to the authored synthetic scenario; this is not a stadium feed.",
          ],
        });
      }
      if (route.startsWith("/api/production")) {
        if (
          origin &&
          !allowed.has(origin) &&
          origin !== `https://${req.headers.host}` &&
          origin !== `http://${req.headers.host}`
        )
          return send(res, 403, { error: "Origin not allowed" });
        const readInput = async () => {
          let body = "";
          for await (const c of req) {
            body += c;
            if (body.length > 2048) throw Error("Request too large");
          }
          return JSON.parse(body || "{}");
        };
        const ip = "production:" + clientIdentity(req);
        let rateReservation = null;
        if (req.method === "POST") {
          rateReservation = rates.reserve(ip, 12);
          if (!rateReservation)
            return send(res, 429, {
              error: "Please wait before starting more proof actions",
            });
        }
        if (route === "/api/production" && req.method === "POST") {
          try {
            const result = await production.create(await readInput());
            rateReservation.commit();
            return send(res, 201, result);
          } catch (e) {
            rateReservation.release();
            return send(res, 400, { error: e.message });
          }
        }
        const found = route.match(
          /^\/api\/production\/([a-f0-9]{24})\/(state|run|revise|cue)$/,
        );
        if (!found) {
          rateReservation?.release();
          return send(res, 404, { error: "Production run not found" });
        }
        let record;
        try {
          record = await production.authorized(
            found[1],
            (req.headers.authorization || "").replace(/^Bearer /, ""),
            found[2] === "cue",
          );
        } catch (e) {
          rateReservation?.release();
          return send(res, 403, { error: e.message });
        }
        if (req.method === "GET" && found[2] === "state")
          return send(res, 200, await production.export(record));
        if (req.method === "GET" && found[2] === "cue")
          return send(res, 200, production.cue(record));
        if (req.method === "POST" && found[2] === "revise") {
          try {
            const input = await readInput();
            rateReservation.commit();
            return send(
              res,
              200,
              await production.export(await production.revise(record, input)),
            );
          } catch (e) {
            rateReservation?.release();
            return send(res, 409, { error: e.message });
          }
        }
        if (req.method === "POST" && found[2] === "run") {
          if (deskStreams >= 6 || production.active.has(found[1])) {
            rateReservation.release();
            return send(res, 429, {
              error: "This desk is busy. Reconnect shortly.",
            });
          }
          deskStreams++;
          rateReservation.commit();
          res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
          });
          const emit = (type, data) => {
            if (res.destroyed) return;
            if (res.writableLength > 256000) {
              res.destroy();
              return;
            }
            res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
          };
          emit("connected", { generation: record.value.generation });
          try {
            await production.run(record, emit);
          } catch (e) {
            emit("error", { message: e.message });
          } finally {
            deskStreams--;
            res.end();
          }
          return;
        }
        rateReservation?.release();
        return send(res, 405, { error: "Method not allowed" });
      }
      if (route === "/api/vision-check" && req.method === "POST") {
        if (
          origin &&
          !allowed.has(origin) &&
          origin !== `https://${req.headers.host}` &&
          origin !== `http://${req.headers.host}`
        )
          return send(res, 403, { error: "Origin not allowed" });
        const reservation = rates.reserve("vision:" + clientIdentity(req), 6);
        if (!reservation)
          return send(res, 429, {
            error: "Please wait before checking more frames.",
          });
        let body = "";
        for await (const c of req) {
          body += c;
          if (body.length > 1024) {
            reservation.release();
            return send(res, 413, { error: "Request too large" });
          }
        }
        let input;
        try {
          input = JSON.parse(body);
        } catch {
          reservation.release();
          return send(res, 400, { error: "Invalid JSON" });
        }
        reservation.commit();
        try {
          return send(res, 200, await vision.inspect(input));
        } catch (error) {
          return send(res, 400, { error: error.message });
        }
      }
      if (route.startsWith("/api/broadcast")) {
        if (
          origin &&
          !allowed.has(origin) &&
          origin !== `https://${req.headers.host}` &&
          origin !== `http://${req.headers.host}`
        )
          return send(res, 403, { error: "Origin not allowed" });
        const found = route.match(
          /^\/api\/broadcast\/([a-f0-9]{24})\/(stream|update|stop)$/,
        );
        const readInput = async () => {
          let body = "";
          for await (const c of req) {
            body += c;
            if (body.length > 2048) throw Error("Request too large");
          }
          return JSON.parse(body);
        };
        if (route === "/api/broadcast" && req.method === "POST") {
          const reservation = rates.reserve("broadcast:" + clientIdentity(req), 6);
          if (!reservation)
            return send(res, 429, {
              error: "Please wait before creating another broadcast.",
            });
          try {
            const result = broadcasts.create(await readInput());
            reservation.commit();
            return send(res, 201, result);
          } catch (error) {
            reservation.release();
            return send(res, 400, { error: error.message });
          }
        }
        if (!found) return send(res, 404, { error: "Broadcast not found" });
        const room = broadcasts.get(found[1]);
        if (!room)
          return send(res, 410, {
            error: "This broadcast expired. Create a new output link.",
          });
        const action = found[2],
          write = action !== "stream",
          key = (req.headers.authorization || "").replace(/^Bearer /, "");
        if (!broadcasts.authorized(room, key, write))
          return send(res, 403, { error: "Broadcast authorization required" });
        if (action === "stream" && req.method === "GET") {
          if (!broadcasts.subscribe(room, res))
            send(res, 429, { error: "Too many connected renderers" });
          return;
        }
        if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
        if (action === "stop") {
          broadcasts.stop(room);
          return send(res, 200, { stopped: true });
        }
        try {
          return send(res, 200, broadcasts.update(room, await readInput()));
        } catch (error) {
          return send(res, 400, { error: error.message });
        }
      }
      if (route === "/api/health")
        return send(res, 200, {
          ok: true,
          service: "Before the Roar · Azure Intelligence",
          model: process.env.AZURE_OPENAI_DEPLOYMENT || null,
          ai_configured: !!process.env.AZURE_OPENAI_ENDPOINT,
          foundry_configured: !!process.env.FOUNDRY_PROJECT_ENDPOINT,
          foundry_model: process.env.FOUNDRY_MODEL || null,
          persistent_cache: !!process.env.AZURE_STORAGE_URL,
          allowance: dailyRequestLimit(),
          active_runs: [...runs.values()].filter((r) => !r.completed && !r.stopped)
            .length,
          active_run_subscribers: runSubscribers,
          rate_identity_count: rates.size,
          version: "3.29.1",
          git_revision: process.env.BTR_GIT_SHA || null,
          image_tag: process.env.BTR_IMAGE_TAG || null,
          evidence_review: true,
          usage: (await narrator.store?.allowance?.().catch(() => null)) ?? null,
          agent_tools: true,
          durable_checkpoints: true,
          production_proof: true,
          dataset_version: 2,
          external_broadcast: true,
          pitchside_video: true,
          film_duration: PITCHSIDE.duration,
          streaming: true,
          video_discussion: true,
          video_discussion_roles: DESK_ROLES.map((r) => r.id),
          perspectives: MODES,
        });
      if (
        [
          "/api/desk",
          "/api/match-desk",
          "/api/clip-desk",
          "/api/evidence-review",
          "/api/video-desk",
        ].includes(route) &&
        req.method === "POST"
      ) {
        if (
          origin &&
          !allowed.has(origin) &&
          origin !== `https://${req.headers.host}` &&
          origin !== `http://${req.headers.host}`
        )
          return send(res, 403, { error: "Origin not allowed" });
        if (deskStreams >= 6)
          return send(res, 429, {
            error: "The AI desk is busy. Try again shortly.",
          });
        const rateReservation = rates.reserve("desk:" + clientIdentity(req), 6);
        if (!rateReservation)
          return send(res, 429, {
            error: "Please wait before requesting another discussion.",
          });
        deskStreams++;
        let deskReleased = false;
        const releaseDesk = () => {
          if (deskReleased) return;
          deskReleased = true;
          deskStreams--;
        };
        const rejectDesk = (status, value) => {
          rateReservation.release();
          releaseDesk();
          return send(res, status, value);
        };
        req.once("aborted", () => {
          rateReservation.release();
          releaseDesk();
        });
        let body = "";
        for await (const c of req) {
          body += c;
          if (body.length > 2048) return rejectDesk(413, { error: "Request too large" });
        }
        let input;
        try {
          input = JSON.parse(body);
        } catch {
          return rejectDesk(400, { error: "Invalid JSON" });
        }
        const { language = "en", mode = "fan" } = input;
        if (!["en", "es", "pt"].includes(language) || !MODES.includes(mode))
          return rejectDesk(400, {
            error: "Choose a supported audience and language.",
          });
        let question;
        if (input.parentKey !== undefined && !/^[a-f0-9]{64}$/.test(input.parentKey))
          return rejectDesk(400, { error: "Invalid discussion reference" });
        try {
          question = normalizeQuestion(input.question);
        } catch (error) {
          return rejectDesk(400, { error: error.message });
        }
        if (
          route === "/api/match-desk" &&
          (!["wide", "press", "counter"].includes(input.scenario) ||
            !Number.isFinite(input.time) ||
            input.time < 0 ||
            input.time > 36 ||
            !Number.isInteger(input.focus) ||
            !["harbor", "north", "neutral"].includes(input.team) ||
            typeof input.corrected !== "boolean")
        )
          return rejectDesk(400, { error: "Invalid match session." });
        if (
          route === "/api/clip-desk" &&
          (input.clip_id !== PITCHSIDE.id ||
            !Number.isFinite(input.time) ||
            input.time < 0 ||
            input.time > PITCHSIDE.duration)
        )
          return rejectDesk(400, { error: "Invalid clip or evidence cutoff." });
        if (route === "/api/video-desk") {
          try {
            validateVideoInput(input);
          } catch {
            return rejectDesk(400, { error: "Invalid measured-video request" });
          }
        }
        if (route === "/api/evidence-review") {
          try {
            normalizeStudio(input);
            if (input.previous) {
              normalizeStudio(input.previous);
              if (input.previous.scenario !== input.scenario)
                throw Error("Different scenario");
            }
            if (input.intent && !["opening", "challenge", "math"].includes(input.intent))
              throw Error("Invalid intent");
          } catch {
            return rejectDesk(400, { error: "Invalid evidence snapshot" });
          }
        }
        rateReservation.commit();
        const controller = new AbortController();
        res.once("close", () => {
          controller.abort();
          releaseDesk();
        });
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          "X-Accel-Buffering": "no",
        });
        const emit = (type, data) => {
          if (res.destroyed) return;
          if (res.writableLength > 256000) {
            res.destroy();
            return;
          }
          res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
        };
        emit("connected", {
          source:
            route === "/api/evidence-review"
              ? "evidence-studio"
              : route === "/api/match-desk"
                ? "shared-match-session"
                : "reviewed-ai-video",
          discussion_scope: route === "/api/desk" ? "full-clip" : "evidence-cutoff",
          ...(route === "/api/clip-desk"
            ? { clip_id: input.clip_id, cutoff: input.time }
            : {}),
          language,
          mode,
        });
        try {
          if (route === "/api/video-desk") {
            await videoDesk.discuss(input, emit, { signal: controller.signal });
          } else if (route === "/api/evidence-review") {
            const result = await evidenceDesk.review(input, {
              signal: controller.signal,
            });
            emit("receipt", { ...result, posts: undefined });
            for (const post of result.posts) emit("post", post);
            emit("complete", {
              cached: result.cached,
              engine: result.engine,
              elapsed_ms: result.elapsed_ms,
            });
          } else if (route === "/api/clip-desk")
            await clipDesk.discuss(
              {
                time: input.time,
                clipChallenge: input.clipChallenge === true,
                language,
                mode,
                question,
                parentKey: input.parentKey,
              },
              emit,
              { signal: controller.signal },
            );
          else if (route === "/api/match-desk")
            await matchDesk.discuss({ ...input, language, mode, question }, emit, {
              signal: controller.signal,
            });
          else
            await desk.discuss({ language, mode, question }, emit, {
              signal: controller.signal,
            });
        } catch {
          emit("error", {
            message: "The discussion could not finish. Please retry.",
          });
        } finally {
          releaseDesk();
          if (!res.destroyed) res.end();
        }
        return;
      }
      if (route === "/api/runs" && req.method === "POST") {
        if (
          origin &&
          !allowed.has(origin) &&
          origin !== `https://${req.headers.host}` &&
          origin !== `http://${req.headers.host}`
        )
          return send(res, 403, { error: "Origin not allowed" });
        if (
          [...runs.values()].filter((r) => !r.completed && !r.stopped).length +
            pendingRuns >=
          6
        )
          return send(res, 429, {
            error: "The studio is busy. Try again in a minute.",
          });
        const rateReservation = rates.reserve("match:" + clientIdentity(req), 6);
        if (!rateReservation)
          return send(res, 429, {
            error: "Please wait before starting another match.",
          });
        pendingRuns++;
        let pendingReleased = false;
        const releasePending = () => {
          if (pendingReleased) return;
          pendingReleased = true;
          pendingRuns--;
        };
        const rejectRun = (status, value) => {
          rateReservation.release();
          releasePending();
          return send(res, status, value);
        };
        req.once("aborted", () => {
          rateReservation.release();
          releasePending();
        });
        let body = "";
        for await (const c of req) {
          body += c;
          if (body.length > 2048) return rejectRun(413, { error: "Request too large" });
        }
        let input;
        try {
          input = JSON.parse(body);
        } catch {
          return rejectRun(400, { error: "Invalid JSON" });
        }
        const { seed = 7, language = "en", speed = 90, audience = "fan" } = input;
        if (
          !Number.isInteger(seed) ||
          seed < 1 ||
          seed > 1000000 ||
          !["en", "es", "pt"].includes(language) ||
          ![30, 90].includes(speed) ||
          !MODES.includes(audience)
        )
          return rejectRun(400, {
            error: "Choose a supported seed, language, perspective and replay speed.",
          });
        rateReservation.commit();
        releasePending();
        created++;
        const id = randomBytes(12).toString("hex"),
          token = randomBytes(24).toString("hex"),
          match = generateMatch(seed);
        const run = {
          id,
          token,
          match,
          language,
          speed,
          audience,
          state: initialState(),
          cursor: 0,
          serial: 0,
          history: [],
          clients: new Set(),
          insights: [],
          created: clock(),
          started: null,
          nextCheckpoint: 900,
          current: 0,
          explanationQueue: Promise.resolve(),
        };
        runs.set(id, run);
        return send(res, 201, {
          id,
          token,
          match: {
            id: match.id,
            seed,
            duration: 5400,
            clubs: match.clubs,
            provenance: match.provenance,
          },
          speed,
          language,
        });
      }
      const found = route.match(/^\/api\/runs\/([a-f0-9]{24})\/(stream|export|stop)$/);
      if (found) {
        const run = runs.get(found[1]);
        if (!run)
          return send(res, 404, {
            error: "This match session expired. Start a new match.",
          });
        const provided = (req.headers.authorization || "").replace(/^Bearer /, "");
        if (
          !/^[a-f0-9]{48}$/.test(provided) ||
          !timingSafeEqual(Buffer.from(provided), Buffer.from(run.token))
        )
          return send(res, 403, { error: "Session authorization required" });
        if (found[2] === "stop" && req.method === "POST") {
          run.stopped = true;
          emit(run, "stopped", {});
          for (const c of run.clients) c.end();
          run.clients.clear();
          return send(res, 200, { stopped: true });
        }
        if (found[2] === "export" && req.method === "GET")
          return send(res, 200, {
            schema: "btr.match-export.v1",
            synthetic: true,
            provenance: run.match.provenance,
            match_id: run.match.id,
            seed: run.match.seed,
            language: run.language,
            cutoff: run.current,
            complete: !!run.completed,
            events: run.state.events,
            stats: snapshot(run.state, run.current),
            insights: run.insights,
            overlay: run.insights.at(-1)
              ? {
                  schema: "btr.overlay.v1",
                  start_match_second: run.insights.at(-1).cutoff,
                  expires_match_second: run.insights.at(-1).recap
                    ? null
                    : Math.min(5400, run.insights.at(-1).cutoff + 900),
                  display_duration_ms: 12000,
                  audiences: run.insights.at(-1).audiences,
                }
              : null,
          });
        if (found[2] === "stream" && req.method === "GET") {
          if (run.clients.size >= 3 || runSubscribers >= 12)
            return send(res, 429, { error: "Too many live match subscribers" });
          runSubscribers++;
          let subscriberReleased = false;
          const releaseSubscriber = () => {
            if (subscriberReleased) return;
            subscriberReleased = true;
            runSubscribers--;
            run.clients.delete(res);
            if (!run.clients.size) run.disconnected = clock();
          };
          res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
          });
          res.write(
            `event: connected\ndata: ${JSON.stringify({ match_id: run.match.id, language: run.language, speed: run.speed })}\n\n`,
          );
          for (const item of run.history)
            res.write(
              `id: ${item.id}\nevent: ${item.type}\ndata: ${JSON.stringify(item.data)}\n\n`,
            );
          if (run.completed || run.stopped) {
            releaseSubscriber();
            res.end();
            return;
          }
          run.clients.add(res);
          res.once("close", releaseSubscriber);
          return;
        }
        return send(res, 405, { error: "Method not allowed" });
      }
      if (route.startsWith("/api/")) return send(res, 404, { error: "Not found" });
      if (!["GET", "HEAD"].includes(req.method)) {
        res.writeHead(405).end();
        return;
      }
      const path = resolve(
        root,
        "." + decodeURIComponent(route).replace(/\/$/, "/index.html"),
      );
      if (!path.startsWith(root + sep)) {
        res.writeHead(403).end();
        return;
      }
      const info = await stat(path);
      if (!info.isFile()) {
        res.writeHead(404).end();
        return;
      }
      const headers = {
        "Content-Type": types[extname(path)] || "application/octet-stream",
        "Cache-Control": extname(path) === ".mp4" ? "public,max-age=86400" : "no-cache",
        "Accept-Ranges": "bytes",
      };
      const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
      let start = 0,
        end = info.size - 1,
        status = 200;
      if (range) {
        start = Number(range[1]);
        end = Math.min(end, range[2] ? Number(range[2]) : end);
        if (start > end) {
          res.writeHead(416, { "Content-Range": `bytes */${info.size}` }).end();
          return;
        }
        status = 206;
        headers["Content-Range"] = `bytes ${start}-${end}/${info.size}`;
      }
      res.writeHead(status, { ...headers, "Content-Length": end - start + 1 });
      if (req.method === "HEAD") res.end();
      else
        createReadStream(path, { start, end })
          .on("error", () => res.destroy())
          .pipe(res);
    } catch (error) {
      if (error.code === "ENOENT") return send(res, 404, { error: "Not found" });
      console.warn(JSON.stringify({ event: "request_error", message: error.message }));
      if (!res.headersSent)
        send(res, 500, {
          error: "The service could not complete this request.",
        });
      else res.end();
    }
  });
  server.on("close", () => {
    clearInterval(timer);
    broadcasts.close();
    for (const run of runs.values()) for (const c of run.clients) c.end();
  });
  return {
    server,
    runs,
    tick,
    broadcasts,
    limits: {
      get deskStreams() {
        return deskStreams;
      },
      get pendingRuns() {
        return pendingRuns;
      },
      get runSubscribers() {
        return runSubscribers;
      },
      get rateIdentities() {
        return rates.size;
      },
    },
  };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { server } = createApp();
  server.listen(Number(process.env.PORT || 4397), "0.0.0.0", () =>
    console.log(`BTR intelligence listening on ${process.env.PORT || 4397}`),
  );
}
