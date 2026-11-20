// Small geometry: joining map ways into outlines, thinning them, and asking whether a point is inside one.

/** Joins ways (arrays of node ids) end to end into rings, whichever way round each was drawn. */
export function joinRings(segments) {
  const used = new Array(segments.length).fill(false);
  const ends = new Map();
  segments.forEach((s, i) => {
    for (const node of [s[0], s[s.length - 1]]) {
      if (!ends.has(node)) ends.set(node, []);
      ends.get(node).push(i);
    }
  });
  const rings = [];
  for (let i = 0; i < segments.length; i++) {
    if (used[i]) continue;
    used[i] = true;
    let ring = segments[i].slice();
    const grow = () => {
      while (ring.length < 3 || ring[0] !== ring[ring.length - 1]) {
        const tail = ring[ring.length - 1];
        const next = (ends.get(tail) ?? []).find((j) => !used[j]);
        if (next == null) return;
        used[next] = true;
        const s = segments[next];
        ring = ring.concat(s[0] === tail ? s.slice(1) : s.slice(0, -1).reverse());
      }
    };
    // Forwards from its end, then backwards from its start, so a line with a gap is still one line.
    grow();
    if (ring[0] !== ring[ring.length - 1]) {
      ring.reverse();
      grow();
    }
    rings.push(ring);
  }
  return rings;
}

/** Douglas-Peucker: drops the points of a line that stray less than `tolerance` from it. */
export function simplify(points, tolerance) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len = dx * dx + dy * dy;
    let far = -1;
    let worst = 0;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = points[i];
      const t = len ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len)) : 0;
      const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
      if (d > worst) {
        worst = d;
        far = i;
      }
    }
    if (far > 0 && worst > tolerance) {
      keep[far] = 1;
      stack.push([a, far], [far, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/** The area of a ring in square degrees, signed by its direction. */
export function area(ring) {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) sum += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1]);
  return sum / 2;
}

export function bounds(ring) {
  let w = Infinity;
  let s = Infinity;
  let e = -Infinity;
  let n = -Infinity;
  for (const [x, y] of ring) {
    if (x < w) w = x;
    if (x > e) e = x;
    if (y < s) s = y;
    if (y > n) n = y;
  }
  return [w, s, e, n];
}

/** Whether [lon, lat] is inside a ring of [lon, lat] points. */
export function inside(point, ring) {
  const [x, y] = point;
  let within = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) within = !within;
  }
  return within;
}

/** Metres between two [lon, lat] points. */
export function metres(a, b) {
  const rad = Math.PI / 180;
  const x = (b[0] - a[0]) * rad * Math.cos(((a[1] + b[1]) / 2) * rad);
  const y = (b[1] - a[1]) * rad;
  return Math.hypot(x, y) * 6371000;
}

/** Rounds a coordinate to about a metre, which is all a map of an island needs. */
export const round5 = (v) => Math.round(v * 1e5) / 1e5;
