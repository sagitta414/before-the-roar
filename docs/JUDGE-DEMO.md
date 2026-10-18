# Before the Roar — judge demonstration

**Positioning:** An explainable football studio for different kinds of fans. A small editorial team retrieves bounded evidence, calculates in code, qualifies a claim and publishes an audience-specific explanation. Its work survives an interrupted worker and a corrected source record.

Public application: https://before-the-roar.sagitta107.chatgpt.site

Direct judge entry: https://before-the-roar.sagitta107.chatgpt.site/?judge=1#watch

Recommended cinematic demo: `demo/before-the-roar-cinematic-judge-demo.mp4` (1080p, 1:45)

The AI-generated football action remains visible for the complete cinematic cut. Agent execution, calculation, correction, Pocket Director and Foundry proof appear as broadcast overlays around it.

Evidence-led alternate cut: `demo/before-the-roar-judge-demo-v2.mp4` (1080p, 1:45)

Share copy: `demo/before-the-roar-cinematic-judge-demo-share.mp4` (720p)

## Current conversation demonstration — verified live capture

Open the guided match and choose **Try the live two-round discussion**. This hands off the original synthetic wide-run record at 67:16 without making a model request. Send the suggested opening question. Keep the streaming labels and evidence visible. When the round finishes, choose **Did the run cause it?** and inspect whether the new contribution identifies a useful distinction or specific missing evidence. The earlier round remains expandable. Export the conversation with both rounds.

The October 18 capture used four separate Azure requests for Scout, Guide, Check and Host. Vector calculated in code. The public run completed in 3.2 seconds and exposed each response ID, source set, handoff and latency in the AI desk. The demo then changed the defender's synthetic tracking from revision R1 to R2, reducing measured displacement from 13.0 m to 0.0 m. The pass calculation remained valid, the movement claim was withdrawn, and the revised explanation reached Pocket Director.

The recording does not replace a weak answer with a scripted answer or present cached playback as fresh generation. Its Foundry 46–45 comparison is labelled as a narrow model-scored result. Independent human review remains pending and is available through `study.html`.

## Current recording — 105 seconds

The V2 recording uses fresh public browser captures, the corrected Pocket Director state, conversational Azure Speech narration and burned captions. The cinematic shots remain clearly labelled companion footage; the measured replay and tool receipts provide the evidence.

| Time | Show |
| --- | --- |
| 0–13s | Lead with live football action and the question BTR must prove |
| 13–46s | Show the fresh four-request specialist run and execution receipts |
| 46–73s | Change one tracking record; withdraw the claim and revise the story |
| 73–92s | Deliver the correction to Pocket Director and show the Foundry comparison with its limit |
| 92–105s | Show Azure production controls and the direct judge entry |

For technical questions, open Inside BTR and replay saved recovery. Its pause illustrates the recorded handoff, without a new worker failure or model request. A live Test recovery remains a separate operation requiring available AI allowance; it uses up to four requests. Do not present receipt playback as a fresh live recovery test.

## Reproduce the five improvements

1. **Tool-backed specialists:** Watch → Discuss this moment → Inside the AI desk. The log records model-selected tools and source IDs. Scout, Guide, Check and Host make separate sequential Azure requests; Vector calculates in code. Host receives their actual public contributions. A project-scoped Microsoft Foundry referee then evaluates the public trace and exposes its own response ID, scores and limitation. This is custom Node orchestration with an ephemeral Foundry Responses evaluator, not a hosted Foundry agent or private chain-of-thought display.
2. **Correction propagation:** Inside BTR → Run the desk → Correct the tracking. The persistent ledger retains the earlier reading. The new revision changes the caption immediately; Run the revised desk regenerates AI commentary using only that revision. Old work is retained in the exported proof, not treated as current.
3. **Recovery:** Test recovery throws after saving the specialists. Resume creates a fresh worker. The current workflow uses three requests before interruption and one afterwards, reusing Scout and Guide. Degraded agents are retried; completed contributions and tools are reused. Browser reload restores the current proof session for its remaining lifetime.
4. **Data innovation:** Generate a seed from 1–1,000,000. The ninety-minute fixture includes passes, pressure, recoveries, carries, shots, restarts and halftime. This is an event-only export with event coordinates; it does not contain continuous player tracking. The separate authored 36-second sequence exports 1 Hz synthetic player samples. Validation checks continuity, bounds, units and restart rules. The pass-difficulty index is an explicitly uncalibrated heuristic, not a probability of success. Download includes provenance and results.
5. **Broadcast and judging evidence:** Open read-only OBS output, change language and perspective, export proof. The output uses deterministic evidence-bound captions and polls the persisted authority every second. It is independent of the producer's tab after creation, expires after thirty minutes, and clears stale cues after six seconds. The existing Watch output uses SSE.

## What the proof does and does not establish

The tests demonstrate bounded citations, deterministic arithmetic, recovery without duplicate completed requests, stale-write rejection, read/write capability separation, correction propagation and the Foundry referee contract. The 100 held-out seeds establish internal consistency. The eight-case comparison found equal automated catalog and citation compliance. BTR's demonstrated advantage is persisted specialist work, enforceable source revision, partial recovery, deterministic calculation and inspectable second-line evaluation—not general prose superiority or independent human preference.

Four crew roles use separate model requests. Vector is deterministic. Check receives the deterministic claim verdict and cannot override it. The Foundry referee is a fifth, separate model request over public outputs. Public discussion and tool receipts are not private chain-of-thought; workflow and handoff order are fixed in code.

The photorealistic minute remains an edit of independently generated shots. It is not continuous observed match play. Film annotations and synthetic statistics have separate provenance. Sampled-frame vision review remains unverified; automatic eventing, inferred player identity, calibrated video speed, xG, Fabric and a rendering-partner integration are not claimed.

## Evidence files and checks

- `npm test` — functional tests, including worker replacement and corruption rejection.
- `npm run validate:data` — regenerate `docs/proof/synthetic-validation.json` from seeds 1001–1100.
- `node scripts/production-smoke.mjs <Azure origin>` — uses four model requests for interruption and recovery; verifies correction, read/write isolation and personalized captions without additional model calls. `--full` adds four requests for a fresh corrected discussion. Saves measured receipts to `docs/proof/live-production-proof.json`.
- `docs/proof/live-production-proof.json` — real deployment results when present; no capability keys are exported.
- `docs/proof/live-verification.json` — observations from the October 15 deployed verification: recovery passed with six requests; the revised discussion used labeled reviewed notes for two rejected AI responses. The approved twelve-request allowance was consumed and the daily setting restored to 120. Subsequent Spanish, math and dataset browser checks made no model calls.

## Submission preparation still owned by the participant

Record and publish the final under-two-minute demonstration, confirm eligibility and project start provenance, and review rights to generated kit markings, music and third-party assets. Verify a public GitHub repository containing the final implementation. No Devpost submission or legal acceptance is performed by this build.

Official rules: https://github.com/microsoft/insidethegamehackathon/blob/main/OFFICIAL%20RULES.md
