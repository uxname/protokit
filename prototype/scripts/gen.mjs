#!/usr/bin/env node
// Types the GraphQL operations the screens use (src/graphql/*.graphql → src/generated/graphql.ts).
// A prototype without a server — its data lives in the browser (the documents keep it on
// the device) — has no schema.graphql: nothing to type, so this step is skipped.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

if (!existsSync("schema.graphql")) {
  console.log(
    "gen: no schema.graphql — the prototype has no server, nothing to type",
  );
  process.exit(0);
}
const r = spawnSync("graphql-codegen", ["--config", "codegen.yml"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
process.exit(r.status ?? 1);
