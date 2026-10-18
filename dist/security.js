const $ = (id) => document.getElementById(id);
const status = $("security-live-status");
const receipt = $("security-live-receipt");
const capabilities = $("security-live-caps");
const receiptPanel = $("security-receipt");

function capability(label, ready) {
  const item = document.createElement("span");
  item.dataset.ready = ready ? "true" : "false";
  item.textContent = label;
  return item;
}

function safeReceipt(data) {
  return {
    checked_at: new Date().toISOString(),
    service: data.service,
    version: data.version,
    model: data.model,
    ai_configured: data.ai_configured,
    foundry: {
      configured: data.foundry_configured,
      model: data.foundry_model,
      authority: "advisory; deterministic evidence gate remains final",
    },
    execution: {
      tool_backed_agents: data.agent_tools,
      streaming: data.streaming,
      durable_checkpoints: data.durable_checkpoints,
      persistent_cache: data.persistent_cache,
      active_runs: data.active_runs,
    },
    delivery: {
      production_proof: data.production_proof,
      external_broadcast: data.external_broadcast,
      pitchside_video: data.pitchside_video,
      film_duration_seconds: data.film_duration,
    },
    public_roles: data.video_discussion_roles,
    perspectives: data.perspectives,
    usage: data.usage,
    boundary: "Public operational metadata only. No tokens, prompts, private reasoning, object IDs or stored viewer questions.",
  };
}

if (status && receipt) {
  const config = fetch("api-config.json").then((response) => response.json()).catch(() => ({ baseUrl: "" }));
  (async () => {
    try {
      const { baseUrl = "" } = await config;
      const response = await fetch(baseUrl + "/api/health", { signal: AbortSignal.timeout(8000) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw Error("Health check unavailable");
      const limit = Number(data.usage?.limit ?? data.allowance);
      const used = Number(data.usage?.used ?? 0);
      const available = Number.isFinite(limit) ? Math.max(0, limit - used) : "—";
      status.dataset.state = "online";
      status.querySelector("span").textContent = "LIVE AZURE RECEIPT";
      status.querySelector("strong").textContent = "PROTECTED PATH ONLINE";
      status.querySelector("p").textContent = `Service ${data.version ?? "verified"} · ${available} requests available today · playback uses none`;
      capabilities?.replaceChildren(
        capability("5 specialist roles", Array.isArray(data.video_discussion_roles) && data.video_discussion_roles.length === 5),
        capability("Foundry referee", data.foundry_configured),
        capability("Durable recovery", data.durable_checkpoints),
        capability("External broadcast", data.external_broadcast),
      );
      receipt.textContent = JSON.stringify(safeReceipt(data), null, 2);
    } catch (error) {
      status.dataset.state = "offline";
      status.querySelector("span").textContent = "LAST VERIFIED ARCHITECTURE";
      status.querySelector("strong").textContent = "LIVE RECEIPT UNAVAILABLE";
      status.querySelector("p").textContent = "The documented controls remain inspectable. Retry when the Azure service is reachable.";
      capabilities?.replaceChildren(capability("Fail-closed display", true));
      receipt.textContent = JSON.stringify({ checked_at: new Date().toISOString(), status: "unavailable", message: error.message }, null, 2);
    }
  })();
}

const filterButtons = [...document.querySelectorAll("[data-security-filter]")];
const cards = [...document.querySelectorAll("[data-security-group]")];
function setFilter(filter) {
  for (const button of filterButtons) {
    const active = button.dataset.securityFilter === filter;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  }
  for (const card of cards) card.hidden = filter !== "all" && card.dataset.securityGroup !== filter;
}
for (const button of filterButtons) button.addEventListener("click", () => setFilter(button.dataset.securityFilter));
setFilter("implemented");

$("security-open-receipt")?.addEventListener("click", () => {
  receiptPanel.open = true;
  receiptPanel.scrollIntoView({ behavior: "smooth", block: "center" });
});
