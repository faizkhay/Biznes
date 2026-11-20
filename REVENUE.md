# How biznes.mu makes money

First written as the site's revenue manager on 20 November 2026, as a plan for the owner to decide
on. Later the same day the owner decided: three plans with their prices, paid PDF guides, and
websites sold through Khay Digital. This version puts the owner's decisions first. What the earlier
plan proposed is kept where it still holds, and marked where the owner's decisions overtook it.

Every market figure names its source; the facts behind them are in `content/market.json`, each with
the page it was read on. The owner's prices are the owner's. Every other price is a proposal to
test, and every sum says what it assumes. "Rs" and "MUR" are the same rupee: the site writes Rs,
and the tables of other people's prices keep the form their source uses.

## The short answer

The owner's streams, in the owner's words of 20 November 2026:

1. **The plans.** "businesses can list their business for free (Biznes Free) basic listing or
   Biznes Go for 550rs per month per business (verified business and listed with priority).
   businesses can use the platform to manage bookings and sell services online (these come at a
   1250mur per month per biznes (Biznes Grow)."
2. **Paid PDF guides.** "some paid pdf (design them to sell to people about best places to visits,
   things to do etc)".
3. **Websites, through Khay Digital.** "provide me separate list of bizneses without websites (will
   work with khay digital to reach out to propose a website)".

| Stream | Price | Where it stands |
|---|---|---|
| Biznes Free | Free | Shown on `/pricing`. A business asks through the form |
| Biznes Go | Rs 550 a month for each business | Shown on `/pricing`. The verified mark is drawn; joining it to the search, and accounts, are being built |
| Biznes Grow | Rs 1,250 a month for each business | Shown on `/pricing`. Bookings and services are being built |
| Pocket guides, as PDFs | Not yet set by the owner | `/shop` and the script that lays the guide out are written; the first guide's places are being researched |
| Websites through Khay Digital | Quoted by the agency | `npm run leads` writes the list: 6,754 listings with no website on record, 273 of them businesses with a telephone number |

Nothing can be paid for on the site yet. No payment gateway is chosen; a plan or a guide is asked
for through the form and a person answers.

**The rule that changed.** The first version of this page said the order of results is never for
sale. The owner's Biznes Go is "listed with priority", which reverses that, and it is the owner's
decision. The rule that protects the site now is narrower, and the site states it on `/data` and
`/pricing`: a paid business comes first only among listings that answer equally well, and it is
always marked as a priority listing. A paid place that is not seen to be paid would make this one
more directory.

## Where we stand today

- **What we own:** 7,179 listings in 129 towns and villages, guides written from official sources
  on four shelves (business, visiting, moving here, living here), a page of emergency numbers, a
  glossary, the tools, and a crawler that rebuilds the index on demand (`data/index/meta.json`, 20
  November 2026).
- **What we do not have yet:** visitors, accounts, or a way to take money. The site is not launched
  and has no traffic, so every sum below is arithmetic on an assumption, not a measurement.
- **What the listings lack:** 6,754 of the 7,179 listings have no website on record, and only 525
  have a telephone number. That is the opening for the agency, and the reason a business would
  want to claim and fill its own listing.

## The owner's streams

### 1. The plans

**Who pays:** the business that owns a listing.

**Biznes Free** costs nothing and stays so: a listing in the directory and in search, with the
name, what the business does, where it is and how to reach it, corrected or taken out on request.
The earlier plan said the same, and the reason holds: a directory that charges to fix its own
mistakes earns contempt. Free listings are also what fills the index with what the open map cannot
hold.

**Biznes Go** is Rs 550 a month for each business, which is Rs 6,600 a year. It gives the verified
mark, once the business has been checked to be real, and a place before others that answer a
search equally well, marked as a priority listing.

**Biznes Grow** is Rs 1,250 a month for each business, which is Rs 15,000 a year. It is for taking
bookings and selling services through the site.

**For scale, from the published prices below:** the chamber's smallest membership is MUR 8,000, and
it comes with a free entry in its directory. Biznes Go for a year sits under that, and Biznes Grow
above it. Yelo's premium listing is USD 65 a year; no exchange rate was read for this page, so the
two are not set side by side.

**The sum:** every ten businesses on Biznes Go are Rs 66,000 a year, and every ten on Biznes Grow
are Rs 150,000 a year, if each stays twelve months.

**What it needs before it can be sold:**

- Accounts, so that a business can claim its listing and a person can check the claim. They are
  being built; the Supabase project behind them is the owner's to create or approve.
