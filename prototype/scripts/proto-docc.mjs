// Running docc from the prototype: the documents' root is the nearest folder above with docc.json.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export const doccRoot = (from = process.cwd()) => {
  let dir = resolve(from, "..");
  while (!existsSync(join(dir, "docc.json"))) {
    if (dirname(dir) === dir)
      throw new Error("no docc.json above the prototype folder");
    dir = dirname(dir);
  }
  return dir;
};

/** stdout of a docc command. compile and build exit 1 while warnings stand but still print, so that is not a failure. */
export const docc = (root, args, input) => {
  try {
    return execFileSync("docc", args, {
      cwd: root,
      encoding: "utf8",
      input,
      maxBuffer: 64 << 20,
    });
  } catch (e) {
    if (e.status === 1 && e.stdout) return e.stdout;
    throw new Error(String(e.stderr || e.message).trim());
  }
};
