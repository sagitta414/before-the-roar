# v146 current-detector holdout

## What was frozen

The shipping detector was normalized to the LF bytes stored by GitHub and archived before case generation at `docs/proof/detectors/sha256-394e7ac1888be14502e0abccde7090f09f7a79c56235721d10734a49b97e31c2.js`. Its SHA-256 is `394e7ac1888be14502e0abccde7090f09f7a79c56235721d10734a49b97e31c2`.

The plan was written before evaluation to `docs/proof/tracking-holdout-v146-plan.json`. The complete machine-readable result is in `docs/proof/tracking-holdout-v146.json`, with a public application copy at `dist/assets/tracking/holdout-current.json`.

## One-run result

Five previously unused procedural seeds, 10401 through 10405, produced 40 expected events. The detector emitted 39 candidates and matched all 39, for 97.5% event recall and 100% precision within this controlled study. The low-light case missed one event and is retained unchanged. The standard, compressed-dim, noisy-floodlights, and darkness-boundary cases each matched 8 of 8 events.

No case was tuned or rerun after its result. The initial command exited before creating a plan because ffmpeg capability detection used the wrong version flag; that portability defect was corrected before any seed was generated or evaluated.

## Boundaries

This is reproducible controlled synthetic evidence. It does not establish accuracy on unfamiliar real broadcast footage. The detector still assumes a fixed calibrated camera, enrolled visible colour markers, a high-visibility ball, and a ground-plane speed model. Aerial play, camera movement, occlusion-heavy broadcast footage, and unconstrained player identification remain outside the demonstrated capability.

## Reproduction

Run `node scripts/tracking-holdout.mjs` to write diagnostics only under the operating system temporary directory. Pass `--publish` only when intentionally creating a new committed study. The runner discovers Python 3 and ffmpeg from the host, or accepts `BTR_PYTHON` and `BTR_FFMPEG`. It verifies the immutable detector before and after evaluation.
