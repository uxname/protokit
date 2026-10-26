# Design — how a prototype screen must look

The bar: **someone who does not know it is a prototype takes it for a finished
product.** Design is not polish added at the end; a rough screen makes every
reviewer argue about the roughness instead of the product.

The mistake this file prevents is **inventing a second version of something that
already exists** — a second button, a second card, a second way to show an empty
list. Two of anything drift apart, and the drift is what people see.

## Sources of truth

| Question | Answer |
|---|---|
| What colours exist? | the two theme blocks in `src/index.css` |
| What controls exist? | `src/ui` (table below) |
| How does a screen look in every state? | the screenshots: `npm run test:e2e`, then `screens/*.png` |
| How is a sign-in, a list, a detail screen built? | the demo: `src/screens`, `src/components` |
| What is a good composition for a new screen? | shadcn blocks as a pattern, built from `src/ui`: `login-03` (sign-in), `signup-03`, `sidebar-07` (app frame), `dashboard-01`. Read one: `curl -s https://ui.shadcn.com/r/styles/new-york-v4/<block>.json \| jq -r '.files[].content'` |

## Controls (`src/ui`)

shadcn/ui primitives (Radix + Tailwind + the tokens), copied into the repo. Use
them; never re-create them. A missing one: `npx shadcn@latest add <name>`, then
`npm run check`.

| Component | For |
|---|---|
| `button` | every action. `variant` default / outline / secondary / ghost / destructive / link; `size` xs / sm / default / lg / icon / icon-sm. A link that looks like a button: `<Button asChild><Link/></Button>` |
| `card` | the container of applied content: `Card` › `CardHeader` (`CardTitle`, `CardDescription`) › `CardContent` › `CardFooter` |
| `field`, `label`, `input`, `textarea` | a form row: `Field` › `FieldLabel htmlFor` + control `id` + `FieldDescription` or `FieldError`; `data-invalid` on `Field`, `aria-invalid` on the control |
| `dropdown-menu` | every pop-up menu |
| `dialog` | a modal question or form over the screen: confirm, re-enter the password |
| `native-select` | a short choice in a form (the browser's own select, styled) |
| `tooltip` | a hint on hover/focus instead of `title=` |
| `alert` | a message next to what failed or needs attention |
| `avatar` | initials or a picture |
| `badge` | a small label: a status, a role |
| `separator`, `collapsible` | a rule; show/hide a block |
| `skeleton` | a placeholder in the shape of what loads |
| `spinner` | an inline busy mark inside a button |
| `sonner` | toasts; mounted once by the kit, top-centre |

## Colour and tokens

Only semantic tokens — a palette class (`bg-white`, `text-slate-900`) ignores the
dark theme and is the most common way a prototype looks broken.

| Use | Token |
|---|---|
| page background under cards | `bg-muted` |
| raised surface | `bg-card` / `bg-background`; menus `bg-popover` |
| hover fill | `bg-accent` |
| borders | `border` |
| secondary text | `text-muted-foreground` |
| the accent | `primary`, text on it `primary-foreground` |
| meaning | `destructive`, `success`, `warning`, `info` — never decoration |

Dark theme contrast: a bubble, card or avatar on the page is `bg-card` + `border`
on `bg-muted`, never `bg-background` on `bg-background` (it disappears).
Radii stay the same in both themes.

## Layout

- **Platform from the documents.** "Phone", "PWA", "mobile" → design 390 px first:
  bottom navigation (up to 5 items) or list → detail, large tap targets. Otherwise
  desktop first. Both widths always work.
- **Product frame.** A header with the product name and the person's menu (name,
  email, "Sign out"); navigation in a bottom bar on a phone, a sidebar on desktop.
  Sign-in screens have no frame: a centred card on `bg-muted`, the link to the
  neighbouring screen under the card.
- **Neighbouring screens** (sign in ↔ sign up ↔ code) keep shared elements in the
  same place: logo, card width, link under the card.
- Framework steps only: no `p-[13px]`. Breakpoints `sm`, `md`, `lg`.
- Anything that can overflow — a name, an email, a long title — gets `truncate`
  and `min-w-0` on its flex parent.
- Toasts are top-centre (the kit mounts them): at the bottom they cover a phone's
  navigation.

## States — every list and every request

| State | What to render |
|---|---|
| loading | `Skeleton` in the shape of the content, container `aria-busy`, a screen-reader `role="status"` line. The simulated server answers in 250 ms, so it is seen |
| empty | a short line saying what will appear here and how — plus the action, if there is one |
| error | `Alert` next to what failed, the text from `errorText(error)`, a "Retry" button: `reexecute({ requestPolicy: "network-only" })` |
| offline | what was loaded stays on screen (the kit keeps it); actions that need the network are disabled, and an `Alert` with an icon next to them says why. No endless placeholders |
| waiting for someone else (a code by email, an approval) | always a way out: resend after a countdown, change the data, go back |
| submit in flight | the same `Button`, disabled, with a `Spinner` before the label |
| wrong or stale address | "not found" in the product's voice, actions on the missing thing hidden, one way back |
| an action finished | a toast, or the screen moves on |

**Forms:** label above, error under the field (`FieldError`, `aria-invalid`,
`aria-describedby` only while the error exists), submit disabled until the form is
filled, nothing typed is lost on a failure.

**The world shows every variant.** Seed data covers each rule of the screen: your
own and someone else's last item, long and short names, read and unread, every
deadline state — so every rule appears on some screenshot.

## Accessibility

- Visible focus everywhere: `outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50` (the primitives have it).
- A skip link to `#content`; one `<main>`; one `<h1>` per screen, no skipped levels.
- Every icon-only control has an `aria-label`; `aria-label` only on elements with a role (on a `span`, use `sr-only` text).
- Anything clickable is a `<button>` or a link.
- Meaning never rides on colour alone.

## Copy

- One language — the documents' (`lang` in `docc.json`). Screens are written as
  plain strings in it; no message files.
- The product's voice: short, a verb on a button ("Sign in", "Send"), an error says
  what happened and what to do. No jargon, no service words ("prototype", "test",
  "demo"), no placeholders like "Lorem" or "Test User".
- Realistic data: real-looking names, emails, codes like `482913` — they end up on
  screenshots.
- Numbers in text come from the rules in `src/spec`, never typed twice.

## Details

Icons from `lucide-react`; avatars with initials; relative time through `useNow()`
(it re-renders when the panel moves the clock); no `Date.now()` anywhere.

## Visual review

Before calling a screen done, look at its screenshots (phone and desktop, light
and dark):

- [ ] nothing overflows, nothing is clipped, nothing overlaps;
- [ ] dark theme: every surface separates from the one under it;
- [ ] loading, empty, error and offline are each reachable and rendered as above;
- [ ] same spacing, buttons and type as the neighbouring screens;
- [ ] no service text, no fake data, no dead end.
