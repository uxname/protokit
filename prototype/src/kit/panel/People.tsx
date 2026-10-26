import { Check, UserX } from "lucide-react";
import type { FC } from "react";
import { people } from "@/spec";
import { t } from "../i18n";
import { accountOf, tokenFor, useSession } from "../session";
import { useWorld } from "../world";
import { Avatar, Row, Section } from "./ui";

export const People: FC = () => {
  const db = useWorld((s) => s.db);
  const token = useSession((s) => s.token);
  const switchTo = useSession((s) => s.switchTo);
  const me = accountOf(token);

  return (
    <Section title={t.eyesTitle} hint={t.eyesHint}>
      <div className="space-y-1">
        {people(db).map((p) => (
          <Row
            key={p.id}
            active={p.id === me}
            onClick={() => switchTo(tokenFor(p.id))}
          >
            <Avatar name={p.name} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{p.name}</span>
              <span className="block whitespace-pre-line break-words text-xs text-muted-foreground">
                {p.note}
              </span>
            </span>
            {p.id === me && <Check className="size-4 text-primary" />}
          </Row>
        ))}
        <Row active={!me} onClick={() => switchTo(null)}>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UserX className="size-4" />
          </span>
          <span className="flex-1">
            <span className="block font-medium">{t.stranger}</span>
            <span className="block text-xs text-muted-foreground">
              {t.strangerHint}
            </span>
          </span>
          {!me && <Check className="size-4 text-primary" />}
        </Row>
      </div>
    </Section>
  );
};
