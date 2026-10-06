<template>
  <div class="p-6 lg:p-8 min-h-screen bg-bg">

    <!-- Başlık -->
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-primary">Reçete Merkezi</h1>
        <p class="text-muted text-sm mt-1">
          Soldan ürün seçin, sağdan hammaddelerini ekleyin. Satışta bu hammaddeler depodan düşer.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <span v-if="dirty" class="text-xs font-semibold text-amber-600">Kaydedilmemiş değişiklik var</span>
        <button @click="saveRecipe" :disabled="!selected || !dirty || saving"
                class="px-5 py-2 bg-accent text-white rounded-xl text-sm font-bold
                       hover:bg-blue-600 disabled:opacity-40 transition-colors">
          {{ saving ? 'Kaydediliyor...' : 'Reçeteyi Kaydet' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>

    <div class="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">

      <!-- ── SOL: ÜRÜNLER (%30) ──────────────────────────────────── -->
      <aside class="lg:col-span-3 bg-white rounded-2xl shadow-sm overflow-hidden">
        <div class="p-4 border-b border-gray-100">
          <input v-model="productSearch" placeholder="Ürün ara..."
                 class="w-full px-4 py-2 rounded-xl border border-gray-200
                        focus:border-accent focus:outline-none text-sm"/>
        </div>

        <div class="max-h-[70vh] overflow-y-auto">
          <div v-if="loading" class="p-6 text-center text-sm text-muted">Yükleniyor...</div>

          <button v-for="p in filteredProducts" :key="p.id" @click="selectProduct(p)"
                  class="w-full text-left px-4 py-3 border-b border-gray-50 transition-colors"
                  :class="selected?.id === p.id
                    ? 'bg-accent/10 border-l-4 border-l-accent'
                    : 'hover:bg-gray-50 border-l-4 border-l-transparent'">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-semibold text-primary truncate">{{ p.name }}</span>
              <span v-if="recipeCounts[p.id]"
                    class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700
                           flex-shrink-0">
                {{ recipeCounts[p.id] }} malzeme
              </span>
            </div>
            <div class="text-xs text-muted mt-0.5">
              {{ p.categoryName || 'Kategorisiz' }} · {{ money(p.price) }}
            </div>
          </button>

          <div v-if="!loading && !filteredProducts.length"
               class="p-6 text-center text-sm text-muted">Ürün bulunamadı</div>
        </div>
      </aside>

      <!-- ── SAĞ: REÇETE (%70) ───────────────────────────────────── -->
      <section class="lg:col-span-7">

        <!-- Ürün seçilmediyse -->
        <div v-if="!selected"
             class="bg-white rounded-2xl shadow-sm py-24 text-center select-none">
          <p class="text-sm font-semibold text-gray-400">Soldan bir ürün seçin</p>
          <p class="text-xs text-gray-300 mt-1">Seçtiğiniz ürünün reçetesi burada açılır.</p>
        </div>

        <div v-else class="bg-white rounded-2xl shadow-sm">
          <!-- Ürün başlığı + hammadde arama -->
          <div class="p-5 border-b border-gray-100 flex flex-wrap items-start justify-between gap-4">
            <div class="min-w-0">
              <h2 class="text-lg font-bold text-primary truncate">{{ selected.name }}</h2>
              <p class="text-xs text-muted mt-0.5">
                Satış fiyatı {{ money(scopePrice) }}
                <template v-if="totalCost > 0">
                  · maliyet {{ money(totalCost) }}
                  <span :class="marginClass">({{ marginLabel }})</span>
                </template>
              </p>
            </div>

            <!-- Hammadde arama + satır içi oluşturma -->
            <div class="relative w-full sm:w-80">
              <input v-model="ingredientSearch" @focus="searchOpen = true"
                     placeholder="Hammadde ara veya yeni ekle..."
                     class="w-full px-4 py-2 rounded-xl border border-gray-200
                            focus:border-accent focus:outline-none text-sm"/>

              <div v-if="searchOpen && ingredientSearch.trim()"
                   class="absolute z-20 mt-1 w-full bg-white rounded-xl shadow-lg
                          border border-gray-100 max-h-72 overflow-y-auto">
                <button v-for="i in searchResults" :key="i.id" @click="addIngredient(i)"
                        class="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors
                               flex items-center justify-between gap-2">
                  <span class="text-sm text-primary truncate">{{ i.name }}</span>
                  <span class="text-xs text-muted flex-shrink-0">
                    {{ i.unit }} · {{ money(i.costPerUnit) }}
                  </span>
                </button>

                <div v-if="!searchResults.length" class="px-4 py-2.5 text-xs text-muted">
                  Eşleşen hammadde yok.
                </div>

                <!-- Aranan hammadde yoksa buradan oluşturulur: kullanıcı
                     hammadde sayfasına gidip geri dönmek zorunda kalmasın. -->
                <button v-if="!exactMatch" @click="openCreateIngredient"
                        class="w-full text-left px-4 py-3 border-t border-gray-100
                               bg-accent/5 hover:bg-accent/10 transition-colors">
                  <span class="text-sm font-semibold text-accent">
                    + "{{ ingredientSearch.trim() }}" adıyla yeni hammadde oluştur
                  </span>
                </button>
              </div>
            </div>
          </div>

          <!-- Porsiyon sekmeleri: porsiyona özel reçete. Sekme boşsa satışta
               ana reçete kullanılır. -->
          <div v-if="variants.length" class="px-5 pt-4 flex flex-wrap gap-2">
            <button v-for="s in scopes" :key="s.key" @click="setScope(s.id)"
                    class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                    :class="scope === s.id
                      ? 'bg-accent text-white border-accent'
                      : 'bg-white text-muted border-gray-200 hover:border-accent hover:text-accent'">
              {{ s.label }}
              <span class="ml-1 opacity-70">{{ s.count ? `(${s.count})` : '' }}</span>
            </button>
          </div>

          <!-- Porsiyonun kendi reçetesi yoksa: ne olacağını söyle ve kopyalat -->
          <div v-if="scope !== null && !rows.length"
               class="mx-5 mt-4 p-4 rounded-xl bg-blue-50 text-sm text-accent">
            <p>
              <b>{{ scopeLabel }}</b> için ayrı reçete yok — satışta <b>ana reçete</b> kullanılır.
              Farklı miktar gerekiyorsa ana reçeteyi kopyalayıp düzenleyin.
            </p>
            <div class="flex items-center gap-2 mt-3">
              <span class="text-xs">Ana reçeteden kopyala ×</span>
              <input v-model.number="copyFactor" type="number" step="0.1" min="0.1"
                     class="w-20 px-2 py-1 border border-blue-200 rounded-lg text-sm text-primary"/>
              <button @click="copyFromBase" :disabled="!baseRecipe.length"
                      class="px-3 py-1 bg-accent text-white rounded-lg text-xs font-bold
                             hover:bg-blue-600 disabled:opacity-40">
                Kopyala
              </button>
              <span v-if="!baseRecipe.length" class="text-xs opacity-70">(ana reçete boş)</span>
            </div>
          </div>

          <!-- Reçete tablosu -->
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-left  px-5 py-3 text-xs font-bold text-muted uppercase">Hammadde</th>
                  <th class="text-right px-5 py-3 text-xs font-bold text-muted uppercase w-36">Miktar</th>
                  <th class="text-left  px-5 py-3 text-xs font-bold text-muted uppercase w-24">Birim</th>
                  <th class="text-right px-5 py-3 text-xs font-bold text-muted uppercase w-36">Satır Maliyeti</th>
                  <th class="px-5 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, idx) in rows" :key="r.ingredientId"
                    class="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td class="px-5 py-3">
                    <div class="text-sm font-semibold text-primary">{{ r.name }}</div>
                    <div class="text-xs text-muted">
                      Depoda {{ num(r.currentStock) }} {{ r.unit }}
                      <span v-if="r.currentStock <= 0" class="text-danger font-semibold">· stok yok</span>
                    </div>
                  </td>
                  <td class="px-5 py-3">
                    <input v-model.number="r.quantity" type="number" step="0.001" min="0"
                           @input="dirty = true"
                           class="w-full px-3 py-1.5 text-right border border-gray-200 rounded-lg
                                  focus:border-accent focus:outline-none text-sm"/>
                  </td>
                  <td class="px-5 py-3 text-sm text-muted">{{ r.unit }}</td>
                  <td class="px-5 py-3 text-sm text-right font-semibold text-primary">
                    {{ money(lineCost(r)) }}
                  </td>
                  <td class="px-5 py-3 text-center">
                    <button @click="removeRow(idx)" title="Satırı sil"
                            class="px-2 h-8 rounded-lg text-xs font-semibold text-danger hover:bg-red-50 transition-colors">Sil</button>
                  </td>
                </tr>

                <tr v-if="!rows.length">
                  <td colspan="5" class="px-5 py-12 text-center text-sm text-muted">
                    {{ scope === null
                        ? 'Bu ürünün reçetesi yok. Yukarıdaki kutudan hammadde arayıp ekleyin.'
                        : 'Bu porsiyonun kendi reçetesi yok. Hammadde ekleyin ya da ana reçeteden kopyalayın.' }}
                  </td>
                </tr>
              </tbody>

              <tfoot v-if="rows.length" class="bg-gray-50 border-t-2 border-gray-100">
                <tr>
                  <td colspan="3" class="px-5 py-4 text-sm font-bold text-primary">
                    Toplam Reçete Maliyeti
                  </td>
                  <td class="px-5 py-4 text-right text-lg font-bold text-primary">
                    {{ money(totalCost) }}
                  </td>
                  <td/>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Reçete varsa ürünün kendi stoğu düşmez: sürpriz olmasın -->
          <p v-if="rows.length" class="px-5 py-4 text-xs text-muted border-t border-gray-100">
            Reçete kaydedildiğinde bu ürün satıldığında <b>kendi stoğu değil</b>, buradaki
            hammaddeler depodan düşer.
          </p>
        </div>
      </section>
    </div>

    <!-- ── YENİ HAMMADDE MODALI ─────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="createModal.show"
           class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <h2 class="text-xl font-bold mb-1">Yeni Hammadde</h2>
          <p class="text-sm text-muted mb-6">
            Kaydedildiğinde <b>{{ selected?.name }}</b> reçetesine 1 birim olarak eklenir.
          </p>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-muted mb-1">Hammadde adı</label>
              <input v-model="createForm.name"
                     class="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm"/>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-muted mb-1">Birim tipi</label>
                <select v-model="createForm.unit"
                        class="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm">
                  <option value="gr">Gram</option>
                  <option value="kg">Kilogram</option>
                  <option value="ml">Mililitre</option>
                  <option value="lt">Litre</option>
                  <option value="adet">Adet</option>
                  <option value="porsiyon">Porsiyon</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-muted mb-1">Birim maliyeti (₺)</label>
                <input v-model.number="createForm.costPerUnit" type="number" step="0.0001" min="0"
                       class="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm"/>
              </div>
            </div>
          </div>

          <div v-if="createModal.error"
               class="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
            {{ createModal.error }}
          </div>

          <div class="flex gap-3 mt-6 justify-end">
            <button @click="createModal.show = false"
                    class="px-5 py-2 bg-gray-100 rounded-xl text-sm font-bold hover:bg-gray-200">
              Vazgeç
            </button>
            <button @click="createIngredient" :disabled="createModal.saving"
                    class="px-5 py-2 bg-accent text-white rounded-xl text-sm font-bold
                           hover:bg-blue-600 disabled:opacity-50">
              {{ createModal.saving ? 'Kaydediliyor...' : 'Kaydet ve Ekle' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '../api/api'

const products    = ref([])
const ingredients = ref([])
const loading = ref(true)
const saving  = ref(false)
const error   = ref('')

const productSearch    = ref('')
const ingredientSearch = ref('')
const searchOpen       = ref(false)

const selected = ref(null)

// Hangi reçete düzenleniyor: null = ana reçete, sayı = porsiyon (variant) id.
const scope = ref(null)
const copyFactor = ref(1)
// Seçili ürünün reçete satırları: hammadde bilgisi + miktar.
const rows  = ref([])
const dirty = ref(false)

// Sol listedeki "3 malzeme" rozeti — ürün listesinden gelir, kaydettikçe tazelenir.
const recipeCounts = ref({})

// ── Biçimlendirme ────────────────────────────────────────────────────────
function money(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}
function num(v) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 3 }).format(v ?? 0)
}

// ── Listeler ─────────────────────────────────────────────────────────────
const filteredProducts = computed(() => {
  const q = productSearch.value.trim().toLocaleLowerCase('tr')
  const list = q
    ? products.value.filter(p => p.name.toLocaleLowerCase('tr').includes(q))
    : products.value
  return list
})

// Zaten reçetede olan hammadde tekrar önerilmez.
const searchResults = computed(() => {
  const q = ingredientSearch.value.trim().toLocaleLowerCase('tr')
  if (!q) return []
  const used = new Set(rows.value.map(r => r.ingredientId))
  return ingredients.value
    .filter(i => !used.has(i.id) && i.name.toLocaleLowerCase('tr').includes(q))
    .slice(0, 8)
})

const exactMatch = computed(() => {
  const q = ingredientSearch.value.trim().toLocaleLowerCase('tr')
  return !!q && ingredients.value.some(i => i.name.toLocaleLowerCase('tr') === q)
})

// ── Maliyet ──────────────────────────────────────────────────────────────
function lineCost(r) {
  return (Number(r.quantity) || 0) * (r.costPerUnit || 0)
}

const totalCost = computed(() => rows.value.reduce((sum, r) => sum + lineCost(r), 0))

// Satış fiyatına göre kâr payı: maliyet girilmişse anlamlı.
const marginLabel = computed(() => {
  const price = scopePrice.value
  if (!price || !totalCost.value) return ''
  const margin = ((price - totalCost.value) / price) * 100
  return `kâr payı %${margin.toFixed(0)}`
})

const marginClass = computed(() => {
  const price = scopePrice.value
  if (!price || !totalCost.value) return ''
  return totalCost.value > price ? 'text-danger font-semibold' : 'text-success font-semibold'
})

// ── Yükleme ──────────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  try {
    const [p, i] = await Promise.all([api.getProductsAll(), api.getIngredients()])
    products.value    = p.data
    ingredients.value = i.data

    recipeCounts.value = Object.fromEntries(
      p.data.filter(x => (x.recipe || []).length).map(x => [x.id, x.recipe.length])
    )
    error.value = ''
  } catch (e) {
    error.value = e.response?.data?.message
      || 'Ürün ve hammadde listesi alınamadı. Stok modülü kapalı olabilir.'
  } finally {
    loading.value = false
  }
}
onMounted(load)

