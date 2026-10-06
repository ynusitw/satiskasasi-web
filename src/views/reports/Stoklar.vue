<template>
  <div class="p-8">
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-primary">Stoklar</h1>
        <p class="text-muted text-sm mt-1">Ürün ve hammadde stok durumu, son hareketler</p>
      </div>
      <button @click="load" :disabled="loading"
              class="px-4 py-2 bg-accent text-white rounded-xl text-sm font-bold hover:bg-blue-600 disabled:opacity-50">
        {{ loading ? 'Yükleniyor...' : 'Yenile' }}
      </button>
    </div>

    <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>

    <!-- Özet: kartlara tıklayınca liste o duruma süzülür -->
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <button v-for="k in kpis" :key="k.key" @click="setFilter(k)"
              class="text-left bg-white rounded-2xl shadow-sm p-5 border-2 transition-colors"
              :class="filter === k.key ? 'border-accent' : 'border-transparent hover:border-gray-200'">
        <div class="text-xs font-bold uppercase tracking-wide text-muted">{{ k.label }}</div>
        <div class="text-2xl font-bold mt-1" :class="k.tone">{{ k.value }}</div>
      </button>
    </div>

    <!-- Sekmeler -->
    <div class="flex gap-1 mb-4 border-b border-gray-200">
      <button v-for="t in tabs" :key="t.key" @click="tab = t.key"
              class="px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors"
              :class="tab === t.key ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-primary'">
        {{ t.label }}
      </button>
    </div>

    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div v-if="tab !== 'moves'" class="px-6 py-3 border-b border-gray-100 flex items-center gap-3">
        <input v-model="search" placeholder="Ara..."
               class="px-3 py-1.5 rounded-lg border border-gray-200 text-sm w-56"/>
        <span v-if="filter !== 'all'" class="text-xs text-accent font-semibold">
          {{ filterLabel }} gösteriliyor ·
          <button @click="filter = 'all'" class="underline">tümü</button>
        </span>
      </div>

      <!-- ÜRÜNLER -->
      <div v-if="tab === 'products'" class="max-h-[560px] overflow-y-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 sticky top-0">
            <tr>
              <th class="text-left  px-5 py-3 text-xs font-bold text-muted uppercase">Ürün</th>
              <th class="text-left  px-5 py-3 text-xs font-bold text-muted uppercase">Kategori</th>
              <th class="text-right px-5 py-3 text-xs font-bold text-muted uppercase">Stok</th>
              <th class="text-right px-5 py-3 text-xs font-bold text-muted uppercase">Kritik</th>
              <th class="text-left  px-5 py-3 text-xs font-bold text-muted uppercase">Durum</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filteredProducts" :key="p.id" class="border-t border-gray-50">
              <td class="px-5 py-3 font-semibold text-primary">{{ p.name }}</td>
              <td class="px-5 py-3 text-muted">{{ p.category }}</td>
              <td class="px-5 py-3 text-right" :class="tracked(p) ? 'font-semibold text-primary' : 'text-muted'">
                {{ tracked(p) ? num(p.currentStock) : '—' }}
              </td>
              <td class="px-5 py-3 text-right text-muted">{{ tracked(p) && p.minimumStock ? num(p.minimumStock) : '—' }}</td>
              <td class="px-5 py-3">
                <span class="text-xs font-bold px-2.5 py-1 rounded-full" :class="productStatus(p).cls">
                  {{ productStatus(p).label }}
                </span>
              </td>
            </tr>
            <tr v-if="!filteredProducts.length">
              <td colspan="5" class="text-center py-10 text-muted">Kayıt yok</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- HAMMADDELER -->
      <div v-else-if="tab === 'ingredients'" class="max-h-[560px] overflow-y-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 sticky top-0">
            <tr>
              <th class="text-left  px-5 py-3 text-xs font-bold text-muted uppercase">Hammadde</th>
              <th class="text-right px-5 py-3 text-xs font-bold text-muted uppercase">Stok</th>
              <th class="text-right px-5 py-3 text-xs font-bold text-muted uppercase">Kritik</th>
              <th class="text-right px-5 py-3 text-xs font-bold text-muted uppercase">Birim Maliyet</th>
              <th class="text-right px-5 py-3 text-xs font-bold text-muted uppercase">Stok Değeri</th>
              <th class="text-left  px-5 py-3 text-xs font-bold text-muted uppercase">Durum</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="i in filteredIngredients" :key="i.id" class="border-t border-gray-50">
              <td class="px-5 py-3 font-semibold text-primary">{{ i.name }}</td>
              <td class="px-5 py-3 text-right font-semibold text-primary">{{ num(i.currentStock) }} {{ i.unit }}</td>
              <td class="px-5 py-3 text-right text-muted">{{ i.minimumStock ? num(i.minimumStock) + ' ' + i.unit : '—' }}</td>
              <td class="px-5 py-3 text-right text-muted">{{ money(i.costPerUnit) }}</td>
              <td class="px-5 py-3 text-right text-primary">{{ money(i.value) }}</td>
              <td class="px-5 py-3">
                <span class="text-xs font-bold px-2.5 py-1 rounded-full" :class="ingredientStatus(i).cls">
                  {{ ingredientStatus(i).label }}
                </span>
              </td>
            </tr>
            <tr v-if="!filteredIngredients.length">
              <td colspan="6" class="text-center py-10 text-muted">Kayıt yok</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- SON HAREKETLER -->
      <div v-else class="max-h-[560px] overflow-y-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 sticky top-0">
            <tr>
              <th class="text-left  px-5 py-3 text-xs font-bold text-muted uppercase">Tarih</th>
              <th class="text-left  px-5 py-3 text-xs font-bold text-muted uppercase">Kalem</th>
              <th class="text-left  px-5 py-3 text-xs font-bold text-muted uppercase">Hareket</th>
              <th class="text-right px-5 py-3 text-xs font-bold text-muted uppercase">Miktar</th>
              <th class="text-right px-5 py-3 text-xs font-bold text-muted uppercase">Kalan</th>
              <th class="text-left  px-5 py-3 text-xs font-bold text-muted uppercase">Açıklama</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(m, idx) in movements" :key="idx" class="border-t border-gray-50">
              <td class="px-5 py-2.5 text-muted whitespace-nowrap">{{ dateTime(m.date) }}</td>
              <td class="px-5 py-2.5">
                <div class="font-semibold text-primary">{{ m.name }}</div>
                <div class="text-xs text-muted">{{ m.kind }}</div>
              </td>
              <td class="px-5 py-2.5 text-muted">{{ moveLabel(m.type) }}</td>
              <td class="px-5 py-2.5 text-right font-semibold"
                  :class="m.quantity < 0 ? 'text-danger' : 'text-success'">
                {{ m.quantity > 0 ? '+' : '' }}{{ num(m.quantity) }}
              </td>
              <td class="px-5 py-2.5 text-right text-muted">{{ num(m.stockAfter) }}</td>
              <td class="px-5 py-2.5 text-muted truncate max-w-[14rem]">{{ m.note }}</td>
            </tr>
            <tr v-if="!movements.length">
              <td colspan="6" class="text-center py-10 text-muted">Hareket yok</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <p class="text-xs text-muted mt-6">
      Reçeteli ve menü ürünlerinde stok ürünün kendisinden değil, hammaddeden düşer; bu ürünler
      "Hammaddeden" olarak işaretlidir.
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../api/api'

