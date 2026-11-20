/**
 * The sums the tax tools do, and the shape of the figures they are handed.
 *
 * Nothing here knows a rate, a band or a threshold: every one arrives in the figures, which
 * src/lib/figures.ts reads out of a guide's sourced facts. A figure that is missing is null, and the
 * part of the sum that needs it comes back null too, so the tool can say it will not guess. The
 * page works its no-script examples with these same functions, and the calculator in the browser
 * uses them as a person types, so the two can never disagree.
 */

/** A fact as the guide words it, with the numbers of the guide's sources it was read from. */
export type Said = { label: string; said: string; detail?: string; cites: number[] };
type Amount = Said & { value: number };

/** One band of the income tax: a rate in per cent and how wide the band is. The last has no width. */
export type Band = { rate: number; width: number | null };

export type IncomeTaxFigures = {
  year: Said | null;
  bands: (Said & { bands: Band[] }) | null;
  /** The deduction for one, two, three, and four or more dependents. */
  dependents: (Said & { amounts: number[] }) | null;
  retired: Amount | null;
  university: (Amount & { most: number }) | null;
  school: Amount | null;
  /** Interest on a housing loan: allowed in full, unless income is above the ceiling. */
  housing: (Said & { ceiling: number }) | null;
  /** Medical insurance: the cap for self and for a first dependent, then for each of up to `more` others. */
  medical: (Said & { first: number; next: number; more: number }) | null;
  pension: Amount | null;
  donations: Amount | null;
  carer: Amount | null;
  /** The Fair Share Contribution on an individual. `rate` is null in a year when there is none. */
  fairShare: (Said & { rate: number | null; over: number }) | null;
  nonResident: Said | null;
  /** The employee's CSG: one rate up to a monthly basic pay, another above it, on the whole pay. */
  csg: (Said & { low: number; high: number; ceiling: number }) | null;
  /** The employee's share to the National Savings Fund, on basic pay between a floor and a ceiling. */
  nsf: (Said & { rate: number; ceiling: number; floor: number | null }) | null;
  /** A self-employed person's CSG: a flat sum, then a rate on a share of net income, then a higher rate. */
  selfCsg: (Said & { flat: number; floor: number; low: number; share: number; ceiling: number; high: number }) | null;
  cps: Amount | null;
};

export type PersonalInput = {
  resident: boolean;
  /** Basic salary for the whole year, and the number of months' pay it is made of (12, or 13 with a bonus). */
  salary: number;
  months: number;
  profit: number;
  other: number;
  /** 0 to 4, where 4 stands for four or more. */
  dependents: number;
  retired: boolean;
  university: number;
  schoolChildren: number;
  schoolFees: number;
  housing: number;
  medical: number;
  pension: number;
  donations: number;
  carer: number;
};

/** One deduction as it was worked: what was asked for, what was allowed, and why they differ. */
export type Relief = { key: string; asked: number; allowed: number | null; cap?: number; why?: "cap" | "income" | "resident" | "figure" };

const pct = (rate: number, of: number) => (rate * of) / 100;

/** Tax band by band: how much of the income falls in each, and the tax on that slice. */
export function bandTax(chargeable: number, bands: Band[]) {
  let left = Math.max(0, chargeable);
  return bands.map((band) => {
    const slice = band.width == null ? left : Math.min(left, band.width);
    left -= slice;
    return { rate: band.rate, width: band.width, slice, tax: pct(band.rate, slice) };
  });
}

/** The most that can be deducted for medical insurance by a person claiming this many dependents. */
export const medicalCap = (f: NonNullable<IncomeTaxFigures["medical"]>, dependents: number) => f.first * (1 + Math.min(dependents, 1)) + f.next * Math.min(Math.max(dependents - 1, 0), f.more);

