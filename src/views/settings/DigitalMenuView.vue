<template>
  <div class="p-8 max-w-6xl">
    <h1 class="page-title">Dijital Menü (QR)</h1>
    <p class="text-muted text-sm mt-1 mb-6">
      Bu QR kodu masalarınıza koyun — müşterileriniz telefonlarıyla okutup
      menünüzü (ürün ve fiyatları) görüntüleyebilir. Masadan sipariş almak için
      aşağıdaki "Masadan Sipariş" bölümünü açıp masaya özel QR kodlarını kullanın.
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
                   class="flex-1 px-3 border border-gray-200 rounded-lg text-[13.5px] bg-gray-50 text-muted h-10"/>
            <button @click="copyLink"
                    class="btn-primary btn-lg whitespace-nowrap">
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
        <h2 class="section-title mb-1">Görünürlük Ayarları</h2>
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
          <h2 class="section-title">Bunları Beğenebilirsiniz</h2>
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
               class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] mb-3 h-10 bg-white"/>

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
        <div class="flex items-start justify-between gap-3 mb-1">
          <h2 class="section-title">Kategori Görselleri</h2>

          <!-- Başka bir firmaya taşımak için: görseller yeniden
               sıkıştırılmadan, olduğu gibi aktarılır. -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <button @click="exportCategoryImages" :disabled="imgBusy"
                    class="px-3 py-1.5 border border-gray-200 text-muted rounded-lg
                           text-xs font-semibold hover:border-accent hover:text-accent
                           disabled:opacity-50">
              Dışa Aktar
            </button>
            <button @click="categoryZipInput?.click()" :disabled="imgBusy"
                    class="px-3 py-1.5 border border-gray-200 text-muted rounded-lg
                           text-xs font-semibold hover:border-success hover:text-success
                           disabled:opacity-50">
              İçe Aktar
            </button>
            <input ref="categoryZipInput" type="file" accept=".zip"
                   class="hidden" @change="importCategoryImages"/>
          </div>
        </div>

        <p class="text-xs text-muted mb-3">
          Menü açılışında kategoriler kart olarak gösterilir. Buraya yüklediğiniz
          görseller <strong>sadece dijital menüde</strong> kullanılır, kasayı etkilemez.
        </p>

        <label class="flex items-center gap-2 text-xs text-muted cursor-pointer mb-4 select-none">
          <input type="checkbox" v-model="overwriteCategoryImages" class="w-4 h-4"/>
          İçe aktarırken mevcut görsellerin üzerine yaz
        </label>

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
                class="btn-primary btn-lg disabled:opacity-50">
          {{ configSaving ? 'Kaydediliyor...' : 'Menü Ayarlarını Kaydet' }}
        </button>
      </div>

      <!-- ── Masadan Sipariş ─────────────────────────────────────────── -->
      <div v-if="qrAvailable" class="xl:col-span-2 bg-white rounded-2xl shadow-sm p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="section-title">Masadan Sipariş</h2>
            <p class="text-xs text-muted mt-1 max-w-2xl">
              Açıkken masaya özel QR kodunu okutan müşteri menüden sepet oluşturup sipariş
              gönderebilir. Sipariş kasaya düşer; kasiyer onaylayınca masaya eklenir ve mutfak
              fişi basılır. Fiyatlar sunucuda hesaplanır, onaylanmayan siparişler 30 dakikada düşer.
            </p>
          </div>
          <button @click="toggleQrOrdering" :disabled="qrSaving || !auth.isAdmin"
                  :title="auth.isAdmin ? '' : 'Yalnızca yönetici değiştirebilir'"
                  class="relative inline-flex h-6 w-11 items-center rounded-full
                         transition-colors duration-200 flex-shrink-0 mt-1 disabled:opacity-50"
                  :class="qrEnabled ? 'bg-accent' : 'bg-gray-300'">
            <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow
                         transition-transform duration-200"
                  :class="qrEnabled ? 'translate-x-6' : 'translate-x-1'"/>
          </button>
        </div>
        <div v-if="qrError" class="text-xs text-danger mt-2">{{ qrError }}</div>

        <template v-if="qrEnabled">
          <!-- Masa QR kodları -->
          <div class="flex items-center justify-between gap-3 mt-6 mb-3">
            <div>
              <div class="text-sm font-semibold text-primary">Masa QR Kodları</div>
              <div class="text-xs text-muted">
                Her masanın kendi kodu var; masaya hangi kodun konduğu siparişin hangi masaya
                düşeceğini belirler.
              </div>
            </div>
            <button @click="printTableQrs" :disabled="!qrTables.length"
                    class="btn-secondary whitespace-nowrap disabled:opacity-50">
              Tümünü Yazdır
            </button>
          </div>

          <div v-if="!qrTables.length" class="text-sm text-muted text-center py-6">
            Henüz masa tanımlanmamış.
          </div>
          <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-3">
            <div v-for="t in qrTables" :key="t.id"
                 class="border border-gray-100 rounded-xl p-3 flex flex-col items-center text-center">
              <img v-if="t.token" :src="tableQrImage(t, 160)" :alt="t.name"
                   width="120" height="120" class="rounded-lg"/>
              <div v-else class="w-[120px] h-[120px] rounded-lg bg-gray-50 flex items-center
                                  justify-center text-[11px] text-muted">Kod yok</div>
              <div class="text-sm font-semibold text-primary mt-2 truncate w-full">{{ t.name }}</div>
              <div class="text-[11px] text-muted truncate w-full">{{ t.section || ' ' }}</div>
              <div class="flex gap-3 mt-1.5">
                <a v-if="t.token" :href="tableUrl(t)" target="_blank"
                   class="text-xs font-bold text-accent hover:underline">Aç</a>
                <button v-if="auth.isAdmin" @click="regenerateToken(t)"
                        class="text-xs font-bold text-muted hover:text-danger">
                  {{ t.token ? 'Kodu Yenile' : 'Kod Oluştur' }}
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- Son siparişler -->
        <div class="flex items-center justify-between mt-6 mb-3">
          <div class="text-sm font-semibold text-primary">Son QR Siparişleri</div>
          <button @click="loadQrHistory" class="text-xs font-bold text-accent hover:underline">Yenile</button>
        </div>
        <div v-if="!qrHistory.length" class="text-sm text-muted text-center py-6 border border-gray-100 rounded-xl">
          Henüz QR menüden sipariş gelmedi.
        </div>
        <div v-else class="border border-gray-100 rounded-xl overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-muted border-b border-gray-100">
                <th class="px-3 py-2 font-semibold">Zaman</th>
                <th class="px-3 py-2 font-semibold">Masa</th>
                <th class="px-3 py-2 font-semibold">Ürünler</th>
                <th class="px-3 py-2 font-semibold">Durum</th>
                <th class="px-3 py-2 font-semibold text-right">Tutar</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in qrHistory" :key="o.id" class="border-b border-gray-50 last:border-0 align-top">
                <td class="px-3 py-2.5 whitespace-nowrap text-muted">{{ fmtTime(o.createdAt) }}</td>
                <td class="px-3 py-2.5 min-w-[140px] max-w-[220px] font-semibold text-primary">
                  {{ o.tableName }}
                  <div v-if="o.customerName" class="text-xs font-normal text-muted">{{ o.customerName }}</div>
                </td>
                <td class="px-3 py-2.5 text-muted min-w-[220px]">
                  {{ o.items.map(i => `${i.quantity} × ${i.productName}${i.variantName ? ` (${i.variantName})` : ''}`).join(', ') }}
                  <div v-if="o.note" class="text-xs mt-0.5">Not: {{ o.note }}</div>
                </td>
                <td class="px-3 py-2.5 min-w-[140px] max-w-[220px]">
                  <span :class="statusChip(o.status)">{{ statusLabel(o.status) }}</span>
                  <div v-if="o.decidedBy || o.rejectReason" class="text-xs text-muted mt-1">
                    {{ [o.decidedBy, o.rejectReason].filter(Boolean).join(' · ') }}
                  </div>
                </td>
                <td class="px-3 py-2.5 whitespace-nowrap text-right font-semibold">{{ fmt(o.total) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { uiAlert, uiConfirm } from '../../utils/dialog'
import { ref, computed, reactive, onMounted } from 'vue'
import api from '../../api/api'
import { useAuthStore } from '../../stores/auth'
import { useModulesStore } from '../../stores/modules'

const auth = useAuthStore()
const modules = useModulesStore()

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
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
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

// ── Kategori görsellerini dışa / içe aktar ───────────────────────────────
// Görseller yeniden sıkıştırılmaz: kaynak firmadaki dosyanın birebir kopyası
// taşınır. Eşleştirme kategori ADIna göre yapılır; paketteki kategoriler.json
// adı taşır, dosya adı yalnızca yedek eşleşmedir.
const categoryZipInput = ref(null)
const imgBusy = ref(false)
const overwriteCategoryImages = ref(false)

function normalizeName(n) {
  return (n || '').trim().toLocaleLowerCase('tr')
}

function safeFileName(n) {
  return (n || 'kategori').replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 40)
}

function dataUrlToParts(dataUrl) {
  const m = /^data:image\/(png|gif|webp|jpe?g);base64,(.+)$/i.exec(dataUrl || '')
  if (!m) return null
  const ext = m[1].toLowerCase() === 'jpeg' ? 'jpg' : m[1].toLowerCase()
  return { ext, base64: m[2] }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function exportCategoryImages() {
  const withImage = categories.value.filter(c => c.menuImageBase64)
  if (!withImage.length) {
    await uiAlert('Dışa aktarılacak kategori görseli yok.')
    return
  }

  imgBusy.value = true
  try {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    const dir = zip.folder('gorseller')
    const index = []

    withImage.forEach((c, i) => {
      const parts = dataUrlToParts(c.menuImageBase64)
      if (!parts) return
      const file = `${String(i + 1).padStart(3, '0')}-${safeFileName(c.name)}.${parts.ext}`
      dir.file(file, parts.base64, { base64: true })
      index.push({ name: c.name, file })
    })

    zip.file('kategoriler.json', JSON.stringify(index, null, 2))

    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kategori-gorselleri-${new Date().toISOString().slice(0, 10)}.zip`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('[DigitalMenu] Kategori görselleri dışa aktarılamadı:', e)
    await uiAlert('Dosya oluşturulamadı.')
  } finally {
    imgBusy.value = false
  }
}

async function importCategoryImages(e) {
  const file = e.target.files?.[0]
  if (!file) return
  e.target.value = ''

  imgBusy.value = true
  try {
    const JSZip = (await import('jszip')).default
    const zip = await JSZip.loadAsync(await file.arrayBuffer())

    // Dosya türü uzantıdan verilmezse görsel octet-stream olarak kaydediliyor.
    const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
                   gif: 'image/gif', webp: 'image/webp' }

    const blobs = {}
    await Promise.all(Object.keys(zip.files).map(async (name) => {
      if (zip.files[name].dir) return
      const ext = /\.(jpe?g|png|gif|webp)$/i.exec(name)?.[1]?.toLowerCase()
      if (!ext) return
      const bytes = await zip.file(name).async('arraybuffer')
      blobs[name.split('/').pop().toLowerCase()] =
        new Blob([bytes], { type: MIME[ext] || 'image/jpeg' })
    }))

    // Ad → dosya eşlemesi; paket listesi yoksa dosya adından çıkarılır.
    const byName = {}
    const indexFile = zip.file('kategoriler.json')
    if (indexFile) {
      for (const row of JSON.parse(await indexFile.async('string'))) {
        const blob = blobs[(row.file || '').split('/').pop().toLowerCase()]
        if (blob) byName[normalizeName(row.name)] = blob
      }
    } else {
      for (const [file, blob] of Object.entries(blobs)) {
        const bare = file.replace(/^\d+-/, '').replace(/\.[^.]+$/, '')
        byName[normalizeName(bare.replace(/-/g, ' '))] = blob
      }
    }

    let applied = 0, kept = 0
    for (const c of categories.value) {
      const blob = byName[normalizeName(c.name)]
      if (!blob) continue
      if (c.menuImageBase64 && !overwriteCategoryImages.value) { kept++; continue }
      c.menuImageBase64 = await blobToDataUrl(blob)
      applied++
    }

    const missing = categories.value.filter(c => !byName[normalizeName(c.name)]).length
    await uiAlert(
      `${applied} kategori görseli yüklendi.` +
      (kept ? `\n${kept} kategoride görsel zaten vardı (üzerine yazılmadı).` : '') +
      (missing ? `\n${missing} kategori pakette bulunamadı (adı farklı olabilir).` : '') +
      '\n\nDeğişiklikler için aşağıdaki Kaydet düğmesine basın.'
    )
  } catch (err) {
    console.error('[DigitalMenu] Kategori görselleri içe aktarılamadı:', err)
    await uiAlert('Paket okunamadı. Dışa aktarma ile oluşturulmuş bir .zip dosyası seçin.')
  } finally {
    imgBusy.value = false
  }
}

// ── Masadan sipariş ──────────────────────────────────────────────────────
// Masaya sipariş hem QR menü hem masa modülü ister; ikisinden biri yoksa
// bölüm hiç gösterilmez (uç 403 döner).
const qrAvailable = computed(() => modules.has('qr_menu') && modules.has('tables'))
const qrEnabled = ref(false)
const qrSaving  = ref(false)
const qrError   = ref('')
const qrTables  = ref([])
const qrHistory = ref([])

function tableUrl(t) {
  return `${menuUrl.value}?masa=${encodeURIComponent(t.token)}`
}
function tableQrImage(t, size) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(tableUrl(t))}`
}

async function loadQrOrdering() {
  if (!qrAvailable.value) return
  try {
    const [settingsRes, tablesRes] = await Promise.all([
      api.getQrOrderSettings(), api.getQrOrderTables(),
    ])
    qrEnabled.value = !!settingsRes.data.enabled
    qrTables.value  = tablesRes.data
  } catch {
    qrError.value = 'Masadan sipariş ayarları yüklenemedi.'
  }
  loadQrHistory()
}

async function loadQrHistory() {
  try {
    qrHistory.value = (await api.getQrOrders(30)).data
  } catch { /* geçmiş isteğe bağlı */ }
}

async function toggleQrOrdering() {
  qrSaving.value = true
  qrError.value  = ''
  try {
    const { data } = await api.saveQrOrderSettings({ enabled: !qrEnabled.value })
    qrEnabled.value = !!data.enabled
    // Açılınca kodu olmayan masalara sunucu kod üretir
    if (qrEnabled.value) qrTables.value = (await api.getQrOrderTables()).data
  } catch (e) {
    qrError.value = e.response?.data?.message || 'Kaydedilemedi, tekrar deneyin.'
  } finally {
    qrSaving.value = false
  }
}

async function regenerateToken(t) {
  if (t.token && !await uiConfirm(`${t.name} için yeni kod üretilsin mi?\n\nMasadaki eski QR kodu artık sipariş almaz; yenisini yazdırıp masaya koymanız gerekir.`)) return
  try {
    t.token = (await api.regenerateQrToken(t.id)).data.token
  } catch (e) {
    await uiAlert(e.response?.data?.message || 'Kod yenilenemedi.')
  }
}

function printTableQrs() {
  const esc = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const cards = qrTables.value.filter(t => t.token).map(t => `
    <div class="card">
      <img src="${tableQrImage(t, 360)}" alt="">
      <div class="name">${esc(t.name)}</div>
      <div class="hint">Menüyü görmek ve sipariş vermek için okutun</div>
    </div>`).join('')
  const w = window.open('', '_blank')
  if (!w) { uiAlert('Açılır pencere engellendi. Tarayıcıda bu site için açılır pencerelere izin verin.'); return }
  w.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8">
    <title>Masa QR Kodları</title>
    <style>
      body { font-family: Inter, Arial, sans-serif; margin: 0; padding: 12mm; color: #0F172A; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8mm; }
      .card { border: 1px solid #CBD5E1; border-radius: 4mm; padding: 6mm; text-align: center; break-inside: avoid; }
      .card img { width: 45mm; height: 45mm; }
      .name { font-size: 16pt; font-weight: 700; margin-top: 3mm; }
      .hint { font-size: 8.5pt; color: #64748B; margin-top: 1.5mm; }
    </style></head><body><div class="grid">${cards}</div>
    <script>
      Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r })))
        .then(() => { window.focus(); window.print() })
    <\/script></body></html>`)
  w.document.close()
}

const STATUS = {
  Pending:  ['Bekliyor',     'chip-accent'],
  Accepted: ['Onaylandı',    'chip-success'],
  Rejected: ['Reddedildi',   'chip-danger'],
  Expired:  ['Zaman aşımı',  'chip-neutral'],
}
const statusLabel = s => STATUS[s]?.[0] ?? s
const statusChip  = s => STATUS[s]?.[1] ?? 'chip-neutral'

function fmtTime(v) {
  const d = new Date(v)
  return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
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
  loadQrOrdering()
})
</script>
