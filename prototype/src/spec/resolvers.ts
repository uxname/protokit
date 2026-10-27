import type { Ctx, Db } from "./model";
import {
  CODE_LENGTH,
  hashPassword,
  newCode,
  PASSWORD_MIN_LENGTH,
  WRONG_PASSWORD,
} from "./rules";

type Args = Record<string, string>;

const signedIn = ({ db, me }: Ctx) => {
  const account = db.accounts.find((a) => a.id === me);
  if (!account) throw new Error("Sign in to continue.");
  return account;
};

const between = (db: Db, a: string, b: string) =>
  db.messages
    .filter((m) => (m.from === a && m.to === b) || (m.from === b && m.to === a))
    .sort((x, y) => x.at - y.at);

const normal = (email: string) => email.trim().toLowerCase();

/** Root resolvers for schema.graphql; graphql-js calls each with (args, context). */
export const resolvers = {
  me: (_: Args, { db, me }: Ctx) => {
    const a = db.accounts.find((x) => x.id === me);
    return a ? { id: a.id, name: a.name, email: a.email } : null;
  },

  person: ({ id }: Args, { db }: Ctx) => {
    const a = db.accounts.find((x) => x.id === id);
    return a ? { id: a.id, name: a.name, email: a.email } : null;
  },

  // docc:begin chat#^rbtf@j5xa ~egve
  dialogs: (_: Args, ctx: Ctx) => {
    const me = signedIn(ctx);
    return ctx.db.accounts
      .filter((a) => a.id !== me.id)
      .map((a) => {
        const thread = between(ctx.db, me.id, a.id);
        const last = thread[thread.length - 1];
        return {
          id: a.id,
          name: a.name,
          lastText: last?.text ?? null,
          lastMine: last?.from === me.id,
          lastAt: last?.at ?? null,
          unread: thread.filter((m) => m.to === me.id && !m.read).length,
        };
      })
      .sort((x, y) => (y.lastAt ?? 0) - (x.lastAt ?? 0));
  },
  // docc:end

  messages: ({ with: other }: Args, ctx: Ctx) => {
    const me = signedIn(ctx);
    return between(ctx.db, me.id, other).map((m) => ({
      id: m.id,
      text: m.text,
      at: m.at,
      mine: m.from === me.id,
    }));
  },

  // docc:begin auth#^pjds@fz63, auth#^ayqz@uasp ~kgwj
  signIn: ({ email, password }: Args, { db, tokenFor }: Ctx) => {
    const a = db.accounts.find((x) => x.email === normal(email));
    if (!a || a.passwordHash !== hashPassword(password))
      throw new Error(WRONG_PASSWORD);
    return tokenFor(a.id);
  },
  // docc:end

  // docc:begin auth#^dnrs@z38x ~ybvg
  startSignUp: ({ name, email, password }: Args, { db, update, send }: Ctx) => {
    const address = normal(email);
    if (!name.trim()) throw new Error("Enter your name.");
    if (password.length < PASSWORD_MIN_LENGTH)
      throw new Error(
        `The password needs at least ${PASSWORD_MIN_LENGTH} characters.`,
      );
    if (db.accounts.some((a) => a.email === address))
      throw new Error("This email already has an account. Sign in instead.");
    const code = newCode();
    update((d) => {
      d.pending = d.pending.filter((p) => p.email !== address);
      d.pending.push({
        name: name.trim(),
        email: address,
        passwordHash: hashPassword(password),
        code,
      });
    });
    send({
      to: address,
      subject: "Your Family chat code",
      body: `Enter this ${CODE_LENGTH}-digit code in the app to finish signing up.`,
      code,
    });
    return true;
  },

  confirmSignUp: ({ email, code }: Args, { db, update, tokenFor }: Ctx) => {
    const address = normal(email);
    const p = db.pending.find((x) => x.email === address);
    if (!p || p.code !== code.trim())
      throw new Error("That code doesn't match. Check the email.");
    const id = `u-${Math.random().toString(36).slice(2, 8)}`;
    update((d) => {
      d.pending = d.pending.filter((x) => x.email !== address);
      d.accounts.push({
        id,
        name: p.name,
        email: p.email,
        passwordHash: p.passwordHash,
      });
    });
    return tokenFor(id);
  },
  // docc:end

  // docc:begin chat#^send@9buh ~ceu7
  sendMessage: ({ to, text }: Args, ctx: Ctx) => {
    const me = signedIn(ctx);
    const body = text.trim();
    if (!body) throw new Error("The message is empty.");
    if (!ctx.db.accounts.some((a) => a.id === to))
      throw new Error("Conversation not found.");
    const message = {
      id: `m-${ctx.now}-${Math.random().toString(36).slice(2, 6)}`,
      from: me.id,
      to,
      text: body,
      at: ctx.now,
      read: false,
    };
    ctx.update((d) => {
      d.messages.push(message);
    });
    return { id: message.id, text: message.text, at: message.at, mine: true };
  },
  // docc:end

  markRead: ({ with: other }: Args, ctx: Ctx) => {
    const me = signedIn(ctx);
    if (between(ctx.db, me.id, other).some((m) => m.to === me.id && !m.read)) {
      ctx.update((d) => {
        for (const m of d.messages)
          if (m.from === other && m.to === me.id) m.read = true;
      });
    }
    return true;
  },
};
