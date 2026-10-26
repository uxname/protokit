import { cn } from "@/lib/cn";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      // Local change: shadcn's bg-accent equals the page's bg-muted in the light theme,
      // so a skeleton on the page vanished; a tint of the text shows on every surface.
      className={cn("animate-pulse rounded-md bg-foreground/10", className)}
      {...props}
    />
  );
}

export { Skeleton };
