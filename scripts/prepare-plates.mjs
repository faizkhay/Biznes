// Cuts the painted sky plate for the site, and writes where it came from beside it.
//
//   node scripts/prepare-plates.mjs
//
// assets/plates/sky.png is the master: one generated image (its prompt is embedded in the file and
// kept beside it as sky.prompt.txt). The site ships two WebP widths; a WebP cannot carry the prompt
// inside it, so each gets a .json sidecar saying what it is, what made it and from what.
//
// Needs: sharp (devDependency).
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const master = "assets/plates/sky.png";
const prompt = readFileSync("assets/plates/sky.prompt.txt", "utf8").trim();

// The grade: the generated sky is a brighter blue through its middle than the mock-up's sky (and
// the page's own dusk, #0e328f, which was sampled from it). A multiply gradient brings that band
// down to the mock-up's value and leaves the afterglow along the horizon untouched.
const grade = (w, h) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="#ebebeb"/><stop offset="0.42" stop-color="#bdc7c7"/><stop offset="0.6" stop-color="#cdd4d4"/><stop offset="0.82" stop-color="#ffffff"/>` +
      `</linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/></svg>`,
  );

for (const [width, quality] of [[2400, 82], [1200, 80]]) {
  const out = `public/img/sky-${width}.webp`;
  const sized = await sharp(master).resize({ width }).toBuffer({ resolveWithObject: true });
  const info = await sharp(sized.data)
    .composite([{ input: grade(sized.info.width, sized.info.height), blend: "multiply" }])
    .webp({ quality })
    .toFile(out);
  writeFileSync(
    `${out}.json`,
    JSON.stringify(
      {
        file: out.replace("public", ""),
        is: "A painted blue-hour sky, the backdrop of the 3D street. A generated image, not a photograph of a real place.",
        made: `scripts/prepare-plates.mjs, from ${master}, resized to ${info.width} x ${info.height}, graded darker through its upper band to match the mock-up's sky, WebP quality ${quality}`,
        generator: "Higgsfield, model gpt_image_2_6, 17 November 2026, with the approved mock-up (.impeccable/mocks/comp-b-perspective.png) as its colour reference",
        prompt,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`${out}  ${info.width} x ${info.height}  ${Math.round(info.size / 1024)} KB`);
}
