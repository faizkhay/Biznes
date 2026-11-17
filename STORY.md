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
a scroll-driven centrepiece with a flat fallback, biznes.mu's own identity with Khay Digital as maker only,
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

The home page opens on a stage: the painted street, pinned under the header, with the scroll moving
through the paintings from stop to stop. Each stop is a screen of scroll with its words on an
enamel plaque the size of a notice. A column of marks at the stage's edge shows where the walk is
and jumps along it, and on a wide desk a small pill at the foot of the first screen leads into it.
The stops are data (`src/data/walk.ts`); what the stage shows at each is
`src/components/stage/views.ts`.

| # | Marker | Where in the world | What the visitor sees and does | Sells | Words | Action |
|---|---|---|---|---|---|---|
| 0 | The street | the pavement, looking down the row | The painted street at an angle: six shopfronts, LePalatier nearest, its shutter raised over a lit, empty room; the headline across the sky, above the roofs; the lamps come on down the street as it arrives | what the site is, and where | Khay Digital's, from the owner's description | See the businesses |
| 1 | The sign | up at the sign | The stage pushes in on the same painting: the board, its lettering, its two lamps | the name and the identity | the owner's list | none |
| 2 | The address | the pier | The stage turns to the shop face-on, a second painting, arriving through the first: the town's enamel plaque and the letterbox under it | the domain and the social media names | the owner's list | none |
| 3 | Behind the shutter | the doorway | The painted shutter rolls all the way up; a screen on the back wall in the brand's colours | the website | the owner's list | none |
| 4 | The counter | inside, close | A third painting: the plan as a bound document on the counter, the business's lettering and "Business strategy" on its cover | the business strategy | the owner's list | none |
| 5 | The wall | inside, close | A fourth painting: a frame on the wall, its paper blank, because the company is the owner's to register | help with incorporation | the owner's list | none |
| 6 | The room | back on the pavement | The shop whole, face-on: the room lit, with everything else still to come | honesty: what is not sold, and no promise of income | Khay Digital's | none |
| 7 | The whole street | further along the street | Back on the first painting, at its far end: the five shops beyond the first, each lettered, numbered and tagged, the lamp and the afterglow | each business is sold once | Khay Digital's | See the businesses |
| 8 | On the street now | dusk, the street itself | A fifth painting: the terrace of all six shopfronts front-on, whole, each shop a link with its facts on plaques beneath it; LePalatier's shutter rolls up when it is pointed at; on a phone the terrace scrolls sideways | the businesses themselves | names, sectors, towns and prices from the data | open a business |
| 9 | From the street to opening day | a saffron wall | Four numbered steps | how a sale runs | Khay Digital's | How it works |
| 10 | the line | dusk | The tagline, lighting word by word | the idea in one line | Khay Digital's, to confirm | none |
| 11 | Questions people ask | a limewashed wall | Nine questions, and who builds every business | the objections, answered; trust in the maker | Khay Digital's, with its published facts | Visit Khay Digital |
| end | deep dusk | the last page | The invitation that fits the page just read, then every way to reach us | the invitation | | by page: see below |

A business's own page tells the same story for one shop: its painted shopfront (a real business's
stands open on its own plate, its room lit; a sample's stays shut and tagged), its plaques (number,
status, towns), its brand on limewash with its paints, what it is, what comes with it beside what
the buyer brings on saffron, the next shop on the street, then the one action.

The closing band at the head of the footer takes its action from the page: a real business's page
ends on asking about that business; the catalogue ends on the route to the form; Enquire and the
404 have no band; every other page ends on the businesses.

## The centrepiece

The street, painted. Five plates (`assets/plates`), each a generated illustration in the style of
the mock-up the owner approved, with its prompt and its record beside it: the street at an angle,
the first shop face-on with its shutter up and its room lit, a close view of the plan on the
counter, a close view of the certificate's frame, and the terrace of all six shops.

A painting can say something untrue, so the paintings say nothing. Every sign board, plaque, screen
and paper was painted blank, and what is true is set over the paint in code, from the data: each
listing's own lettering on its board (the same outline its page draws, from
`scripts/make-wordmarks.mjs`), its town or its number on its plaque, a tag on each sample's
shutter. What the data cannot say stays blank: the certificate's paper, and the screen but for the
business's name. On the
angled street each board's four corners were measured (`scripts/measure-plates.mjs`), and the
lettering is carried onto them by one projective transform, so it lies on the paint as if painted.

