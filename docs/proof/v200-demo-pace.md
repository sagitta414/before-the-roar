# v200 judge video: narration pace

The v199 edit fixed drift but retained fast source narration. The v200 cut slows the same Azure Speech voice recordings to 0.82x with pitch-preserving `atempo`, extends each scene and its focus cues by 1.21x, and recalculates captions against the slowed speech pauses. It keeps the full-frame application footage and the ball-following opening circle.

- Runtime: 114.7 seconds, below the two-minute judging limit.
- Spoken script: 214 words. Whole-video average: 112 words per minute, including intentional pauses and visual holds.
- Audio master: 114.587 seconds, equal to the sum of scene durations. Final audio and video streams start within 0.034 seconds of each other.
- The source voice WAVs, source footage, scene times, hashes, and edit boundaries are recorded in [`demo/showcase-v200/judge-provenance.json`](../../demo/showcase-v200/judge-provenance.json).
- The narration remains edited demo audio. It is not a live specialist voice or proof of model quality.

Verification: v200-specific test passed; 364 repository tests passed; syntax and format checks passed. A contact sheet of the exported video was visually inspected across the story. The public deployment should be checked separately after release.
