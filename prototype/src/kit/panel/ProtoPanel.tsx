import { BookOpen, FlaskConical, X } from "lucide-react";
import { type FC, useState } from "react";
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

  return (
    <>
      <DocsLayer />
      <div
        data-proto-panel
        className={cn(
          "fixed z-[80] font-sans",
          open ? "bottom-4 left-4" : "top-1/2 left-0 -translate-y-1/2",
        )}
      >
        {open ? (
          <div
            role="dialog"
            aria-label={t.panel}
            className="flex max-h-[min(640px,calc(100dvh-2rem))] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-2xl"
          >
            <header className="flex items-center justify-between gap-2 border-b py-2 pr-2 pl-4">
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
          // Folded: a narrow tab on the left edge, mid-height, clear of headers, composers and tab bars.
          <button
            type="button"
            data-testid="proto-panel-open"
            onClick={() => setOpen(true)}
            title={t.openPanel(name)}
            className="flex flex-col items-center gap-1 rounded-r-xl border border-l-0 bg-popover py-2 pr-1.5 pl-1 shadow-lg transition-colors outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
