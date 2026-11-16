---
version: alpha
name: "biznes.mu, the website"
description: "The rail: every business hangs ready on one rail, as a tag in its own colours and lettering. The palette is chosen, since the brand had no earlier material to sample: warm paper, a warm dark ink and one tag yellow, which fills the one action."
# On Google Labs' DESIGN.md format (npx @google/design.md lint DESIGN.md), from the KOS template.
# Every colour and typeface cites a Source ID (Overview, Sources). biznes.mu is a new brand, so the
# platform's values are 'chosen: <reason>'. 'derived' means worked out from a chosen value, with the
# direction and the reason. The ground-* colours are each listing's own identity, read from
# src/data/businesses.ts: content, not the platform's palette.
colors:
  primary: "#e6b93f"                    # S3; chosen: tag yellow, the colour of a price tag; saturation 77%; carries ink at 10.17:1
  primary-dark: "#d6a62b"               # derived from primary: darker, the fill on hover and press; carries ink at 8.36:1
  on-primary: "#131209"                 # ink, the words on the yellow; see Contrast
  paper: "#f5f2ea"                      # S3; chosen: a warm paper, so six brands' colours can sit on it
  paper-quiet: "#ece7db"                # derived from paper: a step darker, for a quieter panel
  ink: "#131209"                        # S2; chosen: the warm dark from Elaya's ladder, since the brand has no dark of its own
  ink-muted: "#5c584b"                  # derived from ink toward paper: secondary words; 6.35:1 on paper, 5.76:1 on paper-quiet
  ink-muted-night: "#b4ae9c"            # derived from paper toward ink: secondary words on night; 8.47:1 on ink
  line: "rgba(19, 18, 9, 0.14)"         # derived: ink at 14%, the hairline between rows
  line-strong: "rgba(19, 18, 9, 0.55)"  # derived: ink at 55%, the rail, the string and a field's edge; 4.01:1 on paper
  line-night: "rgba(245, 242, 234, 0.16)"         # derived: paper at 16%, the hairline on night
  line-strong-night: "rgba(245, 242, 234, 0.55)"  # derived: paper at 55%, the rail on night; 5.64:1 on ink
  ground-lepalatier: "#4a1626"          # S3, content: LePalatier's ground, "Bordeaux"; chosen, a first direction, to confirm
  ground-lepalatier-ink: "#f3e9d8"      # S3, content: its ink, "Ivory"; 12.17:1 on its ground
  ground-lepalatier-accent: "#c6a15b"   # S3, content: its third colour, "Brass"; a swatch only
  ground-lakrem: "#fcefd9"              # S3, content: Lakrem (sample), "Cream"; a placeholder
  ground-lakrem-ink: "#a61e3c"          # S3, content: "Cherry"; 6.43:1 on its ground
  ground-lakrem-accent: "#8fb37a"       # S3, content: "Pistachio"; a swatch only
  ground-souffle: "#dce2d6"             # S3, content: Souffle (sample), "Pale sage"; a placeholder
  ground-souffle-ink: "#2e3b33"         # S3, content: "Deep sage"; 8.88:1 on its ground
  ground-souffle-accent: "#c28766"      # S3, content: "Clay"; a swatch only
  ground-bouke: "#1f3a2d"               # S3, content: Bouké (sample), "Forest"; a placeholder
  ground-bouke-ink: "#f4cfc9"           # S3, content: "Blush"; 8.59:1 on its ground
  ground-bouke-accent: "#e98a6e"        # S3, content: "Coral"; a swatch only
  ground-larout: "#0e5f6b"              # S3, content: Larout (sample), "Lagoon"; a placeholder
  ground-larout-ink: "#f7e9cc"          # S3, content: "Sand"; 6.09:1 on its ground
  ground-larout-accent: "#f2a65a"       # S3, content: "Amber"; a swatch only
  ground-kazprop: "#ddeafb"             # S3, content: Kazprop (sample), "Sky"; a placeholder
  ground-kazprop-ink: "#1b46c2"         # S3, content: "Cobalt"; 6.37:1 on its ground
  ground-kazprop-accent: "#7ed6b5"      # S3, content: "Mint"; a swatch only
