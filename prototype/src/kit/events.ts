import { type Db, EVENTS } from "@/spec";
import { now } from "./clock";
import { accountOf, tokenFor, useSession } from "./session";
import type { ProtoCtx } from "./types";
import { useWorld } from "./world";

/**
 * What the server sees for a request with this token. `db` is read on every access,
 * so a resolver that calls `update` and then looks up what it created finds it.
 */
export const serverCtx = (token: string | null): ProtoCtx<Db> => ({
  get db() {
    return useWorld.getState().db;
  },
  me: accountOf(token),
  now: now(),
  update: (fn) => useWorld.getState().update(fn),
  send: (mail) => useWorld.getState().send(mail),
  tokenFor,
});

/** Runs an event of the spec as the person of this tab; returns the line the event reports. */
export const runEvent = (
  id: string,
  args?: Record<string, unknown>,
): string | undefined => {
  const event = EVENTS[id];
  if (!event) throw new Error(`proto: no event "${id}" in spec EVENTS`);
  return event.run(serverCtx(useSession.getState().token), args);
};
