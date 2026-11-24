# biznes.mu, the search engine

A website for Khay Digital Ltd (Mauritius), who build and run it: biznes.mu, a search engine for
business in Mauritius and the directory behind it. Its one job is to answer a question about the
island: a business to call, how something is done, whether a business is real, who to ring in an
emergency.

What is the owner's and what is not: the name, the line, the three plans and their prices are the
owner's words. The listings come from open data and each says where. The articles and guides are
written from official pages and each lists them. The design, the search and the crawler were made
for this site.

The landing page is a postcard: a painted picture of the island, the site's one line, the search
box in the middle and one button, "Home". Home is the page a Mauritian keeps open: the top
businesses, Baz Manzer, the categories, the regions and what is useful, on a sheet of warm paper
laid on the picture. The picture follows the calendar by itself: a public holiday's look on its
day, otherwise one of the season's, painted wide for a desk and tall for a phone. On the landing
page a few petals or leaves of the season fall over it. Everything a visitor reads at length is
on the paper.

The site is built with KOS, Khay Digital's method and standards (`faizkhay/Khay-Original-Skill`).
Four documents describe this build, and `AGENTS.md` holds the rules for changing it:

| Document | Says |
|---|---|
| `PRODUCT.md` | Who it is for, what it does and does not do, the plans, the evidence on hand |
| `STORY.md` | The one picture the site is built on, and the rounds that made it |
| `DESIGN.md` | Every colour, text style and component, with its source and its measured contrast |
| `REVENUE.md` | How the site earns, the owner's plans and prices first |

It replaces the site that sold ready-made businesses (in the repository's history before commit
`a7d4ea3`). Its old addresses lead to the directory, the data page and the form.

## What is in it

- **The crawler** (`crawler/`): builds the index from OpenStreetMap, Wikidata, the front page of
  each business's own website, the member lists of chambers and associations, and the official
  pages the guides point to.
- **The index** (`data/index`): 7,179 listings in 129 towns and villages (and 144 neighbourhoods
  within them) and 70 categories, 217 Mauritian websites, 153 official pages. Written by the
  crawler; never edited by hand. It can be downloaded from the site's own data page.
- **The search** (`src/lib/search.ts`): one question over listings, articles, the site's own
  pages, official pages and websites. It reads a town, a kind of business or a dish out of a
  question, in English, French or Kreol. A page of results is in four parts, always in this
  order: our own pages that answer, businesses, parts of articles that only mention the words,
  and pages elsewhere, folded away as "References elsewhere". It never passes a wider category off
  as the answer to a narrower word, and a partial match is said to be one ("The order of results").
  Finding the documents that hold a question's words, and weighing them, is the site's own engine
  (`src/lib/engine.ts`, "The engine"): no library does it.
- **Narrowing, saving and sharing**: a list of listings is narrowed by telephone number, by
  website and by town, each as a link. A shortlist is kept in the visitor's own browser and shared
  as a link. A listing or a search can be shared.
- **The articles and guides** (`content/guides`): 39 when this was written, on six shelves. Each
  fact names its source, and each article ends with the kinds of business that go with it (where
  the tie is plain), what to read next on the site, and its list of references. Each is also
  served as Markdown. A glossary of 90 terms (`content/glossary.json`) is drawn from the business
  guides.
- **The tools**: check a business, a VAT calculator, a personal income tax calculator, a business
  tax estimator, a comparison of legal structures, the glossary. Each takes its figures from a
  guide and holds none of its own (`src/lib/figures.ts` reads them by a fact's label, and
  `src/lib/sums.ts` does the arithmetic for the two tax tools and their no-script examples).
- **Emergency numbers** (`content/emergency.json`): 43 numbers from 29 sources, each named.
- **Baz Manzer** (`/baz-manzer` and everything beneath it, `src/lib/food.ts`, `src/lib/baz.ts`):
  the places to eat and drink as a section that stands by itself, with its own header, its own
  search and an address for each kind of place, kind of food and town, and a paid outlet's menu on
  its row. It installs as an app of its own ("The installable app").
- **A business's page** (`src/components/BusinessPage.tsx`): one component for a listing from the
  index (`/b/...`) and for a business its owner listed (`/biz/...`). Calm when free; with a cover,
  pictures, hours, a menu and a way to book when the owner pays and has added them.
- **The street map** (`src/components/StreetMapView.tsx`): a real map of streets in the island's
  place, loaded only when a visitor asks for it ("The street map").
- **The biznes.mu Pocket Guide** (`content/pdf`, `npm run pdf`): one guide, renewed every month,
  53 pages, with at most four pages of sponsors.
- **The cart** (`/cart`, `src/lib/cart.ts`): the guide, a place in it, or a plan, kept in the
  visitor's browser until the order is sent.
- **The plans** (`PLANS` in `src/data/site.ts`): Biznes Free, Biznes Go and Biznes Grow, on
  `/pricing`.
- **The installable apps**: the whole site, and Baz Manzer by itself. Two manifests, one service
  worker, two offline pages and a card that offers to install the one the page belongs to.
- **Accounts** are built on their own branch and merged here (see "Accounts").

## Running it

Node 20 or newer.

```
npm install
npm run dev          # http://localhost:3000
npm run build        # the production build
npm start            # serves it
npm run typecheck
```

The index is in the repository, so the site runs without crawling first. The service worker is
registered in a production build only; under `npm run dev` any worker left on the address is taken
off, so it never hands the dev server its kept files.

| Command | What it does |
|---|---|
| `npm run crawl` | Rebuilds `data/index` (see "The crawler") |
| `npm run leads` | Writes the list of listings with no website to `reports/` |
| `npm run pdf` | Lays out the pocket guide and writes its PDF, its cover and two sample pages |
| `npm run og` | Captures the link preview card into `public/og.jpg`, from `npm run dev` |
| `node scripts/logo.mjs` | Prints the paths of the drawn name |
| `node scripts/icons.mjs` | Draws the app's icons from the mark |
| `npm run copy`, `tokens`, `contrast`, `design` | The checks that need no server (see "Verification") |
| `npm run behaviour`, `a11y`, `screenshots`, `hero` | The checks against a production server |

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

**Every business it finds is listed, on Biznes Free.** The owner's rule of 20 November 2026: "any
existing business listed from crawlers are automatically in free plan, owners can claim and verify
the listings."

## Deploying

The search, the lists that can be narrowed, the shortlist and the form need a server, so this is
not a static export. It runs on any Node host; on Vercel it needs no configuration.
`next.config.ts` makes sure `data/index` and `content` travel with the server, sends the old
addresses to their new pages, and serves `/sw.js` so that it is never held in a cache.

| Variable | For |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | The site's own address, for canonical links, the sitemap and structured data |
| `ENQUIRY_WEBHOOK_URL` | Where the form's requests are posted, as JSON |
| `RESEND_API_KEY`, `ENQUIRY_TO`, `ENQUIRY_FROM` | Or: email them through Resend |
| `CRAWLER_USER_AGENT`, `CRAWLER_ROBOTS_TOKEN` | The crawler's name, where the crawl is run |

### Before the site can be found

`launched` in `src/data/site.ts` is `false`. While it is, every page asks search engines not to
index it and `robots.txt` closes the site to them (the fetchers that draw a link's preview are let
in, so a pasted link shows its card). Set it to `true` when the confirm list below is closed. The
results of a search, a shortlist, the cart, an account and the offline page are never indexed,
launched or not.

What the code does for search engines and for assistants that answer from the web:

- **Every page** has its own title and description, a canonical address, and the Open Graph and
  Twitter tags (`pageMeta` in `src/lib/meta.ts`). `npm run seo` fails if one is missing.
- **A link pasted anywhere** shows a card drawn for that page (`opengraph-image.tsx` beside the
  page, all through `ogCard` in `src/lib/og.tsx`): an article, a listing, an owner's business, a
  category, a category in a town, a town, Baz Manzer, the emergency numbers, the holidays, the
  plans and the shop. Every other page shows `public/og.jpg`.
- **Structured data** is written from the page's own content and never from anything else
  (`src/lib/schema.ts`): the organisation and the site with its search, the trail of every page,
  an article with its citations and its questions, a list of listings, and a business as the kind
  it is, with its hours and its menu when it has them.
- **For assistants**: `/llms.txt` lists what the site holds, `/llms-full.txt` gives every article
  whole, and each article is served as Markdown at its own address with `.md` after it.
  `robots.txt` names the crawlers of the answer engines that are let in, and the one that is not.
- **The sitemap** lists every public page with the day its content last changed.

What only the owner can do, outside the code, once `launched` is `true` and the site is on its own
domain:

1. Verify the domain in Google Search Console and in Bing Webmaster Tools, and give each the
   sitemap: `https://biznes.mu/sitemap.xml`.
2. Make a Google Business Profile for biznes.mu itself, under Khay Digital's address and number.
3. Set `NEXT_PUBLIC_SITE_URL` to the real address on the host. Without it every canonical link, card
   and sitemap entry points at localhost, and the server says so when it starts.

### Where requests go

One form, at `/add`, takes every request: add a business, correct a listing, remove one, ask for a
plan (`/add?plan=go`), ask for a pocket guide (`/add?product=...`). It delivers by the first route
configured: a webhook, or email through Resend. With neither set, the form does not post at all:
the same fields write the request out for the visitor's own WhatsApp or email, addressed to the
contact in `src/data/site.ts`. No request is lost quietly, and no form fails every time. Choose a
route before launch if requests should arrive in one place.

Until Stripe is connected, a plan or a pocket guide is asked for through this form and a person
answers.

## The installable app

The owner asked for a site that is "fully pwa enabled" on iOS, Android and a desk, and then, on 23
November 2026, for a second app beside it: "Baz manzer should be its own section on the site, as
in people can choose to install pwa version of only thr baz manzer section on their phones instead
of the whole biznes.mu". So the site installs as two apps, and a person takes either or both.

| Part | File | What it does |
|---|---|---|
| The site's manifest | `src/app/manifest.ts`, served as `/manifest.webmanifest` | The name ("biznes" under the icon), the paper's colour, the four icons, and five pages the icon can open directly: Search, Home, Directory, Emergency numbers, Saved. Some phones show only the first four, so the shortlist, which is one visitor's own, is last |
| Baz Manzer's manifest | `src/app/baz-manzer/manifest.webmanifest/route.ts`, served as `/baz-manzer/manifest.webmanifest` | Its own id, so the two are never taken for one app; the name "Baz Manzer"; a first page and a scope of `/baz-manzer`; the awning's red for the bar at the top of a phone; its own four icons; and what its icon can open directly: the kinds of place, and the towns |
| What a page says of its app | `src/app/layout.tsx`, `src/app/baz-manzer/layout.tsx` | Every page names one manifest, with the name for an iPhone's home screen, the touch icon and the theme colour that go with it: the section's on a page under `/baz-manzer`, the site's on every other |
| The icons | `public/icons`, `src/app/apple-icon.png`, `src/app/baz-manzer/icon.svg` and `apple-icon.png` | All drawn by `node scripts/icons.mjs`: the site's from the mark, the section's from its awning's measures. For each app two as drawn, two on a full square for a platform to cut to its own shape, one for the iOS home screen |
| The service worker | `public/sw.js` | One worker for both apps (its scope is the whole site). Lets a page open with no connection once it has been visited |
| The offline pages | `/offline`, `/baz-manzer/offline` | What the worker shows in place of a page it could not fetch and holds no copy of: "You are offline", with a way to try the same address again and a way to the saved list. Inside Baz Manzer it is the section's own page, under the section's header and bar, and both ways on stay inside the section |
| The install card | `src/components/Pwa.tsx` | Registers the worker, and offers to add to the home screen the app the page belongs to |

**Two apps, and what keeps them apart.** A manifest's `id` is what a phone knows an app by, and
its `scope` is where the app ends. The site's are both `/`; the section's are both `/baz-manzer`
(Next writes its addresses with no stroke at the end, so the scope is the first page's own
address). Next serves a manifest file only from the root of the site, so the section's is a route,
made once when the site is built from the same data the pages read (`BAZ` in `src/data/site.ts`,
the kinds of place from the index). The section's layout names it, and Next then leaves the
site's out of the head: the checks hold that every kind of page names exactly one.

An installed app that left its own scope each time a restaurant was opened would not be an app.
So everything a person does while looking for somewhere to eat has an address under
`/baz-manzer` ("Pages"), a place to eat has a page of its own there, and the section has its own
header, its own bar on a phone and its own search. What is the whole site's is one plain link
away, named as such: "biznes.mu" in the header, "Search all of biznes.mu" under a search.

**What the worker answers, and how** (it is written by hand, with no library, and says so at its
head):

- **A page**: the network first; with no network, the kept copy of that page; with no copy, the
  offline page, and under `/baz-manzer` the section's own. It keeps the last 40 pages opened, and
  never drops either app's first page to make room.
- **The build's own files, the pictures behind the page, the icons and the typeface**: the kept
  copy first, since none of them changes under the same address.
- **Any other file of the site**: the kept copy at once, and a fresh one fetched for the next time.
- **Never**: another site, a form being sent, anything under `/api`, `/account`, `/admin`,
  `/dashboard` or `/auth`, a signed request, a request for part of a file, Next's own request
  for a page's data, or what Baz Manzer's search box asks while a question is typed.
- **From the first visit** it keeps both offline pages with the files they need, the site's icons,
  and the site's first page, so the installed app opens with no connection from the first day.
- **The first page a visitor ever opens** was fetched before there was a worker, so the worker
  holds no copy of it. Once the worker is ready the page asks to be kept (`Pwa.tsx` sends its
  address; the worker listens only to an address of this site that is not a private one) and the
  worker fetches it once more. "The pages you have already opened still work" is then true of the
  very first.
- **Baz Manzer's first page** is kept the first time any page of the section is opened, so the
  app opens with no connection even when it was installed from a restaurant's page.
- **A redirect** it resolves itself. On a page's first making the server can give a redirect's
  address twice, which a browser forgives and a worker's sealed copy does not, so the worker asks
  where the address leads and sends the browser there.

**When to raise `VERSION`** at the head of `public/sw.js`: when the file changes what it keeps, and
when a file under `/themes/` or `/icons/` is replaced under the same name (a new picture, a new
mark). The older version's kept files are then deleted on every device at its next visit. A
picture or an icon given a new name needs no change. It is `v3` since the section's pages joined.

**The install card.** One card, for the app the page belongs to: "Add Baz Manzer to your home
screen" on a page of the section, "Add biznes.mu to your home screen" on every other. Where the
browser makes the offer (Android, a desk), the card has an "Install" button. On an iPhone or an
iPad, which make no offer, it says where to tap: Share, then Add to Home Screen. It shows nothing
inside an installed app, nothing inside another app's own browser on iOS, and nothing on the
landing page, which is one screen with one question and has no bar for a card to sit above: the
offer waits for the next page. Closed, the site's
stays away for thirty days and the section's for good; closing one does not close the other. On a
phone it sits above the tab bar; on a wide screen, in the bottom right corner. The section's
first page also says in a sentence that it installs, for whoever closed the card.

The browser's offer is for the manifest the page named when the offer was made. A step from the
site into the section changes the manifest without loading a page, so the card is shown only on
pages of the app its offer was made for. Chromium was seen to make a new offer for the new
manifest within a few seconds of such a step. The way back from the section ("biznes.mu") is a
whole page load, so the browser reads the site's manifest afresh.

