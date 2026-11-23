#!/usr/bin/env node
// The site's own email, checked without a database, a browser or a mail service.
//
//   node scripts/email-unit.mjs
//
// It runs the very files the site runs (src/lib/accounts/email): a message's HTML and its
// plain-text twin, the colours against the site's tokens, the two real senders against the shapes
// of answer their documentation records, the local sender, and the two webhook signatures.
//
// Neither Resend nor Mailgun is called. Their answers here are the ones their documentation shows
// (read on 23 November 2026; each sender's file names the pages), handed back by a stand-in for
// `fetch` that also keeps what it was asked, so the request itself is checked. Whether a real
// account answers the same way is not proved here, and cannot be without one.
//
// Needs: typescript (a devDependency), Node 22.15 or newer. Exits 1 if any check fails.
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// The site's files are TypeScript, name each other without an ending, and reach the rest of the
// site through "@/". Node is taught those three things, for this run only.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") return { url: "data:text/javascript,export {}", shortCircuit: true };
    const wanted = specifier.startsWith("@/") ? pathToFileURL(join(root, "src", specifier.slice(2))).href : specifier;
    try {
      return next(wanted, context);
    } catch (error) {
      for (const ending of [".ts", ".tsx", "/index.ts"]) {
        try {
          return next(wanted + ending, context);
        } catch {
          // Try the next ending.
        }
      }
      throw error;
    }
  },
  load(url, context, next) {
    if (!/\.tsx?$/.test(url)) return next(url, context);
    const source = ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, verbatimModuleSyntax: false } }).outputText;
    return { format: "module", source, shortCircuit: true };
  },
});

process.env.NEXT_PUBLIC_SITE_URL = "https://biznes.example";
const at = (file) => pathToFileURL(join(root, "src/lib/accounts/email", file)).href;
const { TOKENS, LIGHT, DARK, LINE_ON_WHITE, LINE_ON_SWELL } = await import(at("palette.ts"));
const { render, toDocument, toText, toHtml, drawBody, personal, LEAVE_MARK, CONFIRM_MARK } = await import(at("render.ts"));
const { senderFrom, batchSize, fromLine } = await import(at("sender.ts"));
const { RESEND_BATCH_URL } = await import(at("resend.ts"));
const { mailgunUrl } = await import(at("mailgun.ts"));
const { localUrl } = await import(at("local.ts"));
const { verifySvix, verifyMailgun, resendEvents, mailgunEvents } = await import(at("hooks.ts"));
const { confirmMessage, drawCampaign, lettersFor, frameOf, messageOf, leavePage, leaveInOnePress } = await import(at("message.ts"));
const { blockProblem, isButtonHref, soundBlocks, emptyBlock } = await import(at("types.ts"));

let passed = 0;
let failed = 0;
const check = (name, ok, detail = "") => {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "pass" : "FAIL"}  ${name}${ok || !detail ? "" : `  (${String(detail).slice(0, 400)})`}`);
};

// ---------------------------------------------------------------------------------------------
// 1. The colours are the site's own.
{
  const css = readFileSync(join(root, "src/app/globals.css"), "utf8");
  const token = (name) => new RegExp(`--palette-${name}:\\s*(#[0-9a-f]{6})`).exec(css)?.[1];
  const off = Object.entries(TOKENS).filter(([name, value]) => token(name) !== value);
  check("palette: every colour of a message is a token of the site, by the same name and the same value", off.length === 0, off.map(([n, v]) => `${n} ${v} is ${token(n)} on the site`).join("; "));
  const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const over = (top, share, ground) => `#${channels(top).map((c, i) => Math.round(c * share + channels(ground)[i] * (1 - share)).toString(16).padStart(2, "0")).join("")}`;
  check("palette: the hairline on the card is the site's own line (ink at 10%) laid on white", over(TOKENS.ink, 0.1, TOKENS.white) === LINE_ON_WHITE, over(TOKENS.ink, 0.1, TOKENS.white));
  check("palette: and on the dark card, white at 16% laid on swell", over(TOKENS.white, 0.16, TOKENS.swell) === LINE_ON_SWELL, over(TOKENS.white, 0.16, TOKENS.swell));
  const measured = new Set(JSON.parse(readFileSync(join(root, "scripts/contrast.pairs.json"), "utf8")).map((p) => `${p.text} on ${p.on}`));
  const used = [
    [LIGHT.ink, LIGHT.card], [LIGHT.soft, LIGHT.card], [LIGHT.name, LIGHT.sheet], [LIGHT.faint, LIGHT.sheet], [LIGHT.link, LIGHT.sheet], [LIGHT.onButton, LIGHT.button],
    [DARK.ink, DARK.card], [DARK.soft, DARK.card], [DARK.name, DARK.sheet], [DARK.faint, DARK.sheet], [DARK.link, DARK.sheet], [DARK.onButton, DARK.button],
  ];
  const unmeasured = used.filter(([text, on]) => !measured.has(`${text} on ${on}`));
  check("palette: every pair of words and ground a message uses, light and dark, is a pair already measured for contrast", unmeasured.length === 0, unmeasured.map((p) => p.join(" on ")).join("; "));
}

