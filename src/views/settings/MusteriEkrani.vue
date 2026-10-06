<template>
  <div class="p-8 max-w-5xl">
    <h1 class="text-2xl font-bold text-primary">Müşteri Ekranı</h1>
    <p class="text-muted text-sm mt-1 mb-6">
      Kasaya bağlı ikinci ekranda müşterinin gördüğü sayfa. Kasa açılırken bu ayarları
      indirir; ikinci ekran bağlı değilse hiçbir şey değişmez.
    </p>

    <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

      <!-- ── AYARLAR ─────────────────────────────────────────────── -->
      <div class="space-y-6">
        <div class="bg-white rounded-2xl shadow-sm p-6">
          <label class="flex items-center gap-3 cursor-pointer">
            <input v-model="form.isEnabled" type="checkbox" class="w-5 h-5"/>
            <span class="font-bold text-primary">Müşteri ekranını kullan</span>
          </label>
          <p class="text-xs text-muted mt-2">
            Kapalıyken kasa ikinci ekrana hiçbir şey göndermez.
          </p>
        </div>

        <div class="bg-white rounded-2xl shadow-sm p-6 space-y-4"
             :class="form.isEnabled ? '' : 'opacity-50 pointer-events-none'">
          <h2 class="font-bold text-primary">Metinler</h2>

          <div>
            <label class="block text-xs font-semibold text-muted mb-1">Karşılama yazısı</label>
            <input v-model="form.welcomeText" maxlength="60"
                   class="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm"/>
            <p class="text-xs text-muted mt-1">Sepet boşken ekranın üstünde görünür.</p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-muted mb-1">Teşekkür yazısı</label>
            <input v-model="form.thankYouText" maxlength="60"
                   class="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm"/>
            <p class="text-xs text-muted mt-1">Ödeme tamamlandığında birkaç saniye görünür.</p>
          </div>

          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="form.showLinePrices" type="checkbox" class="w-4 h-4"/>
            <span class="text-sm">Sepette satır fiyatlarını göster</span>
          </label>

          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="form.showChange" type="checkbox" class="w-4 h-4"/>
            <span class="text-sm">Ödemede alınan para ve para üstünü göster</span>
          </label>
        </div>

        <div class="bg-white rounded-2xl shadow-sm p-6 space-y-4"
             :class="form.isEnabled ? '' : 'opacity-50 pointer-events-none'">
          <h2 class="font-bold text-primary">Logo ve Görseller</h2>

          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="form.showLogo" type="checkbox" class="w-4 h-4"/>
            <span class="text-sm">İşletme logosunu göster</span>
          </label>

          <div class="flex items-center gap-4">
            <div class="w-28 h-20 rounded-xl bg-gray-100 overflow-hidden flex items-center
                        justify-center flex-shrink-0">
              <img v-if="form.logoBase64" :src="form.logoBase64" class="w-full h-full object-contain"/>
              <span v-else class="text-[10px] text-muted">Logo yok</span>
            </div>
            <div class="flex gap-3">
              <button @click="pickLogo" class="text-xs font-bold text-accent hover:underline">
                {{ form.logoBase64 ? 'Değiştir' : 'Logo Yükle' }}
              </button>
              <button v-if="form.logoBase64" @click="form.logoBase64 = null"
                      class="text-xs font-bold text-danger hover:underline">Kaldır</button>
            </div>
          </div>

          <div class="pt-4 border-t border-gray-100">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-semibold">Boştayken dönen görseller</span>
              <button @click="pickSlide" class="text-xs font-bold text-accent hover:underline">
                + Görsel Ekle
              </button>
            </div>
            <p class="text-xs text-muted mb-3">
              Sepet boşken sırayla gösterilir (kampanya, menü afişi). Görsel yoksa
              karşılama yazısı ve logo görünür.
            </p>

            <div v-if="slides.length" class="grid grid-cols-3 gap-2">
              <div v-for="(s, i) in slides" :key="i" class="relative group">
                <img :src="s" class="w-full h-20 object-cover rounded-lg"/>
                <button @click="slides.splice(i, 1)"
                        class="absolute top-1 right-1 px-2 h-6 rounded-md bg-black/60 text-white
                               text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Sil</button>
              </div>
            </div>

            <div v-if="slides.length" class="mt-3">
              <label class="block text-xs font-semibold text-muted mb-1">
                Görsel başına süre: {{ form.slideSeconds }} saniye
              </label>
              <input v-model.number="form.slideSeconds" type="range" min="3" max="30" class="w-full"/>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button @click="save" :disabled="saving"
                  class="px-5 py-2 bg-accent text-white rounded-xl text-sm font-bold
                         hover:bg-blue-600 disabled:opacity-50">
            {{ saving ? 'Kaydediliyor...' : 'Kaydet' }}
          </button>
          <span v-if="saved" class="text-sm text-success font-semibold">Kaydedildi</span>
        </div>
      </div>

      <!-- ── ÖNİZLEME ────────────────────────────────────────────── -->
      <div class="lg:sticky lg:top-8">
        <p class="text-xs font-semibold text-muted uppercase mb-2">Önizleme</p>

        <div class="rounded-2xl overflow-hidden shadow-lg bg-[#0F172A] aspect-video
                    flex flex-col text-white">
          <!-- Üst şerit -->
          <div class="px-6 py-4 flex items-center gap-3 border-b border-white/10">
            <img v-if="form.showLogo && form.logoBase64" :src="form.logoBase64"
                 class="h-8 object-contain"/>
            <span class="text-sm font-semibold opacity-80">{{ form.welcomeText || 'Hoş geldiniz' }}</span>
          </div>

          <!-- Sepet -->
          <div class="flex-1 px-6 py-4 space-y-2 overflow-hidden">
            <div v-for="d in demoLines" :key="d.name" class="flex items-center justify-between">
              <span class="text-sm opacity-90">{{ d.qty }} × {{ d.name }}</span>
              <span v-if="form.showLinePrices" class="text-sm font-semibold">{{ money(d.total) }}</span>
            </div>
          </div>

          <!-- Toplam -->
          <div class="px-6 py-4 bg-white/5 border-t border-white/10">
            <div class="flex items-center justify-between">
              <span class="text-sm opacity-70">TOPLAM</span>
              <span class="text-2xl font-bold">{{ money(demoTotal) }}</span>
            </div>
            <div v-if="form.showChange" class="flex items-center justify-between mt-1 text-xs opacity-70">
              <span>Alınan 500,00 ₺</span>
              <span>Para üstü {{ money(500 - demoTotal) }}</span>
            </div>
          </div>
        </div>

        <p class="text-xs text-muted mt-3">
          Kasada ikinci ekran bağlıysa bu sayfa oraya tam ekran açılır. Tek ekranlı
          kasada hiçbir şey değişmez.
        </p>
      </div>
    </div>

    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFile"/>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '../../api/api'

