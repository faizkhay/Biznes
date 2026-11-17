// Where the camera stands at each stop of the walk, and how far down the walked shop's shutter is.
//
// Plain numbers only: no three.js here, so the page can import the stop list without downloading
// three.js. The scene interpolates between neighbouring stops with a hold at each (Street.tsx), so
// a visitor who stops scrolling has a still picture to read beside.
//
// The street runs along x, away from the first shop: shop k stands between x = -(k + 1) * 5 and
// x = -k * 5, facing +z (the road). y is up. Distances are metres, near enough.
//
// The opening and closing frames were solved against the approved mock-up's layout (where the first
// shop's corners and the far end of the street fall on the screen), not placed by eye: the camera
// stands low and the picture is shifted down, as an architectural photograph is, so walls stay upright.
//
// `desk` frames each stop beside a words card on the left of a wide screen; `phone` frames it above
// a card at the foot of a narrow one. `shift` moves the picture's centre, as a fraction of the
// view, so the subject stands clear of the words: x to the right on a desk, y upward on a phone.
import { STOPS, type Stop } from "@/data/walk";

export type Frame = {
  /** Where the camera stands. */
  pos: [number, number, number];
  /** What it looks at. */
  look: [number, number, number];
  /** Vertical field of view, in degrees. */
  fov: number;
  /** How far the picture's centre is moved off the screen's, as fractions of its width and height. */
  shift: [number, number];
  /**
   * A point on the screen that must not move as the stage changes shape: where it stands across the
   * screen and down it (0 at the left and top edges, 1 at the right and bottom), and the
   * width-to-height ratio the frame was solved at. The street's opening view ends on the first
   * shop's pier at the right edge, with its paving in frame; without this, a wider screen would
   * show the bare side wall past the pier.
   */
  anchor?: [number, number, number];
  /**
   * The height, in CSS pixels, the stage needs for the words above the street to stand clear of
   * it. On a shorter stage, or a narrower one, the camera draws back about the anchor, so the
   * street gets smaller under the words and keeps its pavement (the finish review's verdict pass,
   * 17 November 2026: moving the picture down instead cut the street off at the knees).
   */
  words?: number;
};

/** The stage's proportions the opening and closing frames were solved at: 1440 x 828 and 390 x 772. */
const DESK = 1440 / 828;
const PHONE = 390 / 772;

type Key = { desk: Frame; phone: Frame; /** The walked shop's shutter: 1 is down, 0 is rolled up. */ shutter: number };

const KEYS: Record<Stop["id"], Key> = {
  // The first view is the approved mock-up's: the street in perspective, the first shop large on
  // the right with its shutter raised past half over a lit room.
  street: {
    desk: { pos: [2.17, 1.05, 8.27], look: [-8.26, 0.76, 0], fov: 43.77, shift: [-0.035, 0.36], anchor: [1.005, 0.94, DESK], words: 780 },
    phone: { pos: [5.7, 1.24, 11.17], look: [-10.15, 1.32, 0], fov: 62, shift: [-0.35, 0.39], anchor: [1.02, 0.94, PHONE], words: 760 },
    shutter: 0.34,
  },
  sign: {
    desk: { pos: [-1.0, 2.7, 5.6], look: [-2.5, 3.25, 0], fov: 32, shift: [0.17, 0.0] },
    phone: { pos: [-1.6, 2.8, 8.4], look: [-2.5, 3.25, 0], fov: 38, shift: [0.0, -0.17] },
    shutter: 0.34,
  },
  // The pier, square on: its town plaque and the letterbox under it, with the sky past the corner.
  address: {
    desk: { pos: [-0.7, 1.75, 2.4], look: [-0.56, 1.75, 0], fov: 30, shift: [0.17, 0.0] },
    phone: { pos: [-0.6, 1.8, 3.2], look: [-0.52, 1.72, 0], fov: 36, shift: [0.0, -0.17] },
    shutter: 0.34,
  },
  website: {
    desk: { pos: [-2.5, 1.55, 4.4], look: [-2.5, 1.5, -4.4], fov: 36, shift: [0.17, 0.0] },
    phone: { pos: [-2.5, 1.6, 6.8], look: [-2.5, 1.5, -4.4], fov: 40, shift: [0.0, -0.17] },
    shutter: 0.04,
  },
  // Over the counter along the right wall, looking down at the plan on it.
  strategy: {
    desk: { pos: [-2.0, 1.9, -2.0], look: [-1.27, 0.93, -2.5], fov: 36, shift: [0.17, 0.0] },
    phone: { pos: [-2.2, 2.05, -2.0], look: [-1.27, 0.93, -2.5], fov: 42, shift: [0.0, -0.17] },
    shutter: 0.04,
  },
  // Turned to the left wall, and the certificate in its frame.
  company: {
    desk: { pos: [-2.1, 1.65, -1.6], look: [-4.08, 1.68, -2.6], fov: 36, shift: [0.17, 0.0] },
    phone: { pos: [-1.9, 1.68, -1.9], look: [-4.08, 1.68, -2.6], fov: 42, shift: [0.0, -0.17] },
    shutter: 0.04,
  },
  room: {
    desk: { pos: [-2.2, 1.5, 8.0], look: [-2.2, 2.0, -2], fov: 28, shift: [0.17, 0.0] },
    phone: { pos: [-2.5, 1.5, 9.6], look: [-2.5, 1.7, -2], fov: 38, shift: [0.0, -0.17] },
    shutter: 0.04,
  },
  // The last view is the first one from further back: the whole street, one room lit.
  all: {
    desk: { pos: [6.38, 1.2, 14.76], look: [-15.07, 1.1, 0], fov: 39.71, shift: [-0.01, 0.32], anchor: [0.985, 0.93, DESK] },
    phone: { pos: [7.99, 1.65, 7.8], look: [-3.44, 1.99, 0], fov: 62, shift: [0.24, -0.13], anchor: [1.03, 0.52, PHONE] },
    shutter: 0.04,
  },
};

/**
 * A frame as it is shown on a stage of this size: its field of view and its two shifts. Without an
 * anchor that is the frame as written. With one, the anchor stays where it was solved to be as the
 * stage gets wider or narrower; and where the stage is too short or too narrow for the words above
 * the street, the camera draws back about the anchor, so the street shrinks toward its own corner.
 */
export function fit(frame: Frame, width: number, height: number) {
  let [sx, sy] = frame.shift;
  let fov = frame.fov;
  if (!frame.anchor) return { fov, sx, sy };
  const aspect = width / height;
  const [ax, ay, solvedAt] = frame.anchor;
  sx += (ax - 0.5 - sx) * (1 - solvedAt / aspect);
  if (frame.words) {
    const short = Math.max(1, frame.words / height);
    const narrow = 1 + Math.max(0, solvedAt / aspect - 1) * 0.5;
    const back = Math.min(1.6, short * narrow);
    if (back > 1) {
      fov = (Math.atan(Math.tan((frame.fov * Math.PI) / 360) * back) * 360) / Math.PI;
      sx = ax - 0.5 - (ax - 0.5 - sx) / back;
      sy = ay - 0.5 - (ay - 0.5 - sy) / back;
    }
  }
  return { fov, sx, sy };
}

/** The stops in walking order, each with its frames. */
export const TIMELINE: Key[] = STOPS.map((s) => KEYS[s.id]);

/**
 * The camera rests at each stop for the first and last `HOLD` of the way to the next, and travels
 * through the middle, so a visitor can stop and read without the picture drifting (after DHE).
 */
export const HOLD = 0.22;
