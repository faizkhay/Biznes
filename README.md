# biznes.mu, the website

A website for biznes.mu, a Khay Digital Ltd project (Mauritius) that sells ready-to-launch
businesses: each with its name and identity, its domain, its website and its strategy, sold to one
owner. One job: turn a visitor into a request about one business.

The offer, the contact details and LePalatier come from the owner and from Khay Digital's own
published facts. The design, the identity of biznes.mu, each listing's look and the copy are new,
made under the owner's carte blanche on 16 November 2026.

The home page is the rail. Every business hangs ready on one rail, as a tag in its own colours and
lettering, each by its own string and each a link to its page. Below the rail: the six things every
business comes with, fanned from one ring; the sale in four steps; what stays with the buyer, said
plainly on night; the line said large; and who builds them.

| Chapter | Where | What it sells |
| --- | --- | --- |
| The rail | Six tags on strings | The businesses themselves |
| The ring | A ring with six small tags, beside a list | What every business comes with |
| The steps | Four steps hanging from one rail | How a sale runs |
| The honest half | Night | What is not sold: premises, licences, stock, staff, income |
| The line | Open ground | "The business is ready / All it needs is its owner" |
| The maker | The quiet panel | Khay Digital builds every one |

`STORY.md` has the full story; `PRODUCT.md` has the product truth; `DESIGN.md` has the design
system.

---

## Running it

```bash
npm install
npm run dev         # http://localhost:3000
npm run build       # production build, every page prerendered
npm run start       # serve the production build
npm run typecheck
```

Node 20 or newer.

| Query | Effect |
| --- | --- |
| `?still` | No smooth scroll, for captures |
| `/enquire?business=<slug>` | The request form arrives with that business chosen |

Other scripts:

| Script | What it does |
| --- | --- |
| `npm run wordmarks` | Redraws each listing's lettering as vector outlines into `src/data/wordmarks.ts` |
| `npm run og` | Captures the link preview card to `public/og.png` (needs `npx next dev -p 3200` running) |
| `npm run copy`, `npm run tokens` | The house style and the token checks |
| `npm run contrast` | Measures every colour pair in `scripts/contrast.pairs.json` |
| `npm run screenshots`, `npm run reveals`, `npm run a11y` | The checks against a production server on port 3100 |
| `npm run behaviour` | The phone menu, the form end to end, the endpoint, the page without script and the machine-facing files, against the same server |

## Deploying

Vercel: import the repository and accept the defaults. Every page is prerendered; only
`/api/enquiry` runs on a server.

| Variable | What it does |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | The address the site is served from (`https://biznes.mu`), for canonical links, the sitemap and link previews. On Vercel it falls back to the project's production address. |

### Before the site can be found

`launched` in `src/data/site.ts` is `false`. While it is, every page asks not to be indexed and
`robots.txt` closes the site, because five of the six listings are samples. Set it to `true` once
the samples are replaced or removed.

### Where requests go

| Variable | Route |
| --- | --- |
| `ENQUIRY_WEBHOOK_URL` | POST the request as JSON (Zapier, Make, a CRM, an Apps Script). Takes precedence. |
| `RESEND_API_KEY` | Email it with Resend to `ENQUIRY_TO`, from `ENQUIRY_FROM`. |

**With neither set, the form cannot deliver.** In production it then answers 503 and the form says
so, giving the phone, WhatsApp and email instead. In development the request is written to the
server log. Choose a route before launch. The rate limit (5 requests per connection per 10 minutes)
lives in memory, so it is per server instance.

## Where the content lives

Everything the owner will want to change is data, not markup.

| File | Contains |
| --- | --- |
| `src/data/site.ts` | The name, the line, the contact routes, the builder's facts, `launched`, `showPrices`, the navigation and the action labels |
| `src/data/businesses.ts` | The businesses: number, name, sector, places, price, status, the idea, the brand's colours, what the buyer brings |
| `src/data/pack.ts` | The six things every business comes with, the four steps, the honest half, the tagline, the questions |
| `src/data/wordmarks.ts` | Generated: each listing's lettering as outlines. Never edited by hand |

