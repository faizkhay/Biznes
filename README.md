# biznes.mu, the website

A website for biznes.mu, a Khay Digital Ltd project (Mauritius) that sells ready-to-launch
businesses: each with its name and identity, its domain, its website and its strategy, sold to one
owner. One job: turn a visitor into a request about one business.

The offer, the contact details and LePalatier come from the owner and from Khay Digital's own
published facts. The design, the identity of biznes.mu, each listing's look and the copy are Khay
Digital's, made under the owner's carte blanche. This is the second direction: the owner judged the
first ("the rail", 16 November 2026) not good enough, chose "the street" from the directions put to
them on 17 November 2026, and approved its mock-up (`.impeccable/mocks/comp-b-perspective.png`).

The home page is a street. Every business is a finished shopfront on a Mauritian shop street at
blue hour: its sign painted and lit, its shutter down, waiting for its one owner. The street is
built in 3D, in code, and the scroll walks one shopfront, LePalatier, from its sign to the room
behind its shutter, in eight stops. Where the 3D cannot run, the same eight stops are plain
sections, each with a still of the street and its words.

| Stop or section | Where | What it sells |
| --- | --- | --- |
| The street | The whole street at an angle, LePalatier's shutter half raised | What the site is, and where |
| The sign | Up at the sign, under its two lamps | The name and the identity |
| The address | The town plaque and the letterbox on the pier | The domain and the social media names |
| Behind the shutter | The shutter rolls up on a screen on the back wall | The website |
| The counter | The plan on a counter, its cover up | The business strategy |
| The wall | A framed certificate | Help with incorporation |
| The room | Back on the pavement, the room lit | What stays with the buyer: the room is theirs to fill |
| The whole street | The street from further back | Each business is sold once |
| On the street now | Dusk: one terrace of six shopfronts, wall to wall | The businesses themselves |
| From the street to opening day | A saffron wall | How a sale runs, in four steps |
| The line | Dusk | "The sign is painted / The shutter is yours to raise" |
| Questions people ask | Limewash | Nine answers, and who builds every business |

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
| `?no3d` | The street stays a still picture and the walk stays plain sections |
| `?tier=low` or `?tier=high` | Forces the 3D's light tier (low lights the walked shop only) |
| `?debug` | Hands the 3D's clock to a script (`window.__step`), for exact captures |
| `/enquire?business=<slug>` | The request form arrives with that business chosen |

Other scripts:

| Script | What it does |
| --- | --- |
| `npm run wordmarks` | Redraws each listing's lettering as vector outlines into `src/data/wordmarks.ts` |
| `npm run plates` | Cuts the painted sky (`assets/plates/sky.png`) into the two sizes the site ships, graded to the mock-up's sky |
| `npm run stills` | Captures the street at each of the eight stops, for a desk and a phone, and the link preview card (`public/og.png`). Needs the production server on port 3100. Run it after any change to the 3D or to the first screen |
| `npm run copy`, `npm run tokens` | The house style and the token checks |
| `npm run contrast` | Measures every colour pair in `scripts/contrast.pairs.json` |
| `npm run screenshots`, `npm run reveals`, `npm run a11y` | The checks against a production server on port 3100 |
| `npm run behaviour` | The phone menu, the form end to end, the endpoint, the page without script, the walk live and plain, and the machine-facing files, against the same server |

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
| `src/data/pack.ts` | The six things every business comes with, the four steps, what stays with the buyer, the tagline, the questions |
| `src/data/walk.ts` | The eight stops of the walk: where the visitor stands, the heading and the line at each |
| `src/components/three/timeline.ts` | Where the camera stands at each stop, for a desk and for a phone |
| `src/data/wordmarks.ts` | Generated: each listing's lettering as outlines. Never edited by hand |

To add a business: add an entry to `BUSINESSES` in `src/data/businesses.ts`, add its lettering to
`MARKS` in `scripts/make-wordmarks.mjs`, run `npm run wordmarks`, and add its two colours to
`scripts/contrast.pairs.json`. The street, the catalogue, its page, the form, the sitemap, the
structured data and `llms.txt` pick it up. A business without lettering fails the build. The 3D
street draws every business that is for sale, in order; the first is the one the walk goes through.
After a change to the list, run `npm run stills`.

To mark one sold: set its `status` to `"sold"`. It leaves the street, the catalogue, the form and
the sitemap. To hide every price: set `showPrices` to `false`.

### Where it came from

