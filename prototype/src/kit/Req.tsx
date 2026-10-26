import { Slot } from "radix-ui";
import type { FC, ReactElement } from "react";

/**
 * Marks the element that shows a requirement: `to` is a docc target `<doc>#^<anchor>`.
 * Renders nothing of its own: it puts `data-req` on its only child, which must pass props
 * to its DOM element (DOM tags and every shadcn primitive do). The panel lists the marked
 * elements of the screen; its documentation mode outlines them and shows the paragraph on
 * hover. A `Req` around the whole screen links the screen itself. The file also carries
 * `// docc: <to>`, so a change of the paragraph reaches it.
 */
export const Req: FC<{ to: string; children: ReactElement }> = ({
  to,
  children,
}) => <Slot.Root data-req={to}>{children}</Slot.Root>;
