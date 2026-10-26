#!/usr/bin/env node
// Fails when git ignores a source file under src/ (generated files aside). Tailwind, Biome
// and other tools skip what git ignores, so one loose .gitignore line silently drops a
// whole folder from the build — styles vanish with no error anywhere else.
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const files = readdirSync("src", { recursive: true, withFileTypes: true })
  .filter((e) => e.isFile())
  .map((e) => join(e.parentPath, e.name))
  .filter((f) => !f.startsWith(join("src", "generated")));

let ignored = "";
try {
  ignored = execFileSync("git", ["check-ignore", "--no-index", "--stdin"], {
    input: files.join("\n"),
    encoding: "utf8",
  });
} catch (e) {
  // Exit 1: nothing is ignored. Exit 128: not inside a git repository — nothing to check.
  if (e.status !== 1 && e.status !== 128) throw e;
  ignored = e.stdout ?? "";
}
const list = ignored.split("\n").filter(Boolean);
if (list.length > 0) {
  console.error(
    `check-sources: git ignores ${list.length} source file(s), so Tailwind and other tools skip them:\n  ${list.join("\n  ")}\nNarrow the .gitignore line (anchor it, e.g. "/screens").`,
  );
  process.exit(1);
}
