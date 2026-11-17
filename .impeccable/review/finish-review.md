disposition: fix

Substitution: no shipped reviewer agent exists in this harness, so this is the degraded finish-reviewer procedure run by a fresh agent that did not build the page. Nothing was edited.

Evidence (check 0): the required viewport set is present and valid. desktop.png (1440 x 11187) and mobile.png (390 x 11558) were read through their slices, whose heights sum to the stitched files; hero-repro.png and the approved comp are both 2688 x 1520; the fallback, the other pages and the diff folder are present. One supplementary state capture, states/walk-last-stop.png, shows an empty stage. It is not one of the required viewports and the same stop is validly captured at both viewports (home-desktop-07, home-mobile-07), so the review proceeds and that capture is carried as material fix 7, not as a pass.

Not read: home-mobile-14; the fallback slices after home-plain-desktop-02 and home-plain-mobile-01; the later slices of businesses, listing-sample, how-it-works, enquire, privacy and missing beyond those cited below; states/form-filled.png; heatmap.png and side-by-side.png (the comp, hero-repro.png and the street region pair were read instead); spec.json; the bodies of PRODUCT.md, DESIGN.md and STORY.md; globals.css; Street.tsx beyond a search of its materials, lights and frame loop. Motion was not judged: every capture is settled.

## persistence

Fail, on the build record.

- PRODUCT.md: present. Pass.
- Approval record: the surface brief names mock-up B and state.json closes `comps` with "3 comps, 1 approved" (comp-b-perspective.png). Pass.
- Seed key: FORM prints 8f9b6c58 and state.json `direction` is 8f9b6c58. Pass.
- hero-repro.png: present. Pass.
- Phases: `comps` closed, `spec` closed. `plates` is open with a failed gate after 3 attempts ("plate missing for street"), no forced record. `hero`, `sections`, `motion` and `responsive` are pending, never closed and never marked skipped. Fail.
- Hero proof: `hero.gate` is null, and the only measurement, diff/final/report.json, scores 0.5257 "contradicted", under the 0.72 floor. The first screen was never proven against the approved comp by measurement. Fail.
- Cause, as given: the owner chose "3D plus a painted sky", so the street has no raster plate and the tool would not advance; no override was used. The surface brief records this; state.json does not. The decision explains the gap, it does not close it (material fix 8).
- DESIGN.md: present, not read against the build.
- Truth (check 5): no finding. Samples are marked wherever they appear (SAMPLE tags on five shutters in the 3D, SAMPLE plaques and "a placeholder" on every sample price, a notice on the sample listing). No testimonials, no income claim ("we make no promise of income" is printed twice). The sky plate is shipped and visible (pink cloud streaks on the horizon in home-desktop-07). "175+ projects delivered" and "founded in June 2020" are printed as Khay Digital's facts; they were not checked against a source here.

## fidelity

Comp inventory, in my own words, before reading the contract: a cobalt header band with a large rounded wordmark and a saffron Enquire pill; a two-line headline in very heavy slanted condensed capitals, white with a thick coral shade; a four-line lede; a saffron pill and a text link; a terrace of six shops in steep perspective, the crimson LePalatier filling the right third with a corrugated tin roof, pointed white fretwork and brackets, two gooseneck lamps throwing warm pools on the wall and the sign, a gold-lettered board, a dark steel shutter raised past half over a bright empty tiled room whose light spills onto stone paving, a blue enamel MOKA plaque on a crimson pier; five smaller shops stepping down to the left, each with its own roof, lamp pool, board and a Sample tag; a lit street lamp with a wire running up to the roof, palms, a basalt wall, a coral horizon; a saffron band peeking in at the foot.

Measured rows first (diff/final/report.json). The tool scores nine rows missing and three contradicted. Read against hero-repro.png, the chrome and text rows are scored wrong and I say why; the street, sky and next-peek rows stand in part.

