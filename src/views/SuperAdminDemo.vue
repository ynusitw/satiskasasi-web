<template>
  <div class="p-8 max-w-6xl">
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="page-title">Demo Talepleri</h1>
        <p class="page-subtitle">yenpos.com tanıtım sitesindeki formdan gelen talepler</p>
      </div>
      <div class="flex rounded-xl overflow-hidden border border-gray-200 bg-white">
        <button v-for="f in filters" :key="f.value" type="button" @click="filter = f.value"
                class="px-4 h-10 text-[13px] font-semibold transition-colors"
                :class="filter === f.value ? 'bg-accent text-white' : 'text-muted hover:text-primary hover:bg-gray-50'">
          {{ f.label }}<span v-if="countOf(f.value)" class="ml-1 opacity-80">({{ countOf(f.value) }})</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="bg-white rounded-2xl shadow-sm py-12 text-center text-muted">Yükleniyor...</div>
    <div v-else-if="error" class="p-4 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>
    <div v-else-if="!shown.length" class="bg-white rounded-2xl shadow-sm py-12 text-center text-muted">Talep yok.</div>

    <div v-else class="space-y-3">
      <div v-for="r in shown" :key="r.id" class="bg-white rounded-2xl shadow-sm p-5">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-semibold text-[15px] text-primary">{{ r.name }}</span>
              <span class="text-[11px] font-bold px-2 py-0.5 rounded-full" :class="statusClass(r.status)">{{ statusLabel(r.status) }}</span>
            </div>
            <div class="text-sm text-muted mt-1">
              {{ [r.businessName, r.businessType, r.city].filter(Boolean).join(' · ') || 'İşletme bilgisi yok' }}
            </div>
            <div v-if="r.message" class="text-sm text-primary mt-2 whitespace-pre-line">{{ r.message }}</div>
            <div class="text-xs text-muted mt-2">
              {{ dateTime(r.createdAt) }}
              <template v-if="r.handledBy"> · {{ statusLabel(r.status) }}: {{ r.handledBy }} ({{ dateTime(r.handledAt) }})</template>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <a :href="`tel:${r.phone}`" class="chip-accent">{{ formatPhone(r.phone) }}</a>
            <a :href="whatsapp(r.phone)" target="_blank" rel="noopener" class="chip-success">WhatsApp</a>
            <a v-if="r.email" :href="`mailto:${r.email}`" class="chip-neutral">{{ r.email }}</a>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
          <input v-model="r._note" placeholder="Not (ör. salı 14:00 kurulum)"
                 class="flex-1 min-w-[200px] px-3 border border-gray-200 rounded-lg text-[13.5px] h-9 bg-white"/>
          <button v-for="s in statuses" :key="s.value" type="button" :disabled="r._saving"
                  @click="setStatus(r, s.value)"
                  class="px-3 h-9 rounded-lg text-[12.5px] font-semibold border transition-colors disabled:opacity-50"
                  :class="r.status === s.value ? 'bg-accent text-white border-accent' : 'bg-white text-muted border-gray-200 hover:text-primary'">
            {{ s.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '../api/api'
import { uiAlert } from '../utils/dialog'

const statuses = [
  { value: 'New', label: 'Yeni' },
  { value: 'Contacted', label: 'Arandı' },
  { value: 'Closed', label: 'Kapandı' },
]
const filters = [{ value: 'all', label: 'Tümü' }, ...statuses]

const items = ref([])
const loading = ref(true)
const error = ref('')
const filter = ref('New')

const shown = computed(() => filter.value === 'all' ? items.value : items.value.filter(r => r.status === filter.value))
const countOf = v => v === 'all' ? 0 : items.value.filter(r => r.status === v).length

const statusLabel = s => statuses.find(x => x.value === s)?.label ?? s
const statusClass = s => s === 'New' ? 'bg-amber-100 text-amber-700' : s === 'Contacted' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
const dateTime = d => d ? new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
const formatPhone = p => (p || '').replace(/^(\d{4})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4')
const whatsapp = p => `https://wa.me/9${(p || '').replace(/\D/g, '')}`

async function load() {
  loading.value = true
  error.value = ''
  try {
    items.value = ((await api.getDemoRequests()).data || []).map(r => ({ ...r, _note: r.note || '', _saving: false }))
  } catch (e) {
    error.value = e?.response?.status === 404
      ? 'Sunucu henüz güncellenmemiş; bu sayfa API yayınlandıktan sonra çalışır.'
      : (e?.response?.data?.message || 'Talepler alınamadı.')
  } finally {
    loading.value = false
  }
}

async function setStatus(r, status) {
  r._saving = true
  try {
    const { data } = await api.updateDemoRequest(r.id, { status, note: r._note || null })
    Object.assign(r, data, { _note: data.note || '' })
  } catch (e) {
    await uiAlert(e?.response?.data?.message || 'Güncellenemedi.')
  } finally {
    r._saving = false
  }
}

onMounted(load)
</script>
