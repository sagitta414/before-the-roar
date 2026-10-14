# Before the Roar

An interactive football storytelling prototype: synthetic match replay, evidence-linked explanations, audience modes, English/Spanish narratives, player focus, tracking correction, geometric alternative, and recap/overlay export.

## Run

`npm run dev` serves http://127.0.0.1:4396. `npm test` checks the engine. No installation or credentials required. Static site lives in `dist/`.

## Scope

Three independent 36-second synthetic scenarios, each beginning at 0–0. Player positions are interpolated from authored keyframes on a 105×68 m pitch, sampleable at 25 Hz. Metrics use only completed events before the playback cursor. The narrative engine is deterministic, with authored English/Spanish variants. **No live AI model, real video, external data feed, or broadcast rendering integration is connected.**

The alternative freezes winger/defender positions to compare geometry; it does not recalculate player decisions or outcomes. Corrections withdraw unsupported defender-displacement claims. Recaps include the explored portions of independent scenes, not a full-match outcome. Exports carry synthetic provenance, times, expiry, audience, revision, and evidence IDs.

## Next integration

Replace narrative templates with a server-side structured-generation adapter receiving the bounded evidence packet; validate every emitted player, number, timestamp and evidence reference. Preserve deterministic metrics, temporal cutoffs, revision handling and fallback templates. Add scenario variation and evaluation data before claiming football generalization.

## Cinematic visual edition

The default Cinematic view uses three original built-in ImageGen images with playback-synchronized pan and zoom. These are illustrative stills, not generated video and not visual evidence of the underlying synthetic tracking. The Tactical button opens the data-driven moving replay. Analyst/player modes and correction/alternative actions automatically open Tactical. Quiet view suppresses the camera motion. Original image assets are in `dist/assets/`; prompt and provenance records are in `image-prompts.json`.

Visual direction draws on Crave Frame's dark image-led composition and the contrasting controls of the MajorKey guided workshop, adapted to a forest-green and lime football broadcast style.
