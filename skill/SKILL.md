---
name: protokit
description: >
  Builds and maintains a product prototype with protokit (github.com/uxname/protokit)
  from the project's documents (docc, Docspace or Markdown): it looks and works like the
  finished product, but the server is simulated in the browser. It starts at sign-in,
  states come from people's actions and world events, every tab sees through one
  person's eyes, a standard panel shows the documentation behind each element, and
  edits to documents and prototype are synced both ways. Use on "make a prototype",
  "prototype from the docs", "show the system through the user's eyes", "sync the
  prototype with the documents", "the document changed — update the prototype", «сделай
  прототип», «прототип по документации», «сверь прототип с документами», «документ
  поменялся — обнови прототип», and on DOC209/DOC402 in files under prototype/.
---

# Prototype on protokit, tied to the documents

A prototype is a **product**, not a mockup: a person opens it, sees sign-in, signs in,
works, and the system answers like a real one. There is no server: GraphQL requests
run in the browser against `prototype/schema.graphql`. Everything that is not the
product lives in the **panel** — a narrow tab on the left edge. The product itself
holds no service word.

Words this skill thinks in:

- **World** — everything off screen: the server's data (seeded people with history),
  email and texts, time, network. One world for all tabs (`localStorage`); a change in
  one tab shows in the others.
- **Tab-person** — each tab has its own fake token. The server knows the person by the
  `Authorization` header, as a real one does. The token comes from sign-in or from the
  panel («People»).
- **Path** — a sequence of a person's actions from the documents: from the first screen
  without an account to the goal. Every state is reached by a path: an action or a
  world event. Nothing is switched by force.
- **Panel** — the kit's, the same in every project, never edited: «People», «Inbox»
  (letters with codes, buttons for outside actions), «World» (time, network, events,
  theme, reset), «Docs/Требования» (paragraphs of this screen, documentation mode,
  what no screen shows). A project configures it only through `src/spec`.
- **Documentation mode** — a panel switch: what the documents describe is outlined;
  hovering an element shows its paragraph and a link to the documents.
- **Rule** — a number, condition, text or type from the documents in code, inside a
  **region** `// docc:begin <targets>` … `// docc:end`. docc notices edits of a region
  (DOC402).
- **Tag** — `// docc: <id>#^<anchor>` in a file: the file implements the paragraph.
  docc carries a change of the paragraph to the file (DOC209).
- **Req** — `<Req to="<id>#^<anchor>">element</Req>` around what shows a paragraph.
  Invisible in the product; documentation mode reads it. A `Req` around the whole
  screen links the screen. The file with a `Req` carries the tag of the same target.

The prototype and the documents are **equal**: an edit on either side reaches the
other. `<skill>` below is this skill's folder.

## Every run

1. **Fresh documents.** A remote exists — `git pull`. Documents in Docspace — first
   the `docspace` skill (connection, draft branch).
2. **Documents in docc.** Markdown documentation — convert it by
   [references/markdown-to-docc.md](references/markdown-to-docc.md), asking first.
3. **The prototype exists, its kit is current.** No `prototype/` — set it up by
   [references/setup.md](references/setup.md). An existing one — compare its kit with
   the latest protokit and update it by "Updating the kit" there. Done when
   `npm run check` in `prototype/` exits 0.
4. **Sync before work.** From the root: `docc validate --format json --max-diagnostics 0`
   and `node <skill>/scripts/check-sync.mjs`. Work through every DOC209, DOC402,
   DOC401 and uncovered anchor by [references/sync.md](references/sync.md). Readers'
   comments on the documents (`docc comments --format json`, or Docspace) are requests:
   name the open ones in the report; one the user agrees to changes the paragraph, and
   the prototype follows it as any DOC209.
5. **The user's task.** A new prototype — paths and world first, screens after, by
   [references/design.md](references/design.md). An edit — in the rule first, then on
   the screens. A value the document lacks but a screen cannot do without — add it to
   the paragraph yourself: the sides are equal.
6. **Sync after work.** `npm run lint:fix` in `prototype/` **before** `docc ack`
   (formatting changes regions), then step 4 again. DOC402 on code written in this
   same run is expected — see [references/sync.md](references/sync.md).
