<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-primary">Lisanslar</h1>
        <p class="text-muted text-sm mt-1">
          Müşteri oluştur, verilmiş lisansları görüntüle
        </p>
      </div>
      <button @click="openCreate"
              class="px-5 py-3 bg-accent text-white rounded-xl text-sm
                     font-bold hover:bg-blue-600 transition-colors">
        + Yeni Müşteri
      </button>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <StatCard label="Toplam Müşteri" :value="tenants.length"
                icon="🏢" color="bg-blue-50 text-blue-600"/>
      <StatCard label="Cihazı Lisanslı" :value="licensedTenantCount"
                icon="🔑" color="bg-green-50 text-green-600"/>
      <StatCard label="Cihaz Bekliyor" :value="tenants.length - licensedTenantCount"
                icon="⏳" color="bg-yellow-50 text-yellow-600"/>
    </div>

    <!-- Müşteriler -->
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
      <div class="px-6 py-4 border-b border-gray-100">
        <h2 class="font-bold text-primary">Müşteriler</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">İşletme</th>
              <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">İletişim</th>
              <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Cihaz Lisansı</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="3" class="text-center py-12 text-muted">Yükleniyor...</td>
            </tr>
            <tr v-for="t in tenants" :key="t.id"
                class="border-t border-gray-50 hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4">
                <div class="font-semibold text-primary">{{ t.businessName }}</div>
                <div class="text-xs text-muted">{{ t.city }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm">{{ t.email }}</div>
                <div class="text-xs text-muted">{{ t.phone }}</div>
              </td>
              <td class="px-6 py-4">
                <span v-if="tenantLicenseCount(t.id) > 0"
                      class="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-600">
                  {{ tenantLicenseCount(t.id) }} cihaz
                </span>
                <span v-else
                      class="text-xs font-bold px-3 py-1 rounded-full bg-yellow-100 text-yellow-600">
                  Bekliyor
                </span>
              </td>
            </tr>
            <tr v-if="!loading && tenants.length === 0">
              <td colspan="3" class="text-center py-12 text-muted">Müşteri bulunamadı</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Verilmiş Lisanslar -->
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100">
        <h2 class="font-bold text-primary">Verilmiş Lisanslar</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Müşteri</th>
              <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Cihaz Kodu</th>
              <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Tip</th>
              <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Bitiş</th>
              <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Durum</th>
              <th class="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in licenses" :key="l.id"
                class="border-t border-gray-50 hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 font-semibold text-primary">{{ l.tenantName }}</td>
              <td class="px-6 py-4 text-xs font-mono text-muted">{{ l.deviceId.slice(0, 16) }}…</td>
              <td class="px-6 py-4 text-sm">{{ typeLabel(l.licenseType) }}</td>
              <td class="px-6 py-4 text-sm">{{ l.expiresAt ? formatDate(l.expiresAt) : 'Süresiz' }}</td>
              <td class="px-6 py-4">
                <span :class="l.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'"
                      class="text-xs font-bold px-3 py-1 rounded-full">
                  {{ l.isActive ? 'Aktif' : 'İptal' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <button v-if="l.isActive" @click="revoke(l)"
                        class="px-3 py-1 text-xs font-bold bg-red-50 text-danger
                               rounded-lg hover:bg-danger hover:text-white transition-colors">
                  İptal Et
                </button>
              </td>
            </tr>
            <tr v-if="licenses.length === 0">
              <td colspan="6" class="text-center py-12 text-muted">Henüz lisans verilmemiş</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Yeni Müşteri Modal -->
    <Teleport to="body">
      <div v-if="modal.show"
           class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
          <h2 class="text-xl font-bold mb-1">Yeni Müşteri Oluştur</h2>
          <p class="text-sm text-muted mb-6">Lisans, kasadan talep geldiğinde ayrıca onaylanır.</p>

          <form @submit.prevent="createTenant">
            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <label class="block text-sm font-semibold text-primary mb-1">İşletme Adı *</label>
                <input v-model="form.businessName" required
                       class="w-full px-4 py-3 rounded-xl border border-gray-200
                              focus:border-accent focus:outline-none text-sm"/>
              </div>
              <div class="col-span-2">
                <label class="block text-sm font-semibold text-primary mb-1">Kullanıcı Adı *</label>
                <input v-model="form.username" required
                       class="w-full px-4 py-3 rounded-xl border border-gray-200
                              focus:border-accent focus:outline-none text-sm"/>
              </div>
              <div class="col-span-2">
                <label class="block text-sm font-semibold text-primary mb-1">Yetkili Adı *</label>
                <input v-model="form.contactPerson" required
                       class="w-full px-4 py-3 rounded-xl border border-gray-200
                              focus:border-accent focus:outline-none text-sm"/>
              </div>
              <div>
                <label class="block text-sm font-semibold text-primary mb-1">E-posta *</label>
                <input v-model="form.email" type="email" required
                       class="w-full px-4 py-3 rounded-xl border border-gray-200
                              focus:border-accent focus:outline-none text-sm"/>
              </div>
              <div>
                <label class="block text-sm font-semibold text-primary mb-1">Telefon *</label>
                <input v-model="form.phone" required
                       class="w-full px-4 py-3 rounded-xl border border-gray-200
                              focus:border-accent focus:outline-none text-sm"/>
              </div>
              <div>
                <label class="block text-sm font-semibold text-primary mb-1">Şehir</label>
                <input v-model="form.city"
                       class="w-full px-4 py-3 rounded-xl border border-gray-200
                              focus:border-accent focus:outline-none text-sm"/>
              </div>
              <div>
                <label class="block text-sm font-semibold text-primary mb-1">Vergi No</label>
                <input v-model="form.taxNumber"
                       class="w-full px-4 py-3 rounded-xl border border-gray-200
                              focus:border-accent focus:outline-none text-sm"/>
              </div>
              <div class="col-span-2">
                <label class="block text-sm font-semibold text-primary mb-1">Adres</label>
                <input v-model="form.address"
                       class="w-full px-4 py-3 rounded-xl border border-gray-200
                              focus:border-accent focus:outline-none text-sm"/>
              </div>
              <div class="col-span-2">
                <label class="block text-sm font-semibold text-primary mb-1">Şifre *</label>
                <input v-model="form.password" type="password" required
                       class="w-full px-4 py-3 rounded-xl border border-gray-200
                              focus:border-accent focus:outline-none text-sm"/>
              </div>
            </div>

            <div v-if="error" class="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>

            <div class="flex gap-3 mt-6 justify-end">
              <button type="button" @click="modal.show = false"
                      class="px-5 py-2 bg-gray-100 rounded-xl text-sm font-bold hover:bg-gray-200">
                İptal
              </button>
              <button type="submit" :disabled="saving"
                      class="px-5 py-2 bg-accent text-white rounded-xl text-sm
                             font-bold hover:bg-blue-600 disabled:opacity-50">
                {{ saving ? 'Oluşturuluyor...' : 'Oluştur' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import api      from '../api/api'
import StatCard from '../components/StatCard.vue'

const tenants  = ref([])
const licenses = ref([])
const loading  = ref(true)
const saving   = ref(false)
const error    = ref('')
const modal    = reactive({ show: false })

const form = reactive({
  businessName: '', contactPerson: '', email: '',
  phone: '', city: '', taxNumber: '',
  address: '', password: '', username: '',
})

const licensedTenantCount = computed(() =>
  tenants.value.filter(t => tenantLicenseCount(t.id) > 0).length)

function tenantLicenseCount(tenantId) {
  return licenses.value.filter(l => l.tenantId === tenantId && l.isActive).length
}

function typeLabel(t) {
  return { Full: 'Tam', Demo: 'Demo', Limited: 'Sınırlı' }[t] || t
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('tr-TR')
}

async function load() {
  loading.value = true
  try {
    const [t, l] = await Promise.all([api.getAllTenants(), api.getLicenses()])
    tenants.value  = t.data
    licenses.value = l.data
  } finally {
    loading.value = false
  }
}

function openCreate() {
  Object.assign(form, {
    businessName: '', contactPerson: '', email: '',
    phone: '', city: '', taxNumber: '',
    address: '', password: '', username: '',
  })
  error.value = ''
  modal.show  = true
}

async function createTenant() {
  saving.value = true
  error.value   = ''
  try {
    await api.register(form)
    modal.show = false
    await load()
  } catch (e) {
    error.value = e.response?.data?.message || 'Müşteri oluşturulurken hata oluştu.'
  } finally {
    saving.value = false
  }
}

async function revoke(l) {
  if (!confirm(`${l.tenantName} — bu cihazın lisansı iptal edilsin mi?`)) return
  await api.revokeLicense(l.id)
  await load()
}

onMounted(load)
</script>
