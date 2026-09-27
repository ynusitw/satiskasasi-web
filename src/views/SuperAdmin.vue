<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-primary">Müşteri Yönetimi</h1>
        <p class="text-muted text-sm mt-1">
          Toplam {{ tenants.length }} müşteri
        </p>
      </div>
      <button @click="openCreate"
              class="px-4 py-2 bg-accent text-white rounded-lg text-sm
                     font-semibold hover:bg-blue-600 transition-colors">
        + Yeni Müşteri
      </button>
    </div>

    <!-- İstatistik Kartları -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard label="Toplam Müşteri" :value="tenants.length"
                color="bg-blue-50 text-blue-600"/>
      <StatCard label="Aktif" :value="activeCount"
                color="bg-green-50 text-green-600"/>
      <StatCard label="Deneme" :value="trialCount"
                color="bg-yellow-50 text-yellow-600"/>
      <StatCard label="Süresi Dolan" :value="expiredCount"
                color="bg-red-50 text-red-600"/>
    </div>

    <!-- Tablo -->
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
        <input v-model="search"
               placeholder="İşletme veya email ara..."
               class="px-4 py-2 rounded-xl border border-gray-200
                      focus:border-accent focus:outline-none text-sm w-72"/>
        <button @click="load"
                class="px-4 py-2 bg-accent text-white rounded-lg
                       text-sm font-semibold hover:bg-blue-600 transition-colors">
          ↻ Yenile
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">İşletme</th>
              <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">İletişim</th>
              <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Plan</th>
              <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Bitiş</th>
              <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Satış</th>
              <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Durum</th>
              <th class="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center py-12 text-muted">Yükleniyor...</td>
            </tr>
            <tr v-for="t in filtered" :key="t.id"
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
                <span :class="getPlanColor(t.plan)"
                      class="text-xs font-bold px-3 py-1 rounded-full">
                  {{ getPlanLabel(t.plan) }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div :class="isExpired(t.expiresAt) ? 'text-red-500 font-bold' :
                             isDueSoon(t.expiresAt) ? 'text-yellow-500 font-bold' : ''"
                     class="text-sm">
                  {{ formatDate(t.expiresAt) }}
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-muted">
                {{ t.saleCount }} işlem
              </td>
              <td class="px-6 py-4">
                <span :class="t.isActive ?
                              'bg-green-100 text-green-600' :
                              'bg-red-100 text-red-600'"
                      class="text-xs font-bold px-3 py-1 rounded-full">
                  {{ t.isActive ? 'Aktif' : 'Pasif' }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex gap-2 justify-end">
                  <button @click="openEdit(t)"
                          class="px-3 py-1 text-xs font-bold bg-blue-50 text-accent
                                 rounded-lg hover:bg-accent hover:text-white transition-colors">
                    Yönet
                  </button>
                  <button @click="deleteTenant(t)"
                          class="px-3 py-1 text-xs font-bold bg-red-50 text-danger
                                 rounded-lg hover:bg-danger hover:text-white transition-colors">
                    Sil
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!loading && filtered.length === 0">
              <td colspan="7" class="text-center py-12 text-muted">
                Müşteri bulunamadı
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Yeni Müşteri Modal — lisans verilmeden önce de müşteri açılabilsin -->
    <Teleport to="body">
      <div v-if="createModal.show"
           class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
          <h2 class="text-xl font-bold mb-1">Yeni Müşteri</h2>
          <p class="text-sm text-muted mb-6">
            Kasa lisansı, cihazdan başvuru geldiğinde Lisans sayfasından verilir.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input v-model="createForm.businessName" placeholder="İşletme adı *"
                   class="px-4 py-2 border border-gray-200 rounded-xl text-sm"/>
            <input v-model="createForm.contactPerson" placeholder="Yetkili kişi"
                   class="px-4 py-2 border border-gray-200 rounded-xl text-sm"/>
            <input v-model="createForm.username" placeholder="Kullanıcı adı *"
                   class="px-4 py-2 border border-gray-200 rounded-xl text-sm"/>
            <input v-model="createForm.password" type="text" placeholder="Şifre *"
                   class="px-4 py-2 border border-gray-200 rounded-xl text-sm"/>
            <input v-model="createForm.email" placeholder="E-posta"
                   class="px-4 py-2 border border-gray-200 rounded-xl text-sm"/>
            <input v-model="createForm.phone" placeholder="Telefon"
                   class="px-4 py-2 border border-gray-200 rounded-xl text-sm"/>
            <input v-model="createForm.city" placeholder="Şehir"
                   class="px-4 py-2 border border-gray-200 rounded-xl text-sm"/>
            <input v-model="createForm.taxNumber" placeholder="Vergi no"
                   class="px-4 py-2 border border-gray-200 rounded-xl text-sm"/>
            <input v-model="createForm.address" placeholder="Adres"
                   class="px-4 py-2 border border-gray-200 rounded-xl text-sm sm:col-span-2"/>
          </div>

          <div class="pt-4 mt-4 border-t border-gray-100">
            <ModulePicker v-model="createForm.moduleCodes"/>
          </div>

          <div v-if="error" class="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>

          <div class="flex gap-3 mt-6 justify-end">
            <button @click="createModal.show = false"
                    class="px-5 py-2 bg-gray-100 rounded-xl text-sm font-bold hover:bg-gray-200">
              Vazgeç
            </button>
            <button @click="createTenant" :disabled="saving"
                    class="px-5 py-2 bg-accent text-white rounded-xl text-sm
                           font-bold hover:bg-blue-600 disabled:opacity-50">
              {{ saving ? 'Kaydediliyor...' : 'Oluştur' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Düzenleme Modal -->
    <Teleport to="body">
      <div v-if="modal.show"
           class="fixed inset-0 bg-black/50 flex items-center
                  justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <h2 class="text-xl font-bold mb-2">{{ modal.tenant?.businessName }}</h2>
          <p class="text-sm text-muted mb-6">Abonelik ve durum yönetimi</p>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold mb-1">Plan</label>
              <select v-model="form.plan"
                      class="w-full px-4 py-2 border border-gray-200 rounded-xl
                             focus:border-accent focus:outline-none text-sm">
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-semibold mb-1">Bitiş Tarihi</label>
              <input v-model="form.expiresAt" type="date"
                     class="w-full px-4 py-2 border border-gray-200 rounded-xl
                            focus:border-accent focus:outline-none text-sm"/>
            </div>

            <!-- Kaç kasa lisanslanabilir. Lisans onayında kontrol edilir. -->
            <div>
              <label class="block text-sm font-semibold mb-1">Kasa (Cihaz) Sınırı</label>
              <input v-model.number="form.maxDevices" type="number" min="0"
                     class="w-full px-4 py-2 border border-gray-200 rounded-xl
                            focus:border-accent focus:outline-none text-sm"/>
              <p class="text-xs text-muted mt-1">0 = sınırsız. Sınır dolduğunda yeni cihaz
                lisansı onaylanamaz; önce eski cihazın lisansı iptal edilmelidir.</p>
            </div>

            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.isActive" type="checkbox" class="w-4 h-4"/>
              <span class="text-sm font-semibold">Hesap Aktif</span>
            </label>
          </div>

          <div v-if="error"
               class="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
            {{ error }}
          </div>

          <div class="flex gap-3 mt-6 justify-end">
            <button @click="modal.show = false"
                    class="px-5 py-2 bg-gray-100 rounded-xl text-sm
                           font-bold hover:bg-gray-200">
              İptal
            </button>
            <button @click="save" :disabled="saving"
                    class="px-5 py-2 bg-accent text-white rounded-xl
                           text-sm font-bold hover:bg-blue-600 disabled:opacity-50">
              {{ saving ? 'Kaydediliyor...' : 'Kaydet' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import api      from '../api/api'
import StatCard from '../components/StatCard.vue'
import ModulePicker from '../components/ModulePicker.vue'

const tenants = ref([])
const loading = ref(true)
const search  = ref('')
const saving  = ref(false)
const error   = ref('')
const modal   = reactive({ show: false, tenant: null })
const form    = reactive({ plan: 'basic', isActive: true, expiresAt: '', maxDevices: 0 })

const createModal = reactive({ show: false })
const createForm  = reactive({
  businessName: '', contactPerson: '', username: '', password: '',
  email: '', phone: '', city: '', taxNumber: '', address: '', moduleCodes: [],
})

function openCreate() {
  Object.assign(createForm, {
    businessName: '', contactPerson: '', username: '', password: '',
    email: '', phone: '', city: '', taxNumber: '', address: '', moduleCodes: [],
  })
  error.value = ''
  createModal.show = true
}

async function createTenant() {
  if (!createForm.businessName || !createForm.username || !createForm.password) {
    error.value = 'İşletme adı, kullanıcı adı ve şifre zorunlu.'
    return
  }
  saving.value = true
  error.value  = ''
  try {
    await api.register({ ...createForm })
    createModal.show = false
    await load()
  } catch (e) {
    error.value = e.response?.data?.message || 'Müşteri oluşturulurken hata oluştu.'
  } finally {
    saving.value = false
  }
}

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return tenants.value.filter(t =>
    t.businessName.toLowerCase().includes(q) ||
    t.email.toLowerCase().includes(q)
  )
})

const activeCount  = computed(() => tenants.value.filter(t =>
  t.isActive && !isExpired(t.expiresAt)).length)
const trialCount   = computed(() => tenants.value.filter(t =>
  t.plan === 'basic').length)
const expiredCount = computed(() => tenants.value.filter(t =>
  isExpired(t.expiresAt)).length)

async function deleteTenant(t) {
  if (!confirm(`"${t.businessName}" müşterisi ve tüm verileri kalıcı olarak silinecek. Emin misiniz?`)) return
  try {
    await api.deleteTenant(t.id)
    await load()
  } catch (e) {
    alert(e.response?.data?.message || 'Silinemedi.')
  }
}

async function load() {
  loading.value = true
  try {
    tenants.value = (await api.getAllTenants()).data
  } finally {
    loading.value = false
  }
}

function openEdit(t) {
  modal.tenant   = t
  form.plan      = t.plan
  form.isActive  = t.isActive
  form.expiresAt = t.expiresAt
    ? new Date(t.expiresAt).toISOString().split('T')[0]
    : ''
  form.maxDevices = t.maxDevices ?? 0
  modal.show = true
  error.value = ''
}

async function save() {
  saving.value = true
  error.value  = ''
  try {
    await api.updateSubscription(modal.tenant.id, {
      plan:      form.plan,
      isActive:  form.isActive,
      expiresAt: form.expiresAt ? new Date(form.expiresAt) : null,
      maxDevices: Number(form.maxDevices) || 0
    })
    modal.show = false
    await load()
  } catch {
    error.value = 'Güncelleme sırasında hata oluştu.'
  } finally {
    saving.value = false
  }
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('tr-TR')
}

function isExpired(d) {
  if (!d) return false
  return new Date(d) < new Date()
}

function isDueSoon(d) {
  if (!d) return false
  const diff = new Date(d) - new Date()
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000
}

function getPlanLabel(p) {
  return { basic: 'Basic', pro: 'Pro' }[p] || p
}

function getPlanColor(p) {
  return {
    basic: 'bg-blue-100 text-blue-600',
    pro:   'bg-purple-100 text-purple-600'
  }[p] || 'bg-gray-100 text-gray-600'
}

onMounted(load)
</script>