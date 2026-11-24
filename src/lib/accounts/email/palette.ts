// The colours of a message, taken from the site's own tokens (src/app/globals.css, DESIGN.md). A
// mail program reads no custom properties, so the values are written out here, once, and the unit
// check (scripts/email-unit.mjs) holds each to the token it is named for. Every pair of words and
// ground used in a message is a pair already measured in scripts/contrast.pairs.json.

/** The palette, by the token's own name. */
export const TOKENS = {
  white: "#ffffff", // --palette-white: the card
  cream: "#fdf9ec", // --palette-cream: the sheet the card lies on
  ink: "#0a1639", // --palette-ink: words; the sheet in a dark mail program
  swell: "#14224f", // --palette-swell: the card in a dark mail program
  slate: "#404965", // --palette-slate: secondary words
  mist: "#626a80", // --palette-mist: the foot of the message
  haze: "#b6c0db", // --palette-haze: the foot of the message on ink
  saffron: "#f8c618", // --palette-saffron: the button, with ink words
  royal: "#0d36a7", // --palette-royal: a link
} as const;

/** `--color-line` (ink at 10%) laid on white, as one flat colour: a mail program mixes nothing. A hairline, never words. */
export const LINE_ON_WHITE = "#e7e8eb";
/** White at 16% laid on swell: the same hairline on the dark card. */
export const LINE_ON_SWELL = "#3a456b";

export type Tone = {
  sheet: string;
  card: string;
  /** Words on the card. */
  ink: string;
  /** Secondary words on the card. */
  soft: string;
  /** The name above the card, on the sheet. */
  name: string;
  /** The foot, on the sheet. */
  faint: string;
  /** A link in the foot. */
  link: string;
  line: string;
  /** The button: saffron with ink words, in either tone. */
  button: string;
  onButton: string;
};

export const LIGHT: Tone = { sheet: TOKENS.cream, card: TOKENS.white, ink: TOKENS.ink, soft: TOKENS.slate, name: TOKENS.ink, faint: TOKENS.mist, link: TOKENS.royal, line: LINE_ON_WHITE, button: TOKENS.saffron, onButton: TOKENS.ink };
export const DARK: Tone = { sheet: TOKENS.ink, card: TOKENS.swell, ink: TOKENS.white, soft: TOKENS.white, name: TOKENS.white, faint: TOKENS.haze, link: TOKENS.haze, line: LINE_ON_SWELL, button: TOKENS.saffron, onButton: TOKENS.ink };
