import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'satiskasasi_masalar_v2'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export const useMasalarStore = defineStore('masalar', () => {
  const saved = load()

  const aktif   = ref(saved?.aktif   ?? false)
  // bolumler: [{ id, ad, masalar: [{ id, ad }] }]
  const bolumler = ref(saved?.bolumler ?? [])

  watch([aktif, bolumler], () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      aktif:    aktif.value,
      bolumler: bolumler.value,
    }))
  }, { deep: true })

  // ── Bölüm işlemleri ────────────────────────────────────────────────────
  function bolumEkle(ad) {
    bolumler.value.push({ id: Date.now(), ad: ad.trim(), masalar: [] })
  }

  function bolumGuncelle(id, yeniAd) {
    const b = bolumler.value.find(b => b.id === id)
    if (b) b.ad = yeniAd.trim()
  }

  function bolumSil(id) {
    bolumler.value = bolumler.value.filter(b => b.id !== id)
  }

  // ── Masa işlemleri ─────────────────────────────────────────────────────
  function masaEkle(bolumId, ad) {
    const b = bolumler.value.find(b => b.id === bolumId)
    if (b) b.masalar.push({ id: Date.now(), ad: ad.trim() })
  }

  function topluMasaEkle(bolumId, adlar) {
    const b = bolumler.value.find(b => b.id === bolumId)
    if (!b) return
    adlar.forEach((ad, i) => {
      b.masalar.push({ id: Date.now() + i, ad: ad.trim() })
    })
  }

  function masaGuncelle(bolumId, masaId, yeniAd) {
    const b = bolumler.value.find(b => b.id === bolumId)
    if (!b) return
    const m = b.masalar.find(m => m.id === masaId)
    if (m) m.ad = yeniAd.trim()
  }

  function masaSil(bolumId, masaId) {
    const b = bolumler.value.find(b => b.id === bolumId)
    if (b) b.masalar = b.masalar.filter(m => m.id !== masaId)
  }

  const toplamMasa = () => bolumler.value.reduce((s, b) => s + b.masalar.length, 0)

  return {
    aktif, bolumler,
    bolumEkle, bolumGuncelle, bolumSil,
    masaEkle, topluMasaEkle, masaGuncelle, masaSil,
    toplamMasa,
  }
})
