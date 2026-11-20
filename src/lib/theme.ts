import { holidays } from "./holidays";
import { DEFAULT_PICTURE, GREETING, HOLIDAY_LOOKS, PICTURES, SEASONS, type PictureId } from "@/data/themes";

export type Theme = { id: string; picture: PictureId; src: string; small: string; greeting: string; holiday?: string };

/** The public holidays of every year on the notices, as one list. */
const readHolidays = () => Object.values(holidays()?.years ?? {}).flat();

/** Today's date in Mauritius (UTC+4, no summer time), as YYYY-MM-DD. */
export const todayInMauritius = (now = Date.now()) => new Date(now + 4 * 3600e3).toISOString().slice(0, 10);

const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 864e5);

/** The look for a day: a holiday's on its day (and its lead-in), else the season's, else the default. */
export function themeFor(day = todayInMauritius()): Theme {
  const of = (id: string, picture: PictureId, greeting: string, holiday?: string): Theme => ({ id, picture, src: PICTURES[picture].src, small: PICTURES[picture].small, greeting, holiday });
  const md = day.slice(5);
  const season = SEASONS.find((s) => (s.from <= s.to ? md >= s.from && md <= s.to : md >= s.from || md <= s.to));
  const base = season?.picture ?? DEFAULT_PICTURE;
  for (const h of readHolidays()) {
    const away = daysBetween(day, h.date);
    const look = HOLIDAY_LOOKS.find((l) => l.match.test(h.name));
    // A day of remembrance has no greeting of its own: the everyday one stands.
    if (away === 0) return of("holiday", look?.picture ?? base, look?.greeting ?? GREETING, h.name);
    if (look?.lead && away > 0 && away <= look.lead) return of("holiday", look.picture ?? base, look.greeting, h.name);
  }
  return of(season?.id ?? "everyday", base, GREETING);
}
