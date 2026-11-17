"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  type MeshLambertMaterial,
  type PerspectiveCamera,
  type PointLight,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
  Vector3,
} from "three";
import { type Business, wordmarkFor } from "@/data/businesses";
import { Driver, Governor } from "./Pacing";
import StageVitals from "./StageVitals";
import { stepDpr, useDebugStepping } from "./capture";
import { SCENE } from "./palette";
import { STAGE_READY, busy, stage } from "./stage";
import {
  asphaltTexture,
  basaltTexture,
  certificateTexture,
  fringeTexture,
  glowTexture,
  palmTexture,
  pavingTexture,
  planTexture,
  plaqueTexture,
  ribTexture,
  screenTexture,
  signTexture,
  slatTexture,
  tagTexture,
  topColour,
} from "./textures";
import { HOLD, TIMELINE, fit, type Frame } from "./timeline";

/**
 * The street: a row of finished shopfronts at blue hour, built in code.
 *
 * Every shop is a few boxes and planes from the same measurements, painted in its business's own
 * colours, with its own lettering on its sign (a canvas texture drawn from the same outline the
 * pages use). The only image that is not drawn here is the sky behind it, a painted plate
 * (public/img/sky-*.webp, with its provenance beside it).
 *
 * The scroll walks the camera from stop to stop (timeline.ts) and rolls the first shop's shutter
 * up; a visitor can raise or lower any shutter by hand. The canvas draws only when something moves
 * (Pacing.tsx), pauses off screen (Stage.tsx), survives a lost context (StageVitals.tsx), and
 * tells the page when a finished frame has drawn, so the still picture under it can go.
 *
 * Two tiers: `high` lights every sign and every room; `low` (a narrow screen, a slow device, or
 * ?tier=low) lights the walked shop only and loads the smaller sky. ?debug hands the clock to a
 * script (capture.ts), with the camera's smoothing off, so a still is a function of the scroll.
 */

type Tier = "high" | "low";

/** A shop's measurements, in metres near enough. */
const W = 5; // width along the street
const H = 4; // the wall's height
const D = 4.6; // depth behind the wall
const OW = 3.2; // the opening's width
const OH = 2.7; // the opening's height
const SLATS = 22; // slats on a shutter that is all the way down
/** How much taller than `H` each shop stands, so every roof on the street is its own. */
const LIFT = [0.5, 0, 0.32, 0.06, 0.38, 0.12];
/** A roof runs from its eave over the pavement up to its ridge. */
const EAVE_Z = 0.82;
const RIDGE_Z = -1.7;
const RISE = 1.8;

/** Mix two colours, for a wall's lighter trim and its darker plinth. */
const mix = (a: string, b: string, t: number) => `#${new Color(a).lerp(new Color(b), t).getHexString()}`;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function forcedTier(): Tier | null {
  const t = new URLSearchParams(window.location.search).get("tier");
  return t === "low" || t === "high" ? t : null;
}

