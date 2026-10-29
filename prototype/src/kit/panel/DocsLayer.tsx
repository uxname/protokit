import { BookOpen, Check, Copy, ExternalLink, X } from "lucide-react";
import {
  type FC,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { create } from "zustand";
import { type Requirement, requirement } from "../docs";
import { t } from "../i18n";

/** Documentation mode: on while the tester reads the screen against its documents. */
export const useDocsMode = create<{ on: boolean; set: (on: boolean) => void }>(
  (set) => ({ on: false, set: (on) => set({ on }) }),
);

const PANEL = "[data-proto-panel]";

/**
 * The deepest element under the point: by coordinates, then down through the children,
 * because a disabled shadcn button has pointer-events: none and the browser alone would
 * return its parent.
 */
const elementAt = (x: number, y: number): Element | null => {
  const hit = document.elementFromPoint(x, y);
  if (!hit || hit.closest(PANEL)) return null;
  let el: Element = hit;
  for (;;) {
    const inner = [...el.children].find((c) => {
      const r = c.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    });
    if (!inner) return el;
    el = inner;
  }
};

/**
 * The requirements of the element at a point: its own `Req` first, then those around it
 * up to the screen. The point is kept: a tall element's card stands by the pointer.
 */
const chainOf = (
  x: number,
  y: number,
): { el: Element; reqs: Requirement[]; x: number; y: number } | null => {
  const own = elementAt(x, y)?.closest("[data-req]");
  if (!own) return null;
  const reqs: Requirement[] = [];
  for (
    let at: Element | null = own;
    at;
    at = at.parentElement?.closest("[data-req]") ?? null
  ) {
    const r = requirement(at.getAttribute("data-req") ?? "");
    if (r && !reqs.some((x) => x.to === r.to)) reqs.push(r);
  }
  return { el: own, reqs, x, y };
};

const HINT_W = 360;
/** The side the read paragraphs stand in; the product moves aside for it on a wide screen. */
const SIDE_W = 400;
const WIDE = SIDE_W + 640;

const plain = (text: string) => text.replace(/\*\*/g, "");

/** A button that copies a value and says so for a moment. */
const CopyButton: FC<{
  value: () => string;
  label: string;
  className?: string;
  children: ReactNode;
}> = ({ value, label, className, children }) => {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        void navigator.clipboard?.writeText(value());
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className={`inline-flex items-center gap-1.5 rounded-md outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 ${className ?? ""}`}
    >
      {children}
      {done ? (
        <Check className="size-3.5 text-primary" />
      ) : (
        <Copy className="size-3.5 opacity-60" />
      )}
      <span className="sr-only" aria-live="polite">
        {done ? t.copied : ""}
      </span>
    </button>
  );
};

/** The requirements grouped by their document, in the order met: a title once per document. */
const byDocument = (reqs: Requirement[]) => {
  const groups: { title: string; reqs: Requirement[] }[] = [];
  for (const r of reqs) {
    const g = groups.find((x) => x.title === r.title);
    if (g) g.reqs.push(r);
    else groups.push({ title: r.title, reqs: [r] });
  }
  return groups;
};

/**
 * While documentation mode is on: every element the documents describe is outlined; the
 * one under the pointer is framed and a small hint names its code and paragraph. A click
 * opens its paragraphs, in full, in a side at the right edge, instead of pressing the
 * element; on a wide screen the product moves aside for it, so nothing of it is covered.
 * Esc closes the side, then leaves the mode.
 */
