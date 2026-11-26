// The AI answer, checked in a real browser against a production server, with a stand-in for Google.
//
//   npm run build
//   npx next start -p 3100 &
//   node scripts/behaviour-ai.mjs [origin]        (default http://localhost:3100; npm run behaviour:ai)
//
// No key is needed and nothing leaves this machine. The script listens on a port of its own as
// Gemini would (STUB_PORT, default 3198) and starts a second server from the same build that is
// told a made-up key and that address (AI_PORT, default 3102). The server at [origin] has no key:
// it is where "with no key the site is as it was" is checked. Each run names a model of its own,
// so nothing kept by an earlier run answers for this one.
//
// The stand-in answers by the question it is asked: see REPLIES. It keeps every request it was
// sent, so what the site sends to Google is checked as it was sent.
//
// Exits 1 if any check fails. Needs: playwright and @axe-core/playwright (devDependencies).
import AxeBuilder from "@axe-core/playwright";
import { spawn } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { chromium } from "playwright";
import { browserPath, steady } from "./pages.mjs";

const origin = process.argv[2] ?? "http://localhost:3100";
const STUB_PORT = Number(process.env.STUB_PORT) || 3198;
const AI_PORT = Number(process.env.AI_PORT) || 3102;
const withKey = `http://localhost:${AI_PORT}`;
const KEY = "a-made-up-key-for-the-checks";
const MODEL = `stand-in-${Date.now()}`;
let failed = 0;
let passed = 0;
const check = (name, ok, detail = "") => {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "pass" : "FAIL"}  ${name}${ok || !detail ? "" : `  (${detail})`}`);
};

// What the stand-in writes back, by the question it is asked. `good` answers from the first
// passage it was given, in that passage's own words, so every figure in it is one it was shown.
const QUESTIONS = {
  good: "how do I register a company",
  again: "how do I incorporate a company",
  invented: "what is the vat threshold",
  none: "how do I open a bank account",
  link: "how is income tax worked out",
  refused: "how do I get a work permit",
  unsourced: "how do I register for vat",
  who: "pharmacy in curepipe",
  number: "police number",
};
const wrote = (reply) => ({ id: "v1_stand_in", object: "interaction", status: "completed", steps: [{ type: "thought", content: [{ type: "text", text: "not the answer" }] }, { type: "model_output", content: [{ type: "text", text: JSON.stringify(reply) }] }], usage: { total_input_tokens: 900, total_output_tokens: 80, total_thought_tokens: 10, total_tokens: 990 } });
const firstPassage = (input) => /\[1\] [^:]+: ([\s\S]*?)(?:\n\[2\]|$)/.exec(input)?.[1] ?? "";
const sentence = (text) => (/^(.{40,260}?[.;])(?:\s|$)/.exec(text)?.[1] ?? text.slice(0, 200)).trim();
const REPLIES = [
  [QUESTIONS.invented, () => [200, wrote({ answered: true, answer: "The threshold is Rs 987,654,321 a year.", sources: [1] })]],
  [QUESTIONS.none, () => [200, wrote({ answered: false, answer: "", sources: [] })]],
  [QUESTIONS.link, () => [200, wrote({ answered: true, answer: "It is worked out as the article says, see https://example.org for more.", sources: [1] })]],
  [QUESTIONS.refused, () => [429, { error: { code: "quota_exceeded", message: "The day's quota is spent." } }]],
  [QUESTIONS.unsourced, () => [200, wrote({ answered: true, answer: "A business registers once it passes the threshold.", sources: [99] })]],
  ["", (input) => [200, wrote({ answered: true, answer: sentence(firstPassage(input)), sources: [1, 2] })]],
];

const sent = [];
const stub = createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    let asked = null;
    try {
      asked = JSON.parse(body);
    } catch {}
    sent.push({ method: req.method, url: req.url, headers: req.headers, body: asked });
    const input = String(asked?.input ?? "");
    const [status, reply] = REPLIES.find(([question]) => input.toLowerCase().includes(`question: ${question.toLowerCase()}`))[1](input);
    res.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify(reply));
  });
}).listen(STUB_PORT, "127.0.0.1");

// A second server from the same build, told a key and where "Google" is.
const server = spawn("npx", ["next", "start", "-p", String(AI_PORT)], { env: { ...process.env, GEMINI_API_KEY: KEY, GEMINI_MODEL: MODEL, AI_TEST_URL: `http://127.0.0.1:${STUB_PORT}/v1beta/interactions` }, stdio: "ignore", detached: true });
const stop = () => {
  try {
    process.kill(-server.pid);
  } catch {
    server.kill();
  }
  stub.close();
};
let up = false;
for (let i = 0; i < 60 && !up; i++) {
  await new Promise((r) => setTimeout(r, 500));
  up = await fetch(`${withKey}/robots.txt`).then((r) => r.ok, () => false);
}
if (!up) {
  console.log("FAIL  the server with a key did not start");
  stop();
  process.exit(1);
}

