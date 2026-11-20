import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { IZNES, MU, RING, STEM } from "@/components/Logo";
import { site } from "@/data/site";

// The card a link to a page shows when it is pasted somewhere: the name, what kind of page it is,
// and the page's own title, in the site's colours. The first screen's card is a picture
// (public/og.jpg); every article and every business has one of these, drawn when it is asked for.
// It is flat on purpose: a drawn card is small enough for every messenger to accept.

export const OG_SIZE = { width: 1200, height: 630 };

const INK = "#0a1639";
const SLATE = "#404965";
const CREAM = "#fdf9ec";
const SAFFRON = "#f8c618";

const font = (name: string) => readFile(join(process.cwd(), "content", "og", name));

/** The card for one page. `kicker` says what it is ("Article", "Restaurant in Grand Baie"). */
export async function ogCard({ kicker, title, line }: { kicker: string; title: string; line?: string }) {
  const [bold, medium] = await Promise.all([font("manrope-700.woff"), font("manrope-500.woff")]);
  const words = title.length > 110 ? `${title.slice(0, 107).trimEnd()}...` : title;
  const size = words.length <= 34 ? 84 : words.length <= 60 ? 68 : 54;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", backgroundColor: CREAM, backgroundImage: `radial-gradient(circle at 88% 108%, ${SAFFRON} 0%, rgba(248,198,24,0.35) 22%, rgba(253,249,236,0) 46%)`, color: INK, fontFamily: "Manrope" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <svg width="290" height="47" viewBox="65 -755 4943 795">
            <path fill={INK} d={STEM} />
            <path fill={INK} fillRule="evenodd" d={RING} />
            <circle cx="354" cy="-270" r="108" fill={SAFFRON} />
            <path fill={INK} d={IZNES} />
            <path fill={INK} opacity="0.45" d={MU} />
          </svg>
          <div style={{ display: "flex", padding: "10px 22px", borderRadius: 999, backgroundColor: INK, color: "#ffffff", fontSize: 24, fontWeight: 700 }}>{kicker}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: size, fontWeight: 700, lineHeight: 1.06, letterSpacing: "-0.04em", maxWidth: 1000 }}>{words}</div>
          {line ? <div style={{ display: "flex", marginTop: 22, fontSize: 30, fontWeight: 500, color: SLATE, maxWidth: 940, lineHeight: 1.3 }}>{line.length > 120 ? `${line.slice(0, 117).trimEnd()}...` : line}</div> : null}
        </div>
        <div style={{ display: "flex", fontSize: 24, fontWeight: 500, color: SLATE }}>{site.line}</div>
      </div>
    ),
    { ...OG_SIZE, fonts: [{ name: "Manrope", data: bold, weight: 700, style: "normal" }, { name: "Manrope", data: medium, weight: 500, style: "normal" }] },
  );
}
