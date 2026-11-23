"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BAZ } from "@/data/site";
import { baz } from "@/lib/baz";
import { mark } from "@/lib/nav";
import { FoodIcon, PageIcon } from "../Glyphs";
import { Glass } from "../Icons";

/** True on a page of the section. Handed on from here so the site's own header and bar ask it in one line. */
export { inBaz } from "@/lib/baz";

/**
 * Each way round and its icon. The first page wears the app's own mark, the awning, drawn small
 * (globals.css); the others are the site's own set (Glyphs), by the page each stands for.
 */
const ICONS: Record<string, React.ReactNode> = {
  [baz.home]: <span className="baz-mark" aria-hidden />,
  [baz.foods]: <FoodIcon />,
  [baz.towns]: <PageIcon href="/places" />,
  [baz.search()]: <Glass />,
  [baz.saved]: <PageIcon href="/saved" />,
};

/**
 * On a phone and a tablet, the one way round Baz Manzer: a bar at the foot of the screen with the
 * section's own ways in (its first page, the kinds of food, the towns, the search and the saved
 * places), each an icon over a word. It is the site's bar in shape and holds nothing of the
 * site's: TabBar draws this in its own place on a page under /baz-manzer. A page that lies under
 * none of the other four (a kind of place, a place's own page) lights the first.
 */
export default function BazTabBar() {
  const pathname = usePathname();
  const [first, ...others] = BAZ.ways;
  const under = others.find((way) => mark(pathname, way.href));
  return (
    <nav aria-label={BAZ.name} className="tabbar">
      <Link href={first.href} aria-current={pathname === first.href ? "page" : under ? undefined : "true"}>
        {ICONS[first.href]}
        {first.label}
      </Link>
      {others.map((way) => (
        <Link key={way.href} href={way.href} prefetch={false} aria-current={way === under ? mark(pathname, way.href) : undefined}>
          {ICONS[way.href]}
          {way.label}
        </Link>
      ))}
    </nav>
  );
}
