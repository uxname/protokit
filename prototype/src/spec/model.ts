// docc-none: the shape of the simulated server's data; the rules that use it carry the tags
import type { ProtoCtx } from "@/kit";

export interface Account {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

/** Everything the simulated server holds. */
export interface Db {
  accounts: Account[];
}

/**
 * The shape of `Db`. A field added, renamed or retyped → raise it: a world a browser saved
 * by the older shape is replaced by a fresh `seed()` instead of breaking screens.
 */
export const DB_VERSION = 0;

export type Ctx = ProtoCtx<Db>;
