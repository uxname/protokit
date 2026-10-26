import { now } from "@/kit/clock";

// docc:begin auth#^password-hash
/** The server keeps a hash of the password, never the password itself (FNV-1a, enough for a simulation). */
export const hashPassword = (password: string): string => {
  let h = 0x811c9dc5;
  for (const ch of password)
    h = Math.imul(h ^ ch.codePointAt(0)!, 0x01000193) >>> 0;
  return `fnv1a:${h.toString(16)}`;
};
// docc:end

// docc:begin auth#^sign-up
export const PASSWORD_MIN_LENGTH = 8;
export const CODE_LENGTH = 6;
export const RESEND_SECONDS = 60;

export const newCode = (random = Math.random): string =>
  Array.from({ length: CODE_LENGTH }, () => Math.floor(random() * 10)).join("");
// docc:end

// docc:begin auth#^wrong-password
export const WRONG_PASSWORD = "Wrong email or password.";
// docc:end

// docc:begin chat#^time
/** "just now", "5 min ago", "3 h ago", then the date. */
export const timeLabel = (at: number, current = now()): string => {
  const min = Math.floor((current - at) / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  if (min < 24 * 60) return `${Math.floor(min / 60)} h ago`;
  return new Date(at).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
  });
};
// docc:end

// docc:begin chat#^offline
export const OFFLINE_COMPOSER = "You're offline — messages can't be sent yet.";
/** Without network the app shows only what it already loaded: the server answers nothing. */
export const OFFLINE_READS = false;
// docc:end
