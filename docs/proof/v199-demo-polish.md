# v199 demo repair

The earlier edit had two visible problems. Its opening red circle was fixed on the pitch while the ball moved away. Its Understand segment included a brief return to the welcome screen and intermittent lost glyphs in the recorded display font. The v199 circle follows five checked ball positions over the first two seconds; the Understand segment starts on the actual page and dissolves between two clear captured modes. Full application frames remain visible.

The narration drift had a measurable encoding cause: trimming the fourteen voice scenes by timestamp produced PCM segments 0.037333 seconds short each. Their concatenated master was 94.177333 seconds against 94.7 seconds of picture. The new renderer trims by exact sample count, joins the PCM once, and encodes the final soundtrack once. The v199 master and the final audio and video streams each measure 94.7 seconds. The first audio and video start times differ by 0.033 seconds.

The [video](../../dist/assets/before-the-roar-judge-v199.mp4), [verbatim caption file](../../demo/showcase-v199/judge.srt), [voice master](../../demo/showcase-v199/voice-master.wav), and [scene provenance](../../demo/showcase-v199/judge-provenance.json) make the timing check repeatable. The video is still an edited demonstration, and its two Understand frames are identified as screenshots in the capture record.
