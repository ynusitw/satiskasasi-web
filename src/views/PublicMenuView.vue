<template>
  <div class="menu-page min-h-screen">

    <!-- ── Yüklenme ─────────────────────────────────────────────── -->
    <div v-if="loading" class="min-h-screen menu-surface">
      <div class="max-w-2xl mx-auto p-4 space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-14 h-14 skel rounded-2xl"></div>
          <div class="flex-1 space-y-2"><div class="h-4 w-40 skel rounded-full"></div><div class="h-3 w-24 skel rounded-full"></div></div>
        </div>
        <div class="h-12 skel rounded-full"></div>
        <div class="flex gap-4"><div class="w-[72px] h-[72px] skel rounded-full" v-for="i in 4" :key="i"></div></div>
        <div class="h-40 skel rounded-3xl"></div>
        <div class="grid grid-cols-2 gap-3">
          <div class="h-32 skel rounded-3xl" v-for="i in 4" :key="i"></div>
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
      <!-- Başlık: işletme rozeti, adı ve hızlı düğmeler -->
      <header class="menu-head">
        <div class="biz-badge" aria-hidden="true">{{ initials }}</div>
        <div class="biz-text">
          <h1 class="biz-name">{{ menu.businessName }}</h1>
          <div class="biz-sub">Dijital Menü</div>
        </div>
        <div class="head-actions">
          <a v-if="menu.phone" :href="`tel:${menu.phone}`" class="round-btn" :title="menu.phone" aria-label="İşletmeyi ara"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2z"/></svg></a>
          <a v-if="menu.address" :href="mapUrl" target="_blank" rel="noopener" class="round-btn" title="Konum" aria-label="Konum"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg></a>
          <button type="button" class="round-btn" title="Paylaş" aria-label="Menüyü paylaş" @click="shareMenu"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg></button>
        </div>
      </header>

      <!-- Masadan sipariş bilgisi -->
      <div v-if="menu.ordering" class="order-banner" :class="menu.ordering.enabled ? 'is-ok' : 'is-warn'">
        <template v-if="menu.ordering.enabled">
          <strong>{{ menu.ordering.tableName }}</strong> · Menüden sipariş verebilirsiniz
        </template>
        <template v-else>{{ menu.ordering.message }}</template>
      </div>

      <!-- Şu an geçerli kampanyalar -->
      <div v-if="menu.campaigns?.length" class="camp-strip">
        <div v-for="c in menu.campaigns" :key="c.name" class="camp-chip">
          <strong>{{ c.name }}</strong> · {{ c.description }}<span v-if="c.endTime"> · bitiş {{ c.endTime }}</span>
        </div>
      </div>

      <!-- Garson çağır / Hesap iste -->
      <div v-if="menu.ordering?.calls" class="call-row">
        <button type="button" class="call-btn" :class="{ 'is-on': hasCall('Waiter') }"
                :disabled="callBusy || hasCall('Waiter')" @click="sendCall('Waiter')">
          {{ hasCall('Waiter') ? 'Garson çağrıldı' : 'Garson çağır' }}
        </button>
        <button type="button" class="call-btn" :class="{ 'is-on': hasCall('Bill') }"
                :disabled="callBusy" @click="billOpen = true">
          {{ hasCall('Bill') ? `Hesap istendi${billPayment ? ' · ' + billPayment : ''}` : 'Hesap iste' }}
        </button>
      </div>
      <div v-if="callError" class="call-error">{{ callError }}</div>

      <!-- Verilen siparişin durumu -->
      <button v-if="activeOrder && orderStatus" type="button" class="status-pill"
              :class="`is-${statusInfo.tone}`" @click="statusOpen = true">
        <span class="status-dot"></span>
        {{ statusInfo.short }}
        <span class="status-more">Ayrıntı</span>
      </button>

      <!-- Arama (sticky) -->
      <div class="sticky top-0 z-20 search-bar">
        <div class="max-w-2xl mx-auto px-4 py-3">
          <div class="relative">
            <span class="search-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></span>
            <input v-model="search" type="text" placeholder="Ürün ara..." aria-label="Menüde ara"
                   class="search-input w-full pl-11 pr-20 rounded-full focus:outline-none"/>
            <button v-if="search" @click="search = ''"
                    class="absolute right-4 top-1/2 -translate-y-1/2 text-inkmuted text-xs font-semibold">Temizle</button>
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
            <ProductRow v-for="p in searchResults" :key="p.id" :product="p"
                        :image-url="thumbUrl(p)" :orderable="canOrder"
                        @open="openPreview" @add="startAdd"/>
          </div>
          <div v-else class="text-center py-16 text-inkmuted">
            "{{ search }}" için sonuç bulunamadı
          </div>
        </template>

        <!-- ══ SEVİYE 2: KATEGORİ İÇİ ÜRÜNLER ══ -->
        <template v-else-if="activeCategory">
          <div class="crumbs"><button type="button" @click="activeCategory = null">Menü</button> › <span>{{ activeCategory.name }}</span></div>
          <div class="cat-bar">
            <button type="button" @click="activeCategory = null" class="back-link round-btn is-dark"
                    title="Kategorilere dön" aria-label="Kategorilere dön"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></button>
            <div class="cat-chips no-scrollbar">
              <button v-for="c in categoriesWithProducts" :key="c.id" type="button" class="cat-chip"
                      :class="{ 'is-on': c.id === activeCategory?.id }"
                      @click="openCategory(c)">{{ c.name }}</button>
            </div>
          </div>

          <h2 class="sr-only">{{ activeCategory.name }}</h2>
          <div class="text-xs text-inkmuted font-semibold mb-3 px-1">{{ activeCategory.products.length }} ürün</div>

          <div class="space-y-3">
            <ProductRow v-for="p in activeCategory.products" :key="p.id" :product="p"
                        :image-url="thumbUrl(p)" :orderable="canOrder"
                        @open="openPreview" @add="startAdd"/>
          </div>
        </template>

        <!-- ══ SEVİYE 1: ÖNE ÇIKANLAR + KATEGORİLER ══ -->
        <template v-else>
          <!-- Bunları beğenebilirsiniz -->
          <section v-if="menu.featured?.length" class="mb-6">
            <h2 class="section-head">Öne Çıkanlar</h2>
            <div class="flex gap-4 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
              <button v-for="p in menu.featured" :key="p.id" type="button" class="featured-item"
                      :class="{ 'is-off': p.isActive === false }" @click="openPreview(p)">
                <span class="featured-ring">
                  <MenuImage v-if="p.hasImage" :src="thumbUrl(p)" :alt="p.name" class="featured-img" eager/>
                  <span v-else class="featured-letter">{{ p.name.slice(0, 1) }}</span>
                </span>
                <span class="featured-name">{{ p.name }}</span>
                <span class="featured-price">
                  <template v-if="p.isSoldOut">Tükendi</template>
                  <template v-else>{{ fmt(menuPrice(p)) }}</template>
                </span>
              </button>
            </div>
          </section>

          <!-- Kategoriler -->
          <div class="grid grid-cols-2 gap-3">
            <button v-for="(c, i) in categoriesWithProducts" :key="c.id"
                    @click="openCategory(c)"
                    class="category-card" :class="{ 'is-wide': i === 0 }"
                    :style="{ background: c.colorHex || '#1E3A2F' }">
              <MenuImage v-if="c.hasImage" :src="categoryUrl(c)" :alt="c.name"
                         class="category-img" eager/>
              <span class="category-overlay"></span>
              <span class="category-label">{{ c.name }}</span>
              <span class="category-count">{{ c.products.length }} ürün</span>
            </button>
          </div>

          <div v-if="categoriesWithProducts.length === 0"
               class="text-center py-16 text-inkmuted">
            Menüde henüz ürün yok
          </div>
        </template>
      </div>

      <footer class="text-center text-xs text-inkmuted/70 py-6 border-t border-black/5">
        Dijital menü · YenPOS ile hazırlandı
      </footer>

      <Transition name="fade">
        <button v-if="showScrollTop" @click="scrollToTop"
                class="scroll-top-btn" :class="{ 'is-raised': cart.length }"
                aria-label="Yukarı çık">Yukarı</button>
      </Transition>

      <!-- ── Ürün fotoğrafı önizleme ──────────────────────────────── -->
      <Transition name="fade">
        <div v-if="preview" class="lightbox" @click="closePreview">
          <div class="lightbox-inner" @click.stop>
            <span class="lightbox-grip" aria-hidden="true"></span>
            <button class="lightbox-close" @click="closePreview" aria-label="Kapat">✕</button>
            <!-- Küçük görsel anında görünür (bulanık), tam çözünürlüklü
                 fotoğraf inince üstüne biner. -->
            <div v-if="preview.hasImage" class="lightbox-media" :class="{ 'is-inactive': preview.isActive === false }">
              <MenuImage v-if="preview.hasImage" class="lightbox-blur"
                         :class="{ 'is-fallback': fullFailed }"
                         :src="thumbUrl(preview)" :alt="preview.name" eager/>
              <img v-if="previewFullUrl" class="lightbox-full" :class="{ 'is-ready': fullLoaded }"
                   :src="previewFullUrl" :alt="preview.name"
                   @load="fullLoaded = true" @error="onFullError"/>
            </div>
            <div class="lightbox-info">
              <div class="lightbox-name">{{ preview.name }}</div>
              <div v-if="preview.description" class="lightbox-desc">{{ preview.description }}</div>
              <div v-if="previewAllergenCodes.length" class="lightbox-allergens">
                <strong>Alerjen:</strong>
                <span v-for="(c, i) in previewAllergenCodes" :key="c" class="allergen-item">
                  <AllergenIcon :code="c" :size="18"/>{{ previewAllergens[i] }}<template v-if="i < previewAllergenCodes.length - 1">,</template>
                </span>
              </div>
              <div class="lightbox-foot">
                <span class="lightbox-price">
                  <span v-if="preview.campaign && preview.isActive !== false" class="price-old">{{ fmt(preview.price) }}</span>{{ fmt(menuPrice(preview)) }}
                </span>
                <span v-if="preview.isActive === false" class="lightbox-unavailable">
                  {{ preview.isSoldOut ? 'Tükendi' : 'Şu anda mevcut değil' }}
                </span>
                <button v-if="canOrder && preview.isActive !== false" type="button" class="lightbox-add"
                        @click="startAdd(preview)">Sepete ekle</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- ── Masadan sipariş ─────────────────────────────────────── -->
      <MenuOptionSheet v-if="optionProduct" :product="optionProduct"
                       @add="addToCart" @close="optionProduct = null"/>

      <Transition name="fade">
        <div v-if="toast" class="toast">{{ toast }}</div>
      </Transition>

      <!-- Sepet çubuğu -->
      <button v-if="cart.length && !cartOpen" type="button" class="cart-bar" @click="cartOpen = true">
        <span class="cart-count">{{ cartCount }}</span>
        <span class="cart-label">Sepeti gör</span>
        <span class="cart-total">{{ fmt(cartTotal) }}</span>
      </button>

      <!-- Sepet -->
      <div v-if="cartOpen" class="sheet-backdrop" @click="cartOpen = false">
        <div class="sheet" @click.stop>
          <div class="sheet-head">
            <div class="sheet-title">Sepetiniz · {{ menu.ordering?.tableName }}</div>
            <button type="button" class="sheet-close" @click="cartOpen = false">Kapat</button>
          </div>
          <div class="sheet-body">
            <div v-if="!cart.length" class="empty-cart">Sepetiniz boş.</div>
            <div v-for="(l, i) in cart" :key="i" class="cart-line">
              <div class="cart-line-main">
                <div class="cart-line-name">{{ l.name }}<span v-if="l.variantName"> ({{ l.variantName }})</span></div>
                <div v-if="l.optionNames?.length || l.note" class="cart-line-detail">
                  {{ [l.optionNames?.join(', '), l.note].filter(Boolean).join(' · ') }}
                </div>
                <div class="cart-line-price">{{ fmt((l.unitPrice - (l.unitDiscount || 0)) * l.quantity) }}</div>
              </div>
              <div class="qty">
                <button type="button" @click="changeQty(i, -1)">−</button>
                <span>{{ l.quantity }}</span>
                <button type="button" @click="changeQty(i, 1)" :disabled="l.quantity >= 20">+</button>
              </div>
            </div>

            <template v-if="cart.length">
              <label class="field-lbl">Adınız <span>isteğe bağlı</span></label>
              <input v-model="customerName" maxlength="40" class="text-field" placeholder="Garson sizi bulabilsin diye"/>
              <label class="field-lbl">Sipariş notu <span>isteğe bağlı</span></label>
              <input v-model="orderNote" maxlength="200" class="text-field" placeholder="Ör. çocuk sandalyesi rica ediyoruz"/>
            </template>

            <div v-if="orderError" class="order-error">{{ orderError }}</div>
            <p class="cart-hint">Siparişiniz kasaya iletilir; onaylanınca hazırlanmaya başlar. Ödeme masada yapılır.</p>
          </div>
          <div class="sheet-foot">
            <button type="button" class="add-main" :disabled="!cart.length || sending" @click="submitOrder">
              {{ sending ? 'Gönderiliyor...' : `Siparişi gönder · ${fmt(cartTotal)}` }}
            </button>
          </div>
        </div>
      </div>

      <!-- Hesap iste: ödeme tercihi -->
      <div v-if="billOpen" class="sheet-backdrop" @click="billOpen = false">
        <div class="sheet" @click.stop>
          <div class="sheet-head">
            <div class="sheet-title">Hesap · {{ menu.ordering?.tableName }}</div>
            <button type="button" class="sheet-close" @click="billOpen = false">Kapat</button>
          </div>
          <div class="sheet-body">
            <p class="cart-hint">Nasıl ödemek istersiniz? Garson hesabı masanıza getirir.</p>
          </div>
          <div class="sheet-foot pay-choice">
            <button type="button" class="add-main" :disabled="callBusy" @click="requestBill('Nakit')">Nakit</button>
            <button type="button" class="add-main" :disabled="callBusy" @click="requestBill('Kart')">Kart</button>
          </div>
        </div>
      </div>

      <!-- Sipariş durumu -->
      <div v-if="statusOpen && orderStatus" class="sheet-backdrop" @click="statusOpen = false">
        <div class="sheet" @click.stop>
          <div class="sheet-head">
            <div class="sheet-title">Siparişiniz · {{ orderStatus.tableName }}</div>
            <button type="button" class="sheet-close" @click="statusOpen = false">Kapat</button>
          </div>
          <div class="sheet-body">
            <div class="status-box" :class="`is-${statusInfo.tone}`">
              <div class="status-title">{{ statusInfo.title }}</div>
              <div class="status-text">{{ statusInfo.text }}</div>
              <div v-if="orderStatus.status === 'Rejected' && orderStatus.rejectReason" class="status-text">
                Gerekçe: {{ orderStatus.rejectReason }}
              </div>
            </div>
            <div v-for="(it, i) in orderStatus.items" :key="i" class="cart-line">
              <div class="cart-line-main">
                <div class="cart-line-name">{{ it.quantity }} × {{ it.productName }}<span v-if="it.variantName"> ({{ it.variantName }})</span></div>
                <div v-if="it.modifiersText || it.note" class="cart-line-detail">
                  {{ [it.modifiersText, it.note].filter(Boolean).join(' · ') }}
                </div>
              </div>
              <div class="cart-line-price">{{ fmt(it.unitPrice * it.quantity - (it.discountAmount || 0)) }}</div>
            </div>
            <div class="status-total">Toplam <strong>{{ fmt(orderStatus.total) }}</strong></div>
          </div>
          <div class="sheet-foot">
            <button v-if="orderStatus.status !== 'Pending'" type="button" class="add-main" @click="finishOrder">
              Yeni sipariş ver
            </button>
            <button v-else type="button" class="add-main is-muted" @click="statusOpen = false">Menüye dön</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import api, { API_BASE } from '../api/api'
