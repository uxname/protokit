import index from "@/generated/doc-index.json" with { type: "json" };
import { DOCS_TARGET } from "@/spec";

interface Anchor {
  text: string;
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
  title: string;
  text: string;
  href: string;
}

/** The paragraph a docc target `<doc>#^<anchor>` names, or null when the documents have no such paragraph. */
export const requirement = (to: string): Requirement | null => {
  const [doc, anchor = ""] = to.split("#^");
  const page = pages[doc];
  const a = page?.anchors[anchor];
  if (!page || !a) return null;
  const hash = `#${doc}--${anchor}`;
  const ds = DOCS_TARGET.docspace;
  const href = ds
    ? `${ds.url}/app/projects/${ds.projectId}?file=${encodeURIComponent(page.path)}${hash}`
    : // Relative: the prototype opens from any folder of a static host (hash routing).
      `./docs.html${hash}`;
  return { to, doc, anchor, title: page.title, text: a.text, href };
};

/** Where all the documents open: the Docspace project, or the HTML build next to the prototype. */
export const docsHome = DOCS_TARGET.docspace
  ? `${DOCS_TARGET.docspace.url}/app/projects/${DOCS_TARGET.docspace.projectId}`
  : "./docs.html";
