<template>
  <div class="p-8 max-w-6xl">
    <div class="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 class="page-title">Kampanyalar</h1>
        <p class="page-subtitle">
          Kasa kampanyaları kendiliğinden uygular: saatlik indirim ürün eklenirken satıra,
          X al Y öde ve sepet indirimi ödeme alınırken hesaba. Liste fiyatları değişmez.
        </p>
      </div>
      <button v-if="auth.isAdmin" class="btn-primary flex-shrink-0" @click="openCreate">Yeni Kampanya</button>
    </div>

    <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>
    <div v-if="loading" class="text-muted">Yükleniyor...</div>

    <div v-else-if="!campaigns.length" class="bg-white rounded-2xl shadow-sm p-10 text-center">
      <div class="text-sm font-semibold text-primary">Henüz kampanya yok</div>
      <p class="text-xs text-muted mt-1">Örn. hafta içi 15:00–18:00 kahvelere %20, 3 çay al 2 öde, 500 ₺ üzeri %10.</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div v-for="c in campaigns" :key="c.id" class="bg-white rounded-2xl shadow-sm p-5 flex flex-col"
           :class="{ 'opacity-60': !c.isActive || c.expired }">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="text-base font-semibold text-primary truncate">{{ c.name }}</div>
            <div class="text-xs text-muted mt-0.5">{{ TYPES[c.type]?.label }} · {{ c.description }}</div>
          </div>
          <span :class="statusChip(c)" class="flex-shrink-0">{{ statusText(c) }}</span>
        </div>

        <div class="mt-3 space-y-1 text-[13px] text-primary">
          <div><span class="text-muted">Zaman:</span> {{ scheduleText(c) }}</div>
          <div v-if="c.type !== 'Basket'"><span class="text-muted">Geçerli:</span> {{ targetText(c) }}</div>
          <div v-if="c.showOnMenu" class="text-xs text-muted">QR menüde gösterilir ve uygulanır</div>
        </div>

        <div v-if="auth.isAdmin" class="flex gap-2 mt-4 pt-4 border-t border-gray-100">
          <button class="btn-secondary btn-sm" @click="openEdit(c)">Düzenle</button>
          <button class="btn-secondary btn-sm" @click="toggle(c)">{{ c.isActive ? 'Durdur' : 'Başlat' }}</button>
          <button class="btn-danger btn-sm ml-auto" @click="remove(c)">Sil</button>
        </div>
      </div>
    </div>

    <!-- ── Kampanya formu ─────────────────────────────────────────────── -->
    <div v-if="form.open" class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
         @click.self="form.open = false">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-7 max-h-[92vh] overflow-y-auto">
        <h2 class="modal-title mb-5">{{ form.id ? 'Kampanyayı Düzenle' : 'Yeni Kampanya' }}</h2>

        <label class="field-label">Kampanya adı</label>
        <input v-model="form.name" maxlength="60" placeholder="Örn. Happy Hour"
               class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white mb-4"/>

        <label class="field-label">Tür</label>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
          <button v-for="(t, key) in TYPES" :key="key" type="button"
                  class="text-left p-3 rounded-xl border transition-colors"
                  :class="form.type === key ? 'border-accent bg-blue-50/60' : 'border-gray-200 hover:border-gray-300'"
                  @click="form.type = key">
            <div class="text-sm font-semibold text-primary">{{ t.label }}</div>
            <div class="text-xs text-muted mt-0.5 leading-snug">{{ t.hint }}</div>
          </button>
        </div>

        <!-- İndirim -->
        <div v-if="form.type !== 'BuyXPayY'" class="grid grid-cols-2 gap-3 mb-4">
          <div v-if="form.type === 'Basket'">
            <label class="field-label">Hesap en az (₺)</label>
            <input v-model.number="form.minTotal" type="number" min="0"
                   class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
          </div>
          <div>
            <label class="field-label">İndirim</label>
            <div class="flex gap-2">
              <input v-model.number="form.discountValue" type="number" min="0" step="0.5"
                     class="flex-1 min-w-0 px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
              <select v-model="form.discountType" class="px-2 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white">
                <option value="Percent">%</option>
                <option value="Amount">{{ form.type === 'Hourly' ? '₺ / adet' : '₺' }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- X al Y öde -->
        <div v-else class="flex items-end gap-3 mb-4">
          <div>
            <label class="field-label">Al</label>
            <input v-model.number="form.buyQty" type="number" min="2" max="50"
                   class="w-24 px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
          </div>
          <div>
            <label class="field-label">Öde</label>
            <input v-model.number="form.payQty" type="number" min="1"
                   class="w-24 px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
          </div>
          <p class="text-xs text-muted pb-2.5">
            Hesapta her {{ form.buyQty || 'X' }} üründen {{ Math.max(0, (form.buyQty || 0) - (form.payQty || 0)) || '…' }} tanesi
            bedava olur (en ucuzlar).
          </p>
        </div>

        <!-- Zaman -->
        <label class="field-label">Günler</label>
        <div class="flex flex-wrap gap-1.5 mb-4">
          <button v-for="(d, i) in DAYS" :key="d" type="button"
                  :class="(form.daysMask & (1 << i)) ? 'chip-accent' : 'chip-neutral'"
                  @click="form.daysMask ^= (1 << i)">{{ d }}</button>
          <button type="button" class="text-xs font-bold text-accent hover:underline ml-2"
                  @click="form.daysMask = 127">Her gün</button>
          <button type="button" class="text-xs font-bold text-accent hover:underline"
                  @click="form.daysMask = 31">Hafta içi</button>
        </div>

        <label class="flex items-center gap-2 text-[13px] text-primary mb-2 cursor-pointer select-none">
          <input v-model="form.allDay" type="checkbox" class="w-4 h-4"/> Tüm gün
        </label>
        <div v-if="!form.allDay" class="flex items-center gap-3 mb-4">
          <input v-model="form.startTime" type="time" class="px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
          <span class="text-muted">–</span>
          <input v-model="form.endTime" type="time" class="px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
          <span class="text-xs text-muted">Bitiş başlangıçtan önceyse gece yarısını aşar (22:00–02:00).</span>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label class="field-label">Başlangıç tarihi <span class="text-muted font-normal">isteğe bağlı</span></label>
            <input v-model="form.startDate" type="date" class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
          </div>
          <div>
            <label class="field-label">Bitiş tarihi <span class="text-muted font-normal">isteğe bağlı</span></label>
            <input v-model="form.endDate" type="date" class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
          </div>
        </div>

        <!-- Hedef -->
        <template v-if="form.type !== 'Basket'">
          <label class="field-label">Hangi ürünlerde?</label>
          <p class="text-xs text-muted mb-2">Hiçbiri seçilmezse tüm ürünlerde geçerlidir.</p>
          <div class="flex flex-wrap gap-1.5 mb-3">
            <button v-for="c in categories" :key="c.id" type="button"
                    :class="form.categoryIds.includes(c.id) ? 'chip-accent' : 'chip-neutral'"
                    @click="toggleIn(form.categoryIds, c.id)">{{ c.name }}</button>
          </div>
          <input v-model="productSearch" placeholder="Ürün ara..."
                 class="w-full px-3 h-9 border border-gray-200 rounded-lg text-[13.5px] bg-white mb-2"/>
          <div class="max-h-48 overflow-y-auto border border-gray-100 rounded-xl mb-4">
            <label v-for="p in filteredProducts" :key="p.id"
                   class="flex items-center gap-2.5 px-3 py-2 text-[13px] cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-0">
              <input type="checkbox" :checked="form.productIds.includes(p.id)" class="w-4 h-4"
                     @change="toggleIn(form.productIds, p.id)"/>
              <span class="flex-1 text-primary">{{ p.name }}</span>
              <span class="text-xs text-muted">{{ categoryName(p.categoryId) }}</span>
            </label>
          </div>
        </template>

        <label class="flex items-center gap-2 text-[13px] text-primary mb-2 cursor-pointer select-none">
          <input v-model="form.showOnMenu" type="checkbox" class="w-4 h-4"/>
          QR menüde göster ve QR siparişlerine uygula
        </label>
        <label class="flex items-center gap-2 text-[13px] text-primary mb-5 cursor-pointer select-none">
          <input v-model="form.isActive" type="checkbox" class="w-4 h-4"/> Kampanya açık
        </label>

        <div v-if="form.error" class="text-sm text-danger mb-3">{{ form.error }}</div>
        <div class="flex justify-end gap-2">
          <button class="btn-secondary" @click="form.open = false">Vazgeç</button>
          <button class="btn-primary" :disabled="form.saving" @click="save">
            {{ form.saving ? 'Kaydediliyor...' : 'Kaydet' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { uiConfirm } from '../utils/dialog'
import { ref, reactive, computed, onMounted } from 'vue'
import api from '../api/api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const TYPES = {
  Hourly:   { label: 'Saatlik indirim', hint: 'Seçili saatlerde ürüne % ya da ₺ indirim (happy hour).' },
  BuyXPayY: { label: 'X al Y öde',      hint: 'Örn. 3 çay al 2 çay öde; bedava olan en ucuzlar.' },
  Basket:   { label: 'Sepet indirimi',  hint: 'Hesap belli tutarı geçince % ya da ₺ indirim.' },
}
const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

const loading = ref(true)
const error = ref('')
const campaigns = ref([])
const products = ref([])
const categories = ref([])
const productSearch = ref('')

async function load() {
  error.value = ''
  try {
    const [c, p, cat] = await Promise.all([api.getCampaigns(), api.getProducts(), api.getCategories()])
    campaigns.value = c.data
    products.value = p.data
    categories.value = cat.data
  } catch (e) {
    error.value = e.response?.data?.message || 'Kampanyalar yüklenemedi.'
  } finally {
    loading.value = false
  }
}

const categoryName = id => categories.value.find(c => c.id === id)?.name || ''
const filteredProducts = computed(() => {
  const q = productSearch.value.trim().toLocaleLowerCase('tr')
  return q ? products.value.filter(p => p.name.toLocaleLowerCase('tr').includes(q)) : products.value
})

// ── Kart metinleri ──────────────────────────────────────────────────
function scheduleText(c) {
  const days = c.daysMask === 127 ? 'Her gün'
    : c.daysMask === 31 ? 'Hafta içi'
    : c.daysMask === 96 ? 'Hafta sonu'
    : DAYS.filter((_, i) => c.daysMask & (1 << i)).join(', ')
  const time = c.startTime && c.endTime ? `${c.startTime}–${c.endTime}` : 'tüm gün'
  const fmtD = d => new Date(d).toLocaleDateString('tr-TR')
  const range = c.startDate || c.endDate
    ? ` · ${c.startDate ? fmtD(c.startDate) : '…'} – ${c.endDate ? fmtD(c.endDate) : '…'}` : ''
  return `${days}, ${time}${range}`
}
function targetText(c) {
  if (!c.productIds.length && !c.categoryIds.length) return 'Tüm ürünler'
  const parts = [
    ...c.categoryIds.map(id => categoryName(id)).filter(Boolean),
    ...c.productIds.map(id => products.value.find(p => p.id === id)?.name).filter(Boolean),
  ]
  return parts.length > 4 ? `${parts.slice(0, 4).join(', ')} +${parts.length - 4}` : parts.join(', ')
}
const statusText = c => !c.isActive ? 'Durduruldu' : c.expired ? 'Süresi doldu' : c.isActiveNow ? 'Şu an geçerli' : 'Zamanı değil'
const statusChip = c => !c.isActive || c.expired ? 'chip-neutral' : c.isActiveNow ? 'chip-success' : 'chip-accent'

// ── Form ────────────────────────────────────────────────────────────
const blank = () => ({
  open: true, id: null, saving: false, error: '',
  name: '', type: 'Hourly', isActive: true, daysMask: 127, allDay: false,
  startTime: '15:00', endTime: '18:00', startDate: '', endDate: '',
  discountType: 'Percent', discountValue: 20, buyQty: 3, payQty: 2, minTotal: 500,
  productIds: [], categoryIds: [], showOnMenu: true,
})
const form = reactive({ ...blank(), open: false })

function openCreate() {
  productSearch.value = ''
  Object.assign(form, blank())
}
function openEdit(c) {
  productSearch.value = ''
  Object.assign(form, blank(), {
    id: c.id, name: c.name, type: c.type, isActive: c.isActive, daysMask: c.daysMask,
    allDay: !c.startTime, startTime: c.startTime || '15:00', endTime: c.endTime || '18:00',
    startDate: c.startDate ? c.startDate.slice(0, 10) : '', endDate: c.endDate ? c.endDate.slice(0, 10) : '',
    discountType: c.discountType, discountValue: c.discountValue || 20,
    buyQty: c.buyQty || 3, payQty: c.payQty || 2, minTotal: c.minTotal || 500,
    productIds: [...c.productIds], categoryIds: [...c.categoryIds], showOnMenu: c.showOnMenu,
  })
}
function toggleIn(list, id) {
  const i = list.indexOf(id)
  if (i === -1) list.push(id)
  else list.splice(i, 1)
}

async function save() {
  form.saving = true
  form.error = ''
  const body = {
    name: form.name, type: form.type, isActive: form.isActive, daysMask: form.daysMask,
    startTime: form.allDay ? null : form.startTime, endTime: form.allDay ? null : form.endTime,
    startDate: form.startDate || null, endDate: form.endDate || null,
    discountType: form.discountType, discountValue: Number(form.discountValue) || 0,
    buyQty: Number(form.buyQty) || 0, payQty: Number(form.payQty) || 0, minTotal: Number(form.minTotal) || 0,
    productIds: form.productIds, categoryIds: form.categoryIds, showOnMenu: form.showOnMenu,
  }
  try {
    if (form.id) await api.updateCampaign(form.id, body)
    else await api.createCampaign(body)
    form.open = false
    await load()
  } catch (e) {
    form.error = e.response?.data?.message || 'Kaydedilemedi.'
  } finally {
    form.saving = false
  }
}

async function toggle(c) {
  try {
    await api.toggleCampaign(c.id)
    await load()
  } catch (e) { error.value = e.response?.data?.message || 'Değiştirilemedi.' }
}
async function remove(c) {
  if (!await uiConfirm(`"${c.name}" kampanyası silinsin mi? Geçmiş satışlardaki indirim kayıtları raporda kalır.`)) return
  try {
    await api.deleteCampaign(c.id)
    await load()
  } catch (e) { error.value = e.response?.data?.message || 'Silinemedi.' }
}

onMounted(load)
</script>
