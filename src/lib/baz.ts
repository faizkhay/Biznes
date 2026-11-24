// Baz Manzer's own addresses. The section stands by itself and installs as an app of its own, so
// everything a person does while looking for somewhere to eat has an address under /baz-manzer:
// a kind of place, a kind of food, a town, a place's own page, the search and the saved places.
// An installed app that left its own scope each time a restaurant was opened would not be an app.
//
// This file holds no data and reads none, so the header, the bar and the offer to install can use
// it in the browser. The lists behind the addresses are src/lib/food.ts.
import { BAZ } from "@/data/site";

const ROOT = BAZ.href;

/**
 * The app's two colours, for the places a token cannot reach: the manifest, and the theme colour
 * in the head of the section's pages. `theme` is the awning's red (--palette-coral), for the bar
 * at the top of a phone, which so becomes the top of the awning; `paper` is the sheet
 * (--palette-cream), behind the icon while the app opens.
 */
export const BAZ_COLOURS = { theme: "#f14949", paper: "#0a1639" } as const;

/** True on every page of the section: its first page and everything beneath it. */
export const inBaz = (pathname: string) => pathname === ROOT || pathname.startsWith(`${ROOT}/`);

export const baz = {
  home: ROOT,
  /** A kind of place ("restaurants"), and the same kind in one town. */
  kind: (id: string, town?: string) => `${ROOT}/kind/${id}${town ? `/${town}` : ""}`,
  foods: `${ROOT}/food`,
  /** A kind of food ("chinese"). */
  food: (id: string) => `${ROOT}/food/${id}`,
  towns: `${ROOT}/town`,
  town: (slug: string) => `${ROOT}/town/${slug}`,
  /** A place's own page inside the section. Its one address for a search engine is still /b/... */
  place: (slug: string) => `${ROOT}/p/${slug}`,
  search: (q?: string) => (q ? `${ROOT}/search?q=${encodeURIComponent(q)}` : `${ROOT}/search`),
  suggest: `${ROOT}/suggest`,
  saved: `${ROOT}/saved`,
  offline: `${ROOT}/offline`,
  manifest: `${ROOT}/manifest.webmanifest`,
} as const;

/** What a list of places to eat is narrowed by: its subject, and what a visitor chose after. */
export type BazView = { type?: string; food?: string; town?: string; phone?: boolean; web?: boolean; page?: number };

/**
 * The one address of a list. A kind of food, a kind of place, a town, and a kind of place in a
 * town are addresses; a kind of food narrowed by place or by town, a telephone number, a website
 * and the page of a long list are parameters after them. Every combination has exactly one
 * address, so the old addresses, which were all parameters, are led to it.
 */
export function bazHref({ type, food, town, phone, web, page }: BazView): string {
  const base = food ? baz.food(food) : type ? baz.kind(type, town) : town ? baz.town(town) : baz.home;
  const rest = [food && type ? `type=${type}` : "", food && town ? `town=${encodeURIComponent(town)}` : "", phone ? "phone=1" : "", web ? "web=1" : "", page && page > 1 ? `page=${page}` : ""].filter(Boolean).join("&");
  return rest ? `${base}?${rest}` : base;
}