- A written meaning for "verified". The site says only that the business has been checked to be
  real. The earlier plan proposed one test: that the business was matched to its entry in the
  companies register on a given day, and that the page says so. That still seems right, and it is
  the owner's to confirm.
- A way to pay.
- For Biznes Grow, the bookings and the services themselves. A plan should not be charged for
  before what it gives exists.

**The care it needs:** a paid place must never be mistaken for a better answer. The mark does that
work, so it is kept for verified businesses and nothing else on the site may look like it.

**Open:** whether Biznes Grow includes Biznes Go's verified mark and priority. The owner's words
give them to Biznes Go. The site's pages at present say that either paid plan comes first.

### 2. Pocket guides

**Who pays:** a visitor, or someone with visitors coming.

**What they buy:** a PDF for a phone, A5, made to be read on the road with no signal: places to see
and things to do, region by region, each fact from an official page, with the sources listed at
the back. The pictures in it are illustrations made for biznes.mu, and it says so.

**Price:** not yet set by the owner. Until it is, the shop says so and takes requests.

**The size:** 1,436,250 tourists arrived in 2025 (Statistics Mauritius, in the table below). How
many of them would find the site, and how many of those would buy a guide, is not known and is not
guessed here.

**What it needs:** the first guide finished (its places are being researched), a price, and a way
to pay and to deliver the file. The file is kept out of the public folder, because it is sold.

**The care it needs:** the guides on the site stay free. They are how people will find the site.
The pocket guide is a different thing, made to be carried, and it must be as well sourced as the
rest. A wrong opening time in a paid guide costs more than one in a free one.

### 3. Websites, through Khay Digital

**Who pays:** a listed business with no website, a thin one, or no brand to speak of.

**What they buy:** a website, a brand, a claimed and filled listing, from the agency that runs the
directory.

**Why it can start now:** it needs no audience, no payment system and no new product. `npm run
leads` writes two lists to `reports/`, which is not committed: every listing with no website on
record (6,754), and the businesses among them that have a telephone number (273). The second list
is the one that can be worked today. By kind:

| Kind | Businesses with a telephone number and no website on record |
|---|---|
| Eat and drink | 122 |
| Shops | 35 |
| Health | 24 |
| Places to stay | 23 |
| Offices and professional services | 18 |
| Cars and transport | 15 |
| Home and building | 12 |
| Things to do | 12 |
| Beauty and wellbeing | 11 |
| Money and insurance | 1 |

**The sum:** if one in twenty of the 273 becomes a client in a year, that is about 13 projects. At
MUR 60,000 each, which sits inside the published MUR 25,000 to MUR 250,000 band below, that is MUR
780,000. Both the rate and the price are assumptions. The rest of the 6,754 either have no
telephone number on record, and would have to be reached in person, or are public bodies and
schools, which the shorter list leaves out.

**On the site:** one quiet line in the footer, "No website yet?", and the usual credit. The owner
asked for Khay Digital to be promoted "subtly, not devan devan", and nothing louder is built.

**The care it needs:** absence from the map is not proof a business has no site. Ask before
assuming. Contact businesses by the telephone numbers they publish, never by harvested email: the
index holds none, by design. The list stays out of the repository and is not sold on.

## Proposed earlier, and not decided

These were in the first version of this page. The owner has not taken them up or turned them down.

### Introductions to founders and investors

**Who would pay:** company secretaries, accountants, law firms, management companies, banks,
insurers, trade mark agents, immigration advisers.

**What they would buy:** a request from a person who has said what they need. A reader of
"Incorporate a company" presses "Ask three firms for a quote", answers four questions, and the
request goes to up to three firms that have agreed terms with us.

**Why it could be worth the most:** the service being bought costs from about USD 1,000 for a
permit application to USD 2,400 a year for a company secretary, every year (the second table under
"What others charge"). Paying for the introduction is ordinary business for such firms.

**Price to test:** MUR 1,500 to MUR 3,000 for a domestic request (a company, an accountant, a trade
mark), and USD 100 to USD 250 for an investor's or a global business request.

**The size:** 24,571 enterprises were registered in 2025, about 2,000 a month, and 10,550
occupation permits were applied for. Twenty requests a month would be about 1% of new
registrations.

**The care it would need:** the guide's text never recommends a firm and never changes for one. The
request box is labelled as a paid service to firms. Partners are checked against the registers the
site itself lists. A reader's details go only to the firms they chose to ask.

### Later ideas