The saved list keeps what it needs to show each listing beside the list itself, in the browser, so
it still opens with no connection. The section's saved places are the same list, narrowed to
places to eat. The privacy page says what an installed copy keeps on the device.

**How the two apps are checked.** `npm run behaviour:baz` (`scripts/behaviour-baz.mjs`), against a
production server: the section's manifest and every field an installer reads; one manifest named
on each kind of page, inside the section and outside it; the old addresses; that no link to a
place, a kind, a kind of food or a town leaves the section; the search; the header and the bar;
the offer to install; axe-core on each kind of page at both sizes; and the pages with the network
off. For that last part it starts a second server and stops it, because a browser's own
"offline" switch does not reach a service worker's requests: with the switch alone a page was
reported as opening offline that had in truth been fetched.

**What was tried, and on what** (23 November 2026). The build machine has Chromium only.

- In Chromium with a window and a profile of its own: the browser read both manifests with no
  error and found nothing against installing either; it made its offer for the section's on a page
  of the section and for the site's elsewhere; both were then installed side by side, as two apps
  with two ids, and each opened in a window of its own on its own first page. In the Baz Manzer
  window a restaurant opened inside the app.
- **Not tried on a real Android phone**: the icon on a home screen and how the maskable one is
  cut, the splash screen, the red bar at the top, the shortcuts on a long press, and a link to a
  page of the section opening in the Baz Manzer app when both are installed.
- **Not tried on an iPhone or an iPad at all.** There the card is shown to anything that names
  itself an iPhone, and it was checked with that name on Chromium. Whether Safari takes the
  section's name, icon and first page from a page of the section when "Add to Home Screen" is
  tapped has not been seen, nor whether a list saved in Safari is there in the installed app.

## Accounts

Built on 20 November 2026 in two rounds, both to the owner's briefs of that day.

The first round (the `accounts` branch): users, admins and a superadmin; a business listed free
(Biznes Free), or on Biznes Go at Rs 550 a month (verified, and listed with priority), or on Biznes
Grow at Rs 1,250 a month (everything in Go, with bookings and services).

The second round (the `accounts2` branch): for a paid plan, a fuller page (a line of its own,
opening hours, a cover and photographs) and, for a food outlet, a menu; for Biznes Grow, the
owner's own records (bookings, customers, services and products, a ledger of payments); a way to
ask for a change of plan or to stop one; advertisements an owner makes and an admin approves; the
list of subscribers to the pocket guide and the magazine; orders from the cart; pictures of the
superadmin's own behind the page; and every account page drawn again in the site's manner.

A third piece, on 23 November 2026 (the `email` branch), to the owner's note of that day: the base
of the site's own email, for the list that is sent the Pocket Guide and, later, the magazine. It is
set out under "Email" below.

Accounts run on a Supabase project: Supabase Auth for signing in, its Postgres for everything
else, and its Storage for pictures, reached through `@supabase/supabase-js` and `@supabase/ssr`.
**There is no service-role key anywhere in the site.** Every privilege is decided in the database,
so the publishable key the browser can see opens nothing that is not meant to be open.

### How to get in

- **Anyone.** The square button with a person's outline, at the right of the header on every page,
  on a phone and on a desk, leads to `/account/sign-in`. "Create an account" is one link from
  there. Once signed in the button shows the person's initial and leads to `/account`. The footer
  and the phone's menu carry "Your account" as well.
- **A user** lands on `/account`: a welcome by name, and tiles to their businesses, their plans,
  their orders and their bookings.
- **An owner** is a user with a business. "Your businesses" on `/account` leads to `/dashboard`,
  a card for each business with its plan, where it stands and the next thing to do. A card opens
  `/dashboard/[id]`, with a bar of that business's parts: Overview always; Bookings, Customers,
  Services and Payments on Biznes Grow; "Its page" on any paid plan; Menu for a food outlet on a
  paid plan; Advertising once the business is live. To begin, "List your business" on `/pricing`
  or on `/dashboard`, or "Claim this listing" on a listing's own page.
- **An admin** sees a second set of tiles on `/account`, "Running the site": Admin (`/admin`),
  Advertisements (`/admin/ads`), Orders (`/admin/orders`), Subscribers (`/admin/subscribers`),
  Email (`/admin/email`), No website (`/admin/leads`). The same pages are tabs across the top of
  each admin page.
- **The superadmin** is the first person who ever registered (see "The first superadmin"). They
  sign in like anyone else and have two more tiles and tabs: People (`/admin/people`), to make
  someone an admin, and The look (`/admin/settings`), for the picture behind every page.

Nobody is given an address to remember: every page above is one or two presses from the button
in the header. A page that is not for the person asking says it is not there.

### The hosted project

The owner created the Supabase project on 20 November 2026: "Biznes", in the organisation's
Ireland region, with the reference `pcopgncmtgkojrtuiqud`. The first four migrations were applied
to it that day, whole and unchanged, and checked:

- Eight tables in `public`, row level security on every one, twenty-six policies, and the trigger
  that makes a profile on sign-up. The owner has since registered, and is its superadmin.
- Asked with the public key, as a visitor would be: live businesses, services and payment details
  answer (with nothing, as there is none yet); the settings answer with the columns the site reads;
  profiles and the audit log are refused.
- The site, built and served against it and not yet deployed: the first screen, a search and a
  listing open; the sign-in and sign-up pages open; the plans lead to the dashboard; the dashboard
  and the admin pages send a visitor who is not signed in to sign in.

Migrations 5 to 10, the second round's, have since been applied to it, unchanged. Migration 9
makes the `media` bucket and its rules itself: there is nothing to set in the Storage dashboard.

**Migrations 11, 12, 13 and 14 are not on it yet.** (Part 14, `20261120000014_email.sql`, is the
site's own email, set out under "Email" below: apply it after the three described here. It alters
the list of subscribers and keeps every row.) `20261120000011_review.sql` is what a security
review of the second round asked for (it is in "How it is held" below); it alters what parts 5
to 10 made and keeps every row. `20261120000012_bookings_proof.sql` puts a request for a booking
behind the site's word, as part 11 does for the list and for orders. `20261120000013_pocket_guide.sql`
brings the catalogue level with the one Pocket Guide; that change has already been made on the
hosted project by hand, and the file changes nothing more there. All three have been applied to
the local stack and to a scratch database with rows in it. Part 11 drops and remakes two rules and
a function, so the project asks its owner to confirm before it runs. Apply the three in order, then
give the database the hash of the site's word (step 8 under "Setting up the project"): the word
itself, `BIZNES_SITE_PROOF`, is already set on the host. Until the hash is there nothing asks for
the word, and until part 11 is applied the site still runs: an advertisement leads to its
business's page, and approving one says to try again.

Its two public values, which are meant to be seen (they ship to every browser):

```
NEXT_PUBLIC_SUPABASE_URL=https://pcopgncmtgkojrtuiqud.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_X_o60qW9sW669m8PJVq0Kw_lZo9mJv4
```

Still to do on the project itself, in its dashboard: the site's address and the redirect addresses,
the two email templates and an email sender (all under "Setting up the project" below). And two
things to know:

- **Supabase's security adviser** lists the admin functions as callable by a signed-in user.
  That is by design: each checks the caller's role before it does anything, and a visitor cannot
  call them. It also lists `public.rls_auto_enable()`, which is the project's own and not ours;
  `revoke execute on function public.rls_auto_enable() from public, anon, authenticated;` clears it.
- **The migrations' history** on the project carries the time each was applied, not the files' own
  numbers. Before using the Supabase CLI against it, bring the two into line with `supabase
  migration repair`, or a later `db push` will try to apply the first four files again.

### Switching them on

| Variable | For |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | The project's address |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Its publishable key (the "anon" key, or a key that begins `sb_publishable_`) |
| `NEXT_PUBLIC_SITE_URL` | Already asked for above. Here it is also the address in the emails Auth sends, and in each subscriber's link to leave the list: set it |
| `BIZNES_SITE_PROOF` | A long random word, the server's alone: never `NEXT_PUBLIC_`, never in the repository. The site sends it with a visitor's writes, and the database, which keeps only its hash, refuses those writes without it. Unset, nothing is sent; see step 8 below |

With either of the first two missing, **accounts are off**: the site builds and behaves as it did
before they existed, and each account page says "Accounts open soon" with the way to the form at
`/add`. `accountsOn` in `src/lib/accounts/config.ts` is the one switch every part reads. With
accounts off the shared pieces are nothing at all or a plain link: `showcaseOf` gives nothing,
`AdSlot` and `SubscribeForm` render nothing, and `Checkout` is a link to `/add` that carries the
cart in its message.

### Setting up the project

1. **Create the project**, and **apply the migrations** in `supabase/migrations`, in order. With
   the Supabase CLI: `supabase link --project-ref <ref>`, then `supabase db push`. Without it:
   paste the files into the SQL editor, one after the other.
2. **Auth, URL configuration.** Site URL: the site's own address. Redirect URLs: the same address
   followed by `/**` (and `http://localhost:3000/**` to work on it).