To add a business: add an entry to `BUSINESSES` in `src/data/businesses.ts`, add its lettering to
`MARKS` in `scripts/make-wordmarks.mjs`, run `npm run wordmarks`, and add its two colours to
`scripts/contrast.pairs.json`. The rail, the catalogue, its page, the form, the sitemap, the
structured data and `llms.txt` pick it up. A business without lettering fails the build.

To mark one sold: set its `status` to `"sold"`. It leaves the rail, the catalogue, the form and the
sitemap. To hide every price: set `showPrices` to `false`.

### Where it came from

| Source | What it gave |
| --- | --- |
| The owner, in conversation, 15 and 16 November 2026 | The offer and its six parts, LePalatier (a restaurant and café, for Moka, Grand Baie or Tamarin, proposed at 350k), the request for five samples, carte blanche on creative direction |
| https://www.khay.digital/llms.txt, read 16 November 2026 | Khay Digital's legal name, BRN, founding date, founder, belief, phone, email and hours |
| Open-licence typefaces (SIL OFL 1.1), from `@fontsource` | The outlines of the six wordmarks: Cormorant Garamond, Fredoka, Jost, Playfair Display, Barlow Condensed, Outfit |
| Geist and Geist Mono (SIL OFL 1.1), from the `geist` package | The site's own type |

There are no photographs, no testimonials and no figures on the site, because none exist yet. The
only raster is `public/og.png`, a capture of the site's own card; its sidecar says so.

### To confirm with the owner before launch

1. **The five samples.** Lakrem, Souffle, Bouké, Larout and Kazprop are placeholders: their names,
   looks and prices are invented for this build and marked "Sample listing". Replace each with a
   real business or remove it, then set `launched` to `true`.
2. **LePalatier's price. A launch blocker.** MUR 350,000 is the figure proposed in conversation, and
   the site shows it as the price. Confirm it and say whether VAT applies before `launched` is set;
   nothing on the site mentions VAT. Until then `showPrices` hides every price in one switch.
3. **LePalatier's look.** Bordeaux, ivory and brass, in Cormorant Garamond, is Khay Digital's first
   direction. Confirm it or replace it; the page says "already made".
4. **The domains.** None of `lepalatier.mu`, `lakrem.mu`, `souffle.mu`, `bouke.mu`, `larout.mu` or
   `kazprop.mu` resolved on 16 November 2026, so the site prints no domain for any business.
   Register `lepalatier.mu`, then add `domain` to its entry.
5. **The social media names.** The site says they are "secured for the brand". Instagram's terms do
   not allow an account or its username to be sold or transferred. Decide how the names are handed
   over, and keep the wording within it.
6. **A trademark filing.** It is not among the six things, because it was Khay Digital's advice and
   not part of the owner's list. Adding it is one entry in `INCLUDED`.
7. **Where requests go.** No delivery route is set, so the form refuses and offers the other routes.
   Choose the webhook or Resend.
8. **The contact routes.** The phone, WhatsApp, email and hours are Khay Digital's own. Confirm they
   are right for biznes.mu, or give its own.
9. **How a business is paid for and held, and how long the handover takes.** The site says only
   "once you have paid". Whether a deposit holds a business, how payment is taken and how long
   the handover takes are what a buyer asks next; each answer belongs in `FAQS`. Until something
   holds a business, its action is "Ask about this business", not "Reserve".
10. **Help with incorporation.** The site promises help. Whether offering it as a paid service needs
    its own registration was not confirmed; a company secretary or accountant can answer.
11. **The tagline.** "The business is ready / All it needs is its owner" was written by Khay
    Digital. Confirm it or give the line.
12. **The privacy notice.** It is new and describes only what this site does. Approve it.
13. **Analytics.** There are none. If a provider is chosen, the privacy notice must say so.
14. **Sold once, yours once paid, and the care plan.** The site says each business is sold once, to
    one owner; that the brand is the buyer's in full once paid for; and that a Khay Digital care
    plan can follow. The first was proposed to the owner in conversation and built on; the second
    is Khay Digital's rule for a website; the third is its published service. Confirm all three as
    terms of this offer.
15. **The Kreol in the samples' notes.** "Lakrem", "larout", "kaz" and "prop" are glossed in English
    on the samples' pages. A native reading should confirm each before any becomes a real listing.

## The brand

biznes.mu had no earlier material to sample, so its identity was chosen for this build and is
recorded as chosen:

