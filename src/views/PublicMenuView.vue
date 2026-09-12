<template>
  <div class="menu-page min-h-screen">

    <!-- ── Yüklenme ─────────────────────────────────────────────── -->
    <div v-if="loading" class="min-h-screen menu-surface">
      <div class="hero-skel"></div>
      <div class="max-w-2xl mx-auto p-4 space-y-3">
        <div class="h-10 skel rounded-full"></div>
        <div class="flex gap-2">
          <div class="h-9 w-20 skel rounded-full" v-for="i in 4" :key="i"></div>
        </div>
        <div class="grid grid-cols-2 gap-3 mt-4">
          <div class="h-40 skel rounded-2xl" v-for="i in 6" :key="i"></div>
        </div>
      </div>
    </div>

    <!-- ── Bulunamadı ───────────────────────────────────────────── -->
    <div v-else-if="notFound"
         class="flex flex-col items-center justify-center min-h-screen text-center p-8 menu-surface">
      <div class="text-6xl mb-4">🍽️</div>
      <div class="font-bold text-xl text-ink">Menü bulunamadı</div>
      <div class="text-sm text-inkmuted mt-1">Bağlantıyı kontrol edin ya da işletmeyle iletişime geçin.</div>
    </div>

    <!-- ── Menü ─────────────────────────────────────────────────── -->
    <div v-else>
      <!-- Hero -->
      <header class="hero px-5 pt-9 pb-7 text-center relative overflow-hidden">
        <div class="hero-glow"></div>
        <div class="relative">
          <div class="hero-badge">🍴 DİJİTAL MENÜ</div>
          <h1 class="text-[26px] leading-tight font-extrabold text-white mt-2">
            {{ menu.businessName }}
          </h1>
          <div v-if="menu.address || menu.phone"
               class="flex items-center justify-center gap-3 mt-3 flex-wrap">
            <a v-if="menu.phone" :href="`tel:${menu.phone}`"
               class="hero-chip">
              📞 {{ menu.phone }}
            </a>
            <a v-if="menu.address" :href="mapUrl" target="_blank" rel="noopener"
               class="hero-chip">
              📍 Konum
            </a>
          </div>
        </div>
      </header>

      <!-- Arama + Kategori (sticky) -->
      <div class="sticky top-0 z-20 bg-cream/95 backdrop-blur border-b border-black/5">
        <div class="max-w-2xl mx-auto px-4 pt-3">
          <div class="relative">
            <input v-model="search" type="text" placeholder="Menüde ara..."
                   class="search-input w-full pl-4 pr-9 py-2.5 rounded-full text-sm
                          text-ink placeholder:text-inkmuted/70 focus:outline-none"/>
            <button v-if="search" @click="search = ''"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-inkmuted text-sm">✕</button>
          </div>
        </div>

        <div class="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar max-w-2xl mx-auto">
          <button @click="selectedCategoryId = null"
                  class="cat-pill" :class="{ active: selectedCategoryId === null }">
            Tümü
            <span class="cat-count">{{ totalProductCount }}</span>
          </button>
          <button v-for="c in categoriesWithProducts" :key="c.id"
                  @click="selectedCategoryId = c.id"
                  class="cat-pill"
                  :class="{ active: selectedCategoryId === c.id }"
                  :style="selectedCategoryId === c.id ? { background: c.colorHex || undefined } : {}">
            <span v-if="c.iconGlyph">{{ c.iconGlyph }}</span>{{ c.name }}
            <span class="cat-count">{{ c.products.length }}</span>
          </button>
        </div>
      </div>

      <!-- Ürünler -->
      <div class="max-w-2xl mx-auto px-4 pb-10 pt-2">
        <TransitionGroup name="fade-slide" tag="div">
          <section v-for="c in visibleCategories" :key="c.id" class="mb-7">
            <h2 class="flex items-center gap-2 mb-3 pt-2">
              <span class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    :style="{ background: c.colorHex || '#D97706' }"></span>
              <span class="font-bold text-ink text-[17px]">
                <span v-if="c.iconGlyph" class="mr-0.5">{{ c.iconGlyph }}</span>{{ c.name }}
              </span>
              <span class="text-xs text-inkmuted font-semibold">{{ c.products.length }} ürün</span>
            </h2>

            <div class="grid grid-cols-2 gap-3">
              <div v-for="p in c.products" :key="p.id" class="product-card">
                <div class="product-media">
                  <img v-if="p.imageBase64" :src="p.imageBase64" :alt="p.name"/>
                  <div v-else class="product-placeholder">🍽️</div>
                </div>
                <div class="p-2.5">
                  <div class="font-semibold text-ink text-sm leading-snug line-clamp-2">
                    {{ p.name }}
                  </div>
                  <div class="price-tag mt-1.5">{{ fmt(p.price) }}</div>
                </div>
              </div>
            </div>
          </section>
        </TransitionGroup>

        <div v-if="visibleCategories.length === 0"
             class="text-center py-16 text-inkmuted">
          <div class="text-4xl mb-3">🔍</div>
          <div v-if="search">"{{ search }}" için sonuç bulunamadı</div>
          <div v-else>Bu kategoride ürün yok</div>
        </div>
      </div>

      <footer class="text-center text-xs text-inkmuted/70 py-6 border-t border-black/5">
        🍴 Dijital menü · SatışKasası ile oluşturuldu
      </footer>

      <!-- Yukarı çık -->
      <Transition name="fade">
        <button v-if="showScrollTop" @click="scrollToTop"
                class="scroll-top-btn" aria-label="Yukarı çık">↑</button>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api/api'

