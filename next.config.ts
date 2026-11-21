import type { NextConfig } from "next";

// biznes.mu. The fixed pages are prerendered; a listing's page, a town's and a category's are made
// the first time they are asked for and then kept; the search and the request form run on a server.

const dev = process.env.NODE_ENV === "development";

/** The origin of an address ("https://example.org"), or nothing if it is not an address. */
function originOf(address: string | undefined): string | undefined {
  try {
    return address ? new URL(address).origin : undefined;
  } catch {
    return undefined;
  }
}

// The accounts' Supabase project, when the site is told of one (NEXT_PUBLIC_SUPABASE_URL): owners'
// pictures are served from it, and an upload goes to it straight from the browser.
const SUPABASE = originOf(process.env.NEXT_PUBLIC_SUPABASE_URL);
// The street map: OpenFreeMap serves its tiles, styles, fonts and sprites; OpenStreetMap its own tiles.
const MAP = "https://tiles.openfreemap.org";
const MAP_TILES = "https://*.tile.openstreetmap.org";

/**
 * The Content-Security-Policy: what a page may load, and from where. One policy for every page,
 * set here so that the pages made ahead of time stay made ahead of time.
 *
 * What it does not do. Next writes each page's data into the page as inline script, and a page
 * made ahead of time cannot carry a nonce (node_modules/next/dist/docs, "Content Security
 * Policy"), so `script-src` has to allow inline script. An inline <script> injected into a page
 * would therefore still run. Everything else is closed: script from any other site, script in an
 * attribute (onclick, onerror), plugins, frames in either direction, a <base> or a form that points
 * elsewhere, and any connection or picture outside the hosts named below. A policy with nonces
 * would close the last gap, at the price of rendering every page on each request.
 *
 * To let a page load something new, add its host to the one directive that needs it, here.
 */
const csp = (
  [
    ["default-src", "'self'"],
    // React needs eval only under `next dev`, to rebuild a server error's stack in the browser.
    ["script-src", "'self'", "'unsafe-inline'", dev && "'unsafe-eval'"],
    ["script-src-attr", "'none'"],
    // The picture behind the page and a few measures are set as style attributes.
    ["style-src", "'self'", "'unsafe-inline'"],
    ["img-src", "'self'", "data:", "blob:", SUPABASE, MAP, MAP_TILES],
    ["font-src", "'self'", MAP, dev && "data:"],
    ["connect-src", "'self'", SUPABASE, MAP, MAP_TILES, dev && "ws:"],
    // The service worker is the site's own file. A map library starts its worker from a blob.
    ["worker-src", "'self'", "blob:"],
    ["manifest-src", "'self'"],
    ["media-src", "'self'"],
    ["object-src", "'none'"],
    ["frame-src", "'none'"],
    ["frame-ancestors", "'none'"],
    ["base-uri", "'self'"],
    ["form-action", "'self'"],
  ] as (string | false | undefined)[][]
)
  .map((directive) => directive.filter(Boolean).join(" "))
  .join("; ");

const security = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // No page of the site is shown inside a frame, its own included. For browsers that do not read `frame-ancestors`.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // A window this site opens, or that opens it, shares nothing with it.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

// One person's own pages and the endpoints behind the pages are never for a search engine.
const PRIVATE = ["/account", "/dashboard", "/admin", "/auth", "/api"];
const unlisted = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const config: NextConfig = {
  reactStrictMode: true,
  // Nobody needs to be told what the site is built with.
  poweredByHeader: false,
  // The proxy keeps a copy of each request's body for the pages it guards. The largest thing they
  // take is one picture of 3 MB with its form, so the copy stops at 4 MB instead of the default 10.
  experimental: { proxyClientMaxBodySize: "4mb" },
  // A tool page (one ending .dev.tsx) is a page only under `next dev`.
  pageExtensions: process.env.NODE_ENV === "development" ? ["dev.tsx", "tsx", "ts"] : ["tsx", "ts"],
  // The index is read from disk at run time, so it must travel with the server.
  outputFileTracingIncludes: { "/*": ["./data/index/**/*", "./content/**/*"] },
  // The site sold businesses before it searched for them. Its old addresses lead somewhere useful.
  async redirects() {
    return [
      { source: "/businesses", destination: "/directory", permanent: true },
      { source: "/businesses/:slug", destination: "/directory", permanent: true },
      { source: "/how-it-works", destination: "/data", permanent: true },
      { source: "/enquire", destination: "/add", permanent: true },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: security },
      ...PRIVATE.map((root) => ({ source: `${root}/:path*`, headers: unlisted })),
      // The service worker is always asked for afresh, so a new version of the site is never held back by an old one.
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] },
    ];
  },
};

export default config;
