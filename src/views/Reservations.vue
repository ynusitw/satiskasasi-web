<template>
  <div class="p-8 max-w-6xl">
    <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 class="page-title">Rezervasyonlar</h1>
        <p class="page-subtitle">Masası atanan rezervasyon kasada ve garson telefonunda masa kartında görünür.</p>
      </div>
      <button class="btn-primary" @click="openForm()">+ Yeni rezervasyon</button>
    </div>

    <!-- Gün seçimi -->
    <div class="flex flex-wrap items-center gap-2 mb-4">
      <button class="btn-secondary btn-sm w-9 px-0" aria-label="Önceki gün" @click="shiftDay(-1)">‹</button>
      <input v-model="day" type="date" class="px-3 h-9 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
      <button class="btn-secondary btn-sm w-9 px-0" aria-label="Sonraki gün" @click="shiftDay(1)">›</button>
      <button v-if="day !== today" class="btn-ghost btn-sm" @click="day = today">Bugün</button>
      <span class="text-sm font-semibold text-primary ml-2">{{ dayLabel }}</span>
      <div class="flex-1"></div>
      <span class="text-sm text-muted">
        {{ active.length }} rezervasyon · {{ active.reduce((s, r) => s + r.guestCount, 0) }} kişi
      </span>
    </div>

    <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>

    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div v-if="loading" class="text-center py-12 text-muted text-sm">Yükleniyor...</div>
      <div v-else-if="!list.length" class="text-center py-12 text-muted text-sm">
        Bu gün için rezervasyon yok.
      </div>
      <div v-for="r in list" :key="r.id"
           class="px-5 py-4 border-t border-gray-50 first:border-t-0 flex flex-wrap items-center gap-x-5 gap-y-2"
           :class="{ 'opacity-55': r.status === 'Cancelled' || r.status === 'NoShow' }">
        <div class="w-16 flex-shrink-0">
          <div class="text-lg font-semibold text-primary leading-none">{{ hm(r.startsAt) }}</div>
          <div class="text-xs text-muted mt-1">{{ r.durationMinutes }} dk</div>
        </div>
        <div class="min-w-[180px] flex-1">
          <div class="font-semibold text-primary">{{ r.customerName }}
            <span class="text-muted font-normal">· {{ r.guestCount }} kişi</span>
          </div>
          <div class="text-xs text-muted mt-0.5">
            <a v-if="r.phone" :href="`tel:${r.phone}`" class="hover:text-accent">{{ r.phone }}</a>
            <template v-if="r.phone && r.note"> · </template>{{ r.note }}
          </div>
        </div>
        <div class="w-48 text-sm">
          <span v-if="r.tableName" class="font-semibold text-primary">{{ r.tableName }}</span>
          <span v-else class="text-muted">Masa atanmadı</span>
          <div v-if="r.sectionName" class="text-xs text-muted">{{ r.sectionName }}</div>
        </div>
        <div class="w-24 flex-shrink-0"><span :class="STATUS[r.status][1]">{{ STATUS[r.status][0] }}</span></div>
        <div class="flex gap-1.5 flex-shrink-0 w-[260px] justify-end">
          <template v-if="r.status === 'Booked'">
            <button class="btn-secondary btn-sm" :disabled="busy" @click="setStatus(r, 'Seated')">Geldi</button>
            <button class="btn-ghost btn-sm" :disabled="busy" @click="setStatus(r, 'NoShow')">Gelmedi</button>
            <button class="btn-ghost btn-sm" :disabled="busy" @click="setStatus(r, 'Cancelled')">İptal</button>
          </template>
          <button v-else class="btn-ghost btn-sm" :disabled="busy" @click="setStatus(r, 'Booked')">Geri al</button>
          <button class="btn-ghost btn-sm" @click="openForm(r)">Düzenle</button>
        </div>
      </div>
    </div>

    <!-- ── Form ───────────────────────────────────────────────────────── -->
    <div v-if="form.open" class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
         @click.self="form.open = false">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-7 max-h-[92vh] overflow-y-auto">
        <h2 class="modal-title mb-5">{{ form.id ? 'Rezervasyonu Düzenle' : 'Yeni Rezervasyon' }}</h2>

        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2">
            <label class="field-label">Müşteri adı</label>
            <input v-model="form.customerName" maxlength="80" placeholder="Ad Soyad"
                   class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
          </div>
          <div>
            <label class="field-label">Telefon</label>
            <input v-model="form.phone" maxlength="30" inputmode="tel" placeholder="05xx xxx xx xx"
                   class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
          </div>
          <div>
            <label class="field-label">Kişi sayısı</label>
            <input v-model.number="form.guestCount" type="number" min="1" max="500"
                   class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
          </div>
          <div>
            <label class="field-label">Tarih</label>
            <input v-model="form.date" type="date"
                   class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
          </div>
          <div>
            <label class="field-label">Saat</label>
            <input v-model="form.time" type="time" step="900"
                   class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
          </div>
          <div>
            <label class="field-label">Süre</label>
            <select v-model.number="form.durationMinutes"
                    class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white">
              <option v-for="m in [60, 90, 120, 150, 180, 240]" :key="m" :value="m">{{ (m / 60).toLocaleString('tr-TR') }} saat</option>
            </select>
          </div>
          <div>
            <label class="field-label">Masa</label>
            <select v-model="form.tableId"
                    class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white">
              <option :value="null">Fark etmez</option>
              <optgroup v-for="s in sections" :key="s.name" :label="s.name">
                <option v-for="t in s.tables" :key="t.id" :value="t.id">
                  {{ t.name }}{{ busyLabel(t.id) }}
                </option>
              </optgroup>
            </select>
          </div>
          <div class="col-span-2">
            <label class="field-label">Not</label>
            <input v-model="form.note" maxlength="300" placeholder="ör. doğum günü, cam kenarı, mama sandalyesi"
                   class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
          </div>
        </div>

        <div v-if="form.error" class="mt-4 p-3 rounded-xl text-sm"
             :class="form.clash ? 'bg-amber-50 text-amber-900' : 'bg-red-50 text-red-600'">
          {{ form.error }}
          <template v-if="form.clash"> Yine de kaydetmek için tekrar "Kaydet"e basın.</template>
        </div>

        <div class="flex items-center justify-between gap-2 mt-6">
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

