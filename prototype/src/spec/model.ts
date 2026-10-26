import type { ProtoCtx } from "@/kit";

// docc:begin auth#^sign-in, auth#^password-hash
export interface Account {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}
// docc:end

// docc:begin chat#^send, chat#^dialogs
export interface Message {
  id: string;
  from: string;
  to: string;
  text: string;
  at: number;
  read: boolean;
}
// docc:end

// docc:begin auth#^sign-up
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
