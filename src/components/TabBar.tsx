"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ABOUT, MENU, MORE_PAGE, NAV, YOURS } from "@/data/site";
import { mark } from "@/lib/nav";
import { Book, Fork, Glass, List, Store } from "./Icons";

const ICONS = { "/directory": Store, "/baz-manzer": Fork, "/learn": Book } as const;
/** The three ways in that the bar names between the search and "More": the header's first three. */
const WAYS = NAV.filter((item): item is (typeof NAV)[number] & { href: keyof typeof ICONS } => item.href in ICONS);
/** Every other page with a name in the menu: on one of those, "More" is where the visitor is. */
const REST = [...MENU.flatMap((group) => group.items.map((item) => item.href.split("#")[0])), ...YOURS.map((item) => item.href), ...ABOUT.map((item) => item.href)];

/**
 * On a phone and a tablet, the one way round: a bar at the foot of the screen, as in an app. The
 * search, three of the four ways in, and "More", which is a page of everything else and not a
 * list that opens over this one. A wide screen has the same ways in as links in the header.
 */
export default function TabBar() {
  const pathname = usePathname();
  const way = WAYS.find((item) => mark(pathname, item.href, item.also));
  const search = pathname === "/" ? "page" : pathname === "/search" ? "true" : undefined;
  // "More" is lit on its own page, and on any page that is reached from it.
  const more = pathname === MORE_PAGE.href ? "page" : !way && !search && REST.some((href) => mark(pathname, href)) ? "true" : undefined;
  return (
    <nav aria-label="Main" className="tabbar">
      <Link href="/" aria-current={search}>
        <Glass />
        {MORE_PAGE.search}
      </Link>
      {WAYS.map((item) => {
        const Icon = ICONS[item.href];
        return (
          <Link key={item.href} href={item.href} aria-current={item === way ? mark(pathname, item.href, item.also) : undefined}>
            <Icon />
            {item.label}
          </Link>
        );
      })}
      <Link href={MORE_PAGE.href} prefetch={false} aria-current={more}>
        <List />
        {MORE_PAGE.label}
      </Link>
    </nav>
  );
}
