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
we've built, inspire form /kos". Three more followed, pared back, taking their manner from a
capture of one of Khay Digital's own builds; the owner chose the one called "2 · Centred", and
then set it aside: "i still need better logo and aesthetic, its grossier, see our competitis
bonjour.mu how they are." Khay Digital's reading is that the pared-back page answered the first
complaint, that the site was too dark, and left the second standing, that it was too plain. The
postcard came from the owner's own three references, and it is warm where the other was bare.

## The person, and the action

Someone with a question about Mauritius: where is a business, how do I start one, is this one real,
who do I call, what is there to see. The action is to ask it. The search box is in the middle of
the first screen, and the menu carries it on every other page.

The second person is a business owner. Their action is "List your business", which leads to the
three plans.

## How the site is laid out

There are no chapters. Each kind of page does one job.

| Page | Its job | How the postcard shows there |
|---|---|---|
| The first screen | Take the question | The day's picture, full, with the greeting, the question and the search in the middle. The sheet of paper begins under it: the directory's groups, the towns beside the island, the guides, the tools, and where it all comes from |
| Results (`/search`) | Answer: listings when the question is about who and where; when it is about how, the answer itself first, in the site's own words, with the guide it is from | On the sheet. Each listing is a card. Filters above the list, the island beside it with the answers lit. Pages on other sites are folded away as references |
| A listing (`/b/...`) | Say what is known about one business, and where each part came from | The business's own card opens the page, with a strip of the day's picture across its top. The island marks where it is |
| A category, a town | Walk the directory: narrow a kind of business to a town, or a town to a kind | Cards, filters, the island with that list lit |
| The guides (`/learn`), and a guide | Explain one subject, every figure with its source | Shelves of cards; a reading page that ends with what to read next, then its references |
| Emergency numbers (`/emergency`) | Who to call, each number from an official page | The first three numbers on dark cards, each a button that dials |
| List your business (`/pricing`) | The three plans, and what paying changes | Three cards, Biznes Go the dark one |
| Pocket Guide (`/shop`) | Sell the one guide, and places in it | The cover, what is inside, the price and when it is free, what a sponsor can take, and the cart |
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

### Round 7, 23 November 2026: a door, a hall, and three things of our own

**The owner's note, in their own words.**

"Write our own site search algorithm. Keep landing page simple bg image, search bar, there is a
button that says home where there is top business listings, baz manzer, categories, regions, other
useful links. Priorities informative icons as well, create them to make them unique if needed.

Also, to manage our subscription to pocket guide, build the internal email marketing system, we
will set up our own stmp via maybe a free mailgun or resend server. (Will set up later, build the
base first)

Baz manzer should be its own section on the site, as in people can choose to install pwa version
of only thr baz manzer section on their phones instead of the whole biznes.mu"

**What was decided, and why.**

- **The first screen is a door.** `/` is the picture, the site's own line as its heading, the
  search and one button that says "Home". The header there keeps the name, the cart and the
  account. There is no sheet, no bar at the foot and nothing under the button; one quiet line at
  the foot says whose site it is. It is one screen at every size measured, from 320 by 568 to 1920
  by 1080.
- **Home is the hall behind it.** `/home` holds what the first screen used to carry and what the
  owner listed: top businesses, Baz Manzer, the categories, the regions beside the island, and the
  useful pages (the numbers to call, the next public holidays, articles, tools, the Pocket Guide,
  listing a business). "Home" leads the menu and sits second on a phone's bar; Tools moved into
  "More". A path above a title now starts at Home.
- **"Top" is a measure, never a judgement.** Nothing on the site may be invented, and nobody at
  biznes.mu rates a business. So the eight shown are: a verified business on a paid plan first,
  marked, as on a page of results; then the fullest listings in the open index (a telephone
  number, a website, opening hours and an address on record: 56 of the 7,179 today), eight at a
  time, a different eight each day, every one having its turn in a run of seven days. The Home
  page says so above the list and `/data` says it in full.
