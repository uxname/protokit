import { BookOpen, Monitor, Moon, Sun } from "lucide-react";
import { type FC, useState } from "react";
import { cn } from "@/lib/cn";
import { EVENTS } from "@/spec";
import { Button } from "@/ui/button";
import { useClock, useNow } from "../clock";
import { requirement } from "../docs";
import { runEvent } from "../events";
import { t } from "../i18n";
import { type Theme, useTheme } from "../theme";
import { useWorld } from "../world";
import { Section } from "./ui";

const H = 3_600_000;
const D = 24 * H;
const STEPS = [H, D, 7 * D, 30 * D, 182 * D];
const THEMES: { id: Theme; icon: typeof Sun }[] = [
  { id: "light", icon: Sun },
  { id: "dark", icon: Moon },
  { id: "system", icon: Monitor },
];

export const World: FC = () => {
  const offset = useClock((s) => s.offset);
  const time = useNow();
  const advance = useClock((s) => s.advance);
  const resetClock = useClock((s) => s.reset);
  const online = useWorld((s) => s.online);
  const setOnline = useWorld((s) => s.setOnline);
  const reset = useWorld((s) => s.reset);
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);
  const [result, setResult] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const events = Object.entries(EVENTS).filter(([, e]) => e.panel);

  return (
    <div className="space-y-5">
      <Section title={t.timeTitle} hint={t.timeHint}>
        <p className="text-sm">
          {t.nowIs}{" "}
          <span className="font-medium">
            {new Date(time).toLocaleString(t.locale, {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {STEPS.map((ms, i) => (
            <Button
              key={ms}
              size="xs"
              variant="outline"
              onClick={() => advance(ms)}
            >
              {t.steps[i]}
            </Button>
          ))}
          {offset > 0 && (
            <Button size="xs" variant="ghost" onClick={resetClock}>
              {t.backToPresent}
            </Button>
          )}
        </div>
      </Section>

      <Section title={t.networkTitle}>
        <label className="flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm">
          <span>{online ? t.online : t.offline}</span>
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={online}
            onChange={(e) => setOnline(e.target.checked)}
          />
        </label>
      </Section>

      {events.length > 0 && (
        <Section title={t.eventsTitle} hint={t.eventsHint}>
          <ul className="space-y-2">
            {events.map(([id, e]) => {
              const req = e.doc ? requirement(e.doc) : null;
              return (
                <li
                  key={id}
                  className="space-y-1.5 rounded-lg border p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{e.title}</span>
                    <Button
                      size="xs"
                      onClick={() =>
                        setResult((r) => ({
                          ...r,
                          [id]: runEvent(id) ?? t.done,
                        }))
                      }
                    >
                      {t.happened}
                    </Button>
                  </div>
                  {req && (
                    <a
                      href={req.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
                    >
                      <BookOpen className="size-3" /> {req.title}
                    </a>
                  )}
                  {result[id] && (
                    <p className="text-xs text-primary">{result[id]}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      <Section title={t.themeTitle}>
        <div className="grid grid-cols-3 gap-1 rounded-lg border p-1">
          {THEMES.map(({ id, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={theme === id}
              onClick={() => setTheme(id)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                theme === id
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" /> {t.themes[id]}
            </button>
          ))}
        </div>
      </Section>

      <Section title={t.resetTitle} hint={t.resetHint}>
        {confirming ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                reset();
                resetClock();
                setConfirming(false);
              }}
            >
              {t.resetConfirm}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirming(false)}
            >
              {t.cancel}
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setConfirming(true)}
          >
            {t.resetWorld}
          </Button>
        )}
      </Section>
    </div>
  );
};
