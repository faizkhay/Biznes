---
version: alpha
name: "biznes.mu, the website"
description: "The street: every business is a finished shopfront on one Mauritian shop street at blue hour. The palette is sampled from the mock-up the owner approved: dusk blue, limewash and one saffron, which fills the one action and one whole wall."
# On Google Labs' DESIGN.md format (npx @google/design.md lint DESIGN.md), from the KOS template.
# Every colour and typeface cites a Source ID (Overview, Sources). 'sampled' means measured from the
# approved mock-up; 'derived' means worked out from a sampled value, with the direction and the
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
  tin: "#4a6eac"                          # S2 a tin roof where the sky lights it; region median. The drawn shopfront's roof
  tin-shade: "#3a5a94"                    # derived from tin: darker, the grooves between its ribs
  steel: "#655366"                        # S2 a roller shutter; region median
  steel-deep: "#574c64"                   # S2 a closed shutter in shade; region median. The gaps between the slats, the bottom rail
  lamplight: "#f18f38"                    # S2 the lit room's floor; region median
  lamplight-wall: "#e0842c"               # S2 the lit room's wall; region median
  pavement: "#3d3644"                     # S2 the pavement; region median. The kerb under a drawn shopfront
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
  walk-stops: { backgroundColor: "{colors.dusk-deep}", rounded: "{rounded.field}", padding: "0.375rem 0.25rem", width: 2.75rem }
  walk-stop-mark: { backgroundColor: "{colors.line-strong}", rounded: "{rounded.pill}", width: 0.75rem, height: 0.1875rem }
  walk-stop-mark-current: { backgroundColor: "{colors.primary}", rounded: "{rounded.pill}", width: 1.75rem, height: 0.1875rem }
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
  # The drawn shopfront's own materials: fills in an SVG, never text.
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

<!-- Recorded on 17 November 2026 from faizkhay/Biznes, and reconciled at 09:05 UTC with the final
tree: commit 0ca61e9 with the last fixes in the working tree, served by the production build of
08:45 UTC. Every measurement below marked "live" was taken from that build. It replaces the record
of the first build ("the rail"), none of which survives. Read from src/app/globals.css,
src/components, src/app, src/data and the captures in review/screens (pages retaken 08:50 to 08:52
UTC, states 08:55 to 08:56 UTC). Where the build and this file differ, the build wins and the
difference goes to Known Gaps. Checks: `npx --yes @google/design.md@0.4.0 lint DESIGN.md` gives 0
errors and 0 warnings; `node scripts/check-design.mjs` passes; contrast measured 17 November 2026
with `npm run contrast`. The machine-readable sidecar is `.impeccable/design.json`. -->

## Overview

**Creative North Star: "The street"**

biznes.mu sells finished businesses in Mauritius, each built by Khay Digital and sold once, to one
owner. Every business is a finished shopfront on one street at blue hour: its sign painted and lit,
its shutter down. The home page opens on that street in 3D and the scroll walks one shop,
LePalatier, in eight stops: the street, the sign, the address, behind the shutter, the counter, the
wall, the room, the whole street. Three beats: the street at dusk, behind the shutter, yours to
open. Then the street as one terrace, the sale in four steps, the line said large, and the
questions. A business's own page ends on one action: Ask about this business. Sold, it leaves the
street.

The mood is a shop street after work, when the signs come on: saturated walls on a deep blue
ground, lettering painted large, warm light where a room is open. One idea per block. Sections sit
64 to 128px apart, running text is held to 62ch, and a hero heading with its lede to 680px. Nothing
in the palette or the type was invented: the interface's colours were measured from the mock-up the
owner approved on 17 November 2026 (S1), the drawn shopfront's materials are region medians of the
same picture (S2), and Barlow Condensed was matched to its lettering by measurement (S3). What is
derived says what it was derived from. Each listing's own colours and lettering are Khay Digital's
direction (S6) and are content, not the platform's palette.

**Key Characteristics:**

- `dusk` #0e328f is the page's ground and `limewash` #f7f7f8 its words (10.48:1); `dusk-deep`
  #082478 holds the header and the footer.
- `primary` #f8c618, saffron, is the one filled action, the focus ring, the current page's line and
  one whole wall; on that wall the action turns `ink` #0a1639.
- Barlow Condensed in capitals (`heading-1` to `heading-5`, `title-4`, `caption-4`) speaks whatever
  is painted on a sign; Geist carries every sentence.
- The shopfront is the one picture of a business: a tin roof, a pierced fringe, a sign with the
  listing's own lettering, a roller shutter over a lit room. It is drawn the same in SVG and in 3D.
- The plaque, `enamel` #0b2b8e with a limewash rim (`rounded.plaque`, 6px), names what is fixed: a
  number, a status, a town. The walk's card is the same plaque at the size of a notice.
- The lambrequin, a row of pierced scallops 16px tall, hangs where one ground meets the next.
- Anything pressed is a full pill at least 48px tall (`button-primary`, `button-quiet`), 44px for
  the small button, a chip and the walk's cue.
- The interface is flat; depth lives in the street, which is live 3D where it can run and a still
  of itself where it cannot.

**Refusals:**

- No blur and no scrim over the street. Whatever sits over the live canvas is solid: the header in
  `dusk-deep`, the walk's card and a stop's name in `enamel`, the cue and the strip the stop
  marks stand on in `dusk-deep`.
- No boxed listing card and no cream catalogue. The direction contract refused both, and the first
  build was the second: a business is shown as its shopfront, with its facts on the ground beneath.
- No photograph, testimonial or sales figure. None exists yet (PRODUCT.md, "Evidence on Hand"), and
  nothing is invented.
- No downloaded model in the street and no stock picture. Every shop is boxes and planes built in
  code; the one image is the generated sky.
- No colour as the only signal. A sample, a status, an error and the current page are said in words
  or drawn as a mark.
- No soft shadow, glow or gradient in the interface. The only shadow is the sign painter's hard
  coral shade, which is lettering; light belongs to the street.

**Sources** <!-- add a row before using any new asset -->

| ID | Asset | From, version | Gave |
|---|---|---|---|
| S1 | The approved mock-up, `.impeccable/mocks/comp-b-perspective.png` (2688 by 1520) | Generated 17 November 2026 with Higgsfield, model `gpt_image_2_6`, its prompt beside it; approved by the owner the same day. Measured by impeccable comp-spec into `.impeccable/build/spec.json`, 12 regions | The first screen's composition; `dusk`, `dusk-deep`, `primary`, `limewash`, `ink`, `coral`, `enamel`; LePalatier's wall |
| S2 | The same mock-up, by region median | `scripts/sample-comp.mjs`, 15 regions, 17 November 2026 | The drawn shopfront's materials: `tin`, `steel`, `steel-deep`, `lamplight`, `lamplight-wall`, `pavement` |
| S3 | The mock-up's headline lettering | impeccable font-match (`spec.json`, region `headline`; `.impeccable/build/font-match/headline.png`) | Barlow Condensed at weight 700: a cap height of 138px against the mock-up's 137.9px |
| S4 | Barlow Condensed, three cuts (600, 700, 700 italic), in `src/fonts` | From `@fontsource/barlow-condensed`; SIL Open Font License 1.1, the licence beside the files; served through next/font | The sign face |
| S5 | Geist | The `geist` package, 1.9.2; SIL Open Font License 1.1; served through next/font. Carried from the first build, where it came from Elaya's list of faces as KOS keeps it (`references/brand-system.md`) | The face for sentences |
| S6 | Khay Digital's direction for the listings | 16 and 17 November 2026; `src/data/businesses.ts` | Each listing's sign colours, its trim and the face its lettering is drawn in; the samples' wall colours |
| S7 | Six open-licence faces | `@fontsource` packages (devDependencies), each under the SIL Open Font License 1.1 | The outlines of the six wordmarks, drawn by `scripts/make-wordmarks.mjs` |
| S8 | The generated sky, `assets/plates/sky.png` (2688 by 1152) | Higgsfield, model `gpt_image_2_6`, 17 November 2026, with S1 as its colour reference; its prompt beside it | The one image behind the street |
| S9 | The owner | In conversation, 15 to 17 November 2026 | The offer; carte blanche on creative direction; the choice of "the street", of a 3D centrepiece, of mock-up B and of "3D plus a painted sky" |

