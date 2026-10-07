<template>
  <div class="p-8 max-w-7xl">
    <div class="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 class="page-title">Sipariş Önerisi</h1>
        <p class="page-subtitle">
          Tüketim hızına göre neyin, ne kadar alınması gerektiği. Liste tedarikçiye göre gruplanır;
          WhatsApp ile gönderilebilir, mal gelince tek seferde depoya girilir.
        </p>
      </div>
      <div class="flex gap-2 flex-shrink-0">
        <button class="btn-secondary" @click="suppliersOpen = true">Tedarikçiler</button>
        <button v-if="auth.isAdmin" class="btn-secondary" @click="openSettings">Hesap Ayarları</button>
      </div>
    </div>

    <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>
    <div v-if="loading" class="text-muted">Yükleniyor...</div>

    <template v-else-if="data">
      <!-- Özet -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
        <div class="bg-white rounded-2xl shadow-sm p-5">
          <div class="text-xs text-muted">Sipariş gereken kalem</div>
          <div class="text-2xl font-semibold text-primary mt-1">{{ needed.length }}</div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm p-5">
          <div class="text-xs text-muted">Stoğu biten</div>
          <div class="text-2xl font-semibold mt-1" :class="outCount ? 'text-danger' : 'text-primary'">{{ outCount }}</div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm p-5">
          <div class="text-xs text-muted">Tahmini tutar (seçili)</div>
          <div class="text-2xl font-semibold text-primary mt-1 whitespace-nowrap">{{ money(selectedCost) }}</div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm p-5">
          <div class="text-xs text-muted">Hesap</div>
          <div class="text-[13px] text-primary mt-1 leading-snug">
            Son <b>{{ data.settings.lookbackDays }}</b> günün tüketimi ·
            tedarik <b>{{ data.settings.leadDays }}</b> gün ·
            <b>{{ data.settings.coverDays }}</b> günlük alım
          </div>
        </div>
      </div>

      <!-- Filtre -->
      <div class="flex items-center gap-3 mb-4 flex-wrap">
        <div class="flex gap-1.5">
          <button :class="view === 'needed' ? 'chip-accent' : 'chip-neutral'" @click="view = 'needed'">
            Sipariş gerekenler ({{ needed.length }})
          </button>
          <button :class="view === 'all' ? 'chip-accent' : 'chip-neutral'" @click="view = 'all'">
            Tümü ({{ rows.length }})
          </button>
        </div>
        <input v-model="search" placeholder="Kalem ara..."
               class="px-3 rounded-lg border border-gray-200 text-[13.5px] w-64 h-9 bg-white"/>
      </div>

      <div v-if="!groups.length" class="bg-white rounded-2xl shadow-sm p-10 text-center">
        <div class="text-sm font-semibold text-primary">
          {{ view === 'needed' ? 'Şu an sipariş gereken bir şey yok' : 'Kalem bulunamadı' }}
        </div>
        <p class="text-xs text-muted mt-1 max-w-md mx-auto">
          Öneri, hammaddelerin satışta düşen miktarından ve minimum stok değerlerinden hesaplanır.
          Reçeteler girilmediyse ya da minimum stok tanımlı değilse liste boş kalabilir.
        </p>
      </div>

      <!-- Tedarikçi grupları -->
      <div v-for="g in groups" :key="g.key" class="bg-white rounded-2xl shadow-sm mb-5 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div class="section-title">{{ g.supplier?.name || 'Tedarikçisi belirtilmemiş' }}</div>
            <div class="text-xs text-muted mt-0.5">
              <template v-if="g.supplier?.phone">{{ g.supplier.phone }} · </template>
              {{ g.rows.filter(r => r.checked).length }} kalem seçili
              <template v-if="groupCost(g)"> · tahmini {{ money(groupCost(g)) }}</template>
            </div>
          </div>
          <div class="flex gap-2 flex-wrap">
            <a v-if="g.supplier?.phone" :href="whatsappUrl(g)" target="_blank" rel="noopener"
               class="btn-success btn-sm" :class="{ 'pointer-events-none opacity-50': !hasChecked(g) }">WhatsApp ile Gönder</a>
            <button class="btn-secondary btn-sm" :disabled="!hasChecked(g)" @click="copyText(g)">
              {{ copiedKey === g.key ? 'Kopyalandı' : 'Metni Kopyala' }}
            </button>
            <button class="btn-primary btn-sm" :disabled="!hasChecked(g)" @click="openReceive(g)">Teslim Al</button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-[13.5px]">
            <thead class="bg-gray-50">
              <tr>
                <th class="w-10 px-4 py-2.5"></th>
                <th class="text-left px-3 py-2.5 text-[11px] font-semibold text-muted uppercase">Kalem</th>
                <th class="text-right px-3 py-2.5 text-[11px] font-semibold text-muted uppercase">Stok</th>
                <th class="text-right px-3 py-2.5 text-[11px] font-semibold text-muted uppercase">Günlük</th>
                <th class="text-left px-3 py-2.5 text-[11px] font-semibold text-muted uppercase">Yeter</th>
                <th class="text-left px-3 py-2.5 text-[11px] font-semibold text-muted uppercase">Sipariş</th>
                <th class="text-right px-3 py-2.5 text-[11px] font-semibold text-muted uppercase">Tutar</th>
                <th class="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in g.rows" :key="r.key" class="border-t border-gray-50 align-top">
                <td class="px-4 py-3">
                  <input type="checkbox" v-model="r.checked" class="w-4 h-4 mt-0.5"/>
                </td>
                <td class="px-3 py-3 min-w-[200px]">
                  <div class="font-semibold text-primary">
                    {{ r.name }}
                    <span v-if="r.kind === 'product'" class="chip-neutral ml-1 align-middle">Ürün</span>
                  </div>
                  <div class="text-xs text-muted mt-0.5">{{ r.reason }}</div>
                </td>
                <td class="px-3 py-3 text-right whitespace-nowrap">
                  <span :class="r.stock <= 0 ? 'text-danger font-semibold' : ''">{{ fmtQty(r.stock, r.unit) }}</span>
                  <div v-if="r.minimum > 0" class="text-xs text-muted">min {{ fmtQty(r.minimum, r.unit) }}</div>
                </td>
                <td class="px-3 py-3 text-right whitespace-nowrap text-muted">
                  {{ r.dailyUsage > 0 ? fmtQty(r.dailyUsage, r.unit) : '—' }}
                </td>
                <td class="px-3 py-3 whitespace-nowrap">
                  <span v-if="r.daysLeft == null" class="text-muted">—</span>
                  <span v-else :class="daysChip(r)">{{ fmtNum(r.daysLeft) }} gün</span>
                </td>
                <td class="px-3 py-3 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <input v-model.number="r.qty" type="number" min="0" :step="r.packSize > 0 ? r.packSize : 1"
                           class="w-28 px-2 h-9 border border-gray-200 rounded-lg text-[13.5px] bg-white text-right"/>
                    <span class="text-xs text-muted">{{ r.unit }}</span>
                  </div>
                  <div v-if="r.packSize > 0 && r.qty > 0" class="text-xs text-muted mt-1">
                    {{ packText(r) }}
                  </div>
                </td>
                <td class="px-3 py-3 text-right whitespace-nowrap">
                  {{ r.unitCost ? money(r.qty * r.unitCost) : '—' }}
                </td>
                <td class="px-4 py-3 text-right">
                  <button v-if="auth.isAdmin" class="text-xs font-bold text-accent hover:underline"
                          @click="openItem(r)">Ayarla</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ── Kalem ayarı: tedarikçi + paket ─────────────────────────────── -->
    <div v-if="item.open" class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
         @click.self="item.open = false">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7">
        <h2 class="modal-title mb-1">{{ item.row?.name }}</h2>
        <p class="text-sm text-muted mb-5">Kimden alınıyor ve hangi paketle?</p>

        <label class="field-label">Tedarikçi</label>
        <select v-model="item.supplierId" class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white mb-4">
          <option :value="null">Belirtilmemiş</option>
          <option v-for="s in data.suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>

        <label class="field-label">Paket büyüklüğü ({{ item.row?.unit }})</label>
        <input v-model.number="item.packSize" type="number" min="0"
               class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
        <p class="text-xs text-muted mt-1.5 mb-5">
          Örn. un 25 kg'lık çuvalla geliyorsa {{ item.row?.unit === 'gr' ? '25000' : '25' }} yazın; öneri bunun katına
          yuvarlanır. Paketsiz alınıyorsa 0 bırakın.
        </p>

        <div v-if="item.error" class="text-sm text-danger mb-3">{{ item.error }}</div>
        <div class="flex justify-end gap-2">
          <button class="btn-secondary" @click="item.open = false">Vazgeç</button>
          <button class="btn-primary" :disabled="item.saving" @click="saveItem">Kaydet</button>
        </div>
      </div>
    </div>

    <!-- ── Teslim al ─────────────────────────────────────────────────── -->
    <div v-if="receive.open" class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
         @click.self="receive.open = false">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-7 max-h-[90vh] overflow-y-auto">
        <h2 class="modal-title mb-1">Teslim Al · {{ receive.supplierName || 'Tedarikçisiz' }}</h2>
        <p class="text-sm text-muted mb-5">
          Gelen miktarları kontrol edin. Kaydedince her kalem depoya giriş olarak yazılır.
          Birim fiyat girerseniz hammaddenin maliyeti güncellenir.
        </p>

        <table class="w-full text-[13.5px] mb-5">
          <thead>
            <tr class="text-left text-[11px] text-muted uppercase">
              <th class="py-2 font-semibold">Kalem</th>
              <th class="py-2 font-semibold">Gelen miktar</th>
              <th class="py-2 font-semibold">Birim fiyat</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in receive.lines" :key="l.key" class="border-t border-gray-100">
              <td class="py-2.5 pr-3 font-semibold text-primary">{{ l.name }}</td>
              <td class="py-2.5 pr-3">
                <div class="flex items-center gap-2">
                  <input v-model.number="l.quantity" type="number" min="0"
                         class="w-28 px-2 h-9 border border-gray-200 rounded-lg bg-white text-right"/>
                  <span class="text-xs text-muted">{{ l.unit }}</span>
                </div>
              </td>
              <td class="py-2.5">
                <input v-if="l.kind === 'ingredient'" v-model.number="l.unitCost" type="number" min="0" step="0.01"
                       class="w-28 px-2 h-9 border border-gray-200 rounded-lg bg-white text-right" placeholder="₺ / birim"/>
                <span v-else class="text-xs text-muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="receive.error" class="text-sm text-danger mb-3">{{ receive.error }}</div>
        <div class="flex justify-end gap-2">
          <button class="btn-secondary" @click="receive.open = false">Vazgeç</button>
          <button class="btn-primary" :disabled="receive.saving" @click="saveReceive">
            {{ receive.saving ? 'Kaydediliyor...' : 'Depoya Ekle' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Hesap ayarları ────────────────────────────────────────────── -->
    <div v-if="settings.open" class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
         @click.self="settings.open = false">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7">
        <h2 class="modal-title mb-5">Hesap Ayarları</h2>
        <label class="field-label">Kaç günün tüketimine bakılsın?</label>
        <input v-model.number="settings.lookbackDays" type="number" min="3" max="90"
               class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white mb-1"/>
        <p class="text-xs text-muted mb-4">Daha uzun süre daha dengeli, daha kısa süre güncel eğilimi yansıtır. Genelde 14 gün iyidir.</p>
        <label class="field-label">Tedarik süresi (gün)</label>
        <input v-model.number="settings.leadDays" type="number" min="0" max="30"
               class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white mb-1"/>
        <p class="text-xs text-muted mb-4">Sipariş verildikten kaç gün sonra mal geliyor.</p>
        <label class="field-label">Her siparişte kaç günlük alım yapılsın?</label>
        <input v-model.number="settings.coverDays" type="number" min="1" max="60"
               class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white mb-5"/>
        <div class="flex justify-end gap-2">
          <button class="btn-secondary" @click="settings.open = false">Vazgeç</button>
          <button class="btn-primary" @click="saveSettings">Kaydet</button>
        </div>
      </div>
    </div>

    <!-- ── Tedarikçiler ──────────────────────────────────────────────── -->
    <div v-if="suppliersOpen" class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
         @click.self="suppliersOpen = false">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-7 max-h-[90vh] overflow-y-auto">
        <h2 class="modal-title mb-1">Tedarikçiler</h2>
        <p class="text-sm text-muted mb-5">Telefon girerseniz sipariş listesi WhatsApp ile gönderilebilir.</p>

        <div v-if="!data?.suppliers?.length" class="text-sm text-muted mb-4">Henüz tedarikçi yok.</div>
        <div v-for="s in data?.suppliers || []" :key="s.id"
             class="flex items-center gap-2 py-2.5 border-b border-gray-100">
          <template v-if="sup.editId === s.id">
            <input v-model="sup.name" class="flex-1 min-w-0 px-3 h-9 border border-gray-200 rounded-lg text-[13.5px] bg-white" placeholder="Ad"/>
            <input v-model="sup.phone" class="w-40 px-3 h-9 border border-gray-200 rounded-lg text-[13.5px] bg-white" placeholder="0532 000 00 00"/>
            <button class="btn-primary btn-sm" @click="saveSupplier(s.id)">Kaydet</button>
            <button class="btn-ghost btn-sm" @click="sup.editId = null">Vazgeç</button>
          </template>
          <template v-else>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold text-primary truncate">{{ s.name }}</div>
              <div class="text-xs text-muted">{{ s.phone || 'Telefon yok' }}</div>
            </div>
            <template v-if="auth.isAdmin">
              <button class="btn-secondary btn-sm" @click="editSupplier(s)">Düzenle</button>
              <button class="btn-danger btn-sm" @click="deleteSupplier(s)">Sil</button>
            </template>
          </template>
        </div>

        <div v-if="auth.isAdmin" class="flex gap-2 mt-4">
          <input v-model="sup.newName" class="flex-1 min-w-0 px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white" placeholder="Tedarikçi adı"/>
          <input v-model="sup.newPhone" class="w-40 px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white" placeholder="Telefon"/>
          <button class="btn-primary" :disabled="!sup.newName.trim()" @click="addSupplier">Ekle</button>
        </div>
        <div v-if="sup.error" class="text-sm text-danger mt-2">{{ sup.error }}</div>

        <div class="flex justify-end mt-6">
          <button class="btn-secondary" @click="suppliersOpen = false">Kapat</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '../api/api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const loading = ref(true)
const error   = ref('')
const data    = ref(null)
const rows    = ref([])
const view    = ref('needed')
const search  = ref('')
const copiedKey = ref(null)
const suppliersOpen = ref(false)

async function load() {
  error.value = ''
  try {
    const res = await api.getPurchaseSuggestions()
    data.value = res.data
    // Kullanıcının düzenleyebileceği alanlar (miktar, seçim) satıra eklenir.
    rows.value = res.data.items.map(i => ({
      ...i,
      key: `${i.kind}-${i.id}`,
      qty: Number(i.suggested) || 0,
      checked: i.needsOrder,
    }))
  } catch (e) {
    error.value = e.response?.data?.message || 'Öneri hesaplanamadı.'
  } finally {
    loading.value = false
  }
}

const needed = computed(() => rows.value.filter(r => r.needsOrder))
const outCount = computed(() => rows.value.filter(r => r.stock <= 0 && (r.dailyUsage > 0 || r.minimum > 0)).length)
const selectedCost = computed(() => rows.value
  .filter(r => r.checked && r.unitCost).reduce((s, r) => s + r.qty * r.unitCost, 0))

const groups = computed(() => {
  const q = search.value.trim().toLocaleLowerCase('tr')
  const list = (view.value === 'needed' ? needed.value : rows.value)
    .filter(r => !q || r.name.toLocaleLowerCase('tr').includes(q))
  const map = new Map()
  for (const r of list) {
    const key = r.supplierId ?? 'none'
    if (!map.has(key)) map.set(key, { key, supplier: data.value.suppliers.find(s => s.id === r.supplierId) || null, rows: [] })
    map.get(key).rows.push(r)
  }
  // Tedarikçisi olanlar ada göre, tedarikçisizler en sonda
  return [...map.values()].sort((a, b) =>
    (a.supplier ? 0 : 1) - (b.supplier ? 0 : 1) || (a.supplier?.name || '').localeCompare(b.supplier?.name || '', 'tr'))
})

const hasChecked = g => g.rows.some(r => r.checked && r.qty > 0)
const groupCost = g => g.rows.filter(r => r.checked && r.unitCost).reduce((s, r) => s + r.qty * r.unitCost, 0)

// ── Biçim ───────────────────────────────────────────────────────────
const fmtNum = (v, max = 2) => Number(v).toLocaleString('tr-TR', { maximumFractionDigits: max })
const money = v => `${Number(v || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`

// 25000 gr → "25 kg", 1500 ml → "1,5 lt"
function fmtQty(v, unit) {
  const n = Number(v) || 0
  if (unit === 'gr' && Math.abs(n) >= 1000) return `${fmtNum(n / 1000)} kg`
  if (unit === 'ml' && Math.abs(n) >= 1000) return `${fmtNum(n / 1000)} lt`
  return `${fmtNum(n)} ${unit}`
}

function packText(r) {
  const packs = r.qty / r.packSize
  const whole = Number.isInteger(packs)
  return `${whole ? packs : fmtNum(packs, 1)} paket × ${fmtQty(r.packSize, r.unit)}`
}

function daysChip(r) {
  const lead = data.value.settings.leadDays
  if (r.daysLeft <= lead) return 'chip-danger'
  if (r.daysLeft <= lead + data.value.settings.coverDays) return 'chip-accent'
  return 'chip-success'
}

// ── Gönderim metni ──────────────────────────────────────────────────
function orderText(g) {
  const lines = g.rows.filter(r => r.checked && r.qty > 0).map(r => {
    const amount = r.packSize > 0 ? `${packText(r)}` : fmtQty(r.qty, r.unit)
    return `- ${r.name}: ${amount}`
  })
  return [
    `Merhaba${g.supplier?.name ? ' ' + g.supplier.name : ''},`,
    `${data.value.businessName || 'İşletmemiz'} için sipariş listemiz:`,
    '',
    ...lines,
    '',
    'Teşekkürler.',
  ].join('\n')
}

// Türkiye numarası: 0532..., 532..., +90 532... → 90532...
function waPhone(p) {
  let d = String(p || '').replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (d.startsWith('0')) d = '90' + d.slice(1)
  else if (d.length === 10 && d.startsWith('5')) d = '90' + d
  return d
}
const whatsappUrl = g => `https://wa.me/${waPhone(g.supplier.phone)}?text=${encodeURIComponent(orderText(g))}`

async function copyText(g) {
  try {
    await navigator.clipboard.writeText(orderText(g))
    copiedKey.value = g.key
    setTimeout(() => (copiedKey.value = null), 2000)
  } catch { /* pano izni yok */ }
}

// ── Kalem ayarı ─────────────────────────────────────────────────────
const item = reactive({ open: false, row: null, supplierId: null, packSize: 0, saving: false, error: '' })
function openItem(r) {
  Object.assign(item, { open: true, row: r, supplierId: r.supplierId ?? null, packSize: Number(r.packSize) || 0, error: '' })
}
async function saveItem() {
  item.saving = true
  item.error = ''
  try {
    await api.savePurchasingItem(item.row.kind, item.row.id, { supplierId: item.supplierId, packSize: Number(item.packSize) || 0 })
    item.open = false
    await load()
  } catch (e) {
    item.error = e.response?.data?.message || 'Kaydedilemedi.'
  } finally {
    item.saving = false
  }
}

// ── Teslim al ───────────────────────────────────────────────────────
const receive = reactive({ open: false, supplierName: '', lines: [], saving: false, error: '' })
function openReceive(g) {
  Object.assign(receive, {
    open: true, error: '', supplierName: g.supplier?.name || '',
    lines: g.rows.filter(r => r.checked && r.qty > 0).map(r => ({
      key: r.key, kind: r.kind, id: r.id, name: r.name, unit: r.unit,
      quantity: r.qty, unitCost: r.unitCost || null,
    })),
  })
}
async function saveReceive() {
  receive.saving = true
  receive.error = ''
  try {
    await api.receivePurchase({
      supplierName: receive.supplierName,
      lines: receive.lines.map(l => ({
        kind: l.kind, id: l.id, quantity: Number(l.quantity) || 0,
        unitCost: l.kind === 'ingredient' && Number(l.unitCost) > 0 ? Number(l.unitCost) : null,
      })),
    })
    receive.open = false
    await load()
  } catch (e) {
    receive.error = e.response?.data?.message || 'Depoya eklenemedi.'
  } finally {
    receive.saving = false
  }
}

// ── Hesap ayarları ──────────────────────────────────────────────────
const settings = reactive({ open: false, lookbackDays: 14, leadDays: 2, coverDays: 7 })
function openSettings() {
  Object.assign(settings, { open: true, ...data.value.settings })
}
async function saveSettings() {
  try {
    await api.savePurchasingSettings({
      lookbackDays: Number(settings.lookbackDays) || 14,
      leadDays: Number(settings.leadDays) || 0,
      coverDays: Number(settings.coverDays) || 7,
    })
    settings.open = false
    await load()
  } catch (e) {
    error.value = e.response?.data?.message || 'Ayarlar kaydedilemedi.'
  }
}

// ── Tedarikçiler ────────────────────────────────────────────────────
const sup = reactive({ editId: null, name: '', phone: '', newName: '', newPhone: '', error: '' })
function editSupplier(s) { Object.assign(sup, { editId: s.id, name: s.name, phone: s.phone || '', error: '' }) }
async function addSupplier() {
  sup.error = ''
  try {
    await api.createSupplier({ name: sup.newName.trim(), phone: sup.newPhone.trim() })
    sup.newName = ''
    sup.newPhone = ''
    await load()
  } catch (e) { sup.error = e.response?.data?.message || 'Eklenemedi.' }
}
async function saveSupplier(id) {
  sup.error = ''
  try {
    await api.updateSupplier(id, { name: sup.name.trim(), phone: sup.phone.trim() })
    sup.editId = null
    await load()
  } catch (e) { sup.error = e.response?.data?.message || 'Kaydedilemedi.' }
}
async function deleteSupplier(s) {
  if (!confirm(`${s.name} silinsin mi? Bağlı kalemler "tedarikçisiz" olur.`)) return
  try {
    await api.deleteSupplier(s.id)
    await load()
  } catch (e) { sup.error = e.response?.data?.message || 'Silinemedi.' }
}

onMounted(load)
</script>
