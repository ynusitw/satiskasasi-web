<template>
  <div class="p-8 max-w-5xl">
    <div class="mb-6">
      <h1 class="page-title">Sadakat Programı</h1>
      <p class="page-subtitle">
        Müşteri kasada telefonla tanınır; puanı ve damgaları cari kartında birikir. Yalnızca KVKK onayı alınmış müşteriye işlenir.
      </p>
    </div>

    <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>

    <!-- ── Ayarlar ─────────────────────────────────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <div class="bg-white rounded-2xl shadow-sm p-6">
        <label class="flex items-center justify-between gap-3 cursor-pointer">
          <div>
            <div class="section-title">Para puan</div>
            <div class="text-xs text-muted mt-0.5">Harcamanın bir yüzdesi puan olur; 1 puan = 1 ₺ indirim.</div>
          </div>
          <input v-model="s.pointsEnabled" type="checkbox" class="w-5 h-5 accent-accent"/>
        </label>
        <div class="grid grid-cols-2 gap-3 mt-4" :class="{ 'opacity-50 pointer-events-none': !s.pointsEnabled }">
          <div>
            <label class="field-label">Kazanma oranı (%)</label>
            <input v-model.number="s.earnPercent" type="number" min="0" max="50" step="0.5"
                   class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
          </div>
          <div>
            <label class="field-label">En az kullanım (puan)</label>
            <input v-model.number="s.minRedeem" type="number" min="0" step="1"
                   class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
          </div>
        </div>
        <p class="text-xs text-muted mt-2" v-if="s.pointsEnabled">
          Örnek: 400 ₺ harcayan müşteri {{ fmtNum(400 * (s.earnPercent || 0) / 100) }} puan kazanır.
        </p>
      </div>

      <div class="bg-white rounded-2xl shadow-sm p-6">
        <label class="flex items-center justify-between gap-3 cursor-pointer">
          <div>
            <div class="section-title">Damga kartı</div>
            <div class="text-xs text-muted mt-0.5">Seçilen ürünlerden her alımda 1 damga; kart dolunca 1 ürün bedava.</div>
          </div>
          <input v-model="s.stampsEnabled" type="checkbox" class="w-5 h-5 accent-accent"/>
        </label>
        <div class="mt-4">
          <label class="field-label">Puan ve damgaların süresi</label>
          <select v-model.number="s.expiryMonths" class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white">
            <option :value="0">Süresiz</option>
            <option v-for="m in [3, 6, 12, 18, 24]" :key="m" :value="m">Son alışverişten {{ m }} ay sonra silinir</option>
          </select>
        </div>
      </div>
    </div>
    <div class="flex items-center justify-end gap-3 mb-8">
      <span class="text-xs" :class="saveMsg.startsWith('Kaydedildi') ? 'text-success' : 'text-danger'">{{ saveMsg }}</span>
      <button class="btn-primary" :disabled="busy" @click="saveSettings">Ayarları kaydet</button>
    </div>

    <!-- ── Damga kartları ──────────────────────────────────────────── -->
    <div class="flex items-center justify-between mb-3">
      <h2 class="section-title">Damga kartları</h2>
      <button class="btn-secondary btn-sm" @click="openCard()">+ Kart ekle</button>
    </div>
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden" :class="{ 'opacity-60': !s.stampsEnabled }">
      <div v-if="!cards.length" class="p-6 text-sm text-muted text-center">
        Henüz damga kartı yok. Ör. "Kahve kartı: 9 kahveye 10. bedava".
      </div>
      <div v-for="c in cards" :key="c.id" class="px-5 py-4 border-t border-gray-50 first:border-t-0 flex items-center gap-4">
        <div class="min-w-0 flex-1">
          <div class="font-semibold text-primary">
            {{ c.name }} <span v-if="!c.isActive" class="chip-neutral ml-1">pasif</span>
          </div>
          <div class="text-xs text-muted mt-0.5 truncate">
            {{ c.required }} damgada 1 bedava · {{ scopeText(c) }}
          </div>
        </div>
        <div class="flex gap-1 flex-shrink-0">
          <span v-for="i in Math.min(c.required, 12)" :key="i" class="w-2.5 h-2.5 rounded-full bg-accent/25"></span>
        </div>
        <button class="btn-ghost btn-sm" @click="openCard(c)">Düzenle</button>
      </div>
    </div>
    <p v-if="!s.stampsEnabled && cards.length" class="text-xs text-muted mt-2">Damga kartı kapalı; kartlar kayıtlı ama işlenmiyor.</p>

    <!-- ── Kart formu ──────────────────────────────────────────────── -->
    <div v-if="card.open" class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
         @click.self="card.open = false">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-7 max-h-[92vh] flex flex-col">
        <h2 class="modal-title mb-4">{{ card.id ? 'Damga Kartını Düzenle' : 'Yeni Damga Kartı' }}</h2>
        <div class="grid grid-cols-3 gap-3 mb-4">
          <div class="col-span-2">
            <label class="field-label">Kart adı</label>
            <input v-model="card.name" maxlength="60" placeholder="ör. Kahve kartı"
                   class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
          </div>
          <div>
            <label class="field-label">Kaç damgada bedava</label>
            <input v-model.number="card.required" type="number" min="2" max="50"
                   class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
          </div>
        </div>
        <label class="field-label">Damga kazandıran ürünler</label>
        <p class="text-xs text-muted mb-2">Kategori seçerseniz o kategorideki tüm ürünler sayılır. Bedava ürün de bu ürünlerden biridir.</p>
        <input v-model="card.search" placeholder="Ürün ara..."
               class="w-full px-3 h-9 border border-gray-200 rounded-lg text-[13.5px] bg-white mb-2"/>
        <div class="flex-1 min-h-0 overflow-y-auto border border-gray-100 rounded-xl">
          <div v-for="cat in catalog" :key="cat.id" class="border-t border-gray-50 first:border-t-0">
            <label class="flex items-center gap-2 px-3 py-2 bg-gray-50" :class="cat.id ? 'cursor-pointer' : ''">
              <input v-if="cat.id" type="checkbox" :checked="card.categoryIds.includes(cat.id)" @change="toggle(card.categoryIds, cat.id)" class="accent-accent"/>
              <span class="text-sm font-semibold text-primary">{{ cat.name }}</span>
              <span v-if="cat.id" class="text-xs text-muted">(tüm kategori)</span>
            </label>
            <label v-for="p in cat.products" :key="p.id" class="flex items-center gap-2 px-3 py-1.5 pl-8 cursor-pointer hover:bg-gray-50"
                   :class="{ 'opacity-50': card.categoryIds.includes(cat.id) }">
              <input type="checkbox" :checked="card.productIds.includes(p.id) || card.categoryIds.includes(cat.id)"
                     :disabled="card.categoryIds.includes(cat.id)" @change="toggle(card.productIds, p.id)" class="accent-accent"/>
              <span class="text-sm text-primary">{{ p.name }}</span>
            </label>
          </div>
        </div>
        <label class="flex items-center gap-2 mt-3 cursor-pointer">
          <input v-model="card.isActive" type="checkbox" class="accent-accent"/>
          <span class="text-sm">Kart aktif (damga verilir)</span>
        </label>
        <div v-if="card.error" class="mt-3 p-3 rounded-xl bg-red-50 text-red-600 text-sm">{{ card.error }}</div>
        <div class="flex items-center gap-2 mt-5">
          <button v-if="card.id" class="btn-ghost text-danger" :disabled="card.busy" @click="removeCard">Sil</button>
          <div class="flex-1"></div>
          <button class="btn-secondary" @click="card.open = false">Vazgeç</button>
          <button class="btn-primary" :disabled="card.busy" @click="saveCard">Kaydet</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '../api/api'
