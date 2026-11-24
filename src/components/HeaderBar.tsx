"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ABOUT, ACTIONS, MENU, MORE, MORE_PAGE, YOURS, site } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import { mark } from "@/lib/nav";
import AccountControl from "./AccountControl";
import BazHeader, { inBaz } from "./baz/BazHeader";
import { CartLink } from "./Cart";
import { PageIcon } from "./Glyphs";
import { Grid, Person } from "./Icons";
import { Mark, Wordmark } from "./Logo";
import { SavedLink } from "./Save";
import SearchBox from "./SearchBox";

/** Every page that has a name in the menu, by its address. */
const PAGES = new Map<string, { href: string; label: string; line: string }>([...MENU.flatMap((group) => [...group.items]), ...YOURS, ...ABOUT].map((item) => [item.href, item]));
/** What the menu opens: the pages most often wanted, named as the menu names them. */
const MENU_ITEMS = MORE.map((href) => PAGES.get(href)).filter((item): item is { href: string; label: string; line: string } => Boolean(item));

/**
 * The header, on the model of a search engine's own (the owner, 24 November 2026: "simplified,
 * made intuitive ... take inspiration from google's own navigation"): a pill of glass that floats
 * at the top of every page and holds four things. The name, which leads to the landing page. The
 * search box, in the middle and as wide as the pill allows: the way to anything, on every page
 * and on a phone too. "Menu", one button that opens a grid of the pages most often wanted, each
 * a tile with its icon, and under them the way for a business to list itself and the page of
 * every page. And what is the visitor's own: the shortlist, once something is on it, the cart
 * and the account.
 *
 * "Menu" is a plain disclosure, so it opens with no script. With script it also closes on
 * Escape, which hands the keyboard back to the word that opened it, on a click elsewhere and
 * when a page is chosen. The landing page and the search page carry their own large search box,
 * so there the pill leaves its own out. On the landing page the pill is only the name, the cart
 * and the account: its one button, "Home", is the way on.
 *
 * On a phone and a tablet "Menu" is not here: the bar at the foot of the screen is the way round
 * (TabBar), and its last tab is the page of everything else. Where the pill holds the search box
 * on a phone, the name is drawn as its first letter alone, to leave the box its room.
 */
export default function HeaderBar() {
  const pathname = usePathname();
  const bar = useRef<HTMLElement>(null);
  const bare = pathname === "/";
  const ownSearch = bare || pathname === "/search";
  const [open, setOpen] = useState(false);
  const close = () => bar.current?.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((d) => (d.open = false));
  // Whether the list is open: a clear sheet then lies over the page and takes the tap that closes it.
  const watch = () => setOpen(Boolean(bar.current?.querySelector("details[open]")));

  // A page was chosen: whatever was open closes.
  useEffect(close, [pathname]);
  // While the grid is open the page behind it is set aside, for the keyboard and a screen reader as the clear sheet sets it aside for the pointer.
  useEffect(() => {
    const main = document.getElementById("main");
    main?.toggleAttribute("inert", open);
    return () => main?.removeAttribute("inert");
  }, [open]);
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

  if (inBaz(pathname)) return <BazHeader />; // Baz Manzer has a header of its own. Asked here, after the hooks above, so that their number never changes.

  return (
    <header ref={bar} className="site-header">
      {open && <div className="menu-scrim" aria-hidden onClick={close} />}
      <div className="nav-pill">
        <Link href="/" className={ownSearch ? "logo" : "logo logo-tight"} aria-label={`${site.name}, ${MORE_PAGE.search.toLowerCase()}`} aria-current={bare ? "page" : undefined}>
          <Wordmark className="logo-word" />
          <Mark className="logo-mark" />
        </Link>
        <div className="nav-search">{!ownSearch && <SearchBox id="header-search" hotkey hint={MORE_PAGE.hint} />}</div>
        {!bare && (
          <nav aria-label="Main" className="nav-main">
            {/* The grid closes when the keyboard walks out of it, so it is never left open over the page behind. */}
            <details
              className="menu-group"
              onToggle={watch}
              onBlur={(event) => {
                const next = event.relatedTarget as Node | null;
                if (next && !event.currentTarget.contains(next)) event.currentTarget.open = false;
              }}
            >
              <summary className="nav-link title-2">
                <Grid /> {MORE_PAGE.menu}
              </summary>
              <div className="menu-panel">
                <ul className="menu-grid">
                  {MENU_ITEMS.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} prefetch={false} aria-current={mark(pathname, item.href)} className="menu-item" title={item.line} onClick={close}>
                        <span className="menu-icon" aria-hidden>
                          <PageIcon href={item.href} />
                        </span>
                        <span className="caption-1">{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="menu-foot">
                  <Link href="/pricing" prefetch={false} className="btn btn-ink btn-sm button-sm" aria-current={mark(pathname, "/pricing")} onClick={close}>
                    {ACTIONS.list}
                  </Link>
                  <Link href={MORE_PAGE.href} prefetch={false} className="menu-all body-3" aria-current={mark(pathname, MORE_PAGE.href)} onClick={close}>
                    {MORE_PAGE.all}
                  </Link>
                </p>
              </div>
            </details>
          </nav>
        )}
        {!bare && <SavedLink />}
        <CartLink />
        {/* The account's own control, when accounts are on. With them off, the same square button leads to the page that says they open soon. */}
        {accountsOn ? (
          <AccountControl />
        ) : (
          <Link href="/account" prefetch={false} className="icon-btn icon-btn-sq" aria-label="Your account" title="Your account">
            <Person />
          </Link>
        )}
      </div>
    </header>
  );
}
