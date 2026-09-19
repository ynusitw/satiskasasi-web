import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api/api'

// Müşterinin lisansındaki aktif modüller.
//
// Bu depo yalnızca ARAYÜZ içindir: menüyü sadeleştirir, yetkisiz sayfaya
// girişi engeller. Asıl yetkilendirme sunucuda ([RequireModule]); buradaki
// liste kurcalansa bile API modülü olmayan isteği reddeder.
//
// localStorage'a da yazılır: sayfa yenilenince menü bir anlığına boş
// görünmesin. Ardından sunucudan tazelenir — yönetici bir modülü
// kapattıysa yeniden giriş beklenmeden yansır.
const STORAGE_KEY = 'modules'

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const list = raw ? JSON.parse(raw) : null
    return Array.isArray(list) ? list : null
  } catch {
    return null
  }
}

export const useModulesStore = defineStore('modules', () => {
  const stored = readStored()
  const codes  = ref(stored ?? [])
  // Sunucu bize hiç modül listesi verdi mi?
  //
  // Vermediyse KISITLAMIYORUZ. Bu, panel API'den önce yayına alındığında
  // (giriş yanıtında "modules" alanı yokken) tüm müşterilerin QR/Masa/Cari
  // menülerinin bir anda kaybolmasını önler. Güvenlik açığı değildir:
  // gizleme yalnızca arayüz içindir, asıl kilit sunucuda.
  const known  = ref(stored !== null)
  // Sunucudan en az bir kez teyit edildi mi? Router guard ilk girişte bunu bekler.
  const loaded = ref(false)
  let inflight = null

  function set(list) {
    loaded.value = true
    if (!Array.isArray(list)) return   // eski API: liste yok → kısıtlama yok
    codes.value = [...list]
    known.value = true
    localStorage.setItem(STORAGE_KEY, JSON.stringify(codes.value))
  }

  function has(code) {
    return !known.value || codes.value.includes(code)
  }

  // Sunucudan tazele. Aynı anda birden çok çağrı tek istekte birleşir.
  function load() {
    if (inflight) return inflight
    inflight = api.getMyModules()
      .then(res => set(res.data))
      .catch(() => {
        // Ağ hatası: son bilinen listeyle devam et, kullanıcıyı kilitleme.
        loaded.value = true
      })
      .finally(() => { inflight = null })
    return inflight
  }

  // İlk gezinmeden önce çağrılır. Daha önce yüklendiyse beklemez.
  async function ensureLoaded() {
    if (!loaded.value) await load()
  }

  function clear() {
    codes.value  = []
    known.value  = false
    loaded.value = false
    localStorage.removeItem(STORAGE_KEY)
  }

  return { codes, known, loaded, has, set, load, ensureLoaded, clear }
})
