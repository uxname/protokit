# Converting Markdown documentation to docc

Without docc a prototype has no sync: Markdown has no paragraph codes and notices no
edits. The conversion changes the storage format, not the text. Ask first: the documents
become JSON files in `docs/src`, the original `.md` goes to git history. The docc format
is the `docc` skill.

1. `docc init` in the repository root (creates `docc.json`, `docs/schemas/page.json`,
   `docs/src/index.json`, a pre-commit hook). In `docc.json` set `"lang"` to the text's
   language (`"ru"` for Russian).
2. **The requirement kind.** `docs/schemas/req.json` with `"x-docc-covered": true` —
   documents every block of which the prototype must cover (to cover only some fields of
   a kind, mark those properties with `"x-docc-covered": true` instead):

   ```json
   {
     "$schema": "https://json-schema.org/draft/2020-12/schema",
     "type": "object",
     "required": ["title", "parent"],
     "x-docc-covered": true,
     "additionalProperties": false
   }
   ```

3. **A document per section.** A section of requirements (roles, scope item by item,
   acceptance criteria) is a `req` document; the rest (goal, rationale, stack, risks,
   plan, out of scope) is `page`. A long section with sub-items — a document per
   sub-item and a contents page with `[[links]]`. `parent` and `order` follow the
   source's outline.
4. **A paragraph per item.** A list item or paragraph of the source is one `body` line,
   word for word (bold and `code` stay Markdown), written without a code: `docc build`
   ends every block in its permanent code ` ^PAY-14` (the document's `key`, which docc
   writes too, and the next number).
5. **A table** is one paragraph, rows separated by `\n`.
6. `docc validate --format json --max-diagnostics 0`. Words the style rules flag
   (DOC352 "several", DOC353 "new") in verbatim text are terms ("new password",
   "several pages"): a `docIgnore` on the document with the rule and the reason
   "carried over verbatim; …". Fix the rest by the `docc` skill. Done when errors are 0
   and the only warnings are DOC403 (no tags in code yet).
7. Delete the original `.md`. The conversion cannot be committed on its own: the
   `docc check` hook rejects DOC403 until the code has tags. Conversion and prototype
   are one commit.

Docspace: a new project is created by an ADMIN in `/app`; moving an existing repository
is the `docspace` skill. Example documents in docc — `docs/` of the protokit repository.
