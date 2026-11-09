<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="flex flex-wrap items-end justify-between gap-4 mb-5">
      <div>
        <h1 class="page-title">Analiz</h1>
        <p class="page-subtitle">Dönem karşılaştırma, yoğun saatler ve menüdeki ürünlerin durumu</p>
      </div>
    </div>

    <!-- Sekmeler -->
    <div class="flex gap-1.5 mb-6 overflow-x-auto no-scrollbar">
      <button v-for="t in tabs" :key="t.key" type="button" @click="setTab(t.key)"
              :class="tab === t.key ? 'chip-accent' : 'chip-neutral'" class="flex-shrink-0">
        {{ t.label }}
      </button>
    </div>

    <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>

    <!-- ══ DÖNEM KARŞILAŞTIRMA ══════════════════════════════════════════ -->
    <template v-if="tab === 'compare'">
      <div class="flex flex-wrap items-end gap-2 mb-5">
        <div class="flex rounded-xl overflow-hidden border border-gray-200">
          <button v-for="p in periods" :key="p.key" type="button" @click="period = p.key; loadCompare()"
                  class="px-3 py-2 text-xs font-semibold transition-all"
                  :class="period === p.key ? 'bg-accent text-white' : 'bg-white text-muted hover:text-primary hover:bg-gray-50'">
            {{ p.label }}
          </button>
        </div>
        <label class="text-xs text-muted">
          Tarih
          <input v-model="anchor" type="date" @change="loadCompare"
                 class="block mt-1 px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
        </label>
        <div v-if="cmp?.lastYear" class="flex rounded-xl overflow-hidden border border-gray-200">
          <button v-for="c in compareTargets" :key="c.key" type="button" @click="target = c.key"
                  class="px-3 py-2 text-xs font-semibold transition-all"
                  :class="target === c.key ? 'bg-accent text-white' : 'bg-white text-muted hover:text-primary hover:bg-gray-50'">
            {{ c.label }}
          </button>
        </div>
      </div>

      <div v-if="loading && !cmp" class="py-16 text-center text-sm text-muted">Yükleniyor...</div>
      <template v-else-if="cmp">
        <p class="text-sm text-muted mb-4">
          <b class="text-primary">{{ currentLabel }}</b> ({{ rangeText(cmp.current) }}) ile
          <b class="text-primary">{{ targetLabel }}</b> ({{ rangeText(base) }})
          <template v-if="cmp.partial"> — dönem sürüyor; karşılaştırma aynı ana kadar
            ({{ cutoffText(base) }}) alındı</template>
        </p>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div v-for="k in kpis" :key="k.label" class="stat-card bg-white rounded-2xl shadow-sm p-5">
            <div class="text-[11px] font-semibold uppercase tracking-wider text-muted">{{ k.label }}</div>
            <div class="stat-value text-primary mt-1">{{ k.value }}</div>
            <div class="text-xs mt-1 flex flex-wrap gap-x-1.5">
              <span v-if="k.delta != null" class="font-bold" :class="k.delta >= 0 ? 'text-success' : 'text-danger'">
                {{ k.delta >= 0 ? '▲' : '▼' }} %{{ fmt1(Math.abs(k.delta)) }}
              </span>
              <span v-else class="font-semibold text-muted">karşılaştırma yok</span>
              <span class="text-muted">· {{ targetShort }}: {{ k.before }}</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <div class="xl:col-span-2 bg-white rounded-2xl shadow-sm p-6">
            <h2 class="section-title mb-1">Ciro: {{ currentLabel.toLocaleLowerCase('tr') }} ve {{ targetLabel.toLocaleLowerCase('tr') }}</h2>
            <p class="text-xs text-muted mb-3">{{ bucketHint }}</p>
            <VueApexCharts v-if="hasSeries" type="line" height="280" :options="compareChart" :series="compareSeries"/>
            <div v-else class="py-16 text-center text-sm text-muted">İki dönemde de satış yok</div>
          </div>

          <div class="bg-white rounded-2xl shadow-sm p-6">
            <h2 class="section-title mb-4">Ödeme</h2>
            <div class="space-y-4">
              <div v-for="p in paymentRows" :key="p.label">
                <div class="flex justify-between text-sm mb-1">
                  <span class="font-semibold text-primary">{{ p.label }}</span>
                  <span class="text-muted">{{ money(p.now) }}</span>
                </div>
                <div class="text-xs text-muted">
                  {{ targetShort }}: {{ money(p.before) }}
                  <span v-if="change(p.now, p.before) != null" class="font-bold ml-1"
                        :class="change(p.now, p.before) >= 0 ? 'text-success' : 'text-danger'">
                    {{ change(p.now, p.before) >= 0 ? '▲' : '▼' }} %{{ fmt1(Math.abs(change(p.now, p.before))) }}
                  </span>
                </div>
              </div>
              <div class="pt-3 border-t border-gray-100 text-xs text-muted">
                İndirim: {{ money(cmp.current.discount) }} · {{ targetShort }}: {{ money(base.discount) }}
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100">
            <h2 class="section-title">Ürünler</h2>
            <p class="text-xs text-muted mt-0.5">Bu dönemin en çok ciro yapan 15 ürünü ve önceki dönemle farkı</p>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-left  px-5 py-2.5 text-[11px] font-semibold text-muted uppercase">Ürün</th>
                  <th class="text-right px-5 py-2.5 text-[11px] font-semibold text-muted uppercase">Adet</th>
                  <th class="text-right px-5 py-2.5 text-[11px] font-semibold text-muted uppercase">Ciro</th>
                  <th class="text-right px-5 py-2.5 text-[11px] font-semibold text-muted uppercase whitespace-nowrap">Önceki adet</th>
                  <th class="text-right px-5 py-2.5 text-[11px] font-semibold text-muted uppercase whitespace-nowrap">Önceki ciro</th>
                  <th class="text-right px-5 py-2.5 text-[11px] font-semibold text-muted uppercase">Değişim</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in cmp.products" :key="p.product" class="border-t border-gray-50">
                  <td class="px-5 py-2.5 font-semibold text-primary">{{ p.product }}</td>
                  <td class="px-5 py-2.5 text-right text-muted">{{ num(p.quantity) }}</td>
                  <td class="px-5 py-2.5 text-right font-semibold text-primary whitespace-nowrap">{{ money(p.revenue) }}</td>
                  <td class="px-5 py-2.5 text-right text-muted">{{ num(p.prevQuantity) }}</td>
                  <td class="px-5 py-2.5 text-right text-muted whitespace-nowrap">{{ money(p.prevRevenue) }}</td>
                  <td class="px-5 py-2.5 text-right font-bold whitespace-nowrap"
                      :class="change(p.revenue, p.prevRevenue) == null ? 'text-muted' : change(p.revenue, p.prevRevenue) >= 0 ? 'text-success' : 'text-danger'">
                    <template v-if="change(p.revenue, p.prevRevenue) == null">{{ p.prevRevenue ? '—' : 'yeni' }}</template>
                    <template v-else>{{ change(p.revenue, p.prevRevenue) >= 0 ? '▲' : '▼' }} %{{ fmt1(Math.abs(change(p.revenue, p.prevRevenue))) }}</template>
                  </td>
                </tr>
                <tr v-if="!cmp.products.length">
                  <td colspan="6" class="text-center py-10 text-muted">Satış yok</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <p class="text-xs text-muted mt-4">
          Personel satışları ciroya katılmaz; iade fişleri ciroyu düşürür, fiş sayısına girmez.
          Önceki dönemin ürünleri "Önceki" sütunlarında, yalnız bu dönemle aynı süre kadarı sayılır.
        </p>
      </template>
    </template>

    <!-- ══ YOĞUNLUK HARİTASI ═══════════════════════════════════════════ -->
    <template v-else-if="tab === 'heatmap'">
      <div class="flex flex-wrap items-end justify-between gap-3 mb-5">
        <DateRange v-model:from="hFrom" v-model:to="hTo" :loading="loading" @apply="loadHeatmap"/>
        <div class="flex rounded-xl overflow-hidden border border-gray-200">
          <button v-for="m in heatMetrics" :key="m.key" type="button" @click="heatMetric = m.key"
                  class="px-3 py-2 text-xs font-semibold transition-all"
                  :class="heatMetric === m.key ? 'bg-accent text-white' : 'bg-white text-muted hover:text-primary hover:bg-gray-50'">
            {{ m.label }}
          </button>
        </div>
      </div>

      <div v-if="loading && !heat" class="py-16 text-center text-sm text-muted">Yükleniyor...</div>
      <template v-else-if="heat">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div class="stat-card bg-white rounded-2xl shadow-sm p-5">
            <div class="text-[11px] font-semibold uppercase tracking-wider text-muted">En yoğun saat</div>
            <div class="stat-value text-primary mt-1">{{ heat.peak ? `${dayNames[heat.peak.day]} ${hourLabel(heat.peak.hour)}` : '—' }}</div>
            <div v-if="heat.peak" class="text-xs text-muted mt-1">ortalama {{ money(heat.peak.revenue) }} ciro</div>
          </div>
          <div class="stat-card bg-white rounded-2xl shadow-sm p-5">
            <div class="text-[11px] font-semibold uppercase tracking-wider text-muted">En yoğun gün</div>
            <div class="stat-value text-primary mt-1">{{ busiestDay != null ? dayNames[busiestDay] : '—' }}</div>
            <div v-if="busiestDay != null" class="text-xs text-muted mt-1">günde ortalama {{ money(heat.dayAverage[busiestDay]) }}</div>
          </div>
          <div class="stat-card bg-white rounded-2xl shadow-sm p-5">
            <div class="text-[11px] font-semibold uppercase tracking-wider text-muted">En sakin gün</div>
            <div class="stat-value text-primary mt-1">{{ quietestDay != null ? dayNames[quietestDay] : '—' }}</div>
            <div v-if="quietestDay != null" class="text-xs text-muted mt-1">günde ortalama {{ money(heat.dayAverage[quietestDay]) }}</div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm p-6">
          <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h2 class="section-title">Gün × saat</h2>
              <p class="text-xs text-muted mt-0.5">
                {{ heatMetric === 'revenue' ? 'O gün ve saatte ortalama ciro' : 'O gün ve saatte ortalama fiş sayısı' }}
                ({{ rangeText({ from: heat.from, to: heat.to }) }}; her gün kaç kez geçtiyse ona bölünür)
              </p>
            </div>
            <div class="flex items-center gap-2 text-[11px] text-muted">
              <span>az</span>
              <span v-for="c in heatSteps" :key="c" class="w-5 h-3 rounded-sm" :style="{ background: c }"></span>
              <span>çok</span>
            </div>
          </div>

          <div v-if="!hours.length" class="py-16 text-center text-sm text-muted">Bu aralıkta satış yok</div>
          <div v-else class="overflow-x-auto">
            <table class="heat border-separate" style="border-spacing: 2px">
              <thead>
                <tr>
                  <th></th>
                  <th v-for="h in hours" :key="h" class="text-[10.5px] font-semibold text-muted px-0.5 pb-1">{{ String(h).padStart(2, '0') }}</th>
                  <th class="text-[10.5px] font-semibold text-muted pl-3 pb-1 text-right">Günlük ort.</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(name, d) in dayNames" :key="d">
                  <td class="text-xs font-semibold text-primary pr-2 whitespace-nowrap">{{ name }}</td>
                  <td v-for="h in hours" :key="h" class="heat-cell" :style="{ background: cellColor(d, h) }"
                      :title="cellTitle(d, h)" @mouseenter="hover = { d, h }" @mouseleave="hover = null"></td>
                  <td class="text-xs text-muted pl-3 text-right whitespace-nowrap">{{ money(heat.dayAverage[d]) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs mt-3 min-h-[18px]" :class="hover ? 'text-primary font-semibold' : 'text-muted'">
            {{ hover ? cellTitle(hover.d, hover.h) : 'Ayrıntı için bir kutunun üstüne gelin.' }}
          </p>
        </div>
      </template>
    </template>

    <!-- ══ MENÜ ANALİZİ ════════════════════════════════════════════════ -->
    <template v-else>
      <div class="flex flex-wrap items-end justify-between gap-3 mb-5">
        <DateRange v-model:from="mFrom" v-model:to="mTo" :loading="loading" @apply="loadMenu"/>
      </div>

      <div v-if="loading && !menu" class="py-16 text-center text-sm text-muted">Yükleniyor...</div>
      <template v-else-if="menu">
        <div class="mb-5 p-4 rounded-2xl text-sm"
             :class="menu.basis === 'margin' ? 'bg-blue-50 text-blue-900' : 'bg-amber-50 border border-amber-200 text-amber-900'">
          <template v-if="menu.basis === 'margin'">
            Ürünler satış adedine ve <b>birim kârına</b> (fiyat − reçete maliyeti) göre dört gruba ayrıldı.
            Maliyeti bilinen ürünlerin cirodaki payı: %{{ fmt1(menu.costedShare) }}.
          </template>
          <template v-else>
            Reçetesi (maliyeti) tanımlı ürünlerin cirodaki payı yalnız %{{ fmt1(menu.costedShare) }}; bu yüzden
            kâr yerine <b>ortalama satış fiyatı</b> kullanıldı. Daha doğru sonuç için Reçeteler'den ürün maliyetlerini girin.
          </template>
          Çok satan: satış payı ürün başına ortalamanın %70'i ya da üstü (%{{ fmt1(menu.popularThreshold) }}).
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div v-for="q in quadrants" :key="q.key" class="bg-white rounded-2xl shadow-sm p-5">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[15px] font-bold text-primary flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" :style="{ background: q.color }"></span>{{ q.label }}
              </span>
              <span class="text-xs font-semibold text-muted">{{ byClass(q.key).length }} ürün</span>
            </div>
            <div class="text-xs text-muted mt-1">{{ q.what }} — <b class="text-primary">{{ q.todo }}</b></div>
            <div v-if="byClass(q.key).length" class="flex flex-wrap gap-1.5 mt-3">
              <span v-for="r in byClass(q.key).slice(0, 12)" :key="rowKey(r)" class="chip-neutral">
                {{ rowName(r) }} · {{ num(r.quantity) }}
              </span>
              <span v-if="byClass(q.key).length > 12" class="text-xs text-muted self-center">+{{ byClass(q.key).length - 12 }}</span>
            </div>
            <div v-else class="text-xs text-muted mt-3">Bu grupta ürün yok</div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <h2 class="section-title">Tüm ürünler</h2>
            <input v-model="menuSearch" placeholder="Ürün ara..."
                   class="px-3 py-1.5 rounded-lg border border-gray-200 text-[13.5px] w-48 bg-white"/>
          </div>
          <div class="overflow-x-auto max-h-[520px] overflow-y-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 sticky top-0">
                <tr>
                  <th class="text-left  px-5 py-2.5 text-[11px] font-semibold text-muted uppercase">Ürün</th>
                  <th class="text-left  px-5 py-2.5 text-[11px] font-semibold text-muted uppercase">Grup</th>
                  <th class="text-right px-5 py-2.5 text-[11px] font-semibold text-muted uppercase">Adet</th>
                  <th class="text-right px-5 py-2.5 text-[11px] font-semibold text-muted uppercase">Pay</th>
                  <th class="text-right px-5 py-2.5 text-[11px] font-semibold text-muted uppercase">Ciro</th>
                  <th class="text-right px-5 py-2.5 text-[11px] font-semibold text-muted uppercase whitespace-nowrap">Ort. fiyat</th>
                  <th class="text-right px-5 py-2.5 text-[11px] font-semibold text-muted uppercase whitespace-nowrap">Birim kâr</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in filteredMenu" :key="rowKey(r)" class="border-t border-gray-50">
                  <td class="px-5 py-2.5">
                    <div class="font-semibold text-primary">{{ rowName(r) }}</div>
                    <div class="text-xs text-muted">{{ r.category }}</div>
                  </td>
                  <td class="px-5 py-2.5 whitespace-nowrap">
                    <span v-if="r.class" class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <span class="w-2 h-2 rounded-full" :style="{ background: quadrant(r.class).color }"></span>{{ quadrant(r.class).label }}
                    </span>
                    <span v-else class="text-xs text-muted">maliyet yok</span>
                  </td>
                  <td class="px-5 py-2.5 text-right text-muted">{{ num(r.quantity) }}</td>
                  <td class="px-5 py-2.5 text-right text-muted">%{{ fmt1(r.share) }}</td>
                  <td class="px-5 py-2.5 text-right font-semibold text-primary whitespace-nowrap">{{ money(r.revenue) }}</td>
                  <td class="px-5 py-2.5 text-right text-muted whitespace-nowrap">{{ money(r.averagePrice) }}</td>
                  <td class="px-5 py-2.5 text-right whitespace-nowrap" :class="r.unitMargin == null ? 'text-muted' : 'text-primary'">
                    {{ r.unitMargin == null ? '—' : money(r.unitMargin) }}
                  </td>
                </tr>
                <tr v-if="!filteredMenu.length">
                  <td colspan="7" class="text-center py-10 text-muted">Satış yok</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueApexCharts from 'vue3-apexcharts'
import api from '../../api/api'
import DateRange from '../../components/reports/DateRange.vue'

const route = useRoute()
const router = useRouter()

const tabs = [
  { key: 'compare', label: 'Dönem Karşılaştırma' },
  { key: 'heatmap', label: 'Yoğunluk Haritası' },
  { key: 'menu',    label: 'Menü Analizi' },
]
const tab = ref(tabs.some(t => t.key === route.query.sekme) ? route.query.sekme : 'compare')
const loading = ref(false)
const error = ref('')

function setTab(key) {
  tab.value = key
  router.replace({ query: { ...route.query, sekme: key } })
  error.value = ''
  if (key === 'compare' && !cmp.value) loadCompare()
  if (key === 'heatmap' && !heat.value) loadHeatmap()
  if (key === 'menu' && !menu.value) loadMenu()
}

// ── Biçim ──────────────────────────────────────────────────────────────
const money = v => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
const num = v => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(v ?? 0)
const fmt1 = v => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(v ?? 0)
const iso = d => {
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
const shortDate = v => new Date(v).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const rangeText = b => {
  const a = shortDate(b.from), z = shortDate(b.to)
  return a === z ? a : `${a} – ${z}`
}
const cutoffText = b => new Date(b.cutoff).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
// Önceki değer 0 ise yüzde anlamsız (null)
const change = (now, before) => before > 0 ? (now - before) / before * 100 : null

// ── Dönem karşılaştırma ────────────────────────────────────────────────
const periods = [
  { key: 'day', label: 'Gün' }, { key: 'week', label: 'Hafta' },
  { key: 'month', label: 'Ay' }, { key: 'year', label: 'Yıl' },
]
const period = ref('week')
const anchor = ref(iso(new Date()))
const target = ref('previous')
const compareTargets = [{ key: 'previous', label: 'Önceki dönem' }, { key: 'lastYear', label: 'Geçen yıl' }]
const cmp = ref(null)

const NAMES = {
  day:   ['Bu gün', 'Önceki gün', 'Geçen yıl aynı gün'],
  week:  ['Bu hafta', 'Geçen hafta', 'Geçen yıl aynı hafta'],
  month: ['Bu ay', 'Geçen ay', 'Geçen yıl aynı ay'],
  year:  ['Bu yıl', 'Geçen yıl', ''],
}
const isToday = computed(() => anchor.value === iso(new Date()))
const currentLabel = computed(() => {
  if (isToday.value) return NAMES[period.value][0]
  return { day: 'Seçilen gün', week: 'Seçilen hafta', month: 'Seçilen ay', year: 'Seçilen yıl' }[period.value]
})
const useLastYear = computed(() => target.value === 'lastYear' && !!cmp.value?.lastYear)
const base = computed(() => useLastYear.value ? cmp.value.lastYear : cmp.value.previous)
const targetLabel = computed(() => useLastYear.value ? NAMES[period.value][2]
  : isToday.value ? NAMES[period.value][1] : 'Önceki dönem')
const targetShort = computed(() => useLastYear.value ? 'geçen yıl' : 'önceki')

const kpis = computed(() => {
  const c = cmp.value.current, b = base.value
  const avg = x => x.receipts ? x.revenue / x.receipts : 0
  return [
    { label: 'Ciro', value: money(c.revenue), before: money(b.revenue), delta: change(c.revenue, b.revenue) },
    { label: 'Fiş', value: num(c.receipts), before: num(b.receipts), delta: change(c.receipts, b.receipts) },
    { label: 'Ortalama fiş', value: money(avg(c)), before: money(avg(b)), delta: change(avg(c), avg(b)) },
    { label: 'Satılan ürün', value: num(c.items), before: num(b.items), delta: change(c.items, b.items) },
  ]
})
const paymentRows = computed(() => [
  { label: 'Nakit', now: cmp.value.current.cash, before: base.value.cash },
  { label: 'Kredi kartı', now: cmp.value.current.card, before: base.value.card },
])

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']
const bucketLabels = computed(() => {
  const n = cmp.value?.buckets ?? 0
  switch (period.value) {
    case 'day': return Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`)
    case 'week': return ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
    case 'month': return Array.from({ length: n }, (_, i) => String(i + 1))
    default: return MONTHS
  }
})
const bucketHint = computed(() => ({ day: 'Saat saat', week: 'Gün gün', month: 'Ayın günlerine göre', year: 'Ay ay' })[period.value]
  + (cmp.value?.partial ? '; bu dönemin gelmemiş kısmı boş' : ''))

const now = new Date()
const compareSeries = computed(() => {
  const n = bucketLabels.value.length
  const cur = cmp.value.current.series.slice(0, n)
  // Gelecekteki kovalar boş kalsın (sıfır çizgisi düşüş gibi görünmesin)
  const curShown = cur.map((v, i) => {
    if (!cmp.value.partial) return v
    const from = new Date(cmp.value.current.from)
    const at = period.value === 'day' ? new Date(from.getTime() + i * 3600e3)
      : period.value === 'year' ? new Date(from.getFullYear(), i, 1)
      : new Date(from.getFullYear(), from.getMonth(), from.getDate() + i)
    return at > now ? null : v
  })
  return [
    { name: currentLabel.value, data: curShown },
    { name: targetLabel.value, data: base.value.series.slice(0, n) },
  ]
})
const hasSeries = computed(() => compareSeries.value.some(s => s.data.some(v => v)))
// Doğrulanmış iki renk (açık / koyu temada CVD ayrımı geçer): mavi = seçilen dönem, turuncu = karşılaştırılan
const compareChart = computed(() => ({
  chart: { toolbar: { show: false }, fontFamily: 'inherit', zoom: { enabled: false } },
  colors: ['#2a78d6', '#eb6834'],
  stroke: { width: 2, curve: 'straight', dashArray: [0, 5] },
  markers: { size: 4, strokeWidth: 2, strokeColors: '#fff', hover: { size: 6 } },
  dataLabels: { enabled: false },
  legend: { position: 'top', horizontalAlign: 'left', fontSize: '12px', labels: { colors: '#64748b' } },
  grid: { borderColor: 'rgba(100,116,139,0.14)', strokeDashArray: 4 },
  xaxis: { categories: bucketLabels.value, labels: { style: { colors: '#94a3b8' }, rotate: 0, hideOverlappingLabels: true },
           tooltip: { enabled: false } },
  yaxis: { labels: { style: { colors: '#94a3b8' }, formatter: v => money(v) } },
  tooltip: { shared: true, intersect: false, y: { formatter: v => v == null ? '—' : money(v) } },
}))

async function loadCompare() {
  loading.value = true
  error.value = ''
  try {
    cmp.value = (await api.getAnalysisCompare({ period: period.value, date: anchor.value })).data
    if (!cmp.value.lastYear) target.value = 'previous'
  } catch (e) {
    error.value = e.response?.data?.message || 'Karşılaştırma alınamadı.'
  } finally {
    loading.value = false
  }
}

// ── Yoğunluk haritası ──────────────────────────────────────────────────
const hTo = ref(iso(new Date()))
const hFrom = ref(iso(new Date(Date.now() - 55 * 864e5)))
const heat = ref(null)
const heatMetric = ref('revenue')
const heatMetrics = [{ key: 'revenue', label: 'Ciro' }, { key: 'receipts', label: 'Fiş' }]
const hover = ref(null)
// Tek renk, açıktan koyuya (sıralı ölçek); boş kutu nötr gri
const heatSteps = ['#86b6ef', '#6da7ec', '#5598e7', '#3987e5', '#2a78d6', '#1c5cab', '#104281']
const heatValues = computed(() => heatMetric.value === 'revenue' ? heat.value.averageRevenue : heat.value.averageReceipts)
const heatMax = computed(() => Math.max(0, ...heatValues.value.flat()))
// Satış olan saatler (gece boş saatler gösterilmez)
const hours = computed(() => {
  if (!heat.value) return []
  const used = [...Array(24).keys()].filter(h => heat.value.receipts.some(row => row[h] > 0))
  if (!used.length) return []
  const lo = Math.min(...used), hi = Math.max(...used)
  return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
})
const hourLabel = h => `${String(h).padStart(2, '0')}:00`
function cellColor(d, h) {
  const v = heatValues.value[d][h]
  if (!v || !heatMax.value) return 'rgba(148,163,184,0.12)'
  const i = Math.min(heatSteps.length - 1, Math.floor(v / heatMax.value * heatSteps.length))
  return heatSteps[i]
}
function cellTitle(d, h) {
  const n = heat.value.dayCounts[d]
  return `${dayNames[d]} ${hourLabel(h)}–${hourLabel(h + 1)} · ortalama ${money(heat.value.averageRevenue[d][h])} ciro, `
    + `${fmt1(heat.value.averageReceipts[d][h])} fiş (${n} ${dayNames[d].toLocaleLowerCase('tr')} günü)`
}
const busiestDay = computed(() => {
  const a = heat.value?.dayAverage ?? []
  const max = Math.max(0, ...a)
  return max > 0 ? a.indexOf(max) : null
})
const quietestDay = computed(() => {
  const a = (heat.value?.dayAverage ?? []).map((v, i) => ({ v, i })).filter(x => x.v > 0 && heat.value.dayCounts[x.i] > 0)
  return a.length > 1 ? a.reduce((m, x) => x.v < m.v ? x : m).i : null
})

async function loadHeatmap() {
  loading.value = true
  error.value = ''
  try {
    heat.value = (await api.getAnalysisHeatmap({ from: hFrom.value, to: hTo.value })).data
  } catch (e) {
    error.value = e.response?.data?.message || 'Yoğunluk haritası alınamadı.'
  } finally {
    loading.value = false
  }
}

// ── Menü analizi ───────────────────────────────────────────────────────
const mTo = ref(iso(new Date()))
const mFrom = ref(iso(new Date(Date.now() - 29 * 864e5)))
const menu = ref(null)
const menuSearch = ref('')
const quadrants = [
  { key: 'Star',      label: 'Yıldız',  color: '#1baf7a', what: 'Çok satıyor, kârlı',      todo: 'koruyun, menüde öne çıkarın' },
  { key: 'Plowhorse', label: 'Emektar', color: '#eda100', what: 'Çok satıyor, kârı düşük', todo: 'fiyatı ya da maliyeti gözden geçirin' },
  { key: 'Puzzle',    label: 'Fırsat',  color: '#2a78d6', what: 'Az satıyor, kârlı',       todo: 'garsona önerin, menüde görünür yere alın' },
  { key: 'Dog',       label: 'Zayıf',   color: '#94a3b8', what: 'Az satıyor, kârı düşük',  todo: 'değiştirin ya da menüden çıkarmayı düşünün' },
]
const quadrant = key => quadrants.find(q => q.key === key)
const byClass = key => (menu.value?.rows ?? []).filter(r => r.class === key)
const rowName = r => r.variant ? `${r.product} (${r.variant})` : r.product
const rowKey = r => `${r.product}|${r.variant ?? ''}`
const filteredMenu = computed(() => {
  const q = menuSearch.value.trim().toLocaleLowerCase('tr')
  const rows = menu.value?.rows ?? []
  return q ? rows.filter(r => rowName(r).toLocaleLowerCase('tr').includes(q)) : rows
})

async function loadMenu() {
  loading.value = true
  error.value = ''
  try {
    menu.value = (await api.getAnalysisMenu({ from: mFrom.value, to: mTo.value })).data
  } catch (e) {
    error.value = e.response?.data?.message || 'Menü analizi alınamadı.'
  } finally {
    loading.value = false
  }
}

onMounted(() => setTab(tab.value))
</script>

<style scoped>
.heat-cell { width: 26px; min-width: 26px; height: 24px; border-radius: 4px; cursor: default; }
.heat-cell:hover { outline: 2px solid currentColor; outline-offset: -1px; }
.no-scrollbar { scrollbar-width: none; }
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>