The stage (`src/components/stage`) moves the paintings with the scroll: a push in, a pan, and
between two paintings a dissolve made on the move. The first shop's shutter is its own painted
shutter, and it rolls up as the walk reaches the room. Nothing is WebGL.

The first screen follows the approved mock-up: the street fills the screen from its foot and its
right edge, and the first words are set at the mock-up's own measure in the sky above the roofs. A
float in the words' column carries the painted roofline as its shape, so no line runs into a roof
on a screen of any shape, and the sentences end above the afterglow, where white would not read.

## Play

On the painted shopfronts, in the terrace and in the catalogue, a real business's shutter rolls up
over its lit room when its shop is pointed at or focused. A sample's shutter never moves: it is not
for sale, and it stays shut and tagged. The lamps come on down the street, once, as the page
arrives. None of it carries anything a visitor needs.

## Reduced motion and no script

The page is whole before the stage runs. As prerendered, every stop is a plain section: a still of
the stage at that stop (a capture of this site's own stage, `npm run stills`) and its words. Only
where script runs does the street pin and the scroll move through it. Without script, or with
`?plain`, the plain sections stay. Under reduced motion the stage cuts from stop to stop instead of
travelling, the shutter cuts, the lamps are simply lit, reveals are simply there and the tagline is
fully lit.

The first painting is shown as soon as it has decoded, over the still, and the still goes only when
the painting has finished arriving, so the stage is never empty. The other paintings load after it.

## After the story

The home page is the story. The catalogue (`/businesses`) is the same businesses as a list to
compare, on limewash.
How it works carries the four steps and the questions. Enquire carries the form and the direct
routes.

## The tagline moment

**"The sign is painted / The shutter is yours to raise"** (written by Khay Digital from the offer,
17 November 2026; to confirm with the owner), after the steps and before the questions.

## Signature details

1. **The shopfront and its shutter**: a roof, a fringe, a sign, a roller shutter. Every business
   is painted as one; the logo and the favicon draw it. The shutter rolling up is the brand's one
   movement.
2. **The plaque**: a blue enamel street plate with a white rim. It names what is fixed about a
   business: its number, its town, whether it is a sample.
3. **The lambrequin**: the cut fringe under a creole tin roof. It is painted under every eave on
   the street, and drawn as one pierced scallop on the page wherever one ground gives way to the
   next.
4. **Sign painter's capitals**: Barlow Condensed. The headline is slanted, the only slant on the
   site; it and the tagline carry the painter's hard coral shade.
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

### The design review, 17 November 2026

A fresh agent reviewed the build against the owner's brief, the direction contract and the approved
mock-up, and answered **fix**: the composition held, the finish did not. Its eight points, and what
was done about each:

1. **No light.** The lamps were unlit cones and nothing glowed. Every sign now has two gooseneck
   lamps with a glow and a pool down the wall, on every tier; a raised shutter throws the room's
   light across the paving; the street lamp at the far end is lit.
2. **Lilac shutters, barely open.** The shutters are dark steel with a lit lip on each slat, and the
   first shop's shutter is raised past half, so the lit room is the brightest thing on the first
   screen. The counter moved to the side wall, out of the doorway.
3. **Dead planes at the edges.** The first screen ends on the first shop's pier at any width. The
   road is tar and the pavement is stone slabs. The far end has its lamp, its wire to the last roof,
   a basalt wall and three palms; the near end's wall is basalt too. On a phone the first screen
   shows three shopfronts. The sky's afterglow now stands on the horizon; it had been under it.
4. **"On the street now" was the card grid the contract refuses.** It is one terrace on the dusk
   ground: shop touching shop under one roofline, facts on plaques beneath, scrolling sideways on a
   phone.
5. **Three stops did not show their subject.** The strategy is a document with its cover up; the
   closing view brings the terrace across two thirds of the screen; the address stop frames the
   pier, its plaque and its letterbox, square on.
6. **A small label sat above every card's heading.** Removed, live and in the fallback. A stop's
   name now shows beside its mark when the mark is pointed at or focused.
7. **An empty stage after a jump to the walk's end.** A real fault: the still was removed on a
   clock, and on a slow machine the canvas had not finished fading in. The still now goes only when
   the canvas has arrived, and the behaviour test samples the stage for four seconds after a jump.
8. **The build record.** impeccable's raster gates stay open for the street: they cannot be passed
   by a street drawn live, and the tool accepts an override only with the owner's own words
   downgrading the mock-up, which the owner did not say. The record is left as it is, the surface
   brief says why, and the first screen is reported as judged by eye, not proven by measurement.

Also from the review's notes: the cards on the walk are enamel plaques with a white rim; the
headline's shade is thicker and the tagline carries it too; one scallop for every roof line, on the
page and on the street, and one more at the head of the questions; a quiet pill at the foot of the
first screen leads into the walk; the room stop no longer cuts a sample's tag.

From the agent that recorded `DESIGN.md`, which measured the build as it wrote: a drawn shopfront
inside a reveal could not raise its shutter with motion on, so a business's own shopfront ended
shut (fixed, and now tested); the stop marks measured 1.5:1 over the lit room (they now stand on
their own strip of deep dusk); the canvas drew thirty frames a second at rest for a scene with
nothing idle (it now draws nothing at rest); a sample's tag hid when its shutter was raised by hand
(it now stays); three changes of ground had no roof line and the footer's was always dusk (each
now hangs from the ground above it); a roof tip reached the words at 1024 x 768 (the street now
moves down on a narrow or short screen). What it found and was left as it is, is in `DESIGN.md`,
"Known Gaps".

