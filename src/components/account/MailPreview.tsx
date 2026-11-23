import { createElement, type CSSProperties, type ReactNode } from "react";
import type { Mark } from "@/lib/accounts/email/render";

// A message, drawn on the page as it will look in a mail program. It is drawn from the same tree
// of marks the HTML is made from (src/lib/accounts/email/render.ts), mark for mark and style for
// style, so what is looked at here is what is sent. It is not shown in a frame: the site's
// security policy refuses frames, its own included (next.config.ts). And it is never set as raw
// HTML: each mark is made as an element, so what an admin typed stays words.

/** A mark's attributes, as React names them. */
const NAMES: Record<string, string> = { class: "className", cellpadding: "cellPadding", cellspacing: "cellSpacing", bgcolor: "bgColor" };
const camel = (name: string) => name.replace(/-([a-z])/g, (_m, letter: string) => letter.toUpperCase());

function draw(mark: Mark | string, key: number): ReactNode {
  if (typeof mark === "string") return mark;
  const props: Record<string, unknown> = { key };
  for (const [name, value] of Object.entries(mark.attrs ?? {})) props[NAMES[name] ?? name] = value;
  if (mark.style) props.style = Object.fromEntries(Object.entries(mark.style).map(([name, value]) => [camel(name), value])) as CSSProperties;
  // In a message its headings are the first and second of their own document. On this page they
  // sit under the page's own headings, and are told to a screen reader as that.
  const heading = mark.tag === "h1" ? 3 : mark.tag === "h2" ? 4 : 0;
  if (heading) Object.assign(props, { role: "heading", "aria-level": heading });
  const kids = (mark.kids ?? []).map(draw);
  return createElement(heading ? "div" : mark.tag, props, ...kids);
}

export default function MailPreview({ mark, label }: { mark: Mark; /** What it is, for a screen reader: "The message as it will look". */ label: string }) {
  return (
    <div className="mail-frame" role="group" aria-label={label}>
      {draw(mark, 0)}
    </div>
  );
}
