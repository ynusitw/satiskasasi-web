// Telefon / tarayıcı bildirimleri (Web Push): izin, abonelik, sunucuya kayıt.
import api from '../api/api'

export const pushSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

export const isIos = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/** Ana ekrana eklenmiş uygulama olarak mı açık (iPhone'da bildirim için şart). */
export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true

/** Listede cihazı tanımak için kısa ad: "Android · Chrome", "iPhone · Safari", "Windows · Edge". */
export function deviceName() {
  const ua = navigator.userAgent
  const os = /Android/.test(ua) ? 'Android'
    : /iPhone|iPod/.test(ua) ? 'iPhone'
    : /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ? 'iPad'
    : /Windows/.test(ua) ? 'Windows'
    : /Mac OS X/.test(ua) ? 'Mac'
    : /Linux/.test(ua) ? 'Linux' : 'Cihaz'
  const browser = /SamsungBrowser/.test(ua) ? 'Samsung Internet'
    : /Edg\//.test(ua) ? 'Edge'
    : /OPR\//.test(ua) ? 'Opera'
    : /Firefox\//.test(ua) ? 'Firefox'
    : /Chrome\//.test(ua) ? 'Chrome'
    : /Safari\//.test(ua) ? 'Safari' : 'Tarayıcı'
  return `${os} · ${browser}`
}

function keyBytes(base64url) {
  const pad = '='.repeat((4 - (base64url.length % 4)) % 4)
  const raw = atob((base64url + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

const sameKey = (buf, key) => {
  if (!buf) return false
  const a = new Uint8Array(buf), b = keyBytes(key)
  return a.length === b.length && a.every((x, i) => x === b[i])
}

/** Bu tarayıcının mevcut aboneliği (yoksa null). */
export async function currentSubscription() {
  if (!pushSupported()) return null
  const reg = await navigator.serviceWorker.getRegistration('/')
  return reg ? reg.pushManager.getSubscription() : null
}

/**
 * İzin ister, aboneliği oluşturur ve sunucuya kaydeder. İzin verilmezse
 * Error('denied' | 'dismissed') fırlatır.
 */
export async function enablePush(publicKey) {
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error(perm === 'denied' ? 'denied' : 'dismissed')
  const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  // Sunucunun anahtarı değiştiyse eski abonelik geçersizdir
  if (sub && !sameKey(sub.options?.applicationServerKey, publicKey)) { await sub.unsubscribe(); sub = null }
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) })
  const j = sub.toJSON()
  await api.pushSubscribe({ endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, deviceName: deviceName() })
  return j.endpoint
}

/** Bu cihazda bildirimleri kapatır (sunucudan da siler). */
export async function disablePush() {
  const sub = await currentSubscription()
  if (!sub) return
  try { await api.pushUnsubscribe({ endpoint: sub.endpoint }) } catch { /* sunucuda zaten yok */ }
  await sub.unsubscribe()
}
