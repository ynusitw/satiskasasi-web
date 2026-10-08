<template>
  <!-- Garson telefonu: masa seç → menüden ekle → mutfağa gönder. Ödeme kasada. -->
  <div class="min-h-screen bg-bg">
    <div class="max-w-md mx-auto min-h-screen flex flex-col bg-bg">

      <!-- Üst çubuk -->
      <header class="sticky top-0 z-20 bg-primary text-white px-4 h-14 flex items-center gap-3 shadow">
        <button v-if="screen !== 'floor'" class="-ml-1 w-9 h-9 rounded-lg hover:bg-white/10 text-xl leading-none"
                aria-label="Geri" @click="back">‹</button>
        <div class="min-w-0 flex-1 leading-tight">
          <div class="text-[15px] font-semibold truncate">{{ title }}</div>
          <div class="text-[11.5px] text-white/55 truncate">{{ auth.username }} · {{ auth.tenantName }}</div>
        </div>
        <button v-if="screen === 'floor'" class="text-[12px] font-semibold text-white/70 px-2 h-9" @click="logout">Çıkış</button>
        <button v-else-if="screen === 'menu' && cartCount" class="relative h-9 px-3 rounded-lg bg-accent text-[13px] font-semibold"
                @click="screen = 'cart'">
          Sepet <span class="ml-1 bg-white text-accent rounded-full px-1.5 text-[11px]">{{ cartCount }}</span>
        </button>
      </header>

      <div v-if="error" class="mx-4 mt-3 p-3 rounded-xl bg-red-50 text-red-700 text-sm" @click="error = ''">{{ error }}</div>
      <div v-if="toast" class="fixed left-1/2 -translate-x-1/2 bottom-24 z-50 bg-primary text-white text-sm font-semibold whitespace-nowrap px-4 py-2.5 rounded-full shadow-lg">
        {{ toast }}
      </div>

      <!-- ── Masalar ─────────────────────────────────────────────── -->
      <main v-if="screen === 'floor'" class="flex-1 p-4">
        <div class="flex gap-1.5 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
          <button v-for="s in sections" :key="s.id" @click="section = s.id"
                  :class="section === s.id ? 'chip-accent' : 'chip-neutral'" class="flex-shrink-0">{{ s.name }}</button>
        </div>
        <div v-if="loadingFloor && !tables.length" class="text-sm text-muted text-center py-10">Yükleniyor...</div>
        <div class="grid grid-cols-3 gap-2.5 mt-2">
          <button v-for="t in shownTables" :key="t.id" @click="openTable(t)"
                  class="rounded-2xl p-3 text-left min-h-[84px] flex flex-col justify-between shadow-sm active:scale-[0.98] transition"
                  :class="t.occupied ? 'bg-accent text-white' : 'bg-white text-primary'">
            <div class="text-[15px] font-semibold leading-tight break-words">{{ t.displayName || t.name }}</div>
            <div v-if="t.occupied" class="text-[11.5px] leading-tight mt-1" :class="'text-white/80'">
              {{ money(t.total) }}<br>{{ since(t.openedAt) }}
            </div>
            <div v-else class="text-[11.5px] text-muted mt-1">Boş</div>
            <div v-if="t.reservation" class="text-[11px] font-semibold mt-1 leading-tight rounded-md px-1.5 py-0.5 w-fit max-w-full truncate"
                 :class="t.occupied ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-700'">
              {{ clock(t.reservation.startsAt) }} · {{ t.reservation.customerName }} ({{ t.reservation.guestCount }})
            </div>
            <div v-if="cartFor(t.id)" class="text-[11px] font-bold mt-1" :class="t.occupied ? 'text-white' : 'text-accent'">
              {{ cartFor(t.id) }} ürün gönderilmedi
            </div>
          </button>
        </div>
        <div v-if="!loadingFloor && !tables.length" class="text-sm text-muted text-center py-10">
          Tanımlı masa yok. Masalar panelden ya da kasadan eklenir.
        </div>
      </main>

      <!-- ── Masa adisyonu ──────────────────────────────────────── -->
      <main v-else-if="screen === 'table'" class="flex-1 p-4 pb-28">
        <div class="bg-white rounded-2xl shadow-sm">
          <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span class="text-sm font-semibold text-primary">Adisyon</span>
            <span class="text-xs text-muted">{{ order?.openedAt ? since(order.openedAt) + ' önce açıldı' : 'Boş masa' }}</span>
          </div>
          <div v-if="loadingOrder" class="text-sm text-muted p-4">Yükleniyor...</div>
          <div v-else-if="!order?.items.length" class="text-sm text-muted p-4">Henüz sipariş yok.</div>
          <div v-for="i in order?.items ?? []" :key="i.id" class="px-4 py-2.5 border-t border-gray-50 flex gap-3">
            <div class="text-sm font-semibold text-primary w-7 flex-shrink-0">{{ qty(i.quantity) }}×</div>
            <div class="min-w-0 flex-1">
              <div class="text-sm text-primary">{{ i.productName }}<span v-if="i.variantName" class="text-muted"> ({{ i.variantName }})</span></div>
              <div v-if="i.modifiersText" class="text-xs text-muted">{{ i.modifiersText }}</div>
              <div v-if="i.note" class="text-xs text-amber-700">Not: {{ i.note }}</div>
              <div class="text-[11px] text-muted">{{ i.addedByUser }} · {{ clock(i.addedAt) }}</div>
            </div>
            <div class="text-sm font-semibold text-primary whitespace-nowrap">{{ i.isComp ? 'İkram' : money(i.lineTotal) }}</div>
          </div>
          <div v-if="order?.items.length" class="px-4 py-3 border-t border-gray-100 flex justify-between text-[15px] font-semibold text-primary">
            <span>Toplam</span><span>{{ money(order.total) }}</span>
          </div>
        </div>

        <div v-if="cartCount" class="mt-4 p-3 rounded-2xl bg-amber-50 text-amber-900 text-sm flex items-center justify-between gap-3">
          <span>{{ cartCount }} ürün sepette, henüz gönderilmedi.</span>
          <button class="font-bold underline" @click="screen = 'cart'">Sepete git</button>
        </div>

        <div class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-4 bg-gradient-to-t from-bg via-bg">
          <button class="btn-primary btn-lg w-full h-14 text-base" @click="screen = 'menu'">+ Sipariş ekle</button>
        </div>
      </main>

      <!-- ── Menü ───────────────────────────────────────────────── -->
      <main v-else-if="screen === 'menu'" class="flex-1 flex flex-col pb-24">
        <div class="sticky top-14 z-10 bg-bg px-4 pt-3 pb-2 space-y-2">
          <input v-model="search" type="search" placeholder="Ürün ara..."
                 class="w-full px-3 h-11 border border-gray-200 rounded-xl text-[15px] bg-white"/>
          <div v-if="!search" class="flex gap-1.5 overflow-x-auto -mx-4 px-4 no-scrollbar">
            <button v-for="c in categories" :key="c.id" @click="category = c.id"
                    :class="category === c.id ? 'chip-accent' : 'chip-neutral'" class="flex-shrink-0">{{ c.name }}</button>
          </div>
        </div>
        <div class="px-4 space-y-2">
          <button v-for="p in shownProducts" :key="p.id" @click="pick(p)"
                  class="w-full bg-white rounded-xl shadow-sm px-4 py-3 flex items-center gap-3 text-left active:bg-gray-50">
            <div class="min-w-0 flex-1">
              <div class="text-[15px] font-semibold text-primary leading-snug">{{ p.name }}</div>
              <div class="text-[13px] text-muted">
                {{ p.variants.length ? money(Math.min(...p.variants.map(v => v.price))) + '’den' : money(p.price) }}
                <span v-if="p.variants.length || p.modifierGroups.length" class="text-accent"> · seçenekli</span>
              </div>
            </div>
            <span v-if="inCart(p.id)" class="min-w-[26px] h-[26px] px-1.5 rounded-full bg-accent text-white text-[13px] font-bold flex items-center justify-center">
              {{ inCart(p.id) }}
            </span>
            <span v-else class="w-[26px] h-[26px] rounded-full bg-blue-50 text-accent text-lg leading-none flex items-center justify-center">+</span>
          </button>
          <div v-if="!shownProducts.length" class="text-sm text-muted text-center py-8">Ürün bulunamadı.</div>
        </div>
        <div v-if="cartCount" class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-4 bg-gradient-to-t from-bg via-bg">
          <button class="btn-primary btn-lg w-full h-14 text-base" @click="screen = 'cart'">
            Sepeti gör · {{ cartCount }} ürün · {{ money(cartTotal) }}
          </button>
        </div>
      </main>

      <!-- ── Sepet ──────────────────────────────────────────────── -->
      <main v-else-if="screen === 'cart'" class="flex-1 p-4 pb-28">
        <div v-if="!cart.length" class="text-sm text-muted text-center py-10">Sepet boş.</div>
        <div v-for="(l, idx) in cart" :key="l.key" class="bg-white rounded-xl shadow-sm p-3 mb-2">
          <div class="flex gap-3">
            <div class="min-w-0 flex-1">
              <div class="text-[15px] font-semibold text-primary leading-snug">{{ l.name }}<span v-if="l.variantName" class="text-muted font-normal"> ({{ l.variantName }})</span></div>
              <div v-if="l.optionNames.length" class="text-xs text-muted">{{ l.optionNames.join(', ') }}</div>
            </div>
            <div class="text-sm font-semibold text-primary whitespace-nowrap">{{ money(l.unitPrice * l.quantity) }}</div>
          </div>
          <div class="flex items-center gap-2 mt-2">
            <button class="w-10 h-10 rounded-lg bg-gray-100 text-lg" @click="changeQty(idx, -1)">−</button>
            <span class="w-8 text-center font-semibold">{{ l.quantity }}</span>
            <button class="w-10 h-10 rounded-lg bg-gray-100 text-lg" @click="changeQty(idx, 1)">+</button>
            <input v-model="l.note" maxlength="100" placeholder="Not (ör. acısız)" @change="saveCart"
                   class="flex-1 min-w-0 px-3 h-10 border border-gray-200 rounded-lg text-[14px] bg-white"/>
          </div>
        </div>
        <p v-if="cart.length" class="text-xs text-muted mt-2">
          Fiyatlar sunucuda hesaplanır; geçerli kampanya indirimi otomatik uygulanır.
        </p>
        <div class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-4 bg-gradient-to-t from-bg via-bg space-y-2">
          <button class="btn-primary btn-lg w-full h-14 text-base" :disabled="sending || !cart.length" @click="send">
            {{ sending ? 'Gönderiliyor...' : `Mutfağa gönder · ${money(cartTotal)}` }}
          </button>
          <button class="btn-secondary w-full h-11" @click="screen = 'menu'">Ürün eklemeye devam et</button>
        </div>
      </main>

      <!-- ── Seçenek penceresi (porsiyon / çeşni) ───────────────── -->
      <div v-if="picker" class="fixed inset-0 z-40 bg-black/40 flex items-end justify-center" @click.self="picker = null">
        <div class="w-full max-w-md bg-white rounded-t-3xl max-h-[88vh] flex flex-col">
          <div class="px-5 pt-5 pb-3 border-b border-gray-100">
            <div class="text-[17px] font-semibold text-primary leading-snug">{{ picker.product.name }}</div>
          </div>
          <div class="overflow-y-auto px-5 py-3 space-y-4">
            <div v-if="picker.product.variants.length">
              <div class="text-sm font-semibold text-primary mb-1.5">Porsiyon</div>
              <div class="grid grid-cols-2 gap-2">
                <button v-for="v in picker.product.variants" :key="v.id" @click="picker.variantId = v.id"
                        class="rounded-xl border px-3 py-2.5 text-left"
                        :class="picker.variantId === v.id ? 'border-accent bg-blue-50' : 'border-gray-200'">
                  <div class="text-sm font-semibold text-primary leading-snug">{{ v.name }}</div>
                  <div class="text-xs text-accent font-semibold">{{ money(v.price) }}</div>
                </button>
              </div>
            </div>
            <div v-for="g in picker.product.modifierGroups" :key="g.id">
              <div class="text-sm font-semibold text-primary">{{ g.name }}</div>
              <div class="text-xs mb-1.5" :class="groupError(g) ? 'text-danger' : 'text-muted'">{{ groupHint(g) }}</div>
              <div class="space-y-1.5">
                <button v-for="o in g.options" :key="o.id" @click="toggleOption(g, o)"
                        class="w-full rounded-xl border px-3 h-11 flex items-center justify-between text-left"
                        :class="picker.options.has(o.id) ? 'border-accent bg-blue-50' : 'border-gray-200'">
                  <span class="text-sm text-primary">{{ o.name }}</span>
                  <span v-if="o.priceDelta" class="text-xs text-muted">{{ o.priceDelta > 0 ? '+' : '' }}{{ money(o.priceDelta) }}</span>
                </button>
              </div>
            </div>
            <div>
              <div class="text-sm font-semibold text-primary mb-1.5">Not</div>
              <input v-model="picker.note" maxlength="100" placeholder="ör. az pişmiş"
                     class="w-full px-3 h-11 border border-gray-200 rounded-xl text-[15px] bg-white"/>
            </div>
          </div>
          <div class="px-5 py-4 border-t border-gray-100 flex items-center gap-3">
            <button class="w-11 h-11 rounded-xl bg-gray-100 text-lg" @click="picker.quantity = Math.max(1, picker.quantity - 1)">−</button>
            <span class="w-6 text-center font-semibold">{{ picker.quantity }}</span>
            <button class="w-11 h-11 rounded-xl bg-gray-100 text-lg" @click="picker.quantity = Math.min(99, picker.quantity + 1)">+</button>
            <button class="btn-primary flex-1 h-12" :disabled="!pickerValid" @click="addPicked">
              Ekle · {{ money(pickerPrice * picker.quantity) }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const screen = ref('floor')          // floor | table | menu | cart
const tables = ref([])
const section = ref(null)
const loadingFloor = ref(true)
const table = ref(null)
const order = ref(null)
const loadingOrder = ref(false)
const categories = ref([])
const products = ref([])
const category = ref(null)
const search = ref('')
const picker = ref(null)
const cart = ref([])
const sending = ref(false)
const error = ref('')
const toast = ref('')

// ── Biçim ──────────────────────────────────────────────────────────────
const money = v => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
const qty = v => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(v)
const clock = v => new Date(v).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
function since(v) {
  if (!v) return ''
  const m = Math.max(0, Math.round((Date.now() - new Date(v)) / 60000))
  return m < 60 ? `${m} dk` : `${Math.floor(m / 60)} sa ${m % 60} dk`
}

const title = computed(() => screen.value === 'floor' ? 'Masalar'
  : (table.value?.displayName || table.value?.name || '') + (screen.value === 'cart' ? ' · Sepet' : screen.value === 'menu' ? ' · Menü' : ''))

// ── Masalar ────────────────────────────────────────────────────────────
const sections = computed(() => {
  const map = new Map()
  for (const t of tables.value) map.set(t.sectionId, t.sectionName)
  return [...map].map(([id, name]) => ({ id, name }))
})
const shownTables = computed(() => tables.value.filter(t => section.value == null || t.sectionId === section.value))

async function loadFloor() {
  try {
    tables.value = (await api.waiterFloor()).data
    if (section.value == null || !sections.value.some(s => s.id === section.value))
      section.value = sections.value[0]?.id ?? null
  } catch (e) {
    error.value = e.response?.data?.message || 'Masalar alınamadı. Bağlantıyı kontrol edin.'
  } finally {
    loadingFloor.value = false
  }
}

async function openTable(t) {
  table.value = t
  screen.value = 'table'
  loadCart()
  await loadOrder()
}

async function loadOrder() {
  if (!table.value) return
  loadingOrder.value = !order.value || order.value.id !== table.value.id
  try {
    order.value = (await api.waiterTable(table.value.id)).data
  } catch (e) {
    error.value = e.response?.data?.message || 'Adisyon alınamadı.'
  } finally {
    loadingOrder.value = false
  }
}

function back() {
  if (screen.value === 'cart') screen.value = 'menu'
  else if (screen.value === 'menu') screen.value = 'table'
  else { screen.value = 'floor'; table.value = null; order.value = null; loadFloor() }
}

// ── Menü ───────────────────────────────────────────────────────────────
async function loadMenu() {
  try {
    const { data } = await api.waiterMenu()
    categories.value = data.categories.filter(c => data.products.some(p => p.categoryId === c.id))
    if (data.products.some(p => p.categoryId == null)) categories.value.push({ id: 0, name: 'Diğer' })
    products.value = data.products
    category.value = categories.value[0]?.id ?? null
  } catch (e) {
    error.value = e.response?.data?.message || 'Menü alınamadı.'
  }
}

const shownProducts = computed(() => {
  const q = search.value.trim().toLocaleLowerCase('tr-TR')
  if (q) return products.value.filter(p => p.name.toLocaleLowerCase('tr-TR').includes(q))
  return products.value.filter(p => (p.categoryId ?? 0) === category.value)
})

function pick(p) {
  if (!p.variants.length && !p.modifierGroups.length) {
    addToCart({ product: p, variantId: null, options: new Set(), quantity: 1, note: '' })
    return
  }
  const options = new Set()
  for (const g of p.modifierGroups) for (const o of g.options) if (o.isDefault) options.add(o.id)
  picker.value = reactive({ product: p, variantId: p.variants[0]?.id ?? null, options, quantity: 1, note: '' })
}

function toggleOption(g, o) {
  const s = picker.value.options
  if (s.has(o.id)) { s.delete(o.id); return }
  const picked = g.options.filter(x => s.has(x.id))
  if (g.maxSelect === 1) picked.forEach(x => s.delete(x.id))
  else if (g.maxSelect > 0 && picked.length >= g.maxSelect) return
  s.add(o.id)
}
const pickedIn = g => g.options.filter(o => picker.value.options.has(o.id)).length
const groupError = g => pickedIn(g) < g.minSelect
function groupHint(g) {
  if (g.minSelect > 0 && g.maxSelect === 1) return 'Zorunlu — bir seçenek'
  if (g.minSelect > 0) return `En az ${g.minSelect}` + (g.maxSelect > 0 ? `, en çok ${g.maxSelect} seçim` : ' seçim')
  return g.maxSelect > 0 ? `İsteğe bağlı — en çok ${g.maxSelect}` : 'İsteğe bağlı'
}
const pickerValid = computed(() => picker.value && picker.value.product.modifierGroups.every(g => !groupError(g))
  && (!picker.value.product.variants.length || picker.value.variantId != null))
const pickerPrice = computed(() => picker.value ? unitPrice(picker.value.product, picker.value.variantId, picker.value.options) : 0)

function unitPrice(p, variantId, options) {
  const v = p.variants.find(x => x.id === variantId)
  let price = v ? v.price : p.price
  for (const g of p.modifierGroups) for (const o of g.options) if (options.has(o.id)) price += o.priceDelta
  return price
}

function addPicked() {
  addToCart(picker.value)
  picker.value = null
}

// ── Sepet (masa başına, sayfa yenilense de kalır) ─────────────────────
const cartKey = id => `waiter-cart-${auth.tenantId}-${id}`
function loadCart() {
  try { cart.value = JSON.parse(localStorage.getItem(cartKey(table.value.id)) || '[]') } catch { cart.value = [] }
}
function saveCart() {
  try {
    if (cart.value.length) localStorage.setItem(cartKey(table.value.id), JSON.stringify(cart.value))
    else localStorage.removeItem(cartKey(table.value.id))
  } catch { /* depolama kapalıysa sepet yalnız bellekte */ }
}
function cartFor(tableId) {
  try { return JSON.parse(localStorage.getItem(cartKey(tableId)) || '[]').reduce((s, l) => s + l.quantity, 0) } catch { return 0 }
}

function addToCart(sel) {
  const p = sel.product
  const optionIds = [...sel.options].sort((a, b) => a - b)
  const note = (sel.note || '').trim()
  const key = [p.id, sel.variantId ?? '', optionIds.join('.'), note].join('|')
  const same = cart.value.find(l => l.key === key)
  if (same) same.quantity = Math.min(99, same.quantity + sel.quantity)
  else cart.value.push({
    key, productId: p.id, name: p.name, quantity: sel.quantity, note,
    variantId: sel.variantId, variantName: p.variants.find(v => v.id === sel.variantId)?.name ?? null,
    optionIds, optionNames: p.modifierGroups.flatMap(g => g.options).filter(o => optionIds.includes(o.id)).map(o => o.name),
    unitPrice: unitPrice(p, sel.variantId, sel.options),
  })
  saveCart()
  flash(`${p.name} eklendi`)
}

function changeQty(idx, d) {
  const l = cart.value[idx]
  l.quantity += d
  if (l.quantity <= 0) cart.value.splice(idx, 1)
  else l.quantity = Math.min(99, l.quantity)
  saveCart()
}

const cartCount = computed(() => cart.value.reduce((s, l) => s + l.quantity, 0))
const cartTotal = computed(() => cart.value.reduce((s, l) => s + l.unitPrice * l.quantity, 0))
const inCart = id => cart.value.filter(l => l.productId === id).reduce((s, l) => s + l.quantity, 0)

async function send() {
  sending.value = true
  error.value = ''
  try {
    await api.waiterAdd(table.value.id, {
      items: cart.value.map(l => ({ productId: l.productId, variantId: l.variantId, optionIds: l.optionIds, quantity: l.quantity, note: l.note || null })),
    })
    cart.value = []
    saveCart()
    flash('Sipariş mutfağa gönderildi')
    screen.value = 'table'
    await loadOrder()
  } catch (e) {
    error.value = e.response?.data?.message || 'Gönderilemedi. Bağlantıyı kontrol edip tekrar deneyin; sepet duruyor.'
  } finally {
    sending.value = false
  }
}

let toastTimer = null
function flash(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 1800)
}

function logout() {
  if (!confirm('Çıkış yapılsın mı?')) return
  auth.logout()
  router.push('/login')
}

// Masa planı ve açık adisyon 15 sn'de bir tazelenir (başka garson / kasa)
let poll = null
onMounted(async () => {
  await Promise.all([loadFloor(), loadMenu()])
  poll = setInterval(() => {
    if (document.hidden) return
    if (screen.value === 'floor') loadFloor()
    else if (screen.value === 'table') loadOrder()
  }, 15000)
})
onUnmounted(() => clearInterval(poll))
watch(screen, () => window.scrollTo(0, 0))
</script>

<style scoped>
.no-scrollbar { scrollbar-width: none; }
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>
