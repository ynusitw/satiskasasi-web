<template>
  <div class="p-6 lg:p-8 min-h-screen bg-bg">

    <!-- Başlık -->
    <div class="flex flex-wrap items-end justify-between gap-4 mb-7">
      <div>
        <h1 class="page-title">Genel Bakış</h1>
        <p class="page-subtitle">{{ periodLabel }}</p>
      </div>
      <button @click="load" :disabled="loading"
              class="px-4 h-9 rounded-lg bg-white text-[13px] font-medium text-primary shadow-sm
                     hover:bg-gray-50 disabled:opacity-50">
        {{ loading ? 'Yükleniyor...' : 'Yenile' }}
      </button>
    </div>

    <!-- Yükleniyor -->
    <div v-if="loading && !data" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="bg-white rounded-2xl shadow-sm p-5 h-[118px] animate-pulse">
        <div class="h-3 w-20 bg-gray-100 rounded"/>
        <div class="h-7 w-32 bg-gray-100 rounded mt-4"/>
      </div>
    </div>

    <template v-else>

      <!-- ── Ana göstergeler ──────────────────────────────────────────── -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div v-for="k in kpis" :key="k.label" class="bg-white rounded-2xl shadow-sm p-5">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[13px] font-medium text-muted">{{ k.label }}</span>
            <span v-if="k.trend !== null && k.trend !== undefined"
                  class="text-[11.5px] font-semibold px-1.5 py-0.5 rounded-md"
                  :class="k.trend >= 0 ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'">
              {{ k.trend >= 0 ? '+' : '−' }}{{ Math.abs(k.trend).toFixed(1) }}%
            </span>
          </div>
          <div class="text-[26px] leading-tight font-semibold text-primary tracking-tight mt-2">
            {{ k.value }}
          </div>
          <div class="text-[12.5px] text-muted mt-1.5">{{ k.hint }}</div>
        </div>
      </div>

      <!-- ── Ciro dışı kalemler + stok uyarısı ─────────────────────────── -->
      <div class="bg-white rounded-2xl shadow-sm mb-6 grid grid-cols-2 lg:grid-cols-5
                  divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
        <div v-for="m in secondary" :key="m.label" class="px-5 py-4">
          <div class="text-[12.5px] font-medium text-muted">{{ m.label }}</div>
          <div class="text-[17px] font-semibold mt-1" :class="m.tone">{{ m.value }}</div>
          <div class="text-[12px] text-muted mt-0.5">{{ m.hint }}</div>
        </div>

        <!-- Stok uyarısı -->
        <div class="px-5 py-4">
          <div class="text-[12.5px] font-medium text-muted">Kritik Stok</div>
          <div class="text-[17px] font-semibold mt-1"
               :class="(data?.lowStockCount ?? 0) > 0 ? 'text-danger' : 'text-success'">
            {{ (data?.lowStockCount ?? 0) > 0 ? `${data.lowStockCount} ürün` : 'Sorun yok' }}
          </div>
          <!-- Reçeteli satışta stok hammaddeden düşer; ürün stoğu bunu görmez. -->
          <RouterLink v-if="(data?.lowIngredientCount ?? 0) > 0" to="/ingredients"
                      class="text-[12px] font-medium text-warning hover:underline"
                      :title="(data?.lowIngredients || []).join(', ')">
            {{ data.lowIngredientCount }} hammadde kritik seviyede
          </RouterLink>
          <div v-else class="text-[12px] text-muted mt-0.5">Hammaddeler yeterli</div>
        </div>
      </div>

      <!-- ── Grafik + En çok satılanlar ───────────────────────────────── -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <div class="xl:col-span-2 bg-white rounded-2xl shadow-sm p-6">
          <div class="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div>
              <h2 class="font-semibold text-primary text-[15px]">Satış Trendi</h2>
              <div class="flex items-center gap-4 text-[12.5px] text-muted mt-1">
                <span>{{ trendSubtitle }}</span>
                <span class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full inline-block" :style="{ background: CASH_COLOR }"/>Nakit
                </span>
                <span class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full inline-block" :style="{ background: CARD_COLOR }"/>Kart
                </span>
              </div>
            </div>
            <!-- Zaman süzgeci -->
            <div class="flex p-0.5 rounded-lg bg-gray-100">
              <button v-for="f in periodFilters" :key="f.key"
                      @click="activeFilter = f.key"
                      class="px-3 h-7 rounded-md text-[12.5px] font-medium"
                      :class="activeFilter === f.key
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-muted hover:text-primary'">
                {{ f.label }}
              </button>
            </div>
          </div>

          <VueApexCharts v-if="chartHasData"
                         type="area" height="300"
                         :options="areaOpts" :series="areaSeries"/>
          <div v-else class="flex flex-col items-center justify-center h-[300px] gap-1.5 select-none">
            <p class="text-[13.5px] font-medium text-primary">Henüz yeterli satış verisi yok</p>
            <p class="text-[12.5px] text-muted">İlk satışların ardından grafik burada görünecek.</p>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm p-6 flex flex-col">
          <h2 class="font-semibold text-primary text-[15px]">Bu Ay En Çok Satılanlar</h2>
          <p class="text-[12.5px] text-muted mt-1 mb-5">Satış adedine göre</p>

          <div v-if="!topProducts.length"
               class="flex-1 flex flex-col items-center justify-center gap-1.5 py-8 select-none">
            <p class="text-[13.5px] font-medium text-primary">Bu ay henüz satış yok</p>
            <p class="text-[12.5px] text-muted">Satışlar gerçekleştikçe liste oluşacak.</p>
          </div>

          <ol v-else class="space-y-4 flex-1">
            <li v-for="(p, i) in topProducts" :key="p.name">
              <div class="flex items-baseline justify-between gap-3">
                <div class="flex items-baseline gap-2.5 min-w-0">
                  <span class="text-[12px] font-semibold text-muted w-3">{{ i + 1 }}</span>
                  <span class="text-[13.5px] font-medium text-primary truncate">{{ p.name }}</span>
                </div>
                <span class="text-[13px] font-semibold text-primary flex-shrink-0">
                  {{ fmt(p.totalRevenue ?? p.revenue) }}
                </span>
              </div>
              <div class="flex items-center gap-3 mt-1.5 pl-[22px]">
                <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full rounded-full bg-accent transition-all duration-700 ease-out"
                       :style="{ width: barWidth(p.totalQty ?? p.qty) + '%', opacity: 1 - i * 0.14 }"/>
                </div>
                <span class="text-[12px] text-muted w-16 text-right">{{ p.totalQty ?? p.qty }} adet</span>
              </div>
            </li>
          </ol>

          <div class="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
            <div>
              <div class="text-[12px] text-muted">Aylık toplam</div>
              <div class="text-[15px] font-semibold text-primary mt-0.5">{{ fmt(data?.monthTotal) }}</div>
            </div>
            <div>
              <div class="text-[12px] text-muted">Aylık işlem</div>
              <div class="text-[15px] font-semibold text-primary mt-0.5">{{ data?.monthSaleCount ?? 0 }}</div>
            </div>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import api from '../api/api'