/** Asks the endpoint as one connection would. Each check has a connection of its own, so one check's questions are never counted against another's. */
const answerTo = async (base, q, connection = "203.0.113.1") => {
  const response = await fetch(`${base}/api/answer?q=${encodeURIComponent(q)}`, { headers: { "X-Forwarded-For": connection, Cookie: "biznes-auth=a-visitor's-own-cookie" } });
  return { status: response.status, kept: response.headers.get("cache-control") ?? "", ...(await response.json()) };
};

// 1. With no key: the site is as it was.
{
  const off = await answerTo(origin, QUESTIONS.good);
  check("no key: the endpoint says it is off, asks no one, and its word is not kept", off.status === 200 && off.answer === null && off.why === "off" && off.kept === "no-store" && sent.length === 0, JSON.stringify(off));
}

// 2. A question the site's articles answer: asked once, answered from the passages, kept.
{
  const good = await answerTo(withKey, QUESTIONS.good, "203.0.113.2");
  const asked = sent.at(-1);
  check("a question an article answers gets a short answer and the articles it is from", good.status === 200 && typeof good.answer?.text === "string" && good.answer.text.length > 20 && good.answer.sources.length >= 1 && good.answer.sources.every((s) => s.href.startsWith("/learn/") && s.title), JSON.stringify(good).slice(0, 300));
  check("the answer may be kept by the host for a day, so the same address is not run again", /s-maxage=86400/.test(good.kept), good.kept);
  check("the model's thinking is not taken for its answer", !/not the answer/.test(good.answer?.text ?? ""));
  check("what is sent to Google: one POST to its Interactions API, with the key in a header and the revision its examples send", sent.length === 1 && asked.method === "POST" && asked.url === "/v1beta/interactions" && asked.headers["x-goog-api-key"] === KEY && asked.headers["api-revision"] === "2026-05-20", JSON.stringify({ n: sent.length, url: asked?.url }));
  check("what is sent: the model, the brief, the question and numbered passages, and nothing else", asked.body.model === MODEL && /Use only what the passages say/.test(asked.body.system_instruction) && asked.body.input.startsWith(`Question: ${QUESTIONS.good}`) && /\n\[1\] .+: .{40,}/.test(asked.body.input) && Object.keys(asked.body).sort().join(",") === "generation_config,input,model,response_format,store,system_instruction", Object.keys(asked.body).join(","));
  check("what is sent: Google is asked not to keep it, to think as little as it can and to write no more than it is allowed", asked.body.store === false && asked.body.generation_config.thinking_level === "minimal" && asked.body.generation_config.max_output_tokens <= 400 && asked.body.response_format.mime_type === "application/json" && asked.body.response_format.schema.required.join(",") === "answered,answer,sources", JSON.stringify(asked.body.generation_config));
  check("what is sent: nothing that says who asked: no address, no cookie, no browser", !asked.headers["x-forwarded-for"] && !asked.headers.cookie && !/203\.0\.113/.test(JSON.stringify(asked.body)) && !/Mozilla|Chrome/.test(asked.headers["user-agent"] ?? ""), JSON.stringify(asked.headers));
  const passages = asked.body.input.split("\nPassages:\n")[1] ?? "";
  check("what is sent is short: five passages at most, each cut to length", (passages.match(/^\[\d\] /gm) ?? []).length <= 5 && passages.length <= 5 * 1600 && asked.body.input.length < 9000, `${passages.length} characters`);
  const before = sent.length;
  const second = await answerTo(withKey, QUESTIONS.good, "203.0.113.3");
  const shouted = await answerTo(withKey, `  ${QUESTIONS.good.toUpperCase()}  `, "203.0.113.3");
  check("the same question again, from anyone, in any case, is answered from what was kept: Google is not asked twice", sent.length === before && second.answer?.text === good.answer?.text && shouted.answer?.text === good.answer?.text, `${sent.length - before} more`);
}