export default function Street({ running, narrow, businesses }: { running: boolean; narrow: boolean; businesses: Business[] }) {
  const stepping = useDebugStepping("__street");
  const [tier, setTier] = useState<Tier>(() => forcedTier() ?? (narrow ? "low" : "high"));
  const [dpr, setDpr] = useState(() => Math.min(narrow ? 1.25 : 1.5, window.devicePixelRatio || 1));
  const start = TIMELINE[0][narrow ? "phone" : "desk"];

  return (
    <Canvas
      frameloop={stepping ? "never" : running ? "demand" : "never"}
      dpr={stepping ? stepDpr() : dpr}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      camera={{ fov: start.fov, near: 0.1, far: 240, position: start.pos }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
        gl.outputColorSpace = SRGBColorSpace;
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      <StageVitals />
      <Driver running={running} stepping={stepping} idle={false} pointer={false} />
      {!stepping && <Governor max={1.5} start={narrow ? 0.5 : 1} onDpr={setDpr} onFallback={() => setTier("low")} />}
      <Scene tier={tier} narrow={narrow} stepping={stepping} businesses={businesses} />
    </Canvas>
  );
}

type Painted = {
  sky: Texture;
  /** The colour along the sky plate's top edge: the scene's ground above the drum, so no rim shows. */
  skyTop: string;
  slat: Texture;
  rib: Texture;
  fringe: Texture;
  palm: Texture;
  tag: Texture;
  screen: Texture;
  certificate: Texture;
  /** A lamp's light, added to whatever it falls on: a wall, a sign, the paving. */
  glow: Texture;
  paving: Texture;
  asphalt: Texture;
  basalt: Texture;
  /** The walked shop's strategy, as a document's cover. */
  plan: Texture;
  signs: Texture[];
  plaques: Texture[];
};

/** Paints every texture once the sign face has loaded, and frees them when the street goes. */
function usePainted(businesses: Business[], tier: Tier): Painted | null {
  const [painted, setPainted] = useState<Painted | null>(null);
  useEffect(() => {
    let alive = true;
    let made: Painted | null = null;
    (async () => {
      const face = getComputedStyle(document.documentElement).getPropertyValue("--font-sign").trim();
      // A plaque lettered before its face has loaded would be lettered in the fallback for good.
      await document.fonts.load(`600 80px ${face || "sans-serif"}`).catch(() => undefined);
      const sky = await new TextureLoader().loadAsync(tier === "low" ? "/img/sky-1200.webp" : "/img/sky-2400.webp");
      sky.colorSpace = SRGBColorSpace;
      const first = businesses[0];
      made = {
        sky,
        skyTop: topColour(sky.image as CanvasImageSource & { width: number }),
        slat: slatTexture(),
        rib: ribTexture(),
        fringe: fringeTexture(),
        palm: palmTexture(),
        tag: tagTexture("Sample"),
        screen: screenTexture(first, wordmarkFor(first.slug)),
        certificate: certificateTexture(),
        glow: glowTexture(),
        paving: pavingTexture(),
        asphalt: asphaltTexture(),
        basalt: basaltTexture(),
        plan: planTexture(first, wordmarkFor(first.slug)),
        signs: businesses.map((b) => signTexture(b, wordmarkFor(b.slug))),
        plaques: businesses.map((b) => plaqueTexture(b.places[0])),
      };
      if (alive) setPainted(made);
      else disposeAll(made);
    })();
    return () => {
      alive = false;
      if (made) disposeAll(made);
    };
    // The businesses are fixed for the life of the page; the tier decides which sky is loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier]);
  return painted;
}

function disposeAll(p: Painted) {
  for (const t of [p.sky, p.slat, p.rib, p.fringe, p.palm, p.tag, p.screen, p.certificate, p.glow, p.paving, p.asphalt, p.basalt, p.plan, ...p.signs, ...p.plaques]) t.dispose();
}

function Scene({ tier, narrow, stepping, businesses }: { tier: Tier; narrow: boolean; stepping: boolean; businesses: Business[] }) {
  const painted = usePainted(businesses, tier);
  if (!painted) return null;
  return (
    <>
      <color attach="background" args={[painted.skyTop]} />
      {/* The far end of the street falls away into the dusk. */}
      <fog attach="fog" args={[SCENE.dusk, 22, 110]} />
      <hemisphereLight args={[SCENE.skyFill, SCENE.ground, 1.5]} />
      {/* The afterglow rims the street from the horizon's side; a cool fill keeps the fronts readable. */}
      <directionalLight position={[-40, 7, 16]} color={SCENE.afterglow} intensity={1.5} />
      <directionalLight position={[10, 16, 14]} color={SCENE.fill} intensity={1.7} />
      <Sky map={painted.sky} />
      <Ground paving={painted.paving} asphalt={painted.asphalt} />
      {businesses.map((b, k) => (
        <Shop key={b.slug} business={b} k={k} painted={painted} lit={tier === "high" || k === 0} />
      ))}
      <StreetEnd palm={painted.palm} glow={painted.glow} basalt={painted.basalt} x={-businesses.length * W} />
      <NearEnd palm={painted.palm} basalt={painted.basalt} />
      <Rig narrow={narrow} stepping={stepping} />
      <Ready />
    </>
  );
}

/** The painted sky, on the inside of a wide drum around the street. */
function Sky({ map }: { map: Texture }) {
  return (
    <mesh position={[-15, 83, 0]} rotation={[0, Math.PI * 0.62, 0]}>
      <cylinderGeometry args={[150, 150, 180, 48, 1, true, 0, Math.PI * 1.35]} />
      <meshBasicMaterial map={map} side={BackSide} fog={false} toneMapped={false} />
    </mesh>
  );
}

/** The road in tar and the pavement in stone slabs, each painted once and repeated. */
function Ground({ paving, asphalt }: { paving: Texture; asphalt: Texture }) {
  const tar = useMemo(() => {
    const t = asphalt.clone();
    t.repeat.set(260 / 3, 140 / 3);
    t.needsUpdate = true;
    return t;
  }, [asphalt]);
  const slabs = useMemo(() => {
    const t = paving.clone();
    t.repeat.set(70 / 2.7, 1);
    t.needsUpdate = true;
    return t;
  }, [paving]);
  useEffect(() => () => [tar, slabs].forEach((t) => t.dispose()), [tar, slabs]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-15, 0, 10]}>
        <planeGeometry args={[260, 140]} />
        <meshBasicMaterial map={tar} toneMapped={false} />
      </mesh>
      <mesh position={[-15, 0.07, 1.35]}>
        <boxGeometry args={[70, 0.14, 2.7]} />
        <meshLambertMaterial color={SCENE.pavementJoint} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-15, 0.142, 1.35]}>
        <planeGeometry args={[70, 2.7]} />
        <meshLambertMaterial map={slabs} />
      </mesh>
      <mesh position={[-15, 0.08, 2.74]}>
        <boxGeometry args={[70, 0.16, 0.12]} />
        <meshLambertMaterial color={SCENE.kerb} />
      </mesh>
    </group>
  );
}

