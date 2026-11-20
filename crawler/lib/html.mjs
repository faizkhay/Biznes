// What the crawler takes from a page: what the page says about itself, and nothing else.
//
// Its title, its own description, its language, what it declares as an organisation in
// schema.org markup, a telephone link, its social profiles, and the other sites it links to.
// Email addresses are never taken.

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "-", mdash: "-", hellip: "...", eacute: "é", egrave: "è", agrave: "à", ccedil: "ç", ocirc: "ô", ecirc: "ê", icirc: "î", ucirc: "û", acirc: "â", copy: "©", reg: "®", trade: "™", laquo: "«", raquo: "»" };

export function decodeEntities(text) {
  return String(text)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => safeChar(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => safeChar(Number(dec)))
    .replace(/&([a-z]+);/gi, (whole, name) => ENTITIES[name.toLowerCase()] ?? whole);
}
const safeChar = (code) => (code > 31 && code < 0x10ffff ? String.fromCodePoint(code) : " ");

/** Plain text of one line: tags gone, entities read, space collapsed, dashes made plain. */
export function clean(text, max = 400) {
  const out = decodeEntities(String(text ?? "").replace(/<[^>]*>/g, " "))
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u0000-\u001f\u007f\u200b-\u200f\ufeff]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (out.length <= max) return out;
  const cut = out.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 40)).replace(/[\s,;:.-]+$/, "")}...`;
}

function attr(tag, name) {
  const m = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tag);
  return m ? (m[2] ?? m[3] ?? m[4] ?? "") : "";
}

function metas(html) {
  const out = {};
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const name = (attr(tag, "name") || attr(tag, "property")).toLowerCase();
    const content = attr(tag, "content");
    if (name && content && !(name in out)) out[name] = content;
  }
  return out;
}

const SOCIAL = [
  ["facebook", /^https?:\/\/(?:www\.|m\.|web\.)?facebook\.com\/(?!sharer|share|dialog|tr\b|plugins|login|policies|help)([\w.\-%]+)\/?/i],
  ["instagram", /^https?:\/\/(?:www\.)?instagram\.com\/(?!p\/|explore|accounts|reel)([\w.\-]+)\/?/i],
  ["linkedin", /^https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/(?:company|school|showcase)\/([\w.\-%]+)\/?/i],
  ["youtube", /^https?:\/\/(?:www\.)?youtube\.com\/(?:@|c\/|channel\/|user\/)([\w.\-%]+)\/?/i],
  ["tiktok", /^https?:\/\/(?:www\.)?tiktok\.com\/@([\w.\-]+)\/?/i],
];

/** Every schema.org thing a page declares in JSON-LD, flattened. */
function jsonLd(html) {
  const things = [];
  for (const [, body] of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (node) => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (!node || typeof node !== "object") return;
        if (node["@graph"]) walk(node["@graph"]);
        if (node["@type"]) things.push(node);
      };
      walk(JSON.parse(body.trim()));
    } catch {
      // A page with broken markup has simply said nothing.
    }
  }
  return things;
}

const ORG_TYPES = /Organization|LocalBusiness|Corporation|Store|Restaurant|Hotel|LodgingBusiness|Dentist|Physician|MedicalBusiness|ProfessionalService|FinancialService|AutomotiveBusiness|TravelAgency|RealEstateAgent|LegalService|EducationalOrganization|NGO|FoodEstablishment|Bakery|CafeOrCoffeeShop/i;

const text = (v) => (typeof v === "string" ? v : v && typeof v === "object" && typeof v.name === "string" ? v.name : "");

/** A Mauritian telephone number, written one way: "+230 5xxx xxxx" or "+230 xxx xxxx". */
export function phone(raw) {
  let digits = String(raw ?? "").replace(/[^\d+]/g, "");
  if (digits.startsWith("00230")) digits = digits.slice(5);
  else if (digits.startsWith("+230")) digits = digits.slice(4);
  else if (digits.startsWith("230") && digits.length >= 10) digits = digits.slice(3);
  else if (digits.startsWith("+")) return null;
  digits = digits.replace(/\D/g, "");
  if (digits.length === 8 && digits.startsWith("5")) return `+230 ${digits.slice(0, 4)} ${digits.slice(4)}`;
  if (digits.length === 7 && /^[2-8]/.test(digits)) return `+230 ${digits.slice(0, 3)} ${digits.slice(3)}`;
  return null;
}

/**
 * What a page says about itself. `url` is the page's own address, used to resolve its links.
 */
export function extract(html, url) {
  const meta = metas(html);
  const title = clean(/<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? meta["og:title"] ?? "", 140);
  const description = clean(meta.description ?? meta["og:description"] ?? "", 320);
  const siteName = clean(meta["og:site_name"] ?? "", 80);
  const lang = (attr(/<html\b[^>]*>/i.exec(html)?.[0] ?? "", "lang") || "").slice(0, 5).toLowerCase();

  const org = jsonLd(html).find((t) => ORG_TYPES.test([].concat(t["@type"]).join(" ")));
  const address = org?.address && typeof org.address === "object" ? org.address : null;
  const declared = org
    ? {
        type: [].concat(org["@type"])[0],
        name: clean(text(org.name), 120),
        description: clean(text(org.description), 320),
        telephone: phone(text(org.telephone)),
        street: clean(text(address?.streetAddress), 120),
        locality: clean(text(address?.addressLocality), 60),
        country: clean(text(address?.addressCountry), 30),
      }
    : null;

  const links = new Set();
  const own = new Map();
  const social = {};
  let tel = null;
  const here = (() => {
    try {
      return new URL(url).host;
    } catch {
      return "";
    }
  })();
  for (const [whole, tag, inner] of html.matchAll(/(<a\b[^>]*>)([\s\S]{0,600}?)<\/a>/gi)) {
    void whole;
    const href = decodeEntities(attr(tag, "href")).trim();
    if (!href) continue;
    if (/^tel:/i.test(href)) {
      tel ??= phone(href.slice(4));
      continue;
    }
    if (/^(mailto|javascript|#|sms|whatsapp):?/i.test(href)) continue;
    let abs;
    try {
      abs = new URL(href, url);
    } catch {
      continue;
    }
    if (abs.protocol !== "http:" && abs.protocol !== "https:") continue;
    for (const [name, pattern] of SOCIAL) {
      if (!(name in social) && pattern.test(abs.href)) social[name] = abs.href.split(/[?#]/)[0].replace(/\/$/, "");
    }
    if (abs.host === here) {
      // A link to another page of the same site, with the words it is offered under.
      abs.hash = "";
      if (!own.has(abs.href)) own.set(abs.href, clean(inner, 80));
    } else links.add(abs.origin);
  }

  // A page parked by a registrar, or one that is only a holding notice, is not a business's site.
  const body = clean(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " "), 4000).toLowerCase();
  const parked = /domain (is )?(for sale|parked)|buy this domain|this domain (may be|is) for sale|account (has been )?suspended|default web page|website coming soon|under construction|index of \//.test(`${title.toLowerCase()} ${body.slice(0, 600)}`);

  // Whether the page says it is in Mauritius: by name, or by a telephone number with the country's code.
  const mauritian = /\bmauriti(us|an)\b|\bmaurice\b|\bmoris\b|\+\s?230[\s\d]|\(230\)/i.test(`${title} ${description} ${declared?.country ?? ""} ${body}`);

  return { title, description, siteName, lang, declared, tel: declared?.telephone ?? tel, social, links: [...links], own: [...own].map(([href, words]) => ({ href, words })), parked, mauritian, words: body.split(" ").length };
}
