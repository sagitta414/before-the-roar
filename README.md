# Before the Roar

An interactive football storytelling prototype: synthetic match replay, evidence-linked explanations, audience modes, English/Spanish narratives, player focus, tracking correction, geometric alternative, and recap/overlay export.

## Run

`npm run dev` serves http://127.0.0.1:4396. `npm test` checks the engine. No installation or credentials required. Static site lives in `dist/`.

## Scope

The default featured experience is the creator's 8-second Google Flow football clip, optimized from 1080p (25.5 MB) to 720p (6.4 MB), with original audio and five manually reviewed approximate timestamps. Its own annotation module drives English/Spanish casual, analyst and No. 8 perspectives, evidence seeking, recap and timed JSON export. Match clock, score, tracking metrics and shot outcome are intentionally unassigned. Its annotations are independent of the synthetic data lab below. No automated video analysis or live narrative model is connected. Provenance: `dist/assets/featured-provenance.json`.

Three independent 36-second synthetic scenarios, each beginning at 0–0. Player positions are interpolated from authored keyframes on a 105×68 m pitch, sampleable at 25 Hz. Metrics use only completed events before the playback cursor. The narrative engine is deterministic, with authored English/Spanish variants. **No live AI model, real match footage, external data feed, or broadcast rendering integration is connected.**

The alternative freezes winger/defender positions to compare geometry; it does not recalculate player decisions or outcomes. Corrections withdraw unsupported defender-displacement claims. Recaps include the explored portions of independent scenes, not a full-match outcome. Exports carry synthetic provenance, times, expiry, audience, revision, and evidence IDs.

## Next integration

Replace narrative templates with a server-side structured-generation adapter receiving the bounded evidence packet; validate every emitted player, number, timestamp and evidence reference. Preserve deterministic metrics, temporal cutoffs, revision handling and fallback templates. Add scenario variation and evaluation data before claiming football generalization.

## Cinematic visual edition

The data lab's Match film view plays three real H.264 MP4 files rendered locally with Three.js. Each is 36 seconds at 1280×720 and follows the same synthetic player and ball ground coordinates as the tactical view. Body gait, goalkeeper poses, ball loft and camera are illustrative choreography. No paid generation API is used. Video time drives the story cursor and buffering pauses story progression. Tactical exposes the data geometry; analyst/player modes and correction/alternative actions open it automatically. The original film cannot be selected while corrected tracking is active. Quiet view pauses playback. Original ImageGen assets remain as portrait art and historical visual references; provenance is in `image-prompts.json`.

To reproduce films: `npm install`, set `RENDER_FILMS=1`, run `node server.mjs`, open `/__studio`, and click **Render all clips**. The loopback-only authoring server saves WebM files under ignored `tmp/films/`. Run `scripts/encode-films.ps1` with FFmpeg on PATH to create production MP4s and poster frames. The static deployment exposes no recording endpoint and requires no Three.js runtime on visitors' devices.

Visual direction draws on Crave Frame's dark image-led composition and the contrasting controls of the MajorKey guided workshop, adapted to a forest-green and lime football broadcast style.
