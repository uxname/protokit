// docc-none: the page for a wrong address, a placeholder of the template; the documents do not describe it
import { Link } from "@tanstack/react-router";
import { SearchX } from "lucide-react";
import type { FC } from "react";
import { AppShell } from "@/components/AppShell";
import { t } from "@/kit";
import { Button } from "@/ui/button";

/** A quiet dead end with one way back, in the documents' language; a product may say it in its own voice. */
export const NotFound: FC = () => (
  <AppShell>
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <SearchX className="size-10 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-xl font-semibold">{t.notFoundTitle}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{t.notFoundText}</p>
      <Button asChild className="mt-2">
        <Link to="/">{t.backHome}</Link>
      </Button>
    </div>
  </AppShell>
);