import { uiConfirm, uiAlert } from '../utils/dialog'

const s = reactive({ pointsEnabled: false, earnPercent: 5, minRedeem: 0, stampsEnabled: false, expiryMonths: 12 })
const cards = ref([])
const products = ref([])
const categories = ref([])
const busy = ref(false)
const error = ref('')
const saveMsg = ref('')

const fmtNum = v => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(v || 0)

async function load() {
  try {
    const { data } = await api.getLoyaltyConfig()
    Object.assign(s, {
      pointsEnabled: data.pointsEnabled, earnPercent: data.earnPercent, minRedeem: data.minRedeem,
      stampsEnabled: data.stampsEnabled, expiryMonths: data.expiryMonths,
    })
    cards.value = data.cards
  } catch (e) {
    error.value = e.response?.data?.message || 'Sadakat ayarları alınamadı.'
  }
}

async function saveSettings() {
  busy.value = true
  saveMsg.value = ''
  try {
    await api.saveLoyaltySettings({ ...s })
    saveMsg.value = 'Kaydedildi. Kasalar birkaç dakika içinde yeni ayarları alır.'
  } catch (e) {
    saveMsg.value = e.response?.data?.message || 'Kaydedilemedi.'
  } finally {
    busy.value = false
  }
}

// ── Kart formu ─────────────────────────────────────────────────────────
const catalog = computed(() => {
  const q = (card.search || '').trim().toLocaleLowerCase('tr-TR')
  const match = p => !q || p.name.toLocaleLowerCase('tr-TR').includes(q)
  const list = categories.value.map(c => ({ ...c, products: products.value.filter(p => p.categoryId === c.id && match(p)) }))
  const known = new Set(categories.value.map(c => c.id))
  const loose = products.value.filter(p => !known.has(p.categoryId) && match(p))
  if (loose.length) list.push({ id: 0, name: 'Kategorisiz', products: loose })
  return list.filter(c => c.products.length)
})

