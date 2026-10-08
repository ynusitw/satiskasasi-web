<template>
  <!-- Süper yönetici: sunucu belleği, disk, veritabanı ve günlük yedek -->
  <div class="bg-white rounded-2xl shadow-sm p-5 mb-6">
    <div class="flex items-center justify-between gap-3 mb-4">
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full" :class="dot"></span>
        <h2 class="section-title">Sunucu durumu</h2>
      </div>
      <button class="btn-ghost btn-sm" :disabled="loading" @click="load">Yenile</button>
    </div>

    <div v-if="error" class="text-sm text-danger">{{ error }}</div>

    <template v-else-if="s">
      <div v-if="s.problems.length" class="mb-4 p-3 rounded-xl bg-red-50 text-sm text-red-700 space-y-1">
        <div v-for="p in s.problems" :key="p">{{ p }}</div>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Meter label="Bellek" :used="used(s.memTotalMb, s.memAvailableMb)" :total="s.memTotalMb"
               :note="`API ${s.processMb} MB`"/>
        <Meter label="Takas (swap)" :used="used(s.swapTotalMb, s.swapFreeMb)" :total="s.swapTotalMb"
               :note="s.swapTotalMb ? '' : 'Takas alanı yok'"/>
        <Meter label="Disk" :used="used(s.diskTotalMb, s.diskFreeMb)" :total="s.diskTotalMb"
               :note="s.dbSizeMb != null ? `Veritabanı ${mb(s.dbSizeMb)}` : ''"/>

        <div class="rounded-xl border border-gray-100 p-3.5">
          <div class="field-label">Son yedek</div>
          <template v-if="!s.backup.configured">
            <div class="text-sm font-semibold text-warning mt-1">Kurulmamış</div>
            <div class="text-xs text-muted mt-0.5">Sunucuda yedek betiği çalışmıyor</div>
          </template>
          <template v-else-if="s.backup.lastAt">
            <div class="text-sm font-semibold mt-1" :class="s.backup.stale ? 'text-danger' : 'text-primary'">
              {{ fmt(s.backup.lastAt) }}
            </div>
            <div class="text-xs text-muted mt-0.5">
              {{ mb(s.backup.lastSize / 1048576) }} · {{ s.backup.count }} yedek ·
              <span :class="s.backup.uploadOk ? 'text-success' : 'text-danger'">
                {{ s.backup.uploadStatus ? (s.backup.uploadOk ? 'buluta yüklendi' : 'yüklenemedi') : 'yalnız sunucuda' }}
              </span>
            </div>
          </template>
          <div v-else class="text-sm font-semibold text-danger mt-1">Hiç yedek yok</div>
        </div>
      </div>

      <div class="text-xs text-muted mt-3">API {{ fmt(s.startedAt) }} tarihinden beri çalışıyor.</div>
    </template>
    <div v-else class="text-sm text-muted">Yükleniyor...</div>
  </div>
</template>

<script setup>
import { ref, computed, h, onMounted } from 'vue'
import api from '../api/api'

const s = ref(null)
const loading = ref(false)
const error = ref('')

const used = (total, free) => (total != null && free != null ? total - free : null)
const mb = v => (v == null ? '—' : v >= 1024 ? `${(v / 1024).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} GB` : `${Math.round(v)} MB`)
const fmt = v => new Date(v).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const dot = computed(() => !s.value ? 'bg-gray-300' : s.value.problems.length ? 'bg-red-500'
  : !s.value.backup.configured ? 'bg-amber-500' : 'bg-green-500')

// Doluluk çubuğu: %75 üstü sarı, %90 üstü kırmızı
const Meter = (props) => {
  const pct = props.total ? Math.round((props.used ?? 0) * 100 / props.total) : null
  const bar = pct == null ? '' : pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-green-500'
  return h('div', { class: 'rounded-xl border border-gray-100 p-3.5' }, [
    h('div', { class: 'field-label' }, props.label),
    h('div', { class: 'text-sm font-semibold text-primary mt-1' },
      pct == null ? '—' : `${mb(props.used)} / ${mb(props.total)}`),
    h('div', { class: 'h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2' },
      pct == null ? [] : [h('div', { class: `h-full rounded-full ${bar}`, style: { width: pct + '%' } })]),
    props.note ? h('div', { class: 'text-xs text-muted mt-1.5' }, props.note) : null,
  ])
}
Meter.props = ['label', 'used', 'total', 'note']

async function load() {
  loading.value = true
  error.value = ''
  try {
    s.value = (await api.getSystemStatus()).data
  } catch (e) {
    error.value = e.response?.status === 404
      ? 'Sunucu durumu için API güncellemesi gerekiyor.'
      : 'Sunucu durumu alınamadı.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
