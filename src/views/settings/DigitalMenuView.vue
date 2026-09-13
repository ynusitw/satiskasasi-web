<template>
  <div class="p-8 max-w-6xl">
    <h1 class="text-2xl font-bold text-primary">Dijital Menü (QR)</h1>
    <p class="text-muted text-sm mt-1 mb-6">
      Bu QR kodu masalarınıza koyun — müşterileriniz telefonlarıyla okutup
      menünüzü (ürün ve fiyatları) görüntüleyebilir. Sipariş alınmaz, sadece
      görüntülemedir.
    </p>

    <div v-if="loading" class="text-muted">Yükleniyor...</div>

    <!-- Kartlar geniş ekranda iki sütuna yayılır; dar ekranda alt alta iner -->
    <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
      <!-- QR + bağlantı -->
      <div class="bg-white rounded-2xl shadow-sm p-8 flex flex-col items-center">
        <img :src="qrUrl" :alt="menuUrl" width="220" height="220"
             class="rounded-xl border border-gray-100"/>

        <div class="mt-6 w-full">
          <label class="block text-sm font-semibold text-primary mb-1.5">Menü Bağlantısı</label>
          <div class="flex gap-2">
            <input :value="menuUrl" readonly
                   class="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm
                          bg-gray-50 text-muted"/>
            <button @click="copyLink"
                    class="px-4 py-2.5 bg-accent text-white rounded-xl text-sm
                           font-bold hover:bg-blue-600 transition-colors whitespace-nowrap">
              {{ copied ? 'Kopyalandı' : 'Kopyala' }}
            </button>
          </div>
        </div>

        <a :href="menuUrl" target="_blank"
           class="mt-4 text-sm text-accent hover:underline">
          Menüyü önizle
        </a>
      </div>

      <!-- Görünürlük Ayarları -->
      <div class="bg-white rounded-2xl shadow-sm p-6">
        <h2 class="font-bold text-primary mb-1">Görünürlük Ayarları</h2>
        <p class="text-xs text-muted mb-4">
          Firma adının altında hangi iletişim bilgilerinin gösterileceğini seçin.
        </p>

        <label class="flex items-center justify-between p-3 rounded-xl
                       bg-gray-50 border border-gray-100 cursor-pointer mb-3">
          <div>
            <div class="text-sm font-semibold">Adresi Göster</div>
            <div class="text-xs text-muted">Menüde firma adresi görünsün</div>
          </div>
          <button @click="toggleVisibility('showAddressOnMenu')"
                  class="relative inline-flex h-6 w-11 items-center rounded-full
                         transition-colors duration-200 flex-shrink-0"
                  :class="settings.showAddressOnMenu ? 'bg-accent' : 'bg-gray-300'">
            <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow
                         transition-transform duration-200"
                  :class="settings.showAddressOnMenu ? 'translate-x-6' : 'translate-x-1'"/>
          </button>
        </label>

        <label class="flex items-center justify-between p-3 rounded-xl
                       bg-gray-50 border border-gray-100 cursor-pointer">
          <div>
            <div class="text-sm font-semibold">Telefonu Göster</div>
            <div class="text-xs text-muted">Menüde telefon numarası görünsün</div>
          </div>
          <button @click="toggleVisibility('showPhoneOnMenu')"
                  class="relative inline-flex h-6 w-11 items-center rounded-full
                         transition-colors duration-200 flex-shrink-0"
                  :class="settings.showPhoneOnMenu ? 'bg-accent' : 'bg-gray-300'">
            <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow
                         transition-transform duration-200"
                  :class="settings.showPhoneOnMenu ? 'translate-x-6' : 'translate-x-1'"/>
          </button>
        </label>

        <div class="text-xs mt-3" :class="visError ? 'text-danger' : 'text-muted'">
          {{ visError ? visError : (visSaving ? 'Kaydediliyor...' : (visSaved ? 'Kaydedildi' : '')) }}
        </div>
      </div>

      <!-- Bunları Beğenebilirsiniz -->
      <div class="bg-white rounded-2xl shadow-sm p-6">
        <div class="flex items-start justify-between gap-4 mb-1">
          <h2 class="font-bold text-primary">Bunları Beğenebilirsiniz</h2>
          <span class="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                :class="featuredIds.length >= featuredLimit
                  ? 'bg-accent/10 text-accent' : 'bg-gray-100 text-muted'">
            {{ featuredIds.length }} / {{ featuredLimit }}
          </span>
        </div>
        <p class="text-xs text-muted mb-4">
          Menünün en üstünde öne çıkarılacak ürünler. En fazla {{ featuredLimit }} ürün seçebilirsiniz.
        </p>

        <input v-model="productSearch" placeholder="Ürün ara..."
               class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm
                      focus:border-accent focus:outline-none mb-3"/>

        <div class="max-h-72 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
          <label v-for="p in filteredProducts" :key="p.id"
                 class="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors"
                 :class="isFeatured(p.id) ? 'bg-accent/5' : 'hover:bg-gray-50'">
            <input type="checkbox" :checked="isFeatured(p.id)"
                   :disabled="!isFeatured(p.id) && featuredIds.length >= featuredLimit"
                   @change="toggleFeatured(p.id)"
                   class="w-4 h-4 accent-accent flex-shrink-0 disabled:opacity-30"/>
            <div class="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              <img v-if="p.imageBase64" :src="p.imageBase64" :alt="p.name"
                   class="w-full h-full object-cover"/>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold text-primary truncate">{{ p.name }}</div>
              <div class="text-xs text-muted">{{ fmt(p.price) }}</div>
            </div>
            <span v-if="!p.isActive"
                  class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">
              Pasif
            </span>
          </label>

          <div v-if="filteredProducts.length === 0" class="px-3 py-6 text-center text-sm text-muted">
            Ürün bulunamadı
          </div>
        </div>
      </div>

      <!-- Kategori Görselleri -->
      <div class="bg-white rounded-2xl shadow-sm p-6">
        <h2 class="font-bold text-primary mb-1">Kategori Görselleri</h2>
        <p class="text-xs text-muted mb-4">
          Menü açılışında kategoriler kart olarak gösterilir. Buraya yüklediğiniz
          görseller <strong>sadece dijital menüde</strong> kullanılır, kasayı etkilemez.
        </p>

        <div class="space-y-3">
          <div v-for="c in categories" :key="c.id"
               class="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
            <div class="w-24 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0
                        flex items-center justify-center">
              <img v-if="c.menuImageBase64" :src="c.menuImageBase64" :alt="c.name"
                   class="w-full h-full object-cover"/>
              <span v-else class="text-[10px] text-muted">Görsel yok</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold text-primary truncate">{{ c.name }}</div>
              <div class="flex gap-3 mt-1">
                <button @click="pickCategoryImage(c.id)"
                        class="text-xs font-bold text-accent hover:underline">
                  {{ c.menuImageBase64 ? 'Değiştir' : 'Görsel Yükle' }}
                </button>
                <button v-if="c.menuImageBase64" @click="c.menuImageBase64 = null"
                        class="text-xs font-bold text-danger hover:underline">
                  Kaldır
                </button>
              </div>
            </div>
          </div>

          <div v-if="categories.length === 0" class="text-sm text-muted text-center py-4">
            Henüz kategori tanımlanmamış
          </div>
        </div>

        <input ref="categoryFileInput" type="file" accept="image/*"
               class="hidden" @change="onCategoryFileChange"/>
      </div>

      <!-- Kaydet — iki sütunun altında tam genişlik -->
      <div class="xl:col-span-2 flex items-center justify-end gap-3 pb-4">
        <span class="text-sm" :class="configError ? 'text-danger' : 'text-muted'">
          {{ configError ? configError : (configSaved ? 'Menü ayarları kaydedildi' : '') }}
        </span>
        <button @click="saveConfig" :disabled="configSaving"
                class="px-6 py-2.5 bg-accent text-white rounded-xl text-sm
                       font-bold hover:bg-blue-600 disabled:opacity-50 transition-colors">
          {{ configSaving ? 'Kaydediliyor...' : 'Menü Ayarlarını Kaydet' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import api from '../../api/api'

const loading   = ref(true)
const slug      = ref('')
const copied    = ref(false)

// Görünürlük ayarları (anında kaydedilir)
const settings   = reactive({ showAddressOnMenu: true, showPhoneOnMenu: true })
const visSaving  = ref(false)
const visSaved   = ref(false)
const visError   = ref('')

// Menü yapılandırması (Kaydet butonuyla)
const categories     = ref([])
const products       = ref([])
const featuredIds    = ref([])
const featuredLimit  = ref(3)
const productSearch  = ref('')
const configSaving   = ref(false)
const configSaved    = ref(false)
const configError    = ref('')

const categoryFileInput = ref(null)
let   pendingCategoryId = null

const menuUrl = computed(() => `${window.location.origin}/menu/${slug.value}`)
const qrUrl   = computed(() =>
  `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(menuUrl.value)}`)

const filteredProducts = computed(() => {
  const q = productSearch.value.trim().toLowerCase()
  if (!q) return products.value
  return products.value.filter(p => p.name.toLowerCase().includes(q))
})

function fmt(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(menuUrl.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {}
}

// ── Görünürlük ───────────────────────────────────────────────────────────
async function toggleVisibility(key) {
  settings[key] = !settings[key]
  visSaving.value = true
  visSaved.value  = false
  visError.value  = ''
  try {
    await api.updateMenuSettings(settings)
    visSaved.value = true
    setTimeout(() => (visSaved.value = false), 2000)
  } catch {
    settings[key] = !settings[key] // geri al
    visError.value = 'Kaydedilemedi, tekrar deneyin.'
  } finally {
    visSaving.value = false
  }
}

// ── Öne çıkan ürünler ────────────────────────────────────────────────────
function isFeatured(id) {
  return featuredIds.value.includes(id)
}
function toggleFeatured(id) {
  const i = featuredIds.value.indexOf(id)
  if (i !== -1) featuredIds.value.splice(i, 1)
  else if (featuredIds.value.length < featuredLimit.value) featuredIds.value.push(id)
}

// ── Kategori görselleri ──────────────────────────────────────────────────
function pickCategoryImage(categoryId) {
  pendingCategoryId = categoryId
  categoryFileInput.value?.click()
}

function onCategoryFileChange(e) {
  const file = e.target.files?.[0]
  if (file && file.type.startsWith('image/')) processCategoryImage(file)
  e.target.value = '' // aynı dosya tekrar seçilebilsin
}

// Products.vue'daki processImageFile ile aynı canvas yaklaşımı — burada
// kart oranına uygun (yatay) kırpma yapılıyor.
function processCategoryImage(file) {
  const categoryId = pendingCategoryId
  const reader = new FileReader()
  reader.onload = (ev) => {
    const img = new Image()
    img.onload = () => {
      // Kategori kartı telefonda ~172pt genişlikte; 3x ekranda ~516 piksele
      // denk geliyor. 400 geniş görsel orada bulanık kalıyordu.
      const W = 720, H = 468
      const canvas = document.createElement('canvas')
      canvas.width = W; canvas.height = H
      const ctx = canvas.getContext('2d')

      // Ortadan, kart oranında kırp
      const targetRatio = W / H
      const srcRatio = img.width / img.height
      let sw = img.width, sh = img.height, sx = 0, sy = 0
      if (srcRatio > targetRatio) {
        sw = img.height * targetRatio
        sx = (img.width - sw) / 2
      } else {
        sh = img.width / targetRatio
        sy = (img.height - sh) / 2
      }
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H)

      const cat = categories.value.find(c => c.id === categoryId)
      if (cat) cat.menuImageBase64 = canvas.toDataURL('image/jpeg', 0.82)
    }
    img.src = ev.target.result
  }
  reader.readAsDataURL(file)
}

// ── Kaydet ───────────────────────────────────────────────────────────────
async function saveConfig() {
  configSaving.value = true
  configSaved.value  = false
  configError.value  = ''
  try {
    await api.saveMenuConfig({
      featuredProductIds: featuredIds.value,
      categoryImages: categories.value.map(c => ({
        categoryId: c.id,
        imageBase64: c.menuImageBase64 || null,
      })),
    })
    configSaved.value = true
    setTimeout(() => (configSaved.value = false), 3000)
  } catch (e) {
    configError.value = e.response?.data?.message || 'Kaydedilemedi, tekrar deneyin.'
  } finally {
    configSaving.value = false
  }
}

onMounted(async () => {
  try {
    const [tenantRes, configRes] = await Promise.all([
      api.getMyTenant(),
      api.getMenuConfig(),
    ])

    slug.value = tenantRes.data.slugName
    settings.showAddressOnMenu = tenantRes.data.showAddressOnMenu ?? true
    settings.showPhoneOnMenu   = tenantRes.data.showPhoneOnMenu ?? true

    categories.value    = configRes.data.categories
    products.value      = configRes.data.products
    featuredLimit.value = configRes.data.featuredLimit ?? 3
    featuredIds.value   = configRes.data.products
      .filter(p => p.isFeaturedOnMenu)
      .map(p => p.id)
  } finally {
    loading.value = false
  }
})
</script>
