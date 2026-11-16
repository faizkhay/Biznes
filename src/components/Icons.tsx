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

export const Arrow = (p: P) => (
  <svg {...base} {...p} className={["arrow", p.className].filter(Boolean).join(" ")}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
);

export const ArrowBack = (p: P) => (
  <svg {...base} {...p}>
    <path d="M20 12H5M11 6l-6 6 6 6" />
  </svg>
);

export const Phone = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  </svg>
);

/** A speech bubble, for messaging. The service is named in words beside it. */
export const Chat = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.3-1.1A8.5 8.5 0 1 0 12 3.5Z" />
    <path d="M8.5 11.5h7M8.5 14.5h4" />
  </svg>
);

export const Mail = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 7 8.5 6 8.5-6" />
  </svg>
);

export const Plus = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const Tick = (p: P) => (
  <svg {...base} {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

/** A small mark that leads an error message, so the error is never colour alone. */
export const Alert = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 8v5M12 16.2v.1" />
  </svg>
);
