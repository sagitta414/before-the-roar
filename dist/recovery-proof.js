const SAVED_ROLES = ["analyst", "guide", "math"];
const sameSet = (actual, expected) =>
  actual.length === expected.length && expected.every((value) => actual.includes(value));

// Evaluate the persisted record instead of trusting a success message from the worker.
export function recoveryProof(record) {
  const workflow = record?.workflow || {},
    trace = workflow.trace || [],
    posts = workflow.posts || {},
    interruptionIndex = trace.findIndex((item) => item.action === "worker_interrupted"),
    interruption = trace[interruptionIndex] || {},
    completions = trace.filter((item) => item.action === "model_handoff_completed"),
    completedRoles = completions.map((item) => item.role),
    requestNumbers = completions.map((item) => item.request_number),
    reusedRoles = trace
      .slice(Math.max(0, interruptionIndex + 1))
      .filter((item) => item.action === "saved_model_handoff_reused")
      .map((item) => item.role),
    publishedRoles = ["analyst", "guide", "math", "reviewer", "presenter"].filter(
      (role) => posts[role],
    ),
    totalRequests = workflow.metrics?.model_calls ?? 0,
    beforeRequests = interruption.saved_model_requests ?? 0,
    uniqueModelRoles = new Set(completedRoles).size,
    checks = [
      ["A real interruption was recorded", interruptionIndex >= 0],
      ["Scout, Guide and Vector were saved first", sameSet(interruption.saved_roles || [], SAVED_ROLES)],
      ["The new worker reused Scout and Guide", sameSet(reusedRoles, ["analyst", "guide"])],
      ["Exactly four specialist model requests ran", totalRequests === 4],
      ["Request receipts are numbered 1 through 4", requestNumbers.join(",") === "1,2,3,4"],
      ["No specialist model request was duplicated", uniqueModelRoles === totalRequests],
      ["Vector remained a deterministic calculation", posts.math?.engine === "calculated"],
      ["Check enforced the evidence gate", posts.reviewer?.guard_engine === "evidence_rules"],
      ["All five contributions reached the output", publishedRoles.length === 5],
      ["The Host finished after Check", completedRoles.at(-1) === "presenter" && completedRoles.at(-2) === "reviewer"],
      ["The persisted workflow is complete", workflow.status === "complete"],
    ].map(([label, passed]) => ({ label, passed }));
  return {
    verified: checks.every((check) => check.passed),
    checks,
    total_requests: totalRequests,
    before_interruption: beforeRequests,
    after_restart: Math.max(0, totalRequests - beforeRequests),
    duplicate_requests: Math.max(0, totalRequests - uniqueModelRoles),
    saved_roles: interruption.saved_roles || [],
    reused_roles: reusedRoles,
    published_roles: publishedRoles,
  };
}
