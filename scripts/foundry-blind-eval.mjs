// Blinded, project-scoped Foundry review of the recorded crew-versus-baseline trial.
// This is a model evaluation, not an independent human preference result.
import { readFile, writeFile } from "node:fs/promises";

const endpoint = process.env.FOUNDRY_PROJECT_ENDPOINT;
const token = process.env.FOUNDRY_ACCESS_TOKEN;
if (!endpoint || !token) throw Error("Set FOUNDRY_PROJECT_ENDPOINT and FOUNDRY_ACCESS_TOKEN");

const trial = JSON.parse(await readFile(new URL("../docs/proof/heldout-commentary.json", import.meta.url), "utf8"));
const key = {};
const cases = trial.cases.map((item, index) => {
  const crew = Object.values(item.crew.posts).map((post) => post.text),
    baseline = Object.values(item.baseline.posts).map((post) => post.text),
    reversed = index % 2 === 1;
  key[item.input.id] = reversed ? { A: "baseline", B: "crew" } : { A: "crew", B: "baseline" };
  return {
    case_id: item.input.id,
    event: item.input.event,
    question: item.input.question,
    A: reversed ? baseline : crew,
    B: reversed ? crew : baseline,
  };
});

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    cases: {
      type: "array",
      minItems: cases.length,
      maxItems: cases.length,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          case_id: { type: "string", enum: cases.map((item) => item.case_id) },
          grounding: { type: "string", enum: ["A", "B", "tie"] },
          usefulness: { type: "string", enum: ["A", "B", "tie"] },
          role_distinction: { type: "string", enum: ["A", "B", "tie"] },
          reason: { type: "string", maxLength: 320 },
        },
        required: ["case_id", "grounding", "usefulness", "role_distinction", "reason"],
      },
    },
    overall_limit: { type: "string", maxLength: 500 },
  },
  required: ["cases", "overall_limit"],
};

const response = await fetch(endpoint.replace(/\/$/, "") + "/openai/v1/responses", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  signal: AbortSignal.timeout(60000),
  body: JSON.stringify({
    model: process.env.FOUNDRY_MODEL || "texasgpt-prod",
    instructions:
      "Act as a blinded football-commentary evaluator. Use only the supplied synthetic event, question and two anonymous three-line answers. For each case choose A, B or tie for: grounding in the event without adding facts; usefulness to the viewer; and whether the three lines make distinct contributions rather than repeating. Do not infer which system produced an answer. Concision is not automatically better. State one short evidence-based reason.",
    input: JSON.stringify(cases),
    text: { format: { type: "json_schema", name: "btr_blind_evaluation", strict: true, schema } },
  }),
});
if (!response.ok) throw Error(`Foundry evaluation HTTP ${response.status}: ${await response.text()}`);
const body = await response.json();
const text = body.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text;
if (!text) throw Error("Foundry evaluation returned no output text");
const evaluated = JSON.parse(text), metrics = {};
for (const metric of ["grounding", "usefulness", "role_distinction"])
  metrics[metric] = { crew: 0, baseline: 0, tie: 0 };
const results = evaluated.cases.map((result) => {
  const decoded = { case_id: result.case_id, reason: result.reason };
  for (const metric of Object.keys(metrics)) {
    const winner = result[metric] === "tie" ? "tie" : key[result.case_id][result[metric]];
    decoded[metric] = winner;
    metrics[metric][winner]++;
  }
  return decoded;
});
const artifact = {
  schema: "btr.foundry-blind-evaluation.v1",
  created_at: new Date().toISOString(),
  source_trial: "docs/proof/heldout-commentary.json",
  cases: cases.length,
  project: "before-the-roar",
  endpoint_kind: "Microsoft Foundry project Responses API",
  deployment: process.env.FOUNDRY_MODEL || "texasgpt-prod",
  response_id: body.id,
  usage: body.usage || null,
  blind_order: "Alternating A/B assignment; arm identity decoded only after the response",
  metrics,
  results,
  evaluator_limit: evaluated.overall_limit,
  evidence_limit:
    "One model-judge pass over recorded synthetic cases. This supplements automated checks; it is not an independent human study or proof of general superiority.",
  runtime_referee: {
    purpose: "Second-line review of completed public agent work",
    scores: ["grounding", "correction_sensitivity", "audience_value"],
    release_authority: "BTR deterministic evidence gate",
    privacy_boundary: "Public posts, citations and deterministic claim status only",
  },
};
await writeFile(new URL("../dist/assets/foundry-evaluation.json", import.meta.url), JSON.stringify(artifact, null, 2) + "\n");
await writeFile(new URL("../docs/proof/foundry-evaluation.json", import.meta.url), JSON.stringify(artifact, null, 2) + "\n");
console.log(JSON.stringify({ response_id: body.id, metrics, usage: body.usage }, null, 2));
