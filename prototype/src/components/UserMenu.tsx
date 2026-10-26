import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import type { FC } from "react";
import { useQuery } from "urql";
import { MeDocument } from "@/generated/graphql";
import { useSession } from "@/kit";
import { initials } from "@/lib/initials";
import { Avatar, AvatarFallback } from "@/ui/avatar";
import { Button } from "@/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";

export const UserMenu: FC = () => {
  const [{ data }] = useQuery({ query: MeDocument });
  const setToken = useSession((s) => s.setToken);
  const navigate = useNavigate();
  const me = data?.me;
  if (!me) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={`Account: ${me.name}`}
        >
          <Avatar className="ring-1 ring-border">
            <AvatarFallback>{initials(me.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate font-medium">{me.name}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {me.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            setToken(null);
            void navigate({ to: "/sign-in" });
          }}
        >
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