const s           = ref({})
const products    = ref([])
const ingredients = ref([])
const movements   = ref([])
const loading = ref(false)
const error   = ref('')

const tab    = ref('products')
const filter = ref('all')
const search = ref('')

const tabs = [
  { key: 'products',    label: 'Ürünler' },
  { key: 'ingredients', label: 'Hammaddeler' },
  { key: 'moves',       label: 'Son Hareketler' },
]

function money(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}
function num(v) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 3 }).format(v ?? 0)
}
function dateTime(d) {
  return new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
function moveLabel(t) {
  return { Sale: 'Satış', Purchase: 'Giriş', Waste: 'Fire', Adjustment: 'Sayım', In: 'Giriş', Out: 'Çıkış' }[t] || t
}

// Reçeteli / menü üründe ürünün kendi stoğu tutulmuyor.
const tracked = (p) => !p.hasRecipe && !p.isCombo

function productStatus(p) {
  if (!tracked(p))                                    return { key: 'recipe', label: 'Hammaddeden', cls: 'bg-blue-50 text-accent' }
  if (p.currentStock <= 0)                            return { key: 'out',    label: 'Tükendi',     cls: 'bg-red-100 text-red-700' }
  if (p.minimumStock > 0 && p.currentStock <= p.minimumStock) return { key: 'critical', label: 'Kritik', cls: 'bg-amber-100 text-amber-700' }
  return { key: 'ok', label: 'Normal', cls: 'bg-green-100 text-green-700' }
}

function ingredientStatus(i) {
  if (i.currentStock <= 0)                                     return { key: 'out',      label: 'Tükendi', cls: 'bg-red-100 text-red-700' }
  if (i.minimumStock > 0 && i.currentStock <= i.minimumStock)  return { key: 'critical', label: 'Kritik',  cls: 'bg-amber-100 text-amber-700' }
  return { key: 'ok', label: 'Normal', cls: 'bg-green-100 text-green-700' }
}

const kpis = computed(() => [
  { key: 'all',       tab: 'products',    label: 'Aktif Ürün',        value: s.value.products ?? 0,  tone: 'text-primary' },
  { key: 'out',       tab: 'products',    label: 'Tükenen Ürün',      value: s.value.outOfStock ?? 0, tone: (s.value.outOfStock ?? 0) ? 'text-danger' : 'text-muted' },
  { key: 'critical',  tab: 'products',    label: 'Kritik Ürün',       value: s.value.critical ?? 0,   tone: (s.value.critical ?? 0) ? 'text-amber-600' : 'text-muted' },
  { key: 'icritical', tab: 'ingredients', label: 'Kritik Hammadde',   value: s.value.criticalIngredients ?? 0,
    tone: (s.value.criticalIngredients ?? 0) ? 'text-amber-600' : 'text-muted' },
  { key: 'ivalue',    tab: 'ingredients', label: 'Hammadde Değeri',   value: money(s.value.ingredientValue), tone: 'text-primary' },
])

const filterLabel = computed(() => kpis.value.find(k => k.key === filter.value)?.label ?? '')

function setFilter(k) {
  tab.value = k.tab
  filter.value = filter.value === k.key ? 'all' : k.key
}

const q = computed(() => search.value.trim().toLocaleLowerCase('tr'))

const filteredProducts = computed(() => products.value.filter(p => {
  if (q.value && !p.name.toLocaleLowerCase('tr').includes(q.value)) return false
  if (filter.value === 'out')      return productStatus(p).key === 'out'
  if (filter.value === 'critical') return productStatus(p).key === 'critical'
  return true
}))

const filteredIngredients = computed(() => ingredients.value.filter(i => {
  if (q.value && !i.name.toLocaleLowerCase('tr').includes(q.value)) return false
  if (filter.value === 'icritical') return ['critical', 'out'].includes(ingredientStatus(i).key)
  return true
}))

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.getStockReport()
    s.value = data.summary
    products.value = data.products
    ingredients.value = data.ingredients
    movements.value = data.movements
  } catch (e) {
    error.value = e.response?.data?.message || 'Rapor alınamadı.'
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>
