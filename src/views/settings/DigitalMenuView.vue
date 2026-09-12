<template>
  <div class="p-8 max-w-2xl">
    <h1 class="text-2xl font-bold text-primary">Dijital Menü (QR)</h1>
    <p class="text-muted text-sm mt-1 mb-6">
      Bu QR kodu masalarınıza koyun — müşterileriniz telefonlarıyla okutup
      menünüzü (ürün ve fiyatları) görüntüleyebilir. Sipariş alınmaz, sadece
      görüntülemedir.
    </p>

    <div v-if="loading" class="text-muted">Yükleniyor...</div>

    <div v-else class="bg-white rounded-2xl shadow-sm p-8 flex flex-col items-center">
      <img :src="qrUrl" :alt="menuUrl" width="220" height="220"
           class="rounded-xl border border-gray-100"/>

      <div class="mt-6 w-full">
        <label class="block text-sm font-semibold text-primary mb-1.5">Menü Bağlantısı</label>
        <div class="flex gap-2">
          <input :value="menuUrl" readonly
                 class="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm
                        bg-gray-50 text-muted"/>
          <button @click="copyLink"
                  class="px-4 py-2.5 bg-accent text-white rounded-xl text-sm
                         font-bold hover:bg-blue-600 transition-colors whitespace-nowrap">
            {{ copied ? 'Kopyalandı ✓' : 'Kopyala' }}
          </button>
        </div>
      </div>

      <a :href="menuUrl" target="_blank"
         class="mt-4 text-sm text-accent hover:underline">
        Menüyü önizle ↗
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../api/api'

const loading = ref(true)
const slug    = ref('')
const copied  = ref(false)

const menuUrl = computed(() => `${window.location.origin}/menu/${slug.value}`)
const qrUrl   = computed(() =>
  `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(menuUrl.value)}`)

async function copyLink() {
  try {
    await navigator.clipboard.writeText(menuUrl.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {}
}

onMounted(async () => {
  try {
    const res = await api.getMyTenant()
    slug.value = res.data.slugName
  } finally {
    loading.value = false
  }
})
</script>
