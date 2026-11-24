---
version: alpha
name: "biznes.mu, the postcard"
description: "The postcard: a painted picture of the island behind the page, a sheet of warm paper laid on it, one question in the middle. Ink for words, a royal blue for what answers, and saffron for the one lit point and the one filled action."
# On Google Labs' DESIGN.md format (npx @google/design.md lint DESIGN.md), from the KOS template.
# Each colour is recorded as the comments in src/app/globals.css record it: 'sampled' (the brand's
# own value from S1, the chosen mock-up S2, or the lagoon picture S5), 'derived' (worked out from a
# sampled value, with the direction and the reason) or 'chosen' (what the brand lacked).
# Each key is the code's --palette-* name, except primary, primary-dark and on-primary, which the
# format asks for: they are --palette-saffron, --palette-saffron-deep and --palette-ink.
# One palette value is in the code and carries no words, so it is not a token here: coral, the
# brand's red, used once as decoration (the awning over Baz Manzer). The line-* values are the code's own color-mix() with the variable
# written out.
colors:
  primary: "#f8c618"        # S1 sampled: the brand's action. --palette-saffron. A fill, never words; carries ink at 11.02:1
  primary-dark: "#e3b30d"   # derived from primary, darker: the filled action under the pointer; carries ink at 9.03:1. --palette-saffron-deep
  on-primary: "#0a1639"     # ink, the words on saffron
  white: "#ffffff"          # chosen: a card, a field, the menu. What stands on the paper
  cream: "#fdf9ec"          # derived, saffron 8% on white: the sheet of paper the page is written on
  sand: "#f5efe0"           # derived from cream, deeper: a tile, a chip, a quiet panel
  limewash: "#f7f7f8"       # S1 sampled: the brand's white. Now only the band of a shape that waits
  ink: "#0a1639"            # S1 sampled: the brand's dark. Words: 17.69:1 on white, 16.80:1 on cream, 15.42:1 on sand
  swell: "#14224f"          # derived from ink, lighter: the ink button under the pointer
  slate: "#404965"          # derived, ink 78% toward white: secondary words; 8.90:1 on white, 8.45:1 on cream, 7.76:1 on sand
  mist: "#626a80"           # derived, ink 65% toward white: captions, counts; 5.39:1 on white, 5.12:1 on cream, 4.70:1 on sand
  ember: "#ff8f4a"          # derived, saffron toward coral: the far end of the verified mark; carries ink at 7.81:1
  saffron-wash: "#fef6d9"   # derived, saffron 16% on white: a chosen thing; carries ink at 16.34:1
  royal: "#0d36a7"          # S2 sampled: what answers. 9.98:1 on white, 9.48:1 on cream
  shallows: "#dcefeb"       # derived: the lagoon picture's water at 27% on white. The sea on the island's map; carries ink at 14.82:1
  lagoon-deep: "#7bbcb3"    # S5 sampled from the lagoon picture's water: the map's coastline. A line, never words
  lagoon: "#aebadf"         # S2 sampled: a pale blue. At 45% on white (#dbe0f1) it is the tile of an answer from the articles; royal on that is 7.58:1
  haze: "#b6c0db"           # derived from limewash toward ink: captions on the footer's ink; 9.73:1 on ink
  coral-deep: "#c12a2a"     # derived from coral (S1), darker: an error's words; 5.78:1 on white, 5.48:1 on cream
  glass-floor: "#8a8a8a"     # frosted glass at its darkest: white at 54% over black, the darkest a picture could be; carries ink at 5.16:1
  flame: "#ed4120"          # S5 sampled from the flamboyant picture's flowers: a falling flamboyant petal. A drawing, never words
  flame-light: "#f35a32"    # S5 sampled from the same flowers, in the light: the petal's line
  frond: "#446926"          # S5 sampled from the rain picture's leaves: a falling green leaf
  frond-light: "#5a7e36"    # S5 sampled from the same leaves, in the light: the leaf's vein
  plume: "#f1c8b1"          # S5 sampled from the cane picture's flowers: a falling wisp of cane flower
  plume-light: "#fadcbb"    # S5 sampled from the same flowers, in the light: the wisp's down
  straw: "#c68644"          # S5 sampled from the harvest picture's cut cane: a falling dry leaf
  straw-deep: "#af7136"     # S5 sampled from the same cane, in shade: the dry leaf's vein
  bract: "#d32e62"          # S5 sampled from the street food picture's bougainvillea: a falling petal of it
  bract-light: "#e03e73"    # S5 sampled from the same flowers, in the light: the petal's vein
  line: "color-mix(in srgb, #0a1639 10%, transparent)"         # derived: ink at 10%, the hairline
  line-strong: "color-mix(in srgb, #0a1639 50%, transparent)"  # derived: ink at 50%, a field's edge; 3.40:1 on white
