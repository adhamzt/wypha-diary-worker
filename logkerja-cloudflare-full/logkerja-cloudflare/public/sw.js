const VERSION = 'logkerja-__BUILD_VERSION__'
const STATIC_CACHE = `${VERSION}-static`
const RUNTIME_CACHE = `${VERSION}-runtime`
const APP_SHELL = ['/', '/add/', '/timeline/', '/insights/', '/analytics/', '/settings/', '/integrations/', '/help/', '/offline/', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE)
    let urls = APP_SHELL
    try {
      const manifest = await fetch('/precache-manifest.json', { cache: 'reload' })
      if (manifest.ok) {
        const data = await manifest.json()
        if (Array.isArray(data.urls) && data.urls.length) urls = data.urls
      }
    } catch { /* fallback to APP_SHELL */ }
    await Promise.allSettled(urls.map(async (url) => {
      const response = await fetch(url, { cache: 'reload' })
      if (response.ok) await cache.put(url, response)
    }))
    await self.skipWaiting()
  })())
})
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)))
    await self.clients.claim()
  })())
})
function openShareDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('workdiary-share', 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('pending')) db.createObjectStore('pending', { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
async function saveIncomingShare(request) {
  const form = await request.formData()
  const files = form.getAll('files').filter((value) => value instanceof File && value.size <= 15 * 1024 * 1024).slice(0, 4)
  const record = { id: crypto.randomUUID(), title: String(form.get('title') || ''), text: String(form.get('text') || ''), url: String(form.get('url') || ''), files, createdAt: new Date().toISOString() }
  const db = await openShareDb()
  await new Promise((resolve, reject) => {
    const tx = db.transaction('pending', 'readwrite')
    tx.objectStore('pending').put(record)
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    const existing = clients[0]
    if (existing) { existing.navigate('/add/'); return existing.focus() }
    return self.clients.openWindow('/add/')
  }))
})
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (url.origin === self.location.origin && url.pathname.replace(/\/$/, '') === '/share-target' && event.request.method === 'POST') {
    event.respondWith((async () => {
      try { await saveIncomingShare(event.request); return Response.redirect('/add/?shared=1', 303) }
      catch (error) { console.error(error); return Response.redirect('/add/', 303) }
    })())
    return
  }
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request)
        const cache = await caches.open(RUNTIME_CACHE)
        if (response.ok) cache.put(event.request, response.clone())
        return response
      } catch { return (await caches.match(event.request)) || (await caches.match('/offline/')) }
    })())
    return
  }
  // Static-export client navigation may request RSC payloads and route files in
  // addition to JS/CSS/images. Cache-first all remaining same-origin GETs.
  event.respondWith((async () => {
    const cached = await caches.match(event.request)
    if (cached) return cached
    try {
      const response = await fetch(event.request)
      if (response.ok) { const cache = await caches.open(RUNTIME_CACHE); cache.put(event.request, response.clone()) }
      return response
    } catch {
      return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    }
  })())
})
