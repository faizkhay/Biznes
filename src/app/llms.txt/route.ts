import { BUSINESSES } from "@/data/businesses";
import { FAQS, INCLUDED, STEPS } from "@/data/pack";
import { site } from "@/data/site";
import { formatPrice, listPlaces } from "@/lib/format";
import { siteUrl } from "@/lib/site-url";

// Written once at build time.
export const dynamic = "force-static";

/**
 * /llms.txt: what an AI assistant needs to describe biznes.mu correctly, written from the same data
 * the pages render, so it can never say something the site does not. Sample listings are left out.
 *
 * KOS kit. The shape is the agency site's.
 */
export function GET() {
  const { contact, builder } = site;
  const real = BUSINESSES.filter((b) => !b.sample && b.status !== "sold");
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    "## Facts",
    "",
    `- Built and sold by: ${builder.legalName}, Mauritius (BRN ${builder.brn}), ${builder.url}`,
    `- Phone and WhatsApp: ${contact.phone}`,
    `- Email: ${contact.email}`,
    `- Hours: ${contact.hours}`,
    "- Each business is sold once, to one owner.",
    "- The price covers the brand and what comes with it. Premises, licences, equipment, stock and staff are the buyer's to arrange. No income is promised.",
    "",
    "## What every business comes with",
    "",
    ...INCLUDED.map((i) => `- ${i.title}: ${i.line}`),
    "",
    "## How a sale runs",
    "",
    ...STEPS.map((s, i) => `${i + 1}. ${s.title}: ${s.line}`),
    "",
    "## Businesses for sale",
    "",
    ...(real.length
      ? real.map(
          (b) =>
            `- [${b.name}](${siteUrl}/businesses/${b.slug}): ${b.sector}, for ${listPlaces(b.places)}. ${b.line}${site.showPrices ? ` ${formatPrice(b.price).replace(" ", " ")}.` : ""}`,
        )
      : ["- None listed yet."]),
    "",
    "## Questions",
    "",
    ...FAQS.flatMap((f) => [`### ${f.q}`, "", f.a, ""]),
    "## Pages",
    "",
    `- [Home](${siteUrl}/): the businesses on the rail, what each comes with, and what stays with the buyer`,
    `- [Businesses](${siteUrl}/businesses): every business for sale, with its price`,
    `- [How it works](${siteUrl}/how-it-works): the sale in four steps, and the questions people ask`,
    `- [Enquire](${siteUrl}/enquire): send a request about a business, or call, WhatsApp or email`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