3. **Auth, email templates.** Point the links at this site, so that a link opened on another
   device still works:
   - Confirm signup: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
   - Reset password: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/account/update-password`

   Left as Supabase ships them, the links still work, but only in the browser that asked, and a
   mail program that opens every link in a message before its reader does can use one up. With
   the two templates above, opening a link uses nothing: it waits at `/auth/continue` for the
   person to press one button, and the token is spent then.
4. **Auth, email.** Supabase's own sender is for trying things out and sends only a few messages an
   hour. Give the project an SMTP sender before launch.
5. **Set the variables and deploy.**
6. **Register first.** See the next heading.
7. **Look at `/admin/orders` once.** The database prices every order from its own `catalogue`
   table, seeded with the prices of 20 November 2026. If the site's own data has moved since (a
   guide's price or title, a sponsor option, a plan), the page says where the two differ and the
   superadmin brings them level with one button. Until they are level, what differs cannot be
   ordered.
8. **Set the site's word.** Joining the list, leaving it, placing an order and asking a business
   for a booking are open to visitors and limited by the hour, so anyone with the public key
   could use a limit up from outside. Choose a long random word (`openssl rand -hex 32`), set it as
   `BIZNES_SITE_PROOF` on the host, deploy, and only then give the database its hash, in the SQL
   editor, with the same word:

   ```sql
   insert into private.site_proof (word_hash) values (encode(sha256(convert_to('<the word>', 'utf8')), 'hex'))
   on conflict (id) do update set word_hash = excluded.word_hash;
   ```

   From then on a call to those three functions, or a booking sent through the API, is refused
   without the word. The site's own email leans on the same word: until the hash is kept, the
   database hands no link to confirm an address to anyone, and believes nothing reported from a
   mail service's webhook (see "Email"). In that order
   nothing breaks on the way; to change the word, empty the table (`delete from
   private.site_proof`), change the variable, deploy, and set the new hash. If the site's own
   forms start saying "try again", the two do not match: the server's log says so.
9. **Confirm that the picture limits are counted.** How many pictures a folder holds, and how
   many one person keeps, are counted by a function that runs as its owner. That role does not
   own Supabase's `storage.objects`, so it sees the rows only if it passes row level security
   there. This query changes nothing and says whether it does:

   ```sql
   select f.proowner::regrole as counted_as, r.rolsuper as is_superuser, r.rolbypassrls as bypasses_rls,
          has_table_privilege(f.proowner, 'storage.objects', 'select') as may_select,
          c.relowner::regrole as table_owner, c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced,
          (select string_agg(p.polname, '; ') from pg_policy p
            where p.polrelid = c.oid and p.polcmd in ('r', '*') and (p.polroles = '{0}' or f.proowner = any (p.polroles))) as select_policies_for_that_role
   from pg_proc f join pg_roles r on r.oid = f.proowner cross join pg_class c
   where f.oid = 'private.may_keep_media(text, boolean)'::regprocedure and c.oid = 'storage.objects'::regclass;
   ```

   The limits hold when `may_select` is true and any one of `is_superuser`, `bypasses_rls` or a
   policy named in the last column is there. On Supabase's own Postgres image the answer is
   `postgres`, not a superuser, `bypasses_rls` true, `may_select` true; part 11 also adds the
   policy "biznes media: counted by the database" for that role, so the last column names it.

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
| Join the list of subscribers, confirm their address by the link they were sent, and leave by the link in any message or in one press from their mail program | yes | yes | yes | yes |
| Place an order (a guest gives a name and a way to reach them) | yes | yes | yes | yes |
| See their own orders and bookings; cancel a booking | | yes | yes | yes |
| List a business, or claim a listing in the open index | | yes | yes | yes |
| Change their own business's details; take it out | | yes | yes | yes |
| Ask for Biznes Go or Biznes Grow, for a change of plan, or to stop at the end of the period | | yes | yes | yes |
| On a paid plan: a line, opening hours, a cover and up to eight photographs; a menu for a food outlet | | yes | yes | yes |
| On Grow: services and products, MCB Juice details, bookings, customers, a ledger of payments | | yes | yes | yes |
| Once live: draft an advertisement, give it a picture, send it in, take it back | | yes | yes | yes |
| Approve, reject, suspend a business; give or take the verified mark | | | yes | yes |
| Switch a plan on, with its last day; answer a request for one, or to stop one | | | yes | yes |
| Approve or decline an advertisement; mark it paid | | | yes | yes |
| Move an order on: awaiting payment, paid, fulfilled, cancelled | | | yes | yes |
| Take a picture off an advertisement or a business's page, and remove any picture from the bucket | | | yes | yes |
| Read the list of subscribers, take it as a file, take an address off | | | yes | yes |
| Write a message to the list, look at it, send it or mark it as sent by hand, and read who it went to | | | yes | yes |
| Ask the addresses that joined before to confirm, once; write down an address that asked not to be written to, or lift one | | | yes | yes |
| See everyone's businesses and bookings, the record of admin actions, the list of listings with no website | | | yes | yes |
| Change roles | | | | yes |
| Choose the picture behind the page (the calendar's, one kept, or a round), upload pictures, set the greeting | | | | yes |
| Bring the catalogue of prices level with the site | | | | yes |
| Set who the site's email comes from, where replies go, the sender's postal address, and who is written to | | | | yes |

A user's own role, plan, plan end, verified mark and status are never theirs to write. An owner's
customers, notes and ledger are theirs alone: an admin cannot read them.

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
  `admin_set_verified`, `admin_handle_plan_request`, `admin_review_ad`, `admin_set_ad_paid`,
  `admin_remove_ad_picture`, `admin_remove_business_picture`, `admin_set_order`, `set_role`,
  `set_catalogue`) that check who is asking. What they change is
  written to `audit_log` by triggers: who, what, when.
- **Plans are switched on by hand.** How a plan is paid for is not built: an owner asks, an admin
  arranges payment and switches the plan on with the last day it is paid for. After that day the
  business counts as free again, by itself, and what the plan gave goes with it: the public is
  given no showcase, no menu and no services of a business whose plan has run out. Switching a
  paid plan on marks the business verified. An owner on a paid plan may ask for the other plan or
  to stop at the end of the period; a stop, once an admin confirms it, leaves the plan its last
  day and changes nothing else. The interface says payment is arranged directly and that paying
  online is on its way. There is no payment code.
- **Marks.** The vivid mark (`src/components/Verified.tsx`) is only for a business on Go or Grow
  that an admin has verified. A claimed listing on the free plan says "Claimed by its owner", in
  the quiet `tag`. A paid place is never shown without its mark.
- **The order of results** changes in one way, and `/data` says so: a verified business on a paid
  plan is shown first among the listings that answer. A search for a business by its own name
  still shows that business first.
- **Bookings are requests.** Anyone may ask a live business on Grow, with a name and a telephone
  number. The database refuses a time that has passed, a fourth request in an hour from one number,
  and a flood to one business. The form has a honeypot. The business confirms, declines or marks it
  done, keeps a note of its own on it, and may mark it paid. Payment is between the customer and
  the business.
- **MCB Juice is details only**: a mobile number and the name the account is under, written by the
  owner, shown beside the services and after a booking request while the business is on Grow. No
  integration; the site takes no part in a payment and says so.
- **The owner's records are a notebook, not a till.** Customers are the telephone numbers that
  have booked, counted by the database, and anyone the owner adds by hand. The ledger is a list of
  payments the owner writes down (the day, who, what for, how much, and how: MCB Juice, cash, card
  or bank transfer), added up by the month. The site takes no payment and checks none, and the
  pages say so.
- **A paid plan's page** (`showcases`, `menu_sections`, `menu_items`): the owner writes them, and
  the public reads them only while the business is live and its plan is good today. A menu is for
  a business in a food category (the index's "eat" group, held in the database as
  `food_categories`). Twenty sections and three hundred items at most.
- **Pictures** are kept in one public bucket of Supabase Storage, `media`: JPEG, PNG or WebP, three
  megabytes at most, enforced by the bucket and again by the form. Who may put what where is the
  bucket's own rule: `business/<business id>/` for the owner of a live or pending business on a
  paid plan (twelve files); `ads/<advertisement id>/` for its owner while it is a draft or was not
  accepted; `site/` for the superadmin alone. An upload is a plain form posted to a route of this
  site (`.../upload/route.ts`), which checks where the form came from and the picture's own first
  bytes, then hands it to Storage as the person signed in. A server action is not used because it
  takes one megabyte at most. A record names only a picture in its own folder. The kind Storage
  records for a picture is the one read from its bytes, not the one its sender gave. SVG must
  never be added to the bucket's list: it can carry script. A form that does not say how large it
  is is not read, and one connection may send thirty uploads in ten minutes. One person keeps 150
  pictures in the bucket at most, wherever they are. A picture goes when what it belonged to goes:
  taking out an advertisement or a business removes its files first. What is left behind anyway
  is its uploader's to remove once its advertisement or business is gone, and an admin may remove
  any picture: from `/admin/ads` ("Its picture"), or from a business under "Every business" on
  `/admin`.
- **Advertisements.** An owner of a live business drafts one: a headline of sixty characters, a
  line of 120, where it leads (their page here, or their own website), a picture, a place, and the
  months it should run, which are months to come and never the one that has begun. The places are
  six on the site (the Home page, which the list of places still names "The first screen", search
  results, a listing's page, food and drink, the guides, the directory), three on the pocket
  guide's sponsors' pages, and the magazine. The guide's three
  are priced from `content/pdf/sponsorship.json`; the rest say "Price on request", because the
  owner has set no price for them. An admin approves or declines with a reason, and marks an
  approved one paid. Only an approved, paid advertisement of a live business is given to the
  public, and only in a month it names. A place on the site holds one at a time (`AdSlot`): when
  several run in a month they take turns by the day. An edition of the guide carries four
  sponsored pages at most, and the database refuses a fifth. "Running" and "ended" are read off
  the calendar, not stored. A business keeps twenty advertisements at most.
- **An admin approves what they saw.** Every write to an advertisement gives its row a new stamp
  (`updated_at`), and so does a change to its business's name or website while it waits. The
  admin's page sends the stamp it was drawn with; `admin_review_ad` refuses to approve if the row
  has been written since, and the admin is asked to look again. A picture on the admin's page
  carries the stamp in its address, so a new file under an old name is never shown from a cache.
- **Where an approved advertisement leads is fixed at approval.** For one that leads to the
  business's own website, the address is copied onto the advertisement (`link_url`) as it is
  approved, and that copy is what the site and the guide's sponsors show. The owner changing the
  business afterwards does not move it. The copy is emptied when the advertisement is declined.
- **The record keeps what admins did with an advertisement**: approved, declined, marked paid or
  not, its picture removed. An owner sending one in and taking it back leaves no line.
- **The guide's sponsors** are read from the view `guide_sponsors` (month, option, name, line,
  town, phone, website, artwork), as a visitor: `guideSponsors(month)` in
  `src/lib/accounts/ads.ts`, or over the API for a script. `website` is the address the
  advertisement was approved with, and empty for one that leads to the business's page here.
- **Subscribers.** An address joins through a function (`subscribe`), with what it wants: the
  pocket guide, the magazine, or both. Joining twice keeps one row. The site reads the list only
  as an admin, so the form never says whether an address was already on it; nor does the
  function, which counts every call the same (two hundred an hour, two thousand a day, for
  everyone together) and refuses before it looks at the list. An address is letters, digits and
  `. _ % + -` and nothing else, and every cell of the file an admin takes is in quotation marks,
  so a spreadsheet reads an address as an address whatever it splits a line on. Each row has a token;
  `/unsubscribe?token=...` shows one button, and pressing it deletes the row. What the site does
  with the list beyond keeping it (confirming an address, writing to it, the addresses not
  written to) is under "Email" below.
- **Orders are requests too.** The cart sends only what is wanted and how many. The server prices
  each line from the site's own data (`src/lib/accounts/catalogue.ts`: the guides, the sponsor
  options, the plans, and advertisement places with no price), then the database prices it again
  from its `catalogue` table and writes the order with that price (`place_order`). The two must
  agree, or nothing is placed. A thing the site does not sell is refused. Five orders an hour from
  one telephone number or address. The answer is "We have your order. A person will contact you
  with how to pay", and nothing is said about how. An admin moves it on by hand; `/admin/orders`
  shows the oldest three hundred that are open and says how many more wait behind them.
- **The site's word.** `subscribe`, `unsubscribe`, `confirm_subscription` and `place_order` ask
  for a word in the header `x-biznes-proof` once its hash is in `private.site_proof`. Three
  functions of the email (part 14) ask for it always, and are refused while no hash is kept:
  the one that hands the website a link to confirm, and the ones that believe the website about
  what a mail service said. The site sends it from
  `BIZNES_SITE_PROOF`, read in `src/lib/accounts/server.ts`, which only the server loads: the
  word is in no file a browser is sent. A request for a booking sent through the API asks for
  the same word (part 12: the check is in the trigger that counts a business's bookings, and
  reads who is asking from the role the API set). So the hourly limits on all four can be
  reached only through the site, where each connection is also limited, and not by someone
  calling the API with the public key.
- **The look.** The picture behind the page is the calendar's, or one picture kept, or a round of
  pictures with a new one each day (`themeNow()` in `src/lib/theme.ts`). A picture is one the site
  is built with or one the superadmin uploaded; an uploaded one has a single size.
- **The session** is kept in cookies no script can read. `src/proxy.ts` renews it, for the account
  pages only (`/account`, `/dashboard`, `/admin`, `/auth`): every other page is untouched, so the
  public pages stay cacheable. The header learns who is signed in from the browser, and asks the
  server only when a marker cookie says someone is.
- **Public reads are kept for five minutes** and tagged, so an admin's or an owner's change shows
  at once. With accounts on, the fixed pages are made again at most every five minutes, not every
  hour, because the picture behind the page may have been chosen by hand.
- **`/privacy` changes with accounts on**: it says what an account keeps, that signing in sets
  cookies, what an order keeps, and what the list keeps: the address, whether it was confirmed,
  which messages went to it and how each went, and the addresses not written to.

### Email

The base of the site's own email, built on 23 November 2026 to the owner's note: "to manage our
subscription to pocket guide, build the internal email marketing system, we will set up our own
smtp via maybe a free mailgun or resend server. (Will set up later, build the base first)". It is
everything but the last mile. With two or three variables set for Resend or for Mailgun it sends;
until then nothing leaves the site, the pages say so, and a message goes out by hand with the
record still kept.

**Today, with no sender connected:**

- **Someone joins.** As before: the form answers "You are on the list", and the address is kept.
  It is kept as *not confirmed*, because no message can ask it to confirm. `/admin/subscribers`
  counts the list, the confirmed, each wish and the addresses not written to.
- **The owner wants to send an edition.** On `/admin/email`, "Start the Pocket Guide's message"
  begins a draft for the coming edition with the month, the guide's name, its address on the site
  and whether the edition is free or sold already filled in (from `content/pdf` and the sponsors
  booked, through `src/lib/shop.ts`: no price and no date the data does not hold). The draft is
  changed part by part, looked at as it will be drawn, and called ready. Its page then gives the
  addresses for it as a file, the message as HTML and as text to copy or to take as files, and
  "Mark as sent by hand". The owner sends it from their own mail program, with the addresses in
  the hidden-copy line, and marks it: who it went to is written into the record. A message sent
  that way tells its readers to reply to leave the list, since one message to many cannot carry
  each reader's own link; an address that asks is taken off on `/admin/subscribers`.
- **Nothing is sent before the superadmin has set the sender's postal address** (`/admin/email`,
  "Who a message is from"). Every message ends with who sent it, why its reader has it, the way to
  leave, and that address.

**What it is made of:**

- **The list is confirmed by a link** (double opt-in). A message that asks to confirm carries a
  link with a token of its own, which is not the token that leaves the list. The link opens
  `/subscribe/confirm`, a page with one button: opening it confirms nothing, because mail programs
  open links to look at them; pressing the button does. With a sender connected a message asking
  to confirm goes out when an address joins, once a day at most for any one address, and the
  form's answer is the same whether the address was new, confirmed or asked already. An admin can
  ask the addresses that joined before to confirm, once: the database marks each as asked, so
  pressing again asks nobody twice.
- **Who a message goes to is a setting** (`write_to`, the superadmin's). As it begins: only
  confirmed addresses once the site sends for itself, and every address that is not kept from
  being written to while a message is sent by hand, because until a sender is connected nobody
  can confirm. The other two choices are confirmed addresses only, by either road, and every
  address.
- **Addresses that must not be written to** are a table of their own (`email_suppressions`): a
  hard bounce, a complaint, or a person who asked, each with the reason, what was said and the
  day. It is looked at when a message is queued and again as each batch is taken. Joining again
  does not take an address out of it. For one that bounced, a fresh confirmation does: when it
  is put in, the address's old confirmation is taken back and its old link is made useless, so
  only a link from a message sent since can confirm it. One whose reader complained, or who asked
  by hand, is not written to even to confirm: only an admin lifts it, on the record.
- **Leaving in one press.** Every message the site sends carries `List-Unsubscribe:
  <https://the-site/api/email/leave?token=...>` and `List-Unsubscribe-Post:
  List-Unsubscribe=One-Click` (RFC 8058), which is what Gmail and Yahoo ask of anyone who sends
  to many. A mail program posts to that address with no cookie; the token is the only key, and
  the answer is the same whether the token was anyone's. A plain visit to it leads to
  `/unsubscribe`, where a person presses the button.
- **A message is blocks, not HTML.** A heading, a paragraph, a button (to a page of this site,
  written as a path, or to a full `https` address) and a line. The database checks the shape of
  each; the site draws them (`src/lib/accounts/email/render.ts`): tables, every style on its own
  element, 600 pixels wide, no picture and nothing fetched, in the site's own colours (the cream
  sheet, the white card, ink words, the saffron button with ink words), with the site's dark
  pairs for a mail program that honours a dark setting. A plain-text twin is made from the same
  blocks. The admin's page draws the message from the same tree of marks the HTML is made from,
  on the page itself and not in a frame, because the site's security policy refuses frames.
- **The message that asks to confirm is the site's own words**
  (`src/lib/accounts/email/message.ts`). Nobody writes it, so a message that goes to addresses
  nobody has confirmed can say nothing else.
- **Sending is a queue in the database** (`email_recipients`). "Send" writes one row for each
  address, with the address as it was that day, and with the reason for each one left out. The
  page then sends a batch at a time (`EMAIL_BATCH`, twenty-five unless set), each batch one
  request to the server: the database hands out the next rows and marks them taken, the sender
  hands each its own copy, and the database is told how each went. It shows how far it has got,
  can be stopped and carried on, and works with script off, a batch a press. One address is in a
  campaign once, by a unique rule, and a row is handed out once. A batch the mail service refuses
  is marked failed with what the service said, and the run stops; an admin may queue those again.
  A batch that got no plain answer (a dropped line, an error of the service's own) is marked as
  unsure and is never tried again by itself, because it may have gone.
- **The record.** Starting a message, calling it ready, sending it, marking it as sent by hand,
  cancelling it, queueing the refused again, asking the list to confirm, a change to the
  settings, and an address put among or lifted from the ones not written to are each written to
  `audit_log`, with who and when. A campaign's page lists who it went to, and gives that as a file.

**The senders** (`src/lib/accounts/email/`): one interface, `Sender`, and four of them.

| `EMAIL_PROVIDER` | What it does |
|---|---|
| unset | None. Nothing leaves; every try is refused with the reason |
| `resend` | Resend's HTTP API: one request for a batch of up to a hundred emails, each whole and with its own headers |
| `mailgun` | Mailgun's HTTP API: one request for each address, five at a time (the file says why it is not Mailgun's own batch) |
| `local` | For the checks only: each batch is posted as JSON to `EMAIL_TEST_URL`, which must be an address on the same machine |

The owner said "smtp". Both services offer SMTP as well, and the site does not use it: their HTTP
APIs need no library (the site adds no dependency for email) and answer with a name for each
message and a reason for each refusal, which is what the queue records. An SMTP sender would
need a library that speaks SMTP over TLS (nodemailer is the usual one), four variables
(`EMAIL_SMTP_HOST`, `EMAIL_SMTP_PORT`, `EMAIL_SMTP_USER`, `EMAIL_SMTP_PASS`) and a host that
lets a server open port 587. It would implement `Sender` in a file of its own and nothing else
would change.

| Variable | For |
|---|---|
| `EMAIL_PROVIDER` | `resend` or `mailgun`. Unset: no sender |
| `RESEND_API_KEY` | Resend's API key. Sending access is enough |
| `RESEND_WEBHOOK_SECRET` | The signing secret of the webhook made in Resend (`whsec_...`) |
| `MAILGUN_API_KEY` | Mailgun's API key, or the domain's own sending key |
| `MAILGUN_DOMAIN` | The sending domain as Mailgun names it (`mg.example.mu`) |
| `MAILGUN_REGION` | `eu` for a domain made in Mailgun's EU region. Unset, or `us`, otherwise |
| `MAILGUN_WEBHOOK_SIGNING_KEY` | The account's HTTP webhook signing key (Mailgun: Settings, API Security). Not the API key |
| `EMAIL_BATCH` | How many addresses a batch holds, 1 to 100. Unset: 25 |
| `EMAIL_TEST_URL` | For the checks, with `EMAIL_PROVIDER=local`: an address that begins `http://127.0.0.1` or `http://localhost` |