// ── Sabitler ─────────────────────────────────────────────────────────────
// Grafik renkleri — açıklama noktaları ve seriler aynı rengi kullanır.
const CASH_COLOR = '#10B981'
const CARD_COLOR = '#2563EB'
// Zaman ekseni etiketleri
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

// ── State ─────────────────────────────────────────────────────────────────
const data         = ref(null)
const loading      = ref(true)
// Pano kartlarıyla aynı dönem açılışta seçili olsun.
const activeFilter = ref('period')
// Grafik serileri: {period: {cash, card}, week: ..., ...} — süzgeç
// değiştikçe API'dan çekilir ve tekrar istenmesin diye saklanır.
const trendCache = ref({})

const periodFilters = [
  { key: 'period', label: 'Z Dönemi' },
  { key: 'week',   label: 'Bu Hafta' },
  { key: 'month',  label: 'Bu Ay'    },
  { key: 'year',   label: 'Bu Yıl'   },
]

// Pano, kasadaki Z raporuyla aynı dönemi gösterir: son Z'den bu yana.
// Z alınınca bu rakamlar sıfırlanır.
const periodLabel = computed(() => {
  const start = data.value?.periodStart
  if (!start) return 'Z raporu alınana kadarki tüm satışlar'
  const d = new Date(start)
  return 'Son Z raporundan bu yana — ' + d.toLocaleString('tr-TR', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })
})

function fmt(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}

// ── Top products — sadece API verisi, mock yok ───────────────────────────
const topProducts = computed(() => data.value?.topProducts ?? [])

const maxQty = computed(() =>
  Math.max(...topProducts.value.map(p => p.totalQty ?? p.qty ?? 0), 1)
)

function barWidth(qty) {
  return Math.round(((qty ?? 0) / maxQty.value) * 100)
}


// ── Trend rozetleri — API'dan gelirse göster, yoksa gizle ────────────────
// API şu alanları dönerse: periodCashChange, periodCardChange, periodTotalChange (number | null)
const trends = computed(() => ({
  cash:  data.value?.periodCashChange  ?? null,
  card:  data.value?.periodCardChange  ?? null,
  total: data.value?.periodTotalChange ?? null,
}))

const kpis = computed(() => {
  const d = data.value ?? {}
  const count = d.periodSaleCount ?? 0
  return [
    { label: 'Toplam Ciro', value: fmt(d.periodTotal), trend: trends.value.total, hint: `${count} işlem` },
    { label: 'Nakit',       value: fmt(d.periodCash),  trend: trends.value.cash,  hint: share(d.periodCash, d.periodTotal) },
    { label: 'Kredi Kartı', value: fmt(d.periodCard),  trend: trends.value.card,  hint: share(d.periodCard, d.periodTotal) },
    { label: 'Ortalama Fiş', value: count ? fmt((d.periodTotal ?? 0) / count) : '—', trend: null,
      hint: 'İşlem başına ciro' },
  ]
})