| Element | Tool | My reading | Class |
| --- | --- | --- | --- |
| nav band, nav links, Enquire pill | missing | Present, same words, same places. Scored low because the build's band is taller (109 against about 97 px at 2688) and the type is another face, so ink does not overlap. | match |
| logo | missing | Present. Smaller, set in the condensed display face with ".mu" tinted, where the comp has a larger rounded sans. Cited: owner's answer "biznes.mu gets its own identity". | adaptation |
| headline | contradicted | Present, same words, two lines, same place. See TYPE. | match with drift |
| lede | drift | Same words, four lines, same place. | match |
| CTA pill and "How it works" link | missing | Present, same treatment (the comp's CTA is a plain saffron pill, so the plain pill is faithful). | match |
| sky | contradicted | Plate shipped and visible. Top of sky comp #002d8b, build #022689; mid sky comp #3e55b9, build #3741af. The low left of the comp (coral horizon, palms, basalt wall, lit lamp, wire) is nearly absent in the build. | match on colour, missing on content |
| street | contradicted | Live 3D by the owner's decision. Composition holds; finish does not. See MATERIAL and the rows below. | adaptation with shortfalls |
| next-peek | missing | Truly missing. The pinned walk puts the next section eight screens away. Cited: owner's answer "the scroll moves through it". Nothing at the foot now says the page scrolls. | adaptation |

Mandatory rows.

| Row | Comp | Build | Class |
| --- | --- | --- | --- |
| TYPE | Very heavy, fairly wide, slanted condensed capitals; thick coral shade | Same character (slanted condensed capitals, hard coral shade) but one weight lighter and narrower, shade about 4 px at 1440 | match with drift, not contradicted |
| MATERIAL | Painted, lit, textured: light is the subject | True 3D, flat Lambert planes, no cast light, no surface texture beyond roof ribs and slats | adaptation in medium (owner: "3D plus a painted sky"); shortfall in finish. Not scored contradicted, because the medium is the owner's answer and the scene is dimensional, not faked. This is the line that keeps the disposition at fix and not rebuild: the geometry and composition stand, what is missing is light, surface and context, and those are additive. |
| GROUND | Cobalt dusk, #002d8b at the top | #022689 at the top | match for the first screen. Below the walk two sections sit on #f7f7f8, against OWN-WORLD "deep cobalt dusk is the page's ground" (see the sections table). |

First viewport, desktop (home-desktop-00, hero-repro.png).

| Element | Class | What the capture shows |
| --- | --- | --- |
| Topology: LePalatier large at right, five shops running away left, words upper left | match | Decision kept. The strongest thing in the build. |
| Shop signs | adaptation | Real wordmarks from the listings instead of the comp's uniform cream lettering. Cited: product truth, and the brief. Shortfall inside the decision: SOUFFLE (thin grey on a pale board) and kazprop do not read at this distance. |
| Lamps and light | missing | Black cones with an orange dot. No pool on any wall or sign. LePalatier's wall carries one red hot spot that belongs to neither lamp. In the comp the lamps make the picture. |
| Shutters | contradicted | Comp #574353 and #604e59 (dark steel with a dusk cast). Build #966d7a and #906979: nearly twice as light, pinker. They are 10% of the frame (#805b74 in the build palette) and read as lilac plastic on all six shops. |
| Shutter height and lit room | contradicted | Comp: opening about 63% of the doorway, the room the brightest thing on the page, light on the paving. Build: opening about 37%, half hidden by a white box, no light outside the doorway. |
| Right edge | contradicted | An unlit gable and a dark box, #1a0007, close the frame (about 30 px at 1440, about 7% of the width at 2688). Comp ends on a crimson pier, #460a23. |
| Ground and left edge | missing | Road #0d0e2b, flat (comp #372e3e with paving joints and a kerb). The lower left corner is empty near-black. One thin post with an unlit-looking bulb, one small palm, no wall, no wire. |
| Lambrequin, roof | adaptation | Round scallops with a hole where the comp has pointed fretwork and brackets. Reads well close (home-desktop-01). Brackets absent. |
| Town plaques | match | Blue enamel plaque on every pier. |
| Sample tags | match | On all five sample shutters. |
| Stop marks at the right edge | added | Not in the comp. Serves the walk the owner chose; small and quiet. Accepted. |
| Memory test | weak pass | What stays is "a row of coloured shops at dusk". What the comp leaves, "one shop lit and open", does not survive: the lit room is a narrow strip. |

First viewport, phone (home-mobile-00).

| Element | Class | What the capture shows |
| --- | --- | --- |
| Words at the top | match | Headline in two lines, five-line lede, pill, link. All legible. |
| "The street runs along the foot of the screen" | contradicted in part | One shop and a third of another. Four shops are off screen. It is a shopfront, not a street. home-mobile-07 proves the phone frame can hold all six. |
| Lit room | missing | A strip about 60 px tall with a box in it. |
| WhatsApp pill and menu button in the header | adaptation | Responsive reflow. Menu dialog captured (states/menu-open.png) and sound. |

The eight stops. Cards are opaque navy panels with white text: fully legible over every scene at both viewports. On desktop the card sits left of centre; on a phone it is a sheet at the foot.

| Stop | Words | What the scene shows | Verdict |
| --- | --- | --- | --- |
| 1 The street | Headline, lede, action | As above | fix |
| 2 The sign | "The sign is already painted" | Close on the LePalatier board: gold frame, serif lettering, scallops. The best frame in the walk. Lamps are still unlit cones. | holds |
| 3 The address | "Its address is held for you" | Desktop: half the frame is shutter slats, the right fifth is the dark gable and a strip of sky, an unexplained navy box sits lower right; the plaque and letter slot are small. Phone: the right third is the dark gable. The words speak of the web address; the picture shows the town plaque. | weak |
| 4 Behind the shutter | "The website is built" | The room, a screen on the back wall with a drawn site, a phone on the side wall. Reads at once. | holds |
| 5 The counter | "The strategy is on the counter" | A blank white box and a blank yellow slab; half the frame is bare wall. Nothing reads as a written plan. The weakest stop at both viewports. | fix |
| 6 The wall | "We help you set up the company" | A framed certificate on a bare wall. Clear, bare. | holds |
| 7 The room | "The room is yours to fill" | Front on, shutter up, the room whole. Desktop: the card cuts lakrem's SAMPLE tag to "PLE" and a town plaque pokes over its corner. | holds, untidy |
| 8 The whole street | "Every shop here will have one owner" | Desktop: the terrace sits in the lower right third; about half the frame is empty sky and a flat dark band. The closing picture is the smallest the street ever gets. Phone: well filled. | fix on desktop |

Sections below the walk, against the contract.

| Section | Capture | Reading | Class |
| --- | --- | --- | --- |
| On the street now | home-desktop-08, 09; home-mobile-08, 09 | Six same-size cards (flat vector shopfront, two plaques, name, type, place, price) in a three-column grid on #f7f7f8. THESIS: "The page refuses the marketplace grid of listing cards, and refuses the cream editorial catalogue". This is that grid on a pale ground. | contradicted |
| From the street to opening day | home-desktop-10 | Saffron wall, four numbered steps. The numbers carry a real sequence. | keeps the contract |
| The sign is painted, the shutter is yours to raise | home-desktop-10, 11 | Cobalt band, plain centred capitals, no shade, smaller than the headline. | under-played |
| Questions people ask | home-desktop-11, 12 | Ruled list on #f7f7f8. Clear. Enters on a straight cut where every other section has a toothed edge. | keeps the contract, pale ground |
| Find the one that is yours, footer | home-desktop-12, 13 | Cobalt, one filled action, facts, credit. | keeps the contract |
| STORY overall | whole page | Sees the street, learns each is sold once, walks one shop, sees the room, is sent to the businesses. The order is kept. | keeps the contract |

Other pages (first screens read at desktop, plus listing, businesses, how-it-works and enquire on a phone): consistent with the home page; the listing names its action "Ask about this business"; the sample listing says plainly it is not for sale; the missing page and the failed form name the problem and the way out. No fidelity finding beyond the same card grid on /businesses.

## ceiling

Native devices of the street left unused or half used:

- Light. A blue-hour street is made of lamps. None casts light, nothing glows, the room does not spill, the street does not fall off into dusk with distance.
- Painted lettering with a hard shade: used once, on the h1. The statement band and every section heading are plain.
- Enamel plaque: used well for numbers, towns and status. The walk's cards, the element the visitor reads seven times, are generic rounded navy panels, not plaques or painted boards.
- Lime-washed walls owning whole sections: only saffron owns one. Turquoise and coral own nothing; two sections are near white.
- Lambrequin "as every edge": pointed teeth between sections, round scallops in the 3D and on the listing shopfronts, one straight cut. Three versions of one device.
- Shutter slats: exist only in the 3D. Nothing below the walk rolls, and no capture shows a cue that a shutter can be raised by hand, which is the signature interaction.
- Surface: walls, paving and road carry no limewash, stone or tar texture.
- Motion grammar (roll, swing, switch on): not judged from settled captures. Nothing in them could swing or switch on.

## material_fixes

1. Light the street (fidelity, MATERIAL, first viewport both sizes). Give every lamp a gooseneck arm, a visible glow and a warm pool on its wall and sign, on all six shops and on both light tiers (bake it into the wall texture on the low tier); let the open room throw a warm patch across the paving. produce: a lamp glow sprite and a paving light-spill texture, or baked lightmaps. Check in hero-repro.png and home-mobile-00: under each lamp the wall is clearly lighter than a metre to the side, and the paving in front of LePalatier is warmer than in front of lakrem. Likely owner: src/components/three/Street.tsx (lights near lines 178 to 181, lamp 366 to 382, room light 420), textures.ts, palette.ts.
2. Shutters: dark steel, and more open (fidelity, MATERIAL). Bring the slat texture from #966d7a to the comp's value (#574353 to #604e59), cooler, with a crisp highlight and shadow per slat. Open LePalatier's shutter on the first stop until the opening is about 60% of the doorway (now about 37%), so the lit room is the brightest area on the first screen; move or lower the counter so it does not block it. Check by sampling the shutter centre in hero-repro.png and measuring the opening. Likely owner: textures.ts (slats), palette.ts (steel), timeline.ts (`street` key, shutter 0.5).
3. Frame the first screen and stop 3 so no dead plane closes it (fidelity, composition). Right edge: end on the lit crimson wall or pier, never the unlit gable and box (#1a0007; 30 px at 1440, about 7% at 2688, a third of the phone frame at home-mobile-02). Lower left: replace the flat #0d0e2b corner with paved kerb and road. produce: paving and kerb texture. Add the comp's lit street lamp with its wire to the roof, the basalt wall and two or three palms. Phone first screen: show at least three shopfronts, as home-mobile-07 does. Likely owner: timeline.ts (desk and phone frames of `street` and `address`), Street.tsx (ground near 205 to 220, street furniture).
4. Turn "On the street now" from a card grid into a street (contract, THESIS). One continuous terrace on the cobalt ground: shop touching shop, one roofline and lambrequin, one pavement, facts on plaques beneath each, scrolling sideways on a phone. Check: no gaps between shopfronts, no pale ground, no separate cards in home-desktop-08 and home-mobile-08. Likely owner: src/app/page.tsx and the listing card component. The /businesses index may stay a list.
5. Make three stops show their subject (contract, STORY). Stop 5: the plan must read as a document (a cover with the business's name and "Strategy" in its own lettering, page edges) and fill the frame; it is a blank slab now (home-desktop-04, home-mobile-04). Stop 8 on desktop: bring the camera in until the terrace spans at least two thirds of the width (home-desktop-07). Stop 3 on desktop: frame the pier, plaque and letter slot, not the shutter (home-desktop-02). Likely owner: timeline.ts (`strategy`, `all`, `address`), Street.tsx (props near 463 to 494), textures.ts.
6. Remove the kicker from all seven walk cards (floor: banned, no brief earns it back). "THE SIGN", "THE ADDRESS", "BEHIND THE SHUTTER", "THE COUNTER", "THE WALL", "THE ROOM", "THE WHOLE STREET" each sit as a small label above the h2, live and in the fallback. The place name already lives in the stop marks' labels and can show there on hover and focus. Check: no label above any h2 in home-desktop-01 to 07 or home-plain-desktop-01, 02. Owner: src/components/Walk.tsx line 137 (`stop.place`), stop marks at line 93.
7. Settle the empty stage in states/walk-last-stop.png (evidence, and "complete without WebGL"). The stage behind the last card is one flat colour, #0e328f, across 670,800 pixels: no street, no sky, no still, 1.5 s after an instant jump to the walk's end (scripts/behaviour.mjs lines 120 to 126). Either the capture read an idle demand-loop canvas as empty, or a visitor who jumps (stop marks, #walk-all, the End key) sees an empty stage. Reproduce in a headed browser with motion on. If real, keep a still under the canvas until a frame at the new position has drawn. Either way add a "canvas is not blank" assertion at that step and recapture the file. Likely owner: Stage.tsx, Street.tsx (frame loop at line 94, draw and ready near 588 to 624), scripts/behaviour.mjs.
8. Close the build record honestly (persistence). state.json leaves `plates` open and failed and `hero`, `sections`, `motion`, `responsive` unopened, with no hero score; the one measurement is 0.53 against a 0.72 floor. Record those phases as skipped with the owner's own words ("3D plus a painted sky"), and tell the owner in the verdict that the first screen was judged by eye against the mock-up, not proven by measurement.

Minor notes, not material:

- Headline: one weight heavier, or a thicker shade, would close the gap to the comp's lettering.
- SOUFFLE and kazprop boards do not read at first-screen distance. They are the listings' own wordmarks, so keep them; a darker ink or a stronger board edge at distance would help.
- Nothing at the foot of the first screen says the page scrolls, now that the comp's saffron band is gone.
- Stop 7 on desktop: nudge the camera or the card so the card does not cut the SAMPLE tag or a plaque.
- Stop 3: the picture is the town plaque while the words are about the web address. `domain` in businesses.ts is printed only once confirmed; when it is, paint it on the fascia or letter slot.
- The navy box at the right of stops 3 and 8 has no identity. Make it something or remove it.
- Horizon: the comp's coral and orange band is violet and magenta in the build.
- Section edges: pick one lambrequin tooth for the page and the 3D, and give the statement-to-questions edge the same edge as the rest (home-desktop-11).
- Fallback on a phone: the still for the address stop crops out the plaque (home-plain-mobile-01).
- The statement band could take the painted lettering with its shade; it is the second place the device belongs.

## keep

The comp's composition as built (LePalatier large at the right, the terrace running away left under its own roofs, the words across the sky), the listings' real wordmarks on the boards, the opaque legible cards, the sample marking everywhere, and a fallback made from the 3D's own stills: fix the light, the surfaces and the frames around these without flattening the street into a picture or the page into a catalogue.

---

# Verdict pass, after the fix batch

Recaptures pass check 0: desktop.png (1440 x 10386) and mobile.png (390 x 10797) equal the sum of their slices, hero-repro.png is 2688 x 1520, and states/walk-last-stop.png now holds 48,130 colours across the stage where it held one. Read for this pass: hero-repro.png, home-desktop-00 to 08, home-mobile-00, 02, 04, 08 and 09, home-plain-desktop-01, states/walk-last-stop.png, the street region pair, state.json, and the size shots 1920x1080, 1366x768, 1024x768, 768x1024 and 375x667 (the blue oval in the two older size shots was ignored as instructed). The builder's account was not taken as evidence: every line below rests on a capture or a file. The tool's score (0.50, was 0.53) was not used; it still marks the chrome rows missing for the reason given in the review.

## verdict

| # | Fix | Score | What the recapture shows |
| --- | --- | --- | --- |
| 1 | Light the street | resolved | Every sign has two gooseneck lamps with a glow and a halo on the wall (home-desktop-01: two warm pools on the crimson wall and a sheen on the board; home-desktop-00: lakrem's eaves and the samples' lamps lit). The open room lights the paving (home-desktop-06, home-desktop-07, home-desktop-00 along the kerb). The far street lamp is lit. At the comp's own size the paving patch is out of frame: see regression R1. |
| 2 | Shutters dark steel, more open | resolved | Slats are dark with a lit lip on all six shops (home-desktop-00, -01, hero-repro.png). LePalatier's opening is about two thirds of the doorway and the room is the brightest area on the first screen; the counter is out of the doorway (home-desktop-00, home-mobile-00). |
| 3 | Frame the first screen and stop 3 | resolved | Right edge ends on the crimson wall and pier, no dark gable (home-desktop-00, hero-repro.png). Road is tar, paving has joints, the far end has the lit lamp, its wire, a basalt wall and palms, and the horizon carries the coral afterglow. Phone first screen shows three shopfronts (home-mobile-00). Stop 3 frames the pier, plaque and letter slot square on at both sizes (home-desktop-02, home-mobile-02). The new anchoring brought R1 and R3 with it. |
| 4 | "On the street now" as a street | resolved | One terrace on the dusk ground: six shopfronts wall to wall under one roofline and one scallop line, on one pavement, plaques and facts beneath (home-desktop-08). On a phone it scrolls sideways, with the second shop cut at the edge as the cue (home-mobile-08). No pale ground, no separate cards. |
| 5 | Stops 5, 8 and 3 show their subject | resolved | Stop 5 is a bound document with its cover up, "LePalatier, Business strategy", filling the frame (home-desktop-04, home-mobile-04). Stop 8 on desktop runs the terrace across about 70% of the width (home-desktop-07, states/walk-last-stop.png). Stop 3 as in row 3. |
| 6 | Kicker removed | resolved | No label above any h2 in home-desktop-01 to 07, home-mobile-02 and 04, or the fallback (home-plain-desktop-01). Walk.tsx now prints `stop.place` only inside the stop mark (lines 93 to 96). The cards are enamel plaques with a white rim. |
| 7 | Empty stage after a jump | resolved | states/walk-last-stop.png shows the whole street behind the last card. scripts/behaviour.mjs samples the stage every 400 ms for four seconds and fails on a flat stage (lines 127 to 134); Stage.tsx removes the still only once the canvas is opaque (line 104). |
| 8 | Close the build record | partial | README (lines 253 to 254) and STORY (line 293) now say in plain words that the first screen was judged by eye and not proven by measurement, and the surface brief says why. state.json is unchanged: `plates` open with its failed gate, `hero`, `sections`, `motion` and `responsive` pending, `hero.gate` null. The builder was refused the skip and rightly did not work around it. The owner has not yet been told. |

Regressions the batch introduced:

- R1, material. Short viewports cut the street off at the knees. At the comp's own size (hero-repro.png, 1344 x 760 CSS px) the bottom edge now cuts LePalatier's room above its floor: no floor, no plinth, no paving and no light on it across the right half of the frame, all of which the comp shows and the previous hero-repro.png kept in frame. The same crop shows in size-1366x768.png, more severely in size-1024x768.png (no ground at all, and the "Walk the street" pill sits on two shopfronts), and in size-375x667.png (the street is roofs and signs only; no doorway, no lit room). 1440 x 900, 1920 x 1080, 768 x 1024 and 390 x 844 are sound.
- R2, minor. The far street lamp's glow draws as a tall flame-shaped streak on the first screen (home-desktop-00 near x 148, y 575 to 640; hero-repro.png; size-1920x1080.png). At stop 8 the same lamp has a round halo (home-desktop-07).
- R3, minor. The MOKA plaque is clipped by the right edge on the first screen: readable but cut on desktop (home-desktop-00, hero-repro.png), a blue sliver on the phone (home-mobile-00). The comp and the previous build showed it whole on its pier.

## remaining

- Fix 8, partial. It closes only by the owner's word. Tell the owner, in the verdict, that the first screen was judged by eye against mock-up B and never proven by measurement (0.50 against a 0.72 floor, on a tool that does not read live 3D well). If the owner accepts that on the record, the `plates` and `hero` phases can be recorded as skipped with that sentence quoted; if not, a raster proof is owed. Until one of the two happens the build record stays open.
- R1, open. Keep the kerb line inside the frame at every size: at aspect ratios near 16:9 with heights under about 800 px, at 1024 x 768 and at 375 x 667, pull the camera back or lower its aim until the paving under LePalatier's doorway, with the room's light on it, shows across the full width, and keep the pill clear of the shopfronts. Check: hero-repro.png, size-1366x768.png, size-1024x768.png and size-375x667.png each show LePalatier's floor and paving beneath it. Likely owner: src/components/three/timeline.ts (the `street` frames) and the aspect anchoring added to Street.tsx in this batch.
- R2 and R3, minor, not blocking: give the far lamp the round halo it has at stop 8, and bring the MOKA plaque whole into the frame when R1 is reframed.
- Fixes 1 to 7: nothing stays open.

disposition: fix

---

# Second verdict pass, after the regression batch

Recaptures pass check 0: desktop.png (1440 x 10386) and mobile.png (390 x 10797) equal the sum of their slices, hero-repro.png is 2688 x 1520, every file was retaken on this build. Read for this pass: hero-repro.png; home-desktop-00, 01, 02, 06, 07; home-mobile-00, 02, 07; states/walk-last-stop.png; state.json; and the size shots 1920x1080, 1366x768, 1280x720, 1024x768, 768x1024 and 375x667. The builder's account was not taken as evidence. The tool's score (0.51) was not used.

## verdict

| Item | Score | What the recapture shows |
| --- | --- | --- |
| R1, short viewports cut the street's foot | resolved | At the comp's own size LePalatier stands on its floor and plinth with paving and the room's light beneath it across the full width (hero-repro.png). The same holds in size-1366x768.png, size-1280x720.png, size-1024x768.png and size-768x1024.png. In size-375x667.png the whole terrace, its doorway, lit room and pavement are in frame. The pill is gone below 1200 px and sits on open road above it (hero-repro.png, size-1280x720.png), so it covers no shopfront. |
| R2, flame-shaped lamp glow | resolved | The far lamp carries a round halo on the first screen (home-desktop-00, hero-repro.png, size-1920x1080.png, size-1280x720.png) and at stop 8 (home-desktop-07). |
| R3, MOKA plaque clipped | resolved | The plaque is whole on its pier on desktop (home-desktop-00, hero-repro.png, size-1366x768.png) and on the phone (home-mobile-00). |
| Fix 8, close the build record | partial, unchanged | state.json still shows `plates` open with its failed gate, `hero`, `sections`, `motion` and `responsive` pending, and `hero.gate` null. README and STORY state that the first screen was judged by eye and not proven by measurement. The owner has not yet been told; the wording the coordinator intends to use is accurate and complete. |
| Fixes 1 to 7 | resolved, as scored in the first verdict pass | Spot checks on this build hold: lamps, halos and dark steel shutters (home-desktop-01), stop 3 square on the pier (home-desktop-02, home-mobile-02), stop 8 across the width (home-desktop-07, home-mobile-07), no kickers, and a drawn street behind the last card after a jump (states/walk-last-stop.png). |

What this batch broke: nothing material. Two things it traded, both minor and neither affecting the word:

- Below 1200 px wide, which is every phone and tablet, nothing at the foot of the first screen says the page scrolls, now that the pill is desktop only (home-mobile-00, size-768x1024.png, size-375x667.png).
- To keep the ground in frame, the street is smaller on short stages: at the comp's own size LePalatier's board is about three quarters of the width it has in the comp (hero-repro.png), and at 375 x 667 only LePalatier's sign reads. A fair price for a grounded shop.

The room stop no longer overlaps a SAMPLE tag (home-desktop-06). One untidiness seen in the last pass is unchanged and still minor: at stop 3 on desktop the card sits over the wall screen and a sliver of its frame shows round the card (home-desktop-02).

## remaining

- Fix 8, partial. This is the only open item, and the builder cannot close it. It closes by the owner's word: told that the first screen was judged by eye against mock-up B and never proven by measurement (0.51 against a 0.72 floor, on a tool that reads live 3D poorly), and that the plates and hero phases stand open in state.json, the owner either accepts the eye judgement on the record, after which those phases may be recorded as skipped with that sentence quoted, or asks for a raster proof.
- R1, R2, R3 and fixes 1 to 7: clear.
- On the page itself nothing from either list stays open.

The word below is derived, not felt: a partial material finding cannot recompute to ship, so it stays where it is until the owner has answered. It names an open record, not an open defect on the page.

disposition: fix
