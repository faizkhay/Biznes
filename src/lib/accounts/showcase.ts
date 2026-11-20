// What a business on a paid plan adds to its page beyond its details: pictures, a line of its own,
// and, for a food outlet, its menu. The public pages read it through `showcaseOf`; the accounts
// work fills it from the database. With accounts off, or for a business with none, it is undefined.
//
// It is read with the business itself (src/lib/accounts/owned.ts): as a visitor who is not signed
// in, kept for five minutes, and made fresh at once when the owner changes it. The database shows
// a showcase or a menu to a visitor only while the business is live and its paid plan is good
// today, and a menu only for a food outlet, so a business that lapses loses them by itself.

export type MenuItem = { name: string; description?: string; price?: number | null };
export type MenuSection = { title: string; items: MenuItem[] };

export type Showcase = {
  /** A wide picture for the top of the page. An address on the site's own storage. */
  cover?: string;
  /** More pictures, in the owner's order. */
  photos: string[];
  /** A line of the owner's own, under the name. */
  tagline?: string;
  /** Opening hours in the owner's words, a line a day. */
  hours?: string[];
  /** For a food outlet on Biznes Go or Grow: its menu. Prices in rupees. */
  menu: MenuSection[];
};

/** The showcase of an owner-listed business, by its id. */
export async function showcaseOf(businessId: string): Promise<Showcase | undefined> {
  // Asked for only here, so a page with accounts off never loads the accounts' code.
  const { accountsOn } = await import("./config");
  if (!accountsOn) return undefined;
  const { owned } = await import("./owned");
  return (await owned()).byId.get(businessId)?.showcase;
}
