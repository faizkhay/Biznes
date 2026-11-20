# biznes.mu, the search engine

A website for Khay Digital Ltd (Mauritius), who build and run it: biznes.mu, a search engine for
business in Mauritius and the directory behind it. Its one job is to answer a question about the
island: a business to call, how something is done, whether a business is real, who to ring in an
emergency.

What is the owner's and what is not: the name, the line, the three plans and their prices are the
owner's words. The listings come from open data and each says where. The articles and guides are
written from official pages and each lists them. The design, the search and the crawler were made
for this site.

The first screen is a postcard: a painted picture of the island behind the page, a sheet of warm
paper laid on it, and one question in the middle, "Find it in Mauritius." The picture follows the
calendar by itself: a public holiday's look on its day, otherwise the season's, otherwise the
lagoon. Everything a visitor reads at length is on the paper.

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
- **The search** (`src/lib/search.ts`): one question over listings, articles, official pages and
  websites. It reads a town and a kind of business out of a question, in English, French or Kreol.
  A question about how is answered first, in the site's own words, with the article it comes
  from; pages on other sites are folded away as "References elsewhere". It never passes a wider
  category off as the answer to a narrower word.
- **Narrowing, saving and sharing**: a list of listings is narrowed by telephone number, by
  website and by town, each as a link. A shortlist is kept in the visitor's own browser and shared
  as a link. A listing or a search can be shared.
- **The articles and guides** (`content/guides`): 23 when this was written, on five shelves, with
  more arriving. Each fact names its source, and each article ends with what to read next on the
  site and then its list of references. A glossary of 90 terms (`content/glossary.json`) is drawn
  from the business guides.
- **The tools**: check a business, a VAT calculator, a comparison of legal structures, the glossary.
  Each takes its figures from a guide and holds none of its own.
- **Emergency numbers** (`content/emergency.json`): 43 numbers from 29 sources, each named.
- **The pocket guide** (`content/pdf`, `npm run pdf`): the first of the PDF guides to be sold, 51
  pages.
- **The plans** (`PLANS` in `src/data/site.ts`): Biznes Free, Biznes Go and Biznes Grow, on
  `/pricing`.
- **The installable app**: a manifest, a service worker, an offline page and a card that offers to
  install.
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
index it and `robots.txt` closes the site. Set it to `true` when the confirm list below is closed.
The results of a search, a shortlist and the offline page are never indexed, launched or not.

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

The owner asked for a site that is "fully pwa enabled" on iOS, Android and a desk. Five parts make
it so.

| Part | File | What it does |
|---|---|---|
| The manifest | `src/app/manifest.ts`, served as `/manifest.webmanifest` | The name ("biznes" under the icon), the paper's colour, the four icons, and four pages the icon can open directly: Search, Directory, Saved, Emergency numbers |
| The icons | `public/icons`, `src/app/apple-icon.png` | Drawn from the mark by `node scripts/icons.mjs`. Two as drawn, two on a full square of ink for a platform to cut to its own shape, one for the iOS home screen |
| The service worker | `public/sw.js` | Lets the site open with no connection once it has been visited |
| The offline page | `/offline` | What the worker shows in place of a page it could not fetch and holds no copy of: "You are offline", with a way to try again and a way to the saved list |
| The install card | `src/components/Pwa.tsx` | Registers the worker, and offers to add the site to the home screen |

**What the worker answers, and how** (it is written by hand, with no library, and says so at its
head):

- **A page**: the network first; with no network, the kept copy of that page; with no copy, the
  offline page. It keeps the last 40 pages opened.
- **The build's own files, the pictures behind the page, the icons and the typeface**: the kept
  copy first, since none of them changes under the same address.
- **Any other file of the site**: the kept copy at once, and a fresh one fetched for the next time.
- **Never**: another site, a form being sent, anything under `/api`, `/account`, `/admin`,
  `/dashboard` or `/auth`, a signed request, a request for part of a file, or Next's own request
  for a page's data.
- **From the first visit** it keeps the offline page with the files it needs, the icons, and the
  first screen, so the installed app opens with no connection from the first day.
- **A redirect** it resolves itself. On a page's first making the server can give a redirect's
  address twice, which a browser forgives and a worker's sealed copy does not, so the worker asks
  where the address leads and sends the browser there.

**When to raise `VERSION`** at the head of `public/sw.js`: when the file changes what it keeps, and
when a file under `/themes/` or `/icons/` is replaced under the same name (a new picture, a new
mark). The older version's kept files are then deleted on every device at its next visit. A
picture or an icon given a new name needs no change.

