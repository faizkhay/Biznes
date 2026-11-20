import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import localFont from "next/font/local";
import HeaderBar from "@/components/HeaderBar";
import SiteFooter from "@/components/SiteFooter";
import { site } from "@/data/site";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

// Archivo, one file with a width axis: the site sets it wide for its name and its titles. SIL OFL
// 1.1; the licence is beside the file in src/fonts.
const archivo = localFont({
  src: "../fonts/archivo-latin-wdth-normal.woff2",
  weight: "100 900",
  variable: "--font-archivo",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
  fallback: ["Arial", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${site.name} · ${site.line}`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  // Until the owner has confirmed the guides, no page may be indexed (`launched` in src/data/site.ts).
  robots: site.launched ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: { type: "website", siteName: site.name, locale: site.locale },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#050a1a", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${archivo.variable}`}>
      <body>
        <a href="#main" className="skip-link button-sm">
          Skip to the page
        </a>
        <HeaderBar />
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
