import "server-only";
import { unstable_cache } from "next/cache";
import type { PlanId } from "@/data/site";
import { index, type Listing } from "@/lib/index";
import type { Overlay } from "@/lib/search";
import { accountsOn, KEEP, TAG_OWNED, TAG_SETTINGS } from "./config";
import { publicDb } from "./server";
import { isPlan, planNow } from "./types";

/**
 * The businesses listed by their owners, as the public sees them: the live ones, read from the
 * accounts database as a visitor who is not signed in, kept for five minutes, and laid over the
 * open index. The index itself (src/lib/index.ts) is never touched.
 *
 * A read is tagged, so an admin's action makes it fresh at once (`updateTag(TAG_OWNED)`). If the
 * database cannot be reached the last good read is used, or none: a page never fails for it.
 */

export type OwnedService = { id: string; name: string; description: string; price: number | null; minutes: number | null };

export type Owned = {
  id: string;
  slug: string;
  /** The listing in the open index this business has claimed, when it has. */
  listingId: string | null;
  name: string;
  category: string;
  town: string;
  address: string;
  phone: string;
  website: string;
  about: string;
  /** Checked by a person to be a real business. */
  verified: boolean;
  /** The plan it is on today: a paid plan past its last day is free. */
  plan: PlanId;
  /** Verified and on Biznes Go or Biznes Grow today: shown first among the listings that answer, and always marked. */
  paid: boolean;
  /** On Biznes Grow today: it shows its services and takes requests for bookings. */
  books: boolean;
  services: OwnedService[];
  /**
   * How a customer pays it by MCB Juice: the mobile number and the name the account is under.
   * Details only, written by the owner. Both are empty unless the business is on Biznes Grow today
   * and has given them: the database shows them to nobody otherwise.
   */
  juiceNumber: string;
  juiceName: string;
  /** Its page: the listing's own when it claimed one, else a page of its own. */
  path: string;
};

export type OwnedIndex = {
  all: Owned[];
  byId: Map<string, Owned>;
  bySlug: Map<string, Owned>;
  /** By the id of the listing it claimed. */
  byListing: Map<string, Owned>;
  /** By the id of the row it is shown as in a list: the claimed listing's, or its own. */
  byRow: Map<string, Owned>;
  /** What the search lays over the index. Absent when there is nothing to lay. */
  overlay?: Overlay;
};

const NONE: OwnedIndex = { all: [], byId: new Map(), bySlug: new Map(), byListing: new Map(), byRow: new Map() };

type BusinessRow = { id: string; slug: string; listing_id: string | null; name: string; category: string; town: string; address: string; phone: string; website: string; about: string; plan: string; plan_until: string | null; verified: boolean };
type ServiceRow = { id: string; business_id: string; name: string; description: string; price_mur: number | null; minutes: number | null };
type PayRow = { business_id: string; juice_number: string; juice_name: string };
type Read = { at: number; businesses: BusinessRow[]; services: ServiceRow[]; pay: PayRow[] };

const PAGE = 1000;
const MOST = 20000;

