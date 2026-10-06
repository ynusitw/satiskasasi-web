<template>
  <div class="p-8">

    <!-- Başlık -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="page-title">Lisans</h1>
        <p class="page-subtitle">
          Kasadan gelen lisans başvuruları, verilen lisanslar ve modül yönetimi
        </p>
      </div>
      <button @click="load"
              class="btn-primary">
        Yenile
      </button>
    </div>

    <!-- Sekmeler -->
    <div class="flex gap-1 mb-6 border-b border-gray-200">
      <RouterLink v-for="t in tabs" :key="t.key" :to="t.to"
                  class="px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors"
                  :class="tab === t.key
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted hover:text-primary'">
        {{ t.label }}
        <span class="ml-1.5 text-xs px-2 py-0.5 rounded-full"
              :class="tab === t.key ? 'bg-accent text-white' : 'bg-gray-100 text-muted'">
          {{ t.count }}
        </span>
      </RouterLink>
    </div>

    <div v-if="loadError" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
      {{ loadError }}
    </div>

    <div v-if="loading" class="bg-white rounded-2xl shadow-sm py-16 text-center text-muted">
      Yükleniyor...
    </div>

    <!-- ── AKTİF LİSANSLAR ─────────────────────────────────────────── -->
    <div v-else-if="tab === 'aktif'" class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div class="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
        <span class="text-sm font-semibold text-primary">
          Verilen lisanslar <span class="text-muted font-normal">({{ activeList.length }})</span>
        </span>
        <label class="flex items-center gap-2 text-xs text-muted cursor-pointer">
          <input type="checkbox" v-model="showRevoked" class="w-4 h-4"/>
          İptal edilenleri de göster
        </label>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-6 py-3 text-[11px] font-semibold text-muted uppercase">Müşteri</th>
              <th class="text-left px-6 py-3 text-[11px] font-semibold text-muted uppercase">Cihaz</th>
              <th class="text-left px-6 py-3 text-[11px] font-semibold text-muted uppercase">Tip</th>
              <th class="text-left px-6 py-3 text-[11px] font-semibold text-muted uppercase">Bitiş</th>
              <th class="text-left px-6 py-3 text-[11px] font-semibold text-muted uppercase">Son Bağlantı</th>
              <th class="text-left px-6 py-3 text-[11px] font-semibold text-muted uppercase">Durum</th>
              <th class="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in activeList" :key="l.id"
                class="border-t border-gray-50 hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 font-semibold text-primary">{{ l.tenantName }}</td>
              <td class="px-6 py-4 text-xs font-mono text-muted">
                {{ l.deviceId.slice(0, 16) }}…
                <div class="text-xs font-sans">{{ l.deviceInfo }}</div>
              </td>
              <td class="px-6 py-4 text-sm">{{ typeLabel(l.licenseType) }}</td>
              <td class="px-6 py-4 text-sm">
                {{ l.expiresAt ? formatDate(l.expiresAt) : 'Süresiz' }}
              </td>
              <!-- Kasa periyodik haber veriyor: iptal etmeden önce
                   gönderilmemiş kayıt var mı, buradan görülür. -->
              <td class="px-6 py-4 text-sm">
                <template v-if="l.lastSeenAt">
                  <div :class="staleClass(l.lastSeenAt)">{{ formatDateTime(l.lastSeenAt) }}</div>
                  <div v-if="l.pendingCount > 0" class="text-xs font-bold text-danger">
                    {{ l.pendingCount }} kayıt gönderilmedi
                  </div>
                </template>
                <span v-else class="text-muted">—</span>
              </td>
              <td class="px-6 py-4">
                <span :class="statusClass(l)" class="text-xs font-bold px-3 py-1 rounded-full">
                  {{ statusLabel(l) }}
                </span>
              </td>
              <td class="px-6 py-4 text-right whitespace-nowrap">
                <button @click="openModules(l)"
                        class="chip-accent">
                  Modüller
                </button>
                <button v-if="l.isActive" @click="revoke(l)"
                        class="chip-danger ml-2">
                  İptal Et
                </button>
              </td>
            </tr>
            <tr v-if="!activeList.length">
              <td colspan="7" class="text-center py-12 text-muted">Henüz lisans verilmemiş</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── BEKLEYEN / REDDEDİLEN ───────────────────────────────────── -->
    <div v-else class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-6 py-3 text-[11px] font-semibold text-muted uppercase">Cihaz</th>
              <th class="text-left px-6 py-3 text-[11px] font-semibold text-muted uppercase">İstenen Firma</th>
              <th class="text-left px-6 py-3 text-[11px] font-semibold text-muted uppercase">Başvuru</th>
              <th v-if="tab === 'reddedilen'"
                  class="text-left px-6 py-3 text-[11px] font-semibold text-muted uppercase">Ret Sebebi</th>
              <th class="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in requestList" :key="r.id"
                class="border-t border-gray-50 hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 text-xs font-mono text-muted">
                {{ r.deviceId.slice(0, 16) }}…
                <div class="text-xs font-sans">{{ r.deviceInfo || '—' }}</div>
              </td>
              <!-- Kasa hangi hesapla başvurduysa firması burada görünür -->
              <td class="px-6 py-4 text-sm">
                <template v-if="r.requestedBusinessName">
                  <div class="font-semibold text-primary">{{ r.requestedBusinessName }}</div>
                  <div class="text-xs text-muted">{{ r.requestedUsername }}</div>
                </template>
                <span v-else class="text-muted">—</span>
              </td>
              <td class="px-6 py-4 text-sm">{{ formatDateTime(r.requestedAt) }}</td>
              <td v-if="tab === 'reddedilen'" class="px-6 py-4 text-sm text-muted">
                {{ r.note || '—' }}
              </td>
              <td class="px-6 py-4 text-right whitespace-nowrap">
                <button @click="openApprove(r)"
                        class="chip-success">
                  {{ tab === 'reddedilen' ? 'Aktif Et' : 'Onayla' }}
                </button>
                <button v-if="tab === 'bekleyen'" @click="reject(r)"
                        class="chip-danger ml-2">
                  Reddet
                </button>
              </td>
            </tr>
            <tr v-if="!requestList.length">
              <td :colspan="tab === 'reddedilen' ? 5 : 4" class="text-center py-12 text-muted">
                {{ tab === 'reddedilen' ? 'Reddedilmiş başvuru yok' : 'Bekleyen başvuru yok' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── ONAY MODALI ─────────────────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="approveModal.show"
           class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
          <h2 class="modal-title mb-1">Lisansı Tanımla</h2>
          <p class="text-xs font-mono text-muted mb-6">{{ approveModal.request?.deviceId }}</p>

          <div class="space-y-4">
            <!-- Müşteri: mevcuttan seç ya da yeni oluştur -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-sm font-semibold">Müşteri *</label>
                <button @click="newTenant = !newTenant" class="text-xs text-accent hover:underline">
                  {{ newTenant ? 'Mevcut müşteriden seç' : '+ Yeni müşteri oluştur' }}
                </button>
              </div>

              <p v-if="!newTenant && approveModal.request?.requestedBusinessName"
                 class="text-xs text-muted mb-1">
                Kasa bu firmayı bildirdi: <b>{{ approveModal.request.requestedBusinessName }}</b>
                ({{ approveModal.request.requestedUsername }})
              </p>

              <select v-if="!newTenant" v-model="form.tenantId"
                      class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white">
                <option :value="null" disabled>Müşteri seçin</option>
                <option v-for="t in tenants" :key="t.id" :value="t.id">{{ t.businessName }}</option>
              </select>

              <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                <input v-model="tenantForm.businessName" placeholder="İşletme adı *"
                       class="px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
                <input v-model="tenantForm.contactPerson" placeholder="Yetkili kişi"
                       class="px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
                <input v-model="tenantForm.username" placeholder="Kullanıcı adı *"
                       class="px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
                <input v-model="tenantForm.password" type="text" placeholder="Şifre *"
                       class="px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
                <input v-model="tenantForm.email" placeholder="E-posta"
                       class="px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
                <input v-model="tenantForm.phone" placeholder="Telefon"
                       class="px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="field-label">Lisans Tipi</label>
                <select v-model="form.licenseType"
                        class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white">
                  <option value="Full">Tam (süresiz)</option>
                  <option value="Demo">Demo (14 gün)</option>
                  <option value="Limited">Sınırlı (gün seç)</option>
                </select>
              </div>

              <div v-if="form.licenseType === 'Limited'">
                <label class="field-label">Gün Sayısı</label>
                <input v-model.number="form.days" type="number" min="1"
                       class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
              </div>
            </div>

            <!-- Modüller müşteriye aittir: tüm kasalarını ve web panelini kapsar -->
            <div v-if="form.tenantId || newTenant" class="pt-4 border-t border-gray-100">
              <div v-if="modulesLoading" class="text-sm text-muted py-2">Modüller yükleniyor...</div>
              <ModulePicker v-else v-model="form.moduleCodes"/>
              <p class="text-xs text-muted mt-2">
                Bu seçim müşterinin tüm kasalarında ve web panelinde geçerlidir.
              </p>
            </div>
          </div>

          <div v-if="error" class="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>

          <div class="flex gap-3 mt-6 justify-end">
            <button @click="approveModal.show = false"
                    class="btn-secondary">
              Vazgeç
            </button>
            <button @click="approve" :disabled="saving || (!form.tenantId && !newTenant)"
                    class="btn-primary disabled:opacity-50">
              {{ saving ? 'Kaydediliyor...' : 'Lisansı Ver' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── MODÜL MODALI (aktif lisans) ─────────────────────────────── -->
    <Teleport to="body">
      <div v-if="moduleModal.show"
           class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
          <h2 class="modal-title mb-1">Modüller</h2>
          <p class="text-sm text-muted mb-6">{{ moduleModal.license?.tenantName }}</p>

          <div v-if="modulesLoading" class="text-sm text-muted py-4">Modüller yükleniyor...</div>
          <ModulePicker v-else v-model="moduleModal.codes"/>

          <p class="text-xs text-muted mt-3">
            Değişiklik müşterinin bütün kasalarında geçerli olur; kasalar birkaç saniye
            içinde kendiliğinden güncellenir.
          </p>

          <div v-if="error" class="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>

          <div class="flex gap-3 mt-6 justify-end">
            <button @click="moduleModal.show = false"
                    class="btn-secondary">
              Vazgeç
            </button>
            <button @click="saveModules" :disabled="saving || modulesLoading"
                    class="btn-primary disabled:opacity-50">
              {{ saving ? 'Kaydediliyor...' : 'Kaydet' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../api/api'
import ModulePicker from '../../components/ModulePicker.vue'

// Lisansın hayatı tek sayfada: başvuru → onay → aktif. Sekmeler adres
// çubuğuna da yazılır ki menüden doğrudan girilebilsin.
const route = useRoute()
const tab = computed(() => {
  const t = route.path.split('/').pop()
  return ['aktif', 'bekleyen', 'reddedilen'].includes(t) ? t : 'aktif'
})

const licenses = ref([])
const pending  = ref([])
const rejected = ref([])
const tenants  = ref([])

const loading  = ref(true)
const saving   = ref(false)
const error     = ref('')
const loadError = ref('')
const showRevoked = ref(false)

const tabs = computed(() => [
  { key: 'aktif',      label: 'Aktif Lisanslar',      to: '/superadmin/lisans/aktif',      count: licenses.value.filter(l => l.isActive).length },
  { key: 'bekleyen',   label: 'Bekleyen Lisanslar',   to: '/superadmin/lisans/bekleyen',   count: pending.value.length },
  { key: 'reddedilen', label: 'Reddedilen Lisanslar', to: '/superadmin/lisans/reddedilen', count: rejected.value.length },
])

const activeList = computed(() =>
  showRevoked.value ? licenses.value : licenses.value.filter(l => l.isActive))

const requestList = computed(() => tab.value === 'bekleyen' ? pending.value : rejected.value)

// ── Yükleme ──────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  try {
    const [l, reqs, t] = await Promise.all([
      api.getLicenses(),
      api.getLicenseRequests('all'),
      api.getAllTenants(),
    ])
    licenses.value = l.data
    pending.value  = reqs.data.filter(r => r.status === 'Pending')
    rejected.value = reqs.data.filter(r => r.status === 'Rejected')
    tenants.value  = t.data
    loadError.value = ''
  } catch (e) {
    loadError.value = e.response?.data?.message || 'Lisans bilgileri alınamadı.'
  } finally {
    loading.value = false
  }
}

onMounted(load)

// ── Onay / aktif etme ────────────────────────────────────────────────
const approveModal = reactive({ show: false, request: null })
const newTenant = ref(false)
const modulesLoading = ref(false)
const form = reactive({ tenantId: null, licenseType: 'Demo', days: 30, moduleCodes: [] })
const tenantForm = reactive({
  businessName: '', contactPerson: '', username: '', password: '', email: '', phone: '',
})

function openApprove(r) {
  approveModal.request = r
  // Kasanın bildirdiği firma varsa hazır seçili gelir.
  form.tenantId    = r.requestedTenantId ?? null
  form.licenseType = 'Demo'
  form.days        = 30
  form.moduleCodes = []
  newTenant.value  = false
  Object.assign(tenantForm, {
    businessName: r.requestedBusinessName || '', contactPerson: '',
    username: r.requestedUsername || '', password: '', email: '', phone: '',
  })
  error.value = ''
  approveModal.show = true
}

// Müşteri seçilince mevcut modülleri işaretli gelsin — yönetici yalnızca
// değiştirmek istediğine dokunsun, var olanları yanlışlıkla silmesin.
watch(() => form.tenantId, async (tid) => {
  form.moduleCodes = []
  if (!tid || newTenant.value) return
  modulesLoading.value = true
  try {
    const res = await api.getTenantModules(tid)
    form.moduleCodes = res.data.map(m => m.moduleCode)
  } catch {
    error.value = 'Müşterinin modülleri alınamadı.'
  } finally {
    modulesLoading.value = false
  }
})

async function approve() {
  saving.value = true
  error.value  = ''
  try {
    let tenantId = form.tenantId

    // Lisansa yeni müşteri tanımlanıyorsa önce müşteri açılır.
    if (newTenant.value) {
      if (!tenantForm.businessName || !tenantForm.username || !tenantForm.password) {
        error.value = 'İşletme adı, kullanıcı adı ve şifre zorunlu.'
        return
      }
      const res = await api.register({ ...tenantForm, moduleCodes: form.moduleCodes })
      tenantId = res.data?.tenantId ?? res.data?.id
      if (!tenantId) {
        error.value = 'Müşteri oluşturuldu ama kimliği alınamadı. Listeyi yenileyip tekrar deneyin.'
        return
      }
    }

    await api.approveLicense(approveModal.request.id, {
      tenantId,
      licenseType: form.licenseType,
      days: form.days,
      moduleCodes: form.moduleCodes,
    })
    approveModal.show = false
    await load()
  } catch (e) {
    error.value = e.response?.data?.message || 'Lisans verilirken hata oluştu.'
  } finally {
    saving.value = false
  }
}

async function reject(r) {
  const note = prompt('Ret sebebi (opsiyonel):') || ''
  if (!confirm('Bu başvuru reddedilsin mi?')) return
  await api.rejectLicense(r.id, { note })
  await load()
}

// ── Modüller (aktif lisans) ──────────────────────────────────────────
const moduleModal = reactive({ show: false, license: null, codes: [] })

async function openModules(l) {
  moduleModal.license = l
  moduleModal.codes = []
  error.value = ''
  moduleModal.show = true
  modulesLoading.value = true
  try {
    const res = await api.getTenantModules(l.tenantId)
    moduleModal.codes = res.data.map(m => m.moduleCode)
  } catch {
    error.value = 'Modüller alınamadı.'
  } finally {
    modulesLoading.value = false
  }
}

async function saveModules() {
  saving.value = true
  error.value  = ''
  try {
    await api.setTenantModules(moduleModal.license.tenantId, moduleModal.codes)
    moduleModal.show = false
  } catch (e) {
    error.value = e.response?.data?.message || 'Modüller kaydedilemedi.'
  } finally {
    saving.value = false
  }
}

// ── İptal ────────────────────────────────────────────────────────────
// Gönderilmemiş kayıt varsa iptal etmek veri kaybı demek: iptal edilen kasa
// bir daha giriş yapamaz, dolayısıyla o kayıtları hiç gönderemez.
async function revoke(l) {
  if (l.pendingCount > 0 && !confirm(
      `DİKKAT: Bu kasada gönderilmemiş ${l.pendingCount} kayıt var (satış / Z raporu).\n\n` +
      'Lisans iptal edilirse kasa giriş yapamaz ve bu kayıtlar sunucuya hiç ulaşmaz.\n\n' +
      'Yine de devam edilsin mi?')) return

  if (!confirm(`${l.tenantName} — bu cihazın lisansı iptal edilsin mi?`)) return
  await api.revokeLicense(l.id)
  await load()
}

// ── Görsel yardımcılar ───────────────────────────────────────────────
function typeLabel(t) {
  return { Full: 'Tam', Demo: 'Demo', Limited: 'Sınırlı' }[t] || t
}

function isExpired(l) {
  return !!l.expiresAt && new Date(l.expiresAt) < new Date()
}

function statusLabel(l) {
  if (!l.isActive) return 'İptal'
  return isExpired(l) ? 'Süresi doldu' : 'Aktif'
}

function statusClass(l) {
  if (!l.isActive) return 'bg-red-100 text-red-600'
  return isExpired(l) ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-600'
}

function staleClass(lastSeenAt) {
  const hours = (Date.now() - new Date(lastSeenAt).getTime()) / 3600000
  return hours > 24 ? 'text-danger font-semibold' : 'text-muted'
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('tr-TR')
}

function formatDateTime(d) {
  return new Date(d).toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}
</script>
