<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="page-title">Çeşni & Ekstra Seçimler</h1>
        <p class="page-subtitle">
          Kasada satış anında sorulan seçimler. Ürün düzenleme ekranından ürünlere bağlanır.
        </p>
      </div>
      <button @click="openCreate"
              class="px-4 py-2 bg-accent text-white rounded-lg text-sm font-bold
                     hover:bg-blue-600 transition-colors">
        + Yeni Grup
      </button>
    </div>

    <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>

    <div v-if="loading" class="bg-white rounded-2xl shadow-sm py-16 text-center text-muted">
      Yükleniyor...
    </div>

    <div v-else-if="groups.length === 0"
         class="bg-white rounded-2xl shadow-sm py-16 text-center">
      <p class="text-sm font-semibold text-gray-400">Henüz çeşni grubu yok.</p>
      <p class="text-xs text-gray-300 mt-1">
        Örnek: "Hamur Tipi" (zorunlu, tek seçim) ya da "Ekstra Malzemeler" (opsiyonel, çoklu seçim).
      </p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div v-for="g in groups" :key="g.id" class="bg-white rounded-2xl shadow-sm p-5">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="font-bold text-primary">{{ g.name }}</div>
            <div class="text-xs text-muted mt-0.5">{{ ruleLabel(g) }}</div>
            <div class="text-xs text-muted mt-0.5">
              {{ g.productCount ? `${g.productCount} üründe kullanılıyor` : 'Henüz ürüne bağlı değil' }}
              <span v-if="!g.isActive" class="text-danger font-semibold"> · Pasif</span>
            </div>
          </div>
          <div class="flex gap-2 flex-shrink-0">
            <button @click="openEdit(g)"
                    class="px-3 py-1 text-xs font-bold bg-blue-50 text-accent rounded-lg
                           hover:bg-accent hover:text-white transition-colors">
              Düzenle
            </button>
            <button @click="remove(g)"
                    class="px-3 py-1 text-xs font-bold bg-red-50 text-danger rounded-lg
                           hover:bg-danger hover:text-white transition-colors">
              Sil
            </button>
          </div>
        </div>

        <div class="mt-3 flex flex-wrap gap-1.5">
          <span v-for="o in g.options" :key="o.id"
                class="text-xs px-2 py-1 rounded-lg bg-gray-50 text-muted">
            {{ o.name }}<template v-if="o.priceDelta"> · +{{ money(o.priceDelta) }}</template>
          </span>
          <span v-if="!g.options.length" class="text-xs text-muted">Seçenek yok</span>
        </div>
      </div>
    </div>

    <!-- Grup formu -->
    <Teleport to="body">
      <div v-if="modal.show"
           class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-8 max-h-[90vh] overflow-y-auto">
          <h2 class="text-xl font-bold mb-1">{{ modal.editing ? 'Grubu Düzenle' : 'Yeni Çeşni Grubu' }}</h2>
          <p class="text-sm text-muted mb-6">Kasada bu grup satış anında sorulur</p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input v-model="form.name" placeholder="Grup adı * (Hamur Tipi)"
                   class="sm:col-span-3 px-4 py-2 border border-gray-200 rounded-xl text-sm"/>
            <div>
              <label class="block text-xs font-semibold text-muted mb-1">En az seçim</label>
              <input v-model.number="form.minSelect" type="number" min="0"
                     class="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm"/>
            </div>
            <div>
              <label class="block text-xs font-semibold text-muted mb-1">En çok seçim</label>
              <input v-model.number="form.maxSelect" type="number" min="1"
                     class="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm"/>
            </div>
            <div class="flex items-end">
              <label class="flex items-center gap-2 cursor-pointer pb-2">
                <input v-model="form.isActive" type="checkbox" class="w-4 h-4"/>
                <span class="text-sm font-semibold">Aktif</span>
              </label>
            </div>
          </div>
          <p class="text-xs text-muted mt-2">{{ ruleLabel(form) }}</p>

          <!-- Seçenekler -->
          <div class="mt-6">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-bold text-primary">Seçenekler</h3>
              <button @click="addOption" class="text-xs font-bold text-accent hover:underline">
                + Seçenek ekle
              </button>
            </div>

            <div v-if="!form.options.length" class="text-sm text-muted py-3">
              Henüz seçenek yok.
            </div>

            <div v-for="(o, idx) in form.options" :key="o._key"
                 class="border border-gray-100 rounded-xl p-3 mb-2">
              <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <input v-model="o.name" placeholder="Seçenek adı"
                       class="sm:col-span-5 px-3 py-2 border border-gray-200 rounded-lg text-sm"/>
                <div class="sm:col-span-3">
                  <input v-model.number="o.priceDelta" type="number" step="0.01"
                         placeholder="Fiyat farkı ₺"
                         class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"/>
                </div>
                <label class="sm:col-span-3 flex items-center gap-2 text-xs cursor-pointer">
                  <input v-model="o.isDefault" type="checkbox" class="w-4 h-4"/>
                  Varsayılan seçili
                </label>
                <button @click="form.options.splice(idx, 1)"
                        class="sm:col-span-1 text-danger text-sm font-bold hover:underline">
                  Sil
                </button>
              </div>

              <!-- Stok bağı: seçim depoyu etkiliyorsa -->
              <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 mt-2 items-center">
                <select v-model="o.stockKind"
                        class="sm:col-span-4 px-3 py-2 border border-gray-200 rounded-lg text-xs">
                  <option value="none">Stoğu etkilemez</option>
                  <option value="ingredient">Hammadde düşsün</option>
                  <option value="product">Ürün düşsün</option>
                </select>

                <select v-if="o.stockKind === 'ingredient'" v-model.number="o.ingredientId"
                        class="sm:col-span-5 px-3 py-2 border border-gray-200 rounded-lg text-xs">
                  <option :value="null" disabled>Hammadde seçin</option>
                  <option v-for="i in ingredients" :key="i.id" :value="i.id">
                    {{ i.name }} ({{ i.unit }})
                  </option>
                </select>

                <select v-if="o.stockKind === 'product'" v-model.number="o.linkedProductId"
                        class="sm:col-span-5 px-3 py-2 border border-gray-200 rounded-lg text-xs">
                  <option :value="null" disabled>Ürün seçin</option>
                  <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>

                <input v-if="o.stockKind !== 'none'" v-model.number="o.stockQuantity"
                       type="number" step="0.001" placeholder="Miktar"
                       class="sm:col-span-3 px-3 py-2 border border-gray-200 rounded-lg text-xs"/>
              </div>
            </div>
          </div>

          <div v-if="modalError" class="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
            {{ modalError }}
          </div>

          <div class="flex gap-3 mt-6 justify-end">
            <button @click="modal.show = false"
                    class="px-5 py-2 bg-gray-100 rounded-xl text-sm font-bold hover:bg-gray-200">
              Vazgeç
            </button>
            <button @click="save" :disabled="saving"
                    class="px-5 py-2 bg-accent text-white rounded-xl text-sm font-bold
                           hover:bg-blue-600 disabled:opacity-50">
              {{ saving ? 'Kaydediliyor...' : 'Kaydet' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../api/api'

const groups      = ref([])
const ingredients = ref([])
const products    = ref([])
const loading = ref(true)
const saving  = ref(false)
const error   = ref('')
const modalError = ref('')

const modal = reactive({ show: false, editing: false, id: null })
const form  = reactive({ name: '', minSelect: 0, maxSelect: 1, isActive: true, options: [] })

let nextKey = 1

function money(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}

// Kasadaki davranışı tek cümlede anlatır: sayılar soyut kalmasın.
function ruleLabel(g) {
  const min = g.minSelect ?? 0
  const max = g.maxSelect ?? 1
  if (min > 0 && max === 1) return 'Zorunlu, tek seçim'
  if (min > 0)              return `Zorunlu, en az ${min} en çok ${max} seçim`
  if (max === 1)            return 'İsteğe bağlı, tek seçim'
  return `İsteğe bağlı, en çok ${max} seçim`
}

async function load() {
  loading.value = true
  try {
    const [g, p] = await Promise.all([api.getModifierGroups(true), api.getProducts()])
    groups.value   = g.data
    products.value = p.data

    // Hammadde listesi stok modülüne bağlı; yoksa seçenekler yalnızca
    // ürüne bağlanabilir, sayfa yine çalışır.
    try { ingredients.value = (await api.getIngredients()).data } catch { ingredients.value = [] }
    error.value = ''
  } catch (e) {
    error.value = e.response?.data?.message || 'Çeşni grupları alınamadı.'
  } finally {
    loading.value = false
  }
}
onMounted(load)

function blankOption() {
  return {
    id: 0, _key: nextKey++, name: '', priceDelta: 0, isDefault: false, isActive: true,
    stockKind: 'none', ingredientId: null, linkedProductId: null, stockQuantity: 1,
  }
}

function addOption() { form.options.push(blankOption()) }

function openCreate() {
  Object.assign(form, { name: '', minSelect: 0, maxSelect: 1, isActive: true, options: [blankOption()] })
  modal.editing = false
  modal.id = null
  modalError.value = ''
  modal.show = true
}

function openEdit(g) {
  Object.assign(form, {
    name: g.name, minSelect: g.minSelect, maxSelect: g.maxSelect, isActive: g.isActive,
    options: g.options.map(o => ({
      ...o,
      _key: nextKey++,
      stockKind: o.ingredientId ? 'ingredient' : o.linkedProductId ? 'product' : 'none',
      stockQuantity: o.ingredientId ? o.ingredientQuantity : o.linkedProductQuantity,
    })),
  })
  modal.editing = true
  modal.id = g.id
  modalError.value = ''
  modal.show = true
}

// Gönderilen liste seçeneklerin yeni hâlidir; sunucu eksikleri siler.
function payload() {
  return {
    name: form.name.trim(),
    minSelect: Number(form.minSelect) || 0,
    maxSelect: Math.max(1, Number(form.maxSelect) || 1),
    isActive: form.isActive,
    options: form.options
      .filter(o => (o.name || '').trim())
      .map(o => ({
        id: o.id || 0,
        name: o.name.trim(),
        priceDelta: Number(o.priceDelta) || 0,
        isDefault: !!o.isDefault,
        isActive: o.isActive !== false,
        ingredientId: o.stockKind === 'ingredient' ? o.ingredientId : null,
        ingredientQuantity: o.stockKind === 'ingredient' ? Number(o.stockQuantity) || 0 : 0,
        linkedProductId: o.stockKind === 'product' ? o.linkedProductId : null,
        linkedProductQuantity: o.stockKind === 'product' ? Number(o.stockQuantity) || 1 : 1,
      })),
  }
}

async function save() {
  const body = payload()
  if (!body.name) { modalError.value = 'Grup adı gerekli.'; return }
  if (!body.options.length) { modalError.value = 'En az bir seçenek ekleyin.'; return }
  if (body.minSelect > body.maxSelect) {
    modalError.value = 'En az seçim, en çok seçimden büyük olamaz.'
    return
  }

  saving.value = true
  modalError.value = ''
  try {
    if (modal.editing) await api.updateModifierGroup(modal.id, body)
    else               await api.createModifierGroup(body)
    modal.show = false
    await load()
  } catch (e) {
    modalError.value = e.response?.data?.message || 'Kaydedilemedi.'
  } finally {
    saving.value = false
  }
}

async function remove(g) {
  if (!confirm(`"${g.name}" grubu silinsin mi?` +
      (g.productCount ? `\n\n${g.productCount} üründeki bağı da kalkar.` : ''))) return
  try {
    await api.deleteModifierGroup(g.id)
    await load()
  } catch (e) {
    alert(e.response?.data?.message || 'Silinemedi.')
  }
}
</script>
