import { buildSchema, type GraphQLSchema, graphql } from "graphql";
import * as spec from "@/spec";
import { serverCtx } from "./events";
import { useWorld } from "./world";

/**
 * A product without a server (its data lives in the browser) has no schema.graphql, no
 * resolvers and no OFFLINE_READS: its screens read and write the world directly. A glob,
 * not an import: a missing file is an empty match, not a build error.
 */
const sdl = Object.values(
  import.meta.glob<string>("../../schema.graphql", {
    query: "?raw",
    import: "default",
    eager: true,
  }),
)[0];
const { OFFLINE_READS = false, resolvers = {} } = spec as {
  OFFLINE_READS?: boolean | ((operation: string) => boolean);
  resolvers?: object;
};
let schema: GraphQLSchema | undefined;

/**
 * A real server answers in tens of milliseconds, not at once: loading states get a moment
 * on screen. `proto-latency` in localStorage stretches it, so a test can photograph loading.
 */
const latency = () => Number(localStorage.getItem("proto-latency")) || 250;

const bearer = (headers: HeadersInit | undefined): string | null => {
  const value = new Headers(headers).get("authorization");
  return value?.startsWith("Bearer ") ? value.slice("Bearer ".length) : null;
};

/**
 * The simulated server: a `fetch` that runs the GraphQL request in the browser against
 * schema.graphql and the spec resolvers. It knows the person by the token in the
 * Authorization header, as a real backend would, and fails like a lost network when the
 * panel switches the network off — except reads, when the product keeps a copy on the
 * device (`OFFLINE_READS`). The client sends POST only, so the body carries the request.
 */
export const protoFetch: typeof fetch = async (_input, init) => {
  if (!sdl) throw new Error("No schema.graphql: this prototype has no server");
  schema ??= buildSchema(sdl);
  await new Promise((r) => setTimeout(r, latency()));
  const { query, variables, operationName } = JSON.parse(String(init?.body));
  const read = /^\s*(query\b|\{)/.test(query);
  const offlineOk =
    read &&
    (typeof OFFLINE_READS === "function"
      ? OFFLINE_READS(operationName ?? "")
      : OFFLINE_READS);
  if (!useWorld.getState().online && !offlineOk)
    throw new TypeError("Failed to fetch");
  const result = await graphql({
    schema,
    source: query,
    rootValue: resolvers,
    contextValue: serverCtx(bearer(init?.headers)),
    variableValues: variables,
    operationName,
  });
  return new Response(JSON.stringify(result), {
    headers: { "content-type": "application/json" },
  });
};
