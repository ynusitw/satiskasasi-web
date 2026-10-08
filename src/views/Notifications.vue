<template>
  <div class="p-6 lg:p-8 max-w-4xl">
    <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="page-title">Bildirimler</h1>
        <p class="page-subtitle">Z raporları, kasa farkları, kritik stok ve güvenlik uyarıları</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="load" :disabled="loading" class="btn-secondary">Yenile</button>
        <button @click="readAll" :disabled="!store.unread" class="btn-secondary">Tümünü okundu say</button>
      </div>
    </div>

    <!-- Süzgeç -->
    <div class="flex flex-wrap gap-1.5 mb-4">
      <button v-for="f in filters" :key="f.key" @click="filter = f.key"
              class="h-8 px-3 rounded-md text-[12.5px] font-medium"
              :class="filter === f.key ? 'bg-primary text-white' : 'bg-white text-muted shadow-sm hover:text-primary'">
        {{ f.label }}
        <span v-if="f.key === 'unread' && store.unread" class="ml-1 opacity-80">({{ store.unread }})</span>
      </button>
    </div>

    <div v-if="error" class="mb-4 p-3 bg-red-50 text-danger rounded-xl text-sm">{{ error }}</div>

    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div v-if="loading && !items.length" class="py-16 text-center text-sm text-muted">Yükleniyor...</div>

      <div v-else-if="!filtered.length" class="py-16 text-center">
        <p class="text-[13.5px] font-medium text-primary">Bildirim yok</p>
        <p class="text-[12.5px] text-muted mt-1">Z raporu alındığında, kasa farkı ya da kritik stok oluştuğunda burada görünür.</p>
      </div>

      <ul v-else class="divide-y divide-gray-100">
        <li v-for="n in filtered" :key="n.id"
            class="px-5 py-4 flex gap-4"
            :class="n.isRead ? '' : 'bg-blue-50/40'">
          <span class="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
                :class="n.isRead ? 'bg-transparent' : 'bg-accent'"/>
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-[11px] font-semibold px-2 py-0.5 rounded-md" :class="typeOf(n).cls">
                {{ typeOf(n).label }}
              </span>
              <span class="text-[14px] font-semibold text-primary">{{ n.title }}</span>
            </div>
            <p class="text-[13px] text-gray-600 mt-1.5 whitespace-pre-line leading-relaxed">{{ n.message }}</p>
            <div class="flex flex-wrap items-center gap-3 mt-2 text-[12px] text-muted">
              <span>{{ fmtDate(n.createdAt) }}</span>
              <span v-if="n.emailStatus">· {{ emailLabel(n.emailStatus) }}</span>
            </div>
          </div>
          <button v-if="!n.isRead" @click="markRead(n)" class="chip-neutral self-start flex-shrink-0">
            Okundu
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../api/api'
import { useNotificationsStore } from '../stores/notifications'

const store = useNotificationsStore()
const items = ref([])
const loading = ref(false)
const error = ref('')
const filter = ref('all')

const filters = [
  { key: 'all',            label: 'Tümü' },
  { key: 'unread',         label: 'Okunmamış' },
  { key: 'ZReport',        label: 'Z raporu' },
  { key: 'CashDifference', label: 'Kasa farkı' },
  { key: 'LowStock',       label: 'Kritik stok' },
  { key: 'FailedLogin',    label: 'Güvenlik' },
]

const TYPES = {
  ZReport:        { label: 'Z raporu',    cls: 'bg-blue-50 text-accent' },
  CashDifference: { label: 'Kasa farkı',  cls: 'bg-red-50 text-danger' },
  LowStock:       { label: 'Kritik stok', cls: 'bg-amber-50 text-warning' },
  FailedLogin:    { label: 'Güvenlik',    cls: 'bg-gray-100 text-primary' },
  Support:        { label: 'Destek',      cls: 'bg-green-50 text-success' },
}
const typeOf = n => TYPES[n.type] ?? { label: n.type, cls: 'bg-gray-100 text-primary' }

const filtered = computed(() =>
  filter.value === 'all' ? items.value
    : filter.value === 'unread' ? items.value.filter(n => !n.isRead)
    : items.value.filter(n => n.type === filter.value))

function emailLabel(s) {
  return {
    Sent: 'E-posta gönderildi',
    Failed: 'E-posta gönderilemedi',
    NotConfigured: 'E-posta sunucusu yapılandırılmamış',
    NoAddress: 'E-posta adresi tanımlı değil',
  }[s] ?? s
}

function fmtDate(d) {
  return new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.getNotifications(100)
    items.value = data.items ?? []
    store.set(data.unread ?? 0)
  } catch (e) {
    error.value = e.response?.data?.message || 'Bildirimler alınamadı.'
  } finally {
    loading.value = false
  }
}

async function markRead(n) {
  try {
    await api.markNotificationRead(n.id)
    n.isRead = true
    store.set(store.unread - 1)
  } catch { /* liste yenilenince düzelir */ }
}

async function readAll() {
  try {
    await api.markAllNotificationsRead()
    items.value.forEach(n => (n.isRead = true))
    store.set(0)
  } catch (e) {
    error.value = e.response?.data?.message || 'İşaretlenemedi.'
  }
}

onMounted(load)
</script>
