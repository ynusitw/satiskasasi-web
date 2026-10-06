<template>
  <div class="p-8">
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="page-title">İndirim &amp; İkram</h1>
        <p class="page-subtitle">
          Kasada yönetici onayıyla yapılan indirim, ikram ve personel satışları
        </p>
        <p class="text-muted text-xs mt-1">
          {{ mode === 'current'
              ? 'Son Z raporundan bu yana — panodaki dönemin aynısı'
              : 'Seçilen tarih aralığı' }}
        </p>
      </div>

      <div class="flex flex-wrap items-end gap-2">
        <!-- Z Dönemi: panodaki ve kasadaki X raporundaki dönemin aynısı -->
        <div class="flex rounded-xl overflow-hidden border border-gray-200 mr-1">
          <button v-for="m in modes" :key="m.key" @click="setMode(m.key)"
                  class="px-3 py-2 text-xs font-semibold transition-all"
                  :class="mode === m.key
                    ? 'bg-accent text-white'
                    : 'bg-white text-muted hover:text-primary hover:bg-gray-50'">
            {{ m.label }}
          </button>
        </div>
        <label class="text-xs text-muted" :class="mode === 'current' ? 'opacity-40' : ''">
          Başlangıç
          <input v-model="from" type="date" :disabled="mode === 'current'"
                 class="block mt-1 px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
        </label>
        <label class="text-xs text-muted" :class="mode === 'current' ? 'opacity-40' : ''">
          Bitiş
          <input v-model="to" type="date" :disabled="mode === 'current'"
                 class="block mt-1 px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
        </label>
        <button @click="load" :disabled="loading"
                class="btn-primary disabled:opacity-50">
          {{ loading ? 'Yükleniyor...' : 'Getir' }}
        </button>
      </div>
    </div>

    <!-- Özet: türe tıklayınca liste o türe süzülür -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <button v-for="c in cards" :key="c.type" @click="toggleType(c.type)"
              class="text-left bg-white rounded-2xl shadow-sm p-5 border-2 transition-colors"
              :class="type === c.type ? 'border-accent' : 'border-transparent hover:border-gray-200'">
        <div class="text-[11px] font-semibold uppercase tracking-wider text-muted">{{ c.label }}</div>
        <div class="text-2xl font-semibold tracking-tight mt-1" :class="c.color">{{ fmt(c.total) }}</div>
        <div class="text-xs text-muted mt-1">{{ c.count }} işlem</div>
      </button>
    </div>

    <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>

    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div class="px-6 py-3 border-b border-gray-100 flex items-center justify-between text-sm">
        <span class="font-semibold text-primary">
          {{ type ? typeLabel(type) : 'Tüm işlemler' }}
          <span class="text-muted font-normal">({{ filtered.length }})</span>
        </span>
        <button v-if="type" @click="type = null" class="text-xs text-accent hover:underline">
          Filtreyi kaldır
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-4 py-3 text-[11px] font-semibold text-muted uppercase">Tarih</th>
              <th class="text-left px-4 py-3 text-[11px] font-semibold text-muted uppercase">Tür</th>
              <th class="text-left px-4 py-3 text-[11px] font-semibold text-muted uppercase">Ürün</th>
              <th class="text-right px-4 py-3 text-[11px] font-semibold text-muted uppercase">Adet</th>
              <th class="text-right px-4 py-3 text-[11px] font-semibold text-muted uppercase">Ciro Etkisi</th>
              <th class="text-left px-4 py-3 text-[11px] font-semibold text-muted uppercase">Kasiyer</th>
              <th class="text-left px-4 py-3 text-[11px] font-semibold text-muted uppercase">Onaylayan</th>
              <th class="text-left px-4 py-3 text-[11px] font-semibold text-muted uppercase">Açıklama</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in filtered" :key="r.id" class="border-t border-gray-50 hover:bg-gray-50">
              <td class="px-4 py-3 whitespace-nowrap text-muted">{{ dt(r.createdAt) }}</td>
              <td class="px-4 py-3">
                <span class="text-xs font-bold px-2.5 py-1 rounded-full" :class="badge(r.type)">
                  {{ typeLabel(r.type) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="font-semibold">{{ r.productName }}</span>
                <span v-if="r.variantName" class="text-muted"> ({{ r.variantName }})</span>
              </td>
              <td class="px-4 py-3 text-right">{{ r.type === 'Staff' ? '—' : qty(r.quantity) }}</td>
              <td class="px-4 py-3 text-right font-semibold text-red-600">−{{ fmt(r.amount) }}</td>
              <td class="px-4 py-3">{{ r.cashierName }}</td>
              <td class="px-4 py-3">{{ r.approvedBy || '—' }}</td>
              <td class="px-4 py-3 text-muted">{{ detail(r) }}</td>
            </tr>
            <tr v-if="!loading && filtered.length === 0">
              <td colspan="8" class="text-center py-12 text-muted">Bu aralıkta kayıt yok</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../api/api'

// Varsayılan aralık: son 7 gün
const iso = d => d.toISOString().slice(0, 10)
const today = new Date()
const from = ref(iso(new Date(today.getTime() - 6 * 86400000)))
const to   = ref(iso(today))

// Varsayılan görünüm Z dönemi: panoyla ve kasadaki X raporuyla aynı küme.
// Z alınınca bu liste de sıfırlanır.
const modes = [
  { key: 'current', label: 'Z Dönemi' },
  { key: 'range',   label: 'Tarih Aralığı' },
]
const mode = ref('current')

const rows    = ref([])
const summary = ref({})
const type    = ref(null)
const loading = ref(false)
const error   = ref('')

const cards = computed(() => [
  { type: 'Discount', label: 'İndirim',  total: summary.value.discountTotal, count: summary.value.discountCount, color: 'text-primary' },
  { type: 'Comp',     label: 'İkram',    total: summary.value.compTotal,     count: summary.value.compCount,     color: 'text-primary' },
  { type: 'Staff',    label: 'Personel', total: summary.value.staffTotal,    count: summary.value.staffCount,    color: 'text-primary' },
  // Liste fiyatının altında satılan satırlar (sunucudaki fiyat doğrulaması).
  // Fiyat güncellemesinden önce çevrimdışı yapılmış satışlar da buraya düşer.
  { type: 'PriceMismatch', label: 'Fiyat Farkı', total: summary.value.priceMismatchTotal,
    count: summary.value.priceMismatchCount, color: 'text-danger' },
])

const filtered = computed(() => type.value ? rows.value.filter(r => r.type === type.value) : rows.value)

function toggleType(t) { type.value = type.value === t ? null : t }

function setMode(m) {
  if (mode.value === m) return
  mode.value = m
  load()
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = mode.value === 'current'
      ? await api.getAdjustmentsReport({ period: 'current' })
      : await api.getAdjustmentsReport({ from: from.value, to: to.value })
    rows.value    = res.data.rows
    summary.value = res.data.summary
  } catch (e) {
    error.value = e.response?.data?.message || 'Rapor alınamadı.'
  } finally {
    loading.value = false
  }
}

const LABELS = { Discount: 'İndirim', Comp: 'İkram', Staff: 'Personel', PriceMismatch: 'Fiyat Farkı' }
const typeLabel = t => LABELS[t] || t
const badge = t => ({
  Discount: 'bg-amber-100 text-amber-700',
  Comp:     'bg-purple-100 text-purple-700',
  Staff:    'bg-blue-100 text-blue-700',
  PriceMismatch: 'bg-red-100 text-red-700',
}[t] || 'bg-gray-100 text-gray-600')

function detail(r) {
  if (r.type === 'Staff') return r.staffName ? `Personel: ${r.staffName}` : 'Personel'
  const parts = []
  if (r.type === 'Discount' && r.discountType === 'Percent') parts.push(`%${Number(r.discountValue)}`)
  if (r.type === 'Discount' && r.discountType === 'Amount')  parts.push(`${fmt(r.discountValue)} indirim`)
  if (r.reason) parts.push(r.reason)
  return parts.join(' · ') || '—'
}

const fmt = v => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0) + ' ₺'
const qty = v => Number(v).toLocaleString('tr-TR', { maximumFractionDigits: 3 })
const dt  = v => new Date(v).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })

onMounted(load)
</script>