## Colors

The palette is sampled, not chosen: the mock-up the owner approved (S1) gave the dusk, the saffron,
the limewash, the ink, the coral and the enamel blue, and region medians of the same picture (S2) gave
the drawn shopfront's materials.

### Palette

| Name | Token | Value | Role: where used, and where never | Source |
|---|---|---|---|---|
| Dusk | `dusk` | #0e328f | The page's ground; a field's fill; the fog the far shops fade into. The action's fill on limewash | S1: the sky behind the headline, 53% of the mock-up (comp-spec, the picture's first colour) |
| Deep Dusk | `dusk-deep` | #082478 | The header, the footer, the phone menu, the walk's cue, the strip the stop marks stand on; the fill of a disabled action; the browser's theme colour and the icon's ground | S1: the navigation band (92% of that region) |
| Saffron | `primary` | #f8c618 | Fills only: the one filled action, the focus ring, the current page's line and dot, the current stop's mark, the selection, the scrollbar, the mark, and the ground of one whole section. Never words on limewash (1.49:1) | S1: the pill buttons (the navigation band's second colour) |
| Saffron, pressed | `primary-dark` | #e3b30d | The filled action on hover and press | derived from `primary`: darker, still carrying ink at 9.03:1 |
| Ink | `ink`, `on-primary` | #0a1639 | Words on saffron and on limewash; the action's fill on the saffron section | S1: the dark text on the Enquire pill |
| Limewash | `limewash` | #f7f7f8 | Words on dusk, on deep dusk and on enamel; the ground of reading sections; white paint (a fringe, a plaque's rim) | S1: the white of the lettering (regions `nav-how` and `how-link`) |
| Muted Ink | `ink-muted` | #515972 | Secondary words on limewash only | derived from `ink` toward `limewash`: 6.49:1 |
| Ink on Saffron | `ink-on-saffron` | #3e3d32 | Secondary words on the saffron section only | derived from `ink` toward `primary`: 6.81:1 |
| Haze | `haze` | #b6c0db | Secondary words on dusk and deep dusk. Never on limewash or saffron | derived from `limewash` toward `dusk`: 6.17:1 and 7.53:1 |
| Coral | `coral` | #f14949 | The hard shade under the hero's capitals and under the tagline. Never words, never a fill | S1: the shade under the headline (22% of that region) |
| Enamel | `enamel` | #0b2b8e | A plaque's plate; the walk's card; a stop's name; the cue on hover | S1: the second blue of the mock-up's sky (19% of that region). The painted plaque itself measures #052592 |
| Hairline | `line` | limewash at 20% | The line between rows on dusk and deep dusk; the default border colour | derived |
| Edge | `line-strong` | limewash at 55% | A field's edge, a chip's, a quiet button's; the line that opens a list; a resting stop mark; the 404's dashed plot | derived, for 3:1 as a mark |
| Hairline on Saffron | `line-on-saffron` | ink at 22% | The line between rows on the saffron section | derived |
| Hairline on Limewash | `line-on-limewash` | ink at 16% | The line between rows and a paint's edge on limewash | derived |
| Edge on Light | `line-strong-on-light` | ink at 55% | The line that opens a list on saffron and on limewash | derived, for 3:1 as a mark |

The drawn shopfront's materials colour an SVG and are never text. Each is a region median of the
mock-up (S2), named by the region `scripts/sample-comp.mjs` prints.

| Name | Token | Value | Where | Source |
|---|---|---|---|---|
| Tin | `tin` | #4a6eac | A drawn roof's ribs | S2: "tin roof (LePalatier, lit face)" |
| Tin Shade | `tin-shade` | #3a5a94 | The grooves between the ribs | derived from `tin`: darker |
| Steel | `steel` | #655366 | A drawn shutter's slats | S2: "shutter steel (LePalatier, raised part)" |
| Steel Deep | `steel-deep` | #574c64 | The gaps between the slats; the shutter's bottom rail | S2: "shutter steel (closed, lakrem)" |
| Lamplight | `lamplight` | #f18f38 | The lit room's floor and the lines of its corners | S2: "room floor" |
| Lamplight Wall | `lamplight-wall` | #e0842c | The lit room's walls | S2: "room wall, lit" |
| Pavement | `pavement` | #3d3644 | The kerb under a drawn shopfront and under the 404's empty plot | S2: "pavement" |

### Listings' own colours

These are content: each listing's identity, read from `src/data/businesses.ts`. A shopfront paints
its wall in `wall`, its sign board in `ground`, its lettering in `ink` and its sign's frame and
lamps in `accent`. They are not the platform's palette and no platform component may borrow them.
Each board is modelled with its lettering, so the pair is checked.

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
paints, and every word on a board takes that listing's lettering colour through
`[data-ground="brand"]`. The platform must not compete with what it sells, and each board is one
measured pair.

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
list. "Live" means sampled from the production build's own canvas (the build of 08:45 UTC) with the
words hidden, as the lightest 8px block behind the words themselves.

