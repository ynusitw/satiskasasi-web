<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-primary">Dashboard</h1>
        <p class="text-muted text-sm mt-1">{{ today }}</p>
      </div>
      <button @click="load" class="px-4 py-2 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors">↻ Yenile</button>
    </div>
    <div v-if="loading" class="flex justify-center py-20 text-4xl">⏳</div>
    <template v-else-if="data">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Bugün Nakit" :value="fmt(data.todayCash)" icon="💵" color="bg-green-50 text-green-600"/>
        <StatCard label="Bugün Kart" :value="fmt(data.todayCard)" icon="💳" color="bg-blue-50 text-blue-600"/>
        <StatCard label="Bugün Toplam" :value="fmt(data.todayTotal)" icon="💰" color="bg-purple-50 text-purple-600" :sub="`${data.todaySaleCount} işlem`"/>
        <StatCard label="Kritik Stok" :value="data.lowStockCount" icon="⚠️" color="bg-red-50 text-red-600" sub="ürün kritik"/>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-2xl p-6 shadow-sm">
          <h2 class="font-bold text-primary mb-4">Bu Ay</h2>
          <div class="space-y-3">
            <div class="flex justify-between py-2 border-b border-gray-100">
              <span class="text-sm text-muted">Toplam Satış</span>
              <span class="font-bold">{{ fmt(data.monthTotal) }}</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-sm text-muted">İşlem Sayısı</span>
              <span class="font-bold">{{ data.monthSaleCount }}</span>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow-sm">
          <h2 class="font-bold text-primary mb-4">Bu Ay En Çok Satılan</h2>
          <div class="space-y-3">
            <div v-for="(p, i) in data.topProducts" :key="p.name" class="flex items-center gap-3">
              <div class="w-7 h-7 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center">{{ i+1 }}</div>
              <div class="flex-1">
                <div class="text-sm font-semibold">{{ p.name }}</div>
                <div class="text-xs text-muted">{{ p.totalQty }} adet</div>
              </div>
              <div class="font-bold text-success text-sm">{{ fmt(p.totalRevenue) }}</div>
            </div>
            <div v-if="!data.topProducts?.length" class="text-muted text-sm text-center py-4">Henüz satış yok</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import api from '../api/api'
import StatCard from '../components/StatCard.vue'
const data = ref(null); const loading = ref(true)
const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
function fmt(v) { return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(v ?? 0) + ' ₺' }
async function load() { loading.value = true; try { data.value = (await api.dashboard()).data } finally { loading.value = false } }
onMounted(load)
</script>
