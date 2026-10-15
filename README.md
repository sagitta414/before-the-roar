# Before the Roar

A football storytelling prototype with a photorealistic AI film and an evidence-led synthetic match replay: watch the play, follow the public editorial discussion, inspect the math, and challenge a claim.

## Run and verify

- `npm run studio`: backend and site at http://127.0.0.1:4397. Without Azure configuration, clearly labeled match notes replace unavailable AI.
- `npm run dev`: static authoring preview at http://127.0.0.1:4396.
- `npm test`: 97 tests covering temporal cutoffs, corrections, localization, source integrity, streaming, caching, concurrent daily-budget creation, role adherence and API boundaries. Empty event windows return notes without model calls.
- `node scripts/cohesive-smoke.mjs <Azure origin> false` and `true`: exercise original/corrected discussions against the live model. These consume up to three model requests each unless cached.

## The main experience

Watch, Match Centre, Presenters, Truth Lab and Inside BTR share the charcoal-and-red broadcast design. A single session carries the scenario, clock, tracking revision, language, viewing mode, club and selected player. Preferences persist locally; playback and corrections reset on a fresh visit. Each of the three authored sequences lasts 36 seconds.

Watch opens with **Pitchside / 60-second film**, a broadcast-style edit of eight independently generated Google Flow shots (seven Veo 3.1 Quality sources; the final retry model is unconfirmed). Seven new eight-second sources join the existing eight-second duel; the player-gesture shot is trimmed to four seconds. The web film is 1280 × 720 at 24 fps with normalized crowd audio. The public player streams it from the existing Azure origin, whose HTTP 206 byte-range responses support seeking; the Sites asset host returned HTTP 200 for ranged requests. Eighteen approximate, manually reviewed markers cover duels, passes, a carry, defending, a goalkeeper catch and a gesture. Cuts do not establish continuous play, player identity or causality. Match score and calibrated physical speed remain unverified. Generated branding is not evidence of club affiliation. Source and edit provenance are in `dist/assets/pitchside-minute-provenance.json`.

`/api/clip-desk` streams three model contributions using only this film's annotations through the playhead. Vector derives local player balance and scene-specific reception counts from structured manual annotations; Check states the source limits. Unknown defending-player counts, pass-attempt denominators and shot origins remain unknown. No team pass-accuracy or save percentage is inferred from a single receiving action. The film's clock, citations, discussion cache and exports are isolated from the synthetic match. Automatic discussions begin at 6, 22, 46 and 60 seconds; viewers can ask about an earlier cutoff. A full uncached viewing uses at most twelve model requests; shared cache hits use none. The source selector is global. Navigation preserves the selected source, both playheads, language and review revision. Film-specific Match Centre and Truth Lab views replay the same footage and observations. The coordinate-based study requires an explicit source change.

The three **Synthetic match / data replay** MP4s were rendered from synthetic player and ball ground coordinates on a 105 x 68 m pitch. Gait, ball loft, body poses and cameras are illustrative choreography. Corrected tracking opens a synchronized tactical replay; the original film is never relabeled as corrected. No real Premier League match data is included.

The creator's original photorealistic eight-second Google Flow film remains available at `original.html`. Its five manually reviewed observations do not supply calibrated speed, tracking, score or shot outcome. The seeded full-match generator is available as an optional study inside Inside BTR. These additional studies identify their own data scope.

## Editorial handoffs and speed

The reading layout gives the conversation a compact crew toolbar, expandable evidence and calculation sections, and settings for language, voice and response diagnostics. Streaming preserves the reader's scroll position; a new discussion starts at the top. Supporting pages use a compact title and the shared fixture bar, with the pitch above secondary metrics. The film has eight explicit chapter cues; its underlying shots and generated kit markings have not been replaced.

Scout supplies an observation, Guide a definition and a viewing question, Vector the calculation, Check the challenge, and Host a short synthesis with a required, validated replay-cue field. Reviewed closing notes have separate copy in each language. An exact/near-copy check replaces obviously repeated Host output with labeled reviewed notes without an additional model call. This is a lexical safeguard, not a semantic novelty guarantee. Versioned discussion cache keys prevent old contributions from being reused under the new prompts.

`/api/match-desk` streams Scout and Guide concurrently, publishes Vector's calculations and Check's explicit scenario-claim verdict, then passes all four contributions to Host. A fresh main-sequence discussion uses three model calls. Two meaningful checkpoints per sequence trigger discussions automatically; instantaneous localized explanations update between them. Actual first-text and completion timings are visible. Streaming reduces waiting but cannot eliminate model startup, network latency or cold starts.

Scout interprets tactics; Guide begins with a verified definition; Vector shows deterministic arithmetic; Check retains, qualifies or withdraws a specific authored claim; Host synthesizes the preceding public contributions. Check is a rule-based evidence editor, not a general semantic validator. These public editorial contributions are not private model reasoning. Portraits represent fictional personas, without invented human qualifications.

Generated prose cannot insert numeric metrics, individual player names or source IDs outside the evidence cutoff. Code renders actor names, units and statistics. These guards reduce specific errors but do not prove semantic truth. Drafts are labeled, and a failed response is replaced by labeled match notes. Cache hits appear immediately without fabricated typing.

## Explain, render, personalize

Five modes cover fans, newcomers, math, tactical analysis and player focus. Narrative content supports English, Spanish and Portuguese. All 22 fictional players and both clubs are selectable. Truth Lab chapters and corrections follow the same language and revision. A correction withdraws the affected movement claim while retaining unaffected passes and shot outcomes; it does not rerun the match's decisions.