| Text or mark | On | Ratio | Body text (4.5) | Large text, marks (3) | Where |
|---|---|---|---|---|---|
| `limewash` #f7f7f8 | #263ba7 | 8.65:1 | pass | pass | live, 1440 by 900: the lightest sky behind the headline |
| `limewash` #f7f7f8 | #4d47b9 | 6.72:1 | pass | pass | live, 1440 by 900: behind the lede |
| `limewash` #f7f7f8 | #5b4cbd | 6.10:1 | pass | pass | live, 1440 by 900: behind "How it works" |
| `limewash` #f7f7f8 | #1c36a1 | 9.37:1 | pass | pass | live, 1920 by 1080: behind the headline |
| `limewash` #f7f7f8 | #3941b0 | 7.67:1 | pass | pass | live, 1920 by 1080: behind the lede |
| `limewash` #f7f7f8 | #3f44b4 | 7.27:1 | pass | pass | live, 1920 by 1080: behind "How it works" |
| `limewash` #f7f7f8 | #3540b0 | 7.80:1 | pass | pass | live, 1366 by 768: behind the headline |
| `limewash` #f7f7f8 | #6a4ebe | 5.69:1 | pass | pass | live, 1366 by 768: behind the lede |
| `limewash` #f7f7f8 | #8554bf | 4.88:1 | pass | pass | live, 1366 by 768: behind "How it works" |
| `limewash` #f7f7f8 | #3842b1 | 7.59:1 | pass | pass | live, 1280 by 720: behind the headline |
| `limewash` #f7f7f8 | #7150be | 5.45:1 | pass | pass | live, 1280 by 720: behind the lede |
| `limewash` #f7f7f8 | #8a57bf | 4.67:1 | pass | pass | live, 1280 by 720: behind "How it works", on the sky's violet |
| `limewash` #f7f7f8 | #153299 | 10.06:1 | pass | pass | live, 1024 by 768: behind the headline |
| `limewash` #f7f7f8 | #3a42b1 | 7.56:1 | pass | pass | live, 1024 by 768: behind the lede |
| `limewash` #f7f7f8 | #4946b7 | 6.89:1 | pass | pass | live, 1024 by 768: behind "How it works" |
| `limewash` #f7f7f8 | #092b89 | 11.41:1 | pass | pass | live, 768 by 1024: behind the headline |
| `limewash` #f7f7f8 | #06288a | 11.68:1 | pass | pass | live, 768 by 1024: behind the lede and behind "How it works" |
| `limewash` #f7f7f8 | #012385 | 12.41:1 | pass | pass | live, 390 by 844: behind the headline |
| `limewash` #f7f7f8 | #0d2b8c | 11.26:1 | pass | pass | live, 390 by 844: behind the lede |
| `limewash` #f7f7f8 | #18359d | 9.63:1 | pass | pass | live, 390 by 844: behind "How it works" |
| `limewash` #f7f7f8 | #00217f | 12.87:1 | pass | pass | live, 375 by 667 and 360 by 640: behind the headline |
| `limewash` #f7f7f8 | #0a298b | 11.51:1 | pass | pass | live, 375 by 667: behind the lede |
| `limewash` #f7f7f8 | #3540ae | 7.85:1 | pass | pass | live, 375 by 667: behind "How it works" |
| `limewash` #f7f7f8 | #0b2a8a | 11.45:1 | pass | pass | live, 360 by 640: behind the lede |
| `limewash` #f7f7f8 | #3e42b3 | 7.44:1 | pass | pass | live, 360 by 640: behind "How it works" |
| `primary` #f8c618 | #5b4cbd | 4.07:1 | fail | pass | live, 1440 by 900: the focus ring round "How it works" |
| `primary` #f8c618 | #8a57bf | 3.11:1 | fail | pass | live, 1280 by 720: the focus ring round "How it works" |
| `line-strong` rgba(247,247,248,0.55) | `dusk-deep` #082478 | 4.78:1 | pass | pass | a resting stop mark on its strip |
| `limewash` #f7f7f8 | `dusk-deep` #082478 | 12.78:1 | pass | pass | a stop mark pointed at, on its strip |
| `primary` #f8c618 | `dusk-deep` #082478 | 8.52:1 | pass | pass | the current stop's mark on its strip |
| `primary` #f8c618 | `enamel` #0b2b8e | 7.47:1 | pass | pass | the focus ring on the walk's card |
| `coral` #f14949 | `dusk` #0e328f | 3.09:1 | fail | pass | the shade under the tagline, on dusk |
| `coral` #f14949 | #263ba7 | 2.55:1 | fail | fail | live, 1440 by 900: the shade under the headline at the sky's lightest. A shade, not words |
| `enamel` #0b2b8e | `dusk` #0e328f | 1.06:1 | fail | fail | a plaque's plate against the page: told by its limewash rim (10.48:1) |
| `limewash` #f7f7f8 | #25469a | 8.10:1 | pass | pass | a quiet button hovered on dusk: its 10% wash under its words |
| `limewash` #f7f7f8 | #203985 | 9.87:1 | pass | pass | a quiet button hovered on deep dusk |
| `limewash` at 0.75 | `dusk` #0e328f | 6.57:1 | pass | pass | a link while pressed (0.75 of its ink), on dusk |
| `haze` at 0.75 | `dusk` #0e328f | 4.15:1 | fail | pass | the back link while pressed, 14px: under 4.5:1 for as long as it is held |
| `haze` at 0.75 | `dusk-deep` #082478 | 4.84:1 | pass | pass | the credit while pressed |
| `ink` at 0.75 | `limewash` #f7f7f8 | 7.70:1 | pass | pass | the next business's name while pressed |

**Gaps (recorded, not rules):**

- The hero's words sit on the live street with no ground of their own. On a short or a narrow
  stage the camera draws back, so the street is smaller under them and they stand on sky. They
  pass at the nine sizes sampled, from 360 by 640 to 1920 by 1080; the lowest is 4.67:1, behind
  "How it works" at 1280 by 720, where the sky is violet. Sizes between the nine were not sampled.
- The focus ring over the live street was sampled twice (4.07:1 behind "How it works" at 1440 by
  900, 3.11:1 at 1280 by 720). It is not measured at every width.
- `line`, `line-on-saffron` and `line-on-limewash` divide rows and edge a paint, so they are held
  to no ratio (1.69:1, 1.57:1 and 1.39:1).
- A light paint (Ivory, Cream, Sky) on limewash is told by a hairline at 1.39:1 and by its name and
  its code in words beside it.
- No pair is measured for a listing's lettering on its sign in 3D, where light and tone mapping
  change both colours (Scene & 3D, "Brand colour under light").

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
| `heading-1` | Barlow Condensed | 700 italic | clamp(var(--text-5xl), 1.8857rem + 4.5714vw, var(--text-8xl)): 48 to 96px | 1 | 0.005em | capitals; a hard coral shade, 0.058em across and 0.064em down | The home page's headline, and nothing else |
| `heading-2` | Barlow Condensed | 700 | clamp(var(--text-4xl), 1.6929rem + 2.2857vw, var(--text-6xl)): 36 to 60px | 1 | 0.005em | capitals | Every other page's first heading; section headings; the tagline, with `sign-shade`; the closing band; a step's number; a real price at the head of its listing, with tabular figures |
| `heading-3` | Barlow Condensed | 700 | clamp(var(--text-3xl), 1.7357rem + 0.5714vw, var(--text-4xl)): 30 to 36px | 40/36 (1.11) | 0.01em | capitals | The heading on a walk card; the phone menu's links; "What comes with it" and "What you bring"; the sent panel's heading |
| `heading-5` | Barlow Condensed | 700 | `text-2xl`, 24px | 32/24 (1.33) | 0.015em | capitals; lower case with no tracking in the mark | A business's name under its shopfront; a step's title; "Reach us directly"; a heading on the privacy page; the next business; the name in the mark |
| `title-1` | Geist | 500 | `text-xl`, 20px | 28/20 (1.4) | 0 | none | The lede under a page's heading; a question |
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

Each listing's wordmark is artwork, not interface type: vector outlines drawn by
`scripts/make-wordmarks.mjs` from an open-licence face (S7), so the site loads no typeface for it.
The same outline is drawn on the flat shopfront, on the sign plates and on the sign in 3D.

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
hero heading with its lede to 680px (`measure-hero`). The header is 72px tall and stays at the top;
a link to a part of a page lands under it (`scroll-padding-top`). Inside components, spacing takes
only the thirteen steps of the scale in class names: `npm run tokens` reports 0 fail and 1 warn,
the one italic. Three values in `globals.css` sit off those steps (Known Gaps).

- **Story structure:** the home page, in order: the walk, eight stops on dusk; "On the street now",
  the terrace, on dusk; the four steps on saffron; the tagline on dusk; the questions on limewash;
  the footer on deep dusk. Then the catalogue (a heading on dusk, six shopfronts on limewash); a
  business's page (its plaques, name, price and one action beside its shopfront on dusk; its brand
  on limewash; what it is on dusk; what comes with it beside what the buyer brings on saffron; the
  next business on limewash); How it works (the four steps on saffron, the questions on limewash);
  Enquire (the form beside the direct routes, on dusk); Privacy; and the 404, an empty plot. Each
  page's footer opens with the invitation that fits it.
- **The walk:** the stage is as tall as the screen less the header and never under 576px
  (`max(100svh - 72px, 36rem)`). The headline lies over its first screen. Where the canvas runs the
  stage pins under the header and each stop is one more screen of scroll, with its words in a card
  26rem wide: at the foot of the screen under 900px, at the left and centred from 900px. Where it
  does not run each stop is a section: its still above its words, or beside them (`1.3fr 1fr`) from
  900px.