**The install card.** Where the browser makes the offer (Android, a desk), the card has an
"Install" button. On an iPhone or an iPad, which make no offer, it says where to tap: Share, then
Add to Home Screen. It shows nothing inside the installed app, nothing inside another app's own
browser on iOS, and nothing for thirty days once it has been closed. On a phone it sits above the
tab bar; on a wide screen, in the bottom right corner.

The saved list keeps what it needs to show each listing beside the list itself, in the browser, so
it still opens with no connection. The privacy page says what an installed copy keeps on the
device.

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

### The hosted project

The owner created the Supabase project on 20 November 2026: "Biznes", in the organisation's
Ireland region, with the reference `pcopgncmtgkojrtuiqud`. The four migrations were applied to it
that day, whole and unchanged, and checked:

- Eight tables in `public`, row level security on every one, twenty-six policies, and the trigger
  that makes a profile on sign-up. No account exists yet, so the first to register is the
  superadmin.
- Asked with the public key, as a visitor would be: live businesses, services and payment details
  answer (with nothing, as there is none yet); the settings answer with the columns the site reads;
  profiles and the audit log are refused.
- The site, built and served against it and not yet deployed: the first screen, a search and a
  listing open; the sign-in and sign-up pages open; the plans lead to the dashboard; the dashboard
  and the admin pages send a visitor who is not signed in to sign in. Nobody was registered, on
  purpose.

Its two public values, which are meant to be seen (they ship to every browser):

```
NEXT_PUBLIC_SUPABASE_URL=https://pcopgncmtgkojrtuiqud.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_X_o60qW9sW669m8PJVq0Kw_lZo9mJv4
```

Still to do on the project itself, in its dashboard: the site's address and the redirect addresses,
the two email templates and an email sender (all under "Setting up the project" below). And two
things to know:

- **Supabase's security adviser** lists the five admin functions as callable by a signed-in user.
  That is by design: each checks the caller's role before it does anything, and a visitor cannot
  call them. It also lists `public.rls_auto_enable()`, which is the project's own and not ours;
  `revoke execute on function public.rls_auto_enable() from public, anon, authenticated;` clears it.
- **The migrations' history** on the project carries the time each was applied, not the files' own
  numbers. Before using the Supabase CLI against it, bring the two into line with `supabase
  migration repair`, or a later `db push` will try to apply the four files again.

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
- **The service worker** never keeps or answers anything under `/api`, `/account`, `/admin`,
  `/dashboard` or `/auth`, nor an answer that was led on to one of them. A new private address
  must be added to `PRIVATE` in `public/sw.js` and in `next.config.ts`.

Still open, and for the owner or the host to close:

- **Register the first account now, or switch sign-ups off in the project until you do.** The
  first person to sign up becomes the superadmin, and the project's address and public key are
  in this file.
- **A page is kept for every address asked for under `/b/` and `/biz/`,** found or not, about
  60 KB each. On a server of our own a stranger could fill the disk by asking for addresses that
  do not exist. Limit requests at the host, or check the address in `src/proxy.ts` before a page
  is made, or keep the pages made on demand in memory only.
- **In the Supabase dashboard:** a CAPTCHA on sign-up, sign-in and password reset; the check
  against leaked passwords; only the site's own address among the redirect addresses once it is
  live.

## Where the content lives

Everything the owner will change is data. No fact is written into a component.

| To change | Edit |
|---|---|
| The site's name, line, description and contact details | `site` in `src/data/site.ts` |
| The menu's three groups, and the line under each page | `MENU` in `src/data/site.ts` |
| The footer's pages | `NAV` and `MORE` in `src/data/site.ts` |
| The five tabs at the foot of a phone's screen | `TABS` in `src/components/TabBar.tsx` |
| The first screen's searches to try | `EXAMPLES` in `src/data/site.ts` |
| A plan's name, price or lines | `PLANS` in `src/data/site.ts` (see "The plans") |
| The four promises on the first screen | `PROMISES` in `src/data/site.ts` |
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

The menu opens three groups, Explore, Learn and For business, each a list of pages with a line
about it (`MENU`). To add a page to the menu, add an entry to its group. No other change is needed.

A shelf is a row of `SHELVES`: an id, a label and a line. An article joins a shelf by its `shelf`
field; one with none is on the business shelf. The order of articles on the site is `GUIDE_ORDER`
in `src/lib/index.ts`; one that is not named there comes last. A shelf with no article is not
shown.

### The pictures and the calendar

`src/data/themes.ts` names the four pictures, the seasons and each holiday's look. The site picks
the day's by itself (`src/lib/theme.ts`), by the date in Mauritius.

| Picture | Shown |
|---|---|
| `lagoon` | When nothing else applies |
| `flamboyant` | The summer, 15 November to 15 February |
| `cane` | The harvest, 15 June to 30 September |
| `lights` | Divali and the two days before it; Christmas and the three days before it |

