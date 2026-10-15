# Before the Roar — judge demonstration

**Positioning:** An explainable football studio for different kinds of fans. A small editorial team retrieves bounded evidence, calculates in code, qualifies a claim and publishes an audience-specific explanation. Its work survives an interrupted worker and a corrected source record.

Public application: https://before-the-roar.sagitta107.chatgpt.site

## Recording plan — 110 seconds

Prepare an original proof run and its OBS browser output before recording. This avoids spending the submission video waiting for a cold Azure instance. Show saved receipts as saved receipts; do not present them as live generation. Keep the final recording below two minutes.

| Time | Show | Say |
| --- | --- | --- |
| 0–20s | Watch, full-minute playback; an evidence citation | “A football story should help you see the play differently. This generated film has reviewed observations; the synthetic match supplies measured statistics.” |
| 20–40s | Match Centre: beginner, math, Spanish | “The same evidence becomes a plain-language explanation, a calculation with units, or a tactical reading. Personalization changes the explanation, not the facts.” |
| 40–65s | Inside BTR: Correct the tracking; the separate OBS output | “A revised tracking record withdraws the movement claim. Passes remain intact. The source revision reaches the on-screen caption.” |
| 65–90s | Test recovery, Resume saved work; public receipts and model requests | “An actual worker exception interrupts this run. The next worker reloads the specialists from Blob Storage and finishes the handoff. Playback is independent.” |
| 90–110s | Generate & validate seed 107; Export proof | “Every fixture is reproducible. Every decision has evidence, revision and tool receipts. The complete audit and dataset are downloadable.” |

## Reproduce the five improvements

1. **Tool-backed specialists:** Watch → Discuss this moment → Inside the AI desk. The log records model-selected tools and source IDs. Scout and Guide run concurrently; Host receives their actual public contributions, Vector's calculation and Check's verdict. This is a custom Node workflow with Azure OpenAI function calls, not Microsoft Agent Framework or a Foundry Agent Service deployment.
2. **Correction propagation:** Inside BTR → Run the desk → Correct the tracking. The persistent ledger retains the earlier reading. The new revision changes the caption immediately; Run the revised desk regenerates AI commentary using only that revision. Old work is retained in the exported proof, not treated as current.
3. **Recovery:** Test recovery throws after saving the specialists. Resume creates a fresh worker. A successful test makes four requests before interruption and two afterwards, instead of repeating the first four. Degraded agents are retried; completed contributions and tools are reused. Browser reload restores the current proof session for its remaining lifetime.
4. **Data innovation:** Generate a seed from 1–1,000,000. The ninety-minute fixture includes passes, pressure, recoveries, carries, shots, restarts and halftime. Validation checks continuity, bounds, units and restart rules. The pass-difficulty index is an explicitly uncalibrated heuristic, not a probability of success. Download includes provenance and results.
5. **Broadcast and judging evidence:** Open read-only OBS output, change language and perspective, export proof. The output uses deterministic evidence-bound captions and polls the persisted authority every second. It is independent of the producer's tab after creation, expires after thirty minutes, and clears stale cues after six seconds. The existing Watch output uses SSE.

## What the proof does and does not establish

The tests demonstrate bounded citations, deterministic arithmetic, recovery without duplicate completed requests, stale-write rejection, read/write capability separation, and correction propagation. The 100 held-out seeds establish internal consistency. They do not establish real-league calibration or comparative superiority over a well-prompted single model. The engineering advantage demonstrated is reusable intermediate work and an enforceable source revision.

Three roles use the model. Vector and Check are deterministic specialist components. Public discussion and tool receipts are not private chain-of-thought. The observed tool choice is model-driven; the workflow and handoff order are fixed in code.

The photorealistic minute remains an edit of independently generated shots. It is not continuous observed match play. Film annotations and synthetic statistics have separate provenance. Sampled-frame vision review remains unverified; automatic eventing, inferred player identity, calibrated video speed, xG, Fabric and a rendering-partner integration are not claimed.

## Evidence files and checks

- `npm test` — functional tests, including worker replacement and corruption rejection.
- `npm run validate:data` — regenerate `docs/proof/synthetic-validation.json` from seeds 1001–1100.
- `node scripts/production-smoke.mjs <Azure origin> --full` — consumes up to twelve model requests for original and revised discussions; saves measured receipts to `docs/proof/live-production-proof.json`. It verifies audience/language caption changes without additional model requests.
- `docs/proof/live-production-proof.json` — real deployment results when present; no capability keys are exported.
- `docs/proof/live-verification.json` — observations from the October 15 deployed verification: recovery passed with six requests; the revised discussion used labeled reviewed notes for two rejected AI responses. The approved twelve-request allowance was consumed and the daily setting restored to 120. Subsequent Spanish, math and dataset browser checks made no model calls.

## Submission preparation still owned by the participant

Record and publish the final under-two-minute demonstration, confirm eligibility and project start provenance, and review rights to generated kit markings, music and third-party assets. Verify a public GitHub repository containing the final implementation. No Devpost submission or legal acceptance is performed by this build.

Official rules: https://github.com/microsoft/insidethegamehackathon/blob/main/OFFICIAL%20RULES.md
