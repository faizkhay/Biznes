// What the two tax tools do, checked in a real browser against a production server.
//
//   npm run build
//   npx next start -p 3500 &
//   node scripts/behaviour-tax.mjs [origin]        (default http://localhost:3500)
//
// Each worked example below was computed by hand from the figures in the two guides
// (content/guides/personal-income-tax-in-mauritius.json and business-taxes.json), and the sum is
// written out beside it. If a guide's figure changes, the example that leans on it fails, which is
// the point: the answer here is the hand's, not the tool's. Exits 1 if any check fails.
//
// Needs: playwright and @axe-core/playwright (devDependencies).
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { browserPath } from "./pages.mjs";

const origin = process.argv[2] ?? "http://localhost:3500";
let failed = 0;
let passed = 0;
const check = (name, ok, detail = "") => {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "pass" : "FAIL"}  ${name}${ok || !detail ? "" : `  (${detail})`}`);
};

const browser = await chromium.launch({ executablePath: browserPath() });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

/** The sum on one line of the working, by the line's name. */
const line = async (id) => ((await page.locator(`[data-line="${id}"]`).count()) ? (await page.locator(`[data-line="${id}"]`).first().innerText()).trim() : "(no such line)");
/** A whole row of the working: the sum, its source numbers and the word on how it was reached. */
const row = async (id) => (await page.locator(`dd:has([data-line="${id}"])`).first().innerText()).replace(/\s+/g, " ");
/** Every named line checked against the hand's answer, as one check. */
const lines = async (name, expected) => {
  const wrong = [];
  for (const [id, want] of Object.entries(expected)) {
    const got = await line(id);
    if (got !== want) wrong.push(`${id}: ${got}, not ${want}`);
  }
  check(name, wrong.length === 0, wrong.join("; "));
};
/**
 * Open a tool and wait until its fields answer to typing. Not "networkidle": the links on the page
 * are fetched ahead in the background, and on a busy machine that can outlast any sensible wait.
 */
const visit = async (url, on = page) => {
  await on.goto(url, { waitUntil: "domcontentloaded" });
  await on.waitForFunction(() => {
    const field = document.querySelector("main input.field");
    return !!field && Object.keys(field).some((key) => key.startsWith("__reactProps"));
  });
};
const chip = (words) => page.locator("label.chip", { hasText: words }).click();
const fill = (label, value) => page.getByLabel(label, { exact: true }).fill(value);
const status = () => page.locator('main p[role="status"]').first().innerText();

// ---------------------------------------------------------------------------------------------
// 1. The personal income tax calculator.
// ---------------------------------------------------------------------------------------------
const INCOME = `${origin}/tools/income-tax`;
await visit(INCOME);
const about = await page.locator("main").innerText();
check("income tax: says which income year the figures are for, and the day they were checked", /income year from 1 July 2026 to 30 June 2027/.test(about) && /checked \d{1,2} [A-Z][a-z]+ \d{4}/.test(about));
check("income tax: general information, not tax advice, with the MRA's own calculator and the article", /General information, not tax advice/.test(about) && (await page.locator('main a[href="https://eservices.mra.mu/taxcalculator/viewCalculate"]').count()) === 1 && (await page.locator('main a[href="/learn/personal-income-tax-in-mauritius"]').count()) >= 2);
check("income tax: nothing is worked out until an income is entered", /Enter a salary, a profit or other income/.test(await status()) && (await page.locator("[data-line]").count()) === 0);

// Example 1. A resident paid MUR 60,000 a month for 13 months, no dependents, no reliefs.
//   Income: 60,000 x 13 = 780,000. Nothing to deduct, so chargeable income is 780,000.
//   Tax: 0% of the first 500,000 = 0. 10% of the next 280,000 = 28,000. Total 28,000.
//   A month: 28,000 / 12 = 2,333.33. Share of income: 28,000 / 780,000 = 3.59%, shown as 3.6%.
//   CSG: 60,000 is above 50,000, so 3% of 60,000 = 1,800 a month, on 13 months = 23,400.
//   National Savings Fund: 1% of the first 29,710 = 297.10 a month, on 12 months = 3,565.20.
//   Left: 780,000 - 28,000 - 23,400 - 3,565.20 = 725,034.80. A month: 725,034.80 / 12 = 60,419.57.
await fill("Basic salary, in rupees", "60,000");
await chip("13 months");
await lines("income tax, example 1: MUR 60,000 a month for 13 months is MUR 28,000.00 of tax", {
  salary: "MUR 780,000.00",
  income: "MUR 780,000.00",
  chargeable: "MUR 780,000.00",
  "band-0": "MUR 0.00",
  "band-1": "MUR 28,000.00",
  "band-2": "MUR 0.00",
  "band-3": "MUR 0.00",
  "fair-share": "None for the income year from 1 July 2026",
  tax: "MUR 28,000.00",
  "tax-month": "MUR 2,333.33",
  effective: "3.6%",
  csg: "MUR 23,400.00",
  nsf: "MUR 3,565.20",
  left: "MUR 725,034.80",
  "left-month": "MUR 60,419.57",
});
check("income tax: the answer is said in a sentence, for a screen reader too", /Income tax for the year: MUR 28,000\.00\. That is MUR 2,333\.33 a month, 3\.6% of the income\./.test(await status()));
check("income tax: a line carries the number of the guide's source, as a link to it", /\[\d+\]/.test(await row("band-1")) && (await page.locator('main a.cite[href^="/learn/personal-income-tax-in-mauritius#source-"]').count()) >= 6);

// Example 2. A resident on MUR 1,500,000 a year over 12 months, two dependents, a medical premium
// of 80,000, housing loan interest of 120,000 and 60,000 paid into a personal pension scheme.
//   Dependents: 190,000 for two. Medical: capped at 25,000 + 25,000 + 20,000 = 70,000.
//   Housing interest: 120,000 in full (income is not above 4 million). Pension: capped at 50,000.
//   Deducted: 190,000 + 70,000 + 120,000 + 50,000 = 430,000. Chargeable: 1,500,000 - 430,000 = 1,070,000.
//   Tax: 0 + 10% of 500,000 = 50,000 + 20% of 70,000 = 14,000. Total 64,000. A month: 5,333.33.
//   Share of income: 64,000 / 1,500,000 = 4.27%, shown as 4.3%.
//   CSG: 125,000 a month is above 50,000, so 3% = 3,750 a month, on 12 months = 45,000.
//   National Savings Fund: 297.10 a month, on 12 months = 3,565.20.
await visit(INCOME);
await chip("The year");
await fill("Basic salary, in rupees", "1500000");
await page.getByLabel("Dependents you claim for").selectOption("2");
await page.locator("details.elsewhere > summary").click();
await fill("Medical or health insurance premium", "80,000");
await fill("Interest paid on a housing loan", "120,000");
await fill("Paid into an approved personal pension scheme", "60 000");
await lines("income tax, example 2: MUR 1,500,000 with two dependents and three reliefs is MUR 64,000.00 of tax", {
  income: "MUR 1,500,000.00",
  dependents: "MUR 190,000.00",
  medical: "MUR 70,000.00",
  housing: "MUR 120,000.00",
  pension: "MUR 50,000.00",
  chargeable: "MUR 1,070,000.00",
  "band-1": "MUR 50,000.00",
  "band-2": "MUR 14,000.00",
  tax: "MUR 64,000.00",
  "tax-month": "MUR 5,333.33",
  effective: "4.3%",
  csg: "MUR 45,000.00",
  nsf: "MUR 3,565.20",
});
check("income tax: a relief over its cap is cut to the cap, and the line says so", /MUR 80,000\.00 was entered\. The most allowed is MUR 70,000\.00\./.test(await row("medical")));
check("income tax: a cap is shown beside its field, in the guide's words and for the dependents claimed", /Up to MUR 70,000 with the dependents you claim for/.test(await page.locator("main").innerText()) && /The contribution, up to MUR 50,000\./.test(await page.locator("main").innerText()) && /The wages paid, up to MUR 30,000\./.test(await page.locator("main").innerText()));

// Example 3. A resident on MUR 15,000,000 a year, no dependents, who enters 200,000 of housing interest.
//   The interest is refused: income is above 4 million. Chargeable income stays 15,000,000.
//   Tax: 0 + 50,000 + 20% of 11,000,000 = 2,200,000 + 35% of the last 3,000,000 = 1,050,000.
//   Total 3,300,000. A month: 275,000. Share of income: 3,300,000 / 15,000,000 = 22%.
await visit(INCOME);
await chip("The year");
await fill("Basic salary, in rupees", "15,000,000");
await page.locator("details.elsewhere > summary").click();
await fill("Interest paid on a housing loan", "200,000");
await lines("income tax, example 3: MUR 15,000,000 reaches the 35% band and is MUR 3,300,000.00 of tax", {
  housing: "MUR 0.00",
  chargeable: "MUR 15,000,000.00",
  "band-1": "MUR 50,000.00",
  "band-2": "MUR 2,200,000.00",
  "band-3": "MUR 1,050,000.00",
  tax: "MUR 3,300,000.00",
  "tax-month": "MUR 275,000.00",
  effective: "22%",
});
check("income tax: housing loan interest is refused above the income ceiling, in words", /Not allowed: income is above MUR 4,000,000\./.test(await row("housing")));

// Example 4. The same person not resident, on MUR 1,200,000 a year: no deductions, the same bands.
//   Tax: 0 + 10% of 500,000 = 50,000 + 20% of 200,000 = 40,000. Total 90,000.
await visit(INCOME);
await chip("The year");
await fill("Basic salary, in rupees", "1,200,000");
await page.getByLabel("Dependents you claim for").selectOption("2");
check("income tax: a resident with two dependents pays on MUR 1,010,000.00", (await line("chargeable")) === "MUR 1,010,000.00" && (await line("tax")) === "MUR 52,000.00", `${await line("chargeable")} ${await line("tax")}`);
await chip("Not resident");
await lines("income tax, example 4: a non-resident on MUR 1,200,000 has no deductions and pays MUR 90,000.00", { chargeable: "MUR 1,200,000.00", none: "MUR 0.00", tax: "MUR 90,000.00" });
check("income tax: a non-resident is not asked for dependents or reliefs", (await page.getByLabel("Dependents you claim for").count()) === 0 && /Only a person resident in Mauritius/.test(await page.locator("main").innerText()));

// An error is said in words, beside the field, and nothing is worked out on it.
await visit(INCOME);
await fill("Basic salary, in rupees", "sixty thousand");
const salary = page.getByLabel("Basic salary, in rupees", { exact: true });
const said = await page.locator('main p[id$="-salary-error"]').innerText();
check("income tax: something that is not a number is refused in words, on the field", /Enter the amount in figures, such as 45000 or 45,000\./.test(said) && (await salary.getAttribute("aria-invalid")) === "true" && ((await salary.getAttribute("aria-describedby")) ?? "").includes("-error"));
check("income tax: and no tax is worked out until it is put right", /Put right the field/.test(await status()) && (await page.locator("[data-line]").count()) === 0);
await fill("Basic salary, in rupees", "45,000");
check("income tax: put right, the working comes back", (await line("tax")) === "MUR 4,000.00", await line("tax")); // 45,000 x 12 = 540,000; 10% of 40,000 = 4,000.

// A sole trader's profit arrives in the address.
// Example 5. Profit of MUR 1,200,000 and nothing else.
//   Tax: 50,000 + 40,000 = 90,000. CSG as a self-employed person: 1,200,000 / 12 = 100,000 a month,
//   above 50,000, so 3% of 90% of 100,000 = 2,700 a month, 32,400 a year.
await visit(`${INCOME}?profit=1200000`);
check("income tax: a profit handed over in the address fills its field", (await page.getByLabel("Profit from a business or profession, for the year").inputValue()) === "1200000");
await lines("income tax, example 5: a profit of MUR 1,200,000 is MUR 90,000.00 of tax and MUR 32,400.00 of CSG", { profit: "MUR 1,200,000.00", tax: "MUR 90,000.00", "self-csg": "MUR 32,400.00" });
// And a smaller one: MUR 360,000 is 30,000 a month, so 1.5% of 90% of 30,000 = 405 a month, 4,860 a year. No tax under 500,000.
await fill("Profit from a business or profession, for the year", "360,000");
await lines("income tax: a profit of MUR 360,000 bears no tax and MUR 4,860.00 of CSG", { tax: "MUR 0.00", "self-csg": "MUR 4,860.00" });

// ---------------------------------------------------------------------------------------------
// 2. The business tax estimator.
// ---------------------------------------------------------------------------------------------
const BUSINESS = `${origin}/tools/business-tax`;
await visit(BUSINESS);
const aboutBusiness = await page.locator("main").innerText();
check("business tax: says which law the figures are those of, and the day they were checked", /checked \d{1,2} [A-Z][a-z]+ \d{4}\. Figures are those in force on/.test(aboutBusiness));
check("business tax: general information, not tax advice, with the MRA's page and the article", /General information, not tax advice/.test(aboutBusiness) && (await page.locator('main a[href="https://www.mra.mu/index.php/business/corporate-tax"]').count()) === 1 && (await page.locator('main a[href="/learn/business-taxes"]').count()) >= 2);

// Example 1. A company with turnover of MUR 20,000,000 and chargeable income of 2,000,000
// (1,500,000 the year before), whose year ends in June.
//   Income tax: 15% of 2,000,000 = 300,000. CSR Fund: 2% of last year's 1,500,000 = 30,000.
//   CCR levy: none, turnover is not above 50 million. Fair Share Contribution: none, chargeable
//   income is not above 24 million. Total 330,000, which is 16.5% of the profit.
//   APS: turnover is above 10 million. Quarters July to September, October to December and
//   January to March, each due 3 months on: the end of December and of June come 2 days early.
//   The return is due 6 months after June: the end of December, 2 days early.
//   VAT: 20,000,000 is over the 3,000,000 threshold by 17,000,000.
await fill("Turnover for the year, in rupees", "20,000,000");
await fill("Chargeable income for the year", "2,000,000");
await fill("Chargeable income of the year before", "1,500,000");
await lines("business tax, example 1: a company's MUR 2,000,000 bears MUR 330,000.00", {
  chargeable: "MUR 2,000,000.00",
  "income-tax": "MUR 300,000.00",
  csr: "MUR 30,000.00",
  ccr: "MUR 0.00",
  "fair-share": "MUR 0.00",
  total: "MUR 330,000.00",
  effective: "16.5%",
  aps: "Quarterly statements: turnover is above MUR 10,000,000",
  "quarter-1": "2 days before the end of December, excluding Saturdays and public holidays",
  "quarter-2": "By the end of March",
  "quarter-3": "2 days before the end of June, excluding Saturdays and public holidays",
  return: "2 days before the end of December, excluding Saturdays and public holidays",
});
check("business tax: the levies that do not apply say why", /None: turnover is MUR 50,000,000 or less/.test(await row("ccr")) && /None: chargeable income is MUR 24,000,000 or less/.test(await row("fair-share")));
check("business tax: a turnover over the VAT threshold says registration is compulsory", /over the VAT registration threshold of MUR 3,000,000 by MUR 17,000,000\.00, so registering for VAT is compulsory/.test(await page.locator('[data-line="vat"]').innerText()));
// The same company with a December year end: quarters January to March, April to June, July to September.
await page.getByLabel("The accounting year ends in").selectOption({ label: "December" });
check(
  "business tax: a December year end moves the quarters and the return",
  /First quarter, January to March/.test(await page.locator("main").innerText()) && (await line("quarter-1")) === "2 days before the end of June, excluding Saturdays and public holidays" && (await line("quarter-2")) === "By the end of September" && (await line("return")) === "2 days before the end of June, excluding Saturdays and public holidays",
  `${await line("quarter-1")} | ${await line("quarter-2")} | ${await line("return")}`,
);

// Example 2. A company with turnover of MUR 300,000,000 and chargeable income of 30,000,000 (28,000,000 the year before).
//   Income tax: 15% of 30,000,000 = 4,500,000. CSR Fund: 2% of 28,000,000 = 560,000.
//   CCR levy: 2% of 30,000,000 = 600,000 (turnover is above 50 million).
//   Fair Share Contribution: 5% of 30,000,000 = 1,500,000 (chargeable income is above 24 million).
//   Total: 4,500,000 + 560,000 + 600,000 + 1,500,000 = 7,160,000, which is 23.87% of the profit, shown as 23.9%.
await visit(BUSINESS);
await fill("Turnover for the year, in rupees", "300000000");
await fill("Chargeable income for the year", "30000000");
await fill("Chargeable income of the year before", "28000000");
await lines("business tax, example 2: a large company's MUR 30,000,000 bears MUR 7,160,000.00", { "income-tax": "MUR 4,500,000.00", csr: "MUR 560,000.00", ccr: "MUR 600,000.00", "fair-share": "MUR 1,500,000.00", total: "MUR 7,160,000.00", effective: "23.9%" });

// Example 3. An exporter: turnover of MUR 80,000,000, of which 60,000,000 from exporting goods,
// chargeable income of 10,000,000 (8,000,000 the year before).
//   Share from exports: 60 / 80 of 10,000,000 = 7,500,000, at 3% = 225,000.
//   The rest: 2,500,000 at 15% = 375,000. Income tax 600,000. CSR Fund: 2% of 8,000,000 = 160,000.
//   CCR levy: 2% of 10,000,000 = 200,000. Fair Share Contribution: none. Total 960,000, which is 9.6%.
await visit(BUSINESS);
await fill("Turnover for the year, in rupees", "80,000,000");
await fill("Chargeable income for the year", "10,000,000");
await fill("Chargeable income of the year before", "8,000,000");
await chip("It exports goods");
await fill("Gross income from exporting goods", "60,000,000");
await lines("business tax, example 3: an exporter's MUR 10,000,000 bears MUR 960,000.00", { "tax-exports": "MUR 225,000.00", "tax-rest": "MUR 375,000.00", "income-tax": "MUR 600,000.00", csr: "MUR 160,000.00", ccr: "MUR 200,000.00", "fair-share": "MUR 0.00", total: "MUR 960,000.00", effective: "9.6%" });
// An error in words: exports cannot be more than the turnover.
await fill("Gross income from exporting goods", "90,000,000");
check("business tax: exports larger than the turnover are refused in words, on the field", /Exports cannot be more than the turnover\./.test(await page.locator('main p[id$="-exports-error"]').innerText()) && (await page.getByLabel("Gross income from exporting goods").getAttribute("aria-invalid")) === "true" && /Put right the field/.test(await status()));
await fill("Gross income from exporting goods", "many");
check("business tax: something that is not a number is refused in words", /Enter the amount in figures, such as 2400000 or 2,400,000\./.test(await page.locator('main p[id$="-exports-error"]').innerText()));
// What the Act does not settle is not worked out: a company taxed at both rates, over the Fair Share test.
await fill("Gross income from exporting goods", "60,000,000");
await fill("Chargeable income for the year", "30,000,000");
check("business tax: the Fair Share Contribution of a company taxed at both rates is not guessed", (await line("fair-share")) === "Not worked out" && (await line("total")) === "Not worked out" && /does not say how a company taxed at both is treated/.test(await row("fair-share")));

// Example 4. Partial exemption: chargeable income of MUR 5,000,000 before it, of which 1,000,000
// is foreign dividends; turnover 12,000,000; last year's figure not entered.
//   Exempt: 80% of 1,000,000 = 800,000. Chargeable income: 4,200,000. Income tax: 15% = 630,000.
//   CSR Fund, on this year's figure as a stand-in: 2% of 4,200,000 = 84,000. Total 714,000.
await visit(BUSINESS);
await fill("Turnover for the year, in rupees", "12,000,000");
await fill("Chargeable income for the year", "5,000,000");
await chip("Some income is partly exempt");
await fill("Income of a kind that is partly exempt", "1,000,000");
await lines("business tax, example 4: 80% of MUR 1,000,000 of partly exempt income is taken off", { exempt: "MUR 800,000.00", chargeable: "MUR 4,200,000.00", "income-tax": "MUR 630,000.00", csr: "MUR 84,000.00", total: "MUR 714,000.00" });
check("business tax: a CSR Fund worked on this year's figure says so", /this year's figure, as last year's was not entered/.test(await row("csr")));

// Example 5. A small enterprise choosing the presumptive tax, on a turnover of MUR 8,000,000: 1% = 80,000.
await visit(BUSINESS);
await fill("Turnover for the year, in rupees", "8,000,000");
await fill("Chargeable income for the year", "900,000");
await chip("A small enterprise choosing the presumptive tax");
check("business tax, example 5: the presumptive tax on MUR 8,000,000 is MUR 80,000.00", (await line("income-tax")) === "MUR 80,000.00" && /Presumptive tax, 1% of gross income/.test(await page.locator("main").innerText()), await line("income-tax"));
check("business tax: MUR 8,000,000 is over the VAT threshold by MUR 5,000,000.00", /it is over the VAT registration threshold of MUR 3,000,000 by MUR 5,000,000\.00/.test(await page.locator('[data-line="vat"]').innerText()));
await fill("Turnover for the year, in rupees", "20,000,000");
check("business tax: above MUR 10 million the presumptive tax is said not to be open, and the usual sum is shown", /Not open to this business: its gross income is above MUR 10,000,000/.test(await page.locator("main").innerText()) && (await line("income-tax")) === "MUR 135,000.00", await line("income-tax")); // 15% of 900,000.
await fill("Turnover for the year, in rupees", "2,000,000");
check("business tax: a turnover of MUR 2,000,000 is not over the VAT threshold", /That turnover is not over the VAT registration threshold of MUR 3,000,000/.test(await page.locator('[data-line="vat"]').innerText()));

// Example 6. A société: turnover of MUR 60,000,000, net income of 6,000,000 (5,000,000 the year before),
// one associate holding half.
//   No income tax on the société. CSR Fund: 2% of 5,000,000 = 100,000. CCR levy: 2% of 6,000,000 = 120,000.
//   Borne by the société: 220,000. The associate's share: 50% of 6,000,000 = 3,000,000.
await visit(BUSINESS);
await chip("A société or partnership");
await fill("Turnover for the year, in rupees", "60,000,000");
await fill("Profit for the year", "6,000,000");
await fill("Net income of the year before", "5,000,000");
await fill("One associate's share of the profit, in per cent", "50");
await lines("business tax, example 6: a société bears MUR 220,000.00 and its associates the income tax", { "income-tax": "Not taxed itself: each associate pays on a share", csr: "MUR 100,000.00", ccr: "MUR 120,000.00", total: "MUR 220,000.00", associate: "MUR 3,000,000.00" });
check("business tax: an associate's share leads to the personal calculator", (await page.locator('main a[href="/tools/income-tax?profit=3000000"]').count()) === 1 && /by 30 September/.test(await row("return")));
await fill("One associate's share of the profit, in per cent", "150");
check("business tax: a share over 100 per cent is refused in words", /A share cannot be more than 100 per cent\./.test(await page.locator('main p[id$="-share-error"]').innerText()));

// Example 7. A sole trader with a profit of MUR 1,200,000 is handed to the personal calculator,
// where the tax is 50,000 + 40,000 = 90,000 (example 5 of the first tool).
await visit(BUSINESS);
await chip("A sole trader");
await fill("Turnover for the year, in rupees", "5,000,000");
await fill("Profit for the year", "1,200,000");
check("business tax, example 7: a sole trader is said to be taxed as an individual", (await line("sole")) === "Taxed as an individual" && (await line("profit")) === "MUR 1,200,000.00" && /Quarterly statements: turnover is above MUR 4,000,000/.test(await line("cps")));
await page.locator("main a", { hasText: "Work out the income tax" }).click();
await page.waitForURL(/\/tools\/income-tax\?profit=1200000$/, { timeout: 8000 }).catch(() => {});
await page.waitForSelector('[data-line="tax"]', { timeout: 8000 }).catch(() => {});
check("business tax: and the profit is carried in the address to the personal calculator", /\/tools\/income-tax\?profit=1200000$/.test(page.url()) && (await line("tax")) === "MUR 90,000.00", `${page.url()} ${await line("tax")}`);

// ---------------------------------------------------------------------------------------------
// 3. The articles the figures are read from, and the ways in.
// ---------------------------------------------------------------------------------------------
await page.goto(`${origin}/learn/personal-income-tax-in-mauritius`, { waitUntil: "domcontentloaded" });
const personal = await page.locator("main").innerText();
check(
  "article, personal income tax: the figures the calculator uses are in it",
  ["0% on the first MUR 500,000, 10% on the next MUR 500,000, 20% on the next MUR 11 million, 35% on the remainder", "MUR 110,000 for one, MUR 190,000 for two, MUR 275,000 for three, MUR 355,000 for four or more", "MUR 500,000 for each child", "up to MUR 60,000 for each child", "MUR 4 million", "MUR 25,000 each for self and a first dependent", "up to MUR 50,000", "up to MUR 100,000", "up to MUR 30,000", "1.5% where monthly basic pay is MUR 50,000 or less, 3% where it is more", "1% of basic pay up to MUR 29,710 a month", "MUR 150 a month", "By 15 October"].every((words) => personal.includes(words)),
);
check("article, personal income tax: every figure cites, and its tables are there", (await page.locator("a.cite").count()) > 30 && (await page.locator("table.table").count()) >= 5 && (await page.locator('main a[href="/tools/income-tax"]').count()) === 1);
await page.goto(`${origin}/learn/business-taxes`, { waitUntil: "domcontentloaded" });
const taxes = await page.locator("main").innerText();
check(
  "article, business taxes: the figures the estimator uses are in it",
  ["2% of chargeable income, where turnover is above MUR 50 million", "5% of chargeable income, or 2% for a company taxed at 3%, where chargeable income is above MUR 24 million", "80% of listed kinds of income", "1% of gross income, where gross income is MUR 10 million or less", "Gross income above MUR 10 million", "Within 3 months of the end of each of the first three quarters", "Within 6 months of the year end", "2 days earlier, excluding Saturdays and public holidays", "Not taxed itself: each associate pays on a share", "A société or partnership"].every((words) => taxes.includes(words)),
);
check("article, business taxes: it leads to the estimator and to the article on personal income tax", (await page.locator('main a[href="/tools/business-tax"]').count()) === 1 && (await page.locator('main a[href="/learn/personal-income-tax-in-mauritius"]').count()) >= 1);
await page.goto(`${origin}/tools`, { waitUntil: "domcontentloaded" });
check("the tools page lists both", (await page.locator('main a[href="/tools/income-tax"]').count()) === 1 && (await page.locator('main a[href="/tools/business-tax"]').count()) === 1);
await page.goto(`${origin}/search?q=${encodeURIComponent("income tax calculator")}`, { waitUntil: "domcontentloaded" });
check("the personal calculator is found by its name", (await page.locator('main article a[href="/tools/income-tax"]').count()) === 1);
await page.goto(`${origin}/search?q=${encodeURIComponent("business tax estimator")}`, { waitUntil: "domcontentloaded" });
check("the business estimator is found by its name", (await page.locator('main article a[href="/tools/business-tax"]').count()) === 1);
const sitemap = await (await page.request.get(`${origin}/sitemap.xml`)).text();
check("sitemap: both tools and the new article", /\/tools\/income-tax</.test(sitemap) && /\/tools\/business-tax</.test(sitemap) && /\/learn\/personal-income-tax-in-mauritius</.test(sitemap));

// ---------------------------------------------------------------------------------------------
// 4. Without script: the same sums, worked on the server, in a table.
// ---------------------------------------------------------------------------------------------
const plain = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
const still = await plain.newPage();
await still.goto(INCOME, { waitUntil: "domcontentloaded" });
// The row for MUR 780,000 is example 1's tax, and for two dependents 10% of (780,000 - 190,000 - 500,000) = 9,000.
// The row for MUR 15,000,000 is example 3's: 3,300,000, and with two dependents 35% less on 190,000: 3,233,500.
const rowOf = async (first) => (await still.locator("table.table tbody tr", { hasText: first }).first().innerText()).replace(/\s+/g, " ");
check("no script, income tax: the examples are in a table, worked from the same figures", /^MUR 780,000 a year MUR 28,000\.00 MUR 9,000\.00 MUR 23,400\.00 MUR 3,565\.20$/.test((await rowOf("MUR 780,000")).trim()), await rowOf("MUR 780,000"));
check("no script, income tax: the 35% band is in the table too", /MUR 3,300,000\.00.*MUR 3,233,500\.00/.test(await rowOf("MUR 15,000,000")), await rowOf("MUR 15,000,000"));
check("no script, income tax: the page says the calculator needs script", /The calculator needs JavaScript/.test(await still.locator("main").innerText()));
await still.goto(BUSINESS, { waitUntil: "domcontentloaded" });
// The rows are examples 1 and 2 with last year's chargeable income the same: 300,000 + 40,000 = 340,000,
// and 4,500,000 + 600,000 + 600,000 + 1,500,000 = 7,200,000.
check("no script, business tax: the examples are in a table, worked from the same figures", /MUR 300,000\.00.*MUR 40,000\.00.*MUR 0\.00.*MUR 0\.00.*MUR 340,000\.00/.test(await rowOf("MUR 2,000,000")) && /MUR 4,500,000\.00.*MUR 600,000\.00.*MUR 600,000\.00.*MUR 1,500,000\.00.*MUR 7,200,000\.00/.test(await rowOf("MUR 30,000,000")), `${await rowOf("MUR 2,000,000")} | ${await rowOf("MUR 30,000,000")}`);
await plain.close();

// ---------------------------------------------------------------------------------------------
// 5. A phone: nothing wider than the screen, empty or filled in.
// ---------------------------------------------------------------------------------------------
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const small = await phone.newPage();
small.on("pageerror", (e) => errors.push(e.message));
const over = () => small.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth, innerWidth) - 390);
await visit(INCOME, small);
check("phone: the income tax calculator is no wider than the screen", (await over()) <= 0, `${await over()}px`);
await small.getByLabel("Basic salary, in rupees", { exact: true }).fill("125,000");
await small.getByLabel("Dependents you claim for").selectOption("4");
await small.locator("details.elsewhere > summary").click();
await small.getByLabel("Medical or health insurance premium").fill("200,000");
await small.getByLabel("Paid into an approved personal pension scheme").fill("x");
check("phone: nor with the reliefs open, an error showing", (await over()) <= 0, `${await over()}px`);
await small.getByLabel("Paid into an approved personal pension scheme").fill("");
check("phone: nor with the working shown", (await over()) <= 0 && (await small.locator('[data-line="tax"]').count()) === 1, `${await over()}px`);
await visit(BUSINESS, small);
check("phone: the business tax estimator is no wider than the screen", (await over()) <= 0, `${await over()}px`);
await small.getByLabel("Turnover for the year, in rupees").fill("300,000,000");
await small.getByLabel("Chargeable income for the year").fill("30,000,000");
await small.locator("label.chip", { hasText: "It exports goods" }).click();
await small.getByLabel("Gross income from exporting goods").fill("100,000,000");
check("phone: nor with a company's working shown", (await over()) <= 0 && (await small.locator('[data-line="total"]').count()) === 1, `${await over()}px`);
await phone.close();

// ---------------------------------------------------------------------------------------------
// 6. Accessibility with the tools in use. scripts/a11y.mjs sees each page as it opens; this looks
// again with the reliefs open, an error showing and the working on the page, at a desk and on a phone.
// ---------------------------------------------------------------------------------------------
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
for (const [name, size] of [
  ["desk", { width: 1440, height: 900 }],
  ["phone", { width: 390, height: 844 }],
]) {
  const view = await browser.newContext({ viewport: size, reducedMotion: "reduce" });
  const used = await view.newPage();
  const axe = async (state) => {
    const { violations } = await new AxeBuilder({ page: used }).withTags(TAGS).analyze();
    const bad = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    check(`accessibility, ${name}: ${state}`, bad.length === 0, bad.map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`).join("; "));
  };
  await visit(INCOME, used);
  await used.getByLabel("Basic salary, in rupees", { exact: true }).fill("125,000");
  await used.getByLabel("Dependents you claim for").selectOption("2");
  await used.locator("label.chip", { hasText: "Retired or disabled person" }).click();
  await used.locator("details.elsewhere > summary").click();
  await used.getByLabel("Dependent children at university").selectOption("1");
  await used.getByLabel("Medical or health insurance premium").fill("80,000");
  await used.getByLabel("Paid into an approved personal pension scheme").fill("not a number");
  await axe("the income tax calculator with the reliefs open and an error showing");
  await used.getByLabel("Paid into an approved personal pension scheme").fill("60,000");
  await axe("the income tax calculator with its working shown");
  await visit(BUSINESS, used);
  await used.getByLabel("Turnover for the year, in rupees").fill("80,000,000");
  await used.getByLabel("Chargeable income for the year").fill("30,000,000");
  await used.locator("label.chip", { hasText: "It exports goods" }).click();
  await used.getByLabel("Gross income from exporting goods").fill("90,000,000");
  await axe("the business tax estimator with an error showing");
  await used.getByLabel("Gross income from exporting goods").fill("60,000,000");
  await axe("the business tax estimator with a company's working shown");
  await used.locator("label.chip", { hasText: "A sole trader" }).click();
  await axe("the business tax estimator for a sole trader");
  await used.locator("label.chip", { hasText: "A société or partnership" }).click();
  await used.getByLabel("One associate's share of the profit, in per cent").fill("50");
  await axe("the business tax estimator for a société");
  await view.close();
}

check("no page errors", errors.length === 0, errors.slice(0, 2).join(" | "));
console.log(`\n${passed} passed, ${failed} failed`);
await browser.close();
process.exit(failed ? 1 : 0);
