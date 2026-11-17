// Cuts the painted plates for the site, and writes where each came from beside it.
//
//   node scripts/prepare-plates.mjs
//
// The street is painted, not rendered. Five masters live in assets/plates, each one generated image
// with its prompt beside it (<name>.prompt.txt):
//
//   street       the street at an angle: the home page's first picture
//   lepalatier   the first business, front-on, its shutter up and its room lit
//   counter      a close view of the document on the counter in that room
//   certificate  a close view of the framed certificate on its wall
//   terrace      all six shopfronts front-on, on a transparent ground
//
// Every sign board, plaque, screen and paper on them was painted blank. What is true (a listing's
// own lettering, its town, a sample's tag) is set over them in code, from the data, at the places
// measured with scripts/measure-plates.mjs and recorded in src/data/plates.ts.
//
// The site ships WebP at two widths, the terrace's painted band, and one crop per shop from it. A WebP cannot carry a
// prompt inside it, so each file gets a .json sidecar saying what it is, what made it and from what.
//
// Needs: sharp (devDependency).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const GENERATOR = "Higgsfield, model gpt_image_2_6, high quality";

/** The masters: what each is, when it was made, and what it was painted from. */
const MASTERS = {
  street: {
    is: "A painted street of six shopfronts at blue hour, seen at an angle. A generated illustration, not a photograph of a real place. Its sign boards and plaques are blank: the lettering on the site is set over it in code.",
    generated: "17 November 2026, job 023f4767-a203-4da5-995f-0af8ba6da66e, with the approved mock-up (.impeccable/mocks/comp-b-perspective.png) as its reference",
    widths: [3840, 1920],
    quality: 80,
  },
  lepalatier: {
    is: "A painted shopfront seen front-on at blue hour, its shutter up and its room lit. A generated illustration, not a photograph of a real place. Its board, plaque, screen and certificate are blank: what the site shows on them is set over it in code.",
    generated: "17 November 2026, job 22658b5b-c959-4948-8c2b-71a0d8d1210c, with two of the owner's mock-ups as its references",
    widths: [2880, 1440],
    quality: 80,
  },
  counter: {
    is: "A painted close view of a bound document lying on a counter in a lit room. A generated illustration, not a photograph. The document's cover is blank: what the site shows on it is set over it in code.",
    generated: "17 November 2026, job aa11c069-f8d4-4b7f-be34-a0d051f4a396, with the first business's own plate as its reference",
    widths: [2048, 1024],
    quality: 80,
  },
  certificate: {
    is: "A painted close view of a framed certificate on a plastered wall. A generated illustration, not a photograph. The paper is blank: the lines and the seal the site shows on it are set over it in code, and say nothing.",
    generated: "17 November 2026, job 1ee2c137-0454-4403-9285-c00f6946efce, with the first business's own plate as its reference",
    widths: [2048, 1024],
    quality: 80,
  },
  terrace: {
    is: "A painted terrace of six shopfronts seen front-on at blue hour, on a transparent ground. A generated illustration, not a photograph of a real place. Its sign boards and plaques are blank: the lettering on the site is set over it in code.",
    generated: "17 November 2026, job 8206df3e-ca03-4542-81ab-1edfbea727ed, with two of the owner's mock-ups as its references",
    widths: [3840, 1920],
    quality: 82,
  },
};

/**
 * Each shop by itself, for a card: from the inside of its left pier to the edge of the next pier,
 * in the terrace master's pixels (the same numbers as `crop` in src/data/plates.ts).
 */
const SHOPS = [
  ["lepalatier", 132, 561],
  ["lakrem", 764, 534],
  ["souffle", 1364, 529],
  ["bouke", 1964, 534],
  ["larout", 2567, 540],
  ["kazprop", 3176, 538],
];
/** The painted band of the terrace master, top (the roof's highest post) to bottom (the pavement's edge). */
const TERRACE_TOP = 270;
const TERRACE_HEIGHT = 1175;

const sidecar = (file, meta) => writeFileSync(`${file}.json`, JSON.stringify(meta, null, 2) + "\n");
const report = (file, info) => console.log(`${file}  ${info.width} x ${info.height}  ${Math.round(info.size / 1024)} KB`);

mkdirSync("public/img/plates", { recursive: true });
mkdirSync("public/img/shops", { recursive: true });

for (const [name, m] of Object.entries(MASTERS)) {
  const master = `assets/plates/${name}.webp`;
  const prompt = readFileSync(`assets/plates/${name}.prompt.txt`, "utf8").trim();
  // The master itself says where it came from too.
  const meta = await sharp(master).metadata();
  sidecar(master, {
    file: master,
    is: `The master. ${m.is}`,
    made: `Saved as generated, at ${meta.width} x ${meta.height}, as WebP at quality 95. Nothing was retouched.`,
    generator: `${GENERATOR}, ${m.generated}`,
    prompt,
  });
  for (const width of m.widths) {
    const out = `public/img/plates/${name}-${width}.webp`;
    // The terrace ships as its painted band only: the master is transparent above and below it.
    const source = name === "terrace" ? sharp(master).extract({ left: 0, top: TERRACE_TOP, width: meta.width, height: TERRACE_HEIGHT }) : sharp(master);
    const info = await source.resize({ width }).webp({ quality: m.quality, alphaQuality: 90 }).toFile(out);
    sidecar(out, {
      file: out.replace("public", ""),
      is: m.is,
      made: `scripts/prepare-plates.mjs, from ${master}${name === "terrace" ? `, the painted band ${meta.width} x ${TERRACE_HEIGHT} at 0, ${TERRACE_TOP}` : ""}, resized to ${info.width} x ${info.height}, WebP quality ${m.quality}`,
      generator: `${GENERATOR}, ${m.generated}`,
      prompt,
    });
    report(out, info);
  }
}

