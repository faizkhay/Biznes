import Link from "next/link";
import { count } from "@/lib/format";
import type { Facets, Narrow } from "@/lib/search";
import { Chevron, Globe, Phone, Pin, Tick } from "./Icons";

/**
 * Ways to make a list of listings smaller: only those with a telephone number, only those with a
 * website, only those in one town. Each is a link, so it works with no script, and each says how
 * many it would leave. `href` gives the address of the list narrowed a given way.
 */
export default function Filters({ facets, narrow, href, town = true }: { facets: Facets; narrow: Narrow; href: (narrow: Narrow) => string; town?: boolean }) {
  const on = narrow.phone || narrow.web || narrow.town;
  if (!on && facets.all < 2) return null;
  const chosen = narrow.town ? facets.towns.find((t) => t.slug === narrow.town) : undefined;
  const towns = facets.towns.slice(0, 60);
  return (
    <nav aria-label="Narrow these listings" className="filters">
      {(facets.phone > 0 || narrow.phone) && (
        <Link prefetch={false} href={href({ ...narrow, phone: !narrow.phone })} aria-current={narrow.phone ? "true" : undefined} className="filter body-3" rel="nofollow">
          {narrow.phone ? <Tick /> : <Phone />} <span className="sm:hidden">Has a number</span>
          <span className="hidden sm:inline">With a telephone number</span> <span className="n data-2">{count(facets.phone)}</span>
        </Link>
      )}
      {(facets.web > 0 || narrow.web) && (
        <Link prefetch={false} href={href({ ...narrow, web: !narrow.web })} aria-current={narrow.web ? "true" : undefined} className="filter body-3" rel="nofollow">
          {narrow.web ? <Tick /> : <Globe />} <span className="sm:hidden">Website</span>
          <span className="hidden sm:inline">With a website</span> <span className="n data-2">{count(facets.web)}</span>
        </Link>
      )}
      {town && (towns.length > 1 || narrow.town) && (
        <details className="menu">
          <summary className="filter body-3" aria-current={narrow.town ? "true" : undefined}>
            <Pin /> {chosen ? chosen.name : narrow.town ? "One town" : "Any town"} <Chevron />
          </summary>
          <ul className="menu-list body-3">
            {narrow.town && (
              <li>
                <Link prefetch={false} href={href({ ...narrow, town: undefined })} rel="nofollow">
                  Any town <span className="data-2 text-ink-faint">{count(facets.all)}</span>
                </Link>
              </li>
            )}
            {towns.map((t) => (
              <li key={t.slug}>
                <Link prefetch={false} href={href({ ...narrow, town: t.slug })} aria-current={narrow.town === t.slug ? "true" : undefined} rel="nofollow">
                  {t.name} <span className="data-2 text-ink-faint">{count(t.n)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
      {on && (
        <Link prefetch={false} href={href({})} className="body-3 inline-flex min-h-10 items-center px-2 text-ink-subtle" rel="nofollow">
          Clear
        </Link>
      )}
    </nav>
  );
}

/** The narrowing, as the end of an address. */
export const narrowQuery = (narrow: Narrow) => `${narrow.phone ? "&phone=1" : ""}${narrow.web ? "&web=1" : ""}${narrow.town ? `&town=${encodeURIComponent(narrow.town)}` : ""}`;
