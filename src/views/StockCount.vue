<template>
  <div class="p-8 max-w-7xl">
    <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 class="page-title">Stok Sayımı</h1>
        <p class="page-subtitle">
          Tüm hammaddeleri tek listede sayın; fark stoklara işlenir ve kaç ₺ tuttuğu raporlanır.
        </p>
      </div>
      <div class="flex gap-2">
        <button v-if="current" class="btn-secondary" @click="closeCurrent">Sayım listesi</button>
        <button v-if="!draft" class="btn-primary" :disabled="busy" @click="startCount">+ Yeni sayım</button>
      </div>
    </div>

    <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>

    <!-- ── Açık sayım / rapor ─────────────────────────────────────────── -->
    <template v-if="current">
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <h2 class="section-title">{{ current.name }}</h2>
        <span :class="isDraft ? 'chip-accent' : 'chip-success'">{{ isDraft ? 'Sayılıyor' : 'Tamamlandı' }}</span>
        <span class="text-xs text-muted">
          {{ current.createdBy }} · {{ fmtDate(current.createdAt) }}
          <template v-if="current.completedAt"> · tamamlayan {{ current.completedBy }}, {{ fmtDate(current.completedAt) }}</template>
        </span>
      </div>

      <!-- Özet -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div class="bg-white rounded-2xl shadow-sm p-5">
          <div class="field-label">Sayılan kalem</div>
          <div class="text-2xl font-semibold tracking-tight text-primary mt-1">{{ countedCount }} / {{ current.lines.length }}</div>
          <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
            <div class="h-full bg-accent rounded-full" :style="{ width: progress + '%' }"></div>
          </div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm p-5">
          <div class="field-label">Eksik çıkan</div>
          <div class="text-2xl font-semibold tracking-tight text-danger mt-1">{{ money(totals.short) }}</div>
          <div class="text-xs text-muted mt-1">{{ totals.shortCount }} kalem</div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm p-5">
          <div class="field-label">Fazla çıkan</div>
          <div class="text-2xl font-semibold tracking-tight text-success mt-1">{{ money(totals.over) }}</div>
          <div class="text-xs text-muted mt-1">{{ totals.overCount }} kalem</div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm p-5">
          <div class="field-label">Net fark</div>
          <div class="text-2xl font-semibold tracking-tight mt-1"
               :class="totals.net < 0 ? 'text-danger' : totals.net > 0 ? 'text-success' : 'text-primary'">
            {{ signedMoney(totals.net) }}
          </div>
          <div class="text-xs text-muted mt-1">{{ isDraft ? 'güncel birim maliyetle' : 'sayım anındaki maliyetle' }}</div>
        </div>
      </div>

      <!-- Araç çubuğu -->
      <div class="flex flex-wrap items-center gap-2 mb-3">
        <input v-model="search" placeholder="Hammadde ara..."
               class="px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white w-64"/>
        <button v-for="f in FILTERS" :key="f.key" @click="filter = f.key"
                :class="filter === f.key ? 'chip-accent' : 'chip-neutral'">{{ f.label }}</button>
        <div class="flex-1"></div>
        <span v-if="isDraft" class="text-xs" :class="saveState === 'error' ? 'text-danger' : 'text-muted'">
          {{ { idle: '', dirty: 'Kaydedilmedi', saving: 'Kaydediliyor...', saved: 'Kaydedildi', error: 'Kaydedilemedi' }[saveState] }}
        </span>
        <button class="btn-secondary btn-sm" @click="printSheet">Sayım kağıdı</button>
        <template v-if="isDraft">
          <button class="btn-ghost btn-sm text-danger" :disabled="busy" @click="deleteDraft">Sil</button>
          <button class="btn-primary btn-sm" :disabled="busy || !countedCount" @click="complete">Sayımı tamamla</button>
        </template>
      </div>

      <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left px-4 py-3 text-[11px] font-semibold text-muted uppercase">Hammadde</th>
                <th class="text-right px-4 py-3 text-[11px] font-semibold text-muted uppercase whitespace-nowrap">
                  {{ isDraft ? 'Sistemde' : 'Beklenen' }}
                </th>
                <th class="text-left px-4 py-3 text-[11px] font-semibold text-muted uppercase w-48">Sayılan</th>
                <th class="text-right px-4 py-3 text-[11px] font-semibold text-muted uppercase">Fark</th>
                <th class="text-right px-4 py-3 text-[11px] font-semibold text-muted uppercase whitespace-nowrap">Fark ₺</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="l in shown" :key="l.id" class="border-t border-gray-50">
                <td class="px-4 py-2.5 min-w-[200px]">
                  <div class="font-semibold text-primary">{{ l.ingredientName }}</div>
                </td>
                <td class="px-4 py-2.5 text-right text-muted whitespace-nowrap">
                  {{ l.expected != null ? qty(l.expected) + ' ' + l.unit : '—' }}
                </td>
                <td class="px-4 py-2">
                  <div v-if="isDraft" class="flex items-center gap-2">
                    <input :ref="el => (inputs[l.id] = el)" v-model="l.text" inputmode="decimal"
                           :placeholder="'— ' + l.unit"
                           @input="edited(l)" @keydown.enter.prevent="nextInput(l)"
                           class="w-32 px-3 h-9 border rounded-lg text-[13.5px] bg-white text-right"
                           :class="l.invalid ? 'border-red-400' : 'border-gray-200'"/>
                    <button v-if="l.expected != null && l.text === ''" class="text-xs font-semibold text-accent hover:underline whitespace-nowrap"
                            title="Sayılan miktar sistemdekiyle aynı" @click="sameAsSystem(l)">Aynı</button>
                  </div>
                  <span v-else class="font-semibold text-primary whitespace-nowrap">
                    {{ l.counted != null ? qty(l.counted) + ' ' + l.unit : 'sayılmadı' }}
                  </span>
                </td>
                <td class="px-4 py-2.5 text-right font-semibold whitespace-nowrap" :class="tone(diff(l))">
                  {{ diff(l) == null ? '' : signed(qty, diff(l)) + ' ' + l.unit }}
                </td>
                <td class="px-4 py-2.5 text-right font-semibold whitespace-nowrap" :class="tone(diffValue(l))">
                  {{ diffValue(l) == null ? '' : signedMoney(diffValue(l)) }}
                </td>
              </tr>
              <tr v-if="!shown.length">
                <td colspan="5" class="text-center py-10 text-muted">Bu filtrede kalem yok.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="px-4 py-3 text-xs text-muted border-t border-gray-100">
          <template v-if="isDraft">
            Boş bırakılan kalemler sayılmamış sayılır ve stoğuna dokunulmaz. "Sistemde" sütunu canlıdır:
            sayım sürerken satış olursa güncellenir. Tamamlayınca stok, sayılan miktara eşitlenir.
          </template>
          <template v-else>
            Beklenen miktar ve maliyet, sayımın tamamlandığı andaki değerlerdir.
          </template>
        </p>
      </div>
    </template>

    <!-- ── Sayım listesi ──────────────────────────────────────────────── -->
    <template v-else>
      <div v-if="draft" class="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div class="text-sm text-primary">
          <b>{{ draft.name }}</b> devam ediyor — {{ draft.countedLines }} / {{ draft.total }} kalem sayıldı.
        </div>
        <button class="btn-primary btn-sm" @click="open(draft.id)">Sayıma devam et</button>
      </div>

      <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-4 py-3 text-[11px] font-semibold text-muted uppercase">Sayım</th>
              <th class="text-left px-4 py-3 text-[11px] font-semibold text-muted uppercase">Tarih</th>
              <th class="text-right px-4 py-3 text-[11px] font-semibold text-muted uppercase">Kalem</th>
              <th class="text-right px-4 py-3 text-[11px] font-semibold text-muted uppercase whitespace-nowrap">Net fark</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="5" class="text-center py-10 text-muted">Yükleniyor...</td></tr>
            <tr v-for="c in completed" :key="c.id" class="border-t border-gray-50 hover:bg-gray-50/60 cursor-pointer"
                @click="open(c.id)">
              <td class="px-4 py-3">
                <div class="font-semibold text-primary">{{ c.name }}</div>
                <div class="text-xs text-muted">{{ c.completedBy || c.createdBy }}</div>
              </td>
              <td class="px-4 py-3 text-muted whitespace-nowrap">{{ fmtDate(c.completedAt || c.createdAt) }}</td>
              <td class="px-4 py-3 text-right text-muted">{{ c.countedLines }} / {{ c.total }}</td>
              <td class="px-4 py-3 text-right font-semibold whitespace-nowrap" :class="tone(c.value)">{{ signedMoney(c.value) }}</td>
              <td class="px-4 py-3 text-right"><span class="text-xs font-bold text-accent">Raporu aç</span></td>
            </tr>
            <tr v-if="!loading && !completed.length">
              <td colspan="5" class="text-center py-10 text-muted">
                Henüz tamamlanmış sayım yok. Ay sonunda ya da şüphe olduğunda "Yeni sayım" ile başlayın.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import api from '../api/api'

