# Story

## North Star

**"The street"**: every business is a finished shopfront on one street at blue hour, its sign
painted and lit and its shutter down; the visitor walks one shop from its sign to the room behind
its shutter, and the shop they choose leaves the street for good.

## Why this story, for this brand

What biznes.mu sells is finished businesses waiting for an owner, each sold once. A shopfront with
its shutter down is that fact made visible: everything a passer-by can see is done, and the one
thing missing is the person with the key. It is the pattern KOS calls the place with rooms, at the
size of a street: one shop per offer.

The image carries every part of the offer, each where it lives on a shop. The name and the identity
are the sign. The domain and the social media names are the address: the plaque and the letterbox.
The website is on the wall behind the shutter. The strategy is on the counter. The company is the
certificate in its frame. What the buyer brings is the room itself, lit and waiting. A sold business
is a gap in the street (the 404 uses this: "No shop at this address").

The competitor test, against the nearest rival. A shop of ready-made brand names (BrandBucket,
Atom) shows each brand in its own colours, priced and sold once. It cannot show a street, because
it sells names, not businesses: nothing there has a front door, a town, a website on the wall or a
plan on the counter. A marketplace of going concerns can show premises, but not ones built by one
maker and sold new. What only this brand can put on the page: a Mauritian shop street, with its tin
roofs, its cut fringes and its enamel plaques; a town on each pier (Moka, Grand Baie, Tamarin); six
things that come with every shop; and one maker for all of them.

Things that are this brand's and no one else's, which the build draws on: the word "biznes"
(Kreol); the `.mu` address; one owner per business; the six things; Khay Digital as the maker of
every one; prices in rupees; the towns a business is meant for; the plain split between the front,
which is built, and the room, which is the buyer's.

Decided with the owner on 17 November 2026: the direction ("the street", from seven put to them),
a 3D centrepiece with a flat fallback, biznes.mu's own identity with Khay Digital as maker only,
mock-up B ("perspective") as the first screen, and the street built in code with one generated
image, the sky.

## Three beats

1. The street at dusk
2. Behind the shutter
3. Yours to open

## The person, and the action

Told to a person in Mauritius who could run a business and has no brand yet (PRODUCT.md, Users).
The home page's action is **See the businesses**; a business's page ends on **Ask about this
business**.

## Chapters

The home page opens on a stage: the street in 3D, pinned under the header, with the scroll walking
the camera from stop to stop. Each stop is a screen of scroll with its words in a card. The stops
are data (`src/data/walk.ts`); where the camera stands is `src/components/three/timeline.ts`.

| # | Marker | Where in the world | What the visitor sees and does | Sells | Words | Action |
|---|---|---|---|---|---|---|
| 0 | The street | the pavement, looking down the row | Six shopfronts at an angle; LePalatier nearest, its shutter half raised over a lit room; the headline across the sky | what the site is, and where | Khay Digital's, from the owner's description | See the businesses |
| 1 | The sign | up at the sign | The board, its lettering, its two lamps | the name and the identity | the owner's list | none |
| 2 | The address | the pier | The town's enamel plaque and the letterbox under it | the domain and the social media names | the owner's list | none |
| 3 | Behind the shutter | the doorway | The shutter rolls all the way up; a screen on the back wall in the brand's colours | the website | the owner's list | none |
| 4 | The counter | inside | A folder on a counter | the business strategy | the owner's list | none |
| 5 | The wall | inside | A certificate in a frame | help with incorporation | the owner's list | none |
| 6 | The room | back on the pavement | The room, lit, with everything else still to come | honesty: what is not sold, and no promise of income | Khay Digital's | none |
| 7 | The whole street | further back | The row from its far side, one room lit | each business is sold once | Khay Digital's | See the businesses |
| 8 | On the street now | a limewashed wall | Six shopfronts, each a link; a shutter rolls up when one is pointed at | the businesses themselves | names, sectors, towns and prices from the data | open a business |
| 9 | From the street to opening day | a saffron wall | Four numbered steps | how a sale runs | Khay Digital's | How it works |
| 10 | the line | dusk | The tagline, lighting word by word | the idea in one line | Khay Digital's, to confirm | none |
| 11 | Questions people ask | a limewashed wall | Nine questions, and who builds every business | the objections, answered; trust in the maker | Khay Digital's, with its published facts | Visit Khay Digital |
| end | deep dusk | the last page | The invitation that fits the page just read, then every way to reach us | the invitation | | by page: see below |

A business's own page tells the same story for one shop: its shopfront with the shutter up, its
plaques (number, status, towns), its brand on limewash with its paints, what it is, what comes with
it beside what the buyer brings on saffron, the next shop on the street, then the one action.