- **Grids:** the terrace is one row of columns at least 216px wide, 64vw each under 640px, and
  scrolls sideways where it is wider than the screen. The catalogue is 2 shopfronts to a row and 3
  from 1024px. Two-column sections begin at 1024px: a listing's head `1fr 0.9fr`; a listing's
  brand, its idea and the questions on How it works `0.85fr 1.15fr`; the home page's questions
  `0.8fr 1.2fr`; the home page's "On the street now" heading `1.1fr 1fr`; Enquire `1.15fr 0.85fr`;
  the closing band `1.3fr 1fr`; the footer `1.3fr 0.6fr 1fr`; a privacy row `0.5fr 1fr`. The steps
  are four columns from 768px. A heading beside a long list stays in view (`sticky`, 112px from the
  top) from 1024px.

### Named Rules

**The Street First Rule.** The home page opens on the street: the shopfronts are in the first
screen, under the headline, at 1440 by 900 and at 390 by 844. The businesses are the proof, so they
come before any claim.

**The Roof Line Rule.** Where one section's ground gives way to another's, a lambrequin in the
colour of the ground above hangs 16px onto the ground below, and no ruled line divides one section
from the next. A change of section then reads as a roof line.

## Elevation & Depth

Depth lives in the street: a perspective camera, lamps, a lit room. The interface over it and below
it is flat, and separates by ground (dusk, deep dusk, saffron, limewash, a listing's board) and by
hairline (`line`, `line-strong`). The header stays above the page as a solid band, the phone menu
opens under it on the same solid ground, the walk's words ride over the pinned stage, and the skip
link sits over everything.

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
  `0.05em 0.055em 0` through `sign-shade`): hard, with no blur. About 6px at the headline's 96px.

### Named Rules

**The Flat Interface Rule.** The interface casts no shadow, fills with no gradient and blurs
nothing; an inset edge is a line. Depth is said by a change of ground or a hairline, and the only
light on the page is the street's own.

**The Solid Over The Street Rule.** Whatever sits over the live street is solid: the header in
`dusk-deep`, the walk's card and a stop's name in `enamel`, the cue and the strip the stop marks
stand on in `dusk-deep`. Its words and marks then never depend on what the canvas is showing behind
them. The hero's words are the one exception, and
are under Contrast, Gaps.

## Shapes

Five radii, each a step of Tailwind's radius scale:

- **Full pill** (`rounded.pill`): anything pressed that is a control. Buttons, chips, the skip
  link, the walk's cue, the menu button and the mark's focus shape; a stop's mark is the same shape
  3px tall.
- **16px** (`rounded.panel`, `rounded-2xl`): the two sign plates, the panels the form answers with,
  the empty street's panel, and a stop's still where the walk is plain.
- **12px** (`rounded.field`, `rounded-xl`): fields, paints, the sample note, the walk's card and
  the strip the stop marks stand on.
- **6px** (`rounded.plaque`, `rounded-md`): a plaque.
- **4px** (`rounded.stop-name`, `rounded-sm`): a stop's name beside its mark.

Full-width bands are square. No radius is nested by the formula: a control stays a pill wherever it
sits.

The shopfront is drawn on a grid of 240 by 250 units. A roof of 8-unit ribs in `tin` and
`tin-shade` under a limewash strip; a wall in the listing's wall colour; a fringe of scallops 12
units wide, each pierced by a hole in the wall's colour; two pilasters outlined in limewash at 45%;
a sign board 160 by 42 in the listing's board colour, framed in its trim, with its lettering fitted
inside 136 by 22; two lamps in the trim with saffron bulbs; an opening 152 by 108 onto a room in
`lamplight-wall` and `lamplight`; a shutter of 7-unit slats in `steel` and `steel-deep` with a
bottom rail and a handle; and a kerb in `pavement`. In a terrace the wall runs to both edges, so
neighbours touch. The shutter is one group inside a clipped opening: raised, it moves up by 88% of
its own height.

Drawn small, the shopfront is the mark: on a 24-unit grid, a roof with four scallops and a body in
saffron with a door in deep dusk, 28px wide beside the name. The icon is the same shopfront on a
deep dusk square with 7-unit corners.

The plaque is an inline plate at least 28px tall, 6px corners, 2px by 10px of padding, with its
rim. The lambrequin is one SVG pattern, a tile 24 by 16: a 4px band and a half-round below it,
pierced by a hole 4.5px across. It is the same tooth the drawn shopfronts and the 3D roofs wear.
The 404 draws an empty plot: the dashed outline of a shopfront that is not there, in `line-strong`,
on a kerb.

Icons are one drawn set of eight (arrow, back arrow, phone, chat, mail, plus, tick, alert) on a
24px grid, with 1.5px round strokes in the current colour. Every icon sits beside words and is
hidden from assistive technology. The walk's cue turns the arrow to point down.

### Named Rules

**The Pill Rule.** Anything pressed that is a control is a full pill, at least 48px tall, or 44px
for the small button, a chip and the walk's cue. One shape then always means "press here"; a plaque
has corners and is never pressed.

**The Shopfront Rule.** A business is always shown as its shopfront: roof, fringe, sign, shutter,
in its own colours with its own lettering, the same in SVG, in 3D, in the mark and in the icon. The
shutter rolling is the brand's one movement.

**The Plaque Rule.** A plaque names what is fixed about a business or about the walk: a number, a
status, a town, a stop. It is enamel with a limewash rim, it carries `caption-4` or the card's own
words, and it is not a button.

## Components

Every state the build has is listed. A state the build lacks is named as missing and repeated under
Known Gaps. A state that is written and has no instance on any page yet is marked "no instance".
Hover and pressed states were read in code; a shutter's were also measured against the production
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
  written out; a hairline; the legal line and the credit in `caption-2`, "A Digital Experience by
  Khay Digital", with the agency's name in `body-4`.
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

A business as it stands on the street (`Shopfront.tsx`), drawn in its own colours with its own
lettering (Shapes). The name is real text beside it, so the drawing is hidden from assistive
technology; at the head of a listing, where it stands alone, it is an image named "LePalatier's
shopfront".

- **Rest:** the shutter is down.
- **Hover and focus-visible** on the link around it: the shutter rolls up by 88% over 900ms on
  `ease-roll`, onto the lit room, and the name underlines.
- **Pressed:** the whole shopfront scales to 0.985 over 160ms.
- **Open** (`open`, at the head of a listing): the shutter is up for good.
- **Arriving** (in the catalogue, where motion is welcome): the shop waits with its shutter up and
  rolls it down as it comes into view; an open one keeps it up.

Rest, hover, focus and open were measured against the production build on the terrace, in the
catalogue and at the head of a listing, with motion on and off; `npm run behaviour` asserts the
open and the hover states with motion on.

### The terrace and the shop card (signature)

- **The terrace** (`Terrace.tsx`, the home page): every business still for sale as one row, wall
  to wall under one roofline on one kerb, on the page's dusk. Each shop is one link: its shopfront,
  then, 12px in and 16px below, its plaques ("No. 01", then its status or "Sample"), its name in
  `heading-5`, its sector and its towns in `caption-2` and `ink-subtle`, and its price. Under 640px
  each shop is 64vw wide, the row scrolls sideways and snaps to a shop's edge; its scrollbar is thin
  and saffron.
- **The shop card** (`ShopCard.tsx`, the catalogue): the same parts as a card in a grid on
  limewash, each revealed as it arrives.
- **Price:** a real listing's is `title-4`. A sample's is `caption-2` in `ink-subtle` with tabular
  figures and the words "a placeholder", so it never reads as an offer.
- **Empty:** when every business is sold, a panel with 16px corners and a 1px edge in `line-strong`:
  "Every business on the street has been sold", a line, and a filled Enquire (no instance).

### The plaque (signature)

`.plaque` with `caption-4`: `plaque` and `on-plaque`, 6px corners, its rim, at least 28px tall.
Under a shopfront: the number, then the status (Available, Reserved or Sold) or "Sample". At the
head of a listing: the number, the status or "Sample", then one plaque for each town. On the street
in 3D the same plate, painted on a canvas, names the shop's first town on its pier. A plaque cannot
be pressed.

