import { BookOpen, FlaskConical, X } from "lucide-react";
import {
  type FC,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/cn";
import { people } from "@/spec";
import { Button } from "@/ui/button";
import { t } from "../i18n";
import { accountOf, useSession } from "../session";
import { useWorld } from "../world";
import { DocsLayer, useDocsMode } from "./DocsLayer";
import { Inbox } from "./Inbox";
import { People } from "./People";
import { Requirements } from "./Requirements";
import { Avatar } from "./ui";
import { World } from "./World";

const TABS = ["people", "inbox", "world", "reqs"] as const;
type Tab = (typeof TABS)[number];

/**
 * Where the tester put the panel: the folded tab sticks to the left or right edge at a
 * share of the height, the open panel stands at its top-left corner (null — bottom left).
 * Kept per browser, so a reload does not bring it back over the product.
 */
interface Place {
  side: "left" | "right";
  y: number;
  panel: { x: number; y: number } | null;
}
const PLACE_KEY = "protokit-panel-place";
const loadPlace = (): Place => {
  const fallback: Place = { side: "left", y: 0.5, panel: null };
  try {
    return {
      ...fallback,
      ...JSON.parse(localStorage.getItem(PLACE_KEY) ?? "{}"),
    };
  } catch {
    return fallback;
  }
};
const clamp = (v: number, max: number) => Math.min(Math.max(v, 0), max);

/**
 * Drags by a handle with a mouse or a finger: `move` gets the pointer's shift since the
 * press, `end` whether it moved at all. A shift under 4 px is a press, not a drag.
 */
const drag = (
  e: ReactPointerEvent<HTMLElement>,
  move: (dx: number, dy: number) => void,
  end: (moved: boolean) => void,
) => {
  if (e.button !== 0) return;
  const handle = e.currentTarget;
  const [x0, y0] = [e.clientX, e.clientY];
  let moved = false;
  handle.setPointerCapture(e.pointerId);
  const onMove = (ev: PointerEvent) => {
    const [dx, dy] = [ev.clientX - x0, ev.clientY - y0];
    if (!moved && Math.hypot(dx, dy) < 4) return;
    moved = true;
    move(dx, dy);
  };
  const onUp = () => {
    handle.removeEventListener("pointermove", onMove);
    handle.removeEventListener("pointerup", onUp);
    handle.removeEventListener("pointercancel", onUp);
    end(moved);
  };
  handle.addEventListener("pointermove", onMove);
  handle.addEventListener("pointerup", onUp);
  handle.addEventListener("pointercancel", onUp);
};

/**
 * The prototype's own controls, outside the product: whose eyes this tab takes, the mail
 * the outside world delivered, the world itself (time, network, events, theme) and the
 * requirements behind the screen. Folded into a narrow tab on the left edge by default.
 * The same in every project: a project configures it through src/spec only.
 */
export const ProtoPanel: FC = () => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("people");
  const docsMode = useDocsMode((s) => s.on);
  const setDocsMode = useDocsMode((s) => s.set);
  const db = useWorld((s) => s.db);
  const unread = useWorld((s) => s.inbox.filter((m) => !m.read).length);
  const me = accountOf(useSession((s) => s.token));
  const name = people(db).find((p) => p.id === me)?.name ?? t.stranger;

  const [place, setPlace] = useState(loadPlace);
  // While dragged, the folded tab follows the pointer freely; on release it sticks to an edge.
  const [free, setFree] = useState<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const box = useRef<HTMLDivElement>(null);
  const keep = (next: Place) => {
    setPlace(next);
    localStorage.setItem(PLACE_KEY, JSON.stringify(next));
  };
  // A smaller window must not hide the panel: positions are clamped on every render.
  const [, redraw] = useState(0);
  useEffect(() => {
    const follow = () => redraw((n) => n + 1);
    window.addEventListener("resize", follow);
    return () => window.removeEventListener("resize", follow);
  }, []);

  const dragTab = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const tab = e.currentTarget;
    const r = tab.getBoundingClientRect();
    dragged.current = false;
    drag(
      e,
      (dx, dy) => setFree({ x: r.left + dx, y: r.top + dy }),
      (moved) => {
        dragged.current = moved;
        if (!moved) return;
        const at = tab.getBoundingClientRect();
        setFree(null);
        keep({
          ...place,
          side:
            at.left + at.width / 2 < window.innerWidth / 2 ? "left" : "right",
          y: clamp((at.top + at.height / 2) / window.innerHeight, 1),
        });
      },
    );
  };
  const dragPanel = (e: ReactPointerEvent<HTMLElement>) => {
    // The header's buttons stay buttons.
    if ((e.target as Element).closest("button") || !box.current) return;
    const r = box.current.getBoundingClientRect();
    let to = { x: r.left, y: r.top };
    drag(
      e,
      (dx, dy) => {
        to = { x: r.left + dx, y: r.top + dy };
        setPlace((p) => ({ ...p, panel: to }));
      },
      (moved) => moved && keep({ ...place, panel: to }),
    );
  };

  const size = box.current?.getBoundingClientRect();
  const panelAt = place.panel && {
    left: clamp(place.panel.x, window.innerWidth - (size?.width ?? 0)),
    top: clamp(place.panel.y, window.innerHeight - (size?.height ?? 0)),
  };
  const tabAt = free
    ? { left: free.x, top: free.y }
    : {
        [place.side]: 0,
        top: `clamp(2.5rem, ${place.y * 100}%, calc(100% - 2.5rem))`,
        transform: "translateY(-50%)",
      };

  return (
    <>
      <DocsLayer />
      <div
        data-proto-panel
        ref={box}
        className={cn(
          "fixed z-[80] font-sans",
          open && !panelAt && "bottom-4 left-4",
        )}
        style={open ? (panelAt ?? undefined) : tabAt}
      >
        {open ? (
          <div
            role="dialog"
            aria-label={t.panel}
            className="flex max-h-[min(640px,calc(100dvh-2rem))] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-2xl"
          >
            {/* The header is the handle: the panel goes wherever it is out of the way. */}
            <header
              onPointerDown={dragPanel}
              className="flex cursor-grab touch-none items-center justify-between gap-2 border-b py-2 pr-2 pl-4 select-none active:cursor-grabbing"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <FlaskConical className="size-4 text-primary" /> {t.panelTitle}
              </span>
              <span className="flex items-center gap-1">
                <Button
                  size="icon-sm"
                  variant={docsMode ? "secondary" : "ghost"}
                  aria-label={t.docsMode}
                  aria-pressed={docsMode}
                  title={t.docsMode}
                  onClick={() => setDocsMode(!docsMode)}
                >
                  <BookOpen />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={t.fold}
                  onClick={() => setOpen(false)}
                >
                  <X />
                </Button>
              </span>
            </header>
            <nav
              className="grid grid-cols-4 gap-1 border-b p-1.5"
              aria-label={t.sections}
            >
              {TABS.map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={tab === id}
                  onClick={() => setTab(id)}
                  className={cn(
                    "relative rounded-md px-1 py-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    tab === id
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.tabs[id]}
                  {id === "inbox" && unread > 0 && (
                    <span className="absolute -top-0.5 right-0.5 min-w-4 rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground">
                      {unread}
                    </span>
                  )}
                </button>
              ))}
            </nav>
            <div className="flex-1 overflow-y-auto p-4">
              {tab === "people" && <People />}
              {tab === "inbox" && <Inbox />}
              {tab === "world" && <World />}
              {tab === "reqs" && <Requirements />}
            </div>
          </div>
        ) : (
          // Folded: a narrow tab on an edge, mid-height by default, clear of headers, composers
          // and tab bars; dragged, it moves along the height and to the other edge.
          <button
            type="button"
            data-testid="proto-panel-open"
            onPointerDown={dragTab}
            onClick={() => {
              // The release of a drag is not a press.
              if (dragged.current) dragged.current = false;
              else setOpen(true);
            }}
            title={t.openPanel(name)}
            className={cn(
              "flex cursor-grab touch-none flex-col items-center gap-1 border bg-popover py-2 pr-1.5 pl-1 shadow-lg transition-colors outline-none select-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 active:cursor-grabbing",
              free
                ? "rounded-xl"
                : place.side === "left"
                  ? "rounded-r-xl border-l-0"
                  : "rounded-l-xl border-r-0",
            )}
          >
            <Avatar name={me ? name : "?"} muted={!me} />
            <span className="sr-only">{t.openPanel(name)}</span>
            {unread > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-[10px] leading-4 text-primary-foreground">
                {unread}
                <span className="sr-only"> {t.newMail}</span>
              </span>
            )}
          </button>
        )}
      </div>
    </>
  );
};
