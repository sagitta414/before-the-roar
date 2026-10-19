const el = (tag, text) => {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
};

async function load(path) {
  const response = await fetch(path);
  if (!response.ok) throw Error("Retained report unavailable");
  return response.json();
}

try {
  const report = await load("assets/tracking/holdout-current.json");
  const root = document.getElementById("detector-results");
  const totals = report.cases.reduce(
    (sum, entry) => ({
      expected: sum.expected + entry.expectedEvents,
      detected: sum.detected + entry.detectedEvents,
      matched: sum.matched + entry.matchedEvents,
    }),
    { expected: 0, detected: 0, matched: 0 },
  );
  const precision = totals.detected ? (100 * totals.matched) / totals.detected : 0;
  const recall = totals.expected ? (100 * totals.matched) / totals.expected : 0;
  const misses = totals.expected - totals.matched;
  root.replaceChildren(
    el(
      "p",
      `${report.cases.length} unseen procedural seeds · ${totals.matched}/${totals.expected} events matched · ${recall.toFixed(1)}% recall · ${precision.toFixed(1)}% precision.`,
    ),
    el(
      "p",
      `${misses} retained miss${misses === 1 ? "" : "es"}. Detector SHA-256: ${report.detector_sha256.slice(0, 16)}…`,
    ),
  );
} catch (error) {
  document.getElementById("detector-results").textContent = error.message;
}

try {
  const report = await load("assets/tracking/external-video-results.json");
  const root = document.getElementById("external-results");
  root.replaceChildren();
  for (const clip of report.clips) {
    root.append(
      el(
        "p",
        `${clip.kind}: ${clip.frames} frames tested; ${clip.raw_marker_matches} raw colour matches; ${clip.published_player_identities} verified identities published. These counts are not detection accuracy.`,
      ),
    );
  }
} catch (error) {
  document.getElementById("external-results").textContent = error.message;
}

try {
  const report = await load("assets/commentary-quality-court.json");
  const root = document.getElementById("comparison-results");
  const overall = report.score.overall;
  const grounding = report.score.grounding;
  const decision = report.score.decision_usefulness;
  root.replaceChildren(
    el(
      "p",
      `${report.cases.length} preregistered synthetic cases · two blinded model-evaluator passes · reversed A/B order.`,
    ),
    el(
      "p",
      `Overall ${overall.crew_points}–${overall.baseline_points}; grounding ${grounding.crew_points}–${grounding.baseline_points}; decision usefulness ${decision.crew_points}–${decision.baseline_points}.`,
    ),
    el(
      "p",
      "The result is model-scored and narrow. Independent human preference remains unmeasured; no general superiority claim is made.",
    ),
  );
} catch (error) {
  document.getElementById("comparison-results").textContent = error.message;
}