// ── Ürün seçimi ──────────────────────────────────────────────────────────
function selectProduct(p) {
  if (dirty.value && !confirm('Kaydedilmemiş reçete değişikliği var. Yine de geçilsin mi?')) return

  selected.value = p
  ingredientSearch.value = ''
  searchOpen.value = false
  dirty.value = false
  scope.value = null
  loadScopeRows()
}

// Ürün listesindeki reçete (ingredientId + quantity) hammadde bilgisiyle
// zenginleştirilir; yalnızca seçili kapsamın (ana / porsiyon) satırları.
function loadScopeRows() {
  rows.value = (selected.value?.recipe || [])
    .filter(r => (r.variantId ?? null) === scope.value)
    .map(r => buildRow(r.ingredientId, r.quantity))
    .filter(Boolean)
}

// ── Porsiyon kapsamı ─────────────────────────────────────────────────────
const variants = computed(() =>
  (selected.value?.variants || []).filter(v => v.isActive !== false))

const scopes = computed(() => {
  const recipe = selected.value?.recipe || []
  const count = (id) => recipe.filter(r => (r.variantId ?? null) === id).length
  return [
    { key: 'base', id: null, label: 'Ana reçete', count: count(null) },
    ...variants.value.map(v => ({ key: `v${v.id}`, id: v.id, label: v.name, count: count(v.id) })),
  ]
})

