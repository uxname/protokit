// docc-none: the frame of the conversations screen; its list (components/DialogList) names the paragraphs
import { MessagesSquare } from "lucide-react";
import type { FC } from "react";
import { useQuery } from "urql";
import { AppShell } from "@/components/AppShell";
import { DialogList } from "@/components/DialogList";
import { RequireSignIn } from "@/components/session";
import { DialogsDocument } from "@/generated/graphql";

/** The hint on the right, only once the list on the left has something to pick. */
const PickHint: FC = () => {
  const [{ data }] = useQuery({ query: DialogsDocument });
  if (!data?.dialogs.length) return null;
  return (
    <div className="hidden flex-1 flex-col items-center justify-center gap-3 text-center text-muted-foreground md:flex">
      <MessagesSquare className="size-10" />
      <p>Pick a conversation on the left</p>
    </div>
  );
};

/** Phone: the list of conversations. Wider screens: the list on the left and a hint on the right. */
export const Chats: FC = () => (
  <RequireSignIn>
    <AppShell aside={<DialogList />}>
      <div className="md:hidden">
        <DialogList />
      </div>
      <PickHint />
    </AppShell>
  </RequireSignIn>
);
