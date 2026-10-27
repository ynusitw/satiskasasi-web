<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-4xl">
    <div class="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div>
        <h1 class="page-title">Fiyat Listesi</h1>
        <p class="page-subtitle">Fiyat tekliflerinde kullanılan fiyatlar. Yeni teklifler bu fiyatlarla hazırlanır; kayıtlı teklifler değişmez.</p>
      </div>
      <RouterLink to="/superadmin/teklif" class="btn-secondary">Fiyat Teklifi'ne git</RouterLink>
    </div>

    <div v-if="loading" class="bg-white rounded-2xl shadow-sm py-12 text-center text-muted">Yükleniyor...</div>
    <div v-else-if="loadError" class="p-4 bg-red-50 text-red-600 rounded-xl text-sm">{{ loadError }}</div>

    <template v-else>
      <section class="bg-white rounded-2xl shadow-sm p-5 mb-5">
        <h2 class="section-title mb-4">Temel paket ve kasa</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="field-label">Temel paket (aylık)</label>
            <PriceInput v-model="pe.baseMonthly" full/>
            <p class="text-[11.5px] text-muted mt-1">Kasa, yönetim paneli, raporlar, kullanıcılar ve işlem yetkileri</p>
          </div>
          <div>
            <label class="field-label">Temel pakete dahil kasa</label>
            <input v-model.number="pe.includedDevices" type="number" min="1"
                   class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
          </div>
          <div>
            <label class="field-label">Ek kasa (aylık, kasa başına)</label>
            <PriceInput v-model="pe.extraDeviceMonthly" full/>
          </div>
          <div>
            <label class="field-label">Yıllık fiyat kaç aylık?</label>
            <input v-model.number="pe.yearlyMonths" type="number" min="1" max="12"
                   class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
            <p class="text-[11.5px] text-muted mt-1">12 = indirimsiz, 10 = yıllıkta 2 ay bedava</p>
          </div>
        </div>
      </section>

      <section class="bg-white rounded-2xl shadow-sm p-5 mb-5">
        <h2 class="section-title mb-1">Modüller</h2>
        <p class="text-xs text-muted mb-3">Aylık fiyat. Teklifte işaretlenen modüller bu fiyatla eklenir.</p>
        <div class="divide-y divide-gray-100">
          <div v-for="m in modules" :key="m.code" class="flex flex-wrap items-center gap-3 py-3">
            <span class="flex-1 min-w-[180px]">
              <span class="font-semibold text-primary text-[13.5px]">{{ m.name }}</span>
              <span class="block text-xs text-muted">{{ m.description }}</span>
            </span>
            <PriceInput v-model="pe.modulePrices[m.code]" suffix="/ay"/>
          </div>
        </div>
      </section>

      <section class="bg-white rounded-2xl shadow-sm p-5 mb-5">
        <h2 class="section-title mb-4">Tek seferlik</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label class="field-label">Kurulum ve eğitim</label>
            <PriceInput v-model="pe.setupFee" full/>
          </div>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span class="font-semibold text-primary text-[13.5px]">Hazır donanım listesi</span>
          <button class="btn-secondary btn-sm" @click="pe.hardware.push({ name: '', price: 0 })">+ Ekle</button>
        </div>
        <p v-if="!pe.hardware.length" class="text-xs text-muted">
          Teklife tek tıkla eklemek için PC, fiş yazıcı, barkod okuyucu gibi kalemleri fiyatıyla girin.
        </p>
        <div v-for="(h, i) in pe.hardware" :key="i" class="flex flex-wrap items-center gap-2 py-1.5">
          <input v-model="h.name" placeholder="Ürün adı"
                 class="flex-1 min-w-[160px] px-3 h-9 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
          <PriceInput v-model="h.price"/>
          <button class="chip-danger" @click="pe.hardware.splice(i, 1)">Sil</button>
        </div>
      </section>

      <section class="bg-white rounded-2xl shadow-sm p-5 mb-5">
        <h2 class="section-title mb-4">Teklif varsayılanları</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="field-label">Teklif geçerliliği (gün)</label>
            <input v-model.number="pe.validityDays" type="number" min="1"
                   class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
          </div>
          <div class="sm:col-span-2">
            <label class="field-label">Varsayılan teklif notu</label>
            <textarea v-model="pe.defaultNote" rows="2"
                      class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
          </div>
        </div>
      </section>

      <div class="flex flex-wrap items-center justify-end gap-3">
        <span v-if="updatedAt" class="text-xs text-muted mr-auto">Son güncelleme: {{ new Date(updatedAt).toLocaleString('tr-TR') }}</span>
        <span v-if="message" class="text-sm" :class="messageError ? 'text-danger' : 'text-success'">{{ message }}</span>
        <button class="btn-primary btn-lg" :disabled="saving" @click="save">{{ saving ? 'Kaydediliyor...' : 'Kaydet' }}</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../api/api'
import PriceInput from '../components/PriceInput.vue'

const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const message = ref('')
const messageError = ref(false)
const modules = ref([])
const updatedAt = ref(null)
const pe = reactive({ baseMonthly: 0, includedDevices: 1, extraDeviceMonthly: 0, setupFee: 0, yearlyMonths: 12,
  validityDays: 15, defaultNote: '', modulePrices: {}, hardware: [] })

async function load() {
  const { data } = await api.getPricing()
  modules.value = data.modules
  updatedAt.value = data.updatedAt
  Object.assign(pe, {
    baseMonthly: data.baseMonthly, includedDevices: data.includedDevices, extraDeviceMonthly: data.extraDeviceMonthly,
    setupFee: data.setupFee, yearlyMonths: data.yearlyMonths, validityDays: data.validityDays, defaultNote: data.defaultNote,
    modulePrices: { ...data.modulePrices }, hardware: data.hardware.map(h => ({ ...h }))
  })
}

onMounted(async () => {
  try { await load() }
  catch (e) { loadError.value = e.response?.data?.message || 'Fiyat listesi yüklenemedi.' }
  finally { loading.value = false }
})

async function save() {
  saving.value = true
  message.value = ''
  try {
    const { data } = await api.savePricing(pe)
    await load()
    message.value = data.message || 'Kaydedildi.'
    messageError.value = false
  } catch (e) {
    message.value = e.response?.data?.message || 'Kaydedilemedi.'
    messageError.value = true
  } finally {
    saving.value = false
  }
}
</script>
