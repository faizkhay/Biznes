// Wikidata: the companies and organisations of Mauritius it describes.
//
// Wikidata is published under CC0, so its statements can be reused freely. From it come a
// one-line description of an organisation, its official website, the year it began, its industry,
// and whether it is listed on a stock exchange. A listing found on the map that carries a Wikidata
// identifier is joined to its entry here; an organisation with no place on the map is listed too.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "../config.mjs";
import { tidy, webAddress } from "../lib/text.mjs";

// Businesses in Mauritius, and organisations whose head office is there.
// Two questions, asked apart because together they time out: the businesses of Mauritius, and
// whatever has its head office there.
const WHO = [
  "?item wdt:P17 wd:Q1027 ; wdt:P31/wdt:P279* wd:Q4830453 .",
  "?item wdt:P159 ?seat . ?seat wdt:P17 wd:Q1027 .",
];
const query = (who) => `
SELECT ?item ?itemLabel ?itemDescription ?frLabel ?website ?inception ?ended ?industryLabel ?hqLabel ?coord ?exchangeLabel ?typeLabel WHERE {
  ${who}
  OPTIONAL { ?item wdt:P856 ?website }
  OPTIONAL { ?item wdt:P571 ?inception }
  OPTIONAL { ?item wdt:P576 ?ended }
  OPTIONAL { ?item wdt:P452 ?industry }
  OPTIONAL { ?item wdt:P159 ?hq }
  OPTIONAL { ?item wdt:P625 ?coord }
  OPTIONAL { ?item wdt:P414 ?exchange }
  OPTIONAL { ?item wdt:P31 ?type }
  OPTIONAL { ?item rdfs:label ?frLabel FILTER(LANG(?frLabel) = "fr") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr" }
}`;

export async function readWikidata() {
  mkdirSync(join(config.cacheDir, "wikidata"), { recursive: true });
  const file = join(config.cacheDir, "wikidata", "organisations.json");
  let rows;
  if (existsSync(file) && Date.now() - statSync(file).mtimeMs < config.wikidata.maxAgeHours * 3600_000) {
    rows = JSON.parse(readFileSync(file, "utf8"));
  } else {
    rows = [];
    for (const who of WHO) {
      const res = await fetch(`${config.wikidata.endpoint}?query=${encodeURIComponent(query(who))}`, {
        headers: { accept: "application/sparql-results+json", "user-agent": config.userAgent },
      });
      if (!res.ok) throw new Error(`Wikidata answered ${res.status}`);
      rows.push(...(await res.json()).results.bindings);
    }
    writeFileSync(file, JSON.stringify(rows));
  }

  const byId = new Map();
  const gone = new Set();
  for (const row of rows) {
    const id = row.item.value.split("/").pop();
    const label = tidy(row.itemLabel?.value);
    // An item with no name in English or French shows its identifier as its label: it says nothing.
    if (!label || /^Q\d+$/.test(label)) continue;
    // An organisation Wikidata records as dissolved is not listed.
    if (row.ended?.value) {
      gone.add(id);
      continue;
    }
    const entry = byId.get(id) ?? { id, name: label, alt: new Set(), types: new Set(), industries: new Set() };
    const fr = tidy(row.frLabel?.value);
    if (fr && fr.toLowerCase() !== label.toLowerCase()) entry.alt.add(fr);
    if (row.itemDescription?.value && !/^Q\d+$/.test(row.itemDescription.value)) entry.about ??= tidy(row.itemDescription.value, 240);
    entry.web ??= webAddress(row.website?.value) ?? undefined;
    const year = /^(\d{4})/.exec(row.inception?.value ?? "")?.[1];
    if (year && Number(year) > 1700) entry.since ??= Number(year);
    if (row.industryLabel?.value && !/^Q\d+$/.test(row.industryLabel.value)) entry.industries.add(tidy(row.industryLabel.value, 60));
    if (row.typeLabel?.value && !/^Q\d+$/.test(row.typeLabel.value)) entry.types.add(tidy(row.typeLabel.value, 60));
    if (row.hqLabel?.value && !/^Q\d+$/.test(row.hqLabel.value)) entry.seat ??= tidy(row.hqLabel.value, 60);
    if (row.exchangeLabel?.value && !/^Q\d+$/.test(row.exchangeLabel.value)) entry.exchange ??= tidy(row.exchangeLabel.value, 80);
    const point = /Point\(([-\d.]+) ([-\d.]+)\)/.exec(row.coord?.value ?? "");
    if (point) {
      entry.lon ??= Number(point[1]);
      entry.lat ??= Number(point[2]);
    }
    byId.set(id, entry);
  }
  return [...byId.values()].filter((e) => !gone.has(e.id)).map((e) => ({ ...e, alt: [...e.alt], types: [...e.types], industries: [...e.industries] }));
}
