<template>
  <!-- Süper yönetici: işletmelerin satış verisi sıfırlama talepleri -->
  <div class="p-8 max-w-6xl">
    <div class="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 class="page-title">Sıfırlama Talepleri</h1>
        <p class="page-subtitle">
          Onay verince işletmenin satış, rapor, stok/cari hareketi ve fatura kayıtları silinir; stoklar ve cari bakiyeleri sıfırlanır.
          Silinenler önce sunucuda dosyaya alınır (30 gün).
        </p>
      </div>
      <button class="btn-secondary flex-shrink-0" @click="load">Yenile</button>
    </div>

    <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>

    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-sm text-muted">Yükleniyor...</div>
      <div v-else-if="!list.length" class="p-8 text-center text-sm text-muted">Talep yok.</div>
      <div v-for="r in list" :key="r.id" class="px-5 py-4 border-t border-gray-50 first:border-t-0">
        <div class="flex flex-wrap items-start gap-x-4 gap-y-2">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-primary">{{ r.tenantName }}</span>
              <span :class="STATUS[r.status][1]">{{ STATUS[r.status][0] }}</span>
            </div>
            <div class="text-xs text-muted mt-0.5">#{{ r.id }} · {{ r.requestedBy }} · {{ fmt(r.createdAt) }}</div>
            <div class="text-sm text-primary mt-2">“{{ r.reason }}”</div>
            <div v-if="r.decidedAt" class="text-xs text-muted mt-1.5">
              {{ r.decidedBy }} · {{ fmt(r.decidedAt) }}
              <template v-if="r.rejectReason"> · {{ r.rejectReason }}</template>
            </div>
            <div v-if="r.summary" class="text-xs text-muted mt-1">Silinen: {{ r.summary }}</div>
            <div v-if="r.error" class="text-xs text-danger mt-1">Hata: {{ r.error }}</div>
          </div>
          <div v-if="r.status === 'Pending'" class="flex gap-2 flex-shrink-0">
            <button class="btn-secondary btn-sm" :disabled="busy" @click="reject(r)">Reddet</button>
            <button class="btn-danger btn-sm" :disabled="busy" @click="approve(r)">Onayla ve sıfırla</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { uiPrompt } from '../utils/dialog'
import { ref, onMounted } from 'vue'
import api from '../api/api'

const list = ref([])
const loading = ref(true)
const busy = ref(false)
const error = ref('')

const STATUS = {
  Pending:   ['Onay bekliyor', 'chip-accent'],
  Completed: ['Sıfırlandı', 'chip-success'],
  Rejected:  ['Reddedildi', 'chip-neutral'],
  Cancelled: ['İşletme vazgeçti', 'chip-neutral'],
  Failed:    ['Başarısız', 'chip-danger'],
}
const fmt = v => new Date(v).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

async function load() {
  error.value = ''
  try {
    list.value = (await api.getAllDataResets()).data
  } catch (e) {
    error.value = e.response?.data?.message || 'Talepler alınamadı.'
  } finally {
    loading.value = false
  }
}

async function approve(r) {
  const typed = await uiPrompt(
    `${r.tenantName} işletmesinin satış verileri silinecek; ürün/hammadde stokları ve cari bakiyeleri sıfırlanacak. Bu işlem geri alınamaz.`,
    '', { title: 'Sıfırlamayı onayla', requireText: r.tenantName, placeholder: r.tenantName, confirmText: 'Onayla ve sıfırla', danger: true })
  if (typed == null) return
  if (typed.trim().toLocaleLowerCase('tr-TR') !== r.tenantName.trim().toLocaleLowerCase('tr-TR')) {
    error.value = 'İşletme adı eşleşmedi; işlem yapılmadı.'
    return
  }
  busy.value = true
  error.value = ''
  try {
    await api.approveDataReset(r.id)
  } catch (e) {
    error.value = e.response?.data?.message || 'Sıfırlama yapılamadı.'
  } finally {
    busy.value = false
    await load()
  }
}

async function reject(r) {
  const reason = await uiPrompt('Gerekçe işletmeye bildirim olarak gösterilir.', '',
    { title: `${r.tenantName} — talebi reddet`, placeholder: 'ör. Önce Z raporu alın', multiline: true, confirmText: 'Reddet', danger: true })
  if (reason == null) return
  busy.value = true
  try {
    await api.rejectDataReset(r.id, reason)
  } catch (e) {
    error.value = e.response?.data?.message || 'Reddedilemedi.'
  } finally {
    busy.value = false
    await load()
  }
}

onMounted(load)
</script>
