import Link from "next/link";
import { day, directionsHref, shortUrl, telHref } from "@/lib/format";
import { chartPoints } from "@/lib/chart";
import { index, whereOf, type Listing, type Official, type Site } from "@/lib/index";
import type { Lead } from "@/lib/search";
import { Book, Calc, Globe, GroupIcon, Landmark, Out, Phone, Route, Sun } from "./Icons";
import { SaveButton, ShareButton } from "./Save";
import { VerifiedMark } from "./Verified";

/**
 * One listing in a list: its kind's icon, its name, what it is and where, a line about it, how to
 * reach it, and the two things a visitor can do with it: save it, share it.
 */
export function ListingRow({
  listing: l,
  note,
  paid = false,
  verified = false,
  href,
}: {
  listing: Listing;
  /** A word more for its line: how far away it is. */
  note?: string;
  /** On Biznes Go or Biznes Grow today. With `verified`, the row is shown first and carries the mark. */
  paid?: boolean;
  /** Checked by an admin to be a real business. */
  verified?: boolean;
  /** Its own page, for a business its owner listed outside the open index. */
  href?: string;
}) {
  const category = index().categoryById.get(l.cat);
  const where = whereOf(l);
  const to = href ?? `/b/${l.slug}`;
  const marked = paid && verified;
  return (
    <article className={marked ? "row listing listing-paid" : "row listing"} data-listing={l.id} data-point={chartPoints().at.get(l.id)}>
      <span className="listing-icon" aria-hidden>
        <GroupIcon group={category?.group} />
      </span>
      <div className="min-w-0">
        <h3 className="title-1">
          <Link prefetch={false} href={to} className="row-title">
            {l.name}
          </Link>
          {marked && <VerifiedMark priority={paid} />}
        </h3>
        <p className="body-3 mt-0.5 text-ink-subtle">{[l.kind && category?.id !== "companies" ? `${category?.one}, ${l.kind}` : (l.kind ?? category?.one), where, note].filter(Boolean).join(" · ")}</p>
        {(l.about || l.street) && <p className="body-3 mt-2 line-clamp-2 max-w-prose text-ink-subtle">{l.about ?? l.street}</p>}
        <p className="mt-3 flex flex-wrap gap-2">
          {l.phone?.[0] && (
            <a href={telHref(l.phone[0])} className="act data-2">
              <Phone /> <span>{l.phone[0]}</span>
            </a>
          )}
          {l.web && (
            <a href={l.web} rel="noopener nofollow" className="act data-2">
              <Globe /> <span>{shortUrl(l.web).split("/")[0]}</span>
            </a>
          )}
          {/* With no number on record there is still something to do: go there, or tell us the number. */}
          {!l.phone?.length && l.lat != null && l.lon != null && (
            <a href={directionsHref(l.lat, l.lon)} rel="noopener" className="act data-2">
              <Route /> <span>Directions</span>
            </a>
          )}
          {!l.phone?.length && (
            <Link prefetch={false} href={`/add?listing=${l.id}`} className="act act-quiet data-2" rel="nofollow">
              <span>Add its number</span>
            </Link>
          )}
        </p>
      </div>
      <div className="listing-acts">
        {/* The shortlist holds listings of the open index, so only those can be saved. */}
        {!href && <SaveButton id={l.id} name={l.name} />}
        <ShareButton title={l.name} path={to} />
      </div>
    </article>
  );
}

const LEAD_ICON = { Guide: Book, Glossary: Book, Tool: Calc, Number: Phone, Holiday: Sun } as const;

/**
 * An answer from the guides: a guide and the fact or part of it that answers, a glossary term, or
 * a tool. A card like a listing's, with a blue tile: saffron is kept for a verified business.
 */
export function LeadRow({ lead }: { lead: Lead }) {
  const Icon = LEAD_ICON[lead.tag];
  return (
    <article className="row listing">
      <span className="listing-icon listing-icon-guide" aria-hidden>
        <Icon />
      </span>
      <div className="min-w-0">
        <p className="label-1 text-ink-faint">{lead.tag === "Guide" ? "Article" : lead.tag}</p>
        <h3 className="title-1 mt-1">
          <Link prefetch={false} href={lead.href} className="row-title">
            {lead.title}
          </Link>
        </h3>
        <p className="body-2 mt-2 line-clamp-4 max-w-prose">{lead.line}</p>
        {lead.meta && <p className="caption-1 mt-3 text-ink-faint">{lead.meta}</p>}
      </div>
    </article>
  );
}

/** An official page: it opens on its own site. */
export function OfficialRow({ official: o }: { official: Official }) {
  return (
    <article className="row listing">
      <span className="listing-icon listing-icon-quiet" aria-hidden>
        <Landmark />
      </span>
      <div className="min-w-0">
        <p className="caption-1 text-ink-faint">
          {o.publisher} · {shortUrl(o.url)}
        </p>
        <h3 className="title-1 mt-0.5">
          <a href={o.url} rel="noopener" className="row-title inline-flex items-baseline gap-2">
            {o.title}
            <Out className="size-4 shrink-0 self-center opacity-60" />
          </a>
        </h3>
        <p className="body-3 mt-1 max-w-prose text-ink-subtle">{o.what}</p>
      </div>
    </article>
  );
}

/** A Mauritian website the crawler read: its own title and its own words about itself. */
export function SiteRow({ site: s }: { site: Site }) {
  return (
    <article className="row listing">
      <span className="listing-icon listing-icon-quiet" aria-hidden>
        <Globe />
      </span>
      <div className="min-w-0">
        <p className="caption-1 text-ink-faint">
          {s.host}
          {s.checked ? ` · read ${day(s.checked)}` : ""}
        </p>
        <h3 className="title-1 mt-0.5">
          <a href={s.url} rel="noopener nofollow" className="row-title inline-flex items-baseline gap-2">
            {s.name ?? s.title}
            <Out className="size-4 shrink-0 self-center opacity-60" />
          </a>
        </h3>
        {s.about && <p className="body-3 mt-1 line-clamp-2 max-w-prose text-ink-subtle">{s.about}</p>}
      </div>
    </article>
  );
}
