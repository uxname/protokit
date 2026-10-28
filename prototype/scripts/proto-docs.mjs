#!/usr/bin/env node
// Builds what the prototype needs from the project documents (docc):
//   src/generated/doc-index.json — the documents' language (docc.json `lang`; the panel
//                                  speaks it) and every page: path, title, kind and, by
//                                  code, the text and version hash of each of its blocks;
//   public/docs.html             — the HTML build the requirement links open without Docspace.
// Runs before dev, build and check. Needs `docc` on PATH and docc.json in a parent folder.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { docc, doccRoot } from "./proto-docc.mjs";

const root = doccRoot();
const config = JSON.parse(readFileSync(join(root, "docc.json"), "utf8"));
const lang = config.lang ?? "en";
const compiled = JSON.parse(docc(root, ["compile", "--format", "json"]));
// A block code: the document's key and a number, ^PAY-14 (docc 0.8).
const CODE = /\s\^[A-Z][A-Z0-9]{1,4}-[1-9][0-9]*$/;
const pages = {};
for (const page of compiled.pages) {
  const anchors = {};
  // A short document's fields come as props, a long one's as blocks: both carry codes.
  for (const block of [...page.blocks, ...(page.props ?? [])]) {
    if (block.code && typeof block.s === "string")
      anchors[block.code] = {
        text: block.s.replace(CODE, ""),
        hash: block.hash,
      };
  }
  pages[page.id] = {
    path: page.path,
    title: page.title,
    kind: page.kind,
    anchors,
  };
}
mkdirSync("src/generated", { recursive: true });
writeFileSync(
  "src/generated/doc-index.json",
  `${JSON.stringify({ lang, pages }, null, 1)}\n`,
);

// Warnings (DOC209, DOC402, DOC403) are the sync work still to do; the HTML is built anyway.
docc(root, ["build", "--html", "--max-warnings", "100000"]);
mkdirSync("public", { recursive: true });
// docc writes the HTML next to its output folder: "out": "docs/out" → docs/out.html.
copyFileSync(
  join(root, `${config.out ?? "docs/out"}.html`),
  "public/docs.html",
);
const n = Object.values(pages).reduce(
  (sum, p) => sum + Object.keys(p.anchors).length,
  0,
);
console.log(`proto-docs: ${Object.keys(pages).length} pages, ${n} anchors`);
