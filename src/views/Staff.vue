<template>
  <div class="p-8 max-w-7xl">
    <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 class="page-title">Personel</h1>
        <p class="page-subtitle">Mesai giriş-çıkışları ve kişi bazında performans</p>
      </div>
      <button v-if="tab === 'shifts'" class="btn-primary" @click="openForm()">+ Mesai ekle</button>
    </div>

    <!-- Sekme + tarih aralığı -->
    <div class="flex flex-wrap items-end gap-3 mb-5">
      <div class="flex bg-gray-100 rounded-xl p-1">
        <button v-for="t in TABS" :key="t.key" @click="tab = t.key"
                class="px-4 h-9 rounded-lg text-sm font-semibold transition-colors"
                :class="tab === t.key ? 'bg-white text-primary shadow-sm' : 'text-muted hover:text-primary'">{{ t.label }}</button>
      </div>
      <div class="flex-1"></div>
      <div class="flex flex-wrap items-end gap-2">
        <button v-for="p in PRESETS" :key="p.key" class="chip-neutral" @click="applyPreset(p.key)">{{ p.label }}</button>
        <input v-model="from" type="date" class="px-3 h-9 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
        <span class="text-muted pb-2">–</span>
        <input v-model="to" type="date" class="px-3 h-9 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
      </div>
    </div>

    <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>

    <!-- ── Mesai ──────────────────────────────────────────────────────── -->
    <template v-if="tab === 'shifts'">
      <div v-if="onShift.length" class="mb-4 p-4 bg-green-50 border border-green-100 rounded-2xl">
        <div class="text-xs font-semibold text-green-800 uppercase tracking-wide mb-2">Şu an mesaide</div>
        <div class="flex flex-wrap gap-2">
          <button v-for="s in onShift" :key="s.id" @click="openForm(s)"
                  class="px-3 h-8 rounded-full bg-white text-sm text-primary shadow-sm hover:bg-gray-50">
            <b>{{ s.userName }}</b> · {{ clock(s.clockIn) }}'den beri · {{ dur(s.minutes) }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-4">
        <div class="bg-white rounded-2xl shadow-sm overflow-hidden self-start">
          <div class="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-primary">Toplam</div>
          <div v-if="!totals.length" class="px-4 py-6 text-sm text-muted text-center">Bu aralıkta mesai yok.</div>
          <button v-for="t in totals" :key="t.userName" @click="userFilter = userFilter === t.userName ? '' : t.userName"
                  class="w-full px-4 py-2.5 border-t border-gray-50 flex items-center justify-between text-left"
                  :class="userFilter === t.userName ? 'bg-blue-50/70' : 'hover:bg-gray-50'">
            <span class="text-sm font-semibold text-primary truncate">{{ t.userName }}</span>
            <span class="text-sm text-muted whitespace-nowrap">{{ hours(t.minutes) }} · {{ t.days }} gün</span>
          </button>
        </div>

        <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-left px-4 py-3 text-[11px] font-semibold text-muted uppercase">Personel</th>
                  <th class="text-left px-4 py-3 text-[11px] font-semibold text-muted uppercase">Giriş – Çıkış</th>
                  <th class="text-right px-4 py-3 text-[11px] font-semibold text-muted uppercase">Süre</th>
                  <th class="text-left px-4 py-3 text-[11px] font-semibold text-muted uppercase">Kaynak</th>
                  <th class="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading"><td colspan="5" class="text-center py-10 text-muted">Yükleniyor...</td></tr>
                <tr v-for="s in shownShifts" :key="s.id" class="border-t border-gray-50">
                  <td class="px-4 py-2.5">
                    <div class="font-semibold text-primary">{{ s.userName }}</div>
                    <div class="text-xs text-muted">{{ dateLabel(s.clockIn) }}</div>
                  </td>
                  <td class="px-4 py-2.5 whitespace-nowrap">
                    {{ clock(s.clockIn) }} –
                    <span v-if="s.clockOut">{{ clock(s.clockOut) }}<span v-if="!sameDay(s)" class="text-xs text-muted"> (+1)</span></span>
                    <span v-else class="chip-success">sürüyor</span>
                  </td>
                  <td class="px-4 py-2.5 text-right font-semibold text-primary whitespace-nowrap">{{ dur(s.minutes) }}</td>
                  <td class="px-4 py-2.5 text-xs text-muted whitespace-nowrap"
                      :title="[s.editedBy ? `Düzelten: ${s.editedBy}` : '', s.note || ''].filter(Boolean).join(' · ')">
                    {{ SOURCES[s.source] || s.source }}<span v-if="s.editedBy || s.note" class="text-amber-700"> · düzeltildi</span>
                  </td>
                  <td class="px-4 py-2.5 text-right"><button class="btn-ghost btn-sm" @click="openForm(s)">Düzenle</button></td>
                </tr>
                <tr v-if="!loading && !shownShifts.length">
                  <td colspan="5" class="text-center py-10 text-muted">
                    Mesai kaydı yok. Personel kasadan ya da garson telefonundan "Mesaiye başla" der; unutulanı buradan ekleyin.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Performans ─────────────────────────────────────────────────── -->
    <template v-else>
      <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left px-3 py-3 text-[11px] font-semibold text-muted uppercase">Personel</th>
                <th class="text-right px-3 py-3 text-[11px] font-semibold text-muted uppercase">Mesai</th>
                <th class="text-right px-3 py-3 text-[11px] font-semibold text-muted uppercase" title="Ödemesini aldığı satışlar">Tahsilat</th>
                <th class="text-right px-3 py-3 text-[11px] font-semibold text-muted uppercase" title="Masaya eklediği kalemler (kasa ya da garson telefonu)">Masa siparişi</th>
                <th class="text-right px-3 py-3 text-[11px] font-semibold text-muted uppercase whitespace-nowrap" title="Masa siparişi tutarı ÷ mesai saati">Sipariş / saat</th>
                <th class="text-right px-3 py-3 text-[11px] font-semibold text-muted uppercase">İkram</th>
                <th class="text-right px-3 py-3 text-[11px] font-semibold text-muted uppercase">İndirim</th>
                <th class="text-right px-3 py-3 text-[11px] font-semibold text-muted uppercase">İptal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading"><td colspan="8" class="text-center py-10 text-muted">Yükleniyor...</td></tr>
              <tr v-for="r in perf" :key="r.userName" class="border-t border-gray-50">
                <td class="px-3 py-3 font-semibold text-primary whitespace-nowrap">
                  {{ r.userName }} <span v-if="r.onShift" class="chip-success ml-1">mesaide</span>
                </td>
                <td class="px-3 py-3 text-right whitespace-nowrap">
                  <div class="font-semibold text-primary">{{ r.minutes ? hours(r.minutes) : '—' }}</div>
                  <div v-if="r.days" class="text-xs text-muted">{{ r.days }} gün</div>
                </td>
                <td class="px-3 py-3 text-right whitespace-nowrap">
                  <div class="font-semibold text-primary">{{ r.saleCount ? money(r.saleTotal) : '—' }}</div>
                  <div v-if="r.saleCount" class="text-xs text-muted">{{ r.saleCount }} fiş · ort. {{ money(r.saleTotal / r.saleCount) }}</div>
                </td>
                <td class="px-3 py-3 text-right whitespace-nowrap">
                  <div class="font-semibold text-primary">{{ r.orderItems ? money(r.orderTotal) : '—' }}</div>
                  <div v-if="r.orderItems" class="text-xs text-muted">{{ qty(r.orderItems) }} kalem · {{ r.orderTables }} adisyon</div>
                </td>
                <td class="px-3 py-3 text-right font-semibold whitespace-nowrap"
                    :class="r.orderPerHour != null ? 'text-primary' : 'text-muted'">
                  {{ r.orderPerHour != null ? money(r.orderPerHour) : '—' }}
                </td>
                <td class="px-3 py-3 text-right whitespace-nowrap">
                  <div :class="r.compAmount ? 'font-semibold text-amber-700' : 'text-muted'">{{ r.compAmount ? money(r.compAmount) : '—' }}</div>
                  <div v-if="r.compCount" class="text-xs text-muted">{{ r.compCount }} kalem</div>
                </td>
                <td class="px-3 py-3 text-right whitespace-nowrap" :class="r.discountAmount ? 'font-semibold text-amber-700' : 'text-muted'">
                  {{ r.discountAmount ? money(r.discountAmount) : '—' }}
                </td>
                <td class="px-3 py-3 text-right whitespace-nowrap">
                  <div :class="r.cancelAmount ? 'font-semibold text-danger' : 'text-muted'">{{ r.cancelAmount ? money(r.cancelAmount) : '—' }}</div>
                  <div v-if="r.cancelCount" class="text-xs text-muted">{{ r.cancelCount }} kayıt</div>
                </td>
              </tr>
              <tr v-if="!loading && !perf.length">
                <td colspan="8" class="text-center py-10 text-muted">Bu aralıkta kayıt yok.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="px-3 py-3 text-xs text-muted border-t border-gray-100">
          Tahsilat: kişinin kasada ödemesini aldığı satışlar. Masa siparişi: kişinin masaya eklediği kalemler (kasa ya da
          garson telefonu; QR menü siparişleri dahil değil). Aynı kişi hem sipariş alıp hem tahsilat yaptıysa iki sütunda da
          görünür — toplanmaz. İkram, indirim ve iptal işlemi yapan kişiye yazılır.
        </p>
      </div>
    </template>

    <!-- ── Mesai formu ────────────────────────────────────────────────── -->
    <div v-if="form.open" class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
         @click.self="form.open = false">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7">
        <h2 class="modal-title mb-5">{{ form.id ? 'Mesaiyi Düzenle' : 'Mesai Ekle' }}</h2>
        <label class="field-label">Personel</label>
        <select v-model="form.userName" :disabled="!!form.id"
                class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white mb-3">
          <option v-for="u in users" :key="u.username" :value="u.username">{{ u.username }}</option>
        </select>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="field-label">Giriş</label>
            <input v-model="form.clockIn" type="datetime-local"
                   class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
          </div>
          <div>
            <label class="field-label">Çıkış</label>
            <input v-model="form.clockOut" type="datetime-local"
                   class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
            <button v-if="!form.clockOut" class="text-xs font-semibold text-accent mt-1" @click="form.clockOut = localInput(new Date())">Şimdi</button>
          </div>
        </div>
        <p class="text-xs text-muted mt-1">Çıkış boş bırakılırsa mesai sürüyor sayılır.</p>
        <label class="field-label mt-3">Not</label>
        <input v-model="form.note" maxlength="200" placeholder="ör. çıkışı unuttu, kamera kaydına göre düzeltildi"
               class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>

        <div v-if="form.error" class="mt-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">{{ form.error }}</div>
        <div class="flex items-center gap-2 mt-6">
          <button v-if="form.id" class="btn-ghost text-danger" :disabled="form.busy" @click="remove">Sil</button>
          <div class="flex-1"></div>
          <button class="btn-secondary" @click="form.open = false">Vazgeç</button>
          <button class="btn-primary" :disabled="form.busy" @click="save">Kaydet</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import api from '../api/api'

