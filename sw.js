const PREFIX = 'gmat-buddy-';
const META = 'gmat-meta';

async function precache() {
  const res = await fetch('./precache.json', { cache: 'no-store' });
  const { version, files } = await res.json();
  const name = PREFIX + version;
  const cache = await caches.open(name);
  await Promise.all(files.map(async (url) => {
    try {
      const r = await fetch(url, { cache: 'no-store' });
      if (r.ok) await cache.put(url, r);
    } catch (e) { /* offline or missing file: skip */ }
  }));
  await (await caches.open(META)).put('current', new Response(name));
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const current = await currentCacheName();
    await Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== current).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

async function currentCacheName() {
  const meta = await caches.open(META);
  const res = await meta.match('current');
  if (res) return res.text();
  const keys = (await caches.keys()).filter((k) => k.startsWith(PREFIX));
  return keys[keys.length - 1] || PREFIX + 'fallback';
}

async function staleWhileRevalidate(request) {
  const name = await currentCacheName();
  const cache = await caches.open(name);
  const cached = await cache.match(request);
  const refresh = fetch(request).then((res) => {
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  });
  if (cached) {
    refresh.catch(() => {});
    return cached;
  }
  return refresh;
}

// Network first for page loads (so updates show up right away); offline falls back to the cached app shell.
async function navigation(request) {
  try {
    const res = await fetch(request);
    if (res.ok) return res;
    throw new Error(String(res.status));
  } catch {
    const name = await currentCacheName();
    const cache = await caches.open(name);
    return (await cache.match(request, { ignoreSearch: true })) || (await cache.match('./index.html')) || Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(request.mode === 'navigate' ? navigation(request) : staleWhileRevalidate(request));
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
