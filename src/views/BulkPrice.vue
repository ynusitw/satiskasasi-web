<template>
  <div class="p-4 sm:p-6 lg:p-8 pb-32">
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="page-title">Toplu Fiyat</h1>
        <p class="page-subtitle">Kategoriye ya da seçili ürünlere yüzde veya tutar olarak zam / indirim; hemen ya da ileri bir tarihte</p>
      </div>
      <div class="flex p-0.5 rounded-lg bg-gray-100">
        <button v-for="t in [{ k: 'new', l: 'Yeni değişiklik' }, { k: 'history', l: `Geçmiş (${batches.length})` }]" :key="t.k"
                @click="tab = t.k"
                class="px-4 h-8 rounded-md text-[13px] font-medium"
                :class="tab === t.k ? 'bg-white text-primary shadow-sm' : 'text-muted hover:text-primary'">
          {{ t.l }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="bg-white rounded-2xl shadow-sm py-16 text-center text-muted">Yükleniyor...</div>

    <!-- ── YENİ DEĞİŞİKLİK ─────────────────────────────────────────── -->
    <template v-else-if="tab === 'new'">
      <div class="bg-white rounded-2xl shadow-sm p-5 mb-4 space-y-4">
        <!-- Kategori + arama -->
        <div class="flex flex-wrap items-center gap-2">
          <button @click="selectedCats = []"
                  class="px-3 h-8 rounded-full text-[12.5px] font-semibold border"
                  :class="!selectedCats.length ? 'bg-accent text-white border-accent' : 'border-gray-200 text-muted hover:text-primary'">
            Tüm kategoriler
          </button>
          <button v-for="c in categories" :key="c.id" @click="toggleCat(c.id)"
                  class="px-3 h-8 rounded-full text-[12.5px] font-semibold border"
                  :class="selectedCats.includes(c.id) ? 'bg-accent text-white border-accent' : 'border-gray-200 text-muted hover:text-primary'">
            {{ c.name }}
          </button>
          <input v-model="search" placeholder="Ürün ara..."
                 class="ml-auto px-3 h-9 border border-gray-200 rounded-lg text-[13px] bg-white w-full sm:w-56"/>
        </div>

        <!-- Değişim -->
        <div class="flex flex-wrap items-end gap-3 pt-3 border-t border-gray-100">
          <div>
            <label class="field-label">Değişim</label>
            <select v-model="mode" class="px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white">
              <option value="pct_up">Yüzde artır (%)</option>
              <option value="pct_down">Yüzde indir (%)</option>
              <option value="amt_up">Tutar ekle (₺)</option>
              <option value="amt_down">Tutar düş (₺)</option>
            </select>
          </div>
          <div>
            <label class="field-label">{{ mode.startsWith('pct') ? 'Oran (%)' : 'Tutar (₺)' }}</label>
            <input v-model.number="amount" type="number" min="0" step="0.5"
                   class="px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white w-28"/>
          </div>
          <div>
            <label class="field-label">Yuvarlama</label>
            <select v-model.number="rounding" class="px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white">
              <option :value="0">Yuvarlama yok</option>
              <option :value="0.5">0,50 ₺</option>
              <option :value="1">1 ₺</option>
              <option :value="5">5 ₺</option>
              <option :value="10">10 ₺</option>
            </select>
          </div>
          <p class="text-[12px] text-muted pb-2.5 max-w-sm">
            Artışta yukarı, indirimde aşağı yuvarlanır. Yeni fiyatı satırda elle de değiştirebilirsiniz.
          </p>
        </div>
      </div>

      <!-- Önizleme tablosu -->
      <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="w-10 px-4 py-3">
                  <input type="checkbox" class="w-4 h-4" :checked="allVisibleIncluded" @change="toggleAllVisible"/>
                </th>
                <th class="text-left px-4 py-3 text-[11px] font-semibold text-muted uppercase">Ürün</th>
                <th class="text-left px-4 py-3 text-[11px] font-semibold text-muted uppercase hidden md:table-cell">Kategori</th>
                <th class="text-right px-4 py-3 text-[11px] font-semibold text-muted uppercase">Mevcut</th>
                <th class="text-right px-4 py-3 text-[11px] font-semibold text-muted uppercase">Yeni</th>
                <th class="text-right px-4 py-3 text-[11px] font-semibold text-muted uppercase w-20">Fark</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in visibleRows" :key="r.key"
                  class="border-t border-gray-50"
                  :class="included(r) ? '' : 'opacity-50'">
                <td class="px-4 py-2.5">
                  <input type="checkbox" class="w-4 h-4" :checked="included(r)" @change="toggleRow(r)"/>
                </td>
                <td class="px-4 py-2.5 text-[13.5px]">
                  <template v-if="r.variantId">
                    <span class="text-muted pl-4">↳ {{ r.variantName }}</span>
                  </template>
                  <template v-else>
                    <span class="font-medium text-primary">{{ r.productName }}</span>
                    <span v-if="r.hasVariants" class="ml-1.5 text-[11px] text-muted">ana fiyat</span>
                  </template>
                </td>
                <td class="px-4 py-2.5 text-[12.5px] text-muted hidden md:table-cell">{{ r.variantId ? '' : r.categoryName }}</td>
                <td class="px-4 py-2.5 text-right text-[13px] text-muted whitespace-nowrap">{{ fmt(r.price) }}</td>
                <td class="px-4 py-2.5 text-right whitespace-nowrap">
                  <input type="number" min="0" step="0.5" :value="newPrice(r)" :disabled="!included(r)"
                         @change="e => setOverride(r, e.target.value)"
                         class="w-24 px-2 h-8 border rounded-md text-[13px] text-right bg-white"
                         :class="overrides[r.key] != null ? 'border-accent font-semibold' : 'border-gray-200'"/>
                  <button v-if="overrides[r.key] != null" @click="delete overrides[r.key]"
                          class="ml-1 text-[11px] text-muted hover:text-primary" title="Hesaplanan fiyata dön">↺</button>
                </td>
                <td class="px-4 py-2.5 text-right text-[12.5px] font-semibold whitespace-nowrap" :class="diffClass(r)">
                  {{ included(r) ? diffText(r) : '' }}
                </td>
              </tr>
              <tr v-if="!visibleRows.length">
                <td colspan="6" class="text-center py-12 text-muted">Bu filtrede ürün yok</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Alt çubuk: özet + uygula -->
      <div class="fixed bottom-0 right-0 left-64 bg-white border-t border-gray-200 shadow-lg z-30">
        <div class="px-6 lg:px-8 py-3 flex flex-wrap items-center gap-3">
          <div class="text-[13px]">
            <span class="font-semibold text-primary">{{ changes.length }} fiyat değişecek</span>
            <span v-if="changes.length" class="text-muted"> · ortalama {{ avgText }}</span>
          </div>
          <div class="flex items-center gap-2 ml-auto flex-wrap">
            <input v-model="description" placeholder="Açıklama (ör. Ekim zammı)" maxlength="200"
                   class="px-3 h-9 border border-gray-200 rounded-lg text-[13px] bg-white w-48"/>
            <select v-model="when" class="px-3 h-9 border border-gray-200 rounded-lg text-[13px] bg-white">
              <option value="now">Hemen uygula</option>
              <option value="later">İleri tarihte</option>
            </select>
            <input v-if="when === 'later'" v-model="scheduledAt" type="datetime-local" :min="minDate"
                   class="px-3 h-9 border border-gray-200 rounded-lg text-[13px] bg-white"/>
            <button @click="submit" :disabled="saving || !changes.length || (when === 'later' && !scheduledAt)"
                    class="btn-primary disabled:opacity-50">
              {{ saving ? 'Kaydediliyor...' : when === 'later' ? 'Planla' : 'Uygula' }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- ── GEÇMİŞ ─────────────────────────────────────────────────── -->
    <div v-else class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div v-if="!batches.length" class="py-16 text-center text-muted">Henüz toplu fiyat değişikliği yapılmadı</div>
      <div v-for="b in batches" :key="b.id" class="border-t border-gray-50 first:border-t-0">
        <div class="px-6 py-4 flex flex-wrap items-center gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-semibold text-primary text-[14px]">{{ b.description || 'Toplu fiyat değişikliği' }}</span>
              <span class="text-[11px] font-bold px-2 py-0.5 rounded-full" :class="statusClass(b.status)">{{ statusText(b) }}</span>
            </div>
            <div class="text-[12.5px] text-muted mt-0.5">
              {{ b.itemCount }} fiyat · {{ b.createdBy }} · {{ dateTime(b.createdAt) }}
              <template v-if="b.closedAt"> · {{ b.status === 'Reverted' ? 'geri alan' : 'iptal eden' }} {{ b.closedBy }}, {{ dateTime(b.closedAt) }}</template>
            </div>
          </div>
          <div class="text-[13px] text-right">
            <span class="font-semibold" :class="(b.avgChangePct ?? 0) >= 0 ? 'text-danger' : 'text-success'">{{ pctText(b.avgChangePct) }}</span>
            <div class="text-[11.5px] text-muted">ortalama</div>
          </div>
          <div class="flex gap-2">
            <button @click="toggleDetail(b)" class="chip-neutral">{{ detail[b.id] ? 'Gizle' : 'Detay' }}</button>
            <button v-if="b.status === 'Pending'" @click="cancel(b)" class="chip-danger">İptal et</button>
            <button v-if="b.status === 'Applied'" @click="revert(b)" class="chip-danger">Geri al</button>
          </div>
        </div>
        <div v-if="detail[b.id]" class="px-6 pb-4">
          <table class="w-full text-[13px] bg-gray-50 rounded-xl overflow-hidden">
            <tr v-for="(i, idx) in detail[b.id].items" :key="idx" class="border-t border-gray-100 first:border-t-0">
              <td class="px-4 py-2">{{ i.productName }}<span v-if="i.variantName" class="text-muted"> · {{ i.variantName }}</span></td>
              <td class="px-4 py-2 text-right text-muted">{{ fmt(i.oldPrice) }}</td>
              <td class="px-2 py-2 text-center text-muted">→</td>
              <td class="px-4 py-2 text-right font-semibold">{{ fmt(i.newPrice) }}</td>
            </tr>
          </table>
          <p v-if="b.status === 'Pending'" class="text-[12px] text-muted mt-2">
            Eski fiyatlar planlandığı andakiler; uygulama anında güncel fiyatlar esas alınır.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import api from '../api/api'
import { uiAlert, uiConfirm } from '../utils/dialog'

const tab = ref('new')
const loading = ref(true)
const saving = ref(false)
const products = ref([])
const categories = ref([])
const batches = ref([])

const selectedCats = ref([])
const search = ref('')
const mode = ref('pct_up')
const amount = ref(10)
const rounding = ref(0)
const overrides = reactive({})     // key → elle girilen yeni fiyat
const excluded = reactive({})      // key → true: seçimden çıkarıldı
const description = ref('')
const when = ref('now')
const scheduledAt = ref('')
const detail = reactive({})

// Ürün + porsiyon satırları (porsiyonlu üründe ana fiyat da ayrı satır)
const rows = computed(() => {
  const list = []
  for (const p of products.value) {
    const variants = (p.variants || []).filter(v => v.isActive !== false)
    list.push({ key: `p${p.id}`, productId: p.id, variantId: null, productName: p.name, categoryId: p.categoryId,
                categoryName: p.categoryName, price: p.price, hasVariants: variants.length > 0 })
    for (const v of variants)
      list.push({ key: `v${v.id}`, productId: p.id, variantId: v.id, productName: p.name, variantName: v.name,
                  categoryId: p.categoryId, categoryName: p.categoryName, price: v.price })
  }
  return list
})

const visibleRows = computed(() => {
  const q = search.value.trim().toLocaleLowerCase('tr-TR')
  return rows.value.filter(r =>
    (!selectedCats.value.length || selectedCats.value.includes(r.categoryId)) &&
    (!q || r.productName.toLocaleLowerCase('tr-TR').includes(q)))
})

const included = r => !excluded[r.key]
function toggleRow(r) { excluded[r.key] ? delete excluded[r.key] : (excluded[r.key] = true) }
const allVisibleIncluded = computed(() => visibleRows.value.length > 0 && visibleRows.value.every(included))
function toggleAllVisible() {
  const on = !allVisibleIncluded.value
  for (const r of visibleRows.value) on ? delete excluded[r.key] : (excluded[r.key] = true)
}
function toggleCat(id) {
  const i = selectedCats.value.indexOf(id)
  i >= 0 ? selectedCats.value.splice(i, 1) : selectedCats.value.push(id)
}

// Artışta yukarı, indirimde aşağı yuvarlama; negatife düşmez
function computed_(old) {
  const v = Number(amount.value) || 0
  let n = mode.value === 'pct_up' ? old * (1 + v / 100)
        : mode.value === 'pct_down' ? old * (1 - v / 100)
        : mode.value === 'amt_up' ? old + v : old - v
  const step = Number(rounding.value) || 0
  if (step > 0) n = (mode.value.endsWith('up') ? Math.ceil(n / step - 1e-9) : Math.floor(n / step + 1e-9)) * step
  return Math.max(0, Math.round(n * 100) / 100)
}
const newPrice = r => overrides[r.key] != null ? overrides[r.key] : computed_(r.price)
function setOverride(r, v) {
  const n = Math.round(Number(v) * 100) / 100
  if (!isFinite(n) || n < 0) return
  n === computed_(r.price) ? delete overrides[r.key] : (overrides[r.key] = n)
}

// Gönderilecekler: görünür, seçili ve fiyatı gerçekten değişen satırlar
const changes = computed(() => visibleRows.value
  .filter(r => included(r) && Math.abs(newPrice(r) - r.price) >= 0.005)
  .map(r => ({ row: r, newPrice: newPrice(r) })))

const avgText = computed(() => {
  const withOld = changes.value.filter(c => c.row.price > 0)
  if (!withOld.length) return '—'
  const avg = withOld.reduce((s, c) => s + (c.newPrice - c.row.price) / c.row.price, 0) / withOld.length * 100
  return (avg >= 0 ? '+%' : '−%') + Math.abs(avg).toLocaleString('tr-TR', { maximumFractionDigits: 1 })
})

function diffText(r) {
  const d = newPrice(r) - r.price
  if (Math.abs(d) < 0.005) return '—'
  if (!r.price) return (d > 0 ? '+' : '−') + fmt(Math.abs(d))
  const p = d / r.price * 100
  return (p >= 0 ? '+%' : '−%') + Math.abs(p).toLocaleString('tr-TR', { maximumFractionDigits: 1 })
}
function diffClass(r) {
  const d = newPrice(r) - r.price
  return Math.abs(d) < 0.005 ? 'text-muted' : d > 0 ? 'text-danger' : 'text-success'
}

const minDate = computed(() => {
  const d = new Date(Date.now() + 5 * 60000)
  const z = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`
})

async function submit() {
  const n = changes.value.length
  const whenText = when.value === 'later'
    ? `${new Date(scheduledAt.value).toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} tarihinde uygulanacak.`
    : 'Hemen uygulanacak; kasalar en geç yarım dakika içinde yeni fiyatlara geçer.'
  if (!await uiConfirm(`${n} fiyat değişecek (ortalama ${avgText.value}).\n\n${whenText}\n\nGerekirse Geçmiş'ten geri alabilirsiniz.`,
                       { title: 'Toplu fiyat değişikliği', confirmText: when.value === 'later' ? 'Planla' : 'Uygula' })) return
  saving.value = true
  try {
    await api.createPriceChange({
      description: description.value,
      scheduledAt: when.value === 'later' ? scheduledAt.value : null,
      items: changes.value.map(c => ({ productId: c.row.productId, variantId: c.row.variantId, newPrice: c.newPrice })),
    })
    for (const k of Object.keys(overrides)) delete overrides[k]
    description.value = ''
    await load()
    tab.value = 'history'
  } catch (e) {
    await uiAlert(e.response?.data?.message || 'Fiyatlar kaydedilemedi.')
  } finally {
    saving.value = false
  }
}

// ── Geçmiş ───────────────────────────────────────────────────────────
async function toggleDetail(b) {
  if (detail[b.id]) { delete detail[b.id]; return }
  try { detail[b.id] = (await api.getPriceChange(b.id)).data } catch { await uiAlert('Detay alınamadı.') }
}
async function cancel(b) {
  if (!await uiConfirm('Planlanan fiyat değişikliği iptal edilsin mi? Fiyatlar değişmeyecek.', { title: 'İptal' })) return
  try { await api.cancelPriceChange(b.id); await load() } catch (e) { await uiAlert(e.response?.data?.message || 'İptal edilemedi.') }
}
async function revert(b) {
  if (!await uiConfirm(`${b.itemCount} fiyat bu değişiklikten önceki hâline döndürülsün mü?`,
                       { title: 'Geri al', confirmText: 'Geri al', danger: true })) return
  try { await api.revertPriceChange(b.id); delete detail[b.id]; await load() }
  catch (e) { await uiAlert(e.response?.data?.message || 'Geri alınamadı.') }
}

function statusText(b) {
  if (b.status === 'Pending') return `Bekliyor · ${dateTime(b.scheduledAt)}`
  if (b.status === 'Applied') return `Uygulandı · ${dateTime(b.appliedAt)}`
  if (b.status === 'Cancelled') return 'İptal edildi'
  if (b.status === 'Reverted') return 'Geri alındı'
  return b.status
}
function statusClass(s) {
  return { Pending: 'bg-amber-100 text-amber-700', Applied: 'bg-green-100 text-green-700',
           Cancelled: 'bg-gray-100 text-muted', Reverted: 'bg-gray-100 text-muted' }[s] || 'bg-gray-100 text-muted'
}
function pctText(p) {
  if (p == null) return '—'
  return (p >= 0 ? '+%' : '−%') + Math.abs(p).toLocaleString('tr-TR', { maximumFractionDigits: 1 })
}
function fmt(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}
function dateTime(d) {
  return d ? new Date(d).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''
}

async function load() {
  try {
    const [p, c, b] = await Promise.all([api.getProductsLite(), api.getCategories(), api.getPriceChanges()])
    products.value = p.data
    categories.value = c.data
    batches.value = b.data
  } catch (e) {
    await uiAlert(e.response?.data?.message || 'Veriler alınamadı.')
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>
