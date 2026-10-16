// Replays recorded public contributions. A replay pause is never a new worker fault.
export function receiptReplay(archive, resumed = false) {
  const sample = archive?.cases?.find((c) => c.id === "wide-original");
  if (!sample?.team?.trace?.length || !sample.team.posts?.length)
    throw Error("Saved receipts are unavailable. The guided match remains available.");
  const boundary = sample.team.trace.findIndex((item) => item.action === "claim_checked");
  if (boundary < 0) throw Error("This archive has no specialist handoff to replay.");
  const roles = resumed
    ? ["analyst", "guide", "math", "reviewer", "presenter"]
    : ["analyst", "guide", "math"];
  return {
    schema: "btr.receipt-replay.v1",
    kind: "saved_receipt_replay",
    recorded_at: archive.recorded_at,
    input: sample.input,
    phase: resumed ? "complete" : "paused_at_handoff",
    fresh_model_requests: 0,
    recorded_requests: sample.team.requests,
    trace: sample.team.trace
      .slice(0, resumed ? undefined : boundary)
      .map((item) => ({ ...item, replayed: true })),
    posts: roles
      .map((role) => sample.team.posts.find((p) => p.role === role))
      .filter(Boolean),
    limitation:
      "The pause demonstrates the saved specialist handoff. No new worker interruption, storage recovery or AI generation is performed. Historical editorial checks differ from the current policy.",
  };
}