const list = ref([])
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const current = ref(null)
const search = ref('')
const filter = ref('all')
const saveState = ref('idle')
const inputs = reactive({})

const FILTERS = [
  { key: 'all', label: 'Tümü' },
  { key: 'todo', label: 'Sayılmayan' },
  { key: 'diff', label: 'Farkı olan' },
]

const draft = computed(() => list.value.find(c => c.status === 'Draft'))
const completed = computed(() => list.value.filter(c => c.status !== 'Draft'))
const isDraft = computed(() => current.value?.status === 'Draft')

// ── Biçim ──────────────────────────────────────────────────────────────
const qty = v => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 3 }).format(v ?? 0)
const money = v => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v ?? 0)) + ' ₺'
const signed = (f, v) => (v > 0 ? '+' : v < 0 ? '-' : '') + f(Math.abs(v))
const signedMoney = v => (v > 0 ? '+' : v < 0 ? '-' : '') + money(v)
const tone = v => (v == null || v === 0 ? 'text-muted' : v < 0 ? 'text-danger' : 'text-success')
const fmtDate = v => v ? new Date(v).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

// "12,5" ve "12.5" kabul edilir; boş = sayılmadı
function parse(text) {
  const t = String(text ?? '').trim().replace(/\s/g, '').replace(',', '.')
  if (t === '') return { value: null, ok: true }
  const n = Number(t)
  return Number.isFinite(n) && n >= 0 ? { value: n, ok: true } : { value: null, ok: false }
}

