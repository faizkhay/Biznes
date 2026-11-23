// The top businesses of the Home page: which they are, in what order, and why. Nothing here is
// chosen by hand and nothing is made up. "Top" means two things, and the page says both: a
// business that pays to come first and has been verified, exactly as in a search; and, after
// those, the listings of the open index about which the most is on record.
//
// The site states this rule on /data. If it changes, that page changes first.
import type { Owned, OwnedIndex } from "@/lib/accounts/owned";
import { index, type Listing } from "@/lib/index";
import { todayInMauritius } from "@/lib/theme";
import { roundOf, turnOf } from "@/lib/turn";

/** How many businesses the Home page shows. */
export const TOP_SHOWN = 8;

/**
 * A full listing: the open index holds a telephone number, a website, opening hours and an
 * address for it. These four are what a visitor needs to reach a business, and a listing that
 * has them all is rare enough to be worth showing.
 */
export const isFull = (l: Listing) => Boolean(l.phone?.length && l.web && l.hours && l.street);

export type TopBusiness = {
  listing: Listing;
  /** The owner's business behind the row, when it is one: it says whether the row is paid and verified, and where its page is. */
  owned?: Owned;
};

export type Top = {
  shown: TopBusiness[];
  /** How many of those shown are verified and on a paid plan. */
  paid: number;
  /** How many full listings the open index holds, from which the others shown are taken. */
  full: number;
  /** How many days it takes for every full listing to have had its turn. */
  round: number;
};

/**
 * The businesses the Home page shows on a day. First the verified businesses on a paid plan,
 * marked as they are in a search; if there are more of them than fit, they take turns by the
 * day. Then the full listings of the open index, in the day's turn, until there are `TOP_SHOWN`.
 * With accounts off there are no paid businesses, and all of them are the day's full listings.
 */
export function topBusinesses(own: OwnedIndex, day = todayInMauritius()): Top {
  const { listings, byId } = index();
  const paying = [...own.byRow]
    .filter(([, business]) => business.paid)
    .map(([row, business]) => ({ listing: byId.get(row) ?? own.overlay?.byId.get(row), owned: business }))
    .filter((top): top is { listing: Listing; owned: Owned } => Boolean(top.listing))
    .sort((a, b) => a.listing.id.localeCompare(b.listing.id));
  const paid = turnOf(paying, TOP_SHOWN, day);
  const taken = new Set(paid.map((top) => top.listing.id));
  // In the order of their ids, so the day's turn does not depend on how the index happens to be sorted.
  const full = listings.filter(isFull).sort((a, b) => a.id.localeCompare(b.id));
  const room = TOP_SHOWN - paid.length;
  const open = full.filter((l) => !taken.has(l.id));
  return {
    shown: [...paid, ...turnOf(open, room, day).map((listing) => ({ listing, owned: own.byRow.get(listing.id) }))],
    paid: paid.length,
    full: full.length,
    round: roundOf(open.length, room),
  };
}
