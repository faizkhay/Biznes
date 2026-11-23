"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ABOUT, ACTIONS, MENU, MORE, MORE_PAGE, NAV, YOURS, site } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import { mark } from "@/lib/nav";
import AccountControl from "./AccountControl";
import { CartLink } from "./Cart";
import { Chevron, Person } from "./Icons";
import { Wordmark } from "./Logo";
import { SavedLink } from "./Save";
import SearchBox from "./SearchBox";

/** Every page that has a name in the menu, by its address. */
const PAGES = new Map<string, { href: string; label: string; line: string }>([...MENU.flatMap((group) => [...group.items]), ...YOURS, ...ABOUT].map((item) => [item.href, item]));
/** What "More" opens: the pages beyond the four ways in, named as the menu names them. */
const MORE_ITEMS = MORE.map((href) => PAGES.get(href)).filter((item): item is { href: string; label: string; line: string } => Boolean(item));

/**
 * The menu: a white pill that floats at the top of every page. The name; four plain links, each
 * one press from its page (Directory, Baz Manzer, Articles, Tools); "More", the one list that
 * opens, for the pages wanted less often; the search box; the shortlist, once something is on
 * it; the cart and the account; and the way for a business to list itself.
 *
 * "More" is a plain disclosure, so it opens with no script. With script it also closes on
 * Escape, which hands the keyboard back to the word that opened it, on a click elsewhere and
 * when a page is chosen. The first screen and the search page carry their own large search box,
 * so there the pill leaves it out.
 *
 * On a phone the pill holds the name, the cart and the account, and nothing that opens: the bar
 * at the foot of the screen is the one way round (TabBar), and its last tab is the page of
 * everything else.
 */
export default function HeaderBar() {
  const pathname = usePathname();
  const bar = useRef<HTMLElement>(null);
  const ownSearch = pathname === "/" || pathname === "/search";
  const [open, setOpen] = useState(false);
  const close = () => bar.current?.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((d) => (d.open = false));
  // Whether the list is open: a clear sheet then lies over the page and takes the tap that closes it.
  const watch = () => setOpen(Boolean(bar.current?.querySelector("details[open]")));

  // A page was chosen: whatever was open closes.
  useEffect(close, [pathname]);
  useEffect(() => {
    const away = (event: PointerEvent) => {
      if (!bar.current?.contains(event.target as Node)) close();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const open = bar.current?.querySelector<HTMLDetailsElement>("details[open]");
      if (!open) return;
      open.open = false;
      open.querySelector("summary")?.focus();
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", key);
    };
  }, []);

  // "More" carries the lit point when the page is one of its own and not under one of the four.
  const underFour = NAV.some((item) => mark(pathname, item.href, item.also));
  const inMore = !underFour && (pathname === MORE_PAGE.href || MORE_ITEMS.some((item) => mark(pathname, item.href)));

  return (
    <header ref={bar} className="site-header">
      {open && <div className="menu-scrim" aria-hidden onClick={close} />}
      <div className="nav-pill">
        <Link href="/" className="logo" aria-label={`${site.name}, home`}>
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="nav-main">
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="nav-link title-2" aria-current={mark(pathname, item.href, item.also)}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              {/* The list closes when the keyboard walks out of it, so it is never left open over the page behind. */}
              <details
                className="menu-group"
                onToggle={watch}
                onBlur={(event) => {
                  const next = event.relatedTarget as Node | null;
                  if (next && !event.currentTarget.contains(next)) event.currentTarget.open = false;
                }}
              >
                <summary className="nav-link title-2" data-current={inMore || undefined}>
                  {MORE_PAGE.label} <Chevron />
                </summary>
                <ul className="menu-panel">
                  {MORE_ITEMS.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} prefetch={false} aria-current={mark(pathname, item.href)} className="menu-item" onClick={close}>
                        <span className="title-2 block">{item.label}</span>
                        <span className="caption-1 block text-ink-faint">{item.line}</span>
                      </Link>
                    </li>
                  ))}
                  <li className="menu-all">
                    <Link href={MORE_PAGE.href} prefetch={false} className="menu-item title-2" aria-current={mark(pathname, MORE_PAGE.href)} onClick={close}>
                      {MORE_PAGE.all}
                    </Link>
                  </li>
                </ul>
              </details>
            </li>
          </ul>
        </nav>
        <div className="min-w-0 flex-1">{!ownSearch && <div className="ml-auto hidden max-w-xs md:block">{<SearchBox id="header-search" hotkey />}</div>}</div>
        <SavedLink />
        <CartLink />
        {/* The account's own control, when accounts are on. With them off, the same square button leads to the page that says they open soon. */}
        {accountsOn ? (
          <AccountControl />
        ) : (
          <Link href="/account" prefetch={false} className="icon-btn icon-btn-sq" aria-label="Your account" title="Your account">
            <Person />
          </Link>
        )}
        <Link href="/pricing" className="btn btn-ink btn-sm button-sm hidden shrink-0 sm:inline-flex">
          {ACTIONS.list}
        </Link>
      </div>
    </header>
  );
}
