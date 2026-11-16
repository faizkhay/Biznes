/**
 * The address the site is served from, for canonical links, the sitemap, structured data and link
 * previews: NEXT_PUBLIC_SITE_URL when it is set; on Vercel, the project's own production address;
 * otherwise localhost, with one warning at build time rather than silently publishing links to
 * localhost, or to a domain the client does not own.
 *
 * KOS kit. From KYÔ (src/data/site.ts).
 */
const vercel = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || (vercel ? `https://${vercel}` : "http://localhost:3000")).replace(
  /\/$/,
  "",
);

if (!process.env.NEXT_PUBLIC_SITE_URL && !vercel && process.env.NODE_ENV === "production" && typeof window === "undefined") {
  const g = globalThis as { __kosUrlWarned?: boolean };
  if (!g.__kosUrlWarned) {
    g.__kosUrlWarned = true;
    console.warn("NEXT_PUBLIC_SITE_URL is not set: canonical links, link previews and the sitemap will point at localhost.");
  }
}
