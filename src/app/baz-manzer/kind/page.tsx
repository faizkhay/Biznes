import { permanentRedirect } from "next/navigation";
import { baz } from "@/lib/baz";

/** The kinds of place are on the section's first page: an address cut short at "kind" leads there. */
export default function BazKindsPage() {
  permanentRedirect(`${baz.home}#kinds`);
}
