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
   * A point that must not move as the screen gets wider or narrower: its place across the screen
   * (0 at the left edge, 1 at the right) and the width-to-height ratio the frame was solved at.
   * The street's opening view ends on the first shop's pier at the right edge; without this, a
   * wider screen would show the bare side wall past it.
   */
  anchor?: [number, number];
  /**
   * The height, in CSS pixels, the stage needs for the words above the street to stand clear of
   * it. On a shorter stage the picture moves down, so the headline never lies over a roof.
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
    desk: { pos: [2.17, 1.05, 8.27], look: [-8.26, 0.76, 0], fov: 43.77, shift: [-0.02, 0.36], anchor: [1.02, DESK], words: 780 },
    phone: { pos: [5.7, 1.24, 11.17], look: [-10.15, 1.32, 0], fov: 62, shift: [-0.3, 0.39], anchor: [1.07, PHONE], words: 760 },
    shutter: 0.34,
  },
  sign: {
    desk: { pos: [-1.0, 2.7, 5.6], look: [-2.5, 3.25, 0], fov: 32, shift: [0.17, 0.0] },
    phone: { pos: [-1.6, 2.8, 8.4], look: [-2.5, 3.25, 0], fov: 38, shift: [0.0, -0.17] },
    shutter: 0.34,
  },
  // The pier, square on: its town plaque and the letterbox under it, with the sky past the corner.
  address: {
    desk: { pos: [-0.6, 1.75, 2.4], look: [-0.45, 1.75, 0], fov: 30, shift: [0.17, 0.0] },
    phone: { pos: [-0.5, 1.8, 3.2], look: [-0.45, 1.72, 0], fov: 36, shift: [0.0, -0.17] },
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
    desk: { pos: [-2.3, 1.5, 8.0], look: [-2.3, 2.0, -2], fov: 34, shift: [0.17, 0.0] },
    phone: { pos: [-2.5, 1.5, 9.6], look: [-2.5, 1.7, -2], fov: 38, shift: [0.0, -0.17] },
    shutter: 0.04,
  },
  // The last view is the first one from further back: the whole street, one room lit.
  all: {
    desk: { pos: [6.38, 1.2, 14.76], look: [-15.07, 1.1, 0], fov: 39.71, shift: [-0.01, 0.32], anchor: [0.985, DESK] },
    phone: { pos: [7.99, 1.65, 7.8], look: [-3.44, 1.99, 0], fov: 62, shift: [0.24, -0.13], anchor: [1.03, PHONE] },
    shutter: 0.04,
  },
};

/**
 * A frame's downward shift on a stage of this height (in pixels) and this width-to-height ratio:
 * its own, and more where the words need the room. A short stage gives them less height; a
 * narrower one brings the near, taller end of the street under them.
 */
export function shiftY(frame: Frame, height: number, aspect: number) {
  if (!frame.words) return frame.shift[1];
  const short = Math.max(0, (frame.words - height) / height) * 0.6;
  const narrow = frame.anchor ? Math.max(0, frame.anchor[1] / aspect - 1) * 0.45 : 0;
  return frame.shift[1] + short + narrow;
}

/**
 * A frame's sideways shift on a screen of this width-to-height ratio: its own, moved so that its
 * anchor stays where it was solved to be.
 */
export function shiftX(frame: Frame, aspect: number) {
  if (!frame.anchor) return frame.shift[0];
  const [x, solvedAt] = frame.anchor;
  return frame.shift[0] + (x - 0.5 - frame.shift[0]) * (1 - solvedAt / aspect);
}

/** The stops in walking order, each with its frames. */
export const TIMELINE: Key[] = STOPS.map((s) => KEYS[s.id]);

/**
 * The camera rests at each stop for the first and last `HOLD` of the way to the next, and travels
 * through the middle, so a visitor can stop and read without the picture drifting (after DHE).
 */
export const HOLD = 0.22;
