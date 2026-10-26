import { Link } from "@tanstack/react-router";
import { MessagesSquare } from "lucide-react";
import type { FC, ReactNode } from "react";
import { UserMenu } from "@/components/session";
import { cn } from "@/lib/cn";

/**
 * The frame of the signed-in product: a top bar and, from `md` up, the list of dialogs on
 * the left. On a phone the page owns the whole screen (the list or one dialog).
 */
export const AppShell: FC<{
  aside?: ReactNode;
  children: ReactNode;
  hideBarOnMobile?: boolean;
}> = ({ aside, children, hideBarOnMobile }) => (
  <div className="flex h-dvh flex-col bg-background">
    <a
      href="#content"
      className="sr-only z-[60] rounded-md bg-background px-4 py-2 text-sm font-medium shadow-lg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >
      Skip to content
    </a>
    <header
      className={cn(
        "h-14 shrink-0 items-center justify-between border-b px-4",
        hideBarOnMobile ? "hidden md:flex" : "flex",
      )}
    >
      <Link
        to="/"
        className="flex items-center gap-2 rounded-md font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <MessagesSquare className="size-4" />
        </span>
        Family chat
      </Link>
      <div className="flex items-center gap-1">
        <UserMenu />
      </div>
    </header>
    <div className="flex min-h-0 flex-1">
      {aside && (
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-r md:block">
          {aside}
        </aside>
      )}
      <main
        id="content"
        tabIndex={-1}
        className="flex min-h-0 min-w-0 flex-1 flex-col outline-none"
      >
        {children}
      </main>
    </div>
  </div>
);
