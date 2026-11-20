// Icons for the account pages, drawn as the site's own are (src/components/Icons.tsx): a 24px
// grid, 1.5px round strokes, in the current colour. Each is decoration beside words, so each is
// hidden from assistive technology; a control whose only content is an icon carries its own label.
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

export const Person = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8.5" r="3.75" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </svg>
);
export const People = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="9" r="3.25" />
    <path d="M2.75 19.5a6.25 6.25 0 0 1 12.5 0M15.5 6.1a3.25 3.25 0 0 1 0 5.8M18 14.6a6.2 6.2 0 0 1 3.25 4.9" />
  </svg>
);
export const Calendar = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3.75" y="5.25" width="16.5" height="15" rx="2.5" />
    <path d="M3.75 10h16.5M8 3.25v4M16 3.25v4" />
  </svg>
);
export const Wallet = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17v3M4 7.5V17a2.5 2.5 0 0 0 2.5 2.5h11A2.5 2.5 0 0 0 20 17v-6.5A2.5 2.5 0 0 0 17.5 8H6.5A2.5 2.5 0 0 1 4 7.5Z" />
    <path d="M16.25 13.75h.5" />
  </svg>
);
export const Megaphone = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 10.25v3.5a1.5 1.5 0 0 0 1.5 1.5H8l8.5 4V4.75L8 8.75H5.5a1.5 1.5 0 0 0-1.5 1.5ZM8 15.25l1.25 4.25M19.5 9.5a3.5 3.5 0 0 1 0 5" />
  </svg>
);
export const Picture = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3.75" y="4.75" width="16.5" height="14.5" rx="2.5" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m4.5 17 4.75-4.25 3.25 3 2.75-2.25 4.25 3.75" />
  </svg>
);
export const Plate = (p: P) => (
  <svg {...base} {...p}>
    <path d="M7 3.5v6a2 2 0 0 0 2 2v9M5 3.5v4.5M9 3.5v4.5M17 20.5v-7h-2.5V8c0-2.5 1-4.5 2.5-4.5Z" />
  </svg>
);
export const Mail = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3.25" y="5.25" width="17.5" height="13.5" rx="2.5" />
    <path d="m4 7.5 8 6 8-6" />
  </svg>
);
export const Cart = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3.5 4.5h2.25l2 10.5h9.75l1.75-7.5H7" />
    <circle cx="9" cy="18.75" r="1.25" />
    <circle cx="16.5" cy="18.75" r="1.25" />
  </svg>
);
export const Shield = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3.5 5 6v5.5c0 4.25 2.75 7.5 7 9 4.25-1.5 7-4.75 7-9V6l-7-2.5Z" />
    <path d="m9.25 12 2 2 3.5-3.75" />
  </svg>
);
export const Cog = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3.25v2.5M12 18.25v2.5M3.25 12h2.5M18.25 12h2.5M5.8 5.8l1.8 1.8M16.4 16.4l1.8 1.8M5.8 18.2l1.8-1.8M16.4 7.6l1.8-1.8" />
  </svg>
);
export const Tag = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h5.9a1.5 1.5 0 0 1 1.05.450l7.1 7.1a1.5 1.5 0 0 1 0 2.1l-5.9 5.9a1.5 1.5 0 0 1-2.1 0l-7.1-7.1A1.5 1.5 0 0 1 4 11.4V5.5Z" />
    <circle cx="8.25" cy="8.25" r="1.1" />
  </svg>
);
export const Pencil = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4.5 19.5 5.25 16 16.5 4.75a1.77 1.77 0 0 1 2.5 2.5L7.75 18.5l-3.25 1Z" />
    <path d="m14.75 6.5 2.75 2.75" />
  </svg>
);
export const Key = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="8.25" cy="15.75" r="3.75" />
    <path d="m11 13 8.25-8.25M16 8l2.25 2.25M18.25 5.75 20 7.5" />
  </svg>
);
