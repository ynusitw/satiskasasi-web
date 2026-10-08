<template>
  <!-- Destek talebi yazışması: müşteri (ayarlar) ve destek ekibi (süper yönetici) ortak kullanır. -->
  <div class="flex flex-col h-full min-h-0">
    <div v-if="loading" class="text-sm text-muted p-4">Yükleniyor...</div>
    <template v-else-if="ticket">
      <div class="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
        <div class="min-w-0">
          <div class="text-sm font-semibold text-primary truncate">#{{ ticket.id }} · {{ ticket.subject }}</div>
          <div class="text-xs text-muted mt-0.5">
            <template v-if="isSupport">{{ ticket.tenantName }} · </template>{{ ticket.createdBy }} ·
            {{ fmtDate(ticket.createdAt) }}
          </div>
        </div>
        <span :class="statusChip(ticket.status)" class="flex-shrink-0">{{ statusLabel(ticket.status) }}</span>
      </div>

      <div ref="scroller" class="flex-1 min-h-0 overflow-y-auto py-4 space-y-3">
        <div v-for="m in messages" :key="m.id" class="flex" :class="mine(m) ? 'justify-end' : 'justify-start'">
          <div class="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13.5px]"
               :class="mine(m) ? 'bg-accent text-white rounded-br-md' : 'bg-gray-100 text-primary rounded-bl-md'">
            <div class="whitespace-pre-wrap break-words">{{ m.body }}</div>
            <div class="text-[11px] mt-1" :class="mine(m) ? 'text-white/70' : 'text-muted'">
              {{ m.fromSupport ? 'Destek' : m.author }} · {{ fmtDate(m.createdAt) }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="ticket.status !== 'Closed'" class="pt-3 border-t border-gray-100">
        <textarea v-model="reply" rows="3" :placeholder="isSupport ? 'Yanıtınız...' : 'Mesajınız...'"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] bg-white resize-none"></textarea>
        <div class="flex items-center justify-between gap-2 mt-2">
          <button class="btn-ghost btn-sm" :disabled="busy" @click="close">Talebi kapat</button>
          <button class="btn-primary btn-sm" :disabled="busy || !reply.trim()" @click="send">Gönder</button>
        </div>
      </div>
      <div v-else class="pt-3 border-t border-gray-100 text-xs text-muted">
        Bu talep kapatıldı.<template v-if="!isSupport"> Yeni bir konu için yeni talep açabilirsiniz.</template>
      </div>
      <div v-if="error" class="text-xs text-danger mt-2">{{ error }}</div>
    </template>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import api from '../api/api'

const props = defineProps({
  ticketId:  { type: Number, required: true },
  isSupport: { type: Boolean, default: false },
})
const emit = defineEmits(['changed'])

const ticket = ref(null)
const messages = ref([])
const loading = ref(false)
const busy = ref(false)
const reply = ref('')
const error = ref('')
const scroller = ref(null)

const mine = m => m.fromSupport === props.isSupport

async function load() {
  // Yanıt sonrası tazelemede yazışma ekrandan kaybolup yanıp sönmesin
  loading.value = ticket.value?.id !== props.ticketId
  error.value = ''
  try {
    const { data } = await api.getSupportTicket(props.ticketId)
    ticket.value = data.ticket
    messages.value = data.messages
    // Kaydırma alanı yükleme bitince çizilir; ondan sonra en alta in
    loading.value = false
    await nextTick()
    if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
  } catch (e) {
    error.value = e.response?.data?.message || 'Talep açılamadı.'
  } finally {
    loading.value = false
  }
}

async function send() {
  busy.value = true
  error.value = ''
  try {
    await api.replySupport(props.ticketId, { message: reply.value.trim() })
    reply.value = ''
    await load()
    emit('changed')
  } catch (e) {
    error.value = e.response?.data?.message || 'Gönderilemedi.'
  } finally {
    busy.value = false
  }
}

async function close() {
  if (!confirm('Talep kapatılsın mı?')) return
  busy.value = true
  try {
    await api.closeSupport(props.ticketId)
    await load()
    emit('changed')
  } catch (e) {
    error.value = e.response?.data?.message || 'Kapatılamadı.'
  } finally {
    busy.value = false
  }
}

const STATUS = { Open: ['Yanıt bekliyor', 'chip-accent'], Answered: ['Yanıtlandı', 'chip-success'], Closed: ['Kapalı', 'chip-neutral'] }
const statusLabel = s => STATUS[s]?.[0] ?? s
const statusChip = s => STATUS[s]?.[1] ?? 'chip-neutral'
const fmtDate = v => new Date(v).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

watch(() => props.ticketId, load, { immediate: true })
</script>
