# The prototype as a product: paths, world, screens, critic

The bar: someone who does not know it is a prototype takes it for a finished service.
The screen rules themselves are in `prototype/DESIGN.md`; this file is the order of work
and the acceptance.

## 1. Paths — before screens

Write the paths from the documents into `tests/journeys.spec.ts` as lists of steps,
before any code:

1. **First contact.** How a stranger gets in: sign-in, invitation, sign-up, account
   recovery. These are the first screens; `/` without a token leads here.
2. **The main task of each role** — from sign-in to the result.
3. **Edge cases from the requirements:** wrong input, a server refusal, offline, an
   expired deadline, a limit, empty data, someone else's data out of reach.
4. **Two people** — if people interact in the documents (share, write, approve): a path
   in two tabs of one Playwright context.

What a path types is realistic: real-looking names, emails, codes like `482913`, not
`000000` or `test` — it ends up on screenshots.

Every step is a person's action or a world event. What a person cannot do is an
`EVENTS` event: a button in «World» (`panel: true`) or in a letter (`actions`).

## 2. World

- **People** (`seed`) — every role of the documents that has screens, plus neighbours
  to interact with. Real-looking names, emails, passphrases. What a person knows or
  holds — a password, a paper recovery sheet, a key — goes into their `note` in
  «People» (a line per item) and nowhere else.
- **History** — 5–12 records per person dated in the past relative to `now()`: lists are
  not empty, deadlines differ, something is unread. Empty states belong to a new person.
- **Letters and texts** — wherever the documents say "a code arrives", "a notification",
  "an invitation": `ctx.send({ to, subject, body, code?, actions? })`.
- **Events** — what an operator, the server, outside systems do: one event for every
  requirement that cannot be reached otherwise.
- **Sessions and devices** — if the documents speak of them (session lifetime, "sign out
  on other devices", a device list). The tab token `proto.<id>` is "this browser" of the
  person; its session and the other devices live in `Db` (the others are seeded), and
  `me` in the resolvers refuses once this browser's session is revoked or expired.
  State of the tab (a lock, a recent password re-entry) resets when «People» switches
  the person.
- **Every variant on screen.** Seed data covers each display rule: your own and someone
  else's last item, long and short names, read and unread, every deadline state.

## 3. Screens

Follow `prototype/DESIGN.md`. In short: the platform from the documents (phone first
for "phone", "PWA", "mobile"); a product frame; loading, empty, error, offline for every
list and request; a way out of every wait; one place for what neighbouring screens
share; dark-theme contrast `bg-card` + `border` on `bg-muted`; "not found" for a wrong
address; the product's voice in every text.

## 4. Screenshots

`shot(page, "<nn>-<screen>")` from `tests/helpers.ts` on every meaningful step of a
path takes the product without the panel: 390×844 and 1280×800, light and dark —
`screens/*.png` (a folder of its own: Playwright empties `test-results/` on every run, a partial one included). Wait for the consequences of the action first (a counter
reset, a toast shown), otherwise the themes are shot in different states. Minimum: the
first screen, every screen of the main tasks, every error and empty state on the
paths, offline, and one loading state: `slowServer(page, 10_000)`, act, `shot`,
`slowServer(page, null)`.

## 5. The critic

Visual readiness is accepted by someone who did not build it. Start a separate agent
(the agent tool; none — walk the list yourself and say so in the report) with:

> You are a strict product designer. In front of you: the prototype's screenshots
> `<path>/prototype/screens/*.png` (phone and desktop, light and dark),
> the rules `<path>/prototype/DESIGN.md` and the requirement documents
> `<path>/docs/src` — what the product must do. Open every screenshot. Accept or reject
> the look as a finished product. A blocker is what tells a person it is a mockup or
> unfinished: service text, an empty or broken screen, overlapping elements, text past
> the edge, unreadable contrast in the dark theme, no loading or error state,
> contradicting text, a dead end, inconsistent spacing, buttons or type between screens,
> fake data ("Test User", "Lorem"), a phone screen laid out as a shrunken desktop. A
> feature the documents do not have is not a blocker: note it as a question to the
> documents. The kit's design tokens (`src/index.css`) are not a blocker. Built-in
> browser controls (the date field's placeholder) speak the headless browser's
> language: not a blocker. Accepted decisions are not blockers: <decisions from earlier
> rounds with reasons>. Return blockers (screenshot, what is wrong, how to fix), minor
> notes and questions to the documents. Change nothing.

Fix the blockers, shoot again and hand the new screenshots to **the same** critic
(continue its conversation, do not start a new one): it remembers what it accepted and
looks only at what changed. A new agent every round finds new "blockers" in what was
accepted and costs a full review each time. A note you reject on purpose goes to
"Accepted decisions" with the reason. Done at 0 blockers. Fix minor notes when cheap;
questions to the documents go to the report.