All are the server's alone: none begins `NEXT_PUBLIC_`, and none belongs in the repository. Who a
message comes from is not a variable: it is a setting in the database, the superadmin's.

**To connect Resend:**

1. Make an account at resend.com and add a domain you own. Resend advises a subdomain kept for
   this (for example `news.biznes.mu`), so that its reputation is its own.
2. In your DNS, add the records Resend's "Records" tab shows for the domain, copied exactly: a
   TXT record for DKIM, and for SPF an MX record and a TXT record at the return-path name (`send`
   under the domain, unless you chose another). Wait until Resend shows the domain as verified.
3. Add a DMARC record: a TXT record at `_dmarc` under the domain. Resend's own page suggests
   starting with `v=DMARC1; p=none; rua=mailto:` followed by an address you read.
4. Make an API key in Resend. One with sending access only is enough.
5. In Resend, under Webhooks, add an endpoint: `https://<the site>/api/email/hook/resend`, for
   the events `email.bounced`, `email.complained` and `email.suppressed`. Copy its signing secret.
6. On the host, set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY` and `RESEND_WEBHOOK_SECRET`, and
   deploy. `NEXT_PUBLIC_SITE_URL` must be the site's real address: it is in every link.
7. Make sure the database holds the hash of the site's word (step 8 under "Setting up the
   project"). Without it no link to confirm is handed out and no webhook is believed;
   `/admin/email` says so when it is missing.
8. As the superadmin, on `/admin/email`, set the name and the address messages come from (an
   address at the verified domain), the address replies go to, and the postal address.
9. Begin a message, call it ready, and press "Send me a test message". When it arrives and reads
   well, press "Ask them to confirm" on `/admin/email` for the addresses that joined before.

**To connect Mailgun:**

1. Make an account at mailgun.com and add a domain, in the US or the EU region. Use a subdomain
   kept for this (for example `mg.biznes.mu`): Mailgun asks for MX records, and on the main
   domain those would take its ordinary mail.
2. In your DNS, add the records Mailgun's control panel shows for the domain: a TXT record for
   SPF (`v=spf1 include:mailgun.org ~all`), a TXT record for DKIM, two MX records (`mxa.mailgun.org`
   and `mxb.mailgun.org`, or the EU ones for a domain in the EU region), which is how Mailgun
   learns of a bounce that comes back later, and a CNAME record for its tracking. Wait until
   Mailgun shows the domain as verified. Add a DMARC record as in step 3 above.
3. Copy an API key (or make a sending key for the domain), and the HTTP webhook signing key
   from Settings, API Security.
4. In Mailgun, under the domain's Webhooks, add `https://<the site>/api/email/hook/mailgun` for
   "Permanent Failure" and "Spam Complaints". A domain in the EU region has its own webhooks.
5. On the host, set `EMAIL_PROVIDER=mailgun`, `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`,
   `MAILGUN_REGION=eu` if the domain is in the EU region, and `MAILGUN_WEBHOOK_SIGNING_KEY`, and
   deploy.
6. Then steps 7 to 9 above. In Mailgun, leave its own unsubscribe footer off for the domain: the
   site adds its own link and its own headers, and keeps its own list.

