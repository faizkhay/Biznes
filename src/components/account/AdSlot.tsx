// A place on a public page where an advertisement may be shown. The accounts work fills it: an ad
// an owner has made and an admin has approved, for the place and the day, always marked
// "Sponsored". With accounts off, or with no ad for the place, it is nothing at all.

export type AdPlace = "home" | "results" | "listing" | "food" | "article" | "directory";

export default async function AdSlot(_props: { place: AdPlace; className?: string }) {
  return null;
}
