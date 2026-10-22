export const COMPATIBILITY_THRESHOLDS = Object.freeze({
  meanEnrolledPlayers: 5,
  ballFrameCoverage: 0.5,
  meanFrameConfidence: 0.62,
  aspectRatioMin: 1.38,
  aspectRatioMax: 1.62,
});

export function assessVideoCompatibility(frames, metadata) {
  if (!Array.isArray(frames) || frames.length < 6) throw Error("Six decoded samples are required.");
  const meanPlayers = frames.reduce((sum, item) => sum + (item.players || 0), 0) / frames.length;
  const ballCoverage = frames.filter((item) => item.ball).length / frames.length;
  const meanConfidence = frames.reduce((sum, item) => sum + (item.confidence || 0), 0) / frames.length;
  const ratio = metadata.width / metadata.height;
  const reasons = [];
  if (ratio < COMPATIBILITY_THRESHOLDS.aspectRatioMin || ratio > COMPATIBILITY_THRESHOLDS.aspectRatioMax)
    reasons.push("Camera framing does not match the calibrated 3:2 full-pitch view.");
  if (meanPlayers < COMPATIBILITY_THRESHOLDS.meanEnrolledPlayers)
    reasons.push("Fewer than five enrolled player markers were visible on average.");
  if (ballCoverage < COMPATIBILITY_THRESHOLDS.ballFrameCoverage)
    reasons.push("The marked ball was not continuous across enough samples.");
  if (meanConfidence < COMPATIBILITY_THRESHOLDS.meanFrameConfidence)
    reasons.push("Frame confidence stayed below the measurement threshold.");
  return {
    schema: "btr.video-compatibility.v1",
    passed: reasons.length === 0,
    sampled_frames: frames.length,
    mean_enrolled_players: Number(meanPlayers.toFixed(2)),
    ball_frame_coverage: Number(ballCoverage.toFixed(3)),
    mean_frame_confidence: Number(meanConfidence.toFixed(3)),
    aspect_ratio: Number(ratio.toFixed(3)),
    thresholds: {
      mean_enrolled_players: COMPATIBILITY_THRESHOLDS.meanEnrolledPlayers,
      ball_frame_coverage: COMPATIBILITY_THRESHOLDS.ballFrameCoverage,
      mean_frame_confidence: COMPATIBILITY_THRESHOLDS.meanFrameConfidence,
      aspect_ratio: `${COMPATIBILITY_THRESHOLDS.aspectRatioMin}–${COMPATIBILITY_THRESHOLDS.aspectRatioMax}`,
    },
    reasons,
  };
}
