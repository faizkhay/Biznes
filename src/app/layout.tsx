import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SmoothScroll from "@/components/SmoothScroll";
import { site } from "@/data/site";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

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

export const viewport: Viewport = { themeColor: "#f5f2ea", colorScheme: "light" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: SmoothScroll adds `js` and `can-animate` to <html> after load.
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
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
