# v179 — distinctive follow-ups and accurate execution claims

Runtime revision: ea67a6587f1c928559a4c42847e9122a9eb0f1bc. Azure revision: before-the-roar--0000161. No CSS, layout, navigation, footage, model selection or allowance settings changed.

## Finding 1: second-round value

Film follow-ups now receive a distinct editorial task, the saved conversation cutoff, current-shot observations and an explicit list of newly reached evidence. Ordinary questions cannot pull earlier-shot action into the current scene. Repairs retain the same round, task and evidence. Guide compares a different observable feature instead of repeating the opening lesson. The repetition check distinguishes a new reach comparison from a movement question even when both use the same football nouns. Exact repeated copy remains rejected.

Scout separates observation from interpretation. Guide proposes a concrete replay comparison. Host turns the conclusion into a viewer decision rule. Additional checks reject claims that proximity proves restricted passing options, that close control prevents a defender acting, or that an unverified escape proves the attacker failed.

These are bounded editorial checks, not semantic proof of arbitrary model prose. The three English scenarios below were used during development. They are not an unseen holdout and do not establish superiority over a simpler model.

## Live verification and retained failures

- Initial tests: 6 of 9 model-role follow-up contributions were delivered as model output; three fell back, including a throttled Host request. See [initial record](v179-followup-initial.json).
- Prompt refinement still exposed false-positive repetition checks and unsupported tactical wording. See [refinement record](v179-followup-refinement.json).
- After the comparison and grounding fixes, intent and outlet each completed with three model requests and no fallback. The dribbling case still used a reviewed Host fallback. See [development record](v179-followup-development.json).
- The next targeted Host run passed the old checks but said the attacker “has not escaped.” Manual review rejected that definite negative because the source only leaves escape unproven. The development record preserves this result; it was not counted as verified quality.
- After adding the uncertainty guard, the deployed dribbling recheck completed with three model requests, no editorial retries and no fallback. Host said: “The attacker's ball control does not confirm a successful escape from the defender. Watch for the next controlled touch to clarify the situation.” See [final execution record](v179-followup-final.json).

The final targeted run reused a previously executed opening and generated a fresh follow-up. Intent/outlet and the final dribbling recheck ran on successive revisions; this is an iterative developer verification record, not one fresh three-case benchmark on the final revision. Human commentary preference remains unmeasured.

## Finding 2: execution claims

Publish proof, crew descriptions and discussion controls now distinguish the selected source:

- Cinematic film: Scout, Guide and Host use three model requests, with up to three editorial retries. Vector calculates; Check applies evidence rules.
- Synthetic match: four sequential model roles; Vector calculates in code.
- Uploaded clips: on-device detection with optional separate AI review. No five-specialist round is implied.
- Exact cached discussion: zero new model calls. A deployed replay confirmed cached=true and model_calls=0, while preserving the original three-call metrics.
- Foundry review is separate. Receipts show actual model-call totals rather than inferring request counts from the number of displayed contributions. Partial and replay states remain explicit.

## Validation

334 tests passed, zero failed or skipped. Syntax and formatting checks passed. The integrated UI test switches between film, synthetic-match and uploaded-source proof text. Browser verification confirmed the deployed film proof shows “3 MODEL ROLES · 2 CODE ROLES.” Tests cover source-scoped citations, saved cutoffs, repair context, distinct comparisons, unsupported tactical restrictions and uncertain-outcome wording.
