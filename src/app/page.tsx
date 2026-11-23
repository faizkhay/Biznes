import Link from "next/link";
import { PageIcon } from "@/components/Glyphs";
import JsonLd from "@/components/JsonLd";
import SearchBox from "@/components/SearchBox";
import { ABOUT, HOME, MORE_PAGE, site } from "@/data/site";
import { count } from "@/lib/format";
import { index } from "@/lib/index";
import { pageMeta } from "@/lib/meta";
import { publisher } from "@/lib/schema";
import { siteUrl } from "@/lib/site-url";
import { themeNow } from "@/lib/theme";

export const metadata = pageMeta({ title: `${site.name} · ${site.line}`, description: site.summary, path: "/", whole: true });

/** The few pages the landing page names at its foot: who makes the site, what it keeps, and the page of every page. */
const FOOT = [...ABOUT.filter((page) => page.href === "/about" || page.href === "/privacy").map((page) => ({ href: page.href, label: page.label })), { href: MORE_PAGE.href, label: MORE_PAGE.all }];

/**
 * The landing page: the front door of a search engine. The day's picture, the site's one line,
 * the search box, and one button, "Home", which leads to everything else (src/app/home). It is
 * one screen at a desk and on a phone: nothing lies under it. The header here holds only the
 * name, the cart and the account, the phone's bar is not shown, and in the footer's place there
 * is one quiet line (see "Home and the landing page" in globals.css).
 */
export default async function Landing() {
  const { meta } = index();
  const theme = await themeNow();
  const { builder } = site;
  return (
    <div className="landing">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: site.name,
            url: siteUrl,
            description: site.description,
            inLanguage: "en",
            publisher: publisher(),
            potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/search?q={query}` }, "query-input": "required name=query" },
          },
          // Who is behind the site: the company, as it is registered, and how to reach it.
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: builder.legalName,
            alternateName: builder.name,
            url: builder.url,
            identifier: builder.brn,
            telephone: site.contact.phone,
            email: site.contact.email,
            address: { "@type": "PostalAddress", addressCountry: "MU" },
            brand: { "@type": "Brand", name: site.name, url: siteUrl },
          },
        ]}
      />

      {/* The one screen: the greeting, the site's line, the search, and the way on. */}
      <section className="hero-open shell">
        <Link prefetch={false} href="/data" className="pill-note caption-1">
          <span>
            {theme.greeting}. {count(meta.listings.all)} businesses and services<span className="hidden sm:inline">, {count(meta.towns)} towns and villages</span>
          </span>
        </Link>
        <h1 className="display-1 mx-auto mt-6 max-w-4xl">{site.line}</h1>
        <div className="mt-8 w-full max-w-2xl">
          <SearchBox size="lg" deskFocus hotkey id="home-search" />
        </div>
        <p className="mt-6">
          <Link href={HOME.href} className="btn btn-ink button-md landing-home">
            <PageIcon href={HOME.href} />
            {HOME.label}
          </Link>
        </p>
      </section>

      {/* In the footer's place: whose product this is, in the owner's words, and three pages. */}
      <div className="landing-foot caption-1">
        <p>
          {site.name} is a product of{" "}
          <a href={builder.url} rel="noopener">
            {builder.name}
          </a>
          , developed by {builder.developer}.
        </p>
        <nav aria-label="About this site">
          <ul>
            {FOOT.map((page) => (
              <li key={page.href}>
                <Link prefetch={false} href={page.href}>
                  {page.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
