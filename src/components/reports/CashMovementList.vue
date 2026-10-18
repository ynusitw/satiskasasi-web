<template>
  <!-- Kasa hareketleri: kasadan girilen satış dışı para girişi / çıkışı ve
       cari tahsilatları. zReportId verilmezse açık dönem (X). -->
  <div>
    <div v-if="loading" class="text-sm text-muted py-4">Yükleniyor...</div>
    <div v-else-if="error" class="text-sm text-danger py-2">{{ error }}</div>
    <div v-else-if="!items.length" class="text-sm text-muted py-4">{{ emptyText }}</div>
    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left  px-4 py-2.5 text-[11px] font-semibold text-muted uppercase">Saat</th>
            <th class="text-left  px-4 py-2.5 text-[11px] font-semibold text-muted uppercase">Tür</th>
            <th class="text-left  px-4 py-2.5 text-[11px] font-semibold text-muted uppercase">Açıklama</th>
            <th class="text-left  px-4 py-2.5 text-[11px] font-semibold text-muted uppercase">Kasiyer</th>
            <th class="text-right px-4 py-2.5 text-[11px] font-semibold text-muted uppercase">Tutar</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in items" :key="m.id" class="border-t border-gray-50"
              :class="m.cancelledAt ? 'opacity-50' : ''">
            <td class="px-4 py-2.5 text-muted whitespace-nowrap">{{ time(m.createdAt) }}</td>
            <td class="px-4 py-2.5 whitespace-nowrap">
              <span class="font-semibold text-primary">{{ kindLabel(m) }}</span>
              <span v-if="m.cancelledAt" class="ml-2 px-1.5 py-0.5 rounded bg-red-50 text-danger text-[11px] font-semibold">İptal</span>
            </td>
            <td class="px-4 py-2.5">
              <div class="text-primary">{{ title(m) }}</div>
              <div v-if="detail(m)" class="text-xs text-muted">{{ detail(m) }}</div>
            </td>
            <td class="px-4 py-2.5 text-muted">
              {{ m.userName }}<span v-if="m.approvedBy && m.approvedBy !== m.userName" class="text-xs"> · onay: {{ m.approvedBy }}</span>
            </td>
            <td class="px-4 py-2.5 text-right font-semibold whitespace-nowrap"
                :class="m.cancelledAt ? 'text-muted line-through' : m.kind === 'Out' ? 'text-danger' : 'text-green-600'">
              {{ m.kind === 'Out' ? '−' : '+' }}{{ fmt(m.amount) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import api from '../../api/api'

const props = defineProps({
  zReportId: { type: Number, default: null },
  emptyText: { type: String, default: 'Bu dönemde kasa hareketi yok.' },
})
const emit = defineEmits(['loaded'])

const items   = ref([])
const loading = ref(true)
const error   = ref('')

function fmt(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}
function time(d) {
  return new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
function kindLabel(m) {
  return m.kind === 'In' ? 'Para girişi' : m.kind === 'CariCollection' ? 'Cari tahsilat' : 'Para çıkışı'
}
function title(m) {
  return m.kind === 'CariCollection' ? (m.cariName || 'Cari') : (m.category || kindLabel(m))
}
function detail(m) {
  if (m.kind === 'CariCollection')
    return (m.method === 'Nakit' ? 'Nakit' : 'Kredi kartı') + (m.description ? ' · ' + m.description : '')
  return m.description || ''
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    items.value = (await api.getCashMovements(props.zReportId)).data || []
    emit('loaded', items.value)
  } catch (e) {
    // Eski sunucu sürümünde uç yok: bölüm sessizce boş kalır
    items.value = []
    if (e?.response?.status !== 404) error.value = e?.response?.data?.message || 'Kasa hareketleri alınamadı.'
  } finally {
    loading.value = false
  }
}

watch(() => props.zReportId, load, { immediate: true })
defineExpose({ load })
</script>
