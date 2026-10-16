import { renderEventPitch } from "./event-pitch.js";
import { createLabRun } from "./lab-run.js";
import { aiAvailability, availabilityText } from "./ai-availability.js";
import { lesson } from "./learning.js";
import { DialogueState } from "./dialogue.js";
const $ = (id) => document.getElementById(id),
  text = (id, value) => ($(id).textContent = value);
const embedded = new URLSearchParams(location.search).has("embedded");
if (embedded) document.documentElement.classList.add("embedded");
const reportHeight = () => {
  if (embedded)
    parent.postMessage(
      {
        type: "btr-lab-size",
        height: Math.ceil(document.body.getBoundingClientRect().height),
      },
      location.origin,
    );
};
new ResizeObserver(() => requestAnimationFrame(reportHeight)).observe(document.body);
addEventListener("message", (event) => {
  if (
    event.origin === location.origin &&
    event.source === parent &&
    event.data?.type === "btr-lab-resize"
  )
    reportHeight();
});
const reportUsage = () => {
  aiAvailability.check(true);
  if (embedded) parent.postMessage({ type: "btr-lab-usage" }, location.origin);
};
addEventListener("message", (event) => {
  if (
    event.origin === location.origin &&
    event.source === parent &&
    event.data?.type === "btr-pause-lab" &&
    active
  )
    $("stop").click();
});
const allowance = document.createElement("aside");
allowance.className = "ai-availability";
allowance.setAttribute("aria-label", "AI availability and daily allowance");
document.querySelector(".controls").before(allowance);
aiAvailability.subscribe((s) => {
  allowance.dataset.state = s.state;
  allowance.textContent =
    s.title + ". " + availabilityText(s) + " The event simulation remains available.";
});
aiAvailability.check();
const dialogue = new DialogueState();
let liveStats = null,
  lastEvent = null,
  lastPass = null;
let base = "",
  session = null,
  controller = null,
  mode = "fan",
  current = null,
  active = false,
  lastId = 0,
  attempt = 0;
const checkpoints = new Set();
const configReady = fetch("api-config.json")
  .then((r) => {
    if (!r.ok) throw Error("Studio configuration unavailable. Refresh to retry.");
    return r.json();
  })
  .then((config) => {
    base = ["localhost", "127.0.0.1"].includes(location.hostname)
      ? ""
      : config.baseUrl || "";
  });
configReady.catch(() => {});
const run = createLabRun({
  create: async (input) => {
    await configReady;
    return request("/api/runs", {
      method: "POST",
      body: JSON.stringify(input),
    }).then((r) => r.json());
  },
  stop: async (value) =>
    request("/api/runs/" + value.id + "/stop", {
      method: "POST",
      headers: { Authorization: "Bearer " + value.token },
    }),
});
const clubs = { home: "Harbor", away: "Northbridge" },
  names = {
    home: [
      "Eli Ward",
      "Noah Ellis",
      "Leo Martin",
      "Oscar Reed",
      "Finn Clarke",
      "Amir Cole",
      "Luca Moreau",
      "Mateo Silva",
      "Theo Brooks",
      "Rafael Costa",
      "Isaac Hart",
    ],
    away: [
      "Max Berg",
      "Jules Laurent",
      "Ben Shaw",
      "Alex Ross",
      "Milan Voss",
      "Samir Ali",
      "Hugo Bell",
      "Arlo King",
      "Adam Price",
      "Nico Stone",
      "Tom Avery",
    ],
  };
const time = (n) =>
  `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(Math.floor(n % 60)).padStart(2, "0")}`;
