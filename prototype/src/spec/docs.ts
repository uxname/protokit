// docc-none: where requirement links open — the prototype's setting, not a rule of the product
/**
 * Where a requirement link opens. Fill `docspace` when the documents live in Docspace
 * (the project id is in its address: /app/projects/<id>); null opens the HTML build of
 * the documents that ships next to the prototype as docs.html.
 */
export const DOCS_TARGET: {
  docspace: { url: string; projectId: string } | null;
} = {
  docspace: null,
};
