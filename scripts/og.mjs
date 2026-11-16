// The link preview card: captures the #og frame of the dev-only /og page to public/og.png, and
// writes a sidecar saying where the picture came from.
//
//   npx next dev -p 3200 &
//   node scripts/og.mjs [origin]          (default http://localhost:3200)
//
// Needs: playwright (devDependency). Chromium is found the same way the other checks find it.
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { browserPath } from "./pages.mjs";

const origin = process.argv[2] ?? "http://localhost:3200";
const browser = await chromium.launch({ executablePath: browserPath() });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
await page.goto(`${origin}/og?still`, { waitUntil: "load", timeout: 120000 });
await page.waitForSelector("#og");
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);
await page.locator("#og").screenshot({ path: "public/og.png" });
await browser.close();
writeFileSync(
  "public/og.png.json",
  JSON.stringify(
    {
      file: "og.png",
      made: "scripts/og.mjs, a capture of src/app/og/page.dev.tsx at 1200 x 630",
      contains: "The site's own mark, headline and tags, drawn in code. No photograph, no generated image.",
    },
    null,
    2,
  ) + "\n",
);
console.log("Wrote public/og.png (1200 x 630) and its sidecar");
