// docc-none: the seeded person — a starting state, the rules live in the documents and the screens
import type { Person, ProtoEvent } from "@/kit";
import type { Db } from "./model";
import { hashPassword } from "./rules";

/** The seeded person's password; the panel shows it so a tester can also sign in by hand. */
const PASSWORD = "analytical-engine";

/** The world a new prototype starts from: one person with an account in Logto. */
export const seed = (): Db => ({
  accounts: [
    {
      id: "ada",
      name: "Ada Lovelace",
      email: "ada@example.com",
      passwordHash: hashPassword(PASSWORD),
    },
  ],
});

/** Who a tab can take the eyes of: everyone with an account. */
export const people = (db: Db): Person[] =>
  db.accounts.map((a) => ({
    id: a.id,
    name: a.name,
    note: `${a.email}\npassword: ${PASSWORD}`,
  }));

/** What happens outside the screen: nothing yet — a product adds its events here. */
export const EVENTS: Record<string, ProtoEvent<Db>> = {};
