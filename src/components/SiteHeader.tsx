"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { ACTIONS, NAV, site } from "@/data/site";
import { Chat, Phone } from "./Icons";
import Logo from "./Logo";
import { getLenis } from "./SmoothScroll";

/** The parts of the page that go quiet while the phone menu is open. */
const BEHIND = ["main", "site-footer"];

/**
 * The header: the mark, the pages, and the quickest way to ask about a business. It stays at the
 * top on solid paper, with the rail as its lower edge.
 *
 * On a phone the pages move into a sheet that opens under the header. The sheet is a dialog: it
 * takes focus, makes the rest of the page inert, closes on Escape or on its button, and gives
 * focus back to the button that opened it. Its button's two strokes turn into the close mark rather
 * than being swapped for another icon.
 */
export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) button.current?.focus();
  }, []);

  // A new page closes the sheet without moving focus: the new page takes it from the top.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const behind = BEHIND.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    behind.forEach((el) => el.setAttribute("inert", ""));
    document.documentElement.style.overflow = "hidden";
    getLenis()?.stop();
    sheet.current?.querySelector<HTMLElement>("a")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    // If the window grows past the phone layout, the sheet has no button left to close it.
    const wide = window.matchMedia("(min-width: 48rem)");
    const onWide = () => wide.matches && close(false);
    window.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      behind.forEach((el) => el.removeAttribute("inert"));
      document.documentElement.style.overflow = "";
      getLenis()?.start();
      window.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [open, close]);

  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const { contact } = site;

  return (
    <header className="sticky top-0 z-50 border-b border-line-strong bg-paper">
      <div className="shell flex h-(--nav-h) items-center justify-between gap-6">
        <Link href="/" className="-ml-2 inline-flex min-h-11 items-center rounded-full px-2 no-underline" aria-label={`${site.name}, home`}>
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {NAV.map((l) => {
            const current = isCurrent(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={current ? "page" : undefined}
                className="title-3 relative inline-flex h-(--nav-h) items-center no-underline"
              >
                {l.label}
                {/* The current page is marked on the rail itself: a short heavier stroke under its name. */}
                <span
                  aria-hidden
                  className={`absolute inset-x-0 -bottom-px h-0.5 origin-left bg-ink transition-transform duration-300 ease-out ${current ? "scale-x-100" : "scale-x-0"}`}
                />
              </Link>
            );
          })}
          <Link href="/enquire" aria-current={isCurrent("/enquire") ? "page" : undefined} className="btn btn-sm btn-filled button-sm">
            {ACTIONS.enquire}
          </Link>
        </nav>

        <button
          ref={button}
          type="button"
          className="-mr-2 inline-flex size-11 items-center justify-center rounded-full md:hidden"
          aria-expanded={open}
          aria-controls="menu-sheet"
          aria-label={open ? "Close the menu" : "Open the menu"}
          onClick={() => (open ? close() : setOpen(true))}
        >
          <span className="relative block h-3 w-6" aria-hidden>
            <span className={`absolute inset-x-0 top-0 h-0.5 rounded-full bg-ink transition-transform duration-300 ease-out ${open ? "translate-y-[5px] rotate-45" : ""}`} />
            <span className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-ink transition-transform duration-300 ease-out ${open ? "-translate-y-[5px] -rotate-45" : ""}`} />
          </span>
        </button>
      </div>

      {open && (
        <div
          ref={sheet}
          id="menu-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="menu-sheet fixed inset-x-0 bottom-0 top-(--nav-h) overflow-y-auto bg-paper md:hidden"
        >
          <div className="shell flex min-h-full flex-col justify-between gap-12 py-8">
            <nav aria-label="Main">
              <ul>
                {[{ href: "/", label: "Home" }, ...NAV, { href: "/enquire", label: ACTIONS.enquire }].map((l, i) => (
                  <li key={l.href} data-menu-item style={{ "--i": i } as CSSProperties} className="border-b border-line">
                    <Link
                      href={l.href}
                      aria-current={(l.href === "/" ? pathname === "/" : isCurrent(l.href)) ? "page" : undefined}
                      className="heading-3 flex min-h-16 items-center justify-between no-underline"
                      onClick={() => close(false)}
                    >
                      {l.label}
                      {(l.href === "/" ? pathname === "/" : isCurrent(l.href)) && <span aria-hidden className="size-2 rounded-full bg-ink" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <ul className="grid gap-3" data-menu-item style={{ "--i": 4 } as CSSProperties}>
              <li>
                <a href={contact.phoneHref} className="btn btn-quiet button-md w-full justify-between">
                  <span className="inline-flex items-center gap-3">
                    <Phone className="size-5" />
                    {ACTIONS.call}
                  </span>
                  <span className="tabular">{contact.phone}</span>
                </a>
              </li>
              <li>
                <a href={contact.whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-quiet button-md w-full justify-between">
                  <span className="inline-flex items-center gap-3">
                    <Chat className="size-5" />
                    {ACTIONS.whatsapp}
                  </span>
                  <span className="tabular">{contact.phone}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
