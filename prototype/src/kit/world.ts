import { useRef } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Db, seed } from "@/spec";
import { now } from "./clock";
import type { Mail } from "./types";

interface WorldStore {
  db: Db;
  online: boolean;
  inbox: Mail[];
  update: (fn: (db: Db) => void) => void;
  send: (mail: Omit<Mail, "id" | "at" | "read">) => void;
  markRead: (id: string) => void;
  setOnline: (online: boolean) => void;
  reset: () => void;
}

const id = () => Math.random().toString(36).slice(2, 10);

/**
 * One simulated server and the outside world, shared by every tab through localStorage.
 * Every change makes a new `db` object; the GraphQL client is rebuilt on it, so queries refetch.
 */
export const useWorld = create<WorldStore>()(
  persist(
    (set) => ({
      db: seed(),
      online: true,
      inbox: [],
      update: (fn) =>
        set((s) => {
          const db = structuredClone(s.db);
          fn(db);
          return { db };
        }),
      send: (mail) =>
        set((s) => ({
          inbox: [{ ...mail, id: id(), at: now(), read: false }, ...s.inbox],
        })),
      markRead: (mailId) =>
        set((s) => ({
          inbox: s.inbox.map((m) =>
            m.id === mailId ? { ...m, read: true } : m,
          ),
        })),
      setOnline: (online) => set({ online }),
      reset: () => set({ db: seed(), online: true, inbox: [] }),
    }),
    { name: "proto-world" },
  ),
);

// Another tab changed the world: take its copy, so a message sent there shows up here.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "proto-world") void useWorld.persist.rehydrate();
  });
}

/**
 * The world as the network lets this tab see it: changes arrive while online; while
 * offline the last copy stays, so what the screen already loaded stays on it, as in a
 * real app. The GraphQL client is rebuilt on this value.
 */
export const useSyncedDb = (): Db => {
  const db = useWorld((s) => s.db);
  const online = useWorld((s) => s.online);
  const seen = useRef(db);
  if (online) seen.current = db;
  return seen.current;
};