| Source | What it gave |
| --- | --- |
| The owner, in conversation, 15 to 17 November 2026 | The offer and its six parts, LePalatier (a restaurant and café, for Moka, Grand Baie or Tamarin, proposed at 350k), the request for five samples, carte blanche on creative direction, and on 17 November the choice of "the street", of a 3D centrepiece and of mock-up B |
| The approved mock-up, `.impeccable/mocks/comp-b-perspective.png` (generated 17 November 2026; its prompt is beside it) | The composition of the first screen, and the palette: every colour was sampled from it by region (`scripts/sample-comp.mjs`) |
| `assets/plates/sky.png` (generated 17 November 2026; its prompt is beside it) | The sky behind the street. The one generated image the site ships |
| https://www.khay.digital/llms.txt, read 16 November 2026 | Khay Digital's legal name, BRN, founding date, founder, belief, phone, email and hours |
| Open-licence typefaces (SIL OFL 1.1), from `@fontsource` | The outlines of the six wordmarks: Cormorant Garamond, Fredoka, Jost, Playfair Display, Barlow Condensed, Outfit |
| Barlow Condensed (SIL OFL 1.1), in `src/fonts`, and Geist (SIL OFL 1.1), from the `geist` package | The site's own type |

There are no photographs, no testimonials and no figures on the site, because none exist yet. The
street is drawn in code. Its stills (`public/img/walk`) and the link preview card (`public/og.png`)
are captures of this site's own 3D, and the sky is a generated painting; every raster has a sidecar
that says which it is.

Image generation cost 11 Higgsfield credits in all: 8.25 for the three mock-ups the owner chose
from, and 2.75 for the sky.

### To confirm with the owner before launch

1. **The five samples.** Lakrem, Souffle, Bouké, Larout and Kazprop are placeholders: their names,
   looks and prices are invented for this build and marked "Sample". Replace each with a
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
11. **The tagline.** "The sign is painted / The shutter is yours to raise" was written by Khay
    Digital. Confirm it or give the line.
12. **The privacy notice.** It is new and describes only what this site does. Approve it.
13. **Analytics.** There are none. If a provider is chosen, the privacy notice must say so.
14. **Sold once, yours once paid, and the care plan.** The site says each business is sold once, to
    one owner; that the brand is the buyer's in full once paid for; and that a Khay Digital care
    plan can follow. The first was proposed to the owner in conversation and built on; the second
    is Khay Digital's rule for a website; the third is its published service. Confirm all three as
    terms of this offer.
15. **The street as a picture of Mauritius.** The tin roofs, the cut fringe under them (the
    lambrequin) and the enamel plaques are drawn from the island's shop streets as Khay Digital knows
    them, and from the approved mock-up. A local eye should confirm they read as home, not as a
    postcard.
16. **The Kreol in the samples' notes.** "Lakrem", "larout", "kaz" and "prop" are glossed in English
    on the samples' pages. A native reading should confirm each before any becomes a real listing.

## The brand

biznes.mu had no earlier material to sample. Its identity now comes from the mock-up the owner
approved: every colour was measured from it, and each carries its contrast in `DESIGN.md`.

| Token | Value | Where it came from | Use |
| --- | --- | --- | --- |
| `dusk` | `#0e328f` | Sampled: the sky behind the headline | The page's ground |
| `dusk-deep` | `#082478` | Sampled: the navigation band | The header, the footer |
| `saffron` | `#f8c618` | Sampled: the pill buttons | The one filled action; the ground of one whole section |
| `saffron-deep` | `#e3b30d` | Derived from saffron | The action on hover and press |
| `limewash` | `#f7f7f8` | Sampled: the white lettering | Words on dusk; the ground of reading sections |
| `ink` | `#0a1639` | Sampled: the dark text on the pills | Words on saffron and on limewash |
| `haze` | `#b6c0db` | Derived from limewash toward dusk | Secondary words on dusk |
| `coral` | `#f14949` | Sampled: the shade under the headline | The shade under the hero's capitals. Never words |
| `enamel` | `#0b2b8e` | Sampled: the second blue of the mock-up's sky | A plaque's plate, and a card on the walk |

Barlow Condensed speaks the way a painted sign does: headings, plaques, prices. Geist carries every
sentence. The signature shapes are the shopfront with its roller shutter, the enamel plaque, and
the lambrequin, the cut fringe under a tin roof, which hangs wherever one ground gives way to the
next.
Each listing wears its own wall, sign and lettering, from the data. The design system, with every
token and its contrast: `DESIGN.md`.

## Pages

| Route | What |
| --- | --- |
| `/` | The walk along the street, the terrace of businesses, the steps, the line, the questions |
| `/businesses` | The street as a catalogue: six shopfronts |
| `/businesses/[slug]` | One business: its shopfront with the shutter up, its brand, what it is, what comes with it, what the buyer brings |
| `/how-it-works` | The four steps and the questions |
| `/enquire` | The request form and the direct routes |
| `/privacy` | The privacy notice |
| `/api/enquiry` | The form's endpoint |

