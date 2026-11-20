import "server-only";
import { unstable_cache } from "next/cache";
import type { PlanId } from "@/data/site";
import { index, type Listing } from "@/lib/index";
import type { Overlay } from "@/lib/search";
import { accountsOn, KEEP, mediaUrl, TAG_OWNED, TAG_SETTINGS } from "./config";
import { publicDb } from "./server";
import type { Showcase } from "./showcase";
import { isPlan, planNow } from "./types";

/**
 * The businesses listed by their owners, as the public sees them: the live ones, read from the
 * accounts database as a visitor who is not signed in, kept for five minutes, and laid over the
 * open index. The index itself (src/lib/index.ts) is never touched.
 *
 * A read is tagged, so an admin's action makes it fresh at once (`updateTag(TAG_OWNED)`). If the
 * database cannot be reached the last good read is used, or none: a page never fails for it.
 */

export type OwnedService = { id: string; name: string; description: string; price: number | null; minutes: number | null; /** A thing sold, not a thing done. */ kind: "service" | "product" };

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
  /**
   * What a paid plan adds to its page: a line, hours, pictures, and a menu for a food outlet.
   * Absent on the free plan, and when the owner has added nothing. Read it with `showcaseOf`.
   */
  showcase?: Showcase;
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
type ShowRow = { business_id: string; tagline: string; hours: string[]; cover: string; photos: string[] };
type SectionRow = { id: string; business_id: string; title: string; position: number };
type ItemRow = { section_id: string; name: string; description: string; price_mur: number | null; position: number };
type KindRow = { id: string; kind: string };
/** What the second round of the accounts added. Each part is empty if its table could not be read. */
type More = { at: number; showcases: ShowRow[]; sections: SectionRow[]; items: ItemRow[]; kinds: KindRow[] };

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

/** A part that could not be read is empty, not fatal: the businesses themselves are still shown. */
const orNone = <T>(rows: Promise<T[]>): Promise<T[]> => rows.catch(() => []);

// The showcases and the menus. Kept apart from the read above, so that a database which does not
// have their tables yet (the later migrations not applied) still shows every business.
const readMore = unstable_cache(
  async (): Promise<More> => {
    const [showcases, sections, items, kinds] = await Promise.all([
      orNone(every<ShowRow>("showcases", "business_id, tagline, hours, cover, photos", "business_id")),
      orNone(every<SectionRow>("menu_sections", "id, business_id, title, position", "position")),
      orNone(every<ItemRow>("menu_items", "section_id, name, description, price_mur, position", "position")),
      orNone(every<KindRow>("services", "id, kind", "id", ["active", true])),
    ]);
    return { showcases, sections, items, kinds, at: Date.now() };
  },
  ["biznes-owned-more-v1"],
  { revalidate: KEEP, tags: [TAG_OWNED] },
);

/** The showcase of each business that has one, by its id: a paid plan's line, hours, pictures and menu. */
function showcases(more: More, food: (category: string) => boolean, businesses: BusinessRow[]): Map<string, Showcase> {
  const out = new Map<string, Showcase>();
  const itemsOf = new Map<string, ItemRow[]>();
  for (const item of more.items) itemsOf.set(item.section_id, [...(itemsOf.get(item.section_id) ?? []), item]);
  const rowOf = new Map(more.showcases.map((s) => [s.business_id, s]));
  for (const b of businesses) {
    // The database shows these to a visitor only for a live business on a paid plan; the same is asked here.
    if (planNow(isPlan(b.plan) ? b.plan : "free", b.plan_until) === "free") continue;
    const row = rowOf.get(b.id);
    const menu = food(b.category)
      ? more.sections
          .filter((s) => s.business_id === b.id)
          .sort((x, y) => x.position - y.position)
          .map((s) => ({ title: s.title, items: (itemsOf.get(s.id) ?? []).sort((x, y) => x.position - y.position).map((i) => ({ name: i.name, ...(i.description ? { description: i.description } : {}), price: i.price_mur })) }))
          .filter((s) => s.items.length > 0)
      : [];
    const showcase: Showcase = {
      ...(row?.cover ? { cover: mediaUrl(row.cover) } : {}),
      photos: (row?.photos ?? []).map(mediaUrl),
      ...(row?.tagline ? { tagline: row.tagline } : {}),
      ...(row?.hours?.length ? { hours: row.hours } : {}),
      menu,
    };
    if (showcase.cover || showcase.photos.length || showcase.tagline || showcase.hours || menu.length) out.set(b.id, showcase);
  }
  return out;
}

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

