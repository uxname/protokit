import type { Person, ProtoEvent } from "@/kit";
import { now } from "@/kit/clock";
import type { Db } from "./model";
import { hashPassword } from "./rules";

const MIN = 60_000;
const DAY = 24 * 60 * MIN;
/** Passwords of the seeded people; the panel shows them so a tester can also sign in by hand. */
const PASSWORDS: Record<string, string> = {
  anna: "sunny-river",
  ben: "green-forest",
  grace: "warm-kitchen",
};

/** The world a new prototype starts from: three relatives with a week of history. */
export const seed = (): Db => {
  const t = now();
  return {
    accounts: [
      {
        id: "anna",
        name: "Anna Miller",
        email: "anna@millers.family",
        passwordHash: hashPassword(PASSWORDS.anna),
      },
      {
        id: "ben",
        name: "Ben Miller",
        email: "ben@millers.family",
        passwordHash: hashPassword(PASSWORDS.ben),
      },
      {
        id: "grace",
        name: "Grandma Grace",
        email: "grace@millers.family",
        passwordHash: hashPassword(PASSWORDS.grace),
      },
    ],
    messages: [
      {
        id: "m1",
        from: "grace",
        to: "anna",
        text: "Anna dear, we're expecting you for lunch on Saturday at two 🙂",
        at: t - 3 * DAY,
        read: true,
      },
      {
        id: "m2",
        from: "anna",
        to: "grace",
        text: "Thanks, Mom! There'll be three of us, Mike is coming too.",
        at: t - 3 * DAY + 20 * MIN,
        read: true,
      },
      {
        id: "m3",
        from: "ben",
        to: "anna",
        text: "Do you remember where the car insurance papers are?",
        at: t - 5 * 60 * MIN,
        read: true,
      },
      {
        id: "m4",
        from: "anna",
        to: "ben",
        text: "Blue folder, second drawer of the dresser.",
        at: t - 4 * 60 * MIN,
        read: true,
      },
      {
        id: "m5",
        from: "ben",
        to: "anna",
        text: "Found it, thanks!",
        at: t - 3 * 60 * MIN,
        read: true,
      },
      {
        id: "m5b",
        from: "anna",
        to: "ben",
        text: "Don't forget to renew it before Friday",
        at: t - 3 * 60 * MIN + 2 * MIN,
        read: true,
      },
      {
        id: "m6",
        from: "grace",
        to: "anna",
        text: "Could you pick up some bread on the way?",
        at: t - 12 * MIN,
        read: false,
      },
      {
        id: "m7",
        from: "grace",
        to: "anna",
        text: "And sour cream, if they have it",
        at: t - 11 * MIN,
        read: false,
      },
    ],
    pending: [],
  };
};

/** Who a tab can take the eyes of: everyone with an account, new sign-ups included. */
export const people = (db: Db): Person[] =>
  db.accounts.map((a) => ({
    id: a.id,
    name: a.name,
    note: PASSWORDS[a.id]
      ? `${a.email}\npassword: ${PASSWORDS[a.id]}`
      : `${a.email}\nsigned up in the prototype`,
  }));

/** What happens outside the screen. */
export const EVENTS: Record<string, ProtoEvent<Db>> = {
  "grace-writes": {
    title: "Grandma Grace writes to Anna",
    panel: true,
    doc: "chat#^send",
    run: ({ update, now: t }) => {
      update((db) => {
        db.messages.push({
          id: `m${db.messages.length + 1}-${t}`,
          from: "grace",
          to: "anna",
          text: "Are you on your way yet?",
          at: t,
          read: false,
        });
      });
      return "The message arrived: Anna has an unread conversation.";
    },
  },
};
