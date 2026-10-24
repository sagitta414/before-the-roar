# v180 — contribution contracts and evidence dependence

This change preserves the existing layouts, CSS and navigation.

## Commentary

Film follow-ups assign three distinct public jobs: Scout audits the observed detail against the disputed claim; Guide supplies a viewing exercise; Host makes the publication decision. The close-control Host task distinguishes controlling the ball from getting past an opponent and excludes replay instructions from its main takeaway. Replay cues remain separate. These are editorial instructions, not a guarantee that arbitrary model prose is novel or correct.

Guide selects an unused comparison from ball reach, separation and frame coverage. The third round no longer automatically reuses separation after the earlier ball-reach exercise. No new observation is invented when the evidence cutoff has not advanced. The film cache namespace changes so saved v179 output cannot masquerade as v180 output.

## Truth Lab

The compact original statement now describes a defender shifting toward the runner's flank. It no longer says the run pulled the defender wide. Both the preview and applied correction distinguish a withdrawn movement statement from a causal conclusion. The demonstration tests dependence on a synthetic observation; it does not establish what caused the defender to move. Existing measured events and the detailed causal limitations remain intact.

## Validation protocol

`node scripts/verify-frozen-film.mjs` produces a no-model-call plan. `--live` requires the configured Azure runtime and runs the three known development cases on one frozen source dependency graph, with fresh isolated conversation checkpoints. It archives source bytes, hashes, complete opening/follow-up event records, errors, latency and request count; verifies the source hashes again after execution; and retains a durable report. It never replaces the old v179 records. At most 36 model requests are reserved through the existing daily allowance.

This is a same-source regression, not an unseen holdout, independent human evaluation, or crew-versus-baseline comparison. Completion means the workflow returned completion events; it does not mean every role used a model or passed human quality review. Inspect retained receipts for retries and fallbacks.

Local validation after the causal-wording regression: 337 tests passed, zero failures or skips; syntax and API formatting checks passed. The dry-run source manifest completed. Independent commentary ratings must be reported separately; no quality superiority is claimed by this document.

## First complete live run — retained, not a success claim

`v180-frozen-film-results.json` records all three cases on Azure revision `before-the-roar--0000162`, image digest `sha256:22ed090962feba2236fbd59a7c8f5efd827fe819c7ce405af531d13e739bfd57`. Six fresh rounds completed with 19 model requests and unchanged source hashes. Four of eighteen model-role contributions fell back: two opening Host editorial failures, then Guide/Host throttling in the final follow-up. Seven of nine follow-up model roles delivered model prose. These counts are delivery outcomes, not accuracy.

Manual review also found an accepted opening Host claim that control was “forcing the defender to adjust”. That unsupported causal wording prompted a new regression and rejection rule, plus a new cache namespace. The next evaluation is paced between cases; this original run is preserved. The intent follow-up still repeats a sentence between Scout and Host, so semantic distinctiveness is not established merely by completing a round.

## Final same-release run

`v180b-frozen-film-results.json` records revision `before-the-roar--0000163`, image `before-the-roar:v180b-causal`, digest `sha256:ebbb69d933b869190f87ad684fa7938c1b0eeba83f7db732465b35e4f39a1ce2`. All three fresh openings and follow-ups ran on that image. Source hashes remained unchanged. All 18 model-role contributions were delivered as model prose, including nine follow-up contributions. There were 22 requests, four editorial repairs, no fallbacks and no throttling. Whole-round elapsed times were approximately 5.4–9.5 seconds; these are not time-to-first-token measurements. The report was also saved durably in Azure.

Host's close-control follow-up distinguishes controlling the ball from getting past an opponent. This is a useful improvement in contribution, not an independent superiority result. Manual review still finds overlap between Scout and Host in intent/outlet answers. The intent opening says a stance “suggests an intent to contest the ball”; the follow-up withholds intent, but the original inference should not be considered grounded merely because the guard accepted it. Semantic grounding and distinctiveness are therefore still imperfect.

The current-release crew-only review pack is in `docs/review-v180/`. It preserves all six rounds and leaves human ratings empty. It is separate from the old public v66 comparison. An independent superiority claim still requires matched single-model answers and blinded external ratings. No visual redesign, model change, or allowance increase was made.
