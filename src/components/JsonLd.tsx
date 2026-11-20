/**
 * Structured data for a page, escaped so that a "<" anywhere in the data can never close the script.
 * Built from the same data the page renders, so the two cannot disagree.
 *
 * KOS kit.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
