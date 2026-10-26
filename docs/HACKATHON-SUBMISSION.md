# Before the Roar — current submission draft

**Status:** Ready for the creator to review and paste into the hackathon form. This file is not the submitted form. Check the form itself before the deadline.

## Elevator pitch

Before the Roar turns synthetic football events into a live, personalized story that viewers can challenge. Its AI crew shows what it observed, what it calculated, and what remains uncertain. When the evidence changes, the explanation and production output change with it.

## What we built

The public web app follows one play through Watch, Understand, Measure, Challenge, and Publish. Watch leads with a one-minute fictional football film and time-linked commentary. The film is eight edited AI-generated shots; it is **not** a continuous measured match. A separate synthetic match and controlled fixed-camera training clip provide the structured events, player identities, passes, and speed measurements. BTR labels those sources so a statistic is never silently attributed to the cinematic film.

For the synthetic match, Scout observes the reached evidence, Guide explains the football idea, Vector calculates from structured records **without a model request**, Check challenges unsupported inferences, and Host synthesizes a broadcast-ready answer. Scout, Guide, Check, and Host each make a distinct Azure model request and hand off evidence. The film desk uses a different, smaller workflow: Scout, Guide, and Host make model requests; its evidence checks are deterministic. The AI desk distinguishes live requests, saved replay, code calculations, and fallback.

Truth Lab is the defining interaction. Change a synthetic defender displacement from 13.0 m to 0.0 m and compare the original and revised evidence side by side. The defender-movement claim is withdrawn; two completed passes and 23.7 m of forward passing gain remain. This tests whether an explanation survives changed evidence. It does not establish why the defender moved or prove football causation.

Fans can choose newcomer, tactical, math, or player-focused views, plus language and accessibility options including color-vision palettes and an evidence-bounded Accessible Replay. Pocket Director can display the corrected story on a paired phone. Publish prepares timed, machine-readable overlays and audience-specific lines, showing preparation, export, and delivery as separate states.

## Microsoft technology

Azure Container Apps hosts the app and API. Microsoft Entra managed identity accesses Azure OpenAI and private Azure Blob Storage. Azure Blob checkpoints support recovery and evidence history. The Foundry referee is an advisory review path, not an extra voice in every round. Deterministic claim guards and receipts limit what reaches an audience. The Secure page labels implemented capabilities and roadmap items separately.

## Why it matters

A scoreline cannot tell a new fan what to watch next or a producer which sentence is safe to put on screen. BTR gives each audience a useful level of explanation and a way to inspect its source. The same correction propagates through the crew discussion, fan view, and proposed broadcast output.

## Links and testing

- **Public app:** https://before-the-roar.icypebble-9d6c9f05.eastus2.azurecontainerapps.io/
- **Public GitHub repository:** https://github.com/sagitta414/before-the-roar
- **Current judge video:** https://before-the-roar.icypebble-9d6c9f05.eastus2.azurecontainerapps.io/assets/before-the-roar-judge-v201.mp4 (full-frame 1:55 MP4 with full-screen product footage, a brief two-view Understand dissolve, a ball-following opening circle and timed highlights, burned-in captions, and added Azure AI Speech narration)
- **Video provenance:** [scene sources, hashes, and edit boundaries](../demo/showcase-v201/judge-provenance.json)

To evaluate, start in Watch and play the film. Switch to the synthetic match and inspect one specialist discussion and its AI desk receipts. In Measure, load the included fictional evaluation clip; the marker-based detector is for controlled fixed-camera footage. In Truth Lab, change the defender record and compare R1 with R2. Then inspect the revised audience line and delivery states in Publish. On a phone, open Pocket Director for the beginner and accessibility views.

## Evidence limits

The current edited video demonstrates the workflow, including the updated Understand, Publish and color-vision controls, with full-screen discussion and receipt captures. Accessible Replay remains best inspected in the live app. The filmed 8-request two-round capture is a development demonstration, not independent evidence that the crew beats one model. The controlled synthetic detector is not validated for arbitrary unfamiliar broadcast video. The cinematic film and measured source are separate. No real Premier League match data is supplied by the app.

Verify the final public links and actual hackathon form before **October 27, 2026 at 11:59 p.m. Pacific**. This repository draft is not evidence of submission. [Official rules](https://github.com/microsoft/insidethegamehackathon/blob/main/OFFICIAL%20RULES.md).
