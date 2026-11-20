import type { Metadata } from "next";
import { site } from "@/data/site";

/**
 * A page's metadata, the same way for every page: a title and a description of its own, its
 * canonical address, and the same again for the card a link to it shows when it is pasted
 * somewhere. The card's picture is the first screen's (public/og.jpg) unless the page has a drawn
 * card of its own (an opengraph-image file beside it), which takes its place.
 *
 * `index: false` is for a page that is one visitor's own or one of countless (a search's results,
 * a shortlist, the cart): it asks not to be indexed. `article` marks a page as an article with the
 * day it was last checked; `markdown` names the same page as plain Markdown, for a reader that
 * asks for it. `whole` gives the title as it is, without the site's name after it. `drawn` says
 * the page has a drawn card beside it: no picture is named here then, because one named here
 * would be used in the drawn card's place.
 */
export function pageMeta({ title, description, path, index = true, article, markdown, whole = false, drawn = false }: { title: string; description: string; path: string; index?: boolean; article?: { modified: string }; markdown?: string; whole?: boolean; drawn?: boolean }): Metadata {
  const images = drawn ? undefined : [{ url: "/og.jpg", width: 1200, height: 630, alt: `${site.name}: ${site.line}.` }];
  return {
    title: whole ? { absolute: title } : title,
    description,
    alternates: { canonical: path, ...(markdown ? { types: { "text/markdown": markdown } } : {}) },
    openGraph: article ? { type: "article", siteName: site.name, locale: site.locale, title, description, url: path, modifiedTime: article.modified, ...(images ? { images } : {}) } : { type: "website", siteName: site.name, locale: site.locale, title, description, url: path, ...(images ? { images } : {}) },
    twitter: { card: "summary_large_image", title, description },
    ...(index ? {} : { robots: { index: false, follow: true } }),
  };
}
