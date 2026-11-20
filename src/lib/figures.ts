/**
 * The figures the tools work with, read out of the guides.
 *
 * A tool never carries a rate or a threshold of its own: it finds the fact in the guide, and shows
 * the guide's words and its source beside the result. If the guide is missing, or its fact cannot
 * be read as a number, the tool says so and does no arithmetic.
 */
import { index, type Block, type Guide } from "./index";
import { MONTHS, type Band, type BusinessTaxFigures, type IncomeTaxFigures, type Said } from "./sums";

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

/** Every sum of rupees in a sentence, in order: "MUR 4,580", "Rs 3 million". */
const sums = (text: string) => [...text.matchAll(/(?:MUR|Rs\.?)\s*([\d,]+(?:\.\d+)?)\s*(million|billion)?/gi)].map((m) => Number(m[1].replace(/,/g, "")) * (m[2] ? (m[2].toLowerCase() === "billion" ? 1e9 : 1e6) : 1));
/** Every percentage in a sentence, in order. */
const rates = (text: string) => [...text.matchAll(/(\d+(?:\.\d+)?)\s*(?:%|per cent)/gi)].map((m) => Number(m[1]));
const sound = (...numbers: (number | undefined)[]) => numbers.every((n) => n != null && Number.isFinite(n) && n > 0);

/**
 * A guide's fact, found by its label, as the tools show it: its own words and the numbers of the
 * guide's sources it cites. `read` takes the figures out of its value; if it returns null, or the
 * fact is not there, the reader gets null and the tool does without.
 */
function said<T extends object>(guide: Guide | undefined, label: RegExp, read: (value: string, label: string) => T | null): (Said & T) | null {
  const found = guide?.facts.find((f) => label.test(f.label));
  if (!guide || !found) return null;
  const figures = read(found.value, found.label);
  if (!figures) return null;
  return { label: found.label, said: found.value, detail: found.detail, cites: citesOf(guide, found.sources), ...figures };
}
/** The numbers a guide's own page gives to these sources, in its order, each once. */
export const citesOf = (guide: Guide, ids?: string[]) => [...new Set((ids ?? []).map((id) => guide.sources.findIndex((s) => s.id === id) + 1).filter((n) => n > 0))].sort((a, b) => a - b);
const words = () => ({});
const one = (value: string) => {
  const [amount] = sums(value);
  return sound(amount) ? { value: amount } : null;
};
const firstRate = (value: string) => {
  const [rate] = rates(value);
  return sound(rate) ? { value: rate } : null;
};

/**
 * What the personal income tax calculator works with: the bands, the deductions and reliefs with
 * their caps, and what a salary and a self-employed person's profit bear besides. Each is read
 * from a fact of the guide to personal income tax, by its label.
 */