- **Icons of our own, with one rule.** Every icon is a line drawing on the same grid with exactly
  one solid point, the lit point of the name, placed where it means something: the pill in the
  pharmacy's capsule, the flame of the candle, the place on the map. There is one for each kind of
  business (67 drawn; three wear their group's), the thirteen groups, twenty kinds of food and
  twenty-three pages. A district's icon is the island itself, cut from the same outline the chart
  uses, with that district filled. Home's is a house: the first drawing was a signpost, kept apart
  from the home and building group, but a button that says Home is looked for under a house.
  A listing's row and a business's page now wear the icon of its own kind, not of its group.
- **The search is ours.** The library that kept the index is gone. The engine
  (`src/lib/engine.ts`) keeps the words of every document by field, weighs the name above the
  kind, the kind above the place and the place above the rest, puts a whole name first, and reads
  a typing mistake as the word meant: one slip from four letters, two from eight, and two letters
  that changed places count as one. A close spelling always counts for less than the word spelt
  right, and the page says when it has read one. Measured over all 6,520 names in the index, a
  name as written is found first 97.7 times in a hundred (91.6 before), and with two letters
  swapped 96.9 (71.2 before, with nothing at all found for one in fifteen). The median search
  takes a fifth of a millisecond. The order of a page of results did not change, and `/data` says
  how a listing is weighed.
- **The email is a base, and it sends nothing until it is given a sender.** The owner will connect
  Resend or Mailgun later, so the system was built to be whole without one. Joining the list works
  as it did. An admin writes a message on the Email tab in parts, sees it drawn as it will arrive
  with its plain-text twin, and with no sender takes the addresses as a file and the finished
  message to send by hand, then marks it sent so the record holds who it went to. One press starts
  the message for a new edition of the Pocket Guide with the month, the name and the address
  filled in. With a sender the site asks a new address to confirm, sends in batches, gives every
  reader their own link to leave in one press, and stops writing to an address that bounced,
  complained or asked. No message can be sent while the sender's postal address is empty, and
  nothing tracks who opened or pressed what.
- **Baz Manzer is a section, and an app of its own.** Everything for eating now lives under
  `/baz-manzer`: a first page under the awning with its own search, the five kinds of place, 76
  kinds of food, 76 towns, a place's own page, and a shortlist of places to eat. It has its own
  header and its own bar on a phone, so someone who installs it never falls out into the rest of
  the site unless they press "biznes.mu". It carries its own manifest, name, icon and first page,
  with `/baz-manzer` as its scope, so a phone offers "Add Baz Manzer to your home screen" inside
  the section and "Add biznes.mu" everywhere else, and the two install side by side. A page of the
  section opened once opens again with no connection. "What is near" is a town the visitor
  chooses: the site asks no phone where it is. Every old address with parameters leads to its one
  new address.

**The same night: "why didn't we find any?"** The owner searched "Burger place in beau bassin" on
a phone, got "Nothing here holds all of it" with a taxi rank first, and wrote: "there are so many
burger places in beau bassin, why didn't we find any?? [...] Whats up with our algo? Fix that."

Two things were wrong, and they are not the same thing.

- **The engine let go of what it had understood.** It read "burger" as a dish and "Beau Bassin" as
  a town, found no place that also held the word "place", and fell back to anything holding some
  of the words. Tried on 42 questions asked the way people talk, 25 fell the same way. Now a word
  that only says "a business" is set aside, the words people add when asking aloud are padding, a
  dish asked for with the wrong word for the kind of place is looked for in every place to eat,
  and a kind of business in a town is answered as far as it was understood, with the words left
  out named on the page. One of the 42 still falls, where the index holds nothing of that kind in
  that town. The 387 measured questions answer as before but for two long ones, now understood,
  and one mistyped name that finds one more.
- **The index is thin, and no engine can find what is not in it.** The open map records two places
  in Beau Bassin-Rose Hill as serving burgers. Nothing may be invented, so the page now says what
  it knows: under the places that answer it lists the other snacks and takeaways in the town that
  have nothing on record about what they serve, as "May also fit" and never as results, and it
  offers the same dish in the nearest towns. `/data` says both. The cure for thin data is more
  listings, from owners or from a fuller source, and that is the owner's decision.

**Checked.** On the tree that is live: 255 behaviour checks, 231 for Baz Manzer, 72 for the tax
tools, 65 for the engine alone, 68 for the email with no service, axe-core clean on 56 kinds of
public page at both sizes; with accounts on, 696 claims about who may read and write what and 344
checks in a browser, axe-core clean on 70 kinds of account page.

**Not done, and said.** The database's parts 11 to 14 are not on the hosted project: applying
them asks the owner to confirm, and the owner has not yet been there to. Until then the Email tab
says the database is behind. Neither Resend nor Mailgun has been called. The two apps were
installed side by side on Chromium only: no real Android phone or iPhone has been tried. A sender
over plain SMTP is not built.

### Round 6, 23 November 2026: one way round

**The owner's note, in their own words.** "Simplify the site's navigation, should be easy to use,
intuitive. Accessible."

**What was wrong.** The header hid every page behind three words that opened (Explore, Learn, For
business), so the directory, the food and the articles were each two presses away, and a visitor
had to guess which word held what. A phone had two menus at once: four buttons at the top, one of
them a list of fourteen pages that opened over the page, and a bar of five at the foot. The same
section had three names: "Learn" on the bar, "Articles" in the list, "Learn" again in the path.

**What was decided, and why.**

- **The pages people come for are plain links.** Directory, Baz Manzer, Articles and Tools, each one
  press away, always in the same place. A link says where it goes; a word that opens says only that
  there is more.
- **One thing opens, and it is called what it is.** "More" holds the eight pages wanted next, each
  with a line about it, and ends on a page of every page. It closes on Escape, when the keyboard
  leaves it, on a press elsewhere, and when a page is chosen.
- **A phone has one menu, not two.** The bar at the foot is the way round: Search, Directory, Baz
  Manzer, Articles, More. The header keeps the name, the cart and the account, and nothing in it
  opens. "More" on a phone is a page, so the back button leaves it and a screen reader meets it as
  any other page. Saved gave its place on the bar to Baz Manzer, which the owner asked to be
  "the best on our apps"; the shortlist is in "More", and its button comes into the header once
  something has been saved.
- **The towns are the directory turned round.** "Places" left the first row. The directory and the
  towns each open with the same switch, "By kind of business" and "By town", and both light
  Directory.
- **One name for a page, everywhere.** The header, the bar, the footer, the page of every page and
  the path above a title all take a page's name from the same lists (`src/data/site.ts`). The
  articles are "Articles" wherever they are named.
- **Where you are is said, not only shown.** The word is ink and heavier and carries the lit point,
  and a screen reader is told "current page" on the page itself and "current" on a page beneath it.
- **The cart and the account stay in the header at every width**, as the owner asked.

**Checked.** The behaviour checks hold the menu (the four links, the one list, Escape, Tab, the
page of every page, the phone's bar, and that every control of the header and the bar is at least
44 pixels each way). axe-core is clean on every kind of page at both sizes and with the list open.

### Round 5, 20 November 2026: useful first

**The owner's notes, in their own words.**

"i want better display on biznes pages. searches are limited, we should display our ai articles
first, then biznes or other links for same, we are a search engine, improve our usability, we
should be useful. it should be a powerhouse for mauritius individuals and bizneses. special
category for food biznesses, we should have the best Baz Manzer on our apps. improve our footer,
logo is hiden. we should have different background images, be dynamic in that manner. biznes.mu is
a product of khay digital, developed by Faiz Khayrattee. paid listings should have a more beautiful
biznes page. food outlets using biznes go (at least) can list their menu."

On the pocket guide: "sponsorship, fees are good, we have max 4 pages per guide, do we have 1 guide
or many? i suggest 1 big guide, like a biznes.mu pocket guide and later we will have 1 biznes.mu
biznes magazine, where we list biznesses of the month etc, manual monthly e-magazine release for
free (for that we need a subcribers list for that and for our pocket guide). free weeks target:
yes, if we hit 8k per edition, its free for 2 weeks, if we hit 10k its free for 3 weeks, if we hit
12k its free for the month."

Later the same day: "add a cart and user icons in header bar by default", and "ensure that our seo,
aeo and geo are up to date, we need to have proper image that shows up when people paste our link
anywhere".

**What the round decided, and why.**

- **A page of results has one order, and says so.** Our own pages that truly answer come first,
  then businesses, then parts of articles that only mention the words, then pages elsewhere. The
  owner asked for articles first; the line that had to be held was "truly". A paragraph that
  merely contains a word is not an answer, and showing it as one is what made the earlier search
  feel limited. So an answer must hold every word asked, a partial match is said to be partial,
  and a name the index does not hold is said not to be held.
- **The search was taught by real questions.** Forty-nine searches a Mauritian would type, in
  English, French and Kreol, were run, read and fixed one by one, and each is now a check. What
  they taught: a dish is not a category ("pizza" is looked for in a place's own words); the first
  kind named in a question is the one meant; a question about how is never a kind of business; a
  French or Kreol phrase is put into English before it is read; and a health listing with no
  number is of little use at the top.
- **Baz Manzer is a place of its own**, not a filter. Food is what people look for most, so it has
  its own address, its own front (the awning, the one use of the brand's red), and its own ways
  in: by kind of place, by kind of food, by town. Its lists are counted from the index.
- **One page for a business, and it grows with the plan.** A free page is calm and complete: what
  is known, set out in blocks, the way to call on the first screen. A paid page adds only what the
  owner has given (a cover, pictures, a line, hours, a menu, services, a booking) and wears the
  mark. No part is drawn empty, and nothing paid is shown on a free page.
- **A street map, on request.** The island stays, because it is the site's own and costs nothing.
  A real map is one press away, loaded only then, from a free service whose terms were read first.
- **Two faces.** Bricolage Grotesque for titles alone; Manrope for everything else.
- **The footer says whose product this is**, in the owner's words, and its mark stands whole.
- **Ten pictures, a different one each day.** The season still chooses the set.
- **One guide.** The biznes.mu Pocket Guide, with at most four pages of sponsors, refused in the
  data and not at the printer; free by the steps the owner gave; and a magazine announced, with a
  list to join.
- **A cart, without a till.** What can be bought goes in a cart; the order is sent, and a person
  replies. The site never says more about paying than is true.
- **Found, and quoted.** Every page has its own card for a pasted link, its own title and
  description, and structured data written from its own content. Articles are offered whole to
  assistants, as Markdown, with their sources.
- **Lighter.** The island was being sent twice on every list page, once for each size of screen.
  It is drawn once now.

**Not done, and why.**

- **Weather on the first screen.** No source was chosen that could be named and kept current, so
  none is shown.
- **The magazine.** Announced only.
- **Paying online.** Not connected; the owner has not chosen how.

### Round 5, behind the door: accounts, safety and tax

**The owner's notes, in their own words.**

"also, how should user and biznes owners access their accounts? how do i access superadmin to make
changes? how do i manage ads? how do users manage their subcriptions? and their ads in different
places? where do they upload their artwork? biznes grow users should have a mini crm to manage
their bookings or products/services, payments, etc. the website is deployed on vercel, you have
access, link the db to it. fix any security issues on any level. next.js do what is needed for
longterm."

Later: "my account was created, assign superadmin, also make accounts more beautiful", and "in
tools add a personal Tax calculator as well, and business tax tool."

**What was built, and why it is the way it is.**

- **Nobody is given an address to remember.** The person icon in the header leads to the account,
  and every page for an owner, an admin or the superadmin is one or two presses from there. A page
  that is not for the person asking says it is not there.
- **An owner's business has its own rooms, opened by its plan.** Overview for all. On a paid plan,
  "Its page" (a line, hours, a cover, photographs) and, for a place to eat, its menu. On Biznes
  Grow, bookings, customers, services and products, and a ledger of payments: the mini CRM the
  owner asked for. Advertising for any live business, where the advertisement is drawn and its
  artwork uploaded.
- **The site's own rooms.** Admins check businesses, advertisements and orders and read the list of
  subscribers. The superadmin also names admins and chooses the picture behind every page: by the
  calendar, one picture, or a round of pictures, with pictures of their own.
- **Nothing is paid on the site yet, and it never says otherwise.** A plan, an advertisement and an
  order are asked for, arranged by a person and marked paid by hand. The database prices an order
  from its own list, so a price sent by a browser counts for nothing.
- **The database is the lock.** The site holds no key that opens more than a visitor's own. What a
  person may read or change is decided row by row in the database, and proved by claims that run
  against it (README, "Accounts").
- **Two reviews by people who had not built it.** The first went at the whole site as an attacker
  would: the framework was raised to a version with no open advisories, a content security policy
  and stricter headers were added, and the form's endpoint was tightened. The second read the new
  account features and found no way to another person's data, but ten weaknesses, since closed: an
  advertisement approved after its owner had changed it; where an approved one leads; the list
  telling whether an address was on it; limits that anyone with the public key could use up, now
  behind a word only the site's server holds; pictures that outlived what they belonged to; and
  smaller ones.
- **A link in an email waits for its reader.** Some mail programs open every link before the person
  does, and a link that signs someone in works once. It now lands on a page with one button.
- **Two tax tools, from the Act.** A personal income tax calculator and a business tax estimator,
  each reading its figures from an article that names its sources. Where the Finance Act 2026 and
  the revenue authority's own pages disagreed on the day, the Act was followed and the article says
  so. Each opens with the calculator, and the figures it uses follow.

**Not done, and why.**

- **Paying online.** Stripe is the owner's choice and is not connected.
- **Email from the site.** It sends none of its own. The guide and the magazine go out by hand to
  the list.
- **Prices for advertisements on the site and in the magazine.** The owner has set none, so each
  says "Price on request".

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
- **"our own style of business listing and page"**: the biznes card, and a business's page that
  opens with its own card.
- **"a very vibrant mark"**: the verified mark, and the ring and glow of a paid card. Nothing else
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
- The guides on shelves: nineteen at the time of writing, thirteen on business and two each for
  visitors, for newcomers and on everyday life. The site also calls them articles. A guide now
  ends with what to read next on the site, and then its references.
- A question about how is answered first in the site's own words, under the search box, and the
  official pages and websites that also answer are folded away as references.
- `/shop`, and the first pocket guide, laid out by `scripts/pdf.mjs` as an A5 PDF of 51 pages: 60
  places in nine parts of the island, 13 days out, and 110 sources at the back. It is to be sold
  on request until payments exist.
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
- The site as an app. Its first parts are in the repository (a manifest, the icons, a service
  worker, an offline page), and the offer to install was being put on the page.
- A superadmin's own choice of picture, over the calendar's.
- A fifth shelf of guides, about Mauritius itself. It has no article yet.

**Not decided: for the owner.**

1. How plans and pocket guides are paid for. Answered the same day: "payment we will use stripe,
   not connectting now tho". Until Stripe is connected, a plan or a guide is asked for and a person
   answers.
2. The pocket guide's price. Answered: "just 1.99$ or equivalent in Mur. like 125rs, we can have
   like 50-100 guides the sell a bundle of all for like 60% off something like that". First set at Rs 125; the owner then set it at Rs 150 ("price it al 150rs instead per guide").
3. Whether Biznes Grow includes Biznes Go's verified mark and priority. Answered: "yes, all feom go
   but with some booking and services sale management tools, users can pay businesses via mcb juice
   (no integrarion, just details)".
4. The Supabase project. The owner agreed to pay for one ("go ahead, create it, i'll pay for it");
   its creation waits on a cost confirmation only the owner can give.
5. Who the first superadmin is. The proposal is the first account registered.
6. The owner's reading of the new guides and of the pocket guide, as of the first thirteen.

**Departures from the plan, and why.** The mock-up the owner chose was not built, because the owner
set it aside. The island was to stay dark, and was redrawn light, for the reason above. A fifth
shelf was begun beside the four in the brief.

**Checked so far.** Types are clean. The house style check and the token check report no failures.
The 25 colour pairs measured all pass. The behaviour check passed 82 of 82 before the listing card
was restyled. axe-core was clean on every kind of page at phone size. The final checks are run at
the end of the round and recorded in the README.

### Later the same day: the owner's further notes

After the first postcard build the owner wrote again, three times:

- "for now, any existing business listed from crawlers are automatically in free plan, owners can
  claim and verify the listings. we need to have them already there tho. the dark map is not
  attractive and fitting in the aesthetic. search engines shouldn't just be showig businesses,
  should also operate like a basic proper search engine function, we need our own articles based on
  general knowledge we can gather, we need to keep people maximum time on our platform, if they want
  to read sources then they can jhave reference list from where we got out sources from. see how
  bonjour.mu's header is, we can do similar, dont carbon copy please".
- On the pocket guide: "The gradient between pixtures and text in pocket guide isnt showing, its an
  ugly sharp line, also price it al 150rs instead per guide, each guide add contact to add sponsored
  listings and adverts. We renew our guides every month. Add that options for paying users to pay to
  add their add or business in the sponsored page of the guide, suggest an appropriate fee, if per
  month we geg enough sponsors for our guides, then the guides will be free for the first 3 weeks of
  the month and paid thr last week of that month, sponsorship can be bought for the coming month or
  months only."

What was done:

- The island was redrawn as a light map: a pale lagoon, white land, ink points, saffron ringed in
  ink for the ones that answer.
- The menu became three groups that open (Explore, Learn, For business), with soft square icon
  buttons and, on a phone, one button that opens them all.
- The search became an answer engine over the site's own pages. Eleven articles about Mauritius
  were researched and written, with a page of public holidays. A question is answered first, in
  the site's own words: a fact, an article's opening, an emergency number as a button that calls
  it, a holiday's date. Pages on other sites are folded away as "References elsewhere". An article
  ends with its references and then with what to read next on the site.
- The pocket guide is renewed every month, at Rs 150, with a sponsors' page and how to reach us to
  be on it. A business may ask to sponsor a coming month at one of three prices, which are Khay
  Digital's suggestion until the owner confirms them (Rs 500 for a listing, Rs 1,500 for a panel,
  Rs 4,000 for a page). When a month's sponsors together cover the edition (the suggested sum is
  Rs 6,000), it is free on the site until the 21st and sold after. The fades between the guide's
  pictures and its pages are painted into the pictures, so no reader shows a hard line.

### The design review of Round 4, 20 November 2026

A reviewer who had not built the site went through a built copy at both sizes, with a keyboard and
twenty-two searches. Twenty-three findings: one blocker, thirteen major. Its verdict was that the
first screen on a desk met the brief and the phone did not. What was done:

| Finding | Done |
|---|---|
| On a phone the first screen could pan sideways, and the tab bar fell off it (the soft light behind the words was wider than the screen) | The light is clipped to the screen, nothing may widen the page, and the check now measures a phone's page against the screen itself |
| A long website address on a card widened the page | A card shows the site's name alone, and a chip never outgrows its card |
| Questions were answered badly: "register a company" led with a company, "MCB" with a paragraph about the airport | A question about how is not read as a kind of business. Only a page that truly answers is shown as the answer; a part of an article that merely mentions the words is listed, not crowned. A business's own name leads with businesses |
| The emergency answer was buried on a phone and could not be tapped | The answer comes straight under the search box, a number is a button that calls it, and the first screen has a way to the emergency numbers |
| A toy map and stacked filters pushed the first card down a phone's screen | On a phone the map comes after the list, and the filters stand in one row |
| A business's page opened with the day's picture, which read as a picture of the business | It opens with a map of its own neighbourhood, with its mark; on a phone the call button is full width |
| The verified mark could be seen nowhere | The plans page shows an example card, marked as an example |
| Asking for a paid plan landed on a form that said "It costs nothing" | The form knows what it was opened for: the plan, its price, and that paying online is not open yet. The plans page says the same |
| The tap that closed a menu also opened what lay beneath; the phone menu ran off the screen | A clear sheet takes the closing tap; the phone menu fits between the header and the tab bar, with the way to list a business first |
| "List your business" was hidden on a phone | A line for business owners sits under the first screen, and the phone menu leads with it |
| Suggestions were cut off by the footer; the header's list was too narrow to read | The page's own lists open over the footer; the header's list is wide, with the note under the name |
| Most listings have no number, and a card without one offered nothing to do | Such a card offers the way there, and a way to add the number |
| An article ended on links away from the site | It ends with what to read next; "Articles" is now the one name for them |
| Smaller faults: the age of a record ("over two years" for nine), past holidays before the next one, the guide's two names, an indented saved list, targets under 44px, text reading through the floating bars | Each fixed |

Not done, and why:

All five were taken up in Round 5, when the owner said of them "do it for me. you know best": the
street map, a second face for titles, the shorter places page with a box that finds a town, the
part being read marked in an article with the businesses that go with it, and listings with a
telephone number first in the health categories.

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
