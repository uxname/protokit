#!/usr/bin/env node
// The checks docc does not make for a prototype; run from the folder with docc.json.
// Coverage — every requirement block has a tag — is docc's own (DOC404, docc 0.7+).
//   1. No tag sits in a JSX comment `{/* docc: … */}`: docc reads a tag only on a line that
//      starts with a comment marker and skips those silently, broken targets included.
//   2. Every `<Req to="…">` target is also a `docc:` tag of the same file, so a change
//      of the paragraph reaches that file as DOC209.
//   3. Every file of the rules (`src/spec/`) and screens (`src/screens/`) carries a `docc:`
//      tag, so no edit there passes without a check against the documents. A file with
//      nothing to show says why on a `// docc-none: <reason>` line.
// Prints one line per problem and exits 1 when there is any.
import { existsSync, globSync, readFileSync } from "node:fs";

const config = JSON.parse(readFileSync("docc.json", "utf8"));
const scan = config.trace?.scan ?? [];
if (scan.length === 0) {
  console.error('check-sync: docc.json has no "trace": {"scan": [...]} — docc reads no code tags');
  process.exit(1);
}

// docc's rule: a tag is a line where only blanks and comment markers stand before `docc:`.
const MARKERS = String.raw`(?:<!--|\/\*\*|\/\*|\/\/|--|#|\*|;|%|')`;
const TAG = new RegExp(String.raw`^\s*(?:${MARKERS}\s*)+docc(?::begin)?:?\s+(.+)$`);
const NONE = new RegExp(String.raw`^\s*(?:${MARKERS}\s*)+docc-none:\s*\S`);
const MUST_TAG = /(^|\/)src\/(spec|screens)\//;
const JSX_TAG = /\{\s*\/\*\s*docc/;
const LINK = /<Req\b[^>]*?\bto="([^"]+)"/g;
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
        // `auth#^AUTH-3@3a9c ~e91d` → `auth#^auth-3`: the version hash and the print are docc's.
        const target = t.trim().split(/\s/)[0].replace(/@.*$/, "").toLowerCase();
        if (target) own.add(target);
      }
    }
  });
  if (MUST_TAG.test(file) && own.size === 0 && !none)
    problems.push(`${file}: no docc tag — every rule and screen file names its paragraphs, or says why not on a "// docc-none: <reason>" line`);
  for (const m of text.matchAll(LINK)) {
    if (!own.has(m[1].toLowerCase())) problems.push(`${file}: <Req to="${m[1]}"> without "// docc: ${m[1]}" in the same file`);
  }
}

for (const p of problems) console.log(p);
console.log(`check-sync: ${files.length} files scanned, ${problems.length} problems`);
process.exit(problems.length ? 1 : 0);
