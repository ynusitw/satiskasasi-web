<template>
  <!-- Rapor sayfalarının ortak tarih aralığı seçicisi: hazır aralıklar +
       elle başlangıç/bitiş. Tarihler "YYYY-MM-DD" metni olarak taşınır. -->
  <div class="flex flex-wrap items-end gap-2">
    <div class="flex rounded-xl overflow-hidden border border-gray-200">
      <button v-for="p in presets" :key="p.key" type="button" @click="applyPreset(p)"
              class="px-3 py-2 text-xs font-semibold transition-all"
              :class="activePreset === p.key
                ? 'bg-accent text-white'
                : 'bg-white text-muted hover:text-primary hover:bg-gray-50'">
        {{ p.label }}
      </button>
    </div>

    <label class="text-xs text-muted">
      Başlangıç
      <input :value="from" type="date" @input="onFrom"
             class="block mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm"/>
    </label>
    <label class="text-xs text-muted">
      Bitiş
      <input :value="to" type="date" @input="onTo"
             class="block mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm"/>
    </label>

    <button type="button" @click="$emit('apply')" :disabled="loading"
            class="px-4 py-2 bg-accent text-white rounded-xl text-sm font-bold
                   hover:bg-blue-600 disabled:opacity-50">
      {{ loading ? 'Yükleniyor...' : 'Getir' }}
    </button>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

defineProps({
  from: { type: String, required: true },
  to: { type: String, required: true },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['update:from', 'update:to', 'apply'])

// Yerel saatle gün: toISOString UTC'ye çevirip gece yarısı bir önceki güne kayabiliyor.
function iso(d) {
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const presets = [
  { key: 'today', label: 'Bugün',  range: () => { const t = new Date(); return [t, t] } },
  { key: '7',     label: '7 Gün',  range: () => { const t = new Date(); return [new Date(t.getTime() - 6 * 864e5), t] } },
  { key: '30',    label: '30 Gün', range: () => { const t = new Date(); return [new Date(t.getTime() - 29 * 864e5), t] } },
  { key: 'month', label: 'Bu Ay',  range: () => { const t = new Date(); return [new Date(t.getFullYear(), t.getMonth(), 1), t] } },
]

const activePreset = ref(null)

async function applyPreset(p) {
  const [a, b] = p.range()
  activePreset.value = p.key
  emit('update:from', iso(a))
  emit('update:to', iso(b))
  // v-model güncellensin, sonra rapor yeni aralıkla yüklensin.
  await nextTick()
  emit('apply')
}

function onFrom(e) { activePreset.value = null; emit('update:from', e.target.value) }
function onTo(e)   { activePreset.value = null; emit('update:to', e.target.value) }
</script>