import ProductRow from '../components/MenuProductRow.vue'
import MenuImage from '../components/MenuImage.vue'
import MenuOptionSheet from '../components/MenuOptionSheet.vue'
import { unitDiscount, discountedPrice } from '../utils/campaign'
import { allergenLabels, parseAllergens } from '../constants/allergens'
import AllergenIcon from '../components/AllergenIcon.vue'

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
const previewAllergenCodes = computed(() =>
  preview.value ? parseAllergens(preview.value.allergens) : [])

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

// Görseller menü yanıtında gelmiyor; her biri kendi adresinden, doğrudan
// API'den iner (sade <img>: tarayıcının önbelleği ve tembel yüklemesi devrede).
function imageUrl(kind, id, size) {
  const slug = encodeURIComponent(route.params.slug)
  return `${API_BASE}menu/${slug}/${kind}/${id}/image${size ? `?size=${size}` : ''}`
}
function thumbUrl(p)    { return imageUrl('product', p.id, 'thumb') }
function categoryUrl(c) { return imageUrl('category', c.id) }
function fullUrl(p)     { return imageUrl('product', p.id) }

// Eski API sürümü görselleri yanıtın içinde gönderiyordu; yenisi yalnızca
// var/yok bilgisi veriyor. İkisi de çalışsın ki API ile Vue'nun hangi sırayla
// yayına alındığı önemli olmasın.
function normalize(data) {
  const markProduct = p => {
    if (p.hasImage === undefined) p.hasImage = !!p.imageBase64
    // Tükenen ürün pasif gibi soluk görünür, sipariş alınmaz (etiketi "Tükendi")
    if (p.isSoldOut) p.isActive = false
  }
  data.featured?.forEach(markProduct)
  data.categories?.forEach(c => {
    if (c.hasImage === undefined) c.hasImage = !!c.menuImageBase64
    c.products?.forEach(markProduct)
  })
  return data
}

