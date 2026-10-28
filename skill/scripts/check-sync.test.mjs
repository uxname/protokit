#!/usr/bin/env node
// Self-check of check-sync.mjs on a throwaway project: it must stay green on a tagged
// prototype and go red on each breakage.
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
  const good = '// docc: rules#^kf2m@aaaa, s1#^s9gn@cccc ~dddd\nexport const A = () => <Req to="rules#^KF2M"><b /></Req>;\n';
  put("prototype/src/A.tsx", good);
  let r = run();
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, / 0 problems/);

  put("prototype/src/spec/rules.ts", "export const LOCK = 5;\n");
  r = run();
  assert.equal(r.status, 1);
  assert.match(r.stdout, /spec\/rules\.ts: no docc tag/);
  put("prototype/src/spec/rules.ts", "// docc-none: the index of the rules, nothing of its own\nexport const LOCK = 5;\n");
  r = run();
  assert.equal(r.status, 0, r.stdout);

  // A tag after code is no tag for docc, so it is none here either.
  put("prototype/src/spec/rules.ts", "export const LOCK = 5; // docc: rules#^kf2m\n");
  r = run();
  assert.equal(r.status, 1);
  assert.match(r.stdout, /spec\/rules\.ts: no docc tag/);
  // Any comment marker docc reads counts: SQL, block comments.
  put("prototype/src/spec/rules.ts", "/* docc: rules#^kf2m@aaaa ~eeee */\nexport const LOCK = 5;\n");
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
  console.log("check-sync.test: 7 cases passed");
} finally {
  rmSync(dir, { recursive: true, force: true });
}
