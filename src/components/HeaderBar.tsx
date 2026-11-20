"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ACTIONS, NAV, site } from "@/data/site";
import SearchBox from "./SearchBox";

/**
 * The header: the name, the four ways in, the search box, and the way to add or correct a listing.
 * The first screen and the search page carry their own large search box, so on those two the
 * header leaves it out. On a phone the four ways in sit in a second row that scrolls sideways;
 * nothing hides behind a menu.
 */
export default function HeaderBar() {
  const pathname = usePathname();
  const ownSearch = pathname === "/" || pathname === "/search";
  const current = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const links = NAV.map((l) => (
    <Link key={l.href} href={l.href} aria-current={current(l.href) ? "page" : undefined} className="nav-link title-2">
      {l.label}
    </Link>
  ));
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper">
      <div className="shell flex h-(--nav-h) items-center gap-4 lg:gap-8">
        <Link href="/" className="wordmark shrink-0">
          biznes<span className="dot">.</span>mu
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
          {links}
        </nav>
        <div className="min-w-0 flex-1">{!ownSearch && <div className="ml-auto max-w-md">{<SearchBox id="header-search" />}</div>}</div>
        <Link href="/add" className={`btn btn-quiet button-sm shrink-0 ${ownSearch ? "" : "hidden sm:inline-flex"}`}>
          {ACTIONS.add}
        </Link>
      </div>
      <nav aria-label="Main" className="shell flex gap-6 overflow-x-auto border-t border-line lg:hidden">
        {links}
      </nav>
    </header>
  );
}
