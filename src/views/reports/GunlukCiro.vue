<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-primary">Günlük Ciro</h1>
        <p class="text-muted text-sm mt-1">{{ selectedDate }} tarihine ait satış özeti</p>
      </div>
      <input v-model="selectedDate" type="date"
             class="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-accent focus:outline-none"/>
    </div>

    <div v-if="loading" class="text-center py-16 text-muted">Yükleniyor...</div>
    <div v-else-if="report">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-2xl shadow-sm p-5">
          <div class="text-xs text-muted mb-1">Toplam Satış</div>
          <div class="text-2xl font-bold text-primary">{{ fmt(report.grandTotal) }}</div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm p-5">
          <div class="text-xs text-muted mb-1">İşlem Sayısı</div>
          <div class="text-2xl font-bold text-primary">{{ report.saleCount }}</div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm p-5">
          <div class="text-xs text-muted mb-1">Nakit</div>
          <div class="text-2xl font-bold text-success">{{ fmt(report.totalCash) }}</div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm p-5">
          <div class="text-xs text-muted mb-1">Kart</div>
          <div class="text-2xl font-bold text-accent">{{ fmt(report.totalCard) }}</div>
        </div>
      </div>

      <div v-if="report.sales?.length" class="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 font-semibold text-sm">Satış Listesi</div>
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">#</th>
              <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Saat</th>
              <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Ödeme</th>
              <th class="text-right px-6 py-3 text-xs font-bold text-muted uppercase">Tutar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in report.sales" :key="s.id" class="border-t border-gray-50">
              <td class="px-6 py-3 text-sm text-muted">#{{ s.id }}</td>
              <td class="px-6 py-3 text-sm">{{ time(s.saleDate) }}</td>
              <td class="px-6 py-3 text-sm">{{ s.paymentMethod }}</td>
              <td class="px-6 py-3 text-sm font-semibold text-right">{{ fmt(s.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="bg-white rounded-2xl shadow-sm p-12 text-center text-muted">
        Bu tarihte satış kaydı bulunamadı.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import api from '../../api/api'

const today = new Date().toISOString().split('T')[0]
const selectedDate = ref(today)
const report = ref(null)
const loading = ref(false)

function fmt(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}
function time(d) {
  return new Date(d).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

async function load() {
  loading.value = true
  try { report.value = (await api.getDailyReport(selectedDate.value)).data }
  catch { report.value = null }
  finally { loading.value = false }
}

watch(selectedDate, load)
onMounted(load)
</script>
