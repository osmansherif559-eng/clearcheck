// Bump this version when changing the shell or caching policy.
const VERSION = "v3";
const CACHE_PREFIX = "clearcheck-shell-";
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}`;
const SAFE_ROUTES = ["/", "/check", "/recover", "/learn", "/privacy", "/about"];
const PUBLIC_FILES = [
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/apple-touch-icon.png",
];
const READY_KEY = "/__clearcheck_offline_shell__";
const STATUS_MESSAGE = "CLEARCHECK_OFFLINE_STATUS";

function isStaticAsset(url) {
  return url.origin === self.location.origin && !url.search &&
    /^\/_next\/static\/[a-zA-Z0-9_./-]+\.(?:js|css|woff2?|ttf|otf)$/.test(url.pathname) &&
    !url.pathname.split("/").includes("..");
}

function isLocalOcrAsset(url) {
  return url.origin === self.location.origin && !url.search &&
    /^\/ocr\/tesseract\/[a-zA-Z0-9_./-]+\.(?:js|wasm|gz)$/.test(url.pathname) &&
    !url.pathname.split("/").includes("..");
}

function isPublicResponse(response, url) {
  const control = response.headers.get("cache-control") || "";
  return response.ok && !response.redirected &&
    (!response.url || response.url === url.href) &&
    !/\b(?:private|no-store|no-cache)\b/i.test(control) &&
    response.headers.get("vary") !== "*";
}

function isImmutableResponse(response, url) {
  return isPublicResponse(response, url) &&
    /\bimmutable\b/i.test(response.headers.get("cache-control") || "");
}

// Service workers have no DOMParser. Skip inline script bodies so RSC payloads
// cannot be mistaken for actual document resource tags.
function shellResources(html) {
  const resources = new Set();
  const tags = /<script\b([^>]*)>[\s\S]*?<\/script\s*>|<link\b([^>]*)>/gi;
  for (const tag of html.matchAll(tags)) {
    const attrs = new Map();
    const attributes = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
    for (const attr of (tag[1] ?? tag[2]).matchAll(attributes)) {
      attrs.set(attr[1].toLowerCase(), attr[2] ?? attr[3] ?? attr[4] ?? "");
    }
    const rel = (attrs.get("rel") || "").toLowerCase().split(/\s+/);
    const requiredLink = rel.includes("stylesheet") || rel.includes("modulepreload") ||
      (rel.includes("preload") && ["script", "style", "font"].includes(attrs.get("as")));
    const source = tag[1] !== undefined ? attrs.get("src") : requiredLink && attrs.get("href");
    if (!source) continue;
    const url = new URL(source.replace(/&amp;/g, "&"), self.location.origin);
    // Fail installation rather than silently claim readiness with missing code.
    // Never request an external URL, even if a future shell references one.
    if (!isStaticAsset(url)) throw new Error("Shell resource is not a local immutable asset");
    resources.add(url.href);
  }
  return resources;
}

async function fetchPublic(path, html = false) {
  const url = new URL(path, self.location.origin);
  const response = await fetch(new Request(url.href, {
    credentials: "omit",
    cache: "no-store",
    redirect: "error",
    headers: html ? { Accept: "text/html" } : {},
  }));
  if (!isPublicResponse(response, url) ||
      (html && !/^text\/html\b/i.test(response.headers.get("content-type") || ""))) {
    throw new Error("Public shell response cannot be cached");
  }
  return response;
}

async function precache() {
  const cache = await caches.open(CACHE_NAME);
  // The marker is written last: a partial/failed install is never reported ready.
  await cache.delete(READY_KEY);
  const assets = new Set();
  for (const path of SAFE_ROUTES) {
    const response = await fetchPublic(path, true);
    for (const asset of shellResources(await response.clone().text())) assets.add(asset);
    await cache.put(path, response);
  }
  if (![...assets].some((asset) => asset.endsWith(".js")) ||
      ![...assets].some((asset) => asset.endsWith(".css"))) {
    throw new Error("Shell CSS and JavaScript were not found");
  }
  for (const path of PUBLIC_FILES) await cache.put(path, await fetchPublic(path));
  for (const asset of assets) {
    const response = await fetchPublic(asset);
    if (!isImmutableResponse(response, new URL(asset))) throw new Error("Shell asset is not immutable");
    await cache.put(asset, response);
  }
  await cache.put(READY_KEY, new Response(JSON.stringify({
    version: VERSION,
    resources: [...SAFE_ROUTES, ...PUBLIC_FILES, ...assets],
  }), { headers: { "Content-Type": "application/json" } }));
  await self.skipWaiting();
}

async function offlineReady() {
  const cache = await caches.open(CACHE_NAME);
  const marker = await cache.match(READY_KEY);
  if (!marker) return false;
  try {
    const { version, resources } = await marker.json();
    return version === VERSION && Array.isArray(resources) &&
      [...SAFE_ROUTES, ...PUBLIC_FILES].every((path) => resources.includes(path)) &&
      resources.some((path) => path.endsWith(".js")) && resources.some((path) => path.endsWith(".css")) &&
      (await Promise.all(resources.map((path) => cache.match(path)))).every(Boolean);
  } catch {
    return false;
  }
}

self.addEventListener("install", (event) => event.waitUntil(precache()));

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    if (!await offlineReady()) throw new Error("Offline shell is incomplete");
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== STATUS_MESSAGE || !event.ports[0]) return;
  event.waitUntil(offlineReady().then((ready) => {
    event.ports[0].postMessage({ type: STATUS_MESSAGE, version: VERSION, ready, routes: SAFE_ROUTES });
  }).catch(() => event.ports[0].postMessage({ type: STATUS_MESSAGE, version: VERSION, ready: false })));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  // Query strings include Next's RSC requests and may contain user content.
  // Leave these, private routes, non-GETs and cross-origin traffic to the network.
  if (request.method !== "GET" || url.origin !== self.location.origin || url.search ||
      request.headers.has("authorization") || request.headers.has("range") ||
      ["rsc", "next-router-state-tree", "next-router-prefetch", "next-url"].some((name) => request.headers.has(name)) ||
      /text\/x-component/i.test(request.headers.get("accept") || "")) return;

  if (request.mode === "navigate" && SAFE_ROUTES.includes(url.pathname)) {
    // Never store runtime documents: they may depend on cookies or authentication.
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return await cache.match(url.pathname) || await cache.match("/offline.html") ||
        new Response("ClearCheck is unavailable offline. Reconnect and try again.", { status: 503 });
    }));
  } else if (isStaticAsset(url) || isLocalOcrAsset(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(url.href);
      if (cached) return cached;
      const response = await fetch(request);
      if (isImmutableResponse(response, url)) {
        event.waitUntil(cache.put(url.href, response.clone()));
      }
      return response;
    })());
  }
});
