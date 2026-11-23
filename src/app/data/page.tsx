import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Bits";
import { ACTIONS, CREDITS, site } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import { count, day } from "@/lib/format";
import { index } from "@/lib/index";
import { pageMeta } from "@/lib/meta";

export const metadata: Metadata = pageMeta({
  title: "Where the data comes from",
  description: "The sources of biznes.mu: OpenStreetMap, Wikidata, each business's own website and official pages. How results are ordered, and how to correct a listing.",
  path: "/data",
});

export default function DataPage() {
  const { meta, guides, categories } = index();
  const w = meta.web;
  const health = categories.filter((c) => c.group === "health").map((c) => c.label.toLowerCase());
  return (
    <>
      <PageHead here="/data" title="Where the data comes from" lede="Nothing in the index is typed in by hand or made up. Every listing comes from an open source, says which, and can be corrected or removed by the business it describes." />
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
            <dt>Articles</dt>
            <dd className="data-1">{count(guides.length)}</dd>
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

        <section aria-labelledby="order" className="max-w-3xl">
          <h2 id="order" className="heading-2">
            How results are ordered
          </h2>
          <div className="prose body-2 mt-4">
            {/* Said only once owners can list a business themselves: it is the one thing not drawn from an open source. */}
            {accountsOn && (
              <>
                <p>
                  <strong>A business&rsquo;s own listing.</strong> An owner can create an account and list a business, or claim a listing that is already here. A person at {site.name} checks each one before anything changes. Its details are then the owner&rsquo;s own words, and its page says so. A claimed listing on the free plan is marked &ldquo;Claimed by its owner&rdquo;.
                </p>
                  </>
            )}
            <p>
              <strong>What comes first on a page of results.</strong> The order is the same for every question. First, the pages of this site that answer it: an article, one of its facts, a number to call, a public holiday&rsquo;s date, a glossary term, a tool. A page counts as an answer only when the question&rsquo;s words are in its own title, label or heading; a number or a date, only when they are there whole. Then businesses and services. Then the parts of our articles that only mention the words. Pages on other sites, official ones first, are folded away as references. Among our own pages, an article whose own title holds the question&rsquo;s words counts for more than a line from another article that mentions them.
            </p>
            <p>
              <strong>The order of businesses.</strong> Listings that answer a question are ordered by how well they answer it, and then by how full they are: one with a telephone number, a website and its hours is shown before a bare name. A category&rsquo;s page and a town&rsquo;s page list the fullest first.
            </p>
            <p>
              <strong>How well a listing answers.</strong> The search engine is this site&rsquo;s own, and it weighs every listing the same way. A word of the question counts most in a business&rsquo;s name, then in another name it goes by, then in the kind of business it is, then in its address, then in its description. A name that is exactly what was typed comes before a longer name that holds the same words: &ldquo;MCB&rdquo; finds the branches called MCB first. A business asked for by its whole name is shown first even when its name reads as a kind of business in a town, as &ldquo;Ebene Pharmacy&rdquo; does. Words that stand side by side in a name, as they were typed, count for more than the same words apart. A rare word says more than a common one, and a word in a short name more than the same word in a long one. A listing that holds every word of the question comes before one that holds only some of them.
            </p>
            <p>
              <strong>Words half typed, and typing mistakes.</strong> A word still being typed finds the longer words that begin with it, and they count for less than the word written out. When nothing matches as written, the engine looks for close spellings: a letter missing, a letter too many, a wrong letter, or two letters that changed places. One such slip is allowed in a word of four letters or more, and two between words of eight letters or more. A close spelling always counts for less than the word spelt right, and the page says when close spellings are shown. A town or a kind of business typed wrongly, such as &ldquo;pharmcy&rdquo; or &ldquo;restorant&rdquo;, is read as the word meant when one word is plainly the nearest.
            </p>
            <p>
              <strong>Health.</strong> In the health categories ({health.join(", ")}), a listing with a telephone number on record is shown before one without, in a search and on the category&rsquo;s own page. Someone unwell needs a number to call. Among those with a number, and among those without, the order is as everywhere else.
            </p>
            <p>
              <strong>Paid plans.</strong> A business on a paid plan (<Link href="/pricing">Biznes Go or Biznes Grow</Link>) that we have verified is shown before others that answer equally well, and it is marked as a priority listing, so that a paid place is never mistaken for a better answer. On <Link href="/baz-manzer">Baz Manzer</Link> the verified outlets come first for the same reason, and are marked the same way.
            </p>
            <p>Paying changes nothing else: not what a listing says about anyone, not the guides, not the official pages.</p>
          </div>
        </section>

        <section aria-labelledby="not" className="max-w-3xl">
          <h2 id="not" className="heading-2">
            What is not here
          </h2>
          <div className="prose body-2 mt-4">
            <ul>
              <li>No email addresses in the index. The crawler takes none from any source, so the index cannot be mined for them. An account, if you make one, holds the address you give it and nothing else does.</li>
              <li>No reviews or ratings of our own.</li>
              <li>No promise that a listing is current. Each one is as the map last recorded it, and says when that was. Most were last edited more than two years ago.</li>
              <li>Not every business. The map is fullest for shops, food and places to stay, and thin for offices and trades.</li>
              <li>No company register. Whether a business is registered, licensed or solvent is for the official registers to say: <Link href="/tools/verify">check a business</Link> lists them.</li>
              <li>No judgement. Nobody at biznes.mu has visited or vetted a listed business. The one exception is the verified mark: it means we have checked that the business is real, and nothing more.</li>
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
