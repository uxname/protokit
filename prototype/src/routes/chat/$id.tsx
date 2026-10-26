import { createFileRoute } from "@tanstack/react-router";
import { Chat } from "@/screens/Chat";

const Page = () => <Chat id={Route.useParams().id} />;

export const Route = createFileRoute("/chat/$id")({
  component: Page,
  head: () => ({ meta: [{ title: "Conversation — Family chat" }] }),
});