The closing band at the head of the footer takes its action from the page: a real business's page
ends on asking about that business; the catalogue ends on the route to the form; Enquire and the
404 have no band; every other page ends on the businesses.

## The centrepiece

The street, in React Three Fiber, built in code: every shop is a few boxes and planes from the same
measurements, painted in its business's own colours, with its own lettering on its sign (the same
outline the pages draw, from `scripts/make-wordmarks.mjs`). Each shop stands a little taller or
shorter than its neighbour under its own tin roof. Nothing is a downloaded model. The one image
that is not drawn in code is the sky, a generated painting (`assets/plates/sky.png`).

The opening and closing frames were solved against the approved mock-up's layout, not placed by
eye: the camera stands low and the picture is shifted down, as an architectural photograph is, so
the walls stay upright.

## Play

Any shutter can be raised or lowered by hand: a tap or a click on a shop rolls it. On the flat
shopfronts further down, a shutter rolls up when its card is pointed at or focused. Neither carries
anything a visitor needs.

## Reduced motion and no WebGL

The page is whole before the 3D runs. As prerendered, every stop is a plain section: a still of the
street at that stop (a capture of this site's own 3D, `npm run stills`) and its words. Only where
the canvas can run does the street pin and the scroll walk it. Without WebGL, without script, or
with `?no3d`, the plain sections stay. Under reduced motion the camera cuts from stop to stop
instead of travelling, shutters cut, reveals are simply there and the tagline is fully lit.

Two tiers: a wide screen lights every sign and every room; a narrow screen, a slow device or
`?tier=low` lights the walked shop only and loads the smaller sky. The canvas draws only when
something moves, pauses off screen, and steps its resolution down before its frame rate.

## After the story

The home page is the story. The catalogue (`/businesses`) is the same street as six shopfronts.
How it works carries the four steps and the questions. Enquire carries the form and the direct
routes.

## The tagline moment

**"The sign is painted / The shutter is yours to raise"** (written by Khay Digital from the offer,
17 November 2026; to confirm with the owner), after the steps and before the questions.

## Signature details

1. **The shopfront and its shutter**: a roof, a fringe, a sign, a roller shutter. Every business,
   the logo, the favicon. The shutter rolling up is the brand's one movement.
2. **The plaque**: a blue enamel street plate with a white rim. It names what is fixed about a
   business: its number, its town, whether it is a sample.
3. **The lambrequin**: the cut fringe under a creole tin roof. It edges the saffron section and
   the footer, and hangs from every eave on the street.
4. **Sign painter's capitals**: Barlow Condensed, and in the headline only, slanted with a hard
   coral shade.
5. **One saffron**: the colour of the action, and of one whole wall.

## Rounds

### Round 0, 16 November 2026: the first build

The owner's notes, in their own words: "Build me a website for biznes.mu for the project that we
have , mock product can be lepalatier and 5 other random for now. Use /kos for biznes.mu build -
you've complete carte blance for creative direction". And: "I have 1 business idea so far,
LePalatier.mu a restaurant/cafe, exclusive brand look and feel, ideally has a spot in the middle of
moka, grand baie or tamarin. We can sell for 350k right?"

What was done: the site as described above, eight page kinds, with LePalatier and five samples.

Departures, with reasons:

- The five samples carry names, looks and prices, as asked, but each is marked "Sample listing" on
  its tag and its page, and is kept out of the sitemap, the structured data and `llms.txt`. KOS
  does not ship an invention that could pass for a fact.
- No domain is printed for any business, LePalatier included: none of the six `.mu` names resolved
  on 16 November 2026, so the site does not say they are held.
- A trademark filing is not listed among what comes with a business. It was Khay Digital's advice,
  not part of the owner's list. Adding it is one entry in `src/data/pack.ts`.
- The whole site asks not to be indexed until `launched` is set to true.

### The design review, 16 November 2026

A fresh agent reviewed the first build against KOS and answered **fix**, with eight points. What was
done about each:

1. **A sample could pass for an offer.** The link preview card now marks every sample; a sample row
   prints no status; a sample's price is set quietly as "a placeholder" on the rail, in the
   catalogue and on its page; the note about samples now sits above the rail. Resolved.
2. **One action had four names, and "Reserve" promised a hold nobody has confirmed.** A business's
   page now offers "Ask about this business"; "Enquire" is the one name for the route to the form;
   "Send a request" is only the form's button; step 2 is "Ask". Resolved.
3. **The closing band was the same on every page.** It now takes its action from the page. Resolved.
4. **On a phone the quick routes were out of reach.** WhatsApp sits in the phone header; the direct
   routes come before the form; a business's page offers "Call us"; catalogue rows show the place.
   Resolved.
5. **Claims with no recorded source.** "We meet" is gone. "Sold once", "yours in full once you have
   paid" and the care plan now carry their sources in `src/data/pack.ts` and `PRODUCT.md`, and are
   on the confirm list. The night chapter lists all six things. LePalatier's price is still shown as
   the owner proposed it, with its confirmation and VAT a launch blocker on the confirm list.
   Partly resolved: the price is the owner's to confirm.
6. **How it works repeated the home page.** It now carries the steps and the questions only.
   Resolved; it grows as the owner answers what a buyer asks next.
7. **The punched hole held nothing.** Every string now runs down its tag and through the hole; the
   ring's strings end in their holes; a business's own tag hangs from a rail. Resolved.
8. **The first view failed the nearer competitor test.** Mauritius opens the lede, each tag's
   caption names its place, the heading breaks where the thought breaks, and the test above is
   rewritten against the nearer rival. Resolved.

Also from the review: disabled states for the quiet button, chips and fields; a ring on the Enquire
pill when on that page; step numbers moved out of Geist Mono; the capture script no longer hides a
strip under the sticky header; the open menu, the form's refusal and the page without script are
saved in `review/screens/states`.

### The verdict pass, 16 November 2026

The same reviewer read the recaptured pages: seven of the eight resolved, the fifth partial and the
owner's to close (LePalatier's price). It answered "fix" once more, for five small things the batch
had left or broken, and said that with them done the build ships with no further full review:

