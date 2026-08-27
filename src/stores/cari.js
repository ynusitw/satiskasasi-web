import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api/api'

export const useCariStore = defineStore('cari', () => {

  const cariler       = ref([])
  const faturalar     = ref([])   // in-memory (API transaction endpoint'i eklenince burası güncellenir)
  const kasaIslemleri = ref([])   // in-memory

  // ─── API yükle ────────────────────────────────────────────────────────────
  async function fetchCariler() {
    try {
      const res = await api.getCaris()
      cariler.value = res.data ?? []
    } catch (e) {
      console.error('[CariStore] fetchCariler hatası', e)
    }
  }

  // ─── Hareket hesaplama ────────────────────────────────────────────────────
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

  // ─── Cari CRUD — API + in-memory ─────────────────────────────────────────
  async function cariEkle(cari) {
    const res = await api.createCari(cari)
    cariler.value.push(res.data)
  }

  async function cariGuncelle(guncellenen) {
    await api.updateCari(guncellenen.id, guncellenen)
    const idx = cariler.value.findIndex(c => c.id === guncellenen.id)
    if (idx !== -1) cariler.value[idx] = { ...guncellenen }
  }

  async function cariSil(id) {
    await api.deleteCari(id)
    cariler.value       = cariler.value.filter(c => c.id !== id)
    faturalar.value     = faturalar.value.filter(f => f.cariId !== id)
    kasaIslemleri.value = kasaIslemleri.value.filter(k => k.cariId !== id)
  }

  // ─── Fatura / Kasa — in-memory (TODO: backend transaction endpoint'i) ────
  function faturaEkle(fatura) {
    faturalar.value.unshift({ ...fatura, id: Date.now() })
  }

  function kasaIslemEkle(islem) {
    kasaIslemleri.value.unshift({ ...islem, id: Date.now() })
  }

  return {
    cariler,
    faturalar,
    kasaIslemleri,
    carilerWithBakiye,
    sonKasaIslemleri,
    hareketlerByCari,
    bakiyeByCari,
    fetchCariler,
    faturaEkle,
    kasaIslemEkle,
    cariEkle,
    cariGuncelle,
    cariSil,
  }
})
