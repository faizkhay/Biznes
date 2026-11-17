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
};

type Key = { desk: Frame; phone: Frame; /** The walked shop's shutter: 1 is down, 0 is rolled up. */ shutter: number };

const KEYS: Record<Stop["id"], Key> = {
  // The first view is the approved mock-up's: the street in perspective, the first shop large on
  // the right with its shutter half raised.
  street: {
    desk: { pos: [2.66, 1.05, 8.09], look: [-8.31, 0.69, 0], fov: 42.9, shift: [-0.04, 0.36] },
    phone: { pos: [3.21, 1.05, 10.3], look: [-6.11, 1.18, 0], fov: 60, shift: [-0.3, 0.39] },
    shutter: 0.5,
  },
  sign: {
    desk: { pos: [-1.0, 2.7, 5.6], look: [-2.5, 3.25, 0], fov: 32, shift: [0.17, 0.0] },
    phone: { pos: [-1.6, 2.8, 8.4], look: [-2.5, 3.25, 0], fov: 38, shift: [0.0, -0.17] },
    shutter: 0.5,
  },
  address: {
    desk: { pos: [0.9, 1.75, 3.9], look: [-0.45, 1.75, 0], fov: 30, shift: [0.17, 0.0] },
    phone: { pos: [0.9, 1.9, 5.4], look: [-0.45, 1.75, 0], fov: 36, shift: [0.0, -0.17] },
    shutter: 0.5,
  },
  website: {
    desk: { pos: [-2.5, 1.55, 4.4], look: [-2.5, 1.5, -4.4], fov: 36, shift: [0.17, 0.0] },
    phone: { pos: [-2.5, 1.6, 6.8], look: [-2.5, 1.5, -4.4], fov: 40, shift: [0.0, -0.17] },
    shutter: 0.04,
  },
  strategy: {
    desk: { pos: [-2.0, 1.65, -0.3], look: [-3.35, 0.95, -2.7], fov: 36, shift: [0.17, 0.0] },
    phone: { pos: [-1.7, 1.8, 0.4], look: [-3.35, 0.95, -2.7], fov: 42, shift: [0.0, -0.17] },
    shutter: 0.04,
  },
  company: {
    desk: { pos: [-3.3, 1.6, -0.9], look: [-0.9, 1.65, -2.5], fov: 36, shift: [0.17, 0.0] },
    phone: { pos: [-3.5, 1.65, -0.2], look: [-0.9, 1.65, -2.5], fov: 42, shift: [0.0, -0.17] },
    shutter: 0.04,
  },
  room: {
    desk: { pos: [-3.6, 1.35, 7.4], look: [-2.3, 1.55, -2], fov: 34, shift: [0.17, 0.0] },
    phone: { pos: [-2.5, 1.5, 9.6], look: [-2.5, 1.7, -2], fov: 38, shift: [0.0, -0.17] },
    shutter: 0.04,
  },
  // The last view is the first one from further back: the whole street, one room lit.
  all: {
    desk: { pos: [12, 1.44, 25.17], look: [-17.01, 2.85, 0], fov: 34.84, shift: [0.04, 0.25] },
    phone: { pos: [8, 1.63, 6.56], look: [-3.04, 2.26, 0], fov: 60, shift: [0.26, -0.14] },
    shutter: 0.04,
  },
};

/** The stops in walking order, each with its frames. */
export const TIMELINE: Key[] = STOPS.map((s) => KEYS[s.id]);

/**
 * The camera rests at each stop for the first and last `HOLD` of the way to the next, and travels
 * through the middle, so a visitor can stop and read without the picture drifting (after DHE).
 */
export const HOLD = 0.22;
