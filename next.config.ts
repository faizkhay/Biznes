import type { NextConfig } from "next";

// biznes.mu. The fixed pages are prerendered; a listing's page, a town's and a category's are made
// the first time they are asked for and then kept; the search and the request form run on a server.
const security = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const config: NextConfig = {
  reactStrictMode: true,
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
      // The service worker is always asked for afresh, so a new version of the site is never held back by an old one.
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] },
    ];
  },
};

export default config;
