// The painted plates, and where things stand on them.
//
// The street is painted, not rendered: six generated illustrations in the style of the mock-up the
// owner approved (assets/plates, each with its prompt; scripts/prepare-plates.mjs cuts what ships).
// Every sign board, plaque, screen and paper on them was painted blank, so that nothing a painting
// says can disagree with the data: a listing's own lettering, its town and a sample's tag are set
// over the paint in code, at the places recorded here.
//
// Every number is in a plate's own pixels, measured on the master with scripts/measure-plates.mjs
// (a flood from a point inside each blank, stopped by its painted frame) and read back on gridded
// crops. Plain numbers only, so any module can import them.
import type { Quad } from "@/lib/homography";

/** A rectangle on a plate: left, top, width, height. */
export type Rect = [number, number, number, number];

export const PLATES = {
  /** The street at an angle: the home page's first picture. */
  street: { src: "/img/plates/street", widths: [1920, 3840], w: 3840, h: 2160 },
  /** The first business, front-on, its shutter up and its room lit. */
  lepalatier: { src: "/img/plates/lepalatier", widths: [1440, 2880], w: 2880, h: 2880 },
  /** All six shopfronts front-on, on a transparent ground. */
  terrace: { src: "/img/plates/terrace", widths: [1920, 3840], w: 3840, h: 1648 },
  /** A close view inside the first business's room: the strategy, a bound document on the counter. */
  counter: { src: "/img/plates/counter", widths: [1024, 2048], w: 2048, h: 1360 },
  /** A close view of the room's wall: the certificate in its frame. */
  certificate: { src: "/img/plates/certificate", widths: [1024, 2048], w: 2048, h: 1360 },
} as const;

export type PlateId = keyof typeof PLATES;

/** The listings painted on the terrace, by slug, left to right. A listing not here is drawn in code instead. */
export const PAINTED = ["lepalatier", "lakrem", "souffle", "bouke", "larout", "kazprop"];
/** The listing that has a plate of its own: its shopfront open, its room lit. */
export const OWN_PLATE = "lepalatier";

/** The sky along the street plate's top edge, sampled: the stage's ground wherever the plate ends. */
export const STREET_SKY = "#012993";

/**
 * The street plate: each shop's sign board as its four corners (the boards are seen at an angle),
 * in the order the businesses are listed, nearest first; the nearest shop's town plaque; and the
 * middle of each shutter, where a sample's tag hangs.
 */
export const STREET = {
  boards: [
    [[2466, 996], [3538, 749], [3542, 993], [2466, 1181]],
    [[1841, 1324], [2253, 1250], [2254, 1377], [1841, 1431]],
    [[1404, 1420], [1716, 1384], [1716, 1466], [1403, 1505]],
    [[1065, 1493], [1304, 1458], [1303, 1534], [1065, 1561]],
    [[802, 1533], [990, 1512], [991, 1572], [802, 1594]],
    [[565, 1577], [734, 1558], [736, 1608], [565, 1628]],
  ] as Quad[],
  plaque: [[3534, 1209], [3730, 1201], [3714, 1291], [3518, 1293]] as Quad,
  /**
   * The roofline, left to right, as fractions of the plate: the palms and the lamp at the far end,
   * then each roof's ridge up to the nearest shop's. Nothing of the home page's first words is set
   * on or under it (components/stage/roofline.ts).
   */
  roofline: [
    [0, 0.7],
    [0.078, 0.7],
    [0.088, 0.6],
    [0.125, 0.6],
    [0.215, 0.625],
    [0.295, 0.58],
    [0.38, 0.535],
    [0.415, 0.5],
    [0.5, 0.455],
    [0.555, 0.385],
    [0.775, 0.165],
    [1, 0],
  ] as [number, number][],
  /**
   * Where the afterglow begins, as a fraction of the plate's height. White words measure 4.61:1 or
   * better on the sky above it and as little as 3.09:1 on the pink below, so the first screen's
   * sentences keep above this line; a filled button, which brings its own ground, need not.
   */
  skyFloor: 0.55,
  /**
   * Every lit lamp on the plate, far end first: where its bulb is and how far its light reaches.
   * They switch on one after another as the street arrives (globals.css, .plate-glow).
   */
  lamps: [
    [344, 1360, 120],
    [636, 1540, 70],
    [880, 1504, 80],
    [1170, 1430, 95],
    [1530, 1336, 115],
    [2010, 1224, 160],
    [2670, 864, 270],
    [3150, 756, 290],
  ] as [number, number, number][],
  shutters: [
    [3000, 1500],
    [2064, 1680],
    [1577, 1709],
    [1205, 1735],
    [907, 1747],
    [660, 1759],
  ] as [number, number][],
};

/** The first business's own plate: everything on it is seen front-on, so a rectangle is enough. */
export const SHOP = {
  board: [541, 811, 1828, 244] as Rect,
  plaque: [2417, 1400, 272, 178] as Rect,
  screen: [1208, 1592, 510, 266] as Rect,
  /** The paper inside the certificate's frame. */
  paper: [985, 1649, 122, 172] as Rect,
  /** The doorway the shutter closes: from under its housing to the threshold. */
  doorway: [571, 1246, 1719, 1267] as Rect,
};

/** The counter plate: the document's cover, seen from above at an angle, as its four corners. */
export const COUNTER = {
  cover: [[997, 465], [1573, 460], [1672, 1003], [958, 1008]] as Quad,
};

/** The certificate plate: the blank paper inside the frame. */
export const CERTIFICATE = {
  paper: [1010, 306, 547, 756] as Rect,
};

/**
 * The terrace plate: each shop from its own left pilaster to the next shop's, its blank board and
 * its shutter. `top` and `height` bound the painted part (the plate is transparent above the roofs
 * and below the pavement).
 */
export const TERRACE = {
  top: 270,
  height: 1175,
  shops: [
    { left: 40, width: 643, board: [155, 690, 500, 144] as Rect, shutter: [186, 882, 412, 462] as Rect },
    { left: 683, width: 607, board: [786, 690, 478, 144] as Rect, shutter: [811, 882, 388, 462] as Rect },
    { left: 1290, width: 590, board: [1391, 690, 467, 144] as Rect, shutter: [1412, 882, 390, 462] as Rect },
    { left: 1880, width: 606, board: [1986, 690, 478, 144] as Rect, shutter: [2011, 882, 389, 462] as Rect },
    { left: 2486, width: 604, board: [2595, 690, 474, 144] as Rect, shutter: [2613, 882, 401, 462] as Rect },
    { left: 3090, width: 725, board: [3200, 690, 489, 144] as Rect, shutter: [3224, 882, 403, 462] as Rect },
  ],
};