function fmt(v) {
  return new Intl.NumberFormat('tr-TR').format(v ?? 0) + ' ₺'
}

function openCategory(c) {
  activeCategory.value = c
  window.scrollTo({ top: 0, behavior: 'smooth' })
  // Seçili kategori çipi görünür alana kaysın (uzun kategori listelerinde)
  nextTick(() => document.querySelector('.cat-chip.is-on')?.scrollIntoView({ inline: 'center', block: 'nearest' }))
}

function openPreview(p) {
  preview.value = p
  fullLoaded.value = false
  fullFailed.value = false
  previewFullUrl.value = p.hasImage ? fullUrl(p) : ''
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

// Başlıktaki rozet: işletme adının baş harfleri ("Yunus Demo Market" → "YD")
const initials = computed(() => (menu.value.businessName || '')
  .split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toLocaleUpperCase('tr')).join(''))

// Menüyü paylaş: telefonda paylaşım penceresi, yoksa bağlantı panoya
async function shareMenu() {
  const url = window.location.href.split('?')[0]
  try {
    if (navigator.share) { await navigator.share({ title: menu.value.businessName, url }); return }
    await navigator.clipboard.writeText(url)
    showToast('Menü bağlantısı kopyalandı')
  } catch { /* kullanıcı vazgeçti */ }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function onScroll() {
  showScrollTop.value = window.scrollY > 480
}

// ── Masadan sipariş ─────────────────────────────────────────────────
// Masa QR'ındaki kod (?masa=...). Yoksa menü salt okunur.
const masa = typeof route.query.masa === 'string' ? route.query.masa : ''
const canOrder = computed(() => !!menu.value.ordering?.enabled)
const storeKey = kind => `qr${kind}:${route.params.slug}:${masa}`

function readStore(kind, fallback) {
  try { return JSON.parse(localStorage.getItem(storeKey(kind))) ?? fallback } catch { return fallback }
}
function writeStore(kind, value) {
  try { value == null ? localStorage.removeItem(storeKey(kind)) : localStorage.setItem(storeKey(kind), JSON.stringify(value)) } catch { /* gizli sekme */ }
}

const cart = ref(masa ? readStore('cart', []) : [])
watch(cart, v => writeStore('cart', v), { deep: true })
const cartOpen = ref(false)
const optionProduct = ref(null)
const customerName = ref(readStore('name', '') || '')
const orderNote = ref('')
const sending = ref(false)
const orderError = ref('')
const toast = ref('')
let toastTimer = null

const cartCount = computed(() => cart.value.reduce((s, l) => s + l.quantity, 0))
const cartTotal = computed(() => cart.value.reduce((s, l) => s + (l.unitPrice - (l.unitDiscount || 0)) * l.quantity, 0))

// Saatlik kampanya: menüdeki fiyat ve sepetteki indirim (sunucu da aynı kuralla hesaplar)
const productById = computed(() => {
  const map = {}
  for (const c of menu.value.categories || []) for (const p of c.products || []) map[p.id] = p
  return map
})
const menuPrice = p => (p.isActive === false ? p.price : discountedPrice(p.campaign, p.price))

function startAdd(p) {
  if (!canOrder.value || p.isActive === false) return
  if (p.variants?.length || p.modifierGroups?.length) {
    optionProduct.value = p
    return
  }
  addToCart({ productId: p.id, name: p.name, variantId: null, variantName: null,
              optionIds: [], optionNames: [], unitPrice: p.price, quantity: 1, note: null })
}

function addToCart(line) {
  line.unitDiscount = unitDiscount(productById.value[line.productId]?.campaign, line.unitPrice)
  const key = l => `${l.productId}|${l.variantId ?? ''}|${[...l.optionIds].sort().join(',')}|${l.note ?? ''}`
  const same = cart.value.find(l => key(l) === key(line))
  if (same) same.quantity = Math.min(20, same.quantity + line.quantity)
  else cart.value.push(line)
  optionProduct.value = null
  if (preview.value) closePreview()
  showToast(`${line.name} sepete eklendi`)
}

function changeQty(i, d) {
  const l = cart.value[i]
  l.quantity += d
  if (l.quantity <= 0) cart.value.splice(i, 1)
  if (!cart.value.length) cartOpen.value = false
}

function showToast(text) {
  toast.value = text
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 1800)
}

