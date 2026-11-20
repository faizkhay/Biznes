import { existsSync, readFileSync } from "node:fs";
import { NextResponse } from "next/server";
import { editionFile, offer, products, withBooked } from "@/lib/shop";

/**
 * Hands out this month's edition of the pocket guide, only while it is free: that is, while its
 * sponsors have paid for it and the month is within the weeks they have paid for (two, three or
 * all of it: `offer` in src/lib/shop.ts). At any other time the guide is sold, and this address
 * sends the visitor back to the shop.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = products().find((p) => p.slug === slug);
  const file = product && editionFile(product.slug);
  if (!product || !file || !existsSync(file)) return new NextResponse("No such guide.", { status: 404 });
  if (!offer(await withBooked(product)).free) return NextResponse.redirect(new URL("/shop", request.url), 303);
  return new NextResponse(new Uint8Array(readFileSync(file)), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${product.slug}-${product.built!.edition}.pdf"`, "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" },
  });
}
