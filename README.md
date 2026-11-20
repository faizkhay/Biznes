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
- **The index** (`data/index`): 7,179 listings in 129 towns and villages (and 144 neighbourhoods
  within them) and 70 categories, 217 Mauritian websites, 153 official pages. Written by the
  crawler; never edited by hand. It can be downloaded from the site's own data page.
- **The search** (`src/lib/search.ts`): one question over listings, guides, official pages and
  websites. It reads a town and a kind of business out of a question, in English, French or Kreol;
  it answers a question about how with the fact itself; and it never passes a wider category off as
  the answer to a narrower word.
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
configured: a webhook, or email through Resend. With neither set, the form does not post at all:
the same fields write the request out for the visitor's own WhatsApp or email, addressed to the
contact in `src/data/site.ts`. No request is lost quietly, and no form fails every time. Choose a
route before launch if requests should arrive in one place.

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
| Behaviour | `npm run behaviour` | 71 of 71 |
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
read as a kind and a town, in Kreol, in French, and by one half of a town of two names; a question
about how answered by the fact itself; a tool and a glossary term found by name; a narrower word
not passed off as a category; padding words dropped; a misspelling answered and said to be one; the
chart drawn in on the answers; the "/" key; nothing found; a second page; a listing reached by its id, its
sources, the age of its record, its telephone link and its structured data; the four old addresses; robots, the sitemap
and llms.txt; a guide's citations; the VAT sums; the two tools drawn from guides; the form's
errors, its delivery, its honeypot and its rate limit, and what it does with no route set (it starts
a second server on port 3101 for that); the site with no script; and six pages on a phone.

Captures of six kinds of page are kept in `review/screens`. The rest are made again by the command.

**The design review.** A reviewer who had not built the site went through it on 20 November 2026
and made fourteen findings, two of them blockers. `STORY.md` lists each with what was done, and the
five things left undone. Every check above was run again after the fixes.

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
- **Most records are old.** Nine in ten of the map's listings were last edited more than two years
  ago. Each listing says when, and warns when it is over two years. Claimed listings would cure
  this; they are not built.
- **A chain is one row a branch**: "MCB" is 41 rows.
- **No French or Kreol pages.** A question in either is understood.
- **No accounts**: a business cannot claim and edit its own listing. It asks through the form.
- **No light palette**, and the chart cannot be explored (`DESIGN.md`, "Known Gaps").
- **"Open now" is not offered.** Hours are shown as the map holds them, for 355 listings.
- **A listing's website is checked only at its front page.**
- **The search has no memory of what people ask**, so nothing yet says which searches find nothing.
- **Names are shown as the map writes them**, capitals and all.

## Accounts

Built on 20 November 2026 on the `accounts` branch, to the owner's brief of that day: users,
admins and a superadmin; a business listed free (Biznes Free), or on Biznes Go at Rs 550 a month
(verified, and listed with priority), or on Biznes Grow at Rs 1,250 a month (everything in Go,
with bookings and services). Two of the "Known gaps" above are answered by it, once it is switched
on: there are accounts, and a business can claim its listing and keep it current.

Accounts run on a Supabase project: Supabase Auth for signing in, and its Postgres for everything
else, reached through `@supabase/supabase-js` and `@supabase/ssr`. **There is no service-role key
anywhere in the site.** Every privilege is decided in the database, so the publishable key the
browser can see opens nothing that is not meant to be open.

### Switching them on

| Variable | For |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | The project's address |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Its publishable key (the "anon" key, or a key that begins `sb_publishable_`) |
| `NEXT_PUBLIC_SITE_URL` | Already asked for above. Here it is also the address in the emails Auth sends: set it |

With either of the first two missing, **accounts are off**: the site builds and behaves as it did
before they existed, and each account page says "Accounts open soon" with the way to the form at
`/add`. `accountsOn` in `src/lib/accounts/config.ts` is the one switch every part reads. The three
pages that word a sentence differently with accounts on (`/pricing`, `/data`, `/privacy`) were
compared with the build before this work, with accounts off: all 38 public addresses tried answer
byte for byte the same, build file names aside.

### Setting up the project

1. **Create the project**, and **apply the migrations** in `supabase/migrations`, in order. With
   the Supabase CLI: `supabase link --project-ref <ref>`, then `supabase db push`. Without it:
   paste the four files into the SQL editor, one after the other.
