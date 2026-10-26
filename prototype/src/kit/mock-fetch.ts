import { buildSchema, graphql } from "graphql";
import { OFFLINE_READS, resolvers } from "@/spec";
import sdl from "../../schema.graphql?raw";
import { serverCtx } from "./events";
import { useWorld } from "./world";

const schema = buildSchema(sdl);

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
  await new Promise((r) => setTimeout(r, latency()));
  const { query, variables, operationName } = JSON.parse(String(init?.body));
  const read = /^\s*(query\b|\{)/.test(query);
  if (!useWorld.getState().online && !(OFFLINE_READS && read))
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
