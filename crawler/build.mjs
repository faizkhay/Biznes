// Puts what the sources found into the index the site is built from (data/index).
//
// One listing per place or organisation, each saying where every part of it came from; the towns,
// districts and categories with their counts; the Mauritian sites found by following links; the
// official pages; the island's outline; and a note of what this run did.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "./config.mjs";
import { hostOf, slugify } from "./lib/text.mjs";
import { CATEGORIES, GROUPS } from "./taxonomy.mjs";

/** Words that mark a description written by whoever broke into a site, not by its owner. */
export const HIJACKED = /\b(casino|jackpots?|slots?|betting|togel|judi|poker|sportsbook)\b/i;

const drop = (object) => Object.fromEntries(Object.entries(object).filter(([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && !v.length) && !(typeof v === "object" && !Array.isArray(v) && !Object.keys(v).length)));

export function buildIndex({ osm, organisations, web, official, guides }) {
  const listings = osm.listings.map((l) => ({ ...l }));
  const byWikidata = new Map(listings.filter((l) => l.wikidata).map((l) => [l.wikidata, l]));

  // Wikidata: join an organisation to its place on the map, or list it by itself. One is the same
  // as a place on the map when the map names its identifier, or when both have the same name and
  // stand within 400 metres of each other (or the name is used once on the whole map).
  const byName = new Map();
  for (const l of listings) {
    const key = slugify(l.name);
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push(l);
  }
  const sameAs = (org) => {
    const same = [org.name, ...org.alt].flatMap((name) => byName.get(slugify(name)) ?? []).filter((l) => !l.src.wikidata);
    if (org.lon != null) return same.find((l) => Math.hypot((l.lon - org.lon) * 104, (l.lat - org.lat) * 111) < 0.4);
    return same.length === 1 ? same[0] : undefined;
  };
  // What Wikidata calls a thing decides its category here; anything else is a company or organisation.
  const KINDS = [
    [/guest ?house|hostel|bed and breakfast|villa|apartment/i, "guest-houses"],
    [/hotel|resort|lodging/i, "hotels"],
    [/\bbank\b/i, "banks"],
    [/insurance/i, "insurance"],
    [/universit|college|higher education|institute of technology/i, "colleges"],
    [/\bschool\b/i, "schools"],
    [/hospital/i, "hospitals"],
    [/museum|theatre|cinema|zoo|botanical|tourist attraction|art gallery/i, "attractions"],
    [/restaurant/i, "restaurants"],
    [/supermarket|hypermarket|retail chain/i, "supermarkets"],
    [/shopping (centre|center|mall)/i, "malls"],
    [/librar/i, "community"],
  ];
  let joined = 0;
  let added = 0;
  for (const org of organisations) {
    const called = [...org.types, ...org.industries].join(" ");
    const kind = org.industries[0] ?? org.types.find((t) => !/^(business|company|organi[sz]ation|enterprise)$/i.test(t));
    const mine = byWikidata.get(org.id) ?? sameAs(org);
    if (mine) {
      joined++;
      if (!mine.about && org.about) Object.assign(mine, { about: org.about, aboutFrom: "wikidata" });
      mine.since ??= org.since;
      mine.web ??= org.web;
      mine.exchange = org.exchange;
      mine.src.wikidata = org.id;
      mine.wikidata = org.id;
      continue;
    }
    const where = org.lon != null && org.lat != null && org.lon > 56 && org.lon < 64 && org.lat < -10 && org.lat > -21 ? osm.locate([org.lon, org.lat]) : {};
    listings.push({
      id: `q${org.id.slice(1)}`,
      name: org.name,
      alt: org.alt.slice(0, 4),
      cat: KINDS.find(([pattern]) => pattern.test(called))?.[1] ?? "companies",
      kind: kind ? kind[0].toUpperCase() + kind.slice(1) : undefined,
      lon: where.region ? Math.round(org.lon * 1e5) / 1e5 : undefined,
      lat: where.region ? Math.round(org.lat * 1e5) / 1e5 : undefined,
      ...where,
      seat: org.seat,
      phone: [],
      web: org.web,
      social: {},
      about: org.about,
      aboutFrom: org.about ? "wikidata" : undefined,
      extras: [],
      since: org.since,
      exchange: org.exchange,
      wikidata: org.id,
      src: { wikidata: org.id },
    });
    added++;
  }

  // The web: what each listing's own site says about itself.
  const taken = new Set();
  let enriched = 0;
  for (const l of listings) {
    const host = l.web ? hostOf(l.web) : null;
    const page = host ? web.pages[host] : null;
    if (!page) continue;
    taken.add(host);
    if (page.url && hostOf(page.url)) taken.add(hostOf(page.url));
    if (page.status >= 200 && page.status < 400 && page.title && !page.parked) {
      l.site = { title: page.title, checked: page.checked, lang: page.lang || undefined };
      const said = page.declared?.description || page.description;
      // A site that has been taken over says so in its description before anywhere else. Words
      // that sell gambling on the page of a school or a ministry are not the business's own.
      if (!l.about && said && said.length > 40 && !(HIJACKED.test(said) && !/casino|gaming|betting/.test(l.cat))) Object.assign(l, { about: said, aboutFrom: "site" });
      if (!l.phone.length && page.tel) Object.assign(l, { phone: [page.tel], phoneFrom: "site" });
      for (const [name, address] of Object.entries(page.social ?? {})) l.social[name] ??= address;
      l.src.site = { url: page.url, checked: page.checked };
      enriched++;
    } else if (page.status === 404 || page.status === 410) {
      // The site itself answered that the page is not there. Only that is said on a listing: a site
      // that could not be reached may be the fault of the line, and is not held against it.
      l.site = { checked: page.checked, gone: true };
    }
  }

  // Mauritian sites found by following links, which belong to no listing.
  const sites = Object.values(web.pages)
    .filter((p) => !taken.has(p.host) && p.status >= 200 && p.status < 400 && p.title && p.title.length > 3 && !p.parked && (p.words ?? 0) >= 40)
    // Mauritian: its address ends in .mu, or the page itself says it is in Mauritius.
    .filter((p) => p.host.endsWith(".mu") || (hostOf(p.url) ?? "").endsWith(".mu") || p.mauritian)
    .filter((p) => !p.hub)
    // A title that is a template's own placeholder says the site is not finished.
    .filter((p) => !/^[#{[%<]|site_title|^(home|accueil|index|welcome)$/i.test(p.title.trim()))
    .map((p) => drop({ host: p.host, url: p.url, title: p.title, name: p.declared?.name || p.siteName || undefined, about: p.declared?.description || p.description || undefined, lang: p.lang || undefined, checked: p.checked }))
    .sort((a, b) => a.host.localeCompare(b.host));

  // Towns and villages: every council area with a listing, and every nearer named place with eight or more.
  const places = new Map();
  const place = (name, kind) => {
    const slug = slugify(name);
    if (!places.has(slug)) places.set(slug, { slug, name, kind, n: 0, lon: 0, lat: 0, districts: {}, regions: {}, towns: {} });
    return places.get(slug);
  };
  const tally = (p, l) => {
    p.n++;
    if (l.lon != null) {
      p.lon += l.lon;
      p.lat += l.lat;
    }
    if (l.district) p.districts[l.district] = (p.districts[l.district] ?? 0) + 1;
    if (l.region) p.regions[l.region] = (p.regions[l.region] ?? 0) + 1;
  };
  for (const l of listings) if (l.place) tally(place(l.place, "town"), l);
  const areaCounts = new Map();
  for (const l of listings) if (l.area) areaCounts.set(l.area, (areaCounts.get(l.area) ?? 0) + 1);
  for (const l of listings) {
    if (!l.area) continue;
    const slug = slugify(l.area);
    if (places.has(slug) && places.get(slug).kind === "town") {
      // The nearer place is itself a town: it adds nothing to the listing.
      if (slug === slugify(l.place ?? "")) delete l.area;
      continue;
    }
    if (areaCounts.get(l.area) >= 8) {
      const area = place(l.area, "area");
      tally(area, l);
      // A neighbourhood is listed under the town most of it lies in.
      if (l.place) area.towns[l.place] = (area.towns[l.place] ?? 0) + 1;
    }
  }
  const top = (counts) => Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  // A listing whose district the boundaries could not say takes the district of most of its town.
  for (const l of listings) if (!l.district && l.place) l.district = top(places.get(slugify(l.place))?.districts ?? {});
  const placeList = [...places.values()]
    .map((p) => drop({ slug: p.slug, name: p.name, kind: p.kind, n: p.n, lon: p.n ? Math.round((p.lon / p.n) * 1e5) / 1e5 : undefined, lat: p.n ? Math.round((p.lat / p.n) * 1e5) / 1e5 : undefined, district: top(p.districts), region: top(p.regions), within: p.kind === "area" && top(p.towns) ? slugify(top(p.towns)) : undefined }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const placeSlugs = new Set(placeList.map((p) => p.slug));

  // Each listing's address on the site, and how complete it is.
  const out = listings.map((l) => {
    const placeSlug = l.place && placeSlugs.has(slugify(l.place)) ? slugify(l.place) : undefined;
    const areaSlug = l.area && placeSlugs.has(slugify(l.area)) && places.get(slugify(l.area)).kind === "area" ? slugify(l.area) : undefined;
    const full = (l.phone.length ? 2 : 0) + (l.web ? 2 : 0) + (l.hours ? 1 : 0) + (l.street ? 1 : 0) + (l.about ? 1 : 0) + (l.site?.title ? 1 : 0) + (l.wikidata ? 1 : 0);
    return drop({
      ...l,
      slug: `${[slugify(l.name), placeSlug].filter(Boolean).join("-") || "listing"}-${l.id}`,
      placeSlug,
      areaSlug,
      districtSlug: l.district ? slugify(l.district) : undefined,
      full,
      tag: undefined,
    });
  });
  out.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

  const catCounts = {};
  for (const l of out) catCounts[l.cat] = (catCounts[l.cat] ?? 0) + 1;
  const categories = CATEGORIES.map((c) => ({ id: c.id, group: c.group, label: c.label, one: c.one, words: c.words, hints: c.hints, n: catCounts[c.id] ?? 0 })).filter((c) => c.n > 0);
  const groups = GROUPS.map((g) => ({ ...g, n: categories.filter((c) => c.group === g.id).reduce((sum, c) => sum + c.n, 0) })).filter((g) => g.n > 0);

  const districtCounts = {};
  for (const l of out) if (l.districtSlug) districtCounts[l.districtSlug] = (districtCounts[l.districtSlug] ?? 0) + 1;
  const districts = osm.geo.districts.map((d) => ({ slug: d.slug, name: d.name, n: districtCounts[d.slug] ?? 0 }));

  const meta = {
    generated: new Date().toISOString(),
    map: { stamp: osm.stamp, from: osm.from.startsWith("http") ? hostOf(osm.from) : osm.from, ...osm.counts },
    listings: { all: out.length, onTheMap: osm.listings.length, fromWikidata: added, joinedToWikidata: joined, withPhone: out.filter((l) => l.phone?.length).length, withWebsite: out.filter((l) => l.web).length, withHours: out.filter((l) => l.hours).length, withAbout: out.filter((l) => l.about).length },
    web: { ...web.stats, enriched, sites: sites.length },
    places: placeList.length,
    towns: placeList.filter((p) => p.kind === "town").length,
    categories: categories.length,
    guides: guides.length,
    official: official.length,
    crawler: { robots: config.robotsToken, pause: config.web.hostDelayMs, pagesPerSite: config.web.pagesPerHost, follows: config.web.follow },
  };

  mkdirSync(config.outDir, { recursive: true });
  const write = (name, value) => writeFileSync(join(config.outDir, name), `${JSON.stringify(value)}\n`);
  write("listings.json", out);
  write("places.json", placeList);
  write("categories.json", { groups, categories });
  write("districts.json", districts);
  write("geo.json", osm.geo);
  write("sites.json", sites);
  write("official.json", official);
  writeFileSync(join(config.outDir, "meta.json"), `${JSON.stringify(meta, null, 2)}\n`);
  return meta;
}
