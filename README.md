# biznes.mu, the search engine

A search engine for business in Mauritius: a directory of businesses and services across the
island, plain guides to starting and running a business with every fact sourced, and the official
registers to check a business against. Built and run by Khay Digital.

The site is built with KOS, Khay Digital's method and standards (`faizkhay/Khay-Original-Skill`).
Four documents describe this build:

| Document | Says |
|---|---|
| `PRODUCT.md` | Who it is for, what it does and does not do, the evidence on hand |
| `STORY.md` | The one picture the site is built on, and the round that made it |
| `DESIGN.md` | Every colour, text style and component, with its source and its measured contrast |
| `REVENUE.md` | How the site can earn, for the owner to decide. Nothing in it is built |

It replaces the site that sold ready-made businesses (in the repository's history before commit
`a7d4ea3`). Its old addresses lead to the directory, the data page and the form.

## What is in it

- **The crawler** (`crawler/`): builds the index from OpenStreetMap, Wikidata, the front page of
  each business's own website, the member lists of chambers and associations, and the official
  pages the guides point to.
- **The index** (`data/index`): 7,179 listings in 273 towns and villages and 69 categories, 217
  Mauritian websites, 153 official pages. Written by the crawler; never edited by hand.
- **The search** (`src/lib/search.ts`): one question over listings, guides, official pages and
  websites. It reads a town and a kind of business out of a question, in English, French or Kreol.
- **The guides** (`content/guides`): thirteen, with 334 sources between them, checked on 20 November
  2026. A glossary of 90 terms (`content/glossary.json`) is drawn from them.
- **The tools**: check a business, a VAT calculator, a comparison of legal structures, the glossary.
  Each takes its figures from a guide and holds none of its own.

## Running it

Node 20 or newer.

```
npm install
npm run dev          # http://localhost:3000
npm run build        # the production build
npm start            # serves it
```

The index is in the repository, so the site runs without crawling first.

## The crawler

```
npm run crawl                 # everything: the map, Wikidata, the websites, the official pages
npm run crawl -- --no-web     # the map and Wikidata only; the last crawl of websites is kept
```

A full run takes about ten minutes. It keeps what it fetched in `.crawl` (not committed), so a
second run asks only for what has grown old: a day for the map, a week for a web page. Then build
and deploy: the site reads `data/index` when it starts.

**What it reads, and how it behaves** is in `crawler/config.mjs`, and the site's own `/bot` page
says the same to anyone who finds it in their server log:

- One page a site: the front page. On the sixteen hubs in `crawler/seeds.mjs` (chambers,
  associations, regulators), also up to 24 of their own pages that list members.
- robots.txt is read first and obeyed. A site whose robots.txt cannot be read is left alone.
- At least 1.5 seconds between two requests to one site; a site's own crawl delay is honoured.
- HTML only, the first 900 KB, a 15 second limit. No forms, no logins, no scripts run.
- It takes a page's title, its own description, its language, what it declares in schema.org
  markup, a telephone link and its social profiles. **It never takes an email address.**
- A site found by a link is visited if its address ends in `.mu`, or if a hub named it. It is kept
  only if its address ends in `.mu` or its own page says it is in Mauritius.

**How it names itself.** Set two variables once the site is live and `/bot` can be read:

```
CRAWLER_USER_AGENT="BiznesBot/1.0 (+https://biznes.mu/bot)"
CRAWLER_ROBOTS_TOKEN="BiznesBot"
```

Without them it says only that it is a directory crawler, which is how the runs in this repository
were made. A crawler should say who it is: set them before the first run from your own machine.

**Adding a source.** A new kind of business is a row in `crawler/taxonomy.mjs`. A new hub is a line
in `crawler/seeds.mjs`. A new source of listings is a file in `crawler/sources` that returns
listings in the shape `crawler/build.mjs` reads.

**How often.** Not decided. The map changes daily; once a week is a sensible start. It can run on
any machine with Node, or on a schedule in CI that commits `data/index`.

## Deploying

The search, the paged lists and the form need a server, so this is not a static export. It runs on
any Node host; on Vercel it needs no configuration. `next.config.ts` makes sure `data/index` and
`content` travel with the server.

| Variable | For |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | The site's own address, for canonical links, the sitemap and structured data |
| `ENQUIRY_WEBHOOK_URL` | Where the form's requests are posted, as JSON |
| `RESEND_API_KEY`, `ENQUIRY_TO`, `ENQUIRY_FROM` | Or: email them through Resend |

### Before the site can be found

`launched` in `src/data/site.ts` is `false`. While it is, every page asks search engines not to
index it and `robots.txt` closes the site. Set it to `true` when the confirm list below is closed.
The results of a search are never indexed, launched or not.

### Where requests go