- **To change a picture**, replace its two files in `public/themes` (the full one, and the `-sm`
  one for a phone) and bring the `.json` record beside each up to date. Then raise `VERSION` in
  `public/sw.js`, or name the new files differently and point `PICTURES` at them.
- **Every picture has a record** that says what it is, what made it and when. The four here are
  illustrations generated for the site on 20 November 2026. They are never captioned as
  photographs.
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
| `content/pdf/product.json` | The guide's title, the words on its cover, and its price: Rs 150 |
| `content/pdf/sponsorship.json` | How a guide is sponsored: the three options and their prices, the sum that makes an edition free, and for how many days. Khay Digital's suggestion until the owner confirms it (`"confirmed": false`) |
| `content/pdf/built.json` | What the last build held, with its edition. Written by the script; the shop shows a guide only once this exists |

`npm run pdf` reads these and writes:

- `content/pdf/editions/<slug>.pdf`: this month's edition, A5, 52 pages at present. It is kept
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

**Sponsors.** Each edition has a sponsors' page, with how to reach us to be on the next one. A
business that has paid goes in `product.json` under `sponsors`, with the option it bought and the
months it paid for:

```json
{ "name": "A business", "line": "What it does, in a line", "town": "Curepipe", "phone": "+230 000 0000", "option": "listing", "months": ["2026-12", "2027-01"] }
```

Sponsorship is sold for a coming month or months only, never the one running. When the sponsors
of a month have together paid the target in `sponsorship.json`, that edition is free on the site
for the first three weeks of the month (to the 21st) and sold in the last. The shop works this
out by itself each day (`offer()` in `src/lib/shop.ts`).

The price is the owner's: Rs 150 a guide. The owner intends 50 to 100 guides, and later a bundle
of them all at about 60 per cent off. Only one guide exists, and the script and the shop hold
one: a second needs both to learn to hold several. Until Stripe is connected a guide is asked for
through the form, and a person sends it; sponsorship is asked for the same way.

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
| The four pictures | Generated as illustrations for this site (Higgsfield, model gpt_image_2_6) | A record beside each file; no third-party rights | 20 November 2026 |
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
6. **The pocket guide's bundle.** One guide exists, at Rs 150. The bundle of all at about 60 per
   cent off is planned for when there are more. Until Stripe is connected, how a guide is paid for
   and sent is for the owner to say.
7. **Who the first superadmin is.** The rule proposed is the first account registered.
8. **"Bonzour".** The everyday greeting on the first screen is Kreol for hello. Keep it, or choose
   another (`GREETING`).
9. **The four pictures** are generated illustrations. Keep them, or send your own.

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
one lit point and the one filled action. One face, Manrope. The island beside a list is a light
map drawn only by what is listed on it: a pale lagoon, white land, a point of ink for every
listing, and saffron for the ones that answer. `DESIGN.md` has every token and its contrast;
`STORY.md` says why.

## Pages

| Address | What it does | Made |
|---|---|---|
| `/` | The first screen: the greeting, the question, the search. Then the directory's groups, the towns beside the island, the guides, the tools, where it all comes from | Ahead of time, and again at most once an hour |
| `/search?q=` | Results. A question about how is answered first in the site's own words; listings are cards that can be narrowed (`phone=1`, `web=1`, `town=`); official pages and websites are folded under "References elsewhere"; `kind=` shows one kind, `page=` the next page | On each request |
| `/b/[slug]` | One listing: its own card, what is known, where each part came from, the same kind nearby. A listing's id alone leads to its full address | The first time it is asked for, then kept |
| `/directory` | Every category, group by group | Ahead of time |
| `/directory/[cat]`, `/directory/[cat]/[place]` | A category, and a category in one town, with the filters and the island | On each request |
| `/places` | Every town and village, district by district | Ahead of time |
| `/places/[place]` | One town: what is listed there, by kind | On each request |
| `/learn` | The articles and guides, shelf by shelf | Ahead of time |
| `/learn/[slug]` | One article, with its contents, its sources, "Keep reading" and "References" | Ahead of time |
| `/learn/glossary` | The glossary, with a letter index | Ahead of time |
| `/tools`, `/tools/verify`, `/tools/vat`, `/tools/structures` | The tools: check a business, the VAT calculator, legal structures compared | Ahead of time |
| `/official` | The official pages the guides point to | Ahead of time |
| `/emergency` | The emergency numbers, each a link that dials, each with its source | Ahead of time |
| `/pricing` | The three plans, and what paying changes | Ahead of time |
| `/shop` | The pocket guides: the cover, what is inside, the price, a way to ask for one | Ahead of time |
| `/saved` | The visitor's shortlist, read from their browser. `/saved?ids=` shows a list someone sent | On each request |
| `/add` | The request form. `?listing=`, `?plan=` and `?product=` open it on a listing, a plan or a guide | On each request |
| `/data` | Where the data comes from, how results are ordered, what is never taken, the index to download | Ahead of time |
| `/data/[file]` | The seven files of the index, as downloads | Ahead of time |
| `/bot` | How the crawler behaves, and how to keep it out | Ahead of time |
| `/privacy` | What the site keeps and does not keep | Ahead of time |
| `/offline` | What the installed app shows with no connection and no kept copy | Ahead of time |
| `/api/suggest` | The search box's suggestions, and the points the island lights | On each request |
| `/api/listings` | What a shortlist needs to show its listings, by id. It keeps nothing | On each request |
| `/api/enquiry` | Takes the form's requests and delivers them | On each request |
| `/points.json` | Where every listing sits on the island | Ahead of time |
| `/robots.txt`, `/sitemap.xml`, `/llms.txt` | For machines | Ahead of time |
| `/manifest.webmanifest`, `/sw.js` | For the installable app | Ahead of time |

