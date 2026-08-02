<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-primary">Ürünler</h1>
      <button @click="openCreate"
              class="px-5 py-2 bg-accent text-white rounded-xl text-sm font-bold
                     hover:bg-blue-600 transition-colors">
        + Yeni Ürün
      </button>
    </div>

    <div class="mb-4 flex gap-3 flex-wrap">
      <input v-model="search" placeholder="Ürün ara..."
             class="px-4 py-2 border border-gray-200 rounded-xl text-sm
                    focus:border-accent focus:outline-none w-64"/>
      <select v-model="filterCategory"
              class="px-4 py-2 border border-gray-200 rounded-xl text-sm
                     focus:border-accent focus:outline-none">
        <option value="">Tüm Kategoriler</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </div>

    <!-- Ürün Tablosu -->
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-4 py-3 text-xs font-bold text-muted uppercase w-14">Görsel</th>
              <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Ürün</th>
              <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase hidden md:table-cell">Barkod</th>
              <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase hidden lg:table-cell">Kategori</th>
              <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Fiyat</th>
              <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase hidden sm:table-cell">Stok</th>
              <th class="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center py-12 text-muted">Yükleniyor...</td>
            </tr>

            <tr v-for="p in filtered" :key="p.id"
                class="border-t border-gray-50 hover:bg-gray-50 transition-colors">

              <!-- Ürün Görseli (192×192 → 44×44 olarak gösterilir) -->
              <td class="px-4 py-3">
                <div class="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  <img v-if="p.imageBase64"
                       :src="p.imageBase64"
                       :alt="p.name"
                       class="w-full h-full object-cover"/>
                  <div v-else
                       class="w-full h-full flex items-center justify-center text-gray-300 text-lg">
                    📦
                  </div>
                </div>
              </td>

              <td class="px-6 py-3 font-semibold text-sm">{{ p.name }}</td>
              <td class="px-6 py-3 font-mono text-sm text-muted hidden md:table-cell">{{ p.barcode || '—' }}</td>

              <td class="px-6 py-3 text-sm hidden lg:table-cell">
                <span v-if="p.categoryName"
                      class="px-2 py-1 rounded-full text-xs font-bold"
                      :style="{ background: (categoryMap[p.categoryId]?.colorHex || '#eee') + '22',
                                color: categoryMap[p.categoryId]?.colorHex || '#666' }">
                  {{ p.categoryName }}
                </span>
                <span v-else class="text-muted">—</span>
              </td>

              <td class="px-6 py-3 font-bold text-success text-sm">{{ fmt(p.price) }}</td>
              <td class="px-6 py-3 text-sm hidden sm:table-cell">
                <span :class="p.currentStock <= p.minimumStock ? 'text-danger font-bold' : 'text-primary'">
                  {{ p.currentStock }}
                </span>
              </td>

              <td class="px-6 py-3">
                <div class="flex gap-2 justify-end">
                  <button @click="openEdit(p)"
                          class="px-3 py-1 text-xs font-bold bg-blue-50 text-accent
                                 rounded-lg hover:bg-accent hover:text-white transition-colors">
                    Düzenle
                  </button>
                  <button @click="deleteProduct(p)"
                          class="px-3 py-1 text-xs font-bold bg-red-50 text-danger
                                 rounded-lg hover:bg-danger hover:text-white transition-colors">
                    Sil
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!loading && filtered.length === 0">
              <td colspan="7" class="text-center py-12 text-muted">Ürün bulunamadı</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Ürün Modal -->
    <Teleport to="body">
      <div v-if="modal.show"
           class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">

          <!-- Modal Başlık -->
          <div class="px-8 pt-8 pb-6 border-b border-gray-100">
            <h2 class="text-xl font-bold">{{ modal.editing ? 'Ürünü Düzenle' : 'Yeni Ürün' }}</h2>
          </div>

          <div class="px-8 py-6 space-y-5">

            <!-- ── Ürün Görseli ─────────────────────────────────────────── -->
            <div>
              <label class="block text-sm font-semibold mb-2">Ürün Görseli
                <span class="text-muted font-normal">(192×192 · POS'ta görünür)</span>
              </label>

              <div class="flex gap-4 items-start">

                <!-- Drop Zone / Preview -->
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

                  <!-- Mevcut görsel varsa göster -->
                  <img v-if="form.imageBase64"
                       :src="form.imageBase64"
                       alt="Ürün görseli"
                       class="w-full h-full object-cover"/>

                  <!-- Placeholder -->
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

                  <!-- Hover overlay (görsel varsa değiştir teklif et) -->
                  <div v-if="form.imageBase64"
                       class="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all
                              flex items-center justify-center opacity-0 hover:opacity-100">
                    <div class="bg-white/90 backdrop-blur rounded-xl px-3 py-1.5 text-xs font-bold text-primary">
                      Değiştir
                    </div>
                  </div>

                  <!-- Sürükleniyor göstergesi -->
                  <div v-if="dragOver"
                       class="absolute inset-0 flex items-center justify-center bg-accent/10">
                    <div class="text-accent font-bold text-sm">Bırak!</div>
                  </div>
                </div>

                <!-- Yardım metni + Kaldır butonu -->
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

                <!-- Gizli file input -->
                <input ref="fileInput" type="file" accept="image/*"
                       class="hidden" @change="onFileChange"/>
              </div>
            </div>

            <!-- ── Ürün Bilgileri ─────────────────────────────────────── -->
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

const products   = ref([])
const categories = ref([])
const loading    = ref(true)
const saving     = ref(false)
const error      = ref('')
const search         = ref('')
const filterCategory = ref('')
const modal = reactive({ show: false, editing: false })
const form  = reactive({
  id: 0, name: '', barcode: '', categoryId: null,
  price: 0, vatRate: 0, currentStock: 0, minimumStock: 0,
  isActive: true, imageBase64: '',
})

// ─── Drag & Drop state ───────────────────────────────────────────────────────
const dragOver  = ref(false)
const fileInput = ref(null)

const categoryMap = computed(() =>
  Object.fromEntries(categories.value.map(c => [c.id, c]))
)

const filtered = computed(() =>
  products.value.filter(p => {
    const matchSearch = !search.value ||
      p.name.toLowerCase().includes(search.value.toLowerCase()) ||
      (p.barcode || '').includes(search.value)
    const matchCat = !filterCategory.value || p.categoryId === filterCategory.value
    return matchSearch && matchCat
  })
)

function fmt(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}

// ─── Görsel işleme ───────────────────────────────────────────────────────────

function triggerFileInput() {
  fileInput.value?.click()
}

function onFileChange(e) {
  const file = e.target.files?.[0]
  if (file) processImageFile(file)
  // Input'u sıfırla (aynı dosya tekrar seçilebilsin)
  e.target.value = ''
}

function onDrop(e) {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) processImageFile(file)
}

