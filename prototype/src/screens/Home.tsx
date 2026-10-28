// docc: auth#^p3xm@mvg9, auth#^mpv2@nmae ~4ezy
import { Link } from "@tanstack/react-router";
import { LogIn, LogOut } from "lucide-react";
import type { FC } from "react";
import { useQuery } from "urql";
import { AppShell } from "@/components/AppShell";
import { MeDocument } from "@/generated/graphql";
import { Req, useSession } from "@/kit";
import { Button } from "@/ui/button";

/** The template's home page: a placeholder a product replaces, with the header's account controls. */
export const Home: FC = () => {
  const token = useSession((s) => s.token);
  const setToken = useSession((s) => s.setToken);
  const [{ data }] = useQuery({ query: MeDocument, pause: !token });
  const me = token ? data?.me : null;

  const actions = me ? (
    <>
      <span className="text-sm text-muted-foreground">{me.email}</span>
      <Req to="auth#^mpv2">
        <Button variant="outline" size="sm" onClick={() => setToken(null)}>
          <LogOut /> Logout
        </Button>
      </Req>
    </>
  ) : (
    <Req to="auth#^p3xm">
      <Button size="sm" asChild>
        <Link to="/sign-in">
          <LogIn /> Sign In
        </Link>
      </Button>
    </Req>
  );

  return (
    <AppShell actions={actions}>
      <div className="mx-auto flex max-w-2xl flex-1 flex-col justify-center gap-3 px-6 py-20 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          {me ? `Welcome, ${me.name}` : "Welcome"}
        </h1>
        <p className="text-muted-foreground">
          The home page of the template. A product made from it puts its own
          first screen here.
        </p>
      </div>
    </AppShell>
  );
};
