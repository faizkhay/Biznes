// The site's one drawn icon set: a 24px grid, 1.5px round strokes, in the current colour. Every icon
// is decoration beside words, so each is hidden from assistive technology; a control whose only
// content is an icon carries its own label.
import type { SVGProps } from "react";

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
} as const;

type P = SVGProps<SVGSVGElement>;

export const Glass = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 5 5" />
  </svg>
);
export const Arrow = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
);
export const Out = (p: P) => (
  <svg {...base} {...p}>
    <path d="M8 16 18 6M10 6h8v8" />
  </svg>
);
export const Phone = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  </svg>
);
export const Globe = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.5 2.4 3.5 5.2 3.5 8.5s-1 6.1-3.5 8.5c-2.5-2.4-3.5-5.2-3.5-8.5s1-6.1 3.5-8.5Z" />
  </svg>
);
export const Pin = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21Z" />
    <circle cx="12" cy="10.5" r="2.2" />
  </svg>
);
export const Tick = (p: P) => (
  <svg {...base} {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
export const Alert = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 4 3 19.5h18L12 4ZM12 10v4.5M12 17.2v.1" />
  </svg>
);
export const Bookmark = (p: P) => (
  <svg {...base} {...p}>
    <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1Z" />
  </svg>
);
export const Share = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 15V4M8 8l4-4 4 4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
  </svg>
);
export const Close = (p: P) => (
  <svg {...base} {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);
export const Chevron = (p: P) => (
  <svg {...base} {...p}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);
export const Route = (p: P) => (
  <svg {...base} {...p}>
    <path d="M20 4 4 10.5l6.5 3 3 6.5L20 4Z" />
  </svg>
);
export const Book = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H19v13H6.5A1.5 1.5 0 0 0 5 18.5v-13ZM5 18.5A1.5 1.5 0 0 0 6.5 20H19" />
  </svg>
);
export const Landmark = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 20h16M6 17v-6M10 17v-6M14 17v-6M18 17v-6M3.5 8.5 12 4l8.5 4.5v1h-17v-1Z" />
  </svg>
);
export const Calc = (p: P) => (
  <svg {...base} {...p}>
    <rect x="5" y="3.5" width="14" height="17" rx="2" />
    <path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01" />
  </svg>
);
export const Store = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 9.5 5.5 4.5h13L20 9.5M4 9.5a2.667 2.667 0 0 0 5.333 0 2.667 2.667 0 0 0 5.334 0 2.667 2.667 0 0 0 5.333 0M5.5 12.5v7h13v-7M10 19.5v-4h4v4" />
  </svg>
);
const Fork = (p: P) => (
  <svg {...base} {...p}>
    <path d="M7 3.5v17M4.5 3.5v4a2.5 2.5 0 0 0 5 0v-4M16.5 20.5v-7M16.5 13.5c-1.7 0-3-1.3-3-3.8 0-3.4 1.4-6.2 3-6.2v10Z" />
  </svg>
);
const Bag = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6 8h12l1 12H5L6 8ZM9 8V7a3 3 0 0 1 6 0v1" />
  </svg>
);
const Bed = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3.5 18.5v-12M3.5 14.5h17v4M20.5 14.5v-2a3 3 0 0 0-3-3h-6v5" />
    <circle cx="7.5" cy="10.5" r="1.6" />
  </svg>
);
const Cross = (p: P) => (
  <svg {...base} {...p}>
    <path d="M9.5 4h5v5.5H20v5h-5.5V20h-5v-5.5H4v-5h5.5V4Z" />
  </svg>
);
const Coin = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M14.6 9.6c-.5-.8-1.4-1.3-2.6-1.3-1.5 0-2.6.7-2.6 1.9 0 2.6 5.3 1.1 5.3 3.7 0 1.2-1.2 1.9-2.7 1.9-1.2 0-2.2-.5-2.7-1.4M12 6.8v1.5M12 15.8v1.5" />
  </svg>
);
const Car = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 16.5v-3.2a2 2 0 0 1 .6-1.4L6 10.5l1.2-3.6a2 2 0 0 1 1.9-1.4h5.8a2 2 0 0 1 1.9 1.4L18 10.5l1.4 1.4a2 2 0 0 1 .6 1.4v3.2H4ZM6.5 16.5v2M17.5 16.5v2M6 10.5h12M7.5 13.5h.01M16.5 13.5h.01" />
  </svg>
);
const House = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 11 12 4l8 7M6 9.5V20h12V9.5M10 20v-5.5h4V20" />
  </svg>
);
const Scissors = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="6" cy="7" r="2.5" />
    <circle cx="6" cy="17" r="2.5" />
    <path d="M8 8.5 20 18M8 15.5 20 6" />
  </svg>
);
const Cap = (p: P) => (
  <svg {...base} {...p}>
    <path d="M2.5 9.5 12 5l9.5 4.5L12 14 2.5 9.5ZM6.5 11.5V16c1.5 1.4 3.4 2 5.5 2s4-.6 5.5-2v-4.5M21.5 9.5v5" />
  </svg>
);
const Case = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
    <path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3.5 12.5h17" />
  </svg>
);
const Sun = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
  </svg>
);
const Tower = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 20.5V5a1.5 1.5 0 0 1 1.5-1.5h7A1.5 1.5 0 0 1 15 5v15.5M15 9.5h3.5A1.5 1.5 0 0 1 20 11v9.5M3.5 20.5h17M8.5 7.5h3M8.5 11h3M8.5 14.5h3" />
  </svg>
);

/** The icon of each group of the directory (crawler/taxonomy.mjs). A group with none takes the shop front. */
const GROUP_ICONS: Record<string, (p: P) => React.ReactElement> = {
  eat: Fork,
  shops: Bag,
  stay: Bed,
  health: Cross,
  money: Coin,
  motoring: Car,
  home: House,
  beauty: Scissors,
  learning: Cap,
  offices: Case,
  leisure: Sun,
  public: Landmark,
  companies: Tower,
};
export function GroupIcon({ group, ...p }: P & { group?: string }) {
  const Icon = (group && GROUP_ICONS[group]) || Store;
  return <Icon {...p} />;
}
