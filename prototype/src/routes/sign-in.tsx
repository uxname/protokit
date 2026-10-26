import { createFileRoute } from "@tanstack/react-router";
import { SignIn } from "@/screens/SignIn";

export const Route = createFileRoute("/sign-in")({
  component: SignIn,
  head: () => ({ meta: [{ title: "Sign in — Family chat" }] }),
});
