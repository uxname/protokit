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
product lives in the **panel** — a narrow tab on the screen's edge; the tester drags
the tab and the open panel off whatever they cover, and they stay there after a
reload. The product itself holds no service word.

Words this skill thinks in:

- **World** — everything off screen: the server's data (seeded people with history),
  email and texts, time, network. One world for all tabs (`localStorage`); a change in
  one tab shows in the others. In a product without a server the world is the
  browser's own storage (see the rules).
- **Tab-person** — each tab has its own fake token. The server knows the person by the
  `Authorization` header, as a real one does. The token comes from sign-in or from the
  panel («People»). A product without sign-in has nobody to list: `people()` returns
  `[]`, the panel shows no «People», and every tab is the device's owner.
- **Path** — a sequence of a person's actions from the documents: from the first screen
  without an account to the goal. Every state is reached by a path: an action or a
  world event. Nothing is switched by force.
- **Panel** — the kit's, the same in every project, never edited: «People», «Inbox»
  (letters with codes, buttons for outside actions), «World» (time, network, events,
  theme, reset), «Docs/Требования» (paragraphs of this screen, documentation mode,
  what no screen shows). A project configures it only through `src/spec`.
- **Documentation mode** — a panel switch: what the documents describe is outlined;
  hovering an element shows a hint with its code and paragraph; a click opens its
  paragraphs in full in a side at the right edge (the product moves aside), with a copy
  of the code and links to the documents.
- **Rule** — a number, condition, text or type from the documents in code, inside a
  **region** `// docc:begin <targets>` … `// docc:end`. docc notices edits of a region
  (DOC402).
- **Code** — the permanent name of a block of the documents, ` ^PAY-14` at its end. People
  read it in the readers and the panel and use it to point at a paragraph. Its rules are
  the `docc` skill's.
- **Tag** — `// docc: <id>#^<code>@<hash>, … ~<print>` on the first line of a file: the
  file implements those paragraphs. Hashes and prints follow the `docc` skill ("Code
  tags"); a stale one fails `docc check` (DOC209, DOC402).
- **Req** — `<Req to="<id>#^<code>">element</Req>` around what shows a paragraph; an
  element that shows several names them all in one: `to="i1#^I1-2, i1#^I1-5"`.
  Invisible in the product; documentation mode reads it. A `Req` around the whole
  screen links the screen. The file with a `Req` carries the tag of each of its targets.

The prototype and the documents are **equal**: an edit on either side reaches the
other. People only read both; the links between them are the agent's routine, and docc
makes a missed one impossible to commit — so never look for a way around a stale hash
or print: read the change, bring the other side in line, write the new value by hand.
`<skill>` below is this skill's folder.

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
   DOC401, uncovered block and untagged file by [references/sync.md](references/sync.md). Readers'
   comments on the documents (`docc comments --format json`, or Docspace) are requests:
   name the open ones in the report; one the user agrees to changes the paragraph, and
   the prototype follows it as any DOC209.
5. **The user's task.** A new prototype — paths and world first, screens after, by
   [references/design.md](references/design.md). An edit — in the rule first, then on
   the screens. A value the document lacks but a screen cannot do without — add it to
   the paragraph yourself: the sides are equal.
6. **Sync after work.** `npm run lint:fix` in `prototype/` **before** writing prints
   (formatting changes the code), then step 4 again. DOC402 on code written in this
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
     with a code, moving time, the network, documentation mode — whichever of them the
     product has.
8. **Publish.** Documents in Docspace — commit, push to the draft branch and `publish`
   with a message saying what changed in documents and prototype. Otherwise commit
   only when asked. Never bypass the `docc check` hook.

## Rules of the prototype

- **A product without service.** No word "prototype", no password hints, no service
  pages in the product's navigation. Passwords are in «People», codes in «Inbox»,
  everything technical in the panel.
- **The path starts without an account.** `/` without a token leads to the stranger's
  first screen from the documents: sign-in, invitation, landing. Protected screens are
  wrapped in a sign-in check. A product without sign-in (the documents have no
  accounts) opens straight on its first screen; the header has no person's menu, the
  seed may be empty (a first open that shows 0 is the documents' first screen).
- **A product without a server** (the documents keep the data on the device: no
  accounts, no sync) has no simulated server: delete `schema.graphql`, `src/graphql/`,
  `src/spec/resolvers.ts` and `OFFLINE_READS` — the kit needs none of them. Screens read
  the world with `useWorld((s) => s.db)` and write it with
  `useWorld((s) => s.update)(rule)`, a rule from `src/spec`: that is the browser's
  storage, it outlives a reload, and the network switch does not touch it, as on a real
  device. Not a bypass of the server — there is none to bypass.
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
- **Every rule and screen file carries a tag.** The first line of each file of
  `src/spec` and `src/screens` is `// docc: <targets>`; a file with nothing of the
  documents (an index, the seed data, a wrong-address page) says why on
  `// docc-none: <reason>`. A paragraph's tag stands in one place: a rules file whose
  rules all sit in regions has no first-line tag — its regions are its tags. In a screen an element showing a paragraph is wrapped in `<Req to="…">`
  with a literal `to`. The only child of `Req` passes props to its DOM element (DOM
  tags and shadcn primitives do).
- **A tag is a `//` line.** docc silently skips `{/* docc: … */}` in JSX.
- **Every requirement block is covered.** A paragraph no screen can show (server internals,
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
  the main tasks, every error and empty state on the paths; when the product asks a
  server, also one loading state and offline.
- State table: `tests/states.md` maps every list and server request of every screen to
  the shot of each of its states, or says why a state is unreachable. Loading, error
  and offline belong to a request to the server only: what a screen reads from the
  browser's storage has none of them — `—` in those cells, no reason needed.
- **Critic.** Visual readiness is accepted by someone who did not build it: a separate
  agent by [references/design.md](references/design.md). Done at 0 blockers. A small
  visual edit also goes through screenshots. Which of its remarks are questions to the
  documents and which are fixed in the prototype — "The critic's remarks" there.

## Talking to the user

- Questions only through the question tool, one decision per question, the
  recommended option first. Not a list of questions in the text.
- Answer in the user's language, plainly.
- Commit only when asked (or when the project's routine says so).

## Report

Short and plain:

- what changed in the prototype and in the documents, by paragraph (`id#^code`);
- what was added to the documents because the prototype lacked a value;
- what was decided where both sides changed, and why;
- the checks with numbers: blocks covered N of N, paths N, screenshots N, critic
  blockers 0;
- how to look: `npm run dev` in `prototype/`, whom to sign in as (from «People»;
  nobody in a product without sign-in) and which path to walk.

The starting prototype in `prototype/` of the protokit repository is the smallest one
that runs — a home page and a sign-in page, LiteStack's (a submodule of its meta-repo).
The patterns of a larger one — sign-up with a code from the email, two people writing in
two tabs, time, network, a world event — are in the protokit history: the "Family chat"
demo, last in commit `c3d7c9a`.
