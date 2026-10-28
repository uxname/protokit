import { Link } from "@tanstack/react-router";
import type { FC, ReactNode } from "react";
import { APP_NAME } from "@/components/brand";

/** The product's frame: a header with the name and the account controls, then the page. */
export const AppShell: FC<{ actions?: ReactNode; children: ReactNode }> = ({
  actions,
  children,
}) => (
  <div className="flex min-h-dvh flex-col bg-background">
    <a
      href="#content"
      className="sr-only z-[60] rounded-md bg-background px-4 py-2 text-sm font-medium shadow-lg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >
      Skip to content
    </a>
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
      <Link
        to="/"
        className="flex items-center gap-2 rounded-md font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          L
        </span>
        {APP_NAME}
      </Link>
      <div className="flex items-center gap-2">{actions}</div>
    </header>
    <main
      id="content"
      tabIndex={-1}
      className="flex flex-1 flex-col outline-none"
    >
      {children}
    </main>
  </div>
);
