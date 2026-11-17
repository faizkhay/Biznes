disposition: fix

Run as a fresh agent on the degraded finish-reviewer procedure (no shipped reviewer agent in this harness). Not supplied: a QUALITY BAR card, so the ceiling is judged against the contract's OWN-WORLD and mock-up B. Check 0 passes: every required capture exists at sane dimensions and shows what its name claims. One caveat on the evidence: `src/data/site.ts` and `src/components/SiteFooter.tsx` were changed at 12:26:08, after the production build (`.next/BUILD_ID`, 12:15:59) and after every capture (12:17 to 12:23), so no capture shows the footer as the source now has it (fix 4). Not opened: `spec.json`, `heatmap.png`, seven of the twelve region crops, the bodies of PRODUCT.md, STORY.md and README.md, the last slices of the plain home page, the privacy page on a phone. Not judgeable from settled stills, and not judged: the dissolves between paintings, the shutter's travel, the lamps coming on, hover and focus states.

## persistence

Fail.

- PRODUCT.md present. `state.json` present. Comps closed (three comps, mock-up B approved and recorded). Spec closed. Plates closed, 2 of 2, on the fifth attempt.
- Hero phase is open with no gate record and no attempt. Sections, motion and responsive are pending and were never opened, though the build contains all three. Four phases before review are neither closed nor skipped: material.
- The reproduction is unproven: `diff/final/report.json` gives 0.658 overall against 0.72. `hero-repro.png` exists. The capture that was measured is itself not representative of the build (fidelity, headline scale).
- `state.finish` still holds the earlier review's verdict (fix, at phase plates, old hashes).
- DESIGN.md predates the painted build and still describes a 3D street (lines 199, 224, 230, 261, 477, 521, 664, 679). The surface brief's Constraints line still says "complete without WebGL" and "the 3D built in code". Neither matches the built world.
- Seed key 8f9b6c58 is in FORM and is corroborated by `state.json` ("direction"). Pass.
- Source is newer than the build that the gates and the captures ran on (two files, above).

## fidelity

The two questions first. (1) Against mock-up B, at 1440 x 900 and 1920 x 1080 the painted first screen reproduces the approved picture: same medium, composition, light and lettering character. The 3D build's contradiction of MATERIAL is gone. It is not proven at the mock-up's own size (headline scale, below). (2) Honesty holds in the captured build with one gap: the sentence that tells a visitor the pictures are illustrations is not in the build or in any capture.

| Element | State | Evidence |
|---|---|---|
| First-screen topology: words upper left on open sky, street full bleed, LePalatier large at right with shutter raised over a lit empty room, five samples receding left | match | `home-desktop-00.png`, `size-1920x1080.png` |
| Street painting, the focal element (region "drift", 0.70) | match | Same camera, light and palette. The drift is the sign boards recoloured for each listing, the lettering and the added plaques |
| MATERIAL | match on the focal element; contradicted locally | Painted raster plates throughout the stage, the cards and the listing pictures. Flat code marks on painted objects in two places: the certificate's rules and seal, the screen's bars (fix 6) |
| GROUND | match | Section ground #0e328f, the mock-up's own dominant. Sky sampled at the same four points, mock-up then build: #002d8b / #02309e, #1840a7 / #1743bd, #5158ae / #5b59c7, afterglow #da7896 / #f76b8a. The build is one step brighter and more saturated and its afterglow hotter; no drift toward slate or cream. Light sections are #f7f7f8, a neutral white |
| TYPE, the headline's character | match | Heavy condensed italic capitals, white, hard coral shade down and right. The mock-up's cut is a little wider with rounder corners |
| Headline scale (region "contradicted", 0.295) | contradicted in the measured capture, match elsewhere | Ink width as a share of the viewport: mock-up 40.9%; `hero-repro.png` 21.7%; `size-1344x760.png`, the same CSS viewport one minute earlier, 38.4%; 1440 x 900 41.7%; 1536 x 864 31.6%; 1280 x 720 35.0%. Two captures of one viewport disagree by a factor of 1.8. The score stands for the capture it measured (fix 1) |
| Lede (region "contradicted", 0.316) | adaptation | Three lines against four, wrapped to the roofline and held above the measured contrast floor (4.5:1). The score is mostly the displaced state caused by the shrunken headline |
| Primary action (region "missing", 0.21) | match | The score is wrong: the paired crop shows the yellow pill present and sitting higher because the headline above it shrank |
| Second route, "How it works" (region "missing") | adaptation, inconsistent | The contract names "the one filled action" and the route is in the header. Shown at 1440 x 900, 1536 x 864, 1920 x 1080, 1024 x 768, 920 x 700 and on phones; dropped at 1344 x 760, 1366 x 768, 1280 x 720, 1180 x 820 and 2560 x 1080 |
| Header and navigation (regions "drift" and "missing") | adaptation | The site's own 72px header against the mock-up's thinner bar. All three items and the yellow Enquire pill are present; the scores are size and position, not absence |
| Logo (region "missing", 0.40) | adaptation | Present. A condensed wordmark with a dimmed ".mu" and an awning mark, about half the width of the mock-up's round bold sans. The owner chose biznes.mu as its own brand; the mock-up's logo was never a drawn mark |
| Sign lettering | adaptation, cited | Each listing's real wordmark from data ("its real lettering", contract). All six sit true to their boards' perspective on the angled street and square on the terrace; none reads as pasted on at 1x. At 2x (`showcase/home-desktop.jpg`) they read as cut vinyl, not paint: no shade and no fall-off under the lamps. LePalatier fills about 55% of its board's width against about 80% in the mock-up |
| "Sample" tags | match | Five, on the shutters, in perspective, consistent on street, terrace and cards. The far two are about 8px lettering at 1440 x 900 |
| Town plaque | match in content, contradicted in overlap | MOKA on blue enamel; the walk's rail covers its right end (fix 2) |
| Blank blue plaques on the sample piers | added without approval | Five on the angled street, six on the terrace and one on every catalogue card. The mock-up has one plaque, and it carries a town (fix 3) |
| "Walk the street" pill and the eight-tick rail | adaptation | Controls for the scroll-driven centrepiece the owner chose |
| Saffron band at the foot (region "contradicted", 0.325) | missing, accepted as adaptation | The first screen is the first stop of a pinned walk; no saffron section follows it. The score stands as measured |
| Lamp post, cable, palms, basalt wall, pavement, fretwork, gooseneck lamps, density | match | |
| Phone first screen | adaptation, per contract | Words at the top, street along the foot; two and a half shops in view (`home-mobile-00.png`, 375 x 667, 360 x 640) |

