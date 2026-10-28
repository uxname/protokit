# Working in protokit

This repository is the kit itself — the prototype (`prototype/`) and the agent skill
(`skill/`) — and LiteStack's prototype: it is a submodule of the LiteStack meta-repo, whose
`docs/src` are the documents the prototype is tied to (meta ADR-0011).

- People only read the documents and the prototype; agents keep every link between them,
  and docc makes a missed one impossible to commit (see "The idea" in README.md). A kit
  or skill change keeps it so: no path that confirms links without reading them.
- Building or changing a prototype follows [skill/SKILL.md](skill/SKILL.md).
- The kit (`prototype/src/kit`, `src/ui`, `scripts/`, `tests/helpers.ts`,
  `tests/smoke.spec.ts`) is shared by every prototype made from this repository: a change
  there must keep working for a project in another language and with other screens.
- LiteStack's prototype alone does not prove a kit change: its `src/spec` is one set of
  values. Before pushing, copy the changed kit files into a prototype made from the kit
  with other values (another `lang`, `OFFLINE_READS`, screens) and run its
  `npm run check` and `npm run test:e2e` too.
- The skill and the kit change together: a new kit feature is described in the skill in
  the same commit.
- The checks need `docc.json` in a parent folder, so they run inside a LiteStack clone.
  Before a commit, all green: `lefthook.yml` runs them — `docc check --max-warnings 0`
  and `check-sync.mjs` from the parent, `check-sync.test.mjs`, and in `prototype/`
  `npm run check`; before a push, `npm run test:e2e`.
- The product's name lives in `prototype/src/components/brand.ts` and `index.html` only:
  LiteStack's rename script rewrites it there, and a tagged file never holds it.
