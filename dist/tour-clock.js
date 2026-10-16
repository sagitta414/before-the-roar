// Owns tour time independently of video autoplay and animation-frame delivery.
export function createTourClock(now = () => performance.now()) {
  let elapsed = 0,
    started = 0,
    status = "idle";
  const read = () => {
    const seconds = Math.min(
      105,
      elapsed + (status === "running" ? (now() - started) / 1000 : 0),
    );
    if (seconds >= 105) {
      elapsed = 105;
      status = "complete";
    }
    return {
      seconds,
      status,
      step:
        seconds >= 72 ? 4 : seconds >= 52 ? 3 : seconds >= 36 ? 2 : seconds >= 18 ? 1 : 0,
      time: Math.min(16, seconds),
      corrected: seconds >= 60,
      mode: seconds >= 91 ? "math" : seconds >= 72 ? "beginner" : "analyst",
      language: seconds >= 83 ? "es" : "en",
    };
  };
  return {
    read,
    start() {
      elapsed = 0;
      started = now();
      status = "running";
      return read();
    },
    pause() {
      elapsed = read().seconds;
      if (status === "running") status = "paused";
      return read();
    },
    resume() {
      if (status === "paused") {
        started = now();
        status = "running";
      }
      return read();
    },
    reset() {
      elapsed = 0;
      status = "idle";
      return read();
    },
  };
}
