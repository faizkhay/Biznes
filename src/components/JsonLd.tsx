/**
 * Structured data for a page, escaped so that a "<" anywhere in the data can never close the script.
 * Build `data` from the same data the page renders, so the two cannot disagree; leave out anything
 * the client has not confirmed (references/discoverability.md).
 *
 *   <JsonLd data={{ "@context": "https://schema.org", "@graph": [organization, website, page] }} />
 *
 * KOS kit. The escape is the agency site's (prerender.mjs); Aqua's JSON-LD was not escaped.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
