import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'satiskasasi_masalar_v1'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export const useMasalarStore = defineStore('masalar', () => {
  const saved  = load()

  const aktif  = ref(saved?.aktif  ?? false)
  const masalar = ref(saved?.masalar ?? [])

  watch([aktif, masalar], () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      aktif:   aktif.value,
      masalar: masalar.value,
    }))
  }, { deep: true })

  function ekle(ad) {
    masalar.value.push({ id: Date.now(), ad: ad.trim() })
  }

  function guncelle(id, yeniAd) {
    const m = masalar.value.find(m => m.id === id)
    if (m) m.ad = yeniAd.trim()
  }

  function sil(id) {
    masalar.value = masalar.value.filter(m => m.id !== id)
  }

  return { aktif, masalar, ekle, guncelle, sil }
})
