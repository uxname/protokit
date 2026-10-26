#!/usr/bin/env node
// Self-check of check-sync.mjs on a throwaway docc project: it must stay green on a
// covered prototype and go red on each of the three breakages. Needs `docc` on PATH.
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
  put("docs/src/rules.json", { title: "Rules", kind: "req", parent: "index", body: ["Lock after 5 minutes. ^lock", "Trash keeps 30 days. ^trash"] });
  const good = '// docc: rules#^lock, rules#^trash\nexport const A = () => <Req to="rules#^lock"><b /></Req>;\n';
  put("prototype/src/A.tsx", good);
  let r = run();
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /2 anchored paragraphs .* 2 tagged/);

  put("prototype/src/A.tsx", '// docc: rules#^lock\nexport const A = () => <Req to="rules#^lock"><b /></Req>;\n');
  r = run();
  assert.equal(r.status, 1);
  assert.match(r.stdout, /rules#\^trash: no docc tag/);

  put("prototype/src/A.tsx", `${good}export const B = () => <div>{/* docc: rules#^trash */}</div>;\n`);
  r = run();
  assert.equal(r.status, 1);
  assert.match(r.stdout, /A\.tsx:3: docc tag in a JSX comment/);

  put("prototype/src/A.tsx", `${good}export const C = () => <Req to="rules#^other"><b /></Req>;\n`);
  r = run();
  assert.equal(r.status, 1);
  assert.match(r.stdout, /<Req to="rules#\^other"> without/);
  console.log("check-sync.test: 4 cases passed");
} finally {
  rmSync(dir, { recursive: true, force: true });
}
