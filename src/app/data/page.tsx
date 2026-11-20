import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Bits";
import { ACTIONS, CREDITS, site } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import { count, day } from "@/lib/format";
import { index } from "@/lib/index";

export const metadata: Metadata = {
  title: "Where the data comes from",
  description: "The sources of biznes.mu: OpenStreetMap, Wikidata, each business's own website and official pages. Their licences, what is taken from each, what is never taken, and how to correct or remove a listing.",
  alternates: { canonical: "/data" },
};

export default function DataPage() {
  const { meta } = index();
  const w = meta.web;
  return (
    <>
      <PageHead title="Where the data comes from" lede="Nothing in the index is typed in by hand or made up. Every listing comes from an open source, says which, and can be corrected or removed by the business it describes." />
      <div className="shell grid gap-12">
        <section aria-labelledby="last" className="max-w-3xl">
          <h2 id="last" className="heading-2">
            The last run
          </h2>
          <dl className="facts body-3 mt-6">
            <dt>Index built</dt>
            <dd className="data-1">{day(meta.generated)}</dd>
            <dt>Map data as of</dt>
            <dd className="data-1">{day(meta.map.stamp)}</dd>
            <dt>Listings</dt>
            <dd>
              <span className="data-1">{count(meta.listings.all)}</span>: {count(meta.listings.onTheMap)} from the map, {count(meta.listings.fromWikidata)} known only to Wikidata
            </dd>
            <dt>Towns and villages</dt>
            <dd>
              <span className="data-1">{count(meta.towns)}</span>, and {count(meta.places - meta.towns)} neighbourhoods within them
            </dd>
            <dt>With a telephone number</dt>
            <dd className="data-1">{count(meta.listings.withPhone)}</dd>
            <dt>With a website</dt>
            <dd className="data-1">{count(meta.listings.withWebsite)}</dd>
            <dt>With opening hours</dt>
            <dd className="data-1">{count(meta.listings.withHours)}</dd>
            {w.visited ? (
              <>
                <dt>Websites visited</dt>
                <dd>
                  <span className="data-1">{count(w.visited)}</span>: {count(w.read ?? 0)} read, {count(w.refused ?? 0)} left alone because their robots.txt asked, {count(w.unreachable ?? 0)} did not answer
                </dd>
              </>
            ) : null}
            <dt>Mauritian websites indexed</dt>
            <dd className="data-1">{count(w.sites)}</dd>
            <dt>Guides</dt>
            <dd className="data-1">{count(meta.guides)}</dd>
            <dt>Official pages</dt>
            <dd className="data-1">{count(meta.official)}</dd>
          </dl>
        </section>

        <section aria-labelledby="sources" className="max-w-3xl">
          <h2 id="sources" className="heading-2">
            The sources
          </h2>
          <div className="prose body-2 mt-4">
            <p>
              <strong>OpenStreetMap.</strong> The names, places, addresses, telephone numbers, websites and opening hours of businesses and services come from OpenStreetMap, the map made by volunteers. It is © <a href={CREDITS.osm.href}>{CREDITS.osm.label}</a> and published under the {CREDITS.osm.licence}. The island&rsquo;s outline, its districts and the boundaries of its towns and villages are from the same map. Because the licence asks that data derived from the map stays open, the index built from it can be downloaded below, under the same licence.
            </p>
            <p>
              <strong>Wikidata.</strong> A one-line description of a company, the year it began, its industry and its stock exchange come from <a href={CREDITS.wikidata.href}>{CREDITS.wikidata.label}</a>, published under {CREDITS.wikidata.licence}. An organisation Wikidata records as dissolved is left out.
            </p>
            <p>
              <strong>A business&rsquo;s own website.</strong> Where a listing names a website, our crawler reads its front page and takes what the page says about itself: its title, its own description, a telephone number it publishes, and links to its profiles on social networks. A description taken this way is shown as the business&rsquo;s own words. See <Link href={site.bot.path}>how the crawler behaves</Link>.
            </p>
            <p>
              <strong>Official pages.</strong> The guides are written from the pages of the bodies concerned and from the Acts, read one at a time. Each guide lists its sources and the day it was checked.
            </p>
          </div>
        </section>

        {/* Said only once owners can list a business themselves: it is the one thing not drawn from an open source. */}
        {accountsOn && (
          <section aria-labelledby="order" className="max-w-3xl">
            <h2 id="order" className="heading-2">
              Listed by its owner, and the order of results
            </h2>
            <div className="prose body-2 mt-4">
              <p>
                <strong>A business&rsquo;s own listing.</strong> An owner can create an account and list a business, or claim a listing that is already here. A person at {site.name} checks each one before anything changes. Its details are then the owner&rsquo;s own words, and its page says so. A claimed listing on the free plan is marked &ldquo;Claimed by its owner&rdquo;.
              </p>
              <p>
                <strong>The order of results.</strong> Listings that answer a question are ordered by how well they answer and how full they are. One thing comes before that, and it is paid for: a business on Biznes Go or Biznes Grow that we have verified is shown first among the listings that answer, and it is marked &ldquo;Verified&rdquo; and &ldquo;Priority listing&rdquo; wherever it is shown. A search for a business by its own name still shows that business first. Paying never hides another listing, changes what a listing says about someone else, or buys a place in a guide. <Link href="/pricing">The plans</Link>.
              </p>
            </div>
          </section>
        )}

        <section aria-labelledby="not" className="max-w-3xl">
          <h2 id="not" className="heading-2">
            What is not here
          </h2>
          <div className="prose body-2 mt-4">
            <ul>
              <li>No email addresses. They are not taken from any source, so the index cannot be mined for them.</li>
              <li>{accountsOn ? "No reviews or ratings of our own. A fuller listing is shown before a barer one. The one place that is paid for is always marked: see above." : "No reviews, ratings or rankings of our own. A fuller listing is shown before a barer one, and that is the only order there is."}</li>
              <li>No promise that a listing is current. Each one is as the map last recorded it, and says when that was. Most were last edited more than two years ago.</li>
              <li>Not every business. The map is fullest for shops, food and places to stay, and thin for offices and trades.</li>
              <li>No company register. Whether a business is registered, licensed or solvent is for the official registers to say: <Link href="/tools/verify">check a business</Link> lists them.</li>
              <li>No judgement. Nobody at biznes.mu has visited or vetted a listed business.</li>
            </ul>
          </div>
        </section>

        <section aria-labelledby="chart" className="max-w-3xl">
          <h2 id="chart" className="heading-2">
            The chart
          </h2>
          <div className="prose body-2 mt-4">
            <p>The picture of the island on this site is drawn from the index: each point is one listing at the position the map gives it. Rodrigues is shown in an inset at a smaller scale than the main island, because it lies far to the east. Listings with no position, and those on the outer islands, are in the lists but not on the chart.</p>
          </div>
        </section>

        <section aria-labelledby="open" className="max-w-3xl">
          <h2 id="open" className="heading-2">
            The index is open
          </h2>
          <div className="prose body-2 mt-4">
            <p>
              The listings, places and outlines are derived from OpenStreetMap, so they are yours to copy, share and adapt under the {CREDITS.osm.licence}, as long as you credit OpenStreetMap&rsquo;s contributors and keep what you derive from them open in the same way.
            </p>
          </div>
          <ul className="narrow mt-2">
            {[
              ["listings.json", "Listings"],
              ["places.json", "Places"],
              ["categories.json", "Categories"],
              ["geo.json", "Outlines"],
              ["sites.json", "Websites"],
              ["meta.json", "The last run"],
            ].map(([file, label]) => (
              <li key={file}>
                <a href={`/data/${file}`} className="body-3" download>
                  {label} <span className="data-2 text-ink-faint">{file}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="correct" className="max-w-3xl">
          <h2 id="correct" className="heading-2">
            Correcting or removing a listing
          </h2>
          <div className="prose body-2 mt-4">
            <p>If a listing is yours, or you know it is wrong, tell us what to change. If you want a listing taken out, ask, and it will be. The surest fix is at the source: a correction made on OpenStreetMap reaches this site at the next crawl and every other map that uses it.</p>
          </div>
          <p className="mt-6">
            <Link href="/add" className="btn btn-filled button-md">
              {ACTIONS.add}
            </Link>
          </p>
        </section>
      </div>
    </>
  );
}
