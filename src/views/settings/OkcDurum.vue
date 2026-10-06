<template>
  <div class="p-8 max-w-4xl">
    <h1 class="page-title">ÖKC Durum</h1>
    <p class="text-muted text-sm mt-1 mb-6">
      Ödeme kaydedici cihaz bilgileri ve işletmedeki kasaların bağlantı durumu.
    </p>

    <!-- Entegrasyon durumu: olmayan bir şeyi var gibi göstermiyoruz -->
    <div class="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
      <div class="flex items-start gap-3">
        <span class="text-xl">ⓘ</span>
        <div class="text-sm text-amber-900">
          <p class="font-semibold">ÖKC entegrasyonu henüz bağlı değil.</p>
          <p class="mt-1 text-amber-800">
            Kasa şu an fişleri kendi yazıcısından basıyor; mali fiş ÖKC cihazından ayrı
            kesiliyor. Cihaz bilgilerinizi buraya kaydederek servis ve arıza takibinde
            kullanabilirsiniz. Entegrasyon eklendiğinde bu sayfa cihazın canlı durumunu
            gösterecek.
          </p>
        </div>
      </div>
    </div>

    <!-- Cihaz kaydı -->
    <div class="bg-white rounded-2xl shadow-sm p-6 mb-6">
      <h2 class="section-title mb-1">ÖKC Cihaz Bilgisi</h2>
      <p class="text-xs text-muted mb-4">Kayıt amaçlıdır; kasanın çalışmasını etkilemez.</p>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label class="field-label-muted">Marka</label>
          <input v-model="form.okcBrand" placeholder="Hugin, Ingenico, Beko..."
                 class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
        </div>
        <div>
          <label class="field-label-muted">Model</label>
          <input v-model="form.okcModel"
                 class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
        </div>
        <div>
          <label class="field-label-muted">Seri No</label>
          <input v-model="form.okcSerialNo"
                 class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
        </div>
        <div class="sm:col-span-3">
          <label class="field-label-muted">Not</label>
          <input v-model="form.okcNote" placeholder="Servis firması, sözleşme tarihi..."
                 class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
        </div>
      </div>

      <div class="flex items-center gap-3 mt-5">
        <button @click="save" :disabled="saving"
                class="btn-primary disabled:opacity-50">
          {{ saving ? 'Kaydediliyor...' : 'Kaydet' }}
        </button>
        <span v-if="saved" class="text-sm text-success font-semibold">Kaydedildi</span>
        <span v-if="error" class="text-sm text-danger">{{ error }}</span>
      </div>
    </div>

    <!-- Kasalar -->
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100">
        <h2 class="section-title">Bağlı Kasalar</h2>
        <p class="text-xs text-muted mt-0.5">
          Kasa birkaç dakikada bir haber verir; buradaki bilgi ona dayanır.
        </p>
      </div>

      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left px-6 py-3 text-[11px] font-semibold text-muted uppercase">Cihaz</th>
            <th class="text-left px-6 py-3 text-[11px] font-semibold text-muted uppercase">Lisans</th>
            <th class="text-left px-6 py-3 text-[11px] font-semibold text-muted uppercase">Son Bağlantı</th>
            <th class="text-left px-6 py-3 text-[11px] font-semibold text-muted uppercase">Durum</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="4" class="text-center py-10 text-muted text-sm">Yükleniyor...</td>
          </tr>
          <tr v-for="k in kasalar" :key="k.id" class="border-t border-gray-50">
            <td class="px-6 py-4">
              <div class="text-sm font-semibold text-primary">{{ k.deviceInfo || 'Bilinmiyor' }}</div>
              <div class="text-xs font-mono text-muted">{{ k.deviceId.slice(0, 16) }}…</div>
            </td>
            <td class="px-6 py-4 text-sm text-muted">
              {{ typeLabel(k.licenseType) }}
              <div class="text-xs">{{ k.expiresAt ? formatDate(k.expiresAt) + '\'e kadar' : 'Süresiz' }}</div>
            </td>
            <td class="px-6 py-4 text-sm">
              <template v-if="k.lastSeenAt">
                <div :class="stale(k.lastSeenAt) ? 'text-danger font-semibold' : 'text-muted'">
                  {{ formatDateTime(k.lastSeenAt) }}
                </div>
                <div v-if="k.pendingCount > 0" class="text-xs text-danger font-bold">
                  {{ k.pendingCount }} kayıt gönderilmedi
                </div>
              </template>
              <span v-else class="text-muted">—</span>
            </td>
            <td class="px-6 py-4">
              <span :class="k.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'"
                    class="text-xs font-bold px-3 py-1 rounded-full">
                {{ k.isActive ? 'Aktif' : 'İptal' }}
              </span>
            </td>
          </tr>
          <tr v-if="!loading && !kasalar.length">
            <td colspan="4" class="text-center py-10 text-muted text-sm">Kayıtlı kasa yok</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../../api/api'

const kasalar = ref([])
const loading = ref(true)
const saving  = ref(false)
const saved   = ref(false)
const error   = ref('')

const form = reactive({ okcBrand: '', okcModel: '', okcSerialNo: '', okcNote: '' })
// Terminal alanları da aynı kayıtta; buradan kaydederken korunmalı.
let deviceRow = {}

function typeLabel(t) {
  return { Full: 'Tam', Demo: 'Demo', Limited: 'Sınırlı' }[t] || t || '—'
}
function formatDate(d) { return new Date(d).toLocaleDateString('tr-TR') }
function formatDateTime(d) {
  return new Date(d).toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}
function stale(d) { return (Date.now() - new Date(d).getTime()) / 3600000 > 24 }

async function load() {
  loading.value = true
  try {
    const [dev, list] = await Promise.all([api.getDeviceSettings(), api.getTenantTerminals()])
    deviceRow = dev.data || {}
    Object.assign(form, {
      okcBrand: deviceRow.okcBrand || '',
      okcModel: deviceRow.okcModel || '',
      okcSerialNo: deviceRow.okcSerialNo || '',
      okcNote: deviceRow.okcNote || '',
    })
    kasalar.value = list.data
  } catch (e) {
    error.value = e.response?.data?.message || 'Bilgiler alınamadı.'
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function save() {
  saving.value = true
  saved.value = false
  error.value = ''
  try {
    // Terminal alanları bu sayfada düzenlenmiyor; olduğu gibi geri gönderilir.
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
