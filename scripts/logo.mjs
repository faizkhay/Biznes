// Draws the name: `node scripts/logo.mjs` prints the paths that src/components/Logo.tsx and
// src/app/icon.svg hold. Kept so the mark can be drawn again, or changed, from the same measures.
//
// The b is drawn here, not taken from a typeface: a stem as wide as Manrope Bold's, and a ring as
// tall as its round letters, with a point at the centre. The other letters ("iznes", ".mu") are
// Manrope Bold's own outlines (SIL OFL 1.1), set beside it.
//
// Needs, for the run only: npm install --no-save opentype.js@1.3.4 @fontsource/manrope
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const opentype = require("opentype.js");
const file = readFileSync(require.resolve("@fontsource/manrope/files/manrope-latin-700-normal.woff"));
const font = opentype.parse(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength));
const unit = 1000 / font.unitsPerEm;

// The b's measures, in the font's own units at 1000 to the em: Manrope Bold's stem is 120 wide
// and its lowercase l is 735 tall; its o is 570 tall, 15 of that below the line.
const stemX = 69;
const stem = 120;
const radius = 285;
const cx = stemX + radius;
const cy = -270;
const ascender = 735;
const point = 108;

const circle = (r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const letters = (text, from, tracking) => {
  let d = "";
  let x = from;
  const glyphs = font.stringToGlyphs(text);
  glyphs.forEach((glyph, i) => {
    d += glyph.getPath(x, 0, 1000).toPathData(0);
    x += glyph.advanceWidth * unit + (glyphs[i + 1] ? font.getKerningValue(glyph, glyphs[i + 1]) * unit : 0) + tracking;
  });
  return { d, end: x };
};

const iznes = letters("iznes", stemX + 2 * radius + 34, -6);
const mu = letters(".mu", iznes.end - 4, -6);
console.log(
  JSON.stringify(
    {
      stem: `M${stemX} ${-ascender}h${stem}V0h${-stem}Z`,
      ring: `${circle(radius)} ${circle(radius - stem)}`,
      point: { cx, cy, r: point },
      iznes: iznes.d,
      mu: mu.d,
      viewBox: `${stemX - 4} ${-ascender - 20} ${Math.ceil(mu.end - 20) - stemX + 8} ${ascender + 60}`,
    },
    null,
    2,
  ),
);
