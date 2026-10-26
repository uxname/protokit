import { createFileRoute } from "@tanstack/react-router";
import { Chats } from "@/screens/Chats";

export const Route = createFileRoute("/")({
  component: Chats,
  head: () => ({ meta: [{ title: "Family chat" }] }),
});