// Seçilen görseli 192×192 kareye kırp ve JPEG base64'e dönüştür
function processImageFile(file) {
  console.group('%c[ProductImage] Görsel işleniyor', 'color:#3b82f6;font-weight:bold')
  console.log('Dosya :', file.name)
  console.log('Tip   :', file.type)
  console.log('Boyut :', (file.size / 1024).toFixed(1), 'KB')

  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width  = 192
      canvas.height = 192
      const ctx = canvas.getContext('2d')

      // Merkezi kare kırpma (en küçük kenar esas alınır)
      const srcSize = Math.min(img.width, img.height)
      const sx = (img.width  - srcSize) / 2
      const sy = (img.height - srcSize) / 2

      ctx.drawImage(img, sx, sy, srcSize, srcSize, 0, 0, 192, 192)
      form.imageBase64 = canvas.toDataURL('image/jpeg', 0.85)

      const kb = (form.imageBase64.length * 0.75 / 1024).toFixed(1)
      console.log('Kaynak :', img.width, '×', img.height, 'px  →  çıktı: 192×192 JPEG')
      console.log('Base64 :', form.imageBase64.length, 'karakter ≈', kb, 'KB')
      console.log('Önizleme hazır ✓')
      console.groupEnd()
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

// ─── API ─────────────────────────────────────────────────────────────────────

async function load() {
  loading.value = true
  const [prod, cats] = await Promise.all([api.getProducts(), api.getCategories()])
  products.value   = prod.data
  categories.value = cats.data
  loading.value    = false
}

function openCreate() {
  Object.assign(form, {
    id: 0, name: '', barcode: '', categoryId: null,
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

  // ── LOG: istek öncesi durum ───────────────────────────────────────────────
  console.group('%c[ProductSave] Kayıt gönderiliyor', 'color:#8b5cf6;font-weight:bold')
  console.log('İşlem    :', modal.editing ? 'GÜNCELLE' : 'OLUŞTUR')
  console.log('Ürün     :', form.name, '| ID:', form.id)
  console.log('Görsel   :', form.imageBase64
    ? `VAR — ${(form.imageBase64.length * 0.75 / 1024).toFixed(1)} KB`
    : 'YOK')
  if (form.imageBase64)
    console.log('Veri önü :', form.imageBase64.slice(0, 60) + '…')

  saving.value = true
  error.value  = ''
  try {
    const res = modal.editing
      ? await api.updateProduct(form.id, form)
      : await api.createProduct(form)

    // ── LOG: API yanıtı ──────────────────────────────────────────────────
    console.log('HTTP     :', res.status, res.statusText)
    console.log('Yanıt    :', res.data)

    const returnedImage = res.data?.imageBase64
    if (form.imageBase64 && !returnedImage) {
      console.warn(
        '%c⚠ Backend imageBase64 döndürmedi!',
        'color:#ef4444;font-weight:bold'
      )
      console.warn('  Yapılması gereken:')
      console.warn('    1) Product.cs → public string? ImageBase64 { get; set; }')
      console.warn('    2) Add-Migration AddProductImage')
      console.warn('    3) Update-Database')
      console.warn('    4) WinSCP ile Ubuntu\'ya yükle')
    } else if (returnedImage) {
      console.log('%c✓ Görsel kaydedildi ve API\'den döndü', 'color:#22c55e;font-weight:bold')
    }

    modal.show = false
    const savedId = res.data?.id ?? form.id
    await load()

    // ── LOG: yeniden yükleme sonrası kontrol ─────────────────────────────
    const reloaded = products.value.find(p => p.id === savedId)
    if (reloaded) {
      console.log('Yeniden yüklenen ürün imageBase64:',
        reloaded.imageBase64
          ? `VAR (${(reloaded.imageBase64.length * 0.75 / 1024).toFixed(1)} KB)`
          : 'YOK — backend alanı henüz yok')
    }
    console.groupEnd()
  } catch (e) {
    // ── LOG: hata detayı ─────────────────────────────────────────────────
    console.error('%c[ProductSave] HATA', 'color:#ef4444;font-weight:bold')
    console.error('HTTP status :', e.response?.status)
    console.error('Backend msg :', e.response?.data)
    console.error('Stack       :', e.message)
    console.groupEnd()
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
