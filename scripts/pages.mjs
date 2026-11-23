// The pages and viewports every check visits. Edit this list per build: one page of each kind,
// in every language, plus the 404. Shared by scripts/a11y.mjs and scripts/screenshots.mjs.
//
// KOS kit. The two viewports are the Khay standard: a 1440 x 900 desk and a 390 x 844 phone.
import { existsSync } from "node:fs";
import { join } from "node:path";

export const PAGES = [
  ["landing", "/"],
  ["home", "/home"],
  ["search", "/search?q=pharmacy+in+curepipe"],
  ["search-guides", "/search?q=vat"],
  ["search-none", "/search?q=zzqqxx"],
  ["search-empty", "/search"],
  ["listing", "/b/keiffel-tours-grand-baie-n5651200767"],
  ["directory", "/directory"],
  ["category", "/directory/pharmacies"],
  ["category-place", "/directory/restaurants/grand-baie"],
  ["places", "/places"],
  ["place", "/places/curepipe"],
  ["more", "/more"],
  ["learn", "/learn"],
  ["guide", "/learn/vat"],
  ["glossary", "/learn/glossary"],
  ["tools", "/tools"],
  ["tool-vat", "/tools/vat"],
  ["tool-income-tax", "/tools/income-tax"],
  ["tool-business-tax", "/tools/business-tax"],
  ["tool-verify", "/tools/verify"],
  ["tool-structures", "/tools/structures"],
  ["official", "/official"],
  ["data", "/data"],
  ["bot", "/bot"],
  ["add", "/add"],
  ["privacy", "/privacy"],
  ["search-narrowed", "/search?q=restaurants&phone=1"],
  ["pricing", "/pricing"],
  ["saved", "/saved"],
  ["emergency", "/emergency"],
  ["shop", "/shop"],
  ["offline", "/offline"],
  ["holidays", "/holidays"],
  ["about", "/about"],
  ["baz-manzer", "/baz-manzer"],
  ["baz-narrowed", "/baz-manzer?food=chinese&town=port-louis"],
  ["cart", "/cart"],
  ["search-answer", "/search?q=cyclone+season"],
  ["search-who", "/search?q=bank"],
  ["guide-food", "/learn/mauritian-food"],
  ["listing-food", "/b/acqua-and-farina-pizzeria-beau-bassin-rose-hill-n14064293374"],
  ["category-health", "/directory/pharmacies/curepipe"],
  ["missing", "/no-such-page"],
];

export const VIEWPORTS = [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
];

/**
 * Chromium for Playwright. Take an explicit CHROME, then the machine's own build under
 * PLAYWRIGHT_BROWSERS_PATH (CI images and cloud containers provision it separately, with a build
 * number Playwright did not pin), then let Playwright resolve its own.
 */
export function browserPath() {
  if (process.env.CHROME) return process.env.CHROME;
  for (const root of [process.env.PLAYWRIGHT_BROWSERS_PATH, "/opt/pw-browsers"]) {
    if (!root) continue;
    const candidate = join(root, "chromium");
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

/**
 * Makes "the network is idle" mean it. Next answers a link fetched ahead with
 * "stale-while-revalidate". On a second visit to a page the browser then hands over the copy it
 * kept and asks again in the background, and that background request is never reported as
 * finished, so a wait for an idle network never ends. A route that passes everything on turns the
 * browser's own cache off (Playwright: "enabling routing disables http cache"), and each file is
 * asked for once. What the service worker keeps is another store, and is left as it is.
 */
export async function steady(context) {
  await context.route(/[?&]_rsc=/, (route) => route.continue());
  return context;
}

/** No special arguments: nothing on this site needs WebGL. Kept so the kit's scripts read unchanged. */
export const GL_ARGS = [];
