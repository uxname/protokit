import type { CombinedError } from "urql";
import { t } from "./i18n";

/** The server's own message, or a plain line for a lost network; never urql's "[GraphQL]" prefix. */
export const errorText = (error: CombinedError): string =>
  error.networkError
    ? t.noNetwork
    : (error.graphQLErrors[0]?.message ?? error.message);
