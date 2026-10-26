import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

const DARK = "(prefers-color-scheme: dark)";

/** The theme actually painted: "system" resolved against the OS setting. */
export const resolveTheme = (theme: Theme): "light" | "dark" =>
  theme === "system" ? (matchMedia(DARK).matches ? "dark" : "light") : theme;

const paint = (theme: Theme) => {
  document.documentElement.dataset.theme = resolveTheme(theme);
};

/**
 * The colour theme, chosen in the panel («World»): a tester looks at both themes without
 * the product carrying a theme switch of its own. index.css keys dark tokens off `data-theme`.
 */
export const useTheme = create<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme) => {
        paint(theme);
        set({ theme });
      },
    }),
    {
      name: "proto-theme",
      onRehydrateStorage: () => (s) => s && paint(s.theme),
    },
  ),
);

/**
 * The theme painted on <html> right now, whoever set it — the panel, the OS, or a
 * screenshot switching themes. Parts that take a theme as a prop (the toaster) follow it.
 */
export const usePaintedTheme = (): "light" | "dark" =>
  useSyncExternalStore(
    (onChange) => {
      const observer = new MutationObserver(onChange);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
      return () => observer.disconnect();
    },
    () =>
      document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );

paint(useTheme.getState().theme);
matchMedia(DARK).addEventListener("change", () =>
  paint(useTheme.getState().theme),
);
window.addEventListener("storage", (e) => {
  if (e.key === "proto-theme") void useTheme.persist.rehydrate();
});
