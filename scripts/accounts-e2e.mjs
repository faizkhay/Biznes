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
// Needs: playwright and @axe-core/playwright (devDependencies), psql.
import AxeBuilder from "@axe-core/playwright";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
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
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
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
const said = async (page) => (await page.locator('main [role="alert"], main [role="status"]').allInnerTexts()).join(" | ");
const fill = async (page, fields) => {
  for (const [name, value] of Object.entries(fields)) await page.fill(`main [name="${name}"]`, value);
};
const press = (page, label) => page.locator("main").getByRole("button", { name: label, exact: true }).first().click();
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
  check("visitor: the header offers Sign in", (await page.locator('header a[href="/account/sign-in"]').count()) === 1);
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
  check("confirm: the first person to sign up is the superadmin", sql(`select role from public.profiles where email = '${OWNER.email}'`) === "superadmin" && /superadmin/i.test(await page.locator("main").innerText()));
  const cookies = await page.context().cookies();
  const session = cookies.filter((c) => c.name === "biznes-auth" || c.name.startsWith("biznes-auth."));
  check("session: kept in cookies no script can read", session.length > 0 && session.every((c) => c.httpOnly && c.sameSite === "Lax"), JSON.stringify(session.map((c) => [c.name, c.httpOnly, c.sameSite])));
  check("session: the marker says only that someone is signed in", cookies.find((c) => c.name === "biznes-in")?.value === "1");
  await page.waitForSelector('header a[href="/account"]', { timeout: 10000 }).catch(() => {});
  check("header: the initial, as a way to the account", (await page.locator('header a[href="/account"]').innerText().catch(() => "")).trim() === "F");
  check("account: a superadmin is shown the way to Admin", (await page.locator('main a[href="/admin"]').count()) === 1);
  await audit(page, "account-superadmin");

  // The profile.
  await fill(page, { name: "Faiz", phone: "12" });
  await press(page, "Save");
  await page.waitForSelector('main [name="phone"][aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  check("profile: a wrong telephone number is said on its field", (await page.locator('main [name="phone"][aria-invalid="true"]').count()) === 1);
  await fill(page, { name: "Faiz", phone: "+230 5450 8600" });
  await press(page, "Save");
  await page.waitForSelector('main [role="status"]', { timeout: 15000 }).catch(() => {});
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
  await go(fresh.page, `${origin}/auth/confirm?token_hash=${hash}&type=email&next=/dashboard/new`);
  check("confirm: a token_hash link works in a browser that never asked for it", new URL(fresh.page.url()).pathname === "/dashboard/new", fresh.page.url());
  await go(fresh.page, `${origin}/auth/confirm?token_hash=${hash}&type=email`);
  await fresh.context.close();
  const again = await person();
  await go(again.page, `${origin}/auth/confirm?token_hash=${hash}&type=email`);
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
  check("admin: the queue holds both, with the owner to reach", /Zanzibar Hair Studio/.test(main) && /A claim on the listing/.test(main) && main.includes(ALICE.email));
  await audit(page, "admin-queue");
  const card = (name) => page.locator("#queue").locator("xpath=..").locator("article", { hasText: name });
  await card("Zanzibar Hair Studio").getByRole("button", { name: "Do not accept" }).click();
  await page.waitForSelector('main [name="note"][aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  check("admin: a rejection must say why", (await page.locator('main [name="note"][aria-invalid="true"]').count()) === 1);
  await card("Zanzibar Hair Studio").getByRole("button", { name: "Approve" }).click();
  await page.waitForFunction(() => !document.querySelector("#queue")?.parentElement?.textContent?.includes("Zanzibar Hair Studio"), null, { timeout: 15000 }).catch(() => {});
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
  const request = page.locator("#plans").locator("xpath=..").locator("article", { hasText: "Zanzibar Hair Studio" });
  check("admin: the request for a plan is listed", (await request.count()) === 1 && /Biznes Grow/.test(await request.innerText()));
  await request.getByRole("button", { name: "Switch the plan on" }).click();
  await page.waitForFunction(() => /No request is open/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("admin: the plan is on, with its last day, and the business verified", /^grow\|true\|\d{4}-\d{2}-\d{2}$/.test(sql(`select plan || '|' || verified || '|' || plan_until from public.businesses where id = '${scratch}'`)), sql(`select plan || '|' || verified || '|' || plan_until from public.businesses where id = '${scratch}'`));
  check("admin: it is on the record under their name", sql(`select count(*) from public.audit_log a join public.profiles p on p.id = a.actor where p.email = '${OWNER.email}' and a.action in ('business.status', 'business.plan', 'plan_request.done')`) === "4");
  check("admin: the record is shown", /Zanzibar Hair Studio: Biznes Grow/.test(await page.locator("#record").locator("xpath=..").innerText()));

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
// 6. Biznes Grow: services, and a booking from a visitor.
{
  const { page } = alice;
  await go(page, `${origin}/dashboard/${scratch}`);
  check("grow: the dashboard now has services and bookings", (await page.locator("#services").count()) === 1 && (await page.locator("#bookings").count()) === 1);
  const add = page.locator("main .card", { hasText: "Add a service" });
  await add.getByRole("button", { name: "Add this service" }).click();
  await page.waitForSelector('main [name="name"][aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  await add.locator('[name="name"]').fill("Cut and blow dry");
  await add.locator('[name="price"]').fill("six hundred");
  await add.getByRole("button", { name: "Add this service" }).click();
  await page.waitForSelector('main [name="price"][aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  check("grow: a price that is not a number is said on its field", (await add.locator('[name="price"][aria-invalid="true"]').count()) === 1);
  await add.locator('[name="price"]').fill("600");
  await add.locator('[name="minutes"]').fill("45");
  await add.getByRole("button", { name: "Add this service" }).click();
  await page.waitForFunction(() => /Rs 600/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("grow: the service is added", sql(`select name || '|' || price_mur || '|' || minutes || '|' || active from public.services where business_id = '${scratch}'`) === "Cut and blow dry|600|45|true");
}
const tomorrow = new Date(Date.now() + 4 * 3600e3 + 2 * 864e5).toISOString().slice(0, 10);
{
  const { page } = visitor;
  await go(page, `${origin}/biz/${scratchSlug}`);
  const text = await page.locator("main").innerText();
  check("public: the page shows the mark, the service and its price", /Verified/.test(text) && /Priority listing/.test(text) && /Cut and blow dry/.test(text) && /Rs 600/.test(text) && /45 minutes/.test(text));
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
  await go(page, `${origin}/biz/${scratchSlug}`);
  await fill(page, { date: tomorrow, time: "16:00", name: "Carol Customer", phone: "+230 5999 0002" });
  await press(page, "Ask for a booking");
  await page.waitForSelector('main form [role="status"]', { timeout: 15000 }).catch(() => {});
  check("booking: signed in, it is kept with the account", /kept in your account/i.test(await said(page)) && sql(`select (customer_id = (select id from public.profiles where email = '${CAROL.email}'))::text from public.bookings where name = 'Carol Customer'`) === "true", await said(page));
  await go(page, `${origin}/account`);
  check("account: the booking is listed, with the business's name", /Zanzibar Hair Studio/.test(await page.locator("#bookings").locator("xpath=..").innerText()) && /Requested/.test(await page.locator("#bookings").locator("xpath=..").innerText()));
  await audit(page, "account-bookings");
}
{
  const { page } = alice;
  await go(page, `${origin}/dashboard/${scratch}`);
  const section = page.locator("#bookings").locator("xpath=..");
  check("grow: the owner sees both requests, with the numbers to call", /Dev Ramdin/.test(await section.innerText()) && /Carol Customer/.test(await section.innerText()) && /\+230 5999 0001/.test(await section.innerText()));
  await audit(page, "business-grow");
  await section.locator("article", { hasText: "Dev Ramdin" }).getByRole("button", { name: "Confirm" }).click();
  await page.waitForFunction(() => /Confirmed, 1/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("grow: a request is confirmed", sql(`select status from public.bookings where name = 'Dev Ramdin'`) === "confirmed");
  await section.locator("article", { hasText: "Dev Ramdin" }).getByRole("button", { name: "Mark as done" }).click();
  await page.waitForFunction(() => !/Confirmed, 1/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("grow: and marked done", sql(`select status from public.bookings where name = 'Dev Ramdin'`) === "done");
}
{
  const { page } = carol;
  await go(page, `${origin}/account`);
  await press(page, "Cancel this booking");
  await page.waitForFunction(() => /Cancelled/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("account: the customer cancels their own booking", sql(`select status from public.bookings where name = 'Carol Customer'`) === "cancelled");
  const peek = await go(page, `${origin}/dashboard/${scratch}`);
  check("user: another owner's business is not there for them", peek?.status() === 404, peek?.status());
}

// ---------------------------------------------------------------------------------------------
// 6b. How to pay by MCB Juice, the limit on requests from one number, and the honeypot.
{
  const { page } = alice;
  await go(page, `${origin}/dashboard/${scratch}`);
  const pay = page.locator("#pay").locator("xpath=..");
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
// 6c. Asking for a plan from the dashboard: taken back, declined, asked again, switched on.
const claimedBiz = sql(`select id from public.businesses where listing_id = '${claimedId}'`);
{
  const { page } = alice;
  await go(page, `${origin}/dashboard`);
  const row = page.locator("main article", { hasText: /Keiffel/i });
  check("dashboard: a live claimed listing on the free plan says so quietly, and offers the paid plans", /Claimed by its owner/.test(await row.innerText()) && /Ask for Biznes Go or Biznes Grow/.test(await row.innerText()));
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
    await admin.locator("#plans").locator("xpath=..").locator("article", { hasText: /Keiffel/i }).getByRole("button", { name: button }).click();
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
    const found = admin.locator("#every").locator("xpath=..").locator("details", { hasText: /Keiffel/i });
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
}

// ---------------------------------------------------------------------------------------------
// 6d. A business that is not accepted, sent back, and then taken out by its owner.
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
  const card = admin.locator("#queue").locator("xpath=..").locator("article", { hasText: "Carol Cakes" });
  await card.locator('[name="note"]').fill("Tell us the street it is on.");
  await card.getByRole("button", { name: "Do not accept" }).click();
  await admin.waitForFunction(() => /No business is waiting/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  await go(page, `${origin}/dashboard/${cakes}`);
  check("owner: a business that is not accepted says why", sql(`select status from public.businesses where id = '${cakes}'`) === "rejected" && /Not accepted/.test(await page.locator("main").innerText()) && /Tell us the street it is on/.test(await page.locator("main").innerText()));
  await fill(page, { address: "5 Mango Lane" });
  await press(page, "Save the details");
  await page.waitForFunction(() => /sent back to us/.test(document.querySelector("main")?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("owner: saving it sends it back to be checked again", sql(`select status || '|' || status_note || '|' || address from public.businesses where id = '${cakes}'`) === "pending||5 Mango Lane");
  await page.locator("main summary", { hasText: "Remove this business" }).click();
  await press(page, "Remove it for good");
  await page.waitForSelector('main [name="sure"][aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  check("owner: removing a business asks them to be sure", (await page.locator('main [name="sure"][aria-invalid="true"]').count()) === 1 && sql(`select count(*) from public.businesses where id = '${cakes}'`) === "1");
  await page.locator('main [name="sure"]').check();
  await Promise.all([page.waitForURL(/\/dashboard\?said=removed/, { timeout: 15000 }).catch(() => {}), press(page, "Remove it for good")]);
  check("owner: and then takes it out for good", sql(`select count(*) from public.businesses where id = '${cakes}'`) === "0" && /has been taken out/.test(await said(page)), page.url());
}

// ---------------------------------------------------------------------------------------------
// 7. The owner changes details; the admin verifies, suspends; the superadmin's own pages.
{
  const { page } = alice;
  await go(page, `${origin}/dashboard/${scratch}`);
  check("owner: the name of a verified business cannot be typed over", (await page.locator('main [name="name"][readonly]').count()) === 1);
  await page.locator('main textarea[name="about"]').fill("Cuts, colour and braids. Open late on Fridays.");
  await press(page, "Save the details");
  await page.waitForSelector('main [role="status"]', { timeout: 15000 }).catch(() => {});
  await go(visitor.page, `${origin}/biz/${scratchSlug}`);
  check("owner: a change to a live business shows on its page at once", /Open late on Fridays/.test(await visitor.page.locator("main").innerText()));
}
{
  const { page } = owner;
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

  await go(page, `${origin}/admin/settings`);
  await page.selectOption('main [name="picture"]', "lights");
  await fill(page, { greeting: "Happy testing" });
  await audit(page, "admin-settings");
  await press(page, "Save the look");
  await page.waitForSelector('main [role="status"]', { timeout: 15000 }).catch(() => {});
  await go(visitor.page, origin);
  check("superadmin: the picture and the greeting chosen by hand are on the first page at once", (await visitor.page.getAttribute("html", "data-picture")) === "lights" && /Happy testing/.test(await visitor.page.locator("main").innerText()), await visitor.page.getAttribute("html", "data-picture"));
  await page.selectOption('main [name="picture"]', "");
  await fill(page, { greeting: "" });
  await press(page, "Save the look");
  await page.waitForFunction(() => document.querySelector('main [role="status"]') && !document.querySelector("main button[disabled]"), null, { timeout: 15000 }).catch(() => {});
  await sleep(500);
  await go(visitor.page, origin);
  check("superadmin: handed back, the calendar's look returns", (await visitor.page.getAttribute("html", "data-picture")) !== null && !/Happy testing/.test(await visitor.page.locator("main").innerText()));
}
{
  // Alice is an admin now.
  const { page } = alice;
  const admin = await go(page, `${origin}/admin`);
  check("admin: a promoted person reaches /admin", admin?.status() === 200 && /At a glance/.test(await page.locator("main").innerText()));
  const people = await go(page, `${origin}/admin/people`);
  check("admin: but not the superadmin's pages", people?.status() === 404 && (await page.goto(`${origin}/admin/settings`))?.status() === 404);
  await go(page, `${origin}/admin/leads?town=curepipe&reach=1`);
  const leads = await page.locator("main").innerText();
  check("admin: the listings with no website, by town", /with no website/.test(leads) && (await page.locator("main table tbody tr").count()) > 5);
  await audit(page, "admin-leads");
  const csv = await page.request.get(`${origin}/admin/leads/export?town=curepipe&reach=1`);
  const body = await csv.text();
  check("admin: and as a file", csv.status() === 200 && /text\/csv/.test(csv.headers()["content-type"] ?? "") && body.includes("Name,Kind,Group") && body.split("\n").length > 6, csv.status());

  await go(page, `${origin}/admin?q=zanzibar`);
  const row = page.locator("#every").locator("xpath=..").locator("details", { hasText: "Zanzibar Hair Studio" });
  await row.locator("summary").click();
  await row.getByRole("button", { name: "Suspend" }).click();
  await page.waitForSelector('main [name="note"][aria-invalid="true"]', { timeout: 15000 }).catch(() => {});
  await audit(page, "admin-every-open");
  await row.locator('[name="note"]').fill("Reported closed. Write to us to put it right.");
  await row.getByRole("button", { name: "Suspend" }).click();
  await page.waitForFunction(() => /Suspended/.test(document.querySelector("#every")?.parentElement?.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  check("admin: suspends a business, with a word why", sql(`select status || '|' || status_note from public.businesses where id = '${scratch}'`) === "suspended|Reported closed. Write to us to put it right.");
  const gone = await go(visitor.page, `${origin}/biz/${scratchSlug}`);
  check("public: a suspended business is off the site at once", gone?.status() === 404, gone?.status());
  await go(page, `${origin}/dashboard/${scratch}`);
  check("owner: is told, with the admin's note", /Reported closed/.test(await page.locator("main").innerText()) && /Suspended/.test(await page.locator("main").innerText()));
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
  await go(other.page, `${origin}/auth/confirm?token_hash=${hash}&type=recovery&next=/account/update-password`);
  check("reset: a token_hash link opens the page to choose a new password, in another browser", Boolean(hash) && new URL(other.page.url()).pathname === "/account/update-password" && /carol@biznes\.test/.test(await other.page.locator("main").innerText()), other.page.url());
  await asker.context.close();
  await other.context.close();
}

// ---------------------------------------------------------------------------------------------
// 9. With script off, the forms still work.
{
  const context = await browser.newContext({ javaScriptEnabled: false });
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

check("no page raised a script error", errors.length === 0, errors.join(" | "));
check(`accessibility and width: ${audited.length} kinds of account page, at a desk and on a phone`, faults.length === 0, faults.join(" | "));
await browser.close();
console.log(`\n${passed} passed, ${failed} failed.`);
process.exit(failed ? 1 : 0);
