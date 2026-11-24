// Makes a picture's two files for the site from the two it was painted as:
// `node scripts/picture.mjs <name> <wide source> <tall source> [made, as YYYY-MM-DD]` (npm run picture).
//
// Every picture behind the page comes in two shapes (DESIGN.md, "The pictures and the calendar"):
// a wide one for a desk and a phone on its side, and a tall one, painted again for an upright
// screen and not cut out of the wide one. This writes both into public/themes at the sizes the
// site uses, `<name>.jpg` and `<name>-tall.jpg`, each with its record beside it. Leave out a source
// with "-" to keep the file that is there. Then name the picture in src/data/themes.ts and run
// `npm run hero` and `npm run glass`: it must pass both before it is used.
import { existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const [name, wide, tall, made = new Date().toISOString().slice(0, 10)] = process.argv.slice(2);
if (!/^[a-z]+$/.test(name ?? "") || !wide || !tall) {
  console.error("usage: node scripts/picture.mjs <name, in small letters> <wide source | -> <tall source | -> [YYYY-MM-DD]");
  process.exit(1);
}
const out = fileURLToPath(new URL("../public/themes/", import.meta.url));

// The wide picture is 2400 across; the tall one 960 across, which is enough for a phone and light to send.
const SHAPES = [
  { source: wide, file: `${name}.jpg`, width: 2400, quality: 74, is: (w, h) => w > h, shape: "wider than it is tall" },
  { source: tall, file: `${name}-tall.jpg`, width: 960, quality: 72, is: (w, h) => h > w, shape: "taller than it is wide" },
];
for (const { source, file, width, quality, is, shape } of SHAPES) {
  if (source === "-") {
    if (!existsSync(`${out}${file}`)) console.log(`miss  ${file}: no source given and no file there`);
    continue;
  }
  const from = await sharp(source).metadata();
  if (!is(from.width, from.height)) {
    console.error(`${source} is ${from.width} by ${from.height}: ${file} must be ${shape}`);
    process.exit(1);
  }
  const info = await sharp(source).resize({ width, withoutEnlargement: true }).jpeg({ quality, mozjpeg: true }).toFile(`${out}${file}`);
  const record = {
    file,
    kind: "generated illustration",
    made,
    tool: "Higgsfield, model gpt_image_2_6",
    by: "Khay Digital, for biznes.mu",
    note: "An imagined Mauritian scene, painted for the page's background. It is not a photograph of a real place and is never captioned as one.",
    licence: "Generated for this site; no third-party rights.",
  };
  writeFileSync(`${out}${file}.json`, `${JSON.stringify(record, null, 2)}\n`);
  console.log(`made  ${file}: ${info.width} by ${info.height}, ${Math.round(info.size / 1024)} KB`);
}
