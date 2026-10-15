# Before the Roar

An explainable football studio: watch the play, follow a public editorial discussion, inspect the calculation, and challenge the evidence. A newcomer, an analyst and a numbers-focused fan get different explanations of the same source.

**Public app:** https://before-the-roar.sagitta107.chatgpt.site

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

- **Pitchside:** Default full-minute playback of eight independently generated shots, with optional scene study. Reviewed annotations, local-player balance and reception counts describe only visible actions. Cuts do not establish continuous play, identity, score or causality. Physical speed and team pass accuracy remain unknown. Provenance: `dist/assets/pitchside-minute-provenance.json`.
- **Synthetic replay:** Three authored 36-second sequences rendered from ground coordinates. Pass math, pressure gap, passing gain and regain-to-shot-release time come from the records. Corrected tracking opens a tactical replay, never a falsely relabeled film.
- **Full-match generator:** Ninety-minute fixtures, seeds 1–1,000,000, live events, checkpoint narratives and full-time recaps. Version 2 preserves ball origins between restarts, includes two periods and bounded carries, and restarts goals at centre. Its pass-difficulty index is a declared illustrative heuristic, not a calibrated probability.

The original creator film remains at `original.html`. No real Premier League match data is included. Generated kit markings are not affiliation or rights clearance. The full-minute film remains an edit, not one continuous coherent match sequence.

## Tool-backed editorial workflow

Scout and Guide run concurrently. Each model selects a bounded function tool: retrieve evidence, retrieve a deterministic calculation, or review earlier public claims. Tools cannot request arbitrary URLs or source selectors. The result is returned to the model before it writes. Host receives the other four public contributions. Vector calculates immediately; Check applies source rules to the explicit scenario claim.

Three roles use Azure OpenAI; two specialist components are deterministic. This is custom Node orchestration with Azure OpenAI function calls. Microsoft Agent Framework, Foundry Agent Service, MCP, A2A and Fabric integration are not claimed. Public receipts are operations and contributions, not private chain-of-thought.

Tool results, posts, claim revisions, tokens and receipts persist. A complete fresh discussion uses up to six model requests. Complete runs are reused without fabricated typing. Successful intermediate work is reused after failure; unavailable stages retry. Drafts are labeled and validated before final publication. Number, player-attribution, citation and repetition guards reduce specific errors without proving semantic truth.

## Correction and recovery

Inside BTR's production desk records the original reading and its withdrawal. Correcting tracking immediately updates the deterministic caption and separate OBS output. The revised AI discussion uses a new checkpoint namespace; prior contributions remain in the exported audit rather than appearing as current.

Test recovery throws an actual exception after the specialists are saved. Resume creates a fresh worker, reloads stored work and completes the handoff while the independent video continues. This is a worker interruption test, not an Azure shutdown. A successful run uses four requests before the fault and two afterwards. Automated tests replace both the worker and repository instance.

Blob ETags reject stale writes. Proof runs last thirty minutes, use distinct reader/writer capabilities, store only their hashes, and omit credentials from exports. Tab session storage restores the producer after reload. The ordinary full-match event stream is still ephemeral; it requires a new fixture after a backend restart. This upgrade makes editorial work durable, not every application service.

## Personalization and output

Fan, beginner, math, tactical and player modes support English, Spanish and Portuguese. All 22 fictional players and both clubs are selectable in the synthetic replay. Facts, denominators, units and source IDs survive personalization.

Watch's transparent `overlay.html` uses Azure SSE and six-second stale-cue expiry. Production proof output polls its persisted authority every second and works independently of the producer tab until its thirty-minute expiry. Both publish deterministic evidence-bound captions; AI drafts do not go directly to air. A commercial rendering partner is not connected.

Truth Lab's actual-frame Azure vision review receives JPEGs without authored observations or generation prompts. Results remain **unverified candidates**, separate from match statistics. It is not continuous automatic event detection or calibrated tracking.

## Evidence and deployment

`docs/proof/synthetic-validation.json` reports 100 held-out seeds (1001–1100). It establishes internal consistency, not real-league calibration. The tests cover cutoffs, source/revision isolation, localization, streaming, budget races, handoffs, worker recovery, stale-write rejection, authorization and corrupted data.

`node scripts/production-smoke.mjs <Azure origin> --full` consumes up to twelve model requests and writes credential-free deployment receipts to `docs/proof/live-production-proof.json`. Metrics are measured duration and reported tokens, not invented dollar costs or judging scores. The demonstrated advantage is reusable work and source-revision enforcement; comparative superiority over a single model has not been established.

Existing Azure OpenAI (`gpt-4o-mini`), Container Apps, Blob Storage and managed identity are reused. No new paid services are provisioned. Limits remain two in-flight model requests, 120 requests per UTC day and zero-to-one hosting replicas. Four automatic checkpoints in an uncached film viewing can use up to 24 model requests. Usage controls are not a currency cap or a guarantee of remaining credits.

Configuration: `AZURE_CLIENT_ID`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_STORAGE_URL`, `AI_DAILY_LIMIT`, `ALLOWED_ORIGINS`, `PORT`. Frontend `api-config.json` contains only the public API origin. Deploy with `scripts/deploy-azure.ps1 -Tag <version>`; publish the static Site through its managed source workflow. Docker includes `api/` and `dist/`.

To regenerate coordinate films, set `RENDER_FILMS=1`, run `node server.mjs`, open `/__studio`, and use `scripts/encode-films.ps1`. Player cutouts, gait and camera choreography are illustrative. Asset prompts and provenance remain in the repository.

Continuous eventing, inferred player identity, calibrated video speed, xG, broad semantic evaluation, production-scale resilience and partner rendering remain outside the implemented prototype. The participant still needs the final under-two-minute demo recording, rights review and submission. See the judge guide for the recording plan.