### The walk (signature)

- **The first screen:** the street behind the headline (`heading-1`), the lede (`title-1`, at most
  448px wide), a filled "See the businesses" and an arrow link to How it works. Where the street is
  live, a cue sits at the foot: "Walk the street" with the arrow turned down, a deep dusk pill 44px
  tall in `button-sm`, which turns enamel on hover and leads to the second stop. It shows only from
  1200px wide, where the foot of the first screen is open road; narrower, the street itself fills
  the foot and the cue is not shown.
- **The card** (live): a plaque at the size of a notice. Enamel, 12px corners, its rim, 28px of
  padding, at most 26rem wide: the stop's heading in `heading-3` and its line in `body-3`, both in
  `on-plaque`; the last card adds a filled "See the businesses". Where the walk is plain the card
  has no ground, rim or padding and its words take the page's ink.
- **The stops** (live, from 900px): a column of eight links on its own strip of deep dusk, 8px
  from the stage's right edge, with 12px corners and 6px by 4px of padding, so a mark keeps its
  contrast whatever the street shows behind it. Each link is 36px wide and 24px tall. A resting
  mark is 12px by 3px in `line-strong`; pointed at or focused, it grows to 20px in `ink` and its
  stop's name shows on a small plaque (4px corners, `caption-4`) that stands outside the column,
  10px to its left; the current stop's mark is 28px in `action`. Marks change over 320ms, names
  over 200ms. Each link is named for its stop ("The sign, stop 2 of 8") and carries `aria-current`.
- **The still** (plain): each stop's capture of the street, 4 by 3 on a phone and 16 by 10 from
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

**The Sample Rule.** A sample says so wherever it stands: a tag on its shutter in 3D, a plaque
beside its name, "a placeholder" at its price, a note on its page; the form never offers it. A
sample must never pass for an offer.

## Motion

**Principle:** things roll and switch on. A shutter rolls, a heading comes up the way a shutter
does, a sign's line lights. Content is visible by default; motion only enhances. Script adds
`can-animate` to the page only when motion is welcome, and only then does anything start hidden or
muted.

| Token | Value | Use |
|---|---|---|
| `ease-out` | cubic-bezier(0.16, 1, 0.3, 1) | Entrances and state changes |
| `ease-roll` | cubic-bezier(0.3, 0, 0.1, 1) | The shutter, and a heading rising out of its mask: it starts heavy and settles |
| `dur-press` | 120ms | A button squashing to 0.96; a chip to 0.97 |
| `dur-press-shop` | 160ms | A shopfront scaling to 0.985 |
| `dur-state` | 200 to 320ms | Field, chip, a question's colour, a stop's name, the cue 200; button fill and edge, link and arrow link underlines, skip link 240; arrow 280; the current page's line, the menu button 300; the plus, a stop's mark 320 |
| `dur-menu` | 200ms each, 50ms apart | The phone menu's links |
| `dur-word` | 500ms | One word of the tagline |
| `dur-reveal` | 800ms opacity, 900ms transform | A reveal |
| `dur-shutter` | 900ms | A shutter on a drawn shopfront |
| `dur-mask` | 1000ms | A masked heading |
| `dur-stage` | 900ms | The canvas fading in over its still |

### Choreography

| Moment | Trigger | What moves | Duration, delay, stagger | Easing |
|---|---|---|---|---|
| The street arrives | The stage is within 200px of the screen, WebGL 2 is there and the framing is known | The still is painted first. The canvas mounts, draws three frames, then fades in over the still; the still is taken away only once that fade has ended | 900ms | `ease-out` |
| The walk | The scroll, one screen to a stop | The camera travels from one stop's frame to the next, rising 0.3m on the way; the walked shop's shutter goes from a third down (0.34) to rolled up (0.04) between the address and the room behind it; the room's light and the light it throws on the paving follow the shutter | The camera rests for the first and last 22% of the way between two stops and travels through the middle; then it is smoothed toward its target | smoothstep, then an exponential approach (6 per second for the camera, 5 for a shutter) |
| A shutter by hand, in 3D | A click or a tap on a shop | That shop's shutter rolls up, or back down | About half a second | exponential approach |
| A shutter on a drawn shopfront | Hover or keyboard focus on its link | The shutter rolls up by 88% | 900ms | `ease-roll` |
| A shop arrives in the catalogue | Its reveal, where motion is welcome | The shutter stands raised until the card arrives, then rolls down; pointing at the shop raises it again at once, and an open shopfront keeps it up | 900ms; 90ms apart across a row of three | `ease-roll` |
| A reveal | 12% of the element is in view, 6% above the foot of the screen; once | It rises 18px and fades in | 800ms opacity, 900ms transform; a second column 120ms later; steps 90ms apart | `ease-out` |
| A masked heading | Its reveal | Each child comes up out of a clip that opens from the foot | 1000ms | `ease-roll` |
| The tagline lights | The line crosses the screen, from its top at 85% of the height to its foot at the middle | Each word goes from 0.5 of the ink (3.77:1) to full ink, in reading order; a word lit stays lit, and all are lit by the page's end | 500ms a word | `ease-out` |
| A stop's mark | The walk reaches a stop; a pointer | The current mark grows to 28px and turns saffron; a mark pointed at grows to 20px and shows its name | 320ms; the name 200ms | `ease-out` |
| The phone menu arrives | The menu opens | Each link, then the two routes, rises 24px and fades in, in reading order | 200ms each, 50ms apart; five items, so the last is in at 400ms. Closing is a cut | `ease-out` |
| The menu button | The menu opens or closes | Its two strokes turn into the close mark | 300ms | `ease-out` |
| State changes | Hover, press, focus, open | The fill, the edge, the underline, the arrow's 4px, a button's squash, a chip's, a shopfront's, the plus turning 45 degrees, the current page's line, the skip link sliding in | 120 to 320ms, as in the table above | `ease-out` |
| Smooth scrolling | Wheel and trackpad | Lenis eases the page (`lerp: 0.1`). Touch keeps the platform's own momentum. A new page starts at the top | Continuous | Lenis |

### Story map

The stops are data (`src/data/walk.ts`) and are evenly spaced: stop n of 8 sits at (n - 1) / 7 of
the walk's scroll, one screen apart. The frames are `src/components/three/timeline.ts`. STORY.md
has the same eight.

| Stop | Scroll | Camera or subject | Shutter | Words |
|---|---|---|---|---|
| 1 The street | 0 | The row at an angle from the pavement, LePalatier large at the right | 0.34 | The headline, the lede, "See the businesses" |
| 2 The sign | 1/7 | Up at the board, its lettering and its two lamps | 0.34 | "The sign is already painted" |
| 3 The address | 2/7 | The pier, square on: the town's plaque and the letterbox | 0.34 | "Its address is held for you" |
| 4 Behind the shutter | 3/7 | The doorway, front on: a screen on the back wall in the brand's colours | 0.04 | "The website is built" |
| 5 The counter | 4/7 | Inside, over the counter: the plan with its cover up | 0.04 | "The strategy is on the counter" |
| 6 The wall | 5/7 | Inside, turned to the left wall: a certificate in its frame | 0.04 | "We help you set up the company" |
| 7 The room | 6/7 | Back on the pavement, front on: the room, lit | 0.04 | "The room is yours to fill" |
| 8 The whole street | 1 | Further back: the whole row, one room lit | 0.04 | "Every shop here will have one owner", "See the businesses" |

The camera holds at each stop for 22% of a screen before it and 22% after, so a visitor who stops
scrolling has a still picture to read beside.

### Reduced motion and no script

Under `prefers-reduced-motion: reduce`, script does not add `can-animate` and does not start Lenis,
a block in `globals.css` cuts every duration and delay to nothing, and the street is told
(`stage.reduced`).

