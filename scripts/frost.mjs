// Makes the soft copy of each picture that glass is laid over: `npm run frost`.
//
// The page's sheet and its cards are smoked glass (DESIGN.md, "Glass"): the day's picture shows
// through them, out of focus and dimmed. Blurring a picture the size of the screen while the page scrolls is work a
// small phone does badly, so the blur is done here, once: each picture in public/themes is made
// small, blurred and written beside it as <name>-frost.jpg (and <name>-sm-frost.jpg for a phone's
// crop). A browser draws it large behind the sheet, and no filter runs on the page for it. Each
// copy has a note beside it saying what it was made from.
//
// A picture a superadmin uploads has no such copy: the page then blurs the picture itself
// (src/app/globals.css, `.frost`).
import { readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const dir = fileURLToPath(new URL("../public/themes/", import.meta.url));
// The longer side of a copy, and how far it is blurred at that size: drawn across a desk's screen
// it reads as a blur of about fifty pixels.
const SIDE = 128;
const BLUR = 4;

const pictures = readdirSync(dir).filter((name) => /^[a-z]+(-sm)?\.jpg$/.test(name)).sort();
let bytes = 0;
for (const name of pictures) {
  const from = sharp(`${dir}${name}`);
  const { width, height } = await from.metadata();
  const scale = SIDE / Math.max(width, height);
  const out = name.replace(/\.jpg$/, "-frost.jpg");
  const made = await from
    .resize(Math.round(width * scale), Math.round(height * scale))
    .blur(BLUR)
    // Richer, then dimmed: no point of a copy is brighter than #666666 (0.4 of white), which is
    // what the glass over it is measured against (src/app/globals.css, --glass-dim).
    .modulate({ saturation: 1.6 })
    .linear(0.4, 0)
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
  writeFileSync(`${dir}${out}`, made);
  writeFileSync(
    `${dir}${out}.json`,
    `${JSON.stringify({ file: out, kind: "derived", from: name, how: `scripts/frost.mjs: made ${SIDE} pixels on its longer side, blurred, made richer and dimmed to four tenths, to stand out of focus behind the page's glass`, by: "Khay Digital, for biznes.mu", licence: `As ${name}: see ${name}.json.` }, null, 2)}\n`,
  );
  bytes += made.length;
  console.log(`${out}  ${made.length} bytes`);
}
console.log(`${pictures.length} soft copies, ${(bytes / 1024).toFixed(1)} kB in all`);