const saving = ref(false)
const saved  = ref(false)
const error  = ref('')

const form = reactive({
  isEnabled: false,
  welcomeText: 'Hoş geldiniz',
  thankYouText: 'Teşekkür ederiz, yine bekleriz',
  showLogo: true,
  logoBase64: null,
  slideSeconds: 8,
  showLinePrices: true,
  showChange: true,
})

const slides = ref([])

// Önizlemedeki örnek sepet
const demoLines = [
  { name: 'Adana Kebap', qty: 1, total: 320 },
  { name: 'Ayran', qty: 2, total: 60 },
  { name: 'Künefe', qty: 1, total: 150 },
]
const demoTotal = computed(() => demoLines.reduce((s, d) => s + d.total, 0))

function money(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}

// ── Görseller ────────────────────────────────────────────────────────────
// Ekran genelde 1280×720 civarı; görseller o ölçüye indirilir, yoksa
// ayar kaydı megabaytlara çıkar ve kasa her açılışta onu indirir.
const fileInput = ref(null)
let pickTarget = 'logo'

function pickLogo()  { pickTarget = 'logo';  fileInput.value?.click() }
function pickSlide() { pickTarget = 'slide'; fileInput.value?.click() }

function onFile(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file || !file.type.startsWith('image/')) return

  const reader = new FileReader()
  reader.onload = (ev) => {
    const img = new Image()
    img.onload = () => {
      const max = pickTarget === 'logo' ? 400 : 1280
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)

      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, w, h)

      // Logo şeffaf olabilir → PNG; afişler fotoğraf → JPEG.
      const dataUrl = pickTarget === 'logo'
        ? canvas.toDataURL('image/png')
        : canvas.toDataURL('image/jpeg', 0.85)

      if (pickTarget === 'logo') form.logoBase64 = dataUrl
      else slides.value.push(dataUrl)
    }
    img.src = ev.target.result
  }
  reader.readAsDataURL(file)
}

// ── Yükle / kaydet ───────────────────────────────────────────────────────
async function load() {
  try {
    const res = await api.getCustomerDisplay()
    const d = res.data || {}
    Object.assign(form, {
      isEnabled: !!d.isEnabled,
      welcomeText: d.welcomeText || 'Hoş geldiniz',
      thankYouText: d.thankYouText || 'Teşekkür ederiz, yine bekleriz',
      showLogo: d.showLogo !== false,
      logoBase64: d.logoBase64 || null,
      slideSeconds: d.slideSeconds || 8,
      showLinePrices: d.showLinePrices !== false,
      showChange: d.showChange !== false,
    })
    try { slides.value = JSON.parse(d.slidesJson || '[]') } catch { slides.value = [] }
  } catch (e) {
    error.value = e.response?.data?.message || 'Ayarlar alınamadı.'
  }
}
onMounted(load)

async function save() {
  saving.value = true
  saved.value = false
  error.value = ''
  try {
    await api.saveCustomerDisplay({ ...form, slidesJson: JSON.stringify(slides.value) })
    saved.value = true
    setTimeout(() => (saved.value = false), 3000)
  } catch (e) {
    error.value = e.response?.data?.message || 'Kaydedilemedi.'
  } finally {
    saving.value = false
  }
}
</script>