7. **Checks.** All green, the output of each one read:
   - `docc check --max-warnings 0` (root);
   - `node <skill>/scripts/check-sync.mjs` (root);
   - `npm run check` (prototype/);
   - `npm run test:e2e` (prototype/) — the kit's panel checks and the paths in
     `tests/journeys.spec.ts`;
   - **the quality bar** below, with the critic at 0 blockers;
   - walk the panel yourself on `npm run dev`, in a browser or with a short Playwright
     script in a temporary folder outside `prototype/`: «People» in two tabs, a letter
     with a code, moving time, the network, documentation mode.
8. **Publish.** Documents in Docspace — commit, push to the draft branch and `publish`
   with a message saying what changed in documents and prototype. Otherwise commit
   only when asked. Never bypass the `docc check` hook.

## Rules of the prototype

- **A product without service.** No word "prototype", no password hints, no service
  pages in the product's navigation. Passwords are in «People», codes in «Inbox»,
  everything technical in the panel.
- **The path starts without an account.** `/` without a token leads to the stranger's
  first screen from the documents: sign-in, invitation, landing. Protected screens are
  wrapped in a sign-in check.
- **A state is a consequence.** Login errors come from a wrong password, a deadline
  passes by moving time, "offline" is the switch in «World», a letter comes from the
  server. What a person cannot do in the interface (confirm an email, approve a
  request, an operator's action) is a world event `EVENTS`: a button in «World» or in
  a letter.
- **Time, network, mail come from the world.** Time — `now()` in rules and resolvers,
  `useNow()` on screens, never `Date.now()`: everything the product shows or decides by
  time follows the panel's clock (a countdown included). Pure UI timing — a throttle,
  an animation — uses `performance.now()`. Network — `useWorld((s) => s.online)`,
  not `navigator.onLine`. Mail — `ctx.send(...)` in a resolver or an event.
- **A rule lives in a region.** One region, one rule; regions do not nest; targets
  separated by commas. Screens take numbers and texts from the rules.
- **A screen carries tags and Req.** The first line of a screen file is
  `// docc: <targets>`; an element showing a paragraph is wrapped in `<Req to="…">`
  with a literal `to`. The only child of `Req` passes props to its DOM element (DOM
  tags and shadcn primitives do).
- **A tag is a `//` line.** docc silently skips `{/* docc: … */}` in JSX.
- **Every anchor is covered.** A paragraph no screen can show (server internals,
  encryption, an operator's work) is a line in `src/spec/not-shown.ts` with the reason
  and a tag; the panel lists it under «Not on any screen».
- **The kit stays the kit.** `src/kit`, `src/ui`, `scripts/`, `tests/helpers.ts` and
  `tests/smoke.spec.ts` are not edited in a project. A kit bug is fixed in protokit
  (an issue or a pull request at github.com/uxname/protokit); a local workaround is
  named in the report.

## Quality bar

The bar: **someone who does not know it is a prototype takes it for a finished
product.** Visual quality is half of the prototype's value, not a finish.

- Rules: `prototype/DESIGN.md` — tokens, controls, layout, every state, accessibility,
  copy. Read it before the first screen.
- Screenshots: every meaningful step of a path calls `shot(page, "<nn>-<screen>")` —
  390×844 and 1280×800, light and dark. At least: the first screen, every screen of
  the main tasks, every error and empty state on the paths, one loading state, offline.
- State table: `tests/states.md` maps every list and request of every screen to the shot of
  each of its states, or says why a state is unreachable.
- **Critic.** Visual readiness is accepted by someone who did not build it: a separate
  agent by [references/design.md](references/design.md). Done at 0 blockers. A small
  visual edit also goes through screenshots.

## Talking to the user

- Questions only through the question tool, one decision per question, the
  recommended option first. Not a list of questions in the text.
- Answer in the user's language, plainly.
- Commit only when asked (or when the project's routine says so).

## Report

Short and plain:

- what changed in the prototype and in the documents, by paragraph (`id#^anchor`);
- what was added to the documents because the prototype lacked a value;
- what was decided where both sides changed, and why;
- the checks with numbers: anchors covered N of N, paths N, screenshots N, critic
  blockers 0;
- how to look: `npm run dev` in `prototype/`, whom to sign in as (from «People») and
  which path to walk.

The reference prototype is the protokit demo, "Family chat": sign-in, sign-up with a
code from the email, two people writing in two tabs, time, network, a world event,
documentation mode — `prototype/src` and `prototype/tests` of the protokit repository.
