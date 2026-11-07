import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import type * as React from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

// shadcn's version reads the theme from next-themes; the root hands `theme` in. Top-center:
// at the bottom toasts would cover a phone's bottom navigation.
const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    className="toaster group"
    position="top-center"
    // A toast the product sends to the bottom (`position: "bottom-center"`) rises over what
    // a phone keeps fixed there: the product sets `--fixed-bottom-height` on `:root` at its
    // phone widths (DESIGN.md, Layout). Sonner takes its phone offset only under 600 px: both.
    offset={{ bottom: "calc(24px + var(--fixed-bottom-height, 0px))" }}
    mobileOffset={{ bottom: "calc(16px + var(--fixed-bottom-height, 0px))" }}
    icons={{
      success: <CircleCheckIcon className="size-4 text-success" />,
      info: <InfoIcon className="size-4 text-info" />,
      warning: <TriangleAlertIcon className="size-4 text-warning" />,
      error: <OctagonXIcon className="size-4 text-destructive" />,
      loading: <Loader2Icon className="size-4 animate-spin" />,
    }}
    style={
      {
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
        "--border-radius": "var(--radius)",
      } as React.CSSProperties
    }
    {...props}
  />
);

export { toast } from "sonner";
export { Toaster };
