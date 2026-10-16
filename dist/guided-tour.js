import {mountViewerStudy} from './viewer-study.js';
import { createTourClock } from "./tour-clock.js";
import { GUIDE_STEPS, SOURCE_LABELS, guidedSnapshot } from "./guided-model.js";
import { createMatchPitch } from "./match-pitch.js";
import { matchSession } from "./match-session.js";
import { SCENARIOS } from "./engine.js";
import { PRESENTER_PROFILES } from "./presenter-profiles.js";
import { ROLE_LABELS } from "./editorial-roles.js";
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};
const button = (text, action, cls = "outline-button") => {
  const b = el("button", cls, text);
  b.type = "button";
  b.onclick = action;
  return b;
};
const save = (filename, data) => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = el("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
const watch = document.getElementById("watch");
if(new URLSearchParams(location.search).get('demo')==='1')document.body.classList.add('demo-presentation');
let active = false,
  step = 0,
  options = { time: 16, corrected: false, language: "en", mode: "analyst" },
  pack = null,
  playing = false,
  lastFrame = 0;
const tourClock = createTourClock();
const launcher = el("section", "guided-launch"),
  intro = el("div");
intro.append(
  el("span", "eyebrow", "START HERE / THE BTR EXPERIENCE"),
  el("strong", "", "One play. Every perspective. A story you can question."),
  el(
    "p",
    "",
    "Follow the football, meet the crew, and see the explanation change when the evidence changes.",
  ),
);
const open = button("Explore the guided match →", () => enter(), "red-button"),
  filmButton = button("Watch the 60-second film", () => leave("pitchside"));
launcher.append(intro, open, filmButton);
watch.prepend(launcher);
const tour = el("section", "guided-tour");
tour.id = "guided-match";
tour.hidden = true;
tour.setAttribute("aria-label", "Guided match demonstration");
launcher.after(tour);
const top = el("div", "guided-top"),
  badge = el("b", "", "INTERACTIVE DEMO · NO AI REQUESTS"),
  source = el("span", "", "SYNTHETIC MATCH · THE UNSEEN RUN"),
  auto = button("Play the 105-second tour", () => {
    const state = tourClock.read();
    playing = false;
    if (state.status === "running") tourClock.pause();
    else if (state.status === "paused") tourClock.resume();
    else tourClock.start();
    tickTour();
    render();
  }),
  exit = button("Explore the app ↗", () => leave("match"));
top.append(badge, source, auto, exit);
tour.append(top);
const progress = el("output", "tour-progress", "Ready · 0 / 105 seconds");
progress.setAttribute("aria-label", "Tour progress");
tour.append(progress);
function renderTourProgress() {
  const t = tourClock.read();
  auto.textContent = {
    running: "Pause tour",
    paused: "Resume tour",
    complete: "Replay the 105-second tour",
    idle: "Play the 105-second tour",
  }[t.status];
  progress.dataset.status = t.status;
  progress.textContent =
    {
      running: "Playing",
      paused: "Paused · press Resume tour to continue",
      complete: "Tour complete",
      idle: "Ready",
    }[t.status] +
    " · " +
    Math.floor(t.seconds) +
    " / 105 seconds";
}
const topFilm = button("Watch the film", () => leave("pitchside"));
top.insertBefore(topFilm, exit);
const steps = el("nav", "guided-steps");
steps.setAttribute("aria-label", "Guided match stages");
for (const [index, s] of GUIDE_STEPS.entries())
  steps.append(
    button(
      `${index + 1} · ${s.label}`,
      () => {
        stopTour();
        setStep(index);
      },
      "",
    ),
  );
tour.append(steps);
const grid = el("div", "guided-grid"),
  screen = el("section", "guided-screen"),
  score = el("div", "guided-score");
score.append(
  el("b", "", "HARBOR"),
  el("strong", "", "0 : 0"),
  el("b", "", "NORTHBRIDGE"),
);
const clock = el("span", "", "67:16 · R1");
score.append(clock);
screen.append(score);
const pitchNode = el("div", "guided-pitch");
screen.append(pitchNode);
const pitch = createMatchPitch(pitchNode, () => {});
const caption = el("div", "guided-caption"),
  captionMeta = el("small", "", "ON SCREEN · SYNTHETIC EVIDENCE"),
  captionTitle = el("h3"),
  captionCopy = el("p");
caption.append(captionMeta, captionTitle, captionCopy);
screen.append(caption);
const controls = el("div", "guided-controls"),
  play = button("▶ Replay the play", () => {
    stopTour();
    playing = !playing;
    if (playing && options.time >= 16) options.time = 0;
    lastFrame = 0;
    render();
  }),
  scrub = el("input");
scrub.type = "range";
scrub.min = "0";
scrub.max = "16";
scrub.step = ".1";
scrub.value = "16";
scrub.setAttribute("aria-label", "Guided match time");
scrub.oninput = () => {
  stopTour();
  playing = false;
  options.time = Number(scrub.value);
  render();
};
controls.append(play, scrub);
screen.append(controls);
grid.append(screen);
const copy = el("article", "guided-copy"),
  kicker = el("span", "eyebrow"),
  heading = el("h2"),
  description = el("p"),
  content = el("div", "guided-content");
heading.tabIndex = -1;
copy.append(kicker, heading, description, content);
grid.append(copy);
tour.append(grid);
const nextRow = el("div", "guided-next"),
  stateLabel = el("span", "guided-note"),
  back = button("← Back", () => {
    stopTour();
    setStep(step - 1);
  }),
  next = button(
    "Next →",
    () => {
      stopTour();
      if (step === 4) leave("match");
      else setStep(step + 1);
    },
    "red-button",
  );
nextRow.append(back, stateLabel, next);
copy.append(nextRow);
const provenance = el("p", "guided-source");
tour.append(provenance);
function openLiveDiscussion(){
  leave('match');
  document.getElementById('watch-nav').click();
  matchSession.set({scenario:'wide'},'live-demo');
  matchSession.set({source:'match',time:16,corrected:false,language:'en',mode:'analyst',focus:7,team:'harbor'},'live-demo');
  document.dispatchEvent(new Event('btr-open-live-discussion'));
}
const downloadRow = el("div", "guided-downloads");
downloadRow.append(
  button("Try the live two-round discussion →", openLiveDiscussion),
  button("Download story + evidence ↓", () =>
    save("btr-guided-story.json", guidedSnapshot(options, pack).export),
  ),
  button("Compare agent results ↗", () => {
    leave("match");
    document.getElementById("inside-nav").click();
    document.dispatchEvent(new Event("btr-open-evidence"));
  }),
);
tour.append(downloadRow);
tour.append(el('p','guided-note','Live discussion: ask for the opening reading, then choose “Did the run cause it?” to challenge the crew. Each fresh synthetic round uses one AI selection request; public wording is source-rendered. Opening this view makes no AI request.'));
const map = el("details", "source-map");
const sourceSummary=el("summary"); map.append(sourceSummary); matchSession.subscribe(state=>{const label=SOURCE_LABELS[state.section==='lab'?'lab':state.source];sourceSummary.textContent=label.title+" · source & scope";}); sourceSummary.textContent=SOURCE_LABELS[matchSession.get().source].title+" · source & scope";
for (const entry of Object.values(SOURCE_LABELS)) {
  const row = el("article");
  row.append(el("strong", "", entry.title), el("p", "", entry.scope));
  map.append(row);
}
document.querySelector(".watch-source-bar").after(map);
const proof = el("details", "judge-evidence");
proof.append(el("summary", "", "Evaluation, source code and judging evidence"));
proof.id = "judge-evidence";
proof.setAttribute("aria-label", "Measured agent evaluation");
proof.append(
  el("h2", "", "The evidence behind the experience"),
  el(
    "p",
    "",
    "The guided match always works with reviewed notes and calculated facts. Saved model contributions, when available, are labeled with their recording date. Live generation remains a separate action.",
  ),
);
const evaluation = el("div");
evaluation.append(
  el(
    "p",
    "",
    "Evaluation results are loading. The downloadable verification summary remains available.",
  ),
);
proof.append(evaluation);
const links = el("p");
for (const [href, label] of [
  ["assets/btr-agent-evaluation.json", "Published v42.2 comparison + raw contributions"],
  ["assets/btr-evaluation-plan-v44.json", "v44 paired conversation comparison · plan, not results"],
  ["assets/btr-agent-evaluation-v41.json", "Earlier comparison (v41)"],
  ["assets/btr-agent-evaluation-v42-first.json", "First v42 attempt · incomplete"],
  ["assets/btr-agent-evaluation-v42-interrupted.json", "Interrupted v42 attempt · run notes"],
  ["assets/btr-recovery-v42.json", "v42 recovery receipt · editorial flaw disclosed"],
  ["assets/btr-verification-summary.json", "Recovery verification"],
  ["assets/btr-recording-guide.txt", "105-second demonstration script"],
]) {
  const a = el("a", "", label);
  a.href = href;
  a.download = "";
  links.append(a, document.createTextNode(" · "));
}
proof.append(links);
document.querySelector("#inside .extension-heading").after(proof);
const walkthrough = el(
  "a",
  "proof-output",
  "Watch the earlier 105-second app demo ↗",
);
walkthrough.href = "assets/btr-app-demo-v43.mp4";
walkthrough.target = "_blank";
walkthrough.rel = "noopener";
proof.append(
  walkthrough,
  el(
    "p",
    "guided-note",
    "Earlier demonstration: edited screen captures using saved v42 contributions. It does not demonstrate the current follow-up behavior. The current source-composition demonstration is available in Inside BTR. The v44 study remains historical and incomplete. No continuous recording or audio is claimed.",
  ),
);
const repository = el("a", "proof-output", "Inspect the public source on GitHub ↗");
repository.href = "https://github.com/sagitta414/before-the-roar";
repository.target = "_blank";
repository.rel = "noopener";
proof.append(repository);
proof.append(button('Try the current live conversation →',openLiveDiscussion));
const studyLink=el('a','proof-output','Take the five-minute viewer study ↗');studyLink.href='study.html';proof.append(studyLink);
function stopTour() {
  tourClock.reset();
  renderTourProgress();
}
function sync() {
  matchSession.set(
    { ...options, source: "match", scenario: "wide", focus: 7, team: "harbor" },
    "guided",
  );
}
function enter() {
  document.getElementById("film").pause();
  active = true;
  document.body.classList.add("guided-active");
  tour.hidden = false;
  open.textContent = "Restart guided match ↺";
  document.dispatchEvent(new CustomEvent("btr-guided-activity", { detail: true }));
  matchSession.set({ scenario: "wide", source: "match" }, "guided");
  options.time = 16;
  step = 0;
  options.corrected = false;
  render();
}
function leave(source) {
  stopTour();
  playing = false;
  active = false;
  tour.hidden = true;
  document.body.classList.remove("guided-active");
  open.textContent = "Explore the guided match →";
  document.dispatchEvent(new CustomEvent("btr-guided-activity", { detail: false }));
  matchSession.set({ source }, "guided-exit");
  try {
    sessionStorage.setItem("btr-guided-dismissed", "1");
  } catch {}
}
function setStep(index) {
  step = Math.max(0, Math.min(4, index));
  playing = false;
  options.time = 16;
  render();
  heading.focus({ preventScroll: true });
}
function renderPitch(snapshot) {
  pitch.update(SCENARIOS[0], snapshot.story.brief.state, 7, options.corrected);
  clock.textContent = snapshot.story.clock + " · R" + snapshot.story.revision;
  scrub.value = String(options.time);
  captionTitle.textContent = snapshot.story.title;
  captionCopy.textContent = snapshot.story.body;
  captionMeta.textContent = `ON SCREEN · R${snapshot.story.revision} · ${options.language.toUpperCase()} · ${snapshot.story.words[options.mode]}`;
  play.textContent = playing ? "❚❚ Pause" : "▶ Replay the play";
}
function render() {
  if (!active) return;
  sync();
  const snapshot = guidedSnapshot(options, pack);
  renderPitch(snapshot);
  const s = GUIDE_STEPS[step];
  kicker.textContent = `${String(step + 1).padStart(2, "0")} / ${s.label.toUpperCase()}`;
  heading.textContent = s.title;
  description.textContent = s.copy;
  renderTourProgress();
  for (const [i, b] of [...steps.children].entries()) {
    if (i === step) b.setAttribute("aria-current", "step");
    else b.removeAttribute("aria-current");
  }
  back.disabled = step === 0;
  next.textContent =
    step === 4 ? "Continue exploring →" : `Next: ${GUIDE_STEPS[step + 1].label} →`;
  stateLabel.textContent = `${step + 1} of 5 · ${snapshot.story.clock} · Source R${snapshot.story.revision}`;
  provenance.textContent = snapshot.saved
    ? `Saved Azure run · ${new Date(snapshot.recordedAt).toLocaleDateString()} · Replayed instantly, with no new AI generation. Each contribution identifies its engine.`
    : "Reviewed demonstration · authored explanations and calculations run in your browser. No fresh AI generation or model requests. Live AI is available in Watch and the production desk.";
  content.replaceChildren();
  if (step === 0) {
    if (options.time < 16)
      description.textContent =
        "Follow the ball, winger and defender as the recorded play arrives. The caption uses only evidence through the current playhead.";
    const fact = el("div", "guided-verdict");
    fact.append(
      el("strong", "", "WATCH THE WIDE CHANNEL"),
      el(
        "span",
        "",
        options.time < 16
          ? "Follow the space beside the winger. Wait for the reached tracking samples before drawing a conclusion about the defender’s movement."
          : "The winger moves toward the touchline as the defender shifts toward the same side. The timing suggests a tactical relationship; it does not establish why the defender moved.",
      ),
    );
    content.append(
      fact,
      el(
        "p",
        "guided-note",
        "Replay the first sixteen seconds, or move straight to the crew. All positions and events are authored synthetic data.",
      ),
    );
  } else if (step === 1) {
    for (const p of snapshot.posts) {
      const profile = PRESENTER_PROFILES.find((r) => r.id === p.role),
        row = el("article", "guided-role"),
        img = el("img");
      img.src = `assets/${profile.image}-portrait.webp`;
      img.alt = "";
      const text = el("div"),
        meta = el("div");
      meta.append(
        el("b", "", profile.name + " / " + ROLE_LABELS[options.language][p.role]),
        el(
          "small",
          "",
          p.engine === "azure_openai"
            ? "SAVED AI"
            : p.engine === "calculated"
              ? "CALCULATED"
              : p.engine === "evidence_rules"
                ? "SOURCE CHECK"
                : "REVIEWED NOTE",
        ),
      );
      text.append(meta, el("p", "", p.summary));
      const detail = el("details");
      detail.append(
        el("summary", "", "Evidence + limits"),
        el("code", "", p.evidence_ids.join(" · ")),
      );
      if (p.working) detail.append(el("code", "", p.working));
      if (p.caution) detail.append(el("p", "", p.caution));
      text.append(detail);
      row.append(img, text);
      content.append(row);
    }
  } else if (step === 2) {
    const metric = snapshot.story.analysis.calculations[0],
      card = el("div", "guided-metric"),
      text = el("div");
    text.append(el("b", "", metric.label), el("p", "", metric.text));
    card.append(el("strong", "", metric.value), text);
    content.append(card);
    const details = el("details");
    details.open = true;
    details.append(
      el("summary", "", "Recalculate from the recorded passes"),
      el("code", "", metric.equation),
    );
    for (const e of snapshot.story.analysis.passes)
      details.append(
        el(
          "p",
          "guided-note",
          `${e.id}: x ${e.start[0].toFixed(2)} → ${e.endPosition[0].toFixed(2)} m · completed`,
        ),
      );
    content.append(
      details,
      el(
        "p",
        "guided-note",
        "Football meaning: the passes advance the ball toward goal. This is one short sequence, not a team average or a measure of chance quality.",
      ),
    );
  } else if (step === 3) {
    const verdict = el("div", "guided-verdict");
    verdict.dataset.corrected = String(options.corrected);
    verdict.append(
      el("strong", "", options.corrected ? "WITHDRAWN · R2" : "QUALIFIED · R1"),
      el("span", "", snapshot.story.review.reason),
    );
    content.append(
      verdict,
      button(
        options.corrected ? "Restore original record" : "Apply corrected tracking",
        () => {
          options.corrected = !options.corrected;
          render();
        },
        "red-button",
      ),
      el(
        "p",
        "guided-note",
        `${snapshot.story.stats} The pass records do not change. The caption and defender position update together.`,
      ),
    );
  } else {
    const preferences = el("div", "guided-preferences");
    for (const [key, title, items] of [
      [
        "mode",
        "YOUR PERSPECTIVE",
        [
          ["beginner", "New to football"],
          ["math", "Show the math"],
          ["analyst", "Tactical view"],
        ],
      ],
      [
        "language",
        "YOUR LANGUAGE",
        [
          ["en", "English"],
          ["es", "Español"],
          ["pt", "Português"],
        ],
      ],
    ]) {
      const label = el("label", "", title),
        select = el("select");
      select.setAttribute("aria-label", "Guided " + title.toLowerCase());
      for (const [value, text] of items) {
        const opt = el("option", "", text);
        opt.value = value;
        select.append(opt);
      }
      select.value = options[key];
      select.onchange = () => {
        stopTour();
        options[key] = select.value;
        render();
      };
      label.append(select);
      preferences.append(label);
    }
    content.append(
      preferences,
      el(
        "p",
        "guided-note",
        "These captions are localized from the same evidence. Changing a language or perspective never changes the facts.",
      ),
    );
    mountViewerStudy(content,save);
  }
}
// Timed stages must advance even when the browser suspends animation frames.
function tickTour() {
  if (!active) return;
  const t = tourClock.read();
  if (!["running", "complete"].includes(t.status)) return;
  const changed =
    step !== t.step ||
    options.corrected !== t.corrected ||
    options.mode !== t.mode ||
    options.language !== t.language;
  step = t.step;
  options = {
    ...options,
    time: t.time,
    corrected: t.corrected,
    mode: t.mode,
    language: t.language,
  };
  if (changed) render();
  else {
    sync();
    renderPitch(guidedSnapshot(options, pack));
  }
  renderTourProgress();
}
const tourTimer = window.setInterval(() => {
  if (
    ["running", "complete"].includes(tourClock.read().status) &&
    progress.dataset.status !== "complete"
  )
    tickTour();
}, 250);
window.addEventListener("pagehide", () => window.clearInterval(tourTimer), {
  once: true,
});
let lastPaint = 0;
function frame(now) {
  if (active && playing) {
    if (lastFrame) options.time = Math.min(16, options.time + (now - lastFrame) / 1000);
    if (options.time >= 16) {
      playing = false;
      render();
    }
    if (now - lastPaint > 100) {
      lastPaint = now;
      sync();
      renderPitch(guidedSnapshot(options, pack));
    }
    lastFrame = now;
  } else lastFrame = 0;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    tourClock.pause();
    playing = false;
    renderTourProgress();
  }
});
document.addEventListener("btr-section", (e) => {
  if (e.detail !== "watch") {
    stopTour();
    playing = false;
    active = false;
    tour.hidden = true;
    document.body.classList.remove("guided-active");
    open.textContent = "Explore the guided match →";
    document.dispatchEvent(new CustomEvent("btr-guided-activity", { detail: false }));
  }
});
document.addEventListener("btr-open-guided", () => {
  document.getElementById("watch-nav").click();
  enter();
});
fetch("assets/btr-agent-evaluation.json")
  .then((r) => {
    if (!r.ok) throw Error("No measured evaluation yet");
    return r.json();
  })
  .then((data) => {
    pack = data;
    evaluation.replaceChildren();
    const table = el("table");
    const head = el("tr");
    for (const t of ["Measured check", "Agent team", "Single model"])
      head.append(el("th", "", t));
    table.append(head);
    for (const [label, key] of [
      ["Accepted editorial outputs", "accepted"],
      ["Guard-rejected outputs", "rejected"],
      ["Model requests", "requests"],
      ["Wall time (seconds)", "seconds"],
    ]) {
      const row = el("tr");
      row.append(el("th", "", label));
      for (const arm of ["team", "baseline"])
        row.append(el("td", "", String(data.summary?.[arm]?.[key] ?? "Not measured")));
      table.append(row);
    }
    evaluation.append(
      el(
        "p",
        "",
        `${data.policy || 'Archived policy'} · ${data.cases.length} fixed cases · ${data.model} · recorded ${new Date(data.recorded_at).toLocaleString()}`,
      ),
      table,
      el("p", "", data.conclusion),
      el(
        "p",
        "guided-note",
        "These are older-policy guard checks, not a measurement of the current conversation. A preregistered v44 comparison covers eleven opening pairs plus one paired follow-up, up to sixty model requests. Execution and blind human ratings are pending. Guard acceptance does not establish semantic accuracy, superiority or audience satisfaction.",
      ),
    );
    if (active) render();
  })
  .catch(() => {
    evaluation.replaceChildren(
      el(
        "p",
        "",
        "No completed live comparison is published yet. The evaluation harness and its fixed cases are available in the project source. No superiority claim is made.",
      ),
    );
  });
let dismissed = false;
try {
  dismissed = sessionStorage.getItem("btr-guided-dismissed") === "1";
} catch {}
if (
  new URLSearchParams(location.search).has("tour") ||
  (!dismissed && (!location.hash || location.hash === "#watch"))
)
  enter();
fetch("media-availability.json")
  .then((r) => (r.ok ? r.json() : null))
  .then((media) => {
    if (media?.pitchside !== false) return;
    for (const b of [filmButton, topFilm]) {
      b.disabled = true;
      b.textContent = "Optional film not included";
    }
    document.querySelector('#watch-source option[value="pitchside"]').disabled = true;
    document.querySelector(".source-details a")?.setAttribute("hidden", "");
    if (matchSession.get().source === "pitchside") matchSession.set({ source: "match" });
  })
  .catch(() => {});
