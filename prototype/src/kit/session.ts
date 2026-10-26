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

const save = (token: string | null) => {
  sessionStorage.setItem(TAB, token ?? "");
  if (token) localStorage.setItem(LAST, token);
};

/**
 * The token of this tab. `setToken` is the product's own sign-in and sign-out: screens keep
 * their state through it, so a flow can sign in and go on. `switchTo` is the panel's
 * «People»: another person entirely, so `person` changes and the kit remounts the screens.
 */
export const useSession = create<{
  token: string | null;
  person: number;
  setToken: (token: string | null) => void;
  switchTo: (token: string | null) => void;
}>((set) => ({
  token: initial(),
  person: 0,
  setToken: (token) => {
    save(token);
    set({ token });
  },
  switchTo: (token) => {
    save(token);
    set((s) => ({ token, person: s.person + 1 }));
  },
}));

export const tokenFor = (accountId: string): string => `${PREFIX}${accountId}`;

export const accountOf = (token: string | null | undefined): string | null =>
  token?.startsWith(PREFIX) ? token.slice(PREFIX.length) : null;