const scopeLabel = computed(() =>
  scopes.value.find(s => s.id === scope.value)?.label ?? 'Ana reçete')

// Kâr payı seçili porsiyonun fiyatıyla hesaplanır.
const scopePrice = computed(() => {
  if (scope.value === null) return selected.value?.price ?? 0
  return variants.value.find(v => v.id === scope.value)?.price ?? selected.value?.price ?? 0
})

const baseRecipe = computed(() =>
  (selected.value?.recipe || []).filter(r => r.variantId == null))

function setScope(id) {
  if (scope.value === id) return
  if (dirty.value && !confirm('Kaydedilmemiş değişiklik var. Yine de geçilsin mi?')) return
  scope.value = id
  dirty.value = false
  copyFactor.value = 1
  loadScopeRows()
}

// "1.5 Porsiyon" gibi durumlar için: ana reçete × katsayı.
function copyFromBase() {
  const factor = Number(copyFactor.value) || 1
  rows.value = baseRecipe.value
    .map(r => buildRow(r.ingredientId, Math.round(r.quantity * factor * 1000) / 1000))
    .filter(Boolean)
  dirty.value = true
}

function buildRow(ingredientId, quantity) {
  const ing = ingredients.value.find(i => i.id === ingredientId)
  if (!ing) return null
  return {
    ingredientId,
    name: ing.name,
    unit: ing.unit,
    costPerUnit: ing.costPerUnit,
    currentStock: ing.currentStock,
    quantity,
  }
}