async function request(path, options = {}) {
  const r = await fetch(base + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
      ...options.headers,
    },
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw Error(e.error || `Studio returned ${r.status}. Please retry.`);
  }
  return r;
}
function setActive(value) {
  active = value;
  for (const id of ["seed", "language", "speed"]) $(id).disabled = value;
  $("start").disabled = value;
  $("stop").hidden = !value;
  if (!value) text("start", session ? "RUN ANOTHER MATCH ↗" : "START MATCH ▶");
}
function renderLesson() {
  const enabled = ["beginner", "math"].includes(mode);
  $("learning").hidden = !enabled;
  if (!enabled) return;
  const l = lesson(mode, liveStats, lastEvent, lastPass, $("language").value);
  text("lesson-kicker", `${l.kicker}${liveStats ? " · " + time(liveStats.second) : ""}`);
  text("lesson-title", l.title);
  text("lesson-body", l.body);
  text("lesson-equation", l.equation);
  text("lesson-detail", l.detail);
  $("lesson-examples").replaceChildren();
  for (const example of l.examples || []) {
    const row = document.createElement("div"),
      title = document.createElement("strong"),
      equation = document.createElement("p");
    title.textContent = example.title;
    equation.textContent = example.equation;
    row.append(title, equation);
    $("lesson-examples").append(row);
  }
  text("lesson-note", l.note || "");
}
function renderDialogue() {
  const show = dialogue.pending && $("stream-toggle").checked;
  $("stream-box").hidden = !show;
  if (!show) return;
  const draft = dialogue.get(mode);
  text("stream-label", `LIVE AI DRAFT · ${time(dialogue.cutoff)} · NOT YET VALIDATED`);
  text("dialogue", draft?.text || "Preparing this perspective…");
  if (draft) text("latency", `${(draft.first_text_ms / 1000).toFixed(1)}s TO FIRST TEXT`);
}
function resetDisplay() {
  for (const [id, value] of Object.entries({
    score: "0 : 0",
    clock: "00:00",
    phase: "AWAITING KICKOFF",
    shots: "0 / 0",
    completion: "0 / 0",
    possession: "50 / 50",
    headline: "THE STORY STARTS HERE.",
    explanation:
      "A new match is beginning. The first evidence-linked analysis arrives at fifteen match minutes.",
    interpretation:
      "Waiting for recorded events before drawing a tactical interpretation.",
    engine: "WAITING FOR EVIDENCE",
    cutoff: "—",
    count: "0 events received",
    rhythm: "Waiting for play",
    "analysis-state": "Awaiting checkpoint",
    "recap-status": "Your new full-time recap will appear when this match ends.",
    "lower-title": "READY FOR KICKOFF.",
    "lower-kicker": "HARBOR FC / NORTHBRIDGE",
    latency: "AZURE OPENAI",
    cached: "EVIDENCE FIRST",
    caution:
      "Synthetic event simulation. The new analysis will use only events received in this fixture.",
  }))
    text(id, value);
  $("facts").replaceChildren();
  checkpoints.clear();
  text("run-progress", "0 / 6 analysis checkpoints");
  $("match-progress").style.width = "0%";
  document.querySelector(".lab-progress").setAttribute("aria-valuenow", "0");
  $("posbar").style.width = "50%";
  drawEvent({ to: [52.5, 34] });
}
function renderInsight() {
  if (!current) return;
  const a = current.audiences[mode];
  if (!a) return;
  text("headline", a.headline);
  text("explanation", a.explanation);
  text("interpretation", a.interpretation);
  text("caution", a.caution);
  text("cutoff", `AS OF ${time(current.cutoff)}`);
  text(
    "engine",
    current.engine === "azure_openai"
      ? "AZURE AI · EVIDENCE LINKED"
      : "STATISTICS ONLY · AI UNAVAILABLE",
  );
  text(
    "latency",
    current.engine === "azure_openai"
      ? `${(current.latency_ms / 1000).toFixed(1)}s ${current.cached ? "CACHE RESPONSE" : "AI RESPONSE"}`
      : "DETERMINISTIC FALLBACK",
  );
  text("cached", current.cached ? "REUSED ANALYSIS" : current.model || "NO MODEL OUTPUT");
  text(
    "lower-kicker",
    `${current.recap ? "FULL-TIME RECAP" : "THE BTR BREAKDOWN"} · ${time(current.cutoff)}`,
  );
  text("lower-title", a.headline.toUpperCase());
  $("facts").replaceChildren();
  for (const id of a.evidence_ids) {
    const fact = current.evidence.find((f) => f.id === id);
    if (!fact) continue;
    const row = document.createElement("div");
    row.className = "fact";
    const title = document.createElement("b");
    title.textContent = id;
    const body = document.createElement("span");
    body.textContent = fact.description
      ? `${fact.description} ${
          typeof fact.value === "object"
            ? Object.entries(fact.value)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" · ")
            : fact.value
        }`
      : `${time(fact.second)} · ${fact.team} · ${fact.player} · ${fact.type}${fact.outcome ? " · " + fact.outcome : ""}`;
    row.append(title, body);
    $("facts").append(row);
  }
  if (current.recap) text("recap-status", a.explanation);
  renderDialogue();
}
function drawEvent(e) {
  if (!e?.to) return;
  const actor = names[e.team]?.[e.player - 1];
  text(
    "pitch-event",
    actor
      ? `${time(e.second)} · ${clubs[e.team]} · ${actor}${e.type === "pass" ? ` → ${names[e.team]?.[e.recipient - 1]} · ${e.complete ? "completed" : "intercepted"} · ${e.distance_m} m · ${e.ball_speed_kmh} km/h` : ` · ${e.type}${e.outcome ? " · " + e.outcome : ""}`}`
      : "Event positions appear here after kickoff.",
  );
  renderEventPitch($("event-art"), e, names);
}

