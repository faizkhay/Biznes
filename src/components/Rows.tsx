import Link from "next/link";
import { day, shortUrl, telHref } from "@/lib/format";
import { index, whereOf, type Listing, type Official, type Site } from "@/lib/index";
import type { GuideHit } from "@/lib/search";
import { Out } from "./Icons";

/** One listing in a list: its name, what it is and where, a line about it, and how to reach it. */
export function ListingRow({ listing: l }: { listing: Listing }) {
  const category = index().categoryById.get(l.cat);
  const where = whereOf(l);
  return (
    <article className="row">
      <h3 className="title-1">
        <Link prefetch={false} href={`/b/${l.slug}`} className="row-title">
          {l.name}
        </Link>
      </h3>
      <p className="body-3 mt-1 text-ink-subtle">
        {[l.kind && category?.id !== "companies" ? `${category?.one}, ${l.kind}` : (l.kind ?? category?.one), where].filter(Boolean).join(" · ")}
      </p>
      {(l.about || l.street) && <p className="body-3 mt-2 line-clamp-2 max-w-prose text-ink-subtle">{l.about ?? l.street}</p>}
      {(l.phone?.length || l.web) && (
        <p className="data-2 mt-3 flex flex-wrap gap-x-6 gap-y-1 text-ink-faint">
          {l.phone?.[0] && (
            <a href={telHref(l.phone[0])} className="inline-flex min-h-6 items-center whitespace-nowrap text-ink-subtle">
              {l.phone[0]}
            </a>
          )}
          {l.web && <span>{shortUrl(l.web)}</span>}
        </p>
      )}
    </article>
  );
}

/** A guide that answers a question, and the part of it that does. */
export function GuideRow({ hit }: { hit: GuideHit }) {
  const { guide, section } = hit;
  return (
    <article className="row">
      <p className="label-1 tag tag-lit">Guide</p>
      <h3 className="title-1 mt-2">
        <Link prefetch={false} href={`/learn/${guide.slug}`} className="row-title">
          {guide.title}
        </Link>
      </h3>
      <p className="body-3 mt-1 max-w-prose text-ink-subtle">{guide.summary}</p>
      <p className="data-2 mt-3 text-ink-faint">
        {section ? `In it: ${section}. ` : ""}Checked {day(guide.checked)}
      </p>
    </article>
  );
}

/** An official page: it opens on its own site. */
export function OfficialRow({ official: o }: { official: Official }) {
  return (
    <article className="row">
      <p className="label-1 tag">{o.publisher}</p>
      <h3 className="title-1 mt-2">
        <a href={o.url} rel="noopener" className="row-title inline-flex items-baseline gap-2">
          {o.title}
          <Out className="size-4 shrink-0 self-center text-ink-faint" />
        </a>
      </h3>
      <p className="body-3 mt-1 max-w-prose text-ink-subtle">{o.what}</p>
      <p className="data-2 mt-3 text-ink-faint">{shortUrl(o.url)}</p>
    </article>
  );
}

/** A Mauritian website the crawler read: its own title and its own words about itself. */
export function SiteRow({ site: s }: { site: Site }) {
  return (
    <article className="row">
      <p className="label-1 tag">Website</p>
      <h3 className="title-1 mt-2">
        <a href={s.url} rel="noopener nofollow" className="row-title inline-flex items-baseline gap-2">
          {s.name ?? s.title}
          <Out className="size-4 shrink-0 self-center text-ink-faint" />
        </a>
      </h3>
      {s.about && <p className="body-3 mt-1 line-clamp-2 max-w-prose text-ink-subtle">{s.about}</p>}
      <p className="data-2 mt-3 text-ink-faint">
        {s.host}
        {s.checked ? ` · read ${day(s.checked)}` : ""}
      </p>
    </article>
  );
}
