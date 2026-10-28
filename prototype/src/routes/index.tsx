import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "@/components/brand";
import { Home } from "@/screens/Home";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({ meta: [{ title: APP_NAME }] }),
});
