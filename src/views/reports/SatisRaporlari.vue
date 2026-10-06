<template>
  <div class="p-8">
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="page-title">Satış Raporları</h1>
        <p class="page-subtitle">Gün, saat, ödeme, kasiyer, kategori ve ürün kırılımı</p>
      </div>
      <DateRange v-model:from="from" v-model:to="to" :loading="loading" @apply="load"/>
    </div>

    <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>

    <!-- Özet -->
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <div v-for="k in kpis" :key="k.label" class="bg-white rounded-2xl shadow-sm p-5">
        <div class="text-[11px] font-semibold uppercase tracking-wider text-muted">{{ k.label }}</div>
        <div class="text-2xl font-semibold tracking-tight mt-1" :class="k.tone">{{ k.value }}</div>
        <div v-if="k.hint" class="text-xs text-muted mt-1">{{ k.hint }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
      <!-- Günlük ciro -->
      <div class="xl:col-span-2 bg-white rounded-2xl shadow-sm p-6">
        <h2 class="section-title mb-4">Günlük Ciro</h2>
        <VueApexCharts v-if="days.some(d => d.revenue)" type="bar" height="260"
                       :options="dayChart" :series="[{ name: 'Ciro', data: days.map(d => d.revenue) }]"/>
        <div v-else class="py-16 text-center text-sm text-muted">Bu aralıkta satış yok</div>
      </div>

      <!-- Ödeme türleri -->
      <div class="bg-white rounded-2xl shadow-sm p-6">
        <h2 class="section-title mb-4">Ödeme Türleri</h2>
        <div class="space-y-4">
          <div v-for="p in payments" :key="p.label">
            <div class="flex justify-between text-sm mb-1">
              <span class="font-semibold text-primary">{{ p.label }}</span>
              <span class="text-muted">{{ money(p.value) }} · {{ pct(p.value, s.revenue) }}</span>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full" :class="p.color"
                   :style="{ width: barWidth(p.value, s.revenue) }"/>
            </div>
          </div>
        </div>
        <p class="text-xs text-muted mt-4">
          Parçalı ödemeler nakit ve kart paylarına bölünür. Veresiye satışlar tahsil edilmediği için
          nakit/kartta değil, yalnızca veresiyede sayılır; üçü ciroyu tam böler.
          <template v-if="s.compOrders"><br>{{ s.compOrders }} hesap tümüyle ikram edildi.</template>
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
      <!-- Saatlik yoğunluk -->
      <div class="xl:col-span-2 bg-white rounded-2xl shadow-sm p-6">
        <h2 class="section-title mb-1">Saatlik Yoğunluk</h2>
        <p class="text-xs text-muted mb-4">Seçilen günlerin toplamı — personel planlaması için</p>
        <VueApexCharts v-if="hours.some(h => h.count)" type="bar" height="240"
                       :options="hourChart" :series="[{ name: 'İşlem', data: hours.map(h => h.count) }]"/>
        <div v-else class="py-16 text-center text-sm text-muted">Bu aralıkta satış yok</div>
      </div>

      <!-- Kasiyer -->
      <div class="bg-white rounded-2xl shadow-sm p-6">
        <h2 class="section-title mb-4">Kasiyer</h2>
        <div v-if="byUser.length" class="space-y-3">
          <div v-for="u in byUser" :key="u.user" class="flex items-center justify-between text-sm">
            <div>
              <div class="font-semibold text-primary">{{ u.user }}</div>
              <div class="text-xs text-muted">{{ u.count }} işlem · {{ money(u.discount) }} indirim</div>
            </div>
            <div class="font-bold text-primary">{{ money(u.revenue) }}</div>
          </div>
        </div>
        <div v-else class="py-10 text-center text-sm text-muted">Veri yok</div>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- Kategori -->
      <div class="bg-white rounded-2xl shadow-sm p-6">
        <h2 class="section-title mb-4">Kategori</h2>
        <div v-if="byCategory.length" class="space-y-4">
          <div v-for="c in byCategory" :key="c.category">
            <div class="flex justify-between text-sm mb-1">
              <span class="font-semibold text-primary">{{ c.category }}</span>
              <span class="text-muted">{{ money(c.revenue) }} · {{ num(c.quantity) }} adet</span>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full bg-accent"
                   :style="{ width: barWidth(c.revenue, byCategory[0].revenue) }"/>
            </div>
          </div>
        </div>
        <div v-else class="py-10 text-center text-sm text-muted">Veri yok</div>
      </div>

      <!-- Ürünler -->
      <div class="xl:col-span-2 bg-white rounded-2xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <h2 class="section-title">Ürünler</h2>
          <input v-model="productSearch" placeholder="Ürün ara..."
                 class="px-3 py-1.5 rounded-lg border border-gray-200 text-[13.5px] w-48 bg-white"/>
        </div>
        <div class="max-h-[440px] overflow-y-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th class="text-left  px-5 py-2.5 text-[11px] font-semibold text-muted uppercase">Ürün</th>
                <th class="text-left  px-5 py-2.5 text-[11px] font-semibold text-muted uppercase">Kategori</th>
                <th class="text-right px-5 py-2.5 text-[11px] font-semibold text-muted uppercase">Adet</th>
                <th class="text-right px-5 py-2.5 text-[11px] font-semibold text-muted uppercase">Ciro</th>
                <th class="text-right px-5 py-2.5 text-[11px] font-semibold text-muted uppercase">Pay</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in filteredProducts" :key="p.product" class="border-t border-gray-50">
                <td class="px-5 py-2.5 font-semibold text-primary">{{ p.product }}</td>
                <td class="px-5 py-2.5 text-muted">{{ p.category }}</td>
                <td class="px-5 py-2.5 text-right text-muted">{{ num(p.quantity) }}</td>
                <td class="px-5 py-2.5 text-right font-semibold text-primary">{{ money(p.revenue) }}</td>
                <td class="px-5 py-2.5 text-right text-muted">{{ pct(p.revenue, productTotal) }}</td>
              </tr>
              <tr v-if="!filteredProducts.length">
                <td colspan="5" class="text-center py-10 text-muted">Satış yok</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <p class="text-xs text-muted mt-6">
      Ciro Z raporuyla aynı ölçütle hesaplanır: personel satışları dahil değildir.
      Ürün ve kategori cirosu satır indirimleri düşülmüş tutardır; fiş geneli indirim satırlara dağıtılmaz.
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import api from '../../api/api'
import DateRange from '../../components/reports/DateRange.vue'

function iso(d) {
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
const today = new Date()
const from = ref(iso(new Date(today.getTime() - 6 * 864e5)))
const to   = ref(iso(today))

const s          = ref({})
const days       = ref([])
const hours      = ref([])
const byUser     = ref([])
const byCategory = ref([])
const byProduct  = ref([])
const loading = ref(false)
const error   = ref('')
const productSearch = ref('')

function money(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}
function num(v) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 3 }).format(v ?? 0)
}
function pct(v, total) {
  if (!total) return '—'
  return '%' + new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format((v || 0) / total * 100)
}
function barWidth(v, max) {
  if (!max) return '0%'
  return Math.max(1, Math.round((v || 0) / max * 100)) + '%'
}

