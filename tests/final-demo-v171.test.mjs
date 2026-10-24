import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("the main experience exposes a shareable two-minute demo", async () => {
  const [html, splash, script, css] = await Promise.all([
    read("dist/index.html"),
    read("dist/splash.js"),
    read("dist/demo-premiere.js"),
    read("dist/demo-premiere.css"),
  ]);
  assert.match(html, /id="open-final-demo"/);
  assert.match(html, /id="final-demo-dialog"/);
  assert.match(html, /assets\/before-the-roar-showcase-v175\.mp4/);
  assert.match(splash, /2-minute demo/);
  assert.match(splash, /btr-open-demo/);
  assert.match(script, /searchParams\.set\("demo", "1"\)/);
  assert.match(script, /navigator\.clipboard\.writeText/);
  assert.match(css, /\.final-demo-dialog/);
});

test("the hosted demo asset remains below two minutes", async () => {
  const metadata = JSON.parse(await read("demo/before-the-roar-premiere-provenance.json"));
  const asset = await stat(new URL("../dist/assets/before-the-roar-premiere-v172.mp4", import.meta.url));
  assert.ok(metadata.duration_seconds > 60);
  assert.ok(metadata.duration_seconds < 120);
  assert.ok(asset.size > 1_000_000);
  assert.ok(asset.size < 25_000_000);
});


