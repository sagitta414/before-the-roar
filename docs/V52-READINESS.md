# BTR: evidence required for an A-level submission

This is a readiness record, not an official judging score or a prediction of winning.

## Delivered in this release

- Synthetic match rounds use one Azure AI angle selection instead of four free-prose/tool requests. The selection is an enum; public sentences, arithmetic and citations are rendered from a source catalog. The UI labels this as AI selection, not five independent agents.
- A second round introduces a different measurement and an explicit missing-comparison question. Unknown angles, extra model prose, and invalid citations fail closed. The catalog itself remains reviewable authored logic, not a semantic truth oracle.
- Calculations appear before the model selection; unvalidated selector text is never streamed as commentary. Completed rounds persist and replay without another request.
- Interruption after selection is recoverable without another model reservation. The recovery-only patch was added after the paired study; its behavior is covered by a separate regression test, not claimed as another live study.
- The two-round evidence room opens within Inside BTR. Phone readers can select a single public contribution in both the evidence room and Watch, with a Show all option in Watch. Source preferences and technical evidence remain expandable.
- Earlier evaluation receipts are labeled archived. The current comparison retains raw outputs, rejected baseline proposals, request counts and timing.

## Actual measurements

The fixed v52 study contains six opening pairs and one paired follow-up, across English, Spanish and Portuguese. All seven pairs completed using 14 total model requests.

| Measure | Source composition | Free-prose baseline |
| --- | --- | --- |
| Requests | 7 | 7 |
| Total server execution | 15.9 seconds | 43.4 seconds |
| Mean server execution | 2.27 seconds | 6.20 seconds |

The source-composition arm validates selection membership and citations. The baseline uses editorial prose guards. Their acceptance counts are **not comparable accuracy scores**. The inherited plan sentence about identical guards is incorrect for this mode; the retained report carries an explicit method correction. No failed trial was removed and no human or audience ratings are invented.

The prior four-request architecture and this one-request architecture imply a 75% reduction in model requests per fresh synthetic round. This is not a 75% reduction in the Azure bill: tokens, film/vision calls, storage and hosting have separate costs.

At study completion, today's allowance was 194/240, leaving 46 requests. The temporary ceiling expires at midnight UTC; the normal 120-request limit is unchanged.

## Judge walkthrough

1. Enter Watch and choose the measured synthetic match. Explain that the generated multi-shot film is a separate source.
2. Open Inside BTR's evidence room. Read Scout's observation and Vector's 23.7m completed-pass progression.
3. Choose the second round. Inspect the actual AI-selected limit angle and 13m defender displacement. Show what this does and does not establish.
4. Open Truth Lab. Change the defender tracking; verify that the movement claim changes while completed passes remain intact.
5. Compare beginner, tactical and math views in another language. Export the timed overlay and its evidence.

## Still needed before claiming A-level validation

- Independent readers: at least several first-time football viewers and analysts should evaluate relevance, comprehension and trust. Use the unfilled blind review pack; do not treat schema acceptance as their score. The old viewer-study content is historical and must not be attributed to the new workflow.
- Physical-device checks: verify video playback, audio, keyboard entry and recovery on an actual iPhone/Safari and Android/Chrome. Browser viewport testing does not establish those capabilities.
- More variety: expand the source catalog and challenge cases, including irrelevant questions and repeated follow-ups, without adding unsupported tactical claims.
- Keep limitations explicit: film commentary and full-match generation retain separate model paths. Continuous video tracking, calibrated shot-speed inference and a rendering-partner integration are not claimed.

The strongest pitch is a fast, inspectable football explanation that changes when evidence changes. Avoid claiming that five voices prove a claim, that catalog selection is unrestricted reasoning, or that the edited film is a continuous coherent match.