typography:                             # named as the text styles in src/app/globals.css; fontSize is the clamp() maximum, the full clamp() is in Typography, Hierarchy
  heading-1: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 4.5rem, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.035em" }
  heading-2: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 3rem, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.03em" }
  heading-3: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 2.25rem, fontWeight: 600, lineHeight: 1.11, letterSpacing: "-0.025em" }
  heading-5: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 1.5rem, fontWeight: 600, lineHeight: 1.33, letterSpacing: "-0.02em" }
  title-1: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 1.25rem, fontWeight: 500, lineHeight: 1.4, letterSpacing: "-0.01em" }
  title-2: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 1.125rem, fontWeight: 400, lineHeight: 1.56 }
  title-3: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 1rem, fontWeight: 500, lineHeight: 1.5 }
  # The build sets font-variant-numeric: tabular-nums lining-nums on the two mono styles; fontFeature is its font-feature-settings equivalent.
  title-4: { fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, monospace", fontSize: 0.875rem, fontWeight: 500, lineHeight: 1.43, fontFeature: "'tnum', 'lnum'" }
  body-1: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 1rem, fontWeight: 600, lineHeight: 1.5 }
  body-3: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 1rem, fontWeight: 400, lineHeight: 1.5 }
  body-6: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 0.875rem, fontWeight: 400, lineHeight: 1.43 }
  button-md: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 1rem, fontWeight: 600, lineHeight: 1.5 }
  button-sm: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 0.875rem, fontWeight: 600, lineHeight: 1.43 }
  caption-2: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 0.875rem, fontWeight: 400, lineHeight: 1.43 }
  caption-3: { fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif", fontSize: 0.75rem, fontWeight: 600, lineHeight: 1.33 }
  caption-4: { fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, monospace", fontSize: 0.75rem, fontWeight: 500, lineHeight: 1.33, letterSpacing: "0.02em", fontFeature: "'tnum', 'lnum'" }
rounded: { field: 0.75rem, tag: 1rem, pill: 9999px }   # steps of Tailwind's radius scale: rounded-xl, rounded-2xl, rounded-full
spacing: { gutter: 5rem, section: 8rem, shell: 80rem, measure: 62ch, measure-hero: 42.5rem, nav: 72px }   # the page rhythm, each at its maximum; inside components only the thirteen steps
components:                             # only: backgroundColor textColor typography rounded padding size height width. States are sibling keys.
  button-primary: { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", typography: "{typography.button-md}", rounded: "{rounded.pill}", padding: "0.5rem 1.5rem", height: 3rem }
  button-primary-hover: { backgroundColor: "{colors.primary-dark}", textColor: "{colors.on-primary}" }
  button-primary-pressed: { backgroundColor: "{colors.primary-dark}", textColor: "{colors.on-primary}" }
  button-primary-disabled: { backgroundColor: "{colors.paper-quiet}", textColor: "{colors.ink-muted}" }
  button-primary-sm: { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", typography: "{typography.button-sm}", rounded: "{rounded.pill}", padding: "0.25rem 1rem", height: 2.75rem }
  button-quiet: { backgroundColor: "{colors.paper}", textColor: "{colors.ink}", typography: "{typography.button-md}", rounded: "{rounded.pill}", padding: "0.5rem 1.5rem", height: 3rem }
  arrow-link: { backgroundColor: "{colors.paper}", textColor: "{colors.ink}", typography: "{typography.button-md}", height: 3rem }
  skip-link: { backgroundColor: "{colors.ink}", textColor: "{colors.paper}", typography: "{typography.button-sm}", rounded: "{rounded.pill}", padding: "0.75rem 1.5rem" }
  field: { backgroundColor: "{colors.paper}", textColor: "{colors.ink}", typography: "{typography.body-3}", rounded: "{rounded.field}", padding: "0.75rem 1rem", height: 3rem }
  field-label: { backgroundColor: "{colors.paper}", textColor: "{colors.ink}", typography: "{typography.title-3}" }
  field-error: { backgroundColor: "{colors.paper}", textColor: "{colors.ink}", typography: "{typography.body-6}" }
  chip: { backgroundColor: "{colors.paper}", textColor: "{colors.ink}", typography: "{typography.body-3}", rounded: "{rounded.pill}", padding: "0.5rem 1rem", height: 2.75rem }
  chip-selected: { backgroundColor: "{colors.ink}", textColor: "{colors.paper}" }
  header: { backgroundColor: "{colors.paper}", textColor: "{colors.ink}", typography: "{typography.title-3}", height: 72px }
  menu-link: { backgroundColor: "{colors.paper}", textColor: "{colors.ink}", typography: "{typography.heading-3}", height: 4rem }
  logo-name: { backgroundColor: "{colors.paper}", textColor: "{colors.ink}", typography: "{typography.body-1}" }
  hero-heading: { backgroundColor: "{colors.paper}", textColor: "{colors.ink}", typography: "{typography.heading-1}" }
  section-heading: { backgroundColor: "{colors.paper}", textColor: "{colors.ink}", typography: "{typography.heading-2}" }
  row-heading: { backgroundColor: "{colors.paper}", textColor: "{colors.ink}", typography: "{typography.heading-5}" }
  row-title: { backgroundColor: "{colors.paper}", textColor: "{colors.ink}", typography: "{typography.title-1}" }
  lede: { backgroundColor: "{colors.paper}", textColor: "{colors.ink-muted}", typography: "{typography.title-2}" }
  body-on-paper: { backgroundColor: "{colors.paper}", textColor: "{colors.ink}", typography: "{typography.body-3}" }
  muted-on-paper: { backgroundColor: "{colors.paper}", textColor: "{colors.ink-muted}", typography: "{typography.caption-2}" }
  body-on-quiet: { backgroundColor: "{colors.paper-quiet}", textColor: "{colors.ink}", typography: "{typography.body-3}" }
  muted-on-quiet: { backgroundColor: "{colors.paper-quiet}", textColor: "{colors.ink-muted}", typography: "{typography.body-3}" }
  body-on-night: { backgroundColor: "{colors.ink}", textColor: "{colors.paper}", typography: "{typography.body-3}" }
  muted-on-night: { backgroundColor: "{colors.ink}", textColor: "{colors.ink-muted-night}", typography: "{typography.body-3}" }
  price: { backgroundColor: "{colors.paper}", textColor: "{colors.ink}", typography: "{typography.title-4}" }
  tag-number: { backgroundColor: "{colors.paper}", textColor: "{colors.ink-muted}", typography: "{typography.caption-4}" }
  sample-mark: { backgroundColor: "{colors.paper}", textColor: "{colors.ink}", typography: "{typography.caption-4}", rounded: "{rounded.pill}", padding: "0.125rem 0.5rem" }
  platform-tag: { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", typography: "{typography.caption-4}" }
  selection: { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}" }
  tag-hole: { backgroundColor: "{colors.paper}", rounded: "{rounded.pill}", size: 0.875rem }
  step-ring: { backgroundColor: "{colors.paper}", rounded: "{rounded.pill}", size: 1rem }
  focus-ring: { backgroundColor: "{colors.ink}", width: 2px }
  focus-ring-night: { backgroundColor: "{colors.primary}", width: 2px }
  rail: { backgroundColor: "{colors.line-strong}", height: 1px }
  rail-night: { backgroundColor: "{colors.line-strong-night}", height: 1px }
  divider: { backgroundColor: "{colors.line}", height: 1px }
  divider-night: { backgroundColor: "{colors.line-night}", height: 1px }
  # One per listing: its ground with its ink, so the linter checks the pair. The accent is a swatch and carries no words.
  tag-lepalatier: { backgroundColor: "{colors.ground-lepalatier}", textColor: "{colors.ground-lepalatier-ink}", typography: "{typography.caption-4}", rounded: "{rounded.tag}" }
  tag-lakrem: { backgroundColor: "{colors.ground-lakrem}", textColor: "{colors.ground-lakrem-ink}", typography: "{typography.caption-4}", rounded: "{rounded.tag}" }
  tag-souffle: { backgroundColor: "{colors.ground-souffle}", textColor: "{colors.ground-souffle-ink}", typography: "{typography.caption-4}", rounded: "{rounded.tag}" }
  tag-bouke: { backgroundColor: "{colors.ground-bouke}", textColor: "{colors.ground-bouke-ink}", typography: "{typography.caption-4}", rounded: "{rounded.tag}" }
  tag-larout: { backgroundColor: "{colors.ground-larout}", textColor: "{colors.ground-larout-ink}", typography: "{typography.caption-4}", rounded: "{rounded.tag}" }
  tag-kazprop: { backgroundColor: "{colors.ground-kazprop}", textColor: "{colors.ground-kazprop-ink}", typography: "{typography.caption-4}", rounded: "{rounded.tag}" }
  swatch-lepalatier-accent: { backgroundColor: "{colors.ground-lepalatier-accent}", rounded: "{rounded.field}" }
  swatch-lakrem-accent: { backgroundColor: "{colors.ground-lakrem-accent}", rounded: "{rounded.field}" }
  swatch-souffle-accent: { backgroundColor: "{colors.ground-souffle-accent}", rounded: "{rounded.field}" }
  swatch-bouke-accent: { backgroundColor: "{colors.ground-bouke-accent}", rounded: "{rounded.field}" }
  swatch-larout-accent: { backgroundColor: "{colors.ground-larout-accent}", rounded: "{rounded.field}" }
  swatch-kazprop-accent: { backgroundColor: "{colors.ground-kazprop-accent}", rounded: "{rounded.field}" }
---

# Design System: biznes.mu, the website

<!-- Recorded from faizkhay/Biznes@3ca3aee on 16 November 2026: src/app/globals.css, src/components,
src/app, src/data/businesses.ts, and the captures in review/screens. Round 0: recorded before the
first owner round. Where the build and this file differ, the build wins and the difference goes to
Known Gaps. Checks: `npx --yes @google/design.md@0.4.0 lint DESIGN.md` gives 0 errors and 0 warnings;
`node scripts/check-design.mjs` passes; contrast measured 16 November 2026 with `npm run contrast`. -->

## Overview

**Creative North Star: "The rail"**

biznes.mu sells finished businesses in Mauritius, each built by Khay Digital and sold once, to one
owner. Every business hangs ready on one rail, as a tag in its own colours and lettering. The visitor
walks the rail in three beats. On the rail: six tags, each a link. Everything on one ring: the six
things a business comes with. Yours to open: four steps from the rail to opening day, then the honest
half on night, what stays with the buyer. Then the line, said large, the maker, and the invitation
again. A business's own page tells the same story for one tag and ends on one action: Reserve this
business. Once sold, it leaves the rail for good.

The mood is a shop with its stock in view: plain, unhurried, one idea per block. Sections sit 64 to
128px apart, running text is held to 62ch and the hero to 680px. The page is paper and ink so that six
brands' colours can sit on it; the only colour that is the platform's own is one yellow. biznes.mu is
a new brand with no earlier material to sample, and the owner gave Khay Digital carte blanche on
creative direction on 16 November 2026. So nothing here is sampled: every value is recorded as
chosen, with its reason, or as derived from a chosen value.

**Key Characteristics:**

- Paper `#f5f2ea` and ink `#131209` carry every page; `primary` `#e6b93f`, the tag yellow, is the one
  accent, on the one filled action and the platform's own tags.
- The tag: a 3 by 4 shape with 16px corners (`rounded.tag`), a 14px punched hole, on a 1px string.
- The rail: one firm hairline, `line-strong` (ink at 55%, 4.01:1 on paper), under the header, over the
  tags, over the four steps and across the footer.
- Geist speaks everything; Geist Mono (`title-4`, `caption-4`) speaks only what is written on a tag.
- Anything pressed is a full pill at least 48px tall (`button-primary`, `button-quiet`), 44px for the
  small button and a chip.
- A listing wears its own ground and ink through `[data-ground="brand"]`; the platform's palette does
  not change.
- Night, where `ink` becomes the ground, holds the honest half and the footer.
- Surfaces are flat: grounds and hairlines separate, no shadow is cast and there is no gradient.

**Refusals:**

- No second accent. A listing's colours stay on its own tag, plate and swatches, because the
  platform must not compete with what it sells.
- No shadow, gradient or blur. A tag is card on paper, and KOS keeps surfaces flat.
- No Geist Mono for a sentence. The monospace is the writing on a tag; used wider, it stops meaning
  that.
- No photograph, testimonial or sales figure. None exists yet (PRODUCT.md, "Evidence on Hand"), and
  nothing is invented.
- No colour as the only signal. A sample, a status and an error are said in words.
- No WebGL and no stage. This is a website, not an Original (STORY.md, "Chapters").

**Sources** <!-- add a row before using any new asset -->

| ID | Asset | From, version | Gave |
|---|---|---|---|
| S1 | The owner's brief | In conversation, 15 and 16 November 2026 | The offer; carte blanche on creative direction (16 November 2026); LePalatier and the request for five samples |
| S2 | Elaya's lists, as carried by KOS | `references/visual-system.md` and `references/brand-system.md`, read 16 November 2026 | The warm dark `#131209` from Elaya's ladder; Geist and Geist Mono from Elaya's list of faces |
| S3 | Khay Digital's creative direction for this build | 16 November 2026, a first direction | Paper, the tag yellow, the tag, the rail, the ring; each listing's colours and the face its lettering is drawn in |
| S4 | Six open-licence faces | `@fontsource` packages 5.3.0 (devDependencies), each under the SIL Open Font License 1.1 | The outlines of the six wordmarks, drawn by `scripts/make-wordmarks.mjs` |

## Colors

The palette is chosen, not sampled: paper, the tag yellow and every derived step are Khay Digital's
direction (S3), and the dark is the warm dark of Elaya's ladder (S2). The owner's brief (S1) gave the
freedom to choose and no colour.

### Palette

| Name | Token | Value | Role: where used, and where never | Source |
|---|---|---|---|---|
| Paper | `paper` | #f5f2ea | The page's ground, the header, the phone menu, a field's fill; the words on night. Never the fill of an action | S3, chosen: a warm paper, so six brands' colours can sit on it |
| Quiet Paper | `paper-quiet` | #ece7db | A quieter panel: the ring, a listing's brand, the maker, the closing band; the fill of a disabled action | derived from `paper`: a step darker |
| Warm Ink | `ink` | #131209 | Words; the night ground; the focus ring on paper; a chosen chip; the skip link | S2, chosen: the warm dark of Elaya's ladder, because the brand has no dark of its own |
| Muted Ink | `ink-muted` | #5c584b | Secondary words on paper and on the quiet panel. Never on night | derived from `ink` toward `paper`, held to 4.5:1 on both light grounds |
| Night Muted | `ink-muted-night` | #b4ae9c | Secondary words on night only | derived from `paper` toward `ink` |
| Tag Yellow | `primary` | #e6b93f | Fills only: the one filled action, the platform's own tags (the logo, the ring's six, the icon), the selection, the focus ring on night. Never text on paper | S3, chosen: the colour of a price tag; saturation 77%, under the 80% Elaya keeps for an accent |
| Tag Yellow, pressed | `primary-dark` | #d6a62b | The filled action on hover and press | derived from `primary`: darker, still carrying ink |
| On Yellow | `on-primary` | #131209 | Words on the yellow | `ink` |
| Hairline | `line` | rgba(19, 18, 9, 0.14) | The line between rows of a list; the edge of a swatch | derived: `ink` at 14% |
| Rail | `line-strong` | rgba(19, 18, 9, 0.55) | The rail, the string, the line that opens a list, a field's edge, a chip's edge, a quiet button's edge | derived: `ink` at 55%, for 3:1 as a mark |
| Night Hairline | `line-night` | rgba(245, 242, 234, 0.16) | The line between rows on night | derived: `paper` at 16% |
| Night Rail | `line-strong-night` | rgba(245, 242, 234, 0.55) | The rail and the line that opens a list on night | derived: `paper` at 55% |

### Listings' own colours

These are content: each listing's identity, read from `src/data/businesses.ts` and handed to CSS as
`--brand-ground`, `--brand-ink` and `--brand-accent`. They are not the platform's palette and no
platform component may borrow them. Each is modelled as a ground with its ink, so the pair is checked.

| Listing | Ground | Ink | Accent (a swatch only) | As the data names them | Standing |
|---|---|---|---|---|---|
| LePalatier | `ground-lepalatier` #4a1626 | `ground-lepalatier-ink` #f3e9d8 | `ground-lepalatier-accent` #c6a15b | Bordeaux, Ivory, Brass | S3, chosen: a first direction, to confirm |
| Lakrem (sample) | `ground-lakrem` #fcefd9 | `ground-lakrem-ink` #a61e3c | `ground-lakrem-accent` #8fb37a | Cream, Cherry, Pistachio | S3: a placeholder |
| Souffle (sample) | `ground-souffle` #dce2d6 | `ground-souffle-ink` #2e3b33 | `ground-souffle-accent` #c28766 | Pale sage, Deep sage, Clay | S3: a placeholder |
| Bouké (sample) | `ground-bouke` #1f3a2d | `ground-bouke-ink` #f4cfc9 | `ground-bouke-accent` #e98a6e | Forest, Blush, Coral | S3: a placeholder |
| Larout (sample) | `ground-larout` #0e5f6b | `ground-larout-ink` #f7e9cc | `ground-larout-accent` #f2a65a | Lagoon, Sand, Amber | S3: a placeholder |
| Kazprop (sample) | `ground-kazprop` #ddeafb | `ground-kazprop-ink` #1b46c2 | `ground-kazprop-accent` #7ed6b5 | Sky, Cobalt, Mint | S3: a placeholder |

### Roles

Components use roles (`--color-*` in `@theme`), each an alias of a palette value. Tailwind's own
colours are switched off (`--color-*: initial`), so only a role paints.

| Role | Aliases | Elaya's group | Where |
|---|---|---|---|
| `paper` | `paper` | Surface | The page's ground |
| `paper-subtle` | `paper-quiet` | Surface | A quieter panel; the fill of a disabled action |
| `ink` | `ink` | Text | Words |
| `ink-subtle` | `ink-muted` | Text | Secondary words |
| `action` | `primary` | Action | The one filled action |
| `action-hover`, `action-pressed` | `primary-dark` | Action | The action on hover and press |
| `on-action` | `on-primary` | Text, inverted | Words on the action |
| `line` | `ink` at 14% | Border | Hairlines between rows |
| `line-strong` | `ink` at 55% | Border | The rail, the string, a field's edge: 4.01:1 on paper |
| `focus` | `ink` | Border | The focus ring: 16.78:1 on paper |
| `accent` | `--brand-accent` | none | A listing's third colour. Declared; no component uses it (Known Gaps) |

A ground is a scope that redefines roles. The palette is never redefined.

| Scope | `paper` | `ink` | `ink-subtle` | `line` | `line-strong` | `focus` |
|---|---|---|---|---|---|---|
| The page | `paper` | `ink` | `ink-muted` | `ink` at 14% | `ink` at 55% | `ink` |
| `[data-ground="night"]` | `ink` | `paper` | `ink-muted-night` | `paper` at 16% | `paper` at 55% | `primary` |
| `[data-ground="brand"]` | the listing's ground | the listing's ink | the listing's ink | the listing's ink at 24% | unchanged | the listing's ink |

Night is a ground, not a dark mode: the site has one colour scheme (`colorScheme: "light"`, theme
colour `#f5f2ea`). Without a listing's colours, the brand ground falls back to the platform's own tag:
`primary` with `ink`. The browser's own surfaces are themed as well: the selection is `primary` with
`on-primary`, the caret is `ink`, and links underline 0.22em below the baseline.

### Named Rules

**The One Yellow Rule.** `primary` is a fill, on the one filled action in a group and on the
platform's own tags, and it is never text on paper. It carries ink at 10.17:1 and reads as a price
tag only while it stays rare.

**The Own Ink Rule.** Every word on a listing's ground takes that listing's ink, with no grey and no
platform ink. The scope sets `ink` and `ink-subtle` to the brand's ink, so each tag is one measured
pair.

**The Roles Not Values Rule.** Night and a listing's ground change roles inside a scope; a
`--palette-*` value is never redefined. A corrected value then changes the palette and nothing else.

### Contrast

WCAG 2.x, **floored** to two decimals (never rounded), alpha composited over the real ground. AA:
4.5:1 for text under 24px (18.66px bold); 3:1 for larger text and for non-text marks (the focus ring,
a field's edge, the rail). Measured on 16 November 2026 by `scripts/contrast.mjs` over
`scripts/contrast.pairs.json`; `npm run contrast` runs it again.

| Text or mark | On | Ratio | Body text (4.5) | Large text, marks (3) | Where |
|---|---|---|---|---|---|
| `ink` #131209 | `paper` #f5f2ea | 16.78:1 | pass | pass | ink on paper: every heading and paragraph |
| `ink` #131209 | `paper-quiet` #ece7db | 15.22:1 | pass | pass | ink on the quiet panel |
| `ink-muted` #5c584b | `paper` #f5f2ea | 6.35:1 | pass | pass | secondary words on paper |
| `ink-muted` #5c584b | `paper-quiet` #ece7db | 5.76:1 | pass | pass | secondary words on the quiet panel |
| `on-primary` #131209 | `primary` #e6b93f | 10.17:1 | pass | pass | words on the filled action |
| `on-primary` #131209 | `primary-dark` #d6a62b | 8.36:1 | pass | pass | words on the filled action, hovered or pressed |
| `ink-muted` #5c584b | `paper-quiet` #ece7db | 5.76:1 | pass | pass | words on a disabled action |
| `paper` #f5f2ea | `ink` #131209 | 16.78:1 | pass | pass | words on night: the honest half, the footer |
| `ink-muted-night` #b4ae9c | `ink` #131209 | 8.47:1 | pass | pass | secondary words on night |
| `primary` #e6b93f | `ink` #131209 | 10.17:1 | pass | pass | the focus ring on night |
| `ink` #131209 | `paper` #f5f2ea | 16.78:1 | pass | pass | the focus ring on paper |
| `line-strong` rgba(19,18,9,0.55) | `paper` #f5f2ea | 4.01:1 | fail | pass | a field's edge, the rail and a quiet button's edge on paper (a mark: 3:1) |
| `line-strong` rgba(19,18,9,0.55) | `paper-quiet` #ece7db | 3.90:1 | fail | pass | the rail on the quiet panel (a mark: 3:1) |
| `line-strong-night` rgba(245,242,234,0.55) | `ink` #131209 | 5.64:1 | pass | pass | the rail and a quiet button's edge on night (a mark: 3:1) |
| `ink` at 0.5, rgba(19,18,9,0.5) | `paper` #f5f2ea | 3.44:1 | fail | pass | the tagline's muted words, large text (3:1) |
| `paper` #f5f2ea | `ink` #131209 | 16.78:1 | pass | pass | a chosen reply chip: paper on ink |
| `ground-lepalatier-ink` #f3e9d8 | `ground-lepalatier` #4a1626 | 12.17:1 | pass | pass | LePalatier: ivory on bordeaux, lettering and tag text |
| `ground-lepalatier` #4a1626 | `ground-lepalatier-ink` #f3e9d8 | 12.17:1 | pass | pass | LePalatier reversed: bordeaux on ivory |
| `ground-lakrem-ink` #a61e3c | `ground-lakrem` #fcefd9 | 6.43:1 | pass | pass | Lakrem (sample): cherry on cream |
| `ground-souffle-ink` #2e3b33 | `ground-souffle` #dce2d6 | 8.88:1 | pass | pass | Souffle (sample): deep sage on pale sage |
| `ground-bouke-ink` #f4cfc9 | `ground-bouke` #1f3a2d | 8.59:1 | pass | pass | Bouké (sample): blush on forest |
| `ground-larout-ink` #f7e9cc | `ground-larout` #0e5f6b | 6.09:1 | pass | pass | Larout (sample): sand on lagoon |
| `ground-kazprop-ink` #1b46c2 | `ground-kazprop` #ddeafb | 6.37:1 | pass | pass | Kazprop (sample): cobalt on sky |

Every pair passes for its role. The three rows that fail the body column are marks or large text,
held to 3:1. A reversed plate swaps a listing's ground and ink, and the formula gives the same ratio
either way round. The focus ring is `ink` on paper (16.78:1), `ink` on the quiet panel (the pair in
the second row, 15.22:1) and `primary` on night (10.17:1). Nothing that takes focus sits on a
listing's ground.

**Gaps (recorded, not rules):**

- The skip link's focus outline is `primary`, drawn 3px outside its ink pill, so it sits on paper.
  That pair is not in the pairs list. A single run of the same script on 16 November 2026 gives
  1.65:1, under the 3:1 a focus ring needs. The pill sliding into view is the signal that it has
  focus. Open until the outline takes `ink`, or the pair is added and passes.
- The yellow fill against paper is not in the pairs list either (the same run: 1.65:1 on paper,
  1.49:1 on the quiet panel). The filled action is told from the page by its label, at 10.17:1, and
  by its shape.
- A quiet button's hover wash (`ink` at 6% under ink words) is not in the pairs list.
- `line` and `line-night` divide rows and bound nothing a visitor operates, so they are held to no
  ratio.
- The list measures a quiet button's edge on night. No quiet button sits on night in this build.

## Typography

**Display and Body:** Geist (S2; SIL Open Font License 1.1; self-hosted through the `geist` npm
package, 1.9.2, with next/font) · **Label:** Geist Mono (S2; the same package and licence), for what
is written on a tag

**Character:** A plain sans that leaves the display to six brands' own lettering, beside a monospace
that reads as the hand on a price tag.

### Hierarchy

Sizes are steps of Tailwind's type scale. A fluid style runs between two steps, from a 390px screen
to a 1440px one, and takes the line height of the step it ends on.

| Token | Face | Weight | Size (fluid) | Line height | Tracking | Case, features | Use |
|---|---|---|---|---|---|---|---|
| `heading-1` | Geist | 600 | clamp(var(--text-4xl), 1.414rem + 3.429vw, var(--text-7xl)): 36 to 72px | 1 | -0.035em | sentence case | Each page's first heading; the link preview card |
| `heading-2` | Geist | 600 | clamp(var(--text-3xl), 1.45714rem + 1.71429vw, var(--text-5xl)): 30 to 48px | 1 | -0.03em | sentence case | Section headings; the tagline; the footer's invitation |
| `heading-3` | Geist | 600 | clamp(var(--text-2xl), 1.22143rem + 1.14286vw, var(--text-4xl)): 24 to 36px | 40/36 (1.11) | -0.025em | sentence case | Smaller section headings; the phone menu's links; the price at the head of a listing, with tabular figures; a step's title on How it works |
| `heading-5` | Geist | 600 | `text-2xl`, 24px | 32/24 (1.33) | -0.02em | sentence case | A step's title; a name in the catalogue; a heading on the privacy page; the next business |
| `title-1` | Geist | 500 | `text-xl`, 20px | 28/20 (1.4) | -0.01em | sentence case | Each of the six things; a question |
| `title-2` | Geist | 400 | `text-lg`, 18px | 28/18 (1.56) | 0 | none | The lede; a listing's idea |
| `title-3` | Geist | 500 | `text-base`, 16px | 24/16 (1.5) | 0 | none | Header links; a tag's name; field labels; a list's heading; a swatch's name |
| `title-4` | Geist Mono | 500 | `text-sm`, 14px | 20/14 (1.43) | 0 | tabular lining figures | A price under a tag and in a catalogue row |
| `body-1` | Geist | 600 | `text-base`, 16px | 24/16 (1.5) | 0 | none | The name in the logo; the first line of the failed message |
| `body-3` | Geist | 400 | `text-base`, 16px | 24/16 (1.5) | 0 | none | Running text; list rows; chips; footer links |
| `body-6` | Geist | 400 | `text-sm`, 14px | 20/14 (1.43) | 0 | none | The sample note; a field's error |
| `button-md` | Geist | 600 | `text-base`, 16px | 24/16 (1.5) | 0 | sentence case | Buttons and arrow links: only what can be pressed |
| `button-sm` | Geist | 600 | `text-sm`, 14px | 20/14 (1.43) | 0 | sentence case | The header's Enquire; the skip link |
| `caption-2` | Geist | 400 | `text-sm`, 14px | 20/14 (1.43) | 0 | none | A sector under a name; hints; hours; small print; "(optional)" |
| `caption-3` | Geist | 600 | `text-xs`, 12px | 16/12 (1.33) | 0 | none | Declared; no component uses it yet (Known Gaps) |
| `caption-4` | Geist Mono | 500 | `text-xs`, 12px | 16/12 (1.33) | 0.02em | tabular lining figures; capitals by `text-transform` on a hex value only | The foot of a tag: its number and its status; "Step 1"; the six numbers; the sample mark; a swatch's hex value |

Each listing's wordmark is artwork, not interface type: vector outlines drawn by
`scripts/make-wordmarks.mjs` from an open-licence face (S4), so the site loads no typeface for it.

| Listing | Lettering as drawn | Face (SIL OFL 1.1) | Tracking |
|---|---|---|---|
| LePalatier | LePalatier | Cormorant Garamond Medium | 0.01em |
| Lakrem | lakrem | Fredoka SemiBold | 0 |
| Souffle | SOUFFLE | Jost Light | 0.32em |
| Bouké | Bouké | Playfair Display Medium Italic | 0 |
| Larout | LAROUT | Barlow Condensed Bold | 0.05em |
| Kazprop | kazprop | Outfit SemiBold | -0.01em |

### Named Rules

**The Tag Writing Rule.** Geist Mono speaks only what is written on a tag: a number, a price, a
status. Every sentence is Geist, so the monospace keeps its one meaning.

**The Named Style Rule.** Every piece of text takes one of the sixteen named styles, at weight 400,
500 or 600, with no italic and nothing under 12px. A size or a weight set loose is a decision nobody
recorded.

**The Artwork Rule.** A listing's lettering ships as outlines from `scripts/make-wordmarks.mjs`, in
a face under the SIL OFL 1.1, and the site loads Geist and Geist Mono only. A seventh brand then
costs one path, not one font file.

**If a face is unavailable:** Geist falls back to the face next/font generates for it, the
visitor's own Arial with its size adjusted to 106.28% and its ascent and descent overridden, then to
`ui-sans-serif, system-ui, sans-serif`. Geist Mono falls back to `ui-monospace`, `SFMono-Regular`,
then the system's monospace, with no metric correction. Neither is swapped for another named face
without a record here.

## Layout

The shell holds at most 1280px of content (`spacing.shell`, 80rem) inside a fluid gutter,
`clamp(1.5rem, 5vw, 5rem)`: 24px at 390, 72px at 1440, 80px from 1600. Sections are spaced by
`clamp(4rem, 10vw, 8rem)`: 64px on a phone, 128px from 1280. Running text is held to 62ch and the
hero's heading and lede to 680px (`measure-hero`). The header is 72px tall and stays at the top; a
link to a place on a page lands under it (`scroll-padding-top`). Inside components, spacing takes
only the thirteen steps of the scale: `npm run tokens` reports 0 fail and 0 warn.

- **Story structure:** the home page, in order: the headline and the rail of six tags on paper; the
  ring and the six things on quiet paper; the four steps on paper; the honest half on night; the
  tagline on paper; the maker on quiet paper; the footer on night. Then the catalogue, as a ledger; a
  business's page (its plate, its brand on quiet paper, what it is, what comes with it beside what
  the buyer brings, the one action on quiet paper, the next business); How it works; Enquire;
  Privacy; and the 404, an empty hook.
- **Grids:** the rail is 2 tags to a row, 3 from 640px, 6 from 1024px. Two-column sections begin at
  1024px: the hero `1.25fr 1fr`; the ring, a listing's brand, its idea and the questions
  `0.85fr 1.15fr`; the honest half `1fr 1.1fr`; a listing's head `1fr 1.1fr`; Enquire
  `1.15fr 0.85fr`; the footer `1.3fr 0.6fr 1fr`. The steps are four columns
  from 768px. A catalogue row is `7rem 1fr`, then `10rem 1fr` from 640px, then six columns from
  1024px: number, plate, name, places, price, arrow. A heading beside a long list stays in view
  (`sticky`, 96px from the top) from 1024px.

### Named Rules

**The Rail First Rule.** On the home page the rail of tags comes straight under the headline, in the
first view at 1440 by 900. The businesses are the proof, so they come before any claim.

**The Rows Not Cards Rule.** A list is rows: `line-strong` opens it and `line` divides it. Only a
tag, a plate or a swatch is a filled shape, so a listing's colours are the only blocks of colour on
the page.

## Elevation & Depth

Nothing is raised. The interface is flat, and separates by ground (paper, quiet paper, night, a
listing's own) and by hairline (`line`, `line-strong`). The header stays above the page on solid
paper with the rail as its lower edge, the phone menu opens under it on solid paper, and the skip
link sits over both.

### Shadow Vocabulary

No shadow is cast. `box-shadow` appears twice, each time as an inset edge:

- **The punched hole's edge** (`box-shadow: inset 0 0 0 1px` in the listing's ink at 30%): the hole
  on a tag and a plate.
- **A field's error edge** (`box-shadow: inset 0 0 0 1px var(--color-ink)`): thickens the edge of an
  invalid field to 2px.

### Named Rules

**The Flat Rule.** No cast shadow, no gradient and no blur, on any surface. Depth is said by a
change of ground or a hairline, which keeps six brands' colours true.

## Shapes

One decision, three radii, each a step of Tailwind's radius scale:

- **Full pill** (`rounded.pill`): anything pressed that is a control. Buttons, chips, the skip link,
  the menu button and the logo's focus shape.
- **16px** (`rounded.tag`, `rounded-2xl`): tags and plates, the reversed plate, and the two panels
  the form answers with.
- **12px** (`rounded.field`, `rounded-xl`): fields, the small plate in a catalogue row, swatches and
  the sample note.

Full-width bands are square. No shape is nested in another with a gap under 32px, so the nesting
formula has no case here.

The tag is 3 by 4. Its hole is a 14px circle, 12px from the top edge, with the page's ground showing
through. Its string is a 1px line in `line-strong`, and the six strings are 3.5, 1.5, 5, 2.5, 4 and
2rem long, so the row has a rhythm. The plate is the tag at full size: 4 by 5 on a phone, 5 by 4
from 640px. The small plate is 16 by 10, the reversed plate 16 by 7, a swatch 4 by 3.

Drawn small, the tag is the mark: on a 24-unit grid, a 14 by 20 tag with a 3.5 radius and a hole of
radius 1.75, in `primary`. The icon is the same tag on an ink square. The ring is one SVG, 320 by
262 units: a loop of radius 50 with a 1.5 stroke in `ink`, six strings of 1 unit in `line-strong`,
and six tags of 38 by 52 units with a radius of 7, in `primary`, numbered 01 to 06 in Geist Mono.

Icons are one drawn set of eight (arrow, back arrow, phone, chat, mail, plus, tick, alert) on a 24px
grid, with 1.5px round strokes in the current colour. Every icon sits beside words and is hidden
from assistive technology.

### Named Rules

**The Pill Rule.** Anything pressed that is a control is a full pill, at least 48px tall, or 44px
for the small button and a chip. One shape then always means "press here".

**The Tag Shape Rule.** A tag is 3 by 4 with 16px corners, a 14px punched hole and a 1px string to
the rail; drawn small, it is the logo and the icon. It is the one shape that says "for sale".

## Components

Every state the build has is listed. A state the build lacks is named as missing and repeated under
Known Gaps.

### Buttons

`.btn`: an inline row, at least 48px tall, a full pill, padding 8px by 24px, an 8px gap, one line.
The fill and the edge change over 240ms on `ease-out`; the press takes 120ms.

- **Filled** (`btn-filled`, `button-md`): `action` with `on-action`. Hover: `action-hover`. Pressed:
  the same fill, squashed to 0.96. Focus-visible: a 2px outline in `focus`, 3px out. Disabled:
  `paper-subtle` with `ink-subtle`, a not-allowed cursor, no squash. Sending: the label reads
  "Sending" and the button is disabled.
- **Quiet** (`btn-quiet`, `button-md`): a 1px edge in `line-strong`, words in `ink`, no fill. Hover:
  the edge turns `ink` and the fill takes `ink` at 6%. Pressed: squashed to 0.96. Focus-visible: as
  above. Disabled: not designed. A quiet button that carries a number is full width, with a 20px
  icon and the label at one end and the number, in tabular figures, at the other.
- **Small** (`btn-sm`, `button-sm`): 44px tall, padding 4px by 16px. The header's Enquire.

One filled button per group; the second path is an arrow link or a quiet button.

### Links

- **Arrow link** (`arrow-link`, `button-md`): words and a drawn 16px arrow, at least 48px tall.
  Hover: the underline appears over 240ms and the arrow moves 4px in 280ms. Focus-visible: the ring.
  Pressed: none.
- **Quiet links** (the footer's links, "All businesses", the credit): `body-3` or `caption-2`, with
  an underline that appears over 300ms on hover.
- **A whole thing as a link** (a tag, a catalogue row, the next business): the name underlines over
  300ms on hover, and an arrow that is a direct child of the link moves 4px.
- **Links in a sentence** (the privacy notice, the routes in the failed message): always underlined,
  0.22em below the baseline. No hover change.

### Inputs / Fields

- **Field** (`.field`: input, select, textarea): full width, at least 48px tall, a 1px edge in
  `line-strong`, 12px corners, a paper fill, words at 16px in `ink`, padding 12px by 16px. Hover:
  the edge turns `ink` over 200ms. Focus-visible: the edge in `ink` and a 2px outline in `focus`, 2px
  out. Error (`aria-invalid`): the edge in `ink`, thickened to 2px by an inset edge, with the
  message below in `body-6` at weight 500, led by the alert icon and tied to the field. Filled: no
  change. Disabled: not designed. The label sits above in `title-3`; "(optional)" follows it in
  `caption-2` and `ink-subtle`.
- **Chip** (`.chip`, a radio drawn as a pill): at least 44px tall, a 1px edge in `line-strong`,
  padding 8px by 16px, `body-3`. Hover: the edge turns `ink`. Chosen: an `ink` fill with words in
  `paper`. Focus-visible: a 2px outline in `focus`, 3px out. Changes take 200ms.
- **What the form answers with:** sent is a panel with 16px corners and a 1px edge in `line-strong`,
  a 32px tick, a `heading-3` and the route the reply will take; it takes focus and is a status.
  Failed is a panel with 16px corners and a 1px edge in `ink`, the alert icon, a `body-1` line and
  the phone, WhatsApp and email routes; it takes focus and is an alert.

### Navigation

- **Skip link:** first in the tab order. A pill in `ink` with words in `paper`, `button-sm`, padding
  12px by 24px, 16px from the top left. It slides into view over 240ms when it takes focus; its
  outline is `primary` (Contrast, Gaps).
- **Header:** 72px, solid paper, at the top of every page, with the rail (`line-strong`) as its
  lower edge. The mark links home in a 44px shape. From 768px: the pages in `title-3`, 32px apart,
  each link the header's full height, then the small filled Enquire. The current page carries
  `aria-current` and a 2px stroke in `ink` on the rail under its name, drawn from the left in 300ms.
  A header link has no hover state.
- **Phone menu** (under 768px): a 44px round button whose two 2px strokes turn into the close mark
  in 300ms. It opens a sheet under the header, on solid paper, as a dialog: the pages in `heading-3`,
  each at least 64px tall and divided by `line`, the current one marked with an 8px dot in `ink`;
  then Call us and WhatsApp as full-width quiet buttons. The page behind is inert and does not
  scroll. Escape or the button closes it and returns focus to the button.
- **Footer** (night): the invitation in `heading-2` with one filled button and one arrow link; a
  rail; the mark, the pages and every route to reach us, each with a 20px icon and the number written
  out; a rail; the legal line and the credit in `caption-2`.
- **The next business:** at the foot of a listing, a link at least 96px tall under a rail: "Next on
  the rail, No. 02" in `caption-4`, the name in `heading-5`, a 24px arrow.
- **The 404:** an empty hook (a 160px rail, a string, a 16px ring with nothing on it), a `heading-1`,
  a lede and one filled button back to the businesses.

### The tag (signature)

A business on the rail: a string, then its tag on its own ground (`[data-ground="brand"]`), then
its name (`title-3`), its sector (`caption-2`, `ink-subtle`) and its price (`title-4`) on paper. The
whole thing is one link. On the tag: the hole, the wordmark in the listing's ink, and along the foot,
in `caption-4`, "No. 01" and the status.

- **Status** is said in words on the tag: Available, Reserved or Sold. A sample says "Sample" on the
  tag itself, where it survives a screenshot. A sold business leaves the rail.
- **Hover and focus-visible**, as written in `globals.css`: the tag swings 2.5 degrees from the
  point where its string meets the rail, over 520ms, and the name underlines. Focus-visible adds the
  ring in `ink` around the whole link, with 16px corners.
- **Pressed**, as written: the swing, with the tag scaled to 0.98.
- **As built**, the swing and the press do not show on the rail while the page can animate (Known
  Gaps). The underline and the ring do.
- The wordmark's width, as a percentage of the tag's, is 26 times the square root of its own width
  over its height, and at most 86. Six names of very different shapes then carry about the same
  weight of ink.

### The rail and the string (signature)

The rail is a 1px line in `line-strong`. Things hang from it: the six tags, each on its string; the
header; the four steps; the footer's two rules; every list, which a rail opens. The 404 hangs
nothing from it.

### The ring (signature)

The six things a business comes with, fanned from one loop: six small tags in `primary`, numbered 01
to 06 in Geist Mono, on strings from the lower arc of the loop. It is a drawing beside the list that
carries every word, so it is hidden from assistive technology. The loop draws itself once as it
enters the screen.

### The plate (signature)

A listing's tag at full size, at the head of its page: its ground, the hole, the wordmark with the
name as its label, and "No. 01" with its status, or "Sample listing", in `caption-4` along the foot.
Below, on quiet paper: the reversed plate (the listing's ink as the ground, its ground as the
letters), then three swatches with 12px corners and a 1px edge in `line`, each with its name in
`title-3` and its hex value in `caption-4`.

### The steps

An ordered list of four. From 768px the steps hang from one rail, each from a 16px ring (a 1px edge
in `ink`, a paper fill) that sits on it: "Step 1" in `caption-4` and `ink-subtle`, the title in
`heading-5` (`heading-3` on How it works), a line in `body-3` and `ink-subtle`. Under 768px the rail
runs down the left side with the rings on it.

### Rows

- **The six things:** an ordered list opened by a rail. Each row has its number in `caption-4`, a
  `title-1` and a line in `body-3`, with 24px above and below.
- **We prepare, You bring** (night) and **What comes with it, What you bring:** a `title-3` or a
  `heading-3` over a rail, then rows of `body-3`, 12px above and below.
- **The catalogue:** one link per row. Number, small plate, name (`heading-5`) with the sector and
  the sample mark, places, price (`title-4`), arrow.
- **Questions:** native `details`. The question is `title-1`, at least 64px tall, with a 24px plus
  that turns 45 degrees in 320ms when open; the answer is `body-3` in `ink-subtle`. A question has no
  hover state.

### The sample mark

"Sample listing" in `caption-4`, in a pill with a 1px edge in `line-strong`, padding 2px by 8px. It
appears wherever a placeholder does, beside the sample note (`body-6` in a 12px box with a 1px edge
in `line-strong`) on the listing's own page. It cannot be pressed.

### Named Rules

**The One Filled Rule.** A group of actions has one filled button; the rest are quiet buttons or
arrow links. A visitor is shown one thing to do at a time.

**The Words Not Colour Rule.** A status, a sample and an error are said in words, with an icon where
one helps, and the palette has no error colour. The hardest visitor is on a phone in bright light.

## Motion

**Principle:** things hang here, so they stir and come to rest; nothing bounces, loops or follows
the pointer. Content is visible by default; motion only enhances. Script adds `can-animate` to the
page only when motion is welcome, and only then does anything start hidden or muted.

| Token | Value | Use |
|---|---|---|
| `ease-out` | cubic-bezier(0.16, 1, 0.3, 1) | Entrances and state changes |
| `ease-in-out` | cubic-bezier(0.65, 0, 0.35, 1) | The tags' stir; the ring's stroke |
| `dur-press` | 120ms | A button squashing to 0.96 |
| `dur-state` | 200 to 320ms | Field and chip 200; button fill and edge, arrow link, skip link 240; arrow 280; name underlines, the current page's stroke, the menu button 300; the plus 320 |
| `dur-menu` | 340ms each, 60ms apart | The phone menu's links |
| `dur-swing` | 520ms | A tag on hover or focus |
| `dur-word` | 500ms | One word of the tagline |
| `dur-reveal` | 800ms opacity, 900ms transform | A reveal |
| `dur-mask` | 1100ms | A masked headline |
| `dur-plate` | 1400ms | A plate settling |
| `dur-ring` | 1600ms | The ring drawing itself |
| `dur-stir` | 1700ms | A tag stirring as the page opens |

### Choreography

| Moment | Trigger | What moves | Duration, delay, stagger | Easing |
|---|---|---|---|---|
| The tags stir | The page opens and can animate | Each tag turns about the point where its string meets the rail: out to its swing (4, -3, 3.5, -4, 3 and -3.5 degrees along the row), back past rest by 0.45 of it, out by 0.18, then to rest. It starts and ends at rest | 1700ms each, 90ms apart; the row is still 2150ms after it starts; once | `ease-in-out` |
| A tag swings | Hover or keyboard focus on its link | The tag turns 2.5 degrees from the same point; pressed, it also scales to 0.98 | 520ms | `ease-out` |
| A reveal | 12% of the element is in view, 6% above the foot of the screen; once | It rises 18px and fades in | 800ms opacity, 900ms transform; rows 50, 60 or 90ms apart, a second column 120 or 150ms later | `ease-out` |
| A masked headline | Its reveal | Each child rises 0.45em out of a clip that opens from the foot | 1100ms | `ease-out` |
| A plate settles | Its reveal, at the head of a listing | The plate scales from 0.96 to 1; it does not fade | 1400ms | `ease-out` |
| The ring draws | Its reveal | The loop's stroke runs from nothing to the full circle | 1600ms; once | `ease-in-out` |
| The tagline lights | The line crosses the screen, from its top at 85% of the height to its foot at the middle | Each word goes from 0.5 of the ink (3.44:1) to full ink, in reading order; a word lit stays lit, and all are lit by the page's end | 500ms a word | `ease-out` |
| The phone menu arrives | The menu opens | Each link, then the two routes, rises 24px and fades in, in reading order | 340ms each, 60ms apart; five items, so the last is in place at 580ms. Closing is a cut | `ease-out` |
| The menu button | The menu opens or closes | Its two strokes turn into the close mark | 300ms | `ease-out` |
| State changes | Hover, press, focus, open | The fill, the edge, the underline, the arrow's 4px, the squash, the plus turning 45 degrees, the current page's stroke, the skip link sliding in | 120 to 320ms, as in the table above | `ease-out` |
| Smooth scrolling | Wheel and trackpad | Lenis eases the page (`lerp: 0.1`). Touch keeps the platform's own momentum. A new page starts at the top | Continuous | Lenis |

### Story map

This is not a scroll-driven build. There is no stage and no story map: the chapters are plain
sections (STORY.md, "Chapters"). Only the tagline reads the scroll position.

### Reduced motion and no script

Under `prefers-reduced-motion: reduce`, script does not add `can-animate` and does not start Lenis,
and a block in `globals.css` cuts every duration and delay to nothing.

| Movement | `prefers-reduced-motion: reduce` | Without script |
|---|---|---|
| The tags stir | The tags hang still | The tags hang still |
| A tag swings | The tag stays still; the name still underlines | The tag swings, from CSS alone |
| A reveal | Shown at once, in place | Visible from the start |
| A masked headline | Shown at once, unclipped | Visible from the start |
| A plate settles | At full size | At full size |
| The ring draws | Already drawn | Already drawn |
| The tagline lights | Every word in full ink | Every word in full ink |
| The phone menu arrives | The links are simply there | The menu does not open; the footer carries the same pages (Known Gaps) |
| The menu button | The strokes change at once | The button does nothing |
| State changes | Each state is cut to, with no travel | As with script: they are CSS, and the questions are native `details` |
| Smooth scrolling | Off; the browser scrolls | The browser scrolls |

Nothing moves by itself for more than five seconds, so nothing needs a pause control: the longest
movement is the row of tags, at 2150ms.

### Named Rules

**The Visible First Rule.** Every word is visible in the markup; only `html.can-animate` may hide or
mute anything, and never below 3:1. A crawler, a visitor without script and a visitor who asked for
less motion all get the whole page.

**The Comes To Rest Rule.** Every movement starts from rest and ends at rest, once. Nothing loops,
and nothing is left part way if the visitor stops.

## Scene & 3D

No WebGL and no 3D in this build: the rail, the tags and the ring are HTML, CSS and SVG, so there is
no canvas, no scene palette and no fallback to keep.

## Responsive Behavior

Breakpoints are Tailwind's own: 640, 768 and 1024px. The fluid values run from 390 to 1440.

| Name | Width | Layout | Type | Scene tier |
|---|---|---|---|---|
| Phone | under 640px | One column. The rail hangs two tags to a row. Gutter 24px, sections 64px. The phone menu. The steps run down a rail at their side. The plate is 4 by 5 | `heading-1` 36px, `heading-2` 30px, `heading-3` 24px at 390 | none |
| Small | from 640px | The rail hangs three to a row. The honest half's two lists sit side by side. The plate is 5 by 4. The footer has two columns | Fluid | none |
| Middle | from 768px | The header shows its pages and the menu button goes. The four steps hang across from one rail | Fluid | none |
| Wide | from 1024px | The rail hangs six across. Sections take two columns. The catalogue is a six-column ledger. A heading stays beside its list. The footer has three columns | Fluid | none |
| Desk | 1440px and up | Gutter 72px at 1440 and 80px from 1600. Content stops at 1280px | `heading-1` 72px, `heading-2` 48px, `heading-3` 36px, and no larger | none |

**Touch targets:** at least 44px for buttons (48px), the small button, chips, fields (48px), the menu
button, the mark, header links (72px), arrow links (48px), the back link, a question and the phone
menu's links (64px); exceptions: the footer's links are 40px tall, the credit is 32px, and a link in
a sentence is one line tall. **Collapsing:** the header's pages move into the phone menu under
768px; the rail goes from six to three to two to a row; the steps turn from a row under one rail to a
column beside one; a catalogue row folds from six columns to a plate beside its words. No page
scrolls sideways at 390px (README, "Verification").

## Do's and Don'ts

### Do

- **Do** fill one action in a group with `primary` #e6b93f, set its label in `on-primary` #131209
  (10.17:1), and put a quiet button or an arrow link beside it
  (The One Yellow Rule, The One Filled Rule).
- **Do** set every word on a listing's ground in that listing's ink, through
  `[data-ground="brand"]`, so the pair on the page is the pair that was measured
  (The Own Ink Rule).
- **Do** change a ground by redefining roles in a scope, as `[data-ground="night"]` does, and leave
  every `--palette-*` value alone (The Roles Not Values Rule).
- **Do** set a number, a price or a status on a tag in Geist Mono (`title-4` at 14px, `caption-4`
  at 12px), with tabular lining figures (The Tag Writing Rule).
- **Do** give every piece of text one of the sixteen named styles, at weight 400, 500 or 600
  (The Named Style Rule).
- **Do** add a listing's lettering as outlines, with `npm run wordmarks`, from a face under the SIL
  OFL 1.1 (The Artwork Rule).
- **Do** keep the rail of tags in the first view of the home page, straight under the headline
  (The Rail First Rule).
- **Do** open a list with `line-strong` and divide its rows with `line` (The Rows Not Cards Rule).
- **Do** separate one part of a page from the next with a ground (`paper`, `paper-quiet`, night) or
  a hairline (The Flat Rule).
- **Do** round anything pressed that is a control to a full pill, at least 48px tall, or 44px for
  the small button and a chip (The Pill Rule).
- **Do** keep the tag 3 by 4, with 16px corners, a 14px hole and a 1px string in `line-strong`
  (The Tag Shape Rule).
- **Do** say a status, a sample and an error in words, with an icon beside an error
  (The Words Not Colour Rule).
- **Do** leave every word visible in the markup, start and end each movement at rest, and give each
  new movement its row under "Reduced motion and no script"
  (The Visible First Rule, The Comes To Rest Rule).
- **Do** measure each new pair with `npm run contrast`, floored, before it ships: 4.5:1 for text
  under 24px, 3:1 for larger text, a focus ring and an edge that marks a control.

### Don't

- **Don't** set words in `primary` on paper, use it as a second accent or fill a second button in a
  group: yellow on paper measured 1.65:1 in a single run
  (The One Yellow Rule, The One Filled Rule).
- **Don't** put the platform's ink, a grey or another listing's colour on a listing's ground: only
  its own pair is measured, from 6.09:1 to 12.17:1 (The Own Ink Rule).
- **Don't** redefine a palette value inside a scope, or paint with a raw hex or one of Tailwind's
  colours: those are switched off and paint nothing (The Roles Not Values Rule).
- **Don't** set a sentence in Geist Mono: it is the writing on a tag (The Tag Writing Rule).
- **Don't** set a loose size or weight, an italic, a weight over 600 or text under 12px
  (The Named Style Rule).
- **Don't** load a listing's typeface on the site or set its wordmark as live text: the site serves
  two faces (The Artwork Rule).
- **Don't** open the home page with a claim, a picture or a band of logos ahead of the rail: the
  businesses are the proof (The Rail First Rule).
- **Don't** wrap the rows of a list in cards, or give a card an edge on one side only
  (The Rows Not Cards Rule).
- **Don't** cast a shadow, fill with a gradient or blur a ground: `box-shadow` is an inset 1px edge
  here and nothing else (The Flat Rule).
- **Don't** square a button or a chip, or round a tag or a plate to anything but 16px
  (The Pill Rule, The Tag Shape Rule).
- **Don't** mark a sample, a status or an error by colour alone, or add an error colour
  (The Words Not Colour Rule).
- **Don't** start anything hidden without `html.can-animate`, or mute the tagline below 0.5 of the
  ink, which measures 3.44:1 (The Visible First Rule).
- **Don't** loop a movement, tie one to the pointer or leave a tag part way through a swing
  (The Comes To Rest Rule).
- **Don't** add WebGL or a canvas: this build has none, and STORY.md gives it no stage.

## Agent Guide

**Quick reference:**

- Ground: `paper` #f5f2ea; quieter panel `paper-quiet` #ece7db; night `ink` #131209.
- Words: `ink` #131209; secondary `ink-muted` #5c584b, or `ink-muted-night` #b4ae9c on night.
- Action: `primary` #e6b93f with `on-primary` #131209; hover and press `primary-dark` #d6a62b.
- Lines: the rail `line-strong` (ink at 55%); between rows `line` (ink at 14%).
- Focus: 2px outline, 3px out, `ink` on paper and `primary` on night.
- Radius: a pill for anything pressed; 16px for tags and plates; 12px for fields, small plates and
  swatches.
- Type: Geist; `heading-1` 36 to 72px at weight 600; running text `body-3` at 16px; tag writing in
  Geist Mono, `title-4` and `caption-4`.
- Page: gutter `clamp(1.5rem, 5vw, 5rem)`; sections `clamp(4rem, 10vw, 8rem)`; content at most
  1280px; text 62ch; hero 680px; header 72px.
- Motion: `ease-out` cubic-bezier(0.16, 1, 0.3, 1); a reveal rises 18px over 800 and 900ms.
- Facts are data: `src/data/site.ts`, `src/data/businesses.ts`, `src/data/pack.ts`.

**Audit before calling a page done:**

1. Grounds, inks and the one filled action per group hold; no stray grey, no second accent, no
   listing's colour off its own tag, plate or swatch.
2. Every text pair is in Contrast, floored and passing, or listed under Gaps.
3. Hover, focus-visible and pressed states exist for everything pressable, or the missing one is
   under Known Gaps.
4. Every movement has its row under "Reduced motion and no script"; the page is whole without
   script. There is no WebGL to fall back from.
5. `npx --yes @google/design.md@0.4.0 lint DESIGN.md` gives 0 errors; `node scripts/check-design.mjs`
   passes; `npm run tokens`, `npm run copy` and `npm run contrast` pass; fresh screenshots at 390 and
   1440 have been read.

**Prompts:**

- "Add a listing to `src/data/businesses.ts` and its wordmark to `scripts/make-wordmarks.mjs`, in a
  face under the SIL OFL 1.1. Give it a ground and an ink that measure at least 4.5:1 with
  `scripts/contrast.mjs`, add the pair to `scripts/contrast.pairs.json`, and add its tokens and its
  row to DESIGN.md. Change no component."
- "Build a section on `paper-quiet`: a `heading-2` in the narrower column of a `0.85fr 1.15fr` grid
  from 1024px, and beside it a list that `line-strong` opens and `line` divides, with each title in
  `title-1` and each line in `body-3` and `ink-subtle`. Wrap the heading in a masked reveal. No
  cards and no shadow."
- "Build a group of actions: one `btn btn-filled button-md` in `primary`, at least 48px tall, and
  one `arrow-link button-md` with the drawn arrow as its last child. Take the labels from `ACTIONS`
  in `src/data/site.ts`."
- "Build a section on night by setting `data-ground` to `night` on it: words in `paper`, secondary
  words in `ink-muted-night`, a rail in `paper` at 55%. Use the role classes only (`text-ink`,
  `text-ink-subtle`, `border-line-strong`); the scope turns them."

## Known Gaps

Recorded, not rules.

**The build's standing**

- English only. French and Kreol are not built, and the routes are not under a language folder.
- This file was recorded before the first owner round (Round 0). Every chosen value is Khay
  Digital's first direction and may change in a round.
- The sample listings' colours and lettering are placeholders, and LePalatier's are a first
  direction to confirm.
- The kit's dev-only foundations page is not built, so no sheet shows every role, style and step
  bound to the real tokens.
- Not run: real phone hardware, Lighthouse, a keyboard pass by hand on a device, a screen reader.
- There is no impeccable sidecar (`.impeccable/design.json`); the motion values live here only.

**Where the build differs from what is written**

- The tag's swing does not show on the rail. The stir runs with `animation-fill-mode: both`, so once
  it ends it holds `rotate(0deg)` over the hover, focus and pressed rules. Measured in Chromium
  against the production build on 16 November 2026: with script, a hovered or focused tag stays at
  rest; without script it turns 2.5 degrees. Filling backwards only would restore it.
- The phone menu's entrance takes 580ms (five items, 60ms apart, 340ms each). The comment in
  `globals.css` says within 400ms, which is KOS's figure for a menu. Closing is a cut.
- Without script the phone menu does not open, so under 768px the header offers no pages; the footer
  carries them. The request form has no `action`, so without script it sends nothing and says
  nothing; the routes beside it are plain links.
- The skip link's focus outline is yellow on paper, 1.65:1 in a single run (Contrast, Gaps).
- Type set outside its named style: a field's error is `body-6` with `font-medium`; the logo's name
  is `body-1` with `tracking-tight`; the credit's "Khay Digital" is `caption-2` with
  `font-semibold`.
- Geist Mono beyond a number, a price or a status: "Next on the rail, No. 02" sets five words in
  `caption-4`. And a price outside it: the price at the head of a listing is Geist, `heading-3`
  with tabular figures.
- The sample mark is a pill and cannot be pressed, where the pill otherwise means "press here".
- States not designed: hover on a header link, the mark and a question; pressed on any text link;
  disabled on a quiet button and on a field. The rail and the catalogue have no empty view for a day
  when nothing is for sale.
- The footer's links are 40px tall and the credit 32px, under the 44px the rest keep.
- The ring's numbers are 12 units of an SVG that narrows with the screen: under 368px wide they fall
  below 12px (11.70px at 360). They are decoration; the list beside them carries each number.

**Declared and unused**

- `caption-3` is defined and no component uses it.
- The `accent` role (`--color-accent`) is defined and no component uses it; a listing's third colour
  shows only as a swatch, painted inline.
- On night, `paper-subtle` (paper at 7% over ink) and the rule for a tag's hole are defined; nothing
  quiet and no tag sits on night. On a listing's ground, `focus` is defined and nothing there takes
  focus, and `line-strong` and `paper-subtle` are not turned.

**Not yet traced**

- The derived values (`paper-quiet`, `ink-muted`, `ink-muted-night`, `primary-dark`) are recorded
  with their direction and their reason. The build does not write down the operation that gave each
  value.