- **Data and alerts for firms that sell to businesses.** One caution decides the shape of this. The
  listings are derived from OpenStreetMap under the Open Database Licence, which means the data
  itself must stay open to anyone. We can charge for a service (an API, alerts, freshness) and for
  what we gather ourselves (claims, verifications, what a business tells us), but we cannot sell
  the map's data as if it were ours.
- **Reminders for accountants and founders** before each deadline in the guides, with the source of
  each. The guides already hold every date.
- **A named supporter for a guide,** in a line at its foot, with a written rule that the supporter
  sees nothing before publication.
- **Businesses for sale, and the ready-made brands the site began with.**

## Overtaken by the owner's decisions

| The first version said | What stands now |
|---|---|
| "The order of results is never for sale" | Biznes Go is listed with priority, by the owner's decision of 20 November 2026. A paid business comes first among equal answers and is always marked |
| A verified profile at MUR 400 a month, billed as MUR 4,800 a year, as a price to test | The owner's prices: Biznes Go at Rs 550 a month and Biznes Grow at Rs 1,250 a month, for each business |
| "A paid profile is fuller, so it sorts higher among equals, exactly as any fuller listing does today. It never jumps the order" | A paid business is placed first among equals because it pays, and the site says so |
| Sponsored places: one labelled slot above a category or a town, at MUR 1,500 to MUR 5,000 a month | Not pursued. The priority listing is the paid place. A second kind of paid place would need its own label and its own decision |
| Paid profiles as the third stream, after the agency's work and introductions | The plans lead, with the pocket guides and the agency's websites, as the owner set out |
| A first year summed on those prices | Summed again below, on the owner's prices |

## The market, in sourced figures

