// Capability-protected production sessions, source revisions and independent output authority.
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { AgentState } from "./agent-state.mjs";
import { MatchDesk } from "./match-desk.mjs";
import { broadcastInput, broadcastCue } from "./broadcast.mjs";
import { matchStory, localPanel } from "../dist/match-story.js";
import { pitchsideStory, pitchsidePanel } from "../dist/pitchside-story.js";
import { claimRecord } from "./agent-tools.mjs";
const hash = (s) => createHash("sha256").update(s).digest("hex");
const claims = (input) => {
  const packet = input.source === "pitchside" ? pitchsideStory(input) : matchStory(input);
  return claimRecord(
    packet,
    input.source === "pitchside" ? pitchsidePanel(packet) : localPanel(packet),
  );
};
export class ProductionDesk {
  constructor(
    narrator,
    { state = new AgentState(narrator.store || {}), clock = () => Date.now() } = {},
  ) {
    this.narrator = narrator;
    this.state = state;
    this.clock = clock;
    this.active = new Set();
  }
  async create(input) {
    const normalized = broadcastInput(input),
      id = randomBytes(12).toString("hex"),
      token = randomBytes(24).toString("hex"),
      readKey = randomBytes(24).toString("hex"),
      now = this.clock();
    await this.state.write("production-" + id, {
      schema: "btr.production.v1",
      id,
      created_at: now,
      expires_at: now + 30 * 60e3,
      token_hash: hash(token),
      reader_hash: hash(readKey),
      input: normalized,
      generation: 1,
      interrupt: input.interrupt === true,
      ledger: [{ at: now, action: "reading_recorded", ...claims(normalized) }],
    });
    return { id, token, readKey, expires_at: now + 30 * 60e3 };
  }
  async authorized(id, token, readOnly = false) {
    if (!/^[a-f0-9]{24}$/.test(id) || !/^[a-f0-9]{48}$/.test(token))
      throw Error("Production authorization required");
    const record = await this.state.read("production-" + id);
    if (!record || record.value.expires_at < this.clock())
      throw Error("Production run expired");
    const expected = readOnly ? record.value.reader_hash : record.value.token_hash;
    if (!timingSafeEqual(Buffer.from(hash(token)), Buffer.from(expected)))
      throw Error("Production authorization required");
    return record;
  }
  workKey(value) {
    return `work-${value.id}-${value.generation}`;
  }
  async export(record) {
    const v = record.value,
      work = await this.state.read(this.workKey(v));
    return {
      schema: v.schema,
      id: v.id,
      input: v.input,
      generation: v.generation,
      expires_at: v.expires_at,
      ledger: v.ledger,
      previous_runs: v.previous_runs || [],
      workflow: work?.value || null,
      storage: this.state.store.base ? "Azure Blob Storage" : "local atomic files",
      limits: [
        "Model prose is not independently semantically verified.",
        "Fault injection stops this editorial worker, not the entire Azure service.",
        "Video playback and event calculations do not depend on this worker.",
      ],
    };
  }
  async revise(record, change) {
    const v = record.value;
    if (this.active.has(v.id))
      throw Error("Wait for this worker to stop before changing its evidence");
    const input = { ...v.input };
    if (change.action === "correct") {
      if (input.source === "pitchside") input.clipChallenge = !input.clipChallenge;
      else {
        if (input.scenario !== "wide")
          throw Error("The alternate tracking record belongs to The unseen run");
        input.corrected = !input.corrected;
      }
    } else if (change.action === "personalize") {
      input.language = change.language;
      input.mode = change.mode;
    } else throw Error("Unknown production action");
    broadcastInput(input);
    if (v.generation >= 20) throw Error("Start a new proof run after twenty revisions");
    const old = await this.state.read(this.workKey(v)),
      previous_runs = [...(v.previous_runs || [])];
    if (old)
      previous_runs.push({
        generation: v.generation,
        input: v.input,
        status: old.value.status,
        metrics: old.value.metrics,
        trace: old.value.trace,
        posts: old.value.posts,
      });
    return this.state.write(
      "production-" + v.id,
      {
        ...v,
        input,
        generation: v.generation + 1,
        interrupt: false,
        previous_runs,
        ledger: [
          ...v.ledger,
          {
            at: this.clock(),
            action: change.action === "correct" ? "source_revised" : "audience_changed",
            ...claims(input),
          },
        ].slice(-40),
      },
      record.etag,
    );
  }
  async run(record, emit) {
    const v = record.value;
    if (this.active.has(v.id)) throw Error("This worker is already running");
    this.active.add(v.id);
    // A fresh worker every time: resume depends on persisted state, not a retained closure.
    try {
      const worker = new MatchDesk(this.narrator, {
        clip: v.input.source === "pitchside",
        state: this.state,
      });
      await worker.discuss(v.input, emit, {
        key: this.workKey(v),
        interruptAfterSpecialists: v.interrupt,
      });
    } catch (e) {
      if (e.code === "CHECKPOINT_INTERRUPTED") emit("paused", { message: e.message });
      else throw e;
    } finally {
      this.active.delete(v.id);
    }
  }
  cue(record) {
    const v = record.value;
    return {
      ...broadcastCue(v.input, this.clock(), this.clock()),
      production_id: v.id,
      generation: v.generation,
      claim_status: v.ledger.at(-1).status,
      origin: "deterministic_evidence_gate",
    };
  }
}
