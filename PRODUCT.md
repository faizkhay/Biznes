# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 and Lenis for wheel smoothing: the
Khay Digital house standard, without React Three Fiber, because the home page's street is painted,
not rendered. Every page is
prerendered; one route handler (`/api/enquiry`) takes the request form. English only at launch, at
the root.

## Users

Confirmed by the owner in conversation, 15 and 16 November 2026, unless marked.

1. **A person in Mauritius with money or the will to run a business, and no brand yet.** In the
   owner's words: "people who have the money or can undertake these businesses can just buy". They
   decide on trust and on whether the business in front of them feels real. Objections (Khay
   Digital's reading, not yet tested with buyers): "Is this only a logo?", "What else will I have to
   pay for?", "Will it make money?". Arrive from: social media and word of mouth, knowing little.
2. **A person with a sector in mind who wants to see what is ready.** They scan names, sectors,
   places and prices, and compare.
3. **A person with their own idea**, who wants one built. The form takes this as a request.

The hardest case: someone on a phone, sceptical, who has seen "business in a box" offers that
promised income. The site must be plain about what is and is not sold.

## Product Purpose

**Kind:** Website (KOS, `references/khay.md`): Khay Digital's own project, pages people read. Not a
Khay Original; the reserved vocabulary is not used.

biznes.mu sells ready-to-launch businesses in Mauritius. In the owner's words: "a platform where i
sell ready to launch businesses, i will build the brand, branding, website and purchase domain
names, lock social media handles, have a business strategy, people who have the money or can
undertake these businesses can just buy, i will help with incorporation".

The site exists to turn a visitor into a request about one business: **"Ask about this business"**
(primary, on each business's page), with **"WhatsApp"** and **"Call us"** beside it. "Enquire" is the
one name for the route to the form from anywhere else, and "Send a request" is the form's own
button. A conversion counts when a request arrives, a message is sent or a call is placed.

The action is not called "Reserve": nothing yet says what holds a business or for how long, so the
button says what pressing it does.

## Positioning

Each business is built by Khay Digital and sold once, to one owner. "Biznes" is Mauritian Kreol for
business. No tagline exists yet; the tagline moment's line ("The sign is painted / The shutter is
yours to raise") was written by Khay Digital from the offer and is to confirm (`STORY.md`).

## Operating Context

- **Seller and builder:** Khay Digital Ltd, Mauritius, BRN C22187903, founded June 2020 by Faïz
  Khayrattee (source: https://www.khay.digital/llms.txt, read 16 November 2026).
- **Contact:** +230 5450 8600 (call or WhatsApp), faiz@khay.digital, Monday to Thursday 09:00 to
  19:00, Mauritius time. These are Khay Digital's published routes, used until biznes.mu has its
  own: to confirm.
- **Where requests go:** not yet chosen. Until a route is set the form refuses and offers the other
  routes (README, "Where requests go").
- **Before launch:** the site carries sample listings, so it asks not to be indexed
  (`launched: false` in `src/data/site.ts`).

## Capabilities and Constraints

Every business comes with six things, as the owner listed them: the name and the identity, the
domain name, the social media names, the website, the business strategy, and help with
incorporation.

- **Listings at this build:** LePalatier (the owner's own idea: "a restaurant/cafe, exclusive brand
  look and feel, ideally has a spot in the middle of moka, grand baie or tamarin", proposed at
  350k), and five placeholders the owner asked for ("5 other random for now"): Lakrem, Souffle,
  Bouké, Larout, Kazprop. The five are marked "Sample" wherever they appear: on the shutter, beside
  the name and at the price.
- **Guarantees and terms:** each business is sold once, to one owner (Khay Digital's proposal to the
  owner in conversation, 16 November 2026, built on and to confirm). The brand is the buyer's in
  full on payment (Khay Digital's standing rule for a website: KOS, `references/khay.md`; to
  confirm for this offer). A care plan can follow (Khay Digital's published "Care & Support"
  service). No income is promised. Nothing else is offered as a guarantee.
- **Languages:** English at launch. French and Kreol are a listed gap.
- **Not confirmed, so not stated:** how payment is taken, whether a deposit holds a business, VAT
  on the prices, delivery times, a trademark filing, whether any domain is already held.
- **Flagged rather than featured:** the price of LePalatier (proposed, not final); every sample's
  name, look and price.

## Brand Commitments

biznes.mu is a new brand with no earlier material. The owner gave carte blanche on creative
direction (16 November 2026), judged the first direction not good enough, and on 17 November 2026
chose the second from the directions and mock-ups put to them: "the street", with mock-up B as its
first screen (`.impeccable/mocks/comp-b-perspective.png`). The identity is sampled from that
mock-up: dusk blue, saffron, limewash, a coral shade and enamel blue; Barlow Condensed for anything
painted on a sign and Geist for sentences; the shopfront, the plaque and the lambrequin as the
signature shapes (`DESIGN.md`). Its pictures are painted: generated illustrations in that mock-up's
style, never presented as photographs or as real premises, with every sign left blank for the
listing's own lettering. Each listing's own identity (lettering, colours) is Khay Digital's
first direction. biznes.mu is its own brand; Khay Digital appears as the maker and in the credit, as
on every Khay build: "A Digital Experience by Khay Digital".

## Evidence on Hand

| Source | Read | Gave |
|---|---|---|
| The owner, in conversation | 15 and 16 November 2026 | The offer, the six things, LePalatier and its proposed price, the request for five samples, carte blanche |
| https://www.khay.digital/llms.txt | 16 November 2026 | Khay Digital's legal name, BRN, founding date, founder, belief, phone, email, hours, and its "Care & Support" service |
| KOS, `references/khay.md` | 16 November 2026 | A website is "the client's in full, on payment" |
| DNS for the `.mu` zone | 16 November 2026 | None of lepalatier.mu, lakrem.mu, souffle.mu, bouke.mu, larout.mu or kazprop.mu resolved; no claim is made on the site |
| The approved mock-up, `.impeccable/mocks/comp-b-perspective.png` | 17 November 2026 | The first screen's composition and the palette, sampled by region |
| Six painted plates, `assets/plates` | 17 November 2026 | Every picture of the street: generated illustrations in the approved mock-up's style, each with its prompt and its record beside it, each painted with its signs and plaques blank |

Absent, and not fabricated: photographs, premises, testimonials, sales figures, a logo for
biznes.mu from before this build, confirmed prices for the samples.

## Product Principles

1. **The businesses are the proof.** The first thing a visitor sees is what is for sale: a street
   of finished shopfronts, each in its own colours, not a claim about them.
2. **Say what is not sold.** Premises, licences, stock, staff and income are named as the buyer's,
   before the ask, because the hardest visitor has been promised too much before.
3. **One business, one owner, one action.** Each business's page ends on asking about that
   business.
4. **A sample can never pass for an offer.** It is marked on its shutter, beside its name and at
   its price, and kept out of everything a machine reads.
5. **A phone, in a hurry, decides.** Call and WhatsApp are within reach on every page.

## Accessibility & Inclusion

WCAG 2.2 AA, the Khay standard: keyboard access, visible focus, reduced-motion support, no
horizontal overflow at 390px, and a page that is whole without script. The painted stage is an
addition to a page that is already complete: without script or under `?plain`, every stop of the
walk is a plain section with a still and its words, and under reduced motion the stage cuts instead
of travelling. The paintings are decoration to assistive technology: every name, town and "Sample"
on them is also in the page's own text.
