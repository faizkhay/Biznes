// The mark of a verified business: a seal with a tick. It is the most vivid thing on a page on
// purpose. It says two things and no more: that biznes.mu has checked the business is real, and,
// with `priority`, that the business pays for its place, which the site always says.
const SEAL = "M12.00 1.60L14.25 3.60L17.20 2.99L18.15 5.85L21.01 6.80L20.40 9.75L22.40 12.00L20.40 14.25L21.01 17.20L18.15 18.15L17.20 21.01L14.25 20.40L12.00 22.40L9.75 20.40L6.80 21.01L5.85 18.15L2.99 17.20L3.60 14.25L1.60 12.00L3.60 9.75L2.99 6.80L5.85 5.85L6.80 2.99L9.75 3.60Z";

/** The seal alone: a rosette with a tick. */
export function Seal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable={false}>
      <path d={SEAL} fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m8.1 12.3 2.7 2.7 5.2-5.6" fill="none" stroke="var(--seal-tick, #fff)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The mark, in words: "Verified", and "Priority listing" for a business that pays to come first. */
export function VerifiedMark({ size = "sm", priority = false }: { size?: "sm" | "lg"; priority?: boolean }) {
  return (
    <span className={`verified ${size === "lg" ? "verified-lg" : ""}`}>
      <Seal />
      <span>Verified</span>
      {priority && <span className="verified-more">Priority listing</span>}
    </span>
  );
}