Plus the icons, the link preview card and the 404, which carries the search box. A page named
`*.dev.tsx` is a page only under `npm run dev`: `/og` is the one, and `npm run og` captures it.

The old site's addresses lead on for good: `/businesses` and `/businesses/...` to `/directory`,
`/how-it-works` to `/data`, `/enquire` to `/add`.

## Verification

The state of the checks on 20 November 2026, at the end of the round. Nothing is claimed beyond
this list.

| Check | Command | Result |
|---|---|---|
| Types | `npm run typecheck` | Clean |
| House style | `npm run copy` | 0 failures, 176 files |
| Tokens | `npm run tokens` | 0 failures |
| Contrast | `npm run contrast` | Every pair passes |
| Words on the picture | `npm run hero` | The first screen's headline and the line under it, measured against all four pictures at a desk and on a phone: the lowest is 5.77:1 |
| Design record | `npm run design` | 0 errors |
| Behaviour | `npm run behaviour` | 106 of 106, against a production server with accounts off |
| Accessibility | `npm run a11y` | axe-core, WCAG 2.2 AA: clean on every kind of public page, at a desk and on a phone |
| Captures | `npm run screenshots` | Every kind of page at both sizes, with no page wider than its screen |
| The accounts' rules in the database | `npm run test:rls` | 186 of 186, on a local Postgres |
| The accounts in a browser | `node scripts/accounts-e2e.mjs` | 118 of 118, against Supabase's own database, sign-in and API services run on this machine (`scripts/accounts-stack.sh`), including axe-core on the account pages. On the hosted project only reading has been tried (see Accounts) |

The behaviour, accessibility and capture checks, and `npm run hero`, need a production server. The
behaviour check starts the form's own receiver, so the form is tested end to end:

```
npm run build
ENQUIRY_WEBHOOK_URL=http://127.0.0.1:3199/hook npx next start -p 3100 &
npm run behaviour && npm run a11y && npm run screenshots && npm run hero
```

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
- **Speed measurements** (Lighthouse, real devices on a mobile network). Not run in this session.
- **A screen reader, by ear.** axe-core passes; nobody has listened to it.
- **Real phones in daylight.** The contrast is high by measurement; it has not been looked at
  outdoors.
- **The crawler under its own name.** Every run so far used the generic name.
- **A crawl from a normal connection.** The build machine reaches the web through a proxy that
  dropped many connections, which is why 166 sites "did not answer".

## Known gaps

- **Nothing can be paid for on the site.** Stripe is not connected. A plan or a pocket guide is
  asked for through the form.
- **No listing is verified or on a paid plan yet**, so the mark and the priority are drawn and not
  yet seen. Claiming a listing waits on the accounts.
- **Coverage is what the open map holds**: fullest for shops, food, places to stay and public
  services; thin for offices and trades. Only 525 listings have a telephone number and 425 a
  website. The registry counts 126,453 live entities; the index holds 7,179 listings.
- **Most records are old.** Nine in ten of the map's listings were last edited more than two years
  ago. Each listing says when, and warns when it is over two years. Claimed listings would cure
  this.
- **One pocket guide.** The script and the shop hold one guide; the bundle is not built.
- **A chain is one card a branch.**
- **No French or Kreol pages.** A question in either is understood.
- **A superadmin cannot yet choose the picture**: the calendar does, and the owner changes a file.
- **"Open now" is not offered.** Hours are shown as the map holds them, for 355 listings.
- **A listing's website is checked only at its front page.**
- **The search has no memory of what people ask**, so nothing yet says which searches find nothing.
- **Names are shown as the map writes them**, capitals and all.
- **The island cannot be explored by hand**: a point cannot be opened (`DESIGN.md`, "Known Gaps").

---

A Digital Experience by **Khay Digital**.