const nameOf = (list, id) => list.find(x => x.id === id)?.name
function scopeText(c) {
  const parts = [
    ...c.categoryIds.map(id => nameOf(categories.value, id) && `${nameOf(categories.value, id)} (tümü)`),
    ...c.productIds.map(id => nameOf(products.value, id)),
  ].filter(Boolean)
  return parts.length > 4 ? `${parts.slice(0, 4).join(', ')} +${parts.length - 4}` : parts.join(', ') || 'ürün seçilmemiş'
}

const card = reactive({ open: false })
function openCard(c) {
  Object.assign(card, {
    open: true, busy: false, error: '', search: '',
    id: c?.id ?? null, name: c?.name ?? '', required: c?.required ?? 9, isActive: c?.isActive ?? true,
    productIds: [...(c?.productIds ?? [])], categoryIds: [...(c?.categoryIds ?? [])],
  })
}
function toggle(list, id) {
  const i = list.indexOf(id)
  if (i >= 0) list.splice(i, 1); else list.push(id)
}

async function saveCard() {
  card.busy = true
  card.error = ''
  const body = { name: card.name, required: card.required, isActive: card.isActive, productIds: card.productIds, categoryIds: card.categoryIds }
  try {
    if (card.id) await api.updateStampCard(card.id, body)
    else await api.createStampCard(body)
    card.open = false
    await load()
  } catch (e) {
    card.error = e.response?.data?.message || 'Kaydedilemedi.'
  } finally {
    card.busy = false
  }
}

async function removeCard() {
  if (!await uiConfirm(`"${card.name}" kartı silinsin mi? Müşterilerde biriken damga varsa kart silinmez, pasif olur.`)) return
  card.busy = true
  try {
    const { data } = await api.deleteStampCard(card.id)
    card.open = false
    await load()
    if (data?.deactivated) await uiAlert('Kartta biriken damgalar olduğu için kart silinmedi, pasif yapıldı.', { title: 'Bilgi' })
  } catch (e) {
    card.error = e.response?.data?.message || 'Silinemedi.'
  } finally {
    card.busy = false
  }
}

onMounted(async () => {
  await load()
  try {
    const [p, c] = await Promise.all([api.getProducts(), api.getCategories()])
    products.value = (p.data ?? []).filter(x => x.isActive !== false).map(x => ({ id: x.id, name: x.name, categoryId: x.categoryId }))
    categories.value = (c.data ?? []).map(x => ({ id: x.id, name: x.name }))
  } catch { /* ürün listesi alınamadıysa kart formu boş görünür */ }
})
</script>
