// Region medians from the approved mock-up, for the street's own materials (tin, steel, lamplight,
// pavement). The interface's palette was measured by impeccable's comp-spec; this samples what that
// did not name. The values it prints are the ones recorded in src/app/globals.css and
// src/components/three/palette.ts, each with the region it came from.
//
//   node scripts/sample-comp.mjs
//
// Needs: sharp (devDependency).
import sharp from "sharp";
const comp = ".impeccable/mocks/comp-b-perspective.png";
const regions = {
  // name: [x, y, w, h] as fractions of the comp (read off the 1600 x 905 view)
  "tin roof (LePalatier, lit face)": [0.72, 0.2, 0.12, 0.08],
  "tin roof (far shops, shade)": [0.3, 0.6, 0.06, 0.03],
  "lambrequin white": [0.66, 0.415, 0.01, 0.012],
  "shutter steel (closed, lakrem)": [0.5, 0.74, 0.07, 0.1],
  "shutter steel (LePalatier, raised part)": [0.7, 0.58, 0.14, 0.07],
  "room wall, lit": [0.72, 0.74, 0.1, 0.1],
  "room floor": [0.74, 0.9, 0.1, 0.03],
  "pavement": [0.3, 0.92, 0.2, 0.03],
  "road": [0.05, 0.93, 0.15, 0.04],
  "LePalatier wall": [0.93, 0.74, 0.05, 0.12],
  "LePalatier sign board": [0.66, 0.4, 0.04, 0.03],
  "sign lettering ivory": [0.745, 0.455, 0.008, 0.02],
  "lamp shade brass": [0.82, 0.335, 0.012, 0.02],
  "plaque enamel": [0.925, 0.565, 0.02, 0.012],
  "horizon coral": [0.02, 0.72, 0.06, 0.04],
};
const { data, info } = await sharp(comp).raw().toBuffer({ resolveWithObject: true });
const med = (a) => a.sort((x, y) => x - y)[a.length >> 1];
for (const [name, [fx, fy, fw, fh]] of Object.entries(regions)) {
  const x0 = Math.round(fx * info.width), y0 = Math.round(fy * info.height);
  const w = Math.round(fw * info.width), h = Math.round(fh * info.height);
  const r = [], g = [], b = [];
  for (let y = y0; y < y0 + h; y += 2) for (let x = x0; x < x0 + w; x += 2) {
    const i = (y * info.width + x) * info.channels;
    r.push(data[i]); g.push(data[i + 1]); b.push(data[i + 2]);
  }
  const hex = "#" + [med(r), med(g), med(b)].map((v) => v.toString(16).padStart(2, "0")).join("");
  console.log(hex, name);
}
