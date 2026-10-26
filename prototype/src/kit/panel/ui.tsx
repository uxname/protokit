import type { FC, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { t } from "../i18n";

/** Small building blocks of the panel, so its four sections look alike. */
export const Section: FC<{
  title: string;
  hint?: string;
  children: ReactNode;
}> = ({ title, hint, children }) => (
  <section className="space-y-2">
    <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {title}
    </h3>
    {children}
    {hint && (
      <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
    )}
  </section>
);

export const Row: FC<{
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}> = ({ active, onClick, children, className }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50",
      active ? "border-primary bg-primary/5" : "border-transparent",
      className,
    )}
  >
    {children}
  </button>
);

export const Avatar: FC<{ name: string; muted?: boolean }> = ({
  name,
  muted,
}) => (
  <span
    aria-hidden="true"
    className={cn(
      "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
      muted
        ? "bg-muted text-muted-foreground"
        : "bg-primary text-primary-foreground",
    )}
  >
    {name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()}
  </span>
);

export const timeAgo = (at: number, now: number): string => {
  const min = Math.round((now - at) / 60_000);
  if (min < 1) return t.justNow;
  if (min < 60) return t.minAgo(min);
  if (min < 24 * 60) return t.hAgo(Math.round(min / 60));
  return new Date(at).toLocaleDateString(t.locale, {
    day: "numeric",
    month: "short",
  });
};
