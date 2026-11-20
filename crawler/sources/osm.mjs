// The open map: every named business and service OpenStreetMap holds for Mauritius.
//
// OpenStreetMap is made by volunteers and published under the Open Database Licence, which allows
// this use as long as the map is credited (the site does, on every page that shows its data) and
// what is derived from it stays open (data/index is published with the site's source).
//
// From one country extract this reads: the places to list (a named thing with a shop, amenity,
// office, tourism, craft, healthcare or leisure tag the taxonomy knows), the island's outline, its
// districts, its towns and villages with their council boundaries, and the named places on the map.
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { createOSMStream } from "osm-pbf-parser-node";
import { config } from "../config.mjs";
import { download } from "../lib/fetcher.mjs";
import { area, bounds, inside, joinRings, metres, round5, simplify } from "../lib/geo.mjs";
import { phone } from "../lib/html.mjs";
import { SHARED_HOSTS, hostOf, slugify, tidy, webAddress } from "../lib/text.mjs";
import { categorise } from "../taxonomy.mjs";

const PACK = 2 ** 26;
const pack = (lat, lon) => Math.round((lat + 90) * 1e5) * PACK + Math.round((lon + 180) * 1e5);
const unpack = (v) => [(v % PACK) / 1e5 - 180, Math.floor(v / PACK) / 1e5 - 90]; // [lon, lat]

const yes = (v) => v === "yes" || v === "wlan" || v === "only" || v === "designated";

/** "Mo-Fr 08:00-17:00" stays as the map wrote it; only its shape is checked. */
const hours = (v) => (v && v.length <= 160 && /\d|24\/7|off/i.test(v) ? tidy(v) : null);

/** The words of a cuisine or a speciality tag: "indian;chinese" becomes "Indian, Chinese". */
const listed = (v) =>
  String(v ?? "")
    .split(/[;,]/)
    .map((s) => s.trim().replace(/_/g, " "))
    .filter((s) => s && s.length < 30)
    .slice(0, 4)
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join(", ");

/** One listing from one map element's tags. */
function listing(type, id, tags, lon, lat, stamp) {
  const found = categorise(tags);
  if (!found) return null;
  const name = tidy(tags.name);
  if (name.length < 2) return null;

  const alt = new Set();
  for (const key of ["name:en", "name:fr", "alt_name", "short_name", "official_name", "brand"]) {
    for (const value of String(tags[key] ?? "").split(";")) {
      const other = tidy(value);
      if (other && other.toLowerCase() !== name.toLowerCase()) alt.add(other);
    }
  }

  const phones = new Set();
  for (const key of ["phone", "contact:phone", "mobile", "contact:mobile"]) {
    for (const value of String(tags[key] ?? "").split(/[;,/]/)) {
      const number = phone(value);
      if (number) phones.add(number);
    }
  }

  const social = {};
  for (const [key, base] of [["facebook", "https://www.facebook.com/"], ["instagram", "https://www.instagram.com/"], ["linkedin", "https://www.linkedin.com/company/"], ["youtube", "https://www.youtube.com/"], ["tiktok", "https://www.tiktok.com/@"]]) {
    const value = String(tags[`contact:${key}`] ?? tags[key] ?? "").trim();
    if (!value) continue;
    const address = /^https?:\/\//i.test(value) ? webAddress(value) : webAddress(base + value.replace(/^@/, ""));
    if (address) social[key] = address;
  }
  let web = webAddress(tags.website ?? tags["contact:website"] ?? tags.url);
  if (web && SHARED_HOSTS.test(hostOf(web) ?? "")) {
    // A page on a network is a profile, not the business's own site.
    const host = hostOf(web);
    if (/facebook|fb\./.test(host)) social.facebook ??= web;
    else if (/instagram/.test(host)) social.instagram ??= web;
    web = null;
  }

  const street = [tidy(tags["addr:housenumber"], 12), tidy(tags["addr:street"], 80)].filter(Boolean).join(" ");
  const extras = [];
  if (yes(tags.wheelchair)) extras.push("Wheelchair access");
  if (yes(tags.takeaway)) extras.push("Takeaway");
  if (yes(tags.delivery)) extras.push("Delivery");
  if (yes(tags.internet_access)) extras.push("Wi-Fi");
  if (yes(tags.drive_through)) extras.push("Drive-through");
  if (yes(tags.air_conditioning)) extras.push("Air conditioning");
  if (yes(tags.outdoor_seating)) extras.push("Outdoor seating");

  const about = tidy(tags["description:en"] ?? tags.description ?? "", 320);
  const since = /^(1[89]\d\d|20[0-2]\d)/.exec(String(tags.start_date ?? ""))?.[1];

  return {
    id: `${type[0]}${id}`,
    name,
    alt: [...alt].slice(0, 5),
    cat: found.cat,
    tag: found.tag,
    kind: listed(tags.cuisine) || undefined,
    stars: /^[1-5]/.test(String(tags.stars ?? "")) ? Number(String(tags.stars)[0]) : undefined,
    lon: round5(lon),
    lat: round5(lat),
    street: street || undefined,
    town: tidy(tags["addr:city"] ?? "", 60) || undefined,
    postcode: /^\d{5}$/.test(String(tags["addr:postcode"] ?? "").trim()) ? String(tags["addr:postcode"]).trim() : undefined,
    phone: [...phones].slice(0, 3),
    web: web ?? undefined,
    social,
    hours: hours(tags.opening_hours) ?? undefined,
    brand: tidy(tags.brand ?? "", 60) || undefined,
    about: about || undefined,
    aboutFrom: about ? "map" : undefined,
    extras,
    since: since ? Number(since) : undefined,
    wikidata: /^Q\d+$/.test(String(tags.wikidata ?? "")) ? tags.wikidata : undefined,
    src: { osm: `${type}/${id}`, edited: stamp ? new Date(stamp).toISOString().slice(0, 10) : undefined },
  };
}