typography:                 # named as the text styles in src/app/globals.css; fontSize is the clamp() maximum, the full clamp() is in Typography
  # One face. label-1 is capitals by text-transform. data-1 and data-2 are the same face with figures that line up.
  display-1: { fontFamily: "Bricolage Grotesque, Manrope, ui-sans-serif, system-ui, sans-serif", fontSize: 4.5rem, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.03em" }
  heading-1: { fontFamily: "Bricolage Grotesque, Manrope, ui-sans-serif, system-ui, sans-serif", fontSize: 2.75rem, fontWeight: 650, lineHeight: 1.08, letterSpacing: "-0.024em" }
  heading-2: { fontFamily: "Bricolage Grotesque, Manrope, ui-sans-serif, system-ui, sans-serif", fontSize: 1.75rem, fontWeight: 650, lineHeight: 1.18, letterSpacing: "-0.018em" }
  heading-3: { fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif", fontSize: 1.125rem, fontWeight: 600, lineHeight: 1.3, letterSpacing: "-0.015em" }
  title-1: { fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif", fontSize: 1.0625rem, fontWeight: 600, lineHeight: 1.35, letterSpacing: "-0.012em" }
  title-2: { fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif", fontSize: 0.875rem, fontWeight: 600, lineHeight: 1.4, letterSpacing: "-0.005em" }
  body-1: { fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif", fontSize: 1.125rem, fontWeight: 400, lineHeight: 1.55, letterSpacing: "-0.008em" }
  body-2: { fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif", fontSize: 1rem, fontWeight: 400, lineHeight: 1.65 }
  body-3: { fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif", fontSize: 0.875rem, fontWeight: 400, lineHeight: 1.55 }
  caption-1: { fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif", fontSize: 0.8125rem, fontWeight: 400, lineHeight: 1.5 }
  data-1: { fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif", fontSize: 0.875rem, fontWeight: 500, lineHeight: 1.5, fontFeature: "'tnum'" }
  data-2: { fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif", fontSize: 0.8125rem, fontWeight: 500, lineHeight: 1.45, fontFeature: "'tnum'" }
  label-1: { fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif", fontSize: 0.75rem, fontWeight: 700, lineHeight: 1.3, letterSpacing: "0.08em" }
  button-md: { fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif", fontSize: 0.9375rem, fontWeight: 600, lineHeight: 1.2 }
  button-sm: { fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif", fontSize: 0.8125rem, fontWeight: 600, lineHeight: 1.2 }
rounded: { sm: 8px, md: 12px, lg: 16px, xl: 24px, 2xl: 32px, full: 9999px }   # --radius-sm to --radius-2xl and --radius-full
spacing: { gutter: 3rem, edge: 1.25rem, shell: 76rem, measure: 64ch, nav: 56px, hero: 44rem, section: 4rem }   # the page rhythm, each at its maximum
components:                 # only: backgroundColor textColor typography rounded padding size height width. States are sibling keys.
  sheet: { backgroundColor: "{colors.cream}", textColor: "{colors.ink}", typography: "{typography.body-2}", rounded: "{rounded.2xl}" }
  sheet-subtle: { backgroundColor: "{colors.cream}", textColor: "{colors.slate}", typography: "{typography.body-3}" }
  sheet-faint: { backgroundColor: "{colors.cream}", textColor: "{colors.mist}", typography: "{typography.caption-1}" }
  hero-heading: { backgroundColor: "{colors.cream}", textColor: "{colors.ink}", typography: "{typography.display-1}" }
  page-heading: { backgroundColor: "{colors.cream}", textColor: "{colors.ink}", typography: "{typography.heading-1}" }
  section-heading: { backgroundColor: "{colors.cream}", textColor: "{colors.ink}", typography: "{typography.heading-2}" }
  lede: { backgroundColor: "{colors.cream}", textColor: "{colors.slate}", typography: "{typography.body-1}" }
  link: { backgroundColor: "{colors.cream}", textColor: "{colors.royal}", typography: "{typography.body-2}" }
  button-primary: { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", typography: "{typography.button-md}", rounded: "{rounded.full}", padding: "0 1.25rem", height: 2.75rem }
  button-primary-hover: { backgroundColor: "{colors.primary-dark}", textColor: "{colors.on-primary}" }
  button-ink: { backgroundColor: "{colors.ink}", textColor: "{colors.white}", typography: "{typography.button-md}", rounded: "{rounded.full}", padding: "0 1.25rem", height: 2.75rem }
  button-ink-hover: { backgroundColor: "{colors.swell}", textColor: "{colors.white}" }
  button-quiet: { backgroundColor: "{colors.white}", textColor: "{colors.ink}", typography: "{typography.button-md}", rounded: "{rounded.full}", padding: "0 1.25rem", height: 2.75rem }
  button-quiet-hover: { backgroundColor: "{colors.sand}", textColor: "{colors.ink}" }
  skip-link: { backgroundColor: "{colors.ink}", textColor: "{colors.white}", typography: "{typography.button-sm}", rounded: "{rounded.full}", padding: "0.75rem 1rem" }
  icon-button: { backgroundColor: "{colors.cream}", textColor: "{colors.slate}", size: 2.75rem }
  icon-button-square: { backgroundColor: "{colors.sand}", textColor: "{colors.ink}", rounded: "{rounded.lg}", size: 2.75rem }
  badge: { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", rounded: "{rounded.full}", height: 1.125rem }
  nav-pill: { backgroundColor: "{colors.white}", textColor: "{colors.ink}", rounded: "{rounded.full}", height: 56px }
  nav-link: { backgroundColor: "{colors.white}", textColor: "{colors.ink}", typography: "{typography.title-2}", rounded: "{rounded.full}", height: 2.75rem }
  nav-link-open: { backgroundColor: "{colors.sand}", textColor: "{colors.ink}" }
  menu-panel: { backgroundColor: "{colors.white}", textColor: "{colors.ink}", rounded: "{rounded.xl}", padding: 0.5rem, width: 36rem }
  menu-item: { backgroundColor: "{colors.white}", textColor: "{colors.ink}", typography: "{typography.title-2}", rounded: "{rounded.md}", padding: "0.625rem 0.75rem" }
  menu-item-line: { backgroundColor: "{colors.white}", textColor: "{colors.mist}", typography: "{typography.caption-1}" }
  menu-item-hover: { backgroundColor: "{colors.sand}", textColor: "{colors.ink}" }
  menu-item-current: { backgroundColor: "{colors.saffron-wash}", textColor: "{colors.ink}" }
  tab-bar: { backgroundColor: "{colors.white}", textColor: "{colors.ink}", rounded: "{rounded.xl}", height: 3.25rem }
  tab-bar-current: { backgroundColor: "{colors.saffron-wash}", textColor: "{colors.ink}", rounded: "{rounded.lg}" }
  search-box: { backgroundColor: "{colors.white}", textColor: "{colors.ink}", rounded: "{rounded.full}", height: 4rem }
  search-box-placeholder: { backgroundColor: "{colors.white}", textColor: "{colors.mist}" }
  search-box-header: { backgroundColor: "{colors.sand}", textColor: "{colors.ink}", rounded: "{rounded.full}", height: 2.75rem }
  search-box-header-placeholder: { backgroundColor: "{colors.sand}", textColor: "{colors.mist}" }
  suggestions: { backgroundColor: "{colors.white}", textColor: "{colors.ink}", rounded: "{rounded.xl}", padding: 0.5rem }
  suggestion: { backgroundColor: "{colors.white}", textColor: "{colors.ink}", typography: "{typography.body-3}", rounded: "{rounded.md}", padding: "0.5rem 0.75rem", height: 2.75rem }
  suggestion-chosen: { backgroundColor: "{colors.sand}", textColor: "{colors.ink}" }
  suggestion-note: { backgroundColor: "{colors.white}", textColor: "{colors.mist}", typography: "{typography.data-2}" }
  suggestion-icon: { backgroundColor: "{colors.sand}", textColor: "{colors.slate}", rounded: "{rounded.sm}", size: 2rem }
  pill-note: { backgroundColor: "{colors.white}", textColor: "{colors.ink}", typography: "{typography.caption-1}", rounded: "{rounded.full}", height: 2rem }
  try-pill: { backgroundColor: "{colors.white}", textColor: "{colors.ink}", typography: "{typography.body-3}", rounded: "{rounded.full}", height: 2.5rem }
  landing-foot: { backgroundColor: "{colors.white}", textColor: "{colors.ink}", typography: "{typography.caption-1}", rounded: "{rounded.xl}", padding: "0.125rem 1.25rem" }
  frosted-glass: { backgroundColor: "{colors.glass-floor}", textColor: "{colors.ink}" }
  # What falls over the landing page: one drawing a season, a body and the line drawn on it. Decoration: no words stand on either.
  fall-flamboyant: { backgroundColor: "{colors.flame}", size: 1.5rem }
  fall-flamboyant-line: { backgroundColor: "{colors.flame-light}", height: 1px }
  fall-green: { backgroundColor: "{colors.frond}", size: 1.5rem }
  fall-green-line: { backgroundColor: "{colors.frond-light}", height: 1px }
  fall-plume: { backgroundColor: "{colors.plume}", size: 1.5rem }
  fall-plume-line: { backgroundColor: "{colors.plume-light}", height: 1px }
  fall-dry: { backgroundColor: "{colors.straw}", size: 1.5rem }
  fall-dry-line: { backgroundColor: "{colors.straw-deep}", height: 1px }
  fall-bougainvillea: { backgroundColor: "{colors.bract}", size: 1.5rem }
  fall-bougainvillea-line: { backgroundColor: "{colors.bract-light}", height: 1px }
  leaves-toggle: { backgroundColor: "{colors.glass-floor}", textColor: "{colors.ink}", rounded: "{rounded.full}", size: 2.25rem }
  landing-foot-link: { backgroundColor: "{colors.white}", textColor: "{colors.ink}", typography: "{typography.caption-1}", height: 2.25rem }
  field: { backgroundColor: "{colors.white}", textColor: "{colors.ink}", rounded: "{rounded.md}", padding: "0.6875rem 1rem", height: 3rem }
  field-placeholder: { backgroundColor: "{colors.white}", textColor: "{colors.mist}" }
  field-edge: { backgroundColor: "{colors.line-strong}", height: 1px }
  field-error: { backgroundColor: "{colors.cream}", textColor: "{colors.coral-deep}", typography: "{typography.caption-1}" }
  chip: { backgroundColor: "{colors.cream}", textColor: "{colors.ink}", typography: "{typography.body-3}", rounded: "{rounded.full}", padding: "0 1.125rem", height: 2.75rem }
  chip-selected: { backgroundColor: "{colors.ink}", textColor: "{colors.white}" }
  filter: { backgroundColor: "{colors.white}", textColor: "{colors.ink}", typography: "{typography.body-3}", rounded: "{rounded.full}", padding: "0 0.875rem", height: 2.5rem }
  filter-count: { backgroundColor: "{colors.white}", textColor: "{colors.mist}", typography: "{typography.data-2}" }
  filter-hover: { backgroundColor: "{colors.sand}", textColor: "{colors.ink}" }
  filter-on: { backgroundColor: "{colors.ink}", textColor: "{colors.white}" }
  filter-menu: { backgroundColor: "{colors.white}", textColor: "{colors.ink}", typography: "{typography.body-3}", rounded: "{rounded.lg}", padding: 0.375rem }
  tab: { backgroundColor: "{colors.cream}", textColor: "{colors.slate}", typography: "{typography.title-2}", rounded: "{rounded.full}", padding: "0 1rem", height: 2.5rem }
  tab-hover: { backgroundColor: "{colors.sand}", textColor: "{colors.ink}" }
  tab-current: { backgroundColor: "{colors.ink}", textColor: "{colors.white}" }
  tag: { backgroundColor: "{colors.sand}", textColor: "{colors.slate}", typography: "{typography.label-1}", rounded: "{rounded.full}", height: 1.5rem }
  tag-lit: { backgroundColor: "{colors.saffron-wash}", textColor: "{colors.ink}" }
  biznes-card: { backgroundColor: "{colors.white}", textColor: "{colors.ink}", rounded: "{rounded.xl}", padding: "1.125rem 1.125rem 1.125rem 1.25rem" }
  biznes-card-title: { backgroundColor: "{colors.white}", textColor: "{colors.royal}", typography: "{typography.title-1}" }
  biznes-card-line: { backgroundColor: "{colors.white}", textColor: "{colors.slate}", typography: "{typography.body-3}" }
  biznes-card-icon: { backgroundColor: "{colors.ink}", textColor: "{colors.primary}", rounded: "{rounded.lg}", size: 3rem }
  biznes-card-icon-paid: { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}" }
  biznes-card-icon-article: { backgroundColor: "{colors.lagoon}", textColor: "{colors.royal}" }
  biznes-card-icon-quiet: { backgroundColor: "{colors.sand}", textColor: "{colors.slate}" }
  biznes-card-act: { backgroundColor: "{colors.sand}", textColor: "{colors.ink}", typography: "{typography.data-2}", rounded: "{rounded.full}", height: 2.25rem }
  business-head: { backgroundColor: "{colors.white}", textColor: "{colors.ink}", typography: "{typography.heading-1}", rounded: "{rounded.2xl}" }
  business-head-icon: { backgroundColor: "{colors.ink}", textColor: "{colors.primary}", size: 4.5rem }
  verified-mark: { backgroundColor: "{colors.primary}", textColor: "{colors.ink}", rounded: "{rounded.full}", height: 1.5rem }
  verified-mark-far-end: { backgroundColor: "{colors.ember}", textColor: "{colors.ink}" }
  verified-mark-large: { backgroundColor: "{colors.primary}", textColor: "{colors.ink}", rounded: "{rounded.full}", height: 2rem }
  answer-card: { backgroundColor: "{colors.white}", textColor: "{colors.ink}", typography: "{typography.body-1}", rounded: "{rounded.xl}", padding: 1.5rem }
  card: { backgroundColor: "{colors.white}", textColor: "{colors.ink}", rounded: "{rounded.xl}", padding: 1.5rem }
  card-heading: { backgroundColor: "{colors.white}", textColor: "{colors.ink}", typography: "{typography.heading-3}" }
  card-wash: { backgroundColor: "{colors.saffron-wash}", textColor: "{colors.ink}" }
  card-wash-title: { backgroundColor: "{colors.saffron-wash}", textColor: "{colors.royal}", typography: "{typography.title-1}" }
  card-wash-note: { backgroundColor: "{colors.saffron-wash}", textColor: "{colors.slate}", typography: "{typography.caption-1}" }
  card-panel: { backgroundColor: "{colors.sand}", textColor: "{colors.ink}" }
  card-ink: { backgroundColor: "{colors.ink}", textColor: "{colors.white}", rounded: "{rounded.xl}", padding: 1.5rem }
  tile-icon: { backgroundColor: "{colors.ink}", textColor: "{colors.primary}", rounded: "{rounded.lg}", size: 3rem }
  tile-icon-hover: { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}" }
  glyph: { backgroundColor: "{colors.white}", textColor: "{colors.ink}", size: 1.5rem }
  glyph-point-lit: { backgroundColor: "{colors.primary}", textColor: "{colors.ink}", rounded: "{rounded.full}" }
  tile-icon-quiet: { backgroundColor: "{colors.white}", textColor: "{colors.ink}", rounded: "{rounded.md}", size: 2.25rem }
  index-item: { backgroundColor: "{colors.cream}", textColor: "{colors.ink}", typography: "{typography.body-3}" }
  index-count: { backgroundColor: "{colors.cream}", textColor: "{colors.mist}", typography: "{typography.data-2}" }
  fact-name: { backgroundColor: "{colors.cream}", textColor: "{colors.mist}", typography: "{typography.body-3}" }
  fact-value: { backgroundColor: "{colors.cream}", textColor: "{colors.ink}", typography: "{typography.data-1}" }
  note: { backgroundColor: "{colors.sand}", textColor: "{colors.ink}", typography: "{typography.body-3}", rounded: "{rounded.lg}", padding: "1rem 1.25rem" }
  note-subtle: { backgroundColor: "{colors.sand}", textColor: "{colors.slate}" }
  table-head: { backgroundColor: "{colors.sand}", textColor: "{colors.mist}", typography: "{typography.label-1}", padding: "0.8125rem 1rem" }
  table-cell: { backgroundColor: "{colors.cream}", textColor: "{colors.ink}", typography: "{typography.body-3}", padding: "0.8125rem 1rem" }
  citation: { backgroundColor: "{colors.sand}", textColor: "{colors.royal}", rounded: "{rounded.full}" }
  citation-hover: { backgroundColor: "{colors.royal}", textColor: "{colors.white}" }
  toast: { backgroundColor: "{colors.ink}", textColor: "{colors.white}", typography: "{typography.body-3}", rounded: "{rounded.full}", height: 2.75rem }
  wait: { backgroundColor: "{colors.limewash}", rounded: "{rounded.sm}" }
  divider: { backgroundColor: "{colors.line}", height: 1px }
  island: { backgroundColor: "{colors.shallows}", textColor: "{colors.ink}", typography: "{typography.label-1}", rounded: "{rounded.xl}" }
  island-coast: { backgroundColor: "{colors.lagoon-deep}", height: 1.25px }
  island-lit: { backgroundColor: "{colors.primary}", size: 4.2px }
  baz-kind: { backgroundColor: "{colors.sand}", textColor: "{colors.ink}", typography: "{typography.title-2}", rounded: "{rounded.lg}", padding: "0.75rem 1rem" }
  baz-kind-count: { backgroundColor: "{colors.sand}", textColor: "{colors.mist}", typography: "{typography.data-2}" }
  baz-icon-tile: { backgroundColor: "{colors.ink}", textColor: "{colors.primary}", rounded: "{rounded.md}", size: 2.5rem }
  baz-food: { backgroundColor: "{colors.white}", textColor: "{colors.ink}", typography: "{typography.title-2}", rounded: "{rounded.lg}", padding: "0.625rem 0.75rem" }
  baz-mark: { backgroundColor: "{colors.ink}", rounded: "{rounded.sm}", size: 2rem }
  footer: { backgroundColor: "{colors.ink}", textColor: "{colors.white}", typography: "{typography.body-3}", rounded: "{rounded.2xl}" }
  footer-caption: { backgroundColor: "{colors.ink}", textColor: "{colors.haze}", typography: "{typography.caption-1}" }
  footer-mark: { backgroundColor: "{colors.primary}", textColor: "{colors.ink}", size: 4.5rem }
---

# Design System: biznes.mu, the postcard

Recorded on 20 November 2026 from the working tree after commit `372a1f9`, while the round was
still open and other hands were still building in the same checkout. The code is the authority:
`src/app/globals.css` holds every token and component, and this document says what each is for and
why. Where the two disagree, the code is right and this is the bug.

## Overview

**Creative North Star: "The postcard"**

biznes.mu is a search engine for business in Mauritius: a directory, guides and the official
registers behind one box. The page is a painted picture of the island with a sheet of warm paper
laid on it. The landing page is the picture alone, with the site's one line and the search in the
middle of it. The picture changes with the season and the public holiday. The paper, the ink and
the saffron point do not.

The owner's brief of 20 November 2026 set it: "i dont want too corporate, still want an easy
feeling for people coming to us, we can have a background image that i can change with time, main
search bar in the middle, then a theme that can change with season or local holidays themes
automatically". It replaces the night chart, of which the owner said: "Too dark and techy", "Too
plain", "Fonts feel generic", "Hard to scan and use". `STORY.md` has the round.

**The use scene decided light and dark.** The reader is anyone on the island, often on a phone
outdoors, and the owner asked for an easy feeling. So the ground is warm paper and the words are
the brand's own ink: 16.80:1 on the sheet, 17.69:1 on a card. Secondary words are never under
7.45:1, and no words are under 4.5:1 on any ground that is one colour.

**Mode.** The site is a tool (impeccable's Operate) with reading pages (Read). Familiar controls, a
fixed type scale, cards where a list holds things to act on, and motion only for a change of
state. The landing page alone is allowed the display size and the full picture.

**Key characteristics**

- A fixed picture behind everything, and a sheet of `cream` with 32px corners laid on it.
- Two faces: Manrope for the name, every sentence and every control; Bricolage Grotesque for the
  titles alone.
- Pills: the menu, the search box, every button, filter and tab.
- Ink tiles with a saffron icon: a directory group, a tool, a listing, the business's own page.
- Royal blue for what answers. Saffron for the one lit point and the one filled action.
- The verified mark, saffron running to ember, kept for a verified business.
- A dark footer card with the b standing on its edge.

**Refusals**

- No picture is captioned as a photograph. All eighteen are generated illustrations and say so.
- Nothing but a verified business wears saffron running to ember.
- No dark page. Dark is for the footer and for a card that is meant to be noticed.
- No second face, and no monospaced face for figures.

### Sources

| ID | Source | Read | Gave |
|---|---|---|---|
| S1 | The mock-up the owner approved for biznes.mu on 17 November 2026 (in the repository's history: `.impeccable/mocks/comp-b-perspective.png` at commit `7e9398d`) | sampled 17 November 2026 | Saffron `#f8c618`, ink `#0a1639`, limewash `#f7f7f8`, coral `#f14949` |
| S2 | The mock-up the owner chose on 20 November 2026, "2 · Centred" of three. A generated picture, kept in the design skill's working files (`.impeccable/mocks/comp-2-centred.png`), which are not committed | sampled 20 November 2026 | Royal `#0d36a7`, lagoon `#aebadf` |
| S3 | The owner, 20 November 2026, in conversation, with three reference images (a golf club's site, an invoicing site, a design tool's site) | in conversation; the images are not in the repository | The manner: paper over a picture, a floating pill menu, dark tiles, a dark footer with the emblem on its edge, the search in the middle, a picture that follows the calendar, a vivid mark for a paid business |
| S4 | Manrope, by the Manrope Project Authors, SIL Open Font Licence 1.1 | the file and its licence in `src/fonts` | The one face, and the outlines of the name's letters |
| S5 | The eighteen pictures, each painted wide and tall, generated as illustrations for the site (Higgsfield, model gpt_image_2_6; ten wide on 20 November 2026, eight more and all eighteen tall on 24 November) | the record beside each file in `public/themes` | The picture behind the page. The lagoon picture's water gave `#7bbcb3`; five pictures gave the colours of what falls |
| S6 | OpenStreetMap, the Mauritius extract | the date in `data/index/meta.json` | The coast, the districts and every point on the island's map |
| S7 | The Prime Minister's Office's notices of public holidays, as listed in `content/holidays.json` | 20 November 2026 | The days on which a holiday's look is shown |
| S8 | Bricolage Grotesque, by the Bricolage Grotesque Project Authors, SIL Open Font Licence 1.1 | the latin file from `@fontsource-variable/bricolage-grotesque` 5.3.0 and its licence, in `src/fonts` | The face of the titles |
| S9 | The owner, 20 November 2026, on Round 5: "paid listings should have a more beautiful biznes page", "improve our footer, logo is hiden", "we should have different background images", "special category for food biznesses" | in conversation | The paid page, the footer, the ten pictures, Baz Manzer |
| S10 | OpenFreeMap's own site (its terms, read 20 November 2026) | `STREET_MAP` in `src/data/site.ts` | The street map's style and the credit it must carry |
| S11 | The owner, 24 November 2026, on Round 9: "generate more background pictures to match mauritius vibes thru the year", "have some fallling leaves over the hero please, based on seasons", "all images will have 2 versions, 1 for desktop 1 for mobile" | in conversation | Eight more pictures, a tall painting of every picture, the five seasons, what falls |

What the brand lacked was a face and a light ground. Both are recorded as chosen or derived: Manrope
comes from the list KOS keeps for a brand with no face of its own, white is chosen, and cream and
sand are derived from the brand's saffron.

## Colors

### Palette

Twenty-nine values in `:root`. Six are sampled from the two mock-ups (S1, S2); eleven are sampled
from the pictures (S5), one for the map and ten for what falls over the landing page; one is
chosen; eleven are derived.

| Token | Value | From | Used for |
|---|---|---|---|
| `--palette-white` | `#ffffff` | chosen | A card, a field, the menu: what stands on the paper. The land on the island's map |
| `--palette-cream` | `#fdf9ec` | derived, saffron 8% on white | The sheet of paper the page is written on; the veil over the picture's sky |
| `--palette-sand` | `#f5efe0` | derived from cream, deeper | A tile, a chip, a quiet panel, a note, the compact search box |
| `--palette-limewash` | `#f7f7f8` | sampled (S1): the brand's white | The moving band of a shape that waits. It no longer carries words |
| `--palette-ink` | `#0a1639` | sampled (S1): the brand's dark | Words; the ink button; a chosen filter, tab or chip; the icon tiles; the footer card; the points of the map |
| `--palette-swell` | `#14224f` | derived from ink, lighter | The ink button under the pointer |
| `--palette-slate` | `#404965` | derived, ink 78% toward white | Secondary words |
| `--palette-mist` | `#626a80` | derived, ink 65% toward white | Captions, counts, a placeholder, a small heading over a list |
| `--palette-saffron` | `#f8c618` | sampled (S1): the brand's action | A fill, never words: the point in the b, the search button and the one filled action, an icon on an ink tile, a saved bookmark, a count, a lit point on the map |
| `--palette-saffron-deep` | `#e3b30d` | derived from saffron, darker | The filled action under the pointer; the glow of a paid card |
| `--palette-ember` | `#ff8f4a` | derived, saffron toward coral | The far end of the verified mark and of a paid card's ring |
| `--palette-saffron-wash` | `#fef6d9` | derived, saffron 16% on white | A chosen thing: the current tab on a phone, the current page in the menu, a lit tag, the head of a paid card |
| `--palette-royal` | `#0d36a7` | sampled (S2) | What answers: a result's title, a link in prose, a source's number, focus, the caret |
| `--palette-shallows` | `#dcefeb` | derived: the lagoon picture's water at 27% on white | The sea on the island's map |
| `--palette-lagoon-deep` | `#7bbcb3` | sampled (S5) from the lagoon picture's water | The map's coastline and its soft edge |
| `--palette-lagoon` | `#aebadf` | sampled (S2) | At 45% on white, the tile of an answer from the articles |
| `--palette-haze` | `#b6c0db` | derived from limewash toward ink | Captions on the footer's ink |
| `--palette-coral` | `#f14949` | sampled (S1): the brand's red | Nothing at present (Known Gaps). Ember is derived toward it and coral-deep from it |
| `--palette-coral-deep` | `#c12a2a` | derived from coral, darker | An error's words, mark and edge |
| `--palette-flame`, `--palette-flame-light` | `#ed4120`, `#f35a32` | sampled (S5) from the flamboyant picture's flowers, and where the light is on them | A falling flamboyant petal and its line. A drawing, never words |
| `--palette-frond`, `--palette-frond-light` | `#446926`, `#5a7e36` | sampled (S5) from the rain picture's leaves | A falling green leaf and its vein |
| `--palette-plume`, `--palette-plume-light` | `#f1c8b1`, `#fadcbb` | sampled (S5) from the cane picture's flowers | A falling wisp of cane flower and its down |
| `--palette-straw`, `--palette-straw-deep` | `#c68644`, `#af7136` | sampled (S5) from the harvest picture's cut cane, and where it is in shade | A falling dry leaf and its vein |
| `--palette-bract`, `--palette-bract-light` | `#d32e62`, `#e03e73` | sampled (S5) from the street food picture's bougainvillea | A falling bougainvillea petal and its vein |

### Roles

Components use roles, never palette values. Tailwind's own colours are switched off
(`--color-*: initial`), so only a role paints.

| Role | Value | Meaning |
|---|---|---|
| `paper` | white | A surface that stands on the sheet |
| `sheet` | cream | The page's ground |
| `panel` | sand | A quiet surface; a control under the pointer |
| `ink` | ink | Words |
| `ink-subtle` | slate | Secondary words |
| `ink-faint` | mist | Tertiary words |
| `on-ink` | white | Words on ink |
| `link` | royal | What answers |
| `signal` | saffron | The lit point; the one filled action |
| `signal-hover` | saffron-deep | The filled action under the pointer |
| `signal-wash` | saffron-wash | A chosen thing |
| `on-signal` | ink | Words on saffron |
| `alert` | coral-deep | An error |
| `line` | ink at 10% | The hairline |
| `line-strong` | ink at 50% | An edge a field needs to be seen by |
| `focus` | royal | The focus ring |

The footer redefines four roles for its own ground: `ink` is white, `ink-subtle` is white at 78%,
`ink-faint` is haze, and `line` is white at 14%. It does not yet redefine `focus` (Contrast, Gaps).

### Named Rules

**The Lit Point Rule.** Saffron is a fill or a mark on ink, never words on a light ground: on white
it measures 1.60:1. It marks one thing at a time: the point in the b, the one filled action in a
group, the page you are on, a saved listing, a point that answers.

**The Royal Rule.** Royal blue means "this answers, and it can be opened": a result's title, a link
in prose, a source's number, the focus ring. It is never a ground for a section.

**The Verified Rule.** Saffron running to ember, with a glow, is the verified mark and the ring of
a paid card. Nothing else on the site may look like it, so that a paid place is never mistaken for
anything else.

### Contrast

Measured with `npm run contrast` (WCAG 2.x, alpha composited over the real ground, floored to two
decimals). The file of pairs holds 25 and all pass AA for body text. Twenty-four are in use and are
listed here; the twenty-fifth, haze on night at 10.84:1, belonged to the dark island and measures
a ground the site no longer has.

| Text or mark | On | Ratio | Where |
|---|---|---|---|
| ink | white | 17.69:1 | Words on a card, in a field, in the menu |
| ink | cream | 16.80:1 | Every heading and paragraph on the sheet |
| ink | sand | 15.42:1 | A small action on a card, a chip, a note |
| slate | white | 8.90:1 | Secondary words on a card |
| slate | cream | 8.45:1 | Secondary words on the sheet |
| slate | sand | 7.76:1 | Secondary words in a note |
| mist | white | 5.39:1 | A caption, a count, a placeholder |
| mist | cream | 5.12:1 | A caption, a count in an index, a small heading over a list |
| mist | sand | 4.70:1 | A table's column heads, the compact search box's placeholder |
| royal | white | 9.98:1 | A title that is a link, on a card |
| royal | cream | 9.48:1 | A link on the sheet |
| royal | sand | 8.70:1 | A source's number |
| ink | saffron | 11.02:1 | The search button, the one filled action |
| ink | saffron-deep | 9.03:1 | The filled action under the pointer |
| ink | saffron-wash | 16.34:1 | The current tab on a phone, the current page in the menu |
| slate | saffron-wash | 8.22:1 | What a business is and where, at the head of a paid card |
| royal | saffron-wash | 9.22:1 | The name at the head of a paid card |
| white | ink | 17.69:1 | The ink button, a chosen filter, the footer, a dark card |
| haze | ink | 9.73:1 | Captions in the footer |
| saffron | ink | 11.02:1 | A tile's icon, a mark on a dark card |
| white | swell | 15.31:1 | The ink button under the pointer |
| coral-deep | white | 5.78:1 | An error's words under a field |
| coral-deep | cream | 5.48:1 | An error's words on the sheet |
| white | royal | 9.98:1 | A source's number under the pointer |

Measured for this record with the same script on 20 November 2026. These pairs are in the build
and not yet in `scripts/contrast.pairs.json`:

| Text or mark | On | Ratio | Where |
|---|---|---|---|
| ink | ember | 7.81:1 | The far end of the verified mark |
| ink | shallows | 14.82:1 | A town's name over the map's sea |
| slate | shallows | 7.45:1 | The map's own words |
| mist | shallows | 4.51:1 | The note that names Rodrigues, on the map |
| ink at 62% | white | 5.01:1 | The gathered dots on the map's land, without script (a graphic) |
| royal | lagoon at 45% on white | 7.58:1 | The icon on the tile of an answer from the articles |
| mist | saffron-wash | 4.98:1 | The line under the current page in the menu |
| coral-deep | sand | 5.03:1 | An error's mark in a note |
| white at 78% | ink | 11.00:1 | Secondary words in the footer |
| line-strong | white | 3.40:1 | A field's edge (a mark) |
| line-strong | cream | 3.36:1 | A chip's edge on the sheet (a mark) |

**Words on the picture.** A picture is not one colour, so no pair can vouch for words set on it.
Only the landing page sets any there: its headline and the greeting above it, in ink. Two things
keep them readable: a veil of cream over the picture's sky on every page, and a soft light of
cream behind the words, 76rem by 26rem at its widest. The light stands above the search bar, so
that the picture is seen through the bar's glass. `scripts/hero-contrast.mjs` reads the pixels
behind the headline, the greeting and the line at the page's foot on each of the eighteen
pictures, at a desk (the wide picture) and on a phone (the tall one), and fails under 3:1 for
the headline or 4.5:1 for the other two. Then it lays each colour of what falls over the whole
picture, as if a petal were behind every letter at once, and reads the three again. On
24 November 2026 the lowest of the 168 readings was 5.86:1 (the headline with a green leaf behind it, at a desk), and the lowest on a picture alone 6.27:1 (the headline on the litchi picture, at a desk). It needs a running server.

**Words on glass.** Frosted glass is white at 54% over whatever is behind it ("Frosted glass").
Over the darkest picture there could be it is no darker than `#8a8a8a`, on which ink measures
5.16:1: so every word on glass is ink, and none is slate or mist. `npm run glass` reads the glass
as drawn against each of the eighteen pictures, at a desk and on a phone: on 24 November 2026 ink
kept 14.86:1 on the menu's pill, 10.14:1 on the search bar, 6.94:1 on the foot line and 15.35:1
on the phone's bar.

**Gaps (recorded, not rules).**

- **The focus ring on ink.** The ring is royal on every ground. On the footer card and on a dark
  card it sits on ink, where royal measures 1.77:1. A focus ring needs 3:1. It passes on white
  (9.98:1), cream (9.48:1), sand (8.70:1) and saffron (6.22:1).
- **The map's coast** is lagoon-deep at 55%, about 1.5:1 on the white land. The map is a picture of
  what the lists beside it say in words, and it carries a sentence that says what it shows.
- **The comment in `globals.css`** gives ink on ember as 8.3:1. It measures 7.81:1.

## Typography

**Two faces.** Manrope (S4) says every sentence, every control and the name: one file with a
weight axis from 200 to 800 (`src/fonts/manrope-latin-wght-normal.woff2`). Bricolage Grotesque (S8)
says the titles and nothing else: one file with a weight axis and an optical-size axis
(`src/fonts/bricolage-grotesque-latin-opsz-normal.woff2`). Both are served from this site through
`next/font`, each fetched once and shown at once in a fallback until it arrives.

**Character:** Manrope is a round, open sans that reads as friendly at a headline's size and stays
clear at a caption's. It was chosen from the list KOS keeps for a brand with no face of its own
(Geist, Manrope, Poppins), because the owner found the earlier faces generic and asked for an easy
feeling. Bricolage Grotesque was added in Round 5 for warmth where the page speaks loudest: its
letters narrow and its joins soften as it grows, so a title looks made by hand beside the plain
sentences under it. Archivo, Geist and Geist Mono are gone.

| Style | Size | Weight | Line | Tracking | Used for |
|---|---|---|---|---|---|
| `display-1` | `clamp(2.625rem, 1.4rem + 4.9vw, 4.5rem)` | 700 | 1 | -0.03em | The landing page's line, once; Baz Manzer's name on its own page. Bricolage Grotesque |
| `heading-1` | `clamp(2rem, 1.55rem + 1.7vw, 2.75rem)` | 650 | 1.08 | -0.024em | A page's title; a plan's price. Bricolage Grotesque |
| `heading-2` | `clamp(1.5rem, 1.33rem + 0.65vw, 1.75rem)` | 650 | 1.18 | -0.018em | A section's heading. Bricolage Grotesque |
| `heading-3` | 1.125rem | 600 | 1.3 | -0.015em | A sub-heading; a plan's name; an emergency number |
| `title-1` | 1.0625rem | 600 | 1.35 | -0.012em | A card's title |
| `title-2` | 0.875rem | 600 | 1.4 | -0.005em | A label, a word of the menu, a tab |
| `body-1` | 1.125rem | 400 | 1.55 | -0.008em | A lede; the answer to a question |
| `body-2` | 1rem | 400 | 1.65 | 0 | A guide's prose |
| `body-3` | 0.875rem | 400 | 1.55 | 0 | A card's line, a fact, an index item, a filter |
| `caption-1` | 0.8125rem | 400 | 1.5 | 0 | A caption, a hint, an error |
| `data-1` | 0.875rem | 500 | 1.5 | 0 | A telephone number, a date, a position, in figures that line up |
| `data-2` | 0.8125rem | 500 | 1.45 | 0 | A count, a source number, in figures that line up |
| `label-1` | 0.75rem, capitals | 700 | 1.3 | 0.08em | A small heading over a list, a kind of result, a column's head |
| `button-md` | 0.9375rem | 600 | 1.2 | 0 | An action |
| `button-sm` | 0.8125rem | 600 | 1.2 | 0 | A small action |

Nothing is under 12px. Headings balance their lines; paragraphs avoid a short last line. Prose is
held to 66 characters (`.prose`) and a lede to 64 (`measure`).

A few components set their own size in the stylesheet, on the same steps, and are not named
styles: the tab bar's words (0.75rem at 600), a count badge (0.75rem at 700), the verified mark
(0.75rem at 800, 0.875rem on a business's page), a source's number (0.75rem at 600), a table
(0.875rem, its heads as `label-1`), and what is typed in the search box (1.0625rem large,
0.9375rem compact, at 500).

### Named Rules

**The Two Faces Rule.** Bricolage Grotesque is for `display-1`, `heading-1` and `heading-2`, and for
nothing else: no button, no label, no number, no sentence. Manrope says the rest. What is measured
or looked up (a count, a telephone number, a date) is Manrope with tabular figures, never a third
face.

**The Capitals Rule.** Capitals come only from `label-1`, by `text-transform`, and only for a small
heading over a list. No sentence is set in capitals.

## Layout

- **The picture** (`.backdrop`) is fixed behind the page and fills the screen, anchored to its
  foot. A veil of cream lies over its sky: 78% at the top, 52% at 38% of the height, clear by 68%.
- **The sheet** is drawn behind `main`: cream, 32px corners, set in from the screen's sides by
  `--edge`, `clamp(0.5rem, 1.4vw, 1.25rem)`, so the picture shows round it. The landing page has
  no sheet: it is the picture, whole.
- **The shell** is 76rem wide with a gutter of `clamp(1.25rem, 4vw, 3rem)`.
- **The menu** floats 0.75rem from the top as a pill up to 68rem wide and 56px tall.
- **Twelve columns** from 68rem (`chart:`): a list on seven and the island on five. On the Home
  page, the regions on six and the island on six. Below that width the island is a small one after
  a list, and on the Home page it stands whole under the regions.
- **The parts** of the Home page are 3rem apart, 4rem from 64rem.
- **A list of things to act on is a stack of cards** 0.75rem apart: listings, answers from the
  articles, official pages, websites. Other lists are rows between hairlines (`.rows`).
- **An index** (`.index-cols`) sets names and counts in one to four columns: the directory, the
  towns.
- **Facts** (`.facts`) are a name and a value in two columns, one under 30rem.
- **The footer** is a card with the same margin as the sheet.
- **On a phone** the tab bar is fixed at the foot of the screen, above the safe area, and the page
  keeps 4.5rem of room for it.
- A grid's child may always shrink to its column, so a wide table scrolls inside its own frame and
  the page is never wider than the screen.

**The landing page** (`/`, `src/app/page.tsx`) is one screen, at a desk and on a phone, and
nothing lies under it. In order: a pill with the greeting and what the index holds; the site's
one line as the headline, in `display-1`; the search box, up to 42rem wide, with its saffron
button; and one button, "Home", in ink with its icon. They stand a little above the middle of the
screen. At the foot is one quiet line in the footer's place (`.landing-foot`): whose product the
site is, in the owner's words, and three pages (About, Privacy, More). The menu there is
only the name, the cart and the account; there is no tab bar and no footer card. The page's own
class does all of it (`main:has(> .landing)`, `body:has(.landing)`), so no layout knows of it.
On a screen under 40rem tall the same things stand closer together, and it is still one screen
on a phone of 320 by 568; on a screen shorter than that (a phone on its side) the page grows and
nothing lies over anything else.

**The Home page** (`/home`, `src/app/home/page.tsx`) is the sheet with five parts on it, in the
owner's order, each under a plain `heading-2` with a line about it and a way to see all of it:

1. **Top businesses**: eight biznes cards, two abreast from 48rem; on a phone they go by sideways
   (`.top-list`), one card and the edge of the next in view. The line under the heading says how
   they are chosen and leads to the longer account on `/data`.
2. **Baz Manzer**: its white card under the awning, with the five kinds of place and the eight
   kinds of food most listed as tiles on sand, and the ink button into it.
3. **Categories**: the directory's thirteen groups as tiles, then the twelve kinds most listed as
   quiet tiles.
4. **Regions**: the nine districts and Rodrigues as tiles, each with its count and its three
   largest towns, on six columns; the island on the other six.
5. **Useful**: two cards, the numbers to call (`.dial`, the police's first, on the one filled
   button) and the next three public holidays (the first marked "Next"); then six pages as start
   tiles.

The page opens with the greeting in its pill, the title, a line, and the five parts as chips to
jump to. Every icon on it stands beside its words in a square, in two sizes that are set once, on
`.home` (`--home-icon`, `--home-icon-box` and their `-sm` pair): 22px in 48px for a way in, 18px in
36px for a kind within it and for a card's heading. On a phone the larger is 20px in 40px.

### Named Rules

**The Sheet Rule.** Everything a visitor reads at length is on the sheet or on a card. Only the
landing page's headline stands on the picture itself; its greeting and its foot line each have a
ground of their own.

## Elevation & Depth

Depth is said by a hairline, by a step of the ground (cream, white, sand) and by three soft
shadows tinted with the brand's ink. The page has one real layer of depth: the sheet over the
picture.

### Shadow Vocabulary

- **`--shadow-sm`** (`0 1px 2px` ink at 5%, `0 2px 8px` ink at 4%): a tile under the pointer, a
  business's card, the map's key.
- **`--shadow-md`** (`0 1px 2px` ink at 4%, `0 10px 30px -6px` ink at 10%): the menu, the search
  box, a card under the pointer.
- **`--shadow-lg`** (`0 2px 4px` ink at 4%, `0 24px 56px -12px` ink at 18%): what opens over the
  page (suggestions, a group of the menu, the list of towns), the tab bar, the toast, the search
  box while it has focus, the b on the footer's edge.
- **The paid glow** (`0 10px 32px -8px` saffron-deep at 55%, 70% under the pointer): a paid card.
- **The mark's glow** (`0 2px 10px -2px` ember at 70%): the verified mark.
- **The answer's glow** (`0 12px 32px -10px` royal at 26%): the answer to a question.

### Frosted glass

The owner asked for glass on 24 November 2026, and after two tries that went too far said what was
meant: "only search bar can he frosted glass thing, no need for a box", "headers can be that
frosted glass", "Not thr whole box and complete ui", "white translucent frosted glass please, not
black". So the page is paper, as it was, and four things on it are glass:

- **The menu's pill** and **the phone's bar**: the page passes under them and is seen through them,
  out of focus. Nothing fades the page out behind them any more.
- **The search bar**: on the landing page the picture is seen through it. Nothing stands round it:
  no card, and the greeting above it has no pill.
- **The line at the landing page's foot**, which needs a ground of its own on the fullest part of
  the picture.

The glass is one material (`--glass`, `--glass-blur`, `--glass-edge`, `--glass-shine`): white at
54%, what is behind it blurred by 20px and its colour raised to 1.8, a rim of white at 72% and a
lit upper edge. Inside the menu's pill the square buttons are glass again, white at 46%. A list
that opens from the pill or the search bar is solid white: a list is read.

**The rule its value comes from.** White at 54% is as clear as glass can be here and still carry
ink whatever is behind it: over black it is `#8a8a8a`, and ink on that is 5.16:1. Slate and mist
would not pass there, so the menu's links, the bar's tabs and the search bar's placeholder on the
landing page are ink.

**For someone who asks for less.** With `prefers-reduced-transparency: reduce` or
`prefers-contrast: more` the glass is plain white and nothing blurs; so too where a browser cannot
blur what is behind a thing.

The searches to try under a search box are white at 82% with an 8px blur, as before.

### Named Rules

**The Coloured Glow Rule.** A shadow is ink unless it means something: saffron for a paid place,
royal for the answer. No other shadow has a colour.

## Shapes

- **The radius ladder**, one use each: 8px for a small thing inside a list (a suggestion's icon, a
  row of an open list, the focus ring); 12px for a field and for an item of a menu; 16px for a tile,
  an icon tile, a note, a table's frame, a square icon button; 24px for a card, the suggestions, a
  group of the menu, the tab bar, the island; 32px for the sheet, the footer and a business's own
  card; full for every pill.
- **The pill**: the menu, the search box, buttons, chips, filters, tabs, tags, a card's small
  actions, a source's number, the toast, the verified mark.
- **The icon tile**: a square of ink with 16px corners and a saffron icon. On a business's page it
  is 72px with a white border and stands half over the strip of picture.
- **The lit point**: a filled saffron circle, sometimes with a soft halo. The centre of the b, the
  dot under the current word of the menu, the dot in the greeting pill, a point on the map.
- **The seal**: a rosette of twelve points with a tick, the one filled icon.
- **The hairline**: one pixel, ink at 10%.
- **Icons**: one hand in two files, 24px grid, 1.5px round strokes, in the current colour, always
  beside words or carrying their own label. The interface's small signs (an arrow, a tick, the
  cross that closes) are `src/components/Icons.tsx`. The site's own pictures (a kind of business, a
  district, a kind of food, a page) are `src/components/Glyphs.tsx`: see The icons.

### Named Rules

**The Pill Rule.** Anything that can be pressed and is not a card is a pill, or a round or soft
square icon button.

## Components

Each is a class in `globals.css` or a file in `src/components`. States are part of the component.

### The pill menu

`HeaderBar.tsx`, `.site-header`, `.nav-pill`, `.nav-main`, `.nav-link`, `.menu-group`,
`.menu-panel`, `.menu-item`.

- Frosted glass ("Frosted glass"), with `--shadow-md`. It stays at the top of the screen, and the
  page is seen through it. Its links are ink.
- From 64rem it holds the name, which leads to the landing page, where the search is; four plain
  links, each one press from its page (Home, Directory, Baz Manzer, Articles; `NAV` in
  `src/data/site.ts`); "More", the one word that opens a list; the compact search box; the cart
  and the account as soft square buttons; and "List your business" as an ink button. The bookmark with its count joins them once something has been saved (from
  80rem, where there is room; below that the shortlist is in "More").
- Where you are is said three ways, never by colour alone: the word is ink and heavier, it carries
  a saffron point, and it is marked for a screen reader (`aria-current`: "page" on the page
  itself, "true" on a page beneath it). The towns light Directory, being the directory turned
  round; a page that is reached from "More" lights "More".
- "More" is a plain disclosure, so it opens with no script. With script it closes on Escape, which
  hands the keyboard back to the word; when the keyboard walks out of it; on a press elsewhere; and
  when a page is chosen. Open, its word sits on sand and its arrow turns.
- It opens a white panel 36rem wide, centred under the word, with 24px corners and `--shadow-lg`:
  nine pages in two columns (`MORE`, the tools at their head), each a name and a line about it,
  and a last line that leads to the page of every page. Under the pointer an item is on sand; the current page is on the
  saffron wash.
- Under 64rem the links and "More" leave the pill: the tab bar carries them. Under 48rem the
  search box leaves too, and under 40rem "List your business". On a phone the pill is the name,
  the cart and the account, and nothing in it opens.
- The landing page and the search page carry their own large search box, so there the pill
  leaves it out. On the landing page the pill is only the name, the cart and the account, at
  every width: its one button, "Home", is the way on.

### The tab bar

`TabBar.tsx`, `.tabbar`. Under 64rem only, and there the one way round: Search, Home, Baz
Manzer, Articles, More. The directory is reached through Home, whose categories and regions are
its two ways in, and through "More", which is lit on it. The landing page has no bar. Each tab is
an icon over a word, 52px tall. Where you are is ink on the saffron
wash, and marked for a screen reader as the header's links are. "More" is a page (`/more`), not a
list that opens over the one you are on. Frosted glass as the menu's pill is, 24px corners, `--shadow-lg`,
0.5rem from the screen's sides and above the safe area.

### The page of every page

`src/app/more/page.tsx`, `.more-groups`, `.more-list`, `.more-link`. Every page the site has a name
for, once, under its heading (Find, Read, For business, Yours, About; `MENU`, `YOURS` and `ABOUT`),
each a row at least 56px tall with the page's name, a line about it and an arrow. One column on a
phone, two from 48rem, three from 72rem. The footer's columns are drawn from the same lists, so a
page has one name wherever it is listed.

### The two-way switch

`BrowseTabs` in `Bits.tsx`, on `.tabs` and `.tab`. At the head of the directory and of the towns:
"By kind of business" and "By town" (`BROWSE`), the chosen one filled with ink. The same
businesses, turned round, one press apart.

### The search box

`SearchBox.tsx`, `.search`, `.suggest`. A plain form that asks `/search`.

- **Large** (the landing page, the search page): a pill of frosted glass 64px tall with
  `--shadow-md` and the saffron "Search" button inside its right end. On the landing page the
  picture is seen through it, and its placeholder and its lens are ink. Under 30rem the button is the glass alone.
- **Compact** (the menu): 44px, on sand, no shadow. Enter asks; the button is kept for a screen
  reader and shows when it has focus.
- Rest; hover (the edge darkens); focus (a royal edge, a soft royal ring, `--shadow-lg`, the glass
  turns ink).
- With script it is a combobox: up to eight suggestions, arrow keys, Enter, Escape. Each has its
  kind's icon in a sand square, a label and a note; the chosen one is on sand with its icon square
  in saffron. On a desk it takes focus on the landing page, and it answers to the "/" key.

### Buttons

`.btn`. Pills, 44px tall (`.btn-sm` 40px). Filled (saffron, one in any group), ink, and quiet
(white with an edge). Hover (the fill deepens, or sand for quiet), pressed (98% of its size),
focus (the royal ring), disabled (half strength). A main action may carry its arrow in a small
circle (`.btn-dot`), which turns under the pointer.

`.icon-btn` is a 44px round control that is only an icon and carries its own label: save, share.
Pressed in (a saved listing), its bookmark is filled saffron. In the menu it is a soft square on
sand (`.icon-btn-sq`). `.badge` is the saffron count on the bookmark.

### Fields and chips

- **Fields** (`.field`): white with an edge of ink at 50%, 12px corners, 48px tall. Hover, focus (a
  royal edge and a soft royal ring), invalid (a coral-deep edge, and the error in words beneath
  with a mark), placeholder in mist. A select draws its own arrow.
- **Chips** (`.chip`): a radio drawn as a pill. Chosen, it is filled with ink.

### Filters

`Filters.tsx`, `.filters`, `.filter`, `.menu`, `.menu-list`.

Ways to make a list of listings smaller: "With a telephone number", "With a website", and one town.
Each is a link that says how many it would leave, so it works with no script. The one that is on
is filled with ink and ticked. The towns open under their filter as a list. "Clear" takes them all
off. On a category's or a town's page the town filter is left out, because the links above the
list already do that (`.narrow`: pills in a line that scroll sideways on a phone).

`.tabs` are the kinds of result on the search page: pills, the current one filled with ink.
`.tag` is a small word in a pill; `.tag-lit` is on the saffron wash with a point.

### The biznes card

`Rows.tsx`, `.listing`. A listing in a list.

- A white card with 24px corners and a hairline edge.
- Left: the kind of business as an icon on a 48px ink tile, in saffron. Under 30rem the tile is
  left out.
- Middle: the name as `title-1` in royal, what it is and where in slate, a line about it, and its
  telephone number and website as small pills on sand (`.act`). The whole card answers to the
  name's link.
- Right: save and share, as round icon buttons.
- Under the pointer its edge darkens, it takes `--shadow-md` and lifts by a pixel.
- It carries its point, so the island can ring it.

The same card serves what else a search finds, with a different tile: an answer from the articles
has a pale blue tile with a royal icon, and an official page or a website has a quiet sand tile.
Saffron on ink is kept for a business.

### A paid card, and the verified mark

`Verified.tsx`, `.verified`, `.listing-paid`, `.biz-paid`. By the owner's word: "paid business needs
to have a very vibrant mark to show they these are real verified and paid business listings."

- **The mark** is a pill of saffron running to ember with an ember glow. In it: the seal in ink
  with its tick in saffron, the word "Verified" in ink, and for a business that pays to come first,
  "Priority listing" after a fine rule. It is 24px tall in a list and 32px on a business's page.
- **A paid card** has a 2px ring of saffron running to ember, a head washed in saffron, a saffron
  glow that grows under the pointer, and its icon tile turns saffron with an ink icon.
- It says two things and no more: that biznes.mu has checked the business is real, and, with
  "Priority listing", that the business pays for its place.
- No listing carries it yet (Known Gaps).

### A business's own card

`src/app/b/[slug]/page.tsx`, `.biz-head`, `.biz-cover`, `.biz-body`, `.biz-icon`. A business's page
opens with it.

- White, 32px corners, `--shadow-sm`.
- A strip of the day's picture across its top, 120px tall (144px when paid).
- The kind's icon on a 72px ink tile, standing half over the strip.
- The name as `heading-1`, what it is and where, then what can be done: "Call" with the number as
  the filled action, "Visit website", "Directions", and "Save" and "Share" as quiet buttons.

### Cards, tiles and the answer

- **`.card`**: white, 24px corners, a hairline. A guide on a shelf, a tool, a plan. When it holds a
  title's link, the whole card answers to it and lifts under the pointer.
- **`.card-ink`**: the dark card, for a thing to notice. Biznes Go among the plans; the first
  emergency numbers, each with its number on a filled button.
- **`.card-panel`**: on sand, for an empty list.
- **`.card-wash`**: on the saffron wash. Defined, and used by nothing at present (Known Gaps).
- **`.answer`**: the answer to a question about how, in the site's own words, first under the
  search box: `body-1` on white with a royal edge and a royal glow, then the article it is from.
- **`.elsewhere`**: the official pages and the websites that also answer, folded under a pill that
  reads "References elsewhere" with their count. It is a plain disclosure, so it opens with no
  script.
- **`.tile`**: a way in on the Home page: an icon on an ink tile, a name, how many, and for a
  region its largest towns. Under the pointer the icon's tile turns saffron, tips by four degrees
  and grows a little. On a phone the tiles stand two abreast as small cards, each still a row with
  its icon beside its words. **`.tile-quiet`** is a kind within a group (a kind of food, a kind
  of business): smaller, its icon in ink on a white square with a hairline, so the groups stay the
  louder of the two. Inside Baz Manzer's card a tile stands on sand, and under the pointer keeps
  it and gains an edge of ink, so its count keeps 4.70:1.

### Reading

- **Guide blocks** (`GuideBlocks.tsx`, `.prose`): a paragraph, a list, steps, a note, a table. Each
  ends with its source numbers (`.cite`: royal on a sand pill; under the pointer, white on royal),
  linked to the reference. A table scrolls inside a frame the keyboard can reach; under 40rem it
  becomes a block a row, each cell naming its column.
- **A guide's page** has a contents rail on a wide screen and a contents list that opens on a
  phone. It ends with "Keep reading" (other pages of this site, as cards) and then "References".
- **Crumbs**, **pager**, **index item**, **page head**: `Bits.tsx`. Every page but the landing
  page, the Home page and the search page has its path, so every title sits at the same height.
  The path's first step is the Home page, by the menu's name for it; on the Home page the greeting
  pill stands where a path would.
- **`.note`**: a quiet panel on sand with 16px corners.
- **`.facts`**: a name in mist and its value.

### The rest

- **The greeting pill** (`.pill-note`) and **a search to try** (`.try`): white at 82% with a blur.
  On the landing page the greeting has no pill: it is words on the picture.
  The greeting pill carries a saffron point with a halo, and stands on the picture on the landing
  page and at the head of the Home page; the searches to try are on the search page.
- **The landing page's foot line** (`.landing-foot`): the same ground with 24px corners, `caption-1`
  in ink, its three links in ink at 500, each 36px tall and 44px under a finger. At its end, the
  control for what falls: a round button, a pause or a play, 36px and 44px tall under a finger.
- **The request form** (`RequestForm.tsx`): errors on their own fields, focus to the first, a
  success that says what happens next, and a failure that gives the telephone and the email. It
  opens with a plan's or a pocket guide's name when it is reached from one.
- **The toast** (`.toast`): "Link copied", on an ink pill at the foot of the screen.
- **The offer to install** (`Pwa.tsx`): a white card at the foot of the screen, above the tab bar
  on a phone and in the bottom right corner on a wide screen. It has an "Install" button where the
  browser makes the offer, and says where to tap on an iPhone or an iPad. It offers the app the
  page belongs to: on a page of Baz Manzer it carries the section's mark and its words. Closed,
  the site's stays away for thirty days and the section's for good.
- **The pocket guide** (`scripts/pdf.mjs`) wears the same system on A5 paper: Manrope, ink on
  white, the b on its cover over the lagoon picture, each part of the island opening on an ink
  page under one of the pictures, source numbers as royal on sand, and the sources at the
  back.
- **The wait** (`.wait`): a moving band, for a shape that holds a place.
- **The skip link**: an ink pill that appears on focus.

### A business's page

`BusinessPage.tsx`, for a listing from the index and for a business its owner listed alike.

- **The head** (`.biz-head`): a strip of the island at the business's own place (or the owner's
  cover picture, or a plain band where there is neither), the ink tile with its icon, the name in
  `heading-1`, what it is and where, today's hours in a line, then the actions. One is filled: the
  call, when there is a number. On a phone it is as wide as the card and on the first screen.
- **What is known** (`.known`): a card for each kind of fact (contact, where, hours, about), each
  with a small sand tile and its icon. Hours are set out day by day, today marked, when the map's
  record can be read that way; otherwise as written.
- **Free** is calm: white cards, hairlines, and one card that asks "Is this your business?".
- **Paid** (`.biz-paid`) wears the ring and the glow of a paid card and the verified mark, and adds
  what the owner has given: a line of their own (`.biz-tagline`), a gallery (`.biz-gallery`), a
  menu for a place to eat (`.dishes`: the dish, its line, and its price set against the right
  edge in tabular figures), and on Biznes Grow services and a way to book. Nothing paid is drawn
  empty: a part with nothing in it is not there.
- **Beside it**, from the chart's breakpoint up, the island and the way to the street map stay in
  view while the page scrolls.

### Baz Manzer, the section

`/baz-manzer` and every page beneath it (`src/components/baz`, `src/app/baz-manzer`). The section
stands by itself and installs as an app of its own, so it has a name, a header, a bar and a first
page of its own. It is still the postcard: the same paper, ink, pills and tiles, and no colour
the site does not have. What is its own is the awning.

- **The awning** (`.baz-awning`): coral and cream stripes, each ending in a round hem of half its
  width, across the top of the first page's white card, like the front of a snack. It is
  decoration and carries no words. Coral is used for the awning and for nothing else.
- **The app's icon** (`scripts/icons.mjs`; `public/icons/baz-*.png`, and `icon.svg` and
  `apple-icon.png` in `src/app/baz-manzer`): the awning over the saffron point, on ink. On a
  square of 1000: five stripes of 200, coral at both edges; the cloth 340 deep and its hem 100
  more; the point is the b's own, 108 in radius, in the middle of the ink that is left. It
  stands beside the site's mark as its sibling: the same ground, the same point, the same round
  corners (230). For a platform that cuts icons to its own shape the drawing is made four fifths
  the size about its middle and the cloth is run on to the edges, so a circle still shows a hem
  and the point.
- **The mark** (`.baz-mark`): that same drawing in CSS, from the same measures, so it is one
  drawing at any size: 32px beside the name in the header, 22px as the first tab of the bar,
  48px on the card that says the section installs, and on the offer to install.
- **Its colours as an app**: the bar at the top of a phone takes coral (`#f14949`, the theme
  colour of the section's pages and of its manifest), so the phone's own bar is the top of the
  awning; behind the icon while the app opens is cream. No words of ours are set on coral: what
  a browser writes there is the browser's.
- **The header** (`BazHeader.tsx`): the site's white pill, holding the section's things. The mark
  and "Baz Manzer" in Manrope at 700, where the site's name stands elsewhere; from 64rem its ways
  round as plain links (Food, Towns, Saved), lit as the site's are; the compact search box on
  sand, which asks the section's search; and one quiet button, "biznes.mu", the way back to the
  whole site. On a phone it is the name and the way back, each 44px tall. The first page and the
  search page carry their own large box, so there the pill shows none.
- **The bar** (`BazTabBar.tsx`): the site's bar in shape, with the section's five ways in: Baz
  Manzer (the mark), Food, Towns, Search, Saved, each an icon over a word. A page under none of
  the last four (a kind of place, a place's own page) lights the first.
- **The first page** is the front of the app: under the awning the name in `display-1`, the line,
  the large search box (on sand here, since the card is white) and searches to try; the kinds of
  place as tiles (`.baz-type`: a sand tile with the kind's icon on a 40px ink tile, in saffron,
  over its name and its count, and beside them from 72rem); "Near you", a town to choose as a
  pill with an ink button; the kinds of food and the towns as pills in a line, the last of each a
  link to the page of them all; then every place to eat beside the island.
- **A list** (a kind of place, a kind of food, a town): the path from "Baz Manzer", a small line
  that says what kind of page it is with its icon, the title in `heading-1`, a sentence of counts,
  then the ways to another list as pills (`.narrow`): by kind of place, by kind of food, by town,
  a town's neighbourhoods, and the towns near it, each with how far. A chosen one is ink with its
  count in white at 72%. A paid outlet's row shows the first lines of its menu on the saffron wash
  (`.menu-peek`).
- **Every kind of food** (`.baz-foods`, `.baz-food`): white tiles with the food's icon on the
  same small ink tile, two abreast on a phone, three from 40rem, five from 64rem. **Every town**
  is the directory's index of towns, district by district, each district with its icon.
- **The search's results** follow the site's: the box, a line that says how many and how the
  question was read, the pages of the section that answer as pills, the filters, the cards, and
  last the one link to the whole site's search.
- **Icons** are the site's own set (`Glyphs.tsx`): a kind of place, a kind of food, a district.
  The section draws none.

### The street map

`MapSwitch.tsx`, `StreetMapView.tsx`. A quiet pill under the island, "Open the street map", puts a
real map in the island's frame, at the same corners; the same pill then reads "Back to the
island". Listings are points of ink, the ones that answer saffron ringed in ink, as on the island.
The zoom buttons are the site's own. The map's credit is always on it, in `caption-1`
on solid paper at its foot. If the map cannot load, the frame says so in a sentence and offers the
same place on openstreetmap.org.

### Ways in, and the cart

- **The start tiles** (`.start-tile`), in the last part of the Home page: white cards with a small
  ink tile and a saffron icon, a title and a line. On hover the card lifts and its tile turns
  saffron. Three abreast from 48rem; on a phone a list, one to a line.
- **The numbers to call** (`.dial`): rows between hairlines, a name and its numbers, each number
  a link that dials, 44px tall at any pointer. The police's first number is the one filled button.
- **The island beside a list** is drawn once (`IslandBeside.tsx`, `.chart-fit`): a strip after the
  list on a phone, the tall chart beside it from the chart's breakpoint up.
- **The header** carries three soft square buttons at every width, in this order: the shortlist
  (from the wide layout up), the cart with its count on a saffron badge, and the account.
- **The cart** (`.cart-item`): a white card for each thing, its price in `data-1`, round buttons to
  count a thing that is bought by the number, and a quiet cross to take it out. The total is in
  `heading-1`. The filled action belongs to the checkout under it.

### The footer card

`SiteFooter.tsx`, `.site-footer`. On every page but the landing page, which has one quiet line in
its place. An ink card with 32px corners that sits on the picture below the
sheet, above it in the stack so that its mark is never half hidden. The b stands whole on its top
edge, in the middle: ink, with a white point, on a 72px saffron tile tilted six degrees. Inside:
the name large in white with its point in saffron (`.footer-name`), the line, and whose product it
is, in the owner's words; the ways to reach us (`.footer-reach`); every page in four columns
(`.footer-cols`: Find, Read, For business, About, drawn from the menu's own lists); a light card to join the list for the
guide and the magazine (`.footer-join`, shown only when the form is); the map's credit as its
licence asks; and, last, "A Digital Experience by Khay Digital". Secondary words are white at 78%.

### Named Rules

**The One Filled Action Rule.** A group of buttons has one filled in saffron. The others are ink or
quiet.

**The Tile Rule.** Saffron on an ink tile is a business in a list, or a way in on the Home page
(a directory group, a region, a kind of place, a page). In a list of results an article's tile is pale blue and a page on
another site's is sand.

## The pictures and the calendar

`src/data/themes.ts`, `src/lib/theme.ts`, `public/themes`.

Eighteen pictures, in five seasons that cover the year. The first of a season's row is its own;
the others take turns with it.

| Season | Its pictures | What falls |
|---|---|---|
| Summer, 15 November to 15 February | `flamboyant` Flamboyants in bloom, `litchi` Litchi season, `picnic` A picnic on the beach, `sunset` Sunset, `market` Market day, `harbour` The harbour, `lagoon` Lagoon morning | Flamboyant petals |
| The rains, 16 February to 30 April | `rain` After the rain, `lilies` The lily pond, `teafields` Tea fields, `chamarel` Chamarel, `streetfood` Street food at dusk, `lagoon` | Green leaves |
| Cane in flower, 1 May to 14 June | `cane` Cane in flower, `kites` Kites on the lagoon, `village` A village, `teafields`, `harbour` | Wisps of cane flower |
| The harvest, 15 June to 30 September | `harvest` The cane harvest, `kites`, `chamarel`, `village`, `teafields`, `cane` | Dry leaves |
| Spring, 1 October to 14 November | `lilies`, `market`, `streetfood`, `harbour`, `sunset`, `lagoon` | Bougainvillea petals |
| A holiday's own | `lights` Festival of lights: Divali and the two days before it, Christmas and the three days before it. `lanterns` Lanterns: the Spring Festival and the day before it | The season's |

`lagoon` is also the link preview card and the pocket guide's cover, whatever the day.

- **What they are.** Generated illustrations, made for the site with Higgsfield (model
  gpt_image_2_6): ten wide ones on 20 November 2026, eight more and a tall one of all eighteen on
  24 November. Each file has a record beside it (`lagoon.jpg.json` and so on) that says so: an
  imagined Mauritian scene, not a photograph of a real place, never captioned as one.
- **Two shapes each, and each is its own painting.** The wide one (`lagoon.jpg`, 2400 across) is
  for a desk and a phone on its side. The tall one (`lagoon-tall.jpg`, 960 across) is the same
  scene painted again for an upright screen, with the scene in its lower half and sky above: it
  is not cut out of the wide one, which would leave a phone a strip of the middle. The tall one
  is used under 40rem and on any screen held upright (`.backdrop` in `globals.css`), and the
  page asks the browser ahead for the one its screen needs and not the other. Both stand on
  their foot, where the scene is. `npm run picture` makes the two files and their records from
  the two paintings.
- **The seasons are a reading of the island's year made for this build**, not taken from a
  source: when the flamboyants flower, when the cane flowers and is cut. They are the owner's to
  correct, in `SEASONS`.
- **How the day's look is chosen** (`themeFor`), by today's date in Mauritius:
  1. The season gives the day's picture: one of the season's set, a different one each day by the
     count of days, and the same for everyone on that day. A superadmin may fix one picture or set
     a round of their own instead (`themeNow`).
  2. On a public holiday the greeting is the holiday's ("Happy Divali", "Eid Mubarak"), and the
     picture is the holiday's own if it has one. A holiday with no line of its own is greeted by
     its official name.
  3. A holiday may begin early: Divali two days before, Christmas three, Independence Day and the
     Spring Festival one.
  4. On any other day the greeting is "Bonzour".
- **Dates come only from `content/holidays.json`**, written from the official notices (S7). It
  holds 2026 and 2027. Never write a date into the code.
- **Every page is made again at most once an hour**, so it takes the day's look within the hour.
- **To add or change a picture**, run `npm run picture` with its two paintings and name it in
  `src/data/themes.ts`. It must pass `npm run hero` and `npm run glass` before it is used. To
  give a holiday a look, add a line to `HOLIDAY_LOOKS`.
- **The link preview card** (`public/og.jpg`) is the name, the line and the index's counts on the
  lagoon picture at 1200 by 630, captured from the site itself by `npm run og`, with its own
  record beside it.
- **On the page** the picture is decoration: it is hidden from assistive technology and no words
  depend on it.

### What falls

`src/components/Leaves.tsx`, `src/components/LeavesToggle.tsx`, `src/components/glyphs/falls.ts`,
`.leaves` in `globals.css`.

On the landing page, and only there, a few petals or leaves of the season fall over the picture:
fourteen at a desk, eight on a phone, none on a phone narrower than 21.25rem. It is the one thing
on the site that moves by itself.

- **What.** One drawing a season, on the icons' 24px grid: a body and a few lines on it. Its two
  colours are sampled from a picture of its season (Palette). Each piece is 1.125rem to 1.875rem.
- **Where.** A layer between the picture and everything else. It lies under the soft light
  behind the words, so a piece pales as it passes the headline; under the glass, so it is seen
  through the search bar and the foot line out of focus; and out of the pointer's way.
- **How.** A piece takes 19 to 29 seconds to fall the height of the screen, drifts 3 to 10
  hundredths of the screen's width with the wind, swings 0.75rem to either side and turns over a
  little as it goes, then begins again. Each has its own place, pace and turn, written down in
  the component and not drawn by lot. Only transforms move.
- **Its control.** A small round button at the end of the foot line, on its glass: "Pause the
  falling petals", then "Let the petals fall again". It holds every piece where it is. The
  choice is kept in the visitor's own browser. It is 36px at a desk and 44px tall under a finger.
- **Who sees it.** Nothing is shown until script marks the page, and script marks it only for a
  visitor who has not asked for less motion. Without script, and for that visitor, there is no
  piece and no control: the page is the picture alone.
- **The words stay readable.** `npm run hero` lays each of a fall's two colours over the whole
  picture, as if a piece were behind every letter at once, and reads the words again.

### Named Rules

**The Provenance Rule.** A picture goes into `public/themes` with a record that says what it is,
what made it and when. A generated picture is never called a photograph.

## The island

One drawing of Mauritius, used everywhere (`Chart.tsx`, `ChartLive.tsx`, `src/lib/chart.ts`). It is
what the night chart left behind. It was the page's one dark panel at the start of this round and
was redrawn as a light map in the page's own colours.

- **Where it is.** Beside the regions on the Home page; beside a list of results, a category or a
  town; on a business's page.
- **Projection**: equirectangular, scaled at the island's own latitude, 1000 units wide. A point is
  in the same place on every page.
- **The map**: the sea is `shallows`, the land is white with a coast of `lagoon-deep` and a soft
  edge, the districts are dashed in ink at 13%. The panel has 24px corners and a fine edge.
- **Drawn in SVG**, so it is whole without script: the listings are gathered into dots of ink at
  62%, larger and stronger the more a place holds (three steps).
- **Live** with script: a canvas draws every listing as its own point of ink. It draws only when
  something changes, never in a loop. Once it has drawn, the gathered dots are hidden.
- **Lit**: a saffron point ringed in ink, with a soft saffron light round it, so it reads on the
  white land as well as among the other points. When a set is lit the rest fade.
- **Drawn in**: beside a list, when the lit points lie close together, the map shows the smallest
  part of itself that holds them with room around, and a key at the corner shows which part of the
  island that is.
- **Ringed**: the card under the pointer or the keyboard has its point ringed in ink.
- **A business's mark**: a saffron point ringed in ink inside a wider ring.
- **On a phone** the island beside a list is a small one after it (`.chart-fit`), with no
  lettering. It is the same drawing as the tall one on a desk, never a second copy.
- **Rodrigues** is in an inset at the south-east corner at 72% of the main scale, with a note of
  its distance, which is worked out from the two islands' positions.
- **Lettering**: the largest places in view whose names do not run into one another, set in the
  page's own type (`label-1`, 12px) in ink with a white halo, so it is the same size on a phone as
  on a desk. The graticule, its degrees and the crossing lines of the old chart are no longer
  drawn.
- **To assistive technology** it is one image with a sentence that says what it shows. Everything
  it shows is in the lists beside it.

## The name

`src/components/Logo.tsx`. The name is drawn, so it looks the same before the typeface has loaded.

- **The b** is a stem and a ring: the letter, and the lens of a search. In the drawing's own
  units, in which the small letters stand 540 tall: the stem is 120 wide and 735 tall from the
  baseline; the ring is 285 in outer radius and 165 inside, so it is as thick as the stem; its
  centre is 270 above the baseline, so it rises and dips by the same 15 as the round letters
  beside it; and the stem and the ring share their left edge.
- **The point** at the ring's centre is saffron, 108 in radius: the one thing found.
- **The other letters**, "iznes", are Manrope Bold (S4), outlined. ".mu" is the same outlines at
  45% strength.
- **The ink** is the current colour, so the name is ink on the menu and white on the footer. The
  point stays saffron, except on the footer's saffron tile, where it is white.
- **The b alone** (`Mark`) is for a small space: the footer's tile, the icon (`src/app/icon.svg`:
  a white b with its saffron point on a rounded square of ink), the icons of the installed app,
  which are drawn from that file, and the pocket guide's cover.
- In the menu the name is 22px tall.

## The icons

`src/components/Glyphs.tsx` is the one way in; the drawings are data in `src/components/glyphs/`.
They are the site's own, drawn for it and taken from no library: one for each of the 70 kinds of
business, the 13 groups of the directory, the 10 districts, the kinds of food most listed on Baz
Manzer, and each page the menu names. `npm run icons:sheet` draws every one at 20px, 24px and 48px
on paper, on a white card and on an ink tile (`review/icons/`), and is how the set is judged.
Under `npm run dev`, `/preview/icons` shows them on the site's own tiles.

- **The hand**: a 24 by 24 grid, 1.5px strokes with round caps and joins, in the current colour,
  on whole and half units, and no drawing longer than about thirty commands. Nothing is smaller
  than can be read at 20px. No letters, no numbers, no flags. Each icon is decoration beside words
  and is hidden from assistive technology.
- **The point**: every icon has exactly one small solid point and everything else is line. It is
  the lit point of the name, 4 units across (3.5 where a drawing is tight; up to 5.5 where it is a
  head, a hub or the sun), and it sits where it means something: the olive in the glass, the
  keyhole, the candle's flame, the lamp on a taxi's roof, the eye of the fish, the place a plane
  leaves. One solid point among line drawings is what makes the set ours in a single colour.
- **The point's colour**: the icon's own, so on an ink tile the whole icon is saffron. Where an
  icon is drawn in ink, slate or royal on white, cream, sand or the saffron wash, the point may be
  lit: give the icon `lit`, or set `--glyph-point` to `var(--color-signal)` on whatever holds a set
  of them. A lit point is saffron inside a ring of the icon's own colour, 0.75 units thick, as the
  point of the b sits inside its ring. It is never saffron alone on a light ground (below). Never
  light a point on an ink or a saffron tile.
- **The directory**: a kind of business wears its own drawing; one with none wears its group's,
  and a thing with no group wears the shop front. Three kinds are their group (a college, a
  government office, a company). The kinds that stand side by side are drawn to be told apart:
  the five kinds of place to eat, the fifteen kinds of shop.
- **The districts** are the island itself: Mauritius in line, with the district filled, so the
  icon says where the district is. Rodrigues is its own island, filled whole. Port Louis is too
  small to see as a shape and is the point. `scripts/district-icons.mjs` cuts them from
  `data/index/geo.json` into `src/data/district-shapes.ts` (`npm run icons:districts`): it smooths
  the coast, drops the points that do not matter, and builds each district from its inland
  boundary and the same coast, so the fill and the line agree. No outline is typed by hand.
- **Food**: twenty drawings for the kinds most listed (the island's own cooking is a pot on the
  fire; Chinese and the rest of Asia a bowl and chopsticks). Words that mean the same table share
  a drawing. A kind with no drawing wears the fork and knife.
- **Pages**: by address. A page under a named one wears its icon (`/learn/vat` wears the
  articles'); an address the set does not know wears the lens with its point. Home is a house
  with its door and a light under the roof; the home and building group keeps the plainer house.
  About is the b itself, in line.

The point's colour, measured on 23 November 2026 with `npm run contrast`:

| Mark | On | Ratio | Where |
|---|---|---|---|
| saffron | white | 1.60:1 | A lit point with no ring: fails as a mark, so it is never drawn |
| saffron | cream | 1.52:1 | The same on the sheet: fails |
| saffron | sand | 1.39:1 | The same on a note or a chip: fails |
| saffron | ink | 11.02:1 | The lit point against its ring, on an icon drawn in ink |
| saffron | slate | 5.54:1 | The lit point against its ring, on an icon drawn in slate |
| saffron | royal | 6.22:1 | The lit point against its ring, on an icon drawn in royal |
| ink | white, cream, sand | 17.69:1, 16.80:1, 15.42:1 | The ring, and the icon's lines, on a light ground |
| slate | white, cream, sand | 8.90:1, 8.45:1, 7.76:1 | The same for an icon drawn in slate |

Mist is too pale to ring a lit point well (saffron on mist is 3.36:1): an icon in `ink-faint`
keeps its point solid.

### Named Rules

**The One Point Rule.** An icon of the site's own has one solid point and no other filled shape.
A new icon is drawn in `src/components/glyphs/`, put on the sheet, and read back at 20px before it
is used.

## Motion

**Principle:** motion says that something changed. Content is visible by default and nothing moves
by itself.

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Every transition |
| State | 160ms | Colour, edge and ground under the pointer or the keyboard |
| Lift | 200ms | A shadow, a card's lift, an arrow's turn |
| Press | 120ms | A button pressed |

### Choreography

| Moment | Trigger | What moves | Duration |
|---|---|---|---|
| A card lifts | The pointer | Edge, shadow, one pixel up | 160ms to 200ms |
| A tile's icon | The pointer | Turns saffron, tips four degrees, grows 4% | 200ms |
| A main button's arrow | The pointer | Moves two pixels and turns | 200ms |
| The toast | A link copied | Rises half a rem and fades in; goes after 2.4 seconds | 240ms |
| The wait | A list being fetched | A band crosses the shape | 1.2 seconds, while it waits |
| What falls | The landing page, opened by a visitor whose device allows motion | Fourteen petals or leaves of the season (eight on a phone) fall, drift, swing and turn over | 19 to 29 seconds a fall, for as long as the page is open or until it is paused |

The sheet slides over the picture because the picture is fixed, not because anything is animated.
There are no entrance animations and no scroll effects. What falls on the landing page is the
only thing that moves by itself, and it can be held still ("What falls").

### Reduced motion and no script

| Movement | `prefers-reduced-motion: reduce` | Without script |
|---|---|---|
| The island's points | Lit at once, as they now are for everyone: the island no longer follows what is typed | Drawn in SVG, lit where a page has answers |
| Lifts, tips and turns | Happen at once | The same, they are CSS |
| The toast | Appears at once | Not shown: sharing needs script |
| The wait | Still | Not shown |
| What falls | Not shown, nor its control: the page is the picture alone | Not shown, nor its control |

## Scene & 3D

None. There is no WebGL in this build. The island is SVG with a 2D canvas over it.

## Responsive Behavior

| Width | What changes |
|---|---|
| Under 30rem | The large search box's button is the glass alone; a biznes card loses its icon tile; facts stack |
| Under 21.25rem | Nothing falls on the landing page, and its control is not shown: the foot line has no room for it |
| Under 40rem, and on any screen held upright | The tall picture is used |
| Under 40rem | Eight pieces fall on the landing page, not fourteen; tiles stand two abreast as cards; the Home page's regions and its last part's pages are one to a line; an index is one column; tables become blocks; a line of ways to narrow scrolls sideways; "List your business" leaves the pill |
| Under 48rem | The Home page's top businesses go by sideways |
| Under 48rem | The menu's search box becomes a button |
| Under 64rem | The tab bar appears; the menu's groups go behind one button; the page keeps room at its foot |
| From 68rem | The island sits beside a list; below it, a small island sits above the list |

**Touch targets.** 44px for buttons, icon buttons, a group of the menu, a chip and a row of an open
list; 52px for a tab of the tab bar; 40px for a filter, a tab of the results, a search to try and a
small button; 36px for the small pills on a card (telephone, website).

**Checks.** During the round axe-core was clean on every kind of page at phone size. The captures
at both sizes are made again at the end of the round and recorded in the README.

## Do's and Don'ts

### Do

- **Do** put the question first: the search box in the middle of the landing page and in the menu
  everywhere else.
- **Do** set anything read at length on the sheet or on a card (the Sheet Rule).
- **Do** show things to act on as cards and things to scan as rows or an index.
- **Do** use `link` (royal) for what answers and can be opened.
- **Do** keep saffron for the lit point and the one filled action (the Lit Point Rule, the One
  Filled Action Rule).
- **Do** mark a paid place with the verified mark and "Priority listing", every time.
- **Do** set a count, a number or a date in `data-1` or `data-2`, the same face with figures that
  line up (the One Face Rule).
- **Do** say where a thing came from, beside it.
- **Do** give every picture its record (the Provenance Rule), and paint it twice: wide and tall.
- **Do** sample the colours of anything that falls from a picture of its season, and let
  `npm run hero` read the words over them.
- **Do** take a holiday's date from `content/holidays.json`.
- **Do** take a picture-icon from `src/components/Glyphs.tsx` by what it stands for (a category's
  id, a district's slug, a page's address), and light its point only on a light ground.

### Don't

- **Don't** set words in saffron on white, cream or sand: 1.60:1 on white.
- **Don't** use saffron running to ember, a coloured ring or a saffron glow for anything but a
  verified business (the Verified Rule, the Coloured Glow Rule).
- **Don't** caption a picture as a photograph, or as a real place.
- **Don't** cut a phone's picture out of the wide one, or let anything move by itself that cannot
  be held still and is not left out for a visitor who asks for less motion.
- **Don't** set words on the picture outside the landing page, or anything under its one button.
- **Don't** add a second face, or a monospaced face for figures.
- **Don't** set a sentence in capitals (the Capitals Rule).
- **Don't** make a dark page. Ink is for the footer and for a card to notice.
- **Don't** give an article or a page on another site a saffron-on-ink tile in a list of results
  (the Tile Rule).
- **Don't** draw anything on the island that is not in the data.
- **Don't** animate an entrance, or anything that moves by itself.
- **Don't** make a square button: a control is a pill, a round or a soft square (the Pill Rule).
- **Don't** take an icon from a library, put a letter, a number or a flag in one, or give one a
  second filled shape (the One Point Rule).

## Agent Guide

**Quick reference:** ground `sheet` (cream); surface `paper` (white); words `ink`, `ink-subtle`,
`ink-faint`; what answers `link` (royal); the filled action `signal` on `on-signal`; a chosen
control is filled with `ink`; a chosen page is on `signal-wash`; an edge is `line`, a field's edge
`line-strong`; corners 24px for a card and full for a control.

- Every value goes through a token. `npm run tokens` fails on an invented size, space, radius or
  colour.
- A new colour is a palette value with its source and its measured contrast, then a role. Add its
  pairs to `scripts/contrast.pairs.json` and run `npm run contrast`.
- A new list of things to act on is `.rows` holding `.listing` cards; a new set of names is
  `.index-cols`.
- A new fact on the site is data: `src/data/site.ts`, `content/`, or the crawler's output. Never a
  string in a component. A plan's name, price and what it gives are the owner's words (`PLANS`):
  add nothing to them.
- A link that appears by the dozen carries `prefetch={false}`.
- The island takes `lit` (positions from `chartPoints()`) or `focus` (one listing). It needs
  `says`. (`follow`, which lit what was being typed on the old first screen, is no longer used.)
- An icon on the Home page comes from `src/components/Glyphs.tsx` and stands beside its words in
  a `.tile-icon`. Its size is `--home-icon` on `.home`: change it there and nowhere else.
- A paid listing takes `.listing-paid` and the `VerifiedMark`, with `priority` when it pays to come
  first. Use them for nothing else.
- A new picture needs both paintings, the wide and the tall (`npm run picture` makes its files and
  their records), a line in `src/data/themes.ts`, and a pass from `npm run hero` and `npm run glass`.
- An icon for a thing the site lists is `CategoryIcon`, `GroupGlyph`, `DistrictIcon`, `FoodIcon` or
  `PageIcon` (`src/components/Glyphs.tsx`). Each takes any id and never fails. A new drawing goes
  in `src/components/glyphs/`, then `npm run icons:sheet`.
- House style in every file: British spelling, plain sentences, no em or en dashes
  (`npm run copy`).

**Audit before calling a page done:**

1. Words are on the sheet or a card; nothing but the landing page's headline is on the picture.
2. One filled action in each group; saffron nowhere as words.
3. Every text pair is in Contrast, floored and passing, or listed under Gaps.
4. Hover, focus and pressed states exist for everything that can be pressed, and the focus ring
   can be seen on its ground.
5. The page is whole without script and still under reduced motion.
6. `npm run design` gives 0 errors; fresh captures at 390 and 1440.

## Known Gaps

- **The focus ring cannot be seen well enough on ink**: 1.77:1 on the footer card and on a dark
  card. The `focus` role needs a value for a dark ground.
- **The verified mark and the paid card are drawn, and no listing wears them.** Joining them to
  the index and to the order of results is being built with the accounts. Until then the order is
  by answer and fullness alone.
- **Accounts, a business owner's dashboard, the admin screens, and bookings and services are being
  built.** None of their components is recorded here yet.
- **The site as an app is being built.** The manifest, the icons, the service worker and the
  offline page are in the repository; the card that offers to install was being put on the page.
  None of it is recorded here as checked.
- **A picture a superadmin uploads is not measured, and has one shape.** `npm run hero` measures
  the eighteen the site is built with; an uploaded one is one file, shown as it is on a desk and
  on a phone alike.
- **The seasons are a reading, not a source.** When each season begins, which pictures it has and
  what falls in it were chosen for this build. They are the owner's to correct.
- **A tall picture is not its wide one cut down.** It is the same scene painted again, so its
  details differ: a boat here, a tree there. That is meant.
- **The paid business page has no real business in it.** It is designed and checked in its
  preview (`/preview/business`, under `npm run dev` only), with made-up content.
- **The link preview card** on disk reads "13 guides". Its page now counts the articles the site
  holds, so `npm run og` is due again.
- **The contrast file is behind the build.** It holds one pair the site no longer has, and lacks
  the eleven measured above. The comment on ember in `globals.css` gives a ratio that is too high.
- **Declared and unused**: the `.card-wash` class.
- **Off the scales**: the footer's tile and a business's icon tile have 22px corners, which is not
  a step of the ladder. Some components set their own type size (Typography).
- **Small targets**: the small pills on a card are 36px and filters are 40px, under the 44px the
  house asks for.
- **The pictures are four.** Only two seasons and one kind of holiday have their own. The owner
  may replace any of them with a picture of their own.
- **The name has no written rule** for the clear space round it or its smallest size. The script
  that outlined its letters from Manrope Bold is not kept in the repository.
- **`geist` is still a dependency** in `package.json`, and no file uses it.
- **No dark palette.** The roles are clean enough to add one; it is not built.
- **French pages** are not built. A question in French or Kreol is understood.
- **The island cannot be explored by hand**: a point cannot be opened.
- **A chain is one card a branch.**
