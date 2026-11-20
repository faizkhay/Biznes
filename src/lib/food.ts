// Baz Manzer: everything in the directory for eating and drinking, by kind of place, by kind of
// food and by town. All of it is read from the index: the kinds of place are the directory's own
// categories, and the kinds of food are the map's own word for each listing's cuisine, where it
// gives one. Nothing here is typed in.
import { anchorOf } from "./format";
import { index, type Category, type Listing } from "./index";

export type Cuisine = { id: string; label: string; n: number };

/** The kinds of food a listing is said to serve: "Pizza, Pasta" is two. */
export const cuisinesOf = (l: Pick<Listing, "kind">) =>
  (l.kind ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((label) => ({ id: anchorOf(label), label }));

type Food = { types: Category[]; ids: Set<string>; listings: Listing[]; cuisines: Cuisine[] };
let held: Food | undefined;

/** The places to eat in the open index, with the kinds of place and of food they come in. */
export function food(): Food {
  if (held) return held;
  const { categories, listings } = index();
  const types = categories.filter((c) => c.group === "eat").sort((a, b) => b.n - a.n);
  const ids = new Set(types.map((c) => c.id));
  // The word a kind of place already says ("Restaurant") is not a kind of food.
  const plain = new Set(types.flatMap((c) => [anchorOf(c.one), anchorOf(c.label)]));
  const all = listings.filter((l) => ids.has(l.cat));
  const found = new Map<string, Cuisine>();
  for (const l of all)
    for (const { id, label } of cuisinesOf(l)) {
      if (plain.has(id)) continue;
      const was = found.get(id);
      if (was) was.n++;
      else found.set(id, { id, label, n: 1 });
    }
  held = { types, ids, listings: all, cuisines: [...found.values()].sort((a, b) => b.n - a.n || a.label.localeCompare(b.label)) };
  return held;
}
