---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: []
---

# Surface brief: the home page (`src/app/page.tsx`)

**Scope and mode:** the home page of biznes.mu. Persuade.

**Audience and job:** a person in Mauritius who could run a business and has no brand yet, on a
phone, sceptical of "business opportunity" pitches. They must understand in seconds that a whole,
finished business is for sale here, believe it is real because they can see it, and ask about one.

**Action:** "See the businesses" in the first view; "Ask about this business" on a business's page.

**Proof and content on hand:** the businesses themselves (LePalatier, and five marked samples),
each with its own lettering and colours; the six things every business comes with; Khay Digital's
published facts. No photographs, no testimonials, no figures.

**Constraints:** KOS standards hold (nothing invented; complete without script and under reduced
motion; WCAG 2.2 AA; a generated picture is never presented as real). Samples are always marked.
Reserved Khay Original vocabulary is not used in copy.

## Direction contract

**THESIS.** A business here is a finished shopfront waiting for its one owner: sign painted, lights
on, shutter down. The page refuses the marketplace grid of listing cards, and refuses the cream
editorial catalogue the first build became.

**OWN-WORLD.** A Mauritian shop street at blue hour. Deep cobalt dusk is the page's ground; lime
washed walls in saffron, turquoise and coral own whole sections; white enamel trims; roller shutter
slats; the scalloped lambrequin under a tin roof as every edge; blue enamel street plaques for
places and numbers; sign painter's capitals in a condensed display face with a hard drop shade.

**STORY.** The visitor sees a street of finished shops, understands each is a whole business sold
once, walks one shopfront to learn what comes with it, sees the empty room that is theirs to fill,
and asks about one.

**FIRST VIEWPORT.** As the owner approved it (mock-up B, "perspective",
`.impeccable/mocks/comp-b-perspective.png`): a full-bleed painted street at dusk, seen at an angle.
LePalatier stands large in the foreground on the right, its sign lit and its shutter raised over a
lit, empty room; the five samples run away from it to the left, each in its own colour under its own
tin roof, each with its real lettering on its sign and a "Sample" tag on its shutter. The headline
in sign capitals sits across the sky, upper left, at the mock-up's own measure, with the lede and
the one filled action beneath it, all above the roofline; the nearest shop's town is on its enamel
plaque. On a phone the words stand at the top and the street runs along the foot of the screen.

**FORM.** "The street": shuttered shopfronts with hand-painted signs. Position 1 on the ordered
list of seven; chosen by the owner on 17 November 2026 over the assigned direction (the quay).
Seed key 8f9b6c58. The street is painted (six plates, `assets/plates`), and the scroll moves through
the paintings. Signature interaction: the first shop's painted shutter rolls up as the walk reaches
its room, and a real business's shutter rolls up when its shopfront is pointed at. Motion grammar:
things roll, push in and switch on (the lamps come on down the street as it arrives).

**FINISH.** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

**Resolved with the owner on 17 November 2026:** mock-up B is the approved composition. It was
first built as true 3D in code with a painted sky ("3D plus a painted sky"). The owner rejected that
the same day, in these words: "3d is shit, i need better aesthetic please. be creative while
relfecting khay standards." The 3D was removed and the street is now painted: generated plates in
the mock-up's own style, with every sign board, plaque, screen and paper painted blank and the
listings' real lettering set over them in code. impeccable's plates gate passes on the painted
street (2 of 2). The first screen measures 72 per cent against the mock-up, the street region 76
(`.impeccable/review/diff/final`). The hero gate's bar is met and the gate still refuses: it looks
for the plate's own PNG named in the page's source, and the site ships that plate as WebP cut from
it. No override was made, so the phase stays open. The palette was sampled from the mock-up and
every pair measured (`scripts/contrast.pairs.json`).
