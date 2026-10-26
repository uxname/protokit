import { createRootRoute } from "@tanstack/react-router";
import { Crash, ProtoApp } from "@/kit";
import { NotFound } from "@/screens/NotFound";

// The root is the kit's: product screens are the child routes. Only the 404 is the product's.
export const Route = createRootRoute({
  component: ProtoApp,
  errorComponent: Crash,
  notFoundComponent: NotFound,
});
