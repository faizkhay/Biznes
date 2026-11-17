---
version: alpha
name: "biznes.mu, the website"
description: "The street: every business is a finished shopfront on one painted Mauritian shop street at blue hour. The palette is sampled from the mock-up the owner approved: dusk blue, limewash and one saffron, which fills the one action and one whole wall."
# On Google Labs' DESIGN.md format (npx @google/design.md lint DESIGN.md), from the KOS template.
# Every colour and typeface cites a Source ID (Overview, Sources). 'sampled' means measured from the
# approved mock-up or, for roomlight, from a painted plate; 'derived' means worked out from a sampled value, with the direction and the
# reason. Each key is the code's --palette-* name, except primary, primary-dark and on-primary, which
# the format asks for: they are --palette-saffron, --palette-saffron-deep and --palette-ink.
# The line-* values are the code's own color-mix() expressions with the variable written out.
# The ground-* colours are each listing's own identity, read from src/data/businesses.ts: content,
# not the platform's palette.
colors:
  primary: "#f8c618"                      # S1 the pill buttons; sampled. --palette-saffron; carries ink at 11.02:1
  primary-dark: "#e3b30d"                 # derived from primary: darker, the fill on hover and press; carries ink at 9.03:1. --palette-saffron-deep
  on-primary: "#0a1639"                   # ink, the words on saffron; see Contrast
  dusk: "#0e328f"                         # S1 the sky behind the headline, 53% of the mock-up; sampled. The page's ground
  dusk-deep: "#082478"                    # S1 the navigation band; sampled. The header, the footer, the phone menu
  limewash: "#f7f7f8"                     # S1 the white of the lettering; sampled. Words on dusk, 10.48:1; the ground of reading sections
  ink: "#0a1639"                          # S1 the dark text on the pills; sampled. Words on saffron and on limewash, 16.52:1
  ink-muted: "#515972"                    # derived from ink toward limewash: secondary words on limewash, 6.49:1
  ink-on-saffron: "#3e3d32"               # derived from ink toward saffron: secondary words on saffron, 6.81:1
  haze: "#b6c0db"                         # derived from limewash toward dusk: secondary words on dusk, 6.17:1, and on dusk-deep, 7.53:1
  coral: "#f14949"                        # S1 the shade under the headline; sampled. A shade only: 3.09:1 on dusk, never words
  enamel: "#0b2b8e"                       # S1 the second blue of the mock-up's sky; sampled (the painted plaque itself is another blue: Colors, Palette). Carries limewash at 11.20:1
  line: "color-mix(in srgb, #f7f7f8 20%, transparent)"                  # derived: limewash at 20%, the hairline between rows on dusk
  line-strong: "color-mix(in srgb, #f7f7f8 55%, transparent)"           # derived: limewash at 55%, an edge; 4.21:1 on dusk
  line-on-saffron: "color-mix(in srgb, #0a1639 22%, transparent)"       # derived: ink at 22%, the hairline on saffron
  line-on-limewash: "color-mix(in srgb, #0a1639 16%, transparent)"      # derived: ink at 16%, the hairline on limewash
  line-strong-on-light: "color-mix(in srgb, #0a1639 55%, transparent)"  # derived: ink at 55%, an edge; 3.58:1 on saffron, 3.93:1 on limewash
  tin: "#4a6eac"                          # S2 a tin roof where the sky lights it; region median. The drawn stand-in's roof
  tin-shade: "#3a5a94"                    # derived from tin: darker, the grooves between its ribs
  steel: "#655366"                        # S2 a roller shutter; region median
  steel-deep: "#574c64"                   # S2 a closed shutter in shade; region median. The gaps between the slats, the bottom rail
  lamplight: "#f18f38"                    # S2 the lit room's floor; region median
  lamplight-wall: "#e0842c"               # S2 the lit room's wall; region median
  pavement: "#3d3644"                     # S2 the pavement; region median. The kerb under a drawn shopfront
  roomlight: "#fdc27b"                    # S9 the lit room's wall on the first shop's painted plate; sampled. A lamp's bloom and a doorway's lamplight, never text
  ground-lepalatier: "#4a1626"            # S6, content: LePalatier's sign board, "Bordeaux"; a first direction, to confirm
  ground-lepalatier-ink: "#f3e9d8"        # S6, content: its lettering, "Ivory"; 12.17:1 on its board
  ground-lepalatier-accent: "#c6a15b"     # S6, content: its trim, "Brass"; the sign's frame and its lamps
  ground-lepalatier-wall: "#711425"       # S1, content: its wall, the mock-up's second colour; sampled
  ground-lakrem: "#fcefd9"                # S6, content: Lakrem (sample), "Cream"; a placeholder
  ground-lakrem-ink: "#a61e3c"            # S6, content: "Cherry"; 6.43:1 on its board
  ground-lakrem-accent: "#8fb37a"         # S6, content: "Pistachio"; trim
  ground-lakrem-wall: "#f0a92b"           # S6, content: its wall; a placeholder
  ground-souffle: "#dce2d6"               # S6, content: Souffle (sample), "Pale sage"; a placeholder
  ground-souffle-ink: "#2e3b33"           # S6, content: "Deep sage"; 8.88:1 on its board
  ground-souffle-accent: "#c28766"        # S6, content: "Clay"; trim
  ground-souffle-wall: "#1c9a8f"          # S6, content: its wall; a placeholder
  ground-bouke: "#1f3a2d"                 # S6, content: Bouké (sample), "Forest"; a placeholder
  ground-bouke-ink: "#f4cfc9"             # S6, content: "Blush"; 8.59:1 on its board
  ground-bouke-accent: "#e98a6e"          # S6, content: "Coral"; trim
  ground-bouke-wall: "#e8604c"            # S6, content: its wall; a placeholder
  ground-larout: "#0e5f6b"                # S6, content: Larout (sample), "Lagoon"; a placeholder
  ground-larout-ink: "#f7e9cc"            # S6, content: "Sand"; 6.09:1 on its board
  ground-larout-accent: "#f2a65a"         # S6, content: "Amber"; trim
  ground-larout-wall: "#16808c"           # S6, content: its wall; a placeholder
  ground-kazprop: "#ddeafb"               # S6, content: Kazprop (sample), "Sky"; a placeholder
  ground-kazprop-ink: "#1b46c2"           # S6, content: "Cobalt"; 6.37:1 on its board
  ground-kazprop-accent: "#7ed6b5"        # S6, content: "Mint"; trim
  ground-kazprop-wall: "#5aa9e6"          # S6, content: its wall; a placeholder
typography:                               # named as the text styles in src/app/globals.css; fontSize is the clamp() maximum, the full clamp() is in Typography, Hierarchy
  # The format cannot hold a slant, capitals or a shade: heading-1 is italic; the four headings, title-4 and caption-4 are capitals by text-transform (Typography, Hierarchy).
  heading-1: { fontFamily: "Barlow Condensed, Arial Narrow, sans-serif", fontSize: 6rem, fontWeight: 700, lineHeight: 1, letterSpacing: "0.005em" }
  heading-2: { fontFamily: "Barlow Condensed, Arial Narrow, sans-serif", fontSize: 3.75rem, fontWeight: 700, lineHeight: 1, letterSpacing: "0.005em" }
  heading-3: { fontFamily: "Barlow Condensed, Arial Narrow, sans-serif", fontSize: 2.25rem, fontWeight: 700, lineHeight: 1.11, letterSpacing: "0.01em" }
  heading-5: { fontFamily: "Barlow Condensed, Arial Narrow, sans-serif", fontSize: 1.5rem, fontWeight: 700, lineHeight: 1.33, letterSpacing: "0.015em" }
  title-1: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 1.25rem, fontWeight: 500, lineHeight: 1.4 }
  title-2: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 1.125rem, fontWeight: 400, lineHeight: 1.56 }
  title-3: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 1rem, fontWeight: 500, lineHeight: 1.5 }
  # The build sets font-variant-numeric: tabular-nums lining-nums on title-4 and caption-4; fontFeature is its font-feature-settings equivalent.
  title-4: { fontFamily: "Barlow Condensed, Arial Narrow, sans-serif", fontSize: 1.25rem, fontWeight: 600, lineHeight: 1.4, letterSpacing: "0.02em", fontFeature: "'tnum', 'lnum'" }
  body-1: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 1rem, fontWeight: 600, lineHeight: 1.5 }
  body-3: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 1rem, fontWeight: 400, lineHeight: 1.5 }
  body-4: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 0.875rem, fontWeight: 600, lineHeight: 1.43 }
  body-6: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 0.875rem, fontWeight: 400, lineHeight: 1.43 }
  button-md: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 1rem, fontWeight: 600, lineHeight: 1.5 }
  button-sm: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 0.875rem, fontWeight: 600, lineHeight: 1.43 }
  caption-1: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 0.875rem, fontWeight: 500, lineHeight: 1.43 }
  caption-2: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 0.875rem, fontWeight: 400, lineHeight: 1.43 }
  caption-4: { fontFamily: "Barlow Condensed, Arial Narrow, sans-serif", fontSize: 0.875rem, fontWeight: 600, lineHeight: 1.43, letterSpacing: "0.08em", fontFeature: "'tnum', 'lnum'" }
  # Not named styles: heading-1 and title-1 as the home page's first screen sets them from 900px wide (Typography, "The first words on a wide screen"). fontSize is the maximum, before the fit.
  heading-1-wide: { fontFamily: "Barlow Condensed, Arial Narrow, sans-serif", fontSize: 8rem, fontWeight: 700, lineHeight: 0.9, letterSpacing: "0.005em" }
  title-1-wide: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 1.5rem, fontWeight: 500, lineHeight: 1.4 }