// ---------------------------------------------------------------------------------------------
// 2. A message: its HTML and its plain-text twin, from the same blocks.
const MESSAGE = {
  subject: "biznes.mu Pocket Guide: the December 2026 edition",
  preheader: "Mauritius, place by place.",
  blocks: [
    { type: "heading", text: "A new edition" },
    { type: "paragraph", text: "It is out.\nTwo lines, and <b>no markup</b> & nothing else." },
    { type: "button", label: "Open the Pocket Guide", href: "/shop" },
    { type: "line" },
    { type: "heading", text: "Also" },
    { type: "button", label: "Elsewhere", href: "https://example.org/a?b=1&c=2" },
  ],
};
const FRAME = { site: "https://biznes.example", siteName: "biznes.mu", from: "biznes.mu", why: "You have this message because you asked for it.", postal: "Khay Digital Ltd\nCurepipe, Mauritius", leave: { url: `https://biznes.example/unsubscribe?token=${LEAVE_MARK}` } };
{
  const html = toDocument(MESSAGE, FRAME);
  const text = toText(MESSAGE, FRAME);
  check("html: a whole document, in tables, 600 pixels wide", html.startsWith("<!doctype html>") && html.includes('<table role="presentation"') && html.includes('width="600"') && html.includes("max-width:600px") && html.trimEnd().endsWith("</html>"));
  check("html: no script, no picture, no frame, no form and nothing fetched from anywhere", !/<script|<img|<iframe|<form|<link|@import|url\(/i.test(html));
  const body = html.slice(html.indexOf("<body"));
  const bare = [...body.matchAll(/<(td|p|h1|h2|a|div)\b([^>]*)>/g)].filter((m) => !/style="/.test(m[2]));
  check("html: every cell, paragraph, heading and link carries its own style, for a mail program that reads no style sheet", bare.length === 0, bare.slice(0, 3).map((m) => m[0]).join(" "));
  check("html: what is typed is words, never markup", body.includes("&lt;b&gt;no markup&lt;/b&gt; &amp; nothing else.") && !body.includes("<b>"));
  check("html: a paragraph keeps its line breaks", body.includes("It is out.<br>Two lines"));
  check("html: the first heading is the message's title, a later one a smaller heading", (body.match(/<h1\b/g) ?? []).length === 1 && (body.match(/<h2\b/g) ?? []).length === 1 && body.indexOf("<h1") < body.indexOf("<h2"));
  check("html: a button to a page of this site leads to the site's own address, and a full address is kept, escaped", body.includes('href="https://biznes.example/shop"') && body.includes('href="https://example.org/a?b=1&amp;c=2"'));
  check("html: the button is saffron with ink words", new RegExp(`bgcolor="${TOKENS.saffron}"`).test(body) && new RegExp(`color:${TOKENS.ink};text-decoration:none`).test(body));
  check("html: the grounds and the words are named on their own elements: cream sheet, white card, ink words", body.includes(`bgcolor="${TOKENS.cream}"`) && body.includes(`bgcolor="${TOKENS.white}"`) && body.includes(`color:${TOKENS.ink}`) && body.includes(`color:${TOKENS.slate}`));
  check("html: a mail program that honours a dark setting is given the site's dark pairs", html.includes('<meta name="color-scheme" content="light dark">') && html.includes("@media (prefers-color-scheme:dark)") && html.includes(`.em-sheet{background-color:${TOKENS.ink}!important}`) && html.includes(`.em-card{background-color:${TOKENS.swell}!important`));
  check("html: the line after the subject is in the message, out of sight, before anything else", body.indexOf("Mauritius, place by place.") > 0 && body.indexOf("Mauritius, place by place.") < body.indexOf("<table") && /display:none[^"]*">Mauritius, place by place\./.test(body));
  check("html: it ends with who sent it and why, the way to leave, and the postal address", /Sent by biznes\.mu\. You have this message because you asked for it\./.test(body) && body.includes(`href="https://biznes.example/unsubscribe?token=${LEAVE_MARK}"`) && body.includes("Khay Digital Ltd<br>Curepipe, Mauritius") && body.lastIndexOf("Curepipe, Mauritius") > body.lastIndexOf("Elsewhere"));
  check("text: the twin holds the same blocks in the same order", text.indexOf("A new edition\n=============") === 0 && text.includes("It is out.\nTwo lines, and <b>no markup</b> & nothing else.") && text.includes("Open the Pocket Guide: https://biznes.example/shop") && text.includes("Elsewhere: https://example.org/a?b=1&c=2") && text.indexOf("Also") > text.indexOf("-".repeat(40)));
  check("text: and ends the same way", text.includes("Sent by biznes.mu. You have this message because you asked for it.") && text.includes(`To stop these messages, leave the list: https://biznes.example/unsubscribe?token=${LEAVE_MARK}`) && text.trimEnd().endsWith("Khay Digital Ltd\nCurepipe, Mauritius"));
  check("text: no mark of HTML is left in it but what was typed", !/<(table|td|p|a|br)\b/.test(text));
  const mine = personal(html, { leave: "11111111-1111-4111-8111-111111111111" });
  check("one reader's copy carries their own link to leave, and no mark is left standing", mine.includes("/unsubscribe?token=11111111-1111-4111-8111-111111111111") && !mine.includes(LEAVE_MARK));
  const byHand = { ...FRAME, leave: { reply: "hello@biznes.example" } };
  check("by hand: a message sent to many at once says to reply to leave, and carries nobody's link", toDocument(MESSAGE, byHand).includes('href="mailto:hello@biznes.example"') && !toDocument(MESSAGE, byHand).includes("/unsubscribe") && toText(MESSAGE, byHand).includes("reply to this one and say so, or write to hello@biznes.example"));
  const { light, dark } = render(MESSAGE, FRAME);
  check("the tree the page draws is the HTML that is sent", html.includes(toHtml(light)) && toHtml(dark).includes(`bgcolor="${TOKENS.ink}"`) && toHtml(dark).includes(`bgcolor="${TOKENS.swell}"`) && toHtml(drawBody(MESSAGE, FRAME)) === toHtml(light));
}

// ---------------------------------------------------------------------------------------------
// 3. The blocks a form may hold.
{
  check("blocks: a button leads to a page of this site or to a full https address", isButtonHref("/shop") && isButtonHref("https://example.org/x") && !isButtonHref("http://example.org") && !isButtonHref("//example.org") && !isButtonHref("javascript:alert(1)") && !isButtonHref("shop") && !isButtonHref("/a b"));
  check("blocks: a draft may hold a part not filled in; a message that is ready may not", blockProblem(emptyBlock("paragraph"), false) === null && blockProblem(emptyBlock("paragraph"), true)?.field === "text" && blockProblem(emptyBlock("button"), true)?.field === "label" && blockProblem({ type: "button", label: "Go", href: "ftp://x" }, false)?.field === "href" && blockProblem({ type: "line" }, true) === null);
  check("blocks: what the database holds is read with anything that is not a block left out", JSON.stringify(soundBlocks([{ type: "heading", text: "A" }, { type: "html", text: "<script>" }, null, "words", { type: "button", label: 3 }, { type: "line", extra: 1 }])) === '[{"type":"heading","text":"A"},{"type":"button","label":"","href":""},{"type":"line"}]' && soundBlocks("not a list").length === 0);
}

// ---------------------------------------------------------------------------------------------
// 4. The senders. A stand-in for `fetch` keeps each request and hands back a recorded answer.
function standIn(answers) {
  const asked = [];
  const fetcher = async (url, init) => {
    asked.push({ url: String(url), init });
    const answer = typeof answers === "function" ? answers(asked.length - 1, init) : answers;
    if (answer instanceof Error) throw answer;
    return new Response(typeof answer.body === "string" ? answer.body : JSON.stringify(answer.body), { status: answer.status ?? 200, headers: { "Content-Type": typeof answer.body === "string" ? "text/plain" : "application/json" } });
  };
  return { asked, fetcher };
}
const letter = (ref, to) => ({ ref, to, subject: "A subject", html: "<p>Hello</p>", text: "Hello", headers: { "List-Unsubscribe": `<https://biznes.example/api/email/leave?token=t${ref}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } });
const ENVELOPE = { from: "biznes.mu <guide@biznes.example>", replyTo: "hello@biznes.example", key: "claim-1" };
{
  const none = senderFrom({});
  const tried = await none.send(ENVELOPE, [letter(1, "a@list.example")]);
  check("no sender: with nothing set nothing leaves, and each try is refused with the reason", none.name === "none" && !none.connected && none.missing.includes("EMAIL_PROVIDER") && tried.length === 1 && tried[0].ok === false && tried[0].unsure === false && /No sender is connected/.test(tried[0].why));
  check("no sender: a provider named without its key is none, and says which variable is missing", senderFrom({ EMAIL_PROVIDER: "resend" }).missing.join() === "RESEND_API_KEY" && senderFrom({ EMAIL_PROVIDER: "mailgun", MAILGUN_API_KEY: "k" }).missing.join() === "MAILGUN_DOMAIN" && senderFrom({ EMAIL_PROVIDER: "mailgun" }).missing.join() === "MAILGUN_API_KEY,MAILGUN_DOMAIN" && !senderFrom({ EMAIL_PROVIDER: "sendgrid" }).connected && !senderFrom({ EMAIL_PROVIDER: "mailgun", MAILGUN_API_KEY: "k", MAILGUN_DOMAIN: "mg.biznes.example", MAILGUN_REGION: "mars" }).connected);
  check("batches: twenty-five addresses unless EMAIL_BATCH says another number from 1 to 100", batchSize({}) === 25 && batchSize({ EMAIL_BATCH: "2" }) === 2 && batchSize({ EMAIL_BATCH: "500" }) === 25 && batchSize({ EMAIL_BATCH: "two" }) === 25);
  check("from: a name and an address as one line", fromLine("biznes.mu", "guide@biznes.example") === "biznes.mu <guide@biznes.example>" && fromLine("Khay, Digital", "a@b.example") === '"Khay, Digital" <a@b.example>' && fromLine("", "a@b.example") === "a@b.example");
}
{
  // Resend. The success answer is the one on its "Send Batch Emails" page.
  const ok = standIn({ body: { data: [{ id: "ae2014de-c168-4c61-8267-70d2662a1ce1" }, { id: "faccb7a5-8a28-4e9a-ac64-8da1cc3bc1cb" }] } });
  const resend = senderFrom({ EMAIL_PROVIDER: "resend", RESEND_API_KEY: "re_test_key" }, ok.fetcher);
  const went = await resend.send(ENVELOPE, [letter(11, "a@list.example"), letter(12, "b@list.example")]);
  const { url, init } = ok.asked[0];
  const sent = JSON.parse(init.body);
  check("resend: one request for the batch, to its batch address, as JSON, with the key, a User-Agent and a name for the batch", resend.connected && ok.asked.length === 1 && url === RESEND_BATCH_URL && url === "https://api.resend.com/emails/batch" && init.method === "POST" && init.headers.Authorization === "Bearer re_test_key" && init.headers["Content-Type"] === "application/json" && Boolean(init.headers["User-Agent"]) && init.headers["Idempotency-Key"] === "biznes/claim-1/0");
  check("resend: each email in the batch is whole: who from, one address, the subject, both bodies, where replies go, and its own headers to leave by", Array.isArray(sent) && sent.length === 2 && sent[0].from === ENVELOPE.from && JSON.stringify(sent[0].to) === '["a@list.example"]' && sent[1].to[0] === "b@list.example" && sent[0].subject === "A subject" && sent[0].html === "<p>Hello</p>" && sent[0].text === "Hello" && sent[0].reply_to === "hello@biznes.example" && sent[0].headers["List-Unsubscribe"] === "<https://biznes.example/api/email/leave?token=t11>" && sent[1].headers["List-Unsubscribe"].includes("t12") && sent[0].headers["List-Unsubscribe-Post"] === "List-Unsubscribe=One-Click");
  check("resend: the answer names each message, in the order sent", JSON.stringify(went) === '[{"ref":11,"ok":true,"id":"ae2014de-c168-4c61-8267-70d2662a1ce1"},{"ref":12,"ok":true,"id":"faccb7a5-8a28-4e9a-ac64-8da1cc3bc1cb"}]');

  // A refusal, in the shape its errors page gives: a status, a name and a message.
  const refused = standIn({ status: 403, body: { statusCode: 403, name: "validation_error", message: "The biznes.example domain is not verified. Please, add and verify your domain on https://resend.com/domains" } });
  const no = await senderFrom({ EMAIL_PROVIDER: "resend", RESEND_API_KEY: "k" }, refused.fetcher).send(ENVELOPE, [letter(1, "a@list.example"), letter(2, "b@list.example")]);
  check("resend: a refusal fails the whole batch, plainly, with what Resend said", no.length === 2 && no.every((o) => !o.ok && !o.unsure && /Resend said: The biznes\.example domain is not verified.*\(validation_error\)/.test(o.why)), JSON.stringify(no[0]));
  const quota = await senderFrom({ EMAIL_PROVIDER: "resend", RESEND_API_KEY: "k" }, standIn({ status: 429, body: { statusCode: 429, name: "daily_quota_exceeded", message: "You have reached your daily email sending quota." } }).fetcher).send(ENVELOPE, [letter(1, "a@list.example")]);
  check("resend: a quota that is used up is a plain refusal too: nothing went", !quota[0].ok && !quota[0].unsure && /daily_quota_exceeded/.test(quota[0].why));
  const theirs = await senderFrom({ EMAIL_PROVIDER: "resend", RESEND_API_KEY: "k" }, standIn({ status: 500, body: { statusCode: 500, name: "application_error", message: "An unexpected error occurred." } }).fetcher).send(ENVELOPE, [letter(1, "a@list.example")]);
  const silent = await senderFrom({ EMAIL_PROVIDER: "resend", RESEND_API_KEY: "k" }, standIn(new Error("the line dropped")).fetcher).send(ENVELOPE, [letter(1, "a@list.example")]);
  const busy = await senderFrom({ EMAIL_PROVIDER: "resend", RESEND_API_KEY: "k" }, standIn({ status: 409, body: { statusCode: 409, name: "concurrent_idempotent_requests", message: "Same idempotency key used while original request is still in progress." } }).fetcher).send(ENVELOPE, [letter(1, "a@list.example")]);
  check("resend: an error of their own, no answer at all, or a batch still at work under the same name, is unsure: it may have gone", [theirs, silent, busy].every((o) => !o[0].ok && o[0].unsure) && /did not answer/.test(silent[0].why));
  const short = await senderFrom({ EMAIL_PROVIDER: "resend", RESEND_API_KEY: "k" }, standIn({ body: { data: [{ id: "one" }] } }).fetcher).send(ENVELOPE, [letter(1, "a@list.example"), letter(2, "b@list.example")]);
  check("resend: a message the answer gives no name to is not called sent", short[0].ok && !short[1].ok && short[1].unsure);
  const many = standIn((n) => ({ body: { data: Array.from({ length: n === 0 ? 100 : 1 }, (_, i) => ({ id: `m${n}-${i}` })) } }));
  const lot = await senderFrom({ EMAIL_PROVIDER: "resend", RESEND_API_KEY: "k" }, many.fetcher).send(ENVELOPE, Array.from({ length: 101 }, (_, i) => letter(i + 1, `r${i}@list.example`)));
  check("resend: more than the hundred a call takes goes in two calls, each with its own name", many.asked.length === 2 && JSON.parse(many.asked[0].init.body).length === 100 && JSON.parse(many.asked[1].init.body).length === 1 && many.asked[1].init.headers["Idempotency-Key"] === "biznes/claim-1/1" && lot.length === 101 && lot.every((o) => o.ok) && lot[100].id === "m1-0");
}
{
  // Mailgun. The success answer is the one its API gives: an id and "Queued. Thank you."
  const ok = standIn((n) => ({ body: { id: `<2026112${n}.1.ABCDEF@mg.biznes.example>`, message: "Queued. Thank you." } }));
  const mailgun = senderFrom({ EMAIL_PROVIDER: "mailgun", MAILGUN_API_KEY: "key-test", MAILGUN_DOMAIN: "mg.biznes.example" }, ok.fetcher);
  const went = await mailgun.send(ENVELOPE, [letter(21, "a@list.example"), letter(22, "b@list.example")]);
  const first = ok.asked.find((a) => a.init.body.get("to") === "a@list.example");
  const form = first.init.body;
  check("mailgun: one request for each address, to the domain's own address, signed in as api with the key", mailgun.connected && ok.asked.length === 2 && first.url === "https://api.mailgun.net/v3/mg.biznes.example/messages" && first.url === mailgunUrl("mg.biznes.example", "us") && first.init.method === "POST" && first.init.headers.Authorization === `Basic ${Buffer.from("api:key-test").toString("base64")}`);
  check("mailgun: as a form with who from, the address, the subject, both bodies, and each header as h:Name", form instanceof FormData && form.get("from") === ENVELOPE.from && form.get("subject") === "A subject" && form.get("text") === "Hello" && form.get("html") === "<p>Hello</p>" && form.get("h:Reply-To") === "hello@biznes.example" && form.get("h:List-Unsubscribe") === "<https://biznes.example/api/email/leave?token=t21>" && form.get("h:List-Unsubscribe-Post") === "List-Unsubscribe=One-Click" && form.getAll("to").length === 1 && !form.has("recipient-variables"));
  check("mailgun: the answer names each message", went.length === 2 && went.every((o) => o.ok && /^<2026112\d\.1\.ABCDEF@mg\.biznes\.example>$/.test(o.id)) && went[0].ref === 21 && went[1].ref === 22);
  const eu = standIn({ body: { id: "<x@mg.biznes.example>", message: "Queued. Thank you." } });
  await senderFrom({ EMAIL_PROVIDER: "mailgun", MAILGUN_API_KEY: "k", MAILGUN_DOMAIN: "MG.Biznes.example", MAILGUN_REGION: "EU" }, eu.fetcher).send(ENVELOPE, [letter(1, "a@list.example")]);
  check("mailgun: a domain made in the EU region is reached at the EU address", eu.asked[0].url === "https://api.eu.mailgun.net/v3/mg.biznes.example/messages");

  // One address refused among three: the others still go, and each has its own answer.
  const mixed = standIn((_, init) => (init.body.get("to") === "bad@" ? { status: 400, body: { message: "to parameter is not a valid address. please check documentation" } } : { body: { id: `<ok-${init.body.get("to")}>`, message: "Queued. Thank you." } }));
  const three = await senderFrom({ EMAIL_PROVIDER: "mailgun", MAILGUN_API_KEY: "k", MAILGUN_DOMAIN: "mg.biznes.example" }, mixed.fetcher).send(ENVELOPE, [letter(1, "a@list.example"), letter(2, "bad@"), letter(3, "c@list.example")]);
  check("mailgun: one address refused does not stop the others, and the refusal says what Mailgun said", three[0].ok && three[2].ok && !three[1].ok && !three[1].unsure && /Mailgun said: to parameter is not a valid address/.test(three[1].why), JSON.stringify(three[1]));
  const forbidden = await senderFrom({ EMAIL_PROVIDER: "mailgun", MAILGUN_API_KEY: "wrong", MAILGUN_DOMAIN: "mg.biznes.example" }, standIn({ status: 401, body: "Forbidden" }).fetcher).send(ENVELOPE, [letter(1, "a@list.example")]);
  check("mailgun: a wrong key is answered in plain words, and they are what is said", !forbidden[0].ok && !forbidden[0].unsure && forbidden[0].why === "Mailgun said: Forbidden");
  const theirs = await senderFrom({ EMAIL_PROVIDER: "mailgun", MAILGUN_API_KEY: "k", MAILGUN_DOMAIN: "mg.biznes.example" }, standIn({ status: 500, body: { message: "Internal Server Error" } }).fetcher).send(ENVELOPE, [letter(1, "a@list.example")]);
  const silent = await senderFrom({ EMAIL_PROVIDER: "mailgun", MAILGUN_API_KEY: "k", MAILGUN_DOMAIN: "mg.biznes.example" }, standIn(new Error("the line dropped")).fetcher).send(ENVELOPE, [letter(1, "a@list.example")]);
  const limited = await senderFrom({ EMAIL_PROVIDER: "mailgun", MAILGUN_API_KEY: "k", MAILGUN_DOMAIN: "mg.biznes.example" }, standIn({ status: 429, body: { message: "Too many requests" } }).fetcher).send(ENVELOPE, [letter(1, "a@list.example")]);
  check("mailgun: an error of their own or no answer is unsure; a limit reached is a plain refusal", theirs[0].unsure && silent[0].unsure && !limited[0].ok && !limited[0].unsure);
  const twelve = standIn({ body: { id: "<x@mg.biznes.example>", message: "Queued. Thank you." } });
  const all = await senderFrom({ EMAIL_PROVIDER: "mailgun", MAILGUN_API_KEY: "k", MAILGUN_DOMAIN: "mg.biznes.example" }, twelve.fetcher).send(ENVELOPE, Array.from({ length: 12 }, (_, i) => letter(i + 1, `r${i}@list.example`)));
  check("mailgun: a batch of twelve is twelve requests, answered in the order asked", twelve.asked.length === 12 && all.map((o) => o.ref).join() === "1,2,3,4,5,6,7,8,9,10,11,12");
}
{
  check("local: only an address on this machine is one", localUrl("http://127.0.0.1:54399/send") === "http://127.0.0.1:54399/send" && Boolean(localUrl("http://localhost:1/x")) && !localUrl("https://127.0.0.1/x") && !localUrl("http://example.org/x") && !localUrl("http://127.0.0.1.example.org/x") && !localUrl("http://10.0.0.5/x") && !localUrl("") && !localUrl(undefined));
  check("local: the sender is refused unless its address is on this machine", !senderFrom({ EMAIL_PROVIDER: "local", EMAIL_TEST_URL: "https://hooks.example.org/in" }).connected && !senderFrom({ EMAIL_PROVIDER: "local" }).connected);
  const heard = standIn({ body: { results: [{ ref: 1, ok: true, id: "kept-1" }, { ref: 2, ok: false, why: "The mailbox is full.", unsure: false }] } });
  const local = senderFrom({ EMAIL_PROVIDER: "local", EMAIL_TEST_URL: "http://127.0.0.1:54399/send" }, heard.fetcher);
  const went = await local.send(ENVELOPE, [letter(1, "a@list.example"), letter(2, "b@list.example"), letter(3, "c@list.example")]);
  const posted = JSON.parse(heard.asked[0].init.body);
  check("local: the batch is posted as JSON, whole, and each answer is read; one not answered for went", local.connected && heard.asked[0].url === "http://127.0.0.1:54399/send" && posted.from === ENVELOPE.from && posted.key === "claim-1" && posted.letters.length === 3 && posted.letters[1].headers["List-Unsubscribe"].includes("t2") && went[0].ok && went[0].id === "kept-1" && !went[1].ok && /The mailbox is full/.test(went[1].why) && went[2].ok);
}

// ---------------------------------------------------------------------------------------------
// 5. What a mail service says afterwards: the signatures.
{
  // The example on Svix's own page (docs.svix.com, "Verifying Webhooks Manually").
  const svix = { secret: "whsec_plJ3nmyCDGBKInavdOK15jsl", body: '{"event_type":"ping","data":{"success":true}}', id: "msg_loFOjxBNrRLzqYUf", timestamp: "1731705121", signature: "v1,rAvfW3dJ/X/qxhsaXPOyyCGmRKsaKWcsNccKXlIktD0=" };
  const then = 1731705121 * 1000;
  check("svix: the example on Svix's own page verifies", verifySvix({ ...svix, now: then }));
  check("svix: not with a body changed by one character, another id, or another secret", !verifySvix({ ...svix, body: svix.body.replace("true", "false"), now: then }) && !verifySvix({ ...svix, id: "msg_other", now: then }) && !verifySvix({ ...svix, secret: "whsec_c29tZXRoaW5nIGVsc2U=", now: then }));
  check("svix: not when it is more than five minutes old, or from more than five minutes ahead", !verifySvix({ ...svix, now: then + 6 * 60 * 1000 }) && !verifySvix({ ...svix, now: then - 6 * 60 * 1000 }) && verifySvix({ ...svix, now: then + 4 * 60 * 1000 }));
  check("svix: one good signature among several is enough; none, or a missing header, is not", verifySvix({ ...svix, signature: `v1,AAAA v2,BBBB ${svix.signature}`, now: then }) && !verifySvix({ ...svix, signature: "v1,AAAA", now: then }) && !verifySvix({ ...svix, signature: null, now: then }) && !verifySvix({ ...svix, id: null, now: then }) && !verifySvix({ ...svix, secret: "", now: then }) && !verifySvix({ ...svix, secret: "not-a-secret", now: then }));

  // Mailgun: its page gives the rule and a snippet; the snippet is the yardstick here.
  const theirSnippet = ({ signingKey, timestamp, token, signature }) => createHmac("sha256", signingKey).update(timestamp.concat(token)).digest("hex") === signature;
  const key = "a-signing-key-for-the-unit-check";
  const signed = { timestamp: "1770920772", token: "e0b5477167110d68991efc6b9f89f0a11066af27834600e123" };
  signed.signature = createHmac("sha256", key).update(signed.timestamp + signed.token).digest("hex");
  const then2 = 1770920772 * 1000;
  check("mailgun: a signature made by the rule on Mailgun's page verifies, and their own snippet agrees", theirSnippet({ signingKey: key, ...signed }) && verifyMailgun({ key, ...signed, now: then2 }) && verifyMailgun({ key, ...signed, timestamp: 1770920772, now: then2 }));
  check("mailgun: not with another key, another token, or the made-up signature printed on the page", !verifyMailgun({ key: "another", ...signed, now: then2 }) && !verifyMailgun({ key, ...signed, token: "x", now: then2 }) && !verifyMailgun({ key, ...signed, signature: "12d99f5a15355c180971bed7494d578b093c958f57766f3fe750761baed12345", now: then2 }) && !verifyMailgun({ key: "", ...signed, now: then2 }) && !verifyMailgun({ key, timestamp: signed.timestamp, token: undefined, signature: undefined, now: then2 }));
  check("mailgun: within the eight hours it tries again, and not after a day", verifyMailgun({ key, ...signed, now: then2 + 8 * 3600e3 }) && !verifyMailgun({ key, ...signed, now: then2 + 25 * 3600e3 }));
}
{
  // The payloads on Resend's pages for each event, as recorded there.
  const bounced = { type: "email.bounced", created_at: "2026-11-22T23:41:12.126Z", data: { email_id: "56761188-7520-42d8-8898-ff6fc54ce618", from: "Acme <onboarding@resend.dev>", to: ["Delivered@Resend.dev"], subject: "Sending this example", bounce: { message: "The recipient's email address is on the suppression list because it has a recent history of producing hard bounces.", subType: "Suppressed", type: "Permanent" }, tags: { category: "confirm_email" } } };
  const got = resendEvents(bounced);
  check("resend says: a permanent bounce keeps its address from being written to, with what was said", got.length === 1 && got[0].kind === "bounce" && got[0].address === "delivered@resend.dev" && /^Suppressed The recipient's email address is on the suppression list/.test(got[0].detail) && got[0].detail.length <= 300);
  check("resend says: a bounce that is not permanent is passed over", resendEvents({ ...bounced, data: { ...bounced.data, bounce: { type: "Transient", subType: "General", message: "Mailbox full" } } }).length === 0);
  check("resend says: a complaint, and an address Resend itself will not write to", resendEvents({ type: "email.complained", data: { to: ["a@list.example", "b@list.example"] } }).map((e) => `${e.kind}:${e.address}`).join() === "complaint:a@list.example,complaint:b@list.example" && resendEvents({ type: "email.suppressed", data: { to: ["a@list.example"], suppressed: { message: "Resend has suppressed sending to this address because it is on the account-level suppression list.", type: "OnAccountSuppressionList" } } })[0].kind === "bounce");
  check("resend says: anything else asks nothing of the list", [{ type: "email.delivered", data: { to: ["a@list.example"] } }, { type: "email.opened", data: { to: ["a@list.example"] } }, { type: "email.bounced", data: { to: ["not an address"], bounce: { type: "Permanent" } } }, {}, null, "words"].every((p) => resendEvents(p).length === 0));

  // The payloads on Mailgun's "Webhook Payloads" page, as recorded there, in the wrapping its "Securing Webhooks" page gives.
  const failed = { signature: { token: "t", timestamp: "1", signature: "s" }, "event-data": { event: "failed", severity: "permanent", reason: "bounce", recipient: "BadRecipient@sample.mailgun.com", "delivery-status": { "attempt-no": 1, code: 550, message: "5.5.0 Requested action not taken: mailbox unavailable (S2017062302).", description: null } } };
  const said = mailgunEvents(failed);
  check("mailgun says: a permanent failure keeps its address from being written to, with the code and the words", said.length === 1 && said[0].kind === "bounce" && said[0].address === "badrecipient@sample.mailgun.com" && said[0].detail === "550 5.5.0 Requested action not taken: mailbox unavailable (S2017062302). bounce");
  check("mailgun says: a temporary failure is passed over; a complaint is not", mailgunEvents({ "event-data": { event: "failed", severity: "temporary", reason: "generic", recipient: "a@sample.mailgun.com" } }).length === 0 && mailgunEvents({ "event-data": { event: "complained", recipient: "recipient@sample.mailgun.com" } })[0].kind === "complaint");
  check("mailgun says: anything else asks nothing of the list", [{ "event-data": { event: "delivered", recipient: "a@sample.mailgun.com" } }, { "event-data": { event: "failed", severity: "permanent" } }, {}, null].every((p) => mailgunEvents(p).length === 0));
}

// ---------------------------------------------------------------------------------------------
// 6. A campaign as letters: each reader's own copy.
{
  const settings = { from_name: "biznes.mu", reply_to: "hello@biznes.example", postal_address: "Khay Digital Ltd\nMauritius" };
  const campaign = { kind: "guide", audience: "guide", subject: MESSAGE.subject, preheader: MESSAGE.preheader, blocks: MESSAGE.blocks };
  const drawn = drawCampaign(campaign, settings);
  const letters = lettersFor(drawn, [{ id: 7, email: "a@list.example", leave_token: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }, { id: 8, email: "b@list.example", leave_token: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" }]);
  check("letters: each address has its own copy, with its own link to leave and nobody else's", letters.length === 2 && letters[0].ref === 7 && letters[0].to === "a@list.example" && letters[0].html.includes(leavePage("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")) && !letters[0].html.includes("bbbbbbbb") && letters[1].text.includes(leavePage("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")) && !letters.some((l) => l.html.includes(LEAVE_MARK) || l.text.includes(LEAVE_MARK)));
  check("letters: and the two headers a mail program takes its reader off by, in one press", letters[0].headers["List-Unsubscribe"] === `<${leaveInOnePress("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")}>` && letters[0].headers["List-Unsubscribe"].startsWith("<https://biznes.example/api/email/leave?token=") && letters[0].headers["List-Unsubscribe-Post"] === "List-Unsubscribe=One-Click");
  check("letters: the foot says who sent it, why, and where the sender is", /Sent by biznes\.mu, which is run by Khay Digital Ltd\. You have this message because you asked to be sent the biznes\.mu Pocket Guide\./.test(letters[0].text) && letters[0].text.trimEnd().endsWith("Khay Digital Ltd\nMauritius"));
  const asking = messageOf({ kind: "confirm", subject: "typed by someone", preheader: "", blocks: [{ type: "paragraph", text: "Buy this." }] });
  check("confirm: the message that asks to confirm is the site's own words, whatever its row holds", asking.subject === confirmMessage().subject && !JSON.stringify(asking).includes("Buy this") && asking.blocks.some((b) => b.type === "button" && b.href === `/subscribe/confirm?token=${CONFIRM_MARK}`));
  const [ask] = lettersFor(drawCampaign({ kind: "confirm", audience: "unconfirmed", subject: "", preheader: "", blocks: [] }, settings), [{ id: 9, email: "c@list.example", leave_token: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", confirm_token: "dddddddd-dddd-4ddd-8ddd-dddddddddddd" }]);
  check("confirm: its button carries the reader's own link to confirm, and its foot their own link to leave", ask.html.includes('href="https://biznes.example/subscribe/confirm?token=dddddddd-dddd-4ddd-8ddd-dddddddddddd"') && ask.text.includes("Confirm my address: https://biznes.example/subscribe/confirm?token=dddddddd-dddd-4ddd-8ddd-dddddddddddd") && ask.html.includes(leavePage("cccccccc-cccc-4ccc-8ccc-cccccccccccc")) && !ask.html.includes(CONFIRM_MARK));
  check("by hand: a frame with nobody's token says to reply, to the address replies go to", "reply" in frameOf("guide", settings, null).leave && frameOf("guide", settings, null).leave.reply === "hello@biznes.example");
}

console.log(`\n${passed} passed, ${failed} failed.`);
process.exit(failed ? 1 : 0);
