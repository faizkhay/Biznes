# The story

## North Star

**The postcard.** A painted picture of the island behind the page, a sheet of warm paper laid on
it, and one question in the middle: "Find it in Mauritius."

The picture says where you are before a word is read, and it changes with the season and the
holiday, as the island does. The paper is where the work is done: results, listings, guides. The
question is the product.

## Why this story, for this brand

The search engine was first delivered as the night chart: the island drawn in points of light on a
dark sea (Round 3). On 20 November 2026 the owner asked for more: "i need better design, better
fonts, better aesthetics", and "the platform needs to be more useful ad intuitive". Asked what was
weakest, the owner chose every answer offered: "Too dark and techy", "Too plain", "Fonts feel
generic", "Hard to scan and use".

Then the owner sent three reference images and the brief that set the present direction: "i dont
want too corporate, still want an easy feeling for people coming to us, we can have a background
image that i can change with time, main search bar in the middle, then a theme that can change with
season or local holidays themes automatically, its for mauritians and mauritian businesses" (Round
4 has it in full).

The three references are a golf club's site, an invoicing site and a design tool's site. What they
share is what the owner was pointing at: a sheet of paper laid over a picture, a menu that floats
as a pill, a short headline, dark tiles, and a dark footer with the emblem standing on its edge.
None of them looks like a dashboard.

Three things in the brief decided the image:

1. **It is for Mauritians.** So the picture is the island as people there know it: the lagoon, the
   flamboyants in flower over the summer, the cane in flower at harvest, the lights of Divali. The
   greeting is Kreol: "Bonzour".
2. **An easy feeling.** A postcard is the friendliest thing a place sends: a picture, and a few
   words written on it for someone. A greeting, a picture and one question are the whole first
   screen.
3. **It changes with time.** A postcard is of a day. The calendar chooses the picture by itself: a
   public holiday's look on its day, otherwise the season's, otherwise the lagoon. The owner can
   change any picture.

What the night chart leaves behind is its drawing. The island is still drawn only by what is listed
on it, each listing a point at its own place, and a question still lights the points that answer.
It is now a light map in the page's own colours, set beside a list, and no longer the ground of the
whole site.

The directions considered, and why this one. Four mock-ups of different directions were shown
first, and the owner's answer was "none, more modern. less is more. inspire from our other websites
we've built, inspire form /kos". Three more followed in a pared-back manner, taking their manner
from a capture of one of Khay Digital's own builds; the owner chose the one called "2 · Centred",
and then set it aside: "i still need better logo and aesthetic, its grossier, see our competitis
bonjour.mu how they are." The pared-back page had answered "too dark" and left "too plain"
standing. The postcard came from the owner's own three references, and it is warm where the other
was bare.

## The person, and the action

Someone with a question about Mauritius: where is a business, how do I start one, is this one real,
who do I call, what is there to see. The action is to ask it. The search box is in the middle of
the first screen and on every page.

The second person is a business owner. Their action is "List your business", which leads to the
three plans.

## How the site is laid out

There are no chapters. Each kind of page does one job.

| Page | Its job | How the postcard shows there |
|---|---|---|
| The first screen | Take the question | The day's picture, full, with the greeting, the question and the search in the middle. The sheet of paper begins under it: the directory's groups, the towns beside the island, the guides, the tools, and where it all comes from |
| Results (`/search`) | Answer: listings when the question is about who and where, the guides' own facts when it is about how | On the sheet. Each listing is a card. Filters above the list, the island beside it with the answers lit |
| A listing (`/b/...`) | Say what is known about one business, and where each part came from | The business's own card opens the page, with a strip of the day's picture across its top. The island marks where it is |
| A category, a town | Walk the directory: narrow a kind of business to a town, or a town to a kind | Cards, filters, the island with that list lit |
| The guides (`/learn`), and a guide | Explain one subject, every figure with its source | Shelves of cards; a reading page that ends with what to read next, then its references |
| Emergency numbers (`/emergency`) | Who to call, each number from an official page | The first three numbers on dark cards, each a button that dials |
| List your business (`/pricing`) | The three plans, and what paying changes | Three cards, Biznes Go the dark one |
| Pocket guides (`/shop`) | Sell the PDF guides | The cover, what is inside, and a way to ask for it |
| Saved (`/saved`) | The visitor's shortlist, or one they were sent | Cards, with a way to share the list |

The picture shows round the sheet on every page, and the footer is a dark card that sits on it.

## The centrepiece

