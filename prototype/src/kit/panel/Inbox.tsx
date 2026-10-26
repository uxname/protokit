import { Copy, Inbox as InboxIcon } from "lucide-react";
import { type FC, useEffect, useState } from "react";
import { Button } from "@/ui/button";
import { now } from "../clock";
import { runEvent } from "../events";
import { t } from "../i18n";
import { useWorld } from "../world";
import { Section, timeAgo } from "./ui";

export const Inbox: FC = () => {
  const inbox = useWorld((s) => s.inbox);
  const markRead = useWorld((s) => s.markRead);
  const [notes, setNotes] = useState<Record<string, string>>({});

  // Opening the section reads the letters, as opening a mailbox would.
  useEffect(() => {
    for (const m of inbox) if (!m.read) markRead(m.id);
  }, [inbox, markRead]);

  if (inbox.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
        <InboxIcon className="size-6" />
        {t.inboxEmpty}
      </div>
    );
  }

  return (
    <Section title={t.mailTitle}>
      <ul className="space-y-2">
        {inbox.map((m) => (
          <li key={m.id} className="space-y-2 rounded-lg border p-3 text-sm">
            <div className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
              <span className="truncate">{t.to(m.to)}</span>
              <span className="shrink-0">{timeAgo(m.at, now())}</span>
            </div>
            <p className="font-medium">{m.subject}</p>
            <p className="text-muted-foreground">{m.body}</p>
            {m.code && (
              <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                <span className="font-mono text-lg tracking-[0.3em]">
                  {m.code}
                </span>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={t.copyCode}
                  onClick={() =>
                    void navigator.clipboard?.writeText(m.code ?? "")
                  }
                >
                  <Copy />
                </Button>
              </div>
            )}
            {m.actions && m.actions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {m.actions.map((a) => (
                  <Button
                    key={a.label}
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setNotes((n) => ({
                        ...n,
                        [m.id]: runEvent(a.event, a.args) ?? t.done,
                      }))
                    }
                  >
                    {a.label}
                  </Button>
                ))}
              </div>
            )}
            {notes[m.id] && (
              <p className="text-xs text-primary">{notes[m.id]}</p>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
};
