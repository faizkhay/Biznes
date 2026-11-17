// Cuts the painted plates for the site, and writes where each came from beside it.
//
//   node scripts/prepare-plates.mjs
//
// The street is painted, not rendered. Six masters live in assets/plates, each one generated image
// with its prompt beside it (<name>.prompt.txt):
//
//   street       the street at an angle: the home page's first picture
//   lepalatier   the first business, front-on, its shutter up and its room lit
//   counter      a close view of the document on the counter in that room
//   certificate  a close view of the framed certificate on its wall
//   terrace      all six shopfronts front-on, on a transparent ground
//   sky          the dusk sky behind the terrace
//
// Every sign board, plaque, screen and paper on them was painted blank. What is true (a listing's
// own lettering, its town, a sample's tag) is set over them in code, from the data, at the places
// measured with scripts/measure-plates.mjs and recorded in src/data/plates.ts.
//
// The site ships WebP at two widths, and one crop per shop from the terrace. A WebP cannot carry a
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
  sky: {
    is: "A painted blue-hour sky, the backdrop of the terrace. A generated image, not a photograph of a real place.",
    generated: "17 November 2026, with the approved mock-up (.impeccable/mocks/comp-b-perspective.png) as its colour reference",
    widths: [2400, 1200],
    quality: 82,
  },
};

/**
 * Where each shop stands on the terrace master, in its pixels: from its own left pilaster to the
 * next shop's. Measured on the master (scripts/measure-plates.mjs and a gridded crop). The same
 * numbers are in src/data/plates.ts, which places the lettering.
 */
const SHOPS = [
  ["lepalatier", 40, 643],
  ["lakrem", 683, 607],
  ["souffle", 1290, 590],
  ["bouke", 1880, 606],
  ["larout", 2486, 604],
  ["kazprop", 3090, 725],
];
/** The painted part of the terrace master, top (the roof's highest post) to bottom (the pavement's edge). */
const TERRACE_TOP = 270;
const TERRACE_HEIGHT = 1175;

const sidecar = (file, meta) => writeFileSync(`${file}.json`, JSON.stringify(meta, null, 2) + "\n");
const report = (file, info) => console.log(`${file}  ${info.width} x ${info.height}  ${Math.round(info.size / 1024)} KB`);

mkdirSync("public/img/plates", { recursive: true });
mkdirSync("public/img/shops", { recursive: true });

// The sky's grade: the generated sky is a brighter blue through its middle than the mock-up's sky.
// A multiply gradient brings that band down and leaves the afterglow along the horizon untouched.
const grade = (w, h) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="#ebebeb"/><stop offset="0.42" stop-color="#bdc7c7"/><stop offset="0.6" stop-color="#cdd4d4"/><stop offset="0.82" stop-color="#ffffff"/>` +
      `</linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/></svg>`,
  );

for (const [name, m] of Object.entries(MASTERS)) {
  const master = name === "sky" ? "assets/plates/sky.png" : `assets/plates/${name}.webp`;
  const prompt = readFileSync(`assets/plates/${name}.prompt.txt`, "utf8").trim();
  // The master itself says where it came from too. (The sky's PNG carries its prompt inside it.)
  if (name !== "sky") {
    const meta = await sharp(master).metadata();
    sidecar(master, {
      file: master,
      is: `The master. ${m.is}`,
      made: `Saved as generated, at ${meta.width} x ${meta.height}, as WebP at quality 95. Nothing was retouched.`,
      generator: `${GENERATOR}, ${m.generated}`,
      prompt,
    });
  }
  for (const width of m.widths) {
    const out = name === "sky" ? `public/img/sky-${width}.webp` : `public/img/plates/${name}-${width}.webp`;
    let image = sharp(master).resize({ width });
    if (name === "sky") {
      const sized = await image.toBuffer({ resolveWithObject: true });
      image = sharp(sized.data).composite([{ input: grade(sized.info.width, sized.info.height), blend: "multiply" }]);
    }
    const info = await image.webp({ quality: m.quality, alphaQuality: 90 }).toFile(out);
    sidecar(out, {
      file: out.replace("public", ""),
      is: m.is,
      made: `scripts/prepare-plates.mjs, from ${master}, resized to ${info.width} x ${info.height}${name === "sky" ? ", graded darker through its upper band to match the mock-up's sky" : ""}, WebP quality ${m.quality}`,
      generator: `${GENERATOR}, ${m.generated}`,
      prompt,
    });
    report(out, info);
  }
}

// The first shop's shutter, for its own plate, where the shutter rolls up as the walk reaches the
// room: the painted shutter of the same shop on the terrace, drawn to the width of the doorway.
{
  const out = "public/img/plates/shutter.webp";
  const info = await sharp("assets/plates/terrace.webp")
    .extract({ left: 186, top: 882, width: 412, height: 462 })
    .resize({ width: 860, height: 634, fit: "fill", kernel: "lanczos3" })
    .sharpen({ sigma: 0.8 })
    .webp({ quality: 84 })
    .toFile(out);
  sidecar(out, {
    file: out.replace("public", ""),
    is: "A painted roller shutter: the first shop's own, cut from the painted terrace and drawn to the width of its doorway. A generated illustration, not a photograph.",
    made: `scripts/prepare-plates.mjs, from assets/plates/terrace.webp, the region 412 x 462 at 186, 882, resized to ${info.width} x ${info.height}, WebP quality 84`,
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

// One crop per shop, for a business shown by itself: its card in the catalogue, its own page.
const terracePrompt = readFileSync("assets/plates/terrace.prompt.txt", "utf8").trim();
for (const [slug, left, width] of SHOPS) {
  for (const scale of [1, 0.5]) {
    const out = `public/img/shops/${slug}-${Math.round(width * scale)}.webp`;
    const info = await sharp("assets/plates/terrace.webp")
      .extract({ left, top: TERRACE_TOP, width, height: TERRACE_HEIGHT })
      .resize({ width: Math.round(width * scale) })
      .webp({ quality: 84, alphaQuality: 90 })
      .toFile(out);
    sidecar(out, {
      file: out.replace("public", ""),
      is: `One shopfront cut from the painted terrace: the one that stands for the listing "${slug}". A generated illustration, not a photograph of a real place. Its sign board is blank: the listing's lettering is set over it in code.`,
      made: `scripts/prepare-plates.mjs, from assets/plates/terrace.webp, the region ${width} x ${TERRACE_HEIGHT} at ${left}, ${TERRACE_TOP}, resized to ${info.width} x ${info.height}, WebP quality 84`,
      generator: `${GENERATOR}, ${MASTERS.terrace.generated}`,
      prompt: terracePrompt,
    });
    report(out, info);
  }
}
