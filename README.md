# Before the Roar

## Current studio edition

The original charcoal-and-red Watch page is preserved. Match Centre, The presenters, Truth Lab and Inside BTR share that broadcast identity. The presenter portraits are photorealistic fictional AI characters, generated with the built-in ImageGen tool and delivered as approximately 84–91 KB WebP assets. Original images and prompts are retained in `artwork/` and `image-prompts-studio.json`.

Match Centre now includes a sequence scoreboard, calculated pass/shot metrics, replayable completed-event cards, and side-by-side beginner, math and tactical explanations in English, Spanish and Portuguese. Those instant sequence explanations use authored localization and calculations; they do not claim to be new AI calls. The existing Azure discussion and full-match narrative services remain the AI components.

Inside BTR demonstrates Ingest → Interpret → Explain → Render → Personalize. A production preview changes language and audience using the same evidence. JSON screen cues include clock, cutoff, expiry, revision and evidence references. JSONL exports contain fictional player metadata, completed events, authored observations, 1 Hz tracking and any additional exact tracking samples needed to resolve the cue's citations. No event or sample beyond the playhead is exported. A downloadable project brief explains the problem, implementation, demo route, Azure services and remaining integrations. `#presenters`, `#centre`, `#truth` and `#inside` open the corresponding sections directly.

Verification: 44 tests cover the existing Azure/data pipeline and the new export citation integrity, temporal cutoffs, localized outcomes, correction handling and denominator math. Browser checks cover desktop and phone layouts, live sequence controls, public role navigation, language/audience controls, evidence correction and downloads. The additional pages add no paid services or model calls. Automatic video event detection, inferred player tagging, calibrated pass difficulty, Fabric and a broadcast rendering partner remain unimplemented.

## Broadcast + AI watch party (current homepage)

The dark broadcast room puts the film first, with compact timed lower thirds and Scout, Guide, Vector, Check and Host beside it. Viewers can ask a clip-specific question after the final frame, replay cited moments, open a newcomer or math explanation, hide the party for a larger picture, and optionally hear completed contributions through available browser voices. Text streams as drafts; no paid speech service is added. `broadcast-room.js` and `broadcast-room.css` implement this homepage.

The homepage now puts the creator-provided Google Flow film, timed explanations, five audience modes, English/Spanish/Portuguese story content, evidence replay and a five-role Azure AI discussion in one studio. `/live.html` redirects to this homepage. The full-match generator is available through the in-page Full-match lab; it remains a separate fixture and its statistics are never attributed to the film. The earlier film library remains at `/films.html`.

On play, `/api/desk` prepares five sequential, streaming Azure OpenAI calls: Scout (tactics), Guide (newcomer education), Vector (measurement literacy), Check (evidence review) and Host (audience synthesis). Each receives the earlier public contributions and the original evidence. These are application roles on the same deployment, not independent model providers or a display of private chain-of-thought. Their public editorial messages cite the five manually reviewed clip observations. They do not analyze pixels. The discussion is revealed at the clip's end; after that it remains explicitly a full-clip discussion while evidence links seek to earlier frames. The timed lesson always follows the current video cursor.

Each fresh audience/language/question discussion uses at most five model requests and shares the existing 120/day reservation store and two-call capacity with the match narrator. Identical concurrent requests share work; fully successful discussions are persisted in the existing private cache. Invalid output, unavailable AI or an exhausted allowance replaces drafts with explicitly labeled reviewed notes. Browser-local reuse avoids another request on replay. Server restarts can interrupt an active discussion; the viewer can retry. Audience changes queue a conversation; superseded queued selections are skipped. Questions are limited to 180 characters and included in the cache key.

Film math shows playback fraction and intervals between approximate annotations; it explicitly withholds speed, xG, pass accuracy and match score because the film has no calibrated tracking. These examples are separate from the actual synthetic-distance calculations in the full-match lab. No paid video generation or speech service was added.

Verification: `npm test`; `node scripts/desk-smoke.mjs <Azure origin> en fan` exercises the real sequential model calls, evidence references and streaming. A cached verification returns posts immediately and correctly emits no artificial token stream.

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

## Previous reference-inspired match room
The navy and lime interface uses a compact fixture bar, original illustrated AI personas, a room/narrative switch, role-specific contribution selection, a persistent reviewed-moment timeline, and clip-derived fact cards. Persona activity reflects actual generation status. Clean feed hides broadcast graphics without changing playback. The synthetic match lab shares the same visual theme. This historical layout has been superseded by the broadcast room and five-specialist desk below.

## Match Centre, presenters and Truth Lab
Match Centre uses three authored 36-second scenarios for 22-player positions, player focus, completed-pass connections, shot locations, and binned event density. Its playhead is shared with Truth Lab and Inside BTR and remains independent of the featured film. Truth Lab applies the defender tracking correction, withdraws the affected movement claim, and exports exact event/tracking references. Supported counts are deterministic checks, not AI accuracy or confidence. Presenter profiles show the five fictional AI personas and their latest public film contributions, without extra model calls.

## Five-specialist desk

The Presenters tab shares role definitions with the actual Azure prompts in `dist/presenter-profiles.js`. Every profile includes expertise, working evidence, a three-step method, handoff, limits and a prefilled sample question. These describe application capabilities, not invented human qualifications. Photorealistic portraits are fictional and documented in `image-prompts-studio.json`.

Guide has a curated English/Spanish/Portuguese glossary linked to the reviewed carry, shot and goalkeeper observations. Vector receives deterministic calculations from `api/desk-tools.mjs`: carry-to-shot annotation gap 1.30 s and shot-to-keeper annotation gap 1.20 s. These are approximate annotation intervals, not ball travel, goalkeeper reaction time or shot speed. Calculations are attached by the server after model output validation and rendered with units and source links; the model cannot alter the tool payload. Check receives all three specialists; Host receives all four prior contributions.

Version 3.1.2 uses the five-role v2 cache schema, rejects legacy three-role cached results, and preserves the existing shared 120-request daily limit. A fresh conversation uses up to five model calls; a cache hit uses none. The same existing Azure model and services are reused.

Task-adherence guards require Guide to include a definition, Vector to address timing and measurement, and Check to name a preceding specialist. These conservative checks do not prove factual correctness; failed checks produce labeled reviewed notes and are not cached.