const kpis = computed(() => [
  { label: 'Ciro',         value: money(s.value.revenue),       tone: 'text-primary' },
  { label: 'İşlem',        value: s.value.count ?? 0,           tone: 'text-primary' },
  { label: 'Ortalama Fiş', value: money(s.value.averageTicket), tone: 'text-primary' },
  { label: 'İndirim',      value: money(s.value.discount),      tone: 'text-danger' },
  { label: 'Personel',     value: money(s.value.staffConsumption), tone: 'text-muted',
    hint: `${s.value.staffCount ?? 0} işlem · ciroya dahil değil` },
])

const payments = computed(() => [
  { label: 'Nakit',           value: s.value.cash, color: 'bg-emerald-500' },
  { label: 'Kredi Kartı',     value: s.value.card, color: 'bg-blue-500' },
  { label: 'Veresiye (cari)', value: s.value.cari, color: 'bg-amber-500' },
])

const productTotal = computed(() => byProduct.value.reduce((a, p) => a + p.revenue, 0))

const filteredProducts = computed(() => {
  const q = productSearch.value.trim().toLocaleLowerCase('tr')
  return q ? byProduct.value.filter(p => p.product.toLocaleLowerCase('tr').includes(q)) : byProduct.value
})

const baseChart = {
  chart: { toolbar: { show: false }, fontFamily: 'inherit' },
  dataLabels: { enabled: false },
  plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
  grid: { borderColor: 'rgba(100,116,139,0.14)', strokeDashArray: 4 },
  yaxis: { labels: { style: { colors: '#94a3b8' } } },
}

const dayChart = computed(() => ({
  ...baseChart,
  colors: ['#2563EB'],
  xaxis: {
    categories: days.value.map(d =>
      new Date(d.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })),
    labels: { style: { colors: '#94a3b8' } },
  },
  yaxis: { labels: { style: { colors: '#94a3b8' }, formatter: v => money(v) } },
  tooltip: { y: { formatter: v => money(v) } },
}))

const hourChart = computed(() => ({
  ...baseChart,
  colors: ['#60A5FA'],
  xaxis: {
    categories: hours.value.map(h => `${h.hour}:00`),
    labels: { style: { colors: '#94a3b8' } },
  },
  tooltip: { y: { formatter: v => `${v} işlem` } },
}))

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.getSalesReport({ from: from.value, to: to.value })
    s.value = data.summary
    days.value = data.days
    hours.value = data.hours
    byUser.value = data.byUser
    byCategory.value = data.byCategory
    byProduct.value = data.byProduct
  } catch (e) {
    error.value = e.response?.data?.message || 'Rapor alınamadı.'
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>
