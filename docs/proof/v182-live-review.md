# v182 live review: retained failures and corrective follow-up

The complete four-case, eight-round run executed on Azure revision `before-the-roar--0000166`, image digest `sha256:f198029b160b0a0057907c638497fcc0bd90c8265c4e488886eea16769fab925`. All runtime source hashes remained unchanged during execution. The 30-file source snapshot is archived in `v182-source/`; the complete events and paired baselines are in `v182-frozen-film-results.json`.

## Actual results

- 41 model requests: 33 crew requests (24 primary plus nine repairs), eight single-call baselines.
- Eight completed crew rounds, with six reviewed fallback contributions: one Scout and five Host.
- 18 of 24 model-role contributions were delivered as Azure output; fallback is not counted as model success.
- Crew round latency: 3.54–7.26 seconds in this run. This is a small operational sample, not a service-level guarantee.
- No independent human ratings have been received. A blinded exportable review package is available in `../review-v182/`.

Manual inspection found an unsupported Scout inference in the escape follow-up: “indicating ongoing pressure” and “not leading to an escape.” Guide also repeated the ball-reach question across scenarios, including the goalkeeper case. Host format failures showed a mismatch between its prompt and the replay-cue validator. These are failures, despite the run completing and the local tests passing.

## Corrections after the frozen run

The final candidate explicitly supplies the required localized replay prefix, chooses Guide comparisons for the current scene (pass/frame coverage, control/separation, goalkeeper/ball origin), and rejects the reproduced unsupported pressure/failed-escape paraphrase. The earlier record is preserved rather than overwritten. These checks remain bounded editorial rules, not a semantic accuracy proof.

A targeted final-candidate escape regression is planned under a seven-request ceiling. It will be recorded separately. It must not be described as a fresh full-grid evaluation. The next quality gate is a complete final-revision comparison and independent ratings, not an arbitrary numerical score.
