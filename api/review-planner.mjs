import { accessToken } from "./azure.mjs";
import { combinedSignal } from "./request-guard.mjs";
export const PLAN_POLICY = "evidence-plan-v62.2";
export const planSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    tool: {
      type: "string",
      enum: ["source_delta", "pass_progression", "latest_outcome"],
    },
    evidence_ids: { type: "array", items: { type: "string" } },
    uncertainty: {
      type: "string",
      enum: ["causation_unproven", "tracking_missing", "outcome_pending"],
    },
    next_question: {
      type: "string",
      enum: ["defensive_shape", "next_event", "pass_route"],
    },
  },
  required: ["tool", "evidence_ids", "uncertainty", "next_question"],
};
export function schemaForPacket(packet) {
  const schema = structuredClone(planSchema),
    records = packet.current.records,
    tracking = packet.current.snapshot.tracking;
  schema.properties.tool.enum = [
    "source_delta",
    ...(records.some(
      (r) => r.type === "pass" && r.team === "harbor" && r.outcome === "complete",
    )
      ? ["pass_progression"]
      : []),
    ...(records.some((r) => r.type === "shot" || r.outcome === "intercepted")
      ? ["latest_outcome"]
      : []),
  ];
  schema.properties.evidence_ids.minItems = 1;
  schema.properties.evidence_ids.items.enum = records.map((r) => r.id);
  schema.properties.uncertainty.enum = tracking
    ? ["causation_unproven"]
    : ["tracking_missing"];
  schema.properties.next_question.enum = tracking
    ? ["defensive_shape", "next_event", "pass_route"]
    : ["next_event", "pass_route"];
  return schema;
}
export function verifyPlan(plan, packet) {
  const errors = [],
    records = packet.current.records,
    ids = new Set(records.map((r) => r.id));
  if (!["source_delta", "pass_progression", "latest_outcome"].includes(plan?.tool))
    errors.push("Unknown evidence tool");
  if (
    !Array.isArray(plan?.evidence_ids) ||
    !plan.evidence_ids.length ||
    plan.evidence_ids.some((id) => !ids.has(id))
  )
    errors.push("Citation outside current snapshot");
  if (
    !["causation_unproven", "tracking_missing", "outcome_pending"].includes(
      plan?.uncertainty,
    )
  )
    errors.push("Unknown uncertainty");
  if (!["defensive_shape", "next_event", "pass_route"].includes(plan?.next_question))
    errors.push("Unknown next question");
  if (plan?.uncertainty === "tracking_missing" && packet.current.snapshot.tracking)
    errors.push("Tracking is available");
  if (plan?.uncertainty === "outcome_pending" && records.some((r) => r.type === "shot"))
    errors.push("Shot outcome is already recorded");
  if (!packet.current.snapshot.tracking && plan?.next_question === "defensive_shape")
    errors.push("Missing tracking cannot support defensive-shape inspection");
  if (
    plan?.tool === "latest_outcome" &&
    !records.some((r) => r.type === "shot" || r.outcome === "intercepted")
  )
    errors.push("No completed shot or interception");
  if (
    plan?.tool === "pass_progression" &&
    !records.some(
      (r) => r.type === "pass" && r.outcome === "complete" && r.team === "harbor",
    )
  )
    errors.push("No completed Harbor pass");
  const cited = records.filter((r) => plan?.evidence_ids?.includes(r.id));
  if (
    plan?.tool === "pass_progression" &&
    !cited.some(
      (r) => r.type === "pass" && r.team === "harbor" && r.outcome === "complete",
    )
  )
    errors.push("Calculation has no cited input");
  if (
    plan?.tool === "latest_outcome" &&
    !cited.some((r) => r.type === "shot" || r.outcome === "intercepted")
  )
    errors.push("Outcome has no cited input");
  return { accepted: !errors.length, errors };
}
export async function proposePlan(packet, { baseline = false, token, signal } = {}) {
  const system = baseline
    ? "Choose one useful next analysis tool and cite current evidence. Return the schema."
    : `You are BTR's bounded evidence analyst. Use only the supplied current records; previous records are for comparison, never current evidence. Propose a useful next analysis using an executable tool. For challenge requests prioritize source_delta, for math requests prioritize pass_progression if a completed Harbor pass exists. For opening requests use latest_outcome if a completed shot/interception exists, otherwise pass_progression if possible, else source_delta. Cite the actual records needed by your tool, not merely the scope record. Never select a tool requiring missing data. The current.snapshot.tracking boolean is authoritative. A corrected record with equal start and position coordinates means KNOWN ZERO MOVEMENT, never missing tracking. If current.snapshot.tracking is true you MUST NOT use tracking_missing; use causation_unproven. Only if current.snapshot.tracking is false use tracking_missing and avoid defensive_shape. If a shot result is recorded do not mark outcome_pending. Otherwise use causation_unproven: sequence is not proof of cause. Choose a next question that advances the investigation: defensive_shape when tracking exists, pass_route for available passes, next_event otherwise. Public language will be rendered only from verified tools. Do not invent a free-text claim.`;
  const response = await fetch(
    new URL(
      `openai/deployments/${encodeURIComponent(process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o-mini")}/chat/completions?api-version=2024-10-21`,
      process.env.AZURE_OPENAI_ENDPOINT,
    ),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token || (await accessToken("https://cognitiveservices.azure.com/"))}`,
        "Content-Type": "application/json",
      },
      signal: combinedSignal(signal, 25000),
      body: JSON.stringify({
        messages: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify(packet) },
        ],
        temperature: 0,
        max_tokens: 450,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "evidence_plan",
            strict: true,
            schema: schemaForPacket(packet),
          },
        },
      }),
    },
  );
  if (!response.ok) throw Error("AI planning HTTP " + response.status);
  const body = await response.json();
  return { plan: JSON.parse(body.choices[0].message.content), usage: body.usage };
}