// ── Reçete satırları ─────────────────────────────────────────────────────
function addIngredient(ing, quantity = 1) {
  if (rows.value.some(r => r.ingredientId === ing.id)) return
  rows.value.push(buildRow(ing.id, quantity))
  ingredientSearch.value = ''
  searchOpen.value = false
  dirty.value = true
}

function removeRow(idx) {
  rows.value.splice(idx, 1)
  dirty.value = true
}

async function saveRecipe() {
  if (!selected.value) return
  saving.value = true
  error.value = ''
  try {
    const items = rows.value
      .filter(r => Number(r.quantity) > 0)
      .map(r => ({ ingredientId: r.ingredientId, quantity: Number(r.quantity) }))

    await api.saveRecipe(selected.value.id, { variantId: scope.value, items })

    // Yerel kopyayı da tazele: yalnızca bu kapsamın satırları değişir.
    const others = (selected.value.recipe || []).filter(r => (r.variantId ?? null) !== scope.value)
    selected.value.recipe = [...others, ...items.map(i => ({ ...i, variantId: scope.value }))]
    recipeCounts.value = { ...recipeCounts.value, [selected.value.id]: selected.value.recipe.length }
    dirty.value = false
  } catch (e) {
    error.value = e.response?.data?.message || 'Reçete kaydedilemedi.'
  } finally {
    saving.value = false
  }
}

