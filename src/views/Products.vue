<template>
  <div class="p-6 lg:p-8">

    <!-- Başlık -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-primary">Ürün Düzenleme</h1>
      <p class="text-muted text-sm mt-1">Kategori ve ürün yönetimi</p>
    </div>

    <!-- ── İki Sütun Layout ──────────────────────────────────────────── -->
    <div class="flex gap-5 items-start">

      <!-- ── Sol Kart: Kategoriler ──────────────────────────────────── -->
      <div class="w-60 flex-shrink-0 bg-white rounded-xl shadow-sm overflow-hidden">

        <!-- Başlık + Yeni Grup -->
        <div class="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <span class="text-sm font-bold text-primary">Kategoriler</span>
          <button @click="openExistingCategoryModal()"
                  class="flex items-center gap-1 text-xs font-semibold text-accent
                         hover:bg-accent/10 px-2 py-1 rounded-lg transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
            </svg>
            Yeni Grup
          </button>
        </div>

        <!-- Tüm Ürünler -->
        <button @click="selectedCategoryId = null"
                class="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors
                       border-l-4"
                :class="selectedCategoryId === null
                  ? 'bg-accent/8 border-accent text-accent font-semibold'
                  : 'border-transparent text-muted hover:bg-gray-50 hover:text-primary'">
          <span class="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0"/>
          <span class="flex-1 text-left truncate">Tüm Ürünler</span>
          <span class="text-xs font-bold ml-1">{{ products.length }}</span>
        </button>

        <!-- Kategori Listesi -->
        <div v-if="loading" class="py-6 text-center text-xs text-muted">Yükleniyor...</div>

        <div v-else class="divide-y divide-gray-50">
          <div v-for="cat in categories" :key="cat.id"
               class="group flex items-center gap-0 border-l-4 transition-colors"
               :class="selectedCategoryId === cat.id
                 ? 'bg-accent/8 border-accent'
                 : 'border-transparent hover:bg-gray-50'">

            <!-- Kategori seçme alanı -->
            <button @click="selectedCategoryId = cat.id"
                    class="flex-1 flex items-center gap-3 px-4 py-3 text-sm text-left min-w-0">
              <span class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    :style="{ background: cat.colorHex || '#94a3b8' }"/>
              <span class="truncate flex-1"
                    :class="selectedCategoryId === cat.id
                      ? 'text-accent font-semibold'
                      : 'text-primary'">
                {{ cat.name }}
              </span>
              <span class="text-xs text-muted ml-1 flex-shrink-0">
                {{ products.filter(p => p.categoryId === cat.id).length }}
              </span>
            </button>

            <!-- Düzenle + Sil ikonları -->
            <div class="flex items-center pr-1 gap-0.5 flex-shrink-0">
              <button @click="openExistingCategoryModal(cat)"
                      title="Düzenle"
                      class="p-1.5 rounded-md text-muted hover:text-accent hover:bg-accent/10
                             transition-colors">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                           m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </button>
              <button @click="deleteCat(cat)"
                      title="Sil"
                      class="p-1.5 rounded-md text-muted hover:text-danger hover:bg-red-50
                             transition-colors">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5
                           7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>

          <div v-if="!categories.length"
               class="py-8 text-center text-xs text-muted">
            Henüz kategori yok
          </div>
        </div>
      </div>

      <!-- ── Sağ Kart: Ürünler ───────────────────────────────────────── -->
      <div class="flex-1 min-w-0 bg-white rounded-xl shadow-sm overflow-hidden">

        <!-- Toolbar -->
        <div class="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 flex-wrap">
          <!-- Seçili kategori başlığı -->
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <span v-if="selectedCategory"
                  class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  :style="{ background: selectedCategory.colorHex || '#94a3b8' }"/>
            <span class="font-semibold text-sm text-primary truncate">
              {{ selectedCategory ? selectedCategory.name : 'Tüm Ürünler' }}
            </span>
            <span class="text-xs text-muted">({{ filtered.length }} ürün)</span>
          </div>

          <!-- Arama -->
          <div class="relative">
            <svg class="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
            </svg>
            <input v-model="search" placeholder="Ürün ara..."
                   class="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm
                          focus:border-accent focus:outline-none w-52"/>
          </div>

          <!-- Yeni Ürün Ekle -->
          <button @click="openExistingProductModal()"
                  class="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg
                         text-sm font-bold hover:bg-blue-600 transition-colors flex-shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
            </svg>
            Yeni Ürün Ekle
          </button>
        </div>

        <!-- Tablo -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left px-4 py-3 text-xs font-bold text-muted uppercase w-14">Görsel</th>
                <th class="text-left px-5 py-3 text-xs font-bold text-muted uppercase">Ürün Adı</th>
                <th class="text-left px-5 py-3 text-xs font-bold text-muted uppercase hidden md:table-cell">Barkod</th>
                <th class="text-right px-5 py-3 text-xs font-bold text-muted uppercase">Fiyat</th>
                <th class="text-right px-5 py-3 text-xs font-bold text-muted uppercase hidden sm:table-cell">Stok</th>
                <th class="px-5 py-3 w-24"/>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="6" class="text-center py-16 text-muted text-sm">Yükleniyor...</td>
              </tr>

              <tr v-for="p in filtered" :key="p.id"
                  class="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">

                <!-- Görsel -->
                <td class="px-4 py-3">
                  <div class="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    <img v-if="p.imageBase64" :src="p.imageBase64" :alt="p.name"
                         class="w-full h-full object-cover"/>
                    <div v-else
                         class="w-full h-full flex items-center justify-center text-gray-300 text-base">
                      📦
                    </div>
                  </div>
                </td>

                <!-- Ürün Adı -->
                <td class="px-5 py-3">
                  <div class="font-semibold text-sm text-primary">{{ p.name }}</div>
                  <div v-if="!selectedCategoryId && p.categoryName"
                       class="text-xs mt-0.5 font-medium"
                       :style="{ color: categoryMap[p.categoryId]?.colorHex || '#94a3b8' }">
                    {{ p.categoryName }}
                  </div>
                </td>

                <!-- Barkod -->
                <td class="px-5 py-3 text-sm font-mono text-muted hidden md:table-cell">
                  {{ p.barcode || '—' }}
                </td>

                <!-- Fiyat -->
                <td class="px-5 py-3 text-sm font-bold text-success text-right whitespace-nowrap">
                  {{ fmt(p.price) }}
                </td>

                <!-- Stok -->
                <td class="px-5 py-3 text-sm text-right hidden sm:table-cell">
                  <span :class="p.currentStock <= (p.minimumStock ?? 0)
                    ? 'text-danger font-bold'
                    : 'text-primary'">
                    {{ p.currentStock }}
                  </span>
                </td>

                <!-- Aksiyon -->
                <td class="px-5 py-3">
                  <div class="flex items-center justify-end gap-1">
                    <button @click="openExistingProductModal(p)"
                            title="Düzenle"
                            class="p-2 rounded-lg text-muted hover:text-accent hover:bg-accent/10
                                   transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                                 m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </button>
                    <button @click="deleteProduct(p)"
                            title="Sil"
                            class="p-2 rounded-lg text-muted hover:text-danger hover:bg-red-50
                                   transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5
                                 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="!loading && !filtered.length">
                <td colspan="6" class="text-center py-16 text-muted text-sm">
                  {{ search ? 'Aramanızla eşleşen ürün bulunamadı.' : 'Bu kategoride ürün yok.' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ── Kategori Modal ────────────────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="catModal.show"
           class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
           @click.self="catModal.show = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">

          <h2 class="text-xl font-bold mb-6">
            {{ catModal.editing ? 'Grubu Düzenle' : 'Yeni Grup Ekle' }}
          </h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold mb-1">Grup Adı *</label>
              <input v-model="catForm.name" placeholder="ör. Sıcak İçecekler"
                     class="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm
                            focus:border-accent focus:outline-none"/>
            </div>

            <div>
              <label class="block text-sm font-semibold mb-1">Renk</label>
              <div class="flex items-center gap-3">
                <input v-model="catForm.colorHex" type="color"
                       class="w-12 h-10 rounded-lg border cursor-pointer p-1"/>
                <input v-model="catForm.colorHex"
                       class="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm
                              font-mono focus:border-accent focus:outline-none"
                       placeholder="#3498DB"/>
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold mb-1">Sıra</label>
              <input v-model.number="catForm.displayOrder" type="number" min="0"
                     class="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm
                            focus:border-accent focus:outline-none"/>
            </div>
          </div>

          <div v-if="catError"
               class="mt-4 p-3 bg-red-50 text-danger rounded-xl text-sm">
            {{ catError }}
          </div>

          <div class="flex gap-3 mt-6 justify-end">
            <button @click="catModal.show = false"
                    class="px-5 py-2 bg-gray-100 rounded-xl text-sm font-bold hover:bg-gray-200">
              İptal
            </button>
            <button @click="saveCat" :disabled="catSaving"
                    class="px-5 py-2 bg-accent text-white rounded-xl text-sm font-bold
                           hover:bg-blue-600 disabled:opacity-50 transition-colors">
              {{ catSaving ? 'Kaydediliyor...' : 'Kaydet' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Ürün Modal (mevcut, değiştirilmedi) ───────────────────────── -->
    <Teleport to="body">
      <div v-if="modal.show"
           class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">

          <div class="px-8 pt-8 pb-6 border-b border-gray-100">
            <h2 class="text-xl font-bold">{{ modal.editing ? 'Ürünü Düzenle' : 'Yeni Ürün' }}</h2>
          </div>

          <div class="px-8 py-6 space-y-5">

            <!-- Ürün Görseli -->
            <div>
              <label class="block text-sm font-semibold mb-2">Ürün Görseli
                <span class="text-muted font-normal">(192×192 · POS'ta görünür)</span>
              </label>
              <div class="flex gap-4 items-start">
                <div
                  class="relative w-48 h-48 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0"
                  :class="dragOver
                    ? 'border-accent bg-blue-50 scale-[1.02]'
                    : form.imageBase64
                      ? 'border-gray-200'
                      : 'border-dashed border-gray-300 hover:border-accent hover:bg-gray-50'"
                  @click="triggerFileInput"
                  @dragover.prevent="dragOver = true"
                  @dragleave="dragOver = false"
                  @drop.prevent="onDrop">
                  <img v-if="form.imageBase64" :src="form.imageBase64" alt="Ürün görseli"
                       class="w-full h-full object-cover"/>
                  <div v-else class="w-full h-full flex flex-col items-center justify-center gap-2 text-muted">
                    <svg class="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <div class="text-xs text-center px-3">
                      <div class="font-semibold">Görsel ekle</div>
                      <div class="text-gray-400 mt-0.5">tıkla veya sürükle</div>
                    </div>
                  </div>
                  <div v-if="form.imageBase64"
                       class="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all
                              flex items-center justify-center opacity-0 hover:opacity-100">
                    <div class="bg-white/90 backdrop-blur rounded-xl px-3 py-1.5 text-xs font-bold text-primary">
                      Değiştir
                    </div>
                  </div>
                  <div v-if="dragOver"
                       class="absolute inset-0 flex items-center justify-center bg-accent/10">
                    <div class="text-accent font-bold text-sm">Bırak!</div>
                  </div>
                </div>
                <div class="flex flex-col gap-3 pt-1 flex-1">
                  <div class="text-xs text-muted leading-relaxed">
                    <p>Görsel otomatik olarak <strong>192×192 px</strong> kare boyutuna kırpılır.</p>
                    <p class="mt-1">JPG, PNG, WebP desteklenir.</p>
                    <p class="mt-2 text-accent/80 font-medium">Bu boyut POS kasasındaki ürün kartına tam uyar.</p>
                  </div>
                  <div class="flex flex-col gap-2">
                    <button type="button" @click="triggerFileInput"
                            class="px-3 py-1.5 border border-accent text-accent rounded-xl
                                   text-xs font-bold hover:bg-accent hover:text-white transition-colors">
                      📁 Dosya Seç
                    </button>
                    <button v-if="form.imageBase64" type="button" @click="form.imageBase64 = ''"
                            class="px-3 py-1.5 border border-red-200 text-danger rounded-xl
                                   text-xs font-bold hover:bg-danger hover:text-white transition-colors">
                      🗑 Görseli Kaldır
                    </button>
                  </div>
                </div>
                <input ref="fileInput" type="file" accept="image/*"
                       class="hidden" @change="onFileChange"/>
              </div>
            </div>

            <!-- Ürün Bilgileri -->
            <div>
              <label class="block text-sm font-semibold mb-1">Ürün Adı *</label>
              <input v-model="form.name"
                     class="w-full px-4 py-2 border border-gray-200 rounded-xl
                            focus:border-accent focus:outline-none text-sm"/>
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Barkod</label>
              <input v-model="form.barcode"
                     class="w-full px-4 py-2 border border-gray-200 rounded-xl
                            focus:border-accent focus:outline-none text-sm font-mono"/>
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Kategori</label>
              <select v-model="form.categoryId"
                      class="w-full px-4 py-2 border border-gray-200 rounded-xl
                             focus:border-accent focus:outline-none text-sm bg-white">
                <option :value="null">Kategori seçin</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold mb-1">Fiyat (₺) *</label>
                <input v-model.number="form.price" type="number" step="0.01" min="0"
                       class="w-full px-4 py-2 border border-gray-200 rounded-xl
                              focus:border-accent focus:outline-none text-sm"/>
              </div>
              <div>
                <label class="block text-sm font-semibold mb-1">Stok</label>
                <input v-model.number="form.currentStock" type="number" min="0"
                       class="w-full px-4 py-2 border border-gray-200 rounded-xl
                              focus:border-accent focus:outline-none text-sm"/>
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Kritik Stok Seviyesi</label>
              <input v-model.number="form.minimumStock" type="number" min="0"
                     class="w-full px-4 py-2 border border-gray-200 rounded-xl
                            focus:border-accent focus:outline-none text-sm"/>
            </div>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.isActive" type="checkbox" class="w-4 h-4 accent-accent"/>
              <span class="text-sm font-semibold">Aktif</span>
            </label>
          </div>

          <div v-if="error" class="mx-8 mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
            {{ error }}
          </div>

          <div class="px-8 pb-8 flex gap-3 justify-end">
            <button @click="modal.show = false"
                    class="px-5 py-2 bg-gray-100 rounded-xl text-sm font-bold hover:bg-gray-200">
              İptal
            </button>
            <button @click="save" :disabled="saving"
                    class="px-5 py-2 bg-accent text-white rounded-xl text-sm font-bold
                           hover:bg-blue-600 disabled:opacity-50 transition-colors">
              {{ saving ? 'Kaydediliyor...' : 'Kaydet' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import api from '../api/api'

// ── Veri ─────────────────────────────────────────────────────────────────
const products   = ref([])
const categories = ref([])
const loading    = ref(true)

// ── UI State ──────────────────────────────────────────────────────────────
const search             = ref('')
const selectedCategoryId = ref(null)   // null = Tüm Ürünler

const selectedCategory = computed(() =>
  categories.value.find(c => c.id === selectedCategoryId.value) ?? null
)

const categoryMap = computed(() =>
  Object.fromEntries(categories.value.map(c => [c.id, c]))
)

const filtered = computed(() =>
  products.value.filter(p => {
    const matchSearch = !search.value ||
      p.name.toLowerCase().includes(search.value.toLowerCase()) ||
      (p.barcode || '').includes(search.value)
    const matchCat = selectedCategoryId.value === null ||
      p.categoryId === selectedCategoryId.value
    return matchSearch && matchCat
  })
)

function fmt(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}

// ── Modal state (mevcut, değiştirilmedi) ─────────────────────────────────
const saving = ref(false)
const error  = ref('')
const modal  = reactive({ show: false, editing: false })
const form   = reactive({
  id: 0, name: '', barcode: '', categoryId: null,
  price: 0, vatRate: 0, currentStock: 0, minimumStock: 0,
  isActive: true, imageBase64: '',
})
const dragOver  = ref(false)
const fileInput = ref(null)

// ── Ürün modal yer tutucu ─────────────────────────────────────────────────
function openExistingProductModal(product = null) {
  if (product) openEdit(product)
  else openCreate()
}

// ── Kategori modal ────────────────────────────────────────────────────────
const catModal   = reactive({ show: false, editing: false })
const catForm    = reactive({ id: 0, name: '', colorHex: '#3498DB', displayOrder: 0 })
const catSaving  = ref(false)
const catError   = ref('')

function openExistingCategoryModal(category = null) {
  catError.value = ''
  if (category) {
    Object.assign(catForm, {
      id: category.id, name: category.name,
      colorHex: category.colorHex, displayOrder: category.displayOrder,
    })
    catModal.editing = true
  } else {
    const nextOrder = categories.value.length
      ? Math.max(...categories.value.map(c => c.displayOrder ?? 0)) + 1
      : 1
    Object.assign(catForm, { id: 0, name: '', colorHex: '#3498DB', displayOrder: nextOrder })
    catModal.editing = false
  }
  catModal.show = true
}

async function deleteCat(cat) {
  const count = products.value.filter(p => p.categoryId === cat.id).length
  const msg = count > 0
    ? `"${cat.name}" grubunu silmek üzeresiniz.\n${count} ürün bu gruba bağlı — ürünler kategorisiz kalacak.\n\nDevam edilsin mi?`
    : `"${cat.name}" grubu silinsin mi?`
  if (!confirm(msg)) return
  try {
    await api.deleteCategory(cat.id)
    if (selectedCategoryId.value === cat.id) selectedCategoryId.value = null
    await load()
  } catch (e) {
    alert(e.response?.data?.message || e.response?.data?.title || 'Grup silinemedi.')
  }
}

async function saveCat() {
  if (!catForm.name.trim()) { catError.value = 'Kategori adı zorunludur.'; return }
  const others = categories.value.filter(c => c.id !== catForm.id)
  if (others.some(c => c.name.trim().toLowerCase() === catForm.name.trim().toLowerCase()))
    { catError.value = 'Bu isimde bir kategori zaten var.'; return }
  catSaving.value = true
  catError.value  = ''
  try {
    catModal.editing
      ? await api.updateCategory(catForm.id, catForm)
      : await api.createCategory(catForm)
    catModal.show = false
    await load()
  } catch (e) {
    catError.value = e.response?.data?.message || e.response?.data?.title || e.message || 'Hata oluştu.'
  } finally {
    catSaving.value = false
  }
}

// ── Görsel işleme (mevcut, değiştirilmedi) ───────────────────────────────
function triggerFileInput() { fileInput.value?.click() }

function onFileChange(e) {
  const file = e.target.files?.[0]
  if (file) processImageFile(file)
  e.target.value = ''
}

function onDrop(e) {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) processImageFile(file)
}

function processImageFile(file) {
  console.group('%c[ProductImage] Görsel işleniyor', 'color:#3b82f6;font-weight:bold')
  console.log('Dosya :', file.name, '|', file.type, '|', (file.size / 1024).toFixed(1), 'KB')
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 192
      const ctx = canvas.getContext('2d')
      const srcSize = Math.min(img.width, img.height)
      const sx = (img.width  - srcSize) / 2
      const sy = (img.height - srcSize) / 2
      ctx.drawImage(img, sx, sy, srcSize, srcSize, 0, 0, 192, 192)
      form.imageBase64 = canvas.toDataURL('image/jpeg', 0.85)
      console.log('Çıktı: 192×192 JPEG |', (form.imageBase64.length * 0.75 / 1024).toFixed(1), 'KB')
      console.groupEnd()
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

// ── API (mevcut, değiştirilmedi) ─────────────────────────────────────────
async function load() {
  loading.value = true
  const [prod, cats] = await Promise.all([api.getProducts(), api.getCategories()])
  products.value   = prod.data
  categories.value = cats.data
  loading.value    = false
}

function openCreate() {
  Object.assign(form, {
    id: 0, name: '', barcode: '', categoryId: selectedCategoryId.value,
    price: 0, vatRate: 0, currentStock: 0, minimumStock: 0,
    isActive: true, imageBase64: '',
  })
  modal.editing = false
  modal.show    = true
  error.value   = ''
}

function openEdit(p) {
  Object.assign(form, { ...p, imageBase64: p.imageBase64 || '' })
  modal.editing = true
  modal.show    = true
  error.value   = ''
}

async function save() {
  if (!form.name.trim()) { error.value = 'Ürün adı zorunludur.'; return }
  if (form.price < 0)   { error.value = 'Fiyat geçersiz.'; return }

  const others = products.value.filter(p => p.id !== form.id)
  if (others.some(p => p.name.trim().toLowerCase() === form.name.trim().toLowerCase()))
    { error.value = 'Bu isimde bir ürün zaten kayıtlı.'; return }
  if (form.barcode && others.some(p => p.barcode && p.barcode === form.barcode.trim()))
    { error.value = 'Bu barkod zaten başka bir ürüne ait.'; return }

  saving.value = true
  error.value  = ''
  try {
    const res = modal.editing
      ? await api.updateProduct(form.id, form)
      : await api.createProduct(form)
    console.log('[ProductSave]', modal.editing ? 'GÜNCELLEME' : 'OLUŞTURMA', res.status, res.data)
    modal.show = false
    await load()
  } catch (e) {
    console.error('[ProductSave] HATA', e.response?.status, e.response?.data ?? e.message)
    error.value = e.response?.data?.message || e.response?.data?.title || e.message || 'Hata oluştu.'
  } finally {
    saving.value = false
  }
}

async function deleteProduct(p) {
  if (!confirm(`"${p.name}" silinsin mi?`)) return
  try { await api.deleteProduct(p.id); await load() }
  catch { alert('Ürün silinemedi.') }
}

onMounted(load)
</script>