const route      = useRoute()
const loading    = ref(true)
const notFound   = ref(false)
const menu       = ref({ businessName: '', address: '', phone: '', categories: [] })
const selectedCategoryId = ref(null)
const search     = ref('')
const showScrollTop = ref(false)

const categoriesWithProducts = computed(() =>
  menu.value.categories.filter(c => c.products.length > 0))

const totalProductCount = computed(() =>
  categoriesWithProducts.value.reduce((sum, c) => sum + c.products.length, 0))

const visibleCategories = computed(() => {
  const q = search.value.trim().toLowerCase()

  let cats = categoriesWithProducts.value
  if (selectedCategoryId.value !== null)
    cats = cats.filter(c => c.id === selectedCategoryId.value)

  if (!q) return cats

  return cats
    .map(c => ({ ...c, products: c.products.filter(p => p.name.toLowerCase().includes(q)) }))
    .filter(c => c.products.length > 0)
})

const mapUrl = computed(() =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(menu.value.address || menu.value.businessName)}`)

function fmt(v) {
  return new Intl.NumberFormat('tr-TR').format(v ?? 0) + ' ₺'
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function onScroll() {
  showScrollTop.value = window.scrollY > 480
}

onMounted(async () => {
  window.addEventListener('scroll', onScroll, { passive: true })
  try {
    const res = await api.getPublicMenu(route.params.slug)
    menu.value = res.data
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
})

onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
/*
  Bu sayfa herkese açık, müşteriye dönük bir yüzey — yönetici panelinin
  koyu tema anahtarından (.theme-dark, style.css) tamamen bağımsız olmalı.
  O global stil, "bg-white" gibi çıplak Tailwind class isimlerini !important
  ile eziyor; scoped stil bunu engellemediği için (scoping yalnızca bu
  bileşenin kendi kurallarını dışarı sızdırmaz, dışarıdan gelen global
  kuralları içeri girmekten alıkoymaz) o class isimlerini hiç kullanmıyoruz
  ve <main>/body'yi de burada açıkça sıfırlıyoruz.
*/
:global(body:has(.menu-page)),
:global(.theme-dark main:has(.menu-page)) {
  background: #FFF8F0 !important;
}

/* Telefon/tarayıcı sistem genelinde koyu temadaysa, bazı tarayıcılar
   (özellikle Android Chrome) açık renkli sayfaları otomatik olarak koyuya
   çevirip lacivert bir filtre uygular ("force dark"). "light" bildirerek bu
   otomatik karartmadan çıkıyoruz — sayfa kendi renklerini korur. */
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
   etiketini hedefliyor — class'tan bağımsız, burayı da eziyordu.
   Not: Vue'nun scoped CSS'inde :global() seçicinin TAMAMINI sarmalı,
   yoksa (":global(.theme-dark) .search-input" gibi) kural derlemeye hiç
   girmiyor — bu yüzden burada da tüm seçici :global() içinde. */
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
.hero {
  background: linear-gradient(135deg, #1F2937 0%, #111827 100%);
}
.hero-glow {
  position: absolute; inset: 0;
  background: radial-gradient(circle at 50% 0%, rgba(217,119,6,0.35), transparent 60%);
  pointer-events: none;
}
.hero-badge {
  display: inline-block;
  font-size: 10px; font-weight: 800; letter-spacing: .08em;
  color: #FBBF24; background: rgba(251,191,36,0.12);
  padding: 4px 10px; border-radius: 999px;
}
.hero-chip {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; font-weight: 700; color: white;
  background: rgba(255,255,255,0.12);
  padding: 6px 12px; border-radius: 999px;
  text-decoration: none;
}
.hero-chip:hover { background: rgba(255,255,255,0.2); }

/* Kategori pilleri */
.cat-pill {
  flex-shrink: 0; display: flex; align-items: center; gap: 5px;
  padding: 8px 14px; border-radius: 999px;
  font-size: 13px; font-weight: 700; white-space: nowrap;
  background: white; color: var(--ink-muted);
  border: 1px solid rgba(0,0,0,0.08);
  transition: all .15s ease;
}
.cat-pill.active {
  background: var(--brand); color: white; border-color: transparent;
}
.cat-count {
  font-size: 10px; font-weight: 800;
  background: rgba(0,0,0,0.08); color: inherit;
  padding: 1px 6px; border-radius: 999px;
}
.cat-pill.active .cat-count { background: rgba(255,255,255,0.25); }

/* Ürün kartı */
.product-card {
  background: white; border-radius: 16px; overflow: hidden;
  border: 1px solid rgba(0,0,0,0.05);
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.product-media { aspect-ratio: 4 / 3; background: #F3ECE3; }
.product-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.product-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; opacity: .5;
}
.price-tag {
  display: inline-block; font-weight: 800; font-size: 13.5px;
  color: var(--brand-dark);
}
.line-clamp-2 {
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}

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

/* Geçişler */
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.fade-slide-enter-active { transition: all .25s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(6px); }
</style>
