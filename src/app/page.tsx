import Link from "next/link";
import { PageIcon } from "@/components/Glyphs";
import JsonLd from "@/components/JsonLd";
import Leaves from "@/components/Leaves";
import LeavesToggle from "@/components/LeavesToggle";
import SearchBox from "@/components/SearchBox";
import { Chevron } from "@/components/Icons";
import { ABOUT, HOME, LANDING, MENU, MORE_PAGE, site } from "@/data/site";
import { FALLS } from "@/data/themes";
import { count } from "@/lib/format";
import { index } from "@/lib/index";
import { pageMeta } from "@/lib/meta";
import { publisher } from "@/lib/schema";
import { siteUrl } from "@/lib/site-url";
import { themeNow } from "@/lib/theme";

export const metadata = pageMeta({ title: `${site.name} · ${site.line}`, description: site.summary, path: "/", whole: true });

/** The few pages the landing page names at its foot: who makes the site, what it keeps, and the page of every page, by the name the phone's bar gives it. */
const FOOT = [...ABOUT.filter((page) => page.href === "/about" || page.href === "/privacy").map((page) => ({ href: page.href, label: page.label })), { href: MORE_PAGE.href, label: MORE_PAGE.label }];

/** The pages the keys lead to, each with the name and the line the menu gives it. */
const KEYS = LANDING.quick.flatMap((href) => MENU.flatMap((group) => group.items.filter((item) => item.href === href)));

/**
 * The landing page: the front door of a search engine. Its first screen is the day's picture, the
 * site's one line, the search box, and one button, "Home", which leads to everything else
 * (src/app/home). Over the picture, behind the words, a few petals or leaves of the season fall,
 * for a visitor whose device allows motion. At the foot of that screen a small line asks the
 * question the next part answers, and holds the control for what falls.
 *
 * Under it, one short section on a sheet of its own (the owner, 24 November 2026: "a short section
 * below, creative but minimalist to inform people what this website is about and quick
 * navigations keys"): what the site is, in its own sentence, three counts from the index, the
 * pages most people want as a row of keys, and the line that was the page's foot. The header here
 * holds only the name, the cart and the account, the phone's bar is not shown, and there is no
 * footer card (see "Home and the landing page" in globals.css).
 */
export default async function Landing() {
  const { meta, guides } = index();
  const theme = await themeNow();
  // What the index holds, as three counts, each leading to where it can be seen.
  const holds = [
    { figure: meta.listings.all, label: "businesses and services", href: "/directory" },
    { figure: meta.towns, label: "towns and villages", href: "/places" },
    { figure: guides.length, label: "articles, each fact with its source", href: "/learn" },
  ];
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

      {/* What falls over the picture through the season, behind the words. It is not shown until the control in the foot line says a visitor may have motion. */}
      <Leaves fall={theme.fall} />

      {/* The first screen: the greeting, the site's line, the search, and the way on. */}
      <div className="landing-first">
        <section className="hero-open shell">
          <Link prefetch={false} href="/data" className="pill-note caption-1">
            <span>
              {theme.greeting}. {count(meta.listings.all)} businesses and services<span className="hidden sm:inline">, {count(meta.towns)} towns and villages</span>
            </span>
          </Link>
          <h1 className="display-1 mx-auto max-w-4xl">{site.line}</h1>
          <div className="landing-search">
            <SearchBox size="lg" deskFocus hotkey id="home-search" />
          </div>
          <p>
            <Link href={HOME.href} className="btn btn-ink button-md">
              <PageIcon href={HOME.href} />
              {HOME.label}
            </Link>
          </p>
        </section>

        {/* At the foot of the first screen: the way down to what the site is, and the control for what falls. */}
        <div className="landing-foot caption-1">
          <a href="#about" className="landing-cue">
            {LANDING.cue}
            <Chevron />
          </a>
          <LeavesToggle name={FALLS[theme.fall].name} />
        </div>
      </div>

      {/* What the site is, what it holds, and the pages most people want, as keys. */}
      <section id="about" className="landing-about" aria-labelledby="about-title">
        <div className="shell">
          <div className="landing-about-in">
            <div>
              <h2 id="about-title" className="heading-1">
                {LANDING.title}
              </h2>
              <p className="body-1 mt-4 max-w-prose text-ink-subtle">{site.description}</p>
              <ul className="landing-holds mt-8">
                {holds.map((part) => (
                  <li key={part.href}>
                    <Link prefetch={false} href={part.href}>
                      <span className="heading-2 tabular block">{count(part.figure)}</span>
                      <span className="body-3 block text-ink-subtle">{part.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <nav aria-labelledby="keys-title">
              <h3 id="keys-title" className="label-1 text-ink-faint">
                {LANDING.keys}
              </h3>
              <ul className="keys mt-4">
                {KEYS.map((page) => (
                  <li key={page.href}>
                    <Link prefetch={false} href={page.href} className="key" title={page.line}>
                      <span className="key-icon" aria-hidden>
                        <PageIcon href={page.href} />
                      </span>
                      <span className="title-2">{page.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* In the footer's place: whose product this is, in the owner's words, and three pages. */}
          <div className="landing-credit caption-1">
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
      </section>
    </div>
  );
}