| Fact | Figure | Period | Source |
|---|---|---|---|
| Live business entities (companies, partnerships, foundations; not sole traders) | 126,453 | October 2026 | [CBRD](https://companies.govmu.org/cbrd/wp-content/uploads/2026/11/Updated-Monthly-Business-Entity-Count-as-at-October-2026.jpg) |
| Of which private domestic companies | 89,759 | October 2026 | CBRD, same chart |
| New private domestic companies | 11,259 | 2025 | [CBRD](https://companies.govmu.org/cbrd/wp-content/uploads/2026/05/Monthly-statistics-newly-registered-entities-for-year-2025.png) |
| New business registrations by individuals | 12,676 | 2025 | [CBRD](https://companies.govmu.org/cbrd/wp-content/uploads/2026/11/Business-Registration-Individual-for-year-2022-2026-051126.jpg) |
| Enterprise registrations, all kinds | 24,571 | 2025 | [Statistics Mauritius](https://statsmauritius.govmu.org/Documents/Statistics/By_Subject/Businesses/BusinessStatistics4Qtr25_040226.pdf) |
| Share of new enterprises in wholesale and retail trade | 38% | Q4 2025 | Statistics Mauritius, same paper |
| People employed by micro, small and medium enterprises | 274,977 (48.2% of employment) | 2023, provisional | [Statistics Mauritius](https://statsmauritius.govmu.org/Documents/Statistics/By_Subject/SME/DS_SME_2018-2023_061025.xls) |
| People aged 12 and over who use the internet | 83.2% | 2024 | [Statistics Mauritius](https://statsmauritius.govmu.org/Documents/Statistics/ESI/2026/EI1939/ICT_Yr25_100726.pdf) |
| Mobile internet subscriptions | 1,885,100 | 2025 | Statistics Mauritius, same paper |
| Tourist arrivals | 1,436,250 | 2025 | [Statistics Mauritius](https://statsmauritius.govmu.org/Pages/Statistics/ESI/Tourism/Tourism_Yr25.aspx) |
| Occupation permit applications | 10,550 (3,710 in 2018) | 2025 | [EDB](https://edbmauritius.org/newsroom/edb-board-approves-key-measures-to-accelerate-investment-exports-and-economic-transformation) |

What this says: about 2,000 new businesses are registered every month, and each one needs a
company secretary or an accountant, a bank, a website, insurance and often a licence. More than
10,000 people a year apply to work or invest here from abroad, and more than 1.4 million visit.
Nearly everyone is online, mostly on a phone. And the registry counts 126,453 live entities while
our index holds 7,179 listings: the directory has room to grow many times over.

## What others charge

| Who | What they sell | Price | Source |
|---|---|---|---|
| Yelo Mauritius (states 11,344 listings) | Basic listing, one-off | USD 20 (regular USD 40) | [yelo.mu](https://www.yelo.mu/), 20 November 2026 |
| Yelo Mauritius | Premium listing | USD 65 a year (regular USD 130) | same |
| Yelo Mauritius | Lifetime listing | USD 145 (regular USD 290) | same |
| Yellow.mu | Free and premium listings | Prices not published | [yellow.mu](https://www.yellow.mu/) |
| MCCI | Membership, with a free directory entry | MUR 8,000 to MUR 110,000 by turnover | [mcci.org](https://www.mcci.org/en/membership/membership-form/) |
| lexpress.mu, March 2018 rate card | Sponsored article | MUR 30,000 | [La Sentinelle](https://lasentinelle.mu/sites/default/files/statistics/lsldigital_ratecard_March_18.pdf) |
| lexpress.mu, March 2018 | Banner on one section | MUR 3,000 to MUR 4,500 a week | same |
| lexpress.mu, March 2018 | Site-wide billboard | MUR 35,000 a week | same |

The owner names bonjour.mu as the competitor to be measured against. It is not in this table: its
prices were not read for this page, and none is given from memory.

What a founder pays the firms an introduction would send them to, and what a website costs:

| Service | Price | Source |
|---|---|---|
| Incorporating a domestic company through a fiduciary | from USD 2,100 | [Stonehage Fleming, 2026 schedule](https://cdnwww.stonehagefleming.com/assets/schedule/6.-Fiduciary-Fee-Schedule_Mauritius-2026.pdf) |
| Registered office and company secretary, a year | USD 2,400 | same |
| Occupation permit application | from USD 1,010 | same |
| Authorised Company, set up | USD 2,849 or USD 3,799 | [Expanship](https://www.expanship.com/mu/incorporation/pricing) |
| Authorised Company, yearly compliance | USD 2,699 a year | [Expanship](https://www.expanship.com/mu/compliance/pricing) |
| Trade mark in one class, through an agent | USD 950 | [iGERENT](https://igerent.com/trademark-registration-mauritius) |
| A website from a freelancer | MUR 25,000 to MUR 90,000 | [Carril Agency's 2026 guide](https://www.carrilagency.com/blog/how-much-does-a-website-cost-in-mauritius) |
| A website from a small agency | MUR 90,000 to MUR 250,000 | same |

These are list prices from the firms that publish them, mostly at the upper end of the market. No
Mauritian accountant or company secretary was found publishing rupee prices: they quote on request.

## What we should not do

- **Sell a place without marking it.** This replaces "sell the order of results", which the owner's
  decision overtook.
- **Let a paid business outrank a better answer.** The site promises priority among equal answers,
  and no more.
- **Call a business verified without a check that is written down.**
- **Run an advertising network's banners.** In a country of about 1.2 million people (Statistics
  Mauritius counts 180.5 internet subscriptions per 100 inhabitants and 2,241,100 in all) the money
  is trivial: 100,000 page views a month at one dollar a thousand, which is an assumption and a
  generous one for this market, is USD 100. It would cost speed, privacy and the look of the thing.
- **Charge to correct or remove a listing.**
- **Put the guides on the site behind a paywall.** They are how people will find the site. The
  pocket guides are a separate thing, made to be carried.
- **Sell lists of contacts.** We hold no email addresses and should keep it that way. The list of
  businesses with no website is for the agency's own calls.
- **Take money from a firm to appear in a guide's text.**

## A first year, as arithmetic

This is arithmetic on assumptions, not a forecast. The site has no visitors yet, so there is
nothing to extrapolate from. Each cell is a number of sales times a price. A plan is counted for
twelve months; a business that joins part of the way through the year pays for less.

| Stream | Cautious | Middle | Ambitious |
|---|---|---|---|
| Websites through Khay Digital, at MUR 60,000 | 4: MUR 240,000 | 12: MUR 720,000 | 30: MUR 1,800,000 |
| Biznes Go, at Rs 6,600 a year | 15: Rs 99,000 | 60: Rs 396,000 | 180: Rs 1,188,000 |
| Biznes Grow, at Rs 15,000 a year | 5: Rs 75,000 | 20: Rs 300,000 | 60: Rs 900,000 |
| Pocket guides | No price is set, so no sum | | |
| **The owner's streams** | **Rs 414,000** | **Rs 1,416,000** | **Rs 3,888,000** |
| Introductions, if taken up, at MUR 2,000 on average | 60: MUR 120,000 | 240: MUR 480,000 | 720: MUR 1,440,000 |
| **With introductions** | **Rs 534,000** | **Rs 1,896,000** | **Rs 5,328,000** |

Read it this way. The numbers of businesses on Biznes Go are the ones the first version assumed
for paid profiles; the numbers on Biznes Grow are set at a third of those, which is an assumption
with nothing behind it yet. The price of a website is an assumption inside the published band. The
ambitious column's 30 websites is more than a tenth of the 273 businesses that can be telephoned
today, so it would need businesses reached in other ways. In every column the agency's own
projects are the largest line in the first year. The plans are the lines that recur.

## What it costs to run

- **Hosting and the crawl:** small. The whole index is a few megabytes and the crawl takes minutes.
  Accounts add a database; its price was not read for this page.
- **Keeping the guides true:** the real cost. The rules change with every Budget and Finance Act.
  Every guide must be read against its sources again at least once a year, after the Finance Act,
  and whenever a body changes a fee. Allow several days each time. The emergency numbers and the
  public holidays need the same reading, and a wrong emergency number is the worst mistake the
  site could make.
- **Checking and answering:** each business on a paid plan is checked by a person, and until there
  is a way to pay online each request for a plan or a guide is answered by a person.
- **Selling:** someone has to call the businesses on the list. No product on this page sells itself
  in year one.
- **Building:** accounts, a dashboard for a business's owner, the admin screens, and bookings and
  services are being built, and none is finished. Payments are not started.

## The order to do it in

**Before launch**

- Have a qualified person read the tax and employment guides. Close the README's confirm list.
- Choose where requests go, and launch.
- Create or approve the Supabase project that will hold the accounts, and say who the first
  superadmin is.
- Write down what "verified" checks.
- Set the pocket guide's price, and choose how plans and guides are paid for.
- Start the agency's calls by hand, from the list of 273.

**Next**

- Accounts, and free claiming of listings. This grows the index with what no one else has.
- Biznes Go, sold to businesses that have claimed and been checked.
- The first pocket guide.
- Count what matters, without tracking people: searches, searches that found nothing, listings
  opened, "Call" pressed, guides read. The privacy page says the site runs no analytics, so that
  page changes first.

**Later**

- Biznes Grow, once bookings and services work.
- French pages for the guides and the directory. The search already understands a question in
  French or Kreol; the pages do not yet answer in them.
- Introductions, if the owner takes them up.
- More sources for the index: licensed operators, listed companies, members of associations.

## What to measure

- **Reach:** searches a day; share of searches that find nothing (and what they asked for).
- **Use:** listings opened; "Call", "Visit website" and "Directions" pressed; listings saved and
  shared; guides read to the end.
- **Supply:** listings claimed; listings with a telephone number; listings added by their owners.
- **Money:** requests for each plan and the share that pay; businesses verified; how many renew;
  pocket guides asked for; calls made from the list and the share that become projects.

The searches that find nothing are the product plan. If people keep asking for plumbers and there
are four in the index, that is where the next crawl, and the next sales call, should go.

## Risks

- **No audience.** Everything waits on visitors. The guides are the best hope of being found, since
  few pages anywhere set out these rules with sources. Launch them first and keep them current.
- **A paid place mistaken for a better answer.** The owner chose priority for paying businesses.
  The mark and the two pages that explain the order are what keep that fair. If either slips, the
  difference between this and every other directory is gone.
- **A plan sold before it exists.** Biznes Grow has a price and no bookings yet.
- **A wrong figure.** See costs. Each guide already shows the day it was checked and what it could
  not confirm; keep that discipline.
- **Google Maps.** For "pharmacy near me" it will usually win. We can win where it is weak: by
  trade and town in three languages, with sources, and with the rules of doing business beside the
  listings.
- **The other directories.** Yelo states 11,344 listings and sells profiles from USD 20. We are not
  cheaper. The case for the price is the check behind the mark, the bookings, and the sources.
- **The licence.** Open data keeps us cheap to run, and means the raw listings can never be our
  moat. The moat is what businesses tell us themselves, the guides, and the name.

## Decisions for the owner

1. How are plans and pocket guides paid for? No payment gateway is chosen.
2. What is the pocket guide's price?
3. Does Biznes Grow include Biznes Go's verified mark and priority?
4. What does "verified" check, and who does the checking?
5. The Supabase project for accounts could not be created from the build session. Will the owner
   create or approve one, and who is the first superadmin? The proposal is the first account
   registered.
6. "Your own page to send customers to" is listed under Biznes Grow in Khay Digital's words. Is it
   part of the plan?
7. Are introductions to firms wanted, and if so, with which firms and on what terms?
8. Who re-reads the guides after each Finance Act, and who signs them off? The new guides for
   visitors, newcomers and residents need the owner's reading too.
9. May we count visits in a way that respects privacy, so the next version of this page has
   measurements in place of assumptions?
