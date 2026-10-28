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

export type Ctx = ProtoCtx<Db>;
