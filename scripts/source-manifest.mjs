import { readFile } from "node:fs/promises";
import { resolve, relative, dirname, sep } from "node:path";

const importPattern = /(?:import|export)\s+(?:[^'";]*?\s+from\s+)?["'](\.[^"']+)["']/g;

export async function collectSourceGraph(entries, root = process.cwd()) {
  const base = resolve(root), found = new Set(), queue = entries.map((p) => resolve(base, p));
  while (queue.length) {
    const file = queue.shift();
    const path = relative(base, file).split(sep).join("/");
    if (path.startsWith("../") || found.has(path)) continue;
    const source = await readFile(file, "utf8");
    found.add(path);
    for (const match of source.matchAll(importPattern)) {
      let child = resolve(dirname(file), match[1]);
      if (!/\.[cm]?js$/.test(child)) child += ".js";
      queue.push(child);
    }
  }
  return [...found].sort();
}
