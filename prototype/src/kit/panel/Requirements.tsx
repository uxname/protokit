import { BookOpen, ChevronRight } from "lucide-react";
import type { FC } from "react";
import { NOT_SHOWN } from "@/spec";
import { docsHome, requirement } from "../docs";
import { t } from "../i18n";
import { useDocsMode } from "./DocsLayer";
import { Section } from "./ui";
import { useScreenReqs } from "./useScreenReqs";

const plain = (text: string) => text.replace(/\*\*/g, "");

export const Requirements: FC = () => {
  const targets = useScreenReqs();
  const reqs = targets.map(requirement).filter((r) => r !== null);
  const docsMode = useDocsMode((s) => s.on);
  const setDocsMode = useDocsMode((s) => s.set);

  return (
    <div className="space-y-5">
      <Section title={t.docsTitle} hint={t.docsModeHint}>
        <label className="flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm">
          <span className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" /> {t.docsMode}
          </span>
          <input
            type="checkbox"
            role="switch"
            aria-checked={docsMode}
            className="size-4 accent-primary"
            checked={docsMode}
            onChange={(e) => setDocsMode(e.target.checked)}
          />
        </label>
      </Section>

      <Section title={t.onScreen}>
        {reqs.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.noReqs}</p>
        ) : (
          <ul className="space-y-2">
            {reqs.map((r) => (
              <li key={r.to} className="rounded-lg border p-3 text-sm">
                <a
                  href={r.href}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline-offset-2 hover:underline"
                >
                  {r.title}
                </a>
                <p className="mt-1 line-clamp-3 text-muted-foreground">
                  {plain(r.text)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <details className="group space-y-2">
        <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
          <ChevronRight className="size-3.5 transition-transform group-open:rotate-90" />
          {t.notShownTitle} · {NOT_SHOWN.length}
        </summary>
        <p className="text-xs text-muted-foreground">{t.notShownHint}</p>
        {NOT_SHOWN.length === 0 ? (
          <p className="text-sm">{t.allShown}</p>
        ) : (
          <ul className="space-y-2">
            {NOT_SHOWN.map((n) => {
              const r = requirement(n.to);
              return (
                <li
                  key={n.to}
                  className="space-y-1 rounded-lg border p-3 text-sm"
                >
                  {r ? (
                    <a
                      href={r.href}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {r.title}: {plain(r.text).slice(0, 120)}
                    </a>
                  ) : (
                    <span className="font-medium text-destructive">
                      {n.to} — {t.noSuchParagraph}
                    </span>
                  )}
                  <p className="text-muted-foreground">{n.why}</p>
                </li>
              );
            })}
          </ul>
        )}
      </details>

      <a
        href={docsHome}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-sm underline-offset-2 hover:underline"
      >
        <BookOpen className="size-4" /> {t.allDocs}
      </a>
    </div>
  );
};
