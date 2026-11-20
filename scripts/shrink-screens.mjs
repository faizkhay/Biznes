// Makes the stitched captures small enough to keep: each PNG in review/screens becomes a JPEG and
// the PNG is removed. JPEG, because a long page is taller than WebP allows.
//
//   node scripts/shrink-screens.mjs [dir]        (default review/screens)
//
// Needs: sharp (devDependency).
import { readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const dir = process.argv[2] ?? "review/screens";
let before = 0;
let after = 0;
for (const name of readdirSync(dir).filter((n) => n.endsWith(".png"))) {
  const from = join(dir, name);
  const to = from.replace(/\.png$/, ".jpg");
  before += statSync(from).size;
  await sharp(from, { limitInputPixels: false }).jpeg({ quality: 72, mozjpeg: true }).toFile(to);
  after += statSync(to).size;
  rmSync(from);
}
console.log(`${dir}: ${(before / 1e6).toFixed(1)} MB of PNG became ${(after / 1e6).toFixed(1)} MB of JPEG`);