The first screen (`src/app/page.tsx`): a small pill with the greeting and what the index holds,
"Find it in Mauritius.", the owner's line under it, the search box as a wide white pill with its
saffron button, and four searches to try. Behind them is the day's picture; a veil of the paper's
own colour lies over its sky so the words keep their contrast.

The second is the island (`src/components/Chart.tsx`): one drawing, one projection, used
everywhere, so a point is always in the same place. A pale lagoon for the sea, white land, a point
of ink for every listing, and saffron ringed in ink for the ones that answer. On the first screen
it stands beside the towns and lights what is being typed in the search box above. Beside a list
it draws in on the answers. On a listing's page it marks where the business is.

## Play

Small things only, and none a visitor needs: a tile's icon tips and turns saffron under the
pointer, a main button's arrow turns in its circle, a card lifts by a pixel, the b in the footer
stands tilted on the card's edge. Nothing moves by itself.

## Reduced motion and no script

Without script the search is a plain form, the filters and the menu's groups still work because
they are links and plain disclosures, the island is drawn in SVG with its points gathered into
dots, a shortlist someone sent is a list of links, and the VAT sums are in a table. Saving and
sharing need script, and their buttons are not shown until it has loaded. Under reduced motion
nothing travels: the points are lit at once and every change of state happens without a
transition.

## Signature details

- **The b.** A stem and a ring: the letter, and the lens of a search. A saffron point sits at its
  centre, the one thing found. It is the name's first letter, the icon, and the mark on the
  footer's edge.
- **The sheet on the picture.** Warm paper with round corners, the picture showing round it.
- **The pill.** The menu, the search box, every button and every filter.
- **The biznes card.** A white card with the kind of business as an icon on an ink tile, in
  saffron.
- **The verified mark.** A seal with a tick on saffron running to ember, the most vivid thing on a
  page, kept for a verified business. A paying business's card is ringed in the same colours.
- **The dark footer card,** with the b standing on its edge.
- **Where this comes from.** Every listing ends by naming its source and the day it was last edited
  there. Every guide ends with its numbered references and with what it could not confirm. Every
  emergency number carries the number of its source.

## Rounds

### Round 4, 20 November 2026: the postcard, and a wider product

**The owner's notes, in their own words.**

After the search engine was delivered: "i need better design, better fonts, better aesthetics,use
/impeccable , the platform needs to be more useful ad intuitive."

Asked what was weakest about the night chart, the owner chose all of: "Too dark and techy", "Too
plain", "Fonts feel generic", "Hard to scan and use". Asked what would be most useful: "Save,
filter and share". On direction: "none, more modern. less is more. inspire from our other websites
we've built, inspire form /kos".

Seven generated mock-ups were shown in two rounds. The four of the first round were rejected. Of
the three of the second, "2 · Centred" was chosen, and then set aside: "i still need better logo
and aesthetic, its grossier, see our competitis bonjour.mu how they are."

Then, with three reference images (a golf club's site: a cream sheet over a blurred photograph,
dark tiles, a dark footer with the emblem on its edge; an invoicing site: a sheet of paper over a
cutting mat, a floating pill menu; a design tool's site: a full painted landscape with a floating
pill menu, a small pill note and a short headline):

