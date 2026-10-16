# Question-aware explanations and mobile reading

## What changed

The existing GPT-4o mini deployment remains in use. The principal fault was an output contract that offered no beginner-specific answer: a model upgrade alone could not rewrite the fixed catalog. The new selector instructions distinguish simplification, arithmetic, causal challenges, replay tasks and unsupported requests. Localized beginner answers become shorter on follow-up. Saved history includes all preceding rounds; repeated contributions remain in history instead of filling the new round. New cache keys prevent old answers from masking the changes.

On phones, playback is followed by the discussion. Detailed source and allowance controls are expandable; the second voice picker is hidden. Desktop Watch layout is preserved. Usage copy distinguishes one synthetic request from up to four film requests. Presenter instructions are regenerated from the actual selector prompt.

## Verification

- 164 automated tests pass, including new localized simplification, retained-history and third-round novelty checks. Syntax checks and whitespace validation pass.
- Live Azure checks: five requests, five completed cases; opening movement, simpler follow-up, deeper replay task, Spanish beginner and outside-source question all selected the expected response category. Actual responses are retained in `docs/proof/audience-v53.json`, including repeated facts and source references.
- Observed request durations: 1.651s, 1.372s, 9.564s, 1.103s and 1.755s. These are functional observations, not a latency guarantee or comparative benchmark.
- Browser viewport checks at 390px and 320px showed no document-wide horizontal overflow. At 390px, the discussion began around 396px from the viewport top in the preview. The screenshot showed the first contribution on the initial screen.
- The existing paired v52 comparison remains explicitly archived. The new saved conversation is linked separately; no older comparison is relabeled as new evidence.

## Limits and next model decision

The synthetic workflow is bounded editorial selection, not unrestricted reasoning by five independent models. Its catalog still limits the breadth of questions it can answer. Film and full-match generation have separate generative paths. No independent human quality ratings or physical iPhone/Android checks were performed here. The generated film remains an edited sequence of shots.

Before changing models, compare identical source packets and questions with identical output contracts and blind human ratings for relevance, clarity, football value and groundedness. A bigger model cannot overcome a missing answer category; a different model becomes justified when measured selection or reasoning failures persist after the contract is corrected. This release makes no model-superiority or winning-probability claim.

## Full Match Lab run
One complete Azure fixture passed: 727 events, six AI checkpoints, five audience modes at every checkpoint, 811 streamed dialogue events, a final recap and successful export. Total run time was 66.387 seconds. First text ranged from 1.132 to 10.252 seconds; this is not uniformly low latency. The retained summary is docs/proof/full-match-v53.json. Eleven model requests were used across the five discussion checks and this six-checkpoint fixture. No allowance was increased.
