# Story

## North Star

**"The rail"**: every business hangs ready on one rail, as a tag in its own colours and lettering;
the visitor walks the rail, takes one down, and it leaves the rail for good.

## Why this story, for this brand

What biznes.mu sells is finished things waiting for an owner, each sold once. A rail of tags is that
fact made visible: a tag is how something for sale is named and priced, a rail shows the whole
stock at a glance, and an empty hook is what "sold once" looks like. It is the pattern KOS calls
the place with rooms, at the size of a shop: one hook per offer.

The image carries every part of the offer. A business is a tag. What comes with it hangs on one
ring. The sale is the walk from the rail to opening day. A sold business is a hook with nothing on
it (the 404 uses this).

The competitor test, against the nearest rival. A shop of ready-made brand names (BrandBucket,
Atom) also shows each brand in its own colours and lettering, priced and sold once, so the rail
alone is the category's image, not this brand's. What that shop cannot say is what the build now
puts in front of the rail and under every tag: this is Mauritius; each business is made for a place
on the island (Moka, Grand Baie or Tamarin); it comes as six things, with a website, a strategy and
help setting up the company, not as a name; and one maker builds every one. The first design review
(16 November 2026) made this test; the first draft had tested only the easier rival, a marketplace
of going concerns.

Things that are this brand's and no one else's, which the build draws on: the word "biznes"
(Kreol); the `.mu` address; one owner per business; the six things on the ring; Khay Digital as the
maker of every one; prices in rupees; the places a business is meant for (Moka, Grand Baie,
Tamarin); the honest split between what is prepared and what the buyer brings.

Decided with the owner away from the keyboard: the owner gave carte blanche on creative direction
on 16 November 2026, so the plan was written here and built, to be changed in rounds.

## Three beats

1. On the rail
2. Everything on one ring
3. Yours to open

## The person, and the action

Told to a person in Mauritius who could run a business and has no brand yet (PRODUCT.md, Users).
It ends on one action: **Ask about this business**.

## Chapters

This is a website, not an Original: the chapters are plain sections, and there is no stage.

| # | Marker | Where in the world | What the visitor sees and does | Sells | Words | Action |
|---|---|---|---|---|---|---|
| 0 | the headline | in front of the rail | "Buy a business / ready to launch", and "In Mauritius" opening the lede | what the site is, and where | Khay Digital's, from the owner's description | See the businesses |
| 1 | No. 01 to 06 | the rail | Six tags, each hanging by its string through its hole, each a link; they stir once as the page opens | the businesses themselves | names, sectors, places and prices from the data | open a business |
| 2 | 01 to 06 | the ring | A ring with six small tags, beside the six things in a list | what every business comes with | the owner's list | none |
| 3 | Step 1 to 4 | from the rail to the door | Four steps hanging from one rail | how a sale runs | Khay Digital's | How it works |
| 4 | night | behind the door | "A brand is not a business until someone runs it", and two lists | honesty: what is not sold | Khay Digital's | none |
| 5 | the line | open ground | The tagline, lighting word by word | the idea in one line | Khay Digital's, to confirm | none |
| 6 | the maker | the workshop | Who builds every business | trust in the maker | Khay Digital's published facts | Visit Khay Digital |
| end | night | the last page | The invitation that fits the page just read, then every way to reach us | the invitation | | by page: see below |

A business's own page tells the same story for one tag: the tag at full size, hanging from its own
rail, its brand in its own colours, what it is, what comes with it beside what the buyer brings,
then the one action.

The closing band at the head of the footer takes its action from the page: a real business's page
ends on asking about that business; the catalogue ends on the route to the form; Enquire and the
404 have no band; every other page ends on the businesses.

## The centrepiece

None in 3D. The rail of tags is the centrepiece, drawn in HTML, CSS and SVG: each tag wears its
business's ground and ink from the data, and its lettering is vector outlines made by
`scripts/make-wordmarks.mjs` from open-licence faces.

## Play

A tag swings a few degrees from its string when pointed at or focused. It carries nothing a visitor
needs, and is still under reduced motion.

## Reduced motion and no WebGL

There is no WebGL. Under reduced motion the tags hang still, the ring is already drawn, reveals are
simply there and the tagline is fully lit. Without script the page is the same page: every word is
visible by default and every tag is a link.

## After the story

The home page is the story. The catalogue (`/businesses`) is the ledger of the same businesses.
How it works carries the four steps and the questions, and nothing the home page has already said.
Enquire carries the form and the direct routes.

## The tagline moment

**"The business is ready / All it needs is its owner"** (written by Khay Digital from the offer,
16 November 2026; to confirm with the owner), after the honest half and before the maker.

## Signature details

1. **The tag**: a rounded rectangle with a punched hole. Every business, the logo, the favicon.
2. **The rail and the string**: one firm hairline that things hang from: the tags, the header's
   lower edge, the four steps, the footer's rules.
3. **The ring**: the six things, fanned from one loop.
4. **Tag writing**: Geist Mono for what is written on a tag (a number, a price, a status) and for a
   colour's code, and nowhere else.
5. **One yellow**: the colour of a price tag, on the one filled action and the platform's own tags.

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
