# External evidence collection — still pending

No new independent ratings or unfamiliar-video accuracy results are claimed by v177.

## Commentary review

Invite 3–5 people who did not build BTR to the public `/independent-review.html` page. Ask each person to complete all eight blinded comparisons, judge grounding, football usefulness, clarity and repetition, and return their original JSON export. Do not tell them which answer uses the crew. Do not complete reviews on their behalf.

The currently published trial is **btr-unseen-editorial-v66**. Ratings of it apply to those frozen answers, not automatically to the current release. A current-release superiority claim requires a new frozen answer set from both systems under equal evidence cutoffs, recorded request/latency/cost budgets and new blinded ratings. Preserve the old trial and exports. Report ties, disagreements and sample size; do not turn a one-point lead into an established advantage.

## Unfamiliar synthetic broadcast clips

Freeze the detector before collecting footage. The accompanying empty manifest identifies the current committed source and content-addressed archive. Obtain newly created fictional football clips, never used for development or threshold tuning. Include fixed and moving cameras, different lighting, close-ups, occlusion and unmarked uniforms. Retain rejections; they are an important result. Existing evaluation samples are demonstrations, not fresh holdouts.

Have a human annotate pass, shot, tackle and possession-change timestamps before seeing detector output. Record annotator identity privately and use an anonymous ID in the public report. Resolve ambiguous events explicitly. Generated realistic footage without calibrated ground truth cannot establish speed error or player identity accuracy: leave those fields empty.

For each clip add `file`, `sha256`, `duration_seconds`, `annotation_status: "human-reviewed"`, `used_for_tuning: false`, `lighting`, `camera_angle`, `occlusion`, `rejected`, `truth` and `detected`. Events have `type` and `second`. Optional `identities` rows have `correct` and `labelled_by_human`; optional `speeds` rows require `reference_method` (`calibrated-reference` or `synthetic-ground-truth`), `reference_kmh` and `detected_kmh`. Keep the annotation and raw detector exports alongside the manifest. A boolean attestation is not independently verified by this script.

Run once without changing detector thresholds:

```
node scripts/score-external-benchmark.mjs path/to/completed-manifest.json path/to/new-report.json
```

The scorer verifies file hashes, refuses to overwrite reports, uses one-to-one event matching within 0.5 seconds, includes rejected clips in recall, and reports precision, recall, false positives per minute, identity accuracy, speed MAE, rejection rate and condition breakdowns. Null means not measured. Record all rejected clips and reasons; do not report accepted-only accuracy as general broadcast accuracy. If tuning follows, label this set development data and collect another holdout.
