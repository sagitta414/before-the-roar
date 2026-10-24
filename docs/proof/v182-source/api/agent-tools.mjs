// Bounded evidence and calculation tools; caller-supplied URLs and source selectors are rejected.
// Public tool receipts describe bounded operations, never hidden model reasoning.
export const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "read_evidence",
      description:
        "Retrieve the source records available at this exact cutoff and revision.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate_football",
      description:
        "Retrieve the deterministic football calculation with working and source IDs. No arithmetic is delegated to the language model.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "review_public_claims",
      description:
        "Inspect earlier public contributions and the deterministic evidence verdict before synthesizing a broadcast line.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
];
export function executeAgentTool(name, args, { packet, notes, evidence, previous = [] }) {
  if (
    !args ||
    typeof args !== "object" ||
    Array.isArray(args) ||
    Object.keys(args).length
  )
    throw Error("Tool accepts no untrusted selectors or external URLs");
  const scope = {
    cutoff: packet.cutoff,
    revision: packet.revision,
    source: packet.synthetic ? "synthetic_events" : "reviewed_film_annotations",
  };
  if (name === "read_evidence")
    return {
      ...scope,
      records: evidence,
      definition: packet.guideDefinition,
      limit: packet.synthetic
        ? "Recorded movement and event order do not establish why a defender acted. No intent or technique is measured."
        : "Only these reviewed annotations are available. An annotation is not automatic video detection.",
    };
  if (name === "calculate_football")
    return {
      ...scope,
      calculation: notes.find((p) => p.role === "math"),
      limit:
        "Deterministic source calculation, not calibrated xG or inferred physical speed.",
    };
  if (name === "review_public_claims")
    return {
      ...scope,
      contributions: previous,
      review: notes.find((p) => p.role === "reviewer"),
      limit:
        "Citation, revision and declared source checks. No independent semantic fact-check of freeform text.",
    };
  throw Error("Unknown agent tool");
}
export function claimRecord(packet, notes) {
  const check = notes.find((p) => p.role === "reviewer");
  return {
    id: "editorial-reading",
    revision: packet.revision,
    cutoff: packet.cutoff,
    status:
      check?.decision === "withdraw"
        ? "withdrawn"
        : check?.decision === "hold"
          ? "held"
          : "bounded",
    claim: check?.target_claim || packet.title,
    explanation: packet.body,
    evidence_ids: check?.evidence_ids || [],
    check: check?.summary,
    method:
      "Deterministic source and revision rules; not a semantic proof of model prose",
  };
}
