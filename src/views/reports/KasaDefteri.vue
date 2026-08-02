<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-primary">Kasa Defteri</h1>
        <p class="text-muted text-sm mt-1">Anlık kasa durumu</p>
      </div>
      <button @click="load" class="px-4 py-2 bg-accent text-white rounded-xl text-sm font-bold hover:bg-blue-600">
        ↻ Yenile
      </button>
    </div>

    <div v-if="loading" class="text-center py-16 text-muted">Yükleniyor...</div>
    <div v-else-if="report" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="bg-white rounded-2xl shadow-sm p-6 text-center">
        <div class="text-4xl mb-3">💵</div>
        <div class="text-xs text-muted mb-1">Nakit Toplam</div>
        <div class="text-3xl font-bold text-success">{{ fmt(report.totalCash) }}</div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm p-6 text-center">
        <div class="text-4xl mb-3">💳</div>
        <div class="text-xs text-muted mb-1">Kart Toplam</div>
        <div class="text-3xl font-bold text-accent">{{ fmt(report.totalCard) }}</div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm p-6 text-center">
        <div class="text-4xl mb-3">🏧</div>
        <div class="text-xs text-muted mb-1">Genel Toplam</div>
        <div class="text-3xl font-bold text-primary">{{ fmt(report.grandTotal) }}</div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm p-6 lg:col-span-3 flex gap-8 items-center justify-center">
        <div class="text-center">
          <div class="text-xs text-muted mb-1">İşlem Sayısı</div>
          <div class="text-2xl font-bold">{{ report.saleCount }}</div>
        </div>
        <div class="text-center">
          <div class="text-xs text-muted mb-1">Toplam İskonto</div>
          <div class="text-2xl font-bold text-danger">{{ fmt(report.totalDiscount) }}</div>
        </div>
        <div class="text-center">
          <div class="text-xs text-muted mb-1">Ortalama Fiş</div>
          <div class="text-2xl font-bold">
            {{ report.saleCount ? fmt(report.grandTotal / report.saleCount) : '—' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/api'

const report = ref(null)
const loading = ref(true)

function fmt(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}

async function load() {
  loading.value = true
  try { report.value = (await api.getXReport()).data }
  finally { loading.value = false }
}

onMounted(load)
</script>
