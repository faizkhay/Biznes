// The icons of the two apps, for a phone's home screen and a computer's dock. Run it again when
// either drawing changes, then raise VERSION in public/sw.js so the new icons replace the kept ones.
//
//   node scripts/icons.mjs
//
// biznes.mu, the whole site. Every icon is drawn from the site's mark (src/app/icon.svg), so there
// is one drawing and nothing to keep in step by hand. It writes, into public/icons:
//   icon-192.png, icon-512.png                      the mark as drawn, round corners and all
//   icon-maskable-192.png, icon-maskable-512.png    the mark at about 62 percent on a full square
//                                                   of ink, so a platform can cut it to its own shape
// and src/app/apple-icon.png, 180 by 180: the mark on a full square of ink with nothing
// transparent, because iOS rounds the corners itself and paints black behind a gap.
//
// Baz Manzer, the section that installs as an app of its own. Its icon is what the section already
// owns: the awning of a food stall, in the brand's red and the paper's cream (.baz-awning in
// src/app/globals.css, the one place the red is used), over the saffron point of the b, on ink. It
// is drawn here from its measures, so nothing is kept by hand. It writes:
//   src/app/baz-manzer/icon.svg                     the drawing itself, with round corners: the
//                                                   section's own icon in a browser's tab
//   public/icons/baz-192.png, baz-512.png           the same, as pictures
//   public/icons/baz-maskable-192.png, baz-maskable-512.png
//                                                   the awning across a full square, with its hem
//                                                   and the point inside the middle four fifths
// and src/app/baz-manzer/apple-icon.png, 180 by 180, a full square with nothing transparent.
//
// Each picture says inside itself what it is and what made it (EXIF, ImageDescription).
//
// Needs: sharp (devDependency).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

// Baz Manzer's awning, on a square of 1000. The cloth is five stripes of 200, red at both edges,
// as the page's awning is red and cream by turns. Each stripe ends in a round hem of half its
// width, as the page's does (a stripe of 1.5rem, a hem of 0.75rem). Under it, in the middle of
// the ink that is left, the point: the b's own, at the b's own size on this square (108).
const CORAL = "#f14949"; // --palette-coral: the brand's red, used for the awning and nothing else
const CREAM = "#fdf9ec"; // --palette-cream: the paper
const SAFFRON = "#f8c618"; // --palette-saffron: the lit point
const STRIPE = 200;
const BAND = 340; // where the cloth ends and its hem begins
const HEM = STRIPE / 2;
const POINT = { cx: 500, cy: (BAND + HEM + 1000) / 2, r: 108 };

/**
 * The awning and the point. `from` and `to` are the stripes drawn, counted from the square's left
 * edge: 0 to 5 fills the square, and a wider run is for the icon a platform cuts to its own shape,
 * where the cloth must reach past the square once the drawing is made smaller.
 */
function awning(from, to, top) {
  let cloth = "";
  for (let i = from; i < to; i++) {
    const x = i * STRIPE;
    // A stripe and its hem in one shape: down the cloth, round the hem, and back up.
    cloth += `<path fill="${i % 2 === 0 ? CORAL : CREAM}" d="M${x} ${top}h${STRIPE}V${BAND}a${HEM} ${HEM} 0 0 1 ${-STRIPE} 0Z"/>`;
  }
  return `${cloth}<circle cx="${POINT.cx}" cy="${POINT.cy}" r="${POINT.r}" fill="${SAFFRON}"/>`;
}

const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">${body}</svg>\n`;
/** As it stands in a browser's tab and on a desk: a square with the mark's own round corners. */
const BAZ_ROUND = svg(`<clipPath id="c"><rect width="1000" height="1000" rx="230"/></clipPath><g clip-path="url(#c)"><rect width="1000" height="1000" fill="${INK}"/>${awning(0, 5, 0)}</g>`);
/** A full square, for the iOS home screen, which rounds the corners itself. */
const BAZ_SQUARE = svg(`<rect width="1000" height="1000" fill="${INK}"/>${awning(0, 5, 0)}`);
/** For a platform to cut: the drawing at four fifths, about the middle, with the cloth run on to the edges. */
const BAZ_MASKABLE = svg(`<rect width="1000" height="1000" fill="${INK}"/><g transform="translate(100 100) scale(0.8)">${awning(-1, 6, -200)}</g>`);

const baz = (drawing, size, opaque = false) => {
  const image = sharp(Buffer.from(drawing)).resize(size, size);
  return opaque ? image.flatten({ background: INK }) : image;
};

const SITE = "Drawn from src/app/icon.svg by scripts/icons.mjs. No image was generated.";
const BAZ = "Drawn from its measures by scripts/icons.mjs. No image was generated.";
const FILES = [
  ["public/icons/icon-192.png", () => plain(192), `The biznes.mu mark. ${SITE}`],
  ["public/icons/icon-512.png", () => plain(512), `The biznes.mu mark. ${SITE}`],
  ["public/icons/icon-maskable-192.png", () => maskable(192), `The biznes.mu mark on a full square of ink, for a platform to mask. ${SITE}`],
  ["public/icons/icon-maskable-512.png", () => maskable(512), `The biznes.mu mark on a full square of ink, for a platform to mask. ${SITE}`],
  ["src/app/apple-icon.png", () => solid(180), `The biznes.mu mark on a full square of ink, for the iOS home screen. ${SITE}`],
  ["public/icons/baz-192.png", () => baz(BAZ_ROUND, 192), `Baz Manzer's awning over the saffron point. ${BAZ}`],
  ["public/icons/baz-512.png", () => baz(BAZ_ROUND, 512), `Baz Manzer's awning over the saffron point. ${BAZ}`],
  ["public/icons/baz-maskable-192.png", () => baz(BAZ_MASKABLE, 192, true), `Baz Manzer's awning across a full square, for a platform to mask. ${BAZ}`],
  ["public/icons/baz-maskable-512.png", () => baz(BAZ_MASKABLE, 512, true), `Baz Manzer's awning across a full square, for a platform to mask. ${BAZ}`],
  ["src/app/baz-manzer/apple-icon.png", () => baz(BAZ_SQUARE, 180, true), `Baz Manzer's awning on a full square, for the iOS home screen. ${BAZ}`],
];

mkdirSync(at("public/icons"), { recursive: true });
writeFileSync(at("src/app/baz-manzer/icon.svg"), BAZ_ROUND);
console.log("src/app/baz-manzer/icon.svg  the drawing of Baz Manzer's icon");
for (const [path, draw, is] of FILES) {
  const image = await draw();
  const info = await image
    .withExif({ IFD0: { ImageDescription: is, Software: "scripts/icons.mjs" } })
    .png({ compressionLevel: 9 })
    .toFile(at(path));
  console.log(`${path}  ${info.width} x ${info.height}  ${info.channels === 4 ? "transparent corners" : "no transparency"}  ${(info.size / 1024).toFixed(1)} KB`);
}
