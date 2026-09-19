<template>
  <!-- Lisans modülü seçimi. Liste API kataloğundan gelir: yeni bir modül
       eklendiğinde bu bileşen kod değişmeden onu da gösterir. -->
  <div>
    <div class="flex items-center justify-between mb-2">
      <label class="block text-xs font-semibold uppercase tracking-wide opacity-70">
        Modüller
      </label>
      <div v-if="catalog.length" class="flex gap-3 text-xs">
        <button type="button" @click="selectAll" class="text-accent hover:underline">Tümü</button>
        <button type="button" @click="selectNone" class="opacity-60 hover:underline">Hiçbiri</button>
      </div>
    </div>

    <div v-if="loading" class="text-sm opacity-60 py-3">Modüller yükleniyor...</div>
    <div v-else-if="error" class="text-sm text-red-500 py-3">{{ error }}</div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <label v-for="m in catalog" :key="m.code"
             class="flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors"
             :class="isOn(m.code)
               ? 'border-accent bg-accent/5'
               : 'border-gray-200 hover:border-accent/40'">
        <input type="checkbox" class="mt-0.5 accent-blue-600"
               :checked="isOn(m.code)" @change="toggle(m.code)"/>
        <span class="min-w-0">
          <span class="block text-sm font-semibold">{{ m.name }}</span>
          <span class="block text-xs opacity-60 mt-0.5">{{ m.description }}</span>
        </span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api/api'

// v-model: seçili modül kodlarının dizisi, örn. ['qr_menu', 'tables']
const model = defineModel({ type: Array, default: () => [] })

const catalog = ref([])
const loading = ref(true)
const error   = ref('')

function isOn(code) { return model.value.includes(code) }

function toggle(code) {
  model.value = isOn(code)
    ? model.value.filter(c => c !== code)
    : [...model.value, code]
}

function selectAll()  { model.value = catalog.value.map(m => m.code) }
function selectNone() { model.value = [] }

onMounted(async () => {
  try {
    const res = await api.getModuleCatalog()
    catalog.value = res.data
  } catch {
    error.value = 'Modül listesi alınamadı.'
  } finally {
    loading.value = false
  }
})

// Üst bileşen katalog yüklendikten sonra "hepsi seçili" başlatmak
// isteyebilir (yeni müşteri formu gibi).
defineExpose({ selectAll, catalog })
</script>