/** A year's income tax for one person, with every step kept so that it can be shown. */
export function personal(input: PersonalInput, f: IncomeTaxFigures) {
  const income = input.salary + input.profit + input.other;
  const reliefs: Relief[] = [];
  const claim = (key: string, asked: number, cap: number | null | undefined, refused?: "income") => {
    if (asked <= 0) return;
    if (!input.resident) reliefs.push({ key, asked, allowed: 0, why: "resident" });
    else if (cap == null) reliefs.push({ key, asked, allowed: null, why: "figure" });
    else if (refused) reliefs.push({ key, asked, allowed: 0, why: refused });
    else reliefs.push({ key, asked, allowed: Math.min(asked, cap), cap, why: asked > cap ? "cap" : undefined });
  };
  const dependents = Math.min(Math.max(input.dependents, 0), f.dependents?.amounts.length ?? 4);
  // A set amount, not a cap on something paid: what is asked for is the amount itself.
  const set = (key: string, amount: number | null | undefined, wanted: boolean) => wanted && claim(key, amount ?? 1, amount);
  set("dependents", f.dependents?.amounts[dependents - 1], dependents > 0);
  set("retired", f.retired?.value, input.retired);
  const students = Math.min(input.university, dependents, f.university?.most ?? input.university);
  set("university", f.university ? f.university.value * students : null, students > 0);
  const pupils = Math.min(input.schoolChildren, dependents);
  claim("school", pupils > 0 ? input.schoolFees : 0, f.school ? f.school.value * pupils : null);
  claim("housing", input.housing, f.housing ? input.housing : null, f.housing && income > f.housing.ceiling ? "income" : undefined);
  claim("medical", input.medical, f.medical ? medicalCap(f.medical, dependents) : null);
  claim("pension", input.pension, f.pension?.value);
  claim("donations", input.donations, f.donations?.value);
  claim("carer", input.carer, f.carer?.value);

  const deducted = reliefs.reduce((sum, r) => sum + (r.allowed ?? 0), 0);
  const chargeable = Math.max(0, income - deducted);
  const slices = f.bands ? bandTax(chargeable, f.bands.bands) : null;
  const onBands = slices ? slices.reduce((sum, s) => sum + s.tax, 0) : null;
  const fairShare = !f.fairShare ? null : f.fairShare.rate == null ? 0 : pct(f.fairShare.rate, Math.max(0, chargeable - f.fairShare.over));
  const tax = onBands == null || fairShare == null ? null : onBands + fairShare;

  // What a salary bears besides: the employee's CSG on every month paid, the Fund on twelve.
  const monthly = input.months > 0 ? input.salary / input.months : 0;
  const csgRate = f.csg ? (monthly <= f.csg.ceiling ? f.csg.low : f.csg.high) : null;
  const csg = input.salary > 0 && csgRate != null ? { rate: csgRate, month: pct(csgRate, monthly), year: pct(csgRate, monthly) * input.months } : null;
  const below = f.nsf?.floor != null && monthly < f.nsf.floor;
  const nsfMonth = f.nsf ? (below ? 0 : pct(f.nsf.rate, Math.min(monthly, f.nsf.ceiling))) : null;
  const nsf = input.salary > 0 && nsfMonth != null ? { below, month: nsfMonth, year: nsfMonth * 12 } : null;

  // And what a self-employed person pays on the profit of the business, month by month.
  const net = input.profit / 12;
  const s = f.selfCsg;
  const selfMonth = !s ? null : net <= s.floor ? s.flat : net <= s.ceiling ? Math.max(s.flat, pct(s.low, pct(s.share, net))) : pct(s.high, pct(s.share, net));
  const selfCsg = input.profit > 0 && selfMonth != null ? { month: selfMonth, year: selfMonth * 12 } : null;

  const known = tax != null && (input.salary <= 0 || (csg && nsf)) && (input.profit <= 0 || selfCsg);
  const left = known ? income - (tax ?? 0) - (csg?.year ?? 0) - (nsf?.year ?? 0) - (selfCsg?.year ?? 0) : null;
  return { income, reliefs, deducted, chargeable, slices, onBands, fairShare, tax, effective: tax != null && income > 0 ? (tax / income) * 100 : null, monthly, csg, nsf, selfCsg, left };
}

export type BusinessTaxFigures = {
  rate: Amount | null;
  exportRate: Amount | null;
  /** The share, in per cent, of a listed kind of income that is exempt. */
  exemption: Amount | null;
  csr: Amount | null;
  ccr: (Said & { rate: number; over: number }) | null;
  /** The Fair Share Contribution: the rate, the rate for a company taxed at the export rate, and the test. */
  fairShare: (Said & { rate: number; low: number; over: number }) | null;
  presumptive: (Said & { rate: number; ceiling: number }) | null;
  aps: Amount | null;
  /** Months after a quarter ends, and after a year ends, by which a statement or a return is due. */
  apsDue: Amount | null;
  returnDue: Amount | null;
  /** The months (0 to 11) in which a due date at the end of the month falls some days earlier. */
  early: (Said & { months: number[]; days: number }) | null;
  societe: Said | null;
  soleTrader: Said | null;
};

