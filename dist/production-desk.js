import { receiptReplay } from "./receipt-replay.js";
import { aiAvailability, availabilityText } from "./ai-availability.js?v=68";
import { matchSession } from "./match-session.js";
import { PITCHSIDE } from "./pitchside-story.js";
import { recoveryProof } from "./recovery-proof.js?v=106";
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};
const label = (text, input) => {
  const n = el("label", "proof-field", text);
  n.append(input);
  return n;
};
const select = (name, items) => {
  const s = el("select");
  s.setAttribute("aria-label", name);
  for (const [value, text] of items) {
    const o = el("option", "", text);
    o.value = value;
    s.append(o);
  }
  return s;
};
const download = (name, data, type = "application/json") => {
  const url = URL.createObjectURL(
      new Blob([typeof data === "string" ? data : JSON.stringify(data, null, 2)], {
        type,
      }),
    ),
    a = el("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
let replay = null;
const archiveReady = fetch("assets/btr-agent-evaluation.json").then((r) => {
  if (!r.ok) throw Error("Saved receipts unavailable");
  return r.json();
});
archiveReady.catch(() => {});
let base = "",
  session = null,
  record = null,
  busy = false,
  dataset = null,
  lastTraceKey = "",
  autoRecoveryActive = false;
const config = fetch("api-config.json")
  .then((r) => r.json())
  .then((c) => {
    base = ["127.0.0.1", "localhost"].includes(location.hostname) ? "" : c.baseUrl || "";
  });
async function call(path, body, token = session?.token) {
  await config;
  const r = await fetch(base + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!r.ok) throw Error((await r.json()).error || "The production desk is unavailable");
  return r;
}
const workspace = el("section", "proof-console");
workspace.setAttribute("aria-label", "Production proof desk");
const heading = el("div", "proof-heading"),
  head = el("div");
head.append(
  el("span", "eyebrow", "THE EDITORIAL ENGINE / LIVE PROOF"),
  el("h2", "", "A story that can stand up to scrutiny."),
);
heading.append(head, el("span", "proof-tag", "TOOLS → CHECKPOINT → SCREEN"));
workspace.append(heading);
const intro = el(
  "p",
  "proof-intro",
  "Follow the public handoffs. Stop the worker. Change the evidence. See exactly what reaches the screen. This demonstration uses the synthetic “Unseen run” at 67:16.",
);
workspace.append(intro);
const actions = el("div", "proof-actions"),
  start = el("button", "red-button", "Run the desk"),
  fault = el("button", "proof-live-button", "Run live recovery proof"),
  resume = el("button", "outline-button", "Resume saved work"),
  correct = el("button", "outline-button", "Correct the tracking"),
  exportButton = el("button", "outline-button", "Export proof ↓");
resume.hidden = true;
correct.disabled = exportButton.disabled = true;
const replayButton = el("button", "outline-button", "Replay saved recovery");
replayButton.onclick = () => showReplay(false);
actions.append(start, fault, replayButton, resume, correct, exportButton);
workspace.append(actions);
const proofSteps = el("ol", "recovery-steps");
for (const [key, number, title] of [
  ["event", "01", "Unseen event"],
  ["saved", "02", "Work saved"],
  ["interrupt", "03", "Worker stopped"],
  ["resume", "04", "Fresh worker"],
  ["publish", "05", "Story published"],
]) {
  const step = el("li");
  step.dataset.step = key;
  step.append(el("span", "", number), el("b", "", title), el("small", "", "Waiting"));
  proofSteps.append(step);
}
workspace.append(proofSteps);
const status = el(
  "p",
  "proof-status",
  "Ready. Model requests use the existing Azure allowance. Calculations and the correction preview are free of model calls.",
);
status.setAttribute("role", "status");
workspace.append(status);
const proofVerdict = el("section", "recovery-verdict");
proofVerdict.hidden = true;
workspace.append(proofVerdict);
const grid = el("div", "proof-grid"),
  left = el("article", "proof-panel"),
  right = el("article", "proof-panel");
left.append(el("div", "proof-panel-title", "01 / THE PUBLIC WORK LOG"));
const trace = el("ol", "proof-trace");
trace.setAttribute("aria-label", "Agent tool and checkpoint receipts");
trace.append(
  el(
    "li",
    "proof-empty",
    "Start a run to see real tool receipts, saved contributions and handoffs.",
  ),
);
left.append(trace);
const metrics = el("div", "proof-metrics");
left.append(metrics);
const contributions = el("details", "proof-contributions");
contributions.append(el("summary", "", "Read the published contributions"));
left.append(contributions);
grid.append(left, right);
workspace.append(grid);
right.append(el("div", "proof-panel-title", "02 / THE LINE THAT GOES TO AIR"));
const caption = el("div", "proof-caption"),
  captionTag = el("span", "eyebrow", "EVIDENCE-BOUND CAPTION"),
  captionTitle = el("h3", "", "The unseen run"),
  captionBody = el(
    "p",
    "",
    "A source revision will update this caption and its separate browser output.",
  );
caption.append(captionTag, captionTitle, captionBody);
right.append(caption);
const languages = select("Proof language", [
    ["en", "English"],
    ["es", "Español"],
    ["pt", "Português"],
  ]),
  modes = select("Proof perspective", [
    ["fan", "For the fan"],
    ["beginner", "New to football"],
    ["math", "Show the math"],
    ["analyst", "Tactical view"],
    ["player", "Player focus"],
  ]),
  personalize = el("button", "outline-button", "Apply perspective");
const preferences = el("div", "proof-preferences");
preferences.append(
  label("LANGUAGE", languages),
  label("PERSPECTIVE", modes),
  personalize,
);
right.append(preferences);
personalize.disabled = true;
const output = el("a", "proof-output", "Open read-only OBS output ↗");
output.target = "_blank";
output.rel = "noopener";
output.hidden = true;
right.append(output);
const ledger = el("div", "proof-ledger");
right.append(ledger);
const recovery = el("details", "proof-recovery"),
  recoveryTitle = el("summary", "", "Playback during the recovery test"),
  recoveryFilm = el("video", "proof-film");
recoveryFilm.controls = true;
recoveryFilm.muted = true;
recoveryFilm.playsInline = true;
recoveryFilm.preload = "none";
recoveryFilm.src = "assets/pitchside-minute.mp4";
recoveryFilm.setAttribute(
  "aria-label",
  "Independent full-minute playback during worker recovery",
);
const recoveryTime = el("span", "proof-playback-time", "Video clock · 00:00");
recoveryFilm.addEventListener(
  "timeupdate",
  () =>
    (recoveryTime.textContent = `Video clock · ${recoveryFilm.currentTime.toFixed(1)}s / ${Number.isFinite(recoveryFilm.duration) ? recoveryFilm.duration.toFixed(0) : "60"}s`),
);
recovery.append(
  recoveryTitle,
  recoveryFilm,
  recoveryTime,
  el(
    "p",
    "",
    "This clock is separate from the Watch player on purpose. This player runs independently. The test throws an actual worker exception after the specialists are saved; Resume starts a fresh worker from storage. It does not shut down Azure.",
  ),
);
right.append(recovery);
const guide = el("details", "proof-guide");
guide.append(
  el("summary", "", "A 105-second route for the judges"),
  el(
    "p",
    "",
    "0–18s: Watch the synthetic play. 18–36s: Read the five contributions. 36–52s: Inspect passing gain. 52–72s: Correct the tracking. 72–105s: Compare beginner, Spanish and math captions. The automatic tour uses no AI requests. Replay saved recovery here separately; it never represents a fresh interruption test.",
  ),
);
workspace.append(guide);
document.querySelector("#inside .extension-heading").after(workspace);
const pretty = (s) => s.replaceAll("_", " "),
  roles = {
    analyst: "Scout",
    guide: "Guide",
    math: "Vector",
    reviewer: "Check",
    presenter: "Host",
    director: "Director",
  };
function receipt(list, item) {
  const li = el("li"),
    who = el("b", "", roles[item.role] || item.role),
    detail = el("div");
  detail.append(
    el("strong", "", pretty(item.action)),
    el(
      "small",
      "",
      [
        item.tool?.replaceAll("_", " "),
        item.replayed ? "saved receipt" : null,
        item.latency_ms != null ? (item.latency_ms / 1000).toFixed(1) + "s" : null,
        item.evidence_ids?.length ? item.evidence_ids.length + " sources" : null,
        item.request_number ? `request #${item.request_number}` : null,
        item.from?.length ? `received ${item.from.map((role) => roles[role] || role).join(" + ")}` : null,
        item.saved_roles?.length ? `saved ${item.saved_roles.map((role) => roles[role] || role).join(" + ")}` : null,
        item.reason,
      ]
        .filter(Boolean)
        .join(" · "),
    ),
  );
  li.append(who, detail);
  list.append(li);
  while (list.children.length > 24) list.firstChild.remove();
}
function setProofStep(key, state, note) {
  const step = proofSteps.querySelector(`[data-step="${key}"]`);
  if (!step) return;
  step.dataset.state = state;
  step.querySelector("small").textContent = note;
}
function resetProofSteps() {
  proofVerdict.hidden = true;
  for (const step of proofSteps.children) {
    delete step.dataset.state;
    step.querySelector("small").textContent = "Waiting";
  }
}
function renderRecoveryVerdict(data) {
  const proof = recoveryProof(data);
  proofVerdict.hidden = false;
  proofVerdict.dataset.result = proof.verified ? "verified" : "incomplete";
  proofVerdict.replaceChildren();
  const copy = el("div");
  copy.append(
    el("span", "eyebrow", proof.verified ? "RECOVERY VERIFIED" : "PROOF INCOMPLETE"),
    el("h3", "", proof.verified ? "The story survived the worker." : "The audit found a gap."),
    el("p", "", proof.verified
      ? "A fresh worker reused the saved Scout and Guide decisions, recalculated Vector, then spent only the two unfinished requests on Check and Host."
      : "The audience output remains blocked from claiming a successful recovery until every check passes."),
  );
  const numbers = el("div", "recovery-numbers");
  for (const [value, label] of [
    [proof.before_interruption, "BEFORE STOP"],
    [proof.after_restart, "AFTER RESTART"],
    [proof.total_requests, "TOTAL REQUESTS"],
    [proof.duplicate_requests, "DUPLICATE CALLS"],
  ]) {
    const metric = el("div");
    metric.append(el("strong", "", String(value)), el("span", "", label));
    numbers.append(metric);
  }
  const checklist = el("ul", "recovery-checks");
  for (const check of proof.checks) {
    const row = el("li", "", `${check.passed ? "✓" : "×"} ${check.label}`);
    row.dataset.passed = String(check.passed);
    checklist.append(row);
  }
  proofVerdict.append(copy, numbers, checklist);
  return proof;
}
function render(data) {
  record = data;
  const w = data.workflow;
  trace.replaceChildren();
  for (const item of w?.trace || []) receipt(trace, item);
  if (!trace.children.length)
    trace.append(
      el(
        "li",
        "proof-empty",
        "The source record is saved. Run the desk to generate specialist contributions.",
      ),
    );
  metrics.replaceChildren();
  for (const [value, title] of [
    [w?.metrics?.model_calls ?? 0, "MODEL REQUESTS"],
    [
      (w?.metrics?.prompt_tokens || 0) + (w?.metrics?.completion_tokens || 0),
      "REPORTED TOKENS",
    ],
    [
      w?.metrics?.elapsed_ms != null
        ? (w.metrics.elapsed_ms / 1000).toFixed(1) + "s"
        : "—",
      "LAST WORKER RUN",
    ],
  ]) {
    const m = el("div");
    m.append(el("strong", "", String(value)), el("span", "", title));
    metrics.append(m);
  }
  if (w?.metrics?.usage_missing)
    metrics.append(
      el(
        "small",
        "",
        `${w.metrics.usage_missing} responses did not report usage. No dollar cost is inferred.`,
      ),
    );
  contributions.querySelectorAll("article").forEach((n) => n.remove());
  for (const post of Object.values(w?.posts || {})) {
    const row = el("article");
    row.append(
      el(
        "b",
        "",
        (roles[post.role] || post.role) +
          " · " +
          (post.engine === "azure_selection"
            ? "AI SELECTED · SOURCE RENDERED"
            : post.engine === "azure_openai"
            ? "AI"
            : post.engine === "calculated"
              ? "CALCULATED"
              : post.engine === "evidence_rules"
                ? "SOURCE CHECK"
                : "REVIEWED NOTES"),
      ),
      el("p", "", post.summary),
    );
    contributions.append(row);
  }
  const claim = data.ledger.at(-1);
  captionTag.textContent = `${claim.status.toUpperCase()} · SOURCE R${claim.revision} · ${data.storage}`;
  captionTitle.textContent =
    claim.status === "withdrawn" ? "The evidence changed." : "The unseen run";
  captionBody.textContent = claim.explanation;
  ledger.replaceChildren();
  for (const entry of data.ledger.slice(-3)) {
    const row = el("div");
    row.append(
      el("b", "", `R${entry.revision} · ${pretty(entry.action)}`),
      el(
        "span",
        "",
        entry.status === "withdrawn"
          ? "Movement claim withdrawn. Recorded passes retained."
          : entry.check || entry.status,
      ),
    );
    ledger.append(row);
  }
  correct.textContent = data.input.corrected
    ? "Restore original tracking"
    : "Correct the tracking";
  correct.disabled = exportButton.disabled = personalize.disabled = false;
  resume.hidden = !["running", "interrupted", "degraded"].includes(w?.status);
  resume.textContent =
    w?.status === "degraded" ? "Retry unavailable agents" : "Resume saved work";
  languages.value = data.input.language;
  modes.value = data.input.mode;
}
async function refresh() {
  render(await call(`/api/production/${session.id}/state`).then((r) => r.json()));
}
function setBusy(on) {
  busy = on;
  languages.disabled = modes.disabled = on || !!replay;
  for (const b of [start, fault, replayButton, resume, correct, personalize])
    b.disabled =
      on ||
      (replay
        ? [correct, personalize].includes(b)
        : !session && [resume, correct, personalize].includes(b));
}
async function showReplay(resumed = false) {
  setBusy(true);
  try {
    replay = receiptReplay(await archiveReady, resumed);
    languages.value = replay.input.language;
    modes.value = replay.input.mode;
    trace.replaceChildren();
    for (const item of replay.trace) receipt(trace, item);
    metrics.replaceChildren();
    for (const [value, label] of [
      [0, "FRESH MODEL REQUESTS"],
      [replay.posts.length, "SAVED CONTRIBUTIONS"],
      [replay.recorded_requests, "ORIGINAL RUN REQUESTS"],
    ]) {
      const row = el("div");
      row.append(el("strong", "", String(value)), el("span", "", label));
      metrics.append(row);
    }
    contributions.querySelectorAll("article").forEach((n) => n.remove());
    contributions.open = true;
    for (const post of replay.posts) {
      const row = el("article");
      row.append(
        el(
          "b",
          "",
          (roles[post.role] || post.role) +
            " · SAVED " +
            post.engine.replaceAll("_", " "),
        ),
        el("p", "", post.summary),
      );
      contributions.append(row);
    }
    captionTag.textContent =
      "SAVED RECEIPT REPLAY · " + new Date(replay.recorded_at).toLocaleDateString();
    captionTitle.textContent = resumed ? "Saved handoff complete" : "Specialists saved";
    captionBody.textContent = resumed
      ? "The recorded source check and Host contribution are now visible. No model requests were made."
      : "Replay paused before the source check and Host handoff. Resume to inspect the remaining recorded work.";
    status.textContent = "REPLAYING SAVED RECEIPTS · " + replay.limitation;
    ledger.replaceChildren();
    output.hidden = true;
    resume.hidden = resumed;
    resume.textContent = "Resume saved replay";
    exportButton.disabled = false;
    correct.disabled = personalize.disabled = true;
  } catch (e) {
    status.textContent = e.message;
  } finally {
    setBusy(false);
  }
}
async function run() {
  if (replay) {
    await showReplay(true);
    return { paused: false, replay: true };
  }
  const availability = await aiAvailability.check(true);
  if (["offline", "exhausted", "unknown"].includes(availability.state)) {
    await showReplay(false);
    return { paused: false, replay: true };
  }
  setBusy(true);
  status.textContent =
    "The crew is working. Facts remain available while the dialogue streams.";
  trace.replaceChildren();
  let paused = false,
    runError = null;
  try {
    const response = await call(`/api/production/${session.id}/run`, {}),
      reader = response.body.getReader(),
      decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      if (buffer.length > 256000) throw Error("Receipt stream too large");
      let split;
      while ((split = buffer.indexOf("\n\n")) >= 0) {
        const block = buffer.slice(0, split);
        buffer = buffer.slice(split + 2);
        const kind = block
            .split("\n")
            .find((x) => x.startsWith("event:"))
            ?.slice(6)
            .trim(),
          data = JSON.parse(
            block
              .split("\n")
              .filter((x) => x.startsWith("data:"))
              .map((x) => x.slice(5))
              .join(""),
          );
        if (kind === "trace") {
          receipt(trace, data);
          if (autoRecoveryActive && data.action === "model_handoff_completed" && data.role === "analyst") {
            setProofStep("event", "done", "Event accepted");
            setProofStep("saved", "active", "Specialists are working…");
          }
          if (autoRecoveryActive && data.action === "worker_interrupted") {
            setProofStep("saved", "done", "Scout + Guide + Vector saved");
            setProofStep("interrupt", "interrupted", "Deliberate exception recorded");
          }
          if (autoRecoveryActive && data.action === "saved_model_handoff_reused")
            setProofStep("resume", "active", "Reusing the saved checkpoint…");
          if (autoRecoveryActive && data.action === "model_handoff_completed" && data.role === "presenter")
            setProofStep("publish", "active", "Auditing the Host output…");
        }
        if (kind === "paused") {
          paused = true;
          status.textContent = data.message;
        }
        if (kind === "error") throw Error(data.message);
        if (kind === "complete")
          status.textContent =
            data.status === "degraded"
              ? "Some AI contributions were unavailable. The saved trace identifies the fallback; retry resumes the missing work."
              : "Desk complete. Inspect the real requests, token usage and source receipts below.";
      }
    }
    await refresh();
    if (paused)
      status.textContent =
        "Worker interrupted after saving the specialists. Playback stays independent. Resume starts a fresh worker, reuses completed AI work and retries unavailable agents.";
  } catch (e) {
    runError = e;
    status.textContent = e.message + " Saved checkpoints can be resumed.";
    resume.hidden = false;
  } finally {
    setBusy(false);
    document.dispatchEvent(new Event("btr-ai-finished"));
  }
  return { paused, record, error: runError };
}
async function create(interrupt, autoRecover = false) {
  if (busy) return;
  setBusy(true);
  const availability = await aiAvailability.check(true);
  if (availability.state !== "available") {
    if (autoRecover) {
      autoRecoveryActive = false;
      setProofStep("event", "failed", "Live AI unavailable");
    }
    await showReplay(false);
    return;
  }
  replay = null;
  try {
    session = await call(
      "/api/production",
      {
        source: "match",
        scenario: "wide",
        time: 16,
        corrected: false,
        focus: 7,
        team: "harbor",
        language: languages.value,
        mode: modes.value,
        interrupt,
      },
      null,
    ).then((r) => r.json());
    try {
      sessionStorage.setItem("btr-proof-session", JSON.stringify(session));
    } catch {}
    const url = new URL("overlay.html", location.href);
    url.hash = new URLSearchParams({
      production: session.id,
      key: session.readKey,
    });
    output.href = url.href;
    output.hidden = false;
    await refresh();
    if (interrupt) {
      recovery.open = true;
      recoveryFilm.currentTime = 0;
      recoveryFilm.play().catch(() => {});
    }
    const first = await run();
    if (autoRecover && first?.paused) {
      setProofStep("event", "done", "Event accepted");
      setProofStep("saved", "done", "Scout + Guide + Vector saved");
      setProofStep("interrupt", "interrupted", "Deliberate exception recorded");
      setProofStep("resume", "active", "Starting a fresh worker…");
      status.textContent =
        "INTERRUPTION VISIBLE · Checkpoint is safe. Starting a fresh worker from persisted storage…";
      await new Promise((resolve) => setTimeout(resolve, 900));
      const second = await run();
      if (!second?.paused && !second?.replay) {
        setProofStep("resume", "done", "Saved work reused");
        const proof = renderRecoveryVerdict(record);
        setProofStep("publish", proof.verified ? "done" : "failed", proof.verified ? "Check + Host complete" : "Verification failed");
        status.textContent = proof.verified
          ? "RECOVERY VERIFIED · Four specialist requests total. Zero duplicate paid calls. The corrected Host story is published."
          : "PROOF INCOMPLETE · The final record did not satisfy every recovery check. Inspect the failed checks below.";
        contributions.open = true;
        autoRecoveryActive = false;
      }
    } else if (autoRecover && !first?.replay) {
      const proof = renderRecoveryVerdict(record);
      setProofStep("interrupt", "failed", first?.error ? "Worker failed before checkpoint" : "No interruption recorded");
      setProofStep("publish", "failed", "Audience claim blocked");
      status.textContent = proof.verified
        ? "RECOVERY VERIFIED"
        : "PROOF INCOMPLETE · The deliberate interruption was not recovered. The app will not present this run as successful.";
      autoRecoveryActive = false;
    }
  } catch (e) {
    autoRecoveryActive = false;
    setProofStep("publish", "failed", "Recovery stopped");
    status.textContent = e.message;
  } finally {
    setBusy(false);
  }
}
start.onclick = () => create(false);
fault.onclick = () => {
  resetProofSteps();
  autoRecoveryActive = true;
  setProofStep("event", "active", "Injecting unseen event…");
  create(true, true);
};
resume.onclick = () => run();
correct.onclick = async () => {
  setBusy(true);
  try {
    render(
      await call(`/api/production/${session.id}/revise`, {
        action: "correct",
      }).then((r) => r.json()),
    );
    matchSession.set({
      source: "match",
      scenario: "wide",
      time: 16,
      corrected: record.input.corrected,
      language: record.input.language,
      mode: record.input.mode,
    });
    status.textContent =
      "Source revision saved. The caption and external output now use the new record. Run the revised desk to regenerate AI contributions.";
    resume.hidden = false;
    resume.textContent = "Run the revised desk";
  } catch (e) {
    status.textContent = e.message;
  } finally {
    setBusy(false);
  }
};
personalize.onclick = async () => {
  setBusy(true);
  try {
    render(
      await call(`/api/production/${session.id}/revise`, {
        action: "personalize",
        language: languages.value,
        mode: modes.value,
      }).then((r) => r.json()),
    );
    status.textContent =
      "The same evidence now has a different explanation and output language. Generate the AI discussion when ready.";
    resume.hidden = false;
    resume.textContent = "Generate this perspective";
  } catch (e) {
    status.textContent = e.message;
  } finally {
    setBusy(false);
  }
};
exportButton.onclick = () =>
  download(
    replay ? "btr-saved-receipt-replay.json" : "btr-production-proof.json",
    replay || record,
  );

// A collapsed receipt drawer keeps the Watch conversation readable.
const drawer = el("details", "agent-receipts"),
  summary = el("summary", "", "Inside the AI desk · tool receipts"),
  roomTrace = el("ol", "proof-trace");
drawer.append(summary, roomTrace);
document.getElementById("settings-dialog").append(drawer);
document.addEventListener("btr-agent-trace", (e) => {
  if (e.detail.key !== lastTraceKey) {
    lastTraceKey = e.detail.key;
    roomTrace.replaceChildren();
  }
  receipt(roomTrace, e.detail.data);
  summary.textContent = "Inside the AI desk · " + pretty(e.detail.data.action);
});
const truthAction = el(
  "button",
  "outline-button",
  "Run the correction + recovery proof ↗",
);
truthAction.onclick = () => {
  document.getElementById("inside-nav").click();
  workspace.scrollIntoView({ behavior: "smooth", block: "start" });
};
document.querySelector("#truth .truth-evidence-details").after(truthAction);
document.addEventListener('btr-run-recovery',()=>{
  document.getElementById('inside-nav').click();
  workspace.scrollIntoView({behavior:'smooth',block:'start'});
  if(!busy)fault.click();
});

const dataPanel = el("section", "proof-dataset"),
  dataHead = el("div", "proof-heading"),
  dataTitle = el("div");
dataTitle.append(
  el("span", "eyebrow", "THE SYNTHETIC DATASET / REPRODUCIBLE BY SEED"),
  el("h2", "", "A new match. The same standards."),
);
dataHead.append(dataTitle);
dataPanel.append(
  dataHead,
  el(
    "p",
    "",
    "Generate a complete 90-minute fixture with continuous ball locations between restarts, two periods, pressure events and a declared pass-difficulty heuristic. This export contains events and a validation report, without continuous player tracking. The authored 36-second sequence below has a separate 1 Hz tracking export.",
  ),
);
const seed = el("input");
seed.type = "number";
seed.min = "1";
seed.max = "1000000";
seed.value = "107";
seed.setAttribute("aria-label", "Dataset seed");
const validate = el("button", "red-button", "Generate & validate"),
  saveData = el("button", "outline-button", "Download dataset ↓"),
  dataActions = el("div", "proof-actions"),
  report = el("div", "dataset-report");
saveData.disabled = true;
dataActions.append(label("MATCH SEED", seed), validate, saveData);
dataPanel.append(
  dataActions,
  report,
  el(
    "p",
    "proof-note",
    "Event-only 90-minute fixture. Design targets and internal consistency checks. Not calibrated against real Premier League data. This fixture does not describe the generated film.",
  ),
);
workspace.after(dataPanel);
validate.onclick = async () => {
  validate.disabled = true;
  report.textContent = "Generating and checking the fixture…";
  try {
    const n = Number(seed.value);
    if (!Number.isInteger(n) || n < 1 || n > 1000000)
      throw Error("Enter a seed between 1 and 1000000.");
    dataset = await call("/api/dataset?seed=" + n, undefined, null).then((r) => r.json());
    report.replaceChildren();
    const v = dataset.validation;
    report.append(
      el(
        "strong",
        "dataset-verdict",
        v.valid ? "CONSISTENCY CHECKS PASSED" : "CHECKS NEED ATTENTION",
      ),
      el(
        "p",
        "",
        `${v.summary.events} events · ${v.summary.passes} passes · ${v.summary.completion_pct}% completed · ${v.summary.shots} shots · ${v.summary.pressures} pressure events`,
      ),
    );
    const checks = el("div", "dataset-checks");
    for (const check of v.checks) checks.append(el("span", "", check));
    report.append(checks);
    for (const warning of [...v.warnings, ...v.failures.map((x) => x.message)])
      report.append(el("p", "", warning));
    saveData.disabled = false;
  } catch (e) {
    report.textContent = e.message;
  } finally {
    validate.disabled = false;
  }
};
saveData.onclick = () => download(`btr-synthetic-${dataset.seed}.json`, dataset);

try {
  const saved = JSON.parse(sessionStorage.getItem("btr-proof-session") || "null");
  if (saved?.expires_at > Date.now()) {
    session = saved;
    const url = new URL("overlay.html", location.href);
    url.hash = new URLSearchParams({
      production: session.id,
      key: session.readKey,
    });
    output.href = url.href;
    output.hidden = false;
    refresh()
      .then(() => {
        status.textContent = "Restored the saved proof run. No model calls were made.";
      })
      .catch(() => {
        status.textContent = "The previous proof run is unavailable. Start a new desk.";
        session = null;
      });
  }
} catch {}
// A first visit can inspect real archived work without starting a paid run.
archiveReady
  .then((saved) => {
    if (!saved || session || busy || replay) return;
    const sample = saved.cases.find((c) => c.id === "wide-original");
    if (!sample) return;
    trace.replaceChildren();
    for (const item of sample.team.trace) receipt(trace, { ...item, replayed: true });
    contributions.querySelectorAll("article").forEach(n=>n.remove());
    for(const post of sample.team.posts){
      const row=el("article");
      row.append(el("b","",(roles[post.role]||post.role)+" · "+(post.engine==="azure_openai"?"SAVED AI":post.engine==="calculated"?"CALCULATED":post.engine==="evidence_rules"?"SOURCE CHECK":"REVIEWED FALLBACK")),el("p","",post.summary));
      if(post.caution)row.append(el("small","",post.caution));
      contributions.append(row);
    }
    status.textContent =
      "ARCHIVED GENERATIVE-DESK EVALUATION · " +
      new Date(saved.recorded_at).toLocaleString() +
      ". Saved historical receipts; open the evidence room above for the current composition workflow; no new AI request. Inspect the accepted outputs and any fallback reasons below.";
    captionTag.textContent = "LOCAL CAPTION PREVIEW · SOURCE R1";
    captionBody.textContent =
      "The winger and defender move toward the same side. Their movement coincides; the tracking does not prove why the defender moved.";
    metrics.replaceChildren();
    for (const [value, title] of [
      [sample.team.requests, "RECORDED MODEL REQUESTS"],
      [
        sample.team.posts.filter((p) => p.engine === "azure_openai").length + "/3",
        "RECORDED AI POSTS",
      ],
    ]) {
      const m = el("div");
      m.append(el("strong", "", String(value)), el("span", "", title));
      metrics.append(m);
    }
    const archive = el(
      "a",
      "proof-output",
      "Download archived evaluation + raw outputs ↓",
    );
    archive.href = "assets/btr-agent-evaluation.json";
    archive.download = "";
    left.append(archive);
  })
  .catch(() => {});
