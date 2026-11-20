// An article as plain Markdown: the same words the page shows, for a reader (a person's tool or an
// AI assistant) that asks for text and not for a page. Nothing is added and nothing left out but
// the page's furniture: the title, the summary, the facts, each section, what could not be
// confirmed, and the sources as a numbered list that the bracketed numbers in the text point to.
import { site } from "@/data/site";
import { day } from "./format";
import type { Block, Guide } from "./index";
import { siteUrl } from "./site-url";

const cell = (text: string) => text.replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ");

/** The numbers of the sources a block was written from, as they stand in the list of sources: " [1][4]". */
function cites(ids: string[] | undefined, g: Guide): string {
  const numbers = [...new Set((ids ?? []).map((id) => g.sources.findIndex((s) => s.id === id) + 1).filter((n) => n > 0))].sort((a, b) => a - b);
  return numbers.length ? ` ${numbers.map((n) => `[${n}]`).join("")}` : "";
}

function block(b: Block, g: Guide): string {
  if (b.type === "p") return `${b.text}${cites(b.sources, g)}`;
  if (b.type === "note") return `> ${b.text}${cites(b.sources, g)}`;
  if (b.type === "list") return b.items.map((item, i) => `- ${item}${i === b.items.length - 1 ? cites(b.sources, g) : ""}`).join("\n");
  if (b.type === "steps") return b.items.map((item, i) => `${i + 1}. ${item}${i === b.items.length - 1 ? cites(b.sources, g) : ""}`).join("\n");
  const rows = [`| ${b.columns.map(cell).join(" | ")} |`, `| ${b.columns.map(() => "---").join(" | ")} |`, ...b.rows.map((row) => `| ${row.map(cell).join(" | ")} |`)];
  const from = cites(b.sources, g).trim();
  return `${rows.join("\n")}${from ? `\n\nSources for this table: ${from}` : ""}`;
}

/** One article, whole. `level` is the depth of its title: 1 on its own, 2 inside a longer file. */
export function articleMarkdown(g: Guide, level = 1): string {
  const h = (n: number) => "#".repeat(level + n);
  const parts = [
    `${h(0)} ${g.title}`,
    g.summary,
    [`- Address: ${siteUrl}/learn/${g.slug}`, `- Checked: ${day(g.checked)}, against ${g.sources.length} sources`, `- Published by ${site.name}. General information, not legal or tax advice.`].join("\n"),
  ];
  if (g.facts.length) parts.push(`${h(1)} At a glance`, g.facts.map((f) => `- **${f.label}:** ${f.value}.${f.detail ? ` ${f.detail}` : ""}${cites(f.sources, g)}`).join("\n"));
  for (const section of g.sections) parts.push(`${h(1)} ${section.heading}`, ...section.blocks.map((b) => block(b, g)));
  if (g.unverified?.length) parts.push(`${h(1)} What this article could not confirm`, "These points were looked for and not found on an official page, so the article does not state them.", g.unverified.map((u) => `- ${u}`).join("\n"));
  parts.push(`${h(1)} Sources`, g.sources.map((s, i) => `${i + 1}. ${s.title}. ${s.publisher}.${s.published ? ` ${s.published}.` : ""}${s.accessed ? ` Read ${day(s.accessed)}.` : ""} ${s.url}`).join("\n"));
  return `${parts.join("\n\n")}\n`;
}
