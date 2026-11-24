import Link from "next/link";
import { ABOUT, ACTIONS, CREDITS, MENU, MENU_LABELS, STREET_MAP, YOURS, site } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import { day } from "@/lib/format";
import { index } from "@/lib/index";
import { Mail, Phone } from "./Icons";
import { Mark, Wordmark } from "./Logo";

/**
 * The footer: a dark card on the picture, with the b standing on its top edge. The name, large and
 * white; whose product the site is; how to reach the people behind it; every page in four
 * columns (Find, Read, For business, About), named as the menu names them; the credit the map's
 * data asks for wherever it is shown; and the page's last line. The list for the pocket guide and
 * the magazine is a section of its own above it (JoinSection).
 *
 * The landing page is one screen and does not show it: that page has one quiet line in its place
 * ("Home and the landing page" in globals.css).
 */
export default function SiteFooter() {
  const { meta } = index();
  const { contact, builder } = site;
  // The menu's own groups, and a last column for the site itself and what is the visitor's own.
  const yours = YOURS.filter((item) => accountsOn || item.href !== "/account");
  const columns = [...MENU.map((group) => ({ label: group.label, items: group.items.map((item) => ({ href: item.href, label: item.label })) })), { label: MENU_LABELS.about, items: [...ABOUT, ...yours].map((item) => ({ href: item.href, label: item.label })) }];
  return (
    <footer id="site-footer" className="site-footer">
      <span className="footer-mark" aria-hidden>
        <Mark />
      </span>
      <div className="shell grid gap-x-12 gap-y-10 pb-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="footer-name">
            <Wordmark />
            <span className="sr-only">{site.name}</span>
          </p>
          <p className="body-2 mt-4 max-w-sm text-ink-subtle">{site.line}.</p>
          {/* Whose it is, in the owner's words. The names are in src/data/site.ts. */}
          <p className="body-3 mt-4 max-w-sm text-ink-subtle">
            {site.name} is a product of{" "}
            <a href={builder.url} rel="noopener" className="font-semibold text-ink">
              {builder.name}
            </a>
            , developed by {builder.developer}.
          </p>
          <ul className="footer-reach mt-6">
            <li>
              <a href={contact.phoneHref} className="data-1">
                <Phone /> {contact.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${contact.email}`} className="body-3">
                <Mail /> {contact.email}
              </a>
            </li>
          </ul>
          <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/add" prefetch={false} className="btn btn-filled button-sm btn-sm">
              {ACTIONS.add}
            </Link>
            <Link href="/pricing" prefetch={false} className="body-3 inline-flex min-h-11 items-center font-semibold text-ink">
              {ACTIONS.list}
            </Link>
          </p>
        </div>

        <div className="lg:col-span-7">
          <nav aria-label="Footer" className="footer-cols">
            {columns.map((column) => (
              <div key={column.label}>
                <h2 className="label-1 text-ink-faint">{column.label}</h2>
                <ul className="mt-3 grid gap-0.5">
                  {column.items.map((item) => (
                    <li key={item.href}>
                      {/* Not fetched ahead: the footer holds every page, and nobody means to open them all. */}
                      <Link href={item.href} prefetch={false} className="body-3 inline-flex min-h-9 items-center text-ink-subtle no-underline hover:text-ink hover:underline">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <p className="body-3 mt-8 max-w-prose text-ink-subtle">
            No website yet? {builder.name}, who make {site.name},{" "}
            <a href={builder.url} rel="noopener">
              build them for Mauritian businesses
            </a>
            .
          </p>
        </div>
      </div>

      <div className="shell border-t border-line py-6">
        <p className="caption-1 max-w-4xl text-ink-faint">
          Map data from{" "}
          <a href={CREDITS.osm.href} rel="noopener">
            {CREDITS.osm.label}
          </a>
          , under the {CREDITS.osm.licence}, as of {day(meta.map.stamp)}. Company facts from{" "}
          <a href={CREDITS.wikidata.href} rel="noopener">
            {CREDITS.wikidata.label}
          </a>
          , {CREDITS.wikidata.licence}. The street map is drawn from{" "}
          <a href={STREET_MAP.credit[0].href} rel="noopener">
            {STREET_MAP.credit[0].label}
          </a>
          &rsquo;s tiles. The pictures behind the page are illustrations made for {site.name}, not photographs. The articles are general information, not legal or tax advice.
        </p>
        <p className="caption-1 mt-4 text-ink-subtle">
          A Digital Experience by{" "}
          <a href={builder.url} rel="noopener" className="font-semibold text-ink">
            {builder.name}
          </a>
        </p>
      </div>
    </footer>
  );
}
