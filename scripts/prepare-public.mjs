import { readdir, mkdir, copyFile, readFile, writeFile } from "node:fs/promises";
import { resolve, join, dirname, relative } from "node:path";
const source = resolve("."),
  target = resolve("../before-the-roar-public-v40");
if (!target.startsWith(resolve("..") + "/") && !target.startsWith(resolve("..") + "\\"))
  throw Error("Invalid export path");
const roots = ["api", "dist", "docs", "tests", "scripts", "infra"];
let count = 0;
const excluded = (path) =>
  path.endsWith("parameters.local.json") ||
  path.includes("/vision/") ||
  (/^dist\/assets\/(pitchside|featured|counter-cinema|press-cinema|wide-cinema)/.test(
    path,
  ) &&
    !path.endsWith(".json")) ||
  /^dist\/(original|films)\.html$/.test(path) ||
  /^scripts\/(provision-azure|verify-production-azure|evaluate-agents|recover-evaluation)\.ps1$/.test(
    path,
  ) ||
  /^scripts\/prepare-public/.test(path);
async function copy(path) {
  if (excluded(path)) return;
  const full = join(source, path);
  const entries = await readdir(full, { withFileTypes: true }).catch(() => null);
  if (entries) {
    for (const entry of entries) await copy(path + "/" + entry.name);
    return;
  }
  const out = join(target, path);
  await mkdir(dirname(out), { recursive: true });
  await copyFile(full, out);
  count++;
}
await mkdir(target, { recursive: true });
for (const root of roots) await copy(root);
for (const file of [
  "README.md",
  "CHANGELOG.md",
  ".prettierrc.json",
  "package.json",
  "package-lock.json",
  "server.mjs",
  "Dockerfile",
  ".dockerignore",
])
  await copy(file);
await writeFile(
  join(target, "dist/media-availability.json"),
  JSON.stringify(
    {
      pitchside: false,
      source:
        "Optional generated footage is excluded as optional media. The synthetic guided demonstration and full match generator work without it.",
    },
    null,
    2,
  ),
);
await writeFile(
  join(target, "dist/api-config.json"),
  JSON.stringify({ baseUrl: "" }, null, 2),
);
await writeFile(
  join(target, ".gitignore"),
  "node_modules/\n.env*\n!.env.example\ntmp/\n*-test-results.txt\n*.tar.gz\ninfra/parameters.local.json\n",
);
await writeFile(
  join(target, ".env.example"),
  "# Optional Azure configuration. Local reviewed notes work without these.\nAZURE_OPENAI_ENDPOINT=\nAZURE_OPENAI_DEPLOYMENT=gpt-4o-mini\nAZURE_STORAGE_URL=\nAZURE_CLIENT_ID=\nAI_DAILY_LIMIT=120\nPORT=4397\n",
);
await mkdir(join(target, ".github/workflows"), { recursive: true });
await writeFile(
  join(target, ".github/workflows/verify.yml"),
  `name: Verify synthetic football workflow\non: [push, pull_request]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: '22'\n          cache: npm\n      - run: npm ci\n      - run: npm test\n      - run: npm run check\n      - run: npm run format:check\n      - run: npm run validate:data\n`,
);
const readme = await readFile(join(target, "README.md"), "utf8");
await writeFile(
  join(target, "README.md"),
  readme +
    "\n## Public source distribution\n\nThe cinematic Google Flow footage, associated frame samples and deployment-account configuration are excluded as optional media. The guided synthetic demonstration is fully available. Use `npm ci` and `npm run studio` to run it locally without credentials. Add your own authorized optional media to enable the film route; the public live app preserves the creator’s existing film and its disclosures. The creator confirmed permission to retain the film on the live app on October 15, 2026. No film redistribution license is granted by this source export. No deployment credentials are included.\n",
);
console.log(
  JSON.stringify({
    target,
    files: count,
    optional_generated_footage_included: false,
  }),
);
