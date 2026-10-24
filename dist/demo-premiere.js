const dialog = document.getElementById("final-demo-dialog");
const video = document.getElementById("final-demo-video");
const status = document.getElementById("final-demo-copy-status");
const openButton = document.getElementById("open-final-demo");
const closeButton = document.getElementById("close-final-demo");
const copyButton = document.getElementById("copy-final-demo-link");

export function finalDemoShareUrl() {
  const url = new URL(location.origin + location.pathname);
  url.searchParams.set("demo", "1");
  return url.href;
}

export function openFinalDemo() {
  if (!dialog || dialog.open) return;
  status.textContent = "";
  // Avoid decoding the background match and the premiere at the same time.
  document.querySelectorAll("video").forEach((player) => {
    if (player !== video) player.pause();
  });
  video.preload = "auto";
  dialog.showModal();
  closeButton.focus();
}

function closeFinalDemo() {
  if (!dialog?.open) return;
  video.pause();
  dialog.close();
  openButton?.focus();
}

async function copyShareLink() {
  const link = finalDemoShareUrl();
  try {
    await navigator.clipboard.writeText(link);
    status.textContent = "Share link copied.";
  } catch {
    const field = document.createElement("textarea");
    field.value = link;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();
    document.execCommand("copy");
    field.remove();
    status.textContent = "Share link copied.";
  }
}

openButton?.addEventListener("click", openFinalDemo);
closeButton?.addEventListener("click", closeFinalDemo);
copyButton?.addEventListener("click", copyShareLink);
video?.addEventListener("waiting", () => {
  status.textContent = "Buffering the demo… playback will resume automatically.";
});
video?.addEventListener("playing", () => { status.textContent = ""; });
video?.addEventListener("error", () => {
  status.textContent = "The video could not load. Use Open video to try the direct player.";
});
document.addEventListener("btr-open-demo", openFinalDemo);
dialog?.addEventListener("click", (event) => {
  if (event.target === dialog) closeFinalDemo();
});
dialog?.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeFinalDemo();
});

if (new URLSearchParams(location.search).get("demo") === "1") {
  queueMicrotask(openFinalDemo);
}
