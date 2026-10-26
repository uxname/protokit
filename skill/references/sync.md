# Syncing the prototype and the documents

Read this when `docc validate` or `check-sync.mjs` finds a problem. Close every problem
having read **both** sides: the paragraph and the code.

## What each signal means

| Signal | What happened | What to do |
|---|---|---|
| DOC209 on a `prototype/…` file | a paragraph the file's tag points at changed | read the new paragraph and what changed (`git diff`, `git log -p -- docs/src/<id>.json`); bring the file in line — the rule in `src/spec`, the screen, the texts; then `docc ack <document id>` |
| DOC209 on a `docs/src/…` file | a paragraph another document links to changed | read the linking paragraph; it repeats the old value — fix it, otherwise just `docc ack <id of the changed document>` |
| DOC402 on a `prototype/…` file | code in a region changed | read the edit (`git diff`, `git log -p -- <file>`); rewrite the paragraph so it says what the code does: numbers, conditions, order; then `docc ack <file>` |
| DOC209 and DOC402 on one pair | both sides changed | see "Both sides changed" |
| DOC401 | a tag points at a document or anchor that does not exist | the anchor was renamed — find the new one (the old target is in `docc.lock`, the text in `docs/src`) and fix the tag; the paragraph was deleted — remove the tag and what it required, or ask the user |
| `check-sync`: anchor without a tag | a new requirement paragraph | show it on a screen (rule + `Req` + tag) or add it to `not-shown.ts` with the reason |
| `check-sync`: tag in a JSX comment | docc does not see it | move it to a `//` line above the markup |
| `check-sync`: `Req` without a tag | the element is marked, nothing tracks it | add the target to the file's `// docc:` line |
| DOC403 | a document of a kind with `x-docc-covered` has no tag at all | as "anchor without a tag" |
| DOC503 | `docc.lock` does not match the links | `docc build` from the root |

## The old value elsewhere

docc sees only links and tags. A number or a deadline of a changed paragraph is often
repeated without a link: risk tables, plans, screen texts, tests. After an edit search
for the old value (`grep -rn "5 minutes" docs/src prototype/src prototype/tests`).
Bring a repeat of the same rule to the new value and name it in the report. Not sure it
is the same rule — leave it and ask in the report.

## Both sides changed

If both the paragraph and the region changed since the last `docc ack`, the **later**
edit wins:

1. The paragraph's time — `git log -1 --format=%ct -- docs/src/<id>.json`; the code's —
   `git log -1 --format=%ct -- <file>`. An uncommitted edit is newer than any commit.
2. Same meaning — change nothing, only `docc ack`.
3. Different meaning — the later side leads, bring the other to it.
4. Both uncommitted or in one commit, with different meaning — ask the user one
   question (the question tool), showing both versions.

Each such decision is a line in the report: what the paragraph said, what the code did,
what was chosen and why.

## Rules of `docc ack`

- Only after both sides are read and say the same.
- `docc ack` prints every link it confirms — read the list: it confirms everything where
  the argument is the source or the target. `ack` on a file confirms **all** targets of
  its regions: check a region with several targets
  (`autolock#^autolock, criteria#^memory-wipe`) against each. A target that does not
  match the code is fixed first. Never `docc ack --all`.
- `npm run lint:fix` in `prototype/` first, then ack: formatting changes regions, and a
  fingerprint confirmed before formatting gives DOC402 again.
- **Your own code in this run.** `npm run docs` (it runs before `dev`, `build`, `check`
  and `test:e2e`) records region fingerprints, so every later edit of your own code
  gives DOC402. That is not a divergence: at the end of the work check the paragraph
  against the code and ack once.
- A paragraph tagged in N files gives N DOC209 warnings after an edit. Walk all N files:
  one rule is often shown on several screens.

## A value the document lacks

The prototype needs a threshold, a deadline or a range the paragraph does not give —
add it to the paragraph in one sentence in the document's style, with the number.
Example: "The 'expiring soon' screen shows documents whose term ends in the next 90
days." The value in code and in the paragraph match. In the report — a section "Added
to the documents".

## Docspace

Edit documents in Docspace on a draft branch (the `docspace` skill): prototype and
documents in one commit, so tags and paragraphs do not drift between branches. After
the checks — `publish` with a message saying what changed. Requirement links in the
panel open the Docspace reader when `docspace` is filled in `src/spec/docs.ts` (the
address and the project id from `/app/projects/<id>`).