function build(data: Read, more: More): OwnedIndex {
  const { byId, categoryById } = index();
  const kindOf = new Map(more.kinds.map((k) => [k.id, k.kind]));
  const shown = showcases(more, (category) => categoryById.get(category)?.group === "eat", data.businesses);
  const servicesOf = new Map<string, OwnedService[]>();
  for (const s of data.services) {
    const list = servicesOf.get(s.business_id) ?? [];
    list.push({ id: s.id, name: s.name, description: s.description, price: s.price_mur, minutes: s.minutes, kind: kindOf.get(s.id) === "product" ? "product" : "service" });
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
      ...(shown.has(b.id) ? { showcase: shown.get(b.id) } : {}),
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
type Kept = { owned?: { at: number; index: OwnedIndex }; ownedFailedAt: number; ownedAsked?: Promise<[Read, More]>; look?: Look; lookFailedAt: number; lookAsked?: Promise<Look & { at: number }> };
const kept = ((globalThis as { __biznesAccounts?: Kept }).__biznesAccounts ??= { ownedFailedAt: 0, lookFailedAt: 0 });

/** Every live business listed by its owner. Empty when accounts are off. */
export async function owned(): Promise<OwnedIndex> {
  if (!accountsOn) return NONE;
  if (Date.now() - kept.ownedFailedAt < REST_MS) return kept.owned?.index ?? NONE;
  try {
    // Pages made at the same moment share one read.
    const [data, more] = await (kept.ownedAsked ??= Promise.all([read(), readMore()]).finally(() => (kept.ownedAsked = undefined)));
    // Each read carries the moment it was made: a new one of either means the index is built again.
    const at = data.at + more.at;
    if (kept.owned?.at !== at) kept.owned = { at, index: build(data, more) };
    return kept.owned.index;
  } catch (err) {
    kept.ownedFailedAt = Date.now();
    console.warn(`[accounts] the owners' businesses could not be read: ${err instanceof Error ? err.message : err}`);
    return kept.owned?.index ?? NONE;
  }
}

/** The live business that has claimed a listing in the open index, if one has. */
export const claimOf = async (listingId: string): Promise<Owned | undefined> => (accountsOn ? (await owned()).byListing.get(listingId) : undefined);

/** A picture the superadmin uploaded for behind the page: its id, and its address. */
export type UploadedPicture = { id: string; label: string; src: string };

/**
 * What the superadmin has chosen for the look of the site. `mode` says how the picture behind the
 * page is chosen: by the calendar, one `picture` fixed, or a round of `pictures`, a new one each
 * day. A picture is named by its id in src/data/themes.ts, or, for one that was uploaded, by its
 * id among `uploaded`. A null greeting leaves the greeting to the calendar.
 */
export type Look = { mode: "calendar" | "fixed" | "rotation"; picture: string | null; pictures: string[]; greeting: string | null; uploaded: UploadedPicture[] };

const NO_LOOK: Look = { mode: "calendar", picture: null, pictures: [], greeting: null, uploaded: [] };

const readLook = unstable_cache(
  async (): Promise<Look & { at: number }> => {
    const settings = () => publicDb().from("site_settings");
    let { data, error } = await settings().select("picture, greeting, mode, pictures").limit(1).maybeSingle<{ picture: string | null; greeting: string | null; mode?: string; pictures?: string[] }>();
    // A database from before there was a choice of how: a picture set there was a fixed one.
    if (error) ({ data, error } = await settings().select("picture, greeting").limit(1).maybeSingle());
    if (error) throw new Error(`site_settings: ${error.message}`);
    const uploaded = await orNone(every<{ id: string; path: string; label: string }>("site_pictures", "id, path, label", "created_at"));
    const mode = data?.mode === "rotation" ? "rotation" : data?.mode === "calendar" ? "calendar" : data?.mode === "fixed" || data?.picture ? "fixed" : "calendar";
    return { mode, picture: data?.picture ?? null, pictures: data?.pictures ?? [], greeting: data?.greeting ?? null, uploaded: uploaded.map((u) => ({ id: u.id, label: u.label, src: mediaUrl(u.path) })), at: Date.now() };
  },
  ["biznes-settings-v2"],
  { revalidate: KEEP, tags: [TAG_SETTINGS] },
);

/** The look chosen by hand, or the calendar's: when accounts are off, or the database cannot be reached. */
export async function chosenLook(): Promise<Look> {
  const none = NO_LOOK;
  if (!accountsOn) return none;
  if (Date.now() - kept.lookFailedAt < REST_MS) return kept.look ?? none;
  try {
    const { at: _at, ...look } = await (kept.lookAsked ??= readLook().finally(() => (kept.lookAsked = undefined)));
    return (kept.look = look);
  } catch (err) {
    kept.lookFailedAt = Date.now();
    console.warn(`[accounts] the site's settings could not be read: ${err instanceof Error ? err.message : err}`);
    return kept.look ?? none;
  }
}
