import { AI } from "@/data/ai";
import { anchorOf } from "@/lib/format";
import { index, type Block } from "@/lib/index";
import type { Answer, Lead } from "@/lib/search";

/** A part of one of the site's own articles, as the model is given it: numbered, with the page it is from. */
export type Passage = { n: number; title: string; href: string; text: string };

/** A question, by how it begins or ends, in English, French and Kreol. */
const QUESTION = /^(how|what|whats|when|where|who|whom|which|why|can|could|do|does|did|is|are|am|should|must|may|will|would|combien|comment|quand|quel|quelle|quels|quelles|pourquoi|qui|que|ki|kouma|kan|kifer|kombien|eski)\b|\?\s*$/i;

const words = (block: Block) => ("text" in block ? block.text : "items" in block ? block.items.join("; ") : block.rows.map((row) => row.map((cell, i) => (block.columns[i] ? `${block.columns[i]}: ${cell}` : cell)).join(", ")).join(". "));

/** No longer than `most`, and cut at the end of a sentence where there is one. */
function clip(text: string, most: number) {
  const plain = text.replace(/\s+/g, " ").trim();
  if (plain.length <= most) return plain;
  const cut = plain.slice(0, most);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "));
  return end > most * 0.5 ? cut.slice(0, end + 1) : cut;
}

/** The whole of what a lead points at, where the search itself shows only its opening words. */
function textOf(lead: Lead): string {
  if (lead.tag === "Guide" && lead.href.startsWith("/learn/")) {
    const [path, part] = lead.href.split("#");
    const guide = index().guideBySlug.get(path.slice("/learn/".length));
    if (guide && !part) return [guide.summary, ...guide.facts.map((fact) => `${fact.label}: ${fact.value}.${fact.detail ? ` ${fact.detail}` : ""}`)].join(" ");
    const section = guide && part !== "glance" ? guide.sections.find((s) => anchorOf(s.heading) === part) : undefined;
    if (section) return `${section.heading.replace(/[.:]$/, "")}. ${section.blocks.map(words).join(" ")}`;
  }
  return [lead.line, lead.call?.length ? `The number to call: ${lead.call.join(" or ")}.` : ""].filter(Boolean).join(" ");
}

/**
 * Whether a question is put to the model at all. It costs money each time, so it is asked only
 * where it has something to add:
 *
 * - not for a question about who and where: the list of businesses is the answer, and the site
 *   never has a machine choose among them;
 * - not where a number to call or a date already answers outright;
 * - only where an article of the site's own answers, or, for words put as a question, at least
 *   mentions it. With nothing of the site's to read there is nothing for it to say.
 */
export function worthAsking(question: string, a: Answer): boolean {
  const q = question.trim();
  if (q.length < 3 || q.length > AI.maxQuestion || q.split(/\s+/).length > AI.maxWords) return false;
  if (a.who) return false;
  const first = a.leads[0];
  if (first && (first.tag === "Number" || first.tag === "Holiday")) return false;
  if (a.leads.some((lead) => lead.tag === "Guide")) return true;
  return QUESTION.test(q) && a.mentions.some((lead) => lead.tag === "Guide");
}

/** An article's facts at a glance, as one passage: its figures, each with its label. */
function glance(slug: string): Omit<Passage, "n"> | null {
  const guide = index().guideBySlug.get(slug);
  if (!guide?.facts.length) return null;
  return { title: guide.title, href: `/learn/${slug}#glance`, text: clip(`At a glance. ${guide.facts.map((fact) => `${fact.label}: ${fact.value}.${fact.detail ? ` ${fact.detail}` : ""}`).join(" ")}`, AI.passageChars) };
}

/**
 * What the model is given to read: the parts of the site's articles that answer the question,
 * best first, then, if there is room, the parts that only mention it. Each is the whole part and
 * not only its opening words, cut to a length. A page is given once.
 *
 * The leading article's facts at a glance go with them, second, unless the article was given
 * whole. A question such as "how long does it take" finds the part of an article that tells how,
 * while the figure it wants is among that article's facts: the first real answers showed it
 * (26 November 2026).
 */
export function passagesFor(a: Answer): Passage[] {
  const seen = new Set<string>();
  const found: Omit<Passage, "n">[] = [];
  for (const lead of [...a.leads, ...a.mentions]) {
    if (found.length >= AI.passages) break;
    if (lead.tag === "Tool" || lead.tag === "Page" || seen.has(lead.href)) continue;
    seen.add(lead.href);
    const text = clip(textOf(lead), AI.passageChars);
    if (text.length < 20) continue;
    found.push({ title: lead.title, href: lead.href, text });
  }
  const first = found.find((passage) => passage.href.startsWith("/learn/") && !passage.href.startsWith("/learn/glossary"));
  const slug = first?.href.slice("/learn/".length).split("#")[0];
  const whole = found.some((passage) => passage.href === `/learn/${slug}`);
  const facts = slug && !whole ? glance(slug) : null;
  // Second, so that it is read whatever else there is; the last of five gives it its place.
  if (facts) found.splice(1, 0, facts);
  return found.slice(0, AI.passages).map((passage, i) => ({ n: i + 1, ...passage }));
}

/** Every figure in a text, as its digits alone: "Rs 6,000,000" and "6 000 000" are the same figure. */
const figures = (text: string) => (text.match(/\d(?:[\d\s,.']*\d)?/g) ?? []).map((run) => run.replace(/[^\d]/g, ""));

/**
 * The check on what the model wrote, made by the site and not by the model: every figure in the
 * answer must be in the passages it was given, digit for digit. An answer with a figure from
 * anywhere else is thrown away whole. So is one that is too long, or that carries a link.
 */
export function supported(answer: string, passages: Passage[]): boolean {
  if (!answer || answer.length > AI.maxChars || /https?:|www\.|[<>]/i.test(answer)) return false;
  const given = passages.map((p) => `${p.title} ${p.text}`).join(" ").replace(/[\s,.']/g, "");
  return figures(answer).every((figure) => given.includes(figure));
}
