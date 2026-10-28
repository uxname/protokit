// docc-none: how the simulated Logto checks a password and what the prototype does offline — simulation, not product rules

/** The simulated Logto keeps a hash of the password, never the password itself (FNV-1a, enough for a simulation). */
export const hashPassword = (password: string): string => {
  let h = 0x811c9dc5;
  for (const ch of password)
    h = Math.imul(h ^ ch.codePointAt(0)!, 0x01000193) >>> 0;
  return `fnv1a:${h.toString(16)}`;
};

export const WRONG_PASSWORD = "Wrong email or password.";

/**
 * Which reads answer offline: `true` all (the app keeps a copy on the device), `false`
 * none (only what is loaded stays), or a function of the operation name for a mix.
 * Here: none — the server answers nothing.
 */
export const OFFLINE_READS: boolean | ((operation: string) => boolean) = false;
