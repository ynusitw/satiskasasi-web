<template>
  <div class="menu-page min-h-screen">

    <!-- ── Yüklenme ─────────────────────────────────────────────── -->
    <div v-if="loading" class="min-h-screen menu-surface">
      <div class="hero-skel"></div>
      <div class="max-w-2xl mx-auto p-4 space-y-3">
        <div class="h-10 skel rounded-full"></div>
        <div class="grid grid-cols-2 gap-3 mt-4">
          <div class="h-28 skel rounded-2xl" v-for="i in 6" :key="i"></div>
        </div>
      </div>
    </div>

    <!-- ── Bulunamadı ───────────────────────────────────────────── -->
    <div v-else-if="notFound"
         class="flex flex-col items-center justify-center min-h-screen text-center p-8 menu-surface">
      <div class="font-bold text-xl text-ink">Menü bulunamadı</div>
      <div class="text-sm text-inkmuted mt-1">Bağlantıyı kontrol edin ya da işletmeyle iletişime geçin.</div>
    </div>

    <!-- ── Menü ─────────────────────────────────────────────────── -->
    <div v-else>
      <!-- Hero -->
      <header class="hero px-5 pt-9 pb-7 text-center relative overflow-hidden">
        <div class="hero-glow"></div>
        <div class="relative">
          <h1 class="text-[26px] leading-tight font-extrabold text-white">
            {{ menu.businessName }}
          </h1>
          <div v-if="menu.address || menu.phone"
               class="flex items-center justify-center gap-3 mt-3 flex-wrap">
            <a v-if="menu.phone" :href="`tel:${menu.phone}`" class="hero-chip">
              {{ menu.phone }}
            </a>
            <a v-if="menu.address" :href="mapUrl" target="_blank" rel="noopener" class="hero-chip">
              Konum
            </a>
          </div>
        </div>
      </header>

      <!-- Arama (sticky) -->
      <div class="sticky top-0 z-20 bg-cream/95 backdrop-blur border-b border-black/5">
        <div class="max-w-2xl mx-auto px-4 py-3">
          <div class="relative">
            <input v-model="search" type="text" placeholder="Menüde ara..."
                   class="search-input w-full pl-4 pr-9 py-2.5 rounded-full text-sm
                          text-ink placeholder:text-inkmuted/70 focus:outline-none"/>
            <button v-if="search" @click="search = ''"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-inkmuted text-sm">✕</button>
          </div>
        </div>
      </div>

      <div class="max-w-2xl mx-auto px-4 pb-10 pt-4">

        <!-- ══ ARAMA SONUÇLARI ══ -->
        <template v-if="search.trim()">
          <div class="text-xs font-bold text-inkmuted uppercase tracking-wide mb-3">
            Arama sonuçları
          </div>
          <div v-if="searchResults.length" class="space-y-2.5">
            <ProductRow v-for="p in searchResults" :key="p.id" :product="p" @open="openPreview"/>
          </div>
          <div v-else class="text-center py-16 text-inkmuted">
            "{{ search }}" için sonuç bulunamadı
          </div>
        </template>

        <!-- ══ SEVİYE 2: KATEGORİ İÇİ ÜRÜNLER ══ -->
        <template v-else-if="activeCategory">
          <button @click="activeCategory = null" class="back-link">
            ‹ Kategorilere Dön
          </button>

          <div class="flex items-baseline gap-2 mt-3 mb-4">
            <h2 class="text-xl font-extrabold text-ink">{{ activeCategory.name }}</h2>
            <span class="text-xs text-inkmuted font-semibold">
              {{ activeCategory.products.length }} ürün
            </span>
          </div>

          <div class="space-y-2.5">
            <ProductRow v-for="p in activeCategory.products" :key="p.id" :product="p" @open="openPreview"/>
          </div>
        </template>

        <!-- ══ SEVİYE 1: ÖNE ÇIKANLAR + KATEGORİLER ══ -->
        <template v-else>
          <!-- Bunları beğenebilirsiniz -->
          <section v-if="menu.featured?.length" class="mb-7">
            <h2 class="text-[15px] font-extrabold text-ink text-center mb-3">
              Bunları Beğenebilirsiniz
            </h2>
            <div class="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              <div v-for="p in menu.featured" :key="p.id" class="featured-card"
                   :class="{ 'is-clickable': p.imageBase64 }"
                   @click="p.imageBase64 && openPreview(p)">
                <div class="featured-media">
                  <img v-if="p.imageBase64" :src="p.imageBase64" :alt="p.name"/>
                </div>
                <div class="px-2 py-2 text-center">
                  <div class="text-xs font-bold text-ink truncate">{{ p.name }}</div>
                  <div class="text-xs font-extrabold price-tag mt-0.5">{{ fmt(p.price) }}</div>
                </div>
              </div>
            </div>
          </section>

          <!-- Kategoriler -->
          <div class="grid grid-cols-2 gap-3">
            <button v-for="c in categoriesWithProducts" :key="c.id"
                    @click="openCategory(c)"
                    class="category-card"
                    :style="c.menuImageBase64
                      ? { backgroundImage: `url(${c.menuImageBase64})` }
                      : { background: c.colorHex || '#D97706' }">
              <span class="category-overlay"></span>
              <span class="category-label">
                {{ c.name }}
                <span class="category-count">{{ c.products.length }} ürün</span>
              </span>
            </button>
          </div>

          <div v-if="categoriesWithProducts.length === 0"
               class="text-center py-16 text-inkmuted">
            Menüde henüz ürün yok
          </div>
        </template>
      </div>

      <footer class="text-center text-xs text-inkmuted/70 py-6 border-t border-black/5">
        Dijital menü · SatışKasası ile oluşturuldu
      </footer>

      <Transition name="fade">
        <button v-if="showScrollTop" @click="scrollToTop"
                class="scroll-top-btn" aria-label="Yukarı çık">↑</button>
      </Transition>

      <!-- ── Ürün fotoğrafı önizleme ──────────────────────────────── -->
      <Transition name="fade">
        <div v-if="preview" class="lightbox" @click="closePreview">
          <div class="lightbox-inner" @click.stop>
            <button class="lightbox-close" @click="closePreview" aria-label="Kapat">✕</button>
            <!-- Küçük görsel anında görünür (bulanık), tam çözünürlüklü
                 fotoğraf inince üstüne biner. -->
            <div class="lightbox-media" :class="{ 'is-inactive': preview.isActive === false }">
              <img class="lightbox-blur" :class="{ 'is-fallback': fullFailed }"
                   :src="preview.imageBase64" :alt="fullFailed ? preview.name : ''"
                   :aria-hidden="fullFailed ? null : 'true'"/>
              <img class="lightbox-full" :class="{ 'is-ready': fullLoaded }"
                   :src="previewFullUrl" :alt="preview.name"
                   @load="fullLoaded = true" @error="onFullError"/>
            </div>
            <div class="lightbox-info">
              <div class="lightbox-name">{{ preview.name }}</div>
              <div v-if="preview.description" class="lightbox-desc">{{ preview.description }}</div>
              <div v-if="previewAllergens.length" class="lightbox-allergens">
                Alerjen: {{ previewAllergens.join(', ') }}
              </div>
              <div class="lightbox-foot">
                <span class="lightbox-price">{{ fmt(preview.price) }}</span>
                <span v-if="preview.isActive === false" class="lightbox-unavailable">
                  Şu anda mevcut değil
                </span>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import api, { API_BASE } from '../api/api'
