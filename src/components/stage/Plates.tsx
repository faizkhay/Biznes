import type { CSSProperties, Ref } from "react";
import { type Business, wordmarkFor } from "@/data/businesses";
import { CERTIFICATE, COUNTER, PLATES, SHOP, STREET, TERRACE, type PlateId, type Rect } from "@/data/plates";
import { into, matrix3d, onto } from "@/lib/homography";

/**
 * The painted plates, each with what is true set over it.
 *
 * A plate is one painting at its own size in pixels (src/data/plates.ts), and everything laid on
 * it is placed in those same pixels, so the stage can move and scale a plate as one thing. The
 * paintings were made with every board, plaque, screen and paper blank. Here each listing's own
 * lettering goes on its board (the same outline its page draws, in its own ink), its town on its
 * plaque, and a tag on a sample's shutter, so a painting can never say something the data does not.
 *
 * Decoration to assistive technology: every name, town and "Sample" is written in the page's own
 * text beside the stage.
 */

/** The picture itself, at the smaller width first where the screen allows. */
function Picture({ id, sizes }: { id: PlateId; sizes: string }) {
  const p = PLATES[id];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${p.src}-${p.widths[1]}.webp`}
      srcSet={p.widths.map((w) => `${p.src}-${w}.webp ${w}w`).join(", ")}
      sizes={sizes}
      width={p.w}
      height={p.h}
      alt=""
      decoding="async"
      draggable={false}
      className="plate-picture"
    />
  );
}

/** A listing's own lettering, fitted inside a box and centred. */
function Lettering({ business: b, style }: { business: Business; style: CSSProperties }) {
  const mark = wordmarkFor(b.slug);
  return (
    <svg viewBox={`0 0 ${mark.w} ${mark.h}`} preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", ...style }} aria-hidden focusable="false">
      <path d={mark.d} fill={b.brand.ink} />
    </svg>
  );
}

const box = ([left, top, width, height]: Rect): CSSProperties => ({ left, top, width, height });
/** A box inside a rectangle, inset by fractions of its width and height. */
const inset = ([left, top, width, height]: Rect, x: number, y: number): CSSProperties => ({
  left: left + width * x,
  top: top + height * y,
  width: width * (1 - 2 * x),
  height: height * (1 - 2 * y),
});

/**
 * The street. Its boards are seen at an angle, so each one's lettering is carried onto its four
 * measured corners by one projective transform (lib/homography.ts); a sample's tag is placed on
 * the same wall, at the middle of its shutter.
 */
export function StreetPlate({ businesses, plaqueRef }: { businesses: Business[]; plaqueRef?: Ref<HTMLDivElement> }) {
  const p = PLATES.street;
  const first = businesses[0];
  const plaque = onto(400, 170, STREET.plaque);
  return (
    <div className="plate" style={{ width: p.w, height: p.h }}>
      <Picture id="street" sizes="(min-width: 900px) 250vw, 420vw" />
      {/* The lamps come on down the street, far end first: a bloom of light over each painted lamp. */}
      {STREET.lamps.map(([x, y, r], k) => (
        <i key={x} className="plate-glow" style={{ left: x - r, top: y - r, width: 2 * r, height: 2 * r, animationDelay: `${500 + k * 110}ms` }} />
      ))}
      {businesses.slice(0, STREET.boards.length).map((b, k) => {
        // The nearest board is a long plank; the others are squarer. The numbers set how the
        // lettering is foreshortened, and were chosen so each name reads as painted on its board.
        const h = k === 0 ? 172 : 224;
        const t = onto(1000, h, STREET.boards[k]);
        const [x, y] = into(t, STREET.shutters[k]);
        return (
          <div key={b.slug} className="plate-wall" style={{ width: 1000, height: h, transform: matrix3d(t) }}>
            <Lettering business={b} style={{ left: "10%", top: "19%", width: "80%", height: "62%" }} />
            {b.sample && (
              <span className="plate-tag" style={{ left: x - 185, top: y - 68, width: 370, height: 136, fontSize: 96 }}>
                Sample
              </span>
            )}
          </div>
        );
      })}
      <div ref={plaqueRef} className="plate-wall" style={{ width: 400, height: 170, transform: matrix3d(plaque) }}>
        <span className="plate-plaque" style={{ inset: 0, fontSize: 92 }}>
          {first.places[0]}
        </span>
      </div>
    </div>
  );
}

/** A rectangle of the shop plate as fractions of it, so the plate can be drawn at any size. */
const part = ([left, top, width, height]: Rect): CSSProperties => {
  const p = PLATES.lepalatier;
  const pc = (v: number, of: number) => `${((v / of) * 100).toFixed(3)}%`;
  return { left: pc(left, p.w), top: pc(top, p.h), width: pc(width, p.w), height: pc(height, p.h) };
};
/** A length of the shop plate, in its pixels, as a part of whatever width the plate is drawn at. */
const scaled = (px: number) => `${((px / PLATES.lepalatier.w) * 100).toFixed(3)}cqw`;

/**
 * The first business, front-on: its lettering on the board, its town on the plaque, its website on
 * the screen, the certificate's lines on its paper, and the shutter that rolls up over the room.
 *
 * On the stage it is drawn at its own size and moved as one thing. With `fluid` it fills the width
 * it is given, for the business's own page; everything on it is placed in fractions of the plate,
 * and its lettering is sized from the plate's width, so both are the same picture.
 */
export function ShopPlate({
  business: b,
  shutterRef,
  fluid = false,
  label = false,
  className,
}: {
  business: Business;
  shutterRef?: Ref<HTMLImageElement>;
  fluid?: boolean;
  /** True where no text nearby names the business, so the picture must. */
  label?: boolean;
  className?: string;
}) {
  const p = PLATES.lepalatier;
  const [bx, by, bw, bh] = SHOP.board;
  return (
    <div
      className={["plate", className].filter(Boolean).join(" ")}
      style={fluid ? { width: "100%", aspectRatio: `${p.w} / ${p.h}` } : { width: p.w, height: p.h }}
      {...(label ? { role: "img", "aria-label": `${b.name}'s shopfront, its shutter up and its room lit` } : {})}
    >
      <Picture id="lepalatier" sizes={fluid ? "(min-width: 1024px) 45vw, 100vw" : "(min-width: 900px) 300vw, 600vw"} />
      <Lettering business={b} style={part([bx + bw * 0.2, by + bh * 0.17, bw * 0.6, bh * 0.66])} />
      <span className="plate-plaque" style={{ ...part(SHOP.plaque), fontSize: scaled(86) }}>
        {b.places[0]}
      </span>
      {/* The website, as a picture of a page in the business's own colours: shapes, so it claims nothing. */}
      <div className="plate-screen" style={part(SHOP.screen)}>
        <Lettering business={b} style={{ left: "8%", top: "13%", width: "34%", height: "16%" }} />
        <i style={{ left: "8%", top: "42%", width: "58%", height: "7%", background: b.brand.ink, opacity: 0.92 }} />
        <i style={{ left: "8%", top: "54%", width: "42%", height: "7%", background: b.brand.ink, opacity: 0.92 }} />
        <i style={{ left: "8%", top: "68%", width: "50%", height: "2.6%", background: b.brand.ink, opacity: 0.5 }} />
        <i style={{ left: "8%", top: "73.5%", width: "44%", height: "2.6%", background: b.brand.ink, opacity: 0.5 }} />
        <i style={{ left: "8%", top: "82%", width: "22%", height: "10%", background: b.brand.accent, borderRadius: 999 }} />
      </div>
      {/* The certificate: ruled lines and a seal. No words, so no claim. */}
      <div className="plate-paper" style={part(SHOP.paper)}>
        <i style={{ left: "24%", top: "14%", width: "52%", height: "4%", opacity: 0.85 }} />
        {[30, 39, 48, 57].map((top) => (
          <i key={top} style={{ left: "16%", top: `${top}%`, width: "68%", height: "2%", opacity: 0.42 }} />
        ))}
        <i className="plate-seal" style={{ left: "39%", top: "70%", width: "22%" }} />
      </div>
      {/* On the stage the shutter rolls up as the walk reaches the room. On a page the room stands open. */}
      {!fluid && (
        <div className="plate-doorway" style={part(SHOP.doorway)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={shutterRef} src="/img/plates/shutter.webp" alt="" width={860} height={634} decoding="async" draggable={false} className="plate-shutter" />
        </div>
      )}
    </div>
  );
}

