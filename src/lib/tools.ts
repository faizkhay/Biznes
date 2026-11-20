/**
 * The tools, once: the tools page, the first screen, the search and the sitemap all read this list.
 * `guide` is the guide a tool takes its figures from, which links to it in turn.
 */
export const TOOLS = [
  { href: "/tools/verify", guide: "verify-a-business", title: "Check a business", what: "The official registers, one by one: what each shows, and where to search it for a company, a licence or a professional." },
  { href: "/tools/vat", guide: "vat", title: "VAT calculator", what: "Add VAT to a price or take it out, at the rate in force, and see whether a turnover is over the registration threshold." },
  { href: "/tools/income-tax", guide: "personal-income-tax-in-mauritius", title: "Personal income tax calculator", what: "A year's income tax from a salary or a business: the deductions and reliefs, the tax band by band, and what CSG and the National Savings Fund take." },
  { href: "/tools/business-tax", guide: "business-taxes", title: "Business tax estimator", what: "A company's income tax, CSR, climate levy and Fair Share Contribution on a year's profit, when to pay, and how a sole trader or a société is taxed instead." },
  { href: "/tools/structures", guide: "choose-a-structure", title: "Compare legal structures", what: "Sole trader, partnership, company and the rest, side by side: who is liable, how many people it takes, who registers it." },
  { href: "/learn/glossary", guide: "", title: "Glossary", what: "BRN, TAN, CSG, PAYE and the other names and initials a business meets, each explained in a sentence." },
] as const;
