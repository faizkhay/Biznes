# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS v4: the Khay Digital house standard,
without React Three Fiber or smooth scrolling, because this is a tool people work in, not a story
they scroll. MiniSearch holds the search index in memory. A crawler in plain Node (`crawler/`)
builds the data the site reads. The fixed pages are prerendered; a listing's page is made the first
time it is asked for and then kept; the search, the paged lists and the request form run on a
server. English only at launch, at the root.

## Users

From the owner's brief of 20 November 2026 ("any businesses and people looking to learn about
business in mauritius, implications, formations, business directory"). Who they are in detail is
Khay Digital's reading, not yet tested with users.

1. **Someone in Mauritius who needs a business or a service now.** A pharmacy in Curepipe, a
   hardware shop near Goodlands, a garage, a notary. On a phone, often outdoors, often in French or
   Kreol ("farmasi", "quincaillerie"). They want a name, where it is and a number to call.
2. **Someone starting or running a business.** How to register, what a company costs each year,
   when VAT applies, what an employer must pay. They have met pages that contradict each other and
   advisers who charge to say what the law says. They want the figure, its date and its source.
3. **Someone abroad weighing Mauritius.** An investor, a remote worker, a firm setting up. At a
   desk, reading at length, comparing.
4. **Someone checking a business before dealing with it.** Is it registered, licensed, real.
5. **A business owner who finds their own listing.** They want it right, or gone.

The hardest case: the person who has been burned by a directory that is out of date, padded with
paid entries, or built to harvest their number. The site must show where every line came from and
sell nothing in the results.

## Product Purpose

**Kind:** Website (KOS, `references/khay.md`): Khay Digital's own project. It is a tool more than a
story, and it is not a Khay Original; the reserved vocabulary is not used.

biznes.mu is a search engine for business in Mauritius. In the owner's words: "THE SEARCH ENGINE
FOR MAURITIAN BUSINESSES. ANYTHING ANYONE NEEDS, BIZNES.MU", with "a web crawler to find all that
it needs" and to be "the most useful tool out there for any businesses and people looking to learn
about business in mauritius, implications, formations, business directory".

One box answers three kinds of question:

- **Who and where:** a directory of businesses and services, by category and by town.
- **How:** guides to starting and running a business, each fact with its source and its date.
- **Is it real:** the official registers to check a business against, and what each shows.

The one action on every page is the search. A visit has worked when the person finds what they
came for: a listing opened, a call placed from one, a guide read, a register reached. The second
action is "Add or correct a listing", for the business owner.

## Positioning

"Biznes" is Mauritian Kreol for business. The line is the owner's: "The search engine for business
in Mauritius". What sets it apart is said plainly on the site: every listing says where it came
from, every figure in a guide names its source, the order of results cannot be bought, and no
email addresses are held. No tagline beyond the line exists.

## Operating Context

- **Runs it:** Khay Digital Ltd, Mauritius, BRN C22187903 (source:
  https://www.khay.digital/llms.txt, read 16 November 2026).
- **Contact:** +230 5450 8600 (call or WhatsApp), faiz@khay.digital, Monday to Thursday 09:00 to
  19:00, Mauritius time. These are Khay Digital's published routes, used until biznes.mu has its
  own: to confirm.
- **Where requests go:** not yet chosen. Until a route is set the form refuses and offers the
  other routes (README, "Where requests go").
- **Before launch:** the site asks not to be indexed (`launched: false` in `src/data/site.ts`)
  until the owner has read the guides and the confirm list is closed.
- **Keeping it current:** `npm run crawl` rebuilds the index. How often it runs, and where, is the
  owner's to decide (README, "The crawler").

## Capabilities and Constraints

- **The index at this build** is in `data/index/meta.json`, and the site's own page "Where the data
  comes from" prints it. Listings come from OpenStreetMap (Open Database Licence) and Wikidata
  (CC0); descriptions also from each business's own front page, read by the crawler.
- **The guides** are thirteen, each written from official pages and the Acts, read one by one on 20
  November 2026 (`content/guides`). Each carries its sources, the day it was checked, and a list of
  what could not be confirmed.
- **The tools** take their figures from the guides and hold none of their own.
- **What it does not do, and says so:** it is not the company register, it does not vet or rank
  businesses, it holds no reviews, and its guides are general information, not legal or tax advice.
- **Coverage is what the open map holds.** The map is fullest for shops, food, places to stay and
  public services, and thin for offices and trades. Telephone numbers and websites are known for a
  minority of listings. The site says how many.
- **Languages:** English at launch. A question may be asked in French or Kreol; the pages
  themselves in French are a listed gap.
- **Not built, by decision:** accounts, paid placement, advertising, reviews. They are the subject
  of `REVENUE.md`, for the owner to decide.

## Brand Commitments

biznes.mu keeps the three colours it already had, sampled from the mock-up the owner approved on 17
November 2026: saffron, ink and limewash. The owner asked on 20 November 2026 for a design that is
"futuristic". The direction is Khay Digital's, under the owner's standing carte blanche (16
November 2026): the night chart. The island of Mauritius is drawn only by what is listed on it,
each listing a point of light at its own place, and a question lights the points that answer. The
picture is the data. Type is Archivo at its widest for the name and titles, Geist for sentences
and Geist Mono for what is measured or looked up. There are no photographs and no generated
pictures. Khay Digital appears as the maker and in the credit, as on every Khay build: "A Digital
Experience by Khay Digital".

## Evidence on Hand

| Source | Read | Gave |
|---|---|---|
| The owner, in conversation | 15 to 20 November 2026 | The product, its line, the crawler, the directory, the guides, "futuristic", carte blanche |
| https://www.khay.digital/llms.txt | 16 November 2026 | Khay Digital's legal name, BRN, phone, email, hours |
| OpenStreetMap, the Mauritius extract | map as of the date in `data/index/meta.json` | Businesses and services, the coast, the districts, the council areas |
| Wikidata | 20 November 2026 | Organisations of Mauritius: description, founding year, industry, exchange |
| The front pages of businesses' own websites, read by the crawler | 20 November 2026 | Each site's own title and description of itself |
| Official pages and Acts, listed in each guide | 20 November 2026 | Every figure in the guides |

Absent, and not fabricated: reviews, photographs, opening hours the map does not hold, any measure
of how many people use the site, any testimonial.

## Product Principles

1. **The answer first.** The search box is the first thing on every page, and the first screen is
   the whole directory at a glance.
2. **Say where it came from.** A listing names its source and the day it was last edited there. A
   figure in a guide carries the number of its source.
3. **Never guess.** A tool with no figure does no arithmetic. An hours rule that cannot be read is
   shown as the map wrote it. What a guide could not confirm is listed, not smoothed over.
4. **The order cannot be bought.** A fuller listing is shown before a barer one, and that is the
   only order there is.
5. **Take only what is needed.** One page a site, robots.txt obeyed, no email addresses, and a
   listing is corrected or removed on request.
6. **A phone, in a hurry, in the sun.** High contrast, large targets, a telephone link on every
   listing that has a number.

## Accessibility & Inclusion

WCAG 2.2 AA, checked with axe-core at two sizes on every kind of page. The chart is a picture of
what the lists beside it say in words, so it is hidden from assistive technology and described in
a sentence. Every page is whole without script: the search is a plain form, the chart is drawn in
SVG, and the VAT sums are in a table. Reduced motion is honoured: the chart's points are lit at
once, never animated. A question in French or Kreol is understood; French pages are a gap.
