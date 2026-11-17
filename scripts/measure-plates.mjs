// Finds a flat painted region on a plate (a blank sign board, a plaque, a shutter) from one point
// inside it, and prints its four corners in the plate's own pixels.
//
//   node scripts/measure-plates.mjs <plate.png> <name:x,y[:tolerance]> [...] [--draw out.png]
//
// The plates are painted with every board, plaque and screen left blank, so that what is true (a
// listing's own lettering, its town, a sample's tag) is set over them in code. This is how each
// blank was located: a flood from a point inside it, stopped by the painted frame around it, then
// the region's four extreme corners. Colour is compared by hue and saturation more than by
// brightness, because a lamp's pool lies across most boards. --draw saves the plate with every
// found quad outlined, to be looked at before a number is used.
//
// Needs: sharp (devDependency).
import sharp from "sharp";

const [file, ...rest] = process.argv.slice(2);
const drawAt = rest.indexOf("--draw");
const out = drawAt >= 0 ? rest[drawAt + 1] : null;
const seeds = (drawAt >= 0 ? rest.slice(0, drawAt) : rest).map((s) => {
  const [name, at, tol] = s.split(":");
  const [x, y] = at.split(",").map(Number);
  return { name, x, y, tol: tol ? Number(tol) : 26 };
});

const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

/** A pixel as (luma, two chroma axes): chroma weighs four times what luma does. */
function at(i) {
  const r = data[i * C], g = data[i * C + 1], b = data[i * C + 2];
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  return [y, (r - y) * 0.9, (b - y) * 0.9];
}

const quads = [];
for (const s of seeds) {
  // The seed's colour is the mean of a small patch around it.
  const ref = [0, 0, 0];
  let n = 0;
  for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
    const p = at((s.y + dy) * W + s.x + dx);
    ref[0] += p[0]; ref[1] += p[1]; ref[2] += p[2]; n++;
  }
  ref.forEach((_, k) => (ref[k] /= n));
  const seen = new Uint8Array(W * H);
  const stack = [s.y * W + s.x];
  seen[stack[0]] = 1;
  let count = 0;
  const ext = { a: [Infinity, 0, 0], b: [-Infinity, 0, 0], c: [-Infinity, 0, 0], d: [Infinity, 0, 0] };
  let minX = W, maxX = 0, minY = H, maxY = 0;
  while (stack.length) {
    const i = stack.pop();
    const x = i % W, y = (i - x) / W;
    count++;
    if (x + y < ext.a[0]) ext.a = [x + y, x, y]; // top left
    if (x - y > ext.b[0]) ext.b = [x - y, x, y]; // top right
    if (x + y > ext.c[0]) ext.c = [x + y, x, y]; // bottom right
    if (x - y < ext.d[0]) ext.d = [x - y, x, y]; // bottom left
    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    for (const j of [i - 1, i + 1, i - W, i + W]) {
      if (j < 0 || j >= W * H || seen[j]) continue;
      const jx = j % W;
      if (Math.abs(jx - x) > 1) continue;
      const p = at(j);
      const d = Math.hypot((p[0] - ref[0]) * 0.25, p[1] - ref[1], p[2] - ref[2]);
      if (d > s.tol) continue;
      seen[j] = 1;
      stack.push(j);
    }
  }
  const q = [ext.a, ext.b, ext.c, ext.d].map(([, x, y]) => [x, y]);
  quads.push({ name: s.name, q, box: [minX, minY, maxX - minX, maxY - minY], count });
  console.log(`${s.name}: quad ${JSON.stringify(q)}  box ${JSON.stringify([minX, minY, maxX - minX, maxY - minY])}  ${count} px`);
}

if (out) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
    quads.map(({ name, q }) => `<polygon points="${q.map((p) => p.join(",")).join(" ")}" fill="none" stroke="#00ff66" stroke-width="5"/><text x="${q[0][0]}" y="${q[0][1] - 12}" font-size="44" fill="#00ff66" font-family="sans-serif">${name}</text>`).join("") +
    `</svg>`;
  // Two passes: sharp resizes before it composites, whatever order they are asked in.
  const marked = await sharp(file).removeAlpha().composite([{ input: Buffer.from(svg) }]).png().toBuffer();
  await sharp(marked).resize({ width: 1920 }).jpeg({ quality: 82 }).toFile(out);
}
