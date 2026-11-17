// Sets a flat thing (a sign's lettering, a tag) onto a surface seen at an angle in a painting.
//
// The street plate shows its sign boards in perspective. Each board's four corners were measured
// on the plate (scripts/measure-plates.mjs); this works out the one projective transform that
// carries a rectangle onto those four corners, as a CSS `matrix3d`, so lettering drawn flat lies
// on the painted board exactly, and anything placed beside the rectangle (a tag on the shutter
// under it) lies on the same wall.
//
// Plain arithmetic, no dependencies: it runs when the module loads, on the server as well.

type M3 = [number, number, number, number, number, number, number, number, number];
export type Point = [number, number];
/** Four corners in the order top left, top right, bottom right, bottom left. */
export type Quad = [Point, Point, Point, Point];

const adj = (m: M3): M3 => [
  m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4],
  m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5],
  m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3],
];

const mul = (a: M3, b: M3): M3 => {
  const c = [0, 0, 0, 0, 0, 0, 0, 0, 0] as M3;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) c[3 * i + j] += a[3 * i + k] * b[3 * k + j];
  return c;
};

const apply = (m: M3, v: [number, number, number]): [number, number, number] => [
  m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
  m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
  m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
];

/** The transform that carries the unit basis onto four points. */
function basis([p1, p2, p3, p4]: Quad): M3 {
  const m: M3 = [p1[0], p2[0], p3[0], p1[1], p2[1], p3[1], 1, 1, 1];
  const v = apply(adj(m), [p4[0], p4[1], 1]);
  return mul(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]);
}

/** The projective transform that carries a `w` by `h` rectangle at the origin onto `quad`. */
export function onto(w: number, h: number, quad: Quad): M3 {
  const from: Quad = [[0, 0], [w, 0], [w, h], [0, h]];
  const t = mul(basis(quad), adj(basis(from)));
  return t.map((v) => v / t[8]) as M3;
}

/** That transform as CSS, for an element whose transform-origin is its top left corner. */
export function matrix3d(t: M3): string {
  const n = (v: number) => (Math.abs(v) < 1e-10 ? 0 : Number(v.toPrecision(8)));
  return `matrix3d(${[t[0], t[3], 0, t[6], t[1], t[4], 0, t[7], 0, 0, 1, 0, t[2], t[5], 0, t[8]].map(n).join(",")})`;
}

/** Where a point of the painting falls in the rectangle's own coordinates: the transform, undone. */
export function into(t: M3, [x, y]: Point): Point {
  const v = apply(adj(t), [x, y, 1]);
  return [v[0] / v[2], v[1] / v[2]];
}
