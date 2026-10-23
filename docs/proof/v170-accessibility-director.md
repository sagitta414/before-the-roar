# v170 Accessibility Director

BTR now translates one evidence-bounded match moment into multiple configurable delivery modes. The desktop studio exposes Accessibility Director from every route; Pocket Director carries the same profile model into the paired mobile experience.

## Implemented

- Six starting profiles: standard, blind or low vision, Deaf or hard of hearing, clear and calm, hands-free or motor support, and sensory safe.
- Reviewed audio descriptions tied to the cinematic playhead, with plain-language alternatives.
- An interactive descriptive transcript with eight timestamped moments, click-to-seek navigation and a text download.
- Rich-caption integration with the existing reviewed visual-description track.
- Visible pressure and possession signals, optional spatial tones, and distinct haptic patterns for pressure, possession, shot candidates and evidence corrections.
- Large text, stronger contrast, large targets, reduced motion, quieter presentation and lower film ambience.
- `Alt+A` access, keyboard-operable controls, screen-reader live status, and optional voice commands.
- Truth Lab emits an explicit accessibility correction event when the changed record is applied.
- Shared on-device preferences between the desktop studio and Pocket Director.

## Evidence boundary

Accessibility changes delivery, never facts. Descriptions are authored against the fictional cinematic sequence. Haptic and visual live signals fire only when matching evidence reaches the current cutoff. The transcript does not claim continuous automatic interpretation of arbitrary video. Browser speech, vibration, stereo panning and speech recognition remain device-dependent and can be disabled.

## Verification

`tests/accessibility-director.test.mjs` checks distinct profiles, preference composition, playhead-linked descriptions, correction language and integration on both surfaces. The full project test and syntax suites cover the release.
