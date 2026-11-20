---
version: alpha
name: "biznes.mu, the search engine"
description: "The night chart: the island of Mauritius drawn only by what is listed on it, each listing a point of light at its own place, and saffron for whatever answers a question. Dark ground, hairlines, an atlas's index, measured lettering."
# On Google Labs' DESIGN.md format (npx @google/design.md lint DESIGN.md), from the KOS template.
# Every colour and typeface cites a Source ID (Overview, Sources). 'sampled' means measured from the
# mock-up the owner approved for biznes.mu on 17 November 2026; 'derived' means worked out from a
# sampled value, with the direction and the reason. Each key is the code's --palette-* name, except
# primary, primary-dark and on-primary, which the format asks for: they are --palette-saffron,
# --palette-saffron-deep and --palette-night.
# The line-* values are the code's own color-mix() expressions with the variable written out.
colors:
  primary: "#f8c618"                      # S1 the brand's action; sampled. --palette-saffron. What answers a question; carries night at 12.28:1
  primary-dark: "#e3b30d"                 # derived from primary: darker, the fill under the pointer; carries night at 10.06:1. --palette-saffron-deep
  on-primary: "#050a1a"                   # night, the words on saffron; see Contrast
  night: "#050a1a"                        # derived from ink: darker, the sea at night. The page's ground
  ink: "#0a1639"                          # S1 the brand's dark; sampled. A field, the search box, a note, a table's head
  swell: "#14224f"                        # derived from ink: lighter. A control under the pointer, a chosen suggestion
  limewash: "#f7f7f8"                     # S1 the brand's white; sampled. Words: 18.42:1 on night, 16.52:1 on ink
  haze: "#b6c0db"                         # derived from limewash toward ink: secondary words; 10.84:1 on night, 9.73:1 on ink
  tide: "#8794bb"                         # derived from haze toward night: captions, a chart's lettering; 6.55:1 on night, 5.88:1 on ink, 5.09:1 on swell
  coral: "#f14949"                        # S1 the brand's red; sampled. An error's words and mark: 5.43:1 on night, 4.87:1 on ink
  line: "color-mix(in srgb, #f7f7f8 13%, transparent)"          # derived: limewash at 13%, the hairline between rows
  line-strong: "color-mix(in srgb, #f7f7f8 46%, transparent)"   # derived: limewash at 46%, an edge; 4.40:1 on night, 4.36:1 on ink
  chart-coast: "color-mix(in srgb, #f7f7f8 37%, transparent)"   # derived: limewash at 37%, the coast; 3.24:1 on night
typography:                               # named as the text styles in src/app/globals.css; fontSize is the clamp() maximum, the full clamp() is in Typography
  # The format cannot hold a width: display-1, heading-1 and heading-2 are Archivo set wide by font-stretch (125%, 120%, 114%). label-1 is capitals by text-transform.
  display-1: { fontFamily: "Archivo, Arial, sans-serif", fontSize: 5.25rem, fontWeight: 640, lineHeight: 0.98, letterSpacing: "-0.032em" }
  heading-1: { fontFamily: "Archivo, Arial, sans-serif", fontSize: 2.875rem, fontWeight: 620, lineHeight: 1.04, letterSpacing: "-0.026em" }
  heading-2: { fontFamily: "Archivo, Arial, sans-serif", fontSize: 1.75rem, fontWeight: 600, lineHeight: 1.14, letterSpacing: "-0.018em" }
  heading-3: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 1.125rem, fontWeight: 600, lineHeight: 1.3, letterSpacing: "-0.01em" }
  title-1: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 1.0625rem, fontWeight: 600, lineHeight: 1.35, letterSpacing: "-0.006em" }
  title-2: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 0.9375rem, fontWeight: 600, lineHeight: 1.4 }
  body-1: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 1.125rem, fontWeight: 400, lineHeight: 1.55 }
  body-2: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 1rem, fontWeight: 400, lineHeight: 1.6 }
  body-3: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 0.875rem, fontWeight: 400, lineHeight: 1.55 }
  caption-1: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 0.8125rem, fontWeight: 400, lineHeight: 1.45 }
  data-1: { fontFamily: "Geist Mono, ui-monospace, monospace", fontSize: 0.875rem, fontWeight: 400, lineHeight: 1.5, letterSpacing: "-0.01em", fontFeature: "'tnum'" }
  data-2: { fontFamily: "Geist Mono, ui-monospace, monospace", fontSize: 0.75rem, fontWeight: 400, lineHeight: 1.4, fontFeature: "'tnum'" }
  label-1: { fontFamily: "Geist Mono, ui-monospace, monospace", fontSize: 0.75rem, fontWeight: 400, lineHeight: 1.3, letterSpacing: "0.08em" }
  button-md: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 0.9375rem, fontWeight: 600, lineHeight: 1.2 }
  button-sm: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 0.8125rem, fontWeight: 600, lineHeight: 1.2 }