Plus `sitemap.xml`, `robots.txt`, `llms.txt`, the icon and the 404.

## Verification

Run on 17 November 2026 against `next start` on port 3100, after the design review's fixes. The
machine has no GPU, so the 3D drew on a software renderer: correct, and slow.

- TypeScript strict and the production build: clean. Every page prerendered except `/api/enquiry`.
- `npm run copy`: 0 fail, 0 warn. `npm run tokens`: 0 fail, 1 warn (the one italic, the headline's
  slant, which is the brand's one italic device and is set in a face with a true italic).
- `npm run contrast`: every pair passes for its role (the table is in `DESIGN.md`).
- `npm run screenshots`: nine page kinds (the home page live and plain) at 1440 x 900 and
  390 x 844, no horizontal overflow, no page errors. The stitched pages are in `review/screens`,
  and were read.
- `npm run reveals`, with motion on: every reveal fired on every page at both sizes. The home page
  is given longer per scroll step, because the software renderer is busy there.
- `npm run a11y`: axe-core against WCAG 2.2 A/AA, every page kind at both sizes, clean.
- `npm run behaviour`: 40 of 40. As before: the skip link, the phone menu as a dialog, the form end
  to end, the endpoint (422, 503, 429, the honeypot, no samples), the page without script, and the
  machine-facing files before launch. New for the street: where WebGL runs the walk goes live with
  one canvas, starts at its first stop and reaches its last at the end of the scroll; after a jump
  to the walk's end the stage is never empty (sampled for four seconds); the 3D throws nothing;
  with `?no3d` the walk stays plain, every stop showing its still and its words; without script the
  walk is eight plain sections; with reduced motion on a phone the headline is on the first screen;
  and with motion on, a business's own shopfront keeps its shutter up while a shutter in the
  catalogue rests down and rises when pointed at. The states it met are saved in
  `review/screens/states`. Restart the server between runs: the endpoint's limit is per connection,
  per ten minutes.
- The walk was read at every stop, live, at 1440 x 900 and 390 x 844, and the first screen at
  1024 x 768, 1280 x 720, 1344 x 760, 1366 x 768, 1920 x 1080, 375 x 667 and 768 x 1024: at each
  the words stand clear of the roofs and the street keeps its pavement.
- The first screen was measured against the approved mock-up at the mock-up's own size
  (`.impeccable/review/diff/final`): 51 per cent overall, where the tool asks for 72. So the first
  screen was judged against the mock-up by eye, by an independent reviewer, and not proven by
  measurement. The composition, the palette and the words follow the mock-up; what remains is a
  painting against a street drawn live, and each listing's real lettering on its sign.
  impeccable's plates and hero gates, which expect a raster for a picture region, were not run for
  the street, because the owner chose live 3D.
- Every raster the site ships carries a record of where it came from: 20 of 20 across `public` and
  `assets`.
- An independent design review answered "fix" with eight points, and its verdict pass on the fixes
  scored seven resolved and one partial (the build record, which only the owner's word can close),
  with three regressions the batch had introduced, all since fixed. `STORY.md`, "The design review"
  and "The verdict pass", 17 November 2026, has each point and what was done.
- `npm run design`: `DESIGN.md` lints with 0 errors and 0 warnings, and its sections check clean.
- Not yet run: any real GPU, phone or tablet; frame rate on a device; a keyboard pass by hand on a
  real device; a screen reader; Lighthouse. Hover and pressed states were read in code and, for
  the shutter, measured; they were not captured. No old addresses exist to redirect.

## Known gaps

1. English only. French and Kreol are not built; the routes are not yet under a language folder.
2. The 3D has not been seen on real hardware. Its two light tiers and the step-down in resolution
   are the kit's, proven on other builds, but this street's frame rate on a mid-range phone is
   unmeasured.
3. The stills and the link preview card do not rebuild themselves: after a change to the 3D, the
   first screen or the list of businesses, run `npm run stills`.
4. The camera's frames were solved for a street of six. A longer street still draws, but its far
   end stands small in the first view; the frames would want solving again.
5. The link preview card is one card for every page; a business has no card of its own.
6. There is no security policy for content (CSP) yet; the other security headers are set in
   `next.config.ts`.
7. The request form has no confirmation email to the visitor.
8. What `DESIGN.md` found in the build and left as it is, is listed under its "Known Gaps".

---

A Digital Experience by **Khay Digital**.
