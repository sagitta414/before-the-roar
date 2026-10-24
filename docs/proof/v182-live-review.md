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

A targeted final-candidate escape regression used seven additional requests on revision `before-the-roar--0000167`, with matching local/runtime hashes. Its separate record is `v182c-final-verification.json`. The follow-up withheld an escape outcome and Guide switched to visible separation. Both rounds delivered reviewed Host fallback: the opening hit an editorial rejection and the follow-up Host was stopped by the verification ceiling. The record's `complete` flag means both rounds delivered a result, not that every role succeeded with a model call. Total verification use across the two runs was 48 requests; the app's daily allowance was not increased.

This targeted rerun is not a fresh full-grid evaluation. Host delivery reliability remains open, as do independent ratings. A complete final-revision comparison remains required before any 90+ or superior-commentary claim.

## Final application release

Application source commit: `2c0c369`. Image: `before-the-roar:v182c-review`, digest `sha256:a150b41b0246cd1c64fe2acfb196ca91779e61c32706064104342f2704f764d3`. A metadata-only revision updates the health endpoint to identify this image and source commit. Follow-up documentation commits do not change the image's application code.

Local checks: 345 passing tests, no failures/skips; syntax and API formatting pass. Public health, HTML, updated CSS and the frozen review page returned HTTP 200. Browser checks covered cinematic startup, source continuity through Understand/Publish, publication labels, and accessibility availability at desktop and 390-pixel phone width. This does not replace a physical-phone accessibility audit.
