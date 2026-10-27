# Working in protokit

This repository is the kit itself: the demo prototype "Family chat" (`docs/`,
`prototype/`) and the agent skill (`skill/`).

- People only read the documents and the prototype; agents keep every link between them,
  and docc makes a missed one impossible to commit (see "The idea" in README.md). A kit
  or skill change keeps it so: no path that confirms links without reading them.
- Building or changing a prototype follows [skill/SKILL.md](skill/SKILL.md) — the demo is
  a prototype like any other.
- The kit (`prototype/src/kit`, `src/ui`, `scripts/`, `tests/helpers.ts`,
  `tests/smoke.spec.ts`) is shared by every prototype made from this repository: a change
  there must keep working for a project in another language and with other screens.
- The demo alone does not prove a kit change: the demo's `src/spec` is one set of values.
  Before pushing, copy the changed kit files into a prototype made from the kit with other
  values (another `lang`, `OFFLINE_READS`, screens) and run its `npm run check` and
  `npm run test:e2e` too.
- The skill and the kit change together: a new kit feature is described in the skill in
  the same commit.
- Before a commit, all green: `docc check --max-warnings 0`,
  `node skill/scripts/check-sync.mjs`, `node skill/scripts/check-sync.test.mjs`, and in
  `prototype/`: `npm run check`, `npm run test:e2e`.
