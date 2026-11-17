// The street's colours under its own light.
//
// A scene palette is separate from the CSS tokens on purpose: light and tone mapping change a
// colour, so the value that renders as the mock-up's bordeaux is not the bordeaux in globals.css.
// Each value here was set so that the rendered street reads as the approved mock-up
// (.impeccable/mocks/comp-b-perspective.png), whose materials were sampled by region median
// (scripts/sample-comp.mjs). A listing's own wall, board, lettering and trim come from the data.
export const SCENE = {
  /** The fog the far shops fade into: the mock-up's sky. */
  dusk: "#0e328f",
  /** A tin roof where the sky lights it, and the grooves between its ribs. */
  tin: "#6f8fd0",
  tinShade: "#4a6eac",
  /** A roller shutter, and the gaps between its slats. */
  steel: "#52545f",
  steelDeep: "#30313b",
  /** The lambrequin, the trims and every piece of white paint. */
  limewash: "#f7f7f8",
  /** The lit room: its walls, its floor, and the light itself. */
  roomWall: "#f2b657",
  roomFloor: "#d98a30",
  lamp: "#ffb869",
  /** The pavement's slabs and their joints, the kerb, and the road's tar. */
  pavement: "#8f8698",
  pavementJoint: "#5b5366",
  kerb: "#7c7783",
  road: "#372e3e",
  roadFleck: "#473d4f",
  /** The low wall at each end of the street: basalt blocks and their mortar. */
  basalt: "#3d3a4c",
  basaltDeep: "#2b2939",
  mortar: "#6a6679",
  /** Lamp arms, lamp shades and the street lamp's post. */
  iron: "#1a1f3d",
  /** The page's ink: frames, a tag's lettering, the dark a wall's plinth is mixed toward. */
  ink: "#0a1639",
  /** Paper: a certificate, the pages of the plan. */
  paper: "#fbf6ea",
  /** The seal on the certificate: the page's saffron. */
  seal: "#f8c618",
  /** A palm against the sky. */
  palm: "#0b1f63",
  /** A tin rib where it catches the sky, and the cool light that fills the fronts. */
  tinLight: "#a9c0ee",
  fill: "#b8c8ff",
  /** The street plaque. */
  enamel: "#0b2b8e",
  /** The afterglow that rims everything from the horizon's side, and the sky's own blue fill. */
  afterglow: "#ff8a6a",
  skyFill: "#7f9bff",
  ground: "#2a2440",
} as const;