rounded: { stop-name: 0.25rem, plaque: 0.375rem, field: 0.75rem, panel: 1rem, pill: 9999px }   # steps of Tailwind's radius scale: rounded-sm, rounded-md, rounded-xl, rounded-2xl, rounded-full
spacing: { gutter: 5rem, section: 8rem, shell: 80rem, measure: 62ch, measure-hero: 42.5rem, nav: 72px, walk-card: 26rem }   # the page rhythm, each at its maximum; inside components only the thirteen steps
components:                               # only: backgroundColor textColor typography rounded padding size height width. States are sibling keys.
  button-primary: { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", typography: "{typography.button-md}", rounded: "{rounded.pill}", padding: "0.5rem 1.5rem", height: 3rem }
  button-primary-hover: { backgroundColor: "{colors.primary-dark}", textColor: "{colors.on-primary}" }
  button-primary-pressed: { backgroundColor: "{colors.primary-dark}", textColor: "{colors.on-primary}" }
  button-primary-disabled: { backgroundColor: "{colors.dusk-deep}", textColor: "{colors.haze}" }
  button-primary-sm: { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", typography: "{typography.button-sm}", rounded: "{rounded.pill}", padding: "0.25rem 1rem", height: 2.75rem }
  button-quiet: { backgroundColor: "{colors.dusk}", textColor: "{colors.limewash}", typography: "{typography.button-md}", rounded: "{rounded.pill}", padding: "0.5rem 1.5rem", height: 3rem }
  button-quiet-on-deep: { backgroundColor: "{colors.dusk-deep}", textColor: "{colors.limewash}", typography: "{typography.button-md}", rounded: "{rounded.pill}", padding: "0.5rem 1.5rem", height: 3rem }
  button-quiet-sm: { backgroundColor: "{colors.dusk-deep}", textColor: "{colors.limewash}", typography: "{typography.button-sm}", rounded: "{rounded.pill}", padding: "0.25rem 1rem", height: 2.75rem }
  arrow-link: { backgroundColor: "{colors.dusk}", textColor: "{colors.limewash}", typography: "{typography.button-md}", height: 3rem }
  arrow-link-on-saffron: { backgroundColor: "{colors.primary}", textColor: "{colors.ink}", typography: "{typography.button-md}", height: 3rem }
  arrow-link-on-limewash: { backgroundColor: "{colors.limewash}", textColor: "{colors.ink}", typography: "{typography.button-md}", height: 3rem }
  skip-link: { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", typography: "{typography.button-sm}", rounded: "{rounded.pill}", padding: "0.75rem 1.5rem" }
  field: { backgroundColor: "{colors.dusk}", textColor: "{colors.limewash}", typography: "{typography.body-3}", rounded: "{rounded.field}", padding: "0.75rem 1rem", height: 3rem }
  field-disabled: { backgroundColor: "{colors.dusk-deep}", textColor: "{colors.haze}" }
  field-label: { backgroundColor: "{colors.dusk}", textColor: "{colors.limewash}", typography: "{typography.title-3}" }
  field-error: { backgroundColor: "{colors.dusk}", textColor: "{colors.limewash}", typography: "{typography.caption-1}" }
  chip: { backgroundColor: "{colors.dusk}", textColor: "{colors.limewash}", typography: "{typography.body-3}", rounded: "{rounded.pill}", padding: "0.5rem 1rem", height: 2.75rem }
  chip-selected: { backgroundColor: "{colors.limewash}", textColor: "{colors.dusk}" }
  panel: { backgroundColor: "{colors.dusk}", textColor: "{colors.limewash}", typography: "{typography.body-3}", rounded: "{rounded.panel}", padding: 1.5rem }
  header: { backgroundColor: "{colors.dusk-deep}", textColor: "{colors.limewash}", typography: "{typography.title-3}", height: 72px }
  menu-link: { backgroundColor: "{colors.dusk-deep}", textColor: "{colors.limewash}", typography: "{typography.heading-3}", height: 4rem }
  logo-name: { backgroundColor: "{colors.dusk-deep}", textColor: "{colors.limewash}", typography: "{typography.heading-5}" }
  footer-link: { backgroundColor: "{colors.dusk-deep}", textColor: "{colors.limewash}", typography: "{typography.body-3}", height: 2.75rem }
  credit: { backgroundColor: "{colors.dusk-deep}", textColor: "{colors.haze}", typography: "{typography.caption-2}", height: 2.75rem }
  credit-name: { backgroundColor: "{colors.dusk-deep}", textColor: "{colors.limewash}", typography: "{typography.body-4}" }
  hero-heading: { backgroundColor: "{colors.dusk}", textColor: "{colors.limewash}", typography: "{typography.heading-1}" }
  hero-heading-wide: { backgroundColor: "{colors.dusk}", textColor: "{colors.limewash}", typography: "{typography.heading-1-wide}" }
  hero-lede-wide: { backgroundColor: "{colors.dusk}", textColor: "{colors.limewash}", typography: "{typography.title-1-wide}", width: 36rem }
  hero-shade: { backgroundColor: "{colors.coral}" }
  section-heading: { backgroundColor: "{colors.dusk}", textColor: "{colors.limewash}", typography: "{typography.heading-2}" }
  section-heading-on-limewash: { backgroundColor: "{colors.limewash}", textColor: "{colors.ink}", typography: "{typography.heading-2}" }
  section-heading-on-saffron: { backgroundColor: "{colors.primary}", textColor: "{colors.ink}", typography: "{typography.heading-2}" }
  list-heading-on-saffron: { backgroundColor: "{colors.primary}", textColor: "{colors.ink}", typography: "{typography.heading-3}" }
  lede: { backgroundColor: "{colors.dusk}", textColor: "{colors.haze}", typography: "{typography.title-1}" }
  section-lede: { backgroundColor: "{colors.dusk}", textColor: "{colors.haze}", typography: "{typography.title-2}" }
  body-on-dusk: { backgroundColor: "{colors.dusk}", textColor: "{colors.limewash}", typography: "{typography.body-3}" }
  muted-on-dusk: { backgroundColor: "{colors.dusk}", textColor: "{colors.haze}", typography: "{typography.caption-2}" }
  note-on-dusk: { backgroundColor: "{colors.dusk}", textColor: "{colors.limewash}", typography: "{typography.body-6}", rounded: "{rounded.field}", padding: 1rem }
  body-on-deep: { backgroundColor: "{colors.dusk-deep}", textColor: "{colors.limewash}", typography: "{typography.body-3}" }
  muted-on-deep: { backgroundColor: "{colors.dusk-deep}", textColor: "{colors.haze}", typography: "{typography.caption-2}" }
  body-on-limewash: { backgroundColor: "{colors.limewash}", textColor: "{colors.ink}", typography: "{typography.body-3}" }
  muted-on-limewash: { backgroundColor: "{colors.limewash}", textColor: "{colors.ink-muted}", typography: "{typography.caption-2}" }
  body-on-saffron: { backgroundColor: "{colors.primary}", textColor: "{colors.ink}", typography: "{typography.body-3}" }
  muted-on-saffron: { backgroundColor: "{colors.primary}", textColor: "{colors.ink-on-saffron}", typography: "{typography.body-3}" }
  failed-line: { backgroundColor: "{colors.dusk}", textColor: "{colors.limewash}", typography: "{typography.body-1}" }
  price: { backgroundColor: "{colors.dusk}", textColor: "{colors.limewash}", typography: "{typography.title-4}" }
  price-on-limewash: { backgroundColor: "{colors.limewash}", textColor: "{colors.ink}", typography: "{typography.title-4}" }
  price-sample: { backgroundColor: "{colors.dusk}", textColor: "{colors.haze}", typography: "{typography.caption-2}" }
  step-number: { backgroundColor: "{colors.primary}", textColor: "{colors.ink}", typography: "{typography.heading-2}" }
  question: { backgroundColor: "{colors.limewash}", textColor: "{colors.ink}", typography: "{typography.title-1}", height: 4rem }
  question-hover: { backgroundColor: "{colors.limewash}", textColor: "{colors.dusk}" }
  plaque: { backgroundColor: "{colors.enamel}", textColor: "{colors.limewash}", typography: "{typography.caption-4}", rounded: "{rounded.plaque}", padding: "0.125rem 0.625rem", height: 1.75rem }
  walk-card: { backgroundColor: "{colors.enamel}", textColor: "{colors.limewash}", typography: "{typography.heading-3}", rounded: "{rounded.field}", padding: 1.75rem, width: 26rem }
  walk-cue: { backgroundColor: "{colors.dusk-deep}", textColor: "{colors.limewash}", typography: "{typography.button-sm}", rounded: "{rounded.pill}", padding: "0.5rem 1rem", height: 2.75rem }
  walk-cue-hover: { backgroundColor: "{colors.enamel}", textColor: "{colors.limewash}" }
  walk-stop-name: { backgroundColor: "{colors.enamel}", textColor: "{colors.limewash}", typography: "{typography.caption-4}", rounded: "{rounded.stop-name}", padding: "0.125rem 0.5rem" }
  walk-stops: { backgroundColor: "{colors.dusk-deep}", rounded: "{rounded.pill}", padding: "0 0.75rem", height: 2.75rem }
  walk-stop-mark: { backgroundColor: "{colors.line-strong}", rounded: "{rounded.pill}", width: 0.1875rem, height: 0.75rem }
  walk-stop-mark-current: { backgroundColor: "{colors.primary}", rounded: "{rounded.pill}", width: 0.1875rem, height: 1.5rem }
  # Set over a painting: a sample's tag, and the light the site adds. The lettering on a painted plaque is limewash on paint, which no token holds.
  plate-tag: { backgroundColor: "{colors.limewash}", textColor: "{colors.ink}" }
  lamp-bloom: { backgroundColor: "{colors.roomlight}", rounded: "{rounded.pill}" }
  current-page-line: { backgroundColor: "{colors.primary}", height: 2px }
  selection: { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}" }
  focus-ring: { backgroundColor: "{colors.primary}", width: 2px }
  focus-ring-on-limewash: { backgroundColor: "{colors.dusk}", width: 2px }
  focus-ring-on-saffron: { backgroundColor: "{colors.ink}", width: 2px }
  divider: { backgroundColor: "{colors.line}", height: 1px }
  divider-strong: { backgroundColor: "{colors.line-strong}", height: 1px }
  divider-on-saffron: { backgroundColor: "{colors.line-on-saffron}", height: 1px }
  divider-on-limewash: { backgroundColor: "{colors.line-on-limewash}", height: 1px }
  divider-strong-on-light: { backgroundColor: "{colors.line-strong-on-light}", height: 1px }
  # The drawn stand-in's own materials: fills in an SVG, never text.
  shopfront-roof: { backgroundColor: "{colors.tin}" }
  shopfront-roof-groove: { backgroundColor: "{colors.tin-shade}" }
  shopfront-shutter: { backgroundColor: "{colors.steel}" }
  shopfront-shutter-gap: { backgroundColor: "{colors.steel-deep}" }
  shopfront-room-floor: { backgroundColor: "{colors.lamplight}" }
  shopfront-room-wall: { backgroundColor: "{colors.lamplight-wall}" }
  shopfront-kerb: { backgroundColor: "{colors.pavement}" }
  # One per listing: its board with its lettering, so the linter checks the pair. The wall and the trim carry no words.
  sign-lepalatier: { backgroundColor: "{colors.ground-lepalatier}", textColor: "{colors.ground-lepalatier-ink}", rounded: "{rounded.panel}" }
  sign-lakrem: { backgroundColor: "{colors.ground-lakrem}", textColor: "{colors.ground-lakrem-ink}", rounded: "{rounded.panel}" }
  sign-souffle: { backgroundColor: "{colors.ground-souffle}", textColor: "{colors.ground-souffle-ink}", rounded: "{rounded.panel}" }
  sign-bouke: { backgroundColor: "{colors.ground-bouke}", textColor: "{colors.ground-bouke-ink}", rounded: "{rounded.panel}" }
  sign-larout: { backgroundColor: "{colors.ground-larout}", textColor: "{colors.ground-larout-ink}", rounded: "{rounded.panel}" }
  sign-kazprop: { backgroundColor: "{colors.ground-kazprop}", textColor: "{colors.ground-kazprop-ink}", rounded: "{rounded.panel}" }
  wall-lepalatier: { backgroundColor: "{colors.ground-lepalatier-wall}" }
  wall-lakrem: { backgroundColor: "{colors.ground-lakrem-wall}" }
  wall-souffle: { backgroundColor: "{colors.ground-souffle-wall}" }
  wall-bouke: { backgroundColor: "{colors.ground-bouke-wall}" }
  wall-larout: { backgroundColor: "{colors.ground-larout-wall}" }
  wall-kazprop: { backgroundColor: "{colors.ground-kazprop-wall}" }
  trim-lepalatier: { backgroundColor: "{colors.ground-lepalatier-accent}", rounded: "{rounded.field}" }
  trim-lakrem: { backgroundColor: "{colors.ground-lakrem-accent}", rounded: "{rounded.field}" }
  trim-souffle: { backgroundColor: "{colors.ground-souffle-accent}", rounded: "{rounded.field}" }
  trim-bouke: { backgroundColor: "{colors.ground-bouke-accent}", rounded: "{rounded.field}" }
  trim-larout: { backgroundColor: "{colors.ground-larout-accent}", rounded: "{rounded.field}" }
  trim-kazprop: { backgroundColor: "{colors.ground-kazprop-accent}", rounded: "{rounded.field}" }
---

# Design System: biznes.mu, the website

<!-- Recorded on 17 November 2026 from faizkhay/Biznes: the painted street, at commit 5495eee with
the fixes that followed its finish review in the working tree, as served by the production build
of 12:54 UTC. It replaces the record of the 3D street, which the owner rejected the same day;
nothing of the 3D survives in the code, and three.js and React Three Fiber are uninstalled. Read
from src/app/globals.css, src/components, src/app, src/data, scripts and assets/plates. Every
measurement below marked "live" was taken from that build, read-only, between 12:55 and 13:10
UTC. Where the build and this file differ, the build wins and the difference goes to Known Gaps.
Checks: `npx --yes @google/design.md@0.4.0 lint DESIGN.md` gives 0 errors and 0 warnings; `node
scripts/check-design.mjs` passes; contrast measured 17 November 2026 with `npm run contrast`. The
machine-readable sidecar is `.impeccable/design.json`. -->

## Overview

**Creative North Star: "The street"**

biznes.mu sells finished businesses in Mauritius, each built by Khay Digital and sold once, to one
owner. Every business is a finished shopfront on one street at blue hour: its sign painted and lit,
its shutter down. The street is painted. Five plates, generated illustrations in the style of
the mock-up the owner approved, were each painted with every board, plaque, screen and
paper left blank. What is true is set over the paint in code, from the data: a listing's own
lettering on its board, its town or its number on its plaque, "Sample" on a sample's shutter.

The home page opens on that street and the scroll walks one shop, LePalatier, in eight stops: the
street, the sign, the address, behind the shutter, the counter, the wall, the room, the whole
street. Three beats: the street at dusk, behind the shutter, yours to open. Then the street as one
terrace, the sale in four steps, the line said large, and the questions. A business's own page ends
on one action: Ask about this business. Sold, it leaves the street.

The mood is a shop street after work, when the signs come on: saturated walls on a deep blue
ground, lettering painted large, warm light where a room is open. One idea per block. Sections sit
64 to 128px apart, running text is held to 62ch, and a heading with its lede to 680px. Nothing in
the palette or the type was invented: the interface's colours were measured from the mock-up the
owner approved on 17 November 2026 (S1), the drawn stand-in's materials are region medians of the
same picture (S2), two values were sampled from the plates themselves (S8, S9), and Barlow
Condensed was matched to the mock-up's lettering by measurement (S3). What is derived says what it
was derived from. Each listing's own colours and lettering are Khay Digital's direction (S6) and
are content, not the platform's palette.

**Key Characteristics:**

- `dusk` #0e328f is the page's ground and `limewash` #f7f7f8 its words (10.48:1); `dusk-deep`
  #082478 holds the header and the footer.
- `primary` #f8c618, saffron, is the one filled action, the focus ring, the current page's line and
  one whole wall; on that wall the action turns `ink` #0a1639.
- Barlow Condensed in capitals (`heading-1` to `heading-5`, `title-4`, `caption-4`) speaks whatever
  is painted on a sign; Geist carries every sentence.
- The shopfront is the one picture of a business, and it is a painting: a tin roof, white
  fretwork, two lamps over a sign board, a roller shutter. Its lettering is the listing's own
  outline, set on the blank board in code.
- The first words stand in the painted sky. They are shaped to the roofline, and their sentences
  are held above the afterglow, where white would not read.
- The plaque, `enamel` #0b2b8e with a limewash rim (`rounded.plaque`, 6px), names what is fixed: a
  number, a status, a town. The walk's card is the same plaque at the size of a notice.
- The lambrequin, a row of pierced scallops 16px tall, hangs where one ground meets the next.
- Anything pressed is a full pill at least 48px tall (`button-primary`, `button-quiet`), 44px for
  the small button, a chip and the walk's cue.
- The interface is flat; depth lives in the paintings. The stage moves each plate with one 2D
  transform, travels within a painting and dissolves on a push between two, and a still of itself
  stands wherever script does not run.

**Refusals:**

- No 3D. The owner rejected the rendered street on 17 November 2026 (S13). Nothing on the site is
  WebGL or a canvas, and no model, shader or 3D library is loaded.
- No lettering inside a painting. Every board, plaque, screen and paper is painted blank, so a
  picture can never say something the data does not.
- No blur and no scrim over the stage. Whatever sits over a painting is solid: the header in
  `dusk-deep`, the walk's card and a stop's name in `enamel`, the cue and the strip the stop marks
  stand on in `dusk-deep`. The first words take the sky itself and are kept where it is dark.
- No boxed listing card and no cream catalogue. The direction contract refused both, and the first
  build was the second: a business is shown as its shopfront, with its facts on the ground beneath.
- No photograph, testimonial or sales figure. None exists yet (PRODUCT.md, "Evidence on Hand"), and
  nothing is invented. The shopfronts are illustrations: each file's record says so, and so does
  the legal line in every page's footer.
- No colour as the only signal. A sample, a status, an error and the current page are said in words
  or drawn as a mark.
- No soft shadow, glow or gradient in the interface. The only shadow is the sign painter's hard
  coral shade, which is lettering. Light belongs to the street: a lamp's bloom and a doorway's
  lamplight are the only gradients, and both lie on a picture.

**Sources** <!-- add a row before using any new asset -->

| ID | Asset | From, version | Gave |
|---|---|---|---|
| S1 | The approved mock-up, `.impeccable/mocks/comp-b-perspective.png` (2688 by 1520) | Generated 17 November 2026 with Higgsfield, model `gpt_image_2_6`, its prompt beside it; approved by the owner the same day. Measured by impeccable comp-spec into `.impeccable/build/spec.json`, 12 regions | The first screen's composition; `dusk`, `dusk-deep`, `primary`, `limewash`, `ink`, `coral`, `enamel`; LePalatier's wall; the measure of the first words on a wide screen |
| S2 | The same mock-up, by region median | `scripts/sample-comp.mjs`, 15 regions, 17 November 2026 | The drawn stand-in's materials: `tin`, `steel`, `steel-deep`, `lamplight`, `lamplight-wall`, `pavement` |
| S3 | The mock-up's headline lettering | impeccable font-match (`spec.json`, region `headline`; `.impeccable/build/font-match/headline.png`) | Barlow Condensed at weight 700: a cap height of 138px against the mock-up's 137.9px |
| S4 | Barlow Condensed, three cuts (600, 700, 700 italic), in `src/fonts` | From `@fontsource/barlow-condensed`; SIL Open Font License 1.1, the licence beside the files; served through next/font | The sign face |
| S5 | Geist | The `geist` package, 1.9.2; SIL Open Font License 1.1; served through next/font. Carried from the first build, where it came from Elaya's list of faces as KOS keeps it (`references/brand-system.md`) | The face for sentences |
| S6 | Khay Digital's direction for the listings | 16 and 17 November 2026; `src/data/businesses.ts` | Each listing's sign colours, its trim and the face its lettering is drawn in; the samples' wall colours |
| S7 | Six open-licence faces | `@fontsource` packages (devDependencies), each under the SIL Open Font License 1.1 | The outlines of the six wordmarks, drawn by `scripts/make-wordmarks.mjs` |
| S8 | The street plate, `assets/plates/street.webp` (3840 by 2160). A generated illustration, not a photograph of a real street | Higgsfield, model `gpt_image_2_6`, high quality, 17 November 2026, job 023f4767-a203-4da5-995f-0af8ba6da66e, with S1 as its reference. Saved as generated; its record says nothing was retouched. Prompt in `street.prompt.txt` | The first two stops of the walk and its last; the roofline the first words are shaped to; the sky colour the stage takes as its ground |
| S9 | The first business's own plate, `assets/plates/lepalatier.webp` (2880 by 2880): LePalatier front on, its shutter up, its room lit. A generated illustration | The same generator and day, job 22658b5b-c959-4948-8c2b-71a0d8d1210c, with two of the owner's mock-ups as its references. Prompt in `lepalatier.prompt.txt` | Three stops of the walk; the picture at the head of LePalatier's page; the room behind its shutter (`room.webp`); `roomlight` |
| S10 | The terrace plate, `assets/plates/terrace.webp` (3840 by 1648, on a transparent ground): all six shopfronts front on. A generated illustration | The same generator and day, job 8206df3e-ca03-4542-81ab-1edfbea727ed, with two of the owner's mock-ups as its references. Prompt in `terrace.prompt.txt` | The terrace under the walk, "On the street now", shipped as its painted band (3840 by 1175); one crop for each shop, at two widths (`public/img/shops`), with the slivers of its neighbours' piers covered by the script; the slats of the shutter that rolls (`shutter.webp`) |
| S11 | The counter plate, `assets/plates/counter.webp` (2048 by 1360): a bound document on a counter. A generated illustration | The same generator and day, job aa11c069-f8d4-4b7f-be34-a0d051f4a396, with S9 as its reference. Prompt in `counter.prompt.txt` | The stop at the counter |
| S12 | The certificate plate, `assets/plates/certificate.webp` (2048 by 1360): a framed paper on a plastered wall. A generated illustration | The same generator and day, job 1ee2c137-0454-4403-9285-c00f6946efce, with S9 as its reference. Prompt in `certificate.prompt.txt` | The stop at the wall |
| S13 | The owner | In conversation, 15 to 17 November 2026 | The offer; carte blanche on creative direction; the choice of "the street" and of mock-up B; on 17 November, the rejection of the 3D street and the request for a better look that keeps Khay's standards (STORY.md has the words) |

## Colors

The palette is sampled, not chosen. The mock-up the owner approved (S1) gave the dusk, the saffron,
the limewash, the ink, the coral and the enamel blue; region medians of the same picture (S2) gave
the drawn stand-in's materials; and one value was sampled from a painted plate (S9).

### Palette

| Name | Token | Value | Role: where used, and where never | Source |
|---|---|---|---|---|
| Dusk | `dusk` | #0e328f | The page's ground; a field's fill; the ground behind the stage until a picture arrives. The action's fill on limewash | S1: the sky behind the headline, 53% of the mock-up (comp-spec, the picture's first colour) |
| Deep Dusk | `dusk-deep` | #082478 | The header, the footer, the phone menu, the walk's cue, the strip the stop marks stand on; the fill of a disabled action; the browser's theme colour and the icon's ground | S1: the navigation band (92% of that region) |
| Saffron | `primary` | #f8c618 | Fills only: the one filled action, the focus ring, the current page's line and dot, the current stop's mark, the selection, the scrollbar, the mark, and the ground of one whole section. Never words on limewash (1.49:1) | S1: the pill buttons (the navigation band's second colour) |
| Saffron, pressed | `primary-dark` | #e3b30d | The filled action on hover and press | derived from `primary`: darker, still carrying ink at 9.03:1 |
| Ink | `ink`, `on-primary` | #0a1639 | Words on saffron and on limewash; the action's fill on the saffron section; the word on a sample's tag | S1: the dark text on the Enquire pill |
| Limewash | `limewash` | #f7f7f8 | Words on dusk, on deep dusk and on enamel; the ground of reading sections; white paint (a fringe, a plaque's rim, a sample's tag, a town or a number lettered on a painted plaque) | S1: the white of the lettering (regions `nav-how` and `how-link`) |
| Muted Ink | `ink-muted` | #515972 | Secondary words on limewash only | derived from `ink` toward `limewash`: 6.49:1 |
| Ink on Saffron | `ink-on-saffron` | #3e3d32 | Secondary words on the saffron section only | derived from `ink` toward `primary`: 6.81:1 |
| Haze | `haze` | #b6c0db | Secondary words on dusk and deep dusk. Never on limewash or saffron | derived from `limewash` toward `dusk`: 6.17:1 and 7.53:1 |
| Coral | `coral` | #f14949 | The hard shade under the hero's capitals and under the tagline. Never words, never a fill | S1: the shade under the headline (22% of that region) |
| Enamel | `enamel` | #0b2b8e | A plaque's plate; the walk's card; a stop's name; the cue on hover | S1: the second blue of the mock-up's sky (19% of that region). The mock-up's painted plaque measures #052592, and the plates' painted plaques #011d9f and #01279c |
| Hairline | `line` | limewash at 20% | The line between rows on dusk and deep dusk; the default border colour | derived |
| Edge | `line-strong` | limewash at 55% | A field's edge, a chip's, a quiet button's; the line that opens a list; a resting stop mark; the 404's dashed plot | derived, for 3:1 as a mark |
| Hairline on Saffron | `line-on-saffron` | ink at 22% | The line between rows on the saffron section | derived |
| Hairline on Limewash | `line-on-limewash` | ink at 16% | The line between rows and a paint's edge on limewash | derived |
| Edge on Light | `line-strong-on-light` | ink at 55% | The line that opens a list on saffron and on limewash | derived, for 3:1 as a mark |

One value was sampled from a painted plate, for the light the site adds to a painting in flat
colour. It is never text or a ground for words.

| Name | Token | Value | Where | Source |
|---|---|---|---|---|
| Roomlight | `roomlight` | #fdc27b | A lamp's bloom on the street plate, at 85%, screened over the paint; the head of the light in a doorway where no room is painted | S9: "the lit room's wall on the first shop's painted plate" (`globals.css`) |

One more sampled colour is written outside the palette: `STREET_SKY`, #012993, in
`src/data/plates.ts`, "the sky along the street plate's top edge". It is the stage's ground wherever
a plate ends, and on a phone it is the sky the first words stand on. This record measured that
edge on the master at #012a92.

The drawn stand-in's materials colour an SVG and are never text. Each is a region median of the
mock-up (S2), named by the region `scripts/sample-comp.mjs` prints. All six listings are painted
today, so no stand-in is drawn on any page, and of these seven only `pavement` reaches one, as the
404's kerb.

| Name | Token | Value | Where | Source |
|---|---|---|---|---|
| Tin | `tin` | #4a6eac | A drawn roof's ribs | S2: "tin roof (LePalatier, lit face)" |
| Tin Shade | `tin-shade` | #3a5a94 | The grooves between the ribs | derived from `tin`: darker |
| Steel | `steel` | #655366 | A drawn shutter's slats | S2: "shutter steel (LePalatier, raised part)" |
| Steel Deep | `steel-deep` | #574c64 | The gaps between the slats; the shutter's bottom rail | S2: "shutter steel (closed, lakrem)" |
| Lamplight | `lamplight` | #f18f38 | A drawn room's floor and the lines of its corners; the foot of the light in a doorway where no room is painted | S2: "room floor" |
| Lamplight Wall | `lamplight-wall` | #e0842c | A drawn room's walls | S2: "room wall, lit" |
| Pavement | `pavement` | #3d3644 | The kerb under a drawn shopfront and under the 404's empty plot | S2: "pavement" |

### Listings' own colours

These are content: each listing's identity, read from `src/data/businesses.ts`. On a painting the
wall, the board and the trim are paint. Each plate's prompt names these colours in words, and
lamplight lies across them, so a painted board is not its flat value (Contrast, "Paint under
lettering"). The code sets only the lettering there, in the listing's `ink`. The flat values colour
the two sign plates and the four paints on a listing's own page, the rule on the strategy's cover
(`accent`) and the drawn stand-in. They are not the platform's palette and no platform component
may borrow them. Each board is modelled with its lettering, so the flat pair is checked.

| Listing | Wall | Board | Lettering | Trim | As the data names them | Standing |
|---|---|---|---|---|---|---|
| LePalatier | `ground-lepalatier-wall` #711425 | `ground-lepalatier` #4a1626 | `ground-lepalatier-ink` #f3e9d8 | `ground-lepalatier-accent` #c6a15b | Bordeaux, Ivory, Brass | The wall is sampled (S1: the mock-up's second colour, 15% of the frame); the rest is S6, a first direction, to confirm |
| Lakrem (sample) | `ground-lakrem-wall` #f0a92b | `ground-lakrem` #fcefd9 | `ground-lakrem-ink` #a61e3c | `ground-lakrem-accent` #8fb37a | Cream, Cherry, Pistachio | S6: a placeholder |
| Souffle (sample) | `ground-souffle-wall` #1c9a8f | `ground-souffle` #dce2d6 | `ground-souffle-ink` #2e3b33 | `ground-souffle-accent` #c28766 | Pale sage, Deep sage, Clay | S6: a placeholder |
| Bouké (sample) | `ground-bouke-wall` #e8604c | `ground-bouke` #1f3a2d | `ground-bouke-ink` #f4cfc9 | `ground-bouke-accent` #e98a6e | Forest, Blush, Coral | S6: a placeholder |
| Larout (sample) | `ground-larout-wall` #16808c | `ground-larout` #0e5f6b | `ground-larout-ink` #f7e9cc | `ground-larout-accent` #f2a65a | Lagoon, Sand, Amber | S6: a placeholder |
| Kazprop (sample) | `ground-kazprop-wall` #5aa9e6 | `ground-kazprop` #ddeafb | `ground-kazprop-ink` #1b46c2 | `ground-kazprop-accent` #7ed6b5 | Sky, Cobalt, Mint | S6: a placeholder |

### Roles

Components use roles (`--color-*` in `@theme`), each an alias of a palette value. Tailwind's own
colours are switched off (`--color-*: initial`), so only a role paints.

| Role | Aliases | Elaya's group | Where |
|---|---|---|---|
| `paper` | `dusk` | Surface | The page's ground; a field's fill |
| `paper-subtle` | `dusk-deep` | Surface | The fill of a disabled filled action and of a disabled field. Nothing else reads it |
| `ink` | `limewash` | Text | Words |
| `ink-subtle` | `haze` | Text | Secondary words |
| `action` | `primary` | Action | The one filled action; the current page's line; the current stop's mark; a question's words when pointed at |
| `action-hover` | `primary-dark` | Action | The action on hover, and so while it is pressed |
| `on-action` | `ink` | Text, inverted | Words on the action; the ring on a pill that leads to the page the visitor is on |
| `line` | `limewash` at 20% | Border | Hairlines between rows |
| `line-strong` | `limewash` at 55% | Border | A field's edge and a quiet button's: 4.21:1 on dusk |
| `focus` | `primary` | Border | The focus ring: 6.98:1 on dusk, 8.52:1 on deep dusk |
| `shade` | `coral` | none: this build's own | The sign painter's shade (`heading-1`, `sign-shade`) |
| `plaque`, `on-plaque` | `enamel`, `limewash` | none: this build's own | A plaque's plate and its words; the walk's card; a stop's name |

A ground is a scope that redefines roles. The palette is never redefined.

| Scope | `paper` | `paper-subtle` | `ink` | `ink-subtle` | `action` | `action-hover` | `on-action` | `line` | `line-strong` | `focus` |
|---|---|---|---|---|---|---|---|---|---|---|
| The page | `dusk` | `dusk-deep` | `limewash` | `haze` | `primary` | `primary-dark` | `ink` | limewash at 20% | limewash at 55% | `primary` |
| `[data-ground="deep"]` | `dusk-deep` | `dusk` | unchanged | unchanged | unchanged | unchanged | unchanged | unchanged | unchanged | unchanged |
| `[data-ground="saffron"]` | `primary` | `primary-dark` | `ink` | `ink-on-saffron` | `ink` | `dusk-deep` | `limewash` | ink at 22% | ink at 55% | `ink` |
| `[data-ground="limewash"]` | `limewash` | ink at 6% over limewash | `ink` | `ink-muted` | `dusk` | `dusk-deep` | `limewash` | ink at 16% | ink at 55% | `dusk` |
| `[data-ground="brand"]` | the listing's board | unchanged | the listing's lettering | the listing's lettering | unchanged | unchanged | unchanged | the listing's lettering at 30% | unchanged | unchanged |

Deep dusk holds the header, with the phone menu that opens under it, and the footer. Saffron holds
the four steps on the home page and on How it works, and "What comes with it" on a listing.
Limewash holds the questions, the catalogue, a listing's brand and the link to the next business.
The brand scope holds the two sign plates on a listing's page. The site has one colour scheme
(`colorScheme: "dark"`, theme colour `dusk-deep`). The browser's own surfaces are themed as well:
the selection is saffron with ink, the scrollbar is saffron on deep dusk, the caret is the ground's
ink, and links underline 0.22em below the baseline.

### Named Rules

**The One Saffron Rule.** Saffron is a fill: the one filled action in a group, the focus ring, the
mark that says "you are here", and one whole wall. It is never words on limewash, where it measures
1.49:1, and on its own wall the action turns ink.

**The Own Sign Rule.** A listing's colours stay on its own shopfront, its sign plates and its
paints, and every word on a board takes that listing's lettering colour: through
`[data-ground="brand"]` on a sign plate, and as the outline's fill on a painted board. The platform
must not compete with what it sells, and each board is one measured pair.

**The Roles Not Values Rule.** A ground changes roles inside a scope; a `--palette-*` value is
never redefined. A corrected sample then changes the palette and nothing else.

### Contrast

WCAG 2.x, **floored** to two decimals (never rounded), alpha composited over the real ground. AA:
4.5:1 for text under 24px (18.66px bold); 3:1 for larger text and for non-text marks (the focus
ring, a field's edge). Measured on 17 November 2026 by `scripts/contrast.mjs` over
`scripts/contrast.pairs.json`; `npm run contrast` runs it again. The table is the script's own, with
each token's name added beside its value.

| Text or mark | On | Ratio | Body text (4.5) | Large text, marks (3) | Where |
|---|---|---|---|---|---|
| `limewash` #f7f7f8 | `dusk` #0e328f | 10.48:1 | pass | pass | limewash on dusk: every heading and paragraph on the page's ground |
| `haze` #b6c0db | `dusk` #0e328f | 6.17:1 | pass | pass | haze on dusk: secondary words |
| `limewash` #f7f7f8 | `dusk-deep` #082478 | 12.78:1 | pass | pass | limewash on deep dusk: the header, the footer, the way into the walk |
| `haze` #b6c0db | `dusk-deep` #082478 | 7.53:1 | pass | pass | haze on deep dusk: secondary words in the header and the footer |
| `ink` #0a1639 | `primary` #f8c618 | 11.02:1 | pass | pass | ink on saffron: the filled action, and words on the saffron section |
| `ink` #0a1639 | `primary-dark` #e3b30d | 9.03:1 | pass | pass | ink on deep saffron: the filled action, hovered or pressed |
| `ink-on-saffron` #3e3d32 | `primary` #f8c618 | 6.81:1 | pass | pass | secondary words on the saffron section |
| `limewash` #f7f7f8 | `ink` #0a1639 | 16.52:1 | pass | pass | limewash on ink: the action on the saffron section |
| `ink` #0a1639 | `limewash` #f7f7f8 | 16.52:1 | pass | pass | ink on limewash: reading sections |
| `ink-muted` #515972 | `limewash` #f7f7f8 | 6.49:1 | pass | pass | muted ink on limewash: secondary words in reading sections |
| `ink-muted` #515972 | #e9eaed | 5.77:1 | pass | pass | muted ink on a disabled field on limewash (limewash with 6% ink) |
| `limewash` #f7f7f8 | `dusk` #0e328f | 10.48:1 | pass | pass | the action on limewash: limewash on dusk |
| `limewash` #f7f7f8 | `dusk-deep` #082478 | 12.78:1 | pass | pass | the action on limewash, hovered or pressed |
| `dusk` #0e328f | `limewash` #f7f7f8 | 10.48:1 | pass | pass | a question on limewash, hovered, and a chosen chip on limewash: dusk on limewash; the focus ring on limewash |
| `primary` #f8c618 | `dusk` #0e328f | 6.98:1 | pass | pass | the focus ring on dusk: saffron on dusk |
| `primary` #f8c618 | `dusk-deep` #082478 | 8.52:1 | pass | pass | the focus ring on deep dusk |
| `ink` #0a1639 | `primary` #f8c618 | 11.02:1 | pass | pass | the focus ring on saffron |
| `limewash` #f7f7f8 | `enamel` #0b2b8e | 11.20:1 | pass | pass | a plaque, a card on the walk and a stop's name: limewash on enamel |
| `line-strong` rgba(247,247,248,0.55) | `dusk` #0e328f | 4.21:1 | fail | pass | a field's edge and a quiet button's edge on dusk (a mark: 3:1) |
| `line-strong` rgba(247,247,248,0.55) | `dusk-deep` #082478 | 4.78:1 | pass | pass | a quiet button's edge on deep dusk (a mark: 3:1) |
| `line-strong-on-light` rgba(10,22,57,0.55) | `primary` #f8c618 | 3.58:1 | fail | pass | an edge on saffron (a mark: 3:1) |
| `line-strong-on-light` rgba(10,22,57,0.55) | `limewash` #f7f7f8 | 3.93:1 | fail | pass | a field's edge on limewash (a mark: 3:1) |
| `limewash` at 0.5, rgba(247,247,248,0.5) | `dusk` #0e328f | 3.77:1 | fail | pass | the tagline's muted words, large text (3:1) |
| `ground-lepalatier-ink` #f3e9d8 | `ground-lepalatier` #4a1626 | 12.17:1 | pass | pass | LePalatier: ivory on bordeaux, its sign |
| `ground-lakrem-ink` #a61e3c | `ground-lakrem` #fcefd9 | 6.43:1 | pass | pass | Lakrem (sample): cherry on cream |
| `ground-souffle-ink` #2e3b33 | `ground-souffle` #dce2d6 | 8.88:1 | pass | pass | Souffle (sample): deep sage on pale sage |
| `ground-bouke-ink` #f4cfc9 | `ground-bouke` #1f3a2d | 8.59:1 | pass | pass | Bouké (sample): blush on forest |
| `ground-larout-ink` #f7e9cc | `ground-larout` #0e5f6b | 6.09:1 | pass | pass | Larout (sample): sand on lagoon |
| `ground-kazprop-ink` #1b46c2 | `ground-kazprop` #ddeafb | 6.37:1 | pass | pass | Kazprop (sample): cobalt on sky |

Every pair passes for its role. The four rows that fail the body column are marks or large text,
held to 3:1. A reversed sign plate swaps a listing's board and lettering, and the formula gives the
same ratio either way round. Some rows measure a state that is written and has no instance yet:
the action on limewash and on the saffron section, and a disabled field on limewash. The chosen
chip's row reads as its words on its own fill: the form sits on dusk, so a chosen chip is limewash
with dusk words.

Measured for this record on 17 November 2026 with `node scripts/contrast.mjs`, outside the pairs
list, in three groups.

**The first words on the painted sky.** "Live" means sampled from the production build of 12:54
UTC with motion on and the words hidden, as the lightest 8px block behind each line of the words
themselves.

| Text or mark | On | Ratio | Body text (4.5) | Large text, marks (3) | Where |
|---|---|---|---|---|---|
| `limewash` #f7f7f8 | #0c3cb1 | 8.53:1 | pass | pass | live, 1440 by 900: the lightest sky behind the headline |
| `limewash` #f7f7f8 | #1b47be | 7.28:1 | pass | pass | live, 1440 by 900: behind the lede |
| `limewash` #f7f7f8 | #274fc8 | 6.45:1 | pass | pass | live, 1440 by 900: behind "How it works" |
| `limewash` #f7f7f8 | #0e3fb7 | 8.12:1 | pass | pass | live, 1920 by 1080: behind the headline |
| `limewash` #f7f7f8 | #1c48be | 7.21:1 | pass | pass | live, 1920 by 1080: behind the lede |
| `limewash` #f7f7f8 | #254ec8 | 6.53:1 | pass | pass | live, 1920 by 1080: behind "How it works" |
| `limewash` #f7f7f8 | #0f3db2 | 8.41:1 | pass | pass | live, 1536 by 864: behind the headline |
| `limewash` #f7f7f8 | #2249c0 | 7.05:1 | pass | pass | live, 1536 by 864: behind the lede |
| `limewash` #f7f7f8 | #2f51ca | 6.22:1 | pass | pass | live, 1536 by 864: behind "How it works" |
| `limewash` #f7f7f8 | #1642b9 | 7.80:1 | pass | pass | live, 1366 by 768: behind the headline |
| `limewash` #f7f7f8 | #304fc7 | 6.39:1 | pass | pass | live, 1366 by 768: behind the lede; the second route has stepped aside |
| `limewash` #f7f7f8 | #1241b7 | 7.95:1 | pass | pass | live, 1280 by 720: behind the headline |
| `limewash` #f7f7f8 | #2c4ec4 | 6.55:1 | pass | pass | live, 1280 by 720: behind the lede; the second route has stepped aside |
| `limewash` #f7f7f8 | #0738ad | 9.00:1 | pass | pass | live, 1024 by 768: behind the headline |
| `limewash` #f7f7f8 | #1341b6 | 7.97:1 | pass | pass | live, 1024 by 768: behind the lede |
| `limewash` #f7f7f8 | #2a4fc9 | 6.40:1 | pass | pass | live, 1024 by 768: behind "How it works" |
| `limewash` #f7f7f8 | #294cc4 | 6.70:1 | pass | pass | live, 2560 by 1080: behind the headline |
| `limewash` #f7f7f8 | #3e56cb | 5.77:1 | pass | pass | live, 2560 by 1080: behind the lede, the lowest of the eleven sizes; the second route has stepped aside |
| `limewash` #f7f7f8 | #012993 | 11.27:1 | pass | pass | live, 768 by 1024 and 390 by 844: behind every line, on the stage's own ground; at 375 by 667 and 360 by 640, behind the headline and the lede |
| `limewash` #f7f7f8 | #0a3aae | 8.79:1 | pass | pass | live, 375 by 667: behind "How it works" |
| `limewash` #f7f7f8 | #0d3eb6 | 8.23:1 | pass | pass | live, 360 by 640: behind "How it works" |
| `primary` #f8c618 | #3050ca | 4.18:1 | fail | pass | live, 1440 by 900: the focus ring round "How it works" |
| `primary` #f8c618 | #2950cb | 4.21:1 | fail | pass | live, 1920 by 1080: the same ring |
| `primary` #f8c618 | #3554cc | 3.97:1 | fail | pass | live, 1536 by 864: the same ring |
| `primary` #f8c618 | #3553cb | 4.02:1 | fail | pass | live, 1024 by 768: the same ring |
| `primary` #f8c618 | #012993 | 7.51:1 | pass | pass | live, 390 by 844: the same ring, on the stage's own ground |
| `primary` #f8c618 | #103fb7 | 5.41:1 | pass | pass | live, 375 by 667: the same ring |
| `primary` #f8c618 | #a78f9d | 1.85:1 | fail | fail | live, 360 by 640: the same ring where its lower right corner crosses a roof's fretwork |
| `coral` #f14949 | #0c3cb1 | 2.52:1 | fail | fail | live, 1440 by 900: the shade under the headline at the sky's lightest. A shade, not words |
| `coral` #f14949 | #012993 | 3.32:1 | fail | pass | live, 390 by 844: the shade under the headline |
| `limewash` #f7f7f8 | #4759cc | 5.49:1 | pass | pass | the street plate's master: the lightest 16px block of sky above the floor |
| `limewash` #f7f7f8 | #f38a90 | 2.21:1 | fail | fail | the same master, below the floor: the far street lamp's own glow. No word is set there |

**Paint under lettering.** Sampled on the masters in `assets/plates`, inside the box the code sets
each thing in, in blocks of 6 to 16px. "Median" is the median block. The second row for a board is
the block that gives the lowest ratio: where a lamp's pool falls on a dark board, or where a light
board is darkest.

| Text or mark | On | Ratio | Body text (4.5) | Large text, marks (3) | Where |
|---|---|---|---|---|---|
| `ground-lepalatier-ink` #f3e9d8 | #89141a | 8.01:1 | pass | pass | the terrace and LePalatier's crop: its board, median |
| `ground-lepalatier-ink` #f3e9d8 | #d2310f | 4.17:1 | fail | pass | the same board, lit |
| `ground-lakrem-ink` #a61e3c | #f6c082 | 4.44:1 | fail | pass | the terrace: Lakrem's board, median |
| `ground-lakrem-ink` #a61e3c | #eab479 | 3.93:1 | fail | pass | the same board at its darkest |
| `ground-souffle-ink` #2e3b33 | #bbbc71 | 5.89:1 | pass | pass | the terrace: Souffle's board, median |
| `ground-souffle-ink` #2e3b33 | #a5b170 | 5.09:1 | pass | pass | the same board at its darkest |
| `ground-bouke-ink` #f4cfc9 | #586025 | 4.69:1 | pass | pass | the terrace: Bouké's board, median |
| `ground-bouke-ink` #f4cfc9 | #a4871b | 2.41:1 | fail | fail | the same board, lit |
| `ground-larout-ink` #f7e9cc | #10776a | 4.51:1 | pass | pass | the terrace: Larout's board, median |
| `ground-larout-ink` #f7e9cc | #5e9964 | 2.81:1 | fail | fail | the same board, lit |
| `ground-kazprop-ink` #1b46c2 | #bacad1 | 4.61:1 | pass | pass | the terrace: Kazprop's board, median |
| `ground-kazprop-ink` #1b46c2 | #9cbbcf | 3.85:1 | fail | pass | the same board at its darkest |
| `ground-lepalatier-ink` #f3e9d8 | #9c0f20 | 6.97:1 | pass | pass | the street plate: LePalatier's board, median |
| `ground-lepalatier-ink` #f3e9d8 | #e53921 | 3.53:1 | fail | pass | the same board, lit |
| `ground-lakrem-ink` #a61e3c | #fecd7f | 4.96:1 | pass | pass | the street plate: Lakrem's board, median |
| `ground-lakrem-ink` #a61e3c | #f4b878 | 4.16:1 | fail | pass | the same board at its darkest |
| `ground-souffle-ink` #2e3b33 | #b2cd86 | 6.68:1 | pass | pass | the street plate: Souffle's board, median |
| `ground-souffle-ink` #2e3b33 | #8eb680 | 5.11:1 | pass | pass | the same board at its darkest |
| `ground-bouke-ink` #f4cfc9 | #0e4830 | 7.35:1 | pass | pass | the street plate: Bouké's board, median |
| `ground-bouke-ink` #f4cfc9 | #385928 | 5.56:1 | pass | pass | the same board, lit |
| `ground-larout-ink` #f7e9cc | #015a72 | 6.45:1 | pass | pass | the street plate: Larout's board, median |
| `ground-larout-ink` #f7e9cc | #047274 | 4.77:1 | pass | pass | the same board, lit |
| `ground-kazprop-ink` #1b46c2 | #84c5eb | 4.13:1 | fail | pass | the street plate: Kazprop's board, median |
| `ground-kazprop-ink` #1b46c2 | #6dbbeb | 3.68:1 | fail | pass | the same board at its darkest |
| `ground-lepalatier-ink` #f3e9d8 | #54041e | 12.35:1 | pass | pass | LePalatier's own plate: its board, median |
| `ground-lepalatier-ink` #f3e9d8 | #9b131c | 6.97:1 | pass | pass | the same board, lit |
| `limewash` #f7f7f8 | #011d9f | 11.69:1 | pass | pass | LePalatier's own plate: the town on its painted plaque, median |
| `limewash` #f7f7f8 | #01279c | 11.07:1 | pass | pass | the street plate: the town on the nearest shop's painted plaque, median |
| `ground-lepalatier-ink` #f3e9d8 | #8a0c1e | 8.11:1 | pass | pass | the counter plate: the lettering and "Business strategy" on the cover, median |
| `ground-lepalatier-ink` #f3e9d8 | #991421 | 7.04:1 | pass | pass | the same cover at its lightest |
| `limewash` #f7f7f8 | #01197b | 13.75:1 | pass | pass | the terrace and a shop's crop: a number on its small painted plaque, median (the six plaques measure #011679 to #011a7d) |
| `limewash` #f7f7f8 | #032a98 | 10.96:1 | pass | pass | the street plate: a number on a sample's small plaque, the lightest of the five medians |
| `ground-lepalatier-ink` #f3e9d8 | #71071d | 9.97:1 | pass | pass | LePalatier's own plate: its lettering on the painted screen, median |
| `ink` #0a1639 | `limewash` #f7f7f8 | 16.52:1 | pass | pass | a sample's tag: its word on its own white |

**The interface's own states.**

| Text or mark | On | Ratio | Body text (4.5) | Large text, marks (3) | Where |
|---|---|---|---|---|---|
| `line-strong` rgba(247,247,248,0.55) | `dusk-deep` #082478 | 4.78:1 | pass | pass | a resting stop mark on its strip |
| `limewash` #f7f7f8 | `dusk-deep` #082478 | 12.78:1 | pass | pass | a stop mark pointed at, on its strip |
| `primary` #f8c618 | `dusk-deep` #082478 | 8.52:1 | pass | pass | the current stop's mark on its strip |
| `primary` #f8c618 | `enamel` #0b2b8e | 7.47:1 | pass | pass | the focus ring on the walk's card |
| `coral` #f14949 | `dusk` #0e328f | 3.09:1 | fail | pass | the shade under the tagline, on dusk |
| `enamel` #0b2b8e | `dusk` #0e328f | 1.06:1 | fail | fail | a plaque's plate against the page: told by its limewash rim (10.48:1) |
| `limewash` #f7f7f8 | #25469a | 8.10:1 | pass | pass | a quiet button hovered on dusk: its 10% wash under its words |
| `limewash` #f7f7f8 | #203985 | 9.87:1 | pass | pass | a quiet button hovered on deep dusk |
| `limewash` at 0.75 | `dusk` #0e328f | 6.57:1 | pass | pass | a link while pressed (0.75 of its ink), on dusk |
| `haze` at 0.75 | `dusk` #0e328f | 4.15:1 | fail | pass | the back link while pressed, 14px: under 4.5:1 for as long as it is held |
| `haze` at 0.75 | `dusk-deep` #082478 | 4.84:1 | pass | pass | the credit while pressed |
| `ink` at 0.75 | `limewash` #f7f7f8 | 7.70:1 | pass | pass | the next business's name while pressed |

**Gaps (recorded, not rules):**

- The first words have no ground of their own: they stand on the painted sky. They are shaped to
  the roofline and their sentences are held above a floor at 0.55 of the street plate's height,
  where `src/data/plates.ts` records white at 4.61:1 or better above and as little as 3.09:1 on
  the pink below. Live, they pass at the eleven sizes sampled, from 360 by 640 to 2560 by 1080;
  the lowest is 5.77:1, behind the lede at 2560 by 1080. Sizes between the eleven were not sampled.
- The focus ring round "How it works" stands on the sky: 3.97:1 to 4.21:1 on the four desks
  sampled, and 1.85:1 at one corner at 360 by 640, where the link sits just above a roof.
- A listing's lettering on its painted board does not hold the flat pair in the table above: a
  lamp's pool lies across the board. On the terrace Bouké's lettering falls to 2.41:1 and Larout's
  to 2.81:1 where the board is lit, and Lakrem's median is 4.44:1; on the street plate Kazprop's
  median is 4.13:1. A wordmark is a logotype, which WCAG holds to no ratio, and every name is in
  text beside its shop; the paint was not corrected for it.
- `line`, `line-on-saffron` and `line-on-limewash` divide rows and edge a paint, so they are held
  to no ratio (1.69:1, 1.57:1 and 1.39:1).
- A light paint (Ivory, Cream, Sky) on limewash is told by a hairline at 1.39:1 and by its name and
  its code in words beside it.

## Typography

**Display and Label:** Barlow Condensed (S3, S4; SIL Open Font License 1.1; three cuts served from
`src/fonts` through next/font) · **Body:** Geist (S5; SIL Open Font License 1.1; the `geist`
package, 1.9.2, through next/font)

**Character:** Condensed capitals that read as lettering painted on a board, over a plain sans that
stays out of the way of six brands' own lettering.

### Hierarchy

Sizes are steps of Tailwind's type scale. A fluid style runs between two steps, from a 390px screen
to a 1440px one, and takes the line height of the step it ends on. The words in the markup are
sentence case; every capital below is `text-transform`, so a screen reader, a search engine and a
translator read ordinary words. The smallest size set is 14px.

| Token | Face | Weight | Size (fluid) | Line height | Tracking | Case, features | Use |
|---|---|---|---|---|---|---|---|
| `heading-1` | Barlow Condensed | 700 italic | clamp(var(--text-5xl), 1.8857rem + 4.5714vw, var(--text-8xl)): 48 to 96px | 1 | 0.005em | capitals; a hard coral shade, 0.058em across and 0.064em down | The home page's headline, and nothing else. From 900px wide its first screen sets it wider (below) |
| `heading-2` | Barlow Condensed | 700 | clamp(var(--text-4xl), 1.6929rem + 2.2857vw, var(--text-6xl)): 36 to 60px | 1 | 0.005em | capitals | Every other page's first heading; section headings; the tagline, with `sign-shade`; the closing band; a step's number; a real price at the head of its listing, with tabular figures |
| `heading-3` | Barlow Condensed | 700 | clamp(var(--text-3xl), 1.7357rem + 0.5714vw, var(--text-4xl)): 30 to 36px | 40/36 (1.11) | 0.01em | capitals | The heading on a walk card; the phone menu's links; "What comes with it" and "What you bring"; the sent panel's heading |
| `heading-5` | Barlow Condensed | 700 | `text-2xl`, 24px | 32/24 (1.33) | 0.015em | capitals; lower case with no tracking in the mark | A business's name under its shopfront; a step's title; "Reach us directly"; a heading on the privacy page; the next business; the name in the mark |
| `title-1` | Geist | 500 | `text-xl`, 20px | 28/20 (1.4) | 0 | none | The lede under a page's heading, the home page's among them (set larger there from 900px, below); a question |
| `title-2` | Geist | 400 | `text-lg`, 18px | 28/18 (1.56) | 0 | none | A section's lede; a listing's line, its name's note and its idea; the closing band's line |
| `title-3` | Geist | 500 | `text-base`, 16px | 24/16 (1.5) | 0 | none | Header links; field labels; a paint's name |
| `title-4` | Barlow Condensed | 600 | `text-xl`, 20px | 28/20 (1.4) | 0.02em | capitals; tabular lining figures | A real listing's price under its shopfront |
| `body-1` | Geist | 600 | `text-base`, 16px | 24/16 (1.5) | 0 | none | The first line of the failed message |
| `body-3` | Geist | 400 | `text-base`, 16px | 24/16 (1.5) | 0 | none | Running text; a walk card's line; list rows; chips; footer links |
| `body-4` | Geist | 600 | `text-sm`, 14px | 20/14 (1.43) | 0 | none | The agency's name in the credit |
| `body-6` | Geist | 400 | `text-sm`, 14px | 20/14 (1.43) | 0 | none | The sample note |
| `button-md` | Geist | 600 | `text-base`, 16px | 24/16 (1.5) | 0 | sentence case | Buttons and arrow links: only what can be pressed |
| `button-sm` | Geist | 600 | `text-sm`, 14px | 20/14 (1.43) | 0 | sentence case | The header's Enquire and, on a phone, its WhatsApp; the skip link; the walk's cue |
| `caption-1` | Geist | 500 | `text-sm`, 14px | 20/14 (1.43) | 0 | none | A field's error; the line that says samples are placeholders; "The price does not cover these" |
| `caption-2` | Geist | 400 | `text-sm`, 14px | 20/14 (1.43) | 0 | tabular figures on a sample's price; capitals by a utility on a paint's code | A sector and a town under a name; a sample's price; hints; hours; small print; "(optional)"; the back link; a paint's code |
| `caption-4` | Barlow Condensed | 600 | `text-sm`, 14px | 20/14 (1.43) | 0.08em | capitals; tabular lining figures | What is written on a plaque: a number, a status, a town, a stop's name |

`sign-shade` is not a text style. It adds the sign painter's hard shade (`text-shadow: 0.05em
0.055em 0 var(--color-shade)`) to a style, and the tagline is its one use.

**The first words on a wide screen.** From 900px wide, two rules written outside the layers set
the home page's headline and lede to the approved mock-up's measure (S1: the headline 7.4% of the
screen's width, set tight, and the lede 1.6%). They are `heading-1` and `title-1` with a size and a
line height of their own, and they are the one place a named style is overridden. The frontmatter
holds them as `heading-1-wide` and `title-1-wide`.

| Style, as set there | Size | Line height | Otherwise |
|---|---|---|---|
| `heading-1` inside `.walk-words-first` | clamp(var(--text-5xl), min(7.4vw, 16svh), var(--text-9xl)) times `--fit`: 48 to 128px before the fit | 0.9 | As `heading-1`: 700 italic, capitals, 0.005em, the coral shade. It wraps freely (`text-wrap: wrap`) beside the shaped float, with one break set in the markup |
| `title-1` inside `.walk-words-first` | clamp(var(--text-lg), 1.6vw, var(--text-2xl)): 18 to 24px | 1.4 | As `title-1`: Geist 500. At most 576px wide (`max-w-xl`) |

`--fit` is the stage's word: 1, 0.92, 0.84, 0.76, 0.68, 0.6 or 0.52 (Responsive Behavior). Live,
with motion on, the headline measured 106.6px at 1440 by 900, 128px at 1920 by 1080, 86.4px at 1536
by 864, 93px at 1366 by 768, 79.6px at 1280 by 720, 75.8px at 1024 by 768 and 97.3px at 2560 by
1080. Under 900px it is `heading-1` as written: 48px at 390 and 65.3px at 768.

**Lettering on a plate.** Three more settings of the sign face exist only on the paintings. Each is
Barlow Condensed 600 in capitals with a line height of 1. Each is sized from the picture it lies
on, in the plate's own pixels on the stage and in container units on a page, so it grows and
shrinks with the painting and has no size of its own. None is one of the seventeen named styles.

| Lettering | Class | Tracking | Colour | Size on its plate | As measured live |
|---|---|---|---|---|---|
| "Sample" on a shutter | `plate-tag` | 0.04em | `ink` on `limewash`, corners of 0.14em | 96px on a tag 370 by 136 on the street plate, set in the board's own foreshortened plane; 50px on a tag 192 by 70 on a shop's column of the terrace and on its crop | On the first screen the five tags' boxes stand 28.7, 26.4, 17.5, 18 and 15.9px tall at 1440 by 900, and 12.6 to 7px at 390 by 844. On the terrace under the walk the word is 16.7px at 1440 and 19.5px at 390; in the catalogue 35.2px at 1440 and 14.5px at 390; on a sample's own page 28.5px |
| A town or a number on a painted plaque | `plate-plaque` | 0.06em | `limewash` on the painted enamel | The town: 92px on a wall 400 by 170 on the street plate, 86px on the shop's own plate. A number: 25px on the terrace and on a crop; on the street plate, 0.78 of half its plaque's width | The town's box is 35.3px tall on the first screen at 1440 by 900 and 15.5px at 390 by 844; at the head of LePalatier's page the word is 17px at 1440 and 10.2px at 390. A number is 8.3px on the terrace at 1440 and 9.8px at 390, 17.6px in the catalogue at 1440 and 7.3px at 390, and 14.3px on a sample's own page; on the first screen its box is 7 to 11.5px tall at 1440 and 3.1 to 5px at 390 |
| "Business strategy" on the document's cover | `plate-cover` | 0.08em | the listing's `ink` | 52px on a cover 600 by 560 | Not measured live |

Each listing's wordmark is artwork, not interface type: vector outlines drawn by
`scripts/make-wordmarks.mjs` from an open-licence face (S7), so the site loads no typeface for it.
The same outline is set on every painted board (the street plate, the terrace, a shop's crop,
LePalatier's own plate), on the screen in its room, on the document's cover, on the sign plates
and on the drawn stand-in.

| Listing | Lettering as drawn | Face (SIL OFL 1.1) | Tracking |
|---|---|---|---|
| LePalatier | LePalatier | Cormorant Garamond Medium | 0.01em |
| Lakrem | lakrem | Fredoka SemiBold | 0 |
| Souffle | SOUFFLE | Jost Light | 0.32em |
| Bouké | Bouké | Playfair Display Medium Italic | 0 |
| Larout | LAROUT | Barlow Condensed Bold | 0.05em |
| Kazprop | kazprop | Outfit SemiBold | -0.01em |

### Named Rules

**The Painted Sign Rule.** Barlow Condensed speaks what is painted on a sign: a heading, a plaque,
a price, the mark's name. Every sentence is Geist, so the condensed capitals keep their one
meaning.

**The One Slant Rule.** The slant belongs to `heading-1`, once, on the home page's first screen;
the coral shade belongs to that headline and to the tagline. It is the brand's one italic device,
set in a face with a true italic, and coral is never words (3.09:1 on dusk).

**The Named Style Rule.** Every piece of text takes one of the seventeen named styles: Geist at
400, 500 or 600, Barlow Condensed at 600 or 700, nothing under 12px. A size or a weight set loose
is a decision nobody recorded.

**If a face is unavailable:** Barlow Condensed falls back to the face next/font generates for it,
the visitor's own Arial with its size adjusted to 80.75% and its ascent and descent overridden,
then to Arial Narrow and the system's sans. Geist falls back to its generated face, Arial adjusted
to 106.28%, then to `ui-sans-serif, system-ui, sans-serif`. Neither is swapped for another named
face without a record here.

## Layout

The shell holds at most 1280px of content (`spacing.shell`, 80rem) inside a fluid gutter,
`clamp(1.5rem, 5vw, 5rem)`: 24px at 390, 72px at 1440, 80px from 1600. Sections are spaced by
`clamp(4rem, 10vw, 8rem)`: 64px on a phone, 128px from 1280. Running text is held to 62ch and a
heading with its lede to 680px (`measure-hero`). The header is 72px tall and stays at the top; a
link to a part of a page lands under it (`scroll-padding-top`). Inside components, spacing takes
only the thirteen steps of the scale in class names: `npm run tokens` reports 0 fail and 1 warn,
the one italic. Three values in `globals.css` sit off those steps (Known Gaps).

- **Story structure:** the home page, in order: the walk, eight stops on the painted street; "On
  the street now", the terrace, on dusk; the four steps on saffron; the tagline on dusk; the
  questions on limewash; the footer on deep dusk. Then the catalogue (a heading on dusk, six
  shopfronts on limewash); a business's page (its plaques, name, price and one action beside its
  shopfront on dusk; its brand on limewash; what it is on dusk; what comes with it beside what the
  buyer brings on saffron; the next business on limewash); How it works (the four steps on saffron,
  the questions on limewash); Enquire (the form beside the direct routes, on dusk); Privacy; and
  the 404, an empty plot. Each page's footer opens with the invitation that fits it.
- **The walk:** the stage is as tall as the screen less the header and never under 576px
  (`max(100svh - 72px, 36rem)`). The first words lie over its first screen, inside the shell, 32px
  from the stage's top. Where script runs the stage pins under the header and each stop is one more
  screen of scroll, with its words in a card 26rem wide: at the foot of the screen under 900px; at
  the left and centred from 900px; at the foot for the room, from 900px, where the whole shop is
  shown; at the top left for the last stop, at every width, whose street runs along the foot. Where
  script does not run each stop is a section: its still above its words, or beside them (`1.3fr
  1fr`) from 900px.
- **The first words:** from 900px a float fills the words' column and carries the painted roofline
  as its shape, 24px clear of it (`shape-margin`), so every line of the headline, the lede and the
  actions ends before the roofs. Under 900px the street stands along the foot of the stage with the
  words above it, and nothing is shaped (Responsive Behavior).
- **Grids:** the terrace is the painting of all six shopfronts, drawn once and at least 1280px
  wide, with a row of six columns over it, each as wide as its shop from party wall to party wall
  (727, 602, 598, 603, 608 and 702 parts); under 640px it is 384vw, about 64vw a shop, and it
  scrolls sideways wherever it is wider than the screen. The catalogue is 2 shopfronts to a row and
  3 from 1024px, each in a frame the shape of the widest crop, 561 by 1175. Two-column sections
  begin at 1024px: a listing's head `1fr 0.9fr`; a listing's brand, its idea and the questions on
  How it works `0.85fr 1.15fr`; the home page's questions `0.8fr 1.2fr`; the home page's "On the
  street now" heading `1.1fr 1fr`; Enquire `1.15fr 0.85fr`; the closing band `1.3fr 1fr`; the
  footer `1.3fr 0.6fr 1fr`; a privacy row `0.5fr 1fr`. The steps are four columns from 768px. A
  heading beside a long list stays in view (`sticky`, 112px from the top) from 1024px.

### Named Rules

**The Street First Rule.** The home page opens on the street: the shopfronts are in the first
screen with the headline, beside it on a desk and under it on a phone, at 1440 by 900 and at 390 by
844. The businesses are the proof, so they come before any claim.

**The Roof Line Rule.** Where one section's ground gives way to another's, a lambrequin in the
colour of the ground above hangs 16px onto the ground below, and no ruled line divides one section
from the next. A change of section then reads as a roof line.

**The Words In The Sky Rule.** The first words stand in the painted sky: every line ends before the
roofline, and every sentence ends above the sky's floor, where white would no longer read. Where
they do not fit, the second route steps aside and then the headline steps down a size; no frame is
moved and no scrim is laid for them. One painting then serves a screen of any shape.

## Elevation & Depth

Depth lives in the paintings: a street drawn in perspective, lamplight on a wall, a lit room behind
a shutter. The stage adds only movement to it, a push into a picture and a dissolve to the next.
The interface over the paintings and below them is flat, and separates by ground (dusk, deep dusk,
saffron, limewash, a listing's board) and by hairline (`line`, `line-strong`). The header stays
above the page as a solid band, the phone menu opens under it on the same solid ground, the walk's
words ride over the pinned stage, and the skip link sits over everything.

### Shadow Vocabulary

No shadow is cast. `box-shadow` appears four times, each time as an inset edge, and `text-shadow`
twice, as lettering:

- **A plaque's rim** (`box-shadow: inset 0 0 0 1px var(--color-plaque), inset 0 0 0 2.5px
  var(--color-on-plaque)`): a 1.5px limewash line set 1px inside the enamel.
- **The walk card's rim** (`box-shadow: inset 0 0 0 4px var(--color-plaque), inset 0 0 0 6px
  var(--color-on-plaque)`): the same rim at the size of a notice, 2px of limewash set 4px in.
- **A field's error edge** (`box-shadow: inset 0 0 0 1px var(--color-ink)`): thickens the edge of an
  invalid field to 2px.
- **The current page's ring** (`box-shadow: inset 0 0 0 2px var(--color-on-action)`): on a pill that
  leads to the page the visitor is already on, such as the header's Enquire on Enquire.
- **The sign painter's shade** (`text-shadow: 0.058em 0.064em 0 var(--color-shade)` on `heading-1`;
  `0.05em 0.055em 0` through `sign-shade`): hard, with no blur. About 6px across and 7px down at
  106px, the headline's size at 1440 by 900.

Three gradients exist, and all three belong to a picture, never to the interface:

- **A lamp's bloom** (`.plate-glow`): `radial-gradient(closest-side, roomlight at 85%,
  transparent)`, screened over the street plate (`mix-blend-mode: screen`) at 0.4, one over each of
  the eight painted lamps.
- **A doorway's lamplight** (`.shopfront-room`): `radial-gradient(120% 85% at 50% 10%, roomlight,
  lamplight 110%)`, behind the shutter of a real business that has no painted room. No instance:
  the one real business has its room painted.
- **The street plate's top edge on a phone** (`.stage-layer-street`, under 900px): a mask that
  runs from clear to solid over the plate's first 7%, so no line shows where the painting ends and
  the stage's own sky begins.

### Named Rules

**The Flat Interface Rule.** The interface casts no shadow, fills with no gradient and blurs
nothing; an inset edge is a line. Depth is said by a change of ground or a hairline, and the only
light on the page is the street's own: paint, a lamp's bloom, a doorway's lamplight.

**The Solid Over The Street Rule.** Whatever sits over a painting on the stage is solid: the header
in `dusk-deep`, the walk's card and a stop's name in `enamel`, the cue and the strip the stop marks
stand on in `dusk-deep`. Its words and marks then never depend on what the stage is showing behind
them. The first words are the one exception: they take the sky, under The Words In The Sky Rule.

## Shapes

Five radii, each a step of Tailwind's radius scale:

- **Full pill** (`rounded.pill`): anything pressed that is a control. Buttons, chips, the skip
  link, the walk's cue, the menu button and the mark's focus shape; the strip the stop marks stand
  on; a stop's mark is the same shape 3px wide.
- **16px** (`rounded.panel`, `rounded-2xl`): the two sign plates, a real business's own plate at
  the head of its page, the panels the form answers with, the empty street's panel, and a stop's
  still where the walk is plain.
- **12px** (`rounded.field`, `rounded-xl`): fields, paints, the sample note and the walk's card.
- **6px** (`rounded.plaque`, `rounded-md`): a plaque.
- **4px** (`rounded.stop-name`, `rounded-sm`): a stop's name over its mark.

Full-width bands are square. No radius is nested by the formula: a control stays a pill wherever it
sits. A sample's tag on a painting has corners of 0.14em, sized with its own lettering.

The painted shopfront comes from one painting, the terrace (S10), whose painted band is 3840 by
1175. On the home page that band is drawn once and each shop is a column of it, from party wall to
party wall (598 to 727 wide), holding only what lies over the paint. By itself a shop is its own
crop of the band, from the inside of its left pier to the edge of the next (561, 534, 529, 534, 540
and 538 wide), shown at one height in a frame the shape of the widest, 561 by 1175, so a row of
cards lines up and a narrower shop ends sooner on the right. Everything set over a shop is placed
in fractions of its picture: its lettering inside its board, 13% in from each side and 22% from the
top and the foot; its number on its small plaque; a sample's tag, 192 by 70 of the painting's
pixels, centred on the shutter 42% of the way down; and, for a real business, a doorway the size of
its shutter that holds its room and a painted shutter over it.

LePalatier's own plate (S9) is square, 2880 by 2880. At the head of its page it fills its column,
at most 576px wide, with 16px corners; on the stage it is drawn in its own pixels and moved whole.

The drawn stand-in (`DrawnShopfront.tsx`) is drawn on a grid of 240 by 250 units. A roof of 8-unit
ribs in `tin` and `tin-shade` under a limewash strip; a wall in the listing's wall colour; a fringe
of scallops 12 units wide, each pierced by a hole in the wall's colour; two pilasters outlined in
limewash at 45%; a sign board 160 by 42 in the listing's board colour, framed in its trim, with its
lettering fitted inside 136 by 22; two lamps in the trim with saffron bulbs; an opening 152 by 108
onto a room in `lamplight-wall` and `lamplight`; a shutter of 7-unit slats in `steel` and
`steel-deep` with a bottom rail and a handle; and a kerb in `pavement`. Its shutter is one group
inside a clipped opening: raised, it moves up by 88% of its own height. It stands for a listing
that has no painting, and no page draws it today.

Drawn small, a shopfront is the mark: on a 24-unit grid, a roof with four scallops and a body in
saffron with a door in deep dusk, 28px wide beside the name. The icon is the same shopfront on a
deep dusk square with 7-unit corners.

The plaque is an inline plate at least 28px tall, 6px corners, 2px by 10px of padding, with its
rim. The lambrequin is one SVG pattern, a tile 24 by 16: a 4px band and a half-round below it,
pierced by a hole 4.5px across. It is the tooth the drawn stand-in wears; the painted roofs wear a
painted fretwork of their own. The 404 draws an empty plot: the dashed outline of a shopfront that
is not there, in `line-strong`, on a kerb.

Icons are one drawn set of eight (arrow, back arrow, phone, chat, mail, plus, tick, alert) on a
24px grid, with 1.5px round strokes in the current colour. Every icon sits beside words and is
hidden from assistive technology. The walk's cue turns the arrow to point down.

### Named Rules

**The Pill Rule.** Anything pressed that is a control is a full pill, at least 48px tall, or 44px
for the small button, a chip and the walk's cue. One shape then always means "press here"; a plaque
has corners and is never pressed.

**The Shopfront Rule.** A business is always shown as its shopfront: painted where a painting
exists and drawn where none does, with its own lettering set on its board, the same on the stage,
on the terrace, in the catalogue and at the head of its page. The shutter rolling is the brand's
one movement.

**The Plaque Rule.** A plaque names what is fixed about a business or about the walk: a number, a
status, a town, a stop. It is enamel with a limewash rim, it carries `caption-4` or the card's own
words, and it is not a button.

## Components

Every state the build has is listed. A state the build lacks is named as missing and repeated under
Known Gaps. A state that is written and has no instance on any page yet is marked "no instance".
Hover and pressed states were read in code; a shutter's were also measured against a production
build, and say so.

### Buttons

`.btn`: an inline row, at least 48px tall, a full pill, padding 8px by 24px, an 8px gap, one line.
The fill, the edge and the words change over 240ms on `ease-out`; the press takes 120ms.

- **Filled** (`btn-filled`, `button-md`): `action` with `on-action`. Hover: `action-hover`. Pressed:
  the same fill, squashed to 0.96. Focus-visible: a 2px outline in `focus`, 3px out. Disabled:
  `paper-subtle` with `ink-subtle`, a not-allowed cursor, no squash. Sending: the label reads
  "Sending" and the button is disabled. On dusk and deep dusk it is saffron with ink. On limewash it
  would be dusk with limewash, and on saffron ink with limewash (both written; no instance).
- **Quiet** (`btn-quiet`, `button-md`): a 1px edge in `line-strong`, words in `ink`, no fill. Hover:
  the edge turns `ink` and the fill takes `ink` at 10%. Pressed: squashed to 0.96. Focus-visible: as
  above. Disabled: the edge in `line`, words in `ink-subtle`, no fill, a not-allowed cursor, no
  squash (no instance). A quiet button that carries a number is full width, with a 20px icon and the
  label at one end and the number, in tabular figures, at the other.
- **Small** (`btn-sm`, `button-sm`): 44px tall, padding 4px by 16px. The header's filled Enquire
  and, on a phone, its quiet WhatsApp with a 16px icon.
- **The current page:** a pill that leads to the page the visitor is on carries `aria-current` and
  an inset 2px ring in `on-action`. It is never marked by colour alone.

One filled button per group; the second path is an arrow link or a quiet button. Labels come from
`ACTIONS` in `src/data/site.ts`, one per intent: "See the businesses", "Ask about this business" on
a business's own page, "Enquire" for the route to the form, "Send a request" on the form's own
button and nowhere else.

### Links

- **Arrow link** (`arrow-link`, `button-md`): words, underlined at 40% of their colour, and a drawn
  16px arrow, at least 48px tall. Hover: the underline comes to full over 240ms and the arrow moves
  4px in 280ms. Focus-visible: the ring. Pressed: none.
- **Plain link** (`link`): the footer's links, the back link, the credit, a name on a shopfront.
  The underline appears over 240ms on hover. Pressed: 0.75 of its ink.
- **A whole thing as a link** (a shop on the terrace, a shop in the catalogue, the next business):
  the name underlines on hover, and an arrow that is a direct child of the link moves 4px. A shop
  also raises its shutter (The shopfront, below).
- **Links in a sentence** (the privacy notice, the routes in the failed message): always
  underlined, 0.22em below the baseline. No hover change.

### Inputs / Fields

- **Field** (`.field`: input, select, textarea): full width, at least 48px tall, a 1px edge in
  `line-strong`, 12px corners, a `paper` fill, words at 16px in `ink`, padding 12px by 16px. Hover:
  the edge turns `ink` over 200ms. Focus-visible: the edge in `ink` and a 2px outline in `focus`,
  2px out. Error (`aria-invalid`): the edge in `ink`, thickened to 2px by an inset edge, with the
  message below in `caption-1`, led by the 16px alert icon and tied to the field. Filled: no change.
  Disabled: the edge in `line`, a `paper-subtle` fill, words in `ink-subtle`, a not-allowed cursor
  (no instance). The label sits above in `title-3`; "(optional)" follows it in `caption-2` and
  `ink-subtle`. The form sits on dusk, so a field is dusk with a limewash edge.
- **Chip** (`.chip`, a radio drawn as a pill): at least 44px tall, a 1px edge in `line-strong`,
  padding 8px by 16px, `body-3`. Hover: the edge turns `ink`. Pressed: squashed to 0.97 in 120ms.
  Chosen: an `ink` fill with words in `paper`, which on dusk is limewash with dusk words.
  Focus-visible: a 2px outline in `focus`, 3px out. Disabled: the edge in `line`, words in
  `ink-subtle`, a not-allowed cursor (no instance). Fill and edge change over 200ms.
- **What the form answers with:** sent is a panel with 16px corners and a 1px edge in `line-strong`,
  a 32px tick, a `heading-3` and the route the reply will take; it takes focus and is a status.
  Failed is a panel with 16px corners and a 1px edge in `ink`, the 20px alert icon, a `body-1` line
  and the phone and email as links; it takes focus and is an alert.
- **What the form offers:** only a real business still on the street, then "A business for my own
  idea" and "Not sure yet". A sample is never offered, by the form or by the endpoint: both read
  `TOPICS` in `src/lib/enquiry.ts`.
- **Without script** the form shows a notice (`body-3` in a 16px panel with an ink edge) giving the
  phone, WhatsApp and email.

### Navigation

- **Skip link:** first in the tab order. A saffron pill with ink words, `button-sm`, padding 12px
  by 24px, 16px from the top left. It slides into view over 240ms when it takes focus; its outline
  is limewash, 10.48:1 on the dusk around it.
- **Header:** 72px, solid deep dusk, at the top of every page. The mark links home in a 44px
  shape. From 768px: the pages in `title-3`, 32px apart, each link the header's full height, then
  the small filled Enquire. Pointing at a page draws a 2px saffron line under its name from the
  left in 300ms; the current page keeps the line and carries `aria-current`.
- **Phone header** (under 768px): the mark, then a small quiet WhatsApp button and the menu button,
  8px apart, so the quickest route is one tap from any page.
- **Phone menu:** a 44px round button whose two 2px strokes turn into the close mark in 300ms. It
  opens a sheet under the header, on solid deep dusk, as a dialog: Home, the pages and Enquire in
  `heading-3`, each at least 64px tall and divided by `line`, the current one marked with an 8px
  saffron dot; then Call us and WhatsApp as full-width quiet buttons. The page behind is inert and
  does not scroll. Escape or the button closes it and returns focus to the button.
- **Footer** (deep dusk): a lambrequin in the colour of the ground the page ends on, the closing
  band, a hairline, then the mark with
  the site's line, the pages, and every route to reach us, each with a 20px icon and the number
  written out; a hairline; the legal line, which ends by saying that the shopfronts are
  illustrations and that a business comes without premises, and the credit, both in `caption-2`:
  "A Digital Experience by Khay Digital", with the agency's name in `body-4`.
- **The closing band:** the invitation at the head of the footer, a `heading-2` and a `title-2` line
  beside its actions, chosen by the page just read so it never points at the page it is on. A real,
  available business: "LePalatier will have one owner" with its price, a filled "Ask about this
  business" and a quiet WhatsApp. The catalogue: "Seen a shop that could be yours" and a filled
  Enquire. Enquire and the 404: no band. Every other page, a sample's included: "Find the one that
  is yours", a filled "See the businesses" and an arrow link to Enquire.
- **The next business:** at the foot of a listing, on limewash, a link at least 96px tall: "Next on
  the street" in `caption-2` and `ink-subtle`, the name in `heading-5`, a 24px arrow.
- **The 404:** the empty plot, a `heading-2` ("No shop at this address"), a lede and one filled
  button back to the businesses. The footer has no band here.

### The shopfront (signature)

A business as it stands on the street (`Shopfront.tsx`): a painting, with what is true set over it
(Shapes). The name is real text beside it, so the picture is hidden from assistive technology; at
the head of a listing, where it stands alone, it is an image named "Lakrem's shopfront", or, for
the business with a plate of its own, "LePalatier's shopfront, its shutter up and its room lit".

It takes one of four forms:

- **A column of the terrace** (the home page): no picture of its own, only what lies over the one
  painting behind the row.
- **By itself** (a card in the catalogue, the head of a sample's page): its own crop, in its frame.
- **On its own plate** (the head of LePalatier's page): the square plate with its room lit, its
  lettering on the board and on the screen on the back wall, and its first town on the plaque. The
  certificate's paper is left as painted, blank. Nothing on it moves.
- **Drawn** (`DrawnShopfront.tsx`): the stand-in for a listing that is not among the six painted.
  No instance.

A real business's states:

- **Rest:** the shutter is down: a painted shutter laid over its doorway.
- **Hover and focus-visible** on the link around it: the shutter rolls up by 88% over 900ms on
  `ease-roll`, onto its painted room, and the name underlines.
- **Pressed:** the whole shopfront scales to 0.985 over 160ms.
- **Arriving** (in the catalogue, where motion is welcome): the shop waits with its shutter up and
  rolls it down as it comes into view.
- **Open** (`data-open`): the shutter stays up. No instance: the one real business opens onto its
  own plate instead.

A sample has no shutter to raise. It stays shut, with "Sample" on a white tag across its slats;
pointing at it underlines its name, and pressing it scales it as any shop.

Counted on the build of 12:54 UTC: one moving shutter and five tags on the terrace, the same in
the catalogue, and none on a sample's own page. A real shutter's hover and focus were measured on
the build of 12:15 UTC (88% up on the terrace and in the catalogue) and read in code after that;
`npm run behaviour` asserts them.

### The terrace and the shop card (signature)

- **The terrace** (`Terrace.tsx`, the home page): the painting of all six shopfronts, whole, on the
  page's dusk, with a row of six columns over it. Each column is one link: over the paint, the
  listing's lettering, its number and its tag; under it, 12px in and 16px below, its plaques ("No.
  01", then its status or "Sample"), its name in `heading-5`, its sector and its towns in
  `caption-2` and `ink-subtle`, and its price. Under 640px the terrace is 384vw wide, scrolls
  sideways and snaps to a shop's edge; its scrollbar is thin and saffron. A listing that is not
  among the six painted has no column, and a painted shop whose business is not for sale stands in
  the picture with its board blank (neither has an instance).
- **The shop card** (`ShopCard.tsx`, the catalogue): the shop by itself in its frame, then the same
  facts, as a card in a grid on limewash, each revealed as it arrives.
- **Price:** a real listing's is `title-4`. A sample's is `caption-2` in `ink-subtle` with tabular
  figures and the words "a placeholder", so it never reads as an offer; the figure and the note are
  each kept whole when the line breaks.
- **Empty:** when no painted business is for sale, a panel with 16px corners and a 1px edge in
  `line-strong`: "Every business on the street has been sold", a line, and a filled Enquire (no
  instance).

### The plaque (signature)

`.plaque` with `caption-4`: `plaque` and `on-plaque`, 6px corners, its rim, at least 28px tall.
Under a shopfront: the number, then the status (Available, Reserved or Sold) or "Sample". At the
head of a listing: the number, the status or "Sample", then one plaque for each town. On a painting
the plaque is paint and only its words are set: the nearest shop's large plaque, on the street
plate and on its own plate, carries its first town; each small plaque, on a sample's pier on the
street plate and on every shop of the terrace and its crop, carries the listing's number, as a
house's number is. A plaque cannot be pressed.

### The walk (signature)

- **The first screen:** the painted street behind the headline (`heading-1`), the lede (`title-1`),
  a filled "See the businesses" and an arrow link to How it works, which sits 24px after the button
  or, where the line breaks, under it. Where the stage is live a cue sits 40px from the foot, at
  the gutter: "Walk the street" with the arrow turned down, a deep dusk pill 44px tall in
  `button-sm`, which turns enamel on hover and leads to the second stop. It shows only from 1200px
  wide, where the foot of the first screen is open road.
- **The stage** (`components/stage/PaintedStage.tsx`): as prerendered, a still of its first view
  with a description. Where script runs, four plates lie in it as layers, each placed by one 2D
  transform and an opacity; the first fades in over the still once it has decoded, and the still
  goes when that fade ends. Its ground is the street plate's own sky.
- **The plates:** the street (the listings' lettering carried onto six angled boards, the
  nearest shop's town on its plaque, a number on each sample's plaque, "Sample" on five shutters,
  and a bloom over each of eight lamps); LePalatier's own (its lettering on the board and on the
  screen, its town on the plaque, and the shutter that rolls up over the room); the counter (the
  lettering, a rule in its trim and "Business strategy" carried onto the document's cover); and the
  certificate, which is left as painted, blank.
- **The card** (live): a plaque at the size of a notice. Enamel, 12px corners, its rim, 28px of
  padding, at most 26rem wide: the stop's heading in `heading-3` and its line in `body-3`, both in
  `on-plaque`; the last card adds a filled "See the businesses". Where the walk is plain the card
  has no ground, rim or padding and its words take the page's ink.
- **The stops** (live, from 900px): a row of eight links on its own strip of deep dusk, a pill 44px
  tall with 12px of padding at each end, at the foot of the stage, 20px up and one gutter in from
  the right, where nothing lettered is painted. Each link is 28px wide and 44px tall. A resting
  mark is 3px by 12px in `line-strong`; pointed at, it grows to 18px in `ink`; pointed at or
  focused, its stop's name shows on a small plaque (4px corners, `caption-4`) 8px above the strip;
  the current stop's mark is 24px in `action`. Marks change over 320ms, names over 200ms. Each link
  is named for its stop ("The sign, stop 2 of 8") and carries `aria-current`.
- **The still** (plain): each stop's capture of the stage, 4 by 3 on a phone and 16 by 10 from
  900px, with 16px corners and no words of its own.

### The steps

An ordered list of four. Each step is its number in `heading-2`, hidden from assistive technology,
its title in `heading-5` (read as "Step 1: Choose"), and a line in `body-3` and `ink-subtle`. From
768px the four stand in a row, 32px apart, under one line in `line-strong`; below that they run
down the page with no line. On both pages they stand on saffron.

### Rows

- **What comes with it, What you bring** (a listing, on saffron): a `heading-3` over a line in
  `line-strong`, then rows of `body-3`, 12px above and below, divided by `line`. The first list is
  the six things, read from the same data as the walk.
- **A listing's brand** (limewash): its two sign plates side by side from 640px, 16 by 9 with 16px
  corners, the second with board and lettering swapped; then four paints, 4 by 3 with 12px corners
  and a hairline edge, each with its name in `title-3` and its code in `caption-2`: the board, the
  lettering, the trim and "The wall". Beside them, two rows: the lettering's face and the colours'
  names.
- **Questions:** native `details`, on limewash, the first one open. The question is `title-1`, at
  least 64px tall, with a 24px plus that turns 45 degrees in 320ms when open; the answer is `body-3`
  in `ink-subtle`. Hover: the question's words take `action` over 200ms, which on limewash is dusk.
- **Privacy:** rows of a `heading-5` beside `body-3`, opened by `line-strong` and divided by `line`.

### The tagline

"The sign is painted / The shutter is yours to raise", centred on dusk in `heading-2` with
`sign-shade`, each line a block. Its words light from 0.5 of the ink to full ink as the line crosses
the screen (Motion).

### The sample note

"This is a sample listing..." in `body-6`, in a box with 12px corners and a 1px edge in
`line-strong`, at the head of a sample's own page, beside a "Sample" plaque. It cannot be pressed.

### The link preview card

One card for every page, 1200 by 630: a capture of the home page's first screen, words and all,
made by `scripts/stills.mjs` and saved to `public/og.png` with a record of where it came from.

### Named Rules

**The One Filled Rule.** A group of actions has one filled button; the rest are quiet buttons or
arrow links. A visitor is shown one thing to do at a time.

**The Words Not Colour Rule.** A status, a sample, an error and the current page are said in words
or drawn as a mark, with an icon where one helps, and the palette has no error colour. The hardest
visitor is on a phone in bright light.

**The Sample Rule.** A sample says so wherever it stands: a tag on its shutter in every painting, a
plaque beside its name, "a placeholder" at its price, a note on its page; the form never offers it.
A sample must never pass for an offer.

**The Shut Sample Rule.** A sample's shutter never moves: it has no shutter to raise, on hover, on
focus or on its own page, and only a real business opens. What cannot be bought is not shown open.

## Motion

**Principle:** things roll and switch on. A shutter rolls, a heading comes up the way a shutter
does, a lamp comes on, a sign's line lights; the walk pushes into a painting and gives way to the
next. Content is visible by default; motion only enhances. Script adds `can-animate` to the page
only when motion is welcome, and only then does anything start hidden or muted.

| Token | Value | Use |
|---|---|---|
| `ease-out` | cubic-bezier(0.16, 1, 0.3, 1) | Entrances and state changes |
| `ease-roll` | cubic-bezier(0.3, 0, 0.1, 1) | A shutter on a shopfront, and a heading rising out of its mask: it starts heavy and settles |
| `dur-press` | 120ms | A button squashing to 0.96; a chip to 0.97 |
| `dur-press-shop` | 160ms | A shopfront scaling to 0.985 |
| `dur-state` | 200 to 320ms | Field, chip, a question's colour, a stop's name, the cue 200; button fill and edge, link and arrow link underlines, skip link 240; arrow 280; the current page's line, the menu button 300; the plus, a stop's mark 320 |
| `dur-menu` | 200ms each, 50ms apart | The phone menu's links |
| `dur-word` | 500ms | One word of the tagline |
| `dur-stage` | 700ms | The plates fading in over their still |
| `dur-reveal` | 800ms opacity, 900ms transform | A reveal |
| `dur-shutter` | 900ms | A shutter on a shopfront |
| `dur-mask` | 1000ms | A masked heading |
| `dur-lamp` | 1100ms, the first after 500ms, 110ms apart | A lamp coming on |

### Choreography

| Moment | Trigger | What moves | Duration, delay, stagger | Easing |
|---|---|---|---|---|
| The street arrives | Script runs, the page is not `?plain`, and the screen's width is known | The still is painted first. The street plate mounts and decodes, then the stage fades in over the still; the still is taken away only once that fade has ended. The other three plates mount after it, hidden | 700ms | `ease-out` |
| The lamps come on | The street plate mounts | A bloom over each of the eight painted lamps rises from nothing to 0.85 and settles at 0.4, from the far end of the street to the near | 1100ms each; the first after 500ms, then 110ms apart, so the last has settled by 2.4s. Once | `ease-out` |
| The walk, within one painting | The scroll, one screen to a stop: from the street to the sign, and from the address to behind the shutter | The plate travels: the point it is held by, where that point stands on the stage and its size all move together, the size evenly in scale so a push does not rush | The stage rests for the first and last 22% of the way between two stops and travels through the middle | smoothstep |
| The walk, between two paintings | The scroll: the sign to the address, behind the shutter to the counter, the counter to the wall, the wall to the room, the room to the street's end | A dissolve on a push. The painting that leaves grows from 1 to 1.1 times its size and fades out; the one that arrives grows from 0.93 to 1 and fades in. The fade runs through the middle of the travel, from 0.22 to 0.78 of it | The same rest at each end | smoothstep, for the travel and again for the fade |
| The shutter on the stage | The scroll, between the address and behind the shutter | LePalatier's painted shutter goes from 36% of the way down its doorway to rolled up, as the stage pushes in to the room | With the travel | smoothstep |
| A shutter on a shopfront | Hover or keyboard focus on a real business's link | The shutter rolls up by 88% | 900ms | `ease-roll` |
| A shop arrives in the catalogue | Its reveal, where motion is welcome | A real business's shutter stands raised until the card arrives, then rolls down; pointing at the shop raises it again at once. A sample has nothing to roll | 900ms; 90ms apart across a row of three | `ease-roll` |
| A reveal | 12% of the element is in view, 6% above the foot of the screen; once | It rises 18px and fades in | 800ms opacity, 900ms transform; a second column 120ms later; steps 90ms apart | `ease-out` |
| A masked heading | Its reveal | Each child comes up out of a clip that opens from the foot | 1000ms | `ease-roll` |
| The tagline lights | The line crosses the screen, from its top at 85% of the height to its foot at the middle | Each word goes from 0.5 of the ink (3.77:1) to full ink, in reading order; a word lit stays lit, and all are lit by the page's end | 500ms a word | `ease-out` |
| A stop's mark | The walk reaches a stop; a pointer | The current mark grows to 24px and turns saffron; a mark pointed at grows to 18px and shows its name | 320ms; the name 200ms | `ease-out` |
| The phone menu arrives | The menu opens | Each link, then the two routes, rises 24px and fades in, in reading order | 200ms each, 50ms apart; five items, so the last is in at 400ms. Closing is a cut | `ease-out` |
| The menu button | The menu opens or closes | Its two strokes turn into the close mark | 300ms | `ease-out` |
| State changes | Hover, press, focus, open | The fill, the edge, the underline, the arrow's 4px, a button's squash, a chip's, a shopfront's, the plus turning 45 degrees, the current page's line, the skip link sliding in | 120 to 320ms, as in the table above | `ease-out` |
| Smooth scrolling | Wheel and trackpad | Lenis eases the page (`lerp: 0.1`). Touch keeps the platform's own momentum. A new page starts at the top | Continuous | Lenis |

### Story map

The stops are data (`src/data/walk.ts`) and are evenly spaced: stop n of 8 sits at (n - 1) / 7 of
the walk's scroll, one screen apart. Each stop's view is in `src/components/stage/views.ts`, once
for a desk and once for a phone (under 900px): which plate, the point of it that is held, where
that point stands on the stage, and how large the plate is drawn, as a multiple of the stage's
height. STORY.md has the same eight.

| Stop | Scroll | Painting and view: desk; phone | LePalatier's shutter | Words |
|---|---|---|---|---|
| 1 The street | 0 | The street plate, held by its lower right corner at the stage's: at the stage's height; at 0.47 of it, along the foot | as painted, two thirds up | The headline, the lede, "See the businesses" |
| 2 The sign | 1/7 | The same plate, pushed in to the first shop's board: 1.75 times, the board 66% across and 46% down; 1.15 times, the board at the middle, 30% down | as painted | "The sign is already painted" |
| 3 The address | 2/7 | LePalatier's own plate at its pier, the town's plaque and the letterbox: 2.6 times; 1.9 times | 36% down | "Its address is held for you" |
| 4 Behind the shutter | 3/7 | The same plate at its doorway, the screen on the back wall: 3 times; 1.9 times | rolled up | "The website is built" |
| 5 The counter | 4/7 | The counter plate, covering the stage: the document, its cover lettered | not in view | "The strategy is on the counter" |
| 6 The wall | 5/7 | The certificate plate, covering the stage: the frame, its paper blank | not in view | "We help you set up the company" |
| 7 The room | 6/7 | LePalatier's own plate at the stage's height: the whole shop, its room lit | rolled up | "The room is yours to fill" |
| 8 The whole street | 1 | The street plate again, held by its lower left corner at the stage's: 1.6 times; 0.6 times. The five shops still to come, the lamp at the street's end, the afterglow | not in view | "Every shop here will have one owner", "See the businesses" |

The stage holds at each stop for 22% of a screen before it and 22% after, so a visitor who stops
scrolling has a still picture to read beside. A plate is never drawn smaller than the stage it must
cover, or pulled off an edge it must reach (the street plate: both sides and the foot; the other
three: every edge), so a view's numbers are a request that the stage rounds to what covers.

### Reduced motion and no script

Under `prefers-reduced-motion: reduce`, script does not add `can-animate` and does not start Lenis,
a block in `globals.css` cuts every duration to a hundredth of a millisecond and every delay to
nothing, and the stage is told (`walk.reduced`).

| Movement | `prefers-reduced-motion: reduce` | Without script, or with `?plain` |
|---|---|---|
| The street arrives | The plates replace the still at once | The still stays, with its description; the walk stays plain sections |
| The lamps come on | Lit from the start, at 0.4 | No plates; the still shows the lamps lit |
| The walk, within one painting | The stage cuts from one stop's view to the next at the halfway point | Eight plain sections, seven with a still of the stage at that stop |
| The walk, between two paintings | One painting replaces the other at the halfway point, with no dissolve and no push | The same eight sections |
| The shutter on the stage | It cuts with the stop | The stills show it where each stop leaves it |
| A shutter on a shopfront | It cuts up on hover and focus, and down again | It rolls, from CSS alone |
| A shop arrives in the catalogue | The shutter is down from the start | The shutter is down from the start |
| A reveal | Shown at once, in its final position | Visible from the start |
| A masked heading | Shown at once, unclipped | Visible from the start |
| The tagline lights | Every word in full ink | Every word in full ink |
| A stop's mark | The mark and the name change at once | There are no marks: the stops are sections |
| The phone menu arrives | The links are simply there | The menu does not open; the header keeps its WhatsApp link and the footer carries the pages |
| The menu button | The strokes change at once | The button does nothing |
| State changes | Each state is cut to, with no travel | As with script: they are CSS, and the questions are native `details` |
| Smooth scrolling | Off; the browser scrolls | The browser scrolls |

Nothing moves by itself: every movement answers a scroll, a pointer, a key or an arrival, and plays
once, so nothing needs a pause control. At rest the stage does no work: it places its plates only
when the scroll or its own size changes, at most once a frame.

### Named Rules

**The Visible First Rule.** Every word is visible in the markup; only `html.can-animate` may hide
or mute anything, and never below 3:1. A crawler, a visitor without script and a visitor who asked
for less motion all get the whole page.

**The Shutter Curve Rule.** `ease-roll` belongs to a shutter rolling on a shopfront and to a
heading rising out of its mask; everything else takes `ease-out`, and the stage follows the scroll.
A roller shutter starts heavy and settles, and that one curve is the brand's own.

**The Hold Rule.** The stage rests at each stop for the first and last 22% of the way to the next,
and under reduced motion it cuts. A visitor who stops scrolling then has a still picture to read
beside.

## Scene & 3D

There is no 3D on this site. The first street was rendered live in three.js, and the owner
rejected it on 17 November 2026 and asked for a better look (S13); the street is now painted, and
this section records the painted stage that took the scene's place.

- **Stack:** the page's own elements. Each plate is an `img` with what is true laid over it, in a
  layer the stage moves with one 2D transform and an opacity. No canvas, no WebGL, no model and no
  library beyond React: three.js and React Three Fiber are uninstalled, and Lenis is the only
  motion dependency.
- **Made from:** five generated paintings (S8 to S12), each made from the approved mock-up or from
  a plate that came from it, with its prompt and a record beside it; the records say the masters
  were saved as generated and not retouched. Four lie on the stage: the street, LePalatier's own
  plate, the counter and the certificate. The fifth, the terrace, is the home page's row of shops
  and the source of each shop's crop and of the shutter's slats. `npm run plates` cuts what ships:
  each plate as WebP at two widths, the terrace as its painted band, a crop for each shop at two
  widths with the slivers of its neighbours' piers covered by a smear of its own wall, the slats of
  one shutter, and LePalatier's room. Every shipped file has a record naming its generator, its
  job and its prompt.
- **Painted blank, lettered in code:** every sign board, plaque, screen and paper was painted
  empty. `src/data/plates.ts` holds where each blank stands, in its plate's own pixels, measured
  with `scripts/measure-plates.mjs` (a flood from a point inside the blank, stopped by its painted
  frame). A board seen at an angle is recorded as its four corners, and its lettering is carried
  onto them by one projective transform (`src/lib/homography.ts`, written as a `matrix3d`), so the
  name lies in the board's own perspective. The certificate's paper stays blank, and so would the
  board of a painted shop with no listing for sale: what the data cannot say is not written.
- **Placing a plate:** a view names a plate, a point on it, where that point stands on the stage
  and a size. The stage turns that into a scale and a corner, then holds the plate to the edges it
  must cover. Progress through the walk picks two neighbouring stops and the way between them; the
  same arithmetic runs backwards, stops anywhere and jumps.
- **The stage's ground:** the street plate's own sky, #012993, set in the stage's style from
  `src/data/plates.ts`. On a phone the street plate stands along the foot and its top 7% is
  feathered into that ground.
- **The stills:** `npm run stills` loads the home page with `?debug`, places the stage at each stop
  exactly (`window.__walk`), waits until every plate has decoded (`window.__stage.ready`), and
  captures the stage with the words, the header and the stop marks hidden: 1600 by 920 for a desk
  and 780 by 1544 for a phone, as WebP, each with a record that says it is a capture of this
  site's own stage. The first desk view also makes the link preview card. They are what a visitor
  sees before the plates arrive, and instead of them.
- **Fallbacks:** the page is whole before any of this runs. As prerendered, every stop is a plain
  section with its still and its words. With `?plain` or without script it stays so, and the first
  screen keeps its still with a description. Under reduced motion the stage cuts from stop to
  stop. A plate that fails to load has no fallback of its own (Known Gaps).
- **Weight:** none is budgeted in writing. As shipped: the street 219 kB and 748 kB, LePalatier's
  plate 158 kB and 577 kB, the counter 14 kB and 61 kB, the certificate 11 kB and 49 kB, the
  shutter 61 kB, the terrace 234 kB and 580 kB, a shop's crop 32 to 37 kB and 83 to 95 kB. The walk
  loads its four plates at once and the terrace when it nears the screen (Known Gaps).
- **Accessibility:** the live stage is hidden from assistive technology, and every fact a painting
  shows also exists as text: in a stop's card, under a shop on the terrace, on a listing's page.
  The still carries a description where it is the only picture. Nothing on the stage takes a
  pointer or a key.

### Named Rules

**The Still First Rule.** A still of the stage is painted before the plates and stays wherever
they cannot run; the moving stage is an addition to a page that is already complete. The stage is
never empty.

**The Blank Paint Rule.** A painting is made with every board, plaque, screen and paper blank, and
what is true is set over the paint in code, from the data: a listing's lettering, its town, its
number, a sample's tag. A picture can then never say something the data does not, and what the
data cannot say stays blank.

**The Same Outline Rule.** A listing's lettering is one outline, drawn by `npm run wordmarks`, and
every painted board, the document's cover, the sign plates and the drawn stand-in all draw it. A
sign and its page cannot disagree.

**The Illustration Rule.** A generated picture is never passed for premises. Every plate, crop and
still has a record beside it that names what made it, and the footer of every page says the
shopfronts are illustrations and that a business comes without premises.

## Responsive Behavior

Breakpoints are Tailwind's own, 640, 768 and 1024px, and two of this build's: 900px (`story`),
where the walk changes, and 1200px, from which the walk's cue shows. Two more conditions shape the
first screen from 900px wide: a screen under 800px tall, and a screen at least twice as wide as it
is tall. No frame of the walk is moved for a screen's shape: one painting is held to the same
corner at every size, and the words are fitted to what sky it leaves. The fluid values run from 390
to 1440.

| Name | Width | Layout | Type | Stage |
|---|---|---|---|---|
| Phone | under 640px | One column. The terrace is 384vw wide and scrolls sideways. The catalogue is two to a row. Gutter 24px, sections 64px. The header holds the mark, WhatsApp and the menu button. The steps run down the page. On Enquire the direct routes come before the form | `heading-1` 48px, `heading-2` 36px, `heading-3` 30px at 390 | The phone's views. The street stands along the foot at 0.47 of the stage's height, its top feathered into the stage's ground, and the first words stand above it. A stop's card sits at the foot, the last stop's at the top. No cue and no stop marks |
| Small | from 640px | The terrace is at least 1280px wide and scrolls sideways until the screen is. A listing's two sign plates sit side by side and its paints four across. The footer has two columns | Fluid | The phone's views |
| Middle | from 768px | The header shows its pages, and its WhatsApp and menu button go. The four steps stand in a row under one line | Fluid; `heading-1` 65.3px at 768 | The phone's views |
| Story | from 900px | The walk takes the desk's views. The first words are shaped to the roofline and fitted. A stop's card sits at the left, centred; the room's at the foot; the last stop's at the top. The stop marks appear. Plain, a still sits beside its words | The first words take the mock-up's measure (Typography) | The desk's views |
| Wide | from 1024px | The catalogue is three to a row. Sections take two columns. A heading stays beside its list. On Enquire the form leads and the direct routes sit beside it. The footer has three columns | Fluid | The desk's views |
| Cue | from 1200px | The cue shows at the foot of the first screen | Fluid | The desk's views |
| Desk | 1440px and up | Gutter 72px at 1440 and 80px from 1600. Content stops at 1280px. The terrace fits without scrolling | The headline 106.6px at 1440 and 128px from 1730 wide on a screen at least 800px tall; `heading-2` 60px, `heading-3` 36px, and no larger | The desk's views |

**Fitting the first words** (from 900px). The stage sets the float's shape from the real boxes,
then tries a fit of 1, 0.92, 0.84, 0.76, 0.68, 0.6 and 0.52 in turn, each first with the second
route and then without it (`data-tight`). It stops at the first where every line of the headline,
the lede and the actions stands inside the float, the lede ends above the sky's floor, and the
second route, where it is shown, ends above the floor too. While it measures, nothing in the words
may transition (`data-fitting`), so each size reads back at once. It runs when the stage mounts,
when the stage is resized and when the fonts have loaded. Live on the build of 12:54 UTC:

| Screen | Fit | Second route | Headline |
|---|---|---|---|
| 1920 by 1080 | 1 | shown | 128px |
| 1440 by 900 | 1 | shown | 106.6px |
| 1024 by 768 | 1 | shown, under the button | 75.8px |
| 1536 by 864 | 0.76 | shown | 86.4px |
| 1366 by 768 | 0.92 | stepped aside | 93px |
| 1344 by 760, the mock-up's shape | 0.92 | stepped aside | 91.5px |
| 1280 by 720 | 0.84 | stepped aside | 79.6px |
| 2560 by 1080 | 0.76 | stepped aside | 97.3px |

The last five gave the same result under reduced motion.

**A short desk** (from 900px wide, under 800px tall): the words start 24px from the stage's top
where they otherwise start 32px down, and the lede and the actions sit 16px apart where they
otherwise sit 24px. **A very wide screen** (from 900px wide, at least 2 to 1): the street is drawn
larger and shows less sky, so the words' column loses its 1280px limit and stands one gutter from
the screen's left edge, where the sky is; the header keeps its centred column.

**Touch targets:** at least 44px for buttons (48px), the small buttons, chips, fields (48px), the
menu button, the mark, header links (72px), arrow links (48px), the walk's cue, the back link, the
footer's links and the credit, a question and the phone menu's links (64px), and the next business
(96px); exceptions: a stop's link is 44px tall and 28px wide, on screens from 900px only, and a
link in a sentence is one line tall. **Collapsing:** the header's pages move into the phone menu
under 768px; the terrace scrolls sideways where it is wider than the screen; the catalogue goes
from three to two to a row; the steps turn from a row to a column; a stop's card moves from the
left of the stage to its foot. The probes for this record found no page scrolling sideways at 390px
on the home page, in the catalogue or on a listing.

## Do's and Don'ts

### Do

- **Do** fill one action in a group with `primary` #f8c618, set its label in `on-primary` #0a1639
  (11.02:1), and put a quiet button or an arrow link beside it
  (The One Saffron Rule, The One Filled Rule).
- **Do** keep a listing's colours on its shopfront, its sign plates and its paints, and set every
  word on a board in that listing's lettering colour (The Own Sign Rule).
- **Do** change a ground by redefining roles in a scope, as `[data-ground="saffron"]` does, and
  leave every `--palette-*` value alone (The Roles Not Values Rule).
- **Do** set a heading, a plaque and a price in Barlow Condensed capitals by `text-transform`, and
  every sentence in Geist (The Painted Sign Rule).
- **Do** keep the slant for `heading-1` on the home page's first screen, and the coral shade for
  that headline and the tagline (The One Slant Rule).
- **Do** give every piece of interface text one of the seventeen named styles
  (The Named Style Rule).
- **Do** keep the shopfronts in the first screen of the home page, with the headline
  (The Street First Rule).
- **Do** hang a lambrequin in the colour of the ground above it where two grounds meet
  (The Roof Line Rule).
- **Do** keep the first words above the painted roofline and their sentences above the sky's
  floor, by shaping and fitting them, and measure them on the sky at the sizes they are shown
  (The Words In The Sky Rule).
- **Do** separate one part of a page from the next with a ground or a hairline, and put anything
  else that sits over a painting on a solid ground of its own
  (The Flat Interface Rule, The Solid Over The Street Rule).
- **Do** round anything pressed that is a control to a full pill, at least 48px tall, or 44px for
  the small button, a chip and the cue (The Pill Rule).
- **Do** show a business as its shopfront, from `Shopfront.tsx` and the data, and name what is
  fixed about it on a plaque in `enamel` #0b2b8e with a limewash rim
  (The Shopfront Rule, The Plaque Rule).
- **Do** say a status, a sample, an error and the current page in words or as a mark, mark a
  sample on its shutter, beside its name and at its price, and leave its shutter down
  (The Words Not Colour Rule, The Sample Rule, The Shut Sample Rule).
- **Do** leave every word visible in the markup, roll a shopfront's shutter and a masked heading
  on `ease-roll`, rest the stage at each stop, and give each new movement its row under "Reduced
  motion and no script" (The Visible First Rule, The Shutter Curve Rule, The Hold Rule).
- **Do** capture a still of the stage after any change to it, paint a new picture with every
  board, plaque, screen and paper blank, and set a listing's one outline over the paint from the
  data (The Still First Rule, The Blank Paint Rule, The Same Outline Rule).
- **Do** save a generated picture's prompt and its record beside it, and keep the footer's line
  that says the shopfronts are illustrations (The Illustration Rule).

### Don't

- **Don't** set words in saffron on limewash or fill a second button in a group: saffron on
  limewash measures 1.49:1 (The One Saffron Rule, The One Filled Rule).
- **Don't** put the platform's ink, a grey or another listing's colour on a listing's board, or
  borrow a listing's colour for the platform (The Own Sign Rule).
- **Don't** redefine a palette value inside a scope, or paint with a raw hex or one of Tailwind's
  colours: those are switched off and paint nothing (The Roles Not Values Rule).
- **Don't** set a sentence in Barlow Condensed or type capitals into the markup: the capitals are
  `text-transform` (The Painted Sign Rule).
- **Don't** slant a second heading, shade a third line, or set words in coral: it measures 3.09:1
  on dusk (The One Slant Rule).
- **Don't** set a loose size or weight, a weight over 700 or interface text under 12px
  (The Named Style Rule).
- **Don't** open the home page with a claim, a picture of something else or a band of logos ahead
  of the street: the businesses are the proof (The Street First Rule).
- **Don't** rule a line between two sections or hang a fringe in a colour that is not the ground
  above it (The Roof Line Rule).
- **Don't** let a line of the first words run onto a roof or a sentence end on the afterglow, and
  never move a view or lay a scrim to make room for them (The Words In The Sky Rule).
- **Don't** cast a soft shadow, fill with a gradient or blur a ground in the interface, and never
  lay a blur or a scrim over a painting (The Flat Interface Rule, The Solid Over The Street Rule).
- **Don't** square a button or a chip, round a plaque into a pill, or make a plaque a button
  (The Pill Rule, The Plaque Rule).
- **Don't** show a business as a photograph, a logo tile or a boxed card: it is a shopfront
  (The Shopfront Rule).
- **Don't** mark a sample, a status or an error by colour alone, add an error colour, let a
  sample's price stand without "a placeholder", or raise a sample's shutter
  (The Words Not Colour Rule, The Sample Rule, The Shut Sample Rule).
- **Don't** start anything hidden without `html.can-animate`, mute the tagline below 0.5 of the
  ink (3.77:1), loop a movement, or move the stage while a visitor rests at a stop
  (The Visible First Rule, The Shutter Curve Rule, The Hold Rule).
- **Don't** leave the stage empty while the plates arrive, generate a picture with lettering in
  it, letter a board by hand or write on a painting what the data does not hold
  (The Still First Rule, The Blank Paint Rule, The Same Outline Rule).
- **Don't** ship a generated picture without its record, call a painting a photograph, or let a
  shopfront pass for premises (The Illustration Rule).

## Agent Guide

**Quick reference:**

- Ground: `dusk` #0e328f; the header and the footer `dusk-deep` #082478; one wall `primary`
  #f8c618; reading sections `limewash` #f7f7f8; the stage's own ground is the street plate's sky,
  #012993.
- Words: `limewash` on dusk, secondary `haze` #b6c0db; `ink` #0a1639 on saffron and limewash,
  secondary `ink-on-saffron` #3e3d32 and `ink-muted` #515972.
- Action: `primary` #f8c618 with `on-primary` #0a1639; hover and press `primary-dark` #e3b30d. On
  limewash the action is dusk with limewash words; on saffron, ink with limewash words.
- Lines: an edge `line-strong` (limewash at 55% on dusk, ink at 55% on light); between rows `line`
  (limewash at 20%, ink at 22% on saffron, ink at 16% on limewash).
- Focus: a 2px outline, 3px out: saffron on dusk and deep dusk, dusk on limewash, ink on saffron.
- Radius: a pill for anything pressed and for the stop marks' strip; 16px for panels, sign plates
  and a business's own plate; 12px for fields, paints and the walk's card; 6px for a plaque.
- Type: Barlow Condensed capitals for signs (`heading-1` 48 to 96px, italic, shaded, and up to
  128px on the first screen from 900px wide; `heading-2` 36 to 60px); Geist for sentences, `body-3`
  at 16px; `caption-4` on a plaque.
- Page: gutter `clamp(1.5rem, 5vw, 5rem)`; sections `clamp(4rem, 10vw, 8rem)`; content at most
  1280px; text 62ch; a heading with its lede 680px; header 72px.
- Motion: `ease-out` cubic-bezier(0.16, 1, 0.3, 1); `ease-roll` cubic-bezier(0.3, 0, 0.1, 1) for a
  shopfront's shutter, 900ms; a reveal rises 18px over 800 and 900ms; the stage rests 22% at each
  end of the way between two stops.
- Facts are data: `src/data/site.ts`, `src/data/businesses.ts`, `src/data/pack.ts`,
  `src/data/walk.ts`. Where things stand on a painting is data too: `src/data/plates.ts`, and each
  stop's view in `src/components/stage/views.ts`.

**Audit before calling a page done:**

1. Grounds, inks and the one filled action per group hold; no stray grey, no second accent, no
   listing's colour off its own shopfront, plates or paints.
2. Every text pair is in Contrast, floored and passing, or listed under Gaps; anything over a
   painting stands on a solid ground, or is the first words and has been sampled on the sky from
   360 to 2560 wide.
3. Hover, focus-visible and pressed states exist for everything pressable, or the missing one is
   under Known Gaps.
4. Every movement has its row under "Reduced motion and no script"; the page is whole without
   script and with `?plain`, and the first words fit the same with motion reduced.
5. No painting carries a letter that is not set from the data, every sample is tagged and shut, and
   every generated file has its record beside it.
6. `npx --yes @google/design.md@0.4.0 lint DESIGN.md` gives 0 errors; `node
   scripts/check-design.mjs` passes; `npm run tokens`, `npm run copy`, `npm run contrast` and `npm
   run behaviour` pass; fresh screenshots at 390 and 1440 have been read, and `npm run stills` has
   been run after any change to the stage or to a plate.

**Prompts:**

- "Add a listing to `src/data/businesses.ts` with a wall, a board, a lettering colour and a trim,
  and its wordmark to `scripts/make-wordmarks.mjs`, in a face under the SIL OFL 1.1. Give the
  lettering at least 4.5:1 on the board with `scripts/contrast.mjs`, add the pair to
  `scripts/contrast.pairs.json`, and add its tokens and its row to DESIGN.md. It has no painting,
  so the catalogue and its own page draw it with `DrawnShopfront.tsx` and the terrace leaves it
  out; say so under Known Gaps until a plate is painted for it. Change no component."
- "Paint a new plate: write its prompt to `assets/plates/<name>.prompt.txt`, asking for every
  board, plaque, screen and paper blank and for no lettering anywhere; save the master as
  generated. Find each blank with `node scripts/measure-plates.mjs <plate> <name:x,y> --draw
  out.png`, look at the drawn outline, and record the numbers in `src/data/plates.ts`. Run `npm run
  plates`, then `npm run stills`, and add the plate to Sources with its generator and its job."
- "Build a section on saffron by setting `data-ground` to `saffron` on it, with a `Lambrequin` at
  its top in the colour of the ground above. Use role classes only (`text-ink`, `text-ink-subtle`,
  `border-line-strong`): the scope turns ink to #0a1639, secondary words to #3e3d32 and the action
  to ink. Set its heading in `heading-2` inside a masked reveal."
- "Build a group of actions: one `btn btn-filled button-md`, at least 48px tall, and beside it a
  `btn btn-quiet button-md` or an `arrow-link button-md` with the drawn arrow as its last child.
  Take the labels from `ACTIONS` in `src/data/site.ts`, and never point a band at the page it is
  on."
- "Name a fact on a plaque: a `span` with `plaque caption-4`, enamel #0b2b8e with its limewash rim,
  6px corners. Use it for a number, a status, a town or a stop's name, never for a sentence and
  never as a button."

## Known Gaps

Recorded, not rules.

**The build's standing**

- The tree is not final. The finish review of the painted street answered "fix" with eight points
  on 17 November 2026 (`.impeccable/review/finish-review-painted.md`); the fixes made since are in
  the working tree on commit 5495eee, uncommitted, and this record is of them as built at 12:54
  UTC. Run again for this record: `npm run tokens` (0 fail, 1 warn), `npm run copy` (0 fail) and
  `npm run contrast` (every pair passes for its role). The captures, the accessibility pass, the
  reveals and `npm run behaviour` are the build's own and are not repeated here.
- impeccable's plates gate passes, 2 of 2. Its hero gate is open: the measured comparison of the
  first screen with the approved mock-up stood at 65.8% before the first words' fit was corrected
  and stands at 71.7% (0.7171, read by the tool as "drift") at 13:01 UTC, against the 72% the gate
  asks: structure 0.69, colour 0.58, palette match 0.65, detail 0.79; the street 0.76, the sky
  0.65, the headline 0.47, the lede 0.43 (`.impeccable/review/diff/final`). The `sections`,
  `motion`, `responsive` and `review` phases never opened. The 3D builds measured 49.6% to 52.6%.
- Against the mock-up the build differs by decision: each sign carries its listing's real
  lettering, the plaques carry a town and numbers, the header is the site's own 72px band, no
  saffron band shows at the foot of the first screen, and the second route steps aside on some
  desks.
- The plates are generated illustrations. Nobody who knows a Mauritian shop street has yet
  confirmed that the roofs, the fretwork, the plaques, the lamp and the wire read as Mauritius.
- The paintings do not agree with one another in every detail. The terrace runs LePalatier first
  from the left and the street has it nearest, at the right; a board is a plain rectangle on the
  street plate and notch-cornered on the terrace and on LePalatier's own plate. A dissolve passes
  between two of them.
- The dissolves and the travels are not captured. The stills and the review's captures show each
  stop at rest; one dissolve was looked at for this record at its midpoint, on an earlier build,
  where both paintings show at once.
- Hover and pressed states were read in code, not captured.
- Not run: any real phone or tablet; frame rate on a device while the stage moves layers up to
  3840px wide; a keyboard pass by hand on a device; a screen reader; Lighthouse.
- English only. French and Kreol are not built, and the routes are not under a language folder.
- The sample listings' colours and lettering are placeholders, and LePalatier's are a first
  direction to confirm.
- The kit's dev-only foundations page is not built, so no sheet shows every role, style and step
  bound to the real tokens.

**Where the build falls short of what is written**

- Weight on a phone. The walk loads its four plates at once: 967 kB at 390 by 844 at 1x, as loaded
  in the probe (the street at 1920 wide; LePalatier's plate at 2880, the counter and the
  certificate at 2048, because their `sizes` ask for three to six screens' width; the shutter). By
  the same arithmetic a 3x phone takes about 1.5 MB, and 2.1 MB once the terrace has loaded. The
  first three stops' stills also load before the live walk hides them, and the link preview card
  is a 1 MB PNG.
- A listing beyond the six painted is drawn by the stand-in in the catalogue and on its own page,
  is left off the terrace, and has no board on the walk's street.
- The walk matches a listing to a painted shop by its place in the list, where the terrace matches
  by name. When a business is sold and leaves the list, every sign on the walk's street moves one
  shop along, and the walk's own shop, painted as LePalatier's, is lettered for whichever business
  is then first. No instance: nothing is sold.
- Lettering on a painting falls under 12px. A sample's tag on the first screen stands 7 to 12.6px
  tall, box and all, at 390 by 844. A number is 8.3px on the terrace at 1440, 7.3px in the
  catalogue at 390, and a speck on the first screen (its box 3.1 to 5px tall on a phone, 7 to
  11.5px at 1440 by 900). The town is 10.2px at the head of LePalatier's page at 390. Each is said
  again in text beside its shop.
- A listing's lettering on its lit board falls under its flat pair, to 2.41:1 for Bouké and 2.81:1
  for Larout on the terrace (Contrast, Gaps).
- In the catalogue a narrower shop ends short of its frame: up to 22.6px of limewash shows at its
  right at 1440, and up to 9.3px at 390.
- Where the second route breaks onto its own line under the button (phones, and 1024 by 768), it
  keeps the 24px that separate it from the button and so stands 24px in from the button's left
  edge.
- At 360 by 640 the second route sits just above a roof, and the corner of its focus ring crosses
  the fretwork, where saffron measures 1.85:1.
- At the last stop at 1440 by 900 the card's foot meets the street lamp's head, and a sliver of
  the first shop shows at the stage's right edge.
- A plate that fails to load has no fallback: the stage arrives over the still all the same, its
  lettering on bare ground. Read in code, not provoked.
- Without script the phone menu does not open, so under 768px the header offers the mark and
  WhatsApp and no pages; the footer carries them. The request form is sent by script: without
  script it shows a notice, and its fields do nothing.
- Read from the palette and not through a role: the skip link, the selection and the scrollbar,
  the page's own background, the ground behind the stage, the walk's cue and the strip under the
  stop marks, the mark, a sample's tag, the lettering on a painted plaque, a lamp's bloom, a
  doorway's lamplight, every fill in the drawn stand-in, the 404's kerb, and each lambrequin's
  colour, the footer's included.
- Written outside the palette: the stage's ground, #012993 (`STREET_SKY`, `src/data/plates.ts`),
  and the browser's theme colour, #082478 (`src/app/layout.tsx`), which repeats `dusk-deep` by
  hand.
- The first words on a wide screen override two named styles against `.walk-words-first`, with no
  name of their own, and the headline there reaches 128px, above the 96px `heading-1` ends on.
  The three letterings on a plate are three more settings with no named style.
- The mark's name is `heading-5` with its capitals and its tracking switched off by two utilities,
  and a paint's code is `caption-2` with capitals added by one: two variants with no name of their
  own.
- Off the spacing scale in `globals.css`: a plaque's 10px of side padding and the walk card's 28px
  of padding.
- Two radii have more than one use: 12px (fields, paints, the sample note, the walk's card) and
  16px (sign plates, a business's own plate, panels, plain stills).
- States not designed: hover on the mark; pressed on an arrow link, a header link, a question, a
  stop's mark, the menu button and the cue; a stop's mark does not grow under keyboard focus, where
  only its name and the ring show. `Reserved` and `Sold` have a label and no instance.
- States written with no instance on any page: a disabled quiet button, a disabled field, a
  disabled chip, the empty street, a filled action on limewash and on saffron, the page with prices
  switched off, the drawn stand-in, a painted crop standing open, a doorway's lamplight, and a
  painted shop left blank because its business is sold.
- A stop's link is 28px wide, under the 44px the rest keep; it is 44px tall.

**Declared and unused**

- `--palette-amber` #e48627 and `--palette-asphalt` #383141 are declared and read by nothing.
- `tin`, `tin-shade`, `steel`, `steel-deep`, `lamplight` and `lamplight-wall` are read only by the
  drawn stand-in and, for `lamplight`, by a doorway's lamplight; neither has an instance.
- The `caption-3` text style and the `--ease-in-out` curve are declared and used by nothing. The
  `story` breakpoint is used once, as a variant; the same 900px is written out by hand in nine
  media queries, three media strings and four `sizes` strings, and the cue's 1200px in one.
- `--brand-wall` and `--brand-accent` are declared, and the second is set on a listing's sign
  plates, but no rule reads either.
- `paper-subtle` is read only by a disabled filled action and a disabled field, so its values on
  deep dusk, saffron and limewash paint nothing yet. On a listing's board, `line` is defined and
  nothing draws it, and `focus` is not turned because nothing there takes focus.

**Not yet traced**

- The derived values (`primary-dark`, `ink-muted`, `ink-on-saffron`, `haze`, `tin-shade`) are
  recorded with their direction and their reason. The build does not write down the operation that
  gave each value.
- `roomlight` and the stage's ground are recorded as sampled from a plate; the region and the
  method that gave each are not in the repository. This record's own sample of the street plate's
  top edge gave #012a92.
- The sky's floor, 0.55 of the street plate's height, and its two ratios (4.61:1 above, 3.09:1
  below) are written in `src/data/plates.ts` without the measurement that gave them. This record's
  sample of the master found 5.49:1 at the lightest sky above the floor.
- Each stop's view and the roofline's twelve points were set by hand against the plates. No solver
  or measurement for them is in the repository.
- Geist was carried over from the first build. The mock-up's sentences were measured as a sans of
  normal width and were not matched to a face.
