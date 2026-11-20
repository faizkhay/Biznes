import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type Product = {
  slug: string;
  title: string;
  cover: string;
  line: string;
  /** In rupees. Null until the owner has set it: the page then says so and takes requests. */
  price: number | null;
  /** What the last build of the PDF held (scripts/pdf.mjs). Absent until it has been built. */
  built?: { pages: number; places: number; regions: number; sources: number; checked: string };
};

const read = <T,>(name: string): T | null => {
  const file = join(process.cwd(), "content", "pdf", name);
  try {
    return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as T) : null;
  } catch {
    return null;
  }
};

/** The pocket guides for sale. One for now. A guide is offered only once its PDF has been built. */
export function products(): Product[] {
  const product = read<Product>("product.json");
  const built = read<Product["built"] & { slug: string }>("built.json");
  if (!product || !built || built.slug !== product.slug) return [];
  return [{ ...product, built }];
}