/**
 * A tin roof: one sheet that rises steeply from the eave over the pavement to the ridge, so its
 * ribs are seen from the street as they are in the mock-up. `h` is the height of the shop's eave.
 */
function roofGeometry(h: number) {
  const g = new BufferGeometry();
  const eaveY = h - 0.04;
  const ridgeY = eaveY + RISE;
  const a = 0.05;
  const b = W - 0.05;
  g.setAttribute("position", new BufferAttribute(new Float32Array([a, eaveY, EAVE_Z, b, eaveY, EAVE_Z, b, ridgeY, RIDGE_Z, a, ridgeY, RIDGE_Z]), 3));
  g.setAttribute("uv", new BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.computeVertexNormals();
  return g;
}

/** A shop's side wall, up to the roof: seen where a shop stands taller than its neighbour, and at the row's end. */
function gableGeometry(h: number) {
  const g = new BufferGeometry();
  const slope = RISE / (EAVE_Z - RIDGE_Z);
  const front = h - 0.04 + EAVE_Z * slope;
  g.setAttribute("position", new BufferAttribute(new Float32Array([0, 0, 0, 0, front, 0, 0, h - 0.04 + RISE, RIDGE_Z, 0, h + 0.2, -D, 0, 0, -D]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4]);
  g.computeVertexNormals();
  return g;
}

function Shop({ business: b, k, painted, lit }: { business: Business; k: number; painted: Painted; lit: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  const wall = b.brand.wall;
  const trim = useMemo(() => mix(wall, SCENE.limewash, 0.2), [wall]);
  const base = useMemo(() => mix(wall, SCENE.ink, 0.38), [wall]);
  const h = H + LIFT[k % LIFT.length];
  // The wall runs up behind the eave to meet the roof, so nothing shows between them.
  const top = h + 0.44;
  const roof = useMemo(() => roofGeometry(h), [h]);
  const gable = useMemo(() => gableGeometry(h), [h]);
  useEffect(() => () => [roof, gable].forEach((g) => g.dispose()), [roof, gable]);
  // A barge board runs up each sloping edge of the roof.
  const bargeLength = Math.hypot(EAVE_Z - RIDGE_Z, RISE);
  const bargeTilt = Math.atan2(-RISE, RIDGE_Z - EAVE_Z);
  const ribs = useMemo(() => {
    const t = painted.rib.clone();
    t.repeat.set(W / 0.3, 1);
    t.needsUpdate = true;
    return t;
  }, [painted.rib]);
  const fringe = useMemo(() => {
    const t = painted.fringe.clone();
    t.repeat.set(W / 0.26, 1);
    t.needsUpdate = true;
    return t;
  }, [painted.fringe]);
  const slats = useMemo(() => {
    const t = painted.slat.clone();
    t.needsUpdate = true;
    return t;
  }, [painted.slat]);
  useEffect(() => () => [ribs, fringe, slats].forEach((t) => t.dispose()), [ribs, fringe, slats]);

  const shutter = useRef<Mesh>(null);
  const rail = useRef<Mesh>(null);
  const tag = useRef<Mesh>(null);
  const room = useRef<PointLight>(null);
  const spill = useRef<MeshBasicMaterial>(null);
  // How far down the shutter is now: 1 is down. A sample starts shut; the walked shop follows the walk.
  const down = useRef(k === 0 ? TIMELINE[0].shutter : 1);

  useFrame((_, dt) => {
    const target = stage.hand[k] ?? (k === 0 ? walkedShutter() : 1);
    const before = down.current;
    // A shutter is heavy: it closes on its target over about half a second, and cuts under reduced motion.
    const ease = stage.reduced ? 1 : 1 - Math.exp(-Math.min(dt, 0.1) * 5);
    down.current = Math.abs(target - before) < 0.002 ? target : before + (target - before) * ease;
    if (down.current !== target) busy(300);
    const c = down.current;
    if (shutter.current) {
      shutter.current.scale.y = Math.max(0.001, c * OH);
      shutter.current.position.y = -(c * OH) / 2;
      // Slats keep their size: fewer of them show as the shutter rolls into its housing.
      (shutter.current.material as MeshLambertMaterial).map?.repeat.set(1, Math.max(0.05, c * SLATS));
    }
    if (rail.current) rail.current.position.y = -c * OH;
    if (tag.current) {
      // A sample stays marked whatever is done to its shutter: the tag rides the shutter down, and
      // hangs under the housing when the shutter is rolled away.
      tag.current.position.y = Math.min(-(c * OH) / 2, -0.3);
    }
    if (room.current) room.current.intensity = (1 - c) * 18;
    // The lit room throws its light across the paving, as far as the shutter lets it out.
    if (spill.current) spill.current.opacity = (1 - c) * 0.8;
  });

  const toggle = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    stage.hand[k] = down.current > 0.5 ? 0.04 : 1;
    busy(1600);
    invalidate();
  };
  const hover = (on: boolean) => {
    document.body.style.cursor = on ? "pointer" : "";
  };

  return (
    <group position={[-(k + 1) * W, 0, 0]}>
      {/* The wall: two piers and the lintel over the opening */}
      <mesh position={[(W - OW) / 4, top / 2, -0.15]}>
        <boxGeometry args={[(W - OW) / 2, top, 0.3]} />
        <meshLambertMaterial color={wall} />
      </mesh>
      <mesh position={[W - (W - OW) / 4, top / 2, -0.15]}>
        <boxGeometry args={[(W - OW) / 2, top, 0.3]} />
        <meshLambertMaterial color={wall} />
      </mesh>
      <mesh position={[W / 2, (top + OH) / 2, -0.15]}>
        <boxGeometry args={[OW, top - OH, 0.3]} />
        <meshLambertMaterial color={wall} />
      </mesh>
      {/* Its two side walls, up to the roof */}
      {[0.001, W - 0.001].map((x) => (
        <mesh key={x} geometry={gable} position={[x, 0, 0]}>
          <meshLambertMaterial color={wall} side={DoubleSide} />
        </mesh>
      ))}
      {/* Pilasters at its two edges, and the plinth along its foot */}
      {[0.2, W - 0.2].map((x) => (
        <mesh key={x} position={[x, top / 2, 0.035]}>
          <boxGeometry args={[0.36, top, 0.07]} />
          <meshLambertMaterial color={trim} />
        </mesh>
      ))}
      <mesh position={[W / 2, 0.2, 0.05]}>
        <boxGeometry args={[W, 0.4, 0.1]} />
        <meshLambertMaterial color={base} />
      </mesh>

      {/* The sign: the board with its lettering, its frame, and two lamps over it */}
      <mesh position={[W / 2, 3.33, 0.02]}>
        <boxGeometry args={[3.66, 1.0, 0.1]} />
        <meshLambertMaterial color={b.brand.accent} />
      </mesh>
      <mesh position={[W / 2, 3.33, 0.075]}>
        <planeGeometry args={[3.5, 0.875]} />
        <meshBasicMaterial map={painted.signs[k]} />
      </mesh>
      {[1.55, 3.45].map((x) => (
        <group key={x} position={[x, 3.98, 0]}>
          {/* A gooseneck: out from the wall, over, and down to its shade */}
          <mesh position={[0, 0.06, 0.2]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.2, 0.016, 6, 14, Math.PI]} />
            <meshLambertMaterial color={SCENE.iron} />
          </mesh>
          <mesh position={[0, -0.02, 0.4]}>
            <coneGeometry args={[0.16, 0.15, 14, 1, true]} />
            <meshLambertMaterial color={SCENE.iron} side={DoubleSide} />
          </mesh>
          <mesh position={[0, -0.09, 0.4]}>
            <sphereGeometry args={[0.065, 10, 8]} />
            <meshBasicMaterial color={SCENE.lamp} toneMapped={false} />
          </mesh>
          {/* The lamp's glow, and the pool it throws down the wall. Both are painted light, added to
              what is behind them, so they show on every tier. The glow turns to face the visitor,
              so it is round from any side. */}
          <sprite position={[0, -0.09, 0.47]} scale={[0.7, 0.7, 1]}>
            <spriteMaterial map={painted.glow} transparent blending={AdditiveBlending} depthWrite={false} opacity={0.9} toneMapped={false} fog={false} />
          </sprite>
          {/* The pool lies on the wall, behind the sign's board: a board paints its own lamplight
              (textures.ts), so pale lettering on a pale board is never washed out. */}
          <mesh position={[0, -0.78, 0.012]}>
            <planeGeometry args={[1.9, 2.5]} />
            <meshBasicMaterial map={painted.glow} transparent blending={AdditiveBlending} depthWrite={false} opacity={0.5} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {lit && <pointLight position={[W / 2, 3.7, 1.1]} color={SCENE.lamp} intensity={7} distance={8} decay={2} />}

      {/* The shutter's housing, the shutter, its bottom rail, and a sample's tag */}
      <mesh position={[W / 2, OH + 0.05, -0.02]}>
        <boxGeometry args={[OW + 0.24, 0.22, 0.34]} />
        <meshLambertMaterial color={base} />
      </mesh>
      <group position={[W / 2, OH, -0.1]}>
        <mesh ref={shutter} onClick={toggle} onPointerOver={() => hover(true)} onPointerOut={() => hover(false)}>
          <planeGeometry args={[OW, 1]} />
          <meshLambertMaterial map={slats} />
        </mesh>
        <mesh ref={rail} position={[0, -OH, 0.02]}>
          <boxGeometry args={[OW, 0.09, 0.06]} />
          <meshLambertMaterial color={SCENE.steelDeep} />
        </mesh>
        {b.sample && (
          <mesh ref={tag} position={[0, -OH / 2, 0.04]}>
            <planeGeometry args={[1.12, 0.42]} />
            <meshBasicMaterial map={painted.tag} transparent />
          </mesh>
        )}
      </group>
      {/* A raised shutter leaves nothing to press, so the opening itself answers a tap. */}
      <mesh position={[W / 2, OH / 2, -0.3]} onClick={toggle} onPointerOver={() => hover(true)} onPointerOut={() => hover(false)}>
        <planeGeometry args={[OW, OH]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* The room behind it: lit, and empty */}
      <mesh position={[W / 2, OH / 2, -0.3 - (D - 0.3) / 2]}>
        <boxGeometry args={[OW, OH, D - 0.3]} />
        <meshLambertMaterial color={SCENE.roomWall} side={BackSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[W / 2, 0.02, -0.3 - (D - 0.3) / 2]}>
        <planeGeometry args={[OW, D - 0.3]} />
        <meshLambertMaterial color={SCENE.roomFloor} />
      </mesh>
      {lit && <pointLight ref={room} position={[W / 2, 2.25, -1.9]} color={SCENE.lamp} intensity={0} distance={12} decay={2} />}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[W / 2, 0.15, 0.55]}>
        <planeGeometry args={[OW + 2.6, 4.4]} />
        <meshBasicMaterial ref={spill} map={painted.glow} transparent blending={AdditiveBlending} depthWrite={false} opacity={0} toneMapped={false} />
      </mesh>

      {/* The roof, the board along its eave, and the lambrequin hanging from it */}
      <mesh geometry={roof}>
        <meshLambertMaterial map={ribs} side={DoubleSide} />
      </mesh>
      <mesh position={[W / 2, h - 0.02, EAVE_Z]}>
        <boxGeometry args={[W - 0.06, 0.1, 0.07]} />
        <meshLambertMaterial color={SCENE.limewash} />
      </mesh>
      {[0.07, W - 0.07].map((x) => (
        <mesh key={x} position={[x, h - 0.04 + RISE / 2, (EAVE_Z + RIDGE_Z) / 2]} rotation={[bargeTilt, 0, 0]}>
          <boxGeometry args={[0.09, 0.12, bargeLength]} />
          <meshLambertMaterial color={SCENE.limewash} />
        </mesh>
      ))}
      <mesh position={[W / 2, h - 0.2, EAVE_Z + 0.02]}>
        <planeGeometry args={[W - 0.06, 0.28]} />
        <meshLambertMaterial map={fringe} transparent alphaTest={0.5} side={DoubleSide} emissive={SCENE.limewash} emissiveIntensity={0.12} />
      </mesh>

      {/* The plaque that names its town */}
      <mesh position={[W - 0.56, 1.95, 0.082]}>
        <planeGeometry args={[0.66, 0.23]} />
        <meshBasicMaterial map={painted.plaques[k]} />
      </mesh>

      {k === 0 && <Fittings painted={painted} trim={b.brand.accent} />}
    </group>
  );
}

/**
 * What the walked shop holds, so each of the things a business comes with has somewhere to be
 * shown: a letterbox for its address, a screen for its website, a folder on a counter for its
 * strategy, a frame on the wall for its company. Everything else in the room is left empty.
 */
function Fittings({ painted, trim }: { painted: Painted; trim: string }) {
  return (
    <group>
      {/* The letterbox on the pier, under the plaque */}
      <mesh position={[W - 0.56, 1.5, 0.085]}>
        <boxGeometry args={[0.4, 0.1, 0.03]} />
        <meshLambertMaterial color={trim} />
      </mesh>
      <mesh position={[W - 0.56, 1.5, 0.102]}>
        <boxGeometry args={[0.3, 0.025, 0.01]} />
        <meshBasicMaterial color={SCENE.ink} />
      </mesh>
      {/* The screen on the back wall */}
      <mesh position={[W / 2, 1.62, -D + 0.05]}>
        <boxGeometry args={[1.72, 1.1, 0.06]} />
        <meshLambertMaterial color={SCENE.ink} />
      </mesh>
      <mesh position={[W / 2, 1.62, -D + 0.085]}>
        <planeGeometry args={[1.6, 1.0]} />
        <meshBasicMaterial map={painted.screen} toneMapped={false} />
      </mesh>
      {/* The counter along the right wall, and the strategy on it: a document with its cover up */}
      <mesh position={[W / 2 + OW / 2 - 0.37, 0.46, -2.5]}>
        <boxGeometry args={[0.7, 0.92, 1.4]} />
        <meshLambertMaterial color={SCENE.limewash} />
      </mesh>
      <group position={[W / 2 + OW / 2 - 0.37, 0.92, -2.5]} rotation={[0, -Math.PI / 2 + 0.12, 0]}>
        <mesh position={[0, 0.018, 0]}>
          <boxGeometry args={[0.42, 0.036, 0.58]} />
          <meshLambertMaterial color={SCENE.paper} />
        </mesh>
        <mesh position={[0, 0.038, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.43, 0.59]} />
          <meshBasicMaterial map={painted.plan} />
        </mesh>
      </group>
      {/* The frame on the left wall */}
      <mesh position={[W / 2 - OW / 2 + 0.02, 1.68, -2.6]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.56, 0.72, 0.04]} />
        <meshLambertMaterial color={SCENE.ink} />
      </mesh>
      <mesh position={[W / 2 - OW / 2 + 0.045, 1.68, -2.6]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.46, 0.6]} />
        <meshBasicMaterial map={painted.certificate} />
      </mesh>
    </group>
  );
}

/** A low wall of basalt blocks, `length` long, running along the pavement from its middle at `x`. */
function BasaltWall({ map, x, length }: { map: Texture; x: number; length: number }) {
  const blocks = useMemo(() => {
    const t = map.clone();
    t.repeat.set(length / 2.2, 1);
    t.needsUpdate = true;
    return t;
  }, [map, length]);
  useEffect(() => () => blocks.dispose(), [blocks]);
  return (
    <group position={[x, 0, 0.3]}>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[length, 1.1, 0.5]} />
        <meshLambertMaterial color={SCENE.basaltDeep} />
      </mesh>
      <mesh position={[0, 0.55, 0.252]}>
        <planeGeometry args={[length, 1.1]} />
        <meshLambertMaterial map={blocks} />
      </mesh>
    </group>
  );
}

