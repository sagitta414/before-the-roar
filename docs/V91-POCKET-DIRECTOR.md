# Pocket Director verification

Pocket Director is the mobile second screen for the existing BTR match session. It is reached directly at `pocket-director.html` or paired from the persistent **Pair Phone** control in the main app.

## Demonstrated path

1. Watch creates a short-lived broadcast room and displays a scannable QR code.
2. The QR contains the room ID and a read-only capability in the URL fragment, which is not sent in HTTP referrers.
3. The phone opens an authenticated SSE stream and receives the current source, evidence cutoff, match clock, revision, language, mode, team and selected player.
4. Beginner, math, tactical and player modes render from the same bounded match-story source.
5. **Show Me Why** separates observed records, calculated values, interpretation and evidentiary limit.
6. **Change the Evidence** creates a labeled local simulation. In the wide-run case, holding the defender in place withdraws the movement claim while retaining the run and completed passes.
7. A typed or device-voice question calls the existing evidence-bounded match or film desk and displays streamed specialist contributions.

## Reliability and limits

- Reader capabilities cannot update or stop a room. Rooms expire after 30 minutes and accept at most six connected readers.
- Cues carry no real match or real player data. All player names, positions and events are fictional synthetic records.
- A stopped connection retains the last reviewed moment and labels the session ended. An unreachable service opens an explicit **Demo mode**.
- The phone pitch is derived from the coordinate-rendered synthetic source. For the separately generated pitchside film, it is labeled as a companion illustration and is not presented as inferred video tracking.
- Browser voice recognition is optional. Typing remains available when the device does not expose speech recognition.
- A fresh AI follow-up consumes the same shared daily allowance as the main app. Changing view or opening evidence makes no model request.

## Verification

- `npm test`: all tests pass, including reader/writer separation and the extended cue contract.
- `npm run check`: source syntax checks pass.
- Browser QA at 390×844 confirmed readable layout, source map, dock navigation and no console errors on the companion page.
- Interaction QA confirmed distinct beginner wording, source-to-screen expansion and the expected counterfactual withdrawal.