// 3. Questions it is never asked.
{
  const before = sent.length;
  const who = await answerTo(withKey, QUESTIONS.who, "203.0.113.4");
  const number = await answerTo(withKey, QUESTIONS.number, "203.0.113.4");
  const long = await answerTo(withKey, `how ${"very ".repeat(40)}long`, "203.0.113.4");
  const nothing = await answerTo(withKey, "zzqx plorf", "203.0.113.4");
  check("a question about who and where is not put to the model: the list is the answer", who.answer === null && who.why === "gate", JSON.stringify(who));
  check("nor is one a number to call already answers, nor one too long, nor one the site has nothing on", number.why === "gate" && long.why === "gate" && nothing.why === "gate" && sent.length === before, JSON.stringify([number.why, long.why, nothing.why, sent.length - before]));
}

// 4. The site's own check on what the model wrote.
{
  const invented = await answerTo(withKey, QUESTIONS.invented, "203.0.113.5");
  check("an answer with a figure that is in none of the passages is thrown away whole", invented.answer === null && invented.why === "unsupported", JSON.stringify(invented));
  const link = await answerTo(withKey, QUESTIONS.link, "203.0.113.5");
  check("so is an answer that carries a link", link.answer === null && link.why === "unsupported", JSON.stringify(link));
  const unsourced = await answerTo(withKey, QUESTIONS.unsourced, "203.0.113.5");
  check("so is an answer that names no passage it was given", unsourced.answer === null && unsourced.why === "unsupported", JSON.stringify(unsourced));
  const none = await answerTo(withKey, QUESTIONS.none, "203.0.113.5");
  check("where the model finds no answer in the passages there is none, and that finding is kept too", none.answer === null && none.why === "none" && /s-maxage/.test(none.kept), JSON.stringify(none));
  const before = sent.length;
  await answerTo(withKey, QUESTIONS.none, "203.0.113.6");
  check("a question with no answer is not asked of Google twice either", sent.length === before);
}

// 5. Google says no.
{
  const refused = await answerTo(withKey, QUESTIONS.refused, "203.0.113.7");
  check("when Google refuses there is no answer, its short code is given as the reason, and nothing is kept", refused.status === 200 && refused.answer === null && refused.why === "upstream 429 quota_exceeded" && refused.kept === "no-store", JSON.stringify(refused));
  const before = sent.length;
  await answerTo(withKey, QUESTIONS.refused, "203.0.113.7");
  check("so the question is asked again the next time", sent.length === before + 1);
}

// 6. One connection may put only so many new questions.
{
  const folder = new URL("../content/guides/", import.meta.url);
  const titles = readdirSync(folder).filter((name) => name.endsWith(".json")).map((name) => JSON.parse(readFileSync(new URL(name, folder), "utf8")).title).filter(Boolean);
  const before = sent.length;
  const outcomes = [];
  for (const title of titles.slice(0, 26)) outcomes.push(await answerTo(withKey, `what is ${title.toLowerCase()}`.slice(0, 150), "203.0.113.8"));
  const asked = sent.length - before;
  const refused = outcomes.filter((o) => o.status === 429 && o.why === "limit");
  check("one connection may put twenty new questions to the model in ten minutes, and then is refused", asked === 20 && refused.length >= 1 && refused.every((o) => o.kept === "no-store"), `${asked} asked, ${refused.length} refused of ${outcomes.length}`);
  const other = await answerTo(withKey, QUESTIONS.again, "203.0.113.9");
  check("another connection is not held to that count", other.status === 200 && other.answer !== null, JSON.stringify(other).slice(0, 160));
  const kept = await answerTo(withKey, QUESTIONS.good, "203.0.113.8");
  check("and a kept answer is still given to the one that was refused", kept.status === 200 && kept.answer !== null);
}