export function incomeTaxFigures(): { guide: Guide | undefined; figures: IncomeTaxFigures } {
  const guide = index().guideBySlug.get("personal-income-tax-in-mauritius");
  const bands = said(guide, /^income tax bands/i, (value) => {
    // "0% on the first MUR 500,000, 10% on the next MUR 500,000, ... 35% on the remainder": a band a clause.
    const read: Band[] = [];
    for (const part of value.split(/,\s*(?=\d+(?:\.\d+)?\s*(?:%|per cent))/)) {
      const [rate] = rates(part);
      const [width] = sums(part);
      const last = /remainder|rest/i.test(part);
      if (rate == null || rate < 0 || rate > 100 || (!last && !sound(width))) return null;
      read.push({ rate, width: last ? null : width });
    }
    // Every band but the last has a width, and only the last is the remainder.
    return read.length >= 2 && read.every((band, i) => (band.width == null) === (i === read.length - 1)) ? { bands: read } : null;
  });
  const floor = said(guide, /national savings fund.*lowest/i, one);
  const figures: IncomeTaxFigures = {
    year: said(guide, /^income year/i, words),
    bands,
    dependents: said(guide, /^deduction for dependents/i, (value) => {
      const amounts = sums(value);
      return amounts.length === 4 && amounts.every((n, i) => n > (amounts[i - 1] ?? 0)) ? { amounts } : null;
    }),
    retired: said(guide, /retired/i, one),
    university: said(guide, /university/i, (value) => {
      const [amount] = sums(value);
      const most = Number(/up to (\d+) child/i.exec(value)?.[1]);
      return sound(amount, most) ? { value: amount, most } : null;
    }),
    school: said(guide, /private school/i, one),
    housing: said(guide, /housing loan/i, (value) => {
      const [ceiling] = sums(value);
      return sound(ceiling) ? { ceiling } : null;
    }),
    medical: said(guide, /medical/i, (value) => {
      const [first, next] = sums(value);
      const more = Number(/up to (\d+) more/i.exec(value)?.[1]);
      return sound(first, next, more) ? { first, next, more } : null;
    }),
    pension: said(guide, /pension scheme/i, one),
    donations: said(guide, /donation/i, one),
    carer: said(guide, /carer/i, one),
    fairShare: said(guide, /^fair share contribution/i, (value) => {
      if (/^(none|nil|no)\b/i.test(value.trim())) return { rate: null, over: 0 };
      const [rate] = rates(value);
      const [over] = sums(value);
      return sound(rate, over) ? { rate, over } : null;
    }),
    nonResident: said(guide, /non-resident/i, words),
    csg: said(guide, /^csg on a salary/i, (value) => {
      const [low, high] = rates(value);
      const [ceiling] = sums(value);
      return sound(low, high, ceiling) ? { low, high, ceiling } : null;
    }),
    nsf: said(guide, /^national savings fund on a salary/i, (value) => {
      const [rate] = rates(value);
      const [ceiling] = sums(value);
      return sound(rate, ceiling) ? { rate, ceiling, floor: floor?.value ?? null } : null;
    }),
    selfCsg: said(guide, /^csg for the self-employed/i, (value) => {
      // "MUR 150 a month where monthly net income is MUR 10,000 or less, 1.5% of 90% of it up to MUR 50,000, 3% of 90% of it above".
      const [flat, floor, ceiling] = sums(value);
      const [low, share, high, again] = rates(value);
      return sound(flat, floor, ceiling, low, share, high) && again === share && floor < ceiling ? { flat, floor, low, share, ceiling, high } : null;
    }),
    cps: said(guide, /current payment system/i, one),
  };
  return { guide, figures };
}

/**
 * What the business tax estimator works with: the rates on a company's chargeable income, the
 * levies charged with it and their tests, and the months in which statements and returns fall due.
 * Each is read from a fact of the guide to business taxes, by its label.
 */
export function businessTaxFigures(): { guide: Guide | undefined; figures: BusinessTaxFigures } {
  const guide = index().guideBySlug.get("business-taxes");
  const months = (value: string) => {
    const n = Number(/(\d+)\s+months?/i.exec(value)?.[1]);
    return sound(n) ? { value: n } : null;
  };
  const figures: BusinessTaxFigures = {
    rate: said(guide, /^company income tax, standard/i, firstRate),
    exportRate: said(guide, /^company income tax on export/i, firstRate),
    exemption: said(guide, /^partial exemption/i, firstRate),
    csr: said(guide, /\(CSR\)/, firstRate),
    ccr: said(guide, /\(CCR\)/, (value) => {
      const [rate] = rates(value);
      const [over] = sums(value);
      return sound(rate, over) ? { rate, over } : null;
    }),
    fairShare: said(guide, /^fair share contribution, companies/i, (value) => {
      const [rate, low] = rates(value);
      const [over] = sums(value);
      return sound(rate, low, over) ? { rate, low, over } : null;
    }),
    presumptive: said(guide, /^presumptive tax/i, (value) => {
      const [rate] = rates(value);
      const [ceiling] = sums(value);
      return sound(rate, ceiling) ? { rate, ceiling } : null;
    }),
    aps: said(guide, /\(APS\) threshold/i, one),
    apsDue: said(guide, /^aps statements/i, months),
    returnDue: said(guide, /^company annual return/i, months),
    early: said(guide, /^due dates at the end of/i, (value, label) => {
      const named = MONTHS.map((name, i) => (label.includes(name) ? i : -1)).filter((i) => i >= 0);
      const days = Number(/(\d+)\s+days?/i.exec(value)?.[1]);
      return named.length > 0 && sound(days) ? { months: named, days } : null;
    }),
    societe: said(guide, /soci[eé]t[eé]/i, words),
    soleTrader: said(guide, /^sole trader/i, words),
  };
  return { guide, figures };
}

/** The tables of a guide, each with the heading of the section it is in. */
export function tablesOf(slug: string): { guide: Guide; tables: { heading: string; block: Extract<Block, { type: "table" }> }[] } | null {
  const guide = index().guideBySlug.get(slug);
  if (!guide) return null;
  const tables = guide.sections.flatMap((s) => s.blocks.filter((b): b is Extract<Block, { type: "table" }> => b.type === "table").map((block) => ({ heading: s.heading, block })));
  return { guide, tables };
}
