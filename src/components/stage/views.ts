// What the stage shows at each stop of the walk: which painted plate, which part of it, and where
// on the screen that part stands.
//
// The walk is told over four paintings (src/data/plates.ts). It opens on the street, pushes in to
// the first shop's sign, then turns to face that shop: its pier, the room behind its shutter, a
// close view of the document on its counter, a close view of the certificate on its wall, and the
// room whole. It ends back on the street, further along it: the five shops still to come, and the
// lamp at its end. (The terrace, front-on, is the next section of the page, not a stop.) Within one painting the stage travels (a push,
// a pan); between two it dissolves while it pushes, so the cut is made on the move.
//
// `desk` frames each stop beside a words card on the left of a wide screen; `phone` frames it above
// a card at the foot of a narrow one. Plain numbers only.
import type { PlateId } from "@/data/plates";
import { STOPS, type Stop } from "@/data/walk";

export type View = {
  plate: PlateId;
  /** The point of the plate that is placed, as fractions of its width and height. */
  focus: [number, number];
  /** Where on the stage that point stands, as fractions of the stage's width and height. */
  at: [number, number];
  /** How large the plate is drawn: its height as a fraction of the stage's, or its width with `by`. */
  size: number;
  by?: "width";
};

type Key = { desk: View; phone: View; /** The first shop's shutter on its own plate: 1 is down, 0 is rolled up. */ shutter: number };

const KEYS: Record<Stop["id"], Key> = {
  // The first view is the approved mock-up's: the street at an angle, the first shop large at the
  // right, its pier on the screen's right edge and its pavement at the foot.
  street: {
    desk: { plate: "street", focus: [1, 1], at: [1, 1], size: 1 },
    phone: { plate: "street", focus: [0.975, 1], at: [1, 1], size: 0.47 },
    shutter: 0.36,
  },
  sign: {
    desk: { plate: "street", focus: [0.782, 0.452], at: [0.66, 0.46], size: 1.75 },
    phone: { plate: "street", focus: [0.782, 0.452], at: [0.5, 0.3], size: 1.15 },
    shutter: 0.36,
  },
  // Facing the shop now: its pier, with the town's plaque and the letterbox under it.
  address: {
    desk: { plate: "lepalatier", focus: [0.886, 0.556], at: [0.72, 0.5], size: 2.6 },
    phone: { plate: "lepalatier", focus: [0.886, 0.556], at: [0.5, 0.3], size: 1.9 },
    shutter: 0.36,
  },
  website: {
    desk: { plate: "lepalatier", focus: [0.508, 0.599], at: [0.64, 0.5], size: 3 },
    phone: { plate: "lepalatier", focus: [0.508, 0.599], at: [0.5, 0.3], size: 1.9 },
    shutter: 0,
  },
  strategy: {
    desk: { plate: "counter", focus: [0.64, 0.54], at: [0.66, 0.5], size: 1 },
    phone: { plate: "counter", focus: [0.642, 0.54], at: [0.5, 0.34], size: 1 },
    shutter: 0,
  },
  company: {
    desk: { plate: "certificate", focus: [0.627, 0.5], at: [0.66, 0.5], size: 1 },
    phone: { plate: "certificate", focus: [0.627, 0.5], at: [0.5, 0.34], size: 1 },
    shutter: 0,
  },
  room: {
    desk: { plate: "lepalatier", focus: [0.5, 0.645], at: [0.5, 0.5], size: 1 },
    phone: { plate: "lepalatier", focus: [0.5, 0.62], at: [0.5, 0.42], size: 1 },
    shutter: 0,
  },
  // The last view is the far end of the street: the five shops beyond the first, the lamp and the
  // afterglow, with the first shop out of the picture on the right.
  all: {
    desk: { plate: "street", focus: [0, 1], at: [0, 1.06], size: 1.66 },
    phone: { plate: "street", focus: [0, 1], at: [0, 1], size: 0.6 },
    shutter: 0,
  },
};

/** The stops in walking order, each with its views. */
export const TIMELINE: Key[] = STOPS.map((s) => KEYS[s.id]);
