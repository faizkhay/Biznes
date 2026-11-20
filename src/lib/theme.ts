import { holidays } from "./holidays";
import { DEFAULT_PICTURE, GREETING, HOLIDAY_LOOKS, PICTURES, SEASONS, type PictureId } from "@/data/themes";
import { accountsOn } from "@/lib/accounts/config";
import { chosenLook } from "@/lib/accounts/owned";

export type Theme = {
  id: string;
  /** The picture the calendar gives, by its id among the site's own. A picture chosen by hand leaves this as it is. */
  picture: PictureId;
  src: string;
  small: string;
  greeting: string;
  holiday?: string;
  /** The id of the picture showing, when the superadmin has chosen one by hand: one of the site's own, or one that was uploaded. */
  chosen?: string;
};

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

/** True for the id of a picture the site has. */
export const isPicture = (id: unknown): id is PictureId => typeof id === "string" && Object.hasOwn(PICTURES, id);

/**
 * Today's look, with what the superadmin has chosen by hand laid over it (the `site_settings` row
 * and the pictures they have uploaded, read as a visitor and kept for five minutes).
 *
 * The picture is chosen one of three ways: by the calendar, as it always was; one picture, fixed;
 * or a round of chosen pictures, a new one each day in their order. A chosen picture is one the
 * site is built with or one that was uploaded: an uploaded one has a single size, used on a phone
 * and on a desk alike. The greeting is the calendar's unless one has been written. With accounts
 * off, or with nothing chosen, this is the calendar's look and nothing is fetched.
 */
export async function themeNow(): Promise<Theme> {
  const theme = themeFor();
  if (!accountsOn) return theme;
  const look = await chosenLook();
  const round = look.mode === "rotation" ? look.pictures.filter((id) => isPicture(id) || look.uploaded.some((u) => u.id === id)) : [];
  // The day's turn in the round: the days since 1970, so everyone sees the same picture on the same day.
  const today = Math.floor(Date.parse(todayInMauritius()) / 864e5);
  const chosen = look.mode === "fixed" ? look.picture : round.length ? round[today % round.length] : null;
  const uploaded = look.uploaded.find((u) => u.id === chosen);
  return {
    ...theme,
    ...(isPicture(chosen) ? { picture: chosen, src: PICTURES[chosen].src, small: PICTURES[chosen].small, chosen } : uploaded ? { src: uploaded.src, small: uploaded.src, chosen: uploaded.id } : {}),
    ...(look.greeting ? { greeting: look.greeting } : {}),
  };
}
