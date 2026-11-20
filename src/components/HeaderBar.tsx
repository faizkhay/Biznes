"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ACTIONS, MENU, site } from "@/data/site";
import { Chevron, Glass, List } from "./Icons";
import { Wordmark } from "./Logo";
import { SavedLink } from "./Save";
import SearchBox from "./SearchBox";

/**
 * The menu: a white pill that floats at the top of every page. The name, three groups that open
 * (Explore, Learn, For business), the search box, the shortlist, and the way for a business to
 * list itself. Each group is a plain disclosure, so it opens with no script; with script, only one
 * is open at a time and it closes on Escape, on a click elsewhere and when a page is chosen. The
 * first screen and the search page carry their own large search box, so there the pill leaves it
 * out. On a phone the groups are behind one button, and the tab bar carries the main ways in.
 */
export default function HeaderBar() {
  const pathname = usePathname();
  const bar = useRef<HTMLElement>(null);
  const ownSearch = pathname === "/" || pathname === "/search";
  const current = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const [open, setOpen] = useState(false);
  const close = () => bar.current?.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((d) => (d.open = false));
  // Whether any group is open: a clear sheet then lies over the page and takes the tap that closes it.
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

  const items = (group: (typeof MENU)[number]) =>
    group.items.map((item) => (
      <li key={item.href}>
        <Link href={item.href} aria-current={current(item.href) ? "page" : undefined} className="menu-item" onClick={close}>
          <span className="title-2 block">{item.label}</span>
          <span className="caption-1 block text-ink-faint">{item.line}</span>
        </Link>
      </li>
    ));

  return (
    <header ref={bar} className="site-header">
      {open && <div className="menu-scrim" aria-hidden onClick={close} />}
      <div className="nav-pill">
        <Link href="/" className="logo" aria-label={`${site.name}, home`}>
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 lg:flex">
          {MENU.map((group) => (
            <details key={group.label} name="menu" className="menu-group" onToggle={watch}>
              <summary className="nav-link title-2" data-current={group.items.some((item) => current(item.href)) || undefined}>
                {group.label} <Chevron />
              </summary>
              <ul className="menu-panel">{items(group)}</ul>
            </details>
          ))}
        </nav>
        <div className="min-w-0 flex-1">{!ownSearch && <div className="ml-auto hidden max-w-xs md:block">{<SearchBox id="header-search" hotkey />}</div>}</div>
        {!ownSearch && (
          <Link href="/search" className="icon-btn icon-btn-sq md:hidden" aria-label="Search">
            <Glass />
          </Link>
        )}
        <span className="hidden lg:contents">
          <SavedLink />
        </span>
        <Link href="/pricing" className="btn btn-ink btn-sm button-sm hidden shrink-0 sm:inline-flex">
          {ACTIONS.list}
        </Link>
        <details name="menu" className="menu-group lg:hidden" onToggle={watch}>
          <summary className="icon-btn icon-btn-sq" aria-label="Menu">
            <List />
          </summary>
          <nav aria-label="All pages" className="menu-panel menu-panel-all">
            <Link href="/pricing" className="btn btn-ink button-md mb-2 w-full sm:hidden" onClick={close}>
              {ACTIONS.list}
            </Link>
            {MENU.map((group) => (
              <div key={group.label}>
                <p className="label-1 px-3 pt-3 pb-1 text-ink-faint">{group.label}</p>
                <ul>{items(group)}</ul>
              </div>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}
