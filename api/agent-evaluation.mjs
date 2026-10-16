// Shared fixed-case editorial acceptance measurements for team and single-call comparisons.
import { validateMatchPost, repeatsContribution } from "./match-desk.mjs";
import { editorialIssues } from "../dist/editorial-quality.js";
export const EVALUATION_CASES = [
  {
    id: "wide-original",
    input: {
      source: "match",
      scenario: "wide",
      time: 16,
      corrected: false,
      language: "en",
      mode: "analyst",
      focus: 7,
      team: "harbor",
    },
  },
  {
    id: "wide-corrected",
    input: {
      source: "match",
      scenario: "wide",
      time: 16,
      corrected: true,
      language: "en",
      mode: "analyst",
      focus: 7,
      team: "harbor",
    },
  },
  {
    id: "pressure-to-chance",
    input: {
      source: "match",
      scenario: "press",
      time: 29,
      corrected: false,
      language: "en",
      mode: "analyst",
      focus: 8,
      team: "harbor",
    },
  },
];
// Declared before generation; retain every trial, including rejected outputs.
for (const [id, scenario, time, corrected, language, mode] of [
  ["wide-corrected-es-beginner", "wide", 16, true, "es", "beginner"],
  ["wide-corrected-pt-math", "wide", 26, true, "pt", "math"],
  ["pressure-es-build", "press", 15, false, "es", "beginner"],
  ["counter-pt-saved", "counter", 28, false, "pt", "math"],
  ["pressure-before-regain", "press", 6, false, "en", "beginner"],
  ["counter-first-outlet", "counter", 12, false, "en", "fan"],
])
  EVALUATION_CASES.push({
    id,
    input: {
      source: "match",
      scenario,
      time,
      corrected,
      language,
      mode,
      focus: scenario === "press" ? 8 : 7,
      team: "harbor",
    },
  });
export const MODEL_ROLES = ["analyst", "guide", "presenter"];
export const FOLLOW_UP_QUESTION =
  "Does this prove the wide run opened the central pass? What would you need to check?";
export const EXTENDED_CASES = [...EVALUATION_CASES];
for (const [scenario, time, language, mode, corrected] of [
  ["wide", 6, "en", "beginner", false],
  ["wide", 26, "en", "fan", false],
  ["wide", 16, "es", "analyst", false],
  ["wide", 16, "pt", "beginner", false],
  ["press", 10, "en", "math", false],
  ["press", 29, "es", "fan", false],
  ["press", 29, "pt", "analyst", false],
  ["counter", 5, "en", "beginner", false],
  ["counter", 28, "en", "analyst", false],
  ["counter", 28, "es", "beginner", false],
  ["wide", 16, "en", "math", true],
])
  EXTENDED_CASES.push({
    id: [scenario, time, language, mode, corrected ? "corrected" : "original"].join("-"),
    input: {
      source: "match",
      scenario,
      time,
      language,
      mode,
      corrected,
      focus: scenario === "press" ? 8 : 7,
      team: "harbor",
    },
  });

// Human assessors score anonymous arms after generation, without a model judge.
export function blindReviewPack(report) {
  return {
    schema: "btr.blind-editorial-review.v1",
    source_policy: report.policy,
    ratings: [
      "grounding",
      "football_value",
      "distinct_contributions",
      "conversational_quality",
    ],
    scale: "0 = fails; 1 = partial; 2 = clear and supported",
    limits:
      "Review the raw model proposals from both arms against the evidence, including guard-rejected proposals. No generated proposal is replaced by an authored fallback in this pack. Guard acceptance is reported separately and is not a quality score.",
    cases: report.cases.map((c, i) => ({
      id: c.id,
      input: c.input,
      evidence: c.evidence || [],
      review: c.review || null,
      arms: (i % 2 ? ["baseline", "team"] : ["team", "baseline"]).map((arm, j) => ({
        label: j ? "B" : "A",
        posts: MODEL_ROLES.map((role) => {
          const raw = c[arm]?.raw?.[role];
          const proposal = raw?.post || raw;
          const served = c[arm]?.posts?.find((p) => p.role === role);
          return {
            role,
            summary: proposal
              ? proposal.viewing_question || proposal.takeaway || proposal.interpretation
              : c[arm]?.raw
                ? null
                : served?.summary || null,
            evidence_ids:
              proposal?.evidence_ids ||
              (c[arm]?.raw ? null : served?.evidence_ids) ||
              null,
            caution: proposal?.caution || null,
            replay_cue: proposal?.replay_cue || null,
          };
        }),
        ratings: null,
        unsupported_claims: [],
        comment: "",
      })),
    })),
  };
}
export function comparisonSchema(ids, primaryId) {
  const result = {
    type: "object",
    additionalProperties: false,
    properties: {},
    required: MODEL_ROLES,
  };
  for (const role of MODEL_ROLES) {
    const main =
      role === "guide"
        ? "viewing_question"
        : role === "presenter"
          ? "takeaway"
          : "interpretation";
    const fields = {
      [main]: { type: "string" },
      headline: { type: "string" },
      caution: { type: "string" },
      evidence_ids: {
        type: "object",
        additionalProperties: false,
        properties: {
          primary: { type: "string", enum: primaryId ? [primaryId] : ids },
          secondary: { type: ["string", "null"], enum: [...ids, null] },
        },
        required: ["primary", "secondary"],
      },
    };
    if (role === "presenter") fields.replay_cue = { type: "string" };
    result.properties[role] = {
      type: "object",
      additionalProperties: false,
      properties: fields,
      required: Object.keys(fields),
    };
  }
  return result;
}
export function evaluateBaseline(raw, packet, { previous = [], support = [] } = {}) {
  const accepted = [],
    rejections = [];
  for (const role of MODEL_ROLES) {
    try {
      const post = validateMatchPost({ post: raw?.[role] }, packet, role);
      if (
        previous.length &&
        repeatsContribution(
          post.summary,
          previous.filter((p) => p.role === role),
        )
      )
        throw Error("Follow-up repeats the previous contribution");
      if (role === "guide" && previous.length) post.summary = raw[role].viewing_question;
      if (
        role === "presenter" &&
        (repeatsContribution(post.summary, [...accepted, ...support]) ||
          editorialIssues(role, post.summary, [...accepted, ...support]).length)
      )
        throw Error("Repeated contribution");
      accepted.push({
        ...post,
        role,
        engine: "azure_openai",
        cutoff: packet.cutoff,
        revision: packet.revision,
      });
    } catch (e) {
      rejections.push({ role, reason: e.message });
    }
  }
  return {
    posts: accepted,
    rejections,
    accepted: accepted.length,
    rejected: rejections.length,
  };
}
export function evaluationSummary(cases) {
  return Object.fromEntries(
    ["team", "baseline"].map((arm) => {
      const values = cases.map((c) => c[arm]).filter(Boolean),
        accepted = values.reduce(
          (sum, v) =>
            sum +
            (arm === "team"
              ? v.posts.filter((p) => p.engine === "azure_openai").length
              : v.accepted),
          0,
        );
      return [
        arm,
        {
          accepted: accepted + "/" + values.length * 3,
          rejected: values.reduce(
            (sum, v) =>
              sum +
              (arm === "team"
                ? v.posts.filter(
                    (p) => MODEL_ROLES.includes(p.role) && p.engine !== "azure_openai",
                  ).length
                : v.rejected),
            0,
          ),
          requests: values.reduce((sum, v) => sum + v.requests, 0),
          seconds:
            Math.round(values.reduce((sum, v) => sum + v.elapsed_ms, 0) / 100) / 10,
        },
      ];
    }),
  );
}
