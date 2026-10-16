import { installNavigation } from "./navigation.js?v=44";
import { aiAvailability, availabilityText } from "./ai-availability.js";
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  n.className = cls;
  if (text) n.textContent = text;
  return n;
};
installNavigation();
const bar = el("aside", "ai-availability"),
  title = el("strong", ""),
  detail = el("small", "");
bar.setAttribute("aria-label", "AI availability and daily allowance");
bar.append(title, detail);
document.querySelector(".watch-source-bar").after(bar);
const demoLink = el("a", "demo-available", "Guided demo always available →");
demoLink.href = "#watch";
demoLink.onclick = (e) => {
  e.preventDefault();
  document.dispatchEvent(new Event("btr-open-guided"));
};
bar.append(demoLink);
const retry = el('button', 'ai-retry', 'Retry AI connection');
retry.type = 'button';
retry.onclick = () => aiAvailability.check(true);
bar.append(retry);
const notice = el("p", "crew-availability");
notice.setAttribute("role", "status");
document.querySelector(".party-header").after(notice);
let posts = [];
function update(s) {
  bar.dataset.state = s.state;
  title.textContent = s.title;
  detail.textContent = availabilityText(s);
  retry.hidden = !['unreachable', 'unknown', 'offline', 'checking', 'retrying'].includes(s.state);
  retry.disabled = ['checking', 'retrying'].includes(s.state);
  retry.textContent = retry.disabled ? 'Connecting…' : 'Retry AI connection';
  const fallback = posts.some((p) => p.engine === "reviewed_fallback"),
    mixed = posts.some((p) => p.engine === "azure_openai");
  notice.hidden = !fallback && !["offline", "exhausted", "unknown", "unreachable", "checking", "retrying"].includes(s.state);
  notice.textContent = fallback
    ? mixed
      ? "Some AI responses unavailable · reviewed notes shown for those presenters."
      : "AI unavailable · reviewed notes shown. These are not a new AI answer."
    : s.state === "exhausted"
      ? "AI allowance reached · reviewed notes shown. Ask the crew can retrieve a saved answer; new answers wait for the reset."
      : s.state === "offline"
        ? "AI unavailable · reviewed notes shown."
        : s.title + ' · reviewed notes remain available.';
  const connection = document.getElementById("connection-status");
  if (connection) connection.textContent = s.title;
}
aiAvailability.subscribe(update);
aiAvailability.check();
document.addEventListener("btr-contributions", (e) => {
  posts = e.detail.posts;
  update(aiAvailability.get());
});
document.addEventListener("btr-ai-finished", () => aiAvailability.check(true));
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) aiAvailability.check();
});
setInterval(() => {
  if (!document.hidden) aiAvailability.check();
}, 60000);
const kit = el("details", "recording-kit");
kit.innerHTML =
  '<summary>Recording kit · 105 seconds, with evidence</summary><p>Open the guided match and choose Play the 105-second tour. Record the actual controls and keep source labels visible.</p><ol><li><b>0–18s:</b> Watch the synthetic play.</li><li><b>18–36s:</b> Read the five public contributions.</li><li><b>36–52s:</b> Inspect passing gain and source events.</li><li><b>52–72s:</b> Correct the tracking and withdraw the claim.</li><li><b>72–105s:</b> Compare beginner, Spanish and math captions.</li></ol><p>Inside BTR separately provides a saved-receipt replay and an explicit live recovery test. Saved playback is labeled and makes zero AI requests.</p><p><a href="assets/btr-recording-guide.txt" download>Download the recording script ↓</a> · <a href="assets/btr-verification-summary.json" download>Earlier live recovery verification ↓</a></p><p><a href="assets/btr-footage-register.json" download>Footage provenance and creator permission ↓</a></p>';
document.querySelector(".proof-console").append(kit);
