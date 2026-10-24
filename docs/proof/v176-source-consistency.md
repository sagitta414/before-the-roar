# v176 — source consistency and review corrections

This release fixes a reproduced local-source correction failure. The measured-video evidence view and uploaded-clip Publish view now share one revision owner. Withdrawn event IDs survive subsequent detector updates; original detector records remain available. A new source explicitly resets the ledger.

## Verification

- 310 automated tests pass; syntax and API formatting checks pass.
- New behavioral regression exercises source ingestion, detection, measured Truth Lab withdrawal, Publish packet inspection, repeated detection, and source exit.
- Browser walkthrough on localhost: load included fictional sample → compatibility passed → analyze → first detected pass → Truth Lab → withdraw → Publish displays **No cue released**, **Claim withdrawn**. Accessibility output announces the withdrawal. Leaving the local source restores the cinematic workspace.
- Playback element identity is retained when new evidence arrives; a detector tick no longer remounts the local video.
- Film accessibility transcripts contain only reached film annotations. They no longer narrate synthetic match measurements from a different source.

## Presentation and editorial changes

- Local source workspaces hide unrelated cinematic/match content. Publish leads with a readable cue preview; JSON starts collapsed.
- Understand uses distinct pre-play beginner, tactical and math guidance with smaller typography.
- Pocket status derives from reached evidence. Film player identity is unverified; no synthetic player tracks are drawn over a film explanation. Film playback stays at the shared evidence cutoff.
- Architecture animation is labeled illustrative/implemented rather than evidence of a live model execution. AI Desk remains the execution authority.
- The stale 301-test badge is replaced with a regression-suite label. Model-role counts distinguish film from synthetic match workflows.
- Same-role follow-ups now also pass the existing lexical insight-overlap gate. This is a narrow repetition check, not semantic verification or evidence that the crew outperforms a baseline. Editorial cache keys were versioned.

## Remaining limits

Local clips remain on their originating device. Phone pairing is explicitly unavailable while a local clip is active, and an existing pairing is stopped to prevent wrong-source output. This release does not claim local-upload phone synchronization.

No new independent human commentary ratings, unfamiliar broadcast-video accuracy results, or photorealistic calibrated footage were produced. The v175 demonstration film remains a recording of that release; it has not been recaptured for v176. These are open evidence and demo tasks, not resolved by passing software tests.
