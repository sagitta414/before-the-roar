import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { assessVideoCompatibility } from "../dist/video-compatibility.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("compatibility gate admits only calibrated, continuous marked footage", () => {
  const valid = Array.from({ length: 6 }, () => ({ players: 7, ball: true, confidence: 0.84 }));
  const passed = assessVideoCompatibility(valid, { width: 1440, height: 960 });
  assert.equal(passed.passed, true);
  const misleading = Array.from({ length: 6 }, () => ({ players: 7, ball: false, confidence: 0.7 }));
  const rejected = assessVideoCompatibility(misleading, { width: 1920, height: 1080 });
  assert.equal(rejected.passed, false);
  assert.ok(rejected.reasons.some((reason) => /ball/i.test(reason)));
  assert.ok(rejected.reasons.some((reason) => /framing/i.test(reason)));
});

test("an uploaded source can traverse every play-to-proof stage", async () => {
  const [html, journey, upload] = await Promise.all([
    read("dist/index.html"),
    read("dist/uploaded-journey.js"),
    read("dist/video-upload.js"),
  ]);
  assert.match(html, /uploaded-journey\.js\?v=161/);
  for (const stage of ["Watch", "Understand", "Measure", "Challenge", "Publish"])
    assert.match(journey, new RegExp(stage, "i"));
  assert.match(journey, /btr-upload-source/);
  assert.match(journey, /btr-upload-detection/);
  assert.match(journey, /Withdraw this observation/);
  assert.match(journey, /Download overlay \+ evidence/);
  assert.match(upload, /compatibility_gate/);
});

test("unfamiliar video report proves safe rejection without claiming accuracy", async () => {
  const report = JSON.parse(await read("dist/assets/external-video-results.json"));
  assert.equal(report.version, "v161-unfamiliar-domain-gate");
  assert.equal(report.clips.length, 2);
  for (const clip of report.clips) {
    assert.equal(clip.compatibility_gate.passed, false);
    assert.equal(clip.published_player_identities, 0);
    assert.equal(clip.published_physical_speeds, 0);
    assert.equal(clip.published_automatic_events, 0);
  }
  assert.match(report.conclusion, /does not measure football event accuracy/i);
});

test("independent commentary study is frozen, blinded and candidly pending", async () => {
  const [status, trial, page] = await Promise.all([
    read("dist/assets/independent-review-status.json").then(JSON.parse),
    read("dist/assets/tracking/blind-trial.json").then(JSON.parse),
    read("dist/independent-review.html"),
  ]);
  assert.equal(status.status, "open");
  assert.equal(status.completed_reviewers, 0);
  assert.equal(status.result, null);
  assert.equal(status.trial_hash, trial.hash);
  assert.equal(trial.cases.length, 8);
  assert.match(page, /Copy review link/);
  assert.match(page, /did not build these systems/i);
});
