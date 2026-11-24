import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import HeaderBar from "@/components/HeaderBar";
import SiteFooter from "@/components/SiteFooter";
import { site } from "@/data/site";
import { siteUrl } from "@/lib/site-url";
import { softCopy, themeNow } from "@/lib/theme";
import Pwa from "@/components/Pwa";
import TabBar from "@/components/TabBar";
import "./globals.css";

// Manrope, one file with a weight axis: the face of every sentence, every control and the name.
// SIL OFL 1.1; the licence is beside the file in src/fonts.
const manrope = localFont({
  src: "../fonts/manrope-latin-wght-normal.woff2",
  weight: "200 800",
  variable: "--font-manrope",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

// Bricolage Grotesque, one file with a weight axis and an optical-size axis: the warmer face of
// the titles alone (display-1, heading-1, heading-2 in globals.css). SIL OFL 1.1; the file is the
// latin one from @fontsource-variable/bricolage-grotesque 5.3.0, with its licence beside it.
const bricolage = localFont({
  src: "../fonts/bricolage-grotesque-latin-opsz-normal.woff2",
  weight: "200 800",
  variable: "--font-bricolage",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${site.name} · ${site.line}`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  // On an iPhone or iPad, opened from the home screen, the site runs as an app of its own.
  appleWebApp: { capable: true, title: site.name, statusBarStyle: "default" },
  // Until the owner has confirmed the guides, no page may be indexed (`launched` in src/data/site.ts).
  robots: site.launched ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: { type: "website", siteName: site.name, locale: site.locale, images: [{ url: "/og.jpg", width: 1200, height: 630, alt: `${site.name}: ${site.line}.` }] },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#fdf9ec", colorScheme: "light", viewportFit: "cover" };

// The picture behind the page follows the calendar, so every page is made again at most once an
// hour and takes the day's look with it.
export const revalidate = 3600;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await themeNow();
  // The picture again, out of focus, for the glass to lie on: its own small copy where there is one.
  const frost = softCopy(theme.src);
  const frostSmall = softCopy(theme.small);
  const look = { "--theme-image": `url(${theme.src})`, "--theme-image-sm": `url(${theme.small})`, ...(frost && frostSmall ? { "--theme-frost": `url(${frost})`, "--theme-frost-sm": `url(${frostSmall})` } : {}) } as React.CSSProperties;
  return (
    <html lang="en" className={`${manrope.variable} ${bricolage.variable}`} data-theme={theme.id} data-picture={theme.picture} data-frost={frost && frostSmall ? "made" : undefined} style={look}>
      <body>
        {/* The day's picture is fetched at once and at the size the screen needs: the small one on a phone. React lifts these two into the head. */}
        <link rel="preload" as="image" href={theme.small} media="(max-width: 40rem)" fetchPriority="high" />
        <link rel="preload" as="image" href={theme.src} media="(min-width: 40.01rem)" fetchPriority="high" />
        <div className="backdrop" aria-hidden />
        <div className="frost" aria-hidden />
        <a href="#main" className="skip-link button-sm">
          Skip to the page
        </a>
        <HeaderBar />
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <SiteFooter />
        <TabBar />
        <Pwa />
      </body>
    </html>
  );
}