const TABS = [{ key: 'shifts', label: 'Mesai' }, { key: 'perf', label: 'Performans' }]
const PRESETS = [
  { key: 'today', label: 'Bugün' }, { key: 'week', label: 'Bu hafta' },
  { key: 'month', label: 'Bu ay' }, { key: 'last', label: 'Geçen ay' },
]
const SOURCES = { kasa: 'Kasa', garson: 'Telefon', panel: 'Panel' }

const pad = n => String(n).padStart(2, '0')
const isoDay = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const localInput = d => `${isoDay(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`

const tab = ref('shifts')
const now = new Date()
const from = ref(isoDay(new Date(now.getFullYear(), now.getMonth(), 1)))
const to = ref(isoDay(now))
const shifts = ref([])
const perf = ref([])
const users = ref([])
const userFilter = ref('')
const loading = ref(true)
const error = ref('')

const money = v => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
const qty = v => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(v ?? 0)
const clock = v => new Date(v).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
const dateLabel = v => new Date(v).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', weekday: 'short' })
const dur = m => m < 60 ? `${m} dk` : `${Math.floor(m / 60)} sa ${m % 60} dk`
const hours = m => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(m / 60)} sa`
const sameDay = s => new Date(s.clockIn).toDateString() === new Date(s.clockOut).toDateString()

const onShift = computed(() => shifts.value.filter(s => !s.clockOut))
const shownShifts = computed(() => userFilter.value ? shifts.value.filter(s => s.userName === userFilter.value) : shifts.value)
const totals = computed(() => {
  const map = new Map()
  for (const s of shifts.value) {
    const t = map.get(s.userName) ?? { userName: s.userName, minutes: 0, days: new Set() }
    t.minutes += s.minutes
    t.days.add(new Date(s.clockIn).toDateString())
    map.set(s.userName, t)
  }
  return [...map.values()].map(t => ({ ...t, days: t.days.size })).sort((a, b) => b.minutes - a.minutes)
})

function applyPreset(key) {
  const d = new Date()
  if (key === 'today') { from.value = to.value = isoDay(d) }
  else if (key === 'week') {
    const monday = new Date(d); monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    from.value = isoDay(monday); to.value = isoDay(d)
  } else if (key === 'month') { from.value = isoDay(new Date(d.getFullYear(), d.getMonth(), 1)); to.value = isoDay(d) }
  else { from.value = isoDay(new Date(d.getFullYear(), d.getMonth() - 1, 1)); to.value = isoDay(new Date(d.getFullYear(), d.getMonth(), 0)) }
}

async function load() {
  loading.value = true
  error.value = ''
  const params = { from: from.value, to: to.value }
  try {
    if (tab.value === 'shifts') shifts.value = (await api.getShifts(params)).data
    else perf.value = (await api.getStaffPerformance(params)).data.rows
  } catch (e) {
    error.value = e.response?.data?.message || 'Veriler alınamadı.'
  } finally {
    loading.value = false
  }
}
watch([tab, from, to], load)

// ── Form ───────────────────────────────────────────────────────────────
const form = reactive({ open: false })

function openForm(s) {
  Object.assign(form, {
    open: true, busy: false, error: '',
    id: s?.id ?? null,
    userName: s?.userName ?? users.value[0]?.username ?? '',
    clockIn: localInput(s ? new Date(s.clockIn) : new Date()),
    clockOut: s?.clockOut ? localInput(new Date(s.clockOut)) : '',
    note: s?.note ?? '',
  })
}

async function save() {
  if (!form.userName) { form.error = 'Personel seçin.'; return }
  form.busy = true
  form.error = ''
  const body = { userName: form.userName, clockIn: form.clockIn, clockOut: form.clockOut || null, note: form.note || null }
  try {
    if (form.id) await api.updateShift(form.id, body)
    else await api.createShift(body)
    form.open = false
    await load()
  } catch (e) {
    form.error = e.response?.data?.message || 'Kaydedilemedi.'
  } finally {
    form.busy = false
  }
}

async function remove() {
  if (!confirm(`${form.userName} için bu mesai kaydı silinsin mi?`)) return
  form.busy = true
  try {
    await api.deleteShift(form.id)
    form.open = false
    await load()
  } catch (e) {
    form.error = e.response?.data?.message || 'Silinemedi.'
  } finally {
    form.busy = false
  }
}

onMounted(async () => {
  load()
  try { users.value = (await api.getUsers()).data.filter(u => u.isActive !== false) } catch { /* liste yoksa form boş */ }
})
</script>
