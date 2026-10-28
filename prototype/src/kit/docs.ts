import index from "@/generated/doc-index.json" with { type: "json" };
import { DOCS_TARGET } from "@/spec";

interface Anchor {
  text: string;
  hash: string;
}
interface Page {
  path: string;
  title: string;
  kind: string;
  anchors: Record<string, Anchor>;
}

const pages: Record<string, Page> = index.pages;

export interface Requirement {
  to: string;
  doc: string;
  anchor: string;
  /** The block's code as people read it: upper case. */
  code: string;
  title: string;
  text: string;
  href: string;
}

/**
 * The block a docc target `<doc>#^<code>` names, or null when the documents have no such
 * block. The link carries the block's version: the reader says when it changed since.
 */
export const requirement = (to: string): Requirement | null => {
  const [doc, code = ""] = to.split("#^");
  // codes are upper case (PAY-14) and matched in any case
  const anchor = code.toUpperCase();
  const page = pages[doc];
  const a = page?.anchors[anchor];
  if (!page || !a) return null;
  const hash = `#${doc}--${anchor}@${a.hash}`;
  const ds = DOCS_TARGET.docspace;
  const href = ds
    ? `${ds.url}/app/projects/${ds.projectId}?file=${encodeURIComponent(page.path)}${hash}`
    : // Relative: the prototype opens from any folder of a static host (hash routing).
      `./docs.html${hash}`;
  return {
    to,
    doc,
    anchor,
    code: anchor,
    title: page.title,
    text: a.text,
    href,
  };
};

/** Where all the documents open: the Docspace project, or the HTML build next to the prototype. */
export const docsHome = DOCS_TARGET.docspace
  ? `${DOCS_TARGET.docspace.url}/app/projects/${DOCS_TARGET.docspace.projectId}`
  : "./docs.html";
