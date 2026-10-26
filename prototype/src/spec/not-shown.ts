/**
 * Requirements a front-end prototype cannot show, each with the reason. The tags keep
 * them under docc: when a paragraph changes, this file gets DOC209 and is reviewed too.
 */
// docc: auth#^password-hash
export const NOT_SHOWN: { to: string; why: string }[] = [
  {
    to: "auth#^password-hash",
    why: "How the password is stored is not visible on a screen: the simulated server keeps a hash, as the paragraph requires.",
  },
];
