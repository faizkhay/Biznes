import type { CSSProperties } from "react";
import { type Business, wordmarkFor } from "@/data/businesses";
import { OWN_PLATE, PAINTED, TERRACE } from "@/data/plates";
import DrawnShopfront from "./DrawnShopfront";
import { ShopPlate } from "./stage/Plates";

/** The widest of the six crops: the shape of the frame every shop is shown in by itself. */
const FRAME = Math.max(...TERRACE.shops.map((shop) => shop.crop[1]));

/** The lit room a real business's shutter rises over, where it has been painted. */
const ROOMS: Record<string, string> = { lepalatier: "/img/plates/room.webp" };

/**
 * A business as it stands on the street: its shopfront, painted.
 *
 * Each of the six listings has a shopfront on the painted terrace (assets/plates/terrace.webp).
 * The painting's sign board and plaque are blank: the listing's own lettering is set on the board
 * here, the same outline its page draws, and its number on the plaque, so the picture and the data
 * cannot disagree. A sample wears its tag on its shutter.
 *
 * By itself (a card, a sample's page) the shop is its own crop of the terrace, cut inside its piers
 * (scripts/prepare-plates.mjs). With `terrace` it is one column of the whole painting, which the
 * terrace shows once behind all six, so this draws no picture, only what lies over it.
 *
 * A real business's shutter is a painted shutter laid over its doorway, so a link around the
 * shopfront can roll it up on hover and on focus (globals.css, .shopfront) over the lit room. A
 * sample's shutter does not move: it is not for sale, and it stays shut and tagged.
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
  /** One column of the whole terrace, whose painting is drawn once behind all six. */
  terrace?: boolean;
  className?: string;
}) {
  const k = PAINTED.indexOf(b.slug);
  if (k < 0) return <DrawnShopfront business={b} open={open} label={label} terrace={terrace} className={className} />;
  if (open && b.slug === OWN_PLATE) return <ShopPlate business={b} fluid label={label} className={["rounded-2xl", className].filter(Boolean).join(" ")} />;

  const shop = TERRACE.shops[k];
  const [left, W] = terrace ? shop.column : shop.crop;
  const H = TERRACE.height;
  const [bx, by, bw, bh] = shop.board;
  const [sx, sy, sw, sh] = shop.shutter;
  const [px, py, pw, ph] = shop.plaque;
  const pc = (v: number, of: number) => `${((v / of) * 100).toFixed(3)}%`;
  /** A rectangle of the terrace, as fractions of this shop's own picture. */
  const part = (x: number, y: number, w: number, h: number): CSSProperties => ({
    left: pc(x - left, W),
    top: pc(y - TERRACE.top, H),
    width: pc(w, W),
    height: pc(h, H),
  });
  /** A length of the terrace, in its pixels, as a part of whatever width this picture is drawn at. */
  const scaled = (v: number) => `${((v / W) * 100).toFixed(3)}cqw`;
  const src = (scale: number) => `/img/shops/${b.slug}-${Math.round(shop.crop[1] * scale)}.webp`;
  const mark = wordmarkFor(b.slug);
  const moves = !b.sample;

  const picture = (
    <div
      className={["shopfront shopfront-painted", terrace ? className : undefined].filter(Boolean).join(" ")}
      style={{ aspectRatio: `${W} / ${H}` }}
      data-open={open && moves}
      {...(label ? { role: "img", "aria-label": `${b.name}'s shopfront` } : { "aria-hidden": true })}
    >
      {!terrace && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src(1)}
          srcSet={`${src(0.5)} ${Math.round(W * 0.5)}w, ${src(1)} ${W}w`}
          sizes="(min-width: 64rem) 28vw, 46vw"
          width={W}
          height={H}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      )}
      {moves && (
        <div className="shopfront-doorway" style={part(sx, sy, sw, sh)}>
          <div className="shopfront-room" style={ROOMS[b.slug] ? { backgroundImage: `url(${ROOMS[b.slug]})` } : undefined} />
          <div className="shutter" />
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
      {/* Its number, lettered on its enamel plaque as a house's number is. */}
      <span className="plate-plaque" style={{ ...part(px, py, pw, ph), fontSize: scaled(25) }}>
        {b.number}
      </span>
      {b.sample && (
        <span className="plate-tag" style={{ ...part(sx + sw / 2 - 96, sy + sh * 0.42 - 35, 192, 70), fontSize: scaled(50) }}>
          Sample
        </span>
      )}
    </div>
  );
  // The six shops were painted a little different in width. By itself each is shown at one height,
  // in a frame the shape of the widest, so a row of cards lines up; a narrower shop simply ends
  // sooner on the right.
  if (terrace) return picture;
  return (
    <div className={["shopfront-frame", className].filter(Boolean).join(" ")} style={{ aspectRatio: `${FRAME} / ${H}` }}>
      {picture}
    </div>
  );
}