const countedOf = l => (isDraft.value ? parse(l.text).value : l.counted)
const diff = l => {
  const c = countedOf(l)
  return c == null || l.expected == null ? null : Math.round((c - l.expected) * 1000) / 1000
}
const diffValue = l => {
  const d = diff(l)
  return d == null ? null : Math.round(d * (l.costPerUnit ?? 0) * 100) / 100
}

const countedCount = computed(() => current.value?.lines.filter(l => countedOf(l) != null).length ?? 0)
const progress = computed(() => current.value?.lines.length ? Math.round(countedCount.value * 100 / current.value.lines.length) : 0)
const totals = computed(() => {
  const t = { short: 0, over: 0, net: 0, shortCount: 0, overCount: 0 }
  for (const l of current.value?.lines ?? []) {
    const v = diffValue(l), d = diff(l)
    if (d == null) continue
    if (d < 0) { t.short += v; t.shortCount++ } else if (d > 0) { t.over += v; t.overCount++ }
    t.net += v
  }
  return t
})

const shown = computed(() => {
  const q = search.value.trim().toLocaleLowerCase('tr-TR')
  return (current.value?.lines ?? []).filter(l => {
    if (q && !l.ingredientName.toLocaleLowerCase('tr-TR').includes(q)) return false
    if (filter.value === 'todo') return countedOf(l) == null
    if (filter.value === 'diff') return (diff(l) ?? 0) !== 0
    return true
  })
})

// ── Yükleme ────────────────────────────────────────────────────────────
async function loadList() {
  try {
    list.value = (await api.getStockCounts()).data
  } catch (e) {
    error.value = e.response?.data?.message || 'Sayımlar alınamadı.'
  } finally {
    loading.value = false
  }
}

async function open(id) {
  error.value = ''
  try {
    const { data } = await api.getStockCount(id)
    data.lines.forEach(l => { l.text = l.counted != null ? String(l.counted).replace('.', ',') : ''; l.invalid = false })
    current.value = data
    search.value = ''
    filter.value = 'all'
    saveState.value = 'idle'
  } catch (e) {
    error.value = e.response?.data?.message || 'Sayım açılamadı.'
  }
}

async function closeCurrent() {
  await flush()
  current.value = null
  await loadList()
}

async function startCount() {
  const name = prompt('Sayım adı', `Sayım ${new Date().toLocaleDateString('tr-TR')}`)
  if (name === null) return
  busy.value = true
  error.value = ''
  try {
    const { data } = await api.createStockCount({ name })
    await loadList()
    await open(data.id)
  } catch (e) {
    error.value = e.response?.data?.message || 'Sayım başlatılamadı.'
  } finally {
    busy.value = false
  }
}

// ── Otomatik kayıt ─────────────────────────────────────────────────────
const dirty = new Set()
let timer = null

function edited(l) {
  const p = parse(l.text)
  l.invalid = !p.ok
  if (!p.ok) return
  dirty.add(l.id)
  saveState.value = 'dirty'
  clearTimeout(timer)
  timer = setTimeout(flush, 1200)
}

