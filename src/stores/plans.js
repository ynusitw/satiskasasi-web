import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'satiskasasi_plans_v1'

const DEFAULT_PLANS = [
  {
    id:          'basic',
    name:        'Basic',
    price:       299,
    description: 'Küçük işletmeler için temel POS özellikleri',
    features:    ['Ürün ve Kategori Yönetimi', 'Satış ve Ödeme Alma', 'Günlük Ciro Raporu', '1 Kullanıcı'],
    color:       'blue',
    isActive:    true,
  },
  {
    id:          'pro',
    name:        'Pro',
    price:       599,
    description: 'Büyüyen işletmeler için gelişmiş özellikler',
    features:    ['Basic\'in tüm özellikleri', 'Cari Modülü', 'Detaylı Raporlar', 'Sınırsız Kullanıcı', 'Öncelikli Destek'],
    color:       'purple',
    isActive:    true,
  },
]

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export const usePlansStore = defineStore('plans', () => {
  const plans = ref(load() ?? DEFAULT_PLANS)

  watch(plans, v => localStorage.setItem(STORAGE_KEY, JSON.stringify(v)), { deep: true })

  function priceOf(planId) {
    return plans.value.find(p => p.id === planId)?.price ?? 0
  }

  function ekle(plan) {
    plans.value.push({ ...plan, id: plan.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now() })
  }

  function guncelle(updated) {
    const idx = plans.value.findIndex(p => p.id === updated.id)
    if (idx !== -1) plans.value[idx] = { ...updated }
  }

  function sil(id) {
    plans.value = plans.value.filter(p => p.id !== id)
  }

  return { plans, priceOf, ekle, guncelle, sil }
})