**Checking it** needs no mail service. `node scripts/email-unit.mjs` runs the site's own files:
a message's HTML and text, the colours against the site's tokens and its measured contrast pairs,
the two real senders against the shapes of answer their documentation records, and the two webhook
signatures (Svix's own published example among them). The browser check
(`scripts/accounts-e2e.mjs`, section 6j) listens on this machine as the local sender, and
`accounts-stack.sh env` prints the variables for it.

**Not run, and why:**

- **Resend and Mailgun themselves.** No account and no key were available, so neither was called.
  The senders are held to the requests and answers their documentation shows (read on 23
  November 2026; each file names its pages), not to a live answer. The first real send should be
  the test message.
- **Mailgun's batch.** Its documentation shows a recipient's own values filled into the subject
  and the body of one request for many addresses. It does not say they are filled into a custom
  header, which is where each reader's link to leave goes, so the site sends Mailgun one request
  for each address. If a test on a real account shows the header is filled too, one request for
  a batch would do.
- **Real mail programs.** The message was looked at as the browser draws it, on the admin's page,
  light and dark. How Gmail, Outlook and Apple Mail draw it, what each does with a dark setting,
  and whether their own "Unsubscribe" button appears were not seen. That button also depends on
  the sending domain's reputation, which a new domain does not have.
- **A webhook from a real service.** The signatures are checked against Svix's published example
  and Mailgun's published rule, and the bodies against the examples on their pages. No real
  delivery was received.
- **Delivery.** SPF, DKIM and DMARC, spam folders, a service's own limits and quotas.
- **A long list.** The checks send to a handful of addresses. A list of thousands, and a host's
  limit on how long one request may run (a batch must finish inside it), were not tried.
- **The hosted project.** Part 14 has been applied to the local stack and to a scratch database
  with a list in it, not to the hosted project.

**Not built:** a sender over SMTP (above); opens and clicks, which the site does not track;
pictures in a message; a time to send at; sending without a browser open (the page asks for
each batch, so closing it stops the run until someone carries on); a message to an owner or to
a person who placed an order.

### Its pages

| Address | What it is |
|---|---|
| `/account/sign-in`, `/account/sign-up`, `/account/reset`, `/account/update-password` | Signing in, a new account, a forgotten password: one card each, in the middle of the sheet |
| `/auth/confirm` | Where the link in an email lands. A link with a token is handed on to the next page, unused |
| `/auth/continue` | One button: pressing it spends the link's token and signs the person in, or goes on to choose a new password |
| `/account` | A welcome by name with the role as a tag; where everything is, by role; "Your plans", "Your orders", "Your bookings"; their details; the form to join the list |
| `/account/order` | What the site sells, and the checkout for what the address names (`?item=plan:go&item=sponsor:listing*2`). For anyone, signed in or not |
| `/dashboard`, `/dashboard/new` | An owner's businesses as cards; list one or claim one (`?listing=<id>`, `?plan=go`) |
| `/dashboard/[id]` | One business: where it stands, its details, its plan and how to change or stop it |
| `/dashboard/[id]/bookings`, `/customers`, `/services`, `/payments` | Biznes Grow's own: bookings by day, customers, services and products with MCB Juice details, the ledger |
| `/dashboard/[id]/showcase`, `/menu` | A paid plan's page: its line, hours and pictures; a food outlet's menu |
| `/dashboard/[id]/ads` | The owner's advertisements |
| `/admin`, `/admin/ads`, `/admin/orders`, `/admin/subscribers`, `/admin/leads` | Businesses to check, plan requests, every business, the record; advertisements to check and what each place shows today; orders; subscribers, with their counts, a search, two filters, the addresses not written to and a CSV file; listings with no website, with a CSV file. Anyone who is not an admin is told the page is not there |
| `/admin/email`, `/admin/email/[id]` | Where the site's email stands (which sender, or none and what to set), a message begun, every message; one message: written, looked at, sent or sent by hand, how far it has got, and who it went to. `/admin/email/[id]/export` is its addresses, its HTML, its text and its record as files |
| `/admin/people`, `/admin/settings` | The superadmin's: roles; the picture behind the page |
| `/unsubscribe` | Where a subscriber's link to leave lands: one button |
| `/subscribe/confirm` | Where a link to confirm an address lands: one button |
| `/api/email/leave` | Where a mail program posts to take its reader off the list in one press. A plain visit leads to `/unsubscribe` |
| `/api/email/hook/resend`, `/api/email/hook/mailgun` | Where a mail service says, signed, that an address bounced or its reader complained |
| `/biz/[slug]` | The page of a business its owner listed that is not in the open index |
| `/b/[slug]`, `/biz/[slug]` | One business: a listing from the index, or one its owner listed. The same component draws both: its head with the ways to reach it, what is known in blocks, its hours day by day, the island and the street map, where each part came from, the same kind nearby. A paying owner's page adds a cover, pictures, a menu, services and a way to book. A listing's id alone leads to its full address | The first time it is asked for, then kept |

The pieces the public pages use, each with its own notes in the file: `showcaseOf(businessId)`
(`src/lib/accounts/showcase.ts`), `<AdSlot place>` and `AdCard`
(`src/components/account/AdSlot.tsx`), `<SubscribeForm>` (`src/components/account/SubscribeForm.tsx`),
`<Checkout items>` (`src/components/account/Checkout.tsx`) and `guideSponsors(month)`.

### Checking it

| Check | Command | Result on 23 November 2026 |
|---|---|---|
| Row level security | `npm run test:rls` | 674 claims, all pass, on Postgres 16 behind a stub of Supabase, and again on Supabase's own Postgres image. 202 of them are the email's (part 14) |
| The later migrations, on a database in use | The same command: its second pass applies parts 1 to 10, writes rows as a project might hold them (a list of subscribers among them), applies part 11 and what follows, and says what became of the rows | 22 claims, all pass |
| The site's own email, with no database and no mail service | `node scripts/email-unit.mjs` | 68 of 68 |
| The whole of it, in a browser | `bash scripts/accounts-stack.sh up`, build and serve with the variables it prints and with `NEXT_PUBLIC_SITE_URL` set to the address it is served at, `node scripts/accounts-e2e.mjs` with the same variables set | 344 of 344, with axe-core (WCAG 2.2 AA) clean on 70 kinds of account page at 1440 by 900 and 390 by 844, and none wider than its screen |
| A session that runs out | `ACCOUNTS_JWT_EXP=100 bash scripts/accounts-stack.sh reset`, serve, `ACCOUNTS_JWT_EXP=100 node scripts/accounts-sessions.mjs` | 8 of 8 on 20 November 2026. Not run again on the 23rd: nothing it checks was changed |
| Accounts off | Build with neither variable set | Builds; the header has no account button, the account pages say "Accounts open soon" (the email's among them), `/subscribe/confirm` says the list has not opened, the email's endpoints refuse, and `/account/order` hands the order to the form at `/add` |
| No database at build | Build with `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:59999 NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy`, an address where nothing answers | Builds; the reads that fail fall back to the calendar's look and to no businesses, and leaving in one press answers 503, so a mail program tries again |

`scripts/accounts-stack.sh` runs a Supabase project in miniature in Docker: Supabase's own Postgres
image (15.8.1.085), Supabase Auth (v2.176.1), PostgREST (v12.2.8) and Supabase Storage (v1.25.7),
with a small gateway and a mail sink beside them (`supabase/local`). The browser check signs up,
opens the link in the email, signs in and out, claims a listing, lists a business, approves it as
an admin, switches a plan on, adds a service and a product, asks for a booking as a visitor and as
a customer, answers it as the owner with a note and a payment, keeps customers and a ledger,
writes a line and opening hours, uploads a cover and photographs (and is refused a file that is
not a picture, another person's upload, and a form from another site), asks to stop a plan, keeps
a menu for a food outlet and loses it when the plan runs out, drafts an advertisement, has it
declined, approved and marked paid and sees it in its place through `AdSlot`, joins and leaves the
list of subscribers and takes it as a file, places an order as a guest and signed in with the
browser's own prices ignored, moves the orders on as an admin, brings the catalogue level, changes
roles, sets the look three ways with a picture of the superadmin's own, and resets a password. Along
the way it asks the database, as a visitor and as each person, what it will hand over.

For the review it also: has an owner change an advertisement behind an admin's open page, and
sees the approval refused until the admin has looked again; changes a business's website after
its advertisement was approved, and sees the advertisement lead where it did; calls the three
visitors' functions over the API with the public key and no word, and with the wrong one, and is
refused; looks through the build for the word and finds it in no file a browser is sent; joins
the list with a new address and an old one and is answered alike; forces a null into an
advertisement's months and opens the admin's page on it; takes out a business that has a cover, an
advertisement waiting and one approved, and finds none of their files left; uploads a PNG that
calls itself a JPEG and finds it kept as a PNG; has an admin remove a picture from a business's
page and from an advertisement; reads the subscribers' file cell by cell; sends an upload that
does not say how large it is; and sends thirty-one in a row.

For the email (section 6j) it listens on this machine as the local sender, but not from the
start, so the site is seen with no sender first. With none: it joins the list and finds each
address kept as not confirmed, starts the Pocket Guide's message and finds the month, the name
and the guide's address filled in, changes it part by part (and is refused a button that leads to
script), looks at it drawn on the page with its plain-text twin, is refused every way of sending
while the postal address is empty, sets the settings as the superadmin, takes the addresses and
the message as files, and marks it as sent by hand. With the sender answering: it joins and is
sent one link to confirm, opens the link without pressing and finds nothing confirmed, presses
and finds one address confirmed, asks the earlier addresses to confirm once, reports a bounce
and a complaint by signed webhooks (and is refused unsigned, wrongly signed, stale and altered
ones), writes a note, sends itself a test, presses Send and then Stop, has a batch refused by
the sender, carries on, queues the refused again, and reads every message the sender was handed:
each address once, each with its own link to leave, none to an address that was unconfirmed,
bounced or complained. It leaves in one press as a mail program does, finds that address not
written to by the next message, sends that message with script off, a batch a press, and reads
the list's own page and its file.

**Not run, and why:**

- **The hosted project, for part 11.** It has been applied to the local stack (Supabase's own
  Postgres image and its own Storage program) and to a scratch database with rows in it, not to
  the hosted project. Three things are true of the image and assumed of the hosted project: that
  the role the SQL editor uses may drop and make policies on `storage.objects` (it made the ones
  in part 9 there); that the same role passes row level security on that table, so the limits on
  a folder and on a person are counted (step 9 under "Setting up the project" confirms it); and that the hosted gateway hands the header `x-biznes-proof` on to the database.
- **The second round's own pages on the hosted project.** Parts 5 to 10 are on it, but nothing
  here has uploaded a picture to its Storage or placed an order against it.
- **Supabase's hosted services, for the first round.** As before: its key checks, its email
  sender and its limits on sign-ups and emails were not exercised. The email templates in step 3
  were tried as links of that shape, not by editing a template in a dashboard.
- **Tokens signed the newer way.** The local stack signs tokens with a shared secret. A new project
  signs them with a key pair, which `getClaims()` in the proxy then checks without a round trip.
  That path is the library's own and was not run here.
- **A deployment.** Not run on Vercel or any host: the proxy, the cookies over HTTPS, uploads
  through a host's own limit on the size of a request, and the cache shared between several
  servers were tried on one local server only.
- **Large and odd pictures.** Uploads were tried with small PNG files made by the check, and by
  hand with a JPEG, a WebP, one over three megabytes and one that was not a picture. Nothing
  resizes a picture: it is shown as it was uploaded.
- **The public pages' use of the new pieces.** `showcaseOf`, `AdSlot`, `SubscribeForm` and
  `Checkout` are checked on the account pages (the owner's pages say what a visitor is given,
  `/admin/ads` shows each place through `AdSlot`, `/account` carries the form, `/account/order`
  the checkout). Where the public pages place them is the public side's work.
- **Real email.** Delivery, spam folders and the wording of the messages are the project's.
- **Many people at once.** Nothing was measured under load. The limits on bookings, subscribers
  and orders are counted in the database; the limit by connection, uploads included, is kept in
  one server's memory, so on a host that runs several servers each counts for itself.
- **A request body larger than a picture.** The upload routes refuse by the size a request says
  it is. The server still buffers what it is sent before a route sees it, up to the limit set
  for a site with a proxy: `experimental.proxyClientMaxBodySize` in `next.config.ts`, four
  megabytes here in place of Next's ten. A body that says it is small and is not was not sent.
- **A screen reader, by ear.** As for the rest of the site.

**Not built:**

- **Payment.** Plans, advertisements and orders are arranged and marked paid by hand. Paying
  online is planned, through Stripe, and is not connected.
- **Email to an owner or a customer.** The site's own email is for the list (see "Email"). It
  sends nothing to an owner whose advertisement was declined or to a person whose order moved.
  Auth's two messages are the project's own.
- **Resizing pictures**, and a second size for an uploaded backdrop.
- **Owners' own businesses in the browsing lists.** A business listed from scratch is found by the
  search and has its own page, but is not yet in the lists under `/directory` and `/places`, in the
  suggestions under the search box, or in the sitemap. A claimed listing is, being a listing.
- **Changing an email address, deleting an account, signing in with Google or a phone.** Ask us,
  for now.
- **A price for an advertisement on the site or in the magazine.** The owner has set none, so each
  says "Price on request".

## Security

Reviewed on 20 November 2026, as an attacker would go at it. What was found and fixed is in the
commits of that day; this is what holds now, and what does not.

- **The framework.** Next.js 16.4.6, which clears the advisories open against 16.3.5 (one of them
  critical). `npm audit` reports nothing. Keep to the newest 16.x: run `npm audit` before a deploy.
- **The headers** are set for every address in `next.config.ts`: a Content-Security-Policy, no
  framing at all, no sniffing of content types, HTTPS only for two years, a referrer that names
  the site and nothing more, and no camera, microphone, location, payment or USB. Private pages
  and the endpoints also carry `X-Robots-Tag: noindex`.
- **The policy** lets a page load from the site itself, from the accounts' Supabase project (its
  address is read from `NEXT_PUBLIC_SUPABASE_URL` when the site is built), and from the street
  map's two hosts, `tiles.openfreemap.org` and `*.tile.openstreetmap.org`. Nothing else. To let a
  page load something new, add its host to the one directive that needs it, in `next.config.ts`.
- **What the policy does not do.** Next writes each page's data into the page as inline script,
  and a page made ahead of time cannot carry a nonce, so the policy allows inline script: a
  `<script>` injected into a page would still run. Script from another site, script in an
  attribute, plugins, frames, and a base or a form that points away are all refused. Closing the
  last gap means a nonce on every page, which means making every page on each request; or moving
  the signed-in pages to an address of their own, where that price is paid only by them.
- **Nothing is rendered as HTML but the structured data**, which is escaped
  (`src/components/JsonLd.tsx`). React refuses a `javascript:` address in a link; the crawler
  and the database each refuse a web address that does not begin `http` or `https`.
- **The form's endpoint** takes JSON only, from this site's own pages only, of 32 KB at most, and
  line breaks typed into a one-line field are taken out before anything is sent on. Its rate
  limit, and the booking form's, are kept in the server's memory: on a host that runs many
  instances each keeps its own count, and both count by the address the host's proxy reports. A
  limit that holds needs the host's own rate limiting, or a store every instance shares.
- **Accounts.** The publishable key opens nothing that is not meant to be open: `npm run
  test:rls` proves it, and proves that every table has row level security and every function
  that runs as its owner fixes its search path. `public.rls_auto_enable()`, which the project
  ships with, is closed to the API by the last migration; apply it to the hosted project.
- **A link in an email is not spent by being opened.** Some mail programs open every link in a
  message to look for harm. A link that carries a token waits at `/auth/continue` until its
  reader presses the button there (step 3 of "Setting up the project" gives the two templates).
- **The checks' own database** (`scripts/accounts-stack.sh`) answers only to the machine it runs
  on: its ports are published on 127.0.0.1.
- **The service worker** never keeps or answers anything under `/api`, `/account`, `/admin`,
  `/dashboard` or `/auth`, nor an answer that was led on to one of them. A new private address
  must be added to `PRIVATE` in `public/sw.js` and in `next.config.ts`.

Still open, and for the owner or the host to close:

- **A page is kept for every address asked for under `/b/` and `/biz/`,** found or not, about
  60 KB each. On a server of our own a stranger could fill the disk by asking for addresses that
  do not exist. Limit requests at the host, or check the address in `src/proxy.ts` before a page
  is made, or keep the pages made on demand in memory only.
- **In the Supabase dashboard:** a CAPTCHA on sign-up, sign-in and password reset; the check
  against leaked passwords; only the site's own address among the redirect addresses once it is
  live.

## The street map

The island beside a list is a drawing of what is listed. A visitor who needs streets presses
"Open the street map", and a real map takes the island's place, with the same listings on it.

- **What draws it.** MapLibre GL JS 6.19.0 (`maplibre-gl`, BSD 3-Clause), the one dependency this
  adds. It is fetched only when the button is pressed: the code, its style sheet and its worker
  are not in any page until then (the behaviour check holds this).
- **Whose map it is.** OpenFreeMap's "liberty" style, from `https://tiles.openfreemap.org`. Its
  own site says, as read on 20 November 2026: no key, no registration, no limit on views,
  commercial use allowed, and the credit must be shown. The credit is on the map at all times:
  "OpenFreeMap © OpenMapTiles Data from OpenStreetMap" (`STREET_MAP.credit` in `src/data/site.ts`).
  The map data is OpenStreetMap's, under the ODbL.
- **Its limits.** OpenFreeMap is run on donations, with no promise of service: it is given as it
  is and may stop. If it does not answer, the island stays, and the visitor is offered the same
  place on openstreetmap.org. To move to another supplier, change `STREET_MAP.style` and
  `STREET_MAP.host`, and the map's host in `next.config.ts`.
- **What the browser is allowed to reach.** The security policy names one host for the map,
  `tiles.openfreemap.org`, for the style, the tiles, the lettering and the symbols. The map's
  worker is the site's own file.
- **What it shows.** Every placed listing, from `/markers.json`, as a point of ink; the ones that
  answer in saffron. A point opens the listing's name as a link to its page.
- **What it costs a build.** The library's files are copied into the build (about 5.5 MB on disk).
  None is sent to a visitor who does not open the map.

## Where the content lives

Everything the owner will change is data. No fact is written into a component.

| To change | Edit |
|---|---|
| The site's name, line, description and contact details | `site` in `src/data/site.ts` |
| The header's four links, what "More" opens, every page's name and the line under it | `NAV`, `MORE`, `MENU`, `YOURS` and `ABOUT` in `src/data/site.ts` |
| The footer's pages | `MENU`, `ABOUT` and `YOURS` in `src/data/site.ts` |
| The five tabs at the foot of a phone's screen | `ON_BAR` in `src/components/TabBar.tsx`, between the search and "More" |
| The Home page's name, its line, its five parts and the pages its last part leads to | `HOME` in `src/data/site.ts` |
| How many top businesses the Home page shows, and what makes a listing a full one | `TOP_SHOWN` and `isFull` in `src/lib/top.ts`; then `/data` says the same |
| The size of the icons on the Home page | `--home-icon` and `--home-icon-box` on `.home` in `src/app/globals.css` |
| The searches the search page offers before anything is asked | `EXAMPLES` in `src/data/site.ts` |
| A plan's name, price or lines | `PLANS` in `src/data/site.ts` (see "The plans") |
| The four promises on the page about the site | `PROMISES` in `src/data/site.ts` |
| The shelves of the guides page | `SHELVES` in `src/data/site.ts` |
| A picture, a season, a holiday's greeting, the everyday greeting | `src/data/themes.ts` and `public/themes` (see "The pictures") |
| The public holidays | `content/holidays.json` |
| An article or a guide | Its file in `content/guides`, and its `checked` date |
| The glossary | `content/glossary.json` |
| An emergency number | `content/emergency.json` |
| The pocket guide | `content/pdf`, then `npm run pdf` |
| The tools' names and descriptions | `src/lib/tools.ts` |
| A figure a tool uses | The guide it reads it from. A tool holds none |
| A listing | Its source (OpenStreetMap, Wikidata, the business's own site), then `npm run crawl` |
| The categories, and the words each answers to in English, French and Kreol | `crawler/taxonomy.mjs`, then `npm run crawl` |
| The crawler's rules | `crawler/config.mjs`, `crawler/seeds.mjs` |
| The name's drawing, the icon | `scripts/logo.mjs`, `src/components/Logo.tsx`, `src/app/icon.svg` (see "The mark") |
| The link preview picture | `npm run dev`, then `npm run og` |

### The plans

`PLANS` holds each plan's name, its price in rupees a month for each business, and the lines shown
on `/pricing`. They are the owner's, given on 20 November 2026. Never add a feature or a price the
owner has not given.

| Plan | Price | What it is |
|---|---|---|
| Biznes Free | Free | A basic listing. Every business the crawler found is on it already, and its owner can claim and verify it |
| Biznes Go | Rs 550 a month for each business | Verified, and listed with priority: first among listings that answer equally well, and always marked as a priority listing |
| Biznes Grow | Rs 1,250 a month for each business | Everything in Biznes Go, with bookings and the sale of services |

- **How a plan is paid for:** through Stripe, which is not connected yet. Until it is, a business
  asks for a plan through the form and a person answers.
- **How a customer pays a business on Biznes Grow:** directly, by MCB Juice, from the details the
  business shows. The site takes no part in that payment and there is nothing to connect.
- **What is drawn and what is not joined up:** the verified mark and the look of a paid listing are
  in the design (`DESIGN.md`). No listing wears them here yet, and results are ordered by answer
  and fullness alone until a business is on a paid plan. Claiming, verifying, bookings and sales
  belong to the accounts.
- **If the order of results ever changes**, the pages that explain it change first: "How results
  are ordered" on `/data`, and `/pricing`.

### The menu and the shelves

The site's name in the header leads to the landing page (`/`), where the search is. Beside it the
header has four plain links (`NAV`: Home, Directory, Baz Manzer, Articles) and one word that opens
a list, "More" (`MORE`: the tools, then the eight pages most wanted after those). On a phone and
a tablet a bar at the foot of the screen carries the search, Home, Baz Manzer, Articles, and
"More", which there is a page of every page (`/more`). On a phone the directory is reached through
Home, whose categories and regions are its two ways in, and through "More". Nothing else opens, at
any width.

The landing page is the one page with less: its header is only the name, the cart and the
account, it has no bar at its foot, and in the footer's place it has one quiet line. Its one
button, "Home", is the way on. It is done by the page's own class (`.landing`, under "Home and the
landing page" in `globals.css`) and by one line each in `HeaderBar.tsx` and `TabBar.tsx`.

Every page that has a name is in one of three lists, each entry a name and a line about it: `MENU`
(Find, Read, For business), `YOURS` (the shortlist, the cart, the account) and `ABOUT`. The page of
every page and the footer's columns are drawn from them, and the header's "More" takes its names
from them, so a page is called one thing wherever it is listed. To add a page, add an entry to its
group; add its address to `MORE` only if it earns a place there. An address in a link's `also`
belongs to the same way in: the towns light Directory.

The first step of every page's path ("Home / Directory / Pharmacies") is the Home page, by the
name `HOME` gives it. `trail` in `src/lib/nav.ts` sees to it for the path a reader sees (`Crumbs`)
and for the one written out for machines (`breadcrumbs`), so a page that still begins its own
path at `/` is led to Home without being changed.

### The top businesses

`topBusinesses` in `src/lib/top.ts` chooses the eight the Home page shows, and `/data` says how,
under "The top businesses on the Home page". Change that page first if the rule ever changes.

1. **A verified business on a paid plan** comes first and is marked, as in a search (`owned()`).
   With accounts off there are none. If more are live than fit, they take turns by the day.
2. **The fullest listings in the open index** fill the rest: those with a telephone number, a
   website, opening hours and an address on record (`isFull`), 56 when this was written.

The day's turn is `turnOf` in `src/lib/turn.ts`. The date in Mauritius is the seed: the count of
days since 1970 says which round it is and which day of the round, each round puts the whole list
in an order of its own, and each day shows the next eight. So every full listing has its turn once
in a round (seven days, for 56), and the page is the same for everyone on a given day. Nobody
chooses them, and the page never says that one business is better than another.

A shelf is a row of `SHELVES`: an id, a label and a line. An article joins a shelf by its `shelf`
field; one with none is on the business shelf. The order of articles on the site is `GUIDE_ORDER`
in `src/lib/index.ts`; one that is not named there comes last. A shelf with no article is not
shown.

### The order of results

`search()` in `src/lib/search.ts` returns the four parts of a page of results, and
`src/app/search/page.tsx` shows them in that order and no other. `/data` says the same to visitors:
change the page first if the order ever changes.

1. **Our own pages that answer**: an emergency number, a holiday's date, an article's own words,
   one of the site's pages (`PAGES` in `src/data/site.ts`). An answer must hold every word asked.
2. **Businesses**: by how well a listing answers and how full it is. A verified business on a paid
   plan comes first among equal answers and is marked. In the health categories a listing with a
   telephone number comes before one without.
3. **Parts of articles that only mention the words**, under "Also mentioned in our articles".
4. **Pages elsewhere**: official pages and websites, folded under "References elsewhere".

Where nothing holds all of a question, the page says so and shows what holds some of it, marked as
such. Under an answer, "People also ask" is the question headings of the article it came from.
"Related searches" are the same kind in the nearest towns and in the larger ones, each with its
count. The line above the results is made from counts ("18 pharmacies in Curepipe; 1 has a
telephone number on record") and is never written by hand.

The words the search understands are in the same file: `SAID_PHRASES` and `SAID` (French and Kreol
to English), `PADDING` (words that carry no meaning), and `DISHES` (a dish is looked for in a
place's own words, across every kind of place to eat, and never read as a category). Forty-nine
searches are kept as checks in `scripts/behaviour.mjs`; add one whenever a search goes wrong.
Eleven more, each named "engine", check what the site's own engine does that the library before it
did not.

A business asked for by its own name is given first, in three ways. A question that is a whole
name counts double in the engine. A name that reads as a kind of business in a town, or holds a
kind's word ("Phoenix Assurance", "Ebene Pharmacy", "Battery Point"), is still that business: if a
listing elsewhere, or of another kind, has the whole question for its name, the question is
searched as a name. And a name is tried as it was written before any close spelling of a part of
it. A kind of business asked for in a town that has none still leads, among partial matches, with
that kind elsewhere.

Among our own pages the order is `collect()`'s, in the same file. Of one article's parts, a part
that names the question's words in its own label or heading, or the article itself, comes before a
part that answers only because the article's title holds the words: "bus" is the article on
getting around, not its fact about the metro. An article whose own title holds the words counts
half as much again as a fact from another article. The three emergency numbers lead whatever else
answers.

### The engine

`src/lib/engine.ts` is the site's own search engine, written in this repository in Round 7 in place
of the MiniSearch library. It has no dependency and imports nothing from the rest of the site, so
it is tested by itself. The comment at its head is the algorithm's own account; this is the short
form.

- **What it holds.** For every word, the documents that hold it and how often in each field; for
  every document, its words in order. A document goes in or comes out by itself (`add`, `discard`):
  an owner's business is laid over the index and taken off again without anything being rebuilt.
- **How a word is matched.** As written; as the start of a longer word, found by halving a sorted
  list of the words (a quarter to a half of a whole match, by how much was typed); or, when the
  search allows it, as a close spelling. The distance between two words is the number of single
  slips between them, and two letters that changed places are one slip. One slip is allowed from
  four letters, two between words of eight letters or more. Close spellings are found without
  reading the vocabulary: each word is filed under its first seven letters with one letter out (two
  for a long word), and a typed word is looked up the same way. A close spelling counts for 0.5 or
  0.35 of a whole match.
- **How a document is scored.** By the field-weighted form of BM25 (BM25F): a word counts by the
  weight of the field it is in (`FIELDS` in `src/lib/search.ts`: name 4, other names 2.5, kind of
  business 2, address 1.5, description 1), by how rare it is, and less the longer the field is
  against the usual length of that field among documents of the same kind. Then the words together:
  a question that is a whole name doubles the score, and words side by side in a field add up to
  0.6. Asked for every word, a document that lacks one is no answer; asked for any, the one that
  holds them all comes first.
- **What the search asks of it.** `search()` decides: a word may stand for the start of a longer
  one from three letters for a listing and from four for a page; close spellings only when nothing
  matched as written, and never for a narrower word such as "plumber"; and, for a question read as
  a kind of business, the whole question is passed too, so that "state bank of mauritius" finds
  the State Bank of Mauritius before the State Bank of India. `understand()` reads a town or a
  kind of business typed wrongly ("pharmcy", "restorant", "curpipe") as the word meant, when one
  word the index holds is plainly the nearest (alone at its distance, or held by five times as
  many documents as the next), and the page says close spellings are shown.
- **A question asked the way people talk.** "Burger place in Beau Bassin" is a dish and a town.
  A word that only says "a business" (`GENERIC` in `src/lib/search.ts`: place, spot, shop) is set
  aside when the question finds nothing with it, and only beside a kind of business or a dish, so
  "Place Taxi Margeot" is still found by its name. The words people add when asking aloud
  ("where can I get", "with", "tonight") are padding. A dish asked for with a kind of place that
  has none ("burger restaurant", where the burgers are in snacks) is looked for in every place to
  eat. And when a kind of business in a town was understood, or a dish that places do mention,
  and another word is held by none of them ("nice", "halal", "late night"), the question is
  answered as far as it was understood and the page says which words were left out. Before this
  the whole question fell to "holds some of its words": 25 of 42 everyday questions tried on
  23 November 2026 did, and one does now, where the index holds no listing of that kind in that
  town. The 387 measured questions gained seventeen of this sort.
- **What the map does not say.** The open map records what a place serves for few of them. So
  under the places that answer a dish in a town, `search()` gives `also`: the other places of the
  dish's own kind in that town with nothing on record about what they serve, six at most, under
  "May also fit", never counted among the results. The related searches offer the same dish in
  the towns within ten kilometres, with real counts.

| Check | Command | What it does |
|---|---|---|
| The engine alone | `npm run search:test` | 65 checks on small made-up documents: the order, a word half typed, typing mistakes (and that the filing finds every close spelling a full reading of the vocabulary finds), adding and taking out, every word and any word, empty and odd questions. No build, no server |
| How long it takes | `npm run search:measure` | The site's `search()` in plain Node over 404 questions (`scripts/search-questions.mjs`: written by hand, and drawn from the index), five times each. Fails if the 95th percentile is over 30 ms or the index takes more than 1.5 times the library's time. `-- --results file` writes the first ten answers to every question, and `-- --compare file` says what differs from such a file |
| How good it is | `npm run search:measure -- --names` | Every one of the 6,520 names in the index asked for six ways: as written, with one of four slips in its longest word, and with its last two letters not yet typed. It counts how often the business is first, how often in the first ten, and how often nothing is found. About ten seconds |

The test needs Node 22.6 or newer, which runs TypeScript by stripping its types. The measurement
needs Node 22.15 or newer: `scripts/ts-paths.mjs` teaches plain Node the site's `@/` paths with
hooks that came in then.

The times in milliseconds, as written down in `scripts/search-measure.json`. Both rows were
measured in one sitting on the machine the round was built on, while four other builds ran on it:
on a quiet machine every figure is lower, the library's too. The library's row is the same script
at commit `55a3995`, the last with MiniSearch.

| | MiniSearch | The engine |
|---|---|---|
| The documents going into the index | 762.85 | 311.26 |
| The first question, which builds everything the search holds | 915.94 | 481.95 |
| The first question with a typing mistake (the engine files its words for close spellings then, once) | 11.5 | 56.89 |
| A search: the median | 1.74 | 0.2 |
| A search: the 95th percentile | 10.12 | 1.69 |
| A search: the 99th percentile | 22.12 | 4.47 |
| The slowest search | 87.69 | 13.2 |

And how often a business is found by its own name, over the 6,520 names in the index: the share
found first, and the share in the first ten (the first five for a name half typed). With two
letters changed places the library found nothing at all for 6.8% of names; the engine finds
something for every one.

| Asked for | MiniSearch: first | in the first ten | The engine: first | in the first ten |
|---|---|---|---|---|
| By its name as written | 91.6% | 96.4% | 97.7% | 98.6% |
| With two letters of its longest word changed places | 71.2% | 84.6% | 96.9% | 98.1% |
| With a letter of its longest word left out | 83.6% | 92.3% | 94.5% | 96.5% |
| With a letter of its longest word doubled | 90.8% | 96.5% | 97.1% | 98.2% |
| With a letter of its longest word wrong | 90.4% | 96.1% | 96.9% | 98% |
| By all but its last two letters (the first five) | 85.7% | 93.8% | 88.1% | 94% |

The search became quicker for two reasons, and only the first is the engine: it finds and weighs
documents in less time than the library did, and `search()` no longer walks all 7,179 listings for
each question, since it keeps them by kind of business and by town.

### Baz Manzer

`BAZ` in `src/data/site.ts` holds its words: its name and line, its ways round (the bar on a
phone and the header's links are drawn from them), the words of its search, of its offer to
install and of its offline page. `src/lib/food.ts` holds its lists: the kinds of place are the
categories of the "eat" group, the kinds of food are counted from what the map records for each
place, and the towns are the ones a place to eat stands in. Nothing is typed in. A verified
outlet on a paid plan comes first and is marked; its menu, when it has given one, shows on its
row and in full on its own page.

`src/lib/baz.ts` builds its addresses, and `bazHref` there gives every list exactly one: a kind
of food, a kind of place, a town and a kind of place in a town are addresses; a kind of food
narrowed by place or by town, a telephone number, a website and the page of a long list are
parameters after them. The old addresses, which were all parameters of `/baz-manzer`, are led to
the new by the pages themselves, for good.

Its search has no engine of its own (`foodSearch` in `src/lib/food.ts`). It asks the site's search
by its exported names: `understand` reads the question, and a town alone, a kind of place alone
or a kind of place in a town is the list itself; anything else is asked of `search`, a page of
answers at a time, and the places to eat among the answers are kept in the order the search gave
them. It looks through at most the first 800 listings that answer, and says so when there were
more. What is near is a town the visitor chooses: the site's own policy turns the browser's
location off (`Permissions-Policy` in `next.config.ts`), and nothing is kept of the choice.

### What goes with an article

`ARTICLE_BUSINESSES` in `src/data/site.ts` ties an article to the categories it is plainly about
(money to banks, cash machines and money changers; getting around to taxis and car hire). The
article then ends with those, and the search leads such a category with its article. An article
with no line there has no such part: none is made up for it.

### The cart

What can be bought is the pocket guide, a place on its sponsors' pages, and Biznes Go or Grow.
Each "Add to cart" button builds its item from the data files, so a price is never typed into a
component. The cart is kept in the browser (`biznes:cart`) and sent nowhere until the visitor
orders. With accounts on, the accounts' checkout places the order, priced again on the server;
with accounts off, it hands the cart, in words, to the request form. Nothing is paid on the site.

### The pictures and the calendar

`src/data/themes.ts` names the eighteen pictures, the five seasons, what falls in each and each
holiday's look. The site picks the day's by itself (`src/lib/theme.ts`), by the date in
Mauritius: a holiday's look on its day, and on any other day one of the season's pictures, a
different one each day and the same for everyone on that day.

| Season | Pictures, in turn | What falls over the landing page |
|---|---|---|
| Summer, 15 November to 15 February | `flamboyant`, `litchi`, `picnic`, `sunset`, `market`, `harbour`, `lagoon` | Flamboyant petals |
| The rains, 16 February to 30 April | `rain`, `lilies`, `teafields`, `chamarel`, `streetfood`, `lagoon` | Green leaves |
| Cane in flower, 1 May to 14 June | `cane`, `kites`, `village`, `teafields`, `harbour` | Wisps of cane flower |
| The harvest, 15 June to 30 September | `harvest`, `kites`, `chamarel`, `village`, `teafields`, `cane` | Dry leaves |
| Spring, 1 October to 14 November | `lilies`, `market`, `streetfood`, `harbour`, `sunset`, `lagoon` | Bougainvillea petals |
| A holiday's own | `lights`: Divali and the two days before it; Christmas and the three days before it. `lanterns`: the Spring Festival and the day before it | The season's |

- **Every picture is painted twice.** `lagoon.jpg` is wide, for a desk and a phone on its side.
  `lagoon-tall.jpg` is the same scene painted again for an upright screen, with the scene in its
  lower half: it is not the wide one cut down. A phone, and any screen held upright, gets the
  tall one, and the browser is told ahead to fetch only the one its screen needs.
- **Something of the season falls over the landing page**: a few petals or leaves, slowly,
  behind the words (`src/components/Leaves.tsx`). A small button at the end of the foot line
  holds them still and lets them go again, and remembers which. Nothing falls for a visitor who
  has asked their device for less motion, nor without script, nor on a phone under 340 pixels
  wide. To change what falls in a season, change its `fall` in `SEASONS`; the drawings are
  `src/components/glyphs/falls.ts` and their colours are `--palette-flame` and the nine after it
  in `src/app/globals.css`.
- **The seasons are our reading of the island's year**, not taken from a source. Correct the
  dates, the pictures or what falls in `SEASONS` (see "To confirm with the owner before launch").
- **A superadmin can overrule the calendar** from the admin pages: one picture, fixed, or a round
  of chosen pictures, their own uploads among them (`themeNow()`; see "Accounts"). A picture of
  their own is one file, shown as it is on a desk and a phone alike.
- **To add a picture**, have it painted twice, wide and tall, then
  `npm run picture -- <name> <the wide file> <the tall file>`: it writes the two files into
  `public/themes` at the sizes the site uses (2400 and 960 across) with a record beside each.
  Name it in `PICTURES` and add it to a season's `also`. `npm run hero` and `npm run glass` then
  measure the landing page's words and the glass against it, and it must pass both before it is
  used.
- **To change a picture**, do the same under a new name and point `PICTURES` at it, or keep the
  name and raise `VERSION` in `public/sw.js`, which keeps a picture under its name. Give `-` for
  a painting that is not changing.
- **Every picture has a record** that says what it is, what made it and when. The eighteen here
  are illustrations generated for the site: ten wide ones on 20 November 2026, eight more and a
  tall one of every picture on 24 November. They are never captioned as photographs.
- **To give a holiday a look**, add a line to `HOLIDAY_LOOKS`: a pattern for its official name, a
  greeting, and if wanted a picture and how many days before it the look begins. A holiday with no
  line keeps the everyday greeting, so a day of remembrance is not wished happy.
- **The everyday greeting** is `GREETING`: "Bonzour".
- **Holiday dates come only from `content/holidays.json`.** It holds 2026 and 2027, written from
  the General Notices and communiqués of the Prime Minister's Office, each named in the file. When
  the notice for 2028 is published, read it into the file. Never write a date into the code.
- Every page is made again at most once an hour, so it takes the day's look within the hour.

### Articles and guides

An article is one JSON file in `content/guides`: a title, a summary, its shelf, the day it was
checked, facts, sections of blocks (paragraph, list, steps, table, note), its sources, the pages to
go to next, and what it could not confirm. Every fact and block names the sources it was written
from, by id. The site shows those as numbered marks, and ends the article with "Keep reading" (the
pages of this site that follow on) and then "References" (every source, and the official pages to
go to).

To add an article, add its file, name it in `GUIDE_ORDER`, and build. No other change is needed:
the shelf, the search, the sitemap and `llms.txt` read the folder.

What was there when this was written:

| Shelf | Articles |
|---|---|
| About Mauritius | 4 of the 11 planned: weather and cyclones, money and banking, getting around, the economy. The other seven were being written by two researchers: Mauritius at a glance, districts and towns, people and languages, history, how Mauritius is governed, schools and universities, everyday facts |
| Starting and running a business | 13 |
| Visiting Mauritius | 2: what to know before you come; things to do, region by region |
| Moving here | 2: the ways to live here; settling in |
| Living here | 2: everyday paperwork; bills and services at home |

### Emergency numbers

`content/emergency.json`: groups of numbers, each with its name, the number, any second number,
what it is for, its hours where a page states them, and the sources it was read from. The file
lists its 29 sources with the day each was read, and what could not be confirmed. `/emergency`
shows all of it. A number goes in only from an official page that was read; the one exception is
named on the confirm list.

### The pocket guide

| File | Holds |
|---|---|
| `content/pdf/places.json` | The places, each with its region, what it is, what to know before going and its sources; the days out; the sources; what could not be confirmed. 60 places and 110 sources at present |
| `content/pdf/product.json` | The guide's address (`biznes-pocket-guide`), its title ("biznes.mu Pocket Guide"), the words on its cover, its price (Rs 150), and the sponsors written in by hand |
| `content/pdf/sponsorship.json` | How the guide is sponsored, in the owner's words of 20 November 2026 (`"confirmed": true`): the three options with their fees and the share of a page each takes, the most pages an edition holds, and the steps at which it is free |
| `content/pdf/built.json` | What the last build held, with its edition. Written by the script; the shop shows a guide only once this exists |

`npm run pdf` reads these and writes:

- `content/pdf/editions/<slug>.pdf`: this month's edition, A5, 53 pages at present. It is kept
  with the content and never in `public/`, because the guide is sold: only the shop's own route
  (`/shop/<slug>/download`) hands it out, and only while it is free.
- `public/shop/<slug>-cover.jpg`, `-opener.jpg` and `-sample.jpg`: the cover and two pages, for
  `/shop`.
- `content/pdf/built.json`.

It needs Playwright's browser, which the checks use too. The fades between a picture and the
page are painted into the pictures themselves, because a fade made of see-through colour shows as
a hard line in some PDF readers.

**A guide is renewed every month** (the owner, 20 November 2026). At the start of each month:
read its facts again, correct `places.json` and its `checked` date, add that month's sponsors to
`product.json`, run `npm run pdf` (or `npm run pdf -- 2026-12` to make a named month's edition),
and commit what it wrote.

**There is one guide.** The owner chose one big guide over many small ones: the biznes.mu Pocket
Guide. A monthly magazine, the biznes.mu Biznes Magazine, is to follow, free, with the businesses
of the month; it is announced on `/shop` and nothing of it is built. Both go to a list of
subscribers, which the accounts keep: the form is on `/shop` and at the foot of every page.

**Sponsors.** A business pays to be on the sponsors' pages of a coming edition, never the one
running. The three options (`sponsorship.json`):

| Option | Fee a month | Share of a page |
|---|---|---|
| A sponsored listing (`listing`) | Rs 500 | An eighth |
| A sponsored panel (`panel`) | Rs 1,500 | A quarter |
| A sponsored page (`page`) | Rs 4,000 | A whole page |

An edition holds **at most four pages of sponsors**. The script adds up the shares of every sponsor
named for a month and refuses to make an edition that goes over: it names the sponsor that would
be the fifth page and stops. `npm run pdf -- --check` does only that sum, on the guide's own file
or on one named after it. The accounts' database refuses the same thing when a place is booked.

Sponsors come from two places, and one named in both is counted once:

- written by hand in `product.json` under `sponsors`:

  ```json
  { "name": "A business", "line": "What it does, in a line", "town": "Curepipe", "phone": "+230 000 0000", "option": "listing", "months": ["2026-12", "2027-01"] }
  ```

- booked through an owner's account, approved by an admin and marked paid. The shop and the
  download read these by themselves (`withBooked` in `src/lib/shop.ts`). The script reads them when
  `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are in its environment, and says
  which it did.

**When the guide is free.** By what an edition's sponsors have together paid:

| They have paid | The edition is free |
|---|---|
| Rs 8,000 | For the first two weeks of its month |
| Rs 10,000 | For the first three weeks |
| Rs 12,000 | All month |

The rest of the month it is sold. The shop works this out each day (`offer()` in
`src/lib/shop.ts`) and the download route hands the file out only while it is free.

The price is the owner's: Rs 150 an edition. Until payment is connected the guide is ordered
through the cart, and a person sends it and says how to pay; a place in it is ordered the same way.

### The list of businesses with no website

`npm run leads` reads `data/index` and writes two files to `reports/`, which is not committed:
every listing with no website on record, and the businesses among them that have a telephone
number. On the index of 20 November 2026 that is 6,754 of 7,179 listings, and 273 businesses. The
owner asked for the list so that Khay Digital can offer those businesses a website. It adds nothing
to what the index holds: no email address is in the index at all. Run it again after a crawl.

### The mark

The name is drawn, not typed. `node scripts/logo.mjs` prints the paths that
`src/components/Logo.tsx` and `src/app/icon.svg` hold: the b as a stem and a ring with a point at
its centre, and the other letters as Manrope Bold's own outlines. It needs two packages for the run
only, named at its head. To change the mark:

1. Change the measures in `scripts/logo.mjs`, run it, and put the paths it prints into
   `src/components/Logo.tsx` and `src/app/icon.svg`. `scripts/pdf.mjs` holds its own copy of the
   b, for the pocket guide's cover: change it there too.
2. Run `node scripts/icons.mjs`, which draws the app's icons from `src/app/icon.svg`.
3. Raise `VERSION` in `public/sw.js`, so that the new icons replace the kept ones.
4. Run `npm run og` and `npm run pdf`: the link preview card and the pocket guide carry the mark.

### Where it came from

| Part | Source | Licence or basis | When |
|---|---|---|---|
| Listings: names, places, addresses, telephone numbers, websites, hours | OpenStreetMap, the Mauritius extract from download.openstreetmap.fr | Open Database Licence 1.0; credited on every page | Map as of 17 November 2026 |
| The coast, the districts, the council areas, the towns | The same | The same | The same |
| A company's description, founding year, industry, exchange | Wikidata | CC0 1.0 | 20 November 2026 |
| A business's own description; a telephone number where the map had none | Its own front page, read by the crawler | Its own words, shown as such and linked | 20 November 2026 |
| Mauritian websites | Found by following links from listings' sites and from sixteen hubs | Each site's own title and description | 20 November 2026 |
| The articles and guides | Official pages and Acts, listed in each | Written for this site from sources read one by one | 20 November 2026 |
| The glossary | The business guides | Each meaning checked against the guide it names | 20 November 2026 |
| Emergency numbers | 29 pages, listed in `content/emergency.json` | Each number as its page gives it | 20 November 2026 |
| Public holidays | The General Notices and communiqués of the Prime Minister's Office, listed in `content/holidays.json` | As published | 20 November 2026 |
| The pocket guide's places | 110 pages, listed in `content/pdf/places.json` and at the back of the guide | Written for this site from sources read one by one | 20 November 2026 |
| The plans and their prices, the pocket guide's price | The owner, in conversation | The owner's words | 20 November 2026 |
| The eighteen pictures, each wide and tall | Generated as illustrations for this site (Higgsfield, model gpt_image_2_6) | A record beside each file; no third-party rights | 20 and 24 November 2026 |
| Market figures in `REVENUE.md` | `content/market.json`, each with its page | Read on 20 November 2026 | |
| Colours | The mock-ups the owner approved on 17 and 20 November 2026, and the lagoon picture | Sampled or derived; see `DESIGN.md` | |
| Typeface | Manrope | SIL OFL 1.1; the file and its licence are in `src/fonts` | |

The last crawl visited 800 websites: 605 were read, 17 were left alone because their robots.txt
asked, and 166 did not answer. Many of the 166 are the fault of the line the crawl ran on, not of
the sites, so nothing is said about them on the site. Only a site that itself answered "not found"
is noted on its listing (21 of them).

`data/index` is derived from OpenStreetMap, so it is itself under the Open Database Licence:
`data/README.md` says so. There are no photographs on the site. Its pictures are generated
illustrations and are recorded as such.

**How the articles were researched.** Researchers worked in parallel to one brief: nothing from
memory; every figure confirmed on a page actually read; official sources first; a professional
firm's summary only as a cross-check, and labelled; anything that could not be confirmed listed
under "unverified" and left out of the prose; the period stated on every figure. Where an official
page and the Act disagreed, the guide follows the Act and says so in a note.

### To confirm with the owner before launch

The articles, the plans and the money:

1. **The articles and guides are general information written from sources, not checked by a
   practitioner.** Have a qualified accountant read the tax, VAT and employment guides, and a lawyer
   the company, data protection and immigration ones. Each lists what it could not confirm: 128
   points across the thirteen business guides, and more on each of the newer ones, shown on each
   article's page.
2. **The owner's reading of every new article and guide**, of the emergency numbers and of the
   pocket guide, before `launched` is set to `true`. It is still `false`.
3. **The Supabase project for the accounts.** The owner has agreed to pay for one. Its creation
   waits on a confirmation of the cost that only the owner can give.
4. **Stripe.** Plans are to be paid through it. It is not connected.
5. **The lines under each plan.** The names, the prices and what each plan holds are the owner's.
   The wording of each line on `/pricing` is Khay Digital's (`PLANS`), for example "free for good"
   and "A verified mark, once we have checked the business is real". The owner should read each
   one. What the check behind "verified" is has not been written down.
6. **How the pocket guide is paid for and sent.** There is one guide, at Rs 150 an edition (the
   owner first spoke of many guides and a bundle, then chose one big guide on 20 November 2026).
   Until a payment is connected, an order from the cart is answered by a person; how that person
   takes the money and sends the file is for the owner to say.
7. **Who the first superadmin is.** The rule proposed is the first account registered.
8. **"Bonzour".** The everyday greeting on the landing page and on Home is Kreol for hello. Keep it, or choose
   another (`GREETING`).
9. **The eighteen pictures** are generated illustrations. Keep them, or send your own.
   **The five seasons** (when each begins, which pictures it has, and what falls over the landing
   page in it) are our reading of the island's year, not taken from a source. Correct them in
   `SEASONS` in `src/data/themes.ts`.

What the researchers ask to be checked again:

10. **Entry rules.** The immigration office and the airport disagree on how long a passport must
    be valid, and the tourism authority and the airport on whether the arrival form is compulsory.
    The visiting guide gives both.
11. **Notes that will go out of date**, in the two visitor guides and the pocket guide: the curfew
    of October 2026, the airport's advisory that the arrival form must be shown before boarding,
    the suspension of feeding at Casela, the closure of the museum at Mahebourg.
12. **Metro Express.** The pages read are dated 2021.
13. **Figures for newcomers**: the salary for a Young Professional permit, and the income asked for
    a Premium Visa.
14. **Fees and bands for residents**: the certificate of character, the income tax bands, a
    replacement identity card.
15. **Befrienders' number** rests on a source that is not a government page.
16. **Eid-Ul-Fitr** is subject to confirmation in both years, as the notices themselves say.
17. **The police operations room**: the police's own pages give two different numbers.
18. **Several official sites could not be read from the build machine**: the Financial Services
    Commission (it refuses automated readers), the Bank of Mauritius, the Budget site, the
    Construction Industry Authority. The global business guide has only ten sources for that
    reason, and the registers of those bodies are missing from "Check a business". Read them by
    hand and add them.
19. **Rules change with each Finance Act.** The guides state the position on 20 November 2026,
    after the Finance Act 2026. Decide who re-reads them and when.

Running the site:

20. **Contact details** are Khay Digital's own (+230 5450 8600, faiz@khay.digital). Does biznes.mu
    get its own?
21. **Where requests go**: a webhook or an email address.
22. **Who answers a request** to correct or remove a listing, to take a plan or to buy a guide, and
    how fast. The site promises a person reads every one.
23. **The crawler's name**: "BiznesBot" is proposed. Set the two variables before crawling from
    your own machine.
24. **How often the crawl runs, and where.**
25. **Privacy**: the page says the site sets no cookies and runs no analytics. Signing in to an
    account will set a cookie, so the page must change before accounts open. If counting visits is
    added (`REVENUE.md` asks for it), it must change for that too.
26. **A test of the installed app on real phones**, an iPhone and an Android phone. It has been
    tested on a stand-in server only.
27. **The line**: "The search engine for business in Mauritius" is the owner's phrase, tidied.
28. **The category names**, and the French and Kreol words each answers to, were written by Khay
    Digital. A Kreol speaker should read `crawler/taxonomy.mjs`.

## The design

The postcard: a painted picture of the island behind the page, a sheet of warm paper laid on it,
and one question in the middle. Ink for words, a royal blue for what answers, and saffron for the
one lit point and the one filled action. Two faces: Manrope for every sentence and control, and
Bricolage Grotesque for the titles alone (both SIL OFL, both in `src/fonts`). Coral appears in one
place, the awning over Baz Manzer. The island beside a list is a light
map drawn only by what is listed on it: a pale lagoon, white land, a point of ink for every
listing, and saffron for the ones that answer. `DESIGN.md` has every token and its contrast;
`STORY.md` says why.

## Pages

| Address | What it does | Made |
|---|---|---|
| `/` | The landing page, one screen: the day's picture (the wide one at a desk, the tall one on a phone), the greeting, the site's line, the search box, and one button, "Home". A few petals or leaves of the season fall over the picture, behind the words, for a visitor whose device allows motion. At its foot, one line: whose product the site is, three pages, and the button that holds what falls still. The installed app opens here | Ahead of time, and again at most once an hour |
| `/home` | Home, in five parts: the top businesses (the verified ones on a paid plan, marked, then the day's eight of the fullest listings); Baz Manzer, by kind of place and kind of food; the directory's thirteen groups and the dozen kinds most listed; the ten regions with their largest towns, beside the island; and what is useful: the numbers to call, the next public holidays, articles, tools, the Pocket Guide, the glossary, official pages, and the way to list a business | Ahead of time, and again at most once an hour |
| `/search?q=` | Results, in four parts in a fixed order: our own pages that answer, businesses (cards that can be narrowed with `phone=1`, `web=1`, `town=`), parts of articles that mention the words, and pages elsewhere folded under "References elsewhere". `kind=` shows one kind alone | On each request |
| `/b/[slug]` | One listing: its own card, what is known, where each part came from, the same kind nearby. A listing's id alone leads to its full address | The first time it is asked for, then kept |
| `/directory` | Every category, group by group | Ahead of time |
| `/directory/[cat]`, `/directory/[cat]/[place]` | A category, and a category in one town, with the filters and the island | On each request |
| `/places` | Every town and village: a box that finds a town as it is typed, the districts as ways to jump, and each town's neighbourhoods folded under it | Ahead of time |
| `/places/[place]` | One town: what is listed there, by kind | On each request |
| `/more` | Every page the site has a name for, once, under its heading. What "More" leads to on a phone. Never indexed | Ahead of time |
| `/learn` | The articles and guides, shelf by shelf | Ahead of time |
| `/learn/[slug]` | One article, with its contents (the part being read is marked), its sources, the kinds of business that go with it, "Keep reading" and "References". The same address with `.md` after it gives the article as Markdown | Ahead of time |
| `/learn/glossary` | The glossary, with a letter index | Ahead of time |
| `/tools`, `/tools/verify`, `/tools/vat`, `/tools/structures` | The tools: check a business, the VAT calculator, legal structures compared | Ahead of time |
| `/tools/income-tax`, `/tools/business-tax` | The personal income tax calculator and the business tax estimator, each from its guide's facts. `?profit=` on the first carries a sole trader's profit over from the second | Ahead of time |
| `/official` | The official pages the guides point to | Ahead of time |
| `/emergency` | The emergency numbers, each a link that dials, each with its source | Ahead of time |
| `/pricing` | The three plans, and what paying changes | Ahead of time |
| `/shop` | The biznes.mu Pocket Guide: the cover, what is inside, the price, when it is free, the places a business can take in it, and the magazine to come. `/shop/[slug]/download` hands the edition out only while it is free | Ahead of time |
| `/baz-manzer` | The front of Baz Manzer: its own search, a town to choose for what is near, the kinds of place, the kinds of food, the towns, then every place to eat with the filters (`phone=1`, `web=1`, `page=`), the island and the articles on food. The old addresses (`type=`, `food=`, `town=`) lead to the ones below | On each request |
| `/baz-manzer/kind/[kind]`, `/baz-manzer/kind/[kind]/[town]` | A kind of place (restaurants, snacks and takeaways, cafés, bakeries, bars), and that kind in one town. The second is not put forward to search engines: the directory's own page for it is | On each request |
| `/baz-manzer/food`, `/baz-manzer/food/[food]` | Every kind of food the map records; and one kind, which `type=` and `town=` narrow | The first ahead of time; the second on each request |
| `/baz-manzer/town`, `/baz-manzer/town/[town]` | Every town and village with somewhere to eat, district by district; and one town or neighbourhood, with the towns nearest it and how far each is | The first ahead of time; the second on each request |
| `/baz-manzer/p/[slug]` | A place to eat, inside the section: the same page as `/b/[slug]` (or `/biz/[slug]`), which stays its one address for a search engine, with the section's path at its head. Only a place to eat has one | The first time it is asked for, then kept |
| `/baz-manzer/search?q=` | The section's own search: only places to eat, every answer inside the section. Never indexed | On each request |
| `/baz-manzer/saved` | The shortlist, narrowed to places to eat. `?ids=` shows a list someone sent. Never indexed | On each request |
| `/baz-manzer/offline` | What the installed Baz Manzer shows with no connection and no kept copy | Ahead of time |
| `/baz-manzer/suggest` | The section's search box's suggestions | On each request |
| `/cart` | What the visitor means to buy, with the total, and the way to send the order. Never indexed | Ahead of time; its contents are read in the browser |
| `/about` | Who makes the site | Ahead of time |
| `/saved` | The visitor's shortlist, read from their browser. `/saved?ids=` shows a list someone sent | On each request |
| `/add` | The request form. `?listing=`, `?claim=`, `?plan=`, `?product=` and `?sponsor=` open it on a listing, a claim, a plan, the guide or a place in it; `?message=` begins the request with words the cart wrote | On each request |
| `/data` | Where the data comes from, how results are ordered, how the Home page's top businesses are chosen, what is never taken, the index to download | Ahead of time |
| `/data/[file]` | The seven files of the index, as downloads | Ahead of time |
| `/bot` | How the crawler behaves, and how to keep it out | Ahead of time |
| `/privacy` | What the site keeps and does not keep | Ahead of time |
| `/offline` | What the installed app shows with no connection and no kept copy | Ahead of time |
| `/api/suggest` | The search box's suggestions, and the points the island lights | On each request |
| `/api/listings` | What a shortlist needs to show its listings, by id. It keeps nothing | On each request |
| `/api/enquiry` | Takes the form's requests and delivers them | On each request |
| `/points.json`, `/markers.json` | Where every listing sits on the island; and, for the street map, each placed listing with its name and kind | Ahead of time |
| `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/llms-full.txt` | For machines: who may crawl, every public page, what the site holds, and every article whole | Ahead of time |
| `/manifest.webmanifest`, `/baz-manzer/manifest.webmanifest`, `/sw.js` | For the two installable apps | Ahead of time |

Plus the icons, the link preview cards (one drawn for each kind of page that has its own) and the
404, which carries the search box. A page named `*.dev.tsx` is a page only under `npm run dev`:
`/og`, which `npm run og` captures, and `/preview/business`, a paid business's page with made-up
content that says on its face it is not real (`?as=go`, `?as=free` and `?as=claim` show the other
states). No paid business exists yet, so this is where that design is seen and checked.

The old site's addresses lead on for good: `/businesses` and `/businesses/...` to `/directory`,
`/how-it-works` to `/data`, `/enquire` to `/add`.

## Verification

The state of the checks on 24 November 2026, at the end of the round. Nothing is claimed beyond
this list.

| Check | Command | Result |
|---|---|---|
| Types | `npm run typecheck` | Clean |
| House style | `npm run copy` | 0 failures, 335 files |
| Tokens | `npm run tokens` | 0 failures, 266 files |
| Contrast | `npm run contrast` | Every pair passes |
| Words on the picture | `npm run hero` | The landing page's headline and greeting, in ink on the picture, and the line at its foot, measured against all eighteen pictures, the wide one at a desk and the tall one on a phone; then against each of the ten colours that fall over the page, laid over the whole picture as if a petal were behind every letter. 168 readings: the lowest is 5.86:1, the headline's with a green leaf behind it, which needs 3 |
| Words on glass | `npm run glass` | Ink on the menu's pill, the phone's bar, the search bar and the landing page's foot line, read as drawn against all eighteen pictures at a desk and on a phone: the lowest is 6.94:1. The glass is also held against black in `npm run contrast` |
| Design record | `npm run design` | 0 errors |
| Behaviour | `npm run behaviour` | 268 of 268, against a production server with accounts off. The landing page's picture and what falls over it are among them: the wide picture at a desk and the tall one on a phone and on a screen held upright, each the only one fetched ahead; fourteen pieces falling at a desk and eight on a phone; the control that holds them, lets them go and remembers; and nothing falling under reduced motion, without script or on the smallest phone. Sixty searches a Mauritian would type are among them, eleven asked the way people talk. The menu is among them too: the four links and which one is lit, the one list that opens, Escape and Tab out of it, the page of every page, and the phone's bar with every control at least 44 pixels each way |
| Baz Manzer as a section and an app of its own | `npm run behaviour:baz` | 231 of 231, against a production server: every address of the section, the old addresses leading to the new, its own header, bar, search and shortlist, its manifest and icons, the offer to install, and its pages opening with the server stopped |
| The search engine alone | `npm run search:test` | 65 of 65, in plain Node with no server (see "The engine") |
| The two tax tools | `node scripts/behaviour-tax.mjs` | 72 of 72, against a production server: twelve examples worked by hand from the guides' figures, errors in words, the no-script tables, a phone, and axe-core with the tools in use |
| Accessibility | `npm run a11y` | axe-core, WCAG 2.2 AA: clean on all 56 kinds of public page (14 of them Baz Manzer's), at a desk and on a phone, and with the header's list open. Those are read under reduced motion, so the landing page is read again with motion allowed, at both sizes, with what falls over it falling and then held: clean. Also clean, run by hand: the cart with things in it, the street map open, and the paid business page in its preview |
| Being found | `npm run seo` | 0 failures on 56 kinds of page: a title, a description, a canonical address, the card's tags and one h1 on each; every block of structured data parses; every card draws. 14 warnings, each a question heading in an article whose part opens with a list or a table and not a sentence that answers it |
| What a page weighs | `npm run weights` | Measured, not judged: see "What a page weighs" below |
| Captures | `npm run screenshots` | Every kind of page at both sizes, with no page wider than its screen. They are taken under reduced motion, so the landing page is captured once more at each size with what falls over it (`landing-leaves-desktop`, `landing-leaves-mobile`) |
| The accounts' rules in the database | `npm run test:rls` | 674 claims on a new database and 22 more on one that already holds rows, all pass, on a local Postgres |
| The site's own email, with no database and no mail service | `node scripts/email-unit.mjs` | 68 of 68 |
| The accounts in a browser | `node scripts/accounts-e2e.mjs` | 344 of 344, against Supabase's own database, sign-in, API and storage services run on this machine (`scripts/accounts-stack.sh`), with the public pages and the site's word in place, and axe-core clean on 70 kinds of account page at both sizes. On the hosted project only reading has been tried (see Accounts) |

The behaviour, accessibility and capture checks, and `npm run hero`, need a production server. The
behaviour check starts the form's own receiver, so the form is tested end to end:

```
npm run build
ENQUIRY_WEBHOOK_URL=http://127.0.0.1:3199/hook npx next start -p 3100 &
npm run behaviour && npm run a11y && npm run screenshots && npm run hero && npm run seo
```

Two people can run them on one machine: each check takes the server's address as its argument, and
the behaviour check's own two ports move with `HOOK_PORT` (where the form's delivery lands, which
the server's `ENQUIRY_WEBHOOK_URL` must name) and `ALT_PORT` (the second server it starts).

**Why the checks turn the browser's cache off** (`steady` in `scripts/pages.mjs`). Next answers a
link fetched ahead with "stale-while-revalidate". On a second visit to a page the browser hands
over the copy it kept and asks again in the background, and that background request is never
reported to the test as finished, so a wait for an idle network never ended. Nothing was wrong with
the page. The checks now ask for each file once.

What the behaviour check covers, from its own list: the first screen and the day's picture; the
island going live and lighting what is typed; suggestions and their keyboard; a question read as a
kind and a town, in Kreol, in French, and by one half of a town of two names; a question about how
answered first in the site's own words, with pages elsewhere folded away; a tool and a glossary
term found by name; a narrower word not passed off as a category; padding words dropped; a
misspelling answered and said to be one; the island drawn in on the answers; the "/" key; nothing
found; a second page; a listing reached by its id alone, through the service worker's handling of
the redirect, with its sources, the age of its record, its telephone link and its structured data;
the old addresses; robots, the sitemap and `llms.txt`; an article's citations; the VAT sums; the
two tools drawn from guides; the form's errors, its delivery, its honeypot and its rate limit, and
what it does with no route set (it starts a second server on port 3101 for that); the site with no
script; the menu's groups; answers to general questions (an emergency number as a button that
calls it, a holiday's date, an article's own words, a question about how led by an article, a
business's own name led by businesses); narrowing by telephone number and by town; saving, the
saved page and a shared list; the three plans and their prices; the pocket guide's price, its
sponsors and that it is not handed out while it is sold; and, on a phone, fourteen pages no wider
than the screen itself, the tab bar on the first screen, the menu, the emergency numbers one tap
from the first screen, and an article's contents.

Changed in Round 7, when the first screen became two pages: the landing page (its one heading,
the search, the one button and nothing under them; one screen at a desk and on a phone; a header
of the name, the cart and the account; no bar at its foot; the quiet line in the footer's place;
focus at a desk and the "/" key; still one screen on a phone of 320 by 568) and the Home page (its five parts in order; the eight top
businesses against the index itself and against the day's turn; that every full listing has its
turn in a round; the line that says how they are chosen; Baz Manzer's tiles; the thirteen groups
and the ten regions, each leading to a part of a page that is there; the numbers to call; the next
public holiday; an icon beside every way in, at a size set in one place; its own card, and its
places in the sitemap and in `llms.txt`). The menu's checks now hold Home as the first link, the
tools at the head of "More", and the first step of every page's path. The island no longer lights
what is typed, so that check is gone.

Added in Round 5: the four parts of a page of results and their order; the line of counts; "People
also ask" and that each question is an article's own heading; related searches; forty-nine
searches a Mauritian would type, in English, French and Kreol, each with what it must be read as
and what must lead; a partial match said to be one; the site's own maker found by name; a
business's page (its head, its blocks, its hours, the claim card, no paid features on a free
listing); Baz Manzer and its narrowing; the street map (nothing of it fetched until asked for, its
credit, the way back); the places page's box; an article's rail and its closing businesses; the
Markdown of an article; the footer and the header; the cart from the first button to an order
placed; the security policy in a real browser; and the same pages with no script.

**Two fixes worth knowing,** both in `public/sw.js`. On a page's first making the server gives a
redirect's address twice. A browser forgives that; a service worker's sealed copy of the redirect
does not, and the page failed to open: the worker now resolves a redirect itself. And a worker's
request for a page is not a visit in the browser's eyes, so the browser handed back the copy it
had kept while it fetched a new one, and a page that had just changed was shown as it was: the
worker now asks for every page afresh. The accounts' checks found the second.

**A design review by a fresh reviewer** was run on a built copy at both sizes, with a keyboard and
twenty-two searches: twenty-three findings, one of them a blocker. What was done about each, and
the five things left, are in `STORY.md` ("The design review of Round 4").

**Tested, but not where it matters most:**

- **The service worker and the install card** were tested by their author on a stand-in server (28
  and 31 checks). They have not been tried on a real iPhone or a real Android phone.

**Not run, and why:**

- **Signing up, signing in and the dashboards on the hosted Supabase project.** The project exists
  and holds the schema, and the site opens against it, but nobody has been registered there: the
  first to register becomes the superadmin, and that must be the owner. The whole flow has been
  run only against the local copy.
- **A reading by a practitioner.** The first item on the confirm list. This is the gap that matters.
- **Speed measurements** by Lighthouse, or on real devices on a mobile network. Lighthouse is not
  on the build machine. What could be measured is below.
- **The paid business page with a real business.** None exists. The design is checked in its
  preview, with made-up content.
- **The street map on a real phone**, and under a slow connection.
- **An order placed, a subscriber joined, an advertisement shown.** These need accounts on; the
  accounts' own checks cover them. With accounts off, the public checks hold that each place is
  empty and that the cart hands its words to the request form.
- **A screen reader, by ear.** axe-core passes; nobody has listened to it.
- **Real phones in daylight.** The contrast is high by measurement; it has not been looked at
  outdoors.
- **The crawler under its own name.** Every run so far used the generic name.
- **A crawl from a normal connection.** The build machine reaches the web through a proxy that
  dropped many connections, which is why 166 sites "did not answer".

### What a page weighs

`npm run weights` opens one page of each kind on a phone-sized screen with nothing kept, and adds
up what crossed the network, compressed. On 20 November 2026, on the build machine:

| Page | Whole | Its HTML | Script | Pictures | Fonts | Layout shift | Largest single file |
|---|---|---|---|---|---|---|---|
| First screen | 508 kB | 53 kB | 163 kB | 78 kB | 102 kB | 0.000 | The day's picture, 78 kB |
| Search results | 512 kB | 52 kB | 166 kB | 78 kB | 102 kB | 0.000 | The day's picture |
| A search that is answered | 448 kB | 17 kB | 166 kB | 78 kB | 102 kB | 0.000 | The day's picture |
| A business | 529 kB | 71 kB | 166 kB | 78 kB | 102 kB | 0.000 | The day's picture |
| A category | 518 kB | 53 kB | 166 kB | 78 kB | 102 kB | 0.000 | The day's picture |
| The towns | 463 kB | 33 kB | 163 kB | 78 kB | 102 kB | 0.000 | The day's picture |
| Baz Manzer | 533 kB | 69 kB | 166 kB | 78 kB | 102 kB | 0.000 | The day's picture |
| An article | 475 kB | 40 kB | 167 kB | 78 kB | 102 kB | 0.000 | The day's picture |
| The shop | 526 kB | 16 kB | 163 kB | 164 kB | 102 kB | 0.000 | The guide's cover, 86 kB |
| The cart | 435 kB | 11 kB | 163 kB | 78 kB | 102 kB | 0.000 | The day's picture |

What was done for speed: the day's picture is asked for at once, at the size the screen needs;
both typefaces are one file each, kept by the browser for good; nothing on any page moves after it
is drawn; the island is drawn once on a page and not once for each size of screen (a page of
results was a third heavier before); the street map costs nothing until it is opened; and links
in long lists are not fetched ahead. What is left: the two typefaces are a fifth of every page,
and the island's drawing is most of a list page's HTML.

## Known gaps

- **Nothing can be paid for on the site.** No payment is connected. A plan, the pocket guide or a
  place in it is ordered through the cart, and a person replies with how to pay.
- **No listing is verified or on a paid plan yet**, so the mark and the priority are drawn and not
  yet seen. Claiming a listing waits on the accounts.
- **Coverage is what the open map holds**: fullest for shops, food, places to stay and public
  services; thin for offices and trades. Only 525 listings have a telephone number and 425 a
  website. The registry counts 126,453 live entities; the index holds 7,179 listings.
- **Most records are old.** Nine in ten of the map's listings were last edited more than two years
  ago. Each listing says when, and warns when it is over two years. Claimed listings would cure
  this.
- **The magazine is announced and not made.** The list of subscribers is kept by the accounts;
  with accounts off the form is not shown.
- **No paid business exists**, so a paid page, a menu on Baz Manzer and an advertisement are seen
  only in the preview and in the accounts' own checks.
- **The street map depends on a free service** with no promise of service ("The street map").
- **A dish is found only where the map names it.** Few places record what they serve, so a search
  for a dish finds fewer places than serve it, and says how many it found.
- **A chain is one card a branch.**
- **No French or Kreol pages.** A question in either is understood.
- **"Open now" is not offered.** Hours are shown as the map holds them, for 355 listings.
- **A listing's website is checked only at its front page.**
- **The search has no memory of what people ask**, so nothing yet says which searches find nothing.
- **Names are shown as the map writes them**, capitals and all.
- **The island itself cannot be explored by hand**: a point on it cannot be opened. The street
  map can, and is one press away.

---

A Digital Experience by **Khay Digital**.