| Token | Value | Where it came from | Use |
| --- | --- | --- | --- |
| `paper` | `#f5f2ea` | Chosen: a warm paper, so six brands' colours can sit on it | The page's ground |
| `paper-quiet` | `#ece7db` | Derived from paper | A quieter panel |
| `ink` | `#131209` | Elaya's ladder, the warm dark | Words; the night ground |
| `ink-muted` | `#5c584b` | Derived from ink | Secondary words |
| `primary` | `#e6b93f` | Chosen: the yellow of a price tag | The one filled action; the platform's own tags |
| `primary-dark` | `#d6a62b` | Derived from primary | The action on hover and press |

Type is Geist for everything and Geist Mono only for what is written on a tag. The signature shapes
are the tag with its punched hole, the rail and its strings, and the ring. Each listing wears its
own two colours and its own lettering, from the data. The design system, with every token and its
contrast: `DESIGN.md`.

## Pages

| Route | What |
| --- | --- |
| `/` | The rail, the ring, the steps, the honest half, the line, the maker |
| `/businesses` | The catalogue, as a ledger |
| `/businesses/[slug]` | One business: its tag, its brand, what it is, what comes with it, what the buyer brings |
| `/how-it-works` | The four steps and the questions |
| `/enquire` | The request form and the direct routes |
| `/privacy` | The privacy notice |
| `/api/enquiry` | The form's endpoint |

Plus `sitemap.xml`, `robots.txt`, `llms.txt`, the icon and the 404.

## Verification

Run on 16 November 2026 against `next start` on port 3100, after the design review's fixes.

- TypeScript strict and the production build: clean. Every page prerendered except `/api/enquiry`.
- `npm run copy` and `npm run tokens`: 0 fail, 0 warn.
- `npm run contrast`: every pair passes for its role (the table is in `DESIGN.md`).
- `npm run screenshots`: eight page kinds at 1440 x 900 and 390 x 844, no horizontal overflow, no
  page errors. The stitched pages are in `review/screens`, and were read.
- `npm run reveals`, with motion on: every reveal fired on every page at both sizes.
- `npm run a11y`: axe-core against WCAG 2.2 A/AA, every page kind at both sizes, clean.
- `npm run behaviour`: 28 of 28. The skip link is first in the tab order; the phone menu opens as a
  dialog, makes the page behind inert, takes focus, closes on Escape and returns focus to its
  button; a business link arrives at the form with that business chosen; the form offers no sample;
  errors are said on their fields and the first takes focus; with no route the form says the request
  has not arrived and gives the phone and email; the endpoint refuses what the form refuses (422),
  refuses a sample, answers a filled honeypot with a quiet success, answers 503 with no route and
  limits the sixth request (429); without script every heading and reveal is visible, the six tags
  are links and the form says how else to reach us; before launch pages carry `noindex`,
  `robots.txt` closes the site, and the sitemap and `llms.txt` list LePalatier and no sample. The
  states it met are saved in `review/screens/states`. Restart the server between runs: the
  endpoint's limit is per connection, per ten minutes.
- `npm run design`: `DESIGN.md` lints with 0 errors and 0 warnings, and its sections check clean.
- The design review by a fresh agent answered "fix", with eight points; its verdict pass on the
  fixes found seven resolved and one partly (LePalatier's price is the owner's to confirm), and five
  small new things, all since fixed. Its word for the build with those done: ship. `STORY.md`,
  "The design review" and "The verdict pass", has each point and what was done.
- Not yet run: a keyboard pass by hand on a real device; a screen reader; Lighthouse; any phone
  hardware; hover and pressed states were written and read in code, not captured. No old addresses
  exist to redirect.

## Known gaps

1. English only. French and Kreol are not built; the routes are not yet under a language folder.
2. The kit's dev-only foundations page was not built. What `DESIGN.md` found in the build and left
   as it is (a tag hangs on paper only; a few states have no design or no instance; some roles are
   declared and unused) is listed under its "Known Gaps".
3. The link preview card is one card for every page; a business has no card of its own.
4. There is no security policy for content (CSP) yet; the other security headers are set in
   `next.config.ts`.
5. The request form has no confirmation email to the visitor.

---

A Digital Experience by **Khay Digital**.