export type CompanyInput = {
  turnover: number;
  profit: number;
  /** Last year's chargeable income, for the CSR Fund. Null when it was not given. */
  previous: number | null;
  /** Gross income from exporting goods, or null for a business that does not export. */
  exports: number | null;
  /** Income of a kind that is partly exempt, or null where there is none. */
  qualifying: number | null;
  presumptive: boolean;
  /** A resident société pays no income tax itself, and no Fair Share Contribution. */
  societe?: boolean;
};

/** A year's taxes on a company's profit, or the levies a société bears, step by step. */
export function business(input: CompanyInput, f: BusinessTaxFigures) {
  const exempt = input.qualifying == null ? 0 : f.exemption ? Math.min(pct(f.exemption.value, input.qualifying), input.profit) : null;
  const chargeable = exempt == null ? null : Math.max(0, input.profit - exempt);

  const small = input.presumptive && f.presumptive ? input.turnover <= f.presumptive.ceiling : null;
  const presumptive = small && f.presumptive ? pct(f.presumptive.rate, input.turnover) : null;

  // The share of the profit that comes from exports bears the lower rate; the rest, the standard one.
  const share = input.exports == null || input.turnover <= 0 ? 0 : Math.min(input.exports / input.turnover, 1);
  const exported = chargeable == null ? null : chargeable * share;
  let incomeTax: number | null = null;
  let onExports: number | null = null;
  let onRest: number | null = null;
  if (input.societe) incomeTax = 0;
  else if (presumptive != null) incomeTax = presumptive;
  else if (chargeable != null && exported != null && f.rate && (share === 0 || f.exportRate)) {
    onExports = share > 0 && f.exportRate ? pct(f.exportRate.value, exported) : 0;
    onRest = pct(f.rate.value, chargeable - exported);
    incomeTax = onExports + onRest;
  }

  const csrBase = input.previous ?? chargeable;
  const csr = f.csr && csrBase != null ? { base: csrBase, estimated: input.previous == null, amount: pct(f.csr.value, csrBase) } : null;
  const ccr = f.ccr && chargeable != null ? { due: input.turnover > f.ccr.over, amount: input.turnover > f.ccr.over ? pct(f.ccr.rate, chargeable) : 0 } : null;
  // A company taxed wholly at one rate has its rate of contribution in the Act. One taxed at both has not.
  let fairShare: { due: boolean; rate: number | null; amount: number | null } | null = null;
  if (input.societe) fairShare = { due: false, rate: null, amount: 0 };
  else if (f.fairShare && chargeable != null) {
    const due = chargeable > f.fairShare.over;
    const rate = share === 0 ? f.fairShare.rate : share === 1 ? f.fairShare.low : null;
    fairShare = { due, rate: due ? rate : null, amount: !due ? 0 : rate == null ? null : pct(rate, chargeable) };
  }

  const parts = [incomeTax, csr?.amount, ccr?.amount, fairShare?.amount];
  const total = parts.every((p) => p != null) ? parts.reduce<number>((sum, p) => sum + (p ?? 0), 0) : null;
  return { exempt, chargeable, share, exported, small, presumptive, onExports, onRest, incomeTax, csr, ccr, fairShare, total, effective: total != null && input.profit > 0 ? (total / input.profit) * 100 : null };
}

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** When something due a number of months after a month ends falls due: the month, and whether it is one of the early ones. */
export function dueAfter(month: number, months: number, early: BusinessTaxFigures["early"]) {
  const due = (month + months) % 12;
  return { month: due, days: early && early.months.includes(due) ? early.days : 0 };
}

/** The three quarters of an accounting year that ends in a given month (0 to 11), and when each statement is due. */
export function apsQuarters(yearEnd: number, months: number, early: BusinessTaxFigures["early"]) {
  return [0, 1, 2].map((q) => {
    const from = (yearEnd + 1 + q * 3) % 12;
    const to = (from + 2) % 12;
    return { from, to, due: dueAfter(to, months, early) };
  });
}
