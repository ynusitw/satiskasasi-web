<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-primary">Lisans Talepleri</h1>
        <p class="text-muted text-sm mt-1">
          Kasadan gelen, onay bekleyen cihaz talepleri
        </p>
      </div>
      <button @click="load"
              class="px-4 py-2 bg-accent text-white rounded-lg
                     text-sm font-semibold hover:bg-blue-600 transition-colors">
        ↻ Yenile
      </button>
    </div>

    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Cihaz Kodu</th>
              <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Cihaz Bilgisi</th>
              <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Talep Tarihi</th>
              <th class="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="4" class="text-center py-12 text-muted">Yükleniyor...</td>
            </tr>
            <tr v-for="r in requests" :key="r.id"
                class="border-t border-gray-50 hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 text-xs font-mono">{{ r.deviceId }}</td>
              <td class="px-6 py-4 text-sm text-muted">{{ r.deviceInfo || '—' }}</td>
              <td class="px-6 py-4 text-sm">{{ formatDate(r.requestedAt) }}</td>
              <td class="px-6 py-4">
                <div class="flex gap-2 justify-end">
                  <button @click="openApprove(r)"
                          class="px-3 py-1 text-xs font-bold bg-green-50 text-green-600
                                 rounded-lg hover:bg-green-600 hover:text-white transition-colors">
                    Onayla
                  </button>
                  <button @click="reject(r)"
                          class="px-3 py-1 text-xs font-bold bg-red-50 text-danger
                                 rounded-lg hover:bg-danger hover:text-white transition-colors">
                    Reddet
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!loading && requests.length === 0">
              <td colspan="4" class="text-center py-12 text-muted">Bekleyen talep yok</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Onay Modal -->
    <Teleport to="body">
      <div v-if="modal.show"
           class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
          <h2 class="text-xl font-bold mb-1">Lisansı Onayla</h2>
          <p class="text-xs font-mono text-muted mb-6">{{ modal.request?.deviceId }}</p>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold mb-1">Müşteri *</label>
              <select v-model="form.tenantId"
                      class="w-full px-4 py-2 border border-gray-200 rounded-xl
                             focus:border-accent focus:outline-none text-sm">
                <option :value="null" disabled>Müşteri seçin</option>
                <option v-for="t in tenants" :key="t.id" :value="t.id">
                  {{ t.businessName }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-semibold mb-1">Lisans Tipi</label>
              <select v-model="form.licenseType"
                      class="w-full px-4 py-2 border border-gray-200 rounded-xl
                             focus:border-accent focus:outline-none text-sm">
                <option value="Full">Tam (süresiz)</option>
                <option value="Demo">Demo (14 gün)</option>
                <option value="Limited">Sınırlı (gün seç)</option>
              </select>
            </div>

            <div v-if="form.licenseType === 'Limited'">
              <label class="block text-sm font-semibold mb-1">Gün Sayısı</label>
              <input v-model.number="form.days" type="number" min="1"
                     class="w-full px-4 py-2 border border-gray-200 rounded-xl
                            focus:border-accent focus:outline-none text-sm"/>
            </div>

            <!-- Modüller müşteriye aittir (tüm kasaları ve paneli kapsar);
                 müşteri seçilince mevcut modülleri işaretli gelir. -->
            <div v-if="form.tenantId" class="pt-4 border-t border-gray-100">
              <div v-if="modulesLoading" class="text-sm text-muted py-2">Modüller yükleniyor...</div>
              <ModulePicker v-else v-model="form.moduleCodes"/>
              <p class="text-xs text-muted mt-2">
                Bu seçim müşterinin tüm kasalarında ve web panelinde geçerlidir.
              </p>
            </div>
          </div>

          <div v-if="error" class="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>

          <div class="flex gap-3 mt-6 justify-end">
            <button @click="modal.show = false"
                    class="px-5 py-2 bg-gray-100 rounded-xl text-sm font-bold hover:bg-gray-200">
              İptal
            </button>
            <button @click="approve" :disabled="saving || !form.tenantId"
                    class="px-5 py-2 bg-accent text-white rounded-xl text-sm
                           font-bold hover:bg-blue-600 disabled:opacity-50">
              {{ saving ? 'Onaylanıyor...' : 'Onayla' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import api from '../api/api'
import ModulePicker from '../components/ModulePicker.vue'

const requests = ref([])
const tenants  = ref([])
const loading  = ref(true)
const saving   = ref(false)
const error    = ref('')
const modal    = reactive({ show: false, request: null })
const form     = reactive({ tenantId: null, licenseType: 'Demo', days: 30, moduleCodes: [] })
const modulesLoading = ref(false)
// Mevcut modüller gerçekten yüklendi mi? Yüklenemediyse liste boş kalır ve
// onay gönderilirse müşterinin TÜM modüllerini silerdi. Bu durumda
// modüllere hiç dokunmamak için null gönderilir.
const modulesReady = ref(false)

// Müşteri seçildiğinde onun mevcut modüllerini getir — yönetici yalnızca
// değiştirmek istediğine dokunsun, var olanları yanlışlıkla silmesin.
watch(() => form.tenantId, async (tid) => {
  form.moduleCodes = []
  modulesReady.value = false
  if (!tid) return
  modulesLoading.value = true
  try {
    const res = await api.getTenantModules(tid)
    form.moduleCodes = res.data.map(m => m.moduleCode)
    modulesReady.value = true
  } catch {
    error.value = 'Müşterinin modülleri alınamadı.'
  } finally {
    modulesLoading.value = false
  }
})

async function load() {
  loading.value = true
  try {
    const [r, t] = await Promise.all([api.getLicenseRequests(), api.getAllTenants()])
    requests.value = r.data
    tenants.value  = t.data
  } finally {
    loading.value = false
  }
}

function openApprove(r) {
  modal.request = r
  form.tenantId = null
  form.licenseType = 'Demo'
  form.days = 30
  error.value = ''
  modal.show = true
}

async function approve() {
  saving.value = true
  error.value   = ''
  try {
    await api.approveLicense(modal.request.id, {
      tenantId: form.tenantId,
      licenseType: form.licenseType,
      days: form.licenseType === 'Limited' ? form.days : null,
      moduleCodes: modulesReady.value ? form.moduleCodes : null
    })
    modal.show = false
    await load()
  } catch (e) {
    error.value = e.response?.data?.message || 'Onaylanırken hata oluştu.'
  } finally {
    saving.value = false
  }
}

async function reject(r) {
  const note = prompt('Ret sebebi (opsiyonel):') || ''
  await api.rejectLicense(r.id, { note })
  await load()
}

function formatDate(d) {
  return new Date(d).toLocaleString('tr-TR')
}

onMounted(load)
</script>
