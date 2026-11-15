import { Link } from "@tanstack/react-router";
import type { FC, ReactNode } from "react";
import { APP_NAME } from "@/components/brand";
import { t } from "@/kit";

/**
 * The product's frame: a header with the name and, in a product with sign-in, the account
 * controls (`actions`; a product without sign-in passes none), then the page.
 */
export const AppShell: FC<{ actions?: ReactNode; children: ReactNode }> = ({
  actions,
  children,
}) => (
  <div className="flex min-h-dvh flex-col bg-background">
    {/* A button, not href="#content": with hash routing that link would change the route. */}
    <button
      type="button"
      onClick={() => document.getElementById("content")?.focus()}
      className="sr-only z-[60] rounded-md bg-background text-sm font-medium text-foreground shadow-lg outline-none focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:min-h-9 focus:px-4 focus:py-2 focus-visible:ring-[3px] focus-visible:ring-ring"
    >
      {t.skipToContent}
    </button>
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
      <Link
        to="/"
        className="flex items-center gap-2 rounded-md font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          {APP_NAME[0]}
        </span>
        {APP_NAME}
      </Link>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
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
