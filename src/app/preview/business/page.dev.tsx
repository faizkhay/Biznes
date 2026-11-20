import BusinessPage from "@/components/BusinessPage";
import type { Owned } from "@/lib/accounts/owned";
import type { Showcase } from "@/lib/accounts/showcase";
import { PICTURES } from "@/data/themes";
import { index } from "@/lib/index";

/**
 * The design of a paid business's page, with made-up content. No paid business exists yet, so
 * this page stands in for one while the design is made and captured. It exists only under
 * `next dev` (its file ends .dev.tsx), it says on its face that nothing in it is real, and its
 * pictures are the site's own illustrations.
 *
 *   /preview/business            a food outlet on Biznes Grow: cover, pictures, menu, services, booking
 *   /preview/business?as=go      the same on Biznes Go: no services and no booking
 *   /preview/business?as=free    the same business on the free plan, as its owner listed it
 *   /preview/business?as=claim   a real listing from the index as if a paying owner had claimed it
 */
const EXAMPLE: Owned = {
  id: "00000000-0000-4000-8000-000000000000",
  slug: "example",
  listingId: null,
  name: "Example Snack (not a real business)",
  category: "fast-food",
  town: "mahebourg",
  address: "1 Example Road",
  phone: "+230 5000 0000",
  website: "",
  about: "A made-up snack bar by the waterfront, written to show how a business describes itself on its own page.\nEverything on this page is an example.",
  verified: true,
  plan: "grow",
  paid: true,
  books: true,
  services: [
    { id: "s1", name: "A table for the evening", description: "An example of a service a business might offer.", price: null, minutes: 90, kind: "service" },
    { id: "s2", name: "Catering for twenty", description: "An example with a price and no length.", price: 6000, minutes: null, kind: "service" },
    { id: "s3", name: "A jar of example pickle", description: "An example of a thing a business sells.", price: 180, minutes: null, kind: "product" },
  ],
  juiceNumber: "5000 0000",
  juiceName: "Example Snack Ltd",
  path: "/preview/business",
};

const SHOWCASE: Showcase = {
  cover: PICTURES.lagoon.src,
  photos: [PICTURES.flamboyant.src, PICTURES.cane.src, PICTURES.lights.src, PICTURES.lagoon.small, PICTURES.cane.small],
  tagline: "An example of the one line a business writes about itself.",
  hours: ["Monday to Friday: 10:00 to 21:00", "Saturday: 10:00 to 23:00", "Sunday: closed"],
  menu: [
    {
      title: "To start (examples)",
      items: [
        { name: "An example starter", description: "What is in it, in the owner's words.", price: 75 },
        { name: "Another example", price: 120 },
      ],
    },
    {
      title: "Mains (examples)",
      items: [
        { name: "An example main dish", description: "A longer line, to show how a description wraps under the name of the dish on a narrow screen.", price: 350 },
        { name: "A dish with no price given", description: "The price is left out when the owner gives none." },
        { name: "An example for two", price: 1250 },
      ],
    },
  ],
};

export default async function BusinessPreview({ searchParams }: { searchParams: Promise<{ as?: string }> }) {
  const { as } = await searchParams;
  if (as === "claim") {
    const listing = index().listings.find((l) => l.cat === "restaurants" && l.hours && l.phone?.length && l.lat != null);
    return <BusinessPage listing={listing} owned={{ ...EXAMPLE, name: listing?.name ?? EXAMPLE.name, listingId: listing?.id ?? null, plan: "go", books: false, services: [], juiceNumber: "", juiceName: "" }} showcase={{ ...SHOWCASE, hours: [] }} preview />;
  }
  const plan = as === "go" ? "go" : as === "free" ? "free" : "grow";
  const business: Owned = { ...EXAMPLE, plan, paid: plan !== "free", verified: plan !== "free", books: plan === "grow", services: plan === "grow" ? EXAMPLE.services : [], juiceNumber: plan === "grow" ? EXAMPLE.juiceNumber : "", juiceName: plan === "grow" ? EXAMPLE.juiceName : "" };
  return <BusinessPage owned={business} showcase={plan === "free" ? undefined : SHOWCASE} preview />;
}
