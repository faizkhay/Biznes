import "server-only";
import { unstable_cache } from "next/cache";
import { index } from "@/lib/index";
import { sponsorship } from "@/lib/shop";
import { accountsOn, KEEP, mediaUrl, TAG_ADS } from "./config";
import { every, orNone, owned } from "./owned";
import { publicDb } from "./server";
import { mauritiusToday, thisMonth, type AdPlaceId } from "./types";

/**
 * The advertisements the public may be shown: read as a visitor who is not signed in, so the
 * database itself gives only those that are approved, paid, of a live business and running this
 * month. Kept for five minutes, and made fresh at once when an admin approves one or marks it paid.
 */

type AdRow = { id: string; business_id: string; headline: string; line: string; artwork: string; place: string; months: string[]; /** The business's website as it was when an admin approved the advertisement, when it leads there. */ link_url?: string };

const COLUMNS = "id, business_id, headline, line, artwork, place, months";
const readAds = unstable_cache(
  // A database from before the address was copied at approval has no such column: there an
  // advertisement leads to the business's page on this site, which is always safe.
  async (): Promise<AdRow[]> => orNone(every<AdRow>("ads", `${COLUMNS}, link_url`, "id").catch(() => every<AdRow>("ads", COLUMNS, "id"))),
  ["biznes-ads-v2"],
  { revalidate: KEEP, tags: [TAG_ADS] },
);

/** An address on the web and nothing else: never script, never a file. */
const onTheWeb = (address: string | undefined) => (address && /^https?:\/\//i.test(address) ? address : "");

/** An advertisement as a page shows it. */
export type ShownAd = { id: string; headline: string; line: string; href: string; /** True when it leads off the site, to the business's own website. */ external: boolean; image?: string; /** The business it is from. */ by: string };

/**
 * The advertisement for a place on the site today, or none. A place holds one at a time: when
 * several run in the same month, each takes its turn by the day.
 */
export async function adFor(place: AdPlaceId): Promise<ShownAd | undefined> {
  if (!accountsOn) return undefined;
  const month = thisMonth();
  const { byId } = await owned();
  const running = (await readAds().catch(() => [] as AdRow[]))
    // The database has already asked all of this. It is asked again, so a stale read shows nothing it should not.
    .filter((ad) => ad.place === place && Array.isArray(ad.months) && ad.months.includes(month) && byId.has(ad.business_id))
    .sort((a, b) => a.id.localeCompare(b.id));
  if (!running.length) return undefined;
  const ad = running[Math.floor(Date.parse(mauritiusToday()) / 864e5) % running.length];
  const business = byId.get(ad.business_id)!;
  // Where it leads is what the admin approved, kept on the advertisement itself. The business's
  // own row is not asked: its owner may change that at any time.
  const approved = onTheWeb(ad.link_url);
  return { id: ad.id, headline: ad.headline, line: ad.line, href: approved || business.path, external: Boolean(approved), ...(ad.artwork ? { image: mediaUrl(ad.artwork) } : {}), by: business.name };
}

/** What a place in the pocket guide costs a month, from the guide's own rules. Null where a place has no price yet. */
export function placePrice(place: string): number | null {
  if (!place.startsWith("guide-")) return null;
  return sponsorship()?.options.find((option) => option.id === place.slice(6))?.price ?? null;
}

/** A sponsor of an edition of the pocket guide, in the shape the shop and the PDF use. */
export type GuideSponsor = { name: string; line?: string; town?: string; phone?: string; web?: string; option: string; months: string[]; /** The address of its picture, when it has one. */ artwork?: string };

/**
 * The sponsors of the pocket guide for a month ("2026-12"): the approved, paid guide
 * advertisements of live businesses, read from the `guide_sponsors` view as a visitor. Empty with
 * accounts off, or if the database cannot be reached. A script with no access to this file reads
 * the same view over the API:
 *   GET <NEXT_PUBLIC_SUPABASE_URL>/rest/v1/guide_sponsors?month=eq.2026-12   with the header `apikey: <the publishable key>`
 * where `town` is a place's slug in the open index and `artwork` a path in the `media` bucket.
 */
export async function guideSponsors(month: string): Promise<GuideSponsor[]> {
  if (!accountsOn || !/^\d{4}-\d{2}$/.test(month)) return [];
  const { data, error } = await publicDb().from("guide_sponsors").select("month, option, name, line, town, phone, website, artwork").eq("month", month).order("name");
  if (error || !data) return [];
  const { placeBySlug } = index();
  const order = ["page", "panel", "listing"];
  return (data as { option: string; name: string; line: string; town: string; phone: string; website: string; artwork: string }[])
    .map((s) => ({ name: s.name, option: s.option, months: [month], ...(s.line ? { line: s.line } : {}), ...(placeBySlug.get(s.town) ? { town: placeBySlug.get(s.town)!.name } : {}), ...(s.phone ? { phone: s.phone } : {}), ...(s.website ? { web: s.website } : {}), ...(s.artwork ? { artwork: mediaUrl(s.artwork) } : {}) }))
    .sort((a, b) => order.indexOf(a.option) - order.indexOf(b.option));
}