Recaps and JSON evidence packages use the current cutoff. Earlier discussion citations remain resolvable, while future events and incompatible revisions are excluded. Inside BTR demonstrates Ingest -> Interpret -> Explain -> Render -> Personalize, provides a project brief, and exports synthetic JSONL datasets and timed screen cues.

`overlay.html` supplies a transparent lower third with six-second expiry and a live preview. Azure SSE synchronizes independent browsers and OBS browser sources. A 30-minute room has separate read-only renderer and publisher keys, input validation, source/revision updates, reconnect snapshots, six-second stale-cue expiry, stop, bounded clients and an IP creation limit. Links carry only the read key in the URL fragment. Keep the producer open; server restarts end ephemeral rooms. A commercial rendering partner is not connected.

Match Centre uses generated turf and a four-figure fictional player atlas. The reused cutouts are illustrative and enlarged for visibility, not individual likenesses or inferred video tracking. Asset prompts and provenance are retained in `image-prompts*.json` and `dist/assets/featured-provenance.json`.

## Independent vision review

Truth Lab sends up to four actual JPEG frames from the selected shot to Azure OpenAI vision. Samples are at 1 Hz, never beyond the cutoff and never across an editorial cut. The model does not receive manual observations or generation prompts. Its bounded, cited candidate remains unverified and separate from match statistics. Candidate exports include the sampled frames and provenance. Calls share the existing two-request capacity, persistent cache, deduplication and daily budget; UI requests are explicit. This is sampled-frame review, not calibrated tracking or reliable automatic event detection.

## Azure and usage controls

The existing Container Apps backend uses managed identity for Azure OpenAI and private Blob Storage. A persistent cache, in-flight deduplication, two-call capacity and shared ETag-protected 120-request daily allowance limit repeated usage. Hosting scales from zero to one replica. The allowance is a usage safeguard, not a spending cap or a guarantee of subscription credits. This update adds no paid services.

The optional full-match generator streams a seeded ninety-minute fixture in sixty seconds or three minutes. It computes metrics as events arrive, generates AI narratives at fifteen-minute match checkpoints, and automatically produces a full-time recap. Twelve fixtures are reproducible. Its session tokens, stream/export boundaries, expiry and deterministic fallbacks are tested; interrupted sessions require a new match.

`dist/api-config.json` selects the cloud API for the static Site. An empty base URL uses the same-origin backend. Environment variables include `AZURE_CLIENT_ID`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_STORAGE_URL`, `AI_DAILY_LIMIT`, `ALLOWED_ORIGINS` and `PORT`. Never put credentials in frontend files. Existing deployment scripts are in `scripts/`.

## Scope still to build

Continuous automatic video eventing, inferred player identification, calibrated pass difficulty, xG, an external match feed, Fabric integration, durable session recovery, broad semantic evaluation and production broadcast integration remain unimplemented. Pass speed is a straight-line average from synthetic coordinates, not a calibrated peak measurement. This is a tested prototype, not a validated football inference model.

## Reproduce the synthetic films

Install dependencies, set `RENDER_FILMS=1`, run `node server.mjs`, open `/__studio`, and choose Render all clips. The loopback-only authoring endpoint writes WebM files under ignored `tmp/films/`. `scripts/encode-films.ps1` uses FFmpeg to create the production 1280 x 720 MP4s and poster frames. Visitors do not need a Three.js runtime or paid video-generation service.

## Continuity replacement status

A new 8-second Veo 3.1 Quality opening was generated on October 14, 2026 using 100 existing Flow credits (338 → 238). Three extension attempts failed in Flow with “Prompt must be provided”; none consumed additional credits. The reviewed minute remains the published film. The candidate is saved in the Flow project “BTR · One continuous play” and locally under ignored tmp/continuous-opening-candidate.mp4. It has plausible short passing, but is not a completed minute and does not replace the source evidence.

Discussion visibility is scoped to the current film scene: crossing a cut immediately shows that scene’s current reviewed notes, rather than retaining an earlier AI thread. Automatic checkpoints stay inside their scene and still use at most twelve model requests per complete viewing.


## Focused studio layout (v32)
The Watch room fits four complete reviewed contributions at 1280 × 720 in the checked scene, with full text and expandable evidence. Match Centre leads with reviewed local player balance and a compact replay. Truth Lab leads with the claim challenge and actual-frame Azure check; its full replay is expandable. 'Study one scene' pauses immediately before a cut and leaves the full reel available. The generated footage itself is unchanged; this mode does not make it continuous football.

## Connected play and editorial depth (v33)

Watch preserves the photorealistic film and defaults to one uncut scene at a time. Scene completion offers replay and next-scene controls. The complete 60-second reel remains selectable. This changes playback, not the underlying footage; no new continuous photorealistic minute has been created.

A prominent Follow one complete play action opens the pressure sequence at its first pressure sample. Watch and Match Centre share a replay map, calculations and the same playhead. Derived analysis includes pressure gap across the actual possession window (5–7s), net longitudinal passing gain from completed passes (excluding carries), and completed regain to shot release (18s in the pressure sequence, not 19s to goal arrival). Coordinate samples and arithmetic remain expandable. The final recap and its exported package include these calculations. Future outcomes remain withheld.

Each film scene has a specific claim challenge, a newcomer question and a football takeaway. Live model prompts receive a role-specific brief and the subjects reserved for other roles. Generic Host conclusions are rejected in favor of labeled reviewed notes; this is a targeted guard, not a guarantee of semantic novelty. Existing three-call discussions, streaming, caching and daily budget remain. No new paid services or video generation were added.

New completed synthetic events retire older discussions so earlier pressure math cannot remain on screen after a forward pass. Source changes conceal the prior video frame until the new media has loaded and finished seeking. Technique claims unsupported by coordinate endpoints and generic question-like Host conclusions are rejected to reviewed notes.
