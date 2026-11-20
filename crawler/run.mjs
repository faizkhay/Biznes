// The crawler. Run it to refresh everything the search knows.
//
//   npm run crawl                 everything: the map, Wikidata, the websites, the official pages
//   npm run crawl -- --no-web     the map and Wikidata only; the last website crawl is kept
//
// What it reads and how it behaves is in crawler/config.mjs; what it makes of it is data/index.
// It keeps what it fetched in .crawl, so a second run asks only for what has grown old.
import { spawnSync } from "node:child_process";

// Node's own fetch uses a proxy only when told to. Where one is set, start again with it on.
if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY) {
  const again = spawnSync(process.execPath, process.argv.slice(1), { stdio: "inherit", env: { ...process.env, NODE_USE_ENV_PROXY: "1" } });
  process.exit(again.status ?? 1);
}

const { buildIndex } = await import("./build.mjs");
const { readOfficial, readGuides } = await import("./sources/official.mjs");
const { readOsm } = await import("./sources/osm.mjs");
const { crawlWeb } = await import("./sources/web.mjs");
const { readWikidata } = await import("./sources/wikidata.mjs");

const visit = !process.argv.includes("--no-web");
const started = Date.now();

console.log("The map (OpenStreetMap)");
const osm = await readOsm();
console.log(`  ${osm.counts.listed} places listed from ${osm.counts.candidates} candidates; map as of ${osm.stamp?.slice(0, 10)}`);

console.log("Wikidata");
let organisations = [];
try {
  organisations = await readWikidata();
  console.log(`  ${organisations.length} organisations`);
} catch (error) {
  console.log(`  not read this run: ${error.message}`);
}

console.log(visit ? "The web (one page a site, robots.txt obeyed)" : "The web (not visited this run)");
const seeds = [...osm.listings, ...organisations].filter((e) => e.web).map((e) => ({ url: e.web }));
const web = await crawlWeb(seeds, { visit });
console.log(`  ${JSON.stringify(web.stats)}`);

console.log("The official pages");
const guides = readGuides();
const official = await readOfficial(guides, { visit });
console.log(`  ${official.length} pages from ${guides.length} guides`);

console.log("The index");
const meta = buildIndex({ osm, organisations, web, official, guides });
console.log(`  ${meta.listings.all} listings, ${meta.places} places, ${meta.categories} categories, ${meta.web.sites} sites, written to data/index`);
console.log(`Done in ${Math.round((Date.now() - started) / 1000)} s.`);