import ProductRow from '../components/MenuProductRow.vue'
import { allergenLabels } from '../constants/allergens'

const route      = useRoute()
const loading    = ref(true)
const notFound   = ref(false)
const menu       = ref({ businessName: '', address: '', phone: '', featured: [], categories: [] })
const activeCategory = ref(null)
const search     = ref('')
const showScrollTop = ref(false)
const preview    = ref(null)
const previewFullUrl = ref('')
const fullLoaded = ref(false)
const fullFailed = ref(false)

const previewAllergens = computed(() =>
  preview.value ? allergenLabels(preview.value.allergens) : [])

const categoriesWithProducts = computed(() =>
  menu.value.categories.filter(c => c.products.length > 0))

const searchResults = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return []
  return categoriesWithProducts.value
    .flatMap(c => c.products)
    .filter(p => p.name.toLowerCase().includes(q) ||
                 (p.description || '').toLowerCase().includes(q))
})

const mapUrl = computed(() =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(menu.value.address || menu.value.businessName)}`)

function fmt(v) {
  return new Intl.NumberFormat('tr-TR').format(v ?? 0) + ' ₺'
}

function openCategory(c) {
  activeCategory.value = c
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function openPreview(p) {
  preview.value = p
  fullLoaded.value = false
  fullFailed.value = false
  // Büyük fotoğraf menü JSON'unda gelmiyor; yalnızca burada indiriliyor.
  previewFullUrl.value = `${API_BASE}menu/${route.params.slug}/product/${p.id}/image`
  // Arkadaki menü kaymasın
  document.body.style.overflow = 'hidden'
}
function onFullError() {
  // Sunucu büyük fotoğrafı veremiyorsa (eski API sürümü, ağ hatası) küçük
  // görseli bulanıklaştırmadan gösteririz — bulanık bırakmak daha kötü olurdu.
  fullLoaded.value = false
  fullFailed.value = true
}

function closePreview() {
  preview.value = null
  previewFullUrl.value = ''
  document.body.style.overflow = ''
}
function onKeydown(e) {
  if (e.key === 'Escape') closePreview()
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function onScroll() {
  showScrollTop.value = window.scrollY > 480
}

onMounted(async () => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKeydown)
  try {
    const res = await api.getPublicMenu(route.params.slug)
    menu.value = res.data
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
/*
  Bu sayfa herkese açık, müşteriye dönük bir yüzey — yönetici panelinin
  koyu tema anahtarından (.theme-dark, style.css) tamamen bağımsız olmalı.
  O global stil "bg-white" gibi çıplak class isimlerini ve <main>, <input>
  gibi HTML etiketlerini !important ile eziyor; bu yüzden burada o class
  isimleri ve <main> etiketi hiç kullanılmıyor.
*/
:global(body:has(.menu-page)),
:global(.theme-dark main:has(.menu-page)) {
  background: #FFF8F0 !important;
}

/* Telefon/tarayıcı sistem genelinde koyu temadaysa bazı tarayıcılar açık
   sayfaları otomatik karartır ("force dark") — buradan devre dışı bırakılır. */
:global(html:has(.menu-page)) {
  color-scheme: only light;
}

.menu-page {
  color-scheme: only light;
  --brand: #D97706;
  --brand-dark: #92400E;
  --ink: #1F2937;
  --ink-muted: #8B8378;
  --cream: #FFF8F0;
  background: var(--cream);
  color: var(--ink);
  font-family: inherit;
  position: relative;
  z-index: 0;
}
.menu-surface { background: white; }
.search-input {
  background: white; border: 1px solid rgba(0,0,0,0.1);
  transition: box-shadow .15s ease, border-color .15s ease;
}
.search-input:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(217,119,6,0.15);
}
/* style.css'teki global ".theme-dark input {...}" kuralı çıplak <input>
   etiketini hedefliyor. Not: Vue scoped CSS'inde :global() seçicinin
   TAMAMINI sarmalı, yoksa kural derlemeye hiç girmiyor. */
:global(.theme-dark .search-input) {
  background: white !important;
  color: #1F2937 !important;
  border-color: rgba(0,0,0,0.1) !important;
}
.text-ink { color: var(--ink); }
.text-inkmuted { color: var(--ink-muted); }
.bg-cream\/95 { background-color: rgba(255, 248, 240, 0.95); }

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* Hero */
.hero { background: linear-gradient(135deg, #1F2937 0%, #111827 100%); }
.hero-glow {
  position: absolute; inset: 0;
  background: radial-gradient(circle at 50% 0%, rgba(217,119,6,0.35), transparent 60%);
  pointer-events: none;
}
.hero-chip {
  display: inline-flex; align-items: center;
  font-size: 12px; font-weight: 700; color: white;
  background: rgba(255,255,255,0.12);
  padding: 6px 12px; border-radius: 999px;
  text-decoration: none;
}
.hero-chip:hover { background: rgba(255,255,255,0.2); }

/* Öne çıkanlar */
.featured-card {
  flex: 0 0 132px; background: white; border-radius: 16px;
  overflow: hidden; border: 1px solid rgba(0,0,0,0.05);
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.featured-media { height: 92px; background: #F3ECE3; }
.featured-media img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* Kategori kartları */
.category-card {
  position: relative; height: 108px; border-radius: 18px; overflow: hidden;
  background-size: cover; background-position: center;
  display: flex; align-items: flex-end; text-align: left;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: transform .12s ease;
}
.category-card:active { transform: scale(0.98); }
.category-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.15) 60%, transparent 100%);
}
.category-label {
  position: relative; padding: 10px 12px; width: 100%;
  color: white; font-weight: 800; font-size: 14px; line-height: 1.2;
  text-shadow: 0 1px 3px rgba(0,0,0,0.4);
}
.category-count {
  display: block; font-size: 10.5px; font-weight: 600;
  opacity: .85; margin-top: 2px;
}

/* Geri bağlantısı */
.back-link {
  font-size: 13px; font-weight: 700; color: var(--brand-dark);
  padding: 4px 0;
}

/* Öne çıkan karttaki fiyat (ürün satırı stilleri MenuProductRow.vue'da) */
.price-tag { font-weight: 800; color: var(--brand-dark); }

/* Skeleton */
.hero-skel { height: 160px; background: linear-gradient(135deg,#1F2937,#111827); }
.skel {
  background: linear-gradient(90deg, #EFE7DA 25%, #F7F1E8 37%, #EFE7DA 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}
@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}

/* Scroll-to-top */
.scroll-top-btn {
  position: fixed; right: 16px; bottom: 20px; z-index: 30;
  width: 42px; height: 42px; border-radius: 999px;
  background: var(--brand); color: white; font-size: 18px; font-weight: 700;
  box-shadow: 0 4px 14px rgba(0,0,0,0.2);
}

.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Ürün fotoğrafı önizleme (lightbox) ──────────────────────────
   Yönetici panelinin koyu teması yalnızca çıplak class/etiket
   isimlerini eziyor; burada kendi isimlerimizi kullanıyoruz.       */
.lightbox {
  position: fixed; inset: 0; z-index: 60;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  background: rgba(28, 20, 12, 0.78);
  backdrop-filter: blur(3px);
}
.lightbox-inner {
  position: relative; width: 100%; max-width: 420px;
  background: #FFFDFA; border-radius: 20px; overflow: hidden;
  box-shadow: 0 18px 50px rgba(0,0,0,0.4);
  max-height: 90vh; display: flex; flex-direction: column;
}
.lightbox-media {
  position: relative; width: 100%; height: 62vh;
  background: #F3ECE3; overflow: hidden;
}
.lightbox-media img {
  position: absolute; inset: 0;
  width: 100%; height: 100%; object-fit: contain; display: block;
}
/* Tam çözünürlüklü fotoğraf inene kadar küçük görsel bulanık dursun —
   boş gri bir kutu görmektense. */
.lightbox-blur { filter: blur(12px); transform: scale(1.08); }
.lightbox-blur.is-fallback { filter: none; transform: none; }
.lightbox-full { opacity: 0; transition: opacity .25s ease; }
.lightbox-full.is-ready { opacity: 1; }
.lightbox-media.is-inactive { filter: grayscale(1); opacity: .6; }
.lightbox-close {
  position: absolute; top: 10px; right: 10px; z-index: 2;
  width: 32px; height: 32px; border-radius: 50%; border: none;
  background: rgba(0,0,0,0.5); color: white;
  font-size: 14px; line-height: 1; cursor: pointer;
}
.lightbox-info { padding: 14px 16px 16px; overflow-y: auto; }
.lightbox-name { font-size: 17px; font-weight: 800; color: #1F2937; line-height: 1.25; }
.lightbox-desc { font-size: 13px; color: #8B8378; margin-top: 5px; line-height: 1.45; }
.lightbox-allergens { font-size: 11.5px; color: #8B8378; margin-top: 7px; opacity: .9; }
.lightbox-foot {
  display: flex; align-items: center; gap: 9px; flex-wrap: wrap; margin-top: 10px;
}
.lightbox-price { font-size: 17px; font-weight: 800; color: #92400E; }
.lightbox-unavailable {
  font-size: 11px; font-weight: 700; color: #9CA3AF;
  background: #F3F4F6; padding: 3px 9px; border-radius: 999px;
}

.featured-card.is-clickable { cursor: pointer; transition: transform .12s ease; }
.featured-card.is-clickable:active { transform: scale(.97); }
</style>
