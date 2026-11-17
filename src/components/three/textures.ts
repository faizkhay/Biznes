// Every texture on the street except the sky is painted here, in code, on a canvas: a sign with a
// business's own lettering, the slats of a shutter, the ribs of a tin roof, the cut fringe under
// it, a street plaque, a sample's tag. Nothing is downloaded and nothing is a photograph.
//
// The signs use each listing's own colours and the same outline of its name that the pages draw
// (src/data/wordmarks.ts), so the 3D sign and the flat one cannot disagree.
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from "three";
import type { Business } from "@/data/businesses";
import type { Wordmark } from "@/data/wordmarks";
import { SCENE } from "./palette";

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d") as CanvasRenderingContext2D] as const;
}

function finish(c: HTMLCanvasElement, repeat = false): Texture {
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  // Mipmaps (three's default) keep a sign and a tag clean when they are small in the distance.
  if (repeat) t.wrapS = t.wrapT = RepeatWrapping;
  t.needsUpdate = true;
  return t;
}

/** The colour along the top edge of an image, as a hex string. */
export function topColour(image: CanvasImageSource & { width: number }): string {
  const [c, g] = canvas(1, 1);
  g.drawImage(image, 0, 0, image.width, 2, 0, 0, 1, 1);
  const [r, gr, b] = g.getImageData(0, 0, 1, 1).data;
  c.width = 0;
  return `#${[r, gr, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** The face a plaque and a tag are lettered in: the page's own sign face, by its loaded name. */
function signFace() {
  return getComputedStyle(document.documentElement).getPropertyValue("--font-sign").trim() || "sans-serif";
}

/** A sign: the board in the brand's ground, a thin frame in its trim, its lettering in its ink. */
export function signTexture(b: Business, mark: Wordmark): Texture {
  const [c, g] = canvas(1024, 256);
  g.fillStyle = b.brand.ground;
  g.fillRect(0, 0, 1024, 256);
  // The two lamps above the board throw two pools of warm light down it.
  for (const x of [300, 724]) {
    const pool = g.createRadialGradient(x, -30, 20, x, -30, 330);
    pool.addColorStop(0, "rgba(255, 196, 120, 0.42)");
    pool.addColorStop(1, "rgba(255, 196, 120, 0)");
    g.fillStyle = pool;
    g.fillRect(0, 0, 1024, 256);
  }
  g.strokeStyle = b.brand.accent;
  g.lineWidth = 7;
  g.strokeRect(22, 22, 980, 212);
  // The lettering, fitted to the board with room around it.
  const scale = Math.min(820 / mark.w, 128 / mark.h);
  g.save();
  g.translate(512 - (mark.w * scale) / 2, 128 - (mark.h * scale) / 2);
  g.scale(scale, scale);
  g.fillStyle = b.brand.ink;
  g.fill(new Path2D(mark.d));
  g.restore();
  return finish(c);
}

/** One slat of a roller shutter, to repeat down it. */
export function slatTexture(): Texture {
  const [c, g] = canvas(8, 64);
  g.fillStyle = SCENE.steel;
  g.fillRect(0, 0, 8, 64);
  // A slat catches light along its top edge and falls into shade at the gap below it.
  g.fillStyle = "rgba(255, 255, 255, 0.16)";
  g.fillRect(0, 0, 8, 10);
  g.fillStyle = SCENE.steelDeep;
  g.fillRect(0, 50, 8, 14);
  return finish(c, true);
}

/** One rib of corrugated tin, to repeat across a roof. */
export function ribTexture(): Texture {
  const [c, g] = canvas(64, 8);
  const rib = g.createLinearGradient(0, 0, 64, 0);
  rib.addColorStop(0, SCENE.tinShade);
  rib.addColorStop(0.45, SCENE.tin);
  rib.addColorStop(0.75, "#a9c0ee");
  rib.addColorStop(1, SCENE.tinShade);
  g.fillStyle = rib;
  g.fillRect(0, 0, 64, 8);
  return finish(c, true);
}

/** The lambrequin: one scallop of the cut fringe under a creole roof, with its pierced holes. */
export function fringeTexture(): Texture {
  const [c, g] = canvas(128, 128);
  g.clearRect(0, 0, 128, 128);
  g.fillStyle = SCENE.limewash;
  // A band along the eave, and a rounded scallop hanging from it.
  g.fillRect(0, 0, 128, 46);
  g.beginPath();
  g.arc(64, 46, 60, 0, Math.PI);
  g.closePath();
  g.fill();
  // Pierced: one hole in the scallop, and a smaller one where two scallops meet.
  g.globalCompositeOperation = "destination-out";
  g.beginPath();
  g.arc(64, 66, 14, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.arc(0, 26, 8, 0, Math.PI * 2);
  g.arc(128, 26, 8, 0, Math.PI * 2);
  g.fill();
  g.globalCompositeOperation = "source-over";
  return finish(c, true);
}

/** A blue enamel street plaque with a white rim, naming a town. */
export function plaqueTexture(text: string): Texture {
  const [c, g] = canvas(512, 176);
  g.fillStyle = SCENE.enamel;
  g.fillRect(0, 0, 512, 176);
  g.strokeStyle = SCENE.limewash;
  g.lineWidth = 8;
  g.strokeRect(16, 16, 480, 144);
  g.fillStyle = SCENE.limewash;
  g.textAlign = "center";
  g.textBaseline = "middle";
  let size = 92;
  do {
    g.font = `600 ${size}px ${signFace()}`;
    size -= 4;
  } while (g.measureText(text.toUpperCase()).width > 430 && size > 40);
  g.fillText(text.toUpperCase(), 256, 94);
  return finish(c);
}

/** The white tag a sample wears on its shutter. */
export function tagTexture(text: string): Texture {
  const [c, g] = canvas(384, 144);
  g.fillStyle = SCENE.limewash;
  g.beginPath();
  g.roundRect(4, 4, 376, 136, 18);
  g.fill();
  g.fillStyle = "#0a1639";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `600 84px ${signFace()}`;
  g.fillText(text.toUpperCase(), 192, 78);
  return finish(c);
}

/**
 * The screen on the walked shop's back wall: the business's website, as a picture of a page in its
 * own colours with its own lettering. It shows shapes, not words, so it claims nothing.
 */
export function screenTexture(b: Business, mark: Wordmark): Texture {
  const [c, g] = canvas(800, 500);
  g.fillStyle = b.brand.ground;
  g.fillRect(0, 0, 800, 500);
  const scale = Math.min(300 / mark.w, 54 / mark.h);
  g.save();
  g.translate(56, 48);
  g.scale(scale, scale);
  g.fillStyle = b.brand.ink;
  g.fill(new Path2D(mark.d));
  g.restore();
  g.fillStyle = b.brand.ink;
  g.globalAlpha = 0.92;
  g.fillRect(56, 190, 520, 34);
  g.fillRect(56, 240, 380, 34);
  g.globalAlpha = 0.5;
  g.fillRect(56, 306, 440, 12);
  g.fillRect(56, 330, 400, 12);
  g.globalAlpha = 1;
  g.fillStyle = b.brand.accent;
  g.beginPath();
  g.roundRect(56, 384, 200, 60, 30);
  g.fill();
  return finish(c);
}

/** The frame on the wall: a certificate drawn as ruled lines and a seal. No words, so no claim. */
export function certificateTexture(): Texture {
  const [c, g] = canvas(320, 420);
  g.fillStyle = "#fbf6ea";
  g.fillRect(0, 0, 320, 420);
  g.strokeStyle = "#0a1639";
  g.lineWidth = 6;
  g.strokeRect(22, 22, 276, 376);
  g.fillStyle = "#0a1639";
  g.fillRect(70, 76, 180, 14);
  g.globalAlpha = 0.45;
  for (let y = 130; y < 260; y += 26) g.fillRect(60, y, 200, 8);
  g.globalAlpha = 1;
  g.fillStyle = "#f8c618";
  g.beginPath();
  g.arc(160, 320, 36, 0, Math.PI * 2);
  g.fill();
  return finish(c);
}

/** A palm against the sky, drawn as a flat dark shape: a silhouette, and nothing more. */
export function palmTexture(): Texture {
  const [c, g] = canvas(256, 512);
  g.clearRect(0, 0, 256, 512);
  g.strokeStyle = "#0b1f63";
  g.fillStyle = "#0b1f63";
  g.lineCap = "round";
  g.lineWidth = 12;
  g.beginPath();
  g.moveTo(120, 512);
  g.quadraticCurveTo(104, 300, 132, 150);
  g.stroke();
  // Fronds: nine arcs falling away from the crown, each a fan of short strokes.
  const fronds = [-2.9, -2.45, -2.0, -1.57, -1.15, -0.7, -0.25, 0.2, -3.35];
  for (const a of fronds) {
    const len = 118;
    const ex = 132 + Math.cos(a) * len;
    const ey = 150 + Math.sin(a) * len + 34;
    g.lineWidth = 7;
    g.beginPath();
    g.moveTo(132, 150);
    g.quadraticCurveTo(132 + Math.cos(a) * len * 0.6, 150 + Math.sin(a) * len * 0.75 - 12, ex, ey);
    g.stroke();
    g.lineWidth = 3;
    for (let t = 0.25; t <= 1; t += 0.11) {
      const px = 132 + (ex - 132) * t;
      const py = 150 + (ey - 150) * t - Math.sin(t * Math.PI) * 18;
      g.beginPath();
      g.moveTo(px, py);
      g.lineTo(px + Math.cos(a + 1.3) * 20 * (1.1 - t), py + 22 * (1.15 - t));
      g.stroke();
    }
  }
  return finish(c);
}
