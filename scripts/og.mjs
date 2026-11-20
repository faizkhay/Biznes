// The link preview card (public/og.jpg): the name and the line on the lagoon picture, with the
// index's own counts, at 1200 by 630. Run it after a crawl, so the card shows the index of the day.
//
//   npm run dev &
//   node scripts/og.mjs [origin]        (default http://localhost:3000)
//
// The page it captures (/og) exists only under `next dev`. A JPEG cannot carry where it came from
// inside it, so a .json beside it says what it is and what made it.
//
// Needs: playwright, sharp (devDependencies).
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";
import sharp from "sharp";
import { browserPath } from "./pages.mjs";

const origin = process.argv[2] ?? "http://localhost:3000";
const browser = await chromium.launch({ executablePath: browserPath() });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
await page.goto(`${origin}/og`, { waitUntil: "networkidle", timeout: 120000 });
await page.evaluate(() => document.fonts.ready);
// Only the card: the site's header and footer are not part of it, nor is the dev server's own badge.
await page.addStyleTag({ content: "header, footer, .skip-link, .tabbar, .backdrop, nextjs-portal { display: none !important; }" });
await page.waitForTimeout(600);
const png = await page.locator("#og").screenshot();
const info = await sharp(png).jpeg({ quality: 88, mozjpeg: true }).toFile("public/og.jpg");
writeFileSync(
  "public/og.jpg.json",
  `${JSON.stringify(
    {
      file: "/og.jpg",
      is: "The link preview card: the site's name and its line with the index's own counts, set on the lagoon picture. The picture is an illustration generated for this site (public/themes/lagoon.jpg.json), not a photograph of a place.",
      made: "scripts/og.mjs, from src/app/og/page.dev.tsx under next dev",
      size: `${info.width} x ${info.height}`,
      prompt: "Origin: a capture of this site's own page. Its background is public/themes/lagoon.jpg, a generated illustration; see the note beside that file.",
    },
    null,
    2,
  )}\n`,
);
console.log(`public/og.jpg  ${info.width} x ${info.height}  ${Math.round(info.size / 1024)} KB`);
await browser.close();