export const DocsLayer: FC = () => {
  const on = useDocsMode((s) => s.on);
  const setOn = useDocsMode((s) => s.set);
  const [hover, setHover] = useState<ReturnType<typeof chainOf>>(null);
  const [pinned, setPinned] = useState<ReturnType<typeof chainOf>>(null);
  const [, redraw] = useState(0);
  const hint = useRef<HTMLDivElement>(null);
  const [hintH, setHintH] = useState(0);
  const pinnedRef = useRef(pinned);
  pinnedRef.current = pinned;

  useEffect(() => {
    if (!on) {
      setHover(null);
      setPinned(null);
      return;
    }
    const move = (e: PointerEvent) => {
      if ((e.target as Element | null)?.closest?.(PANEL)) {
        setHover(null);
        return;
      }
      setHover(chainOf(e.clientX, e.clientY));
    };
    // The product must not react while the tester reads it: presses open the side instead.
    const swallow = (e: Event) => {
      if ((e.target as Element | null)?.closest?.(PANEL)) return;
      e.preventDefault();
      e.stopPropagation();
    };
    const click = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.(PANEL)) return;
      swallow(e);
      setPinned(chainOf(e.clientX, e.clientY));
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (pinnedRef.current) setPinned(null);
      else setOn(false);
    };
    const follow = () => redraw((n) => n + 1);
    const pressEvents = [
      "pointerdown",
      "mousedown",
      "pointerup",
      "mouseup",
      "dblclick",
      "submit",
    ];
    document.addEventListener("pointermove", move, true);
    document.addEventListener("click", click, true);
    for (const name of pressEvents)
      document.addEventListener(name, swallow, true);
    document.addEventListener("keydown", key, true);
    window.addEventListener("scroll", follow, true);
    window.addEventListener("resize", follow);
    return () => {
      document.removeEventListener("pointermove", move, true);
      document.removeEventListener("click", click, true);
      for (const name of pressEvents)
        document.removeEventListener(name, swallow, true);
      document.removeEventListener("keydown", key, true);
      window.removeEventListener("scroll", follow, true);
      window.removeEventListener("resize", follow);
    };
  }, [on, setOn]);

  // The hint's real height decides where it fits; measured after every change of content.
  useLayoutEffect(() => {
    setHintH(hint.current?.offsetHeight ?? 0);
  });
  // The product moves aside when the side opens or closes: the frame follows it.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pinned is the trigger
  useLayoutEffect(() => redraw((n) => n + 1), [pinned]);

  if (!on) return null;
  const wide = window.innerWidth >= WIDE;
  const framed = pinned ?? hover;
  const box = framed?.el.getBoundingClientRect();
  // The hint stands by the element: under it if it fits, else above it; by the pointer
  // for a tall element (a whole list, a screen). The mode's bar holds the bottom 60 px.
  const hb = hover?.el.getBoundingClientRect();
  const anchor =
    hb && hover && hb.height > window.innerHeight / 3
      ? { top: hover.y - 12, bottom: hover.y + 12, left: hover.x - 24 }
      : hb;
  const floor = window.innerHeight - 60;
  const hintTop = !anchor
    ? 0
    : anchor.bottom + 8 + hintH <= floor
      ? anchor.bottom + 8
      : anchor.top - 8 - hintH >= 8
        ? anchor.top - 8 - hintH
        : Math.max(8, floor - hintH);
  const right = pinned ? (wide ? SIDE_W : 0) : 0;
  const first = hover?.reqs[0];
  const showHint =
    hover && first && hover.el !== pinned?.el && hover.reqs.length > 0;

  return (
    <>
      <style>
        {`[data-req]:not(${PANEL} *) { outline: 1.5px dashed color-mix(in oklab, var(--color-primary) 70%, transparent); outline-offset: 2px; }`}
        {pinned && wide ? `body { margin-right: ${SIDE_W}px; }` : ""}
      </style>
      {box && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[85] rounded-md bg-primary/5 ring-2 ring-primary ring-offset-2 ring-offset-background"
          style={{
            left: box.left - 4,
            top: box.top - 4,
            width: box.width + 8,
            height: box.height + 8,
          }}
        />
      )}
      {showHint && anchor && (
        <div
          ref={hint}
          data-testid="docs-hint"
          aria-hidden="true"
          className="pointer-events-none fixed z-[90] w-[min(360px,calc(100vw-1rem))] space-y-1 rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-xl"
          style={{
            left: Math.max(
              8,
              Math.min(anchor.left, window.innerWidth - right - HINT_W - 8),
            ),
            top: hintTop,
          }}
        >
          <p className="flex items-baseline gap-2">
            <span className="shrink-0 rounded bg-muted px-1.5 font-mono text-xs whitespace-nowrap">
              {first.code}
            </span>
            <span className="min-w-0 truncate text-xs text-muted-foreground">
              {first.title}
            </span>
          </p>
          <p className="line-clamp-2">{plain(first.text)}</p>
          <p className="text-xs text-muted-foreground">
            {hover.reqs.length > 1 && `${t.more(hover.reqs.length - 1)} · `}
            {t.pinHint}
          </p>
        </div>
      )}
      {pinned && (
        <aside
          data-proto-panel
          data-testid="docs-card"
          aria-label={t.docsTitle}
          className="fixed inset-y-0 right-0 z-[90] flex w-[min(400px,100vw)] flex-col border-l bg-popover text-sm text-popover-foreground shadow-2xl"
        >
          <header className="flex items-center gap-2 border-b px-4 py-3">
            <BookOpen className="size-4 text-primary" />
            <h2 className="font-semibold">{t.docsTitle}</h2>
            <button
              type="button"
              aria-label={t.close}
              title={`${t.close} · Esc`}
              onClick={() => setPinned(null)}
              className="ml-auto rounded-md p-1.5 text-muted-foreground outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <X className="size-4" />
            </button>
          </header>
          <div className="flex-1 space-y-6 overflow-y-auto p-4 pb-20">
            {byDocument(pinned.reqs).map((g) => (
              <section key={g.title} className="space-y-3">
                <h3 className="font-semibold leading-snug">{g.title}</h3>
                {g.reqs.map((r) => (
                  <div key={r.to} className="space-y-2 rounded-lg border p-3">
                    <CopyButton
                      label={t.copyCode}
                      value={() => r.code}
                      className="-ml-0.5 bg-muted px-1.5 py-0.5 font-mono text-xs font-medium whitespace-nowrap"
                    >
                      {r.code}
                    </CopyButton>
                    <p className="leading-relaxed">{plain(r.text)}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <a
                        href={r.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-primary underline-offset-2 hover:underline"
                      >
                        {t.openInDocs} <ExternalLink className="size-3" />
                      </a>
                      <CopyButton
                        label={t.copyLink}
                        value={() => new URL(r.href, window.location.href).href}
                        className="px-1 py-0.5 text-muted-foreground"
                      >
                        {t.copyLink}
                      </CopyButton>
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </div>
        </aside>
      )}
      <div
        data-proto-panel
        className="fixed bottom-4 z-[90] flex -translate-x-1/2 items-center gap-2 rounded-full border bg-popover py-1.5 pr-1.5 pl-3 text-xs text-popover-foreground shadow-lg"
        style={{ left: `calc((100vw - ${right}px) / 2)` }}
      >
        <BookOpen className="size-3.5 text-primary" />
        <span className="whitespace-nowrap">{t.docsTitle}</span>
        <kbd className="rounded border bg-muted px-1 font-sans">Esc</kbd>
        <button
          type="button"
          aria-label={t.cancel}
          onClick={() => setOn(false)}
          className="rounded-full p-1 outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </>
  );
};
