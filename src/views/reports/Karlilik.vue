<template>
  <div class="p-8">
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="page-title">Kârlılık</h1>
        <p class="page-subtitle">
          Ürün başına ciro, reçeteden hesaplanan maliyet, kâr ve kâr marjı
        </p>
      </div>

      <div class="flex flex-wrap items-end gap-2">
        <label class="text-xs text-muted">
          Başlangıç
          <input v-model="from" type="date"
                 class="block mt-1 px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
        </label>
        <label class="text-xs text-muted">
          Bitiş
          <input v-model="to" type="date"
                 class="block mt-1 px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
        </label>
        <button @click="load" :disabled="loading"
                class="btn-primary disabled:opacity-50">
          {{ loading ? 'Yükleniyor...' : 'Getir' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>

    <!-- Özet -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <div class="text-[11px] font-semibold uppercase tracking-wider text-muted">Ciro</div>
        <div class="text-2xl font-semibold tracking-tight text-primary mt-1">{{ money(summary.revenue) }}</div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <div class="text-[11px] font-semibold uppercase tracking-wider text-muted">Maliyet</div>
        <div class="text-2xl font-semibold tracking-tight text-amber-600 mt-1">{{ money(summary.cost) }}</div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <div class="text-[11px] font-semibold uppercase tracking-wider text-muted">Kâr</div>
        <div class="text-2xl font-semibold tracking-tight mt-1"
             :class="(summary.profit ?? 0) >= 0 ? 'text-success' : 'text-danger'">
          {{ money(summary.profit) }}
        </div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <div class="text-[11px] font-semibold uppercase tracking-wider text-muted">Kâr Marjı</div>
        <div class="text-2xl font-semibold tracking-tight text-primary mt-1">
          {{ summary.margin != null ? pct(summary.margin) : '—' }}
        </div>
      </div>
    </div>

    <!-- Maliyeti bilinmeyen ciro: kâr toplamına girmez, açıkça söylenir -->
    <div v-if="summary.uncostedRevenue > 0"
         class="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-900">
      <b>{{ money(summary.uncostedRevenue) }}</b> ciro, reçetesi olmayan ürünlerden geliyor;
      maliyeti bilinmediği için kâr hesabına katılmadı.
      <RouterLink to="/recipes" class="font-semibold underline">Reçete Merkezi</RouterLink>'nden
      reçete tanımlayın.
    </div>

    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left  px-4 py-3 text-[11px] font-semibold text-muted uppercase">Ürün</th>
              <th class="text-right whitespace-nowrap px-4 py-3 text-[11px] font-semibold text-muted uppercase">Adet</th>
              <th class="text-right whitespace-nowrap px-4 py-3 text-[11px] font-semibold text-muted uppercase">Ciro</th>
              <th class="text-right whitespace-nowrap px-4 py-3 text-[11px] font-semibold text-muted uppercase">Birim Maliyet</th>
              <th class="text-right whitespace-nowrap px-4 py-3 text-[11px] font-semibold text-muted uppercase">Maliyet</th>
              <th class="text-right whitespace-nowrap px-4 py-3 text-[11px] font-semibold text-muted uppercase">Kâr</th>
              <th class="text-left  px-4 py-3 text-[11px] font-semibold text-muted uppercase w-40">Marj</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center py-12 text-muted">Yükleniyor...</td>
            </tr>
            <tr v-for="r in rows" :key="r.productName + (r.variantName || '')"
                class="border-t border-gray-50 hover:bg-gray-50/60">
              <td class="px-4 py-3 min-w-[240px]">
                <div class="font-semibold text-primary">{{ r.productName }}</div>
                <div v-if="r.variantName" class="text-xs text-muted">{{ r.variantName }}</div>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-right text-muted">{{ num(r.quantity) }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-right font-semibold text-primary">{{ money(r.revenue) }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-right text-muted">
                {{ r.unitCost != null ? money(r.unitCost) : '—' }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-right text-muted">
                {{ r.cost != null ? money(r.cost) : '—' }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-right font-semibold"
                  :class="r.profit == null ? 'text-muted' : r.profit >= 0 ? 'text-success' : 'text-danger'">
                {{ r.profit != null ? money(r.profit) : 'maliyet tanımsız' }}
              </td>
              <td class="px-4 py-3 min-w-[150px]">
                <div v-if="r.margin != null" class="flex items-center gap-2">
                  <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full rounded-full"
                         :class="r.margin >= 50 ? 'bg-green-500' : r.margin >= 20 ? 'bg-amber-500' : 'bg-red-500'"
                         :style="{ width: Math.max(0, Math.min(100, r.margin)) + '%' }"/>
                  </div>
                  <span class="text-xs font-semibold w-14 text-right"
                        :class="r.margin < 0 ? 'text-danger' : 'text-primary'">{{ pct(r.margin) }}</span>
                </div>
                <span v-else class="text-xs text-muted">—</span>
              </td>
            </tr>
            <tr v-if="!loading && !rows.length">
              <td colspan="7" class="text-center py-12 text-muted">Bu aralıkta satış yok</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="px-4 py-3 text-xs text-muted border-t border-gray-100">
        Maliyet <b>güncel</b> hammadde fiyatlarıyla hesaplanır. Ciro satır indirimleri
        düşülmüş net tutardır; fiş geneli indirim ve personel satışları dahil değildir.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/api'

// Varsayılan aralık: son 30 gün
const iso = d => d.toISOString().slice(0, 10)
const today = new Date()
const from = ref(iso(new Date(today.getTime() - 29 * 86400000)))
const to   = ref(iso(today))

const rows    = ref([])
const summary = ref({})
const loading = ref(false)
const error   = ref('')

function money(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}
// Türkçe yüzde: "%59,7"
function pct(v) {
  const s = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(Math.abs(v ?? 0))
  return (v < 0 ? '-%' : '%') + s
}
function num(v) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 3 }).format(v ?? 0)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.getProfitability({ from: from.value, to: to.value })
    rows.value = res.data.rows
    summary.value = res.data.summary
  } catch (e) {
    error.value = e.response?.data?.message || 'Rapor alınamadı.'
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>
