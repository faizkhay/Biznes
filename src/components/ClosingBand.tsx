"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BUSINESSES } from "@/data/businesses";
import { ACTIONS, site } from "@/data/site";
import { formatPrice } from "@/lib/format";
import { Arrow, Chat } from "./Icons";

/** Pages that are themselves the answer to the band's invitation, so the band stays silent. */
const SILENT = new Set(["/enquire"]);
/** Every address the site serves, so an unknown one (the 404) can be told apart. */
const KNOWN = new Set(["/", "/businesses", "/how-it-works", "/enquire", "/privacy"]);

/**
 * The invitation at the head of the footer, chosen by the page that was just read, so it never
 * points at the page it is on and never fights that page's own action:
 *
 *   a real business's page   that business's action, and WhatsApp
 *   the catalogue            the route to the form, since the businesses are already in view
 *   Enquire, and the 404     nothing: the page is the form, or already offers the way back
 *   everywhere else          the businesses, with the route to the form beside it
 *
 * The first design review found the same band on every page: "See the businesses" on the businesses
 * page, "Send a request" on the page it leads to, and a real listing ending on a way to leave.
 */
export default function ClosingBand() {
  const pathname = usePathname();
  const slug = pathname.startsWith("/businesses/") ? pathname.split("/")[2] : null;
  const business = slug ? BUSINESSES.find((b) => b.slug === slug) : null;
  const unknown = !KNOWN.has(pathname) && !business;
  if (SILENT.has(pathname) || unknown) return null;

  const band = (heading: string, line: ReactNode, actions: ReactNode) => (
    <>
      <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
        <div>
          <h2 className="heading-2 measure-hero">{heading}</h2>
          <p className="title-2 measure mt-4 text-ink-subtle">{line}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:justify-end">{actions}</div>
      </div>
      <div className="rail my-12 lg:my-16" aria-hidden />
    </>
  );

  if (business && !business.sample && business.status === "available") {
    return band(
      `${business.name} will have one owner`,
      site.showPrices ? (
        <>
          <span className="tabular text-ink">{formatPrice(business.price)}</span> for the whole business, sold once.
        </>
      ) : (
        "Sold once, as the whole business."
      ),
      <>
        <Link href={`/enquire?business=${business.slug}`} className="btn btn-filled button-md">
          {ACTIONS.ask}
        </Link>
        <a href={site.contact.whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-quiet button-md">
          <Chat className="size-5" />
          {ACTIONS.whatsapp}
        </a>
      </>,
    );
  }

  if (pathname === "/businesses") {
    return band(
      "Seen one that could be yours",
      "Ask about it, or about a business built around your own idea.",
      <Link href="/enquire" className="btn btn-filled button-md">
        {ACTIONS.enquire}
      </Link>,
    );
  }

  return band(
    "Find the one that is yours",
    "Each business is sold once, to one owner.",
    <>
      <Link href="/businesses" className="btn btn-filled button-md">
        {ACTIONS.browse}
      </Link>
      <Link href="/enquire" className="arrow-link button-md">
        {ACTIONS.enquire}
        <Arrow />
      </Link>
    </>,
  );
}
