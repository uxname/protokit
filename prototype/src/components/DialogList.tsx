// docc: chat#^rbtf@j5xa, chat#^yy76@j34n ~ynv4

import { Link } from "@tanstack/react-router";
import { CircleAlert } from "lucide-react";
import type { FC } from "react";
import { useQuery } from "urql";
import { DialogsDocument } from "@/generated/graphql";
import { errorText, Req, useNow } from "@/kit";
import { initials } from "@/lib/initials";
import { timeLabel } from "@/spec";
import { Alert, AlertDescription } from "@/ui/alert";
import { Avatar, AvatarFallback } from "@/ui/avatar";
import { Button } from "@/ui/button";
import { Skeleton } from "@/ui/skeleton";

export const DialogList: FC<{ activeId?: string }> = ({ activeId }) => {
  const [{ data, fetching, error }, reload] = useQuery({
    query: DialogsDocument,
  });
  const now = useNow();

  if (error && !data) {
    return (
      <Alert variant="destructive" className="m-4 w-auto">
        <CircleAlert />
        <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
          {errorText(error)}
          <Button
            size="sm"
            variant="outline"
            onClick={() => reload({ requestPolicy: "network-only" })}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (fetching && !data) {
    return (
      <div aria-busy="true" className="space-y-1 p-2">
        <span role="status" className="sr-only">
          Loading conversations
        </span>
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-3 p-2">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Req to="chat#^rbtf">
      <nav aria-label="Conversations" className="p-2">
        {data?.dialogs.length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            Your family shows up here once they sign up.
          </p>
        )}
        <ul className="space-y-0.5">
          {data?.dialogs.map((d) => (
            <li key={d.id}>
              <Link
                to="/chat/$id"
                params={{ id: d.id }}
                aria-current={d.id === activeId ? "page" : undefined}
                className="flex items-center gap-3 rounded-lg p-2 outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-[current=page]:bg-accent"
              >
                <Avatar className="size-10 ring-1 ring-border">
                  <AvatarFallback>{initials(d.name)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-medium">{d.name}</span>
                    {d.lastAt && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {timeLabel(d.lastAt, now)}
                      </span>
                    )}
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-muted-foreground">
                      {d.lastText
                        ? `${d.lastMine ? "You: " : ""}${d.lastText}`
                        : "No messages yet"}
                    </span>
                    {d.unread > 0 && (
                      <span className="shrink-0 rounded-full bg-primary px-1.5 text-xs leading-5 font-medium text-primary-foreground">
                        {d.unread}
                        <span className="sr-only"> unread</span>
                      </span>
                    )}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Req>
  );
};
