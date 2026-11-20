/** How figures, dates, telephone numbers and opening hours are written on the site. */

const numbers = new Intl.NumberFormat("en-GB");
export const count = (n: number) => numbers.format(n);

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** "2026-11-20" as "20 November 2026". A string that is not a date is returned as it is. */
export function day(iso?: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : (iso ?? "");
}

/** "+230 5450 8600" as a link: "tel:+23054508600". */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/** A web address as people say it: "example.mu/shop". */
export function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    return (u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/$/, "")).slice(0, 48);
  } catch {
    return url;
  }
}

const DAYS: Record<string, string> = { Mo: "Monday", Tu: "Tuesday", We: "Wednesday", Th: "Thursday", Fr: "Friday", Sa: "Saturday", Su: "Sunday", PH: "Public holidays" };

/**
 * Opening hours as the map writes them ("Mo-Fr 08:00-17:00; Sa 08:00-12:00"), in words, one rule a
 * line. A rule this does not understand is shown exactly as the map has it, never guessed at.
 */
export function hoursLines(raw: string): string[] {
  if (raw.trim() === "24/7") return ["Open all day, every day"];
  return raw
    .split(";")
    .map((rule) => rule.trim())
    .filter(Boolean)
    .map((rule) => {
      const m = /^((?:Mo|Tu|We|Th|Fr|Sa|Su|PH)(?:\s*[-,]\s*(?:Mo|Tu|We|Th|Fr|Sa|Su|PH))*)\s+(.+)$/.exec(rule);
      if (!m) return /^\d/.test(rule) ? `Every day ${times(rule)}` : rule;
      const days = m[1]
        .split(",")
        .map((part) => {
          const [from, to] = part.trim().split(/\s*-\s*/);
          return to ? `${DAYS[from]} to ${DAYS[to]}` : DAYS[from];
        })
        .join(", ");
      return `${days}: ${times(m[2])}`;
    });
}
const times = (text: string) => (/^(off|closed)$/i.test(text.trim()) ? "closed" : text.replace(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/g, "$1 to $2").replace(/,\s*/g, " and "));

const WEEK = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;
const SPAN = /^\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}(?:\s*,\s*\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})*$/;

/** A day of the week and what the map records for it: its hours, "closed", or nothing at all. */
export type DayHours = { code: (typeof WEEK)[number]; day: string; /** Each a span as written, "08:00-17:00". */ spans: string[]; closed: boolean };

/**
 * Opening hours as the map writes them, day by day, Monday to Sunday. Only the plain rules are
 * read: days or runs of days, then spans of time or "off". A later rule for a day replaces an
 * earlier one, as the map's own rules say. A day no rule names is left with nothing recorded:
 * it is never called closed on a guess. Anything else in the text (months, sunrise, a comment)
 * gives null, and the page then shows the text rule by rule as the map has it (`hoursLines`).
 */
export function hoursByDay(raw: string): { days: DayHours[]; holidays?: string } | null {
  const days: DayHours[] = WEEK.map((code) => ({ code, day: DAYS[code], spans: [], closed: false }));
  let holidays: string | undefined;
  const text = raw.trim();
  const rules = text === "24/7" ? ["Mo-Su 00:00-24:00"] : text.split(";").map((rule) => rule.trim()).filter(Boolean);
  if (!rules.length) return null;
  for (const rule of rules) {
    const m = /^((?:Mo|Tu|We|Th|Fr|Sa|Su|PH)(?:\s*[-,]\s*(?:Mo|Tu|We|Th|Fr|Sa|Su|PH))*)\s+(.+)$/.exec(rule);
    const when = m ? m[2].trim() : rule;
    const off = /^(off|closed)$/i.test(when);
    if (!off && !SPAN.test(when)) return null;
    const spans = off ? [] : when.split(",").map((span) => span.replace(/\s+/g, ""));
    const named: string[] = [];
    for (const part of (m ? m[1] : "Mo-Su").split(",")) {
      const [from, to] = part.trim().split(/\s*-\s*/);
      if (!to) named.push(from);
      else if (from === "PH" || to === "PH") return null;
      else for (let i = WEEK.indexOf(from as (typeof WEEK)[number]), n = 0; n < 7; i = (i + 1) % 7, n++) {
        named.push(WEEK[i]);
        if (WEEK[i] === to) break;
      }
    }
    for (const code of named) {
      if (code === "PH") holidays = off ? "closed" : spans.map(spanWords).join(" and ");
      else Object.assign(days[WEEK.indexOf(code as (typeof WEEK)[number])], { spans, closed: off });
    }
  }
  return { days, holidays };
}
/** "08:00-17:00" as "08:00 to 17:00", and a whole day as that. */
export const spanWords = (span: string) => (span === "00:00-24:00" ? "open all day" : span.replace("-", " to "));

/** Where to see a point on a map, and how to be taken to it. */
export const mapHref = (lat: number, lon: number) => `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}`;
export const directionsHref = (lat: number, lon: number) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
/** The same, for a business known by its address and not by a position on the map. */
export const directionsToHref = (address: string) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

/** A map element's own page: "node/123" is https://www.openstreetmap.org/node/123. */
export const osmHref = (ref: string) => `https://www.openstreetmap.org/${ref}`;
export const wikidataHref = (id: string) => `https://www.wikidata.org/wiki/${id}`;

/** The id a heading or a term is reached by: "Who must register" is "who-must-register". */
export const anchorOf = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** A distance for a reader: "350 m", "1.2 km", "14 km". */
export const distance = (km: number) => (km < 1 ? `${Math.round(km * 20) * 50} m` : km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`);

/** "2021-11-23" as "November 2021", for saying how old a record is. */
export function month(iso?: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(iso ?? "");
  return m ? `${MONTHS[Number(m[2]) - 1]} ${m[1]}` : "";
}

/** Whole years between a date and today. */
export const yearsSince = (iso?: string) => (iso ? (Date.now() - new Date(iso).getTime()) / (365.25 * 24 * 3600 * 1000) : 0);
