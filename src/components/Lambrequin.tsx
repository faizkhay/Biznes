import { useId } from "react";

/**
 * The lambrequin: the cut fringe that hangs under the roof of a creole shop. Here it hangs from
 * the lower edge of one ground onto the next, as the street's roofs do, so a change of section
 * reads as a roof line and not as a rule. One tooth, repeated; decoration, hidden from assistive
 * technology. It takes the colour of the ground it hangs from through `currentColor`.
 */
export default function Lambrequin({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg className={["block h-4 w-full", className].filter(Boolean).join(" ")} aria-hidden focusable="false" preserveAspectRatio="none">
      <defs>
        <pattern id={id} width="20" height="16" patternUnits="userSpaceOnUse">
          <path d="M0 0h20v4L10 16 0 4z" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="16" fill={`url(#${id})`} />
    </svg>
  );
}