// ── Satır içi hammadde oluşturma ─────────────────────────────────────────
const createModal = reactive({ show: false, saving: false, error: '' })
const createForm  = reactive({ name: '', unit: 'gr', costPerUnit: 0 })

function openCreateIngredient() {
  createForm.name = ingredientSearch.value.trim()
  createForm.unit = 'gr'
  createForm.costPerUnit = 0
  createModal.error = ''
  createModal.show = true
}

async function createIngredient() {
  if (!createForm.name.trim()) { createModal.error = 'Hammadde adı gerekli.'; return }

  createModal.saving = true
  createModal.error = ''
  try {
    const res = await api.createIngredient({
      name: createForm.name.trim(),
      unit: createForm.unit,
      currentStock: 0,
      minimumStock: 0,
      costPerUnit: Number(createForm.costPerUnit) || 0,
      isActive: true,
    })

    const created = {
      id: res.data?.id,
      name: createForm.name.trim(),
      unit: createForm.unit,
      costPerUnit: Number(createForm.costPerUnit) || 0,
      currentStock: 0,
    }
    ingredients.value.push(created)

    // Yeni hammadde doğrudan reçeteye 1 birim olarak düşer.
    addIngredient(created, 1)
    createModal.show = false
  } catch (e) {
    createModal.error = e.response?.data?.message || 'Hammadde oluşturulamadı.'
  } finally {
    createModal.saving = false
  }
}
</script>
