// docc: chat#^send, chat#^time, chat#^offline

import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CircleAlert,
  SearchX,
  SendHorizontal,
  WifiOff,
} from "lucide-react";
import { type FC, type FormEvent, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "urql";
import { AppShell } from "@/components/AppShell";
import { DialogList } from "@/components/DialogList";
import { RequireSignIn } from "@/components/session";
import {
  MarkReadDocument,
  SendMessageDocument,
  ThreadDocument,
} from "@/generated/graphql";
import { errorText, Req, useNow, useWorld } from "@/kit";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/initials";
import { OFFLINE_COMPOSER, timeLabel } from "@/spec";
import { Alert, AlertDescription } from "@/ui/alert";
import { Avatar, AvatarFallback } from "@/ui/avatar";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Skeleton } from "@/ui/skeleton";
import { toast } from "@/ui/sonner";

const Thread: FC<{ id: string }> = ({ id }) => {
  const [{ data, fetching, error }, reload] = useQuery({
    query: ThreadDocument,
    variables: { with: id },
  });
  const [, markRead] = useMutation(MarkReadDocument);
  const [{ fetching: sending }, send] = useMutation(SendMessageDocument);
  // Stand-in for navigator.onLine: the panel's «World → Network» switches it.
  const online = useWorld((s) => s.online);
  const now = useNow();
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const messages = data?.messages ?? [];
  const count = messages.length;

  useEffect(() => {
    if (count) void markRead({ with: id });
    end.current?.scrollIntoView({ block: "end" });
  }, [id, count, markRead]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await send({ to: id, text });
    if (result.error) {
      toast.error(errorText(result.error));
      return;
    }
    setText("");
  };

  if (data && !data.person) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <SearchX className="size-10 text-muted-foreground" aria-hidden="true" />
        <p className="font-medium">Conversation not found</p>
        <p className="text-sm text-muted-foreground">
          The link may be out of date.
        </p>
        <Button asChild variant="outline">
          <Link to="/">To conversations</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b px-2 md:px-4">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="To conversations"
        >
          <Link to="/">
            <ArrowLeft />
          </Link>
        </Button>
        {data?.person ? (
          <>
            <Avatar className="size-8 ring-1 ring-border">
              <AvatarFallback>{initials(data.person.name)}</AvatarFallback>
            </Avatar>
            <span className="truncate font-medium">{data.person.name}</span>
          </>
        ) : (
          !error && (
            <>
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-5 w-40" />
            </>
          )
        )}
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto bg-muted px-3 py-4 md:px-6"
        aria-live="polite"
      >
        {/* One full-height column held to the bottom, as messengers do: whatever it
            shows — an error, placeholders, the empty line or the messages — stays in view. */}
        <div className="flex min-h-full flex-col justify-end gap-3">
          {error && !data && (
            <Alert variant="destructive">
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
          )}
          {fetching && !data && !error && (
            <div aria-busy="true" className="space-y-3">
              <span role="status" className="sr-only">
                Loading messages
              </span>
              <Skeleton className="h-10 w-2/3 rounded-2xl bg-background" />
              <Skeleton className="ml-auto h-10 w-1/2 rounded-2xl bg-background" />
            </div>
          )}
          {data && count === 0 && (
            <p className="my-auto py-10 text-center text-sm text-muted-foreground">
              Your conversation starts here. Write the first message.
            </p>
          )}
          <Req to="chat#^send">
            <ol className="space-y-2">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={cn(
                    "flex",
                    m.mine ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-xs",
                      m.mine
                        ? "rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-bl-md border bg-card text-card-foreground",
                    )}
                  >
                    <p className="break-words whitespace-pre-wrap">{m.text}</p>
                    <Req to="chat#^time">
                      <p
                        className={cn(
                          "mt-1 text-right text-[11px]",
                          m.mine
                            ? "text-primary-foreground/90"
                            : "text-muted-foreground",
                        )}
                      >
                        {timeLabel(m.at, now)}
                      </p>
                    </Req>
                  </div>
                </li>
              ))}
            </ol>
          </Req>
        </div>
        <div ref={end} />
      </div>

      <form
        onSubmit={submit}
        className="shrink-0 space-y-2 border-t bg-background px-3 py-3 md:px-6"
      >
        {!online && (
          <Req to="chat#^offline">
            <Alert className="py-2">
              <WifiOff />
              <AlertDescription>{OFFLINE_COMPOSER}</AlertDescription>
            </Alert>
          </Req>
        )}
        <div className="flex items-center gap-2">
          <Input
            aria-label="Message"
            placeholder="Message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!online}
            className="h-10"
          />
          <Button
            type="submit"
            size="icon"
            className="size-10 shrink-0"
            disabled={!online || sending || !text.trim()}
            aria-label="Send"
          >
            <SendHorizontal />
          </Button>
        </div>
      </form>
    </div>
  );
};

export const Chat: FC<{ id: string }> = ({ id }) => (
  <RequireSignIn>
    <AppShell aside={<DialogList activeId={id} />} hideBarOnMobile>
      <Thread key={id} id={id} />
    </AppShell>
  </RequireSignIn>
);
