// biznes.mu, the service worker: what lets the site open with no connection once it has been
// visited. Written by hand, with no library. src/components/Pwa.tsx registers it, in production only.
//
// What it answers, and how:
//   a page                      the network first; with no network, the kept copy of that page;
//                               with no copy, the page at /offline
//   the build's own files, the pictures behind the page, the icons and the typeface
//                               the kept copy first: none of them changes under the same address
//   any other file of the site  the kept copy at once, and a fresh one fetched for the next time
//   everything else             nothing: it goes to the network as if this file were not here
//
// Raise VERSION when this file changes what it keeps, or when a file under /themes/ or /icons/ is
// replaced under the same name. The caches of the older version are then deleted.
const VERSION = "v2";
const PREFIX = "biznes-";
const SHELL = `${PREFIX}shell-${VERSION}`; // kept from the start: the offline page and the icons
const ASSETS = `${PREFIX}assets-${VERSION}`; // files that never change under the same address
const PAGES = `${PREFIX}pages-${VERSION}`; // pages that have been opened
const OTHER = `${PREFIX}other-${VERSION}`; // any other file that has been read
const CAP = { [ASSETS]: 120, [PAGES]: 40, [OTHER]: 60 }; // the most each may hold; the shell has no cap

const OFFLINE = "/offline";
const START = "/";
const PRECACHE = [OFFLINE, "/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-maskable-192.png", "/icons/icon-maskable-512.png"];

// Never kept and never answered from here: the endpoints, and anything behind a sign-in.
const PRIVATE = ["/api", "/account", "/admin", "/dashboard", "/auth"];
const isPrivate = (path) => PRIVATE.some((root) => path === root || path.startsWith(`${root}/`));
const isAsset = (path) => path.startsWith("/_next/static/") || path.startsWith("/themes/") || path.startsWith("/icons/") || /\.(woff2?|ttf|otf)$/.test(path);

// A page and its data never share an address, so a kept copy is matched by its address alone.
const BY_ADDRESS = { ignoreVary: true };

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

async function precache() {
  const shell = await caches.open(SHELL);
  // Asked for afresh, so a new version never keeps an old copy out of the browser's own cache.
  await shell.addAll(PRECACHE.map((path) => new Request(path, { cache: "reload" })));
  // The offline page is bare without its style sheet, its scripts and its typeface: keep the files
  // its own markup names. One that fails is no reason to stop.
  const page = await shell.match(OFFLINE, BY_ADDRESS);
  const files = new Set((page ? await page.text() : "").match(/\/_next\/static\/[^"'\\\s<>)]+/g));
  await Promise.all([...files].map((path) => shell.add(path).catch(() => {})));
  // The page the installed app opens on, so it opens with no connection from the first day. It
  // goes with the pages, where every later visit replaces it.
  await caches
    .open(PAGES)
    .then((pages) => pages.add(new Request(START, { cache: "reload" })))
    .catch(() => {});
}

self.addEventListener("activate", (event) => {
  const kept = [SHELL, ASSETS, PAGES, OTHER];
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name.startsWith(PREFIX) && !kept.includes(name)).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  // Only a plain read of this site is handled. Anything else is left alone: another site, a form
  // being sent, a private address, a signed request, or a request for part of a file.
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.headers.has("Authorization") || request.headers.has("Range") || isPrivate(url.pathname)) return;
  // Next's own request for a page's data, made when a link is followed inside the app. A kept copy
  // could show an old page as if it were new, so it goes to the network. With no network Next
  // loads the whole page instead, and that is answered below.
  if (request.headers.has("RSC") || url.searchParams.has("_rsc")) return;

  if (request.mode === "navigate") event.respondWith(page(event));
  else if (isAsset(url.pathname)) event.respondWith(asset(event));
  else event.respondWith(other(event));
});

/** A page: the network first, and a copy kept for the day there is none. */
async function page(event) {
  try {
    // The page is asked for afresh, past the browser's own store. A worker's request is not a
    // visit in the browser's eyes, so without this the browser may hand back the copy it kept
    // while it fetches a new one, and a page that has just changed would be shown as it was.
    const response = await fetch(event.request, { cache: "no-cache" });
    // A redirect comes back sealed, and the server can give its address twice on a page's first
    // making, which a browser forgives and a worker's sealed copy does not. So the worker asks
    // where the address leads and sends the browser there itself.
    if (response.type === "opaqueredirect") {
      try {
        const led = await fetch(event.request.url, { redirect: "follow", credentials: "same-origin", headers: { Accept: "text/html" } });
        if (led.redirected && new URL(led.url).origin === self.location.origin) return Response.redirect(led.url, 302);
      } catch {
        // No better answer: the sealed redirect stands.
      }
      return response;
    }
    // A download answers a navigation too, and is not a page to keep.
    if (response.ok && (response.headers.get("Content-Type") || "").includes("text/html")) keep(event, PAGES, response);
    return response;
  } catch {
    return (await caches.match(event.request, BY_ADDRESS)) || (await caches.match(OFFLINE, BY_ADDRESS)) || Response.error();
  }
}

/** A file that never changes under its address: the kept copy, or the network once. */
async function asset(event) {
  const cached = await caches.match(event.request, BY_ADDRESS);
  if (cached) return cached;
  const response = await fetch(event.request);
  if (response.ok) keep(event, ASSETS, response);
  return response;
}

/** Any other file: the kept copy at once, and a fresh one fetched for the next time. */
async function other(event) {
  const cached = await caches.match(event.request, BY_ADDRESS);
  const fresh = fetch(event.request).then((response) => {
    if (response.ok) keep(event, OTHER, response);
    return response;
  });
  if (!cached) return fresh;
  event.waitUntil(fresh.catch(() => {}));
  return cached;
}

/** Keep a copy of an answer, then drop the oldest copies over the cache's cap. */
function keep(event, name, response) {
  const copy = response.clone();
  event.waitUntil(
    caches
      .open(name)
      .then(async (cache) => {
        await cache.put(event.request, copy);
        const keys = await cache.keys();
        await Promise.all(keys.slice(0, Math.max(0, keys.length - CAP[name])).map((key) => cache.delete(key)));
      })
      .catch(() => {}),
  );
}
