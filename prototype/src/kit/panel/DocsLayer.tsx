import { BookOpen, ExternalLink, X } from "lucide-react";
import { type FC, useEffect, useLayoutEffect, useRef, useState } from "react";
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

const CARD_W = 320;

/**
 * While documentation mode is on: every element the documents describe is outlined; the
 * one under the pointer is framed and a card shows its paragraph with a link to the
 * documents. A click pins the card instead of pressing the element; Esc leaves the mode.
 */
export const DocsLayer: FC = () => {
  const on = useDocsMode((s) => s.on);
  const setOn = useDocsMode((s) => s.set);
  const [hover, setHover] = useState<ReturnType<typeof chainOf>>(null);
  const [pinned, setPinned] = useState<ReturnType<typeof chainOf>>(null);
  const [, redraw] = useState(0);
  const card = useRef<HTMLDivElement>(null);
  const [cardH, setCardH] = useState(0);

  useEffect(() => {
    if (!on) {
      setHover(null);
      setPinned(null);
      return;
    }
    const move = (e: PointerEvent) => {
      // Over the card the frame stays where it was, so its link can be reached.
      if ((e.target as Element | null)?.closest?.(PANEL)) return;
      setHover(chainOf(e.clientX, e.clientY));
    };
    // The product must not react while the tester reads it: presses go to the card instead.
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
      if (e.key === "Escape") setOn(false);
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

  // The card's real height decides where it fits; measured after every change of content.
  useLayoutEffect(() => {
    setCardH(card.current?.offsetHeight ?? 0);
  });

  if (!on) return null;
  const shown = pinned ?? hover;
  const box = shown?.el.getBoundingClientRect();
  // A tall element (a whole list, a screen) would push the card off it or under it: the
  // card stands by the pointer instead. Then under the anchor if the card fits, else
  // above it, else as low as the screen allows; the mode's bar holds the bottom 60 px.
  const anchor =
    box && shown && box.height > window.innerHeight / 3
      ? { top: shown.y - 12, bottom: shown.y + 12, left: shown.x - 24 }
      : box;
  const floor = window.innerHeight - 60;
  const top = !anchor
    ? 0
    : anchor.bottom + 8 + cardH <= floor
      ? anchor.bottom + 8
      : anchor.top - 8 - cardH >= 8
        ? anchor.top - 8 - cardH
        : Math.max(8, floor - cardH);

  return (
    <>
      <style>
        {`[data-req]:not(${PANEL} *) { outline: 1.5px dashed color-mix(in oklab, var(--color-primary) 70%, transparent); outline-offset: 2px; }`}
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
      {shown && box && (
        <div
          data-proto-panel
          ref={card}
          data-testid="docs-card"
          role="dialog"
          aria-label={t.docsMode}
          className="fixed z-[90] max-h-[calc(100dvh-68px)] w-[min(320px,calc(100vw-1rem))] space-y-3 overflow-y-auto rounded-xl border bg-popover p-4 text-sm text-popover-foreground shadow-2xl"
          style={{
            left: Math.max(
              8,
              Math.min(anchor?.left ?? 0, window.innerWidth - CARD_W - 8),
            ),
            top,
          }}
        >
          {shown.reqs.map((r, i) => (
            <div key={r.to} className={i > 0 ? "border-t pt-3" : undefined}>
              <p
                className={`flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase ${pinned && i === 0 ? "pr-6" : ""}`}
              >
                <BookOpen className="size-3.5" /> {r.title}
                <span className="ml-auto font-mono tracking-normal">
                  {r.code}
                </span>
              </p>
              {/* Hovering previews; a pinned card reads in full. */}
              <p
                className={
                  i > 0
                    ? "mt-1 line-clamp-2 text-muted-foreground"
                    : pinned
                      ? "mt-1.5"
                      : "mt-1.5 line-clamp-5"
                }
              >
                {r.text.replace(/\*\*/g, "")}
              </p>
              <a
                href={r.href}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
              >
                {t.openInDocs} <ExternalLink className="size-3" />
              </a>
            </div>
          ))}
          {!pinned && (
            <p className="text-xs text-muted-foreground">{t.pinHint}</p>
          )}
          {pinned && (
            <button
              type="button"
              aria-label={t.cancel}
              onClick={() => setPinned(null)}
              className="absolute top-2 right-2 rounded-md p-1 text-muted-foreground outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}
      <div
        data-proto-panel
        className="fixed bottom-4 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-2 rounded-full border bg-popover py-1.5 pr-1.5 pl-3 text-xs text-popover-foreground shadow-lg"
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
