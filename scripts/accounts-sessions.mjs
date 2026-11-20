// A session that runs out, and is renewed: by the proxy before a page, and by a server action.
//
//   ACCOUNTS_JWT_EXP=100 bash scripts/accounts-stack.sh reset   # tokens that last 100 seconds
//   npx next start -p 3300                                       # the build made for the stack
//   ACCOUNTS_JWT_EXP=100 node scripts/accounts-sessions.mjs [origin]
//
// A hosted project's tokens last an hour, and the client renews one in its last ninety seconds,
// so this cannot be seen by waiting. With tokens of 100 seconds, each is due for renewal ten
// seconds after it is made: the check waits that long between steps, and the person must stay
// signed in throughout. (Tokens shorter than the ninety seconds are always due, so every reader
// renews at once and Auth, rightly, takes it for abuse: do not go below 95.)
// Exits 1 if any check fails. Needs: playwright (devDependency).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { browserPath } from "./pages.mjs";

const origin = process.argv[2] ?? "http://localhost:3300";
const MAIL_DIR = process.env.MAIL_DIR ?? ".accounts-stack/mail";
let failed = 0;
let passed = 0;
const check = (name, ok, detail = "") => {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "pass" : "FAIL"}  ${name}${ok || !detail ? "" : `  (${String(detail).slice(0, 300)})`}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function linkFor(email) {
  for (let i = 0; i < 40; i++) {
    for (const file of (existsSync(MAIL_DIR) ? readdirSync(MAIL_DIR).sort() : []).reverse()) {
      const raw = readFileSync(join(MAIL_DIR, file), "utf8");
      if (!raw.includes(email)) continue;
      const href = /href="([^"]+)"/.exec(raw.replace(/=\r?\n/g, "").replace(/=3D/g, "="))?.[1];
      if (href) return href.replace(/&amp;/g, "&");
    }
    await sleep(250);
  }
}

const browser = await chromium.launch({ executablePath: browserPath() });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const session = async () => (await context.cookies()).filter((c) => c.name === "biznes-auth" || c.name.startsWith("biznes-auth.")).map((c) => c.value).join("");
const go = async (url) => {
  const response = await page.goto(url, { waitUntil: "load" });
  await page.waitForLoadState("networkidle", { timeout: 2500 }).catch(() => {});
  return response;
};
const life = Number(process.env.ACCOUNTS_JWT_EXP ?? 100);
if (!(life >= 95 && life <= 300)) {
  console.error("Set ACCOUNTS_JWT_EXP to the stack's token life, from 95 to 300 seconds.");
  process.exit(2);
}
// How long until a new token is due for renewal: its life less the client's ninety seconds, and a little.
const WAIT = (life - 90) * 1000 + 2500;
const who = { name: "Sam Session", email: `sam-${Date.now()}@biznes.test`, password: "sam-password-1" };

await go(`${origin}/account/sign-up`);
for (const [name, value] of Object.entries(who)) await page.fill(`main [name="${name}"]`, value);
await page.locator("main button[type=submit]").click();
await page.waitForSelector('main form [role="status"]', { timeout: 20000 }).catch(() => {});
const link = await linkFor(who.email);
if (link) await go(link);
check("signed in by the link in the email", new URL(page.url()).pathname === "/account", page.url());
const first = await session();

await sleep(WAIT);
await go(`${origin}/dashboard`);
const second = await session();
check("after the token has run out, a page still knows who has come", new URL(page.url()).pathname === "/dashboard" && /Your businesses/.test(await page.locator("main h1").innerText()), page.url());
check("because the proxy renewed the session before the page, and sent the new cookies", Boolean(second) && second !== first);

await sleep(WAIT);
await go(`${origin}/account`);
await sleep(WAIT);
await page.fill('main [name="name"]', "Sam Renewed");
await page.locator("main aside form button[type=submit]").first().click();
await page.waitForSelector('main aside form [role="status"]', { timeout: 15000 }).catch(() => {});
const third = await session();
check("a form sent after the token has run out is still saved as that person", /Saved/.test(await page.locator("main aside").innerText()) && (await page.inputValue('main [name="name"]')) === "Sam Renewed");
check("and the session is renewed again", Boolean(third) && third !== second);

await sleep(WAIT);
await go(origin);
await page.waitForSelector('header a[href="/account"]', { timeout: 10000 }).catch(() => {});
check("on a public page, which the proxy leaves alone, the header still finds the person", (await page.locator('header a[href="/account"]').innerText().catch(() => "")).trim() === "S");

await sleep(WAIT);
const dashboard = await go(`${origin}/dashboard/new`);
check("and they are still signed in afterwards", dashboard?.status() === 200 && new URL(page.url()).pathname === "/dashboard/new", page.url());

await go(`${origin}/account`);
await Promise.all([page.waitForURL(`${origin}/`, { timeout: 15000 }).catch(() => {}), page.locator("main").getByRole("button", { name: "Sign out", exact: true }).click()]);
await go(`${origin}/account`);
check("signed out, the account page asks them to sign in", new URL(page.url()).pathname === "/account/sign-in", page.url());

await browser.close();
console.log(`\n${passed} passed, ${failed} failed.`);
process.exit(failed ? 1 : 0);
