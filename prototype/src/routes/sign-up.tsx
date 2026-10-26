import { createFileRoute } from "@tanstack/react-router";
import { SignUp } from "@/screens/SignUp";

export const Route = createFileRoute("/sign-up")({
  component: SignUp,
  head: () => ({ meta: [{ title: "Sign up — Family chat" }] }),
});
