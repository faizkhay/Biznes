import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_PICTURE, GREETING, HOLIDAY_LOOKS, PICTURES, SEASONS, type PictureId } from "@/data/themes";
import { accountsOn } from "@/lib/accounts/config";
import { chosenLook } from "@/lib/accounts/owned";

export type Theme = { id: string; picture: PictureId; src: string; small: string; greeting: string; holiday?: string };

type Holiday = { date: string; name: string };

let holidays: Holiday[] | undefined;
/** The public holidays, from the official notice (content/holidays.json). None if the file is not there. */
function readHolidays(): Holiday[] {
  if (holidays) return holidays;
  const file = join(process.cwd(), "content", "holidays.json");
  try {
    const data = existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as { years?: Record<string, Holiday[]> }) : {};
    holidays = Object.values(data.years ?? {}).flat();
  } catch {
    holidays = [];
  }
  return holidays;
}

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
    if (away === 0) return of("holiday", look?.picture ?? base, look?.greeting ?? `Today is ${h.name}`, h.name);
    if (look?.lead && away > 0 && away <= look.lead) return of("holiday", look.picture ?? base, look.greeting, h.name);
  }
  return of(season?.id ?? "everyday", base, GREETING);
}

/** True for the id of a picture the site has. */
export const isPicture = (id: unknown): id is PictureId => typeof id === "string" && Object.hasOwn(PICTURES, id);

/**
 * Today's look, with what the superadmin has chosen by hand laid over it: a picture, a greeting,
 * both or neither (the `site_settings` row, read as a visitor and kept for five minutes). With
 * accounts off, or with nothing chosen, it is the calendar's look and nothing is fetched.
 */
export async function themeNow(): Promise<Theme> {
  const theme = themeFor();
  if (!accountsOn) return theme;
  const { picture, greeting } = await chosenLook();
  return {
    ...theme,
    ...(isPicture(picture) ? { picture, src: PICTURES[picture].src, small: PICTURES[picture].small } : {}),
    ...(greeting ? { greeting } : {}),
  };
}
