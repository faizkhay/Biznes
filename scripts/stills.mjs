// The walk's stills: a capture of this site's own painted stage at every stop, framed for a desk
// and for a phone. They are what a visitor sees before the plates have loaded, and instead of the
// stage without script or with ?plain (components/Walk.tsx), so each is the stage as it really
// stands, lettering and all. Also writes the link preview card (public/og.jpg) from the first stop.
//
//   npm run build && npx next start -p 3100 &
//   node scripts/stills.mjs [origin]            (default http://localhost:3100)
//
// It loads the home page with ?debug, which lets this script place the stage at a stop exactly
// (window.__walk) and says when every plate has decoded (window.__stage.ready), so a still is a
// function of the stop alone and two runs give the same picture. Each WebP gets a .json sidecar
// saying what it is and what made it.
//
// Needs: playwright, sharp (devDependencies).
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { browserPath } from "./pages.mjs";

/** What every capture says about where it came from. */
const ORIGIN =
  "Origin: a capture of this site's own painted stage (src/components/stage), made by scripts/stills.mjs. The paintings on it are generated illustrations whose prompts are in public/img/plates/*.json; the lettering, the plaque and the tags are set over them in code from the site's data.";

const origin = process.argv[2] ?? "http://localhost:3100";
// ONLY=street,all narrows the stops, for tuning one view without waiting for the rest.
const only = process.env.ONLY?.split(",");
const out = "public/img/walk";
mkdirSync(out, { recursive: true });

const FRAMES = [
  ["desk", { width: 1600, height: 992 }, 1],
  ["phone", { width: 390, height: 844 }, 2],
];

const browser = await chromium.launch({ executablePath: browserPath() });
for (const [frame, viewport, scale] of FRAMES) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: scale });
  page.on("pageerror", (e) => console.log("PAGE ERROR", e.message));
  await page.goto(`${origin}/?debug`, { waitUntil: "networkidle", timeout: 180000 });
  await page.waitForFunction(() => window.__stage?.ready === true && typeof window.__walk === "function", null, { timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  const stops = await page.evaluate(() => [...document.querySelectorAll(".walk-chapter")].map((el) => el.id.replace("walk-", "")));
  // Only the stage: the words, the header and the stop marks are not part of a still.
  await page.addStyleTag({ content: ".walk-chapters, .walk-stops, header { visibility: hidden !important; } .stage-still { display: none !important; } .stage-live { opacity: 1 !important; transition: none !important; } .plate-glow { animation: none !important; }" });
  for (let i = 0; i < stops.length; i++) {
    if (only && !only.includes(stops[i])) continue;
    await page.evaluate((i) => {
      window.scrollTo(0, 0);
      window.__walk(i);
    }, i);
    await page.waitForTimeout(350);
    const box = await page.locator(".walk-stage").boundingBox();
    const png = await page.screenshot({ clip: box });
    const file = `${out}/${stops[i]}-${frame}.webp`;
    const info = await sharp(png).webp({ quality: 84 }).toFile(file);
    writeFileSync(
      `${file}.json`,
      JSON.stringify(
        {
          file: file.replace("public", ""),
          is: `The painted stage at the "${stops[i]}" stop of the walk, framed for a ${frame === "desk" ? "wide screen" : "phone"}. A capture of this site's own stage: generated paintings with the listings' lettering set over them in code.`,
          made: "scripts/stills.mjs, from src/components/stage, through ?debug and window.__walk",
          size: `${info.width} x ${info.height}`,
          // The field impeccable's provenance scan reads. A capture, so it states its origin.
          prompt: ORIGIN,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(`${file}  ${info.width} x ${info.height}  ${Math.round(info.size / 1024)} KB`);
    if (frame === "desk" && i === 0) {
      // The link preview card: the first screen as a visitor sees it, words and all, at 1200 x 630.
      await page.addStyleTag({ content: ".walk-chapters { visibility: visible !important; } .walk-cue { display: none !important; }" });
      await page.setViewportSize({ width: 1200, height: 702 });
      await page.evaluate(() => window.__walk(0));
      await page.waitForTimeout(350);
      // A JPEG: the card is a painting, and as a PNG it weighed a megabyte.
      const card = await page.screenshot({ clip: { x: 0, y: 72, width: 1200, height: 630 } });
      const cardInfo = await sharp(card).jpeg({ quality: 86, mozjpeg: true }).toFile("public/og.jpg");
      writeFileSync(
        "public/og.jpg.json",
        JSON.stringify({ file: "/og.jpg", is: "The link preview card: the home page's first screen, captured from this site at 1200 x 630.", made: "scripts/stills.mjs", prompt: ORIGIN }, null, 2) + "\n",
      );
      console.log(`public/og.jpg  1200 x 630  ${Math.round(cardInfo.size / 1024)} KB`);
      await page.setViewportSize(viewport);
      await page.addStyleTag({ content: ".walk-chapters { visibility: hidden !important; }" });
    }
  }
  await page.close();
}
await browser.close();
