#!/usr/bin/env node
// The checks docc does not make for a prototype; run from the folder with docc.json.
//   1. Every block (` ^code`) the documents want covered has a `docc:` tag in the prototype
//      code (docc's own DOC403 only checks whole documents). Covered: the blocks of the
//      fields marked "x-docc-covered": true in a kind's schema; a kind marked at its root
//      with no marked field — all its blocks.
//   2. No tag sits in a JSX comment `{/* docc: … */}`: docc reads `//` and `#` comments
//      only and skips those silently, broken targets included.
//   3. Every `<Req to="…">` target is also a `docc:` tag of the same file, so a change
//      of the paragraph reaches that file as DOC209.
//   4. Every file of the rules (`src/spec/`) and screens (`src/screens/`) carries a `docc:`
//      tag, so no edit there passes without a check against the documents. A file with
//      nothing to show says why on a `// docc-none: <reason>` line.
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
// kind → the covered fields, or null for every block of the kind.
const covered = new Map();
for (const f of readdirSync(schemasDir).filter((f) => f.endsWith(".json"))) {
  const schema = JSON.parse(readFileSync(join(schemasDir, f), "utf8"));
  const fields = Object.entries(schema.properties ?? {})
    .filter(([, p]) => p["x-docc-covered"] === true)
    .map(([name]) => name);
  if (fields.length) covered.set(f.slice(0, -".json".length), new Set(fields));
  else if (schema["x-docc-covered"] === true) covered.set(f.slice(0, -".json".length), null);
}
// The field of a block: the first step of its JSON Pointer, unescaped.
const fieldOf = (p) => decodeURIComponent((p.split("/")[1] ?? "").replace(/~1/g, "/").replace(/~0/g, "~"));

let out;
try {
  out = execFileSync(process.env.DOCC ?? "docc", ["compile", "--format", "json"], { encoding: "utf8", maxBuffer: 64 << 20 });
} catch (e) {
  out = e.stdout; // compile exits 1 while stale hashes stand, the pages are printed anyway
}
const anchors = [];
for (const page of JSON.parse(out).pages) {
  if (!covered.has(page.kind)) continue;
  const fields = covered.get(page.kind);
  // A short document's fields come as props, a long one's as blocks: both carry codes.
  for (const block of [...page.blocks, ...(page.props ?? [])]) {
    if (block.code && (!fields || fields.has(fieldOf(block.p)))) anchors.push(`${page.id}#^${block.code}`);
  }
}

const TAG = /(?:\/\/|#)\s*docc(?::begin)?:?\s+(.+)$/;
const NONE = /(?:\/\/|#)\s*docc-none:\s*\S/;
const MUST_TAG = /(^|\/)src\/(spec|screens)\//;
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
  let none = false;
  text.split("\n").forEach((line, i) => {
    if (NONE.test(line)) none = true;
    if (JSX_TAG.test(line)) problems.push(`${file}:${i + 1}: docc tag in a JSX comment — docc skips it; use a // line above the JSX`);
    const m = line.match(TAG);
    if (m && !line.includes("docc:end")) {
      for (const t of m[1].split(",")) {
        // `i4#^k7f2@3a9c ~e91d` → `i4#^k7f2`: the version hash and the print are docc's.
        const target = t.trim().split(/\s/)[0].replace(/@.*$/, "").toLowerCase();
        if (target) {
          tagged.add(target);
          own.add(target);
        }
      }
    }
  });
  if (MUST_TAG.test(file) && own.size === 0 && !none)
    problems.push(`${file}: no docc tag — every rule and screen file names its paragraphs, or says why not on a "// docc-none: <reason>" line`);
  for (const m of text.matchAll(LINK)) {
    if (!own.has(m[1].toLowerCase())) problems.push(`${file}: <Req to="${m[1]}"> without "// docc: ${m[1]}" in the same file`);
  }
}

const uncovered = anchors.filter((a) => !tagged.has(a));
for (const a of uncovered) problems.push(`${a}: no docc tag in the code — show it on a screen, or list it with the reason in not-shown`);

for (const p of problems) console.log(p);
console.log(`check-sync: ${anchors.length} covered blocks in [${[...covered.keys()].join(", ")}], ${anchors.length - uncovered.length} tagged, ${files.length} files scanned, ${problems.length} problems`);
process.exit(problems.length ? 1 : 0);
