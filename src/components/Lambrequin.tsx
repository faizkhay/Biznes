import { useId } from "react";

/**
 * The lambrequin: the cut fringe that hangs under the roof of a creole shop. Here it hangs from
 * the lower edge of one ground onto the next, as the street's roofs do, so a change of section
 * reads as a roof line and not as a rule. One pierced scallop, repeated: the same tooth the 3D
 * street and the drawn shopfronts wear. Decoration, hidden from assistive technology. It takes the
 * colour of the ground it hangs from through `currentColor`.
 */
export default function Lambrequin({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg className={["block h-4 w-full", className].filter(Boolean).join(" ")} aria-hidden focusable="false" preserveAspectRatio="none">
      <defs>
        <pattern id={id} width="24" height="16" patternUnits="userSpaceOnUse">
          <path fillRule="evenodd" d="M0 0h24v4a12 12 0 0 1-24 0zM12 5a2.25 2.25 0 1 0 0 4.5a2.25 2.25 0 0 0 0-4.5z" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="16" fill={`url(#${id})`} />
    </svg>
  );
}
