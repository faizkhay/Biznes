# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS v4: the Khay Digital house standard,
without React Three Fiber or smooth scrolling, because this is a tool people work in, not a story
they scroll. MiniSearch holds the search index in memory. A crawler in plain Node (`crawler/`)
builds the data the site reads. The fixed pages are prerendered and made again at most once an
hour, so that each takes the day's picture; a listing's page is made the first time it is asked
for and then kept; the search, the paged lists, the look-up behind a saved list and the request
form run on a server. Accounts are to be held on Supabase: that part is being built and no project
exists yet (Operating Context). English only at launch, at the root.

## Users

From the owner's briefs of 20 November 2026: "any businesses and people looking to learn about
business in mauritius, implications, formations, business directory", and then "its for mauritians
and mauritian businesses", with "guides for expats and tourists, locals" and "account maangement"
for "superadmin, admins and regular users". Who they are in detail is Khay Digital's reading, not
yet tested with users.

1. **Someone in Mauritius who needs a business or a service now.** A pharmacy in Curepipe, a
   hardware shop near Goodlands, a garage, a notary. On a phone, often outdoors, often in French or
   Kreol ("farmasi", "quincaillerie"). They want a name, where it is and a number to call, and they
   want to keep two or three to compare or to send to someone.
2. **A business owner who lists a business.** They find their listing, or have none. They want it
   right, or gone, at no cost (Biznes Free). Some will pay to be marked as verified and to come
   first among equals (Biznes Go), or to take bookings and sell services through the site (Biznes
   Grow). They decide on price and on whether the people they want are here.
3. **Someone starting or running a business.** How to register, what a company costs each year,
   when VAT applies, what an employer must pay. They have met pages that contradict each other and
   advisers who charge to say what the law says. They want the figure, its date and its source.
4. **A visitor to the island.** What to see and do, what to know before coming, and who to call if
   something goes wrong. On a phone, sometimes with no signal.
5. **A newcomer.** Someone moving to Mauritius, or just arrived: the ways to live here, and settling
   in.
6. **A resident going about everyday life.** The paperwork, the bills, the number of the water
   board.
7. **Someone abroad weighing Mauritius.** An investor, a remote worker, a firm setting up. At a
   desk, reading at length, comparing.
8. **Someone checking a business before dealing with it.** Is it registered, licensed, real.

And the people who run it: a superadmin, admins, and the signed-in users among all of the above.
Those three roles are the owner's; what each may do is being built.

The hardest case: the person who has been burned by a directory that is out of date, padded with
paid entries, or built to harvest their number. The site must show where every line came from, and
now that a place can be paid for, it must mark every paid place as paid.

## Product Purpose

**Kind:** Website (KOS, `references/khay.md`): Khay Digital's own project. It is a tool more than a
story, and it is not a Khay Original; the reserved vocabulary is not used.

biznes.mu is a search engine for business in Mauritius. In the owner's words: "THE SEARCH ENGINE
FOR MAURITIAN BUSINESSES. ANYTHING ANYONE NEEDS, BIZNES.MU", with "a web crawler to find all that
it needs", to be "the most useful tool out there for any businesses and people looking to learn
about business in mauritius, implications, formations, business directory", and, on 20 November
2026, "the ultimate biznes directory".

One box answers three kinds of question:

- **Who and where:** a directory of businesses and services, by category and by town.
- **How:** guides, each fact with its source and its date. They began with starting and running a
  business, and now stand on shelves: business, visiting, moving here and living here, with a
  fifth about Mauritius itself begun. A question about how is answered first in the site's own
  words, with the guide it comes from.
- **Is it real:** the official registers to check a business against, and what each shows.

Around the box, by the owner's brief of 20 November 2026:

- **Save, filter and share.** A list of results can be narrowed, a listing kept on a shortlist,
  and a listing, a search or a shortlist sent to someone.
- **Emergency numbers**, each from an official page.
- **Pocket guides** as PDFs, to be sold.
- **Plans for businesses:** a free listing and two paid ones.

The one action on every page is the search. A visit has worked when the person finds what they
came for: a listing opened, a call placed from one, a guide read, a register reached, a number
dialled. The second action is "List your business", for the business owner, which leads to the
plans; "Add or correct a listing" stays on every page, in the footer.

## Positioning

"Biznes" is Mauritian Kreol for business. The line is the owner's: "The search engine for business
in Mauritius". "The ultimate biznes directory" is also the owner's phrase, for what it is to
become; it is not used as a line on the site. The owner names bonjour.mu as the competitor to be
measured against.