// 7. On the page.
const browser = await chromium.launch({ executablePath: browserPath() });
for (const [size, viewport] of [["desk", { width: 1440, height: 900 }], ["phone", { width: 390, height: 844 }]]) {
  const context = await steady(await browser.newContext({ viewport, reducedMotion: "reduce" }));
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // The answer is held back a moment, so the card is seen while it waits.
  await page.route("**/api/answer**", async (route) => {
    await new Promise((r) => setTimeout(r, 700));
    await route.continue();
  });
  await page.goto(`${withKey}/search?q=${encodeURIComponent(QUESTIONS.good)}`, { waitUntil: "domcontentloaded" });
  const waiting = await page.evaluate(() => {
    const card = document.querySelector("main .ai-answer");
    const next = document.querySelector("main #r-guides");
    return card ? { busy: card.getAttribute("aria-busy"), label: card.querySelector("h2")?.textContent.trim(), says: card.querySelector('[role="status"]')?.textContent.trim(), above: Boolean(next) && card.compareDocumentPosition(next) === Node.DOCUMENT_POSITION_FOLLOWING, nextTop: Math.round(next?.getBoundingClientRect().top ?? 0) } : null;
  });
  check(`${size}: where an answer is likely the card is on the page from the start, waiting, at the head of the site's own pages that answer`, waiting?.busy === "true" && waiting.label === "AI answer" && waiting.says === "Reading our articles for a short answer" && waiting.above, JSON.stringify(waiting));
  await page.waitForSelector("main .ai-answer .ai-said", { timeout: 15000 }).catch(() => {});
  const said = await page.evaluate(() => {
    const card = document.querySelector("main .ai-answer");
    return card ? { busy: card.getAttribute("aria-busy"), text: card.querySelector(".ai-said p")?.textContent ?? "", sources: [...card.querySelectorAll(".ai-said a")].map((a) => a.getAttribute("href")), note: card.querySelector(".ai-said p:last-child")?.textContent ?? "", live: card.querySelector("[aria-live]")?.getAttribute("aria-live"), nextTop: Math.round(document.querySelector("main #r-guides")?.getBoundingClientRect().top ?? 0), wide: document.documentElement.scrollWidth - innerWidth } : null;
  });
  check(`${size}: the answer comes into the card, with the articles it is from as links, and a plain word that a machine wrote it and may be wrong`, said?.busy === "false" && said.text.length > 20 && said.sources.length >= 1 && said.sources.every((href) => href.startsWith("/learn/")) && /Written by a machine/.test(said.note) && /can be wrong/.test(said.note) && said.live === "polite", JSON.stringify(said).slice(0, 300));
  // The card waits at the height of a short answer, so the most that can move below it is the few lines a longer answer adds.
  check(`${size}: the card was there from the start, so when the answer comes what is below it moves by a few lines at most, and the page is no wider than the screen`, (said?.nextTop ?? 0) - (waiting?.nextTop ?? -999) <= 140 && said.wide <= 0, `${waiting?.nextTop} then ${said?.nextTop}`);
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  check(`${size}: the page with its answer is clean under axe-core, WCAG 2.2 AA`, violations.length === 0, violations.map((v) => `${v.id} (${v.nodes[0]?.target})`).join("; "));
  await page.goto(`${withKey}/search?q=${encodeURIComponent(QUESTIONS.none)}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  check(`${size}: where the model has no answer the card goes, and the page is the site's own answers`, (await page.locator("main .ai-answer").count()) === 0 && (await page.locator("main #r-guides").count()) === 1);
  await page.goto(`${withKey}/search?q=${encodeURIComponent(QUESTIONS.who)}`, { waitUntil: "networkidle" });
  check(`${size}: a question about who and where has no card at all`, (await page.locator("main .ai-answer").count()) === 0 && (await page.locator("main article[data-listing]").count()) > 0);
  await page.goto(`${withKey}/search?q=${encodeURIComponent(QUESTIONS.good)}&kind=guide`, { waitUntil: "networkidle" });
  check(`${size}: nor has a tab of the results`, (await page.locator("main .ai-answer").count()) === 0);
  check(`${size}: no page raised an error`, errors.length === 0, errors[0]);
  await context.close();
}
{
  const plain = await steady(await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } }));
  const still = await plain.newPage();
  const before = sent.length;
  await still.goto(`${withKey}/search?q=${encodeURIComponent(QUESTIONS.again)}`, { waitUntil: "load" });
  check("no script: the card is not shown, the model is not asked, and the site's own answers are there", !(await still.locator("main .ai-answer").isVisible()) && sent.length === before && (await still.locator("main #r-guides").count()) === 1);
  await plain.close();
  const keyless = await steady(await browser.newContext({ viewport: { width: 1440, height: 900 } }));
  const page = await keyless.newPage();
  await page.goto(`${origin}/search?q=${encodeURIComponent(QUESTIONS.good)}`, { waitUntil: "networkidle" });
  check("no key: the results page has no card, and is as it was", (await page.locator("main .ai-answer").count()) === 0 && (await page.locator("main #r-guides").count()) === 1);
  await keyless.close();
}
await browser.close();
stop();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
