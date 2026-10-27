import type { ProtoCtx } from "@/kit";

// docc:begin auth#^pjds@fz63, auth#^jmgu@qaw6 ~ktvw
export interface Account {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}
// docc:end

// docc:begin chat#^send@9buh, chat#^rbtf@j5xa ~huua
export interface Message {
  id: string;
  from: string;
  to: string;
  text: string;
  at: number;
  read: boolean;
}
// docc:end

// docc:begin auth#^dnrs@z38x ~rndm
/** A sign-up waiting for the code from the letter. */
export interface PendingSignUp {
  name: string;
  email: string;
  passwordHash: string;
  code: string;
}
// docc:end

/** Everything the simulated server holds. */
export interface Db {
  accounts: Account[];
  messages: Message[];
  pending: PendingSignUp[];
}

export type Ctx = ProtoCtx<Db>;
