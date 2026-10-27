// docc-none: the page for a wrong address, which every product has; the documents do not describe it
import { Link } from "@tanstack/react-router";
import { SearchX } from "lucide-react";
import type { FC } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/ui/button";

/** A quiet dead end in the product's own voice, with one way back. */
export const NotFound: FC = () => (
  <AppShell>
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <SearchX className="size-10 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-xl font-semibold">This page doesn't exist</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The link may be out of date.
      </p>
      <Button asChild className="mt-2">
        <Link to="/">To conversations</Link>
      </Button>
    </div>
  </AppShell>
);