// ── Sipariş gönderme ve durum izleme ──
const activeOrder = ref(masa ? readStore('order', null) : null)
const orderStatus = ref(null)
const statusOpen = ref(false)
let pollTimer = null

async function submitOrder() {
  if (!cart.value.length || sending.value) return
  sending.value = true
  orderError.value = ''
  try {
    const { data } = await api.placeQrOrder(route.params.slug, {
      table: masa,
      customerName: customerName.value.trim() || null,
      note: orderNote.value.trim() || null,
      items: cart.value.map(l => ({
        productId: l.productId, variantId: l.variantId, optionIds: l.optionIds,
        quantity: l.quantity, note: l.note,
      })),
    })
    writeStore('name', customerName.value.trim() || null)
    activeOrder.value = { code: data.code, at: Date.now() }
    writeStore('order', activeOrder.value)
    cart.value = []
    orderNote.value = ''
    cartOpen.value = false
    await refreshStatus()
    statusOpen.value = true
  } catch (e) {
    orderError.value = e.response?.data?.message || 'Sipariş gönderilemedi. Bağlantınızı kontrol edip tekrar deneyin.'
  } finally {
    sending.value = false
  }
}

async function refreshStatus() {
  if (!activeOrder.value) return
  try {
    const { data } = await api.getQrOrderStatus(route.params.slug, activeOrder.value.code)
    orderStatus.value = data
    clearTimeout(pollTimer)
    if (data.status === 'Pending') pollTimer = setTimeout(refreshStatus, 5000)
  } catch (e) {
    if (e.response?.status === 404) finishOrder()
    else pollTimer = setTimeout(refreshStatus, 10000)   // geçici ağ hatası
  }
}

