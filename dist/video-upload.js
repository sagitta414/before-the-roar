const LIMIT_BYTES = 150 * 1024 * 1024;
const ALLOWED = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const SAMPLE_URL = "assets/tracking/training-minute.mp4?v=161";

const text = (root, selector, value) => {
  const target = root.querySelector(selector);
  if (target) target.textContent = value;
};
const formatSize = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const hex = (buffer) =>
  [...new Uint8Array(buffer)].map((value) => value.toString(16).padStart(2, "0")).join("");

export function createVideoUpload({ panel, lab, video, onPrepare, onRestore, checkCompatibility }) {
  const ingest = document.createElement("section");
  ingest.className = "vt-ingest";
  ingest.hidden = true;
  ingest.setAttribute("aria-label", "Video ingest desk");
  ingest.innerHTML = `<div class="vt-ingest-head"><div><span class="eyebrow">SOURCE INGEST / PRIVATE BY DEFAULT</span><h3>Bring your own match film.</h3><p>Preflight the clip before BTR makes a claim. The original video stays in this browser; a source receipt records what the system may inspect.</p></div><button type="button" class="vt-ingest-close" aria-label="Close video ingest">×</button></div><input class="vt-file" type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" hidden><button type="button" class="vt-drop"><span class="vt-drop-icon">↥</span><strong>Drop a video here</strong><small>or choose MP4, WebM or MOV · up to 150 MB · 2–120 seconds</small></button><div class="vt-upload-progress" hidden><i></i><span>READING SOURCE</span></div><div class="vt-preflight" hidden><div class="vt-preview"><video playsinline muted controls></video><span>LOCAL PREVIEW</span></div><div class="vt-receipt"><span class="eyebrow">SOURCE RECEIPT</span><h4 data-upload="name">—</h4><dl><div><dt>DURATION</dt><dd data-upload="duration">—</dd></div><div><dt>FRAME</dt><dd data-upload="frame">—</dd></div><div><dt>SIZE</dt><dd data-upload="size">—</dd></div><div><dt>SHA-256</dt><dd data-upload="hash">CALCULATING</dd></div></dl></div></div><fieldset class="vt-source-kind" hidden><legend>What kind of footage is this?</legend><label><input type="radio" name="upload-kind" value="marked"> <span><strong>BTR-compatible synthetic training film</strong><small>Fixed camera, full pitch, enrolled colour markers. Enables experimental on-device tracking.</small></span></label><label><input type="radio" name="upload-kind" value="generated"> <span><strong>AI-generated football film</strong><small>Opens a reviewed-cue workflow. Identity, distance and speed stay withheld.</small></span></label><label><input type="radio" name="upload-kind" value="other"> <span><strong>Other authorized football footage</strong><small>Preview and mark visible events. No automatic measurement claim.</small></span></label></fieldset><label class="vt-rights" hidden><input type="checkbox"> <span>I created this footage or have permission to analyze it. I understand this experience is designed for synthetic or authorized data.</span></label><div class="vt-ingest-actions" hidden><button type="button" class="red-button" data-upload-action="prepare" disabled>Prepare video workspace →</button><button type="button" class="outline-button" data-upload-action="clear">Choose another video</button></div><p class="vt-ingest-status" role="status">No video selected.</p>`;

  const dock = document.createElement("div");
  dock.className = "vt-source-dock";
  dock.hidden = true;
  dock.innerHTML = '<div><span>LOCAL SOURCE</span><strong data-dock="name">—</strong><small data-dock="scope">—</small></div><button type="button" data-dock-action="receipt">Source receipt ↓</button><button type="button" data-dock-action="change">Change video</button><button type="button" data-dock-action="restore">Restore training film</button>';

  const review = document.createElement("div");
  review.className = "vt-review-tools";
  review.hidden = true;
  review.innerHTML = '<div><span class="eyebrow">REVIEWED CUES / NO AUTOMATIC METRICS</span><p>Play the clip and mark only what is visible. BTR records the playhead and reviewer label without inferring identity, outcome or speed.</p></div><div><button type="button" data-cue="pass">+ Possible pass</button><button type="button" data-cue="shot">+ Shot candidate</button><button type="button" data-cue="duel">+ Duel</button></div><ol></ol>';
  panel.querySelector(".vt-heading").after(ingest, dock);
  panel.querySelector(".vt-layout").before(review);

  const fileInput = ingest.querySelector(".vt-file");
  const drop = ingest.querySelector(".vt-drop");
  const preview = ingest.querySelector(".vt-preview video");
  const prepare = ingest.querySelector('[data-upload-action="prepare"]');
  const rights = ingest.querySelector(".vt-rights input");
  const status = ingest.querySelector(".vt-ingest-status");
  let source = null;
  let sourceUrl = "";
  let metadata = null;
  let sourceHash = "";
  let sourceKind = "";
  let compatibility = null;
  let cues = [];
  let sourceOrigin = "user-file";

  const open = () => {
    video.pause();
    ingest.hidden = false;
    ingest.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const close = () => {
    ingest.hidden = true;
  };
  const reset = () => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    source = null;
    sourceUrl = "";
    sourceHash = "";
    sourceKind = "";
    compatibility = null;
    sourceOrigin = "user-file";
    metadata = null;
    fileInput.value = "";
    preview.removeAttribute("src");
    preview.load();
    ingest.querySelector(".vt-preflight").hidden = true;
    ingest.querySelector(".vt-source-kind").hidden = true;
    ingest.querySelector(".vt-rights").hidden = true;
    ingest.querySelector(".vt-ingest-actions").hidden = true;
    ingest.querySelectorAll('input[name="upload-kind"]').forEach((item) => (item.checked = false));
    rights.checked = false;
    prepare.disabled = true;
    status.textContent = "No video selected.";
  };
  const updateReady = () => {
    const kind = ingest.querySelector('input[name="upload-kind"]:checked')?.value;
    prepare.disabled = !(source && metadata && kind && rights.checked);
  };
  const readMetadata = (url) =>
    new Promise((resolve, reject) => {
      const probe = document.createElement("video");
      probe.preload = "metadata";
      probe.onloadedmetadata = () =>
        resolve({ duration: probe.duration, width: probe.videoWidth, height: probe.videoHeight });
      probe.onerror = () => reject(new Error("This browser could not decode the video."));
      probe.src = url;
    });
  const accept = async (file, origin = "user-file") => {
    reset();
    sourceOrigin = origin;
    const extensionAllowed = /\.(mp4|webm|mov)$/i.test(file.name);
    if ((!ALLOWED.has(file.type) && !extensionAllowed) || file.size > LIMIT_BYTES) {
      status.textContent = file.size > LIMIT_BYTES ? "That file is larger than 150 MB." : "Choose an MP4, WebM or MOV video.";
      return;
    }
    source = file;
    sourceUrl = URL.createObjectURL(file);
    ingest.querySelector(".vt-upload-progress").hidden = false;
    status.textContent = "Reading video metadata and creating its source receipt…";
    try {
      metadata = await readMetadata(sourceUrl);
      if (!Number.isFinite(metadata.duration) || metadata.duration < 2 || metadata.duration > 120)
        throw new Error("Choose a clip between 2 seconds and 2 minutes.");
      preview.src = sourceUrl;
      text(ingest, '[data-upload="name"]', file.name);
      text(ingest, '[data-upload="duration"]', `${metadata.duration.toFixed(1)} s`);
      text(ingest, '[data-upload="frame"]', `${metadata.width} × ${metadata.height}`);
      text(ingest, '[data-upload="size"]', formatSize(file.size));
      ingest.querySelector(".vt-preflight").hidden = false;
      ingest.querySelector(".vt-source-kind").hidden = false;
      ingest.querySelector(".vt-rights").hidden = false;
      ingest.querySelector(".vt-ingest-actions").hidden = false;
      status.textContent = "Preflight passed. Declare the source type and permission to continue.";
      sourceHash = hex(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()));
      text(ingest, '[data-upload="hash"]', `${sourceHash.slice(0, 12)}…${sourceHash.slice(-8)}`);
    } catch (error) {
      status.textContent = error.message;
      source = null;
      metadata = null;
    } finally {
      ingest.querySelector(".vt-upload-progress").hidden = true;
      updateReady();
    }
  };

  const loadSample = async () => {
    status.textContent = "Loading BTR's fictional evaluation minute…";
    ingest.querySelector(".vt-upload-progress").hidden = false;
    try {
      const response = await fetch(SAMPLE_URL);
      if (!response.ok) throw new Error("The fictional evaluation clip is temporarily unavailable.");
      const file = new File([await response.blob()], "btr-fictional-evaluation-minute.mp4", { type: "video/mp4" });
      await accept(file, "bundled-fictional-evaluation");
      ingest.querySelector('input[name="upload-kind"][value="marked"]').checked = true;
      rights.checked = true;
      updateReady();
      status.textContent = "Fictional sample ready. Running the same compatibility gate used for uploaded clips…";
      prepare.click();
    } catch (error) {
      status.textContent = error.message;
      ingest.querySelector(".vt-upload-progress").hidden = true;
    }
  };

  drop.onclick = () => fileInput.click();
  fileInput.onchange = () => fileInput.files?.[0] && accept(fileInput.files[0]);
  for (const eventName of ["dragenter", "dragover"]) drop.addEventListener(eventName, (event) => {
    event.preventDefault();
    drop.classList.add("is-dragging");
  });
  for (const eventName of ["dragleave", "drop"]) drop.addEventListener(eventName, (event) => {
    event.preventDefault();
    drop.classList.remove("is-dragging");
  });
  drop.addEventListener("drop", (event) => event.dataTransfer?.files?.[0] && accept(event.dataTransfer.files[0]));
  ingest.querySelector(".vt-ingest-close").onclick = close;
  ingest.querySelector('[data-upload-action="clear"]').onclick = reset;
  ingest.querySelectorAll('input[name="upload-kind"]').forEach((item) => (item.onchange = updateReady));
  rights.onchange = updateReady;

  prepare.onclick = async () => {
    const declaredKind = ingest.querySelector('input[name="upload-kind"]:checked').value;
    let kind = declaredKind;
    sourceKind = kind;
    let measured = kind === "marked";
    prepare.disabled = true;
    if (measured) {
      status.textContent = "Testing camera geometry, marker coverage, ball continuity and frame confidence…";
      try {
        compatibility = await checkCompatibility(sourceUrl, metadata);
        measured = compatibility.passed;
        if (!measured) {
          kind = "marked-rejected";
          sourceKind = kind;
          status.textContent = `Compatibility gate withheld automatic measurement: ${compatibility.reasons.join(" ")}`;
        }
      } catch (error) {
        measured = false;
        kind = "marked-rejected";
        sourceKind = kind;
        compatibility = { passed: false, reasons: [error.message], sampled_frames: 0 };
      }
    }
    cues = [];
    review.querySelector("ol").replaceChildren();
    dock.hidden = false;
    review.hidden = measured;
    text(dock, '[data-dock="name"]', source.name);
    text(dock, '[data-dock="scope"]', measured ? "COMPATIBILITY PASSED · EXPERIMENTAL MEASUREMENT" : kind === "marked-rejected" ? "COMPATIBILITY FAILED · REVIEWED CUES ONLY" : "REVIEWED CUES · IDENTITY, DISTANCE + SPEED WITHHELD");
    onPrepare({ file: source, url: sourceUrl, kind, declaredKind, measured, metadata, hash: sourceHash, compatibility });
    document.dispatchEvent(new CustomEvent("btr-upload-source", { detail: { name: source.name, url: sourceUrl, kind, declaredKind, measured, metadata, hash: sourceHash, compatibility, sourceOrigin, synthetic: sourceOrigin === "bundled-fictional-evaluation" } }));
    close();
    panel.querySelector(".vt-screen").scrollIntoView({ behavior: "smooth", block: "center" });
  };
  dock.querySelector('[data-dock-action="change"]').onclick = open;
  dock.querySelector('[data-dock-action="receipt"]').onclick = () => {
    const receipt = {
      schema: "btr.local-video-source.v1",
      file_name: source?.name,
      media_type: source?.type || "unknown",
      bytes: source?.size,
      sha256: sourceHash,
      duration_seconds: metadata?.duration,
      frame: metadata ? { width: metadata.width, height: metadata.height } : null,
      declared_source_type: sourceKind,
      source_origin: sourceOrigin,
      synthetic: sourceOrigin === "bundled-fictional-evaluation",
      source_license: sourceOrigin === "bundled-fictional-evaluation" ? "BTR-generated fictional evaluation media" : "User-attested authorization",
      permission_attested: true,
      transfer: "none-browser-local",
      analysis_scope: sourceKind === "marked" ? "experimental-controlled-marker-tracking" : "human-reviewed-visible-cues-only",
      compatibility_gate: compatibility,
      reviewed_cues: cues,
      limitations: sourceKind === "marked" ? ["Compatibility is not established until detector health is observed.", "Calibration assumes the BTR fixed-camera training layout."] : ["No automatic identity, physical distance, speed or event outcome.", "Cues are reviewer-authored at the local playback time."],
      created_at: new Date().toISOString(),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(receipt, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "btr-video-source-receipt.json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  dock.querySelector('[data-dock-action="restore"]').onclick = () => {
    review.hidden = true;
    dock.hidden = true;
    reset();
    onRestore();
  };
  review.querySelectorAll("[data-cue]").forEach((button) => {
    button.onclick = () => {
      const cue = { id: `review-${cues.length + 1}`, type: button.dataset.cue, second: Number(video.currentTime.toFixed(2)), source: "human-reviewed-playhead", measurements: null };
      cues.push(cue);
      document.dispatchEvent(new CustomEvent("btr-upload-cues", { detail: { cues: structuredClone(cues) } }));
      const item = document.createElement("li");
      item.innerHTML = `<b>${cue.second.toFixed(1)}s</b><span>${button.textContent.replace("+ ", "")}</span><small>Visible candidate · no outcome or metric inferred</small>`;
      review.querySelector("ol").append(item);
    };
  });

  const uploadButton = document.createElement("button");
  uploadButton.type = "button";
  uploadButton.className = "vt-upload-open";
  uploadButton.textContent = "Upload video +";
  uploadButton.onclick = open;
  const sampleButton = document.createElement("button");
  sampleButton.type = "button";
  sampleButton.className = "vt-sample-open";
  sampleButton.textContent = "Try fictional sample ▶";
  sampleButton.setAttribute("aria-label", "Load the fictional BTR evaluation video and run its compatibility gate");
  sampleButton.onclick = () => { open(); loadSample(); };
  lab.querySelector(".vt-modes")?.prepend(uploadButton, sampleButton);
  const watchUpload = document.getElementById("open-video-upload");
  const watchSampleButton = document.createElement("button");
  watchSampleButton.type = "button";
  watchSampleButton.id = "try-video-sample";
  watchSampleButton.textContent = "Try fictional sample ▶";
  watchSampleButton.onclick = () => {
    document.getElementById("lab-nav")?.click();
    setTimeout(() => { open(); loadSample(); }, 50);
  };
  watchUpload?.insertAdjacentElement("afterend", watchSampleButton);
  document.getElementById("open-video-upload")?.addEventListener("click", () => {
    document.getElementById("lab-nav")?.click();
    setTimeout(open, 50);
  });
  return { open, reset, getReceipt: () => ({ name: source?.name, hash: sourceHash, metadata, kind: sourceKind, sourceOrigin, cues }) };
}
