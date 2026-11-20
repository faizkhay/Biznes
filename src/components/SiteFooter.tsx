import Link from "next/link";
import { ACTIONS, CREDITS, MORE, NAV, site } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import { day } from "@/lib/format";
import { index } from "@/lib/index";
import { Mark, Wordmark } from "./Logo";

/**
 * The footer: where the data comes from (the map's licence asks for its credit wherever its data
 * is shown, so it is on every page), the pages, how to reach the people behind the site, and who
 * made it.
 */
export default function SiteFooter() {
  const { meta } = index();
  const { contact, builder } = site;
  return (
    <footer id="site-footer" className="site-footer">
      <span className="footer-mark" aria-hidden>
        <Mark />
      </span>
      <div className="shell grid gap-10 pb-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="logo">
            <Wordmark />
            <span className="sr-only">{site.name}</span>
          </p>
          <p className="body-3 mt-3 max-w-sm text-ink-subtle">{site.line}. Listings come from open data and each one says where; guides are written from official sources and each one lists them.</p>
          <p className="caption-1 mt-6 max-w-sm text-ink-faint">
            Map data from{" "}
            <a href={CREDITS.osm.href} rel="noopener">
              {CREDITS.osm.label}
            </a>
            , under the {CREDITS.osm.licence}, as of {day(meta.map.stamp)}. Company facts from{" "}
            <a href={CREDITS.wikidata.href} rel="noopener">
              {CREDITS.wikidata.label}
            </a>
            , {CREDITS.wikidata.licence}.
          </p>
        </div>
        <nav aria-label="Footer" className="md:col-span-3">
          <ul className="grid gap-1">
            {[...NAV, ...MORE, ...(accountsOn ? [{ href: "/account", label: "Your account" }] : [])].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="body-3 inline-flex min-h-8 items-center text-ink-subtle no-underline hover:text-ink hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="md:col-span-4">
          <p className="body-3 text-ink-subtle">Is something wrong or missing?</p>
          <Link href="/add" className="btn btn-filled button-sm mt-3">
            {ACTIONS.add}
          </Link>
          <p className="body-3 mt-6 text-ink-subtle">
            <a href={contact.phoneHref} className="data-1 inline-flex min-h-8 items-center whitespace-nowrap">
              {contact.phone}
            </a>
            <br />
            <a href={`mailto:${contact.email}`} className="inline-flex min-h-8 items-center">
              {contact.email}
            </a>
          </p>
        </div>
      </div>
      <div className="shell flex flex-wrap items-center justify-between gap-x-8 gap-y-2 border-t border-line py-6">
        <p className="caption-1 text-ink-faint">The guides are general information, not legal or tax advice.</p>
        <p className="caption-1 text-ink-subtle">
          A Digital Experience by{" "}
          <a href={builder.url} rel="noopener" className="font-semibold text-ink">
            {builder.name}
          </a>
        </p>
      </div>
    </footer>
  );
}