2. **Auth, URL configuration.** Site URL: the site's own address. Redirect URLs: the same address
   followed by `/**` (and `http://localhost:3000/**` to work on it).
3. **Auth, email templates.** Point the links at this site, so that a link opened on another
   device still works:
   - Confirm signup: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
   - Reset password: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/account/update-password`

   Left as Supabase ships them, the links still work, but only in the browser that asked.
4. **Auth, email.** Supabase's own sender is for trying things out and sends only a few messages an
   hour. Give the project an SMTP sender before launch.
5. **Set the variables and deploy.**
6. **Register first.** See the next heading.

### The first superadmin

**The first person ever to sign up becomes the superadmin.** Everyone after is a regular user. So
the owner registers before the address is given to anyone, then checks `/admin/people`. If someone
else got there first, change the two roles in the SQL editor. There is always a superadmin: the
database refuses to demote or delete the last one, by any route, the SQL editor included. To hand
over, make the new person a superadmin first.

### Who can do what

| | Visitor | User | Admin | Superadmin |
|---|---|---|---|---|
| Search, read a listing, ask a business on Grow for a booking | yes | yes | yes | yes |
| Keep their own bookings, and cancel one | | yes | yes | yes |
| List a business, or claim a listing in the open index | | yes | yes | yes |
| Change their own business's details; take it out | | yes | yes | yes |
| Ask for Biznes Go or Biznes Grow | | yes | yes | yes |
| On Grow: services, MCB Juice details, confirm or decline bookings | | yes | yes | yes |
| Approve, reject, suspend a business; give or take the verified mark | | | yes | yes |
| Switch a plan on, with its last day; answer a request for one | | | yes | yes |
| See everyone's businesses and bookings, the record of admin actions, the list of listings with no website | | | yes | yes |
| Change roles | | | | yes |
| Set the picture and the greeting by hand | | | | yes |

A user's own role, plan, plan end, verified mark and status are never theirs to write.

### How it is held

- **Listings from the crawler need nothing.** Every listing in the open index is live and counts as
  Biznes Free with no row in the database. An owner claims one ("Claim this listing"); the claim is
  a business row with `listing_id` set, pending until an admin approves it. Until then the public
  page does not change.
- **A new business always starts pending, free and unverified**, whatever the request says. The
  database sets it, not the form.
- **Grants, then guards.** Supabase grants everything on a new table to the API roles; each
  migration takes that back and grants only the columns a role may touch. A trigger on each table
  repeats the rule, so a careless grant later does not open a door.
- **Admin work goes through functions** (`admin_set_status`, `admin_set_plan`,
  `admin_set_verified`, `admin_handle_plan_request`, `set_role`) that check who is asking. What
  they change is written to `audit_log` by triggers: who, what, when.
- **Plans are switched on by hand.** How a plan is paid for is not built: an owner asks, an admin
  arranges payment and switches the plan on with the last day it is paid for. After that day the
  business counts as free again, by itself. Switching a paid plan on marks the business verified.
  The interface says payment is arranged directly and that paying online is on its way. There is
  no payment code.
- **Marks.** The vivid mark (`src/components/Verified.tsx`) is only for a business on Go or Grow
  that an admin has verified. A claimed listing on the free plan says "Claimed by its owner", in
  the quiet `tag`. A paid place is never shown without its mark.
- **The order of results** changes in one way, and `/data` says so: a verified business on a paid
  plan is shown first among the listings that answer. A search for a business by its own name
  still shows that business first.
- **Bookings are requests.** Anyone may ask a live business on Grow, with a name and a telephone
  number. The database refuses a time that has passed, a fourth request in an hour from one number,
  and a flood to one business. The form has a honeypot. The business confirms, declines or marks it
  done. Payment is between the customer and the business.
- **MCB Juice is details only**: a mobile number and the name the account is under, written by the
  owner, shown beside the services and after a booking request while the business is on Grow. No
  integration; the site takes no part in a payment and says so.
- **The session** is kept in cookies no script can read. `src/proxy.ts` renews it, for the account
  pages only (`/account`, `/dashboard`, `/admin`, `/auth`): every other page is untouched, so the
  public pages stay cacheable. The header learns who is signed in from the browser, and asks the
  server only when a marker cookie says someone is.
- **Public reads are kept for five minutes** and tagged, so an admin's or an owner's change shows
  at once. With accounts on, the fixed pages are made again at most every five minutes, not every
  hour, because the picture behind the page may have been chosen by hand.
- **`/privacy` changes with accounts on**: it says what an account keeps, and that signing in sets
  cookies.

### Its pages

| Address | What it is |
|---|---|
| `/account/sign-in`, `/account/sign-up`, `/account/reset`, `/account/update-password` | Signing in, a new account, a forgotten password |
| `/auth/confirm` | Where the link in an email lands |
| `/account` | A person's details, their bookings, the way to their businesses and, by role, to the admin pages |
| `/dashboard`, `/dashboard/new`, `/dashboard/[id]` | An owner's businesses; list one or claim one (`?listing=<id>`, `?plan=go`); one business: details, plan, services, bookings |
| `/admin`, `/admin/leads`, `/admin/people`, `/admin/settings` | The queue, plan requests, every business, the record; listings with no website, with a CSV file; roles; the look. Anyone who is not an admin is told the page is not there |
| `/biz/[slug]` | The page of a business its owner listed that is not in the open index |
| `/b/[slug]` | A listing's page gains its owner's details once a claim is approved, or the link to claim it |

### Checking it

| Check | Command | Result on 20 November 2026 |
|---|---|---|
| Row level security | `npm run test:rls` | 186 claims, all pass, on Postgres 16 behind a stub of Supabase, and again on Supabase's own Postgres image |
| The whole of it, in a browser | `bash scripts/accounts-stack.sh up`, build and serve with the two variables it prints, `node scripts/accounts-e2e.mjs` | 117 of 117, with axe-core (WCAG 2.2 AA) clean on 23 kinds of account page at 1440 by 900 and 390 by 844, and none wider than its screen |
| A session that runs out | `ACCOUNTS_JWT_EXP=100 bash scripts/accounts-stack.sh reset`, serve, `ACCOUNTS_JWT_EXP=100 node scripts/accounts-sessions.mjs` | 8 of 8 |
| Accounts off | Build with neither variable set | Builds; public pages unchanged |
| No network at build | Build with `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy` | Builds; the reads that fail fall back to the calendar's look |

`scripts/accounts-stack.sh` runs a Supabase project in miniature in Docker: Supabase's own Postgres
image (15.8.1.085), Supabase Auth (v2.176.1) and PostgREST (v12.2.8), with a small gateway and a
mail sink beside them (`supabase/local`). The browser check signs up, opens the link in the email,
signs in and out, claims a listing, lists a business, approves it as an admin, switches a plan on,
adds a service, asks for a booking as a visitor and as a customer, answers it as the owner, changes
roles and the look as the superadmin, and resets a password.

**Not run, and why:**

- **A hosted Supabase project.** None existed. Everything above ran against the same three
  programs a project runs, but not against Supabase's own gateway, its key checks, its email
  sender or its limits on sign-ups and emails. The email templates in step 3 were tried as links
  of that shape, not by editing a template in a dashboard.
- **Tokens signed the newer way.** The local stack signs tokens with a shared secret. A new project
  signs them with a key pair, which `getClaims()` in the proxy then checks without a round trip.
  That path is the library's own and was not run here.
- **A deployment.** Not run on Vercel or any host: the proxy, the cookies over HTTPS, and the cache
  shared between several servers were tried on one local server only.
- **Real email.** Delivery, spam folders and the wording of the messages are the project's.
- **Many people at once.** Nothing was measured under load.
- **A screen reader, by ear.** As for the rest of the site.

**Not built:**

- **Payment.** Plans are switched on by hand. Paying online is planned, through Stripe, and is not
  connected.
- **Owners' own businesses in the browsing lists.** A business listed from scratch is found by the
  search and has its own page, but is not yet in the lists under `/directory` and `/places`, in the
  suggestions under the search box, or in the sitemap. A claimed listing is, being a listing.
- **Changing an email address, deleting an account, signing in with Google or a phone.** Ask us,
  for now.
- **An email to the owner or the customer when something changes.** The site sends none of its
  own: Auth's two messages are the only email.
- **Opening hours and photographs** for an owner's business.