"these are my inspirations forlook and feel of the website biznes, i dont want too corporate, still
want an easy feeling for people coming to us, we can have a background image that i can change with
time, main search bar in the middle, then a theme that can change with season or local holidays
themes automatically, its for mauritians and mauritian businesses, the ultimate biznes directory,
and ofc, we need users, so account maangement is must, superadmin, admins and regular users.
businesses can list their business for free (Biznes Free) basic listing or Biznes Go for 550rs per
month per business (verified business and listed with priority). businesses can use the platform to
manage bookings and sell services online (these come at a 1250mur per month per biznes (Biznes
Grow). eventually, provide me separate list of bizneses without websites (will work with khay
digital to reach out to propose a website). also, on the site, we should have emergency services
contacts, guides for expats and tourists, locals, some paid pdf (design them to sell to people
about best places to visits, things to do etc), promote khay digital services (subtly, not devan
devan). should be mobile friendly and fully pwa enabled, support both ios and android and desktop."

And then: "we should our own style of business listing and page, paid business needs to have a very
vibrant mark to show they these are real verified and paid business listings."

**What was decided.** These are Khay Digital's readings of the notes.

- **The North Star is the postcard**, as above. The night chart's drawing is kept as the island.
  It was first kept as the one dark panel on a page, and during the round it was redrawn as a light
  map, so that nothing on the sheet is dark but the footer and the cards that are meant to be
  noticed.
- **Four pictures**, generated as illustrations for the site (Higgsfield, model gpt_image_2_6, 20
  November 2026): the lagoon, flamboyants in bloom, cane in flower, a festival of lights. Each has
  a record beside its file, and none is ever captioned as a photograph. The calendar picks one by
  itself. The dates of public holidays come only from `content/holidays.json`, written from the
  official notices. The owner changes a picture by replacing a file or a line in
  `src/data/themes.ts`.
- **A drawn mark**: the b that is a stem and a ring. The other letters of the name are Manrope
  Bold, outlined.
- **One face**: Manrope, under the SIL Open Font Licence, from the list KOS keeps for a brand with
  no face of its own. Archivo, Geist and Geist Mono are gone.
- **"Save, filter and share"**: results narrowed by telephone number, by website and by town, as
  links; a shortlist kept in the visitor's own browser and shared as a link; a listing or a search
  shared.
- **"Our own style of business listing and page"**: the biznes card, and a business's page that
  opens with its own card.
- **"A very vibrant mark"**: the verified mark, and the ring and glow of a paid card. Nothing else
  on the site may look like them.
- **The plans** are the owner's: Biznes Free, Biznes Go at Rs 550 a month for each business, and
  Biznes Grow at Rs 1,250 a month for each business.

**The order of results: the owner's decision.** Until this round the order of results could not
be bought. `PRODUCT.md` held that as its fourth principle, and the site's data page said: "A fuller
listing is shown before a barer one, and that is the only order there is." The owner's Biznes Go is
"verified business and listed with priority". That reverses the promise, and it is recorded here
as the owner's decision of 20 November 2026. The site now says what is true: a business on a paid
plan comes first among listings that answer equally well, and it is always marked as a priority
listing. It says so under "How results are ordered" on `/data`, on `/pricing`, and in the promises
on the first screen: "A listing that pays to come first is marked as one." `PRODUCT.md`'s fourth
principle was rewritten with it.

**What was built.**

- The design system of the postcard (`DESIGN.md`): the picture, the sheet, the floating pill menu
  with its three groups (Explore, Learn, For business), a tab bar at the foot of a phone's screen
  (Search, Directory, Places, Learn, Saved), and the dark footer card with the b on its edge.
- The first screen: the greeting pill ("Bonzour", or a holiday's greeting), "Find it in
  Mauritius.", the owner's line, the search pill, four searches to try.
- The filters, the shortlist (`/saved`, shared as `/saved?ids=`), and sharing.
- The biznes card, the business page's card, and the verified mark.
- `/pricing`, with the three plans and what paying changes.
- `/emergency`: 43 services in ten groups, each number from an official page that is named.
- The guides on shelves, for business, for visitors, for newcomers and for everyday life, with a
  shelf about Mauritius itself added during the round. A guide now ends with what to read next on
  the site, and then its references.
- `/shop`, and the script that lays out the first pocket guide as an A5 PDF (`scripts/pdf.mjs`).
  It is to be sold on request until payments exist.
- `npm run leads`, which writes the listings with no website on record to `reports/`, not
  committed: 6,754 of 7,179, of which 273 are businesses with a telephone number.
- A quiet word for Khay Digital in the footer ("No website yet?") and the usual credit. Nothing
  louder.

**Being built when this was written, by other hands in the same round.** None of it is finished,
and none is described as done anywhere in these documents.

- Accounts on Supabase with three roles (superadmin, admin, user), a dashboard for a business's
  owner, and the admin screens. A Supabase project could not be created from the session; the
  owner must create or approve one.
- Bookings and services, for Biznes Grow.
- The verified mark and priority joined to the search. The mark is drawn, but no listing carries
  it, and results are still ordered by answer and fullness alone.
- The site as an app: a manifest, a service worker, an offer to install, and an offline page.
- A superadmin's own choice of picture, over the calendar's.
- The guides for the new shelves, and the list of places the pocket guide is laid out from. They
  were arriving from researchers as this was written.

**Not decided: for the owner.**

1. How plans and pocket guides are paid for. No payment gateway is chosen.
2. The pocket guide's price.
3. Whether Biznes Grow includes Biznes Go's verified mark and priority.
4. The Supabase project.
5. Who the first superadmin is. The proposal is the first account registered.
6. The owner's reading of the new guides, as of the first thirteen.

**Departures from the plan, and why.** The mock-up the owner chose was not built, because the owner
set it aside. The island was to stay dark, and was redrawn light, for the reason above. A fifth
shelf was added to the four in the brief.

**Checked so far.** Types are clean. The house style check and the token check report no failures.
The 25 colour pairs measured all pass. The behaviour check passed 82 of 82 before the listing card
was restyled, and has not been recorded since. axe-core was clean on every kind of page at phone
size. The final checks are run at the end of the round and recorded in the README.

### Round 3, 20 November 2026: the search engine

The owner's note, in full: "Scrap it all. Turn biznes.mu into THE SEARCH ENGINE FOR MAURITIAN
BUSINESSES. ANYTHING ANYONE NEEDS, BIZNES.MU. Design should be futuristic and needs to have a web
crawler to find all that it needs as a business sesrch engine and also it should be the most useful
tool out there for any businesses and people looking to learn about business in mauritius,
implications, formations, business directory. Act as a revenue manager after build to tell us how we
make money from this."

What was done:

- The painted street, its listings, its plates and its walk were removed. Their addresses now lead
  to the directory, the data page and the form.
- A crawler was written and run (`crawler/`): the open map, Wikidata, the front page of each
  business's own site, the member lists of chambers and associations, and the official pages the
  guides point to.
- A search was built over all of it, which reads a town and a kind of business out of a question in
  English, French or Kreol.
- Thirteen guides were researched from official sources by four researchers working in parallel,
  each to one brief: nothing from memory, every figure on a page actually read, official sources
  first, anything unconfirmed listed and left out of the prose.
- Four tools were made from the guides' own figures.
- The design direction was the night chart: the island of Mauritius drawn only by what is listed
  on it, each listing a point of light on a dark sea, and saffron for whatever answers. It was
  chosen by Khay Digital under the owner's standing carte blanche, and built in code with no
  mock-up. Round 4 replaced it.
- A revenue plan was written for the owner (`REVENUE.md`). The owner's decisions in Round 4 have
  since overtaken parts of it, and it says which.

### The design review, 20 November 2026

A reviewer who had not built the site went through the night chart at both sizes, with a keyboard,
and with the searches a Mauritian would type. Fourteen findings, two of them blockers. What was
done, and it all still stands under the new design unless a line says otherwise:

| Finding | Done |
|---|---|
| The search passed a catch-all category off as the answer ("plumber" read as "Trades and workshops") | A narrower word is searched as a word, and the category is offered as a place to look, with a note that the map is thin there. Words are matched as written before any close spelling is tried, and the page says when one was |
| The form failed every time with no route set | With no route, the same fields write the request out for the visitor's own WhatsApp or email |
| Listings shown more confidently than the map allows | Each listing says when the map last recorded it, and warns when that is over two years ago. "Nearby" means within eight kilometres. Every listing points to the official registers |
| The search box sat at the fold under a tall headline | The box follows a short line; it takes focus on a desk, and answers to the "/" key. In Round 4 it moved to the middle of the first screen |
| The chart went blunt where the answer was, and was missing on a phone | Beside a list it draws in on the lit points, with a key of the whole island; the row under the pointer has its point ringed; on a phone a small one sits above the list |
| A question about how got a guide's title, not the answer | The guides' facts, the glossary and the tools are searched |
| Guides crowded questions about businesses | A question read as a kind of business or a town shows listings first |
| "273 towns and villages" was not true | 129 towns and villages, and 144 neighbourhoods within them, said so everywhere |
| "Check a business" had a misleading label and unusable tables on a phone | Relabelled; on a phone every table becomes a block a row, each cell naming its column |
| Long pages had no way through on a phone | A guide has a contents list that opens; the glossary has a letter index |
| Focus hidden under the phone header; a list left open; small targets | Scroll padding matches the header; the list closes on blur; telephone links are full-size |
| Saffron on chosen chips as well as the action | Superseded in Round 4: a chosen chip, filter or tab is filled with ink |
| Titles at two heights; widths wandering | Every page has its path, so every title sits at the same height |
| Copy and small defects | Source numbers are in order; the index can be downloaded from the data page |

Not done then, and still open:

- **One row for a chain with its branches.** It needs a notion of a brand the index does not yet
  hold.
- **"Open now".** Hours are known for 355 listings, too few to filter by.
- **Opening a listing from its point on the island.**
- **A margin column on the reading pages** that carries a guide's sources beside the words they
  support. A guide has a contents rail on a wide screen; its references are at its foot.
- **The date of the map's record on every card of a list.** It is on each listing's own page.

### Earlier rounds

Rounds 0 to 2 (16 and 17 November 2026) built and rebuilt the site that sold ready-made businesses:
first as a rail of listings, then as a street in live 3D, then as a painted street. They are in the
repository's history before commit `a7d4ea3`, with their reviews.
