import type { Metadata } from "next";
import { PageHead } from "@/components/Bits";
import GuideTables from "@/components/GuideTables";
import SearchBox from "@/components/SearchBox";

export const metadata: Metadata = {
  title: "Check a business in Mauritius",
  description: "How to check that a business in Mauritius is what it says it is: the official registers of companies, licences and professionals, what each shows, and where to search it.",
  alternates: { canonical: "/tools/verify" },
};

export default function VerifyPage() {
  return (
    <>
      <PageHead path={[{ href: "/tools", label: "Tools" }, { label: "Check a business" }]} title="Check a business" lede="A listing here says a business is on the map. It does not say the business is registered, licensed or sound. The official registers do, and each is free to look at or says what it costs." />
      <div className="shell">
        <section aria-labelledby="ours" className="mb-12 max-w-2xl">
          <h2 id="ours" className="label-1 pb-3 text-ink-faint">
            First, what we hold on it
          </h2>
          <SearchBox size="lg" id="verify-search" />
        </section>
        <GuideTables slug="verify-a-business" missing="The list of registers comes from the guide to checking a business, which is not available just now." />
      </div>
    </>
  );
}
