"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ABOUT, MENU, MORE_PAGE, NAV, YOURS } from "@/data/site";
import { mark } from "@/lib/nav";
import { PageIcon } from "./Glyphs";
import { Glass } from "./Icons";

/** The three ways in that the bar names between the search and "More": Home, Baz Manzer and Articles. */
const ON_BAR: readonly string[] = ["/home", "/baz-manzer", "/learn"];
const WAYS = NAV.filter((item) => ON_BAR.includes(item.href));
/** Every other page with a name in the menu: on one of those, "More" is where the visitor is. */
const REST = [...MENU.flatMap((group) => group.items.map((item) => item.href.split("#")[0])), ...YOURS.map((item) => item.href), ...ABOUT.map((item) => item.href)];

/**
 * On a phone and a tablet, the one way round: a bar at the foot of the screen, as in an app. The
 * search, Home, Baz Manzer, Articles, and "More", which is a page of everything else and not a
 * list that opens over this one. The directory is reached through Home, whose categories and
 * regions are its two ways in, and through "More". A wide screen has the same ways in as links
 * in the header. The landing page has no bar: its one button, "Home", is the way on.
 */
export default function TabBar() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  const way = WAYS.find((item) => mark(pathname, item.href, item.also));
  const search = pathname === "/search" ? "true" : undefined;
  // "More" is lit on its own page, and on any page that is reached from it.
  const more = pathname === MORE_PAGE.href ? "page" : !way && !search && REST.some((href) => mark(pathname, href)) ? "true" : undefined;
  return (
    <nav aria-label="Main" className="tabbar">
      <Link href="/" aria-current={search}>
        <Glass />
        {MORE_PAGE.search}
      </Link>
      {WAYS.map((item) => (
        <Link key={item.href} href={item.href} aria-current={item === way ? mark(pathname, item.href, item.also) : undefined}>
          <PageIcon href={item.href} />
          {item.label}
        </Link>
      ))}
      <Link href={MORE_PAGE.href} prefetch={false} aria-current={more}>
        <PageIcon href={MORE_PAGE.href} />
        {MORE_PAGE.label}
      </Link>
    </nav>
  );
}
