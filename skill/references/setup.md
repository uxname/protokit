# Setting up a prototype

Work from the documents' root (next to `docc.json`). Each step ends in something you
can check.

## 1. Tools

- Node.js 22+ and `docc` on `PATH` (`docc --version`). No docc:
  `curl -fsSL https://raw.githubusercontent.com/uxname/docc/main/install.sh | sh`
  (Windows: `irm https://raw.githubusercontent.com/uxname/docc/main/install.ps1 | iex`).
- `docc.json` has `"lang"` — the documents' language. The panel speaks it (`ru`
  gives a Russian panel, anything else English) and the screens are written in it.

## 2. The kit

```bash
npx -y degit uxname/protokit/prototype prototype
cd prototype && npm install --no-audit --no-fund
```

Add to `../docc.json`: `"trace": {"scan": ["prototype/src/**", "prototype/schema.graphql"]}`.

## 3. Remove the demo

The kit arrives with the demo "Family chat" — the reference for every file you are
about to write; read it before deleting. Delete with full paths, one path per `rm`, no
globs and no `cd` in the same command:

- `src/spec/model.ts`, `src/spec/world.ts`, `src/spec/rules.ts`, `src/spec/resolvers.ts`,
  `src/spec/not-shown.ts` (keep `src/spec/index.ts` and `src/spec/docs.ts`);
- `src/screens/*`, `src/components/*`, `src/lib/initials.ts`;
- `src/routes/index.tsx`, `src/routes/sign-in.tsx`, `src/routes/sign-up.tsx`,
  `src/routes/chat` (keep `src/routes/__root.tsx`);
- `src/graphql/*`, `schema.graphql`, `tests/journeys.spec.ts`.

Keep the kit: `src/kit`, `src/ui`, `src/lib/cn.ts`, `src/main.tsx`, `src/index.css`,
`scripts/`, `tests/helpers.ts`, `tests/smoke.spec.ts`, configs, `DESIGN.md`.

## 4. The product

### `src/spec` — the contract the kit relies on

| File | Exports |
|---|---|
| `model.ts` | `Db` — everything the server holds; `Ctx = ProtoCtx<Db>` (`import type` from `@/kit`) |
| `world.ts` | `seed(): Db` — the starting world; `people(db): Person[]` — whom «People» lists (`note`: email, password, whatever the person holds — a line per item); `EVENTS: Record<id, ProtoEvent<Db>>` — world events |
| `resolvers.ts` | `resolvers` — root fields of `Query` and `Mutation`; sign-in returns `ctx.tokenFor(id)` |
| `rules.ts` | the documents' rules; among them `OFFLINE_READS: boolean` — `true` if the documents promise reading offline (the app keeps a local copy), `false` — offline only what is loaded stays |
| `not-shown.ts` | `NOT_SHOWN: { to, why }[]` with tags above the list |
| `docs.ts` | `DOCS_TARGET.docspace` — `{ url, projectId }` or `null` (links open `docs.html`) |
| `index.ts` | re-exports all of it |

- Rules take time from `@/kit/clock` (`now`) — by that path, not through `@/kit`: the
  kit's index imports `@/spec` itself.
- `world.ts` imports from the kit only types and `@/kit/clock`: the tests read it in Node.
- `ctx.db` is the world as it is now: after `ctx.update(...)` it already holds the change.

### The rest

- `schema.graphql` — the simulated server's types and operations; `src/graphql/*.graphql`
  — the operations screens use (`npm run gen` types them into `@/generated/graphql`).
- `src/screens/<Screen>.tsx` — screens; `src/components/` — the product's frame and
  shared pieces; `src/routes/` — one file per route:
  `createFileRoute("/path")({ component, head: () => ({ meta: [{ title }] }) })`.
- `src/screens/NotFound.tsx` — the 404 in the product's voice: `__root.tsx` imports it.
- `index.html` — the product's: its name in `<title>` (the routes set their own titles
  over it).
- `tests/journeys.spec.ts` — the paths (see `references/design.md`).

## 5. Generate and check

```bash
npm run check        # docs index, GraphQL types, Biome, TypeScript
npm run test:e2e     # builds, serves, runs the panel checks and the paths
```

Done when both exit 0.

## Updating the kit

protokit improves; a prototype made earlier takes the improvements by copying the kit,
never by editing it in place.

```bash
npx -y degit uxname/protokit/prototype /tmp/protokit-latest --force
```

1. Compare: `diff -r /tmp/protokit-latest/src/kit prototype/src/kit`, the same for
   `src/ui`, `scripts/`, `tests/helpers.ts`, `tests/smoke.spec.ts`, `src/main.tsx`,
   `src/index.css` and the `scripts` and dependencies of `package.json`, `playwright.config.ts`,
   `vite.config.ts`, `tsconfig.json`, `biome.json`, `.gitignore`. No difference — done.
2. Copy the kit's files over the project's (primitives the project added to `src/ui`
   stay), bring the kit's `package.json` scripts and dependency versions over without
   dropping the project's own, `npm install`.
3. Read what changed in the kit (`git log` of protokit, the skill) — a kit change can
   ask something of the product code (a renamed helper, a new contract field).
4. `npm run check` and `npm run test:e2e`; the screenshots go to the critic only if the
   look changed.

## Migrating an existing prototype

A prototype built on an older base (LiteFront, the former `litefront-prototype` skill)
moves screen by screen, not rewritten: its world, rules, resolvers, schema, operations,
screens and paths were already accepted.

1. Note the links before the move: `git show HEAD:docc.lock > /tmp/docc.lock.before`.
2. Move the old `prototype/` out of the repository (keep it to read), set up the kit by
   steps 1–3, carry the product code into `src/spec`, `src/screens`, `src/components`,
   `src/routes`, `src/graphql`, `tests/journeys.spec.ts`; drop what the kit now owns —
   the panel, service pages, the theme switch, comments, SSR settings, message files.
3. Files the kit's `.gitignore` ignores but git still tracks (`src/generated/*` and the
   like): `git rm --cached` them.
4. A moved file is a new link to docc: `npm run docs` records it **without** a DOC402.
   For each moved file compare its links' fingerprints in `docc.lock` with the old
   path's in `/tmp/docc.lock.before`: a different fingerprint means the code changed on
   the way — read both sides as for DOC402.

## Pitfalls

- **Hash routing.** The built prototype opens from any static host (`npm run build` →
  `dist/`, including `docs.html`). Links are `<Link to="/path">`; tests open screens
  with `go(page, "/path")`, never `page.goto("/path")`.
- **`.gitignore` hides files from Tailwind.** Tailwind v4 generates classes only from
  files git does not ignore: a bare `screens` line also hides `src/screens`, and its
  styles silently vanish from the build. Anchor such patterns: `/screens`.
- **Screenshots live in `screens/`**, not `test-results/`: Playwright empties
  `test-results/` on every run, a partial one included.
- **A tag in JSX** `{/* docc: … */}` is invisible to docc — `//` lines only.
- **`docc compile` and `docc build` exit 1 while warnings stand**, yet print their
  output; `scripts/proto-docc.mjs` accounts for it.
- **`npm run lint:fix` before `docc ack`** — formatting changes regions.
- **Two ways to change the token.** The product's sign-in and sign-out use
  `useSession.setToken`: screens keep their state, so a flow can sign in and go on.
  The panel's «People» uses `switchTo`: another person, so the kit remounts the screens.
  State of a tab (a lock screen, a recent password re-entry) lives in React state or in
  a store reset on `useSession.subscribe` — module-level stores survive a remount.
- **A new shadcn primitive:** `npx shadcn@latest add <name>`, then `npm run check`.
