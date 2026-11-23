"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BAZ } from "@/data/site";
import { baz } from "@/lib/baz";
import { mark } from "@/lib/nav";
import BazSearchBox from "./BazSearchBox";

/** True on a page of the section. Handed on from here so the site's own header and bar ask it in one line. */
export { inBaz } from "@/lib/baz";

/** The ways round that a wide screen's header names: all but the first page, which the name leads to, and the search, which is the box. */
const LINKS = BAZ.ways.filter((way) => way.href !== baz.home && way.href !== baz.search());

/**
 * The header on every page of Baz Manzer: the same white pill as the site's, holding the
 * section's own things. Its name with its awning, which leads to its first page; on a wide
 * screen its ways round as plain links, and its own search box; and one plain way back to the
 * whole site. The site's menu, cart and account are not here: they are the whole site's, and one
 * press away. HeaderBar draws this in its own place on a page under /baz-manzer.
 *
 * The first page and the search page carry their own large search box, so there the pill leaves
 * it out. On a phone the pill holds the name and the way back, and the bar at the foot of the
 * screen is the way round (BazTabBar).
 */
export default function BazHeader() {
  const pathname = usePathname();
  const ownSearch = pathname === baz.home || pathname === baz.search();
  return (
    <header className="site-header">
      <div className="nav-pill">
        <Link href={baz.home} className="logo baz-name" aria-label={`${BAZ.name}, first page`} aria-current={pathname === baz.home ? "page" : undefined}>
          {/* The app's own icon, drawn small: the awning over the point (globals.css). */}
          <span className="baz-mark" aria-hidden />
          <span>{BAZ.name}</span>
        </Link>
        <nav aria-label={BAZ.name} className="nav-main">
          <ul>
            {LINKS.map((way) => (
              <li key={way.href}>
                <Link href={way.href} className="nav-link title-2" aria-current={mark(pathname, way.href)}>
                  {way.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {/* The box is always here and only shown or not, so the page for when there is no connection, which is drawn once and shown at any address, is the same page at every one. */}
        <div className="min-w-0 flex-1">
          <div className={ownSearch ? "hidden" : "ml-auto hidden max-w-xs md:block"}>
            <BazSearchBox id="baz-header-search" hotkey={!ownSearch} />
          </div>
        </div>
        {/* A whole page load, not a step inside this one: the browser then reads the other app's manifest afresh. */}
        <a href={BAZ.back.href} className="btn btn-quiet button-sm shrink-0" aria-label={BAZ.back.says}>
          {BAZ.back.label}
        </a>
      </div>
    </header>
  );
}
