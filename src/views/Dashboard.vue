<template>
  <div class="p-6 lg:p-8 min-h-screen" style="background: #F0F2F5">

    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-primary">Dashboard</h1>
        <p class="text-muted text-sm mt-1">{{ todayLabel }}</p>
      </div>
      <button @click="load"
              class="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl
                     text-sm font-semibold hover:bg-blue-600 transition-colors shadow-sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11
                   11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Yenile
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-32 gap-3">
      <div class="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"/>
      <p class="text-muted text-sm">Yükleniyor...</p>
    </div>

    <template v-else>

      <!-- ── Stat Kartları ─────────────────────────────────────────────── -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        <!-- Bugün Nakit -->
        <div class="bg-white rounded-2xl shadow-sm p-5 flex flex-col">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-bold text-muted uppercase tracking-wide">Bugün Nakit</span>
            <div class="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center text-base">💵</div>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-2xl font-bold text-primary">{{ fmt(data?.todayCash) }}</span>
            <span :class="trendBadge(mockTrends.cash)"
                  class="flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
              {{ mockTrends.cash >= 0 ? '↑' : '↓' }} {{ Math.abs(mockTrends.cash).toFixed(1) }}%
            </span>
          </div>
          <div class="mt-3 -mx-1">
            <VueApexCharts type="area" height="50"
                           :options="sparkOpts('#27AE60')" :series="[{ data: cashHourly }]"/>
          </div>
          <div class="text-xs text-muted mt-1">Saatlik trend</div>
        </div>

        <!-- Bugün Kart -->
        <div class="bg-white rounded-2xl shadow-sm p-5 flex flex-col">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-bold text-muted uppercase tracking-wide">Bugün Kart</span>
            <div class="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-base">💳</div>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-2xl font-bold text-primary">{{ fmt(data?.todayCard) }}</span>
            <span :class="trendBadge(mockTrends.card)"
                  class="flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
              {{ mockTrends.card >= 0 ? '↑' : '↓' }} {{ Math.abs(mockTrends.card).toFixed(1) }}%
            </span>
          </div>
          <div class="mt-3 -mx-1">
            <VueApexCharts type="area" height="50"
                           :options="sparkOpts('#3498DB')" :series="[{ data: cardHourly }]"/>
          </div>
          <div class="text-xs text-muted mt-1">Saatlik trend</div>
        </div>

        <!-- Bugün Toplam -->
        <div class="bg-white rounded-2xl shadow-sm p-5 flex flex-col">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-bold text-muted uppercase tracking-wide">Bugün Toplam</span>
            <div class="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-base">💰</div>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-2xl font-bold text-primary">{{ fmt(data?.todayTotal) }}</span>
            <span :class="trendBadge(mockTrends.total)"
                  class="flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
              {{ mockTrends.total >= 0 ? '↑' : '↓' }} {{ Math.abs(mockTrends.total).toFixed(1) }}%
            </span>
          </div>
          <div class="mt-3 -mx-1">
            <VueApexCharts type="area" height="50"
                           :options="sparkOpts('#8B5CF6')" :series="[{ data: totalHourly }]"/>
          </div>
          <div class="text-xs text-muted mt-1">{{ data?.todaySaleCount ?? 0 }} işlem</div>
        </div>

        <!-- Kritik Stok -->
        <div class="bg-white rounded-2xl shadow-sm p-5 flex flex-col justify-between">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-bold text-muted uppercase tracking-wide">Kritik Stok</span>
            <div class="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-base">⚠️</div>
          </div>
          <div class="text-5xl font-black mt-2"
               :class="(data?.lowStockCount ?? 0) > 0 ? 'text-danger' : 'text-success'">
            {{ data?.lowStockCount ?? 0 }}
          </div>
          <div class="text-xs text-muted mt-3">ürün kritik seviyede</div>
          <div v-if="(data?.lowStockCount ?? 0) > 0"
               class="mt-3 px-3 py-1.5 bg-red-50 text-danger text-xs font-semibold rounded-lg text-center">
            Stok kontrolü yapın
          </div>
          <div v-else
               class="mt-3 px-3 py-1.5 bg-green-50 text-success text-xs font-semibold rounded-lg text-center">
            Stok durumu iyi
          </div>
        </div>
      </div>

      <!-- ── Orta bölüm: Alan Grafiği + En Çok Satılanlar ─────────────── -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <!-- Bu Ay Satış Trendi (2/3) -->
        <div class="xl:col-span-2 bg-white rounded-2xl shadow-sm p-6">
          <div class="flex flex-wrap items-start justify-between gap-3 mb-6">
            <div>
              <h2 class="font-bold text-primary text-base">Satış Trendi</h2>
              <p class="text-xs text-muted mt-0.5">Nakit ve kart ciro</p>
            </div>
            <div class="flex items-center gap-3">
              <!-- Legend -->
              <div class="hidden sm:flex items-center gap-4 text-xs font-semibold mr-1">
                <span class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-success inline-block"/>Nakit
                </span>
                <span class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-accent inline-block"/>Kart
                </span>
              </div>
              <!-- Zaman filtresi -->
              <div class="flex rounded-xl overflow-hidden border border-gray-200">
                <button v-for="f in periodFilters" :key="f.key"
                        @click="activeFilter = f.key"
                        class="px-3 py-1.5 text-xs font-semibold transition-all"
                        :class="activeFilter === f.key
                          ? 'bg-accent text-white'
                          : 'bg-white text-muted hover:text-primary hover:bg-gray-50'">
                  {{ f.label }}
                </button>
              </div>
            </div>
          </div>
          <VueApexCharts type="area" height="300"
                         :options="areaOpts" :series="areaSeries"/>
        </div>

        <!-- Bu Ay En Çok Satılanlar (1/3) -->
        <div class="bg-white rounded-2xl shadow-sm p-6 flex flex-col">
          <h2 class="font-bold text-primary text-base mb-1">Bu Ay En Çok Satılanlar</h2>
          <p class="text-xs text-muted mb-5">Satış adedine göre</p>

          <div v-if="!topProducts.length" class="flex-1 flex items-center justify-center text-muted text-sm">
            Henüz satış verisi yok
          </div>

          <div v-else class="space-y-4 flex-1">
            <div v-for="(p, i) in topProducts" :key="p.name" class="group">
              <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="flex-shrink-0 w-5 h-5 rounded-full text-white text-[10px] font-bold
                               flex items-center justify-center"
                        :style="{ background: rankColor(i) }">
                    {{ i + 1 }}
                  </span>
                  <span class="text-sm font-semibold text-primary truncate">{{ p.name }}</span>
                </div>
                <span class="text-xs text-muted ml-2 flex-shrink-0">{{ p.totalQty ?? p.qty }} adet</span>
              </div>
              <!-- Progress bar -->
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-700 ease-out"
                     :style="{
                       width: barWidth(p.totalQty ?? p.qty) + '%',
                       background: rankColor(i),
                     }"/>
              </div>
              <div class="text-xs text-right mt-1 font-semibold"
                   :style="{ color: rankColor(i) }">
                {{ fmt(p.totalRevenue ?? p.revenue) }}
              </div>
            </div>
          </div>

          <!-- Ay özeti -->
          <div class="mt-6 pt-4 border-t border-gray-100 space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-muted">Aylık Toplam Satış</span>
              <span class="font-bold text-primary">{{ fmt(data?.monthTotal) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted">Aylık İşlem Sayısı</span>
              <span class="font-bold text-primary">{{ data?.monthSaleCount ?? 0 }}</span>
            </div>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import api from '../api/api'

// ── Sabit mock veri ───────────────────────────────────────────────────────
// Saat bazlı satış trendi (24 saat) — gerçekçi restoran/kafe deseni
const cashHourly  = [0, 0, 0, 0, 0, 20, 120, 280, 350, 420, 390, 480, 520, 460, 380, 310, 290, 340, 430, 510, 470, 380, 210, 80]
const cardHourly  = [0, 0, 0, 0, 0, 10,  80, 190, 270, 340, 300, 410, 470, 390, 310, 260, 240, 290, 370, 450, 410, 320, 160, 50]
const totalHourly = cashHourly.map((v, i) => v + cardHourly[i])

// Aylık satış verisi — 30 gün, gerçekçi dalga
function genMonthly(base, amp, seed) {
  return Array.from({ length: 30 }, (_, i) => {
    const wave = Math.sin((i + seed) * 0.7) * amp
    const wknd = (i % 7 === 5 || i % 7 === 6) ? amp * 0.4 : 0
    return Math.max(0, Math.round(base + wave + wknd + i * 25))
  })
}
const mockMonthlyCash = genMonthly(2800, 900, 0)
const mockMonthlyCard = genMonthly(1900, 700, 2)

// Haftalık veri — 7 gün, hafta sonu daha yüksek
const mockWeeklyCash = [12400, 14800, 13200, 15600, 17200, 21500, 18900]
const mockWeeklyCard = [ 8300, 10100,  9400, 11200, 12800, 15600, 13400]

// Yıllık veri — 12 ay
const mockYearlyCash = [62000, 58000, 71000, 75000, 82000, 91000, 88000, 95000, 87000, 79000, 68000, 105000]
const mockYearlyCard = [41000, 38000, 47000, 52000, 58000, 64000, 61000, 68000, 62000, 55000, 48000,  74000]

// Trend rozetleri — dünle kıyasla % (gerçek API gelene kadar mock)
const mockTrends = { cash: 12.4, card: -3.1, total: 8.7 }
function trendBadge(pct) {
  return pct >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
}

// Mock ürünler
const mockTopProducts = [
  { name: 'Çay',               totalQty: 248, totalRevenue: 3720 },
  { name: 'Türk Kahvesi',      totalQty: 183, totalRevenue: 7320 },
  { name: 'Kahvaltı Tabağı',   totalQty: 97,  totalRevenue: 11640 },
  { name: 'Su 0.5L',           totalQty: 312, totalRevenue: 2808 },
  { name: 'Karışık Tost',      totalQty: 74,  totalRevenue: 5180 },
]

// ── State ─────────────────────────────────────────────────────────────────
const data         = ref(null)
const loading      = ref(true)
const activeFilter = ref('month')

const periodFilters = [
  { key: 'today', label: 'Bugün'    },
  { key: 'week',  label: 'Bu Hafta' },
  { key: 'month', label: 'Bu Ay'    },
  { key: 'year',  label: 'Bu Yıl'   },
]

const todayLabel = new Date().toLocaleDateString('tr-TR', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
})

function fmt(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}

// ── Top products: API'dan yoksa mock ─────────────────────────────────────
const topProducts = computed(() =>
  data.value?.topProducts?.length ? data.value.topProducts : mockTopProducts
)

const maxQty = computed(() =>
  Math.max(...topProducts.value.map(p => p.totalQty ?? p.qty ?? 0), 1)
)

function barWidth(qty) {
  return Math.round(((qty ?? 0) / maxQty.value) * 100)
}

const rankColors = ['#3498DB', '#27AE60', '#8B5CF6', '#F59E0B', '#E74C3C']
function rankColor(i) { return rankColors[i % rankColors.length] }

// ── Sparkline seçenekleri ─────────────────────────────────────────────────
function sparkOpts(color) {
  return {
    chart: {
      type: 'area',
      sparkline: { enabled: true },
      animations: { enabled: true, easing: 'easeinout', speed: 900 },
    },
    stroke: { curve: 'smooth', width: 2.5, colors: [color] },
    colors: [color],
    tooltip: { enabled: false },
    fill: {
      type: 'gradient',
      gradient: {
        type: 'vertical',
        shadeIntensity: 0,
        opacityFrom: 0.45,
        opacityTo:   0.02,
        stops: [0, 100],
        colorStops: [
          { offset: 0,   color, opacity: 0.45 },
          { offset: 100, color, opacity: 0.02 },
        ],
      },
    },
  }
}

// ── Alan grafiği — filtre bazlı reaktif veri ─────────────────────────────
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

const chartPeriod = computed(() => {
  switch (activeFilter.value) {
    case 'today':
      return {
        categories: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        cash:       cashHourly,
        card:       cardHourly,
        xLabel:     (v) => (parseInt(v) % 6 === 0 ? v : ''),
        xTooltip:   (v) => v,
      }
    case 'week':
      return {
        categories: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
        cash:       mockWeeklyCash,
        card:       mockWeeklyCard,
        xLabel:     (v) => v,
        xTooltip:   (v) => v,
      }
    case 'year':
      return {
        categories: MONTHS,
        cash:       mockYearlyCash,
        card:       mockYearlyCard,
        xLabel:     (v) => v,
        xTooltip:   (v) => v,
      }
    default: // month
      return {
        categories: Array.from({ length: 30 }, (_, i) => `${i + 1}`),
        cash:       mockMonthlyCash,
        card:       mockMonthlyCard,
        xLabel:     (v) => (Number(v) % 5 === 0 ? v : ''),
        xTooltip:   (v) => `${v}. Gün`,
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
    animations: { enabled: true, easing: 'easeinout', speed: 700 },
    fontFamily: 'inherit',
  },
  colors: ['#27AE60', '#3498DB'],
  stroke: { curve: 'smooth', width: 2.5 },
  fill: {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.03, stops: [0, 95, 100] },
  },
  dataLabels: { enabled: false },
  grid: { borderColor: '#f1f5f9', strokeDashArray: 5, padding: { left: 4, right: 4 } },
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
  try {
    data.value = (await api.dashboard()).data
  } catch (e) {
    console.error('[Dashboard] yükleme hatası:', e?.response?.status, e?.response?.data ?? e?.message)
    data.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