What sets it apart is said plainly on the site, in four lines (`PROMISES` in `src/data/site.ts`):
every listing says where it came from, every figure in a guide names its source, a listing that
pays to come first is marked as one, and the crawler takes no email addresses.

## Operating Context

- **Runs it:** Khay Digital Ltd, Mauritius, BRN C22187903 (source:
  https://www.khay.digital/llms.txt, read 16 November 2026).
- **Contact:** +230 5450 8600 (call or WhatsApp), faiz@khay.digital, Monday to Thursday 09:00 to
  19:00, Mauritius time. These are Khay Digital's published routes, used until biznes.mu has its
  own: to confirm.
- **Where requests go:** not yet chosen. A request to add or correct a listing, to take a plan or
  to buy a pocket guide all use the one form (`/add`, opened with the plan's or the guide's name).
  With no route set, the form writes the request out for the visitor's own WhatsApp or email
  (README, "Where requests go").
- **Accounts:** to be held on Supabase, with three roles: superadmin, admin and user. A Supabase
  project could not be created from the build session; the owner must create or approve one. Who
  the first superadmin is has not been decided; the proposal is the first account registered.
  Signing in will set a cookie, and the privacy page at present says the site sets none, so that
  page changes before accounts open.
- **Payments:** none. No gateway is chosen for the plans or the pocket guides.
- **Before launch:** the site asks not to be indexed (`launched: false` in `src/data/site.ts`)
  until the owner has read the guides and the confirm list is closed.
- **Keeping it current:** `npm run crawl` rebuilds the index. How often it runs, and where, is the
  owner's to decide (README, "The crawler"). The public holidays in `content/holidays.json` cover
  2026 and 2027; the next year's notice must be read into it when it is published.
- **The list for Khay Digital:** `npm run leads` writes the listings with no website on record to
  `reports/`, which is not committed. On the index of 20 November 2026 that is 6,754 of 7,179
  listings; 273 of them are businesses with a telephone number. The owner asked for it "to reach
  out to propose a website". The index holds no email addresses, so the list has none.

## Capabilities and Constraints

### The plans

The names, the prices and what each gives are the owner's, given on 20 November 2026 (`STORY.md`,
Round 4, has the words). The site holds them once, in `PLANS` in `src/data/site.ts`, and `/pricing`
shows them.

| Plan | Price | In the owner's words | What the site lists |
|---|---|---|---|
| Biznes Free | Free | "businesses can list their business for free (Biznes Free) basic listing" | Already there if the crawler found the business on the open map; claimed, to show whose it is and to keep it right; name, what the business does, where it is and how to reach it |
| Biznes Go | Rs 550 a month for each business | "Biznes Go for 550rs per month per business (verified business and listed with priority)" | Everything in Biznes Free; a verified mark, once the business has been checked to be real; listed with priority, and marked as such |
| Biznes Grow | Rs 1,250 a month for each business | "businesses can use the platform to manage bookings and sell services online (these come at a 1250mur per month per biznes (Biznes Grow)" | Bookings managed in one place; services sold online; a page of the business's own to send customers to |

To confirm with the owner:

- **How a plan is paid for: answered, 20 November 2026.** Through Stripe, which is not connected
  yet. Until it is, a business asks for a plan through the form and a person answers. A customer
  pays a business directly, by MCB Juice, from the details the business shows; the site takes no
  part in that payment.
- **What Biznes Grow holds: answered, 20 November 2026.** "Yes, all from go but with some booking
  and services sale management tools": everything in Biznes Go, with bookings and service sales.
  So a business on either paid plan carries the mark and comes first, as `/pricing` and `/data` say.
- **The pocket guide's price: answered, 20 November 2026.** Rs 150 a guide (first given as about USD 1.99, then set at Rs 150). The
  owner intends 50 to 100 guides and a bundle of them all at about 60 per cent off.
- **What "verified" checks.** The site says only that the business has been checked to be real.
  Against what, and by whom, is not written down.
- **Claiming a listing**, which the site lists under Biznes Free, waits on the accounts. Until
  they open, a business says a listing is its own through the form.

### What is built

- **The index at this build** is in `data/index/meta.json`, and the site's own page "Where the data
  comes from" prints it: 7,179 listings in 129 towns and villages, 525 with a telephone number and
  425 with a website. Listings come from OpenStreetMap (Open Database Licence) and Wikidata (CC0);
  descriptions also from each business's own front page, read by the crawler.
- **Narrowing, saving and sharing.** A list of listings is narrowed by telephone number, by website
  and by town; each is a link, so it works with no script. A shortlist is kept in the visitor's own
  browser and nowhere else, and is shared as a link (`/saved?ids=`). A listing or a search is
  shared through the phone's own share sheet, or its link is copied.