The form at `/add` (add a business, correct a listing, remove one) delivers by the first route
configured: a webhook, or email through Resend. With neither set, a production server refuses the
request and the form offers the telephone, WhatsApp and email instead. No request is lost quietly.
Choose a route before launch.

## Where the content lives

Everything the owner will change is data. No fact is written into a component.

| To change | Edit |
|---|---|
| The site's name, line, contact details, the header's pages, the first screen's example searches | `src/data/site.ts` |
| A listing | Its source (OpenStreetMap, Wikidata, the business's own site), then `npm run crawl`. Or the crawler |
| The categories, and the words each answers to in English, French and Kreol | `crawler/taxonomy.mjs`, then `npm run crawl` |
| A guide | Its file in `content/guides`, and its `checked` date |
| The glossary | `content/glossary.json` |
| The tools' names and descriptions | `src/lib/tools.ts` |
| A figure a tool uses | The guide it reads it from. A tool holds none |
| The crawler's rules | `crawler/config.mjs`, `crawler/seeds.mjs` |
| The link preview picture | `npm run dev`, then `npm run og`: it captures the site's own chart into `public/og.jpg`. Run it after a crawl |

A guide is one JSON file: a title, a summary, the day it was checked, facts, sections of blocks
(paragraph, list, steps, table, note), its sources, the pages to go to next, and what it could not
confirm. Every fact and block names the sources it was written from, by id. The site shows those
as numbered marks.

### Where it came from

| Part | Source | Licence or basis | When |
|---|---|---|---|
| Listings: names, places, addresses, telephone numbers, websites, hours | OpenStreetMap, the Mauritius extract from download.openstreetmap.fr | Open Database Licence 1.0; credited on every page | Map as of 17 November 2026 |
| The coast, the districts, the council areas, the towns | The same | The same | The same |
| A company's description, founding year, industry, exchange | Wikidata | CC0 1.0 | 20 November 2026 |
| A business's own description; a telephone number where the map had none | Its own front page, read by the crawler | Its own words, shown as such and linked | 20 November 2026 |
| Mauritian websites | Found by following links from listings' sites and from sixteen hubs | Each site's own title and description | 20 November 2026 |
| The guides | Official pages and Acts, listed in each guide | Written for this site from sources read one by one | 20 November 2026 |
| The glossary | The guides | Each meaning checked against the guide it names | 20 November 2026 |
| Market figures in `REVENUE.md` | `content/market.json`, each with its page | Read on 20 November 2026 | |
| Colours | biznes.mu's approved mock-up of 17 November 2026 | Sampled; see `DESIGN.md` | |
| Typefaces | Archivo, Geist, Geist Mono | SIL OFL 1.1; `src/fonts` and the `geist` package | |

The last crawl visited 800 websites: 605 were read, 17 were left alone because their robots.txt
asked, and 166 did not answer. Many of the 166 are the fault of the line the crawl ran on, not of
the sites, so nothing is said about them on the site. Only a site that itself answered "not found"
is noted on its listing (21 of them).

`data/index` is derived from OpenStreetMap, so it is itself under the Open Database Licence:
`data/README.md` says so. There are no photographs and no generated pictures on the site.

**How the guides were researched.** Four researchers worked in parallel to one brief: nothing from
memory; every figure confirmed on a page actually read; official sources first; a professional
firm's summary only as a cross-check, and labelled; anything that could not be confirmed listed
under "unverified" and left out of the prose; the period stated on every figure. Where an official
page and the Act disagreed, the guide follows the Act and says so in a note.

### To confirm with the owner before launch

1. **The guides are general information written from sources, not checked by a practitioner.** Have
   a qualified accountant read the tax, VAT and employment guides, and a lawyer the company, data
   protection and immigration ones, before `launched` is set to `true`. Each guide lists what it
   could not confirm: 128 points across the thirteen, shown on each guide's page.
2. **Several official sites could not be read from the build machine**: the Financial Services
   Commission (it refuses automated readers), the Bank of Mauritius, the Budget site, the
   Construction Industry Authority. The global business guide has only ten sources for that reason,
   and the registers of those bodies are missing from "Check a business". Read them by hand and add
   them.
3. **Rules change with each Finance Act.** The guides state the position on 20 November 2026, after
   the Finance Act 2026. Decide who re-reads them and when.
4. **Contact details** are Khay Digital's own (+230 5450 8600, faiz@khay.digital). Does biznes.mu
   get its own?
5. **Where requests go**: a webhook or an email address.
6. **The crawler's name**: "BiznesBot" is proposed. Set the two variables before crawling from your
   own machine.
7. **How often the crawl runs, and where.**
8. **Who answers a request to correct or remove a listing, and how fast.** The site promises a
   person reads every one.
9. **Privacy**: the page says the site sets no cookies and runs no analytics. If counting visits is
   added (`REVENUE.md` asks for it), the page must change first.
10. **The line**: "The search engine for business in Mauritius" is the owner's phrase, tidied.
11. **The category names**, and the French and Kreol words each answers to, were written by Khay
    Digital. A Kreol speaker should read `crawler/taxonomy.mjs`.

## The design

The night chart: the island drawn only by what is listed on it, each listing a point of light at
its own place, and saffron for whatever answers a question. `DESIGN.md` has every token; `STORY.md`
says why.

## Pages

| Address | What it is | Made |
|---|---|---|
| `/` | The search, the chart, the whole directory as an index | Ahead of time |
| `/search?q=` | Results: guides, listings, official pages, websites | On each request |
| `/b/[slug]` | One listing, and where each part of it came from | The first time it is asked for, then kept |
| `/directory`, `/directory/[cat]`, `/directory/[cat]/[place]` | The directory by category, and a category in a town | Ahead; on request |
| `/places`, `/places/[place]` | The directory by town | Ahead; on request |
| `/learn`, `/learn/[slug]`, `/learn/glossary` | The guides and the glossary | Ahead of time |
| `/tools`, `/tools/verify`, `/tools/vat`, `/tools/structures` | The tools | Ahead of time |
| `/official` | The official pages the guides point to | Ahead of time |
| `/data`, `/bot`, `/privacy` | The sources and licences, the crawler's rules, privacy | Ahead of time |
| `/add` | Add a business, correct a listing, remove one | On each request |
| `/api/suggest`, `/points.json`, `/api/enquiry` | Suggestions, the chart's points, the form | |
| `/robots.txt`, `/sitemap.xml`, `/llms.txt` | For machines | Ahead of time |

## Verification

Run on 20 November 2026 against a production build served on port 3100.

| Check | Command | Result |
|---|---|---|
| Types | `npm run typecheck` | Clean |
| Build | `npm run build` | Clean |
| House style | `npm run copy` | 0 failures. Warnings are source titles quoted as their sites write them |
| Tokens | `npm run tokens` | 0 failures, 1 warning (a one-pixel offset on the guide's contents rail) |
| Contrast | `npm run contrast` | 18 pairs: every text pair passes AA for body text, every edge 3:1 |
| Design record | `npm run design` | 0 errors, 3 warnings (line colours the format cannot attach to a component) |
| Behaviour | `npm run behaviour` | 57 of 57 |
| Accessibility | `npm run a11y` | axe-core, WCAG 2.2 AA: clean on 24 kinds of page at 1440 by 900 and 390 by 844 |
| Captures | `npm run screenshots` | 24 kinds of page at both sizes: no page wider than its screen, no page errors |

The behaviour check starts the form's own receiver, so the form is tested end to end. Serve the
build for it like this:

```
npm run build
ENQUIRY_WEBHOOK_URL=http://127.0.0.1:3199/hook npx next start -p 3100 &
npm run behaviour && npm run a11y && npm run screenshots
```

What the behaviour check covers: the chart going live; suggestions and their keyboard; a question
read as a kind and a town, in Kreol, in French, and by one half of a town of two names; a tax
question answered by a guide first; nothing found; a second page; a listing reached by its id, its
sources, its telephone link and its structured data; the four old addresses; robots, the sitemap
and llms.txt; a guide's citations; the VAT sums; the two tools drawn from guides; the form's
errors, its delivery, its honeypot and its rate limit; the site with no script; and six pages on a
phone.

Captures of six kinds of page are kept in `review/screens`. The rest are made again by the command.

**Not run, and why:**

- **A reading by a practitioner.** The first item on the confirm list. This is the gap that matters.
- **Speed measurements** (Lighthouse, real devices on a mobile network). Not run in this session.
- **A screen reader, by ear.** axe-core passes; nobody has listened to it.
- **Real phones in daylight.** The contrast is high by measurement; it has not been looked at
  outdoors.
- **The crawler under its own name.** Every run so far used the generic name.
- **A crawl from a normal connection.** The build machine reaches the web through a proxy that
  dropped many connections, which is why 166 sites "did not answer".

## Known gaps

- **Coverage is what the open map holds**: fullest for shops, food, places to stay and public
  services; thin for offices and trades. Only 525 listings have a telephone number and 425 a
  website. The registry counts 126,453 live entities; the index holds 7,179 listings.
- **No French or Kreol pages.** A question in either is understood.
- **No accounts**: a business cannot claim and edit its own listing. It asks through the form.
- **No light palette**, and the chart cannot be explored (`DESIGN.md`, "Known Gaps").
- **"Open now" is not offered.** Hours are shown as the map holds them, for 355 listings.
- **A listing's website is checked only at its front page.**
- **The search has no memory of what people ask**, so nothing yet says which searches find nothing.
- **Names are shown as the map writes them**, capitals and all.
