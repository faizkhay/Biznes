/** Prices the way the house quotes them: the currency code, a no-break space, comma thousands. */
export const formatPrice = (rupees: number) => `MUR ${rupees.toLocaleString("en-GB")}`;

/** "Moka, Grand Baie or Tamarin": a list of places as a sentence would say it. */
export function listPlaces(places: readonly string[]) {
  if (places.length <= 1) return places[0] ?? "";
  return `${places.slice(0, -1).join(", ")} or ${places[places.length - 1]}`;
}