// ── Garson çağır / Hesap iste ──
// Açık çağrı varken 8 sn'de bir bakılır: garson "tamam" deyince düğme yeniden açılır.
const calls = ref([])
const callBusy = ref(false)
const callError = ref('')
const billOpen = ref(false)
let callTimer = null
const hasCall = t => calls.value.some(c => c.type === t)
const billPayment = computed(() => calls.value.find(c => c.type === 'Bill')?.payment)

async function refreshCalls() {
  clearTimeout(callTimer)
  if (!masa || !menu.value.ordering?.calls) return
  try {
    calls.value = (await api.getTableCalls(route.params.slug, masa)).data
  } catch { /* geçici ağ hatası: son durum kalır */ }
  if (calls.value.length) callTimer = setTimeout(refreshCalls, 8000)
}

async function sendCall(type, payment) {
  if (callBusy.value) return
  callBusy.value = true
  callError.value = ''
  try {
    const { data } = await api.callTable(route.params.slug, { table: masa, type, payment: payment ?? null })
    calls.value = [...calls.value.filter(c => c.type !== type), data]
    showToast(type === 'Bill' ? 'Hesabınız istendi, garson getirecek' : 'Garson çağrıldı, birazdan masanızda')
    clearTimeout(callTimer)
    callTimer = setTimeout(refreshCalls, 8000)
  } catch (e) {
    callError.value = e.response?.data?.message || 'İletilemedi. Bağlantınızı kontrol edip tekrar deneyin.'
  } finally {
    callBusy.value = false
  }
}

function requestBill(payment) {
  billOpen.value = false
  sendCall('Bill', payment)
}

function finishOrder() {
  clearTimeout(pollTimer)
  activeOrder.value = null
  orderStatus.value = null
  statusOpen.value = false
  writeStore('order', null)
}

const statusInfo = computed(() => {
  switch (orderStatus.value?.status) {
    case 'Accepted': return { tone: 'ok', short: 'Siparişiniz onaylandı', title: 'Siparişiniz onaylandı',
                              text: 'Hazırlanmaya başladı. Afiyet olsun!' }
    case 'Rejected': return { tone: 'bad', short: 'Siparişiniz onaylanmadı', title: 'Siparişiniz onaylanmadı',
                              text: 'Ayrıntı için garsona danışabilirsiniz.' }
    case 'Expired':  return { tone: 'bad', short: 'Sipariş zaman aşımına uğradı', title: 'Sipariş onaylanmadı',
                              text: 'Siparişiniz süresinde onaylanmadı. Lütfen garsona haber verin.' }
    default:         return { tone: 'wait', short: 'Siparişiniz onay bekliyor', title: 'Siparişiniz iletildi',
                              text: 'Kasaya ulaştı, onay bekleniyor. Bu sayfa kendiliğinden güncellenir.' }
  }
})

onMounted(async () => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKeydown)
  // Bir önceki ziyaretten kalan sipariş: 3 saatten eskiyse unutulur.
  if (activeOrder.value && Date.now() - (activeOrder.value.at ?? 0) > 3 * 3600_000) finishOrder()
  if (activeOrder.value) refreshStatus()
  try {
    if (!route.params.slug) throw new Error('menü adı yok')
    const res = await api.getPublicMenu(route.params.slug, masa || undefined)
    menu.value = normalize(res.data)
    // Müşterinin sekmesinde panel adı değil işletmenin adı görünsün
    if (menu.value.businessName) document.title = `${menu.value.businessName} — Menü`
    refreshCalls()
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  clearTimeout(pollTimer)
  clearTimeout(callTimer)
  clearTimeout(toastTimer)
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
  background: #F7F4EE !important;
}

/* Telefon/tarayıcı sistem genelinde koyu temadaysa bazı tarayıcılar açık
   sayfaları otomatik karartır ("force dark") — buradan devre dışı bırakılır. */
:global(html:has(.menu-page)) {
  color-scheme: only light;
}

