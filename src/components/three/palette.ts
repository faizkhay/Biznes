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
  steel: "#857f88",
  steelDeep: "#56515c",
  /** The lambrequin, the trims and every piece of white paint. */
  limewash: "#f7f7f8",
  /** The lit room: its walls, its floor, and the light itself. */
  roomWall: "#f2b657",
  roomFloor: "#d98a30",
  lamp: "#ffb869",
  /** The kerb and the road. */
  pavement: "#6a6572",
  kerb: "#7c7783",
  road: "#33323f",
  /** Lamp arms, lamp shades and the street lamp's post. */
  iron: "#1a1f3d",
  /** The street plaque. */
  enamel: "#0b2b8e",
  /** The afterglow that rims everything from the horizon's side, and the sky's own blue fill. */
  afterglow: "#ff8a6a",
  skyFill: "#7f9bff",
  ground: "#2a2440",
} as const;
