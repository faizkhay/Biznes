# The story

## North Star

**The island, drawn by its own businesses.** Mauritius as you would see it from above at night, if
every light were a business: seven thousand points, each a real listing at its real place. Ask a
question and the points that answer light up in saffron.

That picture is the product. It says, before a word is read, that the site knows the whole island,
that what it knows is real, and that a question changes it.

## Why this story, for this brand

The earlier site sold a handful of ready-made businesses and staged them as a painted street. On 20
November 2026 the owner set that aside: "Scrap it all. Turn biznes.mu into THE SEARCH ENGINE FOR
MAURITIAN BUSINESSES. ANYTHING ANYONE NEEDS, BIZNES.MU", asked that the design be "futuristic", that
it have "a web crawler to find all that it needs", and that it be "the most useful tool out there".

A search engine has no story to tell in chapters. A visitor arrives with a question and should
leave with an answer. So the organising image has to be the tool itself, not a stage in front of it.

Three things about this product decided the image:

1. **It is about a place.** Every listing has a position, and Mauritians think of business by town:
   a pharmacy in Curepipe, a hardware shop in Goodlands. A chart of the island is how the island is
   already understood.
2. **Its claim is that it is real.** A directory is only as good as the trust in it. Drawing the
   island with nothing but the data, and no coastline needed to recognise it, shows the data is
   there. Nothing in the picture is decoration.
3. **"Futuristic" was asked for.** An instrument is what the future looks like when it is useful: a
   dark ground, exact points, measured lettering, one colour that means "this answers you".

The directions considered, and why this one: a business directory's usual page is a grid of
category tiles and banners, and its opposite is a blank page with one box. The futuristic cliché is
neon on black with glass panels. The Mauritian business world offers better: the nautical chart of
an island state, the rate boards of its money changers, the metro's line diagram, the registration
card with its number. The chart carries the most: it holds every listing at once, it is the island's
own shape, and its graphic habits (a graticule, degrees and minutes, an inset for the island that
lies off the sheet, an index of names with numbers at the back) give the whole site its manner.

## The person, and the action

Someone with a question about business in Mauritius: where is one, how do I start one, is this one
real. The action is to ask it. The search box is on every page, and nothing competes with it.

## How the site is laid out

There are no chapters. There are five kinds of page, each doing one job.

| Page | Its job | The chart there |
|---|---|---|
| The first screen | Take the question. Show the whole directory at a glance | Every listing; lights what is being typed |
| Results | Answer: guides first when the question is about how, listings when it is about who | The listings that answer, lit |
| A listing | Say what is known about one business, and where each part came from | One mark, among all the others |
| A category, a town | Walk the directory: narrow a kind of business to a town, or a town to a kind | That list, lit |
| A guide | Explain one subject, every figure with its source | None: it is for reading |

Below the first screen the home page is an index, as at the back of an atlas: every category with
its count, the towns with theirs, the guides, the tools, and where the data comes from.

## The centrepiece

The chart (`src/components/Chart.tsx`). One drawing, one projection, used everywhere, so a point is
always in the same place.

- The coast and the districts are from the open map. The district lines are dashed, as on a chart.
- A graticule every tenth of a degree, lettered in degrees and minutes.
- Rodrigues is in an inset at the south-east corner, at a smaller scale, labelled with its distance,
  which is worked out from the two islands' positions.
- Each listing is a point. Without script they are gathered into dots, larger where there are more.
  With script a canvas draws each one.
- Saffron means "this answers you": the points a search lights, the one mark on a listing's page.

The one authored moment is on the first screen: as a question is typed, the points that answer come
up over a third of a second and the rest dim. A line under the chart says how many were lit.

## Play

None. Nothing on the site moves for its own sake.

## Reduced motion and no script

Without script the chart is drawn in SVG with its dots, the search is a plain form that asks the
results page, the results are lit on the drawn chart, and the VAT sums are in a table. Under reduced
motion the points are lit at once. Nothing is lost either way but the lighting-as-you-type.

## Signature details

- **The lit point.** The dot in the name, biznes.mu, is a lit point. So is the mark on a listing.
- **The index.** Names and counts in columns between hairlines: the directory, the towns, a guide's
  facts. Never a grid of cards.
- **Corner marks.** The first screen's chart sits in a frame with two corner ticks, as a chart's
  neatline has.
- **Measured lettering.** A count, a coordinate, a telephone number, a date and a source number are
  in the monospaced face. Nothing else is.
- **Where this comes from.** Every listing ends by naming its source and the day it was last edited
  there. Every guide ends with its numbered sources and with what it could not confirm.

## Rounds

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
- The design direction above was chosen by Khay Digital under the owner's standing carte blanche,
  and built in code with no mock-up, because the picture is the data and could only be judged drawn
  from it.
- A revenue plan was written for the owner (`REVENUE.md`). Nothing in it is built or promised on the
  site.

The owner has not yet seen this round. What they must confirm is on the README's list.

### Earlier rounds

Rounds 0 to 2 (16 and 17 November 2026) built and rebuilt the site that sold ready-made businesses:
first as a rail of listings, then as a street in live 3D, then as a painted street. They are in the
repository's history before commit `a7d4ea3`, with their reviews.
