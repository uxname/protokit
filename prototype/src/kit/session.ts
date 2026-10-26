import { create } from "zustand";

const TAB = "proto-token";
const LAST = "proto-last-token";
const PREFIX = "proto.";

/** The token of this tab: "" in sessionStorage means signed out on purpose. A new tab starts as the last person picked. */
const initial = (): string | null => {
  if (typeof window === "undefined") return null;
  const own = sessionStorage.getItem(TAB);
  return own !== null ? own || null : localStorage.getItem(LAST);
};

export const useSession = create<{
  token: string | null;
  setToken: (token: string | null) => void;
}>((set) => ({
  token: initial(),
  setToken: (token) => {
    sessionStorage.setItem(TAB, token ?? "");
    if (token) localStorage.setItem(LAST, token);
    set({ token });
  },
}));

export const tokenFor = (accountId: string): string => `${PREFIX}${accountId}`;

export const accountOf = (token: string | null | undefined): string | null =>
  token?.startsWith(PREFIX) ? token.slice(PREFIX.length) : null;
