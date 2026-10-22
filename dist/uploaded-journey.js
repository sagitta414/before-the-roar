const $ = (id) => document.getElementById(id);
const state = { source: null, cues: [], events: [], players: [], detectorHealth: null, corrected: false, revision: 1 };
const panels = {};
const cueNames = { pass: "possible pass", shot: "shot candidate", duel: "duel" };

function latest() {
  if (state.events.length) {
    const event = state.events.at(-1);
    return { id: event.id, type: event.type, second: event.end, measured: true, event };
  }
  const cue = state.cues.at(-1);
  return cue ? { ...cue, measured: false } : null;
}
function mode() { return $("session-mode")?.value || "fan"; }
function language() { return $("session-language")?.value || "en"; }
function observation(item) {
  if (!item) return "No event has reached the dossier yet.";
  if (!item.measured) return `A reviewer marked a ${cueNames[item.type] || item.type} at ${item.second.toFixed(1)} seconds.`;
  if (item.type === "pass") return `The compatible marker detector observed a ${item.event.distance.toFixed(1)} m transfer candidate at ${item.second.toFixed(1)} seconds.`;
  return `The compatible marker detector observed a ${item.type === "shot" ? "shot" : item.type} candidate at ${item.second.toFixed(1)} seconds.`;
}
function teaching(item) {
  if (state.corrected) return "The active event was removed from this revision. BTR withdraws the explanation instead of filling the gap.";
  if (!item) return "Play the uploaded clip and mark a visible moment. The explanation will follow that evidence.";
  if (!item.measured) {
    if (mode() === "beginner") return `A ${cueNames[item.type] || item.type} is a visible football action. The review marker says where to look; it does not prove the outcome or the player's intention.`;
    if (mode() === "math") return "This source has a playback timestamp, but no calibrated pitch distance. BTR therefore publishes no speed or physical-distance calculation.";
    if (mode() === "analyst") return "Use the cue to inspect shape and nearby movement, while keeping tactical cause and outcome outside the claim.";
    if (mode() === "player") return "Follow the player nearest the marked action, but do not assign identity unless the source has passed enrollment and calibration.";
    return "This is a reviewed moment worth replaying. The source supports the visible action and timestamp only.";
  }
  const event = item.event;
  if (mode() === "beginner") return event.type === "pass" ? "A completed-transfer candidate means the ball appears to move from one enrolled marker to another. It does not by itself prove that the pass created a chance." : "The ball moves toward the goal area, so BTR calls it a shot candidate. The video does not prove a goal.";
  if (mode() === "math") return event.type === "pass" ? `Ground-plane estimate: ${event.distance.toFixed(1)} m over ${(event.end-event.start).toFixed(1)} s, producing ${event.speed.toFixed(1)} km/h. Camera calibration and marker compatibility are required.` : `Ground-plane speed estimate: ${event.speed.toFixed(1)} km/h. Aerial motion remains outside the model.`;
  if (mode() === "analyst") return "The measured event establishes ball movement between enrolled markers. Positional consequence still needs the surrounding tracks; tactical intention remains unproven.";
  if (mode() === "player") return `Focus on enrolled marker ${event.from}${event.to ? ` and receiver ${event.to}` : ""}. Identity comes from the declared marker roster, not face recognition.`;
  return "BTR can explain the measured action while keeping outcome, intent and tactical cause separate from the observation.";
}
function packet() {
  const item = latest();
  return {
    schema: "btr.uploaded-clip-overlay.v1",
    source_sha256: state.source?.hash,
    source_name: state.source?.name,
    synthetic_or_authorized: true,
    revision: state.revision,
    corrected: state.corrected,
    audience: { mode: mode(), language: language() },
    cue: item && !state.corrected ? { id: item.id, second: item.second, type: item.type, title: "Uploaded clip", text: teaching(item), valid_for_seconds: 6 } : null,
    evidence: { observation: state.corrected ? "Active cue withdrawn by reviewer." : observation(item), compatibility_gate: state.source?.compatibility || null },
    limitations: item?.measured ? ["Experimental controlled-marker measurement.", "No tactical causation or certified outcome."] : ["Human-reviewed cue only.", "No automatic identity, distance, speed or outcome."],
  };
}
function go(section) { $(`${section}-nav`)?.click(); }
function savePacket() {
  const url = URL.createObjectURL(new Blob([JSON.stringify(packet(), null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = "btr-uploaded-clip-overlay.json"; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function basePanel(stage, title, copy) {
  const panel = document.createElement("section"); panel.className = `uploaded-dossier uploaded-dossier--${stage}`; panel.hidden = true;
  panel.innerHTML = `<header><div><span>UPLOADED CLIP DOSSIER / ${stage.toUpperCase()}</span><h2>${title}</h2><p>${copy}</p></div><b data-upload-state>LOCAL SOURCE</b></header><div data-upload-body></div><nav><button type="button" data-route="watch">01 Watch</button><button type="button" data-route="centre">02 Understand</button><button type="button" data-route="lab">03 Measure</button><button type="button" data-route="truth">04 Challenge</button><button type="button" data-route="inside">05 Publish</button></nav>`;
  panel.querySelectorAll("[data-route]").forEach((button) => button.onclick = () => go(button.dataset.route));
  return panel;
}
function mount() {
  const definitions = {
    watch: ["Your film is now the source.", "Play the uploaded clip. Every downstream explanation cites this source receipt and its current revision."],
    centre: ["One visible action. Five useful readings.", "The teaching layer changes for the viewer while the source evidence stays fixed."],
    truth: ["Change the cue. Test the story.", "Withdraw the active observation and see the explanation and publish packet change together."],
    inside: ["A screen cue with its proof attached.", "Export a timed overlay packet containing the source hash, audience, revision, evidence and limitations."],
  };
  for (const [section, [title, copy]] of Object.entries(definitions)) {
    const host = $(section); if (!host) continue;
    panels[section] = basePanel(section, title, copy); host.prepend(panels[section]);
  }
}
function render() {
  const item = latest(), claim = observation(item), story = teaching(item), gate = state.source?.compatibility;
  document.body.classList.toggle("has-upload-dossier", !!state.source);
  for (const panel of Object.values(panels)) { panel.hidden = !state.source; if (state.source) panel.querySelector("[data-upload-state]").textContent = state.source.measured ? "COMPATIBILITY PASSED" : "REVIEWED CUES ONLY"; }
  if (!state.source) return;
  const watch = panels.watch.querySelector("[data-upload-body]");
  watch.innerHTML = '<div class="uploaded-watch"><div class="uploaded-video"><video controls playsinline></video><span>AUTHORIZED LOCAL VIDEO · ORIGINAL BYTES NOT UPLOADED</span></div><div class="uploaded-now"><small>CURRENT EVIDENCE</small><h3></h3><p></p><div class="uploaded-facts"></div><button type="button">Explain this play →</button></div></div>';
  watch.querySelector("video").src = state.source.url; watch.querySelector("h3").textContent = state.source.name; watch.querySelector("p").textContent = claim;
  const facts = watch.querySelector(".uploaded-facts"); facts.textContent = `${state.source.metadata.duration.toFixed(1)} s · ${state.source.metadata.width}×${state.source.metadata.height} · SHA ${state.source.hash.slice(0, 10)}…`;
  watch.querySelector("button").onclick = () => go("centre");
  const centre = panels.centre.querySelector("[data-upload-body]"); centre.innerHTML = '<div class="uploaded-explain"><small>THE EXPLANATION</small><h3></h3><p></p><div><button data-mode="beginner">New to football</button><button data-mode="math">Show the math</button><button data-mode="analyst">Tactical</button><button data-mode="player">Player focus</button></div><button class="uploaded-next">Challenge this claim →</button></div>';
  centre.querySelector("h3").textContent = item ? `${item.second.toFixed(1)}s / ${cueNames[item.type] || item.type}` : "Waiting for a reviewed moment"; centre.querySelector("p").textContent = story;
  centre.querySelectorAll("[data-mode]").forEach((button) => { button.setAttribute("aria-pressed", String(mode() === button.dataset.mode)); button.onclick = () => { $("session-mode").value = button.dataset.mode; $("session-mode").dispatchEvent(new Event("change", { bubbles: true })); render(); }; }); centre.querySelector(".uploaded-next").onclick = () => go("truth");
  const truth = panels.truth.querySelector("[data-upload-body]"); truth.innerHTML = '<div class="uploaded-truth"><article><small>ORIGINAL EVIDENCE</small><strong></strong><p></p></article><i>→</i><article><small>CURRENT REVISION</small><strong></strong><p></p></article></div><button class="uploaded-correct"></button>';
  truth.querySelector("article:first-child strong").textContent = item ? "ACTIVE CUE" : "NO CUE"; truth.querySelector("article:first-child p").textContent = claim; truth.querySelector("article:last-of-type strong").textContent = state.corrected ? "CLAIM WITHDRAWN" : "CLAIM RETAINED"; truth.querySelector("article:last-of-type p").textContent = state.corrected ? "The current publish packet contains no overlay cue. The source receipt and revision remain available." : story;
  const correct = truth.querySelector(".uploaded-correct"); correct.textContent = state.corrected ? "Restore original evidence ↺" : "Withdraw this observation →"; correct.disabled = !item; correct.onclick = () => { state.corrected = !state.corrected; state.revision++; render(); };
  const publish = panels.inside.querySelector("[data-upload-body]"); publish.innerHTML = '<div class="uploaded-publish"><div><small>PUBLIC OUTPUT</small><h3></h3><p></p><button>Download overlay + evidence ↓</button></div><pre></pre></div>';
  publish.querySelector("h3").textContent = state.corrected ? "No cue released" : item ? "Timed cue ready" : "Waiting for evidence"; publish.querySelector("p").textContent = state.corrected ? "The corrected revision prevents the withdrawn explanation from reaching the audience." : "The same evidence is now packaged for a screen, stream or mobile companion."; publish.querySelector("pre").textContent = JSON.stringify(packet(), null, 2); publish.querySelector("button").onclick = savePacket;
}

mount();
document.addEventListener("btr-upload-source", (event) => { state.source = event.detail; state.cues = []; state.events = []; state.corrected = false; state.revision = 1; render(); setTimeout(() => go("watch"), 0); });
document.addEventListener("btr-upload-cues", (event) => { state.cues = event.detail.cues || []; state.corrected = false; state.revision++; render(); });
document.addEventListener("btr-upload-detection", (event) => { state.events = event.detail.events || []; state.players = event.detail.players || []; state.detectorHealth = event.detail.detectorHealth; state.corrected = false; state.revision++; render(); });
for (const id of ["session-mode", "session-language"]) $(id)?.addEventListener("change", render);