rounded: { mark: 2px, control: 4px, panel: 8px }   # --radius-xs, --radius-sm, --radius-md: an instrument's corners, never a pill
spacing: { gutter: 3rem, shell: 82rem, measure: 68ch, nav: 64px, section: 4rem }   # the page rhythm, each at its maximum; inside components only the thirteen steps
components:                               # only: backgroundColor textColor typography rounded padding size height width. States are sibling keys.
  button-primary: { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", typography: "{typography.button-md}", rounded: "{rounded.control}", padding: "0 1.125rem", height: 2.75rem }
  button-primary-hover: { backgroundColor: "{colors.primary-dark}", textColor: "{colors.on-primary}" }
  button-quiet: { backgroundColor: "{colors.night}", textColor: "{colors.limewash}", typography: "{typography.button-md}", rounded: "{rounded.control}", padding: "0 1.125rem", height: 2.75rem }
  button-quiet-hover: { backgroundColor: "{colors.swell}", textColor: "{colors.limewash}" }
  skip-link: { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", typography: "{typography.button-sm}", rounded: "{rounded.control}", padding: "0.75rem 1rem" }
  search-box: { backgroundColor: "{colors.ink}", textColor: "{colors.limewash}", typography: "{typography.body-1}", rounded: "{rounded.control}", height: 4rem }
  search-box-header: { backgroundColor: "{colors.ink}", textColor: "{colors.limewash}", typography: "{typography.title-2}", rounded: "{rounded.control}", height: 2.75rem }
  suggestion: { backgroundColor: "{colors.ink}", textColor: "{colors.limewash}", typography: "{typography.body-3}", rounded: "{rounded.mark}", padding: "0.5625rem 0.75rem" }
  suggestion-chosen: { backgroundColor: "{colors.swell}", textColor: "{colors.primary}" }
  suggestion-note: { backgroundColor: "{colors.ink}", textColor: "{colors.tide}", typography: "{typography.data-2}" }
  field: { backgroundColor: "{colors.ink}", textColor: "{colors.limewash}", typography: "{typography.body-2}", rounded: "{rounded.control}", padding: "0.625rem 0.875rem", height: 2.875rem }
  field-label: { backgroundColor: "{colors.night}", textColor: "{colors.limewash}", typography: "{typography.title-2}" }
  field-error: { backgroundColor: "{colors.night}", textColor: "{colors.coral}", typography: "{typography.caption-1}" }
  chip: { backgroundColor: "{colors.night}", textColor: "{colors.limewash}", typography: "{typography.body-3}", rounded: "{rounded.control}", padding: "0 1rem", height: 2.75rem }
  chip-selected: { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}" }
  header: { backgroundColor: "{colors.night}", textColor: "{colors.limewash}", typography: "{typography.title-2}", height: 64px }
  nav-link: { backgroundColor: "{colors.night}", textColor: "{colors.haze}", typography: "{typography.title-2}", height: 2.75rem }
  nav-link-current: { backgroundColor: "{colors.night}", textColor: "{colors.limewash}" }
  wordmark: { backgroundColor: "{colors.night}", textColor: "{colors.limewash}", typography: "{typography.heading-2}" }
  hero-heading: { backgroundColor: "{colors.night}", textColor: "{colors.limewash}", typography: "{typography.display-1}" }
  page-heading: { backgroundColor: "{colors.night}", textColor: "{colors.limewash}", typography: "{typography.heading-1}" }
  section-heading: { backgroundColor: "{colors.night}", textColor: "{colors.limewash}", typography: "{typography.heading-2}" }
  lede: { backgroundColor: "{colors.night}", textColor: "{colors.haze}", typography: "{typography.body-1}" }
  row-title: { backgroundColor: "{colors.night}", textColor: "{colors.limewash}", typography: "{typography.title-1}" }
  row-title-hover: { backgroundColor: "{colors.night}", textColor: "{colors.primary}" }
  row-line: { backgroundColor: "{colors.night}", textColor: "{colors.haze}", typography: "{typography.body-3}" }
  row-data: { backgroundColor: "{colors.night}", textColor: "{colors.tide}", typography: "{typography.data-2}" }
  index-item: { backgroundColor: "{colors.night}", textColor: "{colors.limewash}", typography: "{typography.body-3}", height: 2.5rem }
  index-count: { backgroundColor: "{colors.night}", textColor: "{colors.tide}", typography: "{typography.data-2}" }
  column-label: { backgroundColor: "{colors.night}", textColor: "{colors.tide}", typography: "{typography.label-1}" }
  tag-guide: { backgroundColor: "{colors.night}", textColor: "{colors.primary}", typography: "{typography.label-1}" }
  tab: { backgroundColor: "{colors.night}", textColor: "{colors.haze}", typography: "{typography.title-2}", height: 2.75rem }
  tab-current: { backgroundColor: "{colors.night}", textColor: "{colors.limewash}" }
  fact-name: { backgroundColor: "{colors.night}", textColor: "{colors.tide}", typography: "{typography.body-3}" }
  fact-value: { backgroundColor: "{colors.night}", textColor: "{colors.limewash}", typography: "{typography.body-3}" }
  note: { backgroundColor: "{colors.ink}", textColor: "{colors.limewash}", typography: "{typography.body-3}", rounded: "{rounded.control}", padding: "1rem 1.125rem" }
  table-head: { backgroundColor: "{colors.ink}", textColor: "{colors.tide}", typography: "{typography.label-1}", padding: "0.75rem 0.875rem" }
  table-cell: { backgroundColor: "{colors.night}", textColor: "{colors.limewash}", typography: "{typography.body-3}", padding: "0.75rem 0.875rem" }
  citation: { backgroundColor: "{colors.night}", textColor: "{colors.tide}", typography: "{typography.data-2}" }
  citation-hover: { backgroundColor: "{colors.night}", textColor: "{colors.primary}" }
  chart-label: { backgroundColor: "{colors.night}", textColor: "{colors.tide}", typography: "{typography.label-1}" }
  chart-town: { backgroundColor: "{colors.night}", textColor: "{colors.haze}", typography: "{typography.label-1}" }
  footer-link: { backgroundColor: "{colors.night}", textColor: "{colors.haze}", typography: "{typography.body-3}", height: 2rem }
  credit: { backgroundColor: "{colors.night}", textColor: "{colors.haze}", typography: "{typography.caption-1}" }
---

# Design System: biznes.mu, the search engine

Recorded from the build on 20 November 2026. The code is the authority: `src/app/globals.css` holds
every token and component, and this document says what each is for and why. Where the two disagree,
the code is right and this is the bug.

## Overview

biznes.mu is a search engine for business in Mauritius: a directory, guides and the official
registers behind one box. The owner asked for a design that is "futuristic". The direction is the
**night chart**: the island of Mauritius drawn only by what is listed on it, each listing a point of
light at its own place, and one colour, saffron, for whatever answers a question.

It is an instrument, and it borrows a chart's manners: a dark sea, hairlines, a graticule lettered
in degrees and minutes, an inset for the island that lies off the sheet, and at the back an index
of names with numbers. Nothing is decoration. The picture is the data.

**The use scene decided light and dark.** The brief pinned "futuristic", and the one picture the
product has is lights on a dark sea, so the ground is dark. The hardest reader is on a phone
outdoors, so contrast is kept far above the minimum: primary words at 18:1, secondary at 10:1, and
nothing a reader needs under 5:1.

**Mode.** The site is a tool (impeccable's Operate) with reading pages (Read). Familiar controls, a
fixed type scale inside the tool, density where a list wants it, and motion only for a change of
state. The first screen alone is allowed a display size and the one authored moment.

### Sources

| ID | Source | Read | Gave |
|---|---|---|---|
| S1 | The mock-up the owner approved for biznes.mu on 17 November 2026 (in the repository's history: `.impeccable/mocks/comp-b-perspective.png` at commit `7e9398d`) | sampled 17 November 2026 | Saffron `#f8c618`, ink `#0a1639`, limewash `#f7f7f8`, coral `#f14949` |
| S2 | The owner, 20 November 2026 | in conversation | "Design should be futuristic" |
| S3 | OpenStreetMap, the Mauritius extract | the date in `data/index/meta.json` | The coast, the districts and every point on the chart |
| S4 | Archivo (Omnibus-Type), Geist and Geist Mono (Vercel) | files in `src/fonts` and the `geist` package | The three faces; all SIL OFL 1.1 |

What the brand lacked was a dark and a face for an instrument. Both were chosen, and are recorded as
chosen: night is derived from the brand's ink, and Archivo was picked for its width axis.

## Colors

### Palette

Nine values. Four are sampled from the brand's approved mock-up (S1); five are derived from them.

| Token | Value | From | Used for |
|---|---|---|---|
| `--palette-night` | `#050a1a` | derived from ink, darker | The page's ground |
| `--palette-ink` | `#0a1639` | sampled (S1) | A field, the search box, a note, a table's head, the fill of the land on the chart |
| `--palette-swell` | `#14224f` | derived from ink, lighter | A control under the pointer, a chosen suggestion |
| `--palette-saffron` | `#f8c618` | sampled (S1) | What answers: a lit point, the mark on a listing, the one filled action, focus, a title under the pointer |
| `--palette-saffron-deep` | `#e3b30d` | derived from saffron, darker | The filled action under the pointer |
| `--palette-limewash` | `#f7f7f8` | sampled (S1) | Words; the points of the chart |
| `--palette-haze` | `#b6c0db` | derived from limewash toward ink | Secondary words |
| `--palette-tide` | `#8794bb` | derived from haze toward night | Captions, a chart's lettering, a count in an index, a placeholder |
| `--palette-coral` | `#f14949` | sampled (S1) | An error's words, mark and edge |

### Roles

Components use roles, never palette values. Tailwind's own colours are switched off
(`--color-*: initial`), so only a role paints.

| Role | Value | Meaning |
|---|---|---|
| `paper` | night | The ground |
| `panel` | ink | A surface that stands off the ground |
| `raised` | swell | A surface under the pointer |
| `ink` | limewash | Words |
| `ink-subtle` | haze | Secondary words |
| `ink-faint` | tide | Tertiary words and a chart's lettering |
| `signal` | saffron | What answers a question; the one filled action |
| `signal-hover` | saffron-deep | The filled action under the pointer |
| `on-signal` | night | Words on saffron |
| `alert` | coral | An error |
| `line` | limewash at 13% | The hairline between rows |
| `line-strong` | limewash at 46% | An edge a control needs to be seen by |
| `focus` | saffron | The focus ring |

**Saffron has one meaning.** It is the answer: the points a question lights, the one mark on a
listing's chart, the action that does the page's job, the thing under the pointer or the keyboard.
It is never a decoration, a background for a section, or a second accent's rival. There is no
second accent.

### Contrast

Measured with `npm run contrast` (WCAG 2.x, alpha composited over the real ground, floored to two
decimals). Every pair of text passes AA for body text; every edge passes 3:1.

| Text or mark | On | Ratio | Where |
|---|---|---|---|
| limewash | night | 18.42:1 | Every heading and paragraph |
| haze | night | 10.84:1 | Secondary words |
| tide | night | 6.55:1 | Captions, a chart's lettering, counts |
| limewash | ink | 16.52:1 | A field, the search box, a note |
| haze | ink | 9.73:1 | Secondary words in a note |
| tide | ink | 5.88:1 | A placeholder, a table's column heads |
| limewash | swell | 14.30:1 | A suggestion under the pointer |
| tide | swell | 5.09:1 | A suggestion's note under the pointer |
| night | saffron | 12.28:1 | The filled action, a chosen chip, selected text |
| night | saffron-deep | 10.06:1 | The filled action under the pointer |
| saffron | night | 12.28:1 | A lit count, a guide's tag, the focus ring |
| saffron | ink | 11.02:1 | The focus ring on a field |
| saffron | swell | 9.53:1 | A chosen suggestion's label |
| coral | night | 5.43:1 | An error's words |
| coral | ink | 4.87:1 | An error's mark in a note |
| line-strong | night | 4.40:1 | A quiet button's edge, a chip's edge (a mark) |
| line-strong | ink | 4.36:1 | A field's edge, the search box's edge (a mark) |
| chart-coast | night | 3.24:1 | The coast on the chart (a graphic) |

The chart's points are limewash at 42% to 80% and its hairlines are fainter than 3:1. They are a
picture of what the lists beside them say in words, and the chart carries a sentence that says what
it shows.

## Typography

Three faces, each with one job.

- **Archivo**, set wide (`font-stretch` 114% to 125%), speaks for the site: its name, the first
  screen's line, a page's title, a section's heading. One file with a width axis
  (`src/fonts/archivo-latin-wdth-normal.woff2`), so the wide cut and the regular are the same face.
  Chosen for the instrument: a wide grotesque reads as a nameplate, not a headline.
- **Geist** carries every sentence and control.
- **Geist Mono** carries what is measured or looked up, and only that: a count, a coordinate, a
  telephone number, a date, a web address, a source number, a column's head, a town's name on the
  chart. It is never used to make a sentence look technical.

### Hierarchy

| Style | Face | Size | Weight | Line | Tracking | Used for |
|---|---|---|---|---|---|---|
| `display-1` | Archivo 125% | `clamp(2.375rem, 1.1rem + 5.4vw, 5.25rem)` | 640 | 0.98 | -0.032em | The first screen's line, once |
| `heading-1` | Archivo 120% | `clamp(1.875rem, 1.3rem + 2.2vw, 2.875rem)` | 620 | 1.04 | -0.026em | A page's title |
| `heading-2` | Archivo 114% | `clamp(1.375rem, 1.2rem + 0.7vw, 1.75rem)` | 600 | 1.14 | -0.018em | A section's heading |
| `heading-3` | Geist | 1.125rem | 600 | 1.3 | -0.01em | A sub-heading, a row's title on an index page |
| `title-1` | Geist | 1.0625rem | 600 | 1.35 | -0.006em | A row's title, a fact's value |
| `title-2` | Geist | 0.9375rem | 600 | 1.4 | 0 | A label, a link in the header, a tab |
| `body-1` | Geist | 1.125rem | 400 | 1.55 | 0 | A lede |
| `body-2` | Geist | 1rem | 400 | 1.6 | 0 | A guide's prose |
| `body-3` | Geist | 0.875rem | 400 | 1.55 | 0 | A row's line, a fact, an index item |
| `caption-1` | Geist | 0.8125rem | 400 | 1.45 | 0 | A caption, a hint, an error |
| `data-1` | Geist Mono | 0.875rem | 400 | 1.5 | -0.01em | A telephone number, a figure, an address |
| `data-2` | Geist Mono | 0.75rem | 400 | 1.4 | 0 | A count, a date, a source number |
| `label-1` | Geist Mono, capitals | 0.75rem | 400 | 1.3 | 0.08em | A column's head, a kind of result, a chart's lettering |
| `button-md` | Geist | 0.9375rem | 600 | 1.2 | 0 | An action |
| `button-sm` | Geist | 0.8125rem | 600 | 1.2 | 0 | A small action |

Nothing is under 12px. Headings balance their lines; paragraphs avoid a short last line. Prose is
held to 68 characters (`measure`, `.prose`). The tightest tracking is -0.032em.

## Layout

- **The shell** is 82rem wide with a gutter of `clamp(1rem, 4vw, 3rem)`. The header is 64px.
- **Twelve columns** from 68rem (`chart:`): words on seven, the chart on five. On the first screen,
  six and six. Below that width the chart follows the words, or is left out beside a list.
- **Sections** are separated by a hairline and 4rem. More space above a heading than below it.
- **Lists are rows between hairlines** (`.rows`), never cards. A whole row answers to its title's
  link.
- **An index** (`.index-cols`) sets names and counts in one to four columns, as at the back of an
  atlas: the directory, the towns, a group's categories.
- **Facts** (`.facts`) are a name and a value in two columns, one on a phone.
- A grid's child may always shrink to its column, so a wide table scrolls inside its own frame and
  the page is never wider than the screen.

## Elevation & Depth

Flat. Depth is said by a hairline and by a step of the ground (night, ink, swell), not by shadow.
Two things lift, because they sit over other content: the list of suggestions under the search box
(`0 24px 48px -20px` black at 70%), and the search box while it has focus (a soft saffron shadow
beneath it, `0 10px 40px -18px`). Both have an offset and a blur; neither is a glow.

## Shapes

- **Corners are small**: 2px for a mark, 4px for a control, 8px for a panel. There are no pills.
- **The lit point**: a filled saffron circle with a fainter halo. It is the dot in the name, the
  point a search lights and the mark on a listing.
- **The link preview card** (`public/og.jpg`) is the name, the line and the chart at 1200 by 630,
  captured from the site itself by `npm run og`.
- **Corner marks** (`.ticked`): two L-shaped ticks at opposite corners of a frame, as a chart's
  neatline carries. On the first screen's chart only.
- **The hairline**: one pixel, limewash at 13%.
- **Icons**: one drawn set (`src/components/Icons.tsx`), 24px grid, 1.5px round strokes, always
  beside words.

## Components

Each is a class in `globals.css` or a file in `src/components`. States are part of the component.

- **Search box** (`SearchBox.tsx`, `.search`): a plain form that asks `/search`. Large on the first
  screen and the results page, compact in the header. Rest, hover (edge brightens), focus (saffron
  edge and shadow, the glass turns saffron). With script it is a combobox: up to eight suggestions,
  arrow keys, Enter, Escape. A suggestion shows a label and a note in the mono face; the chosen one
  sits on swell with its label in saffron.
- **Buttons** (`.btn`): filled (saffron, one in any group) and quiet (an edge). Hover, pressed (1px
  down), focus, disabled. 44px tall.
- **Fields** (`.field`): on ink with an edge. Hover, focus, invalid (coral edge, the error in words
  beneath with a mark), placeholder in tide. A select draws its own arrow.
- **Chips** (`.chip`): a radio drawn as a tab; chosen is saffron.
- **Rows** (`Rows.tsx`): a listing (name, what and where, a line about it, a telephone link and a
  site), a guide (a saffron tag, title, summary, the section that answers, the day checked), an
  official page and a website (each opens on its own site, marked with an arrow).
- **Tabs** (`.tabs`): links with the current one underlined in saffron; scroll sideways on a phone.
- **Crumbs**, **pager**, **index item**, **page head**: `Bits.tsx`.
- **Guide blocks** (`GuideBlocks.tsx`): a paragraph, a list, steps, a note, a table. Each ends with
  its source numbers in the mono face, linked to the source. A table scrolls inside a frame the
  keyboard can reach.
- **The chart** (`Chart.tsx`, `ChartLive.tsx`): see below.
- **The request form** (`RequestForm.tsx`): errors on their own fields, focus to the first, a
  success that says what happens next, and a failure that gives the telephone and the email.
- **The wait** (`.wait`): a moving band on ink, for a shape that holds a place.
- **Header and footer**: the header is the name, four ways in, the search box and the way to add a
  listing; on a phone the four ways in are a second row that scrolls sideways, and nothing hides
  behind a menu. The footer credits the map on every page, as its licence asks.

## The chart

One drawing of the island, used everywhere (`src/lib/chart.ts`).

- **Projection**: equirectangular, scaled at the island's own latitude, 1000 units wide. A point is
  in the same place on every page.
- **Drawn in SVG**, so it is whole without script: a graticule every tenth of a degree, the coast
  and the districts from the open map, and the listings gathered into cells of nine units, a cell's
  dot larger and brighter the more it holds (three steps).
- **Live** with script: a canvas draws every listing as its own point (1.5px, limewash). It draws
  only when something changes, never in a loop. Once it has drawn, the gathered dots are hidden.
- **Lit**: saffron, a core of 1.7px and a halo of 5.5px. When a set is lit the rest dim.
- **Rodrigues** is in an inset at the south-east corner at 72% of the main scale, labelled with its
  distance, which is worked out from the two islands' positions.
- **Lettering**: degrees and minutes at the frame, and the nine largest towns that do not crowd one
  another, drawn above the points so they stay readable.
- **A listing's mark**: a ring, a point and two crossing lines to the frame.
- **To assistive technology** it is one image with a sentence that says what it shows. Everything
  it shows is in the lists beside it.

## Motion

- **State changes** take 160ms on the site's one curve, `cubic-bezier(0.16, 1, 0.3, 1)`.
- **One authored moment**: on the first screen, as a question is typed, the points that answer come
  up over 360ms and the rest dim.
- **No entrance animations, no scroll effects, nothing that moves by itself.**
- **Reduced motion**: transitions are cut to nothing and the points are lit at once.

## Responsive Behavior

- **Under 68rem** the chart sits under the first screen's words, and is left out beside lists.
- **Under 64rem** the four ways in move to a second row of the header.
- **Under 40rem** indexes are one column, facts stack, and the header's search box takes the row.
- Targets are 44px, or 24px for a link inside a line of text.
- Checked at 1440 by 900 and 390 by 844 on every kind of page: no page is wider than its screen.

## Do's and Don'ts

Do:

- Put the search box first.
- Show many things as rows between hairlines, or as an index.
- Use saffron only for what answers, the one action, and what is under the pointer or the keyboard.
- Set a figure, a date, a number or an address in the mono face.
- Say where a thing came from, beside it.

Don't:

- Use a card grid, a tile of icon, heading and text, or a big number over a small label.
- Put a small label above a heading.
- Add a second accent, a gradient, a glow, or glass.
- Set a sentence in the mono face.
- Draw anything on the chart that is not in the data.
- Animate an entrance.
- Use a photograph or a generated picture.

## Agent Guide

- Every value goes through a token. `npm run tokens` fails on an invented size, space, radius or
  colour.
- A new colour is a palette value with its source and its measured contrast, then a role. Add its
  pairs to `scripts/contrast.pairs.json` and run `npm run contrast`.
- A new list is `.rows` with a row component; a new set of names is `.index-cols`.
- A new fact on the site is data: `src/data/site.ts`, `content/guides`, or the crawler's output.
  Never a string in a component.
- A link that appears by the dozen carries `prefetch={false}`.
- The chart takes `lit` (positions from `chartPoints()`), `focus` (one listing) or `follow` (the
  first screen). It needs `says`.
- House style in every file: British spelling, plain sentences, no em or en dashes
  (`npm run copy`).

## Known Gaps

- **No light palette.** An instrument has a day mode, and a phone in the sun would use one. The
  roles are clean enough to add one; it is not built.
- **The chart cannot be explored**: a point cannot be hovered or opened, and it does not zoom to a
  town.
- **French pages** are not built. A question in French or Kreol is understood.
- **No fresh-eyes design review has been run on this round** (README, "Verification").
