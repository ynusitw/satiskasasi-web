// YenPOS paneli — bildirim betiği (service worker).
// Yalnızca telefon / tarayıcı bildirimlerini (Web Push) gösterir ve dokununca
// paneli açar. Sayfaları önbelleğe ALMAZ: panel her zaman sunucudaki son sürümle açılır.

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = { body: event.data && event.data.text() } }
  const title = data.title || 'YenPOS'
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || '',
    icon: '/brand/app-180.png',
    badge: '/brand/favicon-32.png',
    tag: data.tag || undefined,          // aynı türden yeni bildirim eskisinin yerine geçer
    renotify: !!data.tag,
    data: { url: data.url || '/notifications' },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL((event.notification.data && event.notification.data.url) || '/notifications', self.location.origin).href
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const w of wins) {
      if (w.url.startsWith(self.location.origin)) {
        try { await w.navigate(url) } catch { /* farklı sayfa olabilir */ }
        return w.focus()
      }
    }
    return self.clients.openWindow(url)
  })())
})
