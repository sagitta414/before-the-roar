const dialog = document.getElementById("final-demo-dialog");
const video = document.getElementById("final-demo-video");
const status = document.getElementById("final-demo-copy-status");
const openButton = document.getElementById("open-final-demo");
const closeButton = document.getElementById("close-final-demo");
const copyButton = document.getElementById("copy-final-demo-link");
const cuts = {
  "showcase": {
    "src": "assets/before-the-roar-showcase-v185.mp4",
    "poster": "assets/demo-v185-poster.jpg",
    "label": "3:55 · UPDATED PRODUCT TOUR · CAPTIONED",
    "chapters": [
      [
        4,
        "Watch Party"
      ],
      [
        75.378667,
        "Understand"
      ],
      [
        87.378667,
        "Measure"
      ],
      [
        129.145334,
        "The correction"
      ],
      [
        145.145334,
        "Your phone"
      ],
      [
        173.612001,
        "Publish"
      ],
      [
        198.812001,
        "Paired phone correction"
      ],
      [
        212.812001,
        "Architecture"
      ]
    ]
  },
  "short": {
    "src": "assets/before-the-roar-judge-v206.mp4",
    "poster": "assets/demo-v206-poster.jpg",
    "label": "1:53 · FULL SCREEN · CORRECTION MADE CLEAR",
    "chapters": [
      [0, "The football moment"],
      [7.3, "Watch Party"],
      [16.9, "Understand the play"],
      [27.1, "Measure the source"],
      [35.6, "The specialists investigate"],
      [47.7, "The viewer challenges"],
      [54.3, "Truth Lab correction"],
      [60.4, "Corrected AI round"],
      [66.4, "AI desk receipts"],
      [72, "Pocket Director"],
      [80.7, "Accessibility Director"],
      [89.2, "Publish"],
      [97.6, "Architecture"]
    ]
  }
};
const chapters = document.createElement("nav");
chapters.className = "demo-chapters";
chapters.setAttribute("aria-label", "Demo chapters");
dialog?.querySelector(".final-demo-player")?.after(chapters);
function renderChapters() {
  chapters.replaceChildren();
  for (const [time, title] of cuts[selectedCut].chapters) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = title;
    button.setAttribute("aria-label", `Jump to ${title}`);
    button.addEventListener("click", () => {
      // Seek into the first frame of the chapter, past encoder boundary padding.
      video.currentTime = time === 0 ? 0 : time + 0.25;
      status.textContent = `${title}. Press play to continue.`;
    });
    chapters.append(button);
  }
}
let selectedCut = new URLSearchParams(location.search).get("cut") === "showcase" ? "showcase" : "short";
function selectCut(name) {
  if (!cuts[name] || !video) return;
  selectedCut = name;
  video.pause();
  video.src = cuts[name].src;
  video.poster = cuts[name].poster;
  video.load();
  video.setAttribute("aria-label", name === "short" ? "Before the Roar hackathon demo" : "Before the Roar expanded product showcase");
  const link = dialog.querySelector(".final-demo-actions a");
  if (link) link.href = cuts[name].src;
  const label = dialog.querySelector(".final-demo-player > span");
  if (label) label.textContent = cuts[name].label;
  document.querySelectorAll("[data-demo-cut]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.demoCut === name)));
  renderChapters();
  status.textContent = "";
}
document.querySelectorAll("[data-demo-cut]").forEach(button => button.addEventListener("click", () => selectCut(button.dataset.demoCut)));

export function finalDemoShareUrl() {
  const url = new URL(location.origin + location.pathname);
  url.searchParams.set("demo", "1");
  url.searchParams.set("cut", selectedCut);
  return url.href;
}

export function openFinalDemo() {
  if (!dialog || dialog.open) return;
  status.textContent = "";
  selectCut(selectedCut);
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
document.addEventListener("btr-open-demo", event => {
  if (event.detail?.cut && cuts[event.detail.cut]) selectedCut = event.detail.cut;
  openFinalDemo();
});
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
