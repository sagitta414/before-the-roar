import { readFile, writeFile, mkdir } from "node:fs/promises";

const trial = JSON.parse(await readFile("dist/assets/tracking/blind-trial.json", "utf8"));
const report = JSON.parse((await readFile("docs/proof/heldout-commentary.json", "utf8")).replace(/^\uFEFF/, ""));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const key = {};
for (const item of trial.cases) {
  const source = report.cases.find((entry) => entry.input.id === item.id);
  if (!source) throw Error(`Missing frozen case ${item.id}`);
  if (same(item.outputs.A, source.crew.posts) && same(item.outputs.B, source.baseline.posts)) key[item.id] = { crew: "A", baseline: "B" };
  else if (same(item.outputs.B, source.crew.posts) && same(item.outputs.A, source.baseline.posts)) key[item.id] = { crew: "B", baseline: "A" };
  else throw Error(`Published outputs do not match frozen source for ${item.id}`);
}
await mkdir("tmp/review-private", { recursive: true });
await writeFile("tmp/review-private/arm-key.json", JSON.stringify({ id: trial.id, hash: trial.hash, key }, null, 2));
console.log(JSON.stringify({ recovered: true, id: trial.id, hash: trial.hash, cases: Object.keys(key).length }));
