# Before the Roar

An explainable football studio: watch the play, follow a public editorial discussion, inspect the calculation, and challenge the evidence. A newcomer, an analyst and a numbers-focused fan get different explanations of the same source.

The connected-match release places beginner, math and tactical readings beside the same synthetic replay. Watch, Match Centre and Truth Lab carry one playhead and source revision. A three-round synthetic discussion now follows a run, a completed pass and a shot, changing each role's contribution only when new evidence arrives. See the [recorded Azure conversation](https://before-the-roar.sagitta107.chatgpt.site/conversation-proof.html) and its [unedited receipt](docs/proof/live-next-event-v89.json). The AI film is a separately labeled, manually reviewed source. No independent human superiority result is claimed.

**Public app:** https://before-the-roar.sagitta107.chatgpt.site

**Pocket Director:** https://before-the-roar.sagitta107.chatgpt.site/pocket-director.html

**Start the guided match:** https://before-the-roar.sagitta107.chatgpt.site/?tour=1#watch

**Direct judge route:** https://before-the-roar.sagitta107.chatgpt.site/?judge=1#watch

**Canonical 105-second demo:** https://before-the-roar.sagitta107.chatgpt.site/assets/btr-judge-demo.mp4

**Current changes and measured limits:** [CHANGELOG.md](CHANGELOG.md) · [verification record](docs/proof/v44-verification.json)

**Earlier reviewer fixes:** [docs/SCAN-3-FIXES.md](docs/SCAN-3-FIXES.md)

**Judge demonstration and scope:** [docs/JUDGE-DEMO.md](docs/JUDGE-DEMO.md)

## Run and verify

```sh
npm install
npm run studio
npm test
npm run check
npm run validate:data
```

The studio serves frontend and backend at `http://127.0.0.1:4397`. Without Azure configuration, labeled reviewed notes replace unavailable AI. Local checkpoints use atomic temporary files (`BTR_STATE_DIR` overrides the directory); production uses the existing private Blob container and managed identity.

## One interface, explicit sources

Watch, Match Centre, Presenters, Truth Lab and Inside BTR preserve the broadcast design. Source, clock, tracking revision, language, mode, club and selected player travel together.

Version 37 adds a visible shared AI allowance and local reset time, a Watch fallback notice above the conversation, an accessible mobile navigation menu including Match lab, direct routes and browser history restoration. Reviewed visual descriptions in three languages can be enabled in the film transport; they follow the global or scene-local clock and are not a speech transcript. Playback stalls expose retry without resetting the evidence time. Inside BTR includes a recording script, the earlier verification summary, and an explicit footage provenance/rights register.

- **Pitchside:** Optional full-minute playback of eight independently generated shots, with optional scene study. Reviewed annotations, local-player balance and reception counts describe only visible actions. Cuts do not establish continuous play, identity, score or causality. Physical speed and team pass accuracy remain unknown. Provenance: `dist/assets/pitchside-minute-provenance.json`.
- **Synthetic replay:** Three authored 36-second sequences rendered from ground coordinates. Pass math, pressure gap, passing gain and regain-to-shot-release time come from the records. Corrected tracking opens a tactical replay, never a falsely relabeled film.
- **Full-match generator:** Ninety-minute fixtures, seeds 1–1,000,000, live events, checkpoint narratives and full-time recaps. Version 2 preserves ball origins between restarts, includes two periods and bounded carries, and restarts goals at centre. Its pass-difficulty index is a declared illustrative heuristic, not a calibrated probability.

The original creator film remains at `original.html`. No real Premier League match data is included. Generated kit markings are not affiliation or rights clearance. The full-minute film remains an edit, not one continuous coherent match sequence.

## Tool-backed editorial workflow

The production synthetic-match desk executes four sequential Azure model requests: Scout retrieves and interprets the bounded evidence; Guide reads Scout and teaches the relevant concept; Check receives the public handoff and challenges the claim; Host reads every prior contribution and publishes the audience-ready line. Vector calculates from recorded distance and time in code between Guide and Check. Follow-ups retrieve server-side public contributions, preserve earlier rounds, and are limited to three rounds per chain. They cannot reuse history from a different source, revision, language, perspective or incompatible film scene.

After the crew completes, a project-scoped **Microsoft Foundry evidence referee** reads only the public trace and deterministic claim record through the Foundry Responses API. It scores grounding, correction sensitivity and audience value and publishes its own response ID, latency, usage and limitation. Its verdict is a second-line model review; BTR's deterministic evidence gate retains final release authority. The referee runs in the isolated `before-the-roar` Foundry project with managed identity and does not receive private chain-of-thought.

The film desk uses a separate bounded editorial workflow. Tool results, rejected outputs, posts, claim revisions, tokens and public receipts persist. Complete runs are reused without fabricated typing. Successful intermediate work is reused after failure; unavailable stages retry. Drafts are labeled and validated before publication. Number, attribution, citation, correction and repetition guards reduce specific errors without proving semantic truth. This is custom Node orchestration using Azure OpenAI plus an ephemeral Foundry project-endpoint evaluator; Microsoft Agent Framework, hosted Foundry agents, MCP, A2A and Fabric are not claimed.

## Correction and recovery

Inside BTR's production desk records the original reading and its withdrawal. Correcting tracking immediately updates the deterministic caption and separate OBS output. The revised AI discussion uses a new checkpoint namespace; prior contributions remain in the exported audit rather than appearing as current.

