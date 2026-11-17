import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import localFont from "next/font/local";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SmoothScroll from "@/components/SmoothScroll";
import { site } from "@/data/site";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

// The sign face: Barlow Condensed, matched to the approved mock-up's lettering by measurement
// (impeccable font-match). Only the three cuts the site sets: a plaque's semibold, a heading's bold
// and the hero's bold italic. SIL OFL 1.1; the licence is beside the files in src/fonts.
const sign = localFont({
  src: [
    { path: "../fonts/barlow-condensed-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../fonts/barlow-condensed-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../fonts/barlow-condensed-latin-700-italic.woff2", weight: "700", style: "italic" },
  ],
  variable: "--font-sign",
  display: "swap",
  fallback: ["Arial Narrow", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${site.name} · ${site.line}`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  // Until the listings are real, no page may be indexed (see `launched` in src/data/site.ts).
  robots: site.launched ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: site.locale,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: `${site.name}: ${site.line}` }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#082478", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: SmoothScroll adds `js` and `can-animate` to <html> after load.
    <html lang="en" className={`${GeistSans.variable} ${sign.variable}`} suppressHydrationWarning>
      <body>
        <a href="#main" className="skip-link button-sm">
          Skip to the page
        </a>
        <SmoothScroll />
        <SiteHeader />
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
