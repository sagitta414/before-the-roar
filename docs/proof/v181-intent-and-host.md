# v181 — intent scope and distinct Host contributions

The v180b live record exposed two failures: a hedged intent claim survived because a different clause contained a negative disclaimer, and Host paraphrased Scout's uncertainty instead of adding a useful conclusion.

## Changes

- Film intent checks inspect separate clauses and every public text field. “Suggests an intent … but does not confirm a tackle” is rejected: the tackle disclaimer does not qualify intent. Explicit statements that intent is unverified remain permitted. These are bounded language checks, not general semantic proof.
- Film Host openings and follow-ups reject copied sentences and require a publication decision or a distinct football contrast. The intent task distinguishes a marking position from a completed tackle; the pass task distinguishes a completed connection from a line-breaking pass. Host leaves the replay exercise to Guide's main contribution.
- Raw film drafts are no longer sent to the audience. The speaker status remains live and each validated role publishes as it completes. This adds validation delay before displaying prose, rather than briefly exposing a claim later rejected by the checks.
- The film cache namespace changes; older saved results cannot appear as a freshly checked v181 discussion. No layout, CSS, footage, model, or daily allowance changes.

## Verification

341 tests passed with zero failures/skips; syntax and API formatting checks passed. Tests include the exact escaped intent wording, Spanish/Portuguese affirmative variants, accepted limitations, headline coverage, copied Host sentences, missing editorial value, and withholding unvalidated film drafts while retaining speaker/post events.

Live results must be recorded separately on the final deployed source. Regression acceptance is not independent quality or proof that the crew beats a simpler model. Earlier v180/v180b records remain unchanged.

## First live verification retained

Revision before-the-roar--0000164 (v181-validated) completed three known English development scenarios, each with an opening and follow-up: 22 model requests, 17 model-delivered contributions, one reviewed Host fallback, four revision requests, and zero raw draft events. The source graph stayed unchanged. See v181-frozen-film-results.json.

Manual inspection found remaining opening repetition and an unsupported pressure/prevention interpretation in the close-control opening. The intent follow-up also used an unnecessarily corrective fallback despite no published explicit intent claim. These findings are retained; this run is not a passing quality verdict.

The v181b correction applies the Host contribution contract to openings, adds regression coverage for the observed pressure/prevention wording, and uses a marking-versus-completed-tackle distinction in the intent fallback without falsely claiming that a published inference was withdrawn. Updated mock model fixtures supply distinct editorial conclusions; their request-count and fallback assertions remain in place. Final live verification is recorded below.

## Final deployed verification: v181b

- Image: patchhorizonacr805813.azurecr.io/before-the-roar:v181b-validated
- Image digest: sha256:3b3b5a9c796b360030ce3da4d8a1772720940a6cc7e0b7e722257ee98328c7cd
- Azure revision: before-the-roar--0000165; ACR run ch7e.
- Evidence: v181b-frozen-film-results.json. All six rounds completed on an unchanged source graph; every recorded source hash matched the local final source.
- 24 model requests; 14 model-delivered contributions; four explicitly labelled reviewed Host fallbacks; six editorial repair requests; zero public raw draft events. Vector and Check remain deterministic and are excluded from these model contribution counts.
- The defender-intent opening was repaired before publication. The published opening describes positioning without assigning intent. The intent follow-up Host fallback distinguishes marking from a completed tackle instead of falsely announcing a prior retraction.
- Model-delivered follow-up Host conclusions distinguished pass completion from bypassing a defensive line, and close control from getting past an opponent.

### Limits and unresolved editorial quality

These results support stronger containment of the reported opening/Host defects, not consistently exceptional model commentary. Only two of six Host contributions were model-delivered; the other four used reviewed notes after failed validation/repair. Those fallbacks are transparent and safer but less conversational. Some Guide replay questions and uncertainty still overlap across cases. The lexical contribution rule is a bounded proxy, not a semantic novelty or accuracy measure. The known three English cases were used in development, and no independent human preference or crew-versus-baseline superiority is established. No visual or layout change was made for v181.