async function flush() {
  clearTimeout(timer)
  if (!dirty.size || !current.value) return true
  const ids = [...dirty]
  dirty.clear()
  const byId = Object.fromEntries(current.value.lines.map(l => [l.id, l]))
  saveState.value = 'saving'
  try {
    await api.saveStockCountLines(current.value.id, ids.map(id => ({ id, counted: parse(byId[id].text).value })))
    saveState.value = dirty.size ? 'dirty' : 'saved'
    return true
  } catch (e) {
    ids.forEach(id => dirty.add(id))
    saveState.value = 'error'
    error.value = e.response?.data?.message || 'Sayılan miktarlar kaydedilemedi.'
    return false
  }
}

function sameAsSystem(l) {
  l.text = qty(l.expected).replace(/\./g, '')
  edited(l)
}

// Enter: listedeki bir sonraki kutuya geç (klavyeyle hızlı giriş)
function nextInput(l) {
  const i = shown.value.findIndex(x => x.id === l.id)
  const next = shown.value[i + 1]
  if (next) nextTick(() => { inputs[next.id]?.focus(); inputs[next.id]?.select() })
}

async function complete() {
  if (current.value.lines.some(l => l.invalid)) { error.value = 'Hatalı girilmiş miktarları düzeltin.'; return }
  const todo = current.value.lines.length - countedCount.value
  const msg = `Sayım tamamlansın mı?\n\n${countedCount.value} kalemin stoğu sayılan miktara eşitlenecek.`
    + (todo ? `\n${todo} kalem sayılmadı; onlara dokunulmayacak.` : '')
    + `\nNet fark: ${signedMoney(totals.value.net)}\n\nBu işlem geri alınamaz.`
  if (!confirm(msg)) return
  busy.value = true
  error.value = ''
  try {
    if (!(await flush())) return
    await api.completeStockCount(current.value.id)
    const id = current.value.id
    await loadList()
    await open(id)
  } catch (e) {
    error.value = e.response?.data?.message || 'Sayım tamamlanamadı.'
  } finally {
    busy.value = false
  }
}

async function deleteDraft() {
  if (!confirm(`"${current.value.name}" silinsin mi? Girilen miktarlar kaybolur; stoklar değişmez.`)) return
  busy.value = true
  try {
    clearTimeout(timer)
    dirty.clear()
    await api.deleteStockCount(current.value.id)
    current.value = null
    await loadList()
  } catch (e) {
    error.value = e.response?.data?.message || 'Silinemedi.'
  } finally {
    busy.value = false
  }
}

// Kör sayım kağıdı: sistemdeki miktar yazılmaz, sayan kişi etkilenmesin
function printSheet() {
  const esc = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const rows = current.value.lines.map((l, i) => `<tr><td>${i + 1}</td><td>${esc(l.ingredientName)}</td><td>${esc(l.unit)}</td><td></td></tr>`).join('')
  const w = window.open('', '_blank')
  if (!w) { alert('Açılır pencere engellendi. Tarayıcıda bu site için açılır pencerelere izin verin.'); return }
  w.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${esc(current.value.name)}</title>
    <style>
      body { font-family: Inter, Arial, sans-serif; margin: 12mm; color: #0F172A; font-size: 10.5pt; }
      h1 { font-size: 15pt; margin: 0 0 1mm; } .sub { color: #64748B; font-size: 9pt; margin-bottom: 5mm; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #CBD5E1; padding: 2.2mm 2.5mm; text-align: left; }
      th { background: #F1F5F9; font-size: 8.5pt; text-transform: uppercase; }
      td:first-child { width: 8mm; color: #64748B; } td:nth-child(3) { width: 18mm; } td:last-child { width: 40mm; }
      tr { break-inside: avoid; }
    </style></head><body>
    <h1>${esc(current.value.name)}</h1>
    <div class="sub">Sayan: ____________________ &nbsp;&nbsp; Tarih/saat: ____________________</div>
    <table><thead><tr><th>#</th><th>Hammadde</th><th>Birim</th><th>Sayılan</th></tr></thead><tbody>${rows}</tbody></table>
    <script>window.onload = () => { window.focus(); window.print() }<\/script></body></html>`)
  w.document.close()
}

// Kaydedilmemiş miktar varken sayfadan çıkılırsa önce kaydet
onBeforeRouteLeave(() => flush())
const beforeUnload = e => { if (dirty.size) { e.preventDefault(); e.returnValue = '' } }
onMounted(() => { window.addEventListener('beforeunload', beforeUnload); loadList() })
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
</script>
