import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'satiskasasi_cari_v1'

const MOCK_CARILER    = []
const MOCK_FATURALAR  = []
const MOCK_KASA       = []

// ─── localStorage yardımcıları ───────────────────────────────────────────────
function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn('[CariStore] localStorage okunamadı, mock veri kullanılıyor:', e)
  }
  return null
}

function saveStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('[CariStore] localStorage yazılamadı:', e)
  }
}

// ─── Store ───────────────────────────────────────────────────────────────────
export const useCariStore = defineStore('cari', () => {

  // Kaydedilmiş veriyi oku; yoksa mock ile başla
  const saved = loadStorage()

  const cariler       = ref(saved?.cariler       ?? MOCK_CARILER)
  const faturalar     = ref(saved?.faturalar     ?? MOCK_FATURALAR)
  const kasaIslemleri = ref(saved?.kasaIslemleri ?? MOCK_KASA)

  // Her değişiklikte localStorage'a yaz
  watch(
    [cariler, faturalar, kasaIslemleri],
    () => saveStorage({
      cariler:       cariler.value,
      faturalar:     faturalar.value,
      kasaIslemleri: kasaIslemleri.value,
    }),
    { deep: true }
  )

  // ─── Cari hareket hesaplama ────────────────────────────────────────────────
  function hareketlerByCari(cariId) {
    const events = []

    faturalar.value
      .filter(f => f.cariId === cariId)
      .forEach(f => events.push({
        id:       `f-${f.id}`,
        tarih:    f.tarih,
        belgeNo:  f.no,
        tip:      f.tip === 'Satış' ? 'Satış Faturası' : 'Alış Faturası',
        aciklama: f.aciklama,
        borc:     f.genelToplam,
        alacak:   0,
      }))

    kasaIslemleri.value
      .filter(k => k.cariId === cariId)
      .forEach(k => events.push({
        id:       `k-${k.id}`,
        tarih:    k.tarih,
        belgeNo:  k.makbuzNo,
        tip:      k.tip,
        aciklama: k.aciklama,
        borc:     0,
        alacak:   k.tutar,
      }))

    events.sort((a, b) => a.tarih.localeCompare(b.tarih))

    let running = 0
    events.forEach(e => {
      running = running + e.borc - e.alacak
      e.kalanBakiye = running
    })

    return events
  }

  function bakiyeByCari(cariId) {
    const h = hareketlerByCari(cariId)
    return h.length ? h[h.length - 1].kalanBakiye : 0
  }

  function sonIslemByCari(cariId) {
    const h = hareketlerByCari(cariId)
    return h.length ? h[h.length - 1] : null
  }

  const carilerWithBakiye = computed(() =>
    cariler.value.map(c => ({
      ...c,
      bakiye:   bakiyeByCari(c.id),
      sonIslem: sonIslemByCari(c.id),
    }))
  )

  const sonKasaIslemleri = computed(() =>
    [...kasaIslemleri.value].sort((a, b) => b.tarih.localeCompare(a.tarih))
  )

  // ─── Mutasyonlar ──────────────────────────────────────────────────────────
  function faturaEkle(fatura) {
    faturalar.value.unshift({ ...fatura, id: Date.now() })
  }

  function kasaIslemEkle(islem) {
    kasaIslemleri.value.unshift({ ...islem, id: Date.now() })
  }

  function cariEkle(cari) {
    cariler.value.push({ ...cari, id: Date.now() })
  }

  function cariGuncelle(guncellenen) {
    const idx = cariler.value.findIndex(c => c.id === guncellenen.id)
    if (idx !== -1) cariler.value[idx] = { ...guncellenen }
  }

  function cariSil(id) {
    cariler.value       = cariler.value.filter(c => c.id !== id)
    faturalar.value     = faturalar.value.filter(f => f.cariId !== id)
    kasaIslemleri.value = kasaIslemleri.value.filter(k => k.cariId !== id)
  }

  // Tüm veriyi sıfırla (mock'a dön)
  function resetToMock() {
    cariler.value       = MOCK_CARILER
    faturalar.value     = MOCK_FATURALAR
    kasaIslemleri.value = MOCK_KASA
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    cariler,
    faturalar,
    kasaIslemleri,
    carilerWithBakiye,
    sonKasaIslemleri,
    hareketlerByCari,
    bakiyeByCari,
    faturaEkle,
    kasaIslemEkle,
    cariEkle,
    cariGuncelle,
    cariSil,
    resetToMock,
  }
})