/** A council area's name without the map's suffixes: "Grand Baie VCA, East" is "Grand Baie". */
const localityName = (name) =>
  tidy(name)
    .replace(/\s*VCA\b.*$/i, "")
    .replace(/^Town of\s+/i, "")
    .replace(/\s*\/\s*/g, "-")
    .replace(/’/g, "'")
    .replace(/\s+-\s+/g, "-")
    .trim();

export async function readOsm() {
  mkdirSync(join(config.cacheDir, "osm"), { recursive: true });
  const file = join(config.cacheDir, "osm", "mauritius-latest.osm.pbf");
  const got = await download(config.osm.mirrors, file, config.osm.maxAgeHours);
  console.log(`  extract: ${got.from}`);

  const coords = new Map(); // node id -> packed position
  const wayRefs = new Map(); // way id -> node ids
  const pois = []; // { type, id, tags, stamp, lon?, lat?, refs?, members? }
  const coast = [];
  const placeNodes = [];
  const boundaries = []; // { level, name, members }
  let stamp = null;

  for await (const item of createOSMStream(file, { withTags: true, withInfo: true })) {
    if (!item.type) {
      if (item.osmosis_replication_timestamp) stamp = new Date(item.osmosis_replication_timestamp * 1000).toISOString();
      continue;
    }
    const tags = item.tags ?? {};
    if (item.type === "node") {
      coords.set(item.id, pack(item.lat, item.lon));
      if (tags.place && tags.name) placeNodes.push({ kind: tags.place, name: tidy(tags.name, 80), lon: item.lon, lat: item.lat, population: Number(tags.population) || 0 });
      if (tags.name && categorise(tags)) pois.push({ type: "node", id: item.id, tags, stamp: item.info?.timestamp, lon: item.lon, lat: item.lat });
    } else if (item.type === "way") {
      wayRefs.set(item.id, item.refs);
      if (tags.natural === "coastline") coast.push(item.refs);
      if (tags.name && categorise(tags)) pois.push({ type: "way", id: item.id, tags, stamp: item.info?.timestamp, refs: item.refs });
    } else if (item.type === "relation") {
      const ways = (item.members ?? []).filter((m) => m.type === "way" && m.role !== "inner").map((m) => m.ref);
      if (tags.boundary === "administrative" && tags.name && ["3", "4", "8"].includes(tags.admin_level)) boundaries.push({ level: Number(tags.admin_level), name: tags.name, ways });
      else if (tags.name && categorise(tags)) pois.push({ type: "relation", id: item.id, tags, stamp: item.info?.timestamp, ways });
    }
  }

  const at = (node) => (coords.has(node) ? unpack(coords.get(node)) : null);
  const line = (refs) => refs.map(at).filter(Boolean);
  const centre = (points) => {
    if (!points.length) return null;
    const [w, s, e, n] = bounds(points);
    return [(w + e) / 2, (s + n) / 2];
  };

  // Outlines. The largest ring west of 60 degrees east is the island of Mauritius; the rings near
  // 63.4 degrees east are Rodrigues. Small rings near either are their islets.
  const rings = joinRings(coast)
    .map((ring) => line(ring))
    .filter((ring) => ring.length > 8);
  const sized = rings.map((ring) => ({ ring, size: Math.abs(area(ring)), box: bounds(ring) })).sort((a, b) => b.size - a.size);
  const west = sized.filter((r) => r.box[0] > 57 && r.box[2] < 58.2 && r.box[1] > -20.7 && r.box[3] < -19.8);
  const east = sized.filter((r) => r.box[0] > 63.1 && r.box[2] < 63.7 && r.box[1] > -19.95 && r.box[3] < -19.55);
  const shape = (list, tolerance, least) => list.filter((r) => r.size > least).map((r) => simplify(r.ring, tolerance).map(([x, y]) => [round5(x), round5(y)]));
  const geo = {
    mauritius: { coast: shape(west, 0.0009, 0.000004), box: west.length ? west[0].box.map(round5) : null },
    rodrigues: { coast: shape(east, 0.0009, 0.000004), box: east.length ? east[0].box.map(round5) : null },
  };

  // Boundaries: districts (level 4, and the outer islands at level 3) and council areas (level 8).
  const outline = (b) =>
    joinRings(b.ways.map((id) => wayRefs.get(id)).filter(Boolean))
      .map(line)
      // A boundary with a gap (a stretch of it lies outside the extract) is closed across the gap.
      .map((ring) => (ring.length > 3 && (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) ? [...ring, ring[0]] : ring))
      .filter((ring) => ring.length > 8);
  const districts = [];
  const councils = [];
  for (const b of boundaries) {
    const shapes = outline(b);
    if (!shapes.length) continue;
    const entry = { name: b.level === 8 ? localityName(b.name) : tidy(b.name).replace(/^Riviere du Rempart$/, "Rivière du Rempart"), rings: shapes, boxes: shapes.map(bounds) };
    if (b.level === 8) councils.push(entry);
    else if (!/Agal|Brandon/i.test(b.name)) districts.push(entry);
  }
  const within = (point, entry) => entry.rings.some((ring, i) => point[0] >= entry.boxes[i][0] && point[0] <= entry.boxes[i][2] && point[1] >= entry.boxes[i][1] && point[1] <= entry.boxes[i][3] && inside(point, ring));

  // The named places of the map, for a listing's nearer label ("Ebène") and as a fallback for its town.
  const named = placeNodes.filter((p) => ["city", "town", "village", "suburb", "hamlet", "neighbourhood", "quarter", "locality"].includes(p.kind));
  const towns = named.filter((p) => ["city", "town", "village"].includes(p.kind));
  const nearest = (point, list, limit) => {
    let best = null;
    let bestD = limit;
    for (const p of list) {
      if (Math.abs(p.lon - point[0]) > 0.08 || Math.abs(p.lat - point[1]) > 0.08) continue;
      const d = metres(point, [p.lon, p.lat]);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return best;
  };

  /** Where a point is: its region, its district, its town or village, and the nearer named place. */
  const locate = (point) => {
    const district = districts.find((d) => within(point, d));
    const council = councils.find((c) => within(point, c));
    // The capital has no council area on the map: its district is the city.
    const place = council?.name ?? (district?.name === "Port Louis" ? "Port Louis" : nearest(point, towns, 6000)?.name);
    const near = nearest(point, named, 1500);
    return {
      region: point[0] > 60 ? "rodrigues" : point[1] > -19.9 || point[0] < 57 ? "outer" : "mauritius",
      district: district?.name,
      place,
      area: near && near.name !== place ? near.name : undefined,
    };
  };

  const listings = [];
  for (const poi of pois) {
    let point = null;
    if (poi.type === "node") point = [poi.lon, poi.lat];
    else if (poi.type === "way") point = centre(line(poi.refs));
    else point = centre(poi.ways.flatMap((id) => line(wayRefs.get(id) ?? [])));
    if (!point) continue;
    const entry = listing(poi.type, poi.id, poi.tags, point[0], point[1], poi.stamp);
    if (!entry) continue;

    Object.assign(entry, locate(point));
    listings.push(entry);
  }

  // The same place drawn twice (once as a point, once as a building) is listed once: the fuller one stays.
  const weight = (l) => l.phone.length * 2 + (l.web ? 2 : 0) + (l.hours ? 1 : 0) + (l.street ? 1 : 0) + (l.src.osm.startsWith("way") ? 0.5 : 0);
  const seen = new Map();
  for (const l of listings) {
    const key = `${slugify(l.name)}|${l.cat}|${Math.round(l.lat * 1500)}|${Math.round(l.lon * 1500)}`;
    const other = seen.get(key);
    if (!other || weight(l) > weight(other)) seen.set(key, l);
  }
  const unique = [...seen.values()];

  const districtShapes = districts.map((d) => ({ name: d.name, slug: slugify(d.name), rings: d.rings.map((ring) => simplify(ring, 0.0016).map(([x, y]) => [round5(x), round5(y)])).filter((ring) => ring.length > 5) }));
  const townPoints = placeNodes
    .filter((p) => ["city", "town"].includes(p.kind) || (p.kind === "village" && p.population >= 8000))
    .map((p) => ({ name: p.name, kind: p.kind, lon: round5(p.lon), lat: round5(p.lat), population: p.population || undefined }));

  return {
    stamp,
    from: got.from,
    counts: { nodes: coords.size, ways: wayRefs.size, candidates: pois.length, listed: unique.length, dropped: listings.length - unique.length },
    listings: unique,
    locate,
    geo: { ...geo, districts: districtShapes, towns: townPoints },
    named: named.map((p) => ({ name: p.name, kind: p.kind, lon: round5(p.lon), lat: round5(p.lat) })),
  };
}
