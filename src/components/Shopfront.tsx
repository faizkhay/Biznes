import type { CSSProperties } from "react";
import { type Business, wordmarkFor } from "@/data/businesses";
import { OWN_PLATE, PAINTED, TERRACE } from "@/data/plates";
import DrawnShopfront from "./DrawnShopfront";
import { ShopPlate } from "./stage/Plates";

/** The lit room a real business's shutter rises over, where it has been painted. */
const ROOMS: Record<string, string> = { lepalatier: "/img/plates/room.webp" };

/**
 * A business as it stands on the street: its shopfront, painted.
 *
 * Each of the six listings has a shopfront on the painted terrace (assets/plates/terrace.webp, cut
 * per shop by scripts/prepare-plates.mjs). The painting's sign board is blank: the listing's own
 * lettering is set on it here, the same outline its page draws, so the picture and the data cannot
 * disagree. A sample wears its tag on its shutter.
 *
 * A real business's shutter is its own painted shutter, cut out and laid back in place, so a link
 * around the shopfront can roll it up on hover and on focus (globals.css, .shopfront) over the lit
 * room. A sample's shutter does not move: it is not for sale, and it stays shut and tagged.
 *
 * `open` shows the business with its shutter up: the one with a plate of its own (its room painted,
 * its website on the wall) is shown on that plate. A listing with no painted shopfront is drawn in
 * code instead (DrawnShopfront), so a new one can go on the street the day it joins the data.
 *
 * The name is real text beside the picture, so this is decoration to a screen reader unless
 * `label` asks otherwise. Everything is placed in fractions of the picture, so it holds at any size.
 */
export default function Shopfront({
  business: b,
  open = false,
  label = false,
  terrace = false,
  className,
}: {
  business: Business;
  /** The shutter is up and the room is lit. */
  open?: boolean;
  /** True where no text nearby names the business, so the picture must. */
  label?: boolean;
  /** The shop stands in a row with others, wall to wall. */
  terrace?: boolean;
  className?: string;
}) {
  const k = PAINTED.indexOf(b.slug);
  if (k < 0) return <DrawnShopfront business={b} open={open} label={label} terrace={terrace} className={className} />;
  if (open && b.slug === OWN_PLATE) return <ShopPlate business={b} fluid label={label} className={["rounded-2xl", className].filter(Boolean).join(" ")} />;

  const shop = TERRACE.shops[k];
  const W = shop.width;
  const H = TERRACE.height;
  const [bx, by, bw, bh] = shop.board;
  const [sx, sy, sw, sh] = shop.shutter;
  const pc = (v: number, of: number) => `${((v / of) * 100).toFixed(3)}%`;
  /** A rectangle of the terrace, as fractions of this shop's own picture. */
  const part = (left: number, top: number, width: number, height: number): CSSProperties => ({
    left: pc(left - shop.left, W),
    top: pc(top - TERRACE.top, H),
    width: pc(width, W),
    height: pc(height, H),
  });
  const src = (scale: number) => `/img/shops/${b.slug}-${Math.round(W * scale)}.webp`;
  const mark = wordmarkFor(b.slug);
  const moves = !b.sample;

  const picture = (
    <div
      className={["shopfront shopfront-painted", terrace ? className : undefined].filter(Boolean).join(" ")}
      style={{ aspectRatio: `${W} / ${H}` }}
      data-open={open && moves}
      {...(label ? { role: "img", "aria-label": `${b.name}'s shopfront` } : { "aria-hidden": true })}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src(1)}
        srcSet={`${src(0.5)} ${Math.round(W * 0.5)}w, ${src(1)} ${W}w`}
        sizes={terrace ? "(min-width: 75rem) 17vw, (min-width: 40rem) 14rem, 64vw" : "(min-width: 64rem) 30vw, 46vw"}
        width={W}
        height={H}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      {moves && (
        <div className="shopfront-doorway" style={part(sx, sy, sw, sh)}>
          <div className="shopfront-room" style={ROOMS[b.slug] ? { backgroundImage: `url(${ROOMS[b.slug]})` } : undefined} />
          <div
            className="shutter"
            style={{
              backgroundImage: `url(${src(1)})`,
              backgroundSize: `${((W / sw) * 100).toFixed(3)}% ${((H / sh) * 100).toFixed(3)}%`,
              backgroundPosition: `${(((sx - shop.left) / (W - sw)) * 100).toFixed(3)}% ${(((sy - TERRACE.top) / (H - sh)) * 100).toFixed(3)}%`,
            }}
          />
        </div>
      )}
      <svg
        viewBox={`0 0 ${mark.w} ${mark.h}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ position: "absolute", ...part(bx + bw * 0.13, by + bh * 0.22, bw * 0.74, bh * 0.56) }}
        aria-hidden
        focusable="false"
      >
        <path d={mark.d} fill={b.brand.ink} />
      </svg>
      {b.sample && (
        <span className="plate-tag" style={{ ...part(sx + sw / 2 - 96, sy + sh * 0.42 - 35, 192, 70), fontSize: `${((50 / W) * 100).toFixed(3)}cqw` }}>
          Sample
        </span>
      )}
    </div>
  );
  // In the terrace each shop keeps its own width, so the six stand as one painting. By itself a shop
  // is shown in a frame of one shape, so a row of cards lines up: the two end shops, which are
  // wider by their end pilaster, are trimmed on their outer side.
  if (terrace) return picture;
  const end = k === 0 ? "flex-end" : k === PAINTED.length - 1 ? "flex-start" : "center";
  return (
    <div className={["shopfront-frame", className].filter(Boolean).join(" ")} style={{ justifyContent: end }}>
      {picture}
    </div>
  );
}
