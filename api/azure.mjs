// Managed-identity model access, persistent cached narratives and atomic daily request reservations.
import { createHash } from "node:crypto";
import { MODES, learningObservation } from "../dist/learning.js";
import { readCompletion, draftInterpretations } from "./streaming.mjs";
const tokenCache = new Map();
export async function accessToken(resource) {
  if (process.env.AZURE_ACCESS_TOKEN && resource.includes("cognitiveservices"))
    return process.env.AZURE_ACCESS_TOKEN;
  const saved = tokenCache.get(resource);
  if (saved && saved.expires > Date.now() + 120000) return saved.value;
  if (!process.env.IDENTITY_ENDPOINT) throw Error("Managed identity unavailable");
  const url = new URL(process.env.IDENTITY_ENDPOINT);
  url.searchParams.set("api-version", "2019-08-01");
  url.searchParams.set("resource", resource);
  if (process.env.AZURE_CLIENT_ID)
    url.searchParams.set("client_id", process.env.AZURE_CLIENT_ID);
  const res = await fetch(url, {
    headers: { "X-IDENTITY-HEADER": process.env.IDENTITY_HEADER },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw Error(`Identity HTTP ${res.status}`);
  const t = await res.json();
  tokenCache.set(resource, {
    value: t.access_token,
    expires: Number(t.expires_on) * 1000,
  });
  return t.access_token;
}
// A date-bound ceiling expires at the UTC reset without a scheduled job or counter edits.
export function dailyRequestLimit(
  day = new Date().toISOString().slice(0, 10),
  env = process.env,
) {
  const normal = Number(env.AI_DAILY_LIMIT || 120),
    temporary = Number(env.AI_DAILY_LIMIT_OVERRIDE);
  return env.AI_DAILY_LIMIT_OVERRIDE_DATE === day &&
    Number.isSafeInteger(temporary) &&
    temporary >= normal
    ? temporary
    : normal;
}
export class ResultStore {
  constructor({ clock = () => Date.now() } = {}) {
    this.clock = clock;
    this.memory = new Map();
    this.base = process.env.AZURE_STORAGE_URL;
    this.used = 0;
    this.day = "";
  }
  async blob(path, options = {}) {
    return fetch(this.base + path, {
      ...options,
      headers: {
        Authorization: `Bearer ${await accessToken("https://storage.azure.com/")}`,
        "x-ms-version": "2023-11-03",
        ...options.headers,
      },
      signal: AbortSignal.timeout(8000),
    });
  }
  async read(key) {
    if (this.memory.has(key)) return this.memory.get(key);
    if (!this.base) return null;
    const r = await this.blob(`cache/${key}.json`);
    if (r.status === 404) return null;
    if (!r.ok) throw Error(`Cache HTTP ${r.status}`);
    const data = await r.json();
    this.remember(key, data);
    return data;
  }
  remember(key, value) {
    if (this.memory.size >= 512) this.memory.delete(this.memory.keys().next().value);
    this.memory.set(key, value);
  }
  async write(key, value) {
    if (this.base) {
      const r = await this.blob(`cache/${key}.json`, {
        method: "PUT",
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(value),
      });
      if (!r.ok) throw Error(`Cache write HTTP ${r.status}`);
    }
    this.remember(key, value);
  }
  async allowance() {
    const day = new Date(this.clock()).toISOString().slice(0, 10),
      limit = dailyRequestLimit(day);
    if (!this.base) return { day, limit, used: this.day === day ? this.used : 0 };
    const response = await this.blob(`budget/${day}.json`);
    if (response.status === 404) return { day, limit, used: 0 };
    if (!response.ok) throw Error("Allowance unavailable");
    return { day, limit, used: Number((await response.json()).calls) || 0 };
  }
  async reserve() {
    const day = new Date(this.clock()).toISOString().slice(0, 10),
      limit = dailyRequestLimit(day);
    if (!this.base) {
      if (this.day !== day) {
        this.day = day;
        this.used = 0;
      }
      if (this.used >= limit) return false;
      this.used++;
      return true;
    }
    // ETag compare-and-swap persists the request allowance across replicas/restarts.
    const path = `budget/${day}.json`;
    for (let retry = 0; retry < 5; retry++) {
      const r = await this.blob(path);
      if (r.status !== 404 && !r.ok) throw Error(`Budget read HTTP ${r.status}`);
      const old = r.ok ? await r.json() : { calls: 0 };
      if (old.calls >= limit) return false;
      const headers = {
        "x-ms-blob-type": "BlockBlob",
        "Content-Type": "application/json",
        ...(r.ok ? { "If-Match": r.headers.get("etag") } : { "If-None-Match": "*" }),
      };
      const w = await this.blob(path, {
        method: "PUT",
        headers,
        body: JSON.stringify({ day, calls: old.calls + 1, limit }),
      });
      if (w.ok) return true;
      // Concurrent creation of the new day's blob can return 409 instead of 412.
      // Re-read its counter and ETag; never overwrite or reset another reservation.
      if (w.status !== 412 && !(w.status === 409 && r.status === 404))
        throw Error(`Budget write HTTP ${w.status}`);
    }
    throw Error("Budget contention");
  }
}
const angle = {
  type: "object",
  additionalProperties: false,
  properties: {
    interpretation: { type: "string" },
    headline: { type: "string" },
    caution: { type: "string" },
    evidence_ids: { type: "array", items: { type: "string" } },
  },
  required: ["interpretation", "headline", "caution", "evidence_ids"],
};
export function narrativeSchema(packet) {
  const order = [
      packet.priority || "fan",
      ...MODES.filter((m) => m !== (packet.priority || "fan")),
    ],
    ids = packet.facts.map((f) => f.id);
  const bounded = {
    type: "object",
    additionalProperties: false,
    properties: {},
    required: order,
  };
  for (const mode of order) {
    bounded.properties[mode] = structuredClone(angle);
    bounded.properties[mode].properties.evidence_ids = {
      type: "object",
      additionalProperties: false,
      properties: {
        primary: { type: "string", enum: ids },
        secondary: { type: ["string", "null"], enum: [...ids, null] },
      },
      required: ["primary", "secondary"],
    };
  }
  return bounded;
}
export function normalizeCitations(value) {
  return Object.fromEntries(
    MODES.map((mode) => {
      const a = value[mode];
      return [
        mode,
        {
          ...a,
          evidence_ids: [a?.evidence_ids?.primary, a?.evidence_ids?.secondary].filter(
            (x) => x !== null && x !== undefined,
          ),
        },
      ];
    }),
  );
}
export function validateNarrative(value, packet) {
  const ids = new Set(packet.facts.map((f) => f.id));
  for (const mode of MODES) {
    const a = value?.[mode];
    if (!a) throw Error("Missing audience");
    for (const field of ["headline", "interpretation", "caution"])
      if (
        typeof a[field] !== "string" ||
        !a[field].trim() ||
        a[field].length > 900 ||
        /\d/.test(a[field])
      )
        throw Error("Invalid narrative text");
    if (
      !Array.isArray(a.evidence_ids) ||
      !a.evidence_ids.length ||
      a.evidence_ids.length > 6 ||
      a.evidence_ids.some((id) => !ids.has(id))
    )
      throw Error("Unsupported citation");
  }
  return value;
}
export function fallback(packet, reason = "model_unavailable") {
  const es = packet.language === "es",
    pt = packet.language === "pt";
  const headline =
    packet.phase === "fulltime"
      ? es
        ? "El partido, en datos"
        : pt
          ? "O jogo em dados"
          : "The match, in evidence"
      : es
        ? "La evidencia sigue llegando"
        : pt
          ? "A evidência continua chegando"
          : "The evidence keeps coming";
  const a = {
    headline,
    explanation: es
      ? "Las estadísticas y el registro de eventos siguen disponibles. No hay un análisis generado por IA para este momento."
      : pt
        ? "As estatísticas e o registro de eventos continuam disponíveis. Não há análise gerada por IA para este momento."
        : "The statistics and event ledger remain available. An AI explanation is not available for this moment.",
    interpretation: es
      ? "Consulta los eventos antes de sacar conclusiones tácticas."
      : pt
        ? "Consulte os eventos antes de tirar conclusões táticas."
        : "Inspect the events before drawing a tactical conclusion.",
    caution: es
      ? "Simulación sintética. Respaldo determinista."
      : pt
        ? "Simulação sintética. Resposta determinística."
        : "Synthetic simulation. Deterministic fallback.",
    evidence_ids: ["score", "shots"],
  };
  return {
    audiences: Object.fromEntries(
      MODES.map((mode) => [
        mode,
        {
          ...a,
          explanation: ["beginner", "math"].includes(mode)
            ? learningObservation(mode, packet.stats, packet.language)
            : a.explanation,
        },
      ]),
    ),
    engine: "deterministic_fallback",
    reason,
    model: null,
    usage: null,
    latency_ms: 0,
    cached: false,
  };
}
export function presentNarrative(value, packet) {
  if (value.engine !== "azure_openai") return value;
  const s = packet.stats,
    es = packet.language === "es",
    pt = packet.language === "pt";
  const phase =
    packet.phase === "fulltime"
      ? es
        ? "Resultado final"
        : pt
          ? "Resultado final"
          : "Full time"
      : es
        ? "En este momento"
        : pt
          ? "Neste momento"
          : "At this checkpoint";
  const observations = {
    fan: `${phase}: Harbor FC ${s.score.home} – ${s.score.away} Northbridge. ${es ? "Tiros" : pt ? "Finalizações" : "Shots"}: ${s.shots.home} / ${s.shots.away}. ${es ? "Posesión calculada" : pt ? "Posse calculada" : "Calculated possession"}: ${s.possession.home}% / ${s.possession.away}%.`,
    analyst: es
      ? `Harbor completó ${s.completed.home} de ${s.passes.home} pases (${s.completion.home}%); Northbridge, ${s.completed.away} de ${s.passes.away} (${s.completion.away}%). Eventos de presión: ${s.pressures.home} / ${s.pressures.away}. Recuperaciones en los últimos cinco minutos: ${s.recentRecoveries}.`
      : pt
        ? `Harbor completou ${s.completed.home} de ${s.passes.home} passes (${s.completion.home}%); Northbridge, ${s.completed.away} de ${s.passes.away} (${s.completion.away}%). Eventos de pressão: ${s.pressures.home} / ${s.pressures.away}. Recuperações nos últimos cinco minutos: ${s.recentRecoveries}.`
        : `Harbor completed ${s.completed.home} of ${s.passes.home} passes (${s.completion.home}%); Northbridge completed ${s.completed.away} of ${s.passes.away} (${s.completion.away}%). Pressure events: ${s.pressures.home} / ${s.pressures.away}. Recoveries in the last five minutes: ${s.recentRecoveries}.`,
    player: es
      ? `Mateo Silva: ${s.focus.completed} de ${s.focus.passes} pases completados, ${s.focus.shots} tiros y ${s.focus.pressures} eventos de presión. No hay datos sobre sus movimientos sin balón.`
      : pt
        ? `Mateo Silva: ${s.focus.completed} de ${s.focus.passes} passes completos, ${s.focus.shots} finalizações e ${s.focus.pressures} eventos de pressão. Não há dados sobre seus movimentos sem a bola.`
        : `Mateo Silva: ${s.focus.completed} of ${s.focus.passes} passes completed, ${s.focus.shots} shots and ${s.focus.pressures} pressure events. Off-ball movement is not measured.`,
  };
  observations.beginner = learningObservation("beginner", s, packet.language);
  observations.math = learningObservation("math", s, packet.language);
  const required = {
    fan: ["score", "shots", "possession"],
    analyst: ["passes", "completion", "pressure", "rhythm"],
    player: ["focus"],
    beginner: ["score"],
    math: ["passes", "completion"],
  };
  const audiences = Object.fromEntries(
    MODES.map((mode) => [
      mode,
      {
        ...value.audiences[mode],
        explanation: observations[mode],
        evidence_ids: [
          ...new Set([...required[mode], ...value.audiences[mode].evidence_ids]),
        ],
        observation_source: "calculated",
        interpretation_source: "azure_openai",
      },
    ]),
  );
  return {
    ...value,
    audiences,
    checks: ["model_schema", "bounded_model_citations", "calculated_observations"],
  };
}
export class Narrator {
  constructor(store = new ResultStore(), { token = accessToken } = {}) {
    this.store = store;
    this.token = token;
    this.pending = new Map();
    this.busy = 0;
    this.calls = 0;
    this.cacheHits = 0;
    this.failures = 0;
  }
  async explain(packet, onDraft = () => {}) {
    const key = createHash("sha256")
      .update(
        JSON.stringify({
          version: "btr-stream-v1",
          model: process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o-mini",
          packet,
        }),
      )
      .digest("hex");
    if (this.pending.has(key)) {
      const job = this.pending.get(key);
      job.listeners.add(onDraft);
      for (const draft of job.latest.values()) onDraft(draft);
      try {
        return presentNarrative(await job.promise, packet);
      } finally {
        job.listeners.delete(onDraft);
      }
    }
    const job = { listeners: new Set([onDraft]), latest: new Map() };
    this.pending.set(key, job);
    job.promise = this.generate(key, packet, (draft) => {
      job.latest.set(draft.mode, draft);
      for (const listener of job.listeners) {
        try {
          listener(draft);
        } catch {}
      }
    });
    try {
      return presentNarrative(await job.promise, packet);
    } finally {
      this.pending.delete(key);
    }
  }
  async generate(key, packet, onDraft) {
    const started = performance.now();
    try {
      const cached = await this.store.read(key);
      if (cached) {
        validateNarrative(cached.audiences, packet);
        this.cacheHits++;
        return {
          ...cached,
          cached: true,
          latency_ms: Math.round(performance.now() - started),
        };
      }
      if (!process.env.AZURE_OPENAI_ENDPOINT) return fallback(packet, "not_configured");
      if (this.busy >= 2) return fallback(packet, "capacity");
      this.busy++;
      try {
        const token = await this.token("https://cognitiveservices.azure.com/");
        if (!(await this.store.reserve())) return fallback(packet, "daily_allowance");
        const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o-mini";
        const url = new URL(
          `openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=2024-10-21`,
          process.env.AZURE_OPENAI_ENDPOINT,
        );
        const language = {
          en: "English",
          es: "Spanish",
          pt: "Brazilian Portuguese",
        }[packet.language];
        const system = `You are BTR's football explainer. Write five DISTINCT perspectives in ${language}, in schema order. Start with ${packet.priority || "fan"}. fan: why this phase matters. beginner: explain it to someone who has never watched football, define any term you use, use a simple everyday analogy, no unexplained jargon. math: explain what a pass-success percentage measures, its denominator and why accuracy alone does not prove attacking quality; do not calculate, the app renders exact formulas. analyst: one tentative tactical mechanism and competing explanation. player: Mateo Silva only, recorded contributions versus unknown off-ball activity. Use ONLY supplied evidence at the cutoff. ${packet.phase === "fulltime" ? "This is the full-time recap." : "This phase is still in play; do not predict the result."} For each mode, output interpretation FIRST (one or two short sentences, at most fifty words), then a short headline, one specific caution, and evidence_ids with a required primary fact ID and a secondary fact ID or null. For math cite passes or completion; for beginner cite score or a concrete event. Never omit the primary fact. Hypotheses must use may/could or their translation. Facts and math are calculated separately; do not repeat numerical statistics. Pressure has no success field. Never infer feelings, assigned roles, formations, physicality, off-ball movement or future results. NO DIGITS anywhere in prose. Do not spell out numerical statistics. Return the required JSON only.`;
        this.calls++;
        const r = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              { role: "system", content: system },
              { role: "user", content: JSON.stringify(packet) },
            ],
            temperature: 0.25,
            max_tokens: 1800,
            stream: true,
            stream_options: { include_usage: true },
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "match_intelligence",
                strict: true,
                schema: narrativeSchema(packet),
              },
            },
          }),
          signal: AbortSignal.timeout(30000),
        });
        if (!r.ok) throw Error(`Model HTTP ${r.status}`);
        let firstText = null;
        const emitted = new Map();
        const result = await readCompletion(r.body, (content) => {
          for (const [mode, text] of Object.entries(
            draftInterpretations(content, MODES),
          )) {
            if (text && text !== emitted.get(mode)) {
              firstText ??= Math.round(performance.now() - started);
              emitted.set(mode, text);
              onDraft({ mode, text, draft: true, first_text_ms: firstText });
            }
          }
        });
        const audiences = validateNarrative(
          normalizeCitations(JSON.parse(result.content)),
          packet,
        );
        const value = {
          audiences,
          engine: "azure_openai",
          model: deployment,
          usage: result.usage,
          first_text_ms: firstText,
          latency_ms: Math.round(performance.now() - started),
          cached: false,
          checks: ["schema", "bounded_citations", "no_numeric_prose"],
          generated_at: new Date().toISOString(),
        };
        try {
          await this.store.write(key, value);
        } catch (error) {
          console.warn(
            JSON.stringify({
              event: "cache_write_failed",
              message: error.message,
            }),
          );
        }
        return value;
      } finally {
        this.busy--;
      }
    } catch (error) {
      this.failures++;
      console.warn(
        JSON.stringify({ event: "narrative_fallback", message: error.message }),
      );
      return fallback(packet, "generation_failed");
    }
  }
}
