# Before the Roar

A football storytelling prototype with a photorealistic AI film and an evidence-led synthetic match replay: watch the play, follow the public editorial discussion, inspect the math, and challenge a claim.

## Run and verify

- `npm run studio`: backend and site at http://127.0.0.1:4397. Without Azure configuration, clearly labeled match notes replace unavailable AI.
- `npm run dev`: static authoring preview at http://127.0.0.1:4396.
- `npm test`: 70 tests covering temporal cutoffs, corrections, localization, source integrity, streaming, caching, role adherence and API boundaries. Empty event windows return notes without model calls.
- `node scripts/cohesive-smoke.mjs <Azure origin> false` and `true`: exercise original/corrected discussions against the live model. These consume up to three model requests each unless cached.

## The main experience

Watch, Match Centre, Presenters, Truth Lab and Inside BTR share the charcoal-and-red broadcast design. A single session carries the scenario, clock, tracking revision, language, viewing mode, club and selected player. Preferences persist locally; playback and corrections reset on a fresh visit. Each of the three authored sequences lasts 36 seconds.

Watch opens with **Pitchside / Veo Quality**, an eight-second close-up generated in Google Flow from a frame of the creator's original film. The 1080p deliverable is upscaled from 720p, at 24 fps. Four approximate, manually reviewed markers follow the duel, touches, run and loss of the ball from the camera frame. No pass, shot, keeper action, score, calibrated speed or player identity is established by this clip. The original generator watermark is preserved. This release reuses the completed asset; it generates no additional video.

`/api/clip-desk` streams three model contributions using only this film's annotations through the playhead. Vector calculates time intervals; Check states the source limits. The film's clock, citations, discussion cache and exports are isolated from the synthetic match. The default automatic discussion begins after the final frame; viewers can ask about an earlier cutoff. Preferences are shared, while navigating to Match Centre or Truth Lab selects the synthetic data study. The Watch source selector returns to the film.

The three **Synthetic match / data replay** MP4s were rendered from synthetic player and ball ground coordinates on a 105 x 68 m pitch. Gait, ball loft, body poses and cameras are illustrative choreography. Corrected tracking opens a synchronized tactical replay; the original film is never relabeled as corrected. No real Premier League match data is included.

The creator's original photorealistic eight-second Google Flow film remains available at `original.html`. Its five manually reviewed observations do not supply calibrated speed, tracking, score or shot outcome. The seeded full-match generator is available as an optional study inside Inside BTR. These additional studies identify their own data scope.

## Editorial handoffs and speed

`/api/match-desk` streams Scout and Guide concurrently, publishes Vector's calculations and Check's explicit scenario-claim verdict, then passes all four contributions to Host. A fresh main-sequence discussion uses three model calls. Two meaningful checkpoints per sequence trigger discussions automatically; instantaneous localized explanations update between them. Actual first-text and completion timings are visible. Streaming reduces waiting but cannot eliminate model startup, network latency or cold starts.

Scout interprets tactics; Guide begins with a verified definition; Vector shows deterministic arithmetic; Check retains, qualifies or withdraws a specific authored claim; Host synthesizes the preceding public contributions. Check is a rule-based evidence editor, not a general semantic validator. These public editorial contributions are not private model reasoning. Portraits represent fictional personas, without invented human qualifications.

Generated prose cannot insert numeric metrics, individual player names or source IDs outside the evidence cutoff. Code renders actor names, units and statistics. These guards reduce specific errors but do not prove semantic truth. Drafts are labeled, and a failed response is replaced by labeled match notes. Cache hits appear immediately without fabricated typing.

## Explain, render, personalize

Five modes cover fans, newcomers, math, tactical analysis and player focus. Narrative content supports English, Spanish and Portuguese. All 22 fictional players and both clubs are selectable. Truth Lab chapters and corrections follow the same language and revision. A correction withdraws the affected movement claim while retaining unaffected passes and shot outcomes; it does not rerun the match's decisions.

Recaps and JSON evidence packages use the current cutoff. Earlier discussion citations remain resolvable, while future events and incompatible revisions are excluded. Inside BTR demonstrates Ingest -> Interpret -> Explain -> Render -> Personalize, provides a project brief, and exports synthetic JSONL datasets and timed screen cues.

`overlay.html` supplies a transparent lower third with six-second expiry and a live preview. BroadcastChannel synchronizes it within the same browser and storage partition. A separate renderer process receives the URL's initial snapshot only; a broadcast partner is not connected.

Match Centre uses generated turf and a four-figure fictional player atlas. The reused cutouts are illustrative and enlarged for visibility, not individual likenesses or inferred video tracking. Asset prompts and provenance are retained in `image-prompts*.json` and `dist/assets/featured-provenance.json`.

## Azure and usage controls

The existing Container Apps backend uses managed identity for Azure OpenAI and private Blob Storage. A persistent cache, in-flight deduplication, two-call capacity and shared ETag-protected 120-request daily allowance limit repeated usage. Hosting scales from zero to one replica. The allowance is a usage safeguard, not a spending cap or a guarantee of subscription credits. This update adds no paid services.

The optional full-match generator streams a seeded ninety-minute fixture in sixty seconds or three minutes. It computes metrics as events arrive, generates AI narratives at fifteen-minute match checkpoints, and automatically produces a full-time recap. Twelve fixtures are reproducible. Its session tokens, stream/export boundaries, expiry and deterministic fallbacks are tested; interrupted sessions require a new match.

`dist/api-config.json` selects the cloud API for the static Site. An empty base URL uses the same-origin backend. Environment variables include `AZURE_CLIENT_ID`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_STORAGE_URL`, `AI_DAILY_LIMIT`, `ALLOWED_ORIGINS` and `PORT`. Never put credentials in frontend files. Existing deployment scripts are in `scripts/`.

## Scope still to build

Automatic video event detection, inferred player identification, calibrated pass difficulty, xG, an external match feed, Fabric integration, durable session recovery, broad semantic evaluation and production broadcast integration remain unimplemented. Pass speed is a straight-line average from synthetic coordinates, not a calibrated peak measurement. This is a tested prototype, not a validated football inference model.

## Reproduce the synthetic films

Install dependencies, set `RENDER_FILMS=1`, run `node server.mjs`, open `/__studio`, and choose Render all clips. The loopback-only authoring endpoint writes WebM files under ignored `tmp/films/`. `scripts/encode-films.ps1` uses FFmpeg to create the production 1280 x 720 MP4s and poster frames. Visitors do not need a Three.js runtime or paid video-generation service.
