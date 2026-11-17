// The walk: the home page's story, stop by stop. One shopfront (the first real business on the
// street) is walked from its sign to the room behind its shutter, so a visitor sees what comes with
// a business and what does not.
//
// Each stop is one chapter of real markup over the stage, and one keyframe of the camera
// (components/three/timeline.ts reads `id`). The stops are evenly spaced, so a stop's place in
// this list is its place in the scroll: move a chapter here and its camera moves with it.
//
// The words are the six things from pack.ts, said where each one lives on a shop. STORY.md has the
// table.
import { INCLUDED, YOURS } from "./pack";

export type Stop = {
  /** Stable name: the camera's keyframe and the chapter's element id. */
  id: "street" | "sign" | "address" | "website" | "strategy" | "company" | "room" | "all";
  /** Where on the shop the visitor is standing, in a word or two. Read by the contents row. */
  place: string;
  title: string;
  line: string;
};

export const STOPS: Stop[] = [
  {
    id: "street",
    place: "The street",
    title: "Buy a business ready to open",
    line: "",
  },
  {
    id: "sign",
    place: "The sign",
    title: "The sign is already painted",
    line: INCLUDED[0].line,
  },
  {
    id: "address",
    place: "The address",
    title: "Its address is held for you",
    line: "The web address that matches the name, bought and passed to you, and matching names on the main social platforms.",
  },
  {
    id: "website",
    place: "Behind the shutter",
    title: "The website is built",
    line: INCLUDED[3].line,
  },
  {
    id: "strategy",
    place: "The counter",
    title: "The strategy is on the counter",
    line: INCLUDED[4].line,
  },
  {
    id: "company",
    place: "The wall",
    title: "We help you set up the company",
    line: "The company that will own the business is yours to register, and we help you do it.",
  },
  {
    id: "room",
    place: "The room",
    title: YOURS.heading,
    line: YOURS.line,
  },
  {
    id: "all",
    place: "The whole street",
    title: "Every shop here will have one owner",
    line: "Each business is sold once. When it is sold, it leaves the street.",
  },
];

/** A stop's position in the walk, from 0 at the first to 1 at the last. */
export const stopAt = (index: number) => index / (STOPS.length - 1);
