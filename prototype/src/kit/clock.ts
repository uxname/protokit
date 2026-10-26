import { useEffect, useMemo, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ClockStore {
  /** Added to the real time; the panel moves it forward. */
  offset: number;
  advance: (ms: number) => void;
  reset: () => void;
}

export const useClock = create<ClockStore>()(
  persist(
    (set) => ({
      offset: 0,
      advance: (ms) => set((s) => ({ offset: s.offset + ms })),
      reset: () => set({ offset: 0 }),
    }),
    { name: "proto-clock" },
  ),
);

/** Simulated time, ms. Rules and resolvers take time from here, never from Date.now(). */
export const now = (): number => Date.now() + useClock.getState().offset;

/**
 * Simulated time for rendering: re-renders when the panel moves the clock and every
 * `everyMs`, as a real app refreshes "5 min ago".
 */
export const useNow = (everyMs = 30_000): number => {
  const offset = useClock((s) => s.offset);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), everyMs);
    return () => window.clearInterval(t);
  }, [everyMs]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: tick is the re-render trigger
  return useMemo(() => Date.now() + offset, [offset, tick]);
};

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "proto-clock") void useClock.persist.rehydrate();
  });
}
