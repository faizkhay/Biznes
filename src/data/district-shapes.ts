// The island and its districts, small enough for an icon. Written by scripts/district-icons.mjs
// from data/index/geo.json (the coast and the district boundaries the crawler keeps), on a 24 by
// 24 grid. Never edited by hand: run `npm run icons:districts` after a crawl.

/** The coast of each island, as the path of an icon. */
export const ISLANDS = {
  mauritius: "M5.6 15.3L5.7 17.4L5.1 18.4L4 18.8L3.8 19.3L7 21.1L8.5 21.1L10.7 21.6L11.8 21.5L15.4 20.3L17.5 18.5L17.5 18.1L16.8 17.2L16.8 16.6L17.1 16.3L17.8 16.2L19.1 15.1L19.4 13.4L19.9 12.9L20.1 11L19 9L18.4 8.7L18.4 7.1L17.1 6.3L16.4 5.2L16.1 3.5L15.8 3.2L13.8 2.4L13.2 2.6L12.6 3.2L11.9 3.3L10.7 5.2L9.9 7.9L10 8.6L7.7 9.3L6.6 10.6L5.6 13.1Z",
  rodrigues: "M9.2 9.8L8 11.1L4.8 11.9L4.5 12.5L4.7 13.5L4.2 14.2L4.4 14.6L4.9 14.9L6.7 14.1L6.8 14.5L6.3 15.2L6.4 15.8L7.1 16.4L8.3 16.9L8.9 16.4L10.1 16.1L10.1 15.1L10.6 14.7L17.2 13.9L19.4 12.2L19.9 11.3L19.6 8.6L16.1 7.1L14.1 7.2L12 8.3L11.3 9.1L10.6 8.8L10 9Z",
} as const;

/**
 * Each district by its slug: the island it is on, its own outline, and its middle. A district too
 * small to see as a shape (`point`) is drawn as a round point at its middle.
 */
export const DISTRICT_SHAPES: Record<string, { island: keyof typeof ISLANDS; part: string; x: number; y: number; point: boolean }> = {
  "black-river": { island: "mauritius", part: "M9.1 8.9L8.3 11L8.5 14L8.8 15.2L8.1 16L8.1 16.8L8.7 17.7L7.6 18.1L6.2 19L5.7 20.4L3.8 19.3L4 18.8L5.1 18.4L5.7 17.4L5.6 15.3L5.6 13.1L6.6 10.6L7.7 9.3Z", x: 6.9, y: 14.8, point: false },
  "flacq": { island: "mauritius", part: "M19.5 13.3L17.7 14.7L16.7 14.8L15.5 14.5L15.3 14.1L15.5 12.7L14.7 11.3L15.2 10.2L14.3 9L14.7 8.5L18.2 7L18.4 7.1L18.4 8.7L19 9L20.1 11L19.9 12.9Z", x: 17.3, y: 11.1, point: false },
  "grand-port": { island: "mauritius", part: "M19.5 13.3L17.9 14.6L13.6 15L11.1 16.9L11.2 17.2L12.3 17.9L14.2 20.7L15.4 20.3L17.5 18.5L17.5 18.1L16.8 17.2L16.8 16.6L17.1 16.3L17.8 16.2L19.1 15.1L19.4 13.4Z", x: 15.1, y: 17.1, point: false },
  "moka": { island: "mauritius", part: "M15.5 12.6L14.7 11.3L15.2 10.1L14.2 9.2L13.5 9.1L11.8 9.9L9.7 9.5L9.3 9.8L9.5 11L10.9 12.1L11.6 14L12.5 14.6L13.9 14.9L14.7 14.7L15.3 14Z", x: 12.8, y: 11.9, point: false },
  "pamplemousses": { island: "mauritius", part: "M9.9 8L11.4 8.3L12.3 9.7L14.5 8.4L14.6 6.5L13.8 5.8L13.5 4.5L12.3 3.3L11.9 3.3L10.7 5.2L9.9 7.9Z", x: 12.4, y: 6.6, point: false },
  "plaines-wilhems": { island: "mauritius", part: "M10.6 11.9L9.6 11.2L9 10L8.7 10L8.4 11.1L8.5 14L8.8 15.1L8.2 15.7L8.1 16.6L8.6 17.4L9.1 17.8L9.9 17.2L11.2 16.8L13 15.1L12.9 14.8L11.6 14L11.1 12.5Z", x: 10, y: 14.4, point: false },
  "port-louis": { island: "mauritius", part: "M9.9 8L10.9 8L11.6 8.4L11.8 9.1L11.6 9.7L11 9.9L9.1 9.3L9.1 8.9L10 8.6Z", x: 10.6, y: 9, point: true },
  "savanne": { island: "mauritius", part: "M5.8 20.4L6.1 19.2L6.4 18.8L7.7 18L9.1 17.9L10.4 17.1L11.6 17.4L12.1 17.7L14.2 20.7L11.8 21.5L10.7 21.6L8.5 21.1L7 21.1Z", x: 9.9, y: 19.6, point: false },
  "rodrigues": { island: "rodrigues", part: "M9.2 9.8L8 11.1L4.8 11.9L4.5 12.5L4.7 13.5L4.2 14.2L4.4 14.6L4.9 14.9L6.7 14.1L6.8 14.5L6.3 15.2L6.4 15.8L7.1 16.4L8.3 16.9L8.9 16.4L10.1 16.1L10.1 15.1L10.6 14.7L17.2 13.9L19.4 12.2L19.9 11.3L19.6 8.6L16.1 7.1L14.1 7.2L12 8.3L11.3 9.1L10.6 8.8L10 9Z", x: 12.5, y: 11.7, point: false },
  "riviere-du-rempart": { island: "mauritius", part: "M12.3 3.3L13.4 4.5L13.8 5.8L14.6 6.5L14.6 7.6L14.9 8L15.5 8L18.2 7L17.1 6.3L16.4 5.2L16.1 3.5L15.8 3.2L13.8 2.4L13.2 2.6L12.6 3.2Z", x: 15.1, y: 5.2, point: false },
};
