// How names are tidied, and how an address in a URL is made from one.

/** A name as it is shown: one line, plain dashes, straight apostrophes left as the map wrote them. */
export function tidy(text, max = 160) {
  return String(text ?? "")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u0000-\u001f\u007f\u200b-\u200f\ufeff]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Lower case, unaccented, words joined by hyphens: "Café de l'Île" becomes "cafe-de-l-ile". */
export function slugify(text) {
  return String(text ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/, "");
}

/** A web address written fully, or null if it is not one. Tracking parameters are dropped. */
export function webAddress(raw) {
  let value = String(raw ?? "").trim().split(/[;\s]/)[0];
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const url = new URL(value);
    if (!url.hostname.includes(".")) return null;
    for (const name of [...url.searchParams.keys()]) if (/^(utm_|fbclid|gclid|y_source|ref$)/i.test(name)) url.searchParams.delete(name);
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

/** The site an address belongs to, without "www.". */
export function hostOf(address) {
  try {
    return new URL(address).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Sites that belong to everybody: a page on one of them is a profile, not a business's own site. */
export const SHARED_HOSTS = /(^|\.)(facebook|fb|instagram|linkedin|twitter|x|youtube|youtu|tiktok|tripadvisor|booking|airbnb|google|goo|bit|wa|whatsapp|linktr|wixsite|wordpress|blogspot|business\.site|sites\.google|pinterest|yelp|foursquare|expedia|hotels|agoda|trivago|apple|play\.google|t|telegram|messenger|maps\.app|wikipedia|wikimedia|openstreetmap|github|medium|shopify|myshopify|canva|calendly|zoom|paypal)\.[a-z.]+$/i;
