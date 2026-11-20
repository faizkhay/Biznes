"use client";

import { Map as StreetMap, Popup, setWorkerUrl, type GeoJSONSource, type LngLatBoundsLike } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { STREET_MAP } from "@/data/site";
import { mapHref } from "@/lib/format";
import { Minus, Plus } from "./Icons";

type Markers = { kinds: string[]; points: [lon: number, lat: number, name: string, id: string, kind: number][] };

/** Every listing's place, name and kind, fetched once for the whole visit. */
let markersOnce: Promise<Markers> | undefined;
const markers = () => (markersOnce ??= fetch("/markers.json").then((r) => r.json() as Promise<Markers>));

/**
 * The street map itself: MapLibre GL drawing OpenFreeMap's tiles, with every listing as a point of
 * ink and the ones that answer as saffron ringed in ink, as on the island. A point is tapped for
 * its name and the way to its page. This file, the library and its styles are a part of the site
 * a visitor is sent only after asking for the map (MapSwitch).
 *
 * The page scrolls past the map with one finger or the wheel; the map itself moves with two
 * fingers, or with the wheel while Ctrl is held, and says so. The credit the tiles ask for is
 * written on the map in the page's own type, and is always there.
 */
export default function StreetMapView({ lit, focus }: { lit?: number[]; focus?: { lon: number; lat: number; name: string } }) {
  const frame = useRef<HTMLDivElement>(null);
  const map = useRef<StreetMap | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!frame.current) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const style = getComputedStyle(document.documentElement);
    const ink = style.getPropertyValue("--palette-ink").trim() || "#0a1639";
    const signal = style.getPropertyValue("--palette-saffron").trim() || "#f8c618";
    const paper = style.getPropertyValue("--palette-white").trim() || "#ffffff";
    let on = true;
    let made: StreetMap;
    try {
      // The library's worker is a file of its own, served from this site.
      setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href);
      made = new StreetMap({
        container: frame.current,
        style: STREET_MAP.style,
        bounds: (focus ? undefined : STREET_MAP.island) as LngLatBoundsLike | undefined,
        center: focus ? [focus.lon, focus.lat] : undefined,
        zoom: focus ? 15.5 : undefined,
        maxBounds: [...STREET_MAP.bounds] as LngLatBoundsLike,
        minZoom: 7,
        attributionControl: false,
        cooperativeGestures: true,
        dragRotate: false,
        pitchWithRotate: false,
      });
    } catch {
      // No WebGL, or the browser would not start the map: the page says so and offers another way.
      setFailed(true);
      return;
    }
    map.current = made;
    made.touchZoomRotate.disableRotation();
    // The style or the tiles could not be had before the map was ever drawn.
    const fail = () => !made.isStyleLoaded() && on && setFailed(true);
    made.on("error", fail);
    made.on("load", async () => {
      made.off("error", fail);
      let data: Markers;
      try {
        data = await markers();
      } catch {
        return;
      }
      if (!on) return;
      const chosen = new Set(lit ?? []);
      made.addSource("listings", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: data.points.map(([lon, lat, name, id, kind], i) => ({ type: "Feature", geometry: { type: "Point", coordinates: [lon, lat] }, properties: { name, id, kind: data.kinds[kind] ?? "", lit: chosen.has(i) ? 1 : 0 } })),
        },
      });
      // Every listing is a point of ink; the ones that answer are saffron ringed in ink, drawn over the rest.
      made.addLayer({ id: "listing", type: "circle", source: "listings", filter: ["==", ["get", "lit"], 0], paint: { "circle-color": ink, "circle-opacity": chosen.size ? 0.45 : 0.8, "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 1.5, 13, 3.5, 16, 6], "circle-stroke-color": paper, "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 12, 0, 15, 1.5] } });
      made.addLayer({ id: "lit", type: "circle", source: "listings", filter: ["==", ["get", "lit"], 1], paint: { "circle-color": signal, "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 4, 13, 6.5, 16, 9], "circle-stroke-color": ink, "circle-stroke-width": 1.75 } });
      if (focus) {
        made.addSource("focus", { type: "geojson", data: { type: "Feature", geometry: { type: "Point", coordinates: [focus.lon, focus.lat] }, properties: {} } });
        made.addLayer({ id: "focus-halo", type: "circle", source: "focus", paint: { "circle-color": signal, "circle-opacity": 0.3, "circle-radius": 22, "circle-stroke-color": ink, "circle-stroke-width": 2 } });
        made.addLayer({ id: "focus", type: "circle", source: "focus", paint: { "circle-color": signal, "circle-radius": 7, "circle-stroke-color": ink, "circle-stroke-width": 2 } });
      } else if (chosen.size) {
        // Drawn in on the points that answer, as the island is.
        let [west, south, east, north] = [Infinity, Infinity, -Infinity, -Infinity];
        for (const i of chosen) {
          const point = data.points[i];
          if (!point) continue;
          west = Math.min(west, point[0]);
          east = Math.max(east, point[0]);
          south = Math.min(south, point[1]);
          north = Math.max(north, point[1]);
        }
        // A set spread over both islands is shown on the main one: the sea between them is 600 km of nothing.
        if (west < Infinity && east - west < 1.5) made.fitBounds([west, south, east, north], { padding: 48, maxZoom: 15, animate: !still });
      }
      // A point is tapped for what it is and the way to its page.
      const open = (event: { lngLat: { lng: number; lat: number }; features?: { properties?: Record<string, unknown>; geometry: unknown }[] }) => {
        const found = event.features?.[0];
        if (!found?.properties) return;
        const { name, id, kind } = found.properties as { name: string; id: string; kind: string };
        const card = document.createElement("div");
        const link = Object.assign(document.createElement("a"), { href: `/b/${id}`, textContent: name, className: "title-2" });
        const what = Object.assign(document.createElement("p"), { textContent: kind, className: "caption-1" });
        card.append(link, what);
        const at = (found.geometry as { coordinates: [number, number] }).coordinates;
        new Popup({ closeButton: true, maxWidth: "16rem", offset: 10 }).setLngLat(at).setDOMContent(card).addTo(made);
      };
      for (const layer of ["lit", "listing"]) {
        made.on("click", layer, open);
        made.on("mouseenter", layer, () => (made.getCanvas().style.cursor = "pointer"));
        made.on("mouseleave", layer, () => (made.getCanvas().style.cursor = ""));
      }
      (made.getSource("listings") as GeoJSONSource | undefined) && frame.current?.setAttribute("data-ready", "true");
    });
    return () => {
      on = false;
      map.current = null;
      made.remove();
    };
    // The map is made once for the page it is on; what is lit does not change while it is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (failed) {
    return (
      <div className="street street-failed note body-3" role="status">
        <p>The street map could not be opened here: it needs a browser that can draw it, and a connection to the map&rsquo;s tiles.</p>
        <p className="mt-2">
          <a href={focus ? mapHref(focus.lat, focus.lon) : "https://www.openstreetmap.org/#map=10/-20.25/57.57"} rel="noopener">
            Open OpenStreetMap instead
          </a>
        </p>
      </div>
    );
  }
  const zoom = (by: number) => map.current?.zoomTo(map.current.getZoom() + by, { animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches });
  return (
    <div className="street">
      <div ref={frame} className="street-map" role="region" aria-label={focus ? `A street map centred on ${focus.name}. Every listing on it is also in the lists on this page.` : "A street map of Mauritius with the listings on it. Every listing on it is also in the lists on this page."} />
      <p className="street-zoom">
        <button type="button" className="icon-btn icon-btn-sq" aria-label="Zoom in" title="Zoom in" onClick={() => zoom(1)}>
          <Plus />
        </button>
        <button type="button" className="icon-btn icon-btn-sq" aria-label="Zoom out" title="Zoom out" onClick={() => zoom(-1)}>
          <Minus />
        </button>
      </p>
      {/* The credit the tiles ask for: on the map, in words, always. */}
      <p className="street-credit">
        {STREET_MAP.credit.map((c, i) => (
          <span key={c.href}>
            {i > 0 && " · "}
            <a href={c.href} rel="noopener">
              {c.label}
            </a>
          </span>
        ))}
      </p>
    </div>
  );
}