// Ciroya girmeyen kalemler (Z raporundaki ayrı satırlar)
const secondary = computed(() => {
  const d = data.value ?? {}
  return [
    { label: 'İndirim', value: fmt(d.periodDiscount), tone: 'text-danger', hint: 'Ciroya yansımış' },
    { label: 'İkram', value: fmt(d.periodCompTotal), tone: 'text-primary', hint: 'Satır ve hesap ikramları' },
    { label: 'Personel Tüketimi', value: fmt(d.periodStaffConsumption), tone: 'text-primary',
      hint: `${d.periodStaffSaleCount ?? 0} işlem · ciroya dahil değil` },
    { label: 'Personelden Tahsil', value: fmt(d.periodStaffCollected), tone: 'text-primary',
      hint: 'Kasaya giren, ciro dışı' },
  ]
})

function share(part, total) {
  if (!total) return 'Ciro payı —'
  return 'Ciro payı %' + new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 })
    .format((part ?? 0) / total * 100)
}


// ── Alan grafiği ─────────────────────────────────────────────────────────
const trendData = computed(() => trendCache.value[activeFilter.value] ?? null)

const chartHasData = computed(() => {
  const t = trendData.value
  if (!t) return false
  return t.cash.some(v => v > 0) || t.card.some(v => v > 0)
})

const trendSubtitle = computed(() =>
  activeFilter.value === 'period'
    ? 'Son Z raporundan bu yana, saat saat'
    : 'Nakit ve kart ciro')

async function loadTrend(range) {
  if (trendCache.value[range]) return
  try {
    const res = await api.getTrend(range)
    trendCache.value = {
      ...trendCache.value,
      [range]: { cash: res.data.cash ?? [], card: res.data.card ?? [] },
    }
  } catch { /* trend gösterilemezse boş durum görünür */ }
}

watch(activeFilter, (r) => loadTrend(r))

// ── Alan grafiği — filtre bazlı reaktif veri (API'dan gelene kadar sıfır) ─
const chartPeriod = computed(() => {
  // Diziler API'dan gelir; gelmediyse kova sayısı kadar sıfır.
  const zeros = (n) => Array(n).fill(0)
  const series = (n) => ({
    cash: trendData.value?.cash?.length ? trendData.value.cash : zeros(n),
    card: trendData.value?.card?.length ? trendData.value.card : zeros(n),
  })

  switch (activeFilter.value) {
    case 'period':
      return {
        categories: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        ...series(24),
        xLabel:     (v) => (parseInt(v) % 6 === 0 ? v : ''),
        xTooltip:   (v) => v,
      }
    case 'week':
      return {
        categories: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
        ...series(7),
        xLabel:     (v) => v,
        xTooltip:   (v) => v,
      }
    case 'year':
      return {
        categories: MONTHS,
        ...series(12),
        xLabel:     (v) => v,
        xTooltip:   (v) => v,
      }
    default: { // month — ayın gün sayısı kadar
      const days = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
      return {
        categories: Array.from({ length: days }, (_, i) => `${i + 1}`),
        ...series(days),
        xLabel:     (v) => (Number(v) % 5 === 0 ? v : ''),
        xTooltip:   (v) => `${v}. Gün`,
      }
    }
  }
})

const areaSeries = computed(() => [
  { name: 'Nakit', data: chartPeriod.value.cash },
  { name: 'Kart',  data: chartPeriod.value.card },
])

const areaOpts = computed(() => ({
  chart: {
    type: 'area',
    toolbar: { show: false },
    zoom:    { enabled: false },
    background: 'transparent',
    animations: { enabled: true, easing: 'easeinout', speed: 700 },
    fontFamily: 'inherit',
  },
  colors: [CASH_COLOR, CARD_COLOR],
  stroke: { curve: 'smooth', width: 2 },
  fill: {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.18, opacityTo: 0.0, stops: [0, 95, 100] },
  },
  dataLabels: { enabled: false },
  grid: { borderColor: 'rgba(100,116,139,0.14)', strokeDashArray: 4, padding: { left: 4, right: 4 } },
  xaxis: {
    categories: chartPeriod.value.categories,
    axisBorder: { show: false },
    axisTicks:  { show: false },
    labels: {
      style: { colors: '#94a3b8', fontSize: '11px' },
      formatter: chartPeriod.value.xLabel,
    },
    tooltip: { enabled: false },
  },
  yaxis: {
    labels: {
      style: { colors: '#94a3b8', fontSize: '11px' },
      formatter: (v) => (v >= 1000 ? (v / 1000).toFixed(1) + 'K' : v) + ' ₺',
    },
  },
  tooltip: {
    shared: true,
    intersect: false,
    y: { formatter: (v) => new Intl.NumberFormat('tr-TR').format(v) + ' ₺' },
    x: { formatter: chartPeriod.value.xTooltip },
    style: { fontSize: '12px' },
  },
  legend: { show: false },
  markers: { size: 0 },
}))

// ── Yükleme ───────────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  // Yenile'de trend de tazelensin.
  trendCache.value = {}
  try {
    data.value = (await api.dashboard()).data
    await loadTrend(activeFilter.value)
  } catch (e) {
    console.error('[Dashboard] yükleme hatası:', e?.response?.status, e?.response?.data ?? e?.message)
    data.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
