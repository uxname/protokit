/**
 * Requirements a front-end prototype cannot show, each with the reason. The tags keep
 * them under docc: when a paragraph changes, this file gets DOC209 and is reviewed too.
 */
// docc: auth#^jmgu@qaw6 ~ayym
export const NOT_SHOWN: { to: string; why: string }[] = [
  {
    to: "auth#^jmgu",
    why: "How the password is stored is not visible on a screen: the simulated server keeps a hash, as the paragraph requires.",
  },
];
