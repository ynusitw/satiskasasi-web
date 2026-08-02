<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold text-primary mb-6">Z-Listesi</h1>

    <div v-if="loading" class="text-center py-16 text-muted">Yükleniyor...</div>
    <div v-else-if="!reports.length" class="bg-white rounded-2xl shadow-sm p-12 text-center text-muted">
      Henüz Z raporu bulunmuyor.
    </div>
    <div v-else class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Tarih</th>
            <th class="text-right px-6 py-3 text-xs font-bold text-muted uppercase">İşlem</th>
            <th class="text-right px-6 py-3 text-xs font-bold text-muted uppercase">Nakit</th>
            <th class="text-right px-6 py-3 text-xs font-bold text-muted uppercase">Kart</th>
            <th class="text-right px-6 py-3 text-xs font-bold text-muted uppercase">İskonto</th>
            <th class="text-right px-6 py-3 text-xs font-bold text-muted uppercase">Toplam</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="z in reports" :key="z.id" class="border-t border-gray-50 hover:bg-gray-50">
            <td class="px-6 py-4 text-sm font-semibold">{{ date(z.reportDate) }}</td>
            <td class="px-6 py-4 text-sm text-right text-muted">{{ z.saleCount }}</td>
            <td class="px-6 py-4 text-sm text-right text-success font-semibold">{{ fmt(z.totalCash) }}</td>
            <td class="px-6 py-4 text-sm text-right text-accent font-semibold">{{ fmt(z.totalCard) }}</td>
            <td class="px-6 py-4 text-sm text-right text-danger">{{ fmt(z.totalDiscount) }}</td>
            <td class="px-6 py-4 text-sm text-right font-bold text-primary">{{ fmt(z.grandTotal) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/api'

const reports = ref([])
const loading = ref(true)

function fmt(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}
function date(d) {
  return new Date(d).toLocaleDateString('tr-TR')
}

onMounted(async () => {
  try { reports.value = (await api.getZReports()).data }
  finally { loading.value = false }
})
</script>
