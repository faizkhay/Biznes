import type { NextConfig } from "next";

// biznes.mu. Every page is prerendered; only /api/enquiry runs on a server, because the request
// form delivers by webhook or email (see README, "Where requests go").
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
  async headers() {
    return [{ source: "/:path*", headers: security }];
  },
};

export default config;