The eight stops: each picture shows its subject and each card is legible. No card covers the thing its stop is about; two crowd it (minor notes).

Plates opened (street, LePalatier, terrace, counter, certificate, shutter): every board, plaque, screen and paper is blank, with no pseudo-lettering and no warped geometry. One tell: a smudged, malformed lock on the shutter's bottom rail (fix 5).

Truth: samples are marked four ways (tag, chip, the notice on the page, "a placeholder" beside every sample price). The one figure ("175+", "June 2020") is sourced in `site.ts` to Khay Digital's published facts; not checked against the outside source. `noindex` holds while `launched` is false. The credit line is in the footer. No em or en dashes in `src/data` or `src/app`. Sidecars say the plates are generated; the page does not yet (fix 4).

Floor: no kicker above a heading, no gradient text, no side stripes, no glyph icons, no system display face. The hard shade on the headline is the world's own (it is in the mock-up). Numbered steps carry a sequence. Two stand-ins for content (fix 6).

## ceiling

No card supplied. Against OWN-WORLD and the mock-up, the world's own devices left unused:

- Turquoise and coral "own whole sections" in the contract. None does: the page runs cobalt, saffron and white.
- Enamel plaques "for places and numbers": one is lettered, the rest are blank.
- The lamps light the boards and not the lettering on them.
- Painted material stops at the home page, the catalogue and the listing pages. How it works, Enquire and Privacy are colour fields with a scalloped edge.
- The sign painter's shade appears on two lines in the whole site.
- Motion (roll, push in, switch on) cannot be judged from stills.

## material_fixes

