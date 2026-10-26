import { Navigate } from "@tanstack/react-router";
import { type FC, type ReactNode, useEffect } from "react";
import { useQuery } from "urql";
import { MeDocument } from "@/generated/graphql";
import { useSession } from "@/kit";

/** Shows its children to a signed-in person only; anyone else goes to the sign-in screen. */
export const RequireSignIn: FC<{ children: ReactNode }> = ({ children }) => {
  const token = useSession((s) => s.token);
  const setToken = useSession((s) => s.setToken);
  const [{ data, fetching, error }] = useQuery({
    query: MeDocument,
    pause: !token,
  });
  const gone =
    Boolean(token) &&
    !fetching &&
    !error &&
    data !== undefined &&
    data.me === null;

  // The account behind the token no longer exists (the world was reset): sign out.
  useEffect(() => {
    if (gone) setToken(null);
  }, [gone, setToken]);

  if (!token || gone) return <Navigate to="/sign-in" replace />;
  return <>{children}</>;
};
