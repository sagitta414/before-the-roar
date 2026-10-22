# v163 — Feel the Match and Perspective Director

## What ships

Pocket Director includes an opt-in sensory match layer. A reached tackle or interception produces a possession cue, a reached shot produces a sharp cue, an explicit increase in the analysis pressure value produces a rising pulse, and a Truth Lab correction produces a double pulse. Harbor and Northbridge possession use different pulse envelopes and stereo positions. Spoken descriptions state the event or the selected player's straight-line displacement and retain the measurement limitation.

The four on-screen cue controls are labelled previews. They do not claim that an event occurred. Live cues are created only by comparing the previous reached event set with the current reached event set.

Perspective Director creates five deterministic recap packages: player, tactical, beginner, disputed claims, and a 20-second Spanish studio target. Each package includes a schema identifier, source cutoff, language, target duration, correction status, timestamped overlays and narration, source IDs, and limitations. The JSON export contains the same object rendered on screen.

## Boundaries

- Browser vibration, stereo audio, speech synthesis and autoplay support vary by device. BTR reports this as device support, not match evidence.
- Vibration hardware does not expose physical left/right direction on common browsers. Direction is communicated through a different pulse envelope and, when supported, stereo audio pan.
- Spatial descriptions are generated from synthetic tracking already present in the current story. They do not infer unrecorded movement.
- Recaps never read records after the displayed cutoff. A requested editorial duration is a target package length, not a claim that a longer source window exists.
- This release does not claim clinical accessibility certification. It provides an inspectable multimodal interaction prototype for evaluation with users who have visual impairments.

## Verification

`tests/pocket-accessibility-v163.test.mjs` verifies distinct cue patterns, evidence-triggered detection, movement wording, cutoff filtering, player filtering, correction status and the Spanish 20-second package. The Pocket Director structural test verifies that the controls and export path ship in the public page.
