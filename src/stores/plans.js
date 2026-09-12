import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api/api'

export const usePlansStore = defineStore('plans', () => {
  const plans  = ref([])
  const loaded = ref(false)

  async function load() {
    const res = await api.getPlans()
    plans.value = res.data
    loaded.value = true
  }

  function priceOf(planId) {
    return plans.value.find(p => p.id === planId)?.price ?? 0
  }

  async function ekle(plan) {
    const res = await api.createPlan(plan)
    plans.value.push(res.data)
  }

  async function guncelle(updated) {
    const res = await api.updatePlan(updated.dbId, updated)
    const idx = plans.value.findIndex(p => p.dbId === updated.dbId)
    if (idx !== -1) plans.value[idx] = res.data
  }

  async function sil(dbId) {
    await api.deletePlan(dbId)
    plans.value = plans.value.filter(p => p.dbId !== dbId)
  }

  return { plans, loaded, load, priceOf, ekle, guncelle, sil }
})
