# Before the Roar

An Azure-powered football storytelling prototype with a live synthetic match stream, evidence-linked AI explanations, five audience perspectives, English/Spanish/Portuguese narratives, automatic full-time recaps and timed overlay exports. Original match films and tactical replay labs remain available separately.

## Azure live studio

Open `/live.html`. Start a seeded fictional fixture to stream a ninety-minute match in sixty seconds (or three minutes). Events arrive incrementally; the server computes the score, shots, completed passes, event-possession share and a simple recent-recovery rhythm heuristic. Every fifteen match minutes, an evidence packet is frozen at that cutoff and sent to the existing Azure OpenAI `gpt-4o-mini` deployment. One structured response provides fan, newcomer, math, analyst and Mateo Silva perspectives. Full time triggers an automatic recap. Language is selected before kickoff; audience changes reuse the same response.

The backend (`api/server.mjs`) runs on Azure Container Apps, uses managed identity for Azure OpenAI and private Blob Storage, and exposes no API key. A private persistent response cache reuses identical seed/language/initial-perspective/checkpoint results. An ETag-protected budget blob limits new model requests to 120 per UTC day, across restarts. Hosting scales from zero to one replica; at most six sessions and two concurrent AI requests are allowed. Saturation, unavailable AI, invalid outputs or exhausted allowance produce explicitly labeled deterministic fallbacks. Existing AI, registry and Consumption infrastructure are reused. This is a usage safeguard, not a spending cap or a guarantee of available subscription credits.

Metrics and displayed factual summaries are computed in code in each supported language. The model supplies the headline and explicitly labeled tactical interpretation; the app supplies every factual summary directly from code. Model draft prose cannot contain digits; evidence identifiers must exist at the exact temporal cutoff. These checks do not prove semantic truth, so tactical interpretations and evidence limits remain visible. The generator has twelve reproducible fixtures; tests cover bounded coordinates, chronology and plausible shot totals. This is a simulation prototype, not a calibrated football model. No video event detection, player tracking inference, xG, calibrated pass difficulty, external match feed or broadcast partner integration is claimed. The featured film is separate from this generated event stream.

`npm run studio` starts the backend at http://127.0.0.1:4397. Without Azure configuration it runs with clear fallback narratives. `dist/api-config.json` selects the cloud API for the public static Site; an empty base URL uses the same-origin backend. `scripts/provision-azure.ps1` and `scripts/deploy-azure.ps1` document the verified subscription deployment. Environment variables: `AZURE_CLIENT_ID`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_STORAGE_URL`, `AI_DAILY_LIMIT`, `ALLOWED_ORIGINS`, `PORT`. Never put credentials in the frontend.

Session tokens protect stream/export/stop routes and are kept in browser memory. Exports contain only ingested events, exact metrics, model provenance, evidence citations and the latest timed overlay contract. Sessions expire after fifteen minutes and stop after a minute without a viewer. An interrupted stream requires a new match in this prototype. Cold starts and model latency add time beyond the sixty-second event simulation; the UI reports the actual analysis cutoff.

## Run

`npm run dev` serves http://127.0.0.1:4396. `npm test` checks the engine. No installation or credentials required. Static site lives in `dist/`.

## Replay scope (separate from the live studio)

The default featured experience is the creator's 8-second Google Flow football clip, optimized from 1080p (25.5 MB) to 720p (6.4 MB), with original audio and five manually reviewed approximate timestamps. Its own annotation module drives English/Spanish casual, analyst and No. 8 perspectives, evidence seeking, recap and timed JSON export. Match clock, score, tracking metrics and shot outcome are intentionally unassigned. Its annotations are independent of the synthetic data lab below. No automated video analysis or live narrative model is connected. Provenance: `dist/assets/featured-provenance.json`.

Three independent 36-second synthetic scenarios, each beginning at 0–0. Player positions are interpolated from authored keyframes on a 105×68 m pitch, sampleable at 25 Hz. Metrics use only completed events before the playback cursor. The narrative engine is deterministic, with authored English/Spanish variants. **No live AI model, real match footage, external data feed, or broadcast rendering integration is connected.**

The alternative freezes winger/defender positions to compare geometry; it does not recalculate player decisions or outcomes. Corrections withdraw unsupported defender-displacement claims. Recaps include the explored portions of independent scenes, not a full-match outcome. Exports carry synthetic provenance, times, expiry, audience, revision, and evidence IDs.

## Remaining integrations

The live studio implements bounded structured AI generation; replay narratives remain authored. Next steps include a verified video-eventing adapter, calibrated football models, a broadcast rendering partner, broader semantic evaluation and durable session recovery. Do not present these as implemented.

## Cinematic visual edition

The data lab's Match film view plays three real H.264 MP4 files rendered locally with Three.js. Each is 36 seconds at 1280×720 and follows the same synthetic player and ball ground coordinates as the tactical view. Body gait, goalkeeper poses, ball loft and camera are illustrative choreography. No paid generation API is used. Video time drives the story cursor and buffering pauses story progression. Tactical exposes the data geometry; analyst/player modes and correction/alternative actions open it automatically. The original film cannot be selected while corrected tracking is active. Quiet view pauses playback. Original ImageGen assets remain as portrait art and historical visual references; provenance is in `image-prompts.json`.

To reproduce films: `npm install`, set `RENDER_FILMS=1`, run `node server.mjs`, open `/__studio`, and click **Render all clips**. The loopback-only authoring server saves WebM files under ignored `tmp/films/`. Run `scripts/encode-films.ps1` with FFmpeg on PATH to create production MP4s and poster frames. The static deployment exposes no recording endpoint and requires no Three.js runtime on visitors' devices.

## Network studio experience

The interface uses original BTR branding in a sports-broadcast direction: red, graphite, silver and white, compact match graphics, angled lower thirds and bold condensed headlines. A selectable story rundown connects directly to the featured film and three tactical scenarios. Match center, Explore and Your recap connect the player, white analysis desk and highlight cards. Lab scenarios open in tactical view; their photographic covers are illustrative. Phone layouts place analysis after the player, with expandable event sequences and horizontally scrolling chapters and rundown. Recaps and studio explanations share the visual system. All active styling is in `dist/broadcast.css`.


## Learn along and streamed commentary

New to football explains the latest generated pass, shot, goal, recovery or pressure event in plain language. Show the math uses live pass totals to demonstrate the denominator and percentage rounded directly from the original fraction; a completed pass unlocks Euclidean distance and speed with units. Zero attempts is explicitly undefined. These guides are instant and work without AI. English, Spanish and Portuguese guides are included.

Azure Chat Completions streams structured JSON over SSE. Only the selected interpretation fields are extracted and relayed as `dialogue` frames; raw JSON and model drafts are never exported. The initial perspective is generated first. Concurrent identical requests share one generation and receive the same fragments. The UI labels partial prose as unvalidated, then replaces it with the validated response or withdraws it on failure. Switching perspectives never mixes text from different audiences or checkpoints; the live-text checkbox can hide intermediate drafts. Cached responses appear immediately without a fake typing animation.

Streaming reduces time to first text; it cannot remove model startup, content-filter buffering, network delay or hosting cold starts. AI still runs at fifteen-minute checkpoints to respect the existing request allowance. Instant learning guides update between checkpoints.