- **The guides** stand on shelves (`SHELVES` in `src/data/site.ts`). At the time of writing there
  are nineteen: the thirteen on business, and two each for visitors, for newcomers and on everyday
  life. All are written from official pages, and each gives 20 November 2026 as the day it was
  checked. Each carries its sources and a list of what could not be confirmed. The site also
  calls them articles. A fifth shelf, about Mauritius itself, was added during the round and has
  no article yet.
- **The pocket guide** (`/shop`, `scripts/pdf.mjs`): "Mauritius: places to see and things to do",
  an A5 PDF of 51 pages made for a phone. It holds 60 places in nine parts of the island and 13
  days out, each fact with the official page it was read on, and its 110 sources listed at the
  back. Sixteen points that could not be confirmed are listed in its data
  (`content/pdf/places.json`) and left out of the guide's words. The file is written to
  `reports/`, which is not committed and not served, because it is to be sold. It is sold on
  request until payments exist, and its price is the owner's to set.
- **Emergency numbers** (`/emergency`, `content/emergency.json`): 43 services in ten groups, each
  number from an official page, named, read on 20 November 2026. What could not be confirmed is
  listed on the page.
- **The tools** take their figures from the guides and hold none of their own.
- **The plans** are shown on `/pricing`, and each leads to the form.
- **The picture behind the page** follows the calendar by itself (`DESIGN.md`, "The pictures and
  the calendar"). Holiday dates come only from `content/holidays.json`, written from the official
  notices.

### Being built at the time of writing

- **Accounts**, with the three roles; a dashboard for a business's owner; screens for admins.
- **Bookings and services** for Biznes Grow.
- **The verified mark and priority, joined to the search.** The mark and the paid card are drawn
  (`DESIGN.md`); no listing carries them yet, and the order of results is still by answer and
  fullness alone.
- **The site as an app** on iOS, Android and a desk, as the owner asked ("fully pwa enabled").
  Its first parts are in the repository: a manifest, the icons, a service worker and an offline
  page. The offer to install was being put on the page as this was written. It is not recorded
  as done: its checks belong to the end of the round.
- **The articles about Mauritius itself**, for the fifth shelf.
- **A superadmin's own choice of picture**, over the calendar's. Until then the owner changes a
  picture by replacing a file or a line in `src/data/themes.ts`.

### Constraints

- **What it does not do, and says so:** it is not the company register, it holds no reviews, and
  its guides are general information, not legal or tax advice. Nobody at biznes.mu has visited or
  vetted a listed business; the one exception will be the verified mark.
- **Coverage is what the open map holds.** The map is fullest for shops, food, places to stay and
  public services, and thin for offices and trades. Telephone numbers and websites are known for a
  minority of listings, and most records were last edited on the map more than two years ago. The
  site says how many, and each listing says when.
- **Languages:** English at launch. A question may be asked in French or Kreol; the pages
  themselves in French are a listed gap. The greeting on the first screen is Kreol: "Bonzour".
- **Not built, and not decided:** advertising, reviews, and the other ideas in `REVENUE.md` that
  the owner has not taken up.

## Brand Commitments

biznes.mu keeps the colours it already had, sampled from the mock-up the owner approved on 17
November 2026: saffron, ink, limewash and coral. A royal blue was sampled from the mock-up the owner
chose on 20 November 2026.

The direction is the postcard: a painted picture of the island behind the page, a sheet of warm
paper laid on it, and one question in the middle. It is Khay Digital's reading of the owner's brief
and three reference images of 20 November 2026 ("i dont want too corporate, still want an easy
feeling for people coming to us"), and it replaces the night chart. `STORY.md` says why; `DESIGN.md`
holds the system.

- **One face:** Manrope, under the SIL Open Font Licence, from the list KOS keeps for a brand with
  no face of its own. Archivo, Geist and Geist Mono are gone.
- **A drawn mark:** a lowercase b that is a stem and a ring, the letter and a search lens at once,
  with a saffron point at its centre.
- **The pictures are generated illustrations, and say so.** Four were made for the site on 20
  November 2026 (Higgsfield, model gpt_image_2_6). Each has a record beside its file in
  `public/themes`. They are imagined scenes, never captioned as photographs and never passed off
  as a real place. The earlier commitment, that the site held no photographs and no generated
  pictures, no longer stands. There are still no photographs of businesses or of places.
- **The verified mark is kept for a verified business.** By the owner's word, "paid business needs
  to have a very vibrant mark". Nothing else on the site may look like it.
- **Khay Digital appears quietly:** a line in the footer for a business with no website, and the
  credit, as on every Khay build: "A Digital Experience by Khay Digital". The owner asked for it
  "subtly, not devan devan".

## Evidence on Hand

| Source | Read | Gave |
|---|---|---|
| The owner, in conversation | 15 to 20 November 2026 | The product, its line, the crawler, the directory, the guides; on 20 November 2026 the plans and their prices, the roles, the pages to add, the look, and that paid listings come first |
| Three reference images from the owner: a golf club's site, an invoicing site, a design tool's site | 20 November 2026, in conversation; not kept in the repository | The manner: a sheet of paper over a picture, a floating pill menu, dark tiles, a dark footer with the emblem on its edge, a short headline |
| bonjour.mu, named by the owner as the competitor | 20 November 2026 | The standard the owner set for the logo and the look |
| https://www.khay.digital/llms.txt | 16 November 2026 | Khay Digital's legal name, BRN, phone, email, hours |
| OpenStreetMap, the Mauritius extract | map as of the date in `data/index/meta.json` | Businesses and services, the coast, the districts, the council areas |
| Wikidata | 20 November 2026 | Organisations of Mauritius: description, founding year, industry, exchange |
| The front pages of businesses' own websites, read by the crawler | 20 November 2026 | Each site's own title and description of itself |
| Official pages and Acts, listed in each guide | 20 November 2026 | Every figure in the guides |
| Official pages listed on `/emergency` | 20 November 2026 | Every emergency number and helpline |
| The Prime Minister's Office's notices of public holidays, listed in `content/holidays.json` | 20 November 2026 | The public holidays of 2026 and 2027 |
| Official pages listed at the back of the pocket guide (`content/pdf/places.json`) | 20 November 2026 | Every place and fact in the pocket guide |
| The four pictures, with a record beside each in `public/themes` | made 20 November 2026 | The picture behind the page. Generated illustrations, not evidence of any place |

Absent, and not fabricated: reviews, photographs, opening hours the map does not hold, any measure
of how many people use the site, any testimonial, any business on a paid plan, any price for the
pocket guide.

## Product Principles

1. **The answer first.** The search box is the first thing on the first screen, in the middle of
   it, and it is on every page.
2. **Say where it came from.** A listing names its source and the day it was last edited there. A
   figure in a guide carries the number of its source. An emergency number does the same.
3. **Never guess.** A tool with no figure does no arithmetic. An hours rule that cannot be read is
   shown as the map wrote it. What a guide could not confirm is listed, not smoothed over. A plan
   lists only what the owner has given it.
4. **A paid place is always marked.** By the owner's decision of 20 November 2026, a business on a
   paid plan is "listed with priority": it comes first among listings that answer a question
   equally well. This reverses the principle this document held until then, that the order cannot
   be bought. What remains is this: a paid place is marked as a priority listing wherever it is
   shown, the site says how results are ordered (`/data`, `/pricing`), and nothing else is for
   sale. Paying does not make a worse answer outrank a better one, does not change what a listing
   says about anyone else, and buys no word in a guide. Until a business is on a paid plan, the
   order is by answer and fullness alone. If the order ever changes, those pages change first.
5. **Take only what is needed.** One page a site, robots.txt obeyed, no email addresses taken by
   the crawler, and a listing is corrected or removed on request. A shortlist stays in the
   visitor's browser.
6. **A phone, in a hurry, in the sun.** High contrast, large targets, a telephone link on every
   listing that has a number, the ways in at the thumb.
7. **An easy feeling.** The owner's words: "i dont want too corporate, still want an easy feeling
   for people coming to us". A greeting, a picture of the island, one question, plain words.

## Accessibility & Inclusion

WCAG 2.2 AA is the standard. During this round axe-core was clean on every kind of page at phone
size, and the 25 colour pairs that `npm run contrast` measures all pass; the final checks at both
sizes are run at the end of the round and recorded in the README. The picture behind the page is
decoration and is hidden from assistive technology; the words on it stand on a veil of the paper's
own colour. The island is a picture of what the lists beside it say in words, so it is one image
with a sentence that says what it shows. Every page is whole without script: the search is a plain
form, the filters are links, the island is drawn in SVG, a shared shortlist is a list of links, and
the VAT sums are in a table. Saving needs script, and the button is not shown until the script has
loaded. Reduced motion is honoured. A question in French or Kreol is understood; French pages are a
gap. One known gap is recorded in `DESIGN.md`: the focus ring is not yet strong enough on the dark
footer and the dark cards.
