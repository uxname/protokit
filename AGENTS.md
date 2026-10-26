# Working in protokit

This repository is the kit itself: the demo prototype "Family chat" (`docs/`,
`prototype/`) and the agent skill (`skill/`).

- Building or changing a prototype follows [skill/SKILL.md](skill/SKILL.md) — the demo is
  a prototype like any other.
- The kit (`prototype/src/kit`, `src/ui`, `scripts/`, `tests/helpers.ts`,
  `tests/smoke.spec.ts`) is shared by every prototype made from this repository: a change
  there must keep working for a project in another language and with other screens.
- The skill and the kit change together: a new kit feature is described in the skill in
  the same commit.
- Before a commit, all green: `docc check --max-warnings 0`,
  `node skill/scripts/check-sync.mjs`, `node skill/scripts/check-sync.test.mjs`, and in
  `prototype/`: `npm run check`, `npm run test:e2e`.