| Movement | `prefers-reduced-motion: reduce` | Without script or WebGL |
|---|---|---|
| The street arrives | The canvas replaces the still at once | The still stays, with its description; the walk stays plain sections |
| The walk | The camera cuts from one stop to the next at the halfway point; nothing is smoothed; the shutter cuts | Eight plain sections, seven with a still of the street at that stop |
| A shutter by hand, in 3D | It cuts between down and up | There is no canvas to touch |
| A shutter on a drawn shopfront | It cuts up on hover and focus, and down again | It rolls, from CSS alone |
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
once, so nothing needs a pause control. At rest the street draws no frames at all.

### Named Rules

**The Visible First Rule.** Every word is visible in the markup; only `html.can-animate` may hide
or mute anything, and never below 3:1. A crawler, a visitor without script and a visitor who asked
for less motion all get the whole page.

**The Shutter Curve Rule.** `ease-roll` belongs to a shutter and to a heading rising out of its
mask; everything else takes `ease-out`. A roller shutter starts heavy and settles, and that one
curve is the brand's own.

**The Hold Rule.** The camera rests at each stop for the first and last 22% of the way to the next,
and under reduced motion it cuts. A visitor who stops scrolling then has a still picture to read
beside.

## Scene & 3D

- **Stack:** three.js 0.186 (r186) and React Three Fiber 9.7, on the home page only, downloaded in
  the browser by `next/dynamic`. One canvas. Output sRGB, ACES Filmic tone mapping, exposure 1.08,
  set once. Antialiased, opaque. No shadow maps and no post-processing.
- **Renders on demand:** `frameloop` is "demand" on screen and "never" off it. Every frame while
  something moves (a scroll, a shutter, the camera until every part of it has arrived); nothing at
  rest; nothing off screen. A moving pointer asks for no frames, because nothing follows it.
- **Made from:** code. Every shop is boxes and planes from one set of measurements (5m wide, a 4m
  wall, a 3.2m by 2.7m opening, 22 slats), each standing 0 to 0.5m taller than its neighbour under
  its own tin roof, painted in its listing's wall colour, with its sign in its board colour, trim
  and lettering. Every texture but one is painted on a canvas in the browser
  (`three/textures.ts`): the signs, the plaques, a sample's tag, the slats, the ribs, the fringe,
  the paving, the tar, the basalt wall, the palms, a lamp's glow, the screen, the plan's cover and
  the certificate. A sign draws the same outline of its name that the pages draw. No model is
  downloaded.
- **The one generated image:** the sky, a painted blue hour (S8), on the inside of a wide drum
  round the street: 2400 by 1029 on the high tier, 1200 by 514 on the low, cut and graded darker
  through its upper band to the mock-up's sky by `scripts/prepare-plates.mjs`. It is neither fogged
  nor tone mapped. Each file has a record beside it with the prompt.
- **A sample on the street:** a white "Sample" tag rides its shutter and hangs under the housing
  when the shutter is rolled away, so a sample stays marked whatever is done to its shutter.
- **What the walked shop holds:** a letterbox in the business's own trim under its plaque, a screen
  on the back wall drawn in the brand's colours, a counter along the right wall with the plan on
  it, and a framed certificate on the left wall. The screen and the certificate show shapes, not
  words; the plan's cover carries the lettering and the words "Business strategy".
- **Light:** a hemisphere light, a warm afterglow from the horizon's side and a cool fill; fog in
  `dusk` from 22m to 110m. Each lamp has a painted glow, a sprite that faces the camera, and a
  painted pool down its wall, both added to what is behind them, on both tiers; a sign's board
  paints its own lamplight, so pale lettering on a pale board is not washed out. On the high tier
  every shop also has a point light on its sign and one in its room; the room's rises as its
  shutter does (0 to 18), and a painted spill on the paving follows it. The street lamp at the far
  end has its own.
- **The scene's own palette:** `three/palette.ts`, apart from the CSS tokens on purpose, because
  light and tone mapping change a colour. It also names the street's ink, paper, seal, palm and
  fill light. Five of its values are the CSS palette's, written again by hand: `dusk`, `limewash`,
  `enamel`, `ink` and the seal's saffron.
- **Brand colour under light** (live, 1440 by 900, a software renderer, region medians):
  LePalatier's wall, #711425 as a material, renders #48000d in shade and #a90017 between its lamps;
  its board, #4a1626, renders #4f111d to #52121e; a plaque's enamel, #0b2b8e, renders #001b9c; a
  shutter renders #4a374f against the mock-up's #574c64 and #655366; the lit room's wall renders
  #e3a353 against the mock-up's #e0842c.
- **Camera:** eight stops, each with a frame for a desk and one for a phone (under 900px): where
  it stands, what it looks at, its field of view, and a shift of the picture's centre so the
  subject stands clear of the words (to the right on a desk, upward on a phone). The first and last
  frames were solved against the approved mock-up's layout, at 1440 by 828 and 390 by 772, not
  placed by eye: the camera stands low (1.05m to 1.65m) and the picture is shifted down, as an
  architectural photograph is, so walls stay upright. Those four frames carry an anchor, a point
  on the screen that must not move: the first shop's pier at the right edge, with its paving in
  frame. One function, `fit`, gives a frame's field of view and its two shifts for a stage of any
  size. The anchor stays where it was solved to be as the stage gets wider or narrower. Where the
  stage is shorter than the first frame's words need (780px on a desk, 760px on a phone), or
  narrower than the shape it was solved at, the camera draws back about the anchor, widening its
  view by up to 1.6 times, so the street grows smaller under the words and keeps its pavement.
  See Motion, Story map.
- **Tiers:** high on a wide screen; low on a narrow one (under 900px), on a device that cannot hold
  its frame rate, or with `?tier=low`. Low lights the walked shop only and loads the smaller sky.
  Resolution steps down before the tier does: the pixel ratio starts at up to 1.5 (1.25 narrow) and
  is stepped between 1 and that ceiling in quarters; three slow windows at a ratio of 1 drop to the
  low tier.
- **Budgets:** none is written down. Counted from the code, not from the renderer: 231 drawn
  objects, none instanced, of which 13 are the lamps' glow sprites (42 for the walked shop, 34 for
  each sample, 19 for the sky, the ground and the two ends); 13 point lights on the high tier and 3
  on the low; signs at 1024 by 256, plaques at 512 by 176.
- **The stills:** `npm run stills` loads the home page with `?debug`, which hands the scene's clock
  to the script, and captures the stage at every stop with the words hidden: 1600 by 920 for a
  desk and 780 by 1544 for a phone, as WebP, each with a record that says it is a capture of this
  site's own 3D and not a model's picture. The first desk frame also makes the link preview card.
  They are what a visitor sees before the canvas has drawn, and instead of it.
- **Fallbacks:** the page is whole before any of this runs. As prerendered, every stop is a plain
  section with its still and its words. With `?no3d`, without WebGL 2 or without script, it stays
  so, and the first screen keeps its still with a description. If the 3D throws, an error boundary
  keeps the still and the walk turns plain. Under reduced motion the camera cuts and nothing is
  drawn at rest. A lost context is caught so the browser can restore it.
- **Accessibility:** the canvas is hidden from assistive technology, and every fact the street
  shows also exists as text in the stop's card. A shutter in 3D answers a pointer only; it is play
  and carries nothing a visitor needs.

### Named Rules

**The Still First Rule.** A still of the street is painted before the canvas and stays wherever the
canvas cannot run; the 3D is an addition to a page that is already complete. The stage is never
empty.

**The Built In Code Rule.** Every shop is boxes and planes, every texture but the sky is painted on
a canvas, and nothing is a downloaded model. A new business then costs one entry of data, not one
asset.

