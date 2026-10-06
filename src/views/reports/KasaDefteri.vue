<template>
  <div class="p-8">
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="page-title">Kasa Defteri</h1>
        <p class="page-subtitle">
          Anlık kasa durumu (X raporu) — son Z raporundan bu yana
          <template v-if="report"> · {{ dateTime(report.periodStart) }}'den beri</template>
        </p>
      </div>
      <button @click="load" :disabled="loading"
              class="btn-primary disabled:opacity-50">
        {{ loading ? 'Yükleniyor...' : 'Yenile' }}
      </button>
    </div>

    <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>

    <div v-if="loading && !report" class="text-center py-16 text-muted">Yükleniyor...</div>

    <template v-else-if="report">
      <!-- Ana tutarlar -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="bg-white rounded-2xl shadow-sm p-6">
          <div class="text-[11px] font-semibold uppercase tracking-wider text-muted">Nakit</div>
          <div class="text-3xl font-semibold tracking-tight text-primary mt-1">{{ fmt(report.totalCash) }}</div>
          <div class="text-xs text-muted mt-1">{{ pct(report.totalCash) }} · parçalı ödemelerin nakit payı dahil</div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm p-6">
          <div class="text-[11px] font-semibold uppercase tracking-wider text-muted">Kredi Kartı</div>
          <div class="text-3xl font-semibold tracking-tight text-primary mt-1">{{ fmt(report.totalCard) }}</div>
          <div class="text-xs text-muted mt-1">{{ pct(report.totalCard) }} · parçalı ödemelerin kart payı dahil</div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm p-6">
          <div class="text-[11px] font-semibold uppercase tracking-wider text-muted">Genel Toplam</div>
          <div class="text-3xl font-semibold tracking-tight text-primary mt-1">{{ fmt(report.grandTotal) }}</div>
          <div class="text-xs text-muted mt-1">{{ report.saleCount }} işlem</div>
        </div>
      </div>

      <!-- İkincil göstergeler -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div v-for="k in secondary" :key="k.label" class="bg-white rounded-2xl shadow-sm p-5">
          <div class="text-[11px] font-semibold uppercase tracking-wider text-muted">{{ k.label }}</div>
          <div class="text-xl font-semibold tracking-tight mt-1" :class="k.tone">{{ k.value }}</div>
          <div v-if="k.hint" class="text-xs text-muted mt-1">{{ k.hint }}</div>
        </div>
      </div>

      <!-- Kasiyer -->
      <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100">
          <h2 class="section-title">Kasiyere Göre</h2>
        </div>
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left  px-6 py-3 text-[11px] font-semibold text-muted uppercase">Kasiyer</th>
              <th class="text-right px-6 py-3 text-[11px] font-semibold text-muted uppercase">İşlem</th>
              <th class="text-right px-6 py-3 text-[11px] font-semibold text-muted uppercase">İndirim</th>
              <th class="text-right px-6 py-3 text-[11px] font-semibold text-muted uppercase">Toplam</th>
              <th class="text-right px-6 py-3 text-[11px] font-semibold text-muted uppercase">Pay</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in report.userSummaries" :key="u.userName" class="border-t border-gray-50">
              <td class="px-6 py-3 font-semibold text-primary">{{ u.userName }}</td>
              <td class="px-6 py-3 text-right text-muted">{{ u.saleCount }}</td>
              <td class="px-6 py-3 text-right text-danger">{{ fmt(u.discount) }}</td>
              <td class="px-6 py-3 text-right font-semibold text-primary">{{ fmt(u.total) }}</td>
              <td class="px-6 py-3 text-right text-muted">{{ pct(u.total) }}</td>
            </tr>
            <tr v-if="!report.userSummaries?.length">
              <td colspan="5" class="text-center py-10 text-muted">Bu dönemde satış yok</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="text-xs text-muted mt-6">
        Personel satışları ciroya ve kasiyer tablosuna dahil değildir, ayrıca gösterilir.
        Veresiye satışlar kasada seçilen ödeme yöntemiyle kaydedildiğinden nakit/kart toplamlarının
        içindedir; cariye yazılan tutar "Veresiye" kartında ayrıca görünür.
        Z raporu kasadan alınır; alındığında bu sayfa sıfırlanır.
      </p>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../api/api'

const report  = ref(null)
const loading = ref(true)
const error   = ref('')

function fmt(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}
function pct(v) {
  const total = report.value?.grandTotal
  if (!total) return '—'
  return '%' + new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format((v || 0) / total * 100)
}
function dateTime(d) {
  return new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const secondary = computed(() => {
  const r = report.value || {}
  return [
    { label: 'Ortalama Fiş', value: r.saleCount ? fmt(r.grandTotal / r.saleCount) : '—', tone: 'text-primary' },
    { label: 'İndirim',      value: fmt(r.totalDiscount), tone: 'text-danger' },
    { label: 'İkram',        value: fmt(r.compTotal),     tone: 'text-amber-600', hint: 'ikram edilen ürünlerin değeri' },
    { label: 'Veresiye',     value: fmt(r.totalCari),     tone: 'text-amber-600', hint: 'cariye yazılan' },
    { label: 'Personel',     value: fmt(r.staffConsumption), tone: 'text-muted',
      hint: `${r.staffSaleCount ?? 0} işlem · ${fmt(r.staffCollected)} tahsil` },
  ]
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    report.value = (await api.getXReport()).data
  } catch (e) {
    error.value = e.response?.data?.message || 'Kasa durumu alınamadı.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