1. The 404's hook had lost its string. It has one again.
2. The open menu was captured mid-entrance. It is now captured at rest, with every page and both
   routes in view.
3. The form still offered the five samples. Neither the form nor the endpoint offers a sample now.
4. "MUR 280,000, a placeholder" broke mid-phrase in narrow columns. A sample's price is now the
   figure alone on the rail, and two short lines in the catalogue.
5. The phone's first screen showed less of the rail. The note is one sentence, the lede is shorter,
   and the strings are shorter on a phone, so LePalatier's whole tag is in the first screen.

From the agent that recorded `DESIGN.md`: the skip link's ring now takes the page's ink (the yellow
measured 1.65:1 on paper); the phone menu's links arrive within 400ms; without script the form says
how else to reach us; a field's error and the credit's name each take a named text style; the ring's
numbers stay above 12px on a 360px screen. What it found and was left as it is, is in `DESIGN.md`,
"Known Gaps".

### Round 1, 17 November 2026: the street

The owner's note on the first build, in their own words: "cmon, can be better, use
/anthropic-skills:impeccable /design:ux-copy /anthropic-skills:landing-page-strategy our own khay
system please".

What was decided with the owner, in two rounds of choices: the direction "the street" (over six
others, the rail's successor "the quay" among them); "a 3D centrepiece"; biznes.mu as its own brand,
built to KOS, with Khay Digital as maker and in the credit only; mock-ups generated sparingly ("dont
use too many credits please"); then mock-up B, "perspective", over an elevation and a single shop;
and "3D plus a painted sky" as the way to build it.

What was done: the whole site rebuilt in the new world. The home page became the walk (eight stops
over a 3D street); the identity was re-sampled from the approved mock-up (dusk, saffron, limewash,
coral, enamel; Barlow Condensed for signs); the rail, the tags and the ring were removed; every page
was redrawn with shopfronts, plaques and lambrequins; the copy was rewritten around the shop (the
sign, the address, the counter, the wall, the room); the 404 became "No shop at this address".

The page plan follows a long-form story, because the visitor has to be shown that a whole business
is for sale before they believe it: the street, the six things one by one, the plain statement of
what stays with the buyer, the businesses, the four steps, the line, then the objections as
questions with the maker's facts beside them, and the same action at the end as at the top.

Departures, with reasons:

- **The street is live 3D, not a painted plate.** The owner chose it. impeccable's plates and hero
  pixel gates compare a build with its mock-up region by region and expect a raster for a picture
  region; with the street drawn live they could not be passed and were not forced. The mock-up
  stayed the composition and critique reference; the measured comparison is in
  `.impeccable/review/diff/final`.
- **The signs carry each listing's real lettering**, not the mock-up's. The mock-up drew its own
  letters; the site uses the outlines the listing pages use, so a sign and its page cannot disagree.
- **The lit room is not empty.** The mock-up's room is bare. The build puts a screen, a counter
  with a folder and a framed certificate in LePalatier's room, so the website, the strategy and the
  company each have somewhere to be shown. Everything else in the room is left out.
- **Samples are marked on the street itself**: a white "Sample" tag on each sample's shutter, a
  "Sample" plaque beside its name, and its price called a placeholder.
- The whole site still asks not to be indexed until `launched` is set to true.
