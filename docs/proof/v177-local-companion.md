# v177 — uploaded evidence on a paired phone

## Delivered

Local-source pairing now sends a bounded evidence packet through the existing expiring broadcast rooms. The read-only phone page shows the source hash, observation timestamp, revision, candidate event, experimental distance/speed and explicit qualification. No video bytes, filenames, arbitrary commentary or blob URLs enter that packet. The source hash is an identifier, not independent verification.

Withdrawals remove the phone's metrics and claim. Reconnection receives the current revision. A lower revision cannot replace a newer correction. Pairing is capped, token-protected and expires under the existing broadcast-room policy; changing between local and match sources stops the old pairing. The uploaded experience does not offer remote video playback or phone-side AI discussion.

## Verification

- 319 automated tests passed, including nine new contract/benchmark tests. Syntax and API formatting checks passed.
- Local integrated API/browser walkthrough: fictional sample → compatibility pass → first detected pass (24.0 m, 51.0 km/h) → pair → phone receives revision 3 → withdraw → phone revision 4 with no metrics → reload phone → same withdrawal. Restore/withdraw again produced revisions 5/6 without reloading. Starting a replacement pairing ended the old phone session.
- Mobile-width browser screenshot inspected. This is browser verification, not a physical-iPhone claim.
- The 3:53 full showcase retains v175's product demonstrations and adds a 14-second continuous phone correction recording before the architecture ending. Desktop alongside it is explicitly labeled a reference capture. Azure HD narration is added in editing. The 1:54 judge cut remains v175. Provenance is in `demo/showcase-v177/provenance.json`.

## Still open

Independent human commentary superiority remains unproven. The public trial is the frozen v66 answer set, not a new v177 evaluation. No reviewer exports were supplied.

No newly annotated unfamiliar broadcast-style clips were supplied. The collection guide and hash-checking scorer are ready, but there is no new accuracy report. The scorer retains rejection outcomes and returns null for missing identity/speed measurements. Human annotation and independence still require curator verification.

See `docs/review-v177/collection-guide.md` for both collection workflows. No results were synthesized to fill these gaps.
