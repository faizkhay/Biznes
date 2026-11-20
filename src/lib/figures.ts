/**
 * The figures the tools work with, read out of the guides.
 *
 * A tool never carries a rate or a threshold of its own: it finds the fact in the guide, and shows
 * the guide's words and its source beside the result. If the guide is missing, or its fact cannot
 * be read as a number, the tool says so and does no arithmetic.
 */
import { index, type Block, type Guide } from "./index";

export type Figure = { value: number; said: string; label: string; detail?: string; sources?: string[] };

function fact(guide: Guide | undefined, label: RegExp, value: RegExp, read: (m: RegExpExecArray) => number): Figure | null {
  for (const f of guide?.facts ?? []) {
    if (!label.test(f.label)) continue;
    const m = value.exec(f.value);
    if (!m) continue;
    const n = read(m);
    if (Number.isFinite(n) && n > 0) return { value: n, said: f.value, label: f.label, detail: f.detail, sources: f.sources };
  }
  return null;
}

/** The standard rate of VAT, as a percentage, and the turnover above which registration is compulsory, in rupees. */
export function vatFigures() {
  const guide = index().guideBySlug.get("vat");
  const rate = fact(guide, /rate/i, /(\d+(?:\.\d+)?)\s*(?:%|per cent)/i, (m) => Number(m[1]));
  const threshold = fact(guide, /threshold|turnover|must register|compulsory/i, /(?:MUR|Rs\.?)\s*([\d,.]+)\s*(million|m\b)?/i, (m) => Number(m[1].replace(/,/g, "")) * (m[2] ? 1_000_000 : 1));
  return { guide, rate, threshold };
}

/** The tables of a guide, each with the heading of the section it is in. */
export function tablesOf(slug: string): { guide: Guide; tables: { heading: string; block: Extract<Block, { type: "table" }> }[] } | null {
  const guide = index().guideBySlug.get(slug);
  if (!guide) return null;
  const tables = guide.sections.flatMap((s) => s.blocks.filter((b): b is Extract<Block, { type: "table" }> => b.type === "table").map((block) => ({ heading: s.heading, block })));
  return { guide, tables };
}
