# v178 functional integrity pass

Scope: preserve existing layouts, CSS, navigation, and controls. Correct source selection, evidence handling, and status reporting.

- Publish now uses the selected source and exact cutoff. Film publication requires an observation in the current shot; earlier shots do not supply its count. Source, cutoff, revision, language, or audience changes invalidate release state.
- Release means prepared, not confirmed audience delivery. Phone relay acceptance is not a phone acknowledgement. Overlay export remains a separate action. An unpaired phone is not reported as synchronized.
- Film editorial validation rejects the reported intent inference. Prompts request a retraction when intent is challenged and prohibit invented new observations. Reviewed fallback remains explicitly labelled. Film cache namespace changes to prevent reuse of older policy results.
- Watch receipts recognize the contribution events emitted by the current crew and classify each stage separately.
- Recaps omit empty record-type placeholders and include actual localized film observations. Lead recap citations cover its selected evidence records.
- Pocket Director distinguishes demo, reconnecting, and recently received live cues. Stopping pairing clears its delivery status.

Verification: focused source/cutoff, Spanish recap, and intent rejection regressions; full suite; syntax and API formatting checks; local browser Publish and Pocket checks. No CSS changes.

Still pending: independent human commentary ratings, annotated unfamiliar-broadcast detection accuracy, a fresh live two-round quality evaluation, and a refreshed demo recording. This patch does not establish commentary superiority or general broadcast detection. The existing demonstration video is unchanged.

Final validation: 323 tests passed, zero failed/skipped. Local browser confirmed Spanish event narration and overlay agree. Fresh deployed v178 opening: three Azure model contributions; follow-up: two Azure model contributions and one explicitly labelled Guide fallback. Host explicitly withheld intent. This is one smoke case, not independent quality evidence. Guide repair instructions were subsequently made more concrete; their live quality remains unmeasured.