### The verdict pass, 17 November 2026

The same reviewer read the recaptured pages and scored the eight: seven resolved, the eighth partial
(the build record, which only the owner's word can close). It answered "fix" once more, for what the
batch itself had broken:

1. **Short screens cut the street off at the knees.** To keep the words clear of the roofs, the
   batch had moved the picture down on a short stage, and the pavement and the lit room went out of
   frame at 1344 x 760, 1366 x 768, 1024 x 768 and 375 x 667. The camera now draws back about the
   first shop's corner instead (`fit`, in `timeline.ts`), so the street gets smaller under the words
   and keeps its pavement at every size.
2. **The far lamp's glow drew as a streak.** Each glow now turns to face the visitor, so it is round
   from any side.
3. **The town plaque was cut by the right edge.** The plaque and the letterbox moved in from the
   pier's edge, and the corner stays just outside the frame, on a desk and on a phone.

Also: the way into the walk shows only on a wide desk, where the foot of the first screen is open
road; the room stop frames the first shop alone, so its card cuts no sample's tag; the footer's roof
line takes the colour of the ground above it on a business's page too.

The second verdict pass scored all three resolved, the first seven still resolved, and nothing
material broken by the batch. It noted two trades, both minor: below 1200px nothing at the foot of
the first screen says the page scrolls, and on a short screen the street is smaller than in the
mock-up, the price of keeping its pavement. One untidiness stays: at the address stop on a desk a
sliver of the wall screen shows round the card.

The reviewer's word is still "fix", and it names an open record, not an open fault on the page: the
eighth point closes only when the owner, told that the first screen was judged by eye against the
mock-up and never proven by measurement (51 per cent where the tool asks for 72), either accepts
that on the record or asks for a raster proof. Until then impeccable's plates and hero phases stand
open in `.impeccable/build/state.json`. The whole review is in
`.impeccable/review/finish-review.md`.

### Round 2, 17 November 2026: the street, painted

The owner's note on the 3D street, in their own words: "3d is shit, i need better aesthetic
please. be creative while relfecting khay standards."

What was wrong: the street had been built as live 3D in code, lit and textured by hand in a
browser. It held the mock-up's composition and none of its light: flat planes, plain surfaces, a
measured likeness to the approved mock-up of about half. Two rounds of review had improved it and
not changed what it was.

What was decided, with reasons written down because the owner was away: keep the direction and the
story, which the owner had chosen and not questioned, and replace the medium. The mock-up the owner
approved is a painting, so the street is painted. Khay's standards shaped how:

- **Nothing invented.** A generated picture cannot be trusted with words, so every plate was
  painted with its boards, plaques, screens and papers blank, and each listing's real lettering,
  its town and the samples' tags are set over the paint in code, from the data.
- **Not presented as real.** The pictures are illustrations, said in every file's record and in
  the footer of every page, with the fact that matters beside it: a business comes without
  premises.
- **Complete without script, and under reduced motion.** The same eight plain sections, with
  stills of the stage; cuts instead of travel.
- **Measured, not assumed.** Each blank was located on its plate by measurement; white words on
  the painted sky were measured before the first screen's words were placed; the first screen was
  read at fifteen sizes.
- **Light to run.** three.js and React Three Fiber are gone; the stage is five images and one
  transform each.

What was done: five plates generated (18.25 credits, on top of the 11 already spent); the stage
rebuilt to move through them; the first words set to the mock-up's own measure and shaped to the
painted roofline; every shopfront on the site (terrace, catalogue, each business's page) replaced
by its painted one; the lamps switching on as the street arrives; the 3D, its engine and its code
removed.

Departures, with reasons:

- **Six shops are painted, so the street shows six.** A listing beyond them is drawn in code where
  it is shown by itself, until the street is repainted.
- **The header is the site's own**, 72px with 44px targets, where the mock-up drew a thinner one.
- **The first words keep above the roofs.** The mock-up let its lede touch a roof; the build shapes
  every line to the roofline and steps the headline down where the sky is small.
- **The room is not empty on the shop's own plate.** As before, a screen, a counter with the plan
  and a framed certificate give the website, the strategy and the company somewhere to be shown.
  On the street itself the room is empty, as in the mock-up.

Measured against the approved mock-up at its own size, the first screen went from 51 per cent to
72, and the street itself to 76. impeccable's plates gate, which a street drawn live could not
pass, passes. Its first-screen gate asks for 72, which is met, and still refuses, because it looks
for the plate's own file in the page's source and the site ships the plate as WebP cut from it. No
override was made; the phase stays open.

### The design review, painted street, 17 November 2026

A fresh agent reviewed the painted build against the owner's words, the direction contract and the
approved mock-up. On the two questions that mattered it found for the build: the painted first
screen reproduces the approved picture in medium, composition, light and lettering, and the site is
honest. It answered **fix** for what stood around the paintings. Its eight points, and what was
done:

1. **The headline's size was unstable.** One screen size could show it at two sizes. The cause,
   measured by the agent recording `DESIGN.md`: under reduced motion every transition is cut to a
   hundredth of a millisecond, not removed, so a size the stage set did not read back in the same
   moment and the fit measured the step before. Nothing in the words transitions while they are
   being fitted now, and the fit is the same with motion on and reduced, at eight sizes. The words
   are also fitted again once the fonts are in.
2. **The walk's rail lay over the town's plaque.** The rail is now a row of marks at the foot of
   the stage, where nothing lettered is painted.
3. **Blank plaques stood on the samples' piers.** Each now carries its listing's number, from the
   data, as a house carries its number; the first shop's larger plaque keeps its town.
4. **The line saying the pictures are illustrations was newer than every capture.** Rebuilt, every
   check run again, every page recaptured.
5. **A shop cut out for a card held slivers of its neighbours and a cut plaque.** The piers of the
   painted terrace stand on its party walls, so no straight cut holds a shop and its piers and
   nothing else. A shop by itself is now cut inside its piers: all its own wall, its plaque whole.
   The home page's terrace is the painting itself, whole, drawn once. The shutter that rolls up on
   the first shop's plate lost its bottom rail, whose small painted locks read as smudges.
6. **Grey bars stood in for content.** The certificate's ruled lines and seal are gone: its paper
   is blank, as painted. The screen shows the business's lettering and nothing else.
7. **The terrace filled two screens in a row.** The walk no longer ends on it. Its last stop is the
   far end of the painted street, and the terrace is the next section.
8. **The build record.** The first-screen gate was run again, as above.

Also from its notes: the first shop's lettering stands larger on its board; a sample's price keeps
to two whole lines; the room stop's card stands on the pier's base, clear of the room.

VERDICT_PAINTED