Test recovery throws an actual exception after the specialists are saved. Resume creates a fresh worker, reloads stored work and completes the handoff while the independent video continues. This is a worker interruption test, not an Azure shutdown. A successful recovery uses three crew requests before the fault and one afterwards. The Foundry referee then uses one separate project-scoped evaluation request. Automated tests replace both the worker and repository instance.

Blob ETags reject stale writes. Proof runs last thirty minutes, use distinct reader/writer capabilities, store only their hashes, and omit credentials from exports. Tab session storage restores the producer after reload. The ordinary full-match event stream is still ephemeral; it requires a new fixture after a backend restart. This upgrade makes editorial work durable, not every application service.

## Personalization and output

Fan, beginner, math, tactical and player modes support English, Spanish and Portuguese. All 22 fictional players and both clubs are selectable in the synthetic replay. Facts, denominators, units and source IDs survive personalization.

Pocket Director is a responsive second-screen experience paired from Watch with a scannable, read-only session link. It follows the active clock, source, evidence revision, language, team and player over the existing Azure SSE broadcast room. On the phone, a viewer can switch among beginner, math, tactical and player explanations, reveal the source-to-screen chain, inspect a synthetic pitch map, ask a voice or typed follow-up, and run a clearly labeled counterfactual that withdraws only the affected claim. If the live room is unavailable, the page opens an explicit interactive demo rather than pretending to be synchronized.

Watch's transparent `overlay.html` and Pocket Director use Azure SSE and read-only capabilities. Broadcast cues expire from the overlay after six seconds; the phone retains the last received reviewed moment and labels a stopped session. Production proof output polls its persisted authority every second and works independently of the producer tab until its thirty-minute expiry. Public AI drafts do not go directly to air. A commercial rendering partner is not connected.

Truth Lab's actual-frame Azure vision review receives JPEGs without authored observations or generation prompts. Results remain **unverified candidates**, separate from match statistics. It is not continuous automatic event detection or calibrated tracking.

## Evidence and deployment

`docs/proof/synthetic-validation.json` reports 100 held-out seeds (1001–1100). It establishes internal consistency, not real-league calibration. The tests cover cutoffs, source/revision isolation, localization, streaming, budget races, handoffs, worker recovery, stale-write rejection, authorization and corrupted data.

`node scripts/production-smoke.mjs <Azure origin> --full` writes credential-free deployment receipts to `docs/proof/live-production-proof.json`. Metrics are measured duration and reported tokens, not invented dollar costs or judging scores. The eight-case comparison found equal catalog and citation compliance. The crew's measured advantage is operational: independently persisted stages, deterministic calculation, claim-level correction, partial recovery and a separate Foundry referee. Human writing preference remains unmeasured.

Azure OpenAI (`gpt-4o-mini`), Container Apps, Blob Storage and managed identity are reused. A dedicated Microsoft Foundry project reuses the existing `texasgpt-prod` deployment; the project itself does not provision another model. The effective shared daily request ceiling is reported by `/api/health`; a date-bound override can temporarily raise the normal ceiling. Two crew requests can be in flight, with zero-to-one hosting replicas. Normal film playback makes zero automatic model requests. A fresh synthetic production round uses four crew requests and one Foundry referee request; exact-evidence results are reused. Usage controls are not a currency cap or a guarantee of remaining credits.

Configuration: `AZURE_CLIENT_ID`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT`, `FOUNDRY_PROJECT_ENDPOINT`, `FOUNDRY_MODEL`, `AZURE_STORAGE_URL`, `AI_DAILY_LIMIT`, `ALLOWED_ORIGINS`, `PORT`. Frontend `api-config.json` contains only the public API origin. See [deployment instructions](docs/DEPLOYMENT.md) for the parameterized script, Bicep template and existing-resource prerequisites. Publish the static Site through its managed source workflow. Docker includes `api/` and `dist/`.

To regenerate coordinate films, set `RENDER_FILMS=1`, run `node server.mjs`, open `/__studio`, and use `scripts/encode-films.ps1`. Player cutouts, gait and camera choreography are illustrative. Asset prompts and provenance remain in the repository.

General broadcast eventing, inferred identity on unenrolled footage, camera-calibrated speed, xG, independent human preference, production-scale resilience and partner rendering remain outside the implemented prototype. The controlled marker-video detector is a development demonstration and fails closed on unfamiliar footage. The creator confirmed permission to keep the generated film published on October 15, 2026; that confirmation is recorded in the [asset rights register](docs/ASSET-RIGHTS.md) and does not grant third-party redistribution rights. See the judge guide for the recording plan.

One-day request top-ups: set `AI_DAILY_LIMIT_OVERRIDE_DATE` to a UTC date (YYYY-MM-DD) and `AI_DAILY_LIMIT_OVERRIDE` to the approved total ceiling for that date. Health and request reservations use the same ceiling. The override expires automatically at midnight UTC; `AI_DAILY_LIMIT` remains the normal daily ceiling. Existing usage counters are never reset.

Current navigation: Watch → Match Centre → Match Lab → Truth Lab → Presenters → Security → Inside BTR. Match Lab leads with the continuous measured training minute and its measurement-assurance receipts; the optional full-match generator remains a separate workspace. Starting and stopping uses cancellation-safe run ownership so a late connection cannot revive a match after leaving the page. See `docs/proof/match-lab-verification.json` and `docs/proof/v146-tracking-holdout.md` for checks and verification limits.


Version 40 opens a complete guided synthetic match without paid AI requests. Measured evaluation results and real archived tool receipts are visible in Inside BTR. See the reviewer release notes for the partial benchmark, current editorial safeguards, optional-media distribution, illustrated walkthrough and remaining human verification.
