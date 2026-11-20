import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Bits";
import { site } from "@/data/site";
import { index } from "@/lib/index";
import { pageMeta } from "@/lib/meta";

export const metadata: Metadata = pageMeta({
  title: `${site.bot.name}, our crawler`,
  description: `How ${site.bot.name}, the crawler of biznes.mu, behaves: what it reads, how it obeys robots.txt, and how to keep it out or have a page forgotten.`,
  path: site.bot.path,
});

export default function BotPage() {
  const { crawler } = index().meta;
  const seconds = crawler.pause / 1000;
  return (
    <>
      <PageHead here="/bot" title={`${site.bot.name}, our crawler`} lede="If you run a website and found this page from your server's log, this is who visited, what it took, and how to stop it." />
      <div className="shell grid gap-12 *:max-w-3xl">
        <section aria-labelledby="does">
          <h2 id="does" className="heading-2">
            What it does
          </h2>
          <div className="prose body-2 mt-4">
            <ul>
              <li>
                It reads {crawler.pagesPerSite === 1 ? "one page a site: the front page" : `${crawler.pagesPerSite} pages a site`}. It does not go through a site page by page.
              </li>
              <li>It reads robots.txt first, and does what it says. A site whose robots.txt cannot be read is left alone.</li>
              <li>It waits at least {seconds} seconds between two requests to the same site, and longer if the site&rsquo;s robots.txt asks for a crawl delay.</li>
              <li>It reads only HTML, and only the first part of a very large page. It fills in no form, signs in to nothing and runs no script.</li>
              <li>From a page it takes the title, the page&rsquo;s own description, its language, what it declares about the organisation in schema.org markup, a telephone link, and links to social profiles. It never takes an email address.</li>
              <li>It notes the other sites a page links to, and visits the front page of those whose address ends in {crawler.follows.join(" or ")}.</li>
              <li>On the sites of a few chambers and associations it also reads the pages that list their members, to find those members&rsquo; own sites.</li>
              <li>It comes back at most once a week.</li>
            </ul>
          </div>
        </section>

        <section aria-labelledby="stop">
          <h2 id="stop" className="heading-2">
            Keeping it out
          </h2>
          <div className="prose body-2 mt-4">
            <p>
              Its name in robots.txt is <span className="data-1">{crawler.robots}</span>. To keep it off your whole site, add these two lines to your robots.txt:
            </p>
            <pre className="note data-1 overflow-x-auto">
              User-agent: {crawler.robots}
              {"\n"}Disallow: /
            </pre>
            <p>Rules written for every crawler (User-agent: *) are obeyed too. To have a page it has already read forgotten at once, ask us and it will be.</p>
          </div>
          <p className="mt-6">
            <Link href="/add" className="btn btn-quiet button-md">
              Ask us
            </Link>
          </p>
        </section>

        <section aria-labelledby="why">
          <h2 id="why" className="heading-2">
            Why it visits
          </h2>
          <div className="prose body-2 mt-4">
            <p>
              biznes.mu is a search engine for business in Mauritius. A business listed on it is described in its own words where it has a website, and the crawler is how those words are fetched. <Link href="/data">Where the data comes from</Link> says the rest.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
