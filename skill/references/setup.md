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
- `tests/journeys.spec.ts` — the paths (see `references/design.md`).

## 5. Generate and check

```bash
npm run check        # docs index, GraphQL types, Biome, TypeScript
npm run test:e2e     # builds, serves, runs the panel checks and the paths
```

Done when both exit 0.

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
- **State of a tab** (a lock screen, a recent password re-entry) lives in React state
  or in a store reset on `useSession.subscribe`: the kit remounts the screens when the
  person in «People» changes, but module-level stores survive.
- **A new shadcn primitive:** `npx shadcn@latest add <name>`, then `npm run check`.
