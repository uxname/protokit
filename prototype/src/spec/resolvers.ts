// docc-none: the simulated server's answers; the rules they follow are in the documents and the screens
import type { Ctx } from "./model";
import { hashPassword, WRONG_PASSWORD } from "./rules";

type Args = Record<string, string>;

/** Root resolvers for schema.graphql; graphql-js calls each with (args, context). */
export const resolvers = {
  me: (_: Args, { db, me }: Ctx) => {
    const a = db.accounts.find((x) => x.id === me);
    return a ? { id: a.id, name: a.name, email: a.email } : null;
  },

  signIn: ({ email, password }: Args, { db, tokenFor }: Ctx) => {
    const a = db.accounts.find((x) => x.email === email.trim().toLowerCase());
    if (!a || a.passwordHash !== hashPassword(password))
      throw new Error(WRONG_PASSWORD);
    return tokenFor(a.id);
  },
};
