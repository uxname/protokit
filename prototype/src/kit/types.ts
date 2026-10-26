/** A letter or SMS the outside world delivers to a person; the panel shows it under «Входящие». */
export interface Mail {
  id: string;
  /** Account id, e-mail or phone of the recipient, as the product addresses them. */
  to: string;
  subject: string;
  body: string;
  /** A one-time code, shown large with a copy button. */
  code?: string;
  /** Buttons for what a person does outside the product, e.g. «Подтвердить почту»: run an event of the spec. */
  actions?: { label: string; event: string; args?: Record<string, unknown> }[];
  at: number;
  read: boolean;
}

/** What a resolver or an event sees: the world, who asks, and the simulated time. */
export interface ProtoCtx<Db> {
  /** The world as it is now: after `update` it already holds the change. */
  db: Db;
  /** Account id behind the request's token, or null without sign-in. */
  me: string | null;
  /** Simulated time, ms: use it instead of Date.now(). */
  now: number;
  update: (fn: (db: Db) => void) => void;
  send: (mail: Omit<Mail, "id" | "at" | "read">) => void;
  /** The token a successful sign-in returns for this account. */
  tokenFor: (accountId: string) => string;
}

/** Something that happens outside the product: a server event, an approval, a letter. */
export interface ProtoEvent<Db> {
  title: string;
  /** Shown in the panel's «Мир» section; false for events only letters trigger. */
  panel: boolean;
  /** docc target the event implements, for the panel's link. */
  doc?: string;
  /** Returns a line the panel shows after the event ran. */
  run: (
    ctx: ProtoCtx<Db>,
    args?: Record<string, unknown>,
  ) => string | undefined;
}

/** A row of the panel's «Люди»: someone whose eyes a tab can take. */
export interface Person {
  id: string;
  name: string;
  /**
   * Who they are and what they know or hold, e.g. «владелец · anna@mail.ru / пароль sun-river-42»;
   * a line break per item: a recovery sheet or a key fits here in full.
   */
  note: string;
}
