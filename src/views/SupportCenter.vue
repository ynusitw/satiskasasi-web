<template>
  <!-- Süper yönetici: müşterilerin destek talepleri -->
  <div class="p-8 max-w-7xl">
    <div class="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 class="page-title">Destek Talepleri</h1>
        <p class="page-subtitle">Müşterilerin panelden açtığı talepler. Yanıtınız müşteriye bildirim olarak düşer.</p>
      </div>
      <button class="btn-secondary flex-shrink-0" @click="load">Yenile</button>
    </div>

    <div class="flex gap-1.5 mb-4">
      <button v-for="f in FILTERS" :key="f.key" :class="filter === f.key ? 'chip-accent' : 'chip-neutral'"
              @click="filter = f.key">{{ f.label }} ({{ count(f.key) }})</button>
    </div>

    <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>

    <div class="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
      <div class="bg-white rounded-2xl shadow-sm overflow-hidden max-h-[70vh] overflow-y-auto">
        <div v-if="loading" class="p-6 text-sm text-muted">Yükleniyor...</div>
        <div v-else-if="!shown.length" class="p-6 text-sm text-muted text-center">Talep yok.</div>
        <button v-for="t in shown" :key="t.id" @click="selected = t.id"
                class="w-full text-left px-4 py-3 border-b border-gray-50 transition-colors"
                :class="selected === t.id ? 'bg-blue-50/60' : 'hover:bg-gray-50'">
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-semibold text-primary truncate">{{ t.subject }}</span>
            <span :class="chip(t.status)" class="flex-shrink-0">{{ label(t.status) }}</span>
          </div>
          <div class="text-xs text-muted mt-0.5 truncate">#{{ t.id }} · {{ t.tenantName }} · {{ t.createdBy }}</div>
          <div v-if="t.lastMessage" class="text-xs text-muted mt-1 truncate">
            {{ t.lastMessage.fromSupport ? 'Siz: ' : '' }}{{ t.lastMessage.body }}
          </div>
        </button>
      </div>

      <div class="bg-white rounded-2xl shadow-sm p-5 h-[70vh] flex flex-col">
        <SupportThread v-if="selected" :ticket-id="selected" is-support @changed="load"/>
        <div v-else class="m-auto text-sm text-muted">Soldan bir talep seçin.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../api/api'
import SupportThread from '../components/SupportThread.vue'

const tickets = ref([])
const loading = ref(true)
const error = ref('')
const selected = ref(null)
const filter = ref('Open')

const FILTERS = [
  { key: 'Open', label: 'Yanıt bekleyen' },
  { key: 'Answered', label: 'Yanıtlanan' },
  { key: 'Closed', label: 'Kapalı' },
  { key: 'all', label: 'Tümü' },
]
const count = k => (k === 'all' ? tickets.value : tickets.value.filter(t => t.status === k)).length
const shown = computed(() => filter.value === 'all' ? tickets.value : tickets.value.filter(t => t.status === filter.value))

const STATUS = { Open: ['Yanıt bekliyor', 'chip-accent'], Answered: ['Yanıtlandı', 'chip-success'], Closed: ['Kapalı', 'chip-neutral'] }
const label = s => STATUS[s]?.[0] ?? s
const chip = s => STATUS[s]?.[1] ?? 'chip-neutral'

async function load() {
  error.value = ''
  try {
    tickets.value = (await api.getSupportTickets()).data
  } catch (e) {
    error.value = e.response?.data?.message || 'Talepler alınamadı.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