/** Every row of a public read, a thousand at a time: the API gives no more in one answer. */
async function every<T>(table: string, columns: string, order: string, narrow?: [string, string | boolean]): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; from < MOST; from += PAGE) {
    const all = publicDb().from(table).select(columns);
    const { data, error } = await (narrow ? all.eq(narrow[0], narrow[1]) : all).order(order).range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

// A failed read throws, so it is never kept: the next request tries again.
const read = unstable_cache(
  async (): Promise<Read> => ({
    businesses: await every<BusinessRow>("businesses", "id, slug, listing_id, name, category, town, address, phone, website, about, plan, plan_until, verified", "id", ["status", "live"]),
    services: await every<ServiceRow>("services", "id, business_id, name, description, price_mur, minutes", "created_at", ["active", true]),
    // The database gives a visitor these only for a live business on Biznes Grow.
    pay: await every<PayRow>("pay_details", "business_id, juice_number, juice_name", "business_id"),
    at: Date.now(),
  }),
  ["biznes-owned-v1"],
  { revalidate: KEEP, tags: [TAG_OWNED] },
);

/** An owner's business as a row among listings, for one not in the open index. */
function asListing(o: Owned): Listing {
  const { placeBySlug } = index();
  const at = placeBySlug.get(o.town);
  const town = at?.kind === "area" && at.within ? placeBySlug.get(at.within) : at;
  return {
    id: `own-${o.id}`,
    slug: o.slug,
    name: o.name,
    cat: o.category,
    ...(o.address ? { street: o.address } : {}),
    ...(o.phone ? { phone: [o.phone] } : {}),
    ...(o.website ? { web: o.website } : {}),
    ...(o.about ? { about: o.about } : {}),
    ...(town ? { place: town.name, placeSlug: town.slug, district: town.district } : {}),
    ...(at?.kind === "area" ? { area: at.name, areaSlug: at.slug } : {}),
    src: {},
    // The crawler's own measure of how much is known (crawler/build.mjs), for what an owner gives.
    full: (o.phone ? 2 : 0) + (o.website ? 2 : 0) + (o.address ? 1 : 0) + (o.about ? 1 : 0),
  };
}

function build(data: Read): OwnedIndex {
  const { byId } = index();
  const servicesOf = new Map<string, OwnedService[]>();
  for (const s of data.services) {
    const list = servicesOf.get(s.business_id) ?? [];
    list.push({ id: s.id, name: s.name, description: s.description, price: s.price_mur, minutes: s.minutes });
    servicesOf.set(s.business_id, list);
  }
  const payOf = new Map(data.pay.map((p) => [p.business_id, p]));
  const all: Owned[] = data.businesses.map((b) => {
    const plan = planNow(isPlan(b.plan) ? b.plan : "free", b.plan_until);
    const books = plan === "grow";
    const pay = books ? payOf.get(b.id) : undefined;
    const juice = pay?.juice_number && pay.juice_name ? pay : undefined;
    // A claim on a listing the index no longer holds stands as a business of its own.
    const listing = b.listing_id ? byId.get(b.listing_id) : undefined;
    return {
      id: b.id,
      slug: b.slug,
      listingId: listing?.id ?? null,
      path: listing ? `/b/${listing.slug}` : `/biz/${b.slug}`,
      name: b.name,
      category: b.category,
      town: b.town,
      address: b.address,
      phone: b.phone,
      website: b.website,
      about: b.about,
      verified: b.verified,
      plan,
      paid: b.verified && plan !== "free",
      books,
      services: books ? (servicesOf.get(b.id) ?? []) : [],
      juiceNumber: juice?.juice_number ?? "",
      juiceName: juice?.juice_name ?? "",
    };
  });
  const extras: Listing[] = [];
  const byRow = new Map<string, Owned>();
  const paid = new Set<string>();
  for (const o of all) {
    let row = o.listingId;
    if (!row) {
      const listing = asListing(o);
      extras.push(listing);
      row = listing.id;
    }
    byRow.set(row, o);
    if (o.paid) paid.add(row);
  }
  return {
    all,
    byId: new Map(all.map((o) => [o.id, o])),
    bySlug: new Map(all.map((o) => [o.slug, o])),
    byListing: new Map(all.filter((o) => o.listingId).map((o) => [o.listingId!, o])),
    byRow,
    overlay: all.length ? { stamp: data.at, extras, byId: new Map(extras.map((l) => [l.id, l])), paid } : undefined,
  };
}

/** After a failed read, how long to wait before asking again. */
const REST_MS = 30_000;

// What was last read, and when a read last failed. Kept for the life of the server, as the index
// is, and shared by every page however the server's code is split.
type Kept = { owned?: { at: number; index: OwnedIndex }; ownedFailedAt: number; ownedAsked?: Promise<Read>; look?: Look; lookFailedAt: number; lookAsked?: Promise<Look> };
const kept = ((globalThis as { __biznesAccounts?: Kept }).__biznesAccounts ??= { ownedFailedAt: 0, lookFailedAt: 0 });

/** Every live business listed by its owner. Empty when accounts are off. */
export async function owned(): Promise<OwnedIndex> {
  if (!accountsOn) return NONE;
  if (Date.now() - kept.ownedFailedAt < REST_MS) return kept.owned?.index ?? NONE;
  try {
    // Pages made at the same moment share one read.
    const data = await (kept.ownedAsked ??= read().finally(() => (kept.ownedAsked = undefined)));
    if (kept.owned?.at !== data.at) kept.owned = { at: data.at, index: build(data) };
    return kept.owned.index;
  } catch (err) {
    kept.ownedFailedAt = Date.now();
    console.warn(`[accounts] the owners' businesses could not be read: ${err instanceof Error ? err.message : err}`);
    return kept.owned?.index ?? NONE;
  }
}

/** The live business that has claimed a listing in the open index, if one has. */
export const claimOf = async (listingId: string): Promise<Owned | undefined> => (accountsOn ? (await owned()).byListing.get(listingId) : undefined);

/** What the superadmin has chosen for the picture and the greeting. Null leaves it to the calendar. */
export type Look = { picture: string | null; greeting: string | null };

const readLook = unstable_cache(
  async (): Promise<Look & { at: number }> => {
    const { data, error } = await publicDb().from("site_settings").select("picture, greeting").limit(1).maybeSingle();
    if (error) throw new Error(`site_settings: ${error.message}`);
    return { picture: data?.picture ?? null, greeting: data?.greeting ?? null, at: Date.now() };
  },
  ["biznes-settings-v1"],
  { revalidate: KEEP, tags: [TAG_SETTINGS] },
);

/** The look chosen by hand, or nulls: when accounts are off, or the database cannot be reached. */
export async function chosenLook(): Promise<Look> {
  const none = { picture: null, greeting: null };
  if (!accountsOn) return none;
  if (Date.now() - kept.lookFailedAt < REST_MS) return kept.look ?? none;
  try {
    const { picture, greeting } = await (kept.lookAsked ??= readLook().finally(() => (kept.lookAsked = undefined)));
    return (kept.look = { picture, greeting });
  } catch (err) {
    kept.lookFailedAt = Date.now();
    console.warn(`[accounts] the site's settings could not be read: ${err instanceof Error ? err.message : err}`);
    return kept.look ?? none;
  }
}
