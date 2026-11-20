import { telHref } from "@/lib/format";
import type { Profile } from "@/lib/accounts/types";

/** The person behind a business, an advertisement or an order, as an admin needs them: a name and how to reach them. */
export type Owner = Pick<Profile, "id" | "name" | "email" | "phone">;

export function Reach({ owner }: { owner?: Pick<Owner, "name" | "email" | "phone"> }) {
  if (!owner) return <span>Owner unknown</span>;
  return (
    <span>
      {owner.name || "No name given"}
      {owner.email && (
        <>
          {" · "}
          <a href={`mailto:${owner.email}`} className="break-all">
            {owner.email}
          </a>
        </>
      )}
      {owner.phone && (
        <>
          {" · "}
          <a href={telHref(owner.phone)} className="data-2 whitespace-nowrap">
            {owner.phone}
          </a>
        </>
      )}
    </span>
  );
}
