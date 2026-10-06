<template>
  <div class="p-8">
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-primary">İptaller</h1>
        <p class="text-muted text-sm mt-1">Adisyondan silinen kalemler ve tümüyle iptal edilen masalar</p>
      </div>
      <DateRange v-model:from="from" v-model:to="to" :loading="loading" @apply="load"/>
    </div>

    <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>

    <!-- Özet: kartlara tıklayınca liste o türe süzülür -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <button v-for="c in cards" :key="c.type ?? 'all'" @click="type = c.type"
              class="text-left bg-white rounded-2xl shadow-sm p-5 border-2 transition-colors"
              :class="type === c.type ? 'border-accent' : 'border-transparent hover:border-gray-200'">
        <div class="text-xs font-bold uppercase tracking-wide text-muted">{{ c.label }}</div>
        <div class="text-2xl font-bold mt-1 text-danger">{{ money(c.amount) }}</div>
        <div class="text-xs text-muted mt-1">{{ c.count }} kayıt</div>
      </button>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
      <!-- Kasiyer -->
      <div class="bg-white rounded-2xl shadow-sm p-6">
        <h2 class="font-bold text-primary mb-4">Kasiyere Göre</h2>
        <div v-if="byCashier.length" class="space-y-3">
          <div v-for="c in byCashier" :key="c.cashier" class="flex items-center justify-between text-sm">
            <div>
              <div class="font-semibold text-primary">{{ c.cashier }}</div>
              <div class="text-xs text-muted">{{ c.count }} iptal</div>
            </div>
            <div class="font-bold text-danger">{{ money(c.amount) }}</div>
          </div>
        </div>
        <div v-else class="py-8 text-center text-sm text-muted">İptal yok</div>
      </div>

      <!-- En çok iptal edilen ürünler -->
      <div class="xl:col-span-2 bg-white rounded-2xl shadow-sm p-6">
        <h2 class="font-bold text-primary mb-4">En Çok İptal Edilen Ürünler</h2>
        <div v-if="byProduct.length" class="space-y-3">
          <div v-for="p in byProduct" :key="p.product">
            <div class="flex justify-between text-sm mb-1">
              <span class="font-semibold text-primary">{{ p.product }}</span>
              <span class="text-muted">{{ num(p.quantity) }} adet · {{ money(p.amount) }}</span>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full bg-red-400"
                   :style="{ width: barWidth(p.amount, byProduct[0].amount) }"/>
            </div>
          </div>
        </div>
        <div v-else class="py-8 text-center text-sm text-muted">İptal yok</div>
      </div>
    </div>

    <!-- Kayıtlar -->
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div class="max-h-[520px] overflow-y-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 sticky top-0">
            <tr>
              <th class="text-left  px-4 py-3 text-xs font-bold text-muted uppercase">Tarih</th>
              <th class="text-left  px-4 py-3 text-xs font-bold text-muted uppercase">Tür</th>
              <th class="text-left  px-4 py-3 text-xs font-bold text-muted uppercase">Masa</th>
              <th class="text-left  px-4 py-3 text-xs font-bold text-muted uppercase">Ürün</th>
              <th class="text-right px-4 py-3 text-xs font-bold text-muted uppercase">Adet</th>
              <th class="text-right px-4 py-3 text-xs font-bold text-muted uppercase">Tutar</th>
              <th class="text-left  px-4 py-3 text-xs font-bold text-muted uppercase">Kasiyer</th>
              <th class="text-left  px-4 py-3 text-xs font-bold text-muted uppercase">Sebep</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in filtered" :key="r.id" class="border-t border-gray-50">
              <td class="px-4 py-3 text-muted whitespace-nowrap">{{ dateTime(r.createdAt) }}</td>
              <td class="px-4 py-3">
                <span class="text-xs font-bold px-2.5 py-1 rounded-full"
                      :class="r.type === 'OrderCancel' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'">
                  {{ r.type === 'OrderCancel' ? 'Masa iptali' : 'Kalem silme' }}
                </span>
              </td>
              <td class="px-4 py-3 text-muted">{{ r.tableName || '—' }}</td>
              <td class="px-4 py-3">
                <div class="font-semibold text-primary">{{ r.productName }}</div>
                <div v-if="r.variantName" class="text-xs text-muted">{{ r.variantName }}</div>
              </td>
              <td class="px-4 py-3 text-right text-muted">{{ num(r.quantity) }}</td>
              <td class="px-4 py-3 text-right font-semibold text-danger">{{ money(r.amount) }}</td>
              <td class="px-4 py-3 text-muted">{{ r.cashierName || '—' }}</td>
              <td class="px-4 py-3 text-muted">{{ r.reason || '—' }}</td>
            </tr>
            <tr v-if="!loading && !filtered.length">
              <td colspan="8" class="text-center py-12 text-muted">Bu aralıkta iptal yok</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <p class="text-xs text-muted mt-6">
      Yalnızca sunucuya ulaşmış kalemler kayda geçer: kasada eklenip gönderilmeden silinen kalem
      hiç sipariş olmadığı için burada görünmez. Bu kayıt tutma, kasa güncellemesinden sonra başladı.
      Açıklamanın zorunlu olması Masa Ayarları'ndaki "İptal Açıklaması Zorunlu" ayarıyla açılır.
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../api/api'
import DateRange from '../../components/reports/DateRange.vue'

function iso(d) {
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
const today = new Date()
const from = ref(iso(new Date(today.getTime() - 6 * 864e5)))
const to   = ref(iso(today))

const summary   = ref({})
const rows      = ref([])
const byCashier = ref([])
const byProduct = ref([])
const type    = ref(null)
const loading = ref(false)
const error   = ref('')

function money(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}
function num(v) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 3 }).format(v ?? 0)
}
function dateTime(d) {
  return new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
function barWidth(v, max) {
  if (!max) return '0%'
  return Math.max(1, Math.round((v || 0) / max * 100)) + '%'
}

const cards = computed(() => [
  { type: null,          label: 'Toplam İptal', amount: summary.value.amount,       count: summary.value.count },
  { type: 'Void',        label: 'Kalem Silme',  amount: summary.value.voidAmount,   count: summary.value.voidCount },
  { type: 'OrderCancel', label: 'Masa İptali',  amount: summary.value.cancelAmount, count: summary.value.cancelCount },
])

const filtered = computed(() => type.value ? rows.value.filter(r => r.type === type.value) : rows.value)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.getCancellationsReport({ from: from.value, to: to.value })
    summary.value = data.summary
    rows.value = data.rows
    byCashier.value = data.byCashier
    byProduct.value = data.byProduct
  } catch (e) {
    error.value = e.response?.data?.message || 'Rapor alınamadı.'
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>
