// The app's icons, for a phone's home screen and a computer's dock. Every one is drawn from the
// site's mark (src/app/icon.svg), so there is one drawing and nothing to keep in step by hand. Run
// it again when the mark changes, then raise VERSION in public/sw.js so the new icons replace the
// kept ones.
//
//   node scripts/icons.mjs
//
// It writes, into public/icons:
//   icon-192.png, icon-512.png                      the mark as drawn, round corners and all
//   icon-maskable-192.png, icon-maskable-512.png    the mark at about 62 percent on a full square
//                                                   of ink, so a platform can cut it to its own shape
// and src/app/apple-icon.png, 180 by 180: the mark on a full square of ink with nothing
// transparent, because iOS rounds the corners itself and paints black behind a gap.
//
// Each file says inside itself what it is and what made it (EXIF, ImageDescription).
//
// Needs: sharp (devDependency).
import { mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const at = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url));
const mark = readFileSync(at("src/app/icon.svg"));

const INK = "#0a1639"; // --palette-ink: the mark's own ground
const MASK_SCALE = 0.62; // a platform may keep only the middle four fifths of a maskable icon

/** The mark as drawn, at one size. Its corners stay transparent. */
const plain = (size) => sharp(mark).resize(size, size);

/** The mark made smaller on a full square of ink: nothing a mask can cut matters. */
async function maskable(size) {
  const inner = 2 * Math.round((size * MASK_SCALE) / 2); // even, so it sits exactly in the middle
  const small = await sharp(mark).resize(inner, inner).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 3, background: INK } }).composite([{ input: small }]).removeAlpha();
}

/** The mark at full size with ink behind its corners: a square with no transparency. */
const solid = (size) => sharp(mark).resize(size, size).flatten({ background: INK });

const FILES = [
  ["public/icons/icon-192.png", () => plain(192), "The biznes.mu mark."],
  ["public/icons/icon-512.png", () => plain(512), "The biznes.mu mark."],
  ["public/icons/icon-maskable-192.png", () => maskable(192), "The biznes.mu mark on a full square of ink, for a platform to mask."],
  ["public/icons/icon-maskable-512.png", () => maskable(512), "The biznes.mu mark on a full square of ink, for a platform to mask."],
  ["src/app/apple-icon.png", () => solid(180), "The biznes.mu mark on a full square of ink, for the iOS home screen."],
];

mkdirSync(at("public/icons"), { recursive: true });
for (const [path, draw, is] of FILES) {
  const image = await draw();
  const info = await image
    .withExif({ IFD0: { ImageDescription: `${is} Drawn from src/app/icon.svg by scripts/icons.mjs. No image was generated.`, Software: "scripts/icons.mjs" } })
    .png({ compressionLevel: 9 })
    .toFile(at(path));
  console.log(`${path}  ${info.width} x ${info.height}  ${info.channels === 4 ? "transparent corners" : "no transparency"}  ${(info.size / 1024).toFixed(1)} KB`);
}