/** The terrace, front-on: every board lettered, every sample tagged. */
export function TerracePlate({ businesses }: { businesses: Business[] }) {
  const p = PLATES.terrace;
  return (
    <div className="plate" style={{ width: p.w, height: p.h }}>
      <Picture id="terrace" sizes="(min-width: 900px) 100vw, 240vw" />
      {businesses.slice(0, TERRACE.shops.length).map((b, k) => {
        const shop = TERRACE.shops[k];
        const [sx, sy, sw, sh] = shop.shutter;
        return (
          <div key={b.slug}>
            <Lettering business={b} style={inset(shop.board, 0.13, 0.22)} />
            {b.sample && (
              <span className="plate-tag" style={{ left: sx + sw / 2 - 96, top: sy + sh * 0.42 - 35, width: 192, height: 70, fontSize: 50 }}>
                Sample
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * The strategy, close: a bound document on the counter. Its cover is seen at an angle, so what is
 * written on it is carried onto the cover's four corners: the business's lettering, and what the
 * document is, in the site's sign face. It names one of the six things, and claims nothing else.
 */
export function CounterPlate({ business: b }: { business: Business }) {
  const p = PLATES.counter;
  const t = onto(600, 560, COUNTER.cover);
  return (
    <div className="plate" style={{ width: p.w, height: p.h }}>
      <Picture id="counter" sizes="(min-width: 900px) 110vw, 300vw" />
      <div className="plate-wall plate-cover" style={{ width: 600, height: 560, transform: matrix3d(t), color: b.brand.ink }}>
        <Lettering business={b} style={{ left: "16%", top: "25%", width: "68%", height: "15%" }} />
        <i style={{ left: "40%", top: "47%", width: "20%", height: "0.8%", background: b.brand.accent }} />
        <span style={{ top: "53%", fontSize: 52 }}>Business</span>
        <span style={{ top: "64%", fontSize: 52 }}>strategy</span>
      </div>
    </div>
  );
}

/** The certificate, close: ruled lines and a seal on the blank paper. No words, so no claim. */
export function CertificatePlate() {
  const p = PLATES.certificate;
  const pc = (v: number, of: number) => `${((v / of) * 100).toFixed(3)}%`;
  const [x, y, w, h] = CERTIFICATE.paper;
  return (
    <div className="plate" style={{ width: p.w, height: p.h }}>
      <Picture id="certificate" sizes="(min-width: 900px) 110vw, 300vw" />
      <div className="plate-paper" style={{ left: pc(x, p.w), top: pc(y, p.h), width: pc(w, p.w), height: pc(h, p.h) }}>
        <i style={{ left: "26%", top: "13%", width: "48%", height: "2.2%", opacity: 0.85 }} />
        {[26, 33, 40, 47, 54].map((top) => (
          <i key={top} style={{ left: "15%", top: `${top}%`, width: "70%", height: "1%", opacity: 0.4 }} />
        ))}
        <i className="plate-seal" style={{ left: "40%", top: "68%", width: "20%" }} />
      </div>
    </div>
  );
}
