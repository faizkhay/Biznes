// The pages the menu names (MENU, YOURS, ABOUT and NAV in src/data/site.ts), with the new Home
// page and the page of every page. Each is found by its address.
import { box, ring, type Drawing } from "./draw";
import { CUTLERY, SHOP } from "./directory";

/** The lens of the search, with the one thing found: any page of the site. */
export const LENS: Drawing = [ring(10.5, 10.5, 6.5) + "M15.5 15.5l5 5", 10.5, 10.5];

export const PAGES: Record<string, Drawing> = {
  "/": LENS,
  "/search": LENS,
  // Home: a signpost, because a house already means the home and building group.
  "/home": ["M12 5.5V7M6.5 7H16l3 2.25-3 2.25H6.5V7ZM12 11.5V13M17.5 13H8l-3 2.25 3 2.25h9.5V13ZM12 17.5v4M9 21.5h6", 12, 3.75, 1.75],
  // The directory: the kinds of business as tiles, and the one you came for.
  "/directory": [box(3.5, 3.5, 7, 7, 1.5) + box(13.5, 3.5, 7, 7, 1.5) + box(3.5, 13.5, 7, 7, 1.5), 17, 17, 2.5],
  "/places": ["M12 21.5s-7-6-7-11.5a7 7 0 0 1 14 0c0 5.5-7 11.5-7 11.5Z", 12, 10, 2.25],
  "/baz-manzer": CUTLERY,
  "/emergency": ["M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z", 17.5, 6.5, 2.25],
  "/holidays": [box(3.5, 5, 17, 15.5, 2) + "M3.5 10h17M8 3v4M16 3v4", 15.5, 15.25],
  "/learn": ["M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8L14 3.5ZM14 3.5V8h4.5M12.5 12h3M8.5 16h7", 9.5, 11.75, 1.75],
  "/tools": [box(5, 3, 14, 18, 2) + "M8.5 7.5h7M8.5 12.5H10M13.5 12.5H15M8.5 16.5H10", 14.5, 16.5, 1.75],
  "/learn/glossary": ["M5 5.5A1.5 1.5 0 0 1 6.5 4H19v13H6.5A1.5 1.5 0 0 0 5 18.5v-13ZM5 18.5A1.5 1.5 0 0 0 6.5 20H19", 12, 10.5, 2.25],
  "/official": ["M11 7.5 10 12M13 7.5l1 4.5" + box(4.5, 12, 15, 5, 1.5) + "M4.5 20.5h15", 12, 5.5, 2.25],
  "/shop": ["M3.5 6.5 9 4.5l6 2 5.5-2v13L15 19.5l-6-2-5.5 2v-13ZM9 4.5v13M15 6.5v13", 12, 11.5, 1.75],
  "/shop#sponsor": ["M3.5 9.5H7l8-4.5v14l-8-4.5H3.5v-5ZM7 14.5V19h3v-3", 19.5, 12],
  // List your business: a shop front with its light on.
  "/pricing": SHOP,
  "/add": ["M15.5 4.5l4 4L8.5 19.5 4 20l.5-4.5L15.5 4.5ZM13 7l4 4M12.5 20.5h8", 5.5, 18.5, 1.75],
  "/data": [ring(5, 5, 1.75) + ring(12, 5, 1.75) + ring(19, 5, 1.75) + "M5 6.75V11a4 4 0 0 0 4 4h1M19 6.75V11a4 4 0 0 1-4 4h-1M12 6.75v7.5", 12, 16.75, 2.25],
  "/saved": ["M6.5 3.5h11a1 1 0 0 1 1 1V21L12 16.5 5.5 21V4.5a1 1 0 0 1 1-1Z", 12, 9.5],
  "/cart": ["M2.5 4H5l2.5 11H18l2-8H6.2" + ring(9, 18.75, 1.5) + ring(16.5, 18.75, 1.5), 12.5, 10.75, 1.75],
  "/account": [ring(12, 12, 8.5) + "M6.3 18.3c1.1-2.4 3.2-3.8 5.7-3.8s4.6 1.4 5.7 3.8", 12, 9.75, 2.75],
  // About: the b of the name, in the set's own line. A stem, a ring and the point.
  "/about": ["M7 3.5V20" + ring(12.5, 14.5, 5.5), 12.5, 14.5],
  // The crawler: a robot's head; the point is the end of its aerial.
  "/bot": [box(4.5, 8, 15, 11, 3) + "M12 8V5.5M9 13v1.5M15 13v1.5M2.5 12.5v3M21.5 12.5v3", 12, 3.75, 1.75],
  "/privacy": [box(5, 10.5, 14, 10, 2) + "M8 10.5V8a4 4 0 0 1 8 0v2.5M12 16.5V18", 12, 14.75, 1.75],
  // An owner's own businesses: the shop front again.
  "/dashboard": SHOP,
  // More: the list of every page, with one of them lit.
  "/more": ["M10 6.5h10.5M3.5 12h17M3.5 17.5h11", 5, 6.5],
};
