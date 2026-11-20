# The index

`data/index` is written by the crawler (`npm run crawl`, `crawler/build.mjs`) and read by the site.
Nothing in it is typed by hand. To change a listing, change it at its source or in the crawler, and
run the crawl again.

| File | Holds |
|---|---|
| `listings.json` | Every business and service: its name, category, place, contact details, and where each part came from (`src`, `aboutFrom`, `phoneFrom`) |
| `places.json` | The towns, villages and neighbourhoods that have listings, with their counts |
| `categories.json` | The categories and their groups, with the words each answers to |
| `districts.json` | The districts and their counts |
| `geo.json` | The coast, the districts' outlines and the towns, for the chart |
| `sites.json` | Mauritian websites the crawler read that belong to no listing |
| `official.json` | The official pages the guides point to |
| `meta.json` | What the last run did: dates, counts, the crawler's settings |

## Licences

- `listings.json`, `places.json`, `districts.json` and `geo.json` are derived from
  [OpenStreetMap](https://www.openstreetmap.org/copyright), © OpenStreetMap contributors, and are
  made available under the [Open Database Licence 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
  Anyone may copy, share and adapt them, as long as they credit OpenStreetMap and keep what they
  derive from them under the same licence.
- Facts joined from [Wikidata](https://www.wikidata.org/) (a listing with `src.wikidata`) are under
  [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).
- A description marked `aboutFrom: "site"` is the business's own words from its own front page,
  shown as such and linked to it.

`content/guides` is not part of the index: each guide was written from the sources it lists, and is
changed by editing its file and its `checked` date.