**The Same Outline Rule.** A listing's lettering is one outline, drawn by `npm run wordmarks`, and
the flat shopfront, the sign plates and the 3D sign all draw it. A sign and its page cannot
disagree.

## Responsive Behavior

Breakpoints are Tailwind's own, 640, 768 and 1024px, and two of this build's: 900px, where the
walk changes, and 1200px, from which the walk's cue shows. On a stage too short or too narrow for
the words above the street, the camera draws back and the street grows smaller under them (Scene &
3D, Camera). The fluid values run from 390 to 1440.

| Name | Width | Layout | Type | Scene tier |
|---|---|---|---|---|
| Phone | under 640px | One column. The terrace's shops are 64vw each and scroll sideways. The catalogue is two to a row. Gutter 24px, sections 64px. The header holds the mark, WhatsApp and the menu button. The steps run down the page. On Enquire the direct routes come before the form | `heading-1` 48px, `heading-2` 36px, `heading-3` 30px at 390 | low; the phone's frames; the words above the street, a stop's card at the foot; no cue |
| Small | from 640px | The terrace's shops are at least 216px. A listing's two sign plates sit side by side and its paints four across. The footer has two columns | Fluid | low |
| Middle | from 768px | The header shows its pages, and its WhatsApp and menu button go. The four steps stand in a row under one line | Fluid | low |
| Story | from 900px | The walk takes the desk's frames. A stop's card sits at the left, centred; the stop marks appear. Plain, a still sits beside its words | Fluid | high |
| Wide | from 1024px | The catalogue is three to a row. Sections take two columns. A heading stays beside its list. On Enquire the form leads and the direct routes sit beside it. The footer has three columns | Fluid | high |
| Desk | 1440px and up | Gutter 72px at 1440 and 80px from 1600. Content stops at 1280px. The terrace's six shops fit without scrolling | `heading-1` 96px, `heading-2` 60px, `heading-3` 36px, and no larger | high |

**Touch targets:** at least 44px for buttons (48px), the small buttons, chips, fields (48px), the
menu button, the mark, header links (72px), arrow links (48px), the walk's cue, the back link, the
footer's links and the credit, a question and the phone menu's links (64px), and the next business
(96px); exceptions: a stop's mark is 36px wide and 24px tall, on screens from 900px only, and a link
in a sentence is one line tall. **Collapsing:** the header's pages move into the phone menu under
768px; the terrace scrolls sideways where it is wider than the screen; the catalogue goes from three
to two to a row; the steps turn from a row to a column; a stop's card moves from the left of the
stage to its foot. The captures show no page scrolling sideways at 390px (README, "Verification").

## Do's and Don'ts

### Do

- **Do** fill one action in a group with `primary` #f8c618, set its label in `on-primary` #0a1639
  (11.02:1), and put a quiet button or an arrow link beside it
  (The One Saffron Rule, The One Filled Rule).
- **Do** paint a listing's colours only on its shopfront, its sign plates and its paints, and set
  every word on a board in that listing's lettering colour through `[data-ground="brand"]`
  (The Own Sign Rule).
- **Do** change a ground by redefining roles in a scope, as `[data-ground="saffron"]` does, and
  leave every `--palette-*` value alone (The Roles Not Values Rule).
- **Do** set a heading, a plaque and a price in Barlow Condensed capitals by `text-transform`, and
  every sentence in Geist (The Painted Sign Rule).
- **Do** keep the slant for `heading-1` on the home page's first screen, and the coral shade for
  that headline and the tagline (The One Slant Rule).
- **Do** give every piece of text one of the seventeen named styles (The Named Style Rule).
- **Do** keep the shopfronts in the first screen of the home page, under the headline
  (The Street First Rule).
- **Do** hang a lambrequin in the colour of the ground above it where two grounds meet
  (The Roof Line Rule).
- **Do** separate one part of a page from the next with a ground or a hairline, and put anything
  that sits over the live street on a solid ground of its own
  (The Flat Interface Rule, The Solid Over The Street Rule).
- **Do** round anything pressed that is a control to a full pill, at least 48px tall, or 44px for
  the small button, a chip and the cue (The Pill Rule).
- **Do** show a business as its shopfront, from `Shopfront.tsx` and the data, and name what is
  fixed about it on a plaque in `enamel` #0b2b8e with a limewash rim
  (The Shopfront Rule, The Plaque Rule).
- **Do** say a status, a sample, an error and the current page in words or as a mark, and mark a
  sample on its shutter, beside its name and at its price
  (The Words Not Colour Rule, The Sample Rule).
- **Do** leave every word visible in the markup, roll a shutter and a masked heading on
  `ease-roll`, and give each new movement its row under "Reduced motion and no script"
  (The Visible First Rule, The Shutter Curve Rule, The Hold Rule).
- **Do** paint a still first, build every shop in code, and draw a sign from the same outline as
  its page (The Still First Rule, The Built In Code Rule, The Same Outline Rule).

### Don't

- **Don't** set words in saffron on limewash or fill a second button in a group: saffron on
  limewash measures 1.49:1 (The One Saffron Rule, The One Filled Rule).
- **Don't** put the platform's ink, a grey or another listing's colour on a listing's board: only
  its own pair is measured, from 6.09:1 to 12.17:1 (The Own Sign Rule).
- **Don't** redefine a palette value inside a scope, or paint with a raw hex or one of Tailwind's
  colours: those are switched off and paint nothing (The Roles Not Values Rule).
- **Don't** set a sentence in Barlow Condensed or type capitals into the markup: the capitals are
  `text-transform` (The Painted Sign Rule).
- **Don't** slant a second heading, shade a third line, or set words in coral: it measures 3.09:1
  on dusk (The One Slant Rule).
- **Don't** set a loose size or weight, a weight over 700 or text under 12px
  (The Named Style Rule).
- **Don't** open the home page with a claim, a picture of something else or a band of logos ahead
  of the street: the businesses are the proof (The Street First Rule).
- **Don't** rule a line between two sections or hang a fringe in a colour that is not the ground
  above it (The Roof Line Rule).
- **Don't** cast a soft shadow, fill with a gradient or blur a ground in the interface, and never
  lay a blur or a scrim over the live street (The Flat Interface Rule, The Solid Over The Street
  Rule).
- **Don't** square a button or a chip, round a plaque into a pill, or make a plaque a button
  (The Pill Rule, The Plaque Rule).
- **Don't** show a business as a photograph, a logo tile or a boxed card: it is a shopfront
  (The Shopfront Rule).
- **Don't** mark a sample, a status or an error by colour alone, add an error colour, or let a
  sample's price stand without "a placeholder" (The Words Not Colour Rule, The Sample Rule).
- **Don't** start anything hidden without `html.can-animate`, mute the tagline below 0.5 of the
  ink (3.77:1), loop a movement, or move the camera while a visitor rests at a stop
  (The Visible First Rule, The Shutter Curve Rule, The Hold Rule).
- **Don't** download a model, ship a second generated image, leave the stage empty while the
  canvas arrives, or letter a 3D sign by hand (The Still First Rule, The Built In Code Rule, The
  Same Outline Rule).

## Agent Guide

**Quick reference:**

- Ground: `dusk` #0e328f; the header and the footer `dusk-deep` #082478; one wall `primary`
  #f8c618; reading sections `limewash` #f7f7f8.
- Words: `limewash` on dusk, secondary `haze` #b6c0db; `ink` #0a1639 on saffron and limewash,
  secondary `ink-on-saffron` #3e3d32 and `ink-muted` #515972.
- Action: `primary` #f8c618 with `on-primary` #0a1639; hover and press `primary-dark` #e3b30d. On
  limewash the action is dusk with limewash words; on saffron, ink with limewash words.
