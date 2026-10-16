# Audience verification protocol

## v43 paired viewer test

Open `https://before-the-roar.sagitta107.chatgpt.site/study.html`. Invite 5–8 willing viewers yourself, including newcomers and regular fans. No invitations are sent by the application or assistant. Ask them to work alone without coaching. Use their first completed attempt only.

Each participant receives two short scenarios: one with records alone and one with the same kinds of records plus the crew's explanation. Four random assignments balance scenario and condition order. Each scenario has three objective questions, followed by a usefulness rating and optional feedback. Answer feedback appears only after both tasks. The explanatory content is explicitly labeled saved AI, calculated or reviewed; it is not fresh model generation.

The app collects no name or email and sends no responses to a server. Participants explicitly consent, download their anonymous JSON and choose whether to share it. Do not publish raw free-text feedback without reviewing it for volunteered identifying details.

Combine actual participant exports with `node scripts/summarize-viewers.mjs participant1.json participant2.json`. The importer checks the schema and assignments, rejects duplicate participant IDs, and recalculates scores from answers. Report counts, sample size, familiarity and failures. Task duration includes reading and answering; it is not studio production time saved. Small samples, different scenarios, practice effects and varying reader experience limit causal conclusions.

Automated form verification and synthetic test fixtures are never participant results. No real human responses are bundled with this release.

## Moderated usability checks

No user study has been performed or invented. Use the public guided match for these tasks with a newcomer, a football fan and a studio producer. Record participant-provided feedback only with their permission; do not send messages automatically.

1. Open the app without instructions. Can the participant start the guided match within 15 seconds?
2. After Measure, ask what 23.7 metres represents. Success: forward gain from completed passes, not running distance or chance quality.
3. Apply the correction. Ask what changed and what stayed intact. Success: the movement claim changes; the pass events remain.
4. Switch language and beginner/math perspectives. Ask whether the evidence changed. Success: the explanation changes, the facts do not.
5. Enter Match Lab. Ask whether this is the same match as the guided sequence or film. Success: it is a separate seeded fixture.

Record task completion, time, incorrect interpretations, and direct participant comments. Do not convert a developer walkthrough into a user-satisfaction score. The app's optional feedback download stays local; it does not silently transmit or aggregate personal data.

Suggested acceptance target before submission: all three participants distinguish the sources and correctly explain the correction. Report the real sample size and failures.
