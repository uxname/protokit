// The prototype kit: the same in every project. Projects use these exports and never edit src/kit.
export { Crash, ProtoApp } from "./App";
export { now, useNow } from "./clock";
export { docsHome, type Requirement, requirement } from "./docs";
export { errorText } from "./errors";
export { lang, t } from "./i18n";
export { Req } from "./Req";
export { accountOf, tokenFor, useSession } from "./session";
export type { Mail, Person, ProtoCtx, ProtoEvent } from "./types";
export { useSyncedDb, useWorld } from "./world";
