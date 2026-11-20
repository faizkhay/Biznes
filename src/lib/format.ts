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

/** Where to see a point on a map, and how to be taken to it. */
export const mapHref = (lat: number, lon: number) => `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}`;
export const directionsHref = (lat: number, lon: number) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

/** A map element's own page: "node/123" is https://www.openstreetmap.org/node/123. */
export const osmHref = (ref: string) => `https://www.openstreetmap.org/${ref}`;
export const wikidataHref = (id: string) => `https://www.wikidata.org/wiki/${id}`;
