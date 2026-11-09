<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-6xl">
    <div class="flex flex-wrap items-end gap-3 mb-5">
      <div class="flex-1 min-w-60">
        <h1 class="page-title">Müşteri adayları</h1>
        <p class="page-subtitle">WhatsApp'tan gelen yanıtları buradan işaretleyin; RET yazanlara bir daha mesaj gitmez.</p>
      </div>
      <button class="btn-secondary" :disabled="!filtered.length" @click="downloadCsv">CSV indir ({{ filtered.length }})</button>
    </div>

    <div v-if="crm.error" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ crm.error }}</div>
    <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>
    <div v-if="!crm.loaded" class="py-16 text-center text-sm text-muted">Yükleniyor...</div>

    <template v-else>
      <div class="flex gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar" role="tablist" aria-label="Duruma göre filtre">
        <button v-for="s in ['hepsi', ...STATUSES]" :key="s" role="tab" :aria-selected="status === s"
                :class="status === s ? 'chip-accent' : 'chip-neutral'" class="flex-shrink-0"
                @click="status = s; shown = 50">
          {{ s === 'hepsi' ? 'Hepsi' : STATUS_LABEL[s] }} <span class="opacity-70 ml-1">{{ statusCounts[s] ?? 0 }}</span>
        </button>
      </div>
      <div class="flex flex-wrap gap-3 mb-4">
        <label class="flex-1 min-w-60">
          <span class="sr-only">Ara</span>
          <input v-model="search" class="crm-field" placeholder="İsim, semt veya telefon ara…"/>
        </label>
        <label class="flex items-center gap-2 text-sm text-muted">
          Telefon
          <select v-model="phoneFilter" class="crm-field w-auto">
            <option value="hepsi">Hepsi</option>
            <option value="mobile">Cep (WhatsApp)</option>
            <option value="landline">Sabit hat</option>
            <option value="yok">Telefonsuz</option>
          </select>
        </label>
      </div>

      <div v-if="selected.size" class="flex flex-wrap items-center gap-3 mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm" role="status">
        <span class="text-red-700 font-semibold">{{ selected.size }} işletme seçildi</span>
        <button class="btn-danger-solid btn-sm" :disabled="!!deleting" @click="removeSelected">
          {{ deleting ? `Siliniyor… ${deleting}` : 'Seçilenleri sil' }}
        </button>
        <button class="btn-ghost btn-sm" :disabled="!!deleting" @click="selected = new Set()">Seçimi kaldır</button>
      </div>

      <div v-if="!crm.leads.length" class="crm-card p-8 text-center text-sm text-muted">
        Henüz işletme yok. "İşletme bul" sayfasından ekleyin.
      </div>
      <div v-else class="crm-card overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-left">
            <tr>
              <th class="pl-4 py-2.5 w-8">
                <input type="checkbox" class="crm-check" :checked="allShownSelected" :indeterminate.prop="someShownSelected"
                       aria-label="Görünen tüm işletmeleri seç" @change="toggleAllShown($event.target.checked)"/>
              </th>
              <th class="px-4 py-2.5 text-[11px] font-semibold text-muted uppercase">İşletme</th>
              <th class="px-4 py-2.5 text-[11px] font-semibold text-muted uppercase">Telefon</th>
              <th class="px-4 py-2.5 text-[11px] font-semibold text-muted uppercase">Durum</th>
              <th class="px-4 py-2.5 text-[11px] font-semibold text-muted uppercase whitespace-nowrap">Son temas</th>
              <th class="px-4 py-2.5"><span class="sr-only">İşlemler</span></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="l in filtered.slice(0, shown)" :key="l.id">
              <tr class="border-t border-gray-50 align-top" :class="selected.has(l.id) ? 'bg-red-50/60' : ''">
                <td class="pl-4 py-3">
                  <input type="checkbox" class="crm-check mt-0.5" :checked="selected.has(l.id)"
                         :aria-label="`${l.name} seç`" @change="toggle(l.id, $event.target.checked)"/>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-start gap-1.5">
                    <p class="font-semibold text-primary">{{ l.name }}</p>
                    <a class="web-search -my-1.5 flex-shrink-0" :href="webSearchUrl(l)" target="_blank" rel="noopener"
                       :title="`${l.name} internette ara`" :aria-label="`${l.name} internette ara`">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"
                           stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>
                    </a>
                  </div>
                  <p class="text-muted">{{ l.category }} · {{ SEGMENT_LABEL[l.segment] }}</p>
                  <p class="text-muted text-xs mt-0.5">{{ addressOf(l) || 'Adres bilinmiyor' }}</p>
                </td>
                <td class="px-4 py-3 font-mono whitespace-nowrap">
                  {{ formatPhone(l.phone) }}
                  <span v-if="l.phoneType" class="block text-xs text-muted font-sans">
                    {{ l.phoneType === 'mobile' ? 'cep' : l.phoneType === 'landline' ? 'sabit' : 'diğer' }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <label class="sr-only" :for="`st-${l.id}`">Durum</label>
                  <select :id="`st-${l.id}`" class="crm-field w-auto h-9" :value="l.status"
                          @change="act(() => crmActions.setStatus(l.id, $event.target.value))">
                    <option v-for="s in STATUSES" :key="s" :value="s">{{ STATUS_LABEL[s] }}</option>
                  </select>
                </td>
                <td class="px-4 py-3 text-muted whitespace-nowrap">{{ lastContact(l) }}</td>
                <td class="px-4 py-3">
                  <div class="flex gap-2 justify-end">
                    <a v-if="l.phone && l.phoneType === 'mobile'" class="btn-secondary btn-sm"
                       :href="whatsappUrl(l.phone, '', crm.settings.openWith)" target="_blank" rel="noopener">Sohbet</a>
                    <a v-if="l.phone" class="btn-secondary btn-sm" :href="`tel:${l.phone}`">Ara</a>
                    <a class="btn-secondary btn-sm" :href="mapUrl(l)" target="_blank" rel="noopener">Harita</a>
                    <button class="btn-ghost btn-sm" :aria-expanded="open === l.id" @click="open = open === l.id ? null : l.id">
                      {{ open === l.id ? 'Kapat' : 'Detay' }}
                    </button>
                    <button class="btn-ghost btn-sm text-red-600" :aria-label="`${l.name} sil`" @click="remove(l)">Sil</button>
                  </div>
                </td>
              </tr>
              <tr v-if="open === l.id" class="bg-gray-50/60">
                <td colspan="6" class="px-4 py-4">
                  <div class="grid md:grid-cols-2 gap-4">
                    <label class="crm-label">
                      <span>Notlar</span>
                      <textarea class="crm-area min-h-24" :value="l.notes" placeholder="Görüşme notu, demo tarihi…"
                                @blur="saveNotes(l, $event.target.value)"></textarea>
                    </label>
                    <div class="text-sm flex flex-col gap-1">
                      <span class="text-muted text-[13px]">Geçmiş</span>
                      <ul class="flex flex-col gap-1 max-h-40 overflow-y-auto">
                        <li v-for="(h, i) in [...l.history].reverse()" :key="i" class="text-primary">
                          <span class="font-mono text-muted">{{ when(h.at) }}</span> {{ historyText(h) }}
                        </li>
                      </ul>
                      <a v-if="l.website" class="text-accent underline" :href="l.website" target="_blank" rel="noopener">Web sitesi</a>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-if="!filtered.length"><td colspan="6" class="text-center py-10 text-muted">Bu filtrede kayıt yok</td></tr>
          </tbody>
        </table>
        <div v-if="shown < filtered.length" class="p-3 text-center border-t border-gray-100">
          <button class="btn-secondary" @click="shown += 50">Daha fazla göster ({{ filtered.length - shown }})</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { uiConfirm } from '../../utils/dialog'
import { crm, loadCrm, crmActions } from '../../crm/store'
import { STATUSES, STATUS_LABEL, SEGMENT_LABEL, addressOf, mapUrl, webSearchUrl, formatPhone, whatsappUrl } from '../../crm/logic'
import '../../crm/crm.css'

const status = ref('hepsi')
const phoneFilter = ref('hepsi')
const search = ref('')
const shown = ref(50)
const open = ref(null)
const error = ref('')
const selected = ref(new Set())
const deleting = ref('')

// Arama aksan ve büyük/küçük harf duyarsız
const norm = s => String(s ?? '').toLocaleLowerCase('tr').normalize('NFD').replace(/\p{M}/gu, '')

const statusCounts = computed(() => {
  const c = { hepsi: crm.leads.length }
  for (const l of crm.leads) c[l.status] = (c[l.status] ?? 0) + 1
  return c
})

const filtered = computed(() => {
  const q = norm(search.value.trim())
  return crm.leads
    .filter(l => status.value === 'hepsi' || l.status === status.value)
    .filter(l => phoneFilter.value === 'hepsi' || (phoneFilter.value === 'yok' ? !l.phone : l.phoneType === phoneFilter.value))
    .filter(l => !q || norm(`${l.name} ${l.category} ${l.district} ${l.neighborhood} ${l.address} ${l.phone ?? ''}`).includes(q))
    .sort((a, b) => String(b.lastContactAt ?? b.createdAt).localeCompare(String(a.lastContactAt ?? a.createdAt)))
})

const lastContact = l => l.lastContactAt
  ? new Date(l.lastContactAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '—'
const when = v => new Date(v).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
function historyText(h) {
  switch (h.type) {
    case 'durum': return `Durum: ${STATUS_LABEL[h.text] ?? h.text}`
    case 'mesaj': return 'İlk mesaj gönderildi'
    case 'takip': return 'Takip mesajı gönderildi'
    case 'atlandi': return 'Ertelendi'
    default: return `Eklendi (${h.text ?? ''})`
  }
}

async function act(fn) {
  error.value = ''
  try { await fn() } catch (e) { error.value = e.response?.data?.message || 'Kaydedilemedi.' }
}
function saveNotes(l, value) {
  if (value === l.notes) return
  act(() => crmActions.setNotes(l.id, value))
}
async function remove(l) {
  if (!await uiConfirm(`${l.name} listeden silinsin mi? Bu işlem geri alınamaz.`)) return
  await act(() => crmActions.remove(l.id))
  if (open.value === l.id) open.value = null
  if (selected.value.has(l.id)) toggle(l.id, false)
}

// Toplu silme: kutucukla seçilenler (filtre değişse de seçim kalır)
const shownLeads = computed(() => filtered.value.slice(0, shown.value))
const allShownSelected = computed(() => shownLeads.value.length > 0 && shownLeads.value.every(l => selected.value.has(l.id)))
const someShownSelected = computed(() => !allShownSelected.value && shownLeads.value.some(l => selected.value.has(l.id)))
function toggle(id, on) {
  const next = new Set(selected.value)
  on ? next.add(id) : next.delete(id)
  selected.value = next
}
function toggleAllShown(on) {
  const next = new Set(selected.value)
  for (const l of shownLeads.value) on ? next.add(l.id) : next.delete(l.id)
  selected.value = next
}
async function removeSelected() {
  const ids = [...selected.value].filter(id => crm.leads.some(l => l.id === id))
  if (!ids.length) { selected.value = new Set(); return }
  if (!await uiConfirm(`${ids.length} işletme listeden silinsin mi? Bu işlem geri alınamaz.`)) return
  error.value = ''
  let done = 0, failed = 0
  // Sunucuyu boğmamak için beşerli gruplar halinde
  for (let i = 0; i < ids.length; i += 5) {
    await Promise.all(ids.slice(i, i + 5).map(async id => {
      try { await crmActions.remove(id) } catch { failed++ }
      done++
      deleting.value = `${done}/${ids.length}`
    }))
  }
  deleting.value = ''
  selected.value = new Set([...selected.value].filter(id => crm.leads.some(l => l.id === id)))
  if (open.value && !crm.leads.some(l => l.id === open.value)) open.value = null
  if (failed) error.value = `${failed} işletme silinemedi. Tekrar deneyin.`
}

function downloadCsv() {
  const cols = ['name', 'category', 'phone', 'phoneType', 'status', 'district', 'neighborhood', 'address', 'lastContactAt', 'notes']
  const q = v => `"${String(v ?? '').replaceAll('"', '""')}"`
  const csv = '﻿' + [[...cols, 'harita'].join(','), ...filtered.value.map(l => [...cols.map(c => q(l[c])), q(mapUrl(l))].join(','))].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = 'yenpos-musteri-adaylari.csv'
  a.click()
  URL.revokeObjectURL(a.href)
}

onMounted(() => loadCrm(true))
</script>

<style scoped>
.crm-check { width: 18px; height: 18px; accent-color: #DC2626; cursor: pointer; }
/* Ada yanında küçük büyüteç; dokunma alanı 32 px */
.web-search {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 8px; color: #64748B;
}
.web-search:hover { background: #F1F5F9; color: #2563EB; }
.web-search:focus-visible { outline: 2px solid #2563EB; outline-offset: 1px; }
:global(.theme-dark) .web-search { color: #94A3B8; }
:global(.theme-dark) .web-search:hover { background: #1A2440; color: #93C5FD; }
.no-scrollbar { scrollbar-width: none; }
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>
