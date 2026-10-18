// A project-scoped Microsoft Foundry referee for completed public agent work.
// This is an independent model pass over public receipts, not private reasoning.
import { accessToken } from "./azure.mjs";

const verdictSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    verdict: { type: "string", enum: ["release", "hold", "review"] },
    grounding_score: { type: "integer", minimum: 0, maximum: 100 },
    correction_sensitivity_score: { type: "integer", minimum: 0, maximum: 100 },
    audience_value_score: { type: "integer", minimum: 0, maximum: 100 },
    changed_claim_ids: { type: "array", items: { type: "string" }, maxItems: 12 },
    preserved_fact_ids: { type: "array", items: { type: "string" }, maxItems: 12 },
    summary: { type: "string", maxLength: 500 },
    limitation: { type: "string", maxLength: 500 },
  },
  required: [
    "verdict",
    "grounding_score",
    "correction_sensitivity_score",
    "audience_value_score",
    "changed_claim_ids",
    "preserved_fact_ids",
    "summary",
    "limitation",
  ],
};

export function refereeInput({ input, workflow, previous }) {
  const posts = Object.values(workflow?.posts || {}).map((post) => ({
    role: post.role,
    text: post.summary,
    caution: post.caution || null,
    evidence_ids: post.evidence_ids || [],
    engine: post.engine,
  }));
  return {
    source: input.source,
    scenario: input.scenario,
    revision: input.corrected ? 2 : 1,
    audience: { language: input.language, mode: input.mode },
    deterministic_claim: workflow?.claim || null,
    public_posts: posts,
    previous_revision: previous
      ? {
          status: previous.status,
          claim: previous.claim || null,
          public_posts: Object.values(previous.posts || {}).map((post) => ({
            role: post.role,
            text: post.summary,
            evidence_ids: post.evidence_ids || [],
          })),
        }
      : null,
  };
}

export function parseFoundryResponse(body) {
  const text = body?.output
    ?.flatMap((item) => item.content || [])
    .find((item) => item.type === "output_text")?.text;
  if (!text) throw Error("Foundry referee returned no structured text");
  const value = JSON.parse(text);
  if (!verdictSchema.properties.verdict.enum.includes(value.verdict))
    throw Error("Foundry referee returned an invalid verdict");
  for (const key of [
    "grounding_score",
    "correction_sensitivity_score",
    "audience_value_score",
  ])
    if (!Number.isInteger(value[key]) || value[key] < 0 || value[key] > 100)
      throw Error("Foundry referee returned an invalid score");
  for (const key of ["changed_claim_ids", "preserved_fact_ids"])
    if (!Array.isArray(value[key]) || value[key].some((item) => typeof item !== "string"))
      throw Error("Foundry referee returned invalid evidence identifiers");
  if (!value.summary?.trim() || !value.limitation?.trim())
    throw Error("Foundry referee omitted its explanation boundary");
  return value;
}

export class FoundryReferee {
  constructor(
    narrator,
    {
      request = fetch,
      token = () => accessToken("https://ai.azure.com/"),
      clock = () => Date.now(),
    } = {},
  ) {
    this.store = narrator.store || {};
    this.request = request;
    this.token = token;
    this.clock = clock;
  }

  async evaluate(context) {
    const endpoint = process.env.FOUNDRY_PROJECT_ENDPOINT;
    if (!endpoint)
      return {
        status: "not_configured",
        engine: "deterministic_gate_only",
        limitation: "The deterministic evidence gate remains authoritative.",
      };
    if (this.store.reserve && !(await this.store.reserve()))
      return {
        status: "allowance_reached",
        engine: "deterministic_gate_only",
        limitation: "No Foundry request was made; the saved deterministic verdict remains available.",
      };
    const began = this.clock();
    const response = await this.request(
      endpoint.replace(/\/$/, "") + "/openai/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await this.token()}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(30000),
        body: JSON.stringify({
          model: process.env.FOUNDRY_MODEL || "texasgpt-prod",
          instructions:
            "You are BTR's independent evidence referee. Inspect only the supplied public posts, citations and deterministic claim record. Score whether the public story stays inside those records, whether a source revision changes only dependent claims, and whether the selected audience receives useful football meaning. Do not infer unseen football action. A release verdict means the model review found no unsupported public claim; BTR's deterministic gate remains final authority.",
          input: JSON.stringify(refereeInput(context)),
          text: {
            format: {
              type: "json_schema",
              name: "btr_evidence_referee",
              strict: true,
              schema: verdictSchema,
            },
          },
        }),
      },
    );
    if (!response.ok) throw Error(`Foundry referee HTTP ${response.status}`);
    const body = await response.json(),
      verdict = parseFoundryResponse(body);
    return {
      status: "completed",
      engine: "microsoft_foundry_responses",
      project: "before-the-roar",
      model: process.env.FOUNDRY_MODEL || "texasgpt-prod",
      response_id: body.id,
      latency_ms: Math.max(0, this.clock() - began),
      usage: body.usage || null,
      authority: "advisory_second_line; deterministic_evidence_gate_is_final",
      ...verdict,
    };
  }
}
