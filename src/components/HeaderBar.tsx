"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ACTIONS, NAV, site } from "@/data/site";
import { Glass } from "./Icons";
import { Wordmark } from "./Logo";
import { SavedLink } from "./Save";
import SearchBox from "./SearchBox";

/**
 * The menu: a white pill that floats at the top of every page. The name, the four ways in, the
 * search box, the shortlist, and the way for a business to list itself. The first screen and the
 * search page carry their own large search box, so there the pill leaves it out. On a phone the
 * ways in are the bar at the foot of the screen (TabBar), and the pill keeps the name and the search.
 */
export default function HeaderBar() {
  const pathname = usePathname();
  const ownSearch = pathname === "/" || pathname === "/search";
  const current = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  return (
    <header className="site-header">
      <div className="nav-pill">
        <Link href="/" className="logo" aria-label={`${site.name}, home`}>
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="ml-6 hidden items-center gap-6 lg:flex">
          {NAV.map((l) => (
            <Link key={l.href} href={l.href} aria-current={current(l.href) ? "page" : undefined} className="nav-link title-2">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="min-w-0 flex-1">{!ownSearch && <div className="ml-auto hidden max-w-xs md:block">{<SearchBox id="header-search" hotkey />}</div>}</div>
        {!ownSearch && (
          <Link href="/search" className="icon-btn md:hidden" aria-label="Search">
            <Glass />
          </Link>
        )}
        <span className="hidden lg:contents">
          <SavedLink />
        </span>
        <Link href="/pricing" className="btn btn-ink btn-sm button-sm shrink-0">
          {ACTIONS.list}
        </Link>
      </div>
    </header>
  );
}
