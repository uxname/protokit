import {
  type ErrorComponentProps,
  HeadContent,
  Outlet,
} from "@tanstack/react-router";
import { RotateCw, TriangleAlert } from "lucide-react";
import { type FC, Fragment, useMemo } from "react";
import { Client, cacheExchange, fetchExchange, Provider } from "urql";
import { Button } from "@/ui/button";
import { Toaster } from "@/ui/sonner";
import { TooltipProvider } from "@/ui/tooltip";
import { t } from "./i18n";
import { protoFetch } from "./mock-fetch";
import { ProtoPanel } from "./panel/ProtoPanel";
import { useSession } from "./session";
import { usePaintedTheme } from "./theme";
import { useSyncedDb } from "./world";

/** A urql client that talks to the simulated server with this tab's token. */
const createClient = (token: string | null) =>
  new Client({
    url: "/graphql",
    exchanges: [cacheExchange, fetchExchange],
    fetch: protoFetch,
    preferGetMethod: false,
    requestPolicy: "cache-and-network",
    fetchOptions: () =>
      token ? { headers: { Authorization: `Bearer ${token}` } } : {},
  });

/**
 * The root of every prototype: the product (the routes) with the GraphQL client of this
 * tab, the toaster and the panel. A new client on every change of the world makes every
 * query refetch (not while offline: then the loaded data stays on screen). Another person
 * in «People» remounts the screens, so nothing of the previous person's screen survives;
 * the product's own sign-in keeps them, so a flow can sign in and carry on.
 */
export const ProtoApp: FC = () => {
  const token = useSession((s) => s.token);
  const person = useSession((s) => s.person);
  const db = useSyncedDb();
  const theme = usePaintedTheme();
  // biome-ignore lint/correctness/useExhaustiveDependencies: db is the refetch trigger
  const client = useMemo(() => createClient(token), [token, db]);

  return (
    <Provider value={client}>
      <TooltipProvider>
        <HeadContent />
        <Fragment key={person}>
          <Outlet />
        </Fragment>
        <Toaster closeButton theme={theme} />
        <ProtoPanel />
      </TooltipProvider>
    </Provider>
  );
};

/** What a crash looks like: the product's quiet error screen, not a stack trace. */
export const Crash = ({ error }: ErrorComponentProps) => {
  console.error(error);
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-muted px-6 text-center">
      <TriangleAlert
        className="size-10 text-muted-foreground"
        aria-hidden="true"
      />
      <h1 className="text-xl font-semibold">{t.crashTitle}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{t.crashText}</p>
      <Button className="mt-2" onClick={() => window.location.reload()}>
        <RotateCw /> {t.reload}
      </Button>
    </div>
  );
};
