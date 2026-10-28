#!/usr/bin/env node
// Self-check of check-sync.mjs on a throwaway docc project: it must stay green on a
// covered prototype and go red on each breakage. Needs `docc` on PATH (or DOCC=<binary>).
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const script = join(dirname(fileURLToPath(import.meta.url)), "check-sync.mjs");
const dir = mkdtempSync(join(tmpdir(), "check-sync-"));
const put = (path, text) => {
  mkdirSync(dirname(join(dir, path)), { recursive: true });
  writeFileSync(join(dir, path), typeof text === "string" ? text : `${JSON.stringify(text, null, 2)}\n`);
};
const run = () => spawnSync("node", [script], { cwd: dir, encoding: "utf8" });

try {
  put("docc.json", { src: "docs/src", out: "docs/out", roots: ["index"], trace: { scan: ["prototype/src/**"] } });
  put("docs/schemas/page.json", { type: "object", required: ["title"], additionalProperties: true });
  put("docs/schemas/req.json", { type: "object", required: ["title"], "x-docc-covered": true, additionalProperties: true });
  put("docs/src/index.json", { title: "Index", kind: "page", body: ["[[rules]]"] });
  put("docs/schemas/story.json", { type: "object", required: ["title"], "x-docc-covered": true, properties: { Criteria: { type: "array", "x-docc-covered": true } }, additionalProperties: true });
  put("docs/src/rules.json", { title: "Rules", kind: "req", parent: "index", body: ["Lock after 5 minutes. ^kf2m", "Trash keeps 30 days. ^tr4s"] });
  put("docs/src/s1.json", { title: "S1", kind: "story", parent: "index", Story: "Why it matters. ^wh7y", Criteria: ["Sign in. ^s9gn"] });
  const good = '// docc: rules#^kf2m@aaaa, rules#^tr4s@bbbb, s1#^s9gn@cccc ~dddd\nexport const A = () => <Req to="rules#^KF2M"><b /></Req>;\n';
  put("prototype/src/A.tsx", good);
  let r = run();
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /3 covered blocks .* 3 tagged/);

  put("prototype/src/A.tsx", '// docc: rules#^kf2m, s1#^s9gn\nexport const A = () => <Req to="rules#^kf2m"><b /></Req>;\n');
  r = run();
  assert.equal(r.status, 1);
  assert.match(r.stdout, /rules#\^tr4s: no docc tag/);

  put("prototype/src/A.tsx", good);
  put("prototype/src/spec/rules.ts", "export const LOCK = 5;\n");
  r = run();
  assert.equal(r.status, 1);
  assert.match(r.stdout, /spec\/rules\.ts: no docc tag/);
  put("prototype/src/spec/rules.ts", "// docc-none: the index of the rules, nothing of its own\nexport const LOCK = 5;\n");
  r = run();
  assert.equal(r.status, 0, r.stdout);

  put("prototype/src/A.tsx", `${good}export const B = () => <div>{/* docc: rules#^tr4s */}</div>;\n`);
  r = run();
  assert.equal(r.status, 1);
  assert.match(r.stdout, /A\.tsx:3: docc tag in a JSX comment/);

  put("prototype/src/A.tsx", `${good}export const C = () => <Req to="rules#^other"><b /></Req>;\n`);
  r = run();
  assert.equal(r.status, 1);
  assert.match(r.stdout, /<Req to="rules#\^other"> without/);

  // A block covered only by an SQL migration's `-- docc:` line counts as covered.
  put("prototype/src/A.tsx", '// docc: rules#^kf2m, s1#^s9gn\nexport const A = () => <Req to="rules#^kf2m"><b /></Req>;\n');
  put("prototype/src/db/0001_trash.sql", "-- docc: rules#^tr4s@bbbb ~eeee\nCREATE TABLE trash (id int);\n");
  r = run();
  assert.equal(r.status, 0, r.stdout);
  console.log("check-sync.test: 7 cases passed");
} finally {
  rmSync(dir, { recursive: true, force: true });
}
