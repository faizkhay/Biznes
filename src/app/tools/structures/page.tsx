import type { Metadata } from "next";
import { PageHead } from "@/components/Bits";
import GuideTables from "@/components/GuideTables";

export const metadata: Metadata = {
  title: "Compare legal structures in Mauritius",
  description: "Sole trader, partnership, company, limited liability partnership, foundation, trust and cooperative in Mauritius, side by side: the Act, who is liable, how many people, who registers it.",
  alternates: { canonical: "/tools/structures" },
};

export default function StructuresPage() {
  return (
    <>
      <PageHead path={[{ href: "/tools", label: "Tools" }, { label: "Compare legal structures" }]} title="Compare legal structures" lede="The forms a business in Mauritius can take, side by side. A comparison, not a recommendation: which one fits depends on things only you and an adviser know." />
      <div className="shell">
        <GuideTables slug="choose-a-structure" missing="The comparison comes from the guide to choosing a structure, which is not available just now." />
      </div>
    </>
  );
}
