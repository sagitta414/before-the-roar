// Owns tour time independently of video autoplay and animation-frame delivery.
export function createTourClock(now = () => performance.now()) {
  let elapsed = 0,
    started = 0,
    status = "idle";
  const read = () => {
    const seconds = Math.min(
      60,
      elapsed + (status === "running" ? (now() - started) / 1000 : 0),
    );
    if (seconds >= 60) {
      elapsed = 60;
      status = "complete";
    }
    return {
      seconds,
      status,
      step:
        seconds >= 44 ? 4 : seconds >= 32 ? 3 : seconds >= 20 ? 2 : seconds >= 10 ? 1 : 0,
      time: Math.min(16, seconds),
      corrected: seconds >= 38,
      mode: seconds >= 53 ? "math" : seconds >= 44 ? "beginner" : "analyst",
      language: seconds >= 49 ? "es" : "en",
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
