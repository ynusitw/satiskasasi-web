<template>
  <div class="p-8 max-w-2xl">
    <h1 class="text-2xl font-bold text-primary">Dijital Menü (QR)</h1>
    <p class="text-muted text-sm mt-1 mb-6">
      Bu QR kodu masalarınıza koyun — müşterileriniz telefonlarıyla okutup
      menünüzü (ürün ve fiyatları) görüntüleyebilir. Sipariş alınmaz, sadece
      görüntülemedir.
    </p>

    <div v-if="loading" class="text-muted">Yükleniyor...</div>

    <div v-else class="space-y-6">
      <div class="bg-white rounded-2xl shadow-sm p-8 flex flex-col items-center">
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

      <!-- Görünürlük Ayarları -->
      <div class="bg-white rounded-2xl shadow-sm p-6">
        <h2 class="font-bold text-primary mb-1">Görünürlük Ayarları</h2>
        <p class="text-xs text-muted mb-4">
          Firma adının altında hangi iletişim bilgilerinin gösterileceğini seçin.
        </p>

        <label class="flex items-center justify-between p-3 rounded-xl
                       bg-gray-50 border border-gray-100 cursor-pointer mb-3">
          <div>
            <div class="text-sm font-semibold">Adresi Göster</div>
            <div class="text-xs text-muted">Menüde firma adresi görünsün</div>
          </div>
          <button @click="toggle('showAddressOnMenu')"
                  class="relative inline-flex h-6 w-11 items-center rounded-full
                         transition-colors duration-200 flex-shrink-0"
                  :class="settings.showAddressOnMenu ? 'bg-accent' : 'bg-gray-300'">
            <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow
                         transition-transform duration-200"
                  :class="settings.showAddressOnMenu ? 'translate-x-6' : 'translate-x-1'"/>
          </button>
        </label>

        <label class="flex items-center justify-between p-3 rounded-xl
                       bg-gray-50 border border-gray-100 cursor-pointer">
          <div>
            <div class="text-sm font-semibold">Telefonu Göster</div>
            <div class="text-xs text-muted">Menüde telefon numarası görünsün</div>
          </div>
          <button @click="toggle('showPhoneOnMenu')"
                  class="relative inline-flex h-6 w-11 items-center rounded-full
                         transition-colors duration-200 flex-shrink-0"
                  :class="settings.showPhoneOnMenu ? 'bg-accent' : 'bg-gray-300'">
            <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow
                         transition-transform duration-200"
                  :class="settings.showPhoneOnMenu ? 'translate-x-6' : 'translate-x-1'"/>
          </button>
        </label>

        <div class="text-xs mt-3" :class="saveError ? 'text-danger' : 'text-muted'">
          {{ saveError ? saveError : (saving ? 'Kaydediliyor...' : (saved ? 'Kaydedildi ✓' : '')) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import api from '../../api/api'

const loading   = ref(true)
const slug      = ref('')
const copied    = ref(false)
const saving    = ref(false)
const saved     = ref(false)
const saveError = ref('')

const settings = reactive({ showAddressOnMenu: true, showPhoneOnMenu: true })

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

async function toggle(key) {
  settings[key] = !settings[key]
  saving.value = true
  saved.value  = false
  saveError.value = ''
  try {
    await api.updateMenuSettings(settings)
    saved.value = true
    setTimeout(() => (saved.value = false), 2000)
  } catch {
    settings[key] = !settings[key] // geri al
    saveError.value = 'Kaydedilemedi, tekrar deneyin.'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const res = await api.getMyTenant()
    slug.value = res.data.slugName
    settings.showAddressOnMenu = res.data.showAddressOnMenu ?? true
    settings.showPhoneOnMenu   = res.data.showPhoneOnMenu ?? true
  } finally {
    loading.value = false
  }
})
</script>
