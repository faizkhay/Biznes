// The accounts, checked in a real browser against a real Supabase Auth and PostgREST.
//
//   bash scripts/accounts-stack.sh up        # a local stack in Docker: Postgres, Auth, PostgREST
//   npm run build && npx next start -p 3300  # with the two variables the stack prints
//   node scripts/accounts-e2e.mjs [origin]   # default http://localhost:3300
//
// It needs a database with the migrations applied and NO accounts yet, because it checks that the
// first person to sign up becomes the superadmin: `accounts-stack.sh up` gives exactly that. It
// reads the emails Auth sends from the stack's mail sink (MAIL_DIR) and looks two things up in the
// database with psql (DATABASE_URL). Exits 1 if any check fails.
//
// Along the way it stops on each kind of account page, in the state a person would see it, and
// checks it the way the public pages are checked (scripts/a11y.mjs, scripts/screenshots.mjs):
// axe-core for WCAG 2.2 A and AA at a desk and on a phone, no page wider than its screen, and a
// capture of each in SCREENS (default .accounts-stack/screens) to look over.
//
// It also asks the database a few things as a visitor would, and as a person signed in, over its
// own API, with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (the two variables the
// site itself is given): what the public can and cannot read is checked there, not only on a page.
// And it needs BIZNES_SITE_PROOF, the word the stack's database asks of a visitor's writes: the
// site must be built and served with it, and this script given it, as `accounts-stack.sh env` prints.
// It looks through .next for that word, so run it from the root of the build it is checking.
//
// For the site's own email it needs the other variables `accounts-stack.sh env` prints, on the
// site and here alike: EMAIL_PROVIDER=local and EMAIL_TEST_URL, an address on this machine where
// this script listens for the batches the site sends (no message leaves the machine); EMAIL_BATCH,
// two addresses to a batch; and the two secrets the webhooks are signed with. It does not listen
// from the start: until it does the site has no sender, and the checks see it that way first.
// The site should be built with NEXT_PUBLIC_SITE_URL set to its own address, as a real one is.
//
// Needs: playwright and @axe-core/playwright (devDependencies), psql.
import AxeBuilder from "@axe-core/playwright";
import { execFileSync } from "node:child_process";
import { createHmac, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import http from "node:http";
import { join } from "node:path";
import { deflateSync } from "node:zlib";
import { chromium } from "playwright";
import { VIEWPORTS, browserPath } from "./pages.mjs";

const origin = process.argv[2] ?? "http://localhost:3300";
const MAIL_DIR = process.env.MAIL_DIR ?? ".accounts-stack/mail";
const DATABASE_URL = process.env.DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:54322/postgres";

let failed = 0;
let passed = 0;
const check = (name, ok, detail = "") => {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "pass" : "FAIL"}  ${name}${ok || !detail ? "" : `  (${String(detail).slice(0, 300)})`}`);
};
const sql = (query) => execFileSync("psql", [DATABASE_URL, "-X", "-At", "-c", query], { encoding: "utf8" }).trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** The link in the newest email to an address, as a person would click it. */
async function linkFor(email, after = 0) {
  for (let i = 0; i < 40; i++) {
    const files = existsSync(MAIL_DIR) ? readdirSync(MAIL_DIR).sort() : [];
    for (const file of files.slice(after).reverse()) {
      const raw = readFileSync(join(MAIL_DIR, file), "utf8");
      if (!raw.toLowerCase().includes(`to: ${email}`.toLowerCase()) && !raw.includes(email)) continue;
      const body = raw.replace(/=\r?\n/g, "").replace(/=3D/g, "=");
      const href = /href="([^"]+)"/.exec(body)?.[1];
      if (href) return href.replace(/&amp;/g, "&");
    }
    await sleep(250);
  }
  return undefined;
}
const mails = () => (existsSync(MAIL_DIR) ? readdirSync(MAIL_DIR).length : 0);

const SCREENS = process.env.SCREENS ?? ".accounts-stack/screens";
mkdirSync(SCREENS, { recursive: true });

const API = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
/** Rows of a table or a view, asked of the database's API with a token. What may not be read at all gives none. */
async function rows(path, token) {
  if (!API || !KEY) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, as for the site.");
  const response = await fetch(`${API}/rest/v1/${path}`, { headers: { apikey: KEY, Authorization: `Bearer ${token}` } });
  if (response.status === 401 || response.status === 403) return [];
  if (!response.ok) throw new Error(`${path}: ${response.status} ${await response.text()}`);
  return response.json();
}
/** As a visitor who is not signed in. */
const asVisitor = (path) => rows(path, KEY);
/** The word the site sends with a visitor's writes, when the stack asks for one (scripts/accounts-stack.sh). */
const PROOF = process.env.BIZNES_SITE_PROOF ?? "";
/** A function of the database, called over its API as a visitor would call it: with the public key, and with or without the site's word. */
const call = (name, args, word = "") =>
  fetch(`${API}/rest/v1/rpc/${name}`, { method: "POST", headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", ...(word ? { "x-biznes-proof": word } : {}) }, body: JSON.stringify(args) });
/** The session token a signed-in page holds. */
async function tokenOf(page) {
  const parts = (await page.context().cookies()).filter((c) => c.name === "biznes-auth" || c.name.startsWith("biznes-auth.")).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  let kept = decodeURIComponent(parts.map((c) => c.value).join(""));
  if (kept.startsWith("base64-")) kept = Buffer.from(kept.slice(7), "base64url").toString("utf8");
  return JSON.parse(kept).access_token;
}
/** How many files the bucket holds under a folder. */
const kept = (folder) => Number(sql(`select count(*) from storage.objects where bucket_id = 'media' and name like '${folder}/%'`));
/** Every file under a directory, for looking through what a build would send a browser. */
function filesUnder(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? filesUnder(join(dir, entry.name)) : [join(dir, entry.name)]));
}
/** As the person signed in on a page: with the token their session cookie holds. */
async function asPerson(page, path) {
  const parts = (await page.context().cookies()).filter((c) => c.name === "biznes-auth" || c.name.startsWith("biznes-auth.")).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  let kept = decodeURIComponent(parts.map((c) => c.value).join(""));
  if (kept.startsWith("base64-")) kept = Buffer.from(kept.slice(7), "base64url").toString("utf8");
  const token = JSON.parse(kept).access_token;
  if (!token) throw new Error("No session to ask with.");
  return rows(path, token);
}

/** A picture to upload, made here: a PNG that runs from one colour to another. */
function png(width, height, from, to) {
  const table = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (bytes) => {
    let c = 0xffffffff;
    for (const b of bytes) c = table[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const out = Buffer.alloc(body.length + 8);
    out.writeUInt32BE(data.length, 0);
    body.copy(out, 4);
    out.writeUInt32BE(crc(body), body.length + 4);
    return out;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8);
  const lines = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = (x / width + y / height) / 2;
      for (let k = 0; k < 3; k++) lines[y * (width * 3 + 1) + 1 + x * 3 + k] = Math.round(from[k] + (to[k] - from[k]) * t);
    }
  }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", header), chunk("IDAT", deflateSync(lines)), chunk("IEND", Buffer.alloc(0))]);
}
const PICTURE_DIR = join(SCREENS, "..", "pictures");
mkdirSync(PICTURE_DIR, { recursive: true });
const picture = (name, bytes) => {
  const path = join(PICTURE_DIR, name);
  writeFileSync(path, bytes);
  return path;
};
const PICTURES = {
  cover: picture("cover.png", png(1200, 525, [8, 76, 97], [250, 204, 21])),
  photo: picture("photo.png", png(800, 600, [20, 83, 45], [253, 224, 71])),
  other: picture("other.png", png(800, 600, [124, 45, 18], [254, 215, 170])),
  art: picture("art.png", png(960, 540, [30, 27, 75], [244, 114, 182])),
  // Words that call themselves a picture.
  notOne: picture("not-a-picture.jpg", "These are words, not a picture."),
  // A PNG that calls itself a JPEG: it is kept as what it is.
  mislabelled: picture("really-a-png.jpg", png(1200, 525, [120, 53, 15], [253, 230, 138])),
};
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const audited = [];
const faults = [];
/** The page as it stands, checked at a desk and on a phone: axe, its width, and a capture. */
async function audit(page, name) {
  const desk = page.viewportSize();
  // After a form is answered the page is drawn again, and its title with it: wait for that to finish.
  await page.waitForFunction(() => document.title.length > 0, null, { timeout: 5000 }).catch(() => {});
  for (const [vp, size] of VIEWPORTS) {
    await page.setViewportSize(size);
    // From the top, as a person arrives: a link that has scrolled under the header is not a small target.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);
    const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    for (const v of violations.filter((v) => v.impact === "serious" || v.impact === "critical")) faults.push(`${name} ${vp}: ${v.id} at ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join("; ")}`);
    const wide = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (wide > 1) faults.push(`${name} ${vp}: ${wide}px wider than the screen`);
    await page.screenshot({ path: join(SCREENS, `${name}-${vp}.jpg`), type: "jpeg", quality: 60, fullPage: true });
  }
  await page.setViewportSize(desk);
  audited.push(name);
}

const browser = await chromium.launch({ executablePath: browserPath() });
const errors = [];
async function person() {
  const context = await browser.newContext({ serviceWorkers: process.env.SW === "block" ? "block" : "allow",  viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  return { context, page };
}
/**
 * Open a page as a person would, and give it a moment to settle. The wait is not required to end:
 * opening the same page twice in one browser leaves the router's own prefetches of other pages
 * waiting for some seconds, on this site with or without accounts, and no check depends on them.
 */
async function go(page, url) {
  const response = await page.goto(url, { waitUntil: "load" });
  await page.waitForLoadState("networkidle", { timeout: 2500 }).catch(() => {});
  return response;
}
/**
 * Open a link from an email as its reader would. A link that carries a token waits on a page of
 * its own (/auth/continue) until the button there is pressed, so the button is pressed.
 */
async function openLink(page, url) {
  await go(page, url);
  if (new URL(page.url()).pathname !== "/auth/continue") return;
  await Promise.all([page.waitForURL((to) => to.pathname !== "/auth/continue", { timeout: 20000 }).catch(() => {}), page.locator("main form button[type=submit]").click()]);
  await page.waitForLoadState("networkidle", { timeout: 2500 }).catch(() => {});
}
const said = async (page) => (await page.locator('main [role="alert"], main [role="status"]').allInnerTexts()).join(" | ");
const fill = async (page, fields) => {
  for (const [name, value] of Object.entries(fields)) await page.fill(`main [name="${name}"]`, value);
};
const press = (page, label) => page.locator("main").getByRole("button", { name: label, exact: true }).first().click();
/** A part of a page, by the heading that names it. */
const part = (page, id) => page.locator(`section[aria-labelledby="${id}"]`);
// The month it is in Mauritius, the ones after it, and a month in words.
const month = new Date(Date.now() + 4 * 3600e3).toISOString().slice(0, 7);
const monthAfter = (m, by = 1) => {
  const at = Number(m.slice(0, 4)) * 12 + Number(m.slice(5, 7)) - 1 + by;
  return `${Math.floor(at / 12)}-${String((at % 12) + 1).padStart(2, "0")}`;
};
const monthName = (m) => `${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;
const next = monthAfter(month);
/** Wait until the form's answer is on the page. */
const answered = (page) => page.waitForFunction(() => !document.querySelector("main button[disabled]"), null, { timeout: 15000 }).catch(() => {});

const OWNER = { name: "Faiz Owner", email: "owner@biznes.test", password: "first-password-1" };
const ALICE = { name: "Alice Lallah", email: "alice@biznes.test", password: "alice-password-1" };
const CAROL = { name: "Carol Customer", email: "carol@biznes.test", password: "carol-password-1" };

async function signIn(page, who, password = who.password) {
  await go(page, `${origin}/account/sign-in`);
  await fill(page, { email: who.email, password });
  await Promise.all([page.waitForURL((u) => !u.pathname.endsWith("/sign-in"), { timeout: 15000 }).catch(() => {}), press(page, "Sign in")]);
}

// ---------------------------------------------------------------------------------------------
// 1. A visitor who is not signed in.
const visitor = await person();
{
  const { page } = visitor;
  await go(page, origin);
  check("visitor: the header carries a person's icon that leads to signing in, by name", (await page.locator('header a[href="/account/sign-in"]').count()) === 1 && (await page.locator('header a[href="/account/sign-in"]').getAttribute("aria-label")) === "Sign in" && (await page.locator('header a[href="/account/sign-in"] svg').count()) === 1);
  await page.setViewportSize({ width: 390, height: 844 });
  check("visitor: and on a phone too", await page.locator('header a[href="/account/sign-in"]').isVisible());
  await page.setViewportSize({ width: 1440, height: 900 });
  check("visitor: no request was made to ask who is signed in", !(await page.context().cookies()).some((c) => c.name.startsWith("biznes-")));
  await go(page, `${origin}/account`);
  check("visitor: /account leads to the sign-in page, and remembers where to return", new URL(page.url()).pathname === "/account/sign-in" && new URL(page.url()).searchParams.get("next") === "/account");
  await go(page, `${origin}/admin`);
  check("visitor: /admin leads to the sign-in page", new URL(page.url()).pathname === "/account/sign-in");
  const csv = await page.request.get(`${origin}/admin/leads/export`);
  check("visitor: the leads file is not there for them", csv.status() === 404, csv.status());
  await go(page, `${origin}/account/sign-in?next=https://evil.example`);
  check("visitor: a return address on another site is dropped", (await page.inputValue('main input[name="next"]')) === "");
}

// ---------------------------------------------------------------------------------------------
// 2. Signing up: the form's errors, the email, the link, and the first person becoming superadmin.
const owner = await person();
{
  const { page } = owner;
  await go(page, `${origin}/account/sign-up`);
  await press(page, "Create an account");
  await page.waitForSelector('main [aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  const invalid = await page.locator('main [aria-invalid="true"]').count();
  const focused = await page.evaluate(() => document.activeElement?.getAttribute("name"));
  const described = await page.evaluate(() => {
    const el = document.querySelector('main [name="email"]');
    const id = el?.getAttribute("aria-describedby")?.split(" ").pop();
    return id ? document.getElementById(id)?.textContent : "";
  });
  check("sign up: an empty form marks three fields, in words, and moves to the first", invalid === 3 && focused === "name" && /email address/i.test(described ?? ""), `${invalid} invalid, focus on ${focused}, says "${described}"`);
  await audit(page, "sign-up-errors");

  await fill(page, { name: OWNER.name, email: "not-an-address", password: "short" });
  await press(page, "Create an account");
  await answered(page);
  await page.waitForSelector('main [name="email"][aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  check("sign up: what was typed is kept, but never the password", (await page.inputValue('main [name="name"]')) === OWNER.name && (await page.inputValue('main [name="email"]')) === "not-an-address" && (await page.inputValue('main [name="password"]')) === "");

  const before = mails();
  await fill(page, { name: OWNER.name, email: OWNER.email, password: OWNER.password });
  await press(page, "Create an account");
  await page.waitForSelector('main [role="status"]', { timeout: 20000 }).catch(() => {});
  check("sign up: says to check the email", /check your email/i.test(await said(page)), await said(page));
  check("sign up: nobody is signed in until the address is confirmed", !(await page.context().cookies()).some((c) => c.name === "biznes-in"));

  const link = await linkFor(OWNER.email, before);
  check("sign up: Auth sent an email with a link", Boolean(link), link);
  if (link) await go(page, link);
  check("confirm: the link lands on the account page, signed in", new URL(page.url()).pathname === "/account" && /owner@biznes\.test/.test(await page.locator("main").innerText()), page.url());
  check("confirm: the first person to sign up is the superadmin, welcomed by name with the role as a tag", sql(`select role from public.profiles where email = '${OWNER.email}'`) === "superadmin" && /Hello, Faiz/.test(await page.locator("main h1").innerText()) && /Superadmin/.test(await page.locator("main .tag").first().innerText()));
  const cookies = await page.context().cookies();
  const session = cookies.filter((c) => c.name === "biznes-auth" || c.name.startsWith("biznes-auth."));
  check("session: kept in cookies no script can read", session.length > 0 && session.every((c) => c.httpOnly && c.sameSite === "Lax"), JSON.stringify(session.map((c) => [c.name, c.httpOnly, c.sameSite])));
  check("session: the marker says only that someone is signed in", cookies.find((c) => c.name === "biznes-in")?.value === "1");
  await page.waitForSelector('header .nav-pill > a[href="/account"]', { timeout: 10000 }).catch(() => {});
  check("header: the initial, as a way to the account", (await page.locator('header .nav-pill > a[href="/account"]').innerText().catch(() => "")).trim() === "F");
  await page.setViewportSize({ width: 390, height: 844 });
  check("header: and on a phone too", await page.locator('header .nav-pill > a[href="/account"]').isVisible().catch(() => false));
  await page.setViewportSize({ width: 1440, height: 900 });
  check("account: a superadmin is shown the way to Admin", (await page.locator('main a[href="/admin"]').count()) === 1 && /Running the site/.test(await page.locator("main").innerText()));
  await audit(page, "account-superadmin");

  // The profile.
  await part(page, "details").locator('[name="name"]').fill("Faiz");
  await part(page, "details").locator('[name="phone"]').fill("12");
  await press(page, "Save");
  await page.waitForSelector('main [name="phone"][aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  check("profile: a wrong telephone number is said on its field", (await page.locator('main [name="phone"][aria-invalid="true"]').count()) === 1);
  await part(page, "details").locator('[name="phone"]').fill("+230 5450 8600");
  await press(page, "Save");
  await part(page, "details").locator('[role="status"]').waitFor({ timeout: 15000 }).catch(() => {});
  check("profile: saved", sql(`select name || '|' || phone from public.profiles where email = '${OWNER.email}'`) === "Faiz|+230 5450 8600", await said(page));

  // Out and in again.
  await Promise.all([page.waitForURL(`${origin}/`, { timeout: 15000 }).catch(() => {}), press(page, "Sign out")]);
  check("sign out: back on the first page, with the cookies gone", new URL(page.url()).pathname === "/" && !(await page.context().cookies()).some((c) => c.name.startsWith("biznes-") && c.value));
  await page.waitForSelector('header a[href="/account/sign-in"]', { timeout: 10000 }).catch(() => {});
  check("sign out: the header offers Sign in again", (await page.locator('header a[href="/account/sign-in"]').count()) === 1);
  await go(page, `${origin}/account/sign-in?next=/admin`);
  await fill(page, { email: OWNER.email, password: "the-wrong-password" });
  await press(page, "Sign in");
  await page.waitForSelector('main [role="alert"]', { timeout: 15000 }).catch(() => {});
  check("sign in: a wrong password is refused in plain words, and the address is kept", /do not match/i.test(await said(page)) && (await page.inputValue('main [name="email"]')) === OWNER.email, await said(page));
  await audit(page, "sign-in-refused");
  await fill(page, { password: OWNER.password });
  await Promise.all([page.waitForURL(`${origin}/admin`, { timeout: 15000 }).catch(() => {}), press(page, "Sign in")]);
  check("sign in: goes on to where it was asked to return", new URL(page.url()).pathname === "/admin", page.url());
}

// ---------------------------------------------------------------------------------------------
// 3. A second person: a regular user. Confirmed by the other kind of link, the one the README
//    asks the project's email templates to carry (token_hash), which works on any device.
const alice = await person();
{
  const { page } = alice;
  await go(page, `${origin}/account/sign-up?next=/dashboard/new`);
  await fill(page, { name: ALICE.name, email: ALICE.email, password: ALICE.password });
  await press(page, "Create an account");
  await page.waitForSelector('main [role="status"]', { timeout: 20000 }).catch(() => {});
  const hash = sql(`select confirmation_token from auth.users where email = '${ALICE.email}'`);
  const fresh = await person();
  // A mail program that opens every link before its reader does: it asks for the address, follows
  // where it leads, and presses nothing. The link must still work for the person afterwards.
  const scanned = await fetch(`${origin}/auth/confirm?token_hash=${hash}&type=email&next=/dashboard/new`, { redirect: "follow" });
  check("confirm: a link that is only opened waits on a page with a button, and is not used up", scanned.ok && new URL(scanned.url).pathname === "/auth/continue" && /Confirm and sign in/.test(await scanned.text()) && sql(`select (email_confirmed_at is null)::text from auth.users where email = '${ALICE.email}'`) === "true", scanned.url);
  await go(fresh.page, `${origin}/auth/confirm?token_hash=${hash}&type=email&next=/dashboard/new`);
  check("confirm: nobody is signed in until the button is pressed", new URL(fresh.page.url()).pathname === "/auth/continue" && !(await fresh.context.cookies()).some((c) => c.name === "biznes-in"), fresh.page.url());
  await audit(fresh.page, "confirm-continue");
  await openLink(fresh.page, `${origin}/auth/confirm?token_hash=${hash}&type=email&next=/dashboard/new`);
  check("confirm: a token_hash link works in a browser that never asked for it", new URL(fresh.page.url()).pathname === "/dashboard/new", fresh.page.url());
  await openLink(fresh.page, `${origin}/auth/confirm?token_hash=${hash}&type=email`);
  await fresh.context.close();
  const again = await person();
  await openLink(again.page, `${origin}/auth/confirm?token_hash=${hash}&type=email`);
  check("confirm: a link used twice is refused, with a way on", new URL(again.page.url()).pathname === "/account/sign-in" && /expired|already been used/i.test(await said(again.page)), again.page.url());
  await again.context.close();

  await signIn(page, ALICE);
  check("second person: a regular user", sql(`select role from public.profiles where email = '${ALICE.email}'`) === "user");
  const admin = await go(page, `${origin}/admin`);
  check("user: /admin is not there for them", admin?.status() === 404, admin?.status());
  const people = await go(page, `${origin}/admin/people`);
  check("user: /admin/people is not there for them", people?.status() === 404, people?.status());
  check("user: the leads file is not there for them", (await page.request.get(`${origin}/admin/leads/export`)).status() === 404);
}

// ---------------------------------------------------------------------------------------------
// 4. Alice claims a listing from the open index, and lists a business from scratch.
let claimedSlug = "";
let claimedId = "";
let scratch = "";
{
  const { page } = alice;
  await go(page, `${origin}/dashboard`);
  check("dashboard: empty, with the way to list a business", /nothing listed yet/i.test(await page.locator("main").innerText()));
  await audit(page, "dashboard-empty");
  await go(page, `${origin}/dashboard/new`);
  await page.fill("#find-name", "keiffel tours");
  await Promise.all([page.waitForURL(/find=/, { timeout: 15000 }), page.locator("main form[method=get] button").click()]);
  const mine = page.locator("main").getByRole("link", { name: /Claim this listing\s*:\s*Keiffel/i }).first();
  check("claim: the listing is found by name", (await mine.count()) === 1);
  await audit(page, "new-found");
  await Promise.all([page.waitForURL(/listing=/, { timeout: 15000 }), mine.click()]);
  claimedId = new URL(page.url()).searchParams.get("listing") ?? "";
  check("claim: the form is filled in from the listing", /keiffel/i.test(await page.inputValue('main [name="name"]')) && (await page.inputValue('main [name="category"]')) !== "" && (await page.inputValue('main [name="town"]')) !== "", `${await page.inputValue('main [name="category"]')} / ${await page.inputValue('main [name="town"]')}`);
  await audit(page, "new-claim");
  await fill(page, { about: "Day trips and airport transfers, run by the family since 1998.", phone: "+230 5777 1234" });
  await Promise.all([page.waitForURL(/\/dashboard\/[0-9a-f-]{36}/, { timeout: 15000 }).catch(() => {}), press(page, "Claim this listing")]);
  check("claim: sent, and waiting to be checked", /\/dashboard\/[0-9a-f-]{36}/.test(page.url()) && /waiting to be checked/i.test(await page.locator("main").innerText()) && /claim is with us/i.test(await said(page)), page.url());
  check("claim: in the database it is pending, free and unverified", sql(`select status || '|' || plan || '|' || verified || '|' || listing_id from public.businesses where listing_id = '${claimedId}'`) === `pending|free|false|${claimedId}`);
  claimedSlug = sql(`select slug from public.businesses where listing_id = '${claimedId}'`);
  check("claim: no plan can be asked for until it is live", /once the business is live/i.test(await page.locator("#plan").innerText()));
  await audit(page, "business-pending");

  const listing = await go(visitor.page, `${origin}/b/${claimedId}`);
  check("claim: until approved, the public page is unchanged and still offers the claim", listing?.status() === 200 && /Is this your business\?/.test(await visitor.page.locator("main").innerText()) && !/Claimed by its owner/.test(await visitor.page.locator("main").innerText()));

  // From scratch, by way of the plans page: the plan asked for goes in with the business.
  await go(page, `${origin}/pricing`);
  const grow = page.locator("main").getByRole("link", { name: /Ask for Biznes Grow/ });
  check("pricing: a plan's button leads to the dashboard", (await grow.getAttribute("href")) === "/dashboard/new?plan=grow");
  await Promise.all([page.waitForURL(/\/dashboard\/new\?plan=grow/, { timeout: 15000 }), grow.click()]);
  await press(page, "List your business");
  await page.waitForSelector('main [aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  check("list: an empty form names what is missing, on each field", (await page.locator('main [aria-invalid="true"]').count()) === 3 && (await page.evaluate(() => document.activeElement?.getAttribute("name"))) === "name");
  await audit(page, "new-errors");
  await fill(page, { name: "Zanzibar Hair Studio", address: "12 Royal Road", phone: "+230 5888 4321", website: "zanzibar-hair.mu", about: "Cuts, colour and braids in the middle of Curepipe." });
  await page.selectOption('main [name="category"]', "hairdressers");
  await page.selectOption('main [name="town"]', "curepipe");
  await Promise.all([page.waitForURL(/\/dashboard\/[0-9a-f-]{36}/, { timeout: 15000 }).catch(() => {}), press(page, "List your business")]);
  scratch = /\/dashboard\/([0-9a-f-]{36})/.exec(page.url())?.[1] ?? "";
  check("list: sent, and waiting to be checked", Boolean(scratch) && /waiting to be checked/i.test(await page.locator("main").innerText()), page.url());
  check("list: the web address was made whole", sql(`select website from public.businesses where id = '${scratch}'`) === "https://zanzibar-hair.mu/");
  check("list: the plan asked for on the way in went with it", sql(`select plan || '|' || status from public.plan_requests where business_id = '${scratch}'`) === "grow|open");
  const hidden = await go(visitor.page, `${origin}/biz/${sql(`select slug from public.businesses where id = '${scratch}'`)}`);
  check("list: a pending business has no public page", hidden?.status() === 404, hidden?.status());
  await go(visitor.page, `${origin}/search?q=zanzibar+hair`);
  check("list: and is not in the search", !/Zanzibar Hair Studio/.test(await visitor.page.locator("main").innerText()));
}

// ---------------------------------------------------------------------------------------------
// 5. The superadmin, as an admin: the queue, approving, the plan.
const scratchSlug = sql(`select slug from public.businesses where id = '${scratch}'`);
{
  const { page } = owner;
  await go(page, `${origin}/admin`);
  const main = await page.locator("main").innerText();
  check("admin: the queue holds both, with the owner to reach, and the counts stand as tiles", /Zanzibar Hair Studio/.test(main) && /A claim on the listing/.test(main) && main.includes(ALICE.email) && (await page.locator("main .stat").count()) === 4 && /2/.test(await page.locator("main .stat").first().innerText()));
  await audit(page, "admin-queue");
  const card = (name) => part(page, "queue").locator("article", { hasText: name });
  await card("Zanzibar Hair Studio").getByRole("button", { name: "Do not accept" }).click();
  await page.waitForSelector('main [name="note"][aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  check("admin: a rejection must say why", (await page.locator('main [name="note"][aria-invalid="true"]').count()) === 1);
  await card("Zanzibar Hair Studio").getByRole("button", { name: "Approve" }).click();
  await page.waitForFunction(() => !document.querySelector('section[aria-labelledby="queue"]')?.textContent?.includes("Zanzibar Hair Studio"), null, { timeout: 15000 }).catch(() => {});
  await card("Keiffel").getByRole("button", { name: "Approve" }).click();
  await page.waitForFunction(() => /No business is waiting/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("admin: both approved", sql(`select string_agg(status, ',') from public.businesses`) === "live,live", sql(`select string_agg(status, ',') from public.businesses`));

  // The public side, at once: the cached read was made fresh by the action.
  await go(visitor.page, `${origin}/b/${claimedId}`);
  const listing = await visitor.page.locator("main").innerText();
  check("public: the claimed listing says so quietly, with the owner's own details", /Claimed by its owner/.test(listing) && /run by the family since 1998/.test(listing) && /\+230 5777 1234/.test(listing) && !/Is this your business\?/.test(listing));
  check("public: a free listing never carries the vivid mark", !/Verified/.test(listing) && !/Priority/.test(listing));
  await audit(visitor.page, "listing-claimed");
  const biz = await go(visitor.page, `${origin}/biz/${scratchSlug}`);
  const bizText = await visitor.page.locator("main").innerText();
  check("public: the business listed from scratch has its own page", biz?.status() === 200 && /Zanzibar Hair Studio/.test(bizText) && /Listed by its owner/.test(bizText) && !/Verified/.test(bizText));
  check("public: on the free plan there is no booking form", (await visitor.page.locator('main [name="wanted"], main [name="date"]').count()) === 0);
  await audit(visitor.page, "biz-free");
  const again = await go(visitor.page, `${origin}/biz/${claimedSlug}`);
  check("public: a claimed listing has one page, the listing's own", again?.status() === 200 && new URL(visitor.page.url()).pathname.startsWith("/b/"), visitor.page.url());
  await go(visitor.page, `${origin}/search?q=hairdresser+in+curepipe`);
  const rows = await visitor.page.locator("#r-listings ~ ul h3").allInnerTexts();
  check("search: a free business listed by its owner is found, ranked like any other", rows.some((r) => /Zanzibar Hair Studio/.test(r)) && !rows.some((r) => /Priority/.test(r)), rows.slice(0, 6).join(" / "));

  // The plan: switch on what Alice asked for.
  await go(page, `${origin}/admin`);
  const request = part(page, "plans").locator("article", { hasText: "Zanzibar Hair Studio" });
  check("admin: the request for a plan is listed", (await request.count()) === 1 && /Biznes Grow/.test(await request.innerText()));
  await request.getByRole("button", { name: "Switch the plan on" }).click();
  await page.waitForFunction(() => /No request is open/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("admin: the plan is on, with its last day, and the business verified", /^grow\|true\|\d{4}-\d{2}-\d{2}$/.test(sql(`select plan || '|' || verified || '|' || plan_until from public.businesses where id = '${scratch}'`)), sql(`select plan || '|' || verified || '|' || plan_until from public.businesses where id = '${scratch}'`));
  check("admin: it is on the record under their name", sql(`select count(*) from public.audit_log a join public.profiles p on p.id = a.actor where p.email = '${OWNER.email}' and a.action in ('business.status', 'business.plan', 'plan_request.done')`) === "4");
  check("admin: the record is shown", /Zanzibar Hair Studio: Biznes Grow/.test(await part(page, "record").innerText()));

  await go(visitor.page, `${origin}/search?q=hairdresser+in+curepipe`);
  const first = await visitor.page.locator("#r-listings ~ ul h3").first().innerText();
  check("search: on a paid plan and verified, it is first, and marked Verified and Priority", /Zanzibar Hair Studio/.test(first) && /Verified/.test(first) && /Priority/.test(first), first);
  check("search: the page says what Priority means", /is on a paid plan and is shown first/.test(await visitor.page.locator("main").innerText()));
  await audit(visitor.page, "search-priority");
  await go(visitor.page, `${origin}/search?q=keiffel+tours`);
  const named = await visitor.page.locator("#r-listings ~ ul h3").first().innerText();
  check("search: a business asked for by name still comes first", /Keiffel/i.test(named), named);
}

// ---------------------------------------------------------------------------------------------
// 6. Biznes Grow: the parts of a business, what it sells, and a booking from a visitor.
{
  const { page } = alice;
  await go(page, `${origin}/dashboard/${scratch}`);
  const tabs = (await page.locator('nav[aria-label="The parts of this business"] a').allInnerTexts()).map((t) => t.trim());
  check("grow: the business has a bar of its parts, by its plan", ["Overview", "Bookings", "Customers", "Services", "Payments", "Its page", "Advertising"].every((t) => tabs.some((x) => x.startsWith(t))) && !tabs.includes("Menu"), tabs.join(" / "));
  check("grow: the overview sums it up in four tiles, the plan and its last day among them", (await page.locator("main .stat").count()) === 4 && /Biznes Grow/.test(await page.locator("main .stat").nth(1).innerText()) && /Paid until/.test(await page.locator("main .stat").nth(1).innerText()));
  await go(page, `${origin}/dashboard/${scratch}/services`);
  check("grow: with nothing to sell yet, the page says how to begin", /Nothing to sell yet/.test(await page.locator("main").innerText()));
  await audit(page, "services-empty");
  const add = page.locator("main .card", { hasText: "Add a service or a product" });
  await add.getByRole("button", { name: "Add this" }).click();
  await page.waitForSelector('main [name="name"][aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  await add.locator('[name="name"]').fill("Cut and blow dry");
  await add.locator('[name="price"]').fill("six hundred");
  await add.getByRole("button", { name: "Add this" }).click();
  await page.waitForSelector('main [name="price"][aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  check("grow: a price that is not a number is said on its field", (await add.locator('[name="price"][aria-invalid="true"]').count()) === 1);
  await add.locator('[name="price"]').fill("600");
  await add.locator('[name="minutes"]').fill("45");
  await add.getByRole("button", { name: "Add this" }).click();
  await page.waitForFunction(() => /Rs 600/.test(document.querySelector('section[aria-labelledby="services"] .rows')?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("grow: the service is added", sql(`select name || '|' || price_mur || '|' || minutes || '|' || active || '|' || kind from public.services where business_id = '${scratch}'`) === "Cut and blow dry|600|45|true|service");
  await add.locator("label.chip", { hasText: "A product" }).click();
  await add.locator('[name="name"]').fill("Argan oil shampoo");
  await add.locator('[name="price"]').fill("350");
  await add.locator('[name="stock"]').fill("12");
  await add.getByRole("button", { name: "Add this" }).click();
  await page.waitForFunction(() => /12 in stock/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("grow: a product is added, with how many are in stock and no length of time", sql(`select kind || '|' || stock || '|' || (minutes is null) from public.services where name = 'Argan oil shampoo'`) === "product|12|true");
  await audit(page, "services");
}
const tomorrow = new Date(Date.now() + 4 * 3600e3 + 2 * 864e5).toISOString().slice(0, 10);
{
  const { page } = visitor;
  // A page that is kept is made again on the first visit after a change, and that visit may still
  // be handed the copy from before. So the page is asked for again until it shows the change.
  let asked = 0;
  for (; asked < 8; asked++) {
    await go(page, `${origin}/biz/${scratchSlug}`);
    if (/Argan oil shampoo/.test(await page.locator("main").innerText())) break;
    await page.waitForTimeout(700);
  }
  check("public: what the business sells is on the page by the second visit at the latest", asked <= 1, `${asked + 1} visits`);
  const text = await page.locator("main").innerText();
  check("public: the page shows the mark, the service and its price, and the product apart", /Verified/.test(text) && /Priority listing/.test(text) && /Cut and blow dry/.test(text) && /Rs 600/.test(text) && /45 minutes/.test(text) && (await page.locator('section[aria-labelledby="products"]').innerText().catch(() => "")).includes("Argan oil shampoo"));
  check("public: a product is not offered for a booking", (await page.locator('main [name="service"] option').allInnerTexts()).join("|") === "Not sure yet|Cut and blow dry, Rs 600, 45 minutes", (await page.locator('main [name="service"] option').allInnerTexts()).join("|"));
  await press(page, "Ask for a booking");
  await page.waitForSelector('main [aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  check("booking: an empty request names what is missing", (await page.locator('main [aria-invalid="true"]').count()) === 4, await page.locator('main [aria-invalid="true"]').count());
  await fill(page, { date: "2020-01-01", time: "10:00", name: "Dev Ramdin", phone: "+230 5999 0001" });
  await press(page, "Ask for a booking");
  await page.waitForSelector('main [name="date"][aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  check("booking: a day that has passed is refused on its field", (await page.locator('main [name="date"][aria-invalid="true"]').count()) === 1 && (await page.inputValue('main [name="name"]')) === "Dev Ramdin");
  await audit(page, "biz-grow-booking-errors");
  await fill(page, { date: tomorrow, time: "14:30", note: "First visit." });
  await page.selectOption('main [name="service"]', { label: "Cut and blow dry, Rs 600, 45 minutes" });
  await press(page, "Ask for a booking");
  await page.waitForSelector('main form [role="status"]', { timeout: 15000 }).catch(() => {});
  check("booking: sent, and said to be a request the business must confirm", /not a booking until they confirm/i.test(await said(page)) && /pay the business directly/i.test(await said(page)), await said(page));
  check("booking: in the database as a request for that time in Mauritius, from nobody's account", sql(`select status || '|' || (wanted_at at time zone 'Indian/Mauritius')::text || '|' || (customer_id is null) from public.bookings where name = 'Dev Ramdin'`) === `requested|${tomorrow} 14:30:00|true`, sql(`select status || '|' || (wanted_at at time zone 'Indian/Mauritius')::text from public.bookings`));
}
// The same, signed in: it is kept with the account.
const carol = await person();
{
  const { page } = carol;
  await go(page, `${origin}/account/sign-up`);
  const before = mails();
  await fill(page, { name: CAROL.name, email: CAROL.email, password: CAROL.password });
  await press(page, "Create an account");
  await page.waitForSelector('main [role="status"]', { timeout: 20000 }).catch(() => {});
  const link = await linkFor(CAROL.email, before);
  if (link) await go(page, link);
  const account = await page.locator("main").innerText();
  check("account: someone new is welcomed by name, as a member, with where everything is", /Hello, Carol/.test(account) && /Member/.test(account) && /Where everything is/.test(account) && !/Running the site/.test(account) && (await page.locator('main a[href^="/admin"]').count()) === 0);
  await audit(page, "account-new");
  await go(page, `${origin}/biz/${scratchSlug}`);
  await fill(page, { date: tomorrow, time: "16:00", name: "Carol Customer", phone: "+230 5999 0002" });
  await press(page, "Ask for a booking");
  await page.waitForSelector('main form [role="status"]', { timeout: 15000 }).catch(() => {});
  check("booking: signed in, it is kept with the account", /kept in your account/i.test(await said(page)) && sql(`select (customer_id = (select id from public.profiles where email = '${CAROL.email}'))::text from public.bookings where name = 'Carol Customer'`) === "true", await said(page));
  await go(page, `${origin}/account`);
  check("account: the booking is listed, with the business's name", /Zanzibar Hair Studio/.test(await part(page, "bookings").innerText()) && /Requested/.test(await part(page, "bookings").innerText()));
  await audit(page, "account-bookings");
}
{
  const { page } = alice;
  await go(page, `${origin}/dashboard/${scratch}`);
  check("grow: the overview counts the requests that wait", /2/.test(await page.locator("main .stat", { hasText: "Bookings to answer" }).innerText()), await page.locator("main .stat", { hasText: "Bookings to answer" }).innerText());
  await audit(page, "business-overview");
  await go(page, `${origin}/dashboard/${scratch}/bookings`);
  const all = await page.locator("main").innerText();
  check("grow: the owner sees both requests, with the numbers to call", /Dev Ramdin/.test(all) && /Carol Customer/.test(all) && /\+230 5999 0001/.test(all) && /To answer, 2/i.test(all));
  await audit(page, "bookings");
  const booking = (name) => page.locator("main article", { hasText: name });
  await booking("Dev Ramdin").getByRole("button", { name: "Confirm" }).click();
  await page.waitForFunction(() => /Confirmed, 1/i.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("grow: a request is confirmed", sql(`select status from public.bookings where name = 'Dev Ramdin'`) === "confirmed");
  await booking("Dev Ramdin").locator("summary", { hasText: "Add a note" }).click();
  await booking("Dev Ramdin").locator('textarea[name="note"]').fill("Prefers Saturdays.");
  await booking("Dev Ramdin").getByRole("button", { name: "Save the note" }).click();
  await page.waitForFunction(() => /Your note: Prefers Saturdays/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("grow: a note on a booking is kept", sql(`select note from public.booking_notes`) === "Prefers Saturdays.");
  await booking("Dev Ramdin").getByRole("button", { name: "Mark as done" }).click();
  await page.waitForFunction(() => /Done, 1/i.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("grow: and marked done", sql(`select status from public.bookings where name = 'Dev Ramdin'`) === "done");
  await booking("Dev Ramdin").locator("summary", { hasText: "Mark as paid" }).click();
  check("grow: the amount is offered from the service's price", (await booking("Dev Ramdin").locator('[name="amount"]').inputValue()) === "600");
  await booking("Dev Ramdin").locator('select[name="method"]').selectOption("cash");
  await booking("Dev Ramdin").getByRole("button", { name: "Write it in the ledger" }).click();
  await page.waitForFunction(() => /Paid Rs 600, Cash/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("grow: a booking is marked paid, and written in the ledger", sql(`select amount_mur || '|' || method || '|' || payer || '|' || what from public.payments where booking_id is not null`) === "600|cash|Dev Ramdin|Cut and blow dry", sql(`select count(*) from public.payments`));
  await audit(page, "bookings-answered");
  await go(page, `${origin}/dashboard/${scratch}/bookings?day=${tomorrow}`);
  const thatDay = await page.locator("main").innerText();
  await go(page, `${origin}/dashboard/${scratch}/bookings?day=2031-01-01`);
  check("grow: bookings are narrowed to one day", /2 bookings for/.test(thatDay) && /Nothing booked for that day/.test(await page.locator("main").innerText()));
}
{
  const { page } = carol;
  await go(page, `${origin}/account`);
  await press(page, "Cancel this booking");
  await page.waitForFunction(() => /Cancelled/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("account: the customer cancels their own booking", sql(`select status from public.bookings where name = 'Carol Customer'`) === "cancelled");
  const peek = await go(page, `${origin}/dashboard/${scratch}`);
  const deeper = await go(page, `${origin}/dashboard/${scratch}/payments`);
  check("user: another owner's business is not there for them, nor any part of it", peek?.status() === 404 && deeper?.status() === 404, `${peek?.status()} ${deeper?.status()}`);
  check("user: nor are the owner's notes, customers or ledger, asked of the database as the customer", (await asPerson(page, "booking_notes?select=note")).length === 0 && (await asPerson(page, "payments?select=id")).length === 0);
}

// ---------------------------------------------------------------------------------------------
// 6b. How to pay by MCB Juice, the limit on requests from one number, and the honeypot.
{
  const { page } = alice;
  await go(page, `${origin}/dashboard/${scratch}/services`);
  const pay = part(page, "pay");
  await pay.locator('[name="juice_number"]').fill("1234");
  await pay.locator('[name="juice_name"]').fill("Zanzibar Hair Studio Ltd");
  await pay.getByRole("button", { name: "Save how you are paid" }).click();
  await page.waitForSelector('main [name="juice_number"][aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  check("pay: a number that is not a Mauritian mobile number is refused on its field", (await pay.locator('[name="juice_number"][aria-invalid="true"]').count()) === 1);
  await pay.locator('[name="juice_number"]').fill("+230 57770001");
  await pay.getByRole("button", { name: "Save how you are paid" }).click();
  await pay.locator('[role="status"]').waitFor({ timeout: 15000 }).catch(() => {});
  check("pay: saved, written as 5XXX XXXX", sql(`select juice_number || '|' || juice_name from public.pay_details where business_id = '${scratch}'`) === "5777 0001|Zanzibar Hair Studio Ltd", await said(page));
}
{
  const { page } = visitor;
  await go(page, `${origin}/biz/${scratchSlug}`);
  const text = await page.locator("main").innerText();
  check("public: the page says how to pay by MCB Juice, and that the site takes no part", /Pay by MCB Juice to 5777 0001, in the name of Zanzibar Hair Studio Ltd/.test(text) && /takes no part in the payment/.test(text));
  await audit(page, "biz-grow");
  const ask = async (time, phone = "+230 5999 0001") => {
    await fill(page, { date: tomorrow, time, name: "Dev Ramdin", phone });
    await press(page, "Ask for a booking");
    await page.waitForFunction(() => document.querySelector('main form [role="status"], main form [role="alert"]') && !document.querySelector("main form button[disabled]"), null, { timeout: 15000 }).catch(() => {});
    return (await page.locator('main form [role="status"], main form [role="alert"]').allInnerTexts()).join(" ");
  };
  const second = await ask("09:00");
  check("booking: the answer says how to pay by MCB Juice", /Pay by MCB Juice to 5777 0001, in the name of Zanzibar Hair Studio Ltd/.test(second), second);
  await ask("10:00");
  const fourth = await ask("11:00");
  check("booking: a fourth request in an hour from one number is refused by the database, in plain words", /already come from this number/i.test(fourth) && sql(`select count(*) from public.bookings where phone_key = '23059990001'`) === "3", fourth);
  await go(page, `${origin}/biz/${scratchSlug}`);
  await page.evaluate(() => (document.querySelector('main form input[name="website"]').value = "http://spam.example"));
  const trapped = await ask("12:00", "+230 5999 0009");
  check("booking: a filled honeypot is told it worked, and nothing is kept", /has been sent/i.test(trapped) && sql(`select count(*) from public.bookings where phone_key = '23059990009'`) === "0", trapped);
}

// ---------------------------------------------------------------------------------------------
// 6c. The owner's own records: customers, and a ledger of payments kept by hand.
{
  const { page } = alice;
  await go(page, `${origin}/dashboard/${scratch}/customers`);
  let text = await page.locator("main").innerText();
  check("customers: everyone who has booked is listed by their number, with how often", /Dev Ramdin/.test(text) && /3 bookings, 1 done/.test(text) && /Carol Customer/.test(text) && /From a booking/.test(text), text.slice(0, 400));
  const add = page.locator("main .card", { hasText: "Add a customer" });
  await add.locator('[name="name"]').fill("Mrs Bibi Joomun");
  await add.locator('[name="phone"]').fill("12");
  await add.getByRole("button", { name: "Add this customer" }).click();
  await page.waitForSelector('main [name="phone"][aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  check("customers: a wrong number is said on its field", (await add.locator('[name="phone"][aria-invalid="true"]').count()) === 1);
  await add.locator('[name="phone"]').fill("+230 5999 0007");
  await add.locator('[name="notes"]').fill("Colour every six weeks.");
  await add.getByRole("button", { name: "Add this customer" }).click();
  await page.waitForFunction(() => /Colour every six weeks/.test(document.querySelector('section[aria-labelledby="customers"]')?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("customers: one is added by hand, with a note", sql(`select name || '|' || phone_key || '|' || notes from public.customers`) === "Mrs Bibi Joomun|23059990007|Colour every six weeks.", sql(`select name || '|' || phone_key from public.customers`));
  const dev = page.locator("main article", { hasText: "Dev Ramdin" });
  await dev.locator("summary").click();
  await dev.locator('textarea[name="notes"]').fill("Books for the whole family.");
  await dev.getByRole("button", { name: "Keep this customer" }).click();
  await page.waitForFunction(() => /Books for the whole family/.test(document.querySelector('section[aria-labelledby="customers"] .rows')?.textContent ?? "") && !/From a booking[\s\S]*Dev Ramdin/.test(""), null, { timeout: 15000 }).catch(() => {});
  await go(page, `${origin}/dashboard/${scratch}/customers`);
  text = await dev.innerText();
  check("customers: someone who booked is kept on the list, and their bookings stay counted with them", sql(`select count(*) from public.customers where phone_key = '23059990001'`) === "1" && /3 bookings, 1 done/.test(text) && /Books for the whole family/.test(text) && !/From a booking/.test(text), text);
  await audit(page, "customers");

  await go(page, `${origin}/dashboard/${scratch}/payments`);
  text = await page.locator("main").innerText();
  check("payments: the ledger holds the booking marked paid, and adds the month up", /Rs 600/.test(await page.locator("main .stat").first().innerText()) && /A booking/.test(await page.locator("main table").innerText()) && /takes no payment/.test(text));
  const write = page.locator("main .card", { hasText: "Write down a payment" });
  await write.getByRole("button", { name: "Write it in the ledger" }).click();
  await page.waitForSelector('main [name="amount"][aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  check("payments: a payment needs its amount", (await write.locator('[name="amount"][aria-invalid="true"]').count()) === 1);
  await write.locator('[name="amount"]').fill("350");
  await write.locator('[name="payer"]').fill("Mrs Bibi Joomun");
  await write.locator('[name="what"]').fill("Argan oil shampoo");
  await write.locator('select[name="customer"]').selectOption({ label: "Mrs Bibi Joomun" });
  await write.getByRole("button", { name: "Write it in the ledger" }).click();
  await page.waitForFunction(() => /Rs 950/.test(document.querySelector("main .stat")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("payments: one written by hand is added, by MCB Juice, to a customer, and the month's total with it", sql(`select sum(amount_mur) || '|' || count(*) || '|' || string_agg(method, ',' order by amount_mur) || '|' || count(customer_id) from public.payments`) === "950|2|juice,cash|1" && /2 payments/.test(await page.locator("main .stat").first().innerText()), sql(`select sum(amount_mur) || '|' || count(*) from public.payments`));
  await audit(page, "payments");
  await page.locator("main table tbody tr", { hasText: "Argan oil shampoo" }).getByRole("button", { name: /Remove/ }).click();
  await page.waitForFunction(() => /Rs 600/.test(document.querySelector("main .stat")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("payments: a line is taken out of the ledger", sql(`select count(*) from public.payments`) === "1");
  await go(page, `${origin}/dashboard/${scratch}`);
  check("grow: the overview shows the month's payments", /Rs 600/.test(await page.locator("main .stat", { hasText: "Paid this month" }).innerText()));
  check("admin: the owner's customers, notes and ledger are not an admin's to read", (await asPerson(owner.page, "customers?select=id")).length === 0 && (await asPerson(owner.page, "payments?select=id")).length === 0 && (await asPerson(owner.page, "booking_notes?select=note")).length === 0);
}

// ---------------------------------------------------------------------------------------------
// 6d. A paid plan's page: a line, opening hours, a cover and photographs, uploaded by the owner.
{
  const { page } = alice;
  await go(page, `${origin}/dashboard/${scratch}/showcase`);
  check("its page: nothing from here is on the page yet, and the page says so", /On your page now: nothing from here yet/.test(await page.locator("main").innerText()));
  await audit(page, "showcase-empty");
  const words = part(page, "words");
  await words.locator('[name="tagline"]').fill("Braids, colour and care in the heart of Curepipe.");
  await words.locator('[name="hours"]').fill("Monday to Friday, 9 am to 6 pm\nSaturday, 9 am to 2 pm\n\nSunday, closed");
  await words.getByRole("button", { name: "Save your words" }).click();
  await words.locator('[role="status"]').waitFor({ timeout: 15000 }).catch(() => {});
  check("its page: a line and the opening hours are saved, a line a day", sql(`select tagline || '|' || cardinality(hours) || '|' || hours[3] from public.showcases where business_id = '${scratch}'`) === "Braids, colour and care in the heart of Curepipe.|3|Sunday, closed");

  const cover = part(page, "cover");
  await cover.locator('input[type="file"]').setInputFiles(PICTURES.notOne);
  await Promise.all([page.waitForURL(/problem=kind/, { timeout: 20000 }).catch(() => {}), cover.locator('button[type="submit"]', { hasText: "cover" }).click()]);
  check("pictures: a file that is not a picture is refused in words, on its field, and nothing is kept", /not a JPEG, a PNG or a WebP/.test(await part(page, "cover").innerText()) && sql(`select count(*) from storage.objects`) === "0", page.url());
  await part(page, "cover").locator('input[type="file"]').setInputFiles(PICTURES.cover);
  await Promise.all([page.waitForURL(/said=cover/, { timeout: 20000 }).catch(() => {}), part(page, "cover").locator('button[type="submit"]', { hasText: "cover" }).click()]);
  check("pictures: a cover is uploaded as the owner, into the business's own folder", sql(`select (cover ~ '^business/${scratch}/cover-[a-z0-9]+[.]png$')::text from public.showcases where business_id = '${scratch}'`) === "true" && sql(`select count(*) from storage.objects where bucket_id = 'media' and name like 'business/${scratch}/%'`) === "1", page.url());
  const coverSrc = await part(page, "cover").locator("img").getAttribute("src");
  const fetched = coverSrc ? await fetch(coverSrc) : undefined;
  check("pictures: anyone can fetch it from the bucket", fetched?.status === 200 && /image\/png/.test(fetched.headers.get("content-type") ?? ""), `${coverSrc} ${fetched?.status}`);
  const photos = () => part(page, "photo");
  for (const [i, file] of [PICTURES.photo, PICTURES.other].entries()) {
    await photos().locator('input[type="file"]').setInputFiles(file);
    await photos().locator('button[type="submit"]', { hasText: "Add this photograph" }).click();
    await page.waitForFunction((n) => document.querySelectorAll('section[aria-labelledby="photo"] img.thumb').length === n, i + 1, { timeout: 20000 }).catch(() => {});
  }
  const before = sql(`select array_to_string(photos, ',') from public.showcases where business_id = '${scratch}'`).split(",");
  check("pictures: two photographs are added, in the order they came", before.length === 2 && before.every((p) => p.startsWith(`business/${scratch}/photo-`)), before.join(","));
  await photos().getByRole("button", { name: /Put first/ }).click();
  await page.waitForFunction((first) => document.querySelector('section[aria-labelledby="photo"] img.thumb')?.getAttribute("src")?.endsWith(first), before[1], { timeout: 15000 }).catch(() => {});
  check("pictures: a photograph is put first", sql(`select array_to_string(photos, ',') from public.showcases where business_id = '${scratch}'`) === `${before[1]},${before[0]}`);
  await go(page, `${origin}/dashboard/${scratch}/showcase`);
  check("its page: what a visitor is given, read as a visitor, is said to the owner", /On your page now: your line, your opening hours, a cover, 2 photographs/.test(await page.locator("main").innerText()), await page.locator('[data-seen="showcase"]').innerText().catch(() => ""));
  await audit(page, "showcase");
  const seen = await asVisitor(`showcases?select=tagline,photos&business_id=eq.${scratch}`);
  check("public: a visitor is given the showcase of a live business on a paid plan", seen.length === 1 && seen[0].photos.length === 2, JSON.stringify(seen).slice(0, 200));
  const sneak = await carol.page.request.post(`${origin}/dashboard/${scratch}/showcase/upload`, { headers: { origin }, multipart: { kind: "photo", file: { name: "p.png", mimeType: "image/png", buffer: readFileSync(PICTURES.photo) } }, maxRedirects: 0 });
  check("pictures: someone else's upload to the business is refused by the bucket", /problem=refused/.test(sneak.headers().location ?? "") && sql(`select count(*) from storage.objects where bucket_id = 'media'`) === "3", `${sneak.status()} ${sneak.headers().location}`);
  const elsewhere = await page.request.post(`${origin}/dashboard/${scratch}/showcase/upload`, { headers: { origin: "https://evil.example" }, multipart: { kind: "photo", file: { name: "p.png", mimeType: "image/png", buffer: readFileSync(PICTURES.photo) } }, maxRedirects: 0 });
  check("pictures: a form posted from another site is refused", /problem=origin/.test(elsewhere.headers().location ?? ""), `${elsewhere.status()} ${elsewhere.headers().location}`);
}

// ---------------------------------------------------------------------------------------------
// 6e. Asking for a plan from the dashboard: taken back, declined, asked again, switched on.
const claimedBiz = sql(`select id from public.businesses where listing_id = '${claimedId}'`);
{
  const { page } = alice;
  await go(page, `${origin}/dashboard`);
  const row = page.locator("main article", { hasText: /Keiffel/i });
  check("dashboard: each business is a card with its plan, where it stands and the next thing to do", (await page.locator("main article").count()) === 2 && /Claimed by its owner/.test(await row.innerText()) && /Biznes Free/.test(await row.innerText()) && /See the plans/.test(await row.innerText()) && /Biznes Grow, to/.test(await page.locator("main article", { hasText: "Zanzibar" }).innerText()), await row.innerText());
  await audit(page, "dashboard");
  const free = await go(page, `${origin}/dashboard/${claimedBiz}/showcase`);
  const freeTabs = (await page.goto(`${origin}/dashboard/${claimedBiz}`).then(() => page.locator('nav[aria-label="The parts of this business"] a').allInnerTexts())).map((t) => t.trim());
  check("free: a business on the free plan has no page to dress, no bookings and no ledger", free?.status() === 404 && freeTabs.join("|") === "Overview|Advertising", freeTabs.join("|"));
  const askFor = async () => {
    await go(page, `${origin}/dashboard/${claimedBiz}`);
    await page.locator("#plan label", { hasText: "Biznes Go" }).click();
    await page.locator('#plan [name="note"]').fill("Call after five.");
    await page.locator("#plan").getByRole("button", { name: "Ask for this plan" }).click();
    await page.waitForFunction(() => /You asked for Biznes Go/.test(document.querySelector("#plan")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  };
  await askFor();
  check("plan: asked for, and told payment is arranged by hand for now", sql(`select plan || '|' || status || '|' || note from public.plan_requests where business_id = '${claimedBiz}'`) === "go|open|Call after five." && /We will contact you to arrange payment/.test(await page.locator("#plan").innerText()));
  await page.locator("#plan").getByRole("button", { name: "Take the request back" }).click();
  await page.waitForFunction(() => !/You asked for Biznes Go/.test(document.querySelector("#plan")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("plan: the request is taken back", sql(`select count(*) from public.plan_requests where business_id = '${claimedBiz}'`) === "0");
  await askFor();

  const admin = owner.page;
  const answer = async (button) => {
    await go(admin, `${origin}/admin`);
    await part(admin, "plans").locator("article", { hasText: /Keiffel/i }).getByRole("button", { name: button }).click();
    await admin.waitForFunction(() => /No request is open/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  };
  await answer("Decline");
  await go(page, `${origin}/dashboard/${claimedBiz}`);
  check("plan: declined, and the owner is told and may ask again", sql(`select status from public.plan_requests where business_id = '${claimedBiz}'`) === "declined" && /was not taken up/.test(await page.locator("#plan").innerText()));
  await audit(page, "business-live-free");
  await askFor();
  await answer("Switch the plan on");
  await go(visitor.page, `${origin}/b/${claimedId}`);
  let listing = await visitor.page.locator("main").innerText();
  check("public: a claimed listing on Go, verified, carries the vivid mark and says it is shown first", /Verified/.test(listing) && /Priority listing/.test(listing) && !/Claimed by its owner/.test(listing));

  const row2 = async () => {
    await go(admin, `${origin}/admin?q=keiffel`);
    const found = part(admin, "every").locator("details", { hasText: /Keiffel/i });
    await found.locator("summary").click();
    return found;
  };
  await (await row2()).getByRole("button", { name: "Take the verified mark off" }).click();
  await admin.waitForFunction(() => /Mark verified/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  await go(visitor.page, `${origin}/b/${claimedId}`);
  listing = await visitor.page.locator("main").innerText();
  check("public: with the verified mark taken off, the vivid mark and the priority go, whatever the plan", sql(`select plan || '|' || verified from public.businesses where id = '${claimedBiz}'`) === "go|false" && !/Priority listing/.test(listing) && /Claimed by its owner/.test(listing));
  const found = await row2();
  await found.locator('select[name="plan"]').selectOption("free");
  await found.getByRole("button", { name: "Set the plan" }).click();
  await admin.waitForFunction(() => /Back on Biznes Free/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("admin: sets a plan by hand", sql(`select plan || '|' || (plan_until is null) from public.businesses where id = '${claimedBiz}'`) === "free|true");

  // On a paid plan, the owner asks to stop at the end of the period: the plan keeps its last day.
  const until = sql(`select plan_until from public.businesses where id = '${scratch}'`);
  await go(page, `${origin}/dashboard/${scratch}`);
  await page.locator("#plan label", { hasText: "Stop at the end of the period" }).click();
  await page.locator("#plan").getByRole("button", { name: "Ask for this change" }).click();
  await page.waitForFunction(() => /You asked to stop at the end of the period/.test(document.querySelector("#plan")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("plan: an owner on a paid plan asks to stop at the end of the period", sql(`select plan || '|' || status from public.plan_requests where business_id = '${scratch}' and status = 'open'`) === "free|open");
  await audit(page, "business-plan-stop");
  await go(admin, `${origin}/admin`);
  const stop = part(admin, "plans").locator("article", { hasText: "Zanzibar Hair Studio" });
  check("admin: a request to stop is shown as one, with the plan's last day", /Stop the plan/.test(await stop.innerText()) && (await stop.locator('[name="until"]').inputValue()) === until, await stop.innerText());
  await audit(admin, "admin-requests");
  await stop.getByRole("button", { name: "Confirm the stop" }).click();
  await admin.waitForFunction(() => /No request is open/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("admin: confirmed, the plan runs to its last day and nothing else changes", sql(`select plan || '|' || plan_until || '|' || verified from public.businesses where id = '${scratch}'`) === `grow|${until}|true` && sql(`select status from public.plan_requests where business_id = '${scratch}' and plan = 'free'`) === "done");
  await go(page, `${origin}/account`);
  const plans = await part(page, "plans").innerText();
  check("account: Your plans lists every business with its plan and the day it runs to", /Zanzibar Hair Studio/.test(plans) && /Biznes Grow/.test(plans) && /Runs to/.test(plans) && /Keiffel/i.test(plans) && /Free for good/.test(plans), plans);
  await audit(page, "account-owner");
}

// ---------------------------------------------------------------------------------------------
// 6f. A business that is not accepted, sent back, and then taken out by its owner.
{
  const { page } = carol;
  await go(page, `${origin}/dashboard/new`);
  await fill(page, { name: "Carol Cakes" });
  await page.selectOption('main [name="category"]', "bakeries");
  await page.selectOption('main [name="town"]', "curepipe");
  await Promise.all([page.waitForURL(/\/dashboard\/[0-9a-f-]{36}/, { timeout: 15000 }).catch(() => {}), press(page, "List your business")]);
  const cakes = /\/dashboard\/([0-9a-f-]{36})/.exec(page.url())?.[1] ?? "";
  const admin = owner.page;
  await go(admin, `${origin}/admin`);
  const card = part(admin, "queue").locator("article", { hasText: "Carol Cakes" });
  await card.locator('[name="note"]').fill("Tell us the street it is on.");
  await card.getByRole("button", { name: "Do not accept" }).click();
  await admin.waitForFunction(() => /No business is waiting/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  await go(page, `${origin}/dashboard`);
  check("dashboard: a business that is not accepted says what to do next", /Change its details/.test(await page.locator("main article", { hasText: "Carol Cakes" }).innerText()));
  await go(page, `${origin}/dashboard/${cakes}`);
  check("owner: a business that is not accepted says why", sql(`select status from public.businesses where id = '${cakes}'`) === "rejected" && /Not accepted/.test(await page.locator("main").innerText()) && /Tell us the street it is on/.test(await page.locator("main").innerText()));
  await fill(page, { address: "5 Mango Lane" });
  await press(page, "Save the details");
  await page.waitForFunction(() => /sent back to us/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("owner: saving it sends it back to be checked again", sql(`select status || '|' || status_note || '|' || address from public.businesses where id = '${cakes}'`) === "pending||5 Mango Lane");

  // A food outlet on Biznes Go keeps a menu. The admin approves it and switches the plan on by hand.
  await go(admin, `${origin}/admin`);
  await part(admin, "queue").locator("article", { hasText: "Carol Cakes" }).getByRole("button", { name: "Approve" }).click();
  await admin.waitForFunction(() => /No business is waiting/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  await go(page, `${origin}/dashboard/${cakes}`);
  const noMenu = (await page.locator('nav[aria-label="The parts of this business"] a').allInnerTexts()).map((t) => t.trim());
  const early = await go(page, `${origin}/dashboard/${cakes}/menu`);
  check("menu: a food outlet on the free plan has none", !noMenu.includes("Menu") && early?.status() === 404, noMenu.join("|"));
  await go(admin, `${origin}/admin?q=cakes`);
  const found = part(admin, "every").locator("details", { hasText: "Carol Cakes" });
  await found.locator("summary").click();
  await found.locator('select[name="plan"]').selectOption("go");
  await found.getByRole("button", { name: "Set the plan" }).click();
  await admin.waitForFunction(() => /The plan is on/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  await go(page, `${origin}/dashboard/${cakes}`);
  const goTabs = (await page.locator('nav[aria-label="The parts of this business"] a').allInnerTexts()).map((t) => t.trim());
  check("menu: on Biznes Go a food outlet has its page and a menu, and still no bookings", goTabs.join("|") === "Overview|Its page|Menu|Advertising", goTabs.join("|"));
  const notFood = await go(alice.page, `${origin}/dashboard/${scratch}/menu`);
  check("menu: a business that is not a food outlet has none, whatever its plan", notFood?.status() === 404, notFood?.status());
  await go(page, `${origin}/dashboard/${cakes}/menu`);
  check("menu: empty, it says how to begin", /No menu yet/.test(await page.locator("main").innerText()));
  await audit(page, "menu-empty");
  const addSection = async (title) => {
    const card = page.locator("main .card", { hasText: "Add a section" });
    await card.locator('[name="title"]').fill(title);
    await card.getByRole("button", { name: "Add this section" }).click();
    await page.waitForFunction((t) => [...document.querySelectorAll("main section h3")].some((h) => h.textContent?.trim() === t), title, { timeout: 15000 }).catch(() => {});
  };
  const section = (title) => page.locator("main section.card", { has: page.locator("h3", { hasText: title }) });
  const addItem = async (title, name, price, description = "") => {
    const card = section(title);
    const form = card.locator("details", { hasText: `Add an item to ${title}` });
    if (!(await form.getAttribute("open").then((v) => v !== null))) await form.locator("summary").click();
    await form.locator('[name="name"]').fill(name);
    await form.locator('[name="price"]').fill(price);
    await form.locator('[name="description"]').fill(description);
    await form.getByRole("button", { name: "Add this item" }).click();
    await page.waitForFunction((n) => [...document.querySelectorAll("main section.card .rows .title-1")].some((p) => p.textContent?.trim() === n), name, { timeout: 15000 }).catch(() => {});
  };
  await addSection("Cakes");
  await addSection("Drinks");
  await addItem("Cakes", "Napolitaine", "25", "Shortbread, jam and pink icing.");
  await addItem("Cakes", "Gateau patate", "20");
  const drinks = section("Drinks").locator("details", { hasText: "Add an item to Drinks" });
  await drinks.locator('[name="name"]').fill("Alouda");
  await drinks.locator('[name="price"]').fill("sixty");
  await drinks.getByRole("button", { name: "Add this item" }).click();
  await page.waitForSelector('main [name="price"][aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  check("menu: a price that is not a number is said on its field", (await section("Drinks").locator('[name="price"][aria-invalid="true"]').count()) === 1);
  await addItem("Drinks", "Alouda", "60");
  const menu = () => sql(`select string_agg(s.title || ':' || coalesce((select string_agg(i.name || '=' || coalesce(i.price_mur::text, ''), ',' order by i.position) from public.menu_items i where i.section_id = s.id), ''), ' / ' order by s.position) from public.menu_sections s where s.business_id = '${cakes}'`);
  check("menu: sections and items are kept in the order given, with their prices", menu() === "Cakes:Napolitaine=25,Gateau patate=20 / Drinks:Alouda=60", menu());
  await section("Drinks").getByRole("button", { name: /^Up/ }).first().click();
  await page.waitForFunction(() => document.querySelector("main section.card h3")?.textContent?.trim() === "Drinks", null, { timeout: 15000 }).catch(() => {});
  const item = section("Cakes").locator("li.row", { hasText: "Gateau patate" });
  await item.locator("summary").click();
  await item.getByRole("button", { name: /^Up/ }).click();
  await page.waitForFunction(() => /Gateau patate[\s\S]*Napolitaine/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("menu: a section and an item are moved up", menu() === "Drinks:Alouda=60 / Cakes:Gateau patate=20,Napolitaine=25", menu());
  await go(page, `${origin}/dashboard/${cakes}/menu`);
  check("menu: what a visitor is given, read as a visitor, is said to the owner", /On your page now: 2 sections, 3 items/.test(await page.locator("main").innerText()), await page.locator('[data-seen="menu"]').innerText().catch(() => ""));
  await audit(page, "menu");
  const seen = await asVisitor(`menu_items?select=name,price_mur&business_id=eq.${cakes}&order=name`);
  check("public: a visitor is given the menu of a live food outlet on a paid plan", seen.length === 3 && seen[0].name === "Alouda" && seen[0].price_mur === 60, JSON.stringify(seen).slice(0, 200));
  // Pictures to go with the business when it is taken out: a cover on its page, and two
  // advertisements with a picture each, one waiting to be checked and one already approved.
  await go(page, `${origin}/dashboard/${cakes}/showcase`);
  await part(page, "cover").locator('input[type="file"]').setInputFiles(PICTURES.mislabelled);
  await Promise.all([page.waitForURL(/said=cover/, { timeout: 20000 }).catch(() => {}), part(page, "cover").locator('button[type="submit"]', { hasText: "cover" }).click()]);
  for (const headline of ["Cakes to order", "Napolitaines by the dozen"]) {
    await go(page, `${origin}/dashboard/${cakes}/ads`);
    const draft = part(page, "new-ad");
    await draft.locator('[name="headline"]').fill(headline);
    await draft.locator('[name="place"]').selectOption("food");
    await draft.locator("label.chip", { hasText: monthName(monthAfter(month, 2)) }).click();
    await draft.getByRole("button", { name: "Draft this advertisement" }).click();
    await page.waitForFunction((h) => [...document.querySelectorAll('main li[id^="ad-"]')].some((li) => li.textContent?.includes(h)), headline, { timeout: 15000 }).catch(() => {});
    const id = sql(`select id from public.ads where headline = '${headline}'`);
    await page.locator(`#ad-${id}`).locator('input[type="file"]').setInputFiles(PICTURES.art);
    await Promise.all([page.waitForURL(new RegExp(`said=picture&at=${id}`), { timeout: 20000 }).catch(() => {}), page.locator(`#ad-${id}`).locator('button[type="submit"]', { hasText: "Add this picture" }).click()]);
    await page.locator(`#ad-${id}`).getByRole("button", { name: "Send it in" }).click();
    await page.waitForFunction((id) => /With us to check/.test(document.getElementById(`ad-${id}`)?.textContent ?? ""), id, { timeout: 15000 }).catch(() => {});
  }
  const cakeAds = sql(`select string_agg(id::text, ',' order by headline) from public.ads where business_id = '${cakes}'`).split(",");
  // The second is approved, as an admin would: its picture is then not its owner's to touch.
  sql(`update public.ads set status = 'approved' where id = '${cakeAds[1]}'`);
  check("pictures: the business to be taken out has a cover and two advertisements with a picture each", kept(`business/${cakes}`) === 1 && kept(`ads/${cakeAds[0]}`) === 1 && kept(`ads/${cakeAds[1]}`) === 1 && sql(`select string_agg(status, ',' order by headline) from public.ads where business_id = '${cakes}'`) === "submitted,approved", `${kept(`business/${cakes}`)} ${kept(`ads/${cakeAds[0]}`)} ${kept(`ads/${cakeAds[1]}`)}`);
  check("pictures: a PNG sent as a JPEG is kept as a PNG, by name and by the kind Storage records", sql(`select (name ~ '[.]png$')::text || ',' || (metadata ->> 'mimetype') from storage.objects where bucket_id = 'media' and name like 'business/${cakes}/%'`) === "true,image/png", sql(`select name || ' ' || (metadata ->> 'mimetype') from storage.objects where bucket_id = 'media' and name like 'business/${cakes}/%'`));
  check("pictures: each file says who uploaded it, which is what the limits count by", sql(`select count(*) from storage.objects where bucket_id = 'media' and name like 'ads/${cakeAds[1]}/%' and owner_id = (select id::text from public.profiles where email = '${CAROL.email}')`) === "1");

  sql(`update public.businesses set plan_until = current_date - 1 where id = '${cakes}'`);
  const lapsed = await asVisitor(`menu_items?select=name&business_id=eq.${cakes}`);
  const closed = await go(page, `${origin}/dashboard/${cakes}/menu`);
  check("menu: once the plan has run out, visitors are given no menu and the owner's page for it is gone", lapsed.length === 0 && closed?.status() === 404, `${lapsed.length} ${closed?.status()}`);

  await go(page, `${origin}/dashboard/${cakes}`);
  await page.locator("main summary", { hasText: "Remove this business" }).click();
  await press(page, "Remove it for good");
  await page.waitForSelector('main [name="sure"][aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  check("owner: removing a business asks them to be sure", (await page.locator('main [name="sure"][aria-invalid="true"]').count()) === 1 && sql(`select count(*) from public.businesses where id = '${cakes}'`) === "1");
  await page.locator('main [name="sure"]').check();
  await Promise.all([page.waitForURL(/\/dashboard\?said=removed/, { timeout: 15000 }).catch(() => {}), press(page, "Remove it for good")]);
  check("owner: and then takes it out for good, with its menu", sql(`select count(*) from public.businesses where id = '${cakes}'`) === "0" && sql(`select count(*) from public.menu_items`) === "0" && /has been taken out/.test(await said(page)), page.url());
  check("pictures: its pictures went with it: the cover, the picture of the advertisement that was waiting, and the approved one's once its row was gone", kept(`business/${cakes}`) === 0 && kept(`ads/${cakeAds[0]}`) === 0 && kept(`ads/${cakeAds[1]}`) === 0 && sql(`select count(*) from public.ads where business_id = '${cakes}'`) === "0", `${kept(`business/${cakes}`)} ${kept(`ads/${cakeAds[0]}`)} ${kept(`ads/${cakeAds[1]}`)}`);
}

// ---------------------------------------------------------------------------------------------
// 6g. An advertisement: drafted by the owner, checked by an admin, paid, and shown in its place.
let adId = "";
{
  const { page } = alice;
  const admin = owner.page;
  await go(page, `${origin}/dashboard/${scratch}/ads`);
  const empty = await page.locator("main").innerText();
  check("ads: empty, the page says how to begin, with each place and what it costs", /No advertisements yet/.test(empty) && /Rs 500 a month/.test(empty) && /Rs 4,000 a month/.test(empty) && /Price on request/.test(empty) && /four at most/.test(empty));
  check("ads: only months to come are offered, never the one that has begun", (await page.locator('section[aria-labelledby="new-ad"] fieldset', { hasText: "The months it runs" }).locator("label.chip").allInnerTexts()).map((t) => t.trim()).join("|") === [1, 2, 3, 4, 5, 6].map((n) => monthName(monthAfter(month, n))).join("|"));
  await audit(page, "ads-empty");
  const draft = part(page, "new-ad");
  await draft.getByRole("button", { name: "Draft this advertisement" }).click();
  await page.waitForSelector('main [name="headline"][aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  check("ads: an empty draft names what is missing", (await draft.locator('[aria-invalid="true"]').count()) === 2 && /Choose at least one month/.test(await draft.innerText()), await draft.locator('[aria-invalid="true"]').count());
  await draft.locator('[name="headline"]').fill("Braids from Rs 400 this summer");
  await draft.locator('[name="line"]').fill("Book a chair at Zanzibar Hair Studio, Curepipe.");
  await draft.locator('[name="place"]').selectOption("home");
  await draft.locator("label.chip", { hasText: monthName(next) }).click();
  await draft.locator("label.chip", { hasText: "Your own website" }).click();
  await draft.getByRole("button", { name: "Draft this advertisement" }).click();
  await page.waitForSelector('main li[id^="ad-"]', { timeout: 15000 }).catch(() => {});
  adId = sql(`select id from public.ads where place = 'home'`);
  check("ads: drafted, for the place and the month chosen, to lead to the business's own website", sql(`select status || '|' || place || '|' || array_to_string(months, ',') || '|' || link_to || '|' || paid || '|' || link_url from public.ads where id = '${adId}'`) === `draft|home|${next}|website|false|`, sql(`select status || '|' || place || '|' || array_to_string(months, ',') from public.ads`));
  const card = () => page.locator(`#ad-${adId}`);
  check("ads: the draft is shown as it will look, marked Sponsored, with no price invented", /Sponsored/.test(await card().innerText()) && /Price on request/.test(await card().innerText()) && /Draft/.test(await card().innerText()));
  await card().getByRole("button", { name: "Send it in" }).click();
  await card().locator('[role="alert"]').waitFor({ timeout: 15000 }).catch(() => {});
  check("ads: it cannot be sent in without its picture", /Add the picture before you send it in/.test(await card().innerText()) && sql(`select status from public.ads where id = '${adId}'`) === "draft");
  await card().locator('input[type="file"]').setInputFiles(PICTURES.art);
  await Promise.all([page.waitForURL(/said=picture/, { timeout: 20000 }).catch(() => {}), card().locator('button[type="submit"]', { hasText: "Add this picture" }).click()]);
  check("ads: its picture is uploaded into the advertisement's own folder", sql(`select (artwork ~ '^ads/${adId}/art-[a-z0-9]+[.]png$')::text from public.ads where id = '${adId}'`) === "true" && (await card().locator("img.ad-picture").count()) === 1, page.url());
  await audit(page, "ads-draft");
  await card().getByRole("button", { name: "Send it in" }).click();
  await page.waitForFunction((id) => /With us to check/.test(document.getElementById(`ad-${id}`)?.textContent ?? ""), adId, { timeout: 15000 }).catch(() => {});
  check("ads: sent in, it waits for a person, and its picture can no longer be changed", sql(`select status from public.ads where id = '${adId}'`) === "submitted" && (await card().locator('input[type="file"]').count()) === 0 && /contacts you about payment/.test(await card().innerText()));

  await go(admin, `${origin}/admin/ads`);
  const queue = part(admin, "queue");
  const waiting = await queue.innerText();
  check("admin ads: it waits in the queue as it will look, with its owner to reach and the address it would lead to", /Braids from Rs 400 this summer/.test(waiting) && /Sponsored/.test(waiting) && waiting.includes(ALICE.email) && /Price on request/.test(waiting) && /The first screen/.test(waiting) && /Their own website, zanzibar-hair\.mu/.test(waiting) && (await queue.locator("img.ad-picture").getAttribute("src"))?.includes("?v="), waiting.slice(0, 400));
  await audit(admin, "admin-ads-queue");
  await queue.getByRole("button", { name: "Decline" }).click();
  await admin.waitForSelector('main [name="reason"][aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  check("admin ads: declining must say why", (await queue.locator('[name="reason"][aria-invalid="true"]').count()) === 1 && sql(`select status from public.ads where id = '${adId}'`) === "submitted");
  await queue.locator('[name="reason"]').fill("The picture is too dark to read.");
  await queue.getByRole("button", { name: "Decline" }).click();
  await admin.waitForFunction(() => /Nothing to check/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  await go(page, `${origin}/dashboard/${scratch}/ads`);
  check("ads: declined, the owner is told why and may send it again", sql(`select status || '|' || reason from public.ads where id = '${adId}'`) === "declined|The picture is too dark to read." && /Not accepted/.test(await card().innerText()) && /too dark to read/.test(await card().innerText()));
  await card().getByRole("button", { name: "Send it in" }).click();
  await page.waitForFunction((id) => /With us to check/.test(document.getElementById(`ad-${id}`)?.textContent ?? ""), adId, { timeout: 15000 }).catch(() => {});
  await go(admin, `${origin}/admin/ads`);
  // The admin's page is open on the advertisement as it was sent. Behind it the owner takes it
  // back, changes its words and sends it in again. Approve, pressed on the old page, must not land.
  await card().getByRole("button", { name: "Take it back" }).click();
  await page.waitForFunction((id) => /Draft/.test(document.getElementById(`ad-${id}`)?.querySelector(".tag")?.textContent ?? ""), adId, { timeout: 15000 }).catch(() => {});
  await card().locator("summary", { hasText: "Change its words" }).click();
  await card().locator('[name="line"]').fill("Words the admin never saw.");
  await card().getByRole("button", { name: "Save this advertisement" }).click();
  await card().locator('form [role="status"]').first().waitFor({ timeout: 15000 }).catch(() => {});
  await card().getByRole("button", { name: "Send it in" }).click();
  await page.waitForFunction((id) => /With us to check/.test(document.getElementById(`ad-${id}`)?.textContent ?? ""), adId, { timeout: 15000 }).catch(() => {});
  check("ads: behind the admin's page, the owner has changed the advertisement and sent it in again", sql(`select status || '|' || line from public.ads where id = '${adId}'`) === "submitted|Words the admin never saw." && !/never saw/.test(await part(admin, "queue").innerText()));
  await part(admin, "queue").getByRole("button", { name: "Approve" }).click();
  await admin.waitForSelector('section[aria-labelledby="queue"] [role="alert"]', { timeout: 15000 }).catch(() => {});
  check("admin ads: Approve on the page as it was is refused: the advertisement has changed, and the admin is asked to look again", /has changed since the page was opened/.test(await part(admin, "queue").innerText()) && sql(`select status from public.ads where id = '${adId}'`) === "submitted", (await part(admin, "queue").innerText()).slice(0, 300));
  await admin.waitForFunction(() => /never saw/.test(document.querySelector('section[aria-labelledby="queue"]')?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("admin ads: the page is drawn again with the advertisement as it now is", /Words the admin never saw/.test(await part(admin, "queue").innerText()));
  await part(admin, "queue").getByRole("button", { name: "Approve" }).click();
  await admin.waitForFunction(() => /Nothing to check/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("admin ads: approved once it was looked at again, and not yet paid; where it leads is copied onto it", sql(`select status || '|' || paid || '|' || reason || '|' || link_url from public.ads where id = '${adId}'`) === "approved|false||https://zanzibar-hair.mu/" && (await asVisitor("ads?select=id")).length === 0, sql(`select status || '|' || link_url from public.ads where id = '${adId}'`));
  const row = () => part(admin, "all").locator("article", { hasText: "Braids from Rs 400" });
  await row().getByRole("button", { name: /Mark paid/ }).click();
  await admin.waitForFunction(() => /Mark not paid/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("admin ads: marked paid, it is still not shown before its month", sql(`select paid from public.ads where id = '${adId}'`) === "t" && /Nothing is running here this month/.test(await admin.locator('[data-place="home"]').innerText()) && (await asVisitor("ads?select=id")).length === 0);

  // Its month comes. The calendar cannot be moved, so the advertisement's month is, in the database.
  sql(`update public.ads set months = array['${month}'] where id = '${adId}'`);
  await row().getByRole("button", { name: /Mark not paid/ }).click();
  // The button says "Saving" while it works, so the wait is for the one that takes its place.
  await admin.waitForFunction(() => [...document.querySelectorAll('section[aria-labelledby="all"] button')].some((b) => /^Mark paid/.test(b.textContent ?? "")), null, { timeout: 15000 }).catch(() => {});
  check("ads: marked not paid, it is not shown even in its month", (await asVisitor("ads?select=id")).length === 0 && /Nothing is running here this month/.test(await admin.locator('[data-place="home"]').innerText()));
  await row().getByRole("button", { name: /Mark paid/ }).click();
  await admin.waitForFunction(() => /Mark not paid/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  await go(admin, `${origin}/admin/ads`);
  const home = admin.locator('[data-place="home"]');
  const shown = await home.innerText();
  check("ads: approved, paid and in its month, it is shown in its place through AdSlot, marked Sponsored", /Sponsored/.test(shown) && /Braids from Rs 400 this summer/.test(shown) && /Zanzibar Hair Studio/.test(shown) && (await home.locator('a[rel~="sponsored"]').getAttribute("href").catch(() => "")) === "https://zanzibar-hair.mu/" && (await home.locator("img.ad-picture").count()) === 1, shown);
  // The owner changes the business's website after the approval. The advertisement does not follow.
  await go(page, `${origin}/dashboard/${scratch}`);
  await page.locator('main [name="website"]').fill("https://somewhere-else.example/");
  await press(page, "Save the details");
  await page.waitForFunction(() => /Saved/.test(document.querySelector("main form [role=status]")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  await go(admin, `${origin}/admin/ads`);
  check("ads: when its owner changes the business's website afterwards, the advertisement still leads where it was approved to lead", sql(`select b.website || '|' || a.link_url from public.ads a join public.businesses b on b.id = a.business_id where a.id = '${adId}'`) === "https://somewhere-else.example/|https://zanzibar-hair.mu/" && (await admin.locator('[data-place="home"] a[rel~="sponsored"]').getAttribute("href").catch(() => "")) === "https://zanzibar-hair.mu/", sql(`select b.website || '|' || a.link_url from public.ads a join public.businesses b on b.id = a.business_id where a.id = '${adId}'`));
  check("ads: the other places stay empty, and the page counts what runs", /Nothing is running here this month/.test(await admin.locator('[data-place="results"]').innerText()) && /1/.test(await admin.locator("main .stat", { hasText: "Running now" }).innerText()));
  await audit(admin, "admin-ads");
  check("admin ads: the record holds what the admin did, and not each time the owner sent it in or took it back", sql(`select count(*) from public.audit_log where action in ('ad.submitted', 'ad.draft')`) === "0" && sql(`select count(*) from public.audit_log where action = 'ad.approved' and detail ->> 'headline' = 'Braids from Rs 400 this summer'`) === "1", sql(`select string_agg(action, ',' order by id) from public.audit_log where action like 'ad.%'`));
  // A month that is nothing at all. The database no longer takes one: asked over the API as the
  // owner, it is dropped. And a row that held one, as a row from before might, does not take the
  // admin's page down: put there by force, with the two things that now prevent it set aside.
  const asOwner = { apikey: KEY, Authorization: `Bearer ${await tokenOf(page)}`, "Content-Type": "application/json", Prefer: "return=representation" };
  const made = await fetch(`${API}/rest/v1/ads`, { method: "POST", headers: asOwner, body: JSON.stringify({ business_id: scratch, headline: "A null among its months", place: "results", months: [monthAfter(month, 3), null] }) });
  const [nulled] = made.ok ? await made.json() : [];
  check("ads: a null sent among the months is dropped by the database", made.status === 201 && JSON.stringify(nulled?.months) === JSON.stringify([monthAfter(month, 3)]), `${made.status} ${JSON.stringify(nulled?.months)}`);
  sql(`alter table public.ads disable trigger ads_10_guard; alter table public.ads drop constraint ads_months_check; update public.ads set status = 'declined', reason = 'Forced, for the check.', months = array['${monthAfter(month, 3)}', null] where id = '${nulled?.id}'`);
  const withNull = await go(admin, `${origin}/admin/ads`);
  const ownersToo = await go(page, `${origin}/dashboard/${scratch}/ads`);
  check("ads: a row that holds a null month, forced in, takes down neither the admin's page nor the owner's", withNull?.status() === 200 && /A null among its months/.test(await part(admin, "all").innerText()) && ownersToo?.status() === 200 && /A null among its months/.test(await page.locator("main").innerText()), `${withNull?.status()} ${ownersToo?.status()}`);
  sql(`delete from public.ads where id = '${nulled?.id}'; alter table public.ads add constraint ads_months_check check (cardinality(months) between 1 and 12 and private.are_months(months)); alter table public.ads enable trigger ads_10_guard`);
  await go(admin, `${origin}/admin/ads`);
  const open = await asVisitor("ads?select=headline,place");
  check("public: a visitor is given the advertisement, and only that one", open.length === 1 && open[0].headline === "Braids from Rs 400 this summer", JSON.stringify(open).slice(0, 200));
  await go(page, `${origin}/dashboard/${scratch}/ads`);
  check("ads: the owner sees it running, and that it is now ours to change", /Running/.test(await card().innerText()) && /Paid/.test(await card().innerText()) && (await card().getByRole("button").count()) === 0);

  // A place in the pocket guide: priced from the guide's own rules, and read by the guide through a view.
  const again = part(page, "new-ad");
  await again.locator('[name="headline"]').fill("Zanzibar Hair Studio");
  await again.locator('[name="line"]').fill("Cuts, colour and braids.");
  await again.locator('[name="place"]').selectOption("guide-listing");
  await again.locator("label.chip", { hasText: monthName(next) }).click();
  await again.locator("label.chip", { hasText: monthName(monthAfter(next)) }).click();
  await again.getByRole("button", { name: "Draft this advertisement" }).click();
  await page.waitForFunction(() => document.querySelectorAll('main li[id^="ad-"]').length === 2, null, { timeout: 15000 }).catch(() => {});
  const guideAd = sql(`select id from public.ads where place = 'guide-listing'`);
  const guideCard = page.locator(`#ad-${guideAd}`);
  check("ads: a place in the pocket guide is priced by the month, from the guide's own rules", /Rs 500 a month, Rs 1,000 for 2 months/.test(await guideCard.innerText()), await guideCard.innerText());
  await guideCard.getByRole("button", { name: "Send it in" }).click();
  await page.waitForFunction((id) => /With us to check/.test(document.getElementById(`ad-${id}`)?.textContent ?? ""), guideAd, { timeout: 15000 }).catch(() => {});
  check("ads: a sponsored listing is words alone, so it is sent in without a picture", sql(`select status from public.ads where id = '${guideAd}'`) === "submitted");
  await audit(page, "ads");
  await go(admin, `${origin}/admin/ads`);
  await part(admin, "queue").getByRole("button", { name: "Approve" }).click();
  await admin.waitForFunction(() => /Nothing to check/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("public: a guide's sponsor is not one until it has paid", (await asVisitor(`guide_sponsors?select=name&month=eq.${next}`)).length === 0);
  await part(admin, "all").locator("article", { hasText: "Pocket guide: a sponsored listing" }).getByRole("button", { name: /Mark paid/ }).click();
  await admin.waitForFunction(() => document.querySelectorAll('section[aria-labelledby="all"] article').length === 2 && !/Not yet paid/.test(document.querySelector('section[aria-labelledby="all"]')?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  const sponsors = await asVisitor(`guide_sponsors?select=month,option,name,line,town,phone,website,artwork&month=eq.${next}`);
  check("public: the guide's sponsors for a month are read from a view, with what the page needs", sponsors.length === 1 && sponsors[0].option === "listing" && sponsors[0].name === "Zanzibar Hair Studio" && sponsors[0].town === "curepipe" && sponsors[0].line === "Cuts, colour and braids." && sponsors[0].phone === "+230 5888 4321", JSON.stringify(sponsors).slice(0, 300));
  const stranger = await go(carol.page, `${origin}/admin/ads`);
  check("user: the advertisements to check are not there for them", stranger?.status() === 404, stranger?.status());
}

// ---------------------------------------------------------------------------------------------
// 6h. The list of subscribers: joined, counted, taken as a file, and left by a link.
{
  const { page } = carol;
  const admin = owner.page;
  await go(page, `${origin}/account`);
  const join = part(page, "list");
  check("subscribe: the form begins with the account's address", (await join.locator('[name="email"]').inputValue()) === CAROL.email);
  await join.locator('[name="email"]').fill("not-an-address");
  await join.getByRole("button", { name: "Join the list" }).click();
  await page.waitForSelector('main [name="email"][aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  check("subscribe: an address that is not one is said on its field", (await join.locator('[name="email"][aria-invalid="true"]').count()) === 1 && sql(`select count(*) from public.subscribers`) === "0");
  await join.locator('[name="email"]').fill(CAROL.email.toUpperCase());
  await join.locator('[name="magazine"]').uncheck();
  await join.getByRole("button", { name: "Join the list" }).click();
  await join.locator('[role="status"]').waitFor({ timeout: 15000 }).catch(() => {});
  check("subscribe: joined, for the pocket guide alone, and told what will be sent", sql(`select email || '|' || wants_guide || '|' || wants_magazine from public.subscribers`) === `${CAROL.email}|true|false` && /You are on the list/.test(await join.innerText()) && /the pocket guide to/.test(await join.innerText()), await join.innerText());
  await join.locator('[name="email"]').fill("o'neil@reader.mu");
  await join.getByRole("button", { name: "Join the list" }).click();
  await page.waitForSelector('main [name="email"][aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  check("subscribe: an address with a mark the list does not take is said on its field", (await join.locator('[name="email"][aria-invalid="true"]').count()) === 1 && sql(`select count(*) from public.subscribers`) === "1");

  // Straight to the database's API with the public key, as anyone could. The stack asks for the
  // site's word (scripts/accounts-stack.sh), so a call without it is refused whatever it asks.
  const tries = () => Number(sql(`select count(*) from private.subscribe_tries`));
  const before = tries();
  const outside = await call("subscribe", { address: "outside@example.mu", guide: true, magazine: true });
  const wrong = await call("subscribe", { address: "outside@example.mu", guide: true, magazine: true }, "not-the-word");
  const order = await call("place_order", { lines: [{ id: "plan:go", qty: 1 }], buyer_name: "Out Side", buyer_phone: "+230 5123 0000" });
  const leave = await call("unsubscribe", { leave_token: "00000000-0000-4000-8000-00000000dead" });
  check("proof: a call to the API with the public key and no word is refused: joining, leaving and ordering alike", PROOF !== "" && [outside, wrong, order, leave].every((r) => r.status === 401 || r.status === 403) && sql(`select (select count(*) from public.subscribers where email = 'outside@example.mu') + (select count(*) from public.orders where name = 'Out Side')`) === "0" && tries() === before, [outside, wrong, order, leave].map((r) => r.status).join(" "));
  const built = filesUnder(".next/static").concat(filesUnder(".next/server/app").filter((f) => /\.(html|rsc|body|meta)$/.test(f)));
  const leaked = built.filter((f) => readFileSync(f).includes(PROOF));
  check("proof: the word is in no file a browser is sent, script or page made ahead of time", PROOF !== "" && built.length > 50 && leaked.length === 0, `${built.length} files, in ${leaked.slice(0, 3).join(", ")}`);
  check("proof: nor in a page as served, nor in what the header asks the server", !(await (await fetch(`${origin}/account/sign-in`)).text()).includes(PROOF) && !JSON.stringify(await (await carol.page.request.get(`${origin}/account/me`)).json()).includes(PROOF));

  // With the word, as the site sends it: a new address and one already on the list are answered
  // alike, and each call is counted once.
  const joined = await call("subscribe", { address: "Reader@Example.MU", guide: true, magazine: true }, PROOF);
  check("subscribe: a visitor with no account joins through the database's own function, and cannot read the list", joined.status === 204 && (await joined.text()) === "" && sql(`select count(*) from public.subscribers where email = 'reader@example.mu'`) === "1" && (await asVisitor("subscribers?select=email")).length === 0, joined.status);
  const twice = await call("subscribe", { address: CAROL.email, guide: true, magazine: true }, PROOF);
  check("subscribe: an address already on the list is answered exactly as a new one, keeps its one row with the newer wishes, and both calls are counted", twice.status === joined.status && (await twice.text()) === "" && sql(`select count(*) || '|' || bool_and(wants_magazine) from public.subscribers`) === "2|true" && tries() === before + 2, `${twice.status} ${tries() - before}`);

  await go(admin, `${origin}/admin/subscribers`);
  const text = await admin.locator("main").innerText();
  check("admin subscribers: the counts, the list with each address as not confirmed, and a plain word that the site sends nothing yet", /^\s*2\s*$/m.test(await admin.locator("main .stat .stat-figure").first().innerText()) && (await admin.locator("main .stat").count()) === 5 && /^\s*0\s*$/m.test(await admin.locator("main .stat .stat-figure").nth(1).innerText()) && text.includes(CAROL.email) && text.includes("reader@example.mu") && /this site sends no email yet/.test(text) && (await admin.locator("main table").first().locator("td .tag", { hasText: "Not confirmed" }).count()) === 2, await admin.locator("main .stat").first().innerText());
  await audit(admin, "admin-subscribers");
  const file = await admin.request.get(`${origin}/admin/subscribers/export?want=guide`);
  const body = await file.text();
  const token = sql(`select token from public.subscribers where email = '${CAROL.email}'`);
  check("admin subscribers: the list as a file, each row with its own link to leave", file.status() === 200 && /text\/csv/.test(file.headers()["content-type"] ?? "") && /attachment; filename="subscribers-guide-/.test(file.headers()["content-disposition"] ?? "") && body.includes('"Email address","Pocket guide","Magazine","Joined","Confirmed","Not written to","Link to leave the list"') && body.includes(`"${CAROL.email}","yes","yes",`) && body.includes(`/unsubscribe?token=${token}"`) && body.trim().split("\n").length === 3, body.slice(0, 300));
  const cells = body.trim().split("\n").flatMap((line) => line.replace(/^\uFEFF/, "").match(/("([^"]|"")*"|[^,]*)(,|$)/g) ?? []).map((c) => c.replace(/,$/, "")).filter((c) => c !== "");
  check("admin subscribers: every cell of the file is in quotation marks, so a cell stays one cell whatever a spreadsheet splits on", cells.length === 21 && cells.every((c) => /^"([^"]|"")*"$/.test(c)), cells.slice(0, 6).join(" "));
  check("admin subscribers: the file is not there for anyone else", (await visitor.page.request.get(`${origin}/admin/subscribers/export`)).status() === 404 && (await carol.page.request.get(`${origin}/admin/subscribers/export`)).status() === 404 && (await go(carol.page, `${origin}/admin/subscribers`))?.status() === 404);

  await go(visitor.page, `${origin}/unsubscribe?token=${token}`);
  check("unsubscribe: opening the link takes nobody off", sql(`select count(*) from public.subscribers`) === "2" && /Leave the list/.test(await visitor.page.locator("main").innerText()));
  await audit(visitor.page, "unsubscribe");
  await press(visitor.page, "Take me off the list");
  await visitor.page.waitForSelector('main [role="status"]', { timeout: 15000 }).catch(() => {});
  check("unsubscribe: pressing the button does, and says so", sql(`select count(*) from public.subscribers where email = '${CAROL.email}'`) === "0" && /You are off the list/.test(await said(visitor.page)), await said(visitor.page));
  await go(visitor.page, `${origin}/unsubscribe?token=half-a-link`);
  check("unsubscribe: a link that is not whole says so, and offers nothing to press", /not whole/.test(await visitor.page.locator("main").innerText()) && (await visitor.page.locator("main button").count()) === 0);
  await go(admin, `${origin}/admin/subscribers?q=reader`);
  await admin.locator("main table").getByRole("button", { name: /Take off/ }).click();
  await admin.waitForFunction(() => /No address like that|Nobody yet/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("admin subscribers: an admin takes an address off, and that is on the record; a person leaving by their own link is not", sql(`select count(*) from public.subscribers`) === "0" && sql(`select count(*) from public.audit_log where action = 'subscriber.removed'`) === "1", sql(`select count(*) from public.audit_log where action = 'subscriber.removed'`));
}

// ---------------------------------------------------------------------------------------------
// 6i. Orders: placed by a guest and by someone signed in, priced by the database, moved on by an admin.
{
  const { page } = visitor;
  const admin = owner.page;
  await go(page, `${origin}/account/order`);
  const sold = await page.locator("main").innerText();
  check("order: what the site sells is listed, at the site's own prices", /biznes\.mu Pocket Guide/.test(sold) && /Rs 150/.test(sold) && /Sponsored listing/.test(sold) && /Rs 500 a month/.test(sold) && /Biznes Go/.test(sold) && /Rs 550 a month/.test(sold) && /Price on request/.test(sold), sold.slice(0, 300));
  await audit(page, "order-choose");
  await go(page, `${origin}/account/order?item=sponsor:listing*2&item=guide:biznes-pocket-guide&item=ad:home&item=plan:platinum`);
  const basket = await part(page, "basket").innerText();
  check("order: only what is sold is taken from the address, and the site prices it", /2 × Sponsored listing/.test(basket) && /Rs 1,000/.test(basket) && /Rs 1,150/.test(basket) && /On request/.test(basket) && !/platinum/i.test(basket), basket);
  await press(page, "Place the order");
  await page.waitForSelector('main [aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  check("order: a guest must say who they are and how to reach them", (await page.locator('main [aria-invalid="true"]').count()) === 2 && (await page.evaluate(() => document.activeElement?.getAttribute("name"))) === "name" && sql(`select count(*) from public.orders`) === "0");
  await audit(page, "order-errors");
  await fill(page, { name: "Dev Ramdin", phone: "+230 5999 0001", note: "For the December guide." });
  // The browser is not trusted: a thing the site does not sell is refused, and a price sent along is ignored.
  const tamper = (how) => page.evaluate((how) => {
    const el = document.querySelector('main input[name="lines"]');
    const lines = JSON.parse(el.value);
    el.value = JSON.stringify(how === "add" ? [...lines, { id: "platinum", kind: "plan", qty: 1 }] : lines.filter((l) => l.id !== "platinum").map((l) => ({ ...l, price: 1, unit_mur: 1, total: 1 })));
  }, how);
  await tamper("add");
  await press(page, "Place the order");
  await page.waitForSelector('main form [role="alert"]', { timeout: 15000 }).catch(() => {});
  check("order: a thing the site does not sell is refused, and nothing is placed", /no longer sold here/.test(await said(page)) && sql(`select count(*) from public.orders`) === "0", await said(page));
  await tamper("price");
  await press(page, "Place the order");
  await page.waitForFunction(() => /We have your order/.test(document.querySelector("main h2")?.textContent ?? "") || [...document.querySelectorAll("main h2")].some((h) => /We have your order/.test(h.textContent ?? "")), null, { timeout: 15000 }).catch(() => {});
  // Its number is the database's to give: the next after the last, from 1001.
  const first = Number(sql(`select number from public.orders`));
  check("order: placed by a guest, priced by the database whatever the browser sent", first >= 1001 && sql(`select number || '|' || total_mur || '|' || status || '|' || (customer_id is null) || '|' || name || '|' || note from public.orders`) === `${first}|1150|placed|true|Dev Ramdin|For the December guide.` && sql(`select string_agg(item || '=' || coalesce(unit_mur::text, 'request') || 'x' || qty, ',' order by id) from public.order_items`) === "sponsor:listing=500x2,guide:biznes-pocket-guide=150x1,ad:home=requestx1", sql(`select string_agg(item || '=' || coalesce(unit_mur::text, 'request') || 'x' || qty, ',' order by id) from public.order_items`));
  const placed = await page.locator("main").innerText();
  check("order: the answer promises a person and no way of paying", placed.includes(`We have your order, number ${first}, for Rs 1,150. A person will contact you with how to pay.`) && /priced on request/.test(placed) && /Nothing has been paid/.test(placed) && !/Juice/i.test(placed), placed.slice(0, 400));
  await audit(page, "order-placed");
  check("order: a guest's order is nobody's to read over the API", (await asVisitor("orders?select=id")).length === 0 && (await asPerson(carol.page, "orders?select=id")).length === 0 && (await asPerson(carol.page, "order_items?select=id")).length === 0);

  // Signed in. First the catalogue the database prices from falls behind the site: nothing is taken until it is level.
  await go(carol.page, `${origin}/account/order?item=plan:go`);
  await carol.page.waitForFunction(() => /Ordering as/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 10000 }).catch(() => {});
  check("order: signed in, the page says whose order it will be", /Ordering as Carol Customer/.test(await carol.page.locator("main").innerText()));
  sql(`update public.catalogue set price_mur = 1 where id = 'plan:go'`);
  await press(carol.page, "Place the order");
  await carol.page.waitForSelector('main form [role="alert"]', { timeout: 15000 }).catch(() => {});
  check("order: while the catalogue and the site disagree on a price, the order is not taken", /could not take the order just now/.test(await said(carol.page)) && sql(`select count(*) from public.orders`) === "1", await said(carol.page));
  await go(admin, `${origin}/admin/orders`);
  check("admin orders: the page says where the catalogue and the site differ", /Biznes Go: the site says 550, the catalogue 1/.test(await admin.locator("main").innerText()));
  await admin.locator("main").getByRole("button", { name: "Bring the catalogue level" }).click();
  await admin.waitForFunction(() => /says what the site says today/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("admin orders: the superadmin brings the catalogue level", sql(`select price_mur from public.catalogue where id = 'plan:go'`) === "550" && sql(`select count(*) from public.catalogue where active`) === "13");
  await press(carol.page, "Place the order");
  await carol.page.waitForFunction(() => [...document.querySelectorAll("main h2")].some((h) => /We have your order/.test(h.textContent ?? "")), null, { timeout: 15000 }).catch(() => {});
  const second = first + 1;
  check("order: placed signed in, it is kept with the account", sql(`select number || '|' || total_mur || '|' || (customer_id = (select id from public.profiles where email = '${CAROL.email}')) from public.orders where number = ${second}`) === `${second}|550|true`, sql(`select number || '|' || total_mur from public.orders order by number`));
  await go(carol.page, `${origin}/account`);
  const mine = await part(carol.page, "orders").innerText();
  check("account: Your orders lists their own order and nobody else's", new RegExp(`Order\\s+${second}`).test(mine) && /Biznes Go/.test(mine) && /Placed/.test(mine) && /Rs 550/.test(mine) && !mine.includes(String(first)), mine);
  await audit(carol.page, "account-orders");

  await go(admin, `${origin}/admin/orders`);
  const queue = part(admin, "queue");
  const waiting = await queue.innerText();
  check("admin orders: both wait in the queue, the guest's with how to reach them", new RegExp(`Order\\s+${first}`).test(waiting) && /A guest/.test(waiting) && /\+230 5999 0001/.test(waiting) && /For the December guide/.test(waiting) && new RegExp(`Order\\s+${second}`).test(waiting) && /Has an account/.test(waiting) && waiting.includes(CAROL.email), waiting.slice(0, 400));
  await audit(admin, "admin-orders");
  const order = (n) => admin.locator(`article[data-order="${n}"]`);
  await order(second).locator('[name="note"]').fill("Pay by transfer to the account we sent you.");
  await order(second).getByRole("button", { name: /We have told them how to pay/ }).click();
  await admin.waitForFunction((n) => /Awaiting payment/.test(document.querySelector(`article[data-order="${n}"]`)?.textContent ?? ""), second, { timeout: 15000 }).catch(() => {});
  check("admin orders: marked awaiting payment, with a note for the person", sql(`select status || '|' || admin_note from public.orders where number = ${second}`) === "awaiting_payment|Pay by transfer to the account we sent you.");
  await order(second).getByRole("button", { name: /Mark paid/ }).click();
  await admin.waitForFunction((n) => /Mark fulfilled/.test(document.querySelector(`article[data-order="${n}"]`)?.textContent ?? ""), second, { timeout: 15000 }).catch(() => {});
  await order(second).getByRole("button", { name: /Mark fulfilled/ }).click();
  await admin.waitForFunction((n) => !document.querySelector(`article[data-order="${n}"]`), second, { timeout: 15000 }).catch(() => {});
  await order(first).getByRole("button", { name: /^Cancel/ }).click();
  await admin.waitForFunction(() => /No order is waiting/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("admin orders: paid, fulfilled, and the other cancelled, each under the admin's name", sql(`select string_agg(number || '=' || status || '=' || (handled_by = (select id from public.profiles where email = '${OWNER.email}')), ',' order by number) from public.orders`) === `${first}=cancelled=true,${second}=fulfilled=true`, sql(`select string_agg(number || '=' || status, ',' order by number) from public.orders`));
  check("admin orders: every step is on the record", sql(`select string_agg(action, ',' order by id) from public.audit_log where action like 'order.%' or action = 'catalogue.set'`) === "catalogue.set,order.awaiting_payment,order.paid,order.fulfilled,order.cancelled" && (await part(admin, "record").innerText()).includes(`Order ${second}: fulfilled`) && (await part(admin, "done").innerText()).includes(String(second)), sql(`select string_agg(action, ',' order by id) from public.audit_log where action like 'order.%' or action = 'catalogue.set'`));
  await audit(admin, "admin-orders-done");
  await go(carol.page, `${origin}/account`);
  check("account: the person sees where their order stands, and the note written for them", /Fulfilled/.test(await part(carol.page, "orders").innerText()) && /Pay by transfer to the account we sent you/.test(await part(carol.page, "orders").innerText()));
  const peek = await go(carol.page, `${origin}/admin/orders`);
  check("user: the orders are not there for them", peek?.status() === 404, peek?.status());
}

// ---------------------------------------------------------------------------------------------
// 6j. The site's own email: the list confirmed, a message written and looked at, sent by hand
//     with no sender and then in batches with one, left in one press, and what a mail service
//     says afterwards.
{
  const admin = owner.page;
  const LIST = Object.fromEntries(["ann", "ben", "cat", "dev", "fay", "gus"].map((who) => [who, `${who}@list.test`]));
  const EVE = "eve@list.test";
  const TEST_URL = process.env.EMAIL_TEST_URL ?? "";
  const tok = (email, column = "token") => sql(`select ${column} from public.subscribers where email = '${email}'`);
  const campaignOf = (page) => new URL(page.url()).pathname.split("/").pop();
  /** A link from a message, on the site under check: the same path, whatever address the site was built to name itself by. */
  const here = (link) => {
    try {
      return `${origin}${new URL(link).pathname}${new URL(link).search}`;
    } catch {
      return origin;
    }
  };
  /** Wait until a campaign stands a way, as the database has it. */
  const stands = async (id, status, most = 60) => {
    for (let i = 0; i < most && sql(`select status from public.email_campaigns where id = '${id}'`) !== status; i++) await sleep(250);
    return sql(`select status from public.email_campaigns where id = '${id}'`) === status;
  };
  const tally = (id) => sql(`select string_agg(state || '=' || n, ',' order by state) from (select state, count(*) n from public.email_recipients where campaign_id = '${id}' group by state) t`);

  // What the site hands to its sender, kept here. It does not listen yet: the site has no sender.
  const outbox = { batches: [], letters: [], refuse: "", delay: 0 };
  const listener = http.createServer(async (request, response) => {
    if (request.method !== "POST") return response.writeHead(200, { "Content-Type": "application/json" }).end('{"ok":true}');
    let body = "";
    for await (const chunk of request) body += chunk;
    const batch = JSON.parse(body);
    if (outbox.delay) await sleep(outbox.delay);
    outbox.batches.push(batch);
    if (outbox.refuse) {
      const why = outbox.refuse;
      outbox.refuse = "";
      return response.writeHead(400, { "Content-Type": "application/json" }).end(JSON.stringify({ message: why }));
    }
    outbox.letters.push(...batch.letters.map((letter) => ({ ...letter, from: batch.from, replyTo: batch.replyTo })));
    response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ results: batch.letters.map((letter) => ({ ref: letter.ref, ok: true, id: `kept-${letter.ref}` })) }));
  });
  const lettersTo = (email, subject) => outbox.letters.filter((l) => l.to === email && (!subject || l.subject === subject));

  // ---- With no sender.
  check("email: the checks were given the address the site's local sender posts to", /^http:\/\/127\.0\.0\.1:\d+\//.test(TEST_URL), TEST_URL || "EMAIL_TEST_URL is not set");
  await go(admin, `${origin}/admin/email`);
  let text = await admin.locator("main").innerText();
  check("email: with no sender the page says so plainly, says what happens meanwhile, and names each variable to set", /Nothing leaves the site/.test(text) && /so the site sends no email/.test(text) && ["EMAIL_PROVIDER=resend", "RESEND_API_KEY", "RESEND_WEBHOOK_SECRET", "EMAIL_PROVIDER=mailgun", "MAILGUN_API_KEY", "MAILGUN_DOMAIN", "MAILGUN_REGION", "MAILGUN_WEBHOOK_SIGNING_KEY"].every((name) => text.includes(name)) && /mark it as sent by hand/.test(text), text.slice(0, 300));
  check("email: and that no message may be sent until the postal address and who it is from are set", /No message may be sent yet: the sender's postal address, the name a message comes from, the address a message comes from are not set/.test(text));
  check("email: the tab is among the admin's tabs", (await admin.locator('nav[aria-label="Admin"] a[href="/admin/email"][aria-current="page"]').count()) === 1);
  await audit(admin, "admin-email-no-sender");
  const strangers = [await go(carol.page, `${origin}/admin/email`), await go(visitor.page, `${origin}/admin/email`)];
  check("email: the page is not there for a user, and leads a visitor to sign in", strangers[0]?.status() === 404 && new URL(visitor.page.url()).pathname === "/account/sign-in", `${strangers[0]?.status()} ${visitor.page.url()}`);

  // Six join through the database's own function with the site's word, as the form does; one through the form itself.
  for (const [who, email] of Object.entries(LIST)) await call("subscribe", { address: email, guide: true, magazine: who !== "ben" }, PROOF);
  await go(carol.page, `${origin}/account`);
  const join = part(carol.page, "list");
  await join.getByRole("button", { name: "Join the list" }).click();
  await join.locator('[role="status"]').waitFor({ timeout: 15000 }).catch(() => {});
  check("join: with no sender joining works as before, and the address is kept as not confirmed", /You are on the list\. We will send/.test(await join.innerText()) && sql(`select count(*) || '|' || count(confirmed_at) || '|' || count(confirm_sent_at) from public.subscribers`) === "7|0|0", await join.innerText());

  // The settings are the superadmin's. Until they are set a message is written and looked at, and goes nowhere.
  await go(admin, `${origin}/admin/email`);
  await part(admin, "begin").getByRole("button", { name: /Start the Pocket Guide/ }).click();
  await admin.waitForURL(/\/admin\/email\/[0-9a-f-]{36}$/, { timeout: 20000 }).catch(() => {});
  const guide = campaignOf(admin);
  const built = JSON.parse(readFileSync("content/pdf/built.json", "utf8")).edition;
  const coming = monthAfter(built) > month ? monthAfter(built) : month;
  const guideRow = () => sql(`select kind || '|' || audience || '|' || edition || '|' || status || '|' || subject from public.email_campaigns where id = '${guide}'`);
  check("guide: one press starts the Pocket Guide's message for the coming edition, as a draft", guideRow() === `guide|guide|${coming}|draft|biznes.mu Pocket Guide: the ${monthName(coming)} edition`, guideRow());
  const write = part(admin, "write");
  check("guide: the month, the guide's name and its address on the site are filled in, with whether it is free or sold", (await write.locator('[name="subject"]').inputValue()).includes(monthName(coming)) && (await write.locator('[name="b0.text"]').inputValue()) === `biznes.mu Pocket Guide: ${monthName(coming)}` && (await write.locator('[name="b3.href"]').inputValue()) === "/shop" && /Open the Pocket Guide/.test(await write.locator('[name="b3.label"]').inputValue()) && /This edition is Rs 150\.|free to download/.test(await write.locator('[name="b2.text"]').inputValue()) && /What the site knows of the/.test(await write.locator("[data-guide-facts]").innerText()), await write.locator('[name="b2.text"]').inputValue());
  check("guide: no price and no date is in it that the guide's own files do not hold", sql(`select blocks::text from public.email_campaigns where id = '${guide}'`).match(/Rs [\d,]+/g)?.every((p) => p === "Rs 150") !== false && !/\b20\d\d-\d\d-\d\d\b/.test(sql(`select blocks::text from public.email_campaigns where id = '${guide}'`)));
  await audit(admin, "email-draft");

  // Writing it: a part changed, one added, moved and taken out, and a button that leads nowhere it may.
  await write.locator('[name="b1.text"]').fill("Here is the new edition.\nSixty places, region by region.");
  await write.getByRole("button", { name: "A paragraph", exact: true }).click();
  await admin.waitForSelector('main [name="b4.text"]', { timeout: 15000 }).catch(() => {});
  check("write: a part is added at the end, and what was typed is saved with it", sql(`select jsonb_array_length(blocks) || '|' || (blocks -> 1 ->> 'text') || '|' || (blocks -> 4 ->> 'type') from public.email_campaigns where id = '${guide}'`) === "5|Here is the new edition.\nSixty places, region by region.|paragraph", sql(`select blocks::text from public.email_campaigns where id = '${guide}'`).slice(0, 200));
  await part(admin, "write").locator('[name="b4.text"]').fill("See you on the road.");
  await part(admin, "write").getByRole("button", { name: /^Move up\s*: part 5$/ }).click();
  await admin.waitForFunction(() => document.querySelector('main [name="b3.text"]')?.value === "See you on the road.", null, { timeout: 15000 }).catch(() => {});
  check("write: a part moves up, with what was typed in it", sql(`select (blocks -> 3 ->> 'text') || '|' || (blocks -> 4 ->> 'type') from public.email_campaigns where id = '${guide}'`) === "See you on the road.|button");
  await part(admin, "write").locator('[name="b4.href"]').fill("javascript:alert(1)");
  await part(admin, "write").getByRole("button", { name: "Save the draft" }).click();
  await admin.waitForSelector('main [name="b4.href"][aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  check("write: a button may lead to a page of this site or a full https address and nowhere else; what was typed is kept and nothing is saved", (await admin.locator('main [name="b4.href"][aria-invalid="true"]').count()) === 1 && (await admin.locator('main [name="b4.href"]').inputValue()) === "javascript:alert(1)" && sql(`select blocks -> 4 ->> 'href' from public.email_campaigns where id = '${guide}'`) === "/shop");
  await audit(admin, "email-draft-errors");
  await part(admin, "write").locator('[name="b4.href"]').fill("/shop");
  await part(admin, "write").locator('[name="subject"]').fill(`The ${monthName(coming)} Pocket Guide`);
  await part(admin, "write").locator('[name="subject"]').press("Enter");
  await admin.waitForFunction((want) => document.querySelector("main [data-subject]")?.textContent === want, `The ${monthName(coming)} Pocket Guide`, { timeout: 15000 }).catch(() => {});
  check("write: pressing Enter in a field saves the draft, and moves or takes out nothing", sql(`select subject || '|' || jsonb_array_length(blocks) from public.email_campaigns where id = '${guide}'`) === `The ${monthName(coming)} Pocket Guide|5`, sql(`select subject || '|' || jsonb_array_length(blocks) from public.email_campaigns where id = '${guide}'`));
  await part(admin, "write").getByRole("button", { name: /^Take out\s*: part 4$/ }).click();
  await admin.waitForFunction(() => !document.querySelector('main [name="b4.type"]'), null, { timeout: 15000 }).catch(() => {});
  check("write: a part is taken out", sql(`select jsonb_array_length(blocks) || '|' || (blocks -> 3 ->> 'type') from public.email_campaigns where id = '${guide}'`) === "4|button");

  // Looking at it: drawn on the page, in no frame, with its plain-text twin.
  const look = part(admin, "look");
  const drawn = look.locator(".mail-frame").first();
  check("look: the message is drawn on the page as it will look, and not in a frame", (await admin.locator("iframe").count()) === 0 && (await drawn.locator('[role="heading"]').first().innerText()) === `biznes.mu Pocket Guide: ${monthName(coming)}` && (await drawn.locator("a", { hasText: "Open the Pocket Guide" }).getAttribute("href")) === `${origin}/shop` && /Sixty places, region by region\./.test(await drawn.innerText()));
  check("look: the button is the site's saffron with ink words, on a white card on the cream sheet", await drawn.locator("a", { hasText: "Open the Pocket Guide" }).evaluate((a) => getComputedStyle(a).backgroundColor === "rgb(248, 198, 24)" && getComputedStyle(a).color === "rgb(10, 22, 57)" && getComputedStyle(a.closest(".em-card")).backgroundColor === "rgb(255, 255, 255)" && getComputedStyle(a.closest(".em-sheet")).backgroundColor === "rgb(253, 249, 236)"));
  const twin = await look.locator("[data-plain-text]").innerText();
  check("look: its plain-text twin holds the same parts", twin.includes(`biznes.mu Pocket Guide: ${monthName(coming)}`) && twin.includes("Here is the new edition.\nSixty places, region by region.") && twin.includes(`Open the Pocket Guide: ${origin}/shop`), twin.slice(0, 300));
  check("look: it ends with who sent it and why, and, sent by hand, with how to leave by replying", /Sent by biznes\.mu, which is run by Khay Digital Ltd\. You have this message because you asked to be sent the biznes\.mu Pocket Guide\./.test(twin) && /reply to this one and say so/.test(twin) && /postal address is printed here once it is set/.test(twin), twin.slice(-400));

  // Ready, and then no further: nothing is sent, by any road, while the postal address is empty.
  await part(admin, "ready").getByRole("button", { name: "It is ready" }).click();
  await admin.waitForSelector('main [data-status="ready"]', { timeout: 15000 }).catch(() => {});
  let send = part(admin, "send");
  text = await send.innerText();
  check("hand: with no sender Send is not offered; the page says why, and how to connect one", sql(`select status from public.email_campaigns where id = '${guide}'`) === "ready" && (await send.getByRole("button", { name: "Send", exact: true }).count()) === 0 && /so the site sends no email/.test(text) && /set EMAIL_PROVIDER/.test(text) && /goes out by hand/.test(text));
  check("hand: and nothing is offered to take away while the sender's postal address is not set", /It cannot be sent yet: the sender's postal address/.test(text) && (await send.locator('a[href*="/export"]').count()) === 0 && (await send.getByRole("button", { name: "Mark as sent by hand" }).count()) === 0);
  const early = await call("email_sent_by_hand", { campaign: guide });
  const asOwner = async (name, args) => fetch(`${API}/rest/v1/rpc/${name}`, { method: "POST", headers: { apikey: KEY, Authorization: `Bearer ${await tokenOf(admin)}`, "Content-Type": "application/json" }, body: JSON.stringify(args) });
  const refused = await asOwner("email_sent_by_hand", { campaign: guide });
  check("hand: the database refuses it too, to a visitor because they are one and to an admin because the address is empty", early.status >= 400 && refused.status === 400 && /postal address/.test((await refused.json()).message) && sql(`select status from public.email_campaigns where id = '${guide}'`) === "ready", `${early.status} ${refused.status}`);

  await go(admin, `${origin}/admin/email`);
  const settings = part(admin, "settings");
  await settings.locator('[name="from_name"]').fill("biznes.mu");
  await settings.locator('[name="from_email"]').fill("not an address");
  await settings.getByRole("button", { name: "Save these" }).click();
  await admin.waitForSelector('main [name="from_email"][aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  check("settings: an address to send from that is not one is said on its field", (await admin.locator('main [name="from_email"][aria-invalid="true"]').count()) === 1 && sql(`select from_name || '|' || from_email from public.email_settings`) === "|");
  await settings.locator('[name="from_email"]').fill("Guide@Biznes.test");
  await settings.locator('[name="reply_to"]').fill("hello@biznes.test");
  await settings.locator('[name="postal_address"]').fill("Khay Digital Ltd\nRoyal Road, Curepipe\nMauritius");
  await settings.getByRole("button", { name: "Save these" }).click();
  await settings.locator('form [role="status"]').waitFor({ timeout: 15000 }).catch(() => {});
  check("settings: the superadmin sets who a message is from, where replies go and the postal address, and it is on the record", sql(`select from_name || '|' || from_email || '|' || reply_to || '|' || postal_address || '|' || write_to from public.email_settings`) === "biznes.mu|guide@biznes.test|hello@biznes.test|Khay Digital Ltd\nRoyal Road, Curepipe\nMauritius|confirmed_once_connected" && sql(`select count(*) from public.audit_log a join public.profiles p on p.id = a.actor where a.action = 'settings.email' and p.email = '${OWNER.email}'`) === "1", sql(`select from_name || '|' || from_email from public.email_settings`));
  check("email: the list of messages holds the draft that became ready", /Ready/.test(await admin.locator(`article[data-campaign="${guide}"]`).innerText()) && (await admin.locator(`article[data-campaign="${guide}"] a[href="/admin/email/${guide}"]`).count()) === 1);
  await audit(admin, "admin-email-settings");

  // Sent by hand: the addresses as a file, the message to copy, and the record written afterwards.
  await go(admin, `${origin}/admin/email/${guide}`);
  send = part(admin, "send");
  check("hand: the page says who it would go to: all seven, since nobody can have confirmed yet", /would go to\s+7\s+addresses/.test((await send.locator("[data-audience]").innerText()).replace(/\s+/g, " ")), await send.locator("[data-audience]").innerText());
  await audit(admin, "email-ready-by-hand");
  const file = await admin.request.get(`${origin}/admin/email/${guide}/export?as=csv`);
  const rowsOf = (await file.text()).trim().split("\n");
  check("hand: the recipients as a file, each with their own link to leave", file.status() === 200 && /text\/csv/.test(file.headers()["content-type"] ?? "") && rowsOf[0].replace(/^﻿/, "") === '"Email address","Link to leave the list"' && rowsOf.length === 8 && Object.values(LIST).every((email) => rowsOf.includes(`"${email}","${origin}/unsubscribe?token=${tok(email)}"`)), rowsOf.slice(0, 3).join(" "));
  const asHtml = await (await admin.request.get(`${origin}/admin/email/${guide}/export?as=html`)).text();
  const asText = await (await admin.request.get(`${origin}/admin/email/${guide}/export?as=txt`)).text();
  check("hand: the message's HTML and text, whole, with the postal address and no reader's own link", asHtml.startsWith("<!doctype html>") && asHtml.includes('width="600"') && asHtml.includes("Khay Digital Ltd<br>Royal Road, Curepipe<br>Mauritius") && asHtml.includes('href="mailto:hello@biznes.test"') && !asHtml.includes("/unsubscribe") && asText.includes("write to hello@biznes.test") && asText.trimEnd().endsWith("Khay Digital Ltd\nRoyal Road, Curepipe\nMauritius") && (await send.locator("textarea").nth(0).inputValue()) === asHtml && (await send.locator("textarea").nth(1).inputValue()) === asText && (await send.locator('input[readonly][type="text"]').inputValue()) === `The ${monthName(coming)} Pocket Guide`, asHtml.slice(0, 120));
  check("hand: the files are not there for anyone else", (await carol.page.request.get(`${origin}/admin/email/${guide}/export?as=csv`)).status() === 404 && (await visitor.page.request.get(`${origin}/admin/email/${guide}/export?as=html`)).status() === 404 && (await go(carol.page, `${origin}/admin/email/${guide}`))?.status() === 404);
  await send.getByRole("button", { name: "Mark as sent by hand" }).click();
  await admin.waitForSelector('main [name="sure"][aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  check("hand: marking it asks to be told it has gone", (await admin.locator('main [name="sure"][aria-invalid="true"]').count()) === 1 && sql(`select status from public.email_campaigns where id = '${guide}'`) === "ready");
  await send.locator('[name="sure"]').check();
  await send.getByRole("button", { name: "Mark as sent by hand" }).click();
  await admin.waitForSelector('main [data-status="sent"]', { timeout: 15000 }).catch(() => {});
  check("hand: marked as sent by hand, the record holds who it went to, who marked it and when", sql(`select status || '|' || by_hand || '|' || (started_by = (select id from public.profiles where email = '${OWNER.email}')) || '|' || (finished_at is not null) from public.email_campaigns where id = '${guide}'`) === "sent|true|true|true" && tally(guide) === "sent=7" && sql(`select count(*) from public.audit_log where action = 'email.campaign_sent_by_hand'`) === "1" && /Sent, by hand/.test(await admin.locator("main [data-status]").innerText()) && (await part(admin, "record").locator("tbody tr").count()) === 7, tally(guide));
  await audit(admin, "email-sent-by-hand");

  // ---- With a sender: the local one starts to answer, and the site finds it.
  await new Promise((done) => listener.listen(Number(new URL(TEST_URL).port), "127.0.0.1", done));
  await go(admin, `${origin}/admin/email`);
  text = await admin.locator("main").innerText();
  check("sender: once something answers at its address the local sender is connected, and the page says so and says who can be asked to confirm", /A local sender is connected/.test(text) && /The site sends its own email/.test(text) && /7 addresses have never been asked to confirm/.test(text) && !/EMAIL_PROVIDER=resend/.test(text), text.slice(0, 300));
  await audit(admin, "admin-email");

  // Joining now sends a link to confirm: once, to a page that waits to be pressed.
  await go(carol.page, `${origin}/account`);
  const joining = part(carol.page, "list");
  await joining.locator('[name="email"]').fill(EVE);
  await joining.getByRole("button", { name: "Join the list" }).click();
  await joining.locator('[role="status"]').waitFor({ timeout: 15000 }).catch(() => {});
  const asked = lettersTo(EVE);
  const confirmLink = /href="([^"]+\/subscribe\/confirm\?token=[0-9a-f-]{36})"/.exec(asked[0]?.html ?? "")?.[1];
  check("join: with a sender, joining sends one message that asks to confirm, to that address, from who the settings say", /Nearly there/.test(await joining.innerText()) && asked.length === 1 && asked[0].subject === "Confirm your address for biznes.mu" && asked[0].from === "biznes.mu <guide@biznes.test>" && asked[0].replyTo === "hello@biznes.test" && Boolean(confirmLink) && confirmLink.endsWith(tok(EVE, "confirm_token")) && asked[0].text.includes(confirmLink) && sql(`select (confirmed_at is null)::text || '|' || (confirm_sent_at is not null)::text from public.subscribers where email = '${EVE}'`) === "true|true", await joining.innerText());
  check("join: the message carries its reader's own link to leave, the two headers for leaving in one press, and the postal address", asked[0]?.headers["List-Unsubscribe"] === `<${new URL(confirmLink ?? origin).origin}/api/email/leave?token=${tok(EVE)}>` && asked[0]?.headers["List-Unsubscribe-Post"] === "List-Unsubscribe=One-Click" && asked[0]?.html.includes(`/unsubscribe?token=${tok(EVE)}`) && asked[0]?.text.trimEnd().endsWith("Khay Digital Ltd\nRoyal Road, Curepipe\nMauritius"), JSON.stringify(asked[0]?.headers));
  await joining.locator('[name="email"]').fill(EVE);
  await joining.getByRole("button", { name: "Join the list" }).click();
  await sleep(2000);
  check("join: asking again the same day sends no second message, and the answer is the same", lettersTo(EVE).length === 1 && outbox.letters.length === 1 && /Nearly there/.test(await joining.innerText()), `${outbox.letters.length} letters`);
  const direct = await call("confirmation_for", { address: EVE });
  check("join: nobody calling the database with the public key is handed a link to confirm", direct.status === 401 || direct.status === 403, direct.status);
  // A mail program that opens every link before its reader does: it asks for the page and presses nothing.
  const scanned = await fetch(here(confirmLink), { redirect: "follow" });
  check("confirm: a link that is only opened shows a page with one button, and confirms nothing", scanned.ok && /Confirm my address/.test(await scanned.text()) && sql(`select count(confirmed_at) from public.subscribers`) === "0");
  await go(visitor.page, here(confirmLink));
  await audit(visitor.page, "subscribe-confirm");
  await press(visitor.page, "Confirm my address");
  await visitor.page.waitForSelector('main [role="status"]', { timeout: 15000 }).catch(() => {});
  check("confirm: pressing the button confirms that address and no other", /Your address is confirmed/.test(await said(visitor.page)) && sql(`select string_agg(email, ',') from public.subscribers where confirmed_at is not null`) === EVE, await said(visitor.page));
  await go(visitor.page, `${origin}/subscribe/confirm?token=${tok(EVE)}`);
  await press(visitor.page, "Confirm my address");
  await visitor.page.waitForSelector('main [role="alert"]', { timeout: 15000 }).catch(() => {});
  check("confirm: the link to leave confirms nothing, and a link that is not whole offers nothing to press", /confirms nothing now/.test(await said(visitor.page)) && (await go(visitor.page, `${origin}/subscribe/confirm?token=half`), (await visitor.page.locator("main button").count()) === 0 && /not whole/.test(await visitor.page.locator("main").innerText())));

  // Those who joined before are asked, once: a campaign of its own, sent like any other.
  await go(admin, `${origin}/admin/email`);
  await part(admin, "stand").getByRole("button", { name: "Ask them to confirm" }).click();
  await admin.waitForURL(/\/admin\/email\/[0-9a-f-]{36}\?go=1/, { timeout: 20000 }).catch(() => {});
  const asking = campaignOf(admin);
  check("ask: pressing it queues the seven that were never asked, and the page sends them by itself, two to a batch", (await stands(asking, "sent")) && tally(asking) === "sent=7" && sql(`select kind || '|' || audience from public.email_campaigns where id = '${asking}'`) === "confirm|unconfirmed" && outbox.batches.filter((b) => b.letters[0].subject === "Confirm your address for biznes.mu" && b.letters.length <= 2).length === 5, `${tally(asking)} in ${outbox.batches.length} batches`);
  check("ask: each is sent its own link to confirm, and nobody's but its own", Object.values(LIST).every((email) => lettersTo(email, "Confirm your address for biznes.mu").length === 1 && lettersTo(email)[0].html.includes(`/subscribe/confirm?token=${tok(email, "confirm_token")}`) && !lettersTo(email)[0].html.includes(tok(EVE, "confirm_token"))) && lettersTo(EVE).length === 1);
  await admin.waitForSelector('main [data-status="sent"]', { timeout: 15000 }).catch(() => {});
  check("ask: the message is the site's own words, shown on its page, and cannot be written over", /The site writes this message itself/.test(await part(admin, "look").innerText()) && /Confirm my address/.test(await part(admin, "look").locator(".mail-frame").first().innerText()) && (await admin.locator('section[aria-labelledby="write"]').count()) === 0);
  await audit(admin, "email-asked-to-confirm");
  await go(admin, `${origin}/admin/email`);
  check("ask: nobody is left to ask, so it is not offered a second time, and the database refuses it too", (await admin.locator("main").getByRole("button", { name: "Ask them to confirm" }).count()) === 0 && (await asOwner("email_ask_confirm", {})).status === 400 && sql(`select count(*) from public.email_campaigns where kind = 'confirm'`) === "1");
  // Ann confirms by pressing her link; the others' links are pressed for them here, with the site's word, as the page would.
  await go(visitor.page, here(/href="([^"]+\/subscribe\/confirm[^"]+)"/.exec(lettersTo(LIST.ann)[0].html)[1]));
  await press(visitor.page, "Confirm my address");
  await visitor.page.waitForSelector('main [role="status"]', { timeout: 15000 }).catch(() => {});
  for (const who of ["ben", "cat", "dev", "fay", "gus"]) await call("confirm_subscription", { link_token: tok(LIST[who], "confirm_token") }, PROOF);
  check("confirm: six of the seven who were asked confirm; the one who does not stays as she is", sql(`select count(confirmed_at) || '|' || string_agg(email, ',') filter (where confirmed_at is null) from public.subscribers`) === `7|${CAROL.email}`, sql(`select count(confirmed_at) from public.subscribers`));

  // What a mail service says afterwards. Nothing is believed unsigned.
  const svix = (body, secret = process.env.RESEND_WEBHOOK_SECRET ?? "", at = Math.floor(Date.now() / 1000)) => {
    const id = `msg_${randomBytes(8).toString("hex")}`;
    return { "Content-Type": "application/json", "svix-id": id, "svix-timestamp": String(at), "svix-signature": `v1,${createHmac("sha256", Buffer.from(secret.replace(/^whsec_/, ""), "base64")).update(`${id}.${at}.${body}`).digest("base64")}` };
  };
  const bounce = JSON.stringify({ type: "email.bounced", created_at: new Date().toISOString(), data: { email_id: "56761188-7520-42d8-8898-ff6fc54ce618", to: [LIST.dev], subject: "A subject", bounce: { type: "Permanent", subType: "General", message: "550 5.1.1 The email account that you tried to reach does not exist." } } });
  const hook = (path, body, headers = { "Content-Type": "application/json" }) => fetch(`${origin}/api/email/hook/${path}`, { method: "POST", headers, body });
  const unsigned = await hook("resend", bounce);
  const forged = await hook("resend", bounce, svix(bounce, "whsec_c29tZW9uZSBlbHNlJ3Mgc2VjcmV0"));
  const stale = await hook("resend", bounce, svix(bounce, undefined, Math.floor(Date.now() / 1000) - 3600));
  const altered = await hook("resend", bounce.replace(LIST.dev, LIST.ann), svix(bounce));
  check("webhook: a bounce that is unsigned, signed with another secret, an hour old, or changed after it was signed, is refused and suppresses nobody", [unsigned, forged, stale, altered].every((r) => r.status === 401) && sql(`select count(*) from public.email_suppressions`) === "0", [unsigned, forged, stale, altered].map((r) => r.status).join(" "));
  const signed = await hook("resend", bounce, svix(bounce));
  check("webhook: signed by Resend's rule, a hard bounce keeps the address from being written to, with what was said, and takes its confirmation back", signed.status === 200 && sql(`select reason || '|' || source || '|' || detail from public.email_suppressions where email = '${LIST.dev}'`) === "bounce|resend|General 550 5.1.1 The email account that you tried to reach does not exist." && sql(`select (confirmed_at is null)::text from public.subscribers where email = '${LIST.dev}'`) === "true", `${signed.status} ${await signed.text()}`);
  const soft = JSON.stringify({ type: "email.bounced", data: { to: [LIST.ann], bounce: { type: "Transient", subType: "MailboxFull", message: "Mailbox full" } } });
  const softSaid = await hook("resend", soft, svix(soft));
  check("webhook: a soft bounce, signed, is answered and suppresses nobody", softSaid.status === 200 && sql(`select count(*) from public.email_suppressions`) === "1");
  const mailgunKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY ?? "";
  const mailgunBody = (key, event) => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const token = randomBytes(25).toString("hex");
    return JSON.stringify({ signature: { timestamp, token, signature: createHmac("sha256", key).update(timestamp + token).digest("hex") }, "event-data": event });
  };
  const complaint = { event: "complained", recipient: LIST.gus, timestamp: Date.now() / 1000 };
  const mgForged = await hook("mailgun", mailgunBody("not-the-signing-key", complaint));
  const mgBare = await hook("mailgun", JSON.stringify({ "event-data": complaint }));
  const mgSigned = await hook("mailgun", mailgunBody(mailgunKey, complaint));
  check("webhook: Mailgun's the same: unsigned or signed with another key it is refused for good; signed, a complaint keeps the address from being written to", mgForged.status === 406 && mgBare.status === 406 && mgSigned.status === 200 && sql(`select string_agg(email || ':' || reason || ':' || source, ',' order by email) from public.email_suppressions`) === `${LIST.dev}:bounce:resend,${LIST.gus}:complaint:mailgun`, `${mgForged.status} ${mgBare.status} ${mgSigned.status}`);
  const direct2 = await call("email_event", { provider: "resend", kind: "bounce", address: LIST.ann, detail: "made up" });
  check("webhook: nobody calling the database with the public key can report a bounce of their own making", (direct2.status === 401 || direct2.status === 403) && sql(`select count(*) from public.email_suppressions`) === "2", direct2.status);
  const sentSoFar = outbox.letters.length;
  await go(carol.page, `${origin}/account`);
  await part(carol.page, "list").locator('[name="email"]').fill(LIST.gus);
  await part(carol.page, "list").getByRole("button", { name: "Join the list" }).click();
  await part(carol.page, "list").locator('[role="status"]').waitFor({ timeout: 15000 }).catch(() => {});
  await sleep(1000);
  check("suppressed: joining again through the form does not take an address out of the ones not written to, sends it nothing, and is answered like any other", sql(`select count(*) from public.email_suppressions where email = '${LIST.gus}'`) === "1" && outbox.letters.length === sentSoFar && /Nearly there/.test(await part(carol.page, "list").innerText()), `${outbox.letters.length - sentSoFar} sent`);

  // A note to everyone, sent by the site itself: only the confirmed, never the suppressed, in batches.
  await go(admin, `${origin}/admin/email`);
  await part(admin, "begin").getByRole("button", { name: "Start a message" }).click();
  await admin.waitForURL(/\/admin\/email\/[0-9a-f-]{36}$/, { timeout: 20000 }).catch(() => {});
  const note = campaignOf(admin);
  check("note: a message begun empty is a draft to everyone, with nothing in it and nothing to look at yet", sql(`select kind || '|' || audience || '|' || status || '|' || jsonb_array_length(blocks) from public.email_campaigns where id = '${note}'`) === "note|everyone|draft|0" && /nothing to look at yet/.test(await part(admin, "look").innerText()));
  await part(admin, "ready").getByRole("button", { name: "It is ready" }).click();
  await admin.waitForSelector('section[aria-labelledby="ready"] [role="alert"]', { timeout: 15000 }).catch(() => {});
  check("note: a message with no subject cannot be called ready", /Give the message a subject first/.test(await part(admin, "ready").innerText()) && sql(`select status from public.email_campaigns where id = '${note}'`) === "draft", await part(admin, "ready").innerText());
  const SUBJECT = "A word from biznes.mu";
  await part(admin, "write").locator('[name="subject"]').fill(SUBJECT);
  await part(admin, "write").locator('[name="preheader"]').fill("The list is open.");
  for (const kind of ["A heading", "A paragraph", "A button"]) {
    const before = await admin.locator("main [data-part]").count();
    await part(admin, "write").getByRole("button", { name: kind, exact: true }).click();
    await admin.waitForFunction((n) => document.querySelectorAll("main [data-part]").length === n + 1, before, { timeout: 15000 }).catch(() => {});
  }
  await part(admin, "ready").getByRole("button", { name: "It is ready" }).click();
  await admin.waitForFunction(() => /is not finished/.test(document.querySelector('section[aria-labelledby="ready"] [role="alert"]')?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("note: nor one with a part not filled in: the page says which", /Part 1 of the message is not finished/.test(await part(admin, "ready").innerText()) && sql(`select status from public.email_campaigns where id = '${note}'`) === "draft", await part(admin, "ready").innerText());
  await fill(admin, { "b0.text": "The list is open", "b1.text": "Thank you for joining <b>us</b> & welcome.", "b2.label": "See the directory", "b2.href": "https://biznes.example/directory?from=email&x=1" });
  await part(admin, "write").getByRole("button", { name: "Save the draft" }).click();
  await admin.waitForFunction(() => /The list is open/.test(document.querySelector(".mail-frame")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("note: saving says so, and keeps what was typed in its fields", /Saved\./.test(await part(admin, "write").locator('[role="status"]').innerText().catch(() => "")) && (await admin.locator('main [name="b2.href"]').inputValue()) === "https://biznes.example/directory?from=email&x=1" && (await admin.locator('main [name="subject"]').inputValue()) === SUBJECT);
  check("note: what is typed is words, never markup, on the page and in the message", (await admin.locator(".mail-frame b").count()) === 0 && /Thank you for joining <b>us<\/b> & welcome\./.test(await admin.locator(".mail-frame").first().innerText()) && (await admin.locator(".mail-frame").first().locator("a", { hasText: "See the directory" }).getAttribute("href")) === "https://biznes.example/directory?from=email&x=1");
  await part(admin, "ready").getByRole("button", { name: "It is ready" }).click();
  await admin.waitForSelector('main [data-status="ready"]', { timeout: 15000 }).catch(() => {});
  send = part(admin, "send");
  check("send: with a sender, Send is offered, and the page says who it would go to and who is left out: five, with two kept from being written to and one not confirmed", (await send.getByRole("button", { name: "Send", exact: true }).count()) === 1 && (await send.locator("[data-by-hand]").count()) === 0 && /would go to 5 addresses, with 2 kept from being written to and 1 not confirmed left out/.test((await send.locator("[data-audience]").innerText()).replace(/\s+/g, " ")), await send.locator("[data-audience]").innerText());
  check("look: with a sender the foot carries the reader's own link to leave", /To stop these messages, leave the list/.test(await part(admin, "look").locator(".mail-frame").first().innerText()) && /\/unsubscribe\?token=/.test(await part(admin, "look").locator("[data-plain-text]").innerText()));
  await audit(admin, "email-ready");
  const before = outbox.letters.length;
  await send.getByRole("button", { name: "Send me a test message" }).click();
  await send.locator('form [role="status"]').waitFor({ timeout: 15000 }).catch(() => {});
  check("test: a test message goes to the admin's own address and to nobody else, and writes nothing in the record", outbox.letters.length === before + 1 && outbox.letters.at(-1).to === OWNER.email && outbox.letters.at(-1).subject === `[Test] ${SUBJECT}` && outbox.letters.at(-1).html.includes("Thank you for joining &lt;b&gt;us&lt;/b&gt; &amp; welcome.") && sql(`select count(*) from public.email_recipients where campaign_id = '${note}'`) === "0", outbox.letters.at(-1)?.subject);

  // Send, and stop: the first batch is slow enough to press Stop while it is on its way.
  outbox.delay = 2500;
  await send.getByRole("button", { name: "Send", exact: true }).click();
  await admin.getByRole("button", { name: "Stop", exact: true }).click({ timeout: 20000 }).catch(() => {});
  outbox.delay = 0;
  await admin.waitForFunction(() => /Sending has stopped/.test(document.querySelector("main")?.textContent ?? "") && [...document.querySelectorAll("main button")].some((b) => b.textContent === "Carry on sending"), null, { timeout: 20000 }).catch(() => {});
  check("send: pressing Send writes one row for each address, and the page sends the first batch of two", sql(`select status from public.email_campaigns where id = '${note}'`) === "sending" && tally(note) === "queued=3,sent=2,skipped=3" && sql(`select string_agg(email || ':' || reason, ',' order by email) from public.email_recipients where campaign_id = '${note}' and state = 'skipped'`) === `${CAROL.email}:unconfirmed,${LIST.dev}:suppressed,${LIST.gus}:suppressed`, tally(note));
  check("send: stopped, the batch on its way finished and no other began; the page shows how far it got", outbox.batches.filter((b) => b.letters[0].subject === SUBJECT).length === 1 && /2 sent, 3 waiting, 0 failed, 3 left out, of 8/.test(await part(admin, "send").innerText()) && (await admin.locator("#send-progress").getAttribute("value")) === "5", await part(admin, "send").innerText());
  await audit(admin, "email-sending");
  // The next batch is refused by the sender, whole: the run stops by itself and says what it said.
  outbox.refuse = "The check's own mail service is closed for a moment.";
  await admin.getByRole("button", { name: "Carry on sending" }).click();
  await admin.waitForSelector('section[aria-labelledby="send"] [role="alert"]', { timeout: 20000 }).catch(() => {});
  check("send: a batch the sender refuses fails those two, says what the sender said, and stops the run", tally(note) === "failed=2,queued=1,sent=2,skipped=3" && /The check's own mail service is closed for a moment\./.test(await part(admin, "send").innerText()) && sql(`select bool_and(not unsure and reason like 'The local sender said: The check%')::text from public.email_recipients where campaign_id = '${note}' and state = 'failed'`) === "true", `${tally(note)} | ${await part(admin, "send").locator('[role="alert"]').innerText().catch(() => "")}`);
  // Carried on: the last address goes, and the campaign is sent, with two that failed.
  await admin.getByRole("button", { name: "Carry on sending" }).click();
  check("send: carried on, it takes up where it stopped and finishes", (await stands(note, "sent")) && tally(note) === "failed=2,sent=3,skipped=3", tally(note));
  await admin.waitForSelector('main [data-status="sent"]', { timeout: 15000 }).catch(() => {});
  await audit(admin, "email-sent-with-failures");
  await part(admin, "after").getByRole("button", { name: "Queue the refused again" }).click();
  await admin.waitForSelector('main [data-status="sending"]', { timeout: 15000 }).catch(() => {});
  await admin.getByRole("button", { name: "Carry on sending" }).click();
  check("send: the two the sender refused are queued again by the admin's own press, and go", (await stands(note, "sent")) && tally(note) === "sent=5,skipped=3" && sql(`select count(*) from public.audit_log where action in ('email.campaign_started', 'email.campaign_sent', 'email.campaign_retry') and subject = 'campaign:${note}'`) === "4", tally(note));
  const went = outbox.letters.filter((l) => l.subject === SUBJECT);
  check("send: each of the five has the message once, and nobody else has it: not the unconfirmed address, not the two that bounced or complained", went.length === 5 && new Set(went.map((l) => l.to)).size === 5 && [LIST.ann, LIST.ben, LIST.cat, LIST.fay, EVE].every((email) => went.some((l) => l.to === email)) && sql(`select count(*) || '|' || count(distinct email) from public.email_recipients where campaign_id = '${note}'`) === "8|8", went.map((l) => l.to).join(","));
  const fays = went.find((l) => l.to === LIST.fay);
  check("send: each copy is its reader's own: their link to leave in the foot and in the header, the line after the subject, and both bodies", fays.html.includes(`${new URL(fays.headers["List-Unsubscribe"].slice(1, -1)).origin}/unsubscribe?token=${tok(LIST.fay)}`) && fays.headers["List-Unsubscribe"].endsWith(`/api/email/leave?token=${tok(LIST.fay)}>`) && !went.some((l) => l.to !== LIST.fay && l.html.includes(tok(LIST.fay))) && fays.html.includes("The list is open.") && fays.text.includes("See the directory: https://biznes.example/directory?from=email&x=1") && fays.html.includes('href="https://biznes.example/directory?from=email&amp;x=1"'));
  await admin.waitForSelector('main [data-status="sent"]', { timeout: 15000 }).catch(() => {});
  await go(admin, `${origin}/admin/email/${note}?show=skipped`);
  const record = await part(admin, "record").innerText();
  check("record: who it went to and who was left out, with the reason in words", (await part(admin, "record").locator("tbody tr").count()) === 3 && /Not confirmed/.test(record) && /Not written to: it bounced, complained or asked us/.test(record) && record.includes(LIST.dev) && !record.includes(LIST.ann), record.slice(0, 300));
  await audit(admin, "email-record");
  const recordFile = await (await admin.request.get(`${origin}/admin/email/${note}/export?as=record`)).text();
  check("record: and as a file, every address once", recordFile.trim().split("\n").length === 9 && recordFile.includes(`"${LIST.fay}","Sent","",`) && recordFile.includes(`"${LIST.gus}","Left out","Not written to: it bounced, complained or asked us",`));

  // Leaving in one press, as a mail program does it: a POST to the address in the header, with no cookie.
  const leaveUrl = here(fays.headers["List-Unsubscribe"].slice(1, -1));
  const peeked = await fetch(leaveUrl, { redirect: "manual" });
  check("leave: a plain visit to the address in the header takes nobody off; it leads to the page with its one button", peeked.status === 303 && (peeked.headers.get("location") ?? "").endsWith(`/unsubscribe?token=${tok(LIST.fay)}`) && sql(`select count(*) from public.subscribers where email = '${LIST.fay}'`) === "1", `${peeked.status} ${peeked.headers.get("location")}`);
  const madeUp = await fetch(`${origin}/api/email/leave?token=00000000-0000-4000-8000-00000000dead`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "List-Unsubscribe=One-Click" });
  const pressed = await fetch(leaveUrl, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "List-Unsubscribe=One-Click" });
  const [madeUpSaid, pressedSaid] = [await madeUp.text(), await pressed.text()];
  check("leave: one press takes that address off, with the token alone, and a made-up token is answered in the very same words", pressed.status === 200 && madeUp.status === 200 && madeUpSaid === pressedSaid && sql(`select count(*) from public.subscribers where email = '${LIST.fay}'`) === "0" && sql(`select count(*) from public.subscribers`) === "7" && (await fetch(`${origin}/api/email/leave?token=half`, { method: "POST" })).status === 400, `${pressed.status} ${madeUp.status} ${pressedSaid}`);
  check("leave: the record of what was sent keeps the address as it was", sql(`select state || '|' || (subscriber_id is null) from public.email_recipients where campaign_id = '${note}' and email = '${LIST.fay}'`) === "sent|true");

  // The next message: begun and queued over the API as the superadmin, and sent with script off, a batch a press.
  const second = (await (await asOwner("email_campaign_create", { kind: "note", audience: "everyone", subject: "A second word", preheader: "", blocks: [{ type: "paragraph", text: "Hello again." }] })).json());
  await asOwner("email_campaign_step", { campaign: second, new_status: "ready" });
  check("next: the next message would go to four: the one who left is not on the list, and the others not written to are still left out", JSON.stringify(await (await asOwner("email_audience_counts", { campaign: second, by_hand: false })).json()) === '{"to_send":4,"suppressed":2,"unconfirmed":1}');
  await asOwner("email_queue", { campaign: second });
  const plain = await browser.newContext({ serviceWorkers: process.env.SW === "block" ? "block" : "allow", javaScriptEnabled: false, storageState: await owner.context.storageState() });
  const bare = await plain.newPage();
  await bare.goto(`${origin}/admin/email/${second}`, { waitUntil: "load" });
  check("no script: the page that sends offers one button, and nothing has gone yet", (await bare.locator("main button", { hasText: "Send the first batch" }).count()) === 1 && tally(second) === "queued=4,skipped=3");
  await Promise.all([bare.waitForLoadState("load"), bare.locator("main button", { hasText: "Send the first batch" }).click()]);
  check("no script: one press sends one batch, and the page says how far it has got", tally(second) === "queued=2,sent=2,skipped=3" && /2 sent, 2 waiting/.test(await bare.locator("main").innerText()), tally(second));
  await Promise.all([bare.waitForLoadState("load"), bare.locator("main button", { hasText: "Carry on sending" }).click()]);
  check("no script: the next press sends the next, and the campaign is sent", sql(`select status from public.email_campaigns where id = '${second}'`) === "sent" && tally(second) === "sent=4,skipped=3", tally(second));
  const again = outbox.letters.filter((l) => l.subject === "A second word");
  check("next: the address that left in one press is not written to, nor the one that bounced, the one that complained, nor the unconfirmed one", again.length === 4 && [LIST.fay, LIST.dev, LIST.gus, CAROL.email].every((email) => !again.some((l) => l.to === email)) && new Set(again.map((l) => l.to)).size === 4, again.map((l) => l.to).join(","));
  // With script off the draft is written the same way: a part added, filled and saved by plain forms.
  const third = (await (await asOwner("email_campaign_create", { kind: "magazine", audience: "magazine" })).json());
  await bare.goto(`${origin}/admin/email/${third}`, { waitUntil: "load" });
  await bare.fill('main [name="subject"]', "The first issue");
  await Promise.all([bare.waitForLoadState("load"), bare.locator("main button", { hasText: "A paragraph" }).click()]);
  await bare.fill('main [name="b0.text"]', "It is here.");
  await Promise.all([bare.waitForLoadState("load"), bare.locator("main button", { hasText: "Save the draft" }).click()]);
  check("no script: a message is written with script off: a part added, filled in and saved", sql(`select subject || '|' || (blocks -> 0 ->> 'text') || '|' || jsonb_array_length(blocks) from public.email_campaigns where id = '${third}'`) === "The first issue|It is here.|1" && /It is here\./.test(await bare.locator(".mail-frame").first().innerText()), sql(`select subject || '|' || blocks::text from public.email_campaigns where id = '${third}'`));
  await plain.close();
  await go(admin, `${origin}/admin/email/${third}`);
  await part(admin, "ready").getByRole("button", { name: "Take this message out" }).click();
  await admin.waitForURL(/\/admin\/email\?said=removed/, { timeout: 15000 }).catch(() => {});
  check("email: a draft never sent is taken out, and a message that was sent cannot be", sql(`select count(*) from public.email_campaigns where id = '${third}'`) === "0" && (await asOwner("email_campaign_remove", { campaign: note })).status === 400 && /The message is taken out/.test(await said(admin)));
  text = await admin.locator("main").innerText();
  check("email: the page lists every message with where it stands", /Sent, by hand/.test(text) && /Asking the list to confirm/.test(text) && text.includes(SUBJECT) && text.includes("A second word") && /^\s*4\s*$/m.test(await admin.locator("main .stat .stat-figure").nth(3).innerText()), await admin.locator("main .stat").nth(3).innerText());
  await audit(admin, "admin-email-messages");

  // The list's own page: the counts, the filters, and the addresses not written to.
  await go(admin, `${origin}/admin/subscribers`);
  const figures = (await admin.locator("main .stat .stat-figure").allInnerTexts()).map((f) => f.trim()).join(",");
  check("list: the counts are the list, the confirmed, each wish, and the addresses not written to", figures === "7,4,7,6,2", figures);
  await go(admin, `${origin}/admin/subscribers?state=unconfirmed`);
  const unconfirmed = await admin.locator("main table").first().locator("tbody tr").allInnerTexts();
  check("list: narrowed to the unconfirmed, it shows the one never confirmed and the two whose confirmation a bounce and a complaint took back, each marked", unconfirmed.length === 3 && unconfirmed.some((r) => r.includes(CAROL.email) && /Not confirmed/.test(r) && /Asked on/.test(r)) && unconfirmed.some((r) => r.includes(LIST.dev) && /Not written to/.test(r)), unconfirmed.join(" | ").slice(0, 300));
  await go(admin, `${origin}/admin/subscribers?want=magazine&state=confirmed&q=list.test`);
  check("list: the two filters and the search work together", (await admin.locator("main table").first().locator("tbody tr").count()) === 3 && (await admin.locator('nav[aria-label="Narrow the list"] a[aria-current="true"]').count()) === 2);
  const stop = part(admin, "suppressed");
  await fill(admin, { address: "not an address" });
  await stop.getByRole("button", { name: "Stop writing to this address" }).click();
  await admin.waitForSelector('main [name="address"][aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  await fill(admin, { address: "Someone@Elsewhere.test", why: "Asked by telephone." });
  await stop.getByRole("button", { name: "Stop writing to this address" }).click();
  await admin.waitForFunction(() => /someone@elsewhere\.test/.test(document.querySelector('section[aria-labelledby="suppressed"] table')?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("list: an admin writes down an address that asked not to be written to, with how it asked, and it is on the record", sql(`select reason || '|' || detail || '|' || source from public.email_suppressions where email = 'someone@elsewhere.test'`) === "asked|Asked by telephone.|admin" && sql(`select count(*) from public.audit_log where action = 'email.suppressed'`) === "3" && /Reported by Resend/.test(await stop.innerText()) && /Reported by Mailgun/.test(await stop.innerText()), sql(`select count(*) from public.audit_log where action = 'email.suppressed'`));
  await audit(admin, "admin-subscribers-list");
  await stop.locator("tr", { hasText: "someone@elsewhere.test" }).getByRole("button", { name: /Lift/ }).click();
  await admin.waitForFunction(() => !/someone@elsewhere\.test/.test(document.querySelector('section[aria-labelledby="suppressed"]')?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("list: and lifts it by hand, which is on the record too", sql(`select count(*) from public.email_suppressions`) === "2" && sql(`select count(*) from public.audit_log where action = 'email.unsuppressed'`) === "1");
  const listFile = await (await admin.request.get(`${origin}/admin/subscribers/export`)).text();
  check("list: the file says of each address whether it is confirmed and whether it is written to", listFile.includes(`"${LIST.dev}","yes","yes","${new Date().toISOString().slice(0, 10)}","","It bounced",`) && listFile.includes(`"${LIST.gus}","yes","yes",`) && /"ann@list\.test","yes","yes","[\d-]{10}","[\d-]{10}","",/.test(listFile), listFile.slice(0, 300));

  // With the sender gone again the site says so, and a campaign that was being sent waits.
  await new Promise((done) => listener.close(done));
  listener.closeAllConnections?.();
  await go(admin, `${origin}/admin/email`);
  check("sender: when nothing answers at the local sender's address any more, the site is back to sending nothing, and says so", /Nothing leaves the site/.test(await admin.locator("main").innerText()));
  // The addresses this part put on the list are taken off, so what follows finds the list as it was.
  sql(`delete from public.email_campaigns; delete from public.email_suppressions; delete from public.subscribers;`);
}

// ---------------------------------------------------------------------------------------------
// 7. The owner changes details; the admin verifies, suspends; the superadmin's own pages.
{
  const { page } = alice;
  await go(page, `${origin}/dashboard/${scratch}`);
  check("owner: the name of a verified business cannot be typed over", (await page.locator('main [name="name"][readonly]').count()) === 1);
  await page.locator('main textarea[name="about"]').fill("Cuts, colour and braids. Open late on Fridays.");
  await press(page, "Save the details");
  await page.waitForSelector('main form [role="status"]', { timeout: 15000 }).catch(() => {});
  await go(visitor.page, `${origin}/biz/${scratchSlug}`);
  check("owner: a change to a live business shows on its page at once", /Open late on Fridays/.test(await visitor.page.locator("main").innerText()));
}
{
  const { page } = owner;
  await go(page, `${origin}/account`);
  const ways = await page.locator('main a[href^="/admin"]').evaluateAll((links) => links.map((a) => a.getAttribute("href")));
  check("account: the superadmin is shown every way in, by name", ["/admin", "/admin/ads", "/admin/orders", "/admin/subscribers", "/admin/email", "/admin/leads", "/admin/people", "/admin/settings"].every((href) => ways.includes(href)) && /Running the site/.test(await page.locator("main").innerText()), ways.join(" "));
  await audit(page, "account-superadmin-ways");
  await go(page, `${origin}/admin/people`);
  check("superadmin: everyone is listed with their role", (await page.locator("main article").count()) === 3);
  const me = page.locator("main article", { hasText: OWNER.email });
  await me.locator("select").selectOption("user");
  await me.getByRole("button", { name: "Save the role" }).click();
  await page.waitForSelector('main [role="alert"]', { timeout: 15000 }).catch(() => {});
  check("superadmin: the last superadmin cannot be demoted, and is told why", /last superadmin cannot be demoted/i.test(await said(page)) && sql(`select role from public.profiles where email = '${OWNER.email}'`) === "superadmin", await said(page));
  await go(page, `${origin}/admin/people?q=alice`);
  const onlyAlice = await page.locator("main article").count();
  await go(page, `${origin}/admin/people?q=biznes.test`);
  check("superadmin: people are found by name or by email address", onlyAlice === 1 && (await page.locator("main article").count()) === 3, `${onlyAlice} for alice`);
  await audit(page, "admin-people");
  const her = page.locator("main article", { hasText: ALICE.email });
  await her.locator("select").selectOption("admin");
  await her.getByRole("button", { name: "Save the role" }).click();
  await page.waitForFunction(() => /Saved/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("superadmin: promotes someone to admin", sql(`select role from public.profiles where email = '${ALICE.email}'`) === "admin");

  // The look: one picture kept, a picture of the superadmin's own, a round, and back to the calendar.
  const backdrop = async () => {
    await go(visitor.page, origin);
    return visitor.page.evaluate(() => ({ picture: document.documentElement.getAttribute("data-picture"), image: document.documentElement.style.getPropertyValue("--theme-image"), text: document.querySelector("main")?.innerText ?? "" }));
  };
  const save = async () => {
    await press(page, "Save the look");
    await page.waitForFunction(() => document.querySelector('main form [role="status"], main form [role="alert"]') && !document.querySelector("main button[disabled]"), null, { timeout: 15000 }).catch(() => {});
    await sleep(300);
  };
  const mode = (label) => page.locator('section[aria-labelledby="choose"] label.chip', { hasText: label }).first().click();
  await go(page, `${origin}/admin/settings`);
  const calendar = await backdrop();
  // The pictures the site is built with: ten when this was written, and more may be added.
  const builtIn = await part(page, "pictures").locator("img.thumb").count();
  check("look: the page says what is showing today and how it is chosen", /Showing today/i.test(await page.locator("main").innerText()) && /By the calendar/.test(await page.locator("main .stat").nth(1).innerText()) && (await part(page, "pictures").locator("img.thumb").count()) === builtIn && builtIn >= 10);
  await mode("One picture");
  await save();
  check("look: one picture cannot be kept without choosing which", (await page.locator('main [name="picture"][aria-invalid="true"]').count()) === 1);
  await page.selectOption('main [name="picture"]', "lights");
  await fill(page, { greeting: "Happy testing" });
  await audit(page, "admin-settings");
  await save();
  let now = await backdrop();
  check("superadmin: the picture and the greeting chosen by hand are on the first page at once", now.picture === "lights" && /Happy testing/.test(now.text) && sql(`select mode || '|' || picture from public.site_settings`) === "fixed|lights", JSON.stringify(now).slice(0, 200));

  const upload = part(page, "pictures");
  await upload.locator('[name="label"]').fill("Le Morne at dusk");
  await upload.locator('input[type="file"]').setInputFiles(PICTURES.cover);
  await Promise.all([page.waitForURL(/said=picture/, { timeout: 20000 }).catch(() => {}), upload.locator('button[type="submit"]', { hasText: "Add this picture" }).click()]);
  const own = sql(`select id from public.site_pictures`);
  check("look: the superadmin uploads a picture of their own, into the site's folder", sql(`select (path ~ '^site/backdrop-[a-z0-9]+[.]png$')::text || '|' || label from public.site_pictures`) === "true|Le Morne at dusk" && (await part(page, "pictures").locator("img.thumb").count()) === builtIn + 1 && /Le Morne at dusk/.test(await part(page, "pictures").innerText()), page.url());
  const notTheirs = await alice.page.request.post(`${origin}/admin/settings/upload`, { headers: { origin }, multipart: { label: "Mine", file: { name: "p.png", mimeType: "image/png", buffer: readFileSync(PICTURES.photo) } }, maxRedirects: 0 });
  check("look: nobody else can add one", !/said=picture/.test(notTheirs.headers().location ?? "") && sql(`select count(*) from public.site_pictures`) === "1", `${notTheirs.status()} ${notTheirs.headers().location}`);
  await page.selectOption('main [name="picture"]', own);
  await save();
  now = await backdrop();
  check("look: a picture of their own, kept, is behind every page", now.image.includes("/storage/v1/object/public/media/site/backdrop-") && sql(`select mode || '|' || picture from public.site_settings`) === `fixed|${own}`, now.image);

  await mode("A round");
  await part(page, "choose").locator("fieldset", { hasText: "The round" }).locator("label.chip", { hasText: "Lagoon morning" }).click();
  await save();
  check("look: a round needs two pictures at least", /at least two pictures/.test(await part(page, "choose").innerText()) && sql(`select mode from public.site_settings`) === "fixed");
  await part(page, "choose").locator("fieldset", { hasText: "The round" }).locator("label.chip", { hasText: "Le Morne at dusk" }).click();
  await save();
  now = await backdrop();
  const turn = Math.floor(Date.parse(new Date(Date.now() + 4 * 3600e3).toISOString().slice(0, 10)) / 864e5) % 2;
  check("look: a round of pictures gives today's, the same for everyone", sql(`select mode || '|' || array_to_string(pictures, ',') from public.site_settings`) === `rotation|lagoon,${own}` && (turn === 0 ? now.picture === "lagoon" && now.image.includes("/themes/lagoon") : now.image.includes("/storage/v1/object/public/media/site/")), `${turn} ${now.picture} ${now.image}`);
  await audit(page, "admin-settings-round");
  await part(page, "pictures").getByRole("button", { name: /Remove/ }).click();
  await page.waitForFunction(() => document.querySelectorAll('section[aria-labelledby="pictures"] img.thumb').length === 4, null, { timeout: 15000 }).catch(() => {});
  now = await backdrop();
  check("look: a picture taken out leaves the round, which falls back to the calendar, and its file is gone", sql(`select mode || '|' || cardinality(pictures) || '|' || (select count(*) from public.site_pictures) || '|' || (select count(*) from storage.objects where name like 'site/%') from public.site_settings`) === "calendar|0|0|0" && now.picture === calendar.picture && now.image === calendar.image, sql(`select mode || '|' || cardinality(pictures) from public.site_settings`));
  await go(page, `${origin}/admin/settings`);
  await fill(page, { greeting: "" });
  await save();
  now = await backdrop();
  check("superadmin: handed back, the calendar's look returns", now.picture === calendar.picture && !/Happy testing/.test(now.text) && sql(`select count(*) from public.audit_log where action in ('settings.look', 'picture.added', 'picture.removed')`) !== "0");
}
{
  // Alice is an admin now.
  const { page } = alice;
  const admin = await go(page, `${origin}/admin`);
  check("admin: a promoted person reaches /admin, with its counts as tiles", admin?.status() === 200 && (await page.locator("main .stat").count()) === 4);
  await go(page, `${origin}/account`);
  const ways = await page.locator('main a[href^="/admin"]').evaluateAll((links) => links.map((a) => a.getAttribute("href")));
  check("account: an admin is shown the admin's ways in, and not the superadmin's", ways.includes("/admin/ads") && ways.includes("/admin/orders") && ways.includes("/admin/email") && !ways.includes("/admin/people") && !ways.includes("/admin/settings"), ways.join(" "));
  const people = await go(page, `${origin}/admin/people`);
  check("admin: but not the superadmin's pages", people?.status() === 404 && (await page.goto(`${origin}/admin/settings`))?.status() === 404);
  sql(`update public.catalogue set price_mur = 2 where id = 'plan:grow'`);
  await go(page, `${origin}/admin/orders`);
  check("admin: an admin who is not the superadmin is told the catalogue is behind, and cannot change it", /The superadmin brings them level/.test(await page.locator("main").innerText()) && (await page.locator("main").getByRole("button", { name: "Bring the catalogue level" }).count()) === 0);
  sql(`update public.catalogue set price_mur = 1250 where id = 'plan:grow'`);
  await go(page, `${origin}/admin/leads?town=curepipe&reach=1`);
  const leads = await page.locator("main").innerText();
  check("admin: the listings with no website, by town", /with no website/.test(leads) && (await page.locator("main table tbody tr").count()) > 5);
  await audit(page, "admin-leads");
  const csv = await page.request.get(`${origin}/admin/leads/export?town=curepipe&reach=1`);
  const body = await csv.text();
  check("admin: and as a file", csv.status() === 200 && /text\/csv/.test(csv.headers()["content-type"] ?? "") && body.includes("Name,Kind,Group") && body.split("\n").length > 6, csv.status());

  await go(page, `${origin}/admin?q=zanzibar`);
  const row = part(page, "every").locator("details", { hasText: "Zanzibar Hair Studio" });
  await row.locator("summary").click();
  await row.getByRole("button", { name: "Suspend" }).click();
  await page.waitForSelector('main [name="note"][aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  await audit(page, "admin-every-open");
  await row.locator('[name="note"]').fill("Reported closed. Write to us to put it right.");
  await row.getByRole("button", { name: "Suspend" }).click();
  await page.waitForFunction(() => /Suspended/.test(document.querySelector('section[aria-labelledby="every"]')?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("admin: suspends a business, with a word why", sql(`select status || '|' || status_note from public.businesses where id = '${scratch}'`) === "suspended|Reported closed. Write to us to put it right.");
  const gone = await go(visitor.page, `${origin}/biz/${scratchSlug}`);
  check("public: a suspended business is off the site at once", gone?.status() === 404, gone?.status());
  check("public: and its advertisement, its pictures' record and its place among the guide's sponsors go with it", (await asVisitor("ads?select=id")).length === 0 && (await asVisitor(`showcases?select=business_id&business_id=eq.${scratch}`)).length === 0 && (await asVisitor(`guide_sponsors?select=name&month=eq.${next}`)).length === 0);
  await go(page, `${origin}/admin/ads`);
  check("ads: with its business suspended, the place is empty again", /Nothing is running here this month/.test(await page.locator('[data-place="home"]').innerText()), await page.locator('[data-place="home"]').innerText());
  await go(page, `${origin}/dashboard/${scratch}`);
  const tabs = (await page.locator('nav[aria-label="The parts of this business"] a').allInnerTexts()).map((t) => t.trim());
  check("owner: is told, with the admin's note, and cannot advertise meanwhile", /Reported closed/.test(await page.locator("main").innerText()) && /Suspended/.test(await page.locator("main").innerText()) && !tabs.includes("Advertising"), tabs.join("|"));
  await go(page, `${origin}/dashboard`);
  check("dashboard: the card says what to do about it", /Write to us to put it right/.test(await page.locator("main article", { hasText: "Zanzibar" }).innerText()));

  // An admin who is not its owner removes pictures: one from a business's page, and an advertisement's.
  const boss = owner.page;
  const onPage = () => Number(sql(`select (cover <> '')::int + cardinality(photos) from public.showcases where business_id = '${scratch}'`));
  const [had, files] = [onPage(), kept(`business/${scratch}`)];
  await go(boss, `${origin}/admin?q=zanzibar`);
  const found = part(boss, "every").locator("details", { hasText: "Zanzibar Hair Studio" });
  await found.locator("summary").click();
  check("admin: the pictures on a business's page are shown to an admin", (await found.locator("img.thumb").count()) === had && had === 3, `${had} on the page, ${files} files`);
  await found.getByRole("button", { name: /^Remove\s*: picture 1 of/ }).click();
  for (let i = 0; i < 40 && onPage() === had; i++) await sleep(250);
  for (let i = 0; i < 40 && kept(`business/${scratch}`) === files; i++) await sleep(250);
  check("admin: removes one, from the page and from the bucket, and it is on the record", onPage() === had - 1 && kept(`business/${scratch}`) === files - 1 && sql(`select cover from public.showcases where business_id = '${scratch}'`) === "" && sql(`select count(*) from public.audit_log a join public.profiles p on p.id = a.actor where a.action = 'business.picture_removed' and p.email = '${OWNER.email}'`) === "1", `${onPage()} on the page, ${kept(`business/${scratch}`)} files`);
  await go(boss, `${origin}/admin/ads`);
  const braids = part(boss, "all").locator("article", { hasText: "Braids from Rs 400" });
  await braids.locator("summary", { hasText: "Its picture" }).click();
  await braids.getByRole("button", { name: /^Remove its picture/ }).click();
  await boss.waitForSelector('section[aria-labelledby="all"] [name="why"][aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  check("admin: taking the picture off an advertisement must say why", (await braids.locator('[name="why"][aria-invalid="true"]').count()) === 1 && kept(`ads/${adId}`) === 1);
  await braids.locator('[name="why"]').fill("The picture is not yours to use.");
  await braids.getByRole("button", { name: /^Remove its picture/ }).click();
  for (let i = 0; i < 40 && kept(`ads/${adId}`) > 0; i++) await sleep(250);
  check("admin: the picture is removed from the bucket, the advertisement comes down, and its owner is told why", kept(`ads/${adId}`) === 0 && sql(`select status || '|' || artwork || '|' || reason || '|' || link_url from public.ads where id = '${adId}'`) === "declined||The picture is not yours to use.|" && sql(`select count(*) from public.audit_log where action = 'ad.picture_removed'`) === "1", sql(`select status || '|' || artwork || '|' || reason from public.ads where id = '${adId}'`));
  await audit(boss, "admin-ads-picture-removed");
}

// ---------------------------------------------------------------------------------------------
// 8. A forgotten password.
{
  const { page } = carol;
  await Promise.all([page.waitForURL(`${origin}/`, { timeout: 15000 }).catch(() => {}), page.goto(`${origin}/account`).then(() => press(page, "Sign out"))]);
  await go(page, `${origin}/account/reset`);
  const before = mails();
  await fill(page, { email: CAROL.email });
  await press(page, "Send the link");
  await page.waitForSelector('main [role="status"]', { timeout: 20000 }).catch(() => {});
  check("reset: says a link is on its way, whoever asks", /on its way/i.test(await said(page)), await said(page));
  await audit(page, "reset-sent");
  const link = await linkFor(CAROL.email, before);
  if (link) await go(page, link);
  check("reset: the link lands on the page to choose a new password", new URL(page.url()).pathname === "/account/update-password", page.url());
  await fill(page, { password: "short" });
  await press(page, "Save the new password");
  await page.waitForSelector('main [name="password"][aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  check("reset: a short password is refused on its field", (await page.locator('main [name="password"][aria-invalid="true"]').count()) === 1);
  await audit(page, "update-password-error");
  await fill(page, { password: "carol-password-2" });
  await Promise.all([page.waitForURL(/\/account\?said=password/, { timeout: 15000 }).catch(() => {}), press(page, "Save the new password")]);
  check("reset: saved", /password is changed/i.test(await said(page)), page.url());
  await page.goto(`${origin}/account`).then(() => press(page, "Sign out"));
  await page.waitForURL(`${origin}/`, { timeout: 15000 }).catch(() => {});
  await signIn(page, CAROL, CAROL.password);
  check("reset: the old password no longer signs in", new URL(page.url()).pathname === "/account/sign-in");
  await signIn(page, CAROL, "carol-password-2");
  check("reset: the new one does", new URL(page.url()).pathname === "/account", page.url());
}

{
  // The other kind of link, as the README's email template carries it: it works in any browser.
  await sleep(1500);
  const asker = await person();
  await go(asker.page, `${origin}/account/reset`);
  await fill(asker.page, { email: CAROL.email });
  await press(asker.page, "Send the link");
  await asker.page.waitForSelector('main form [role="status"]', { timeout: 20000 }).catch(() => {});
  const hash = sql(`select recovery_token from auth.users where email = '${CAROL.email}'`);
  const other = await person();
  await openLink(other.page, `${origin}/auth/confirm?token_hash=${hash}&type=recovery&next=/account/update-password`);
  check("reset: a token_hash link opens the page to choose a new password, in another browser", Boolean(hash) && new URL(other.page.url()).pathname === "/account/update-password" && /carol@biznes\.test/.test(await other.page.locator("main").innerText()), other.page.url());
  await asker.context.close();
  await other.context.close();
}

// ---------------------------------------------------------------------------------------------
// 9. With script off, the forms still work.
{
  const context = await browser.newContext({ serviceWorkers: process.env.SW === "block" ? "block" : "allow",  javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${origin}/account/sign-in`, { waitUntil: "load" });
  await page.fill('main [name="email"]', CAROL.email);
  await page.fill('main [name="password"]', "wrong-password");
  await Promise.all([page.waitForLoadState("load"), page.locator("main button[type=submit]").click()]);
  check("no script: a wrong password is still answered on the page", /do not match/i.test(await page.locator("main").innerText()));
  await page.fill('main [name="email"]', CAROL.email);
  await page.fill('main [name="password"]', "carol-password-2");
  await Promise.all([page.waitForURL(/\/account$/, { timeout: 15000 }).catch(() => {}), page.locator("main button[type=submit]").click()]);
  check("no script: signing in works", new URL(page.url()).pathname === "/account", page.url());
  await context.close();
}

// ---------------------------------------------------------------------------------------------
// 10. The upload routes: a form that does not say how large it is, and too many from one connection.
{
  const cookie = (await owner.context.cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
  const unsized = await fetch(`${origin}/admin/settings/upload`, {
    method: "POST",
    headers: { origin, cookie, "content-type": "multipart/form-data; boundary=x" },
    // A body sent as it comes carries no length.
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('--x\r\nContent-Disposition: form-data; name="label"\r\n\r\nNo length\r\n--x--\r\n'));
        controller.close();
      },
    }),
    duplex: "half",
    redirect: "manual",
  });
  check("upload: a form that does not say how large it is is not read", unsized.status === 303 && /problem=failed/.test(unsized.headers.get("location") ?? ""), `${unsized.status} ${unsized.headers.get("location")}`);
  const answers = [];
  for (let i = 0; i < 31; i++) {
    const sent = await owner.page.request.post(`${origin}/admin/settings/upload`, { headers: { origin }, multipart: { label: "One of many", file: { name: "p.png", mimeType: "image/png", buffer: Buffer.from("not a picture at all") } }, maxRedirects: 0 });
    answers.push(sent.headers().location ?? "");
  }
  check("upload: after thirty in ten minutes from one connection, the next is asked to wait, and nothing was kept", /problem=kind/.test(answers[0]) && /problem=busy/.test(answers[30]) && sql(`select count(*) from public.site_pictures`) === "0", `${answers[0]} ... ${answers[30]}`);
}

check("no page raised a script error", errors.length === 0, errors.join(" | "));
check(`accessibility and width: ${audited.length} kinds of account page, at a desk and on a phone`, faults.length === 0, faults.join(" | "));
await browser.close();
console.log(`\n${passed} passed, ${failed} failed.`);
process.exit(failed ? 1 : 0);
