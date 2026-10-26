import { Loader2Icon } from "lucide-react";
import type * as React from "react";
import { t } from "@/kit/i18n";
import { cn } from "@/lib/cn";

function Spinner({
  className,
  "aria-label": label,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      role="status"
      // An explicit `undefined` from a caller still gets the default.
      aria-label={label ?? t.loading}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