function eventRow(e) {
  const row = document.createElement("div");
  row.className = "event";
  const tm = document.createElement("time");
  tm.textContent = time(e.second);
  const type = document.createElement("b");
  type.textContent = e.type;
  const detail = document.createElement("span");
  detail.textContent = `${clubs[e.team]} · ${names[e.team][e.player - 1]}${e.type === "pass" ? ` → ${names[e.team][e.recipient - 1]} · ${e.complete ? "complete" : "intercepted"} · ${e.distance_m} m` : e.outcome ? " · " + e.outcome : e.reason ? " · " + e.reason.replaceAll("_", " ") : ""}`;
  row.append(tm, type, detail);
  return row;
}
function onEvent(type, data) {
  if (type === "state") {
    const s = data.stats;
    liveStats = s;
    if (data.batch.length) {
      lastEvent = data.batch.at(-1);
      lastPass =
        [...data.batch].reverse().find((e) => e.type === "pass" && e.complete) ||
        lastPass;
    }
    renderLesson();
    text("score", `${s.score.home} : ${s.score.away}`);
    text("clock", time(s.second));
    text("phase", s.second >= 5400 ? "FULL TIME" : "SIMULATION IN PLAY");
    text("possession", `${s.possession.home} / ${s.possession.away}`);
    $("posbar").style.width = s.possession.home + "%";
    text("shots", `${s.shots.home} / ${s.shots.away}`);
    text("completion", `${s.completion.home} / ${s.completion.away}`);
    text("count", `${s.events} events received`);
    $("match-progress").style.width = (s.second / 5400) * 100 + "%";
    document
      .querySelector(".lab-progress")
      .setAttribute("aria-valuenow", String(Math.floor(s.second / 60)));
    text("rhythm", s.rhythm);
    text("processing", `${data.processing_ms} ms EVENT PROCESSING`);
    if (data.batch.length) {
      $("ledger").querySelector(".empty")?.remove();
      for (const e of data.batch) $("ledger").prepend(eventRow(e));
      while ($("ledger").children.length > 35) $("ledger").lastChild.remove();
      drawEvent([...data.batch].reverse().find((e) => e.to));
    }
  } else if (type === "dialogue") {
    if (dialogue.update(data)) renderDialogue();
  } else if (type === "thinking") {
    dialogue.begin(data.cutoff);
    renderDialogue();
    text("analysis-state", `Analyzing ${time(data.cutoff)}`);
    text(
      "status",
      data.recap
        ? "Final whistle. Your full-match recap is being generated."
        : `AI is interpreting the evidence through ${time(data.cutoff)}. The event feed continues.`,
    );
  } else if (type === "insight" || type === "recap") {
    checkpoints.add(data.cutoff);
    text("run-progress", `${checkpoints.size} / 6 analysis checkpoints`);
    reportUsage();
    dialogue.finish(data.cutoff);
    renderDialogue();
    if (!current || data.cutoff >= current.cutoff) {
      current = data;
      renderInsight();
    }
    text(
      "analysis-state",
      data.engine === "azure_openai"
        ? `Explained ${time(data.cutoff)}`
        : "Fallback · statistics ready",
    );
    text(
      "status",
      data.engine === "azure_openai"
        ? `Evidence-linked ${data.recap ? "recap" : "analysis"} ready through ${time(data.cutoff)}. Switch perspectives or inspect its sources.`
        : "AI unavailable for this checkpoint. Calculated match statistics remain available.",
    );
    $("download").disabled = false;
  } else if (type === "complete") {
    setActive(false);
    text("phase", "FULL TIME");
    text("start", "RUN ANOTHER MATCH ↗");
    reportUsage();
    text("connection", "AZURE STUDIO · MATCH COMPLETE");
  } else if (type === "error") {
    text("status", data.message);
  }
}
async function stream() {
  const response = await request(`/api/runs/${session.id}/stream`, {
    signal: controller.signal,
  });
  const reader = response.body.getReader(),
    decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let split;
    while ((split = buffer.indexOf("\n\n")) !== -1) {
      const block = buffer.slice(0, split);
      buffer = buffer.slice(split + 2);
      let type = "message",
        data = "",
        id = 0;
      for (const line of block.split("\n")) {
        if (line.startsWith("event:")) type = line.slice(6).trim();
        if (line.startsWith("data:")) data += line.slice(5).trim();
        if (line.startsWith("id:")) id = Number(line.slice(3));
      }
      if (id && id <= lastId) continue;
      if (id) lastId = id;
      if (data) onEvent(type, JSON.parse(data));
    }
  }
  if (active) throw Error("The stream disconnected. Start another match to reconnect.");
}
$("start").addEventListener("click", async () => {
  const ticket = ++attempt;
  setActive(true);
  dialogue.reset();
  liveStats = null;
  lastEvent = null;
  lastPass = null;
  renderDialogue();
  renderLesson();
  resetDisplay();
  text("status", "Connecting to the studio…");
  text("start", "CONNECTING…");
  controller?.abort();
  current = null;
  lastId = 0;
  $("ledger").replaceChildren();
  $("download").disabled = true;
  try {
    const created = await run.start({
      seed: Number($("seed").value),
      language: $("language").value,
      speed: Number($("speed").value),
      audience: mode,
    });
    if (!created || ticket !== attempt) return;
    session = created;
    controller = new AbortController();
    text("start", "MATCH IN PLAY");
    text("connection", "STUDIO · STREAM CONNECTED");
    text("status", "Match underway. First AI analysis at 15 match minutes.");
    await stream();
  } catch (e) {
    if (ticket === attempt && e.name !== "AbortError") {
      dialogue.reset();
      renderDialogue();
      text("status", e.message);
      setActive(false);
      text("start", "RETRY MATCH ↗");
    }
  }
});
$("stop").addEventListener("click", () => {
  attempt++;
  controller?.abort();
  dialogue.reset();
  renderDialogue();
  setActive(false);
  text("status", "Match stopped. Choose a fixture to start again.");
  text("phase", "STOPPED");
  run.stop().finally(reportUsage);
});
for (const button of document.querySelectorAll("[data-mode]"))
  button.addEventListener("click", () => {
    mode = button.dataset.mode;
    for (const b of document.querySelectorAll("[data-mode]")) {
      b.classList.toggle("selected", b === button);
      b.setAttribute("aria-pressed", String(b === button));
    }
    text(
      "perspective",
      {
        fan: "Fan perspective",
        analyst: "Tactical analyst",
        player: "Mateo Silva · #8",
        beginner: "New to football",
        math: "Math explained",
      }[mode],
    );
    renderInsight();
    renderLesson();
    renderDialogue();
  });
$("download").addEventListener("click", async () => {
  try {
    const r = await request(`/api/runs/${session.id}/export`),
      data = await r.json(),
      url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.match_id}-${Math.floor(data.cutoff)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    text("status", e.message);
  }
});
addEventListener("pagehide", () => {
  if (active && session)
    fetch(`${base}/api/runs/${session.id}/stop`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.token}` },
      keepalive: true,
    }).catch(() => {});
});
try {
  await configReady;
  const health = await request("/api/health").then((r) => r.json());
  text(
    "connection",
    health.ai_configured
      ? "STUDIO CONNECTED · SEE AI ALLOWANCE"
      : "STUDIO CONNECTED · AI UNAVAILABLE",
  );
} catch {
  text("connection", "STUDIO CONNECTION PENDING");
  text("status", "The Azure studio may be waking up. Start a match to try connecting.");
}

$("stream-toggle").addEventListener("change", renderDialogue);
$("language").addEventListener("change", renderLesson);
reportHeight();