- Lines: an edge `line-strong` (limewash at 55% on dusk, ink at 55% on light); between rows `line`
  (limewash at 20%, ink at 22% on saffron, ink at 16% on limewash).
- Focus: a 2px outline, 3px out: saffron on dusk and deep dusk, dusk on limewash, ink on saffron.
- Radius: a pill for anything pressed; 16px for panels and sign plates; 12px for fields, paints
  and the walk's card; 6px for a plaque.
- Type: Barlow Condensed capitals for signs (`heading-1` 48 to 96px, italic, shaded; `heading-2` 36
  to 60px); Geist for sentences, `body-3` at 16px; `caption-4` on a plaque.
- Page: gutter `clamp(1.5rem, 5vw, 5rem)`; sections `clamp(4rem, 10vw, 8rem)`; content at most
  1280px; text 62ch; hero 680px; header 72px.
- Motion: `ease-out` cubic-bezier(0.16, 1, 0.3, 1); `ease-roll` cubic-bezier(0.3, 0, 0.1, 1) for a
  shutter, 900ms; a reveal rises 18px over 800 and 900ms.
- Facts are data: `src/data/site.ts`, `src/data/businesses.ts`, `src/data/pack.ts`,
  `src/data/walk.ts`.

**Audit before calling a page done:**

1. Grounds, inks and the one filled action per group hold; no stray grey, no second accent, no
   listing's colour off its own shopfront, plates or paints.
2. Every text pair is in Contrast, floored and passing, or listed under Gaps; anything over the
   live street stands on a solid ground or has been sampled from 360 to 1920 wide.
3. Hover, focus-visible and pressed states exist for everything pressable, or the missing one is
   under Known Gaps.
4. Every movement has its row under "Reduced motion and no script"; the page is whole without
   script, with `?no3d` and without WebGL.
5. `npx --yes @google/design.md@0.4.0 lint DESIGN.md` gives 0 errors; `node scripts/check-design.mjs`
   passes; `npm run tokens`, `npm run copy`, `npm run contrast` and `npm run behaviour` pass; fresh
   screenshots at 390 and 1440 have been read, and `npm run stills` has been run after any change
   to the street.

**Prompts:**

- "Add a listing to `src/data/businesses.ts` with a wall, a board, a lettering colour and a trim,
  and its wordmark to `scripts/make-wordmarks.mjs`, in a face under the SIL OFL 1.1. Give the
  lettering at least 4.5:1 on the board with `scripts/contrast.mjs`, add the pair to
  `scripts/contrast.pairs.json`, add its tokens and its row to DESIGN.md, and run `npm run stills`.
  Change no component."
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

- The tree is final, with its last fixes not yet committed. The finish review of 17 November 2026
  answered "fix" with eight points (`.impeccable/review/finish-review.md`); its fixes are commit
  0ca61e9, and the fixes to what its verdict pass and this record found are in the working tree.
  Run again for this record: `npm run tokens` (0 fail, 1 warn), `npm run copy` (0 fail) and
  `npm run contrast` (every pair passes for its role). The captures, the accessibility pass, the
  reveals and `npm run behaviour` were run by the build and are not repeated here.
- impeccable's plates and hero pixel gates were not run for the street. The owner chose live 3D
  over a raster plate, so the tool's `plates` phase stayed open ("plate missing for street") and
  `hero`, `sections`, `motion` and `responsive` never opened. The mock-up was the composition
  reference. The measured comparison of the final build is in `.impeccable/review/diff/final`
  (08:56 UTC): 51% overall (0.507, read by the tool as "contradicted"), structure 0.34, colour
  0.59, palette match 0.72, detail 0.515; the street region 0.48, the sky 0.53, the headline 0.51.
  Earlier builds measured 53% before the fixes and 50% part way through them. The first screen has
  been judged by eye against the mock-up, not proven by measurement.
- Against the mock-up the build differs by decision or by medium: the street is drawn live, not
  painted; each sign carries its listing's real lettering; the walked shop's room holds a screen,
  a counter and a frame; the roofs have no brackets; the next section does not show at the foot of
  the first screen, where a cue stands in its stead.
- Hover and pressed states were read in code, not captured. A shutter's rest, hover, focus and
  open states were measured against the production build, on the terrace, in the catalogue and at
  the head of a listing.
- Not run: any real GPU, phone or tablet; frame rate on a device; a keyboard pass by hand on a
  device; a screen reader; Lighthouse (README, "Verification").
- English only. French and Kreol are not built, and the routes are not under a language folder.
- The sample listings' colours and lettering are placeholders, and LePalatier's are a first
  direction to confirm.
- The kit's dev-only foundations page is not built, so no sheet shows every role, style and step
  bound to the real tokens.

**Where the build differs from what is written**

- A shutter in 3D answers a pointer only. It has no keyboard equivalent and no name, and the
  cursor is the only cue that it can be raised.
- Under light the walked shop's wall renders darker and redder than its sample: #48000d in shade
  against #711425.
- Without script the phone menu does not open, so under 768px the header offers the mark and
  WhatsApp and no pages; the footer carries them. The request form is sent by script: without
  script it shows a notice, and its fields do nothing.
- Read from the palette and not through a role: the skip link, the selection and the scrollbar,
  the page's own background, the stage's ground, the walk's cue and the strip under the stop
  marks, the mark, every fill in the drawn shopfront, the 404's kerb, and each lambrequin's colour,
  the footer's included.
- The mark's name is `heading-5` with its capitals and its tracking switched off by two utilities,
  and a paint's code is `caption-2` with capitals added by one: two variants with no name of their
  own.
- Off the spacing scale in `globals.css`: a plaque's 10px of side padding, the walk card's 28px of
  padding and the 6px of padding above and below the stop marks.
- Two radii have more than one use: 12px (fields, paints, the sample note, the walk's card, the
  strip under the stop marks) and 16px (sign plates, panels, plain stills).
- States not designed: hover on the mark; pressed on an arrow link, a header link, a question, a
  stop's mark, the menu button and the cue. `Reserved` and `Sold` have a label and no instance.
- States written with no instance on any page: a disabled quiet button, a disabled field, a
  disabled chip, the empty street, a filled action on limewash and on saffron, the page with prices
  switched off.
- A stop's mark is 36px wide and 24px tall, under the 44px the rest keep.

**Declared and unused**

- `--palette-amber` #e48627 ("the lamps' light") and `--palette-asphalt` #383141 ("the road") are
  declared and read by nothing; the street takes its light and its road from `three/palette.ts`.
- The `caption-3` text style, the `--ease-in-out` curve and the `--breakpoint-story` token are
  declared and used by nothing. The 900px breakpoint is written out by hand in three media queries
  and two media strings, and the cue's 1200px in one.
- `--brand-wall` and `--brand-accent` are declared, and the second is set on a listing's sign
  plates, but no rule reads either; a shopfront takes its colours from its own inline variables.
- `paper-subtle` is read only by a disabled filled action and a disabled field, so its values on
  deep dusk, saffron and limewash paint nothing yet. On a listing's board, `line` is defined and
  nothing draws it, and `focus` is not turned because nothing there takes focus.
- `stage.pointer` is declared and neither written nor read.

**Not yet traced**

- The derived values (`primary-dark`, `ink-muted`, `ink-on-saffron`, `haze`, `tin-shade`) are
  recorded with their direction and their reason. The build does not write down the operation that
  gave each value.
- The scene's palette (`three/palette.ts`) was set so the rendered street reads as the mock-up.
  Its values are not each traced to a measurement, and a lamp's painted light and a slat's
  highlight are still written where they are used, in `three/textures.ts`.
- The solver that gave the first and last camera frames is not in the repository; `timeline.ts`
  holds its results only.
- Geist was carried over from the first build. The mock-up's sentences were measured as a sans of
  normal width and were not matched to a face.
