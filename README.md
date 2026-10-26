# Before the Roar

**Watch the play. Understand the evidence. Correct the story.**

BTR is an explainable football studio built around fictional football. It connects a cinematic viewing experience, bounded specialist commentary, controlled video measurement, evidence correction, personalized output and a mobile companion.

## Start here

- [Live application](https://before-the-roar.icypebble-9d6c9f05.eastus2.azurecontainerapps.io/)
- [Pocket Director](https://before-the-roar.icypebble-9d6c9f05.eastus2.azurecontainerapps.io/pocket-director.html)
- [Release evidence and limitations](docs/RELEASE.md)
- [Judge walkthrough](docs/JUDGE-DEMO.md)
- [Current submission draft](docs/HACKATHON-SUBMISSION.md)
- [Independent viewer review](https://before-the-roar.icypebble-9d6c9f05.eastus2.azurecontainerapps.io/review-v182.html)

Open Watch for the cinematic film and its Watch Party. The separate 60-second defining-moment demonstration is opt-in. The five main stages are **Watch → Understand → Measure → Challenge → Publish**. Engineers and Secure are supporting proof destinations.

## What the sources mean

| Source | Supported use | Not established |
| --- | --- | --- |
| Cinematic film | Reviewed visible actions and scene-local discussion | Continuous match play, calibrated speed, enduring player identity or tactical causality |
| Synthetic match records | Deterministic positions, pass calculations, changing evidence and recaps | Real-league calibration or causal proof |
| Controlled synthetic video | Enrolled-marker tracking, pass/shot candidates, calibrated ground-plane measurements | General broadcast-camera recognition, aerial ball speed or unrestricted player identification |
| Uploaded clip | Compatibility check, supported local measurements or reviewed cues | Automatic compatibility with arbitrary football videos |

The photorealistic minute is an edit of eight independently generated shots. Its measurements are never borrowed from the separate synthetic match. No real Premier League match data is distributed.

## AI and Microsoft architecture

Azure Container Apps hosts the application and API. Microsoft Entra managed identity authenticates service access. Azure OpenAI executes the specialists. Azure Blob Storage retains checkpoints and evidence. Microsoft Foundry provides a separate advisory review of public outputs. Validated cues reach Watch, Pocket Director and a timed browser/OBS overlay.

The film desk makes separate Scout, Guide and Host model requests. Vector calculates and Check applies deterministic evidence rules. The synthetic-match desk uses four model roles with Vector remaining deterministic. Receipts distinguish fresh model work, replay, calculation, recovery and reviewed fallback. Public role handoffs are not private chain-of-thought.

Film prose is withheld until validation. Host has a source-specific editorial assignment, and a bounded repair can precede a labelled reviewed fallback. These checks reduce particular failures; they do not prove general semantic truth or superiority to a single model.

## The distinctive feature

Truth Lab changes one synthetic observation, recalculates the affected value, withdraws the unsupported movement claim and revises the audience story while preserving unaffected pass records. It tests dependence on evidence. It does **not** establish why a footballer moved.

Pocket Director shares source revision and reached evidence. Local-upload pairing sends bounded evidence, not video bytes; it does not provide remote uploaded-video playback. Accessibility includes descriptive narration, captions/transcripts, reduced motion, visual signals and optional supported-device haptics.

## Evidence and current limits

- [Frozen controlled-video holdout](docs/proof/v146-tracking-holdout.md): 39 of 40 events matched across five procedural cases. A low-light miss is retained. This is not an unfamiliar broadcast-video benchmark.
- [Unfamiliar-domain rejection](docs/proof/external-video-results.json): withholding behavior, not event-detection accuracy.
- [Prior live commentary record](docs/proof/v181-intent-and-host.md): preserves failures and fallbacks rather than labelling them model successes.
- Independent human commentary preference remains unproven. Automated test counts are software-reliability evidence, not audience-quality scores.
- The final release record identifies new verification, source hashes and remaining gates. Earlier reports are historical evidence and are not silently re-labelled current.

## Video package

The in-app **Watch Demo** button offers the [1:55 naturally paced full-frame judge cut](dist/assets/before-the-roar-judge-v201.mp4) and the earlier expanded product tour (v185). The cut keeps the complete application visible while timed circles and outlines point to the moment under discussion. It shows the cinematic film, separate measured replay, current Understand view, a saved public-app opening discussion, then [one public browser capture](demo/showcase-v187/capture.json) of a viewer challenge, Truth Lab tracking correction, and fresh corrected round. Those two captured discussions used eight Azure model requests; Vector remained deterministic. AI desk receipts, Pocket Director, current Accessibility Director and Publish views, and the architecture complete the tour. The [v201 provenance](demo/showcase-v201/judge-provenance.json) identifies each source and edit. Azure AI Speech narration was added in editing, not generated live by the agents. This is a development demonstration, not independent evidence that the crew outperforms one model.

## Run and verify

```sh
npm ci
npm run studio
npm test
npm run check
npm run format:check
```

The local studio defaults to port 4397. Without Azure configuration it displays labelled reviewed notes. Live verification scripts require explicit `--live` and remain subject to the existing model allowance.

See [deployment](docs/DEPLOYMENT.md), [asset rights](docs/ASSET-RIGHTS.md) and [historical README](docs/archive/README-pre-v182.md). No Devpost submission or legal acceptance is performed by this repository.
