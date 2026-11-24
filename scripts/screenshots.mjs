/**
 * Captures of every page in scripts/pages.mjs, desktop and phone, for review, and the two checks
 * that come free with them: horizontal overflow and page errors.
 *
 *   npm run build && npx next start -p 3100 &
 *   node scripts/screenshots.mjs [origin] [outDir]        (ONLY=home,contact narrows the pages)
 *
 * Writes viewport slices to <outDir>/slices and stitches each page into <outDir>/<page>-<viewport>.png
 * with ImageMagick when it is installed. Prints one line per page: its height, its overflow (must be
 * 0) and its first page error (must be none). Exits 1 if any page overflows or errors.
 *
 * Viewport slices, not fullPage: a full-page capture resizes the viewport, which resizes every svh
 * unit and breaks a pinned story. Scrolling also triggers lazy images. Software WebGL, so it runs on
 * a server with no GPU (slowly: the home page is given time to draw).
 *
 * Read the saved images back before claiming anything about how the site looks.
 *
 * KOS kit. From DHE (scripts/screenshots.mjs). Needs: npm i -D playwright
 */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { PAGES, VIEWPORTS, browserPath, GL_ARGS, steady } from "./pages.mjs";

const origin = process.argv[2] ?? "http://localhost:3100";
const out = process.argv[3] ?? "review/screens";
const only = process.env.ONLY?.split(",");
mkdirSync(join(out, "slices"), { recursive: true });

let magick = true;
try {
  execFileSync("convert", ["-version"], { stdio: "ignore" });
} catch {
  magick = false;
}

const browser = await chromium.launch({ executablePath: browserPath(), args: GL_ARGS });
let failures = 0;
for (const [vname, vp] of VIEWPORTS) {
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1, reducedMotion: "reduce" });
  await steady(page.context());
  for (const [name, path] of PAGES) {
    if (only && !only.includes(name)) continue;
    const errors = [];
    page.removeAllListeners("pageerror");
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(origin + path + (path.includes("?") ? "&" : "?") + "still", { waitUntil: "networkidle", timeout: 120000 });
    // Reveal everything that animates in, and give WebGL time on a CPU renderer.
    await page.evaluate(() => document.querySelectorAll("[data-reveal]").forEach((el) => el.setAttribute("data-reveal", "in")));
    const heavy = name === "home"; // the home page's stage loads its plates before it can be read
    await page.waitForTimeout(heavy ? 4000 : 1500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    // The header is sticky, so it covers the top of every viewport after the first. Each later slice
    // therefore advances by the viewport less the header and is clipped below the header, so the
    // stitched page shows every pixel once and the header once. (The first design review could not
    // see three strips of the home page that an earlier version hid under the repeated header.)
    const nav = await page.evaluate(() => {
      const h = document.querySelector("header");
      return h && getComputedStyle(h).position === "sticky" ? Math.round(h.getBoundingClientRect().height) : 0;
    });
    const step = vp.height - nav;
    const slices = height <= vp.height ? 1 : 1 + Math.ceil((height - vp.height) / step);
    for (const f of readdirSync(join(out, "slices")).filter((f) => f.startsWith(`${name}-${vname}-`)))
      rmSync(join(out, "slices", f));
    const files = [];
    for (let i = 0; i < slices; i++) {
      const want = i * step; // the page offset this slice should start showing at, below the header
      const y = Math.min(want, height - vp.height);
      await page.evaluate((y) => window.scrollTo(0, y), y);
      await page.waitForTimeout(heavy ? 900 : 600);
      const file = join(out, "slices", `${name}-${vname}-${String(i).padStart(2, "0")}.png`);
      // Skip the header on every slice after the first, and on the last slice (which cannot scroll a
      // full step) skip what the slice before it already showed.
      const top = i === 0 ? 0 : nav + (want - y);
      const clip = i === 0 ? undefined : { x: 0, y: top, width: vp.width, height: vp.height - top };
      await page.screenshot({ path: file, clip });
      files.push(file);
    }
    if (magick) execFileSync("convert", [...files, "-append", join(out, `${name}-${vname}.png`)]);
    if (overflow > 0 || errors.length) failures++;
    console.log(
      `${vname.padEnd(8)} ${name.padEnd(13)} ${String(height).padStart(6)}px overflow=${overflow}px ${errors.length ? "ERR " + errors[0] : ""}`,
    );
  }
  await page.close();
}
// The landing page once more, with motion allowed: the captures above are taken under reduced
// motion, where nothing falls over it. This one shows what falls, caught as it is.
for (const [vname, vp] of VIEWPORTS) {
  if (only && !only.includes("landing")) continue;
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
  await steady(page.context());
  await page.goto(origin, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForSelector(".landing[data-leaves]", { timeout: 10000 });
  await page.waitForTimeout(1500);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  await page.screenshot({ path: join(out, `landing-leaves-${vname}.png`) });
  if (overflow > 0) failures++;
  console.log(`${vname.padEnd(8)} ${"landing-leaves".padEnd(13)} ${String(vp.height).padStart(6)}px overflow=${overflow}px`);
  await page.close();
}
await browser.close();
process.exit(failures ? 1 : 0);
