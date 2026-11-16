// Structured data, built from the same data the pages render so the two cannot disagree. Nothing
// unconfirmed goes in: a sample listing is never described as an offer.
import type { Business } from "@/data/businesses";
import { FAQS } from "@/data/pack";
import { site } from "@/data/site";
import { siteUrl } from "./site-url";

const org = {
  "@type": "Organization",
  "@id": `${siteUrl}/#organization`,
  name: site.name,
  url: siteUrl,
  description: site.description,
  parentOrganization: {
    "@type": "Organization",
    name: site.builder.legalName,
    url: site.builder.url,
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: site.contact.phone,
    email: site.contact.email,
    contactType: "sales",
    areaServed: "MU",
    availableLanguage: ["en", "fr", "mfe"],
  },
};

const website = { "@type": "WebSite", "@id": `${siteUrl}/#website`, name: site.name, url: siteUrl, publisher: { "@id": org["@id"] } };

type Crumb = { name: string; path: string };

const breadcrumbs = (crumbs: Crumb[]) => ({
  "@type": "BreadcrumbList",
  itemListElement: [{ name: "Home", path: "/" }, ...crumbs].map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: c.name,
    item: `${siteUrl}${c.path === "/" ? "" : c.path}`,
  })),
});

/** The graph for a page: the organisation, the site, the page node, and its trail below home. */
export function pageGraph({
  type = "WebPage",
  path,
  name,
  description,
  crumbs = [],
  extra = [],
}: {
  type?: "WebPage" | "CollectionPage" | "ContactPage" | "FAQPage";
  path: string;
  name: string;
  description: string;
  crumbs?: Crumb[];
  extra?: Record<string, unknown>[];
}) {
  const url = `${siteUrl}${path === "/" ? "" : path}`;
  const page: Record<string, unknown> = {
    "@type": type,
    "@id": `${url}#page`,
    url,
    name,
    description,
    isPartOf: { "@id": website["@id"] },
    inLanguage: "en",
  };
  if (type === "FAQPage") {
    page.mainEntity = FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } }));
  }
  return {
    "@context": "https://schema.org",
    "@graph": [org, website, page, ...(crumbs.length ? [breadcrumbs(crumbs)] : []), ...extra],
  };
}

/** A real listing as a product with one offer. Never called for a sample. */
export function businessOffer(b: Business) {
  const url = `${siteUrl}/businesses/${b.slug}`;
  return {
    "@type": "Product",
    "@id": `${url}#business`,
    name: b.name,
    description: b.line,
    category: b.sector,
    url,
    brand: { "@type": "Brand", name: b.name },
    ...(site.showPrices
      ? {
          offers: {
            "@type": "Offer",
            price: b.price,
            priceCurrency: "MUR",
            availability: b.status === "available" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
            url,
            seller: { "@id": org["@id"] },
          },
        }
      : {}),
  };
}
