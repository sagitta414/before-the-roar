# v44: distinct explanations and an auditable conversation comparison

The corrected record now produces three different explanations in English, Spanish and Portuguese. Beginner mode explains an off-ball run and asks the viewer to follow runner and defender separately. Tactical mode withdraws the defender-shift interpretation and separates the central passing route from the run's unproven influence. Math mode keeps the pass measurements intact and explains which movement record changed. Watch, Match Centre, guided captions and production cues use these same source-bound variants.

The AI availability check covers configuration, health and response parsing with an eight-second timeout per attempt. It retries once after 1.5 seconds, then offers a visible retry button instead of remaining on Checking. A failed refresh discards previously reported allowance. Playback and reviewed explanations stay available.

Presenter and About copy describe the real dependency: Scout opens; Guide reads Scout; Host receives all four contributions. The guided tour now hands off to the current live discussion without generating automatically. A viewer can send the suggested opening question, then ask “Did the run cause it?” The complete viewer question stays visible in the next round. The older recording is explicitly labeled as earlier evidence, not proof of today's follow-up quality.

## Comparison prepared; live results pending

`docs/proof/v44-evaluation-plan.json` fixes eleven opening cases and one paired follow-up before model generation: three synthetic scenarios, three languages, corrected and original records, and early and later cutoffs. The maximum is sixty model requests: four for the crew and one for the baseline per paired case. Both arms receive the same records, model, temperature and editorial rules. Each follow-up receives its own arm's earlier public contributions. There is one trial per case; failures are retained, with no model retries.

The harness saves the full report to Azure Blob after each arm, including baseline raw proposals, crew raw proposals, public stream events and timings. A disconnected terminal therefore does not lose the baseline result. Source hashes refuse to run against a different deployed policy. The blind review export includes rejected proposals rather than substituting authored crew fallbacks. Human ratings are empty until actual reviewers supply them.

The published v42.2 result remains 11/12 crew outputs versus 12/12 baseline outputs passing editorial guards, at sixteen versus four model requests. Those are guard outcomes, not semantic accuracy. No crew quality advantage, viewer benefit or current-policy performance result is established.

The new comparison and a fresh two-round demo have not run: only six daily requests remained at preparation, and the requested sixty-request one-day increase was still awaiting approval. Normal allowance remains 120; no counter reset or cost-guard change was made. The current live handoff is implemented and tested, but that is not a substitute for fresh measured model output.

## Verification

151 functional tests pass, including connection timeout/retry recovery, three distinct corrected audience cards, identical comparison guards, rejected-proposal preservation and a no-spend handoff into Watch. Syntax checks and API formatting pass. One hundred held-out synthetic fixture seeds pass internal consistency checks; this is not real-match calibration. Browser and deployment receipts are recorded separately in `docs/proof/v44-verification.json`.
