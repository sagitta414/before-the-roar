# Before the Roar — judge-facing submission draft

> **ARCHIVED — DO NOT COPY INTO DEVPOST.** This v186 draft contains an older demo URL and predates the current product. Use [the current submission draft](HACKATHON-SUBMISSION.md) instead. The four Azure model specialists named below describe the synthetic-match discussion, not the separate film desk.

**Status:** Draft for review. This file does not enter the hackathon or accept its terms.

## One-line pitch

Before the Roar turns fictional football events into a correctable, personalized broadcast story: five public specialist roles investigate a moment, show their evidence, respond to a viewer's challenge, and revise the line when the evidence changes.

## What we built

A public web app and mobile companion take a synthetic match through Watch, Understand, Measure, Challenge and Publish. The cinematic 60-second film gives the audience a football-first entry. It comprises eight separately generated Google Flow/Veo shots edited by the creator and is **companion coverage**, not a continuous measured match or a source for calibrated statistics. A separate synthetic match replay and controlled fixed-camera sample provide the measured event, identity and speed demonstrations.

Scout observes the reached football evidence; Guide explains the concept; Vector calculates from structured records; Check challenges claims against the same source; Host prepares the audience-facing line. Scout, Guide, Check and Host each make a distinct Azure OpenAI request in the synthetic match. Vector is deterministic. A Microsoft Foundry referee is an advisory review path, not an extra specialist speaking in every discussion. The AI desk distinguishes a live model request from a deterministic calculation, saved replay and reviewed fallback.

Truth Lab tests whether the story survives changed evidence. In the featured synthetic case, the defender's recorded lateral displacement changes from 13.0 m in R1 to 0.0 m in R2. The movement claim is withdrawn while two completed passes and 23.7 m of forward passing gain survive. This tests evidence dependence; it does **not** prove that the run did or did not cause a football action.

The output includes time-linked captions and machine-readable cues for a production screen, with audience modes for a newcomer, analyst, player follower and other viewers, plus English, Spanish and Portuguese. Pocket Director can display the corrected revision on a paired phone; preparation, export and confirmed delivery remain separate states.

## Microsoft technology and architecture

Azure Container Apps serves the public experience and API. Microsoft Entra managed identity obtains access to Azure OpenAI, the Foundry project and private Azure Blob Storage. Blob checkpoints preserve resumable public contributions and evidence records. The app applies bounded request quotas, deterministic claim checks and an advisory Foundry review. The Secure page distinguishes implemented controls from roadmap products; the project does not claim a formal security audit or a broadcast-partner integration.

## Why this matters

A scoreline tells a fan what happened, but not what was actually observed, calculated or still uncertain. BTR connects the viewing moment to its source and makes a correction visible across audience experiences. New fans get a football explanation; technical viewers can inspect the calculation and limitation. Producers receive an output whose evidence revision can be checked before release.

## Demo and proof

- **Public app:** https://before-the-roar.icypebble-9d6c9f05.eastus2.azurecontainerapps.io/
- **Public source:** https://github.com/sagitta414/before-the-roar
- **Under-two-minute judge cut:** [public YouTube video](https://youtu.be/jW7dTK7g1v4) — 1:55, captioned. The [app preview](https://before-the-roar.icypebble-9d6c9f05.eastus2.azurecontainerapps.io/?demo=1&cut=short#watch) shows the same cut.
- **Required public video URL for the hackathon form:** https://youtu.be/jW7dTK7g1v4
- **Exact fresh execution:** [`demo/showcase-v186/live-sequence.json`](../demo/showcase-v186/live-sequence.json) records three public rounds, 12 Azure model requests, five posts per round, no fallback and a changed R2 Host line. The cut visualizes those receipts; it is an edited video, not an uncut 115-second browser session.
- **Video provenance:** [`demo/showcase-v186/judge-provenance.json`](../demo/showcase-v186/judge-provenance.json) separates fresh receipts, older app recordings, the AI film and edited Azure Speech narration.

## Testing instructions for judges

1. Open the public app and enter Watch. Play the AI-generated film; its notes are tied to reviewed visible moments, not measured player tracking.
2. Choose the synthetic match to follow the authored measured source. Open the AI desk to inspect live, replay, deterministic and recovery receipts. A fresh question uses the shared daily model allowance; the reviewed path remains available when new generation is unavailable.
3. In Measure, load the included fictional evaluation clip. The compatibility gate and marker-based detection run on this controlled fixed-camera video. They are not validated for arbitrary broadcast footage.
4. In Challenge, compare R1 and R2 by setting the defender displacement to zero. Confirm the movement claim is withdrawn while the two pass records remain.
5. In Publish, inspect the audience line and evidence revision. Prepare the output; check its separate export and phone-delivery states before claiming either occurred.

## Suggested screenshots

1. Film leading Watch with the Watch Party alongside it.
2. AI desk showing four Azure specialist receipts and deterministic Vector.
3. Truth Lab's R1 13.0 m versus R2 0.0 m, withdrawn claim and retained passes.
4. Pocket Director on R2 in New to Football mode.
5. Publish with revision and delivery-state labels; Secure architecture as supporting proof.

## Evidence limits and final checks

- No independent human result yet shows the crew's commentary is preferred to a single model. The 12-call run is a development demonstration of execution and correction, not an accuracy score.
- The controlled synthetic video supports enrolled marker identities and metrics; unfamiliar broadcast-video accuracy is unestablished.
- The cinematic film and measured source must not be represented as one calibrated continuous match.
- Confirm the final edit contains no uncleared real-club marks, sponsor logos, player likenesses, music or font notices. The creator has confirmed permission for the existing film, but the final exported cut still needs an asset-by-asset check.
- Verify the public site, public GitHub repo, approved video-host URL and free judge access through the judging period. Complete the actual hackathon form before October 27, 2026 at 11:59 p.m. Pacific. No Devpost submission has been performed by this repository.

Official requirements: [Microsoft Premier League Hackathon rules](https://github.com/microsoft/insidethegamehackathon/blob/main/OFFICIAL%20RULES.md).
