# Controlled video tracking release

Match Lab now includes a continuous 60-second synthetic training MP4. Eight fictional players have enrolled colour markers. The browser detects marker/ball pixels in decoded compressed frames, maps them through fixed-camera ground-plane calibration, tracks motion, and infers possession transfers and directional shot candidates. It receives no authored action timetable or trajectories.

The detector uses classical colour segmentation and temporal rules, not a general learned football-video model. Names are roster enrollment, not facial recognition. Moving cameras, aerial-ball speed, arbitrary uploaded broadcasts and occluded identity recovery remain unsupported. The existing cinematic film is unchanged and does not inherit these measurements.

Pass difficulty uses release-time distance, receiver pressure and lane clearance in a logistic model trained on 2,400 procedural synthetic outcomes, evaluated on 800 held-out examples from that generator. Brier error 0.190 versus constant baseline 0.219 measures synthetic fit, not real-match accuracy.

Verification:
- 197 automated tests passed, including nine new tracking/model tests.
- Offline decoding: 600 frames; 8/8 expected events matched (six passes, two shot candidates); mean player position error 0.070 m; mean ball position error 0.165 m; mean event-speed absolute error 2.098 km/h.
- These measurements are development validation on this controlled capture, not an independent generalization benchmark.
- Browser full-minute playback: six passes and two shot candidates rendered from frame processing.
- Browser withheld-ball mode: no events, explicit inference-withheld status beyond 21 seconds.
- Mobile browser viewport 390 x 844: rendered document width equalled available width (375 px), no horizontal overflow.
- Existing simulator remains available as the adjacent mode.
- Processing runs on-device without cloud AI requests. No paid generation calls made for this feature.

Reproduce: run scripts/create-tracking-video.py with Pillow and ffmpeg, node scripts/train-pass-quality.mjs, node scripts/evaluate-tracking.mjs, npm test. Ground truth remains under docs/proof, separate from runtime detector inputs. Published validation includes matched event evidence for inspection and is not consumed by the detector.