1. Headline scale is unstable at the mock-up's own size (FIRST VIEWPORT, hero gate). `hero-repro.png` shows the headline at 21.7% of the width where `size-1344x760.png` shows 38.4% and the mock-up 40.9%. Likely owner: `shape()` in `src/components/stage/PaintedStage.tsx` (lines 181 to 212), which measures the lines on mount and on the stage's resize but never after the display face loads (nothing in `src` waits on `document.fonts`), so a measure taken on the fallback face leaves `--fit` at 0.6 or 0.52. Run `shape()` again when the fonts are ready and when the words block changes size. Check: at 1344 x 760, at 1x and at 2x, on three cold loads, the headline's ink is at least 36% of the width; then recapture `hero-repro.png` and run comp-diff again.
2. The walk's rail covers the town plaque (fidelity, overlap). `home-desktop-00.png`: rail at x 1388 to 1432, y 370 to 602, over the plaque's right rim. The same at 1024 x 768, 920 x 700 (it reaches the lettering), 1180 x 820, 1344 x 760, 1366 x 768, 1280 x 720, 1536 x 864; touching at 1920 x 1080. Its foot sits on the plaque in `home-desktop-01.png` and over the last roof in `home-desktop-07.png`. Owner: `.walk-stops` in `src/app/globals.css` (about line 940) and `src/components/Walk.tsx`. Hide it until the walk leaves the first stop, or move it clear of the painting's lettered parts. Check: the plaque's whole rim is visible on the first screen at all nine desk sizes.
3. Blank plaques were added without approval (fidelity). Five on the sample piers in `street-1920.webp` (`home-desktop-00.png`, right of each sample's shutter), six in `terrace-1920.webp` (`home-desktop-07.png`, `home-desktop-08.png`). Either set each listing's number on its plaque from data, as `src/components/stage/Plates.tsx` already sets the town, or paint the sample plaques out of both plates. Check: no blank plaque in any capture.
4. The sentence that says the pictures are illustrations is unbuilt and unseen (truth). `site.pictures` in `src/data/site.ts` and line 70 of `src/components/SiteFooter.tsx` are newer than the build, the gates and every capture. Rebuild, run the house gates again, recapture every page. Check: "The shopfronts on this site are illustrations. A business comes without premises." is in every footer capture, and the legal line still reads well at 390 wide, where it already takes two lines without it.
5. Produce: the six catalogue shop crops again, as raster assets (`public/img/shops/*.webp`, cut by `scripts/prepare-plates.mjs`, widths in `src/data/plates.ts`). Five crops end through the blue plaque at the right edge, and five begin with a strip of the neighbour's wall and bracket at the left: `businesses-desktop-01.png` and `-02.png` at every card's edges, `listing-sample-desktop-00.png` (yellow strip left of Souffle, plaque cut at the right), the same on phones. Cut on the party walls so each crop holds its own piers and nothing of its neighbour. In the same pass retouch `public/img/plates/shutter.webp`: the smudged lock on the bottom rail, seen at `home-desktop-02.png` near x 905, y 467 and at the top left of `home-mobile-02.png`.
6. Grey bars stand in for content on two stops (floor; MATERIAL, local). `home-desktop-05.png`: a framed paper carrying one dark bar, five grey rules and a flat yellow disc fills the screen under "We help you set up the company". `home-desktop-03.png`: the screen under "The website is built" shows a wordmark, four bars and a pill. Both recur in the room stop, on phones and in the listing page's picture. Owner: `src/components/stage/Plates.tsx`. Certificate: remove the rules and the disc and leave the paper as painted, blank, since the company is the owner's to register. Screen: a real capture of LePalatier's home page if it exists; if it does not, the wordmark alone. Check: no grey bar anywhere in the walk.
7. The same terrace fills two screens in a row (craft). `home-desktop-07.png` (the walk's last stop) then `home-desktop-08.png` ("On the street now"), at nearly the same size; the same on phones and in the plain fallback. Let the last stop hand its terrace to the catalogue so the details arrive under the one picture, or end the walk on a different view. Owner: `src/components/stage/views.ts`, `src/components/Walk.tsx`, `src/app/page.tsx`.
8. Close the record (persistence). After fix 1, run the hero gate again. If it still sits under 0.72 for reasons the owner decided (the site's header, real wordmarks, no saffron band), record that as a forced close that quotes the decision; do not leave the phase open. Open and close sections, motion and responsive with their evidence, and replace `state.finish`. Rewrite DESIGN.md's 3D passages and the surface brief's Constraints line for the painted street.

Minor, not material:

- Ultrawide (2560 x 1080; 3440 x 1440 one build earlier): the first words hug the left edge while the header sits in a centred column (logo near x 640, headline near x 83).
- LePalatier's lettering could stand larger within its brass frame on the angled street.
- Continuity between plates: the terrace runs LePalatier first from the left while the angled street has it at the right end; Souffle and Larout swap wall colours between the two plates; LePalatier's board is a plain rectangle on the street and notch-cornered on its own plate. A dissolve may show it.
- "The room is yours to fill" covers the framed paper and the left third of the room on a desk (`home-desktop-06.png`); "The website is built" sits 2px from the frame (`home-desktop-03.png`).
- Phone: the last stop shows two and a half shops under "Every shop here will have one owner". In the plain fallback the address picture crops the plaque out and shows only the letter box (`home-plain-mobile-01.png`).
- Under the terrace, "MUR 320,000, a / placeholder" breaks badly in three of the six columns (`home-desktop-08.png`, `-09.png`).
- The flat blue behind the front-on LePalatier plate is brighter than the page's cobalt and than the street's sky.
- The enquiry form needs script. The no-script notice gives phone, WhatsApp and email, so the route is complete; a native form post would be truer to "complete without script".
- The logo's wordmark is about 88px wide at 1440.

## keep

The painted street as it stands at 1440 x 900: the lit bordeaux shop with its shutter raised, each listing's real wordmark true to its board's perspective, every blank kept blank and every sample marked four ways. Fix around the paintings and the lettering; do not repaint or re-letter them.