const pad = n => String(n).padStart(2, '0')
const isoDay = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const today = isoDay(new Date())

const day = ref(today)
const list = ref([])
const tables = ref([])
const loading = ref(true)
const busy = ref(false)
const error = ref('')

const STATUS = {
  Booked:    ['Bekleniyor', 'chip-accent'],
  Seated:    ['Geldi', 'chip-success'],
  NoShow:    ['Gelmedi', 'chip-danger'],
  Cancelled: ['İptal', 'chip-neutral'],
}

const active = computed(() => list.value.filter(r => r.status === 'Booked' || r.status === 'Seated'))
const dayLabel = computed(() => {
  const d = new Date(day.value + 'T00:00')
  const diff = Math.round((d - new Date(today + 'T00:00')) / 864e5)
  const name = d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })
  return diff === 0 ? `Bugün, ${name}` : diff === 1 ? `Yarın, ${name}` : name
})
const hm = v => new Date(v).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })

const sections = computed(() => {
  const map = new Map()
  for (const t of tables.value) {
    if (!map.has(t.sectionName)) map.set(t.sectionName, [])
    map.get(t.sectionName).push(t)
  }
  return [...map].map(([name, tables]) => ({ name, tables }))
})

function shiftDay(n) {
  const d = new Date(day.value + 'T00:00')
  d.setDate(d.getDate() + n)
  day.value = isoDay(d)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    list.value = (await api.getReservations(day.value)).data
  } catch (e) {
    error.value = e.response?.data?.message || 'Rezervasyonlar alınamadı.'
  } finally {
    loading.value = false
  }
}
watch(day, load)

async function setStatus(r, status) {
  busy.value = true
  try {
    await api.setReservationStatus(r.id, status)
    r.status = status
  } catch (e) {
    error.value = e.response?.data?.message || 'Güncellenemedi.'
  } finally {
    busy.value = false
  }
}

// ── Form ───────────────────────────────────────────────────────────────
const form = reactive({ open: false })

function openForm(r) {
  const start = r ? new Date(r.startsAt) : null
  Object.assign(form, {
    open: true, busy: false, error: '', clash: false, force: false,
    id: r?.id ?? null,
    customerName: r?.customerName ?? '',
    phone: r?.phone ?? '',
    guestCount: r?.guestCount ?? 2,
    date: start ? isoDay(start) : day.value,
    time: start ? `${pad(start.getHours())}:${pad(start.getMinutes())}` : '20:00',
    durationMinutes: r?.durationMinutes ?? 120,
    tableId: r?.tableId ?? null,
    note: r?.note ?? '',
  })
}
// Kullanıcı bir alanı değiştirince çakışma onayı sıfırlanır
watch(() => [form.tableId, form.date, form.time, form.durationMinutes], () => { form.force = false; form.clash = false })

// Aynı gün listesinden: seçilen saatte dolu masaları seçenekte belirt
function busyLabel(tableId) {
  if (form.date !== day.value || !form.time) return ''
  const start = new Date(`${form.date}T${form.time}`)
  const end = new Date(start.getTime() + form.durationMinutes * 60000)
  const hit = list.value.find(r => r.tableId === tableId && r.id !== form.id
    && (r.status === 'Booked' || r.status === 'Seated')
    && new Date(r.startsAt) < end && new Date(new Date(r.startsAt).getTime() + r.durationMinutes * 60000) > start)
  return hit ? ` — ${hm(hit.startsAt)} ${hit.customerName}` : ''
}

async function save() {
  if (!form.customerName.trim()) { form.error = 'Müşteri adı girin.'; form.clash = false; return }
  if (!form.date || !form.time) { form.error = 'Tarih ve saat girin.'; form.clash = false; return }
  form.busy = true
  form.error = ''
  const body = {
    customerName: form.customerName.trim(), phone: form.phone.trim() || null,
    guestCount: form.guestCount, startsAt: `${form.date}T${form.time}:00`,
    durationMinutes: form.durationMinutes, tableId: form.tableId, note: form.note.trim() || null,
    force: form.force,
  }
  try {
    if (form.id) await api.updateReservation(form.id, body)
    else await api.createReservation(body)
    form.open = false
    if (form.date !== day.value) day.value = form.date
    else await load()
  } catch (e) {
    form.error = e.response?.data?.message || 'Kaydedilemedi.'
    // Çakışma: bir sonraki "Kaydet" onay sayılır
    form.clash = e.response?.data?.code === 'clash'
    form.force = form.clash
  } finally {
    form.busy = false
  }
}

async function remove() {
  if (!confirm(`${form.customerName} rezervasyonu silinsin mi? (Gelmediyse "Gelmedi" işaretlemek kayıt için daha iyidir.)`)) return
  form.busy = true
  try {
    await api.deleteReservation(form.id)
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
  try { tables.value = (await api.getTables()).data } catch { /* masa listesi yoksa "Fark etmez" */ }
})
</script>
