<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold text-primary mb-8">Raporlar</h1>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- X RAPORU -->
      <div class="bg-white rounded-2xl p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-bold text-primary">X-Raporu</h2>
          <button @click="loadXReport" :disabled="xLoading" class="px-4 py-2 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-blue-600 disabled:opacity-50">
            {{ xLoading ? '⏳' : '↻ Yenile' }}
          </button>
        </div>
        <div v-if="xReport" class="space-y-3">
          <div class="text-xs text-muted mb-2">{{ fmt(xReport.periodStart) }} — {{ fmt(xReport.periodEnd) }}</div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <span class="text-sm text-muted">Nakit</span>
            <span class="font-bold text-success">{{ money(xReport.totalCash) }}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <span class="text-sm text-muted">Kredi Kartı</span>
            <span class="font-bold text-accent">{{ money(xReport.totalCard) }}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <span class="text-sm text-muted">İndirim</span>
            <span class="font-bold text-danger">-{{ money(xReport.totalDiscount) }}</span>
          </div>
          <div class="flex justify-between py-2">
            <span class="font-bold">Genel Toplam</span>
            <span class="font-bold text-lg">{{ money(xReport.grandTotal) }}</span>
          </div>
          <div class="pt-2">
            <p class="text-xs font-bold text-muted uppercase mb-2">Kullanıcı Bazlı</p>
            <div v-for="u in xReport.userSummaries" :key="u.userName" class="flex justify-between py-1 text-sm">
              <span>{{ u.userName }}</span>
              <span class="font-semibold">{{ money(u.total) }} ({{ u.saleCount }} işlem)</span>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-muted">Yüklemek için yenile butonuna basın</div>
      </div>
      <!-- Z RAPORU AL -->
      <div class="bg-white rounded-2xl p-6 shadow-sm">
        <h2 class="font-bold text-primary mb-4">Z-Raporu Al</h2>
        <p class="text-sm text-muted mb-6">Z-Raporu alındığında kasa sıfırlanır ve satışlar raporlanır.</p>
        <button @click="takeZReport" :disabled="zLoading"
          class="w-full py-4 bg-danger text-white font-bold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 text-lg">
          {{ zLoading ? 'İşleniyor...' : '⚡ Z-Raporu Al' }}
        </button>
        <div v-if="lastZ" class="mt-4 p-4 bg-green-50 rounded-xl">
          <p class="text-sm font-bold text-success">✓ Z-Raporu Alındı</p>
          <p class="text-xs text-muted mt-1">Toplam: {{ money(lastZ.grandTotal) }} — {{ lastZ.saleCount }} işlem</p>
        </div>
      </div>
    </div>
    <!-- Z RAPORU GEÇMİŞİ -->
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 class="font-bold text-primary">Z-Raporu Geçmişi</h2>
        <button @click="loadZHistory" class="text-sm text-accent hover:underline">Yenile</button>
      </div>
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Tarih</th>
            <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Nakit</th>
            <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Kart</th>
            <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">İndirim</th>
            <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Toplam</th>
            <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">İşlem</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="zHistory.length === 0"><td colspan="6" class="text-center py-8 text-muted">Henüz Z-Raporu yok</td></tr>
          <tr v-for="z in zHistory" :key="z.id" class="border-t border-gray-50 hover:bg-gray-50">
            <td class="px-6 py-3 text-sm">{{ fmt(z.reportDate) }}</td>
            <td class="px-6 py-3 text-sm text-success font-semibold">{{ money(z.totalCash) }}</td>
            <td class="px-6 py-3 text-sm text-accent font-semibold">{{ money(z.totalCard) }}</td>
            <td class="px-6 py-3 text-sm text-danger">{{ money(z.totalDiscount) }}</td>
            <td class="px-6 py-3 font-bold">{{ money(z.grandTotal) }}</td>
            <td class="px-6 py-3 text-sm text-muted">{{ z.saleCount }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import api from '../api/api'
const xReport = ref(null); const xLoading = ref(false)
const zHistory = ref([]); const zLoading = ref(false); const lastZ = ref(null)
function money(v) { return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(v ?? 0) + ' ₺' }
function fmt(d) { return new Date(d).toLocaleString('tr-TR') }
async function loadXReport() { xLoading.value = true; try { xReport.value = (await api.getXReport()).data } finally { xLoading.value = false } }
async function loadZHistory() { zHistory.value = (await api.getZReports()).data }
async function takeZReport() {
  if (!confirm('Z-Raporu alınsın mı? Kasa sıfırlanacak.')) return
  zLoading.value = true
  try { lastZ.value = (await api.takeZReport()).data; await loadZHistory() }
  catch { alert('Hata: Alınacak satış bulunamadı.') } finally { zLoading.value = false }
}
onMounted(() => { loadXReport(); loadZHistory() })
</script>
