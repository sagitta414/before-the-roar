# Evidence-grounded dialogue, October 16

The verified live API release is 3.11.2. This change focuses on public explanations, not a visual redesign.

- Editorial instructions anchor each contribution to the calculated football observation and implication. They separate coinciding movement from causal influence and require a concrete missing comparison in the wide-run follow-up.
- Portuguese “correção” now satisfies the correction guard. Numeric prose, unsupported no-influence claims and out-of-window citations remain rejected.
- Follow-up math uses a reached, cited measurement. For the wide-run case it calculates defender lateral displacement from the source coordinates instead of switching to an unavailable regain-to-shot metric.
- Discussion cache keys changed so older responses are not presented as output from the revised policy.
- A follow-up no longer receives the opening Guide question and definition as instructions. Repetition checking compares its new question without the opening definition prefix.
- The editorial guard rejects claims of defender distraction or a decoy because attention is not measured by the synthetic coordinates.

153 functional tests pass. Syntax and API formatting checks pass. These checks do not establish semantic accuracy.

## Retained evidence

`proof/two-round-v45.json` contains the first actual two-round capture, including Scout's rejected causal claim, its labeled fallback, and the unavailable-metric weakness discovered during that run. It used eight model requests. It is retained rather than replaced by the improved attempt.

`proof/two-round-v45-1.json` retains the second capture: the new lateral-displacement calculation worked, but Guide repeated its question and the opening responses introduced an unmeasured distraction. Those findings led to the final guard and context changes. This attempt also used eight requests. Neither attempt is represented as a clean demonstration.

`scripts/capture-two-round.mjs` captures the revised deployment's two rounds with source cutoff, revision, engine labels, timing and public streamed events. It checks the deployed version and allowance before generation, makes no model retries, and persists each completed event. `scripts/export-two-round.mjs` makes a readable saved transcript without inventing dialogue or presenting it as a live stream.

The opening asks what is happening away from the ball. The challenge asks whether the wide run proves the central pass was opened and what must be checked. The intended distinction is recorded progress versus attribution of that progress to the run.

The incomplete v44 comparison remains six paired cases: crew 12/18 editorial guard acceptance against baseline 17/18, using 24 versus six requests. It must not be resumed under this changed policy or described as a v45 result. A fresh comparative evaluation and blind human ratings are still required before claiming a crew advantage. The existing 105-second video remains older evidence; a saved transcript is not a replacement screen recording.

## Final live capture: qualified result

`proof/two-round-v45-2.json` and its HTML transcript retain the final actual exchange from API 3.11.2. The new Guide question asks whether the defender moves before or after pass release. Vector calculates 13.0 m lateral displacement from the cited tracking-derived context. Both rounds use the same 16-second cutoff and original revision. Five of six model-written contributions passed the current guards; Host used a reviewed fallback in round one.

Manual review still finds unsupported wording: the opening Scout says “without directly affecting the defender's actions,” and the closing Host says central passes progressed “independently” of the run. Neither causal absence nor independence follows from these records. These are unresolved semantic weaknesses, despite guard acceptance. Do not present this capture as fully grounded, a winning demonstration, or evidence of crew superiority. The improved math and follow-up question are demonstrated; broad semantic reliability is not.

Three versioned captures used eight model calls each. The final account counter was 169/180; its increase also includes other shared activity. No allowance change was made in this work.
