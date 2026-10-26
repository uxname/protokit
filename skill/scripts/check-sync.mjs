#!/usr/bin/env node
// The checks docc does not make for a prototype; run from the folder with docc.json.
//   1. Every anchored paragraph (` ^name`) of a kind with "x-docc-covered": true has a
//      `docc:` tag in the prototype code (docc's own DOC403 only checks whole documents).
//   2. No tag sits in a JSX comment `{/* docc: … */}`: docc reads `//` and `#` comments
//      only and skips those silently, broken targets included.
//   3. Every `<Req to="…">` target is also a `docc:` tag of the same file, so a change
//      of the paragraph reaches that file as DOC209.
// Prints one line per problem and exits 1 when there is any.
import { execFileSync } from "node:child_process";
import { existsSync, globSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const config = JSON.parse(readFileSync("docc.json", "utf8"));
const scan = config.trace?.scan ?? [];
if (scan.length === 0) {
  console.error('check-sync: docc.json has no "trace": {"scan": [...]} — docc reads no code tags');
  process.exit(1);
}

const schemasDir = join(config.src ?? "docs/src", "..", "schemas");
const covered = new Set(
  readdirSync(schemasDir)
    .filter((f) => f.endsWith(".json"))
    .filter((f) => JSON.parse(readFileSync(join(schemasDir, f), "utf8"))["x-docc-covered"] === true)
    .map((f) => f.slice(0, -".json".length)),
);

let out;
try {
  out = execFileSync("docc", ["compile", "--format", "json"], { encoding: "utf8", maxBuffer: 64 << 20 });
} catch (e) {
  out = e.stdout; // compile exits 1 while warnings stand, the pages are printed anyway
}
const ANCHOR = /\s\^([a-z][a-z0-9-]*)$/;
const anchors = [];
for (const page of JSON.parse(out).pages) {
  if (!covered.has(page.kind)) continue;
  for (const block of page.blocks) {
    const m = typeof block.s === "string" && block.s.match(ANCHOR);
    if (m) anchors.push(`${page.id}#^${m[1]}`);
  }
}

const TAG = /(?:\/\/|#)\s*docc(?::begin)?:?\s+(.+)$/;
const JSX_TAG = /\{\s*\/\*\s*docc/;
const LINK = /<Req\b[^>]*?\bto="([^"]+)"/g;
const tagged = new Set();
const problems = [];
const files = [...new Set(scan.flatMap((g) => globSync(g)))].filter((f) => existsSync(f) && !f.includes("/generated/"));
for (const file of files.sort()) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue; // a folder matched by the glob
  }
  const own = new Set();
  text.split("\n").forEach((line, i) => {
    if (JSX_TAG.test(line)) problems.push(`${file}:${i + 1}: docc tag in a JSX comment — docc skips it; use a // line above the JSX`);
    const m = line.match(TAG);
    if (m && !line.includes("docc:end")) {
      for (const t of m[1].split(",")) {
        const target = t.trim().split(/\s/)[0];
        if (target) {
          tagged.add(target);
          own.add(target);
        }
      }
    }
  });
  for (const m of text.matchAll(LINK)) {
    if (!own.has(m[1])) problems.push(`${file}: <Req to="${m[1]}"> without "// docc: ${m[1]}" in the same file`);
  }
}

const uncovered = anchors.filter((a) => !tagged.has(a));
for (const a of uncovered) problems.push(`${a}: no docc tag in the code — show it on a screen, or list it with the reason in not-shown`);

for (const p of problems) console.log(p);
console.log(`check-sync: ${anchors.length} anchored paragraphs in [${[...covered].join(", ")}], ${anchors.length - uncovered.length} tagged, ${files.length} files scanned, ${problems.length} problems`);
process.exit(problems.length ? 1 : 0);
