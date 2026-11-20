// The crawler's settings. Everything here can be changed without touching the code that crawls.

export const config = {
  /**
   * How the crawler names itself to the sites it visits. Set CRAWLER_USER_AGENT to the site's own
   * bot once the site is live and its /bot page can be read, for example:
   *   CRAWLER_USER_AGENT="BiznesBot/1.0 (+https://biznes.mu/bot)"
   * Until then it says only that it is a directory crawler.
   */
  userAgent: process.env.CRAWLER_USER_AGENT || "Mozilla/5.0 (compatible; directory-crawler/1.0)",

  /**
   * The crawler's name in a robots.txt file. A site that writes rules for this name is obeyed by
   * them; every site's rules for "*" are obeyed whatever this is.
   */
  robotsToken: process.env.CRAWLER_ROBOTS_TOKEN || "BiznesBot",

  /** Where downloads and fetched pages are kept between runs. Not committed. */
  cacheDir: ".crawl",
  /** Where the finished index is written. Committed: the site is built from it. */
  outDir: "data/index",

  osm: {
    /** The country extract of OpenStreetMap, tried in order. */
    mirrors: [
      "https://download.openstreetmap.fr/extracts/africa/mauritius-latest.osm.pbf",
      "https://download.geofabrik.de/africa/mauritius-latest.osm.pbf",
    ],
    /** A downloaded extract is used again until it is this old. */
    maxAgeHours: 24,
  },

  wikidata: {
    endpoint: "https://query.wikidata.org/sparql",
    maxAgeHours: 24,
  },

  web: {
    /** At most this many sites are visited in one run. */
    maxHosts: 2400,
    /** Of those, at most this many are sites found by following links, not named by a listing. */
    maxDiscovered: 1600,
    /** Pages read on any one site: its front page, and no more. */
    pagesPerHost: 1,
    /** On a hub (crawler/seeds.mjs), also this many of its own pages that list members. */
    hubPages: 24,
    /** Sites being read at the same moment. One site is never asked for two things at once. */
    concurrency: 8,
    /** The shortest pause between two requests to the same site, in milliseconds. */
    hostDelayMs: 1500,
    /** A site that has not answered in this long is left alone. */
    timeoutMs: 15000,
    /** No more than this much of a page is read. */
    maxBytes: 900_000,
    /** A page fetched less than this long ago is not fetched again. */
    maxAgeHours: 24 * 7,
    /** Only sites under these endings are followed when found through a link. */
    follow: [".mu"],
  },
};