// The first shop's shutter, for its own plate, where the shutter rolls up as the walk reaches the
// room: the painted slats of the same shop's shutter on the terrace, drawn to the width of the
// doorway. Its bottom rail is left off: at that size the rail's small painted locks read as smudges.
{
  const out = "public/img/plates/shutter.webp";
  const region = { left: 186, top: 882, width: 412, height: 424 };
  const info = await sharp("assets/plates/terrace.webp")
    .extract(region)
    .resize({ width: 860, height: 634, fit: "fill", kernel: "lanczos3" })
    .sharpen({ sigma: 0.8 })
    .webp({ quality: 84 })
    .toFile(out);
  sidecar(out, {
    file: out.replace("public", ""),
    is: "A painted roller shutter: the slats of the first shop's own, cut from the painted terrace and drawn to the width of its doorway. A generated illustration, not a photograph.",
    made: `scripts/prepare-plates.mjs, from assets/plates/terrace.webp, the region ${region.width} x ${region.height} at ${region.left}, ${region.top} (the slats, without the bottom rail), resized to ${info.width} x ${info.height}, WebP quality 84`,
    generator: `${GENERATOR}, ${MASTERS.terrace.generated}`,
    prompt: readFileSync("assets/plates/terrace.prompt.txt", "utf8").trim(),
  });
  report(out, info);
}

// The first shop's room, seen through its doorway: what its shutter rises over on a card.
{
  const out = "public/img/plates/room.webp";
  const info = await sharp("assets/plates/lepalatier.webp").extract({ left: 571, top: 1246, width: 1719, height: 1267 }).resize({ width: 860 }).webp({ quality: 82 }).toFile(out);
  sidecar(out, {
    file: out.replace("public", ""),
    is: "The first shop's lit room, cut from its own painted plate. A generated illustration, not a photograph. Its screen and certificate are blank here.",
    made: `scripts/prepare-plates.mjs, from assets/plates/lepalatier.webp, the region 1719 x 1267 at 571, 1246, resized to ${info.width} x ${info.height}, WebP quality 82`,
    generator: `${GENERATOR}, ${MASTERS.lepalatier.generated}`,
    prompt: readFileSync("assets/plates/lepalatier.prompt.txt", "utf8").trim(),
  });
  report(out, info);
}

// One crop per shop, for a business shown by itself: its card in the catalogue, its own page. The
// piers of the terrace stand on its party walls, in front of them, and a pier's capital and base
// are wider than its shaft, so a straight cut beside a pier leaves two slivers of it in the
// neighbour's picture. Each is covered with the shop's own wall, smeared from the column beside it.
const terracePrompt = readFileSync("assets/plates/terrace.prompt.txt", "utf8").trim();
const BANDS = [
  [858 - TERRACE_TOP, 76], // a capital
  [1222 - TERRACE_TOP, 146], // a base, down past the pavement's edge
];
for (const [slug, left, width] of SHOPS) {
  const raw = await sharp("assets/plates/terrace.webp").extract({ left, top: TERRACE_TOP, width, height: TERRACE_HEIGHT }).png().toBuffer();
  const cover = [];
  for (const [top, height] of BANDS) {
    // At the left edge, the last of this shop's own pier; at the right, the first of the next one.
    for (const [x, w, from] of [
      [0, 18, 19],
      [width - 26, 26, width - 27],
    ]) {
      const column = await sharp(raw).extract({ left: from, top, width: 1, height }).png().toBuffer();
      cover.push({ input: await sharp(column).resize({ width: w, height, fit: "fill" }).png().toBuffer(), left: x, top });
    }
  }
  const clean = await sharp(raw).composite(cover).png().toBuffer();
  for (const scale of [1, 0.5]) {
    const out = `public/img/shops/${slug}-${Math.round(width * scale)}.webp`;
    const info = await sharp(clean)
      .resize({ width: Math.round(width * scale) })
      .webp({ quality: 84, alphaQuality: 90 })
      .toFile(out);
    sidecar(out, {
      file: out.replace("public", ""),
      is: `One shopfront cut from the painted terrace: the one that stands for the listing "${slug}". A generated illustration, not a photograph of a real place. Its sign board and its plaque are blank: the listing's lettering and its number are set over them in code.`,
      made: `scripts/prepare-plates.mjs, from assets/plates/terrace.webp, the region ${width} x ${TERRACE_HEIGHT} at ${left}, ${TERRACE_TOP}; the slivers of the neighbouring piers' capitals and bases at its two edges covered with its own wall; resized to ${info.width} x ${info.height}, WebP quality 84`,
      generator: `${GENERATOR}, ${MASTERS.terrace.generated}`,
      prompt: terracePrompt,
    });
    report(out, info);
  }
}
