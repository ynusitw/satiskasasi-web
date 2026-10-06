<template>
  <div class="p-8">
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="page-title">Masalar</h1>
        <p class="page-subtitle">Masa ve bölüm bazında adisyon, ciro ve masada kalma süresi</p>
      </div>
      <DateRange v-model:from="from" v-model:to="to" :loading="loading" @apply="load"/>
    </div>

    <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>

    <!-- Özet -->
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <div v-for="k in kpis" :key="k.label" class="bg-white rounded-2xl shadow-sm p-5">
        <div class="text-xs font-bold uppercase tracking-wide text-muted">{{ k.label }}</div>
        <div class="text-2xl font-bold mt-1" :class="k.tone">{{ k.value }}</div>
        <div v-if="k.hint" class="text-xs text-muted mt-1">{{ k.hint }}</div>
      </div>
    </div>

    <!-- Şu an açık masalar -->
    <div class="bg-white rounded-2xl shadow-sm mb-6 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 class="font-bold text-primary">Şu An Açık Masalar</h2>
        <span class="text-sm text-muted">{{ open.length }} masa · {{ money(s.openTotal) }}</span>
      </div>
      <div v-if="open.length" class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3 p-4">
        <div v-for="o in open" :key="o.table + o.openedAt"
             class="rounded-xl border p-3"
             :class="minutesSince(o.openedAt) > 120 ? 'border-amber-300 bg-amber-50' : 'border-gray-100'">
          <div class="text-xs text-muted">{{ o.section }}</div>
          <div class="font-bold text-primary">{{ o.table }}</div>
          <div class="text-sm font-semibold text-primary mt-1">{{ money(o.total) }}</div>
          <div class="text-xs text-muted">{{ o.itemCount }} kalem · {{ duration(minutesSince(o.openedAt)) }}</div>
        </div>
      </div>
      <div v-else class="py-8 text-center text-sm text-muted">Açık masa yok</div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- Bölümler -->
      <div class="bg-white rounded-2xl shadow-sm p-6">
        <h2 class="font-bold text-primary mb-4">Bölümler</h2>
        <div v-if="sections.length" class="space-y-4">
          <div v-for="sec in sections" :key="sec.section">
            <div class="flex justify-between text-sm mb-1">
              <span class="font-semibold text-primary">{{ sec.section }}</span>
              <span class="text-muted">{{ money(sec.revenue) }} · {{ sec.orders }} adisyon</span>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full bg-accent"
                   :style="{ width: barWidth(sec.revenue, sections[0].revenue) }"/>
            </div>
          </div>
        </div>
        <div v-else class="py-10 text-center text-sm text-muted">Veri yok</div>
      </div>

      <!-- Masa tablosu -->
      <div class="xl:col-span-2 bg-white rounded-2xl shadow-sm overflow-hidden">
        <div class="max-h-[520px] overflow-y-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th class="text-left  px-5 py-3 text-[11px] font-semibold text-muted uppercase">Masa</th>
                <th class="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase">Adisyon</th>
                <th class="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase">Ciro</th>
                <th class="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase">Ort. Hesap</th>
                <th class="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase">Ort. Süre</th>
                <th class="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase">İptal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in tables" :key="t.tableId" class="border-t border-gray-50"
                  :class="t.orders === 0 ? 'opacity-50' : ''">
                <td class="px-5 py-3">
                  <div class="font-semibold text-primary">{{ t.table }}</div>
                  <div class="text-xs text-muted">{{ t.section }}</div>
                </td>
                <td class="px-5 py-3 text-right text-muted">{{ t.orders }}</td>
                <td class="px-5 py-3 text-right font-semibold text-primary">{{ money(t.revenue) }}</td>
                <td class="px-5 py-3 text-right text-muted">{{ t.orders ? money(t.averageBill) : '—' }}</td>
                <td class="px-5 py-3 text-right text-muted">{{ t.orders ? duration(t.averageMinutes) : '—' }}</td>
                <td class="px-5 py-3 text-right" :class="t.cancelled ? 'text-danger font-semibold' : 'text-muted'">
                  {{ t.cancelled || '—' }}
                </td>
              </tr>
              <tr v-if="!tables.length">
                <td colspan="6" class="text-center py-10 text-muted">Tanımlı masa yok</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <p class="text-xs text-muted mt-6">
      Ciro kapanan adisyonların kalem toplamıdır (satır indirimleri düşülmüş, fiş geneli indirim hariç).
      2 saatten uzun süredir açık masalar sarı gösterilir.
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '../../api/api'
import DateRange from '../../components/reports/DateRange.vue'

function iso(d) {
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
const today = new Date()
const from = ref(iso(new Date(today.getTime() - 6 * 864e5)))
const to   = ref(iso(today))

const s        = ref({})
const tables   = ref([])
const sections = ref([])
const open     = ref([])
const loading  = ref(false)
const error    = ref('')

// Açık masaların süresi sayfa açıkken de ilerlesin.
const now = ref(Date.now())
let ticker = null

function money(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}
function barWidth(v, max) {
  if (!max) return '0%'
  return Math.max(1, Math.round((v || 0) / max * 100)) + '%'
}
function minutesSince(d) {
  return Math.max(0, Math.round((now.value - new Date(d).getTime()) / 60000))
}
function duration(min) {
  if (!min) return '0 dk'
  const h = Math.floor(min / 60), m = min % 60
  return h ? `${h} sa ${m} dk` : `${m} dk`
}

const kpis = computed(() => [
  { label: 'Kapanan Adisyon', value: s.value.orders ?? 0,       tone: 'text-primary' },
  { label: 'Masa Cirosu',     value: money(s.value.revenue),     tone: 'text-primary' },
  { label: 'Ortalama Hesap',  value: money(s.value.averageBill), tone: 'text-primary' },
  { label: 'Ortalama Süre',   value: duration(s.value.averageMinutes), tone: 'text-primary' },
  { label: 'İptal Edilen',    value: s.value.cancelled ?? 0,
    tone: (s.value.cancelled ?? 0) > 0 ? 'text-danger' : 'text-muted', hint: 'adisyon' },
])

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.getTablesReport({ from: from.value, to: to.value })
    s.value = data.summary
    tables.value = data.tables
    sections.value = data.sections
    open.value = data.open
    now.value = Date.now()
  } catch (e) {
    error.value = e.response?.data?.message || 'Rapor alınamadı.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
  ticker = setInterval(() => (now.value = Date.now()), 60000)
})
onUnmounted(() => clearInterval(ticker))
</script>
