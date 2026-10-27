# Syncing the prototype and the documents

Read this when `docc validate` or `check-sync.mjs` finds a problem. Close every problem
having read **both** sides: the paragraph and the code.

## How a link knows the other side changed

Every block of the documents ends in a permanent code (` ^k7f2`, given by `docc build`;
never write, change or move one by hand). Every link carries the hash of the version it
was checked against: `// docc: i4#^k7f2@3a9c` in code, `[[i4#^k7f2@3a9c]]` or
`[[i4@9b1e]]` (a whole document) in the documents. A tag line ends in the print of its
file (`~e91d`), a `docc:begin` line in the print of its region. docc compares them with
what stands now; a difference fails `docc check`, and with it the commit.

There is no command that confirms links: each stale hash is rewritten by hand, in its
own place, after reading what changed. docc's message shows the change and the new
hash — it is not a value to paste without reading.

## What each signal means

| Signal | What happened | What to do |
|---|---|---|
| DOC209 on a `prototype/…` file | a block the file's tag points at changed | read the change docc shows (and `git log -p -- docs/src/<id>.json`); bring the file in line — the rule in `src/spec`, the screen, the texts; then write the new hash into that target of the tag |
| DOC209 on a `docs/src/…` file | a block or document this link points at changed | read the linking paragraph against the change; it repeats the old value — fix it; then write the new hash into the link |
| DOC402 on a `prototype/…` file | code of the file (outside regions) or of a region changed | read the edit (`git diff`); check every target of that tag or region against the code — rewrite a paragraph so it says what the code does (numbers, conditions, order); then write the new print docc names |
| DOC209 and DOC402 on one pair | both sides changed | see "Both sides changed" |
| DOC212 | one code on two blocks (a copied paragraph) | keep the code on the original, remove it from the copy; `docc build` gives the copy its own |
| DOC216 | a block without a code | `docc build` |
| DOC401 | a tag points at a document or code that does not exist | the block was deleted — remove the tag and what it required, or ask the user; codes never change, so there is nothing to rename |
| `check-sync`: block without a tag | a new requirement paragraph | show it on a screen (rule + `Req` + tag) or add it to `not-shown.ts` with the reason |
| `check-sync`: file without a tag | a file of `src/spec` or `src/screens` names no paragraph | add the `// docc:` line with the paragraphs it implements; a file with nothing of the documents (an index, the seed data, a wrong-address page) says why on `// docc-none: <reason>` |
| `check-sync`: tag in a JSX comment | docc does not see it | move it to a `//` line above the markup |
| `check-sync`: `Req` without a tag | the element is marked, nothing tracks it | add the target to the file's `// docc:` line |
| DOC403 | a document of a kind with `x-docc-covered` has no tag at all | as "block without a tag" |

A new tag or a new target in one is written without a hash (`// docc: i4#^k7f2`):
docc's DOC209 then names the hash to write after you read the block.

## The old value elsewhere

docc sees only links and tags. A number or a deadline of a changed paragraph is often
repeated without a link: risk tables, plans, screen texts, tests. After an edit search
for the old value (`grep -rn "5 minutes" docs/src prototype/src prototype/tests`).
Bring a repeat of the same rule to the new value and name it in the report. Not sure it
is the same rule — leave it and ask in the report.

## Both sides changed

If both the block and the code changed since their hashes were last written, the
**later** edit wins:

1. The block's time — `git log -1 --format=%ct -- docs/src/<id>.json`; the code's —
   `git log -1 --format=%ct -- <file>`. An uncommitted edit is newer than any commit.
2. Same meaning — change nothing but the hash and the print.
3. Different meaning — the later side leads, bring the other to it.
4. Both uncommitted or in one commit, with different meaning — ask the user one
   question (the question tool), showing both versions.

Each such decision is a line in the report: what the paragraph said, what the code did,
what was chosen and why.

## Rules of hashes and prints

- Write a hash or a print only after both sides are read and say the same — one place
  at a time. A region with several targets (`autolock#^k7f2, criteria#^m2pq`) is checked
  against each of them.
- `npm run lint:fix` in `prototype/` first, then the prints: formatting changes the
  code, and a print written before formatting breaks again.
- **Your own code in this run.** Every edit of your own code breaks its print. That is
  not a divergence: at the end of the work check each tag and region against its
  paragraphs and write the prints once.
- A block tagged in N files gives N DOC209 after an edit. Walk all N files: one rule is
  often shown on several screens.

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