.menu-page {
  color-scheme: only light;
  /* YenPOS tonları: sıcak açık zemin, lacivert yazı, yeşil vurgu */
  --brand: #16A34A;
  --brand-dark: #15803D;
  --brand-soft: #E3F4E8;
  --ink: #13223A;
  --ink-muted: #7B8089;
  --navy: #13223A;
  --cream: #F7F4EE;
  --soft: #EDE8DF;
  background: var(--cream);
  color: var(--ink);
  font-family: inherit;
  position: relative;
  z-index: 0;
}
.menu-surface { background: var(--cream); }
.text-ink { color: var(--ink); }
.text-inkmuted { color: var(--ink-muted); }

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* Başlık */
.menu-head {
  max-width: 672px; margin: 0 auto; padding: 16px 16px 6px;
  display: flex; align-items: center; gap: 12px;
}
.biz-badge {
  width: 56px; height: 56px; border-radius: 16px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--navy); color: #fff; font-size: 20px; font-weight: 900; letter-spacing: .5px;
  box-shadow: inset 0 -3px 0 var(--brand);
}
.biz-text { flex: 1; min-width: 0; }
.biz-name {
  font-size: 17px; line-height: 1.2; font-weight: 800; color: var(--ink);
  /* Uzun işletme adı iki satıra iner (dar telefonda kesilmesin) */
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  overflow-wrap: anywhere;
}
.biz-sub { font-size: 12.5px; color: var(--ink-muted); margin-top: 2px; }
.head-actions { display: flex; gap: 8px; flex-shrink: 0; }
.round-btn {
  width: 42px; height: 42px; border-radius: 999px; border: none; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--soft); color: var(--ink); text-decoration: none;
  transition: transform .12s ease, background .12s ease;
}
.round-btn:active { transform: scale(.94); }
.round-btn.is-dark { background: var(--navy); color: #fff; width: 46px; height: 46px; flex-shrink: 0; }

/* Arama */
.search-bar { background: rgba(247, 244, 238, 0.94); backdrop-filter: blur(8px); }
.search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--ink-muted); display: flex; }
.search-input {
  height: 48px; font-size: 14.5px;
  background: var(--soft); border: 1.5px solid transparent; color: var(--ink);
  transition: box-shadow .15s ease, border-color .15s ease, background .15s ease;
}
.search-input::placeholder { color: var(--ink-muted); opacity: .8; }
.search-input:focus { background: #fff; border-color: var(--brand); box-shadow: 0 0 0 3px rgba(22,163,74,0.15); }
/* style.css'teki global ".theme-dark input {...}" kuralı çıplak <input>
   etiketini hedefliyor. Not: Vue scoped CSS'inde :global() seçicinin
   TAMAMINI sarmalı, yoksa kural derlemeye hiç girmiyor. */
:global(.theme-dark .search-input) {
  background: #EDE8DF !important;
  color: #13223A !important;
  border-color: transparent !important;
}

.section-head { font-size: 15px; font-weight: 800; color: var(--ink); margin: 2px 2px 12px; }

/* Öne çıkanlar: halkalı yuvarlak fotoğraf */
.featured-item {
  flex: 0 0 78px; display: flex; flex-direction: column; align-items: center; gap: 6px;
  background: none; border: none; padding: 0; cursor: pointer;
}
.featured-ring {
  width: 76px; height: 76px; border-radius: 999px; padding: 3px;
  background: conic-gradient(var(--brand), #4ADE80, var(--brand));
  display: block; position: relative;
}
.featured-ring .featured-img, .featured-letter {
  width: 100%; height: 100%; border-radius: 999px; border: 3px solid var(--cream); display: block;
  object-fit: cover; background: var(--soft);
}
.featured-letter { display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 900; color: var(--ink); }
.featured-name {
  font-size: 11.5px; font-weight: 700; color: var(--ink); line-height: 1.2; text-align: center;
  width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.featured-price { font-size: 11px; font-weight: 800; color: var(--brand-dark); margin-top: -3px; }
.featured-item.is-off .featured-ring { filter: grayscale(1); opacity: .6; }
.featured-item:active .featured-ring { transform: scale(.96); }

/* Kategori kartları */
.category-card {
  position: relative; height: 132px; border-radius: 22px; overflow: hidden;
  display: flex; align-items: flex-end; text-align: left;
  box-shadow: 0 4px 14px rgba(19,34,58,0.10);
  transition: transform .12s ease;
}
.category-card.is-wide { grid-column: span 2; height: 176px; }
.category-card:active { transform: scale(0.98); }
/* Kategori görseli artık ayrı indiğinden kartın arka planı yerine
   üstüne serilen bir katman. Görsel yoksa kartın kendi rengi kalır. */
.category-img { position: absolute; inset: 0; width: 100%; height: 100%; }
.category-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(10,18,32,0.78) 0%, rgba(10,18,32,0.2) 55%, transparent 100%);
}
.category-label {
  position: relative; padding: 12px 14px; width: 100%;
  color: white; font-weight: 800; font-size: 17px; line-height: 1.15;
  text-shadow: 0 1px 4px rgba(0,0,0,0.45);
}
.category-card.is-wide .category-label { font-size: 22px; padding: 14px 18px; }
.category-count {
  position: absolute; top: 10px; right: 10px;
  font-size: 11px; font-weight: 700; color: #fff;
  background: rgba(10,18,32,0.55); backdrop-filter: blur(4px);
  padding: 4px 9px; border-radius: 999px;
}

/* Kategori içi: yol, geri düğmesi, çipler */
.crumbs { font-size: 12.5px; color: var(--ink-muted); margin: 0 2px 10px; }
.crumbs button { color: var(--ink-muted); font-weight: 600; }
.crumbs span { color: var(--ink); font-weight: 700; }
.cat-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.cat-chips { display: flex; gap: 8px; overflow-x: auto; flex: 1; padding: 2px; }
.cat-chip {
  flex-shrink: 0; height: 40px; padding: 0 16px; border-radius: 999px; cursor: pointer;
  border: 1.5px solid rgba(19,34,58,0.08); background: #fff; color: var(--ink);
  font-size: 13.5px; font-weight: 700; white-space: nowrap;
}
.cat-chip.is-on { background: var(--brand-soft); border-color: var(--brand); color: var(--brand-dark); }


/* Öne çıkan karttaki fiyat (ürün satırı stilleri MenuProductRow.vue'da) */
.price-tag { font-weight: 800; color: var(--brand-dark); }

/* Skeleton */
.skel {
  background: linear-gradient(90deg, #EAE4DA 25%, #F3EFE8 37%, #EAE4DA 63%);
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
  height: 40px; padding: 0 16px; border-radius: 999px;
  background: var(--brand); color: white; font-size: 13px; font-weight: 700;
  box-shadow: 0 4px 14px rgba(0,0,0,0.2);
}

.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Ürün fotoğrafı önizleme (lightbox) ──────────────────────────
   Yönetici panelinin koyu teması yalnızca çıplak class/etiket
   isimlerini eziyor; burada kendi isimlerimizi kullanıyoruz.       */
.lightbox {
  position: fixed; inset: 0; z-index: 60;
  display: flex; align-items: flex-end; justify-content: center;
  background: rgba(10, 18, 32, 0.55);
  backdrop-filter: blur(2px);
}
.lightbox-inner {
  position: relative; width: 100%; max-width: 560px;
  background: #FFFDF9; border-radius: 26px 26px 0 0; overflow: hidden;
  box-shadow: 0 -12px 40px rgba(0,0,0,0.25);
  max-height: 92vh; display: flex; flex-direction: column;
  animation: sheet-up .22s ease-out;
}
@keyframes sheet-up { from { transform: translateY(40px); opacity: .6 } to { transform: none; opacity: 1 } }
@media (min-width: 640px) {
  .lightbox { align-items: center; padding: 20px; }
  .lightbox-inner { border-radius: 26px; max-width: 460px; }
}
.lightbox-grip {
  position: absolute; top: 8px; left: 50%; transform: translateX(-50%); z-index: 3;
  width: 44px; height: 5px; border-radius: 99px; background: rgba(255,255,255,0.85);
  box-shadow: 0 1px 3px rgba(0,0,0,0.25);
}
.lightbox-media {
  position: relative; width: 100%; height: 46vh;
  background: var(--soft); overflow: hidden; flex-shrink: 0;
}
.lightbox-media img {
  position: absolute; inset: 0;
  width: 100%; height: 100%; display: block;
}
.lightbox-full { object-fit: cover; }
/* Tam çözünürlüklü fotoğraf inene kadar küçük görsel bulanık dursun —
   boş gri bir kutu görmektense. */
.lightbox-blur { object-fit: cover; filter: blur(12px); transform: scale(1.08); }
/* Tam fotoğraf gelmezse küçük görsel net gösterilir. */
.lightbox-blur.is-fallback { filter: none; transform: none; object-fit: cover; }
.lightbox-full { opacity: 0; transition: opacity .25s ease; }
.lightbox-full.is-ready { opacity: 1; }
.lightbox-media.is-inactive { filter: grayscale(1); opacity: .6; }
.lightbox-close {
  position: absolute; top: 12px; right: 12px; z-index: 3;
  width: 40px; height: 40px; border-radius: 999px; border: none;
  background: rgba(255,255,255,0.92); color: var(--ink);
  font-size: 16px; font-weight: 800; line-height: 1; cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.18);
}
.lightbox-info { padding: 18px 20px calc(20px + env(safe-area-inset-bottom)); overflow-y: auto; }
.lightbox-name { font-size: 22px; font-weight: 800; color: var(--ink); line-height: 1.2; padding-right: 44px; }
.lightbox-desc { font-size: 14px; color: var(--ink-muted); margin-top: 8px; line-height: 1.5; }
.lightbox-allergens {
  display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px;
  font-size: 13.5px; color: var(--ink-muted); margin-top: 12px;
}
.lightbox-allergens strong { color: var(--ink); font-weight: 800; }
.allergen-item { display: inline-flex; align-items: center; gap: 4px; }
.lightbox-foot {
  display: flex; align-items: center; gap: 9px; flex-wrap: wrap; margin-top: 10px;
}
.lightbox-price { font-size: 20px; font-weight: 800; color: var(--brand-dark); }
.lightbox-unavailable {
  font-size: 11px; font-weight: 700; color: #9CA3AF;
  background: #F3F4F6; padding: 3px 9px; border-radius: 999px;
}

/* ── Kampanyalar ───────────────────────────────────────────────── */
.camp-strip { display: flex; gap: 8px; overflow-x: auto; padding: 10px 16px 0; max-width: 672px; margin: 0 auto; }
.camp-chip {
  flex-shrink: 0; padding: 7px 12px; border-radius: 12px;
  background: #DCFCE7; color: #14532D; font-size: 12.5px; white-space: nowrap;
}
.price-old { font-weight: 600; opacity: .6; text-decoration: line-through; margin-right: 5px; font-size: .9em; }

/* ── Masadan sipariş ───────────────────────────────────────────── */
.order-banner {
  font-size: 13px; text-align: center; padding: 10px 16px;
  width: calc(100% - 32px); max-width: 640px; margin: 8px auto 0; border-radius: 14px;
}
.order-banner.is-ok   { background: #E3F4E8; color: #14532D; }
.order-banner.is-warn { background: #F3F4F6; color: #4B5563; }
.status-pill {
  display: flex; align-items: center; gap: 8px; width: calc(100% - 32px); max-width: 640px;
  margin: 10px auto 0; padding: 10px 14px; border-radius: 14px; border: none;
  font-size: 13.5px; font-weight: 700; text-align: left;
}
.status-pill.is-wait { background: #EFF6FF; color: #1E40AF; }
.status-pill.is-ok   { background: #ECFDF5; color: #065F46; }
.status-pill.is-bad  { background: #FEF2F2; color: #991B1B; }
.status-dot { width: 8px; height: 8px; border-radius: 999px; background: currentColor; }
.status-pill.is-wait .status-dot { animation: pulse 1.4s ease infinite; }
@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .3 } }
.status-more { margin-left: auto; font-size: 12px; opacity: .75; }

.call-row {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
  width: calc(100% - 32px); max-width: 640px; margin: 10px auto 0;
}
.call-btn {
  height: 44px; padding: 0 10px; border-radius: 14px; cursor: pointer;
  border: 1.5px solid var(--brand); background: white; color: var(--brand-dark);
  font-size: 14px; font-weight: 800;
}
.call-btn.is-on { background: #ECFDF5; border-color: #10B981; color: #065F46; }
.call-btn:disabled { cursor: default; }
.call-btn:not(.is-on):disabled { opacity: .5; }
.call-error {
  width: calc(100% - 32px); max-width: 640px; margin: 8px auto 0; padding: 8px 12px;
  border-radius: 12px; background: #FEF2F2; color: #991B1B; font-size: 13px;
}
.pay-choice { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

.featured-add, .lightbox-add {
  border: none; background: var(--brand); color: white; font-weight: 800; cursor: pointer;
}
.lightbox-add { margin-left: auto; height: 46px; padding: 0 22px; border-radius: 999px; font-size: 15px; }

.toast {
  position: fixed; left: 50%; bottom: 92px; transform: translateX(-50%); z-index: 80;
  background: rgba(31,41,55,0.92); color: white; font-size: 13px; font-weight: 600;
  padding: 9px 16px; border-radius: 999px; white-space: nowrap;
}
.cart-bar {
  position: fixed; left: 12px; right: 12px; bottom: calc(12px + env(safe-area-inset-bottom)); z-index: 40;
  max-width: 560px; margin: 0 auto;
  display: flex; align-items: center; gap: 12px;
  height: 56px; padding: 0 18px; border-radius: 18px; border: none;
  background: var(--brand); color: white; box-shadow: 0 8px 24px rgba(21,128,61,0.35);
}
.cart-count {
  min-width: 26px; height: 26px; padding: 0 6px; border-radius: 999px;
  background: rgba(255,255,255,0.25); font-size: 13px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}
.cart-label { flex: 1; text-align: left; font-size: 15px; font-weight: 800; }
.cart-total { font-size: 15px; font-weight: 800; }
.scroll-top-btn.is-raised { bottom: 84px; }

.sheet-backdrop {
  position: fixed; inset: 0; z-index: 70;
  background: rgba(10, 18, 32, 0.55);
  display: flex; align-items: flex-end; justify-content: center;
}
.sheet {
  width: 100%; max-width: 560px; max-height: 88vh;
  background: #FFFDFA; border-radius: 20px 20px 0 0;
  display: flex; flex-direction: column; box-shadow: 0 -10px 40px rgba(0,0,0,0.25);
}
.sheet-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 18px 10px; }
.sheet-title { font-size: 18px; font-weight: 800; color: var(--ink); }
.sheet-close {
  height: 30px; padding: 0 12px; border-radius: 999px; border: none;
  background: #EDE8DF; color: var(--ink); font-size: 12px; font-weight: 700;
}
.sheet-body { padding: 0 18px 12px; overflow-y: auto; }
.sheet-foot { padding: 12px 18px calc(14px + env(safe-area-inset-bottom)); border-top: 1px solid rgba(0,0,0,0.06); }
.add-main {
  width: 100%; height: 50px; border-radius: 999px; border: none;
  background: var(--brand); color: white; font-size: 15px; font-weight: 800;
}
.add-main:disabled { background: #D6CFC5; }
.add-main.is-muted { background: #EDE8DF; color: var(--ink); }
.empty-cart { padding: 24px 0; text-align: center; color: var(--ink-muted); }
.cart-line {
  display: flex; gap: 12px; align-items: center;
  padding: 12px 0; border-bottom: 1px solid rgba(0,0,0,0.06);
}
.cart-line-main { flex: 1; min-width: 0; }
.cart-line-name { font-size: 14px; font-weight: 700; color: var(--ink); }
.cart-line-detail { font-size: 12px; color: var(--ink-muted); margin-top: 2px; }
.cart-line-price { font-size: 13px; font-weight: 800; color: var(--brand-dark); margin-top: 3px; }
.qty { display: flex; align-items: center; gap: 4px; background: #EDE8DF; border-radius: 999px; padding: 3px; }
.qty button {
  width: 32px; height: 32px; border-radius: 999px; border: none;
  background: white; color: var(--ink); font-size: 17px; font-weight: 800;
}
.qty button:disabled { opacity: .4; }
.qty span { min-width: 20px; text-align: center; font-weight: 800; color: var(--ink); }
.field-lbl { display: block; font-size: 12.5px; font-weight: 800; color: var(--ink); margin: 14px 0 6px; }
.field-lbl span { font-weight: 600; color: var(--ink-muted); }
.text-field {
  width: 100%; height: 44px; padding: 0 12px; border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.12); background: white !important; color: #1F2937 !important;
  font-size: 14px; outline: none;
}
.text-field:focus { border-color: var(--brand); box-shadow: 0 0 0 3px rgba(22,163,74,0.15); }
.order-error {
  margin-top: 12px; padding: 10px 12px; border-radius: 12px;
  background: #FEF2F2; color: #991B1B; font-size: 13px;
}
.cart-hint { font-size: 12px; color: var(--ink-muted); margin: 12px 0 0; line-height: 1.45; }
.status-box { border-radius: 14px; padding: 14px 16px; margin-bottom: 8px; }
.status-box.is-wait { background: #EFF6FF; color: #1E3A8A; }
.status-box.is-ok   { background: #ECFDF5; color: #064E3B; }
.status-box.is-bad  { background: #FEF2F2; color: #7F1D1D; }
.status-title { font-size: 16px; font-weight: 800; }
.status-text { font-size: 13px; margin-top: 4px; line-height: 1.45; }
.status-total { text-align: right; padding: 12px 0 4px; font-size: 14px; color: var(--ink); }

</style>
