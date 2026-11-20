/**
 * The mark of a business a person has checked to be real, and, with `priority`, of one that pays
 * to be shown first. A paid place is never shown without it.
 *
 * A stand-in: the mark itself is drawn in the main checkout and replaces this file when the two
 * are merged. The name and the props are the ones agreed, so nothing that uses it changes.
 */
export function VerifiedMark({ size = "sm", priority = false }: { size?: "sm" | "lg"; priority?: boolean }) {
  return (
    <span className={`tag tag-lit ${size === "lg" ? "body-3" : "caption-1"} ml-2 align-middle font-semibold`}>
      Verified
      {priority && <span> · Priority listing</span>}
    </span>
  );
}
