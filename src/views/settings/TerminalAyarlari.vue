<template>
  <div class="p-8 max-w-4xl">
    <h1 class="page-title">Terminal Ayarları</h1>
    <p class="text-muted text-sm mt-1 mb-6">
      Kartlı ödeme alınan banka POS cihazının bilgileri.
    </p>

    <!-- Entegrasyon durumu -->
    <div class="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
      <div class="flex items-start gap-3">
        <span class="text-xl">ⓘ</span>
        <div class="text-sm text-amber-900">
          <p class="font-semibold">Terminal entegrasyonu henüz bağlı değil.</p>
          <p class="mt-1 text-amber-800">
            Kartlı ödemede tutar terminale <b>elle</b> giriliyor; kasa ödemeyi "Kredi Kartı"
            olarak kaydediyor. Entegre çalışma için bankanın terminal SDK'sı gerekiyor —
            banka ve cihaz modelini buraya kaydederseniz entegrasyon aşamasında
            kullanılacak.
          </p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm p-6">
      <h2 class="section-title mb-1">Cihaz Bilgisi</h2>
      <p class="text-xs text-muted mb-4">Kayıt amaçlıdır; kasanın çalışmasını etkilemez.</p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="field-label-muted">Banka</label>
          <input v-model="form.terminalBank" placeholder="Ziraat, Garanti, Yapı Kredi..."
                 class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
        </div>
        <div>
          <label class="field-label-muted">Çalışma şekli</label>
          <select v-model="form.terminalMode"
                  class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white">
            <option value="Bağımsız">Bağımsız (tutar elle giriliyor)</option>
            <option value="Entegre">Entegre (kasadan tutar gidiyor)</option>
          </select>
        </div>
        <div>
          <label class="field-label-muted">Marka</label>
          <input v-model="form.terminalBrand" placeholder="Ingenico, Verifone, PAX..."
                 class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
        </div>
        <div>
          <label class="field-label-muted">Model</label>
          <input v-model="form.terminalModel"
                 class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
        </div>
        <div>
          <label class="field-label-muted">Seri No / Terminal No</label>
          <input v-model="form.terminalSerialNo"
                 class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
        </div>
        <div>
          <label class="field-label-muted">Not</label>
          <input v-model="form.terminalNote" placeholder="Üye işyeri no, servis..."
                 class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
        </div>
      </div>

      <!-- Entegre seçildiğinde beklenti netleşsin -->
      <p v-if="form.terminalMode === 'Entegre'"
         class="mt-4 p-3 bg-blue-50 text-accent rounded-xl text-xs">
        Entegre çalışma şu an kasada etkin değil. Bu seçim yalnızca kayıt olarak tutulur;
        kartlı ödemede tutar terminale elle girilmeye devam eder.
      </p>

      <div class="flex items-center gap-3 mt-5">
        <button @click="save" :disabled="saving"
                class="btn-primary disabled:opacity-50">
          {{ saving ? 'Kaydediliyor...' : 'Kaydet' }}
        </button>
        <span v-if="saved" class="text-sm text-success font-semibold">Kaydedildi</span>
        <span v-if="error" class="text-sm text-danger">{{ error }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import api from '../../api/api'

const saving = ref(false)
const saved  = ref(false)
const error  = ref('')

const form = reactive({
  terminalBank: '', terminalBrand: '', terminalModel: '',
  terminalSerialNo: '', terminalMode: 'Bağımsız', terminalNote: '',
})

// ÖKC alanları aynı kayıtta; bu sayfadan kaydederken korunmalı.
let deviceRow = {}

async function load() {
  try {
    const res = await api.getDeviceSettings()
    deviceRow = res.data || {}
    Object.assign(form, {
      terminalBank: deviceRow.terminalBank || '',
      terminalBrand: deviceRow.terminalBrand || '',
      terminalModel: deviceRow.terminalModel || '',
      terminalSerialNo: deviceRow.terminalSerialNo || '',
      terminalMode: deviceRow.terminalMode || 'Bağımsız',
      terminalNote: deviceRow.terminalNote || '',
    })
  } catch (e) {
    error.value = e.response?.data?.message || 'Bilgiler alınamadı.'
  }
}
onMounted(load)

async function save() {
  saving.value = true
  saved.value = false
  error.value = ''
  try {
    await api.saveDeviceSettings({ ...deviceRow, ...form })
    saved.value = true
    setTimeout(() => (saved.value = false), 3000)
  } catch (e) {
    error.value = e.response?.data?.message || 'Kaydedilemedi.'
  } finally {
    saving.value = false
  }
}
</script>