/** Where the street ends: a lit lamp with its wire to the last roof, a basalt wall, palms against the sky. */
function StreetEnd({ palm, glow, basalt, x }: { palm: Texture; glow: Texture; basalt: Texture; x: number }) {
  // The wire runs from the lamp's head to the ridge of the last shop's roof.
  const from = [-0.85, 5.15, 1.9];
  const to = [0.6, H + 0.1 + RISE, RIDGE_Z];
  const wire = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[-1.6, 2.6, 1.9]}>
        <cylinderGeometry args={[0.06, 0.09, 5.2, 8]} />
        <meshLambertMaterial color={SCENE.iron} />
      </mesh>
      <mesh position={[-1.25, 5.1, 1.9]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.8, 6]} />
        <meshLambertMaterial color={SCENE.iron} />
      </mesh>
      <mesh position={[-0.85, 5.02, 1.9]}>
        <sphereGeometry args={[0.17, 12, 10]} />
        <meshBasicMaterial color={SCENE.lamp} toneMapped={false} fog={false} />
      </mesh>
      <sprite position={[-0.85, 5.02, 1.9]} scale={[2.6, 2.6, 1]}>
        <spriteMaterial map={glow} transparent blending={AdditiveBlending} depthWrite={false} opacity={0.85} toneMapped={false} fog={false} />
      </sprite>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.85, 0.16, 1.9]}>
        <planeGeometry args={[6, 5]} />
        <meshBasicMaterial map={glow} transparent blending={AdditiveBlending} depthWrite={false} opacity={0.4} toneMapped={false} />
      </mesh>
      <pointLight position={[-0.85, 4.8, 1.9]} color={SCENE.lamp} intensity={22} distance={14} decay={2} />
      <mesh
        position={[(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2]}
        onUpdate={(m) => m.lookAt(x + to[0], to[1], to[2])}
      >
        <boxGeometry args={[0.02, 0.02, wire]} />
        <meshBasicMaterial color={SCENE.iron} />
      </mesh>
      <BasaltWall map={basalt} x={-7.5} length={11} />
      {[
        [-2.9, 4.3, -1.0, 8.6],
        [-5.6, 3.5, -2.4, 7.0],
        [-8.6, 3.0, -1.2, 6.0],
      ].map(([px, py, pz, h]) => (
        <mesh key={px} position={[px, py, pz]}>
          <planeGeometry args={[h / 2, h]} />
          <meshBasicMaterial map={palm} transparent alphaTest={0.4} fog={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** The near end, past the first shop: the basalt wall carries on, with a palm behind it. */
function NearEnd({ palm, basalt }: { palm: Texture; basalt: Texture }) {
  return (
    <group>
      <BasaltWall map={basalt} x={6.2} length={12} />
      <mesh position={[4.6, 3.6, -2.2]}>
        <planeGeometry args={[3.6, 7.2]} />
        <meshBasicMaterial map={palm} transparent alphaTest={0.4} fog={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** How far down the walked shop's shutter is at this point of the walk. */
function walkedShutter() {
  const n = TIMELINE.length - 1;
  const x = clamp01(stage.progress) * n;
  const i = Math.min(n - 1, Math.floor(x));
  return TIMELINE[i].shutter + (TIMELINE[i + 1].shutter - TIMELINE[i].shutter) * travel(x - i);
}

/** The way between two stops: held at each end, eased through the middle, cut under reduced motion. */
function travel(t: number) {
  if (stage.reduced) return t < 0.5 ? 0 : 1;
  const u = clamp01((t - HOLD) / (1 - 2 * HOLD));
  return u * u * (3 - 2 * u);
}

/** Walks the camera along the timeline as the page scrolls. */
function Rig({ narrow, stepping }: { narrow: boolean; stepping: boolean }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const mode = narrow ? "phone" : "desk";
  const now = useRef({
    pos: new Vector3(...TIMELINE[0][mode].pos),
    look: new Vector3(...TIMELINE[0][mode].look),
    ...fit(TIMELINE[0][mode], size.width, size.height),
  });
  const want = useMemo(() => ({ pos: new Vector3(), look: new Vector3() }), []);

  useFrame((_, dt) => {
    const n = TIMELINE.length - 1;
    const x = clamp01(stage.progress) * n;
    const i = Math.min(n - 1, Math.floor(x));
    const t = travel(x - i);
    const a: Frame = TIMELINE[i][mode];
    const b: Frame = TIMELINE[i + 1][mode];
    want.pos.set(a.pos[0] + (b.pos[0] - a.pos[0]) * t, a.pos[1] + (b.pos[1] - a.pos[1]) * t, a.pos[2] + (b.pos[2] - a.pos[2]) * t);
    want.look.set(a.look[0] + (b.look[0] - a.look[0]) * t, a.look[1] + (b.look[1] - a.look[1]) * t, a.look[2] + (b.look[2] - a.look[2]) * t);
    // Between two stops the camera rises a little, so the walk feels walked.
    want.pos.y += Math.sin(Math.PI * t) * 0.3;
    // Each stop's frame as this stage shows it (timeline.ts, fit), then the way between the two.
    const fa = fit(a, size.width, size.height);
    const fb = fit(b, size.width, size.height);
    const fov = fa.fov + (fb.fov - fa.fov) * t;
    const sx = fa.sx + (fb.sx - fa.sx) * t;
    const sy = fa.sy + (fb.sy - fa.sy) * t;

    // Smoothed, so a wheel's steps do not show; exact under ?debug and reduced motion.
    const k = stepping || stage.reduced ? 1 : 1 - Math.exp(-Math.min(dt, 0.1) * 6);
    const c = now.current;
    c.pos.lerp(want.pos, k);
    c.look.lerp(want.look, k);
    c.fov += (fov - c.fov) * k;
    c.sx += (sx - c.sx) * k;
    c.sy += (sy - c.sy) * k;
    // Nothing is drawn at rest, so the camera asks for frames until every part of it has arrived:
    // a resize moves only the shift, and must still be seen through.
    const arriving =
      c.pos.distanceToSquared(want.pos) > 1e-5 ||
      c.look.distanceToSquared(want.look) > 1e-5 ||
      Math.abs(c.fov - fov) > 1e-3 ||
      Math.abs(c.sx - sx) > 1e-4 ||
      Math.abs(c.sy - sy) > 1e-4;
    if (arriving) busy(250);

    camera.position.copy(c.pos);
    camera.fov = c.fov;
    camera.lookAt(c.look);
    camera.setViewOffset(size.width, size.height, -c.sx * size.width, -c.sy * size.height, size.width, size.height);
    camera.updateProjectionMatrix();
  }, -5);

  return null;
}

/** Compiles the street, lets two finished frames draw, then tells the page the stand-in can go. */
function Ready() {
  const { gl, scene, camera, invalidate } = useThree();
  const frames = useRef(0);
  useEffect(() => {
    gl.compile(scene, camera);
    invalidate();
  }, [gl, scene, camera, invalidate]);
  useFrame(() => {
    if (stage.ready) return;
    frames.current += 1;
    if (frames.current < 3) {
      invalidate();
      return;
    }
    stage.ready = true;
    window.dispatchEvent(new Event(STAGE_READY));
  });
  return null;
}
