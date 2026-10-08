<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="page-title">Kullanıcılar</h1>
      <button @click="openCreate" class="btn-primary">+ Yeni Kullanıcı</button>
    </div>

    <!-- Personel satışı: kasadaki "İndirimli" seçeneğinin oranı -->
    <div class="bg-white rounded-2xl shadow-sm p-5 mb-6 flex flex-wrap items-center gap-4">
      <div class="flex-1 min-w-[240px]">
        <div class="font-semibold text-primary text-sm">Personel Satışı</div>
        <div class="text-xs text-muted mt-0.5">
          Kasada personele "Ücretsiz" ya da bu oranda "İndirimli" satış yapılabilir.
          Personel satışları stoktan düşer ama Z raporunda ciroya karışmaz.
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-muted">İndirim oranı</span>
        <span class="text-sm font-semibold">%</span>
        <input v-model.number="staffPercent" type="number" min="1" max="99"
               class="w-20 px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
        <button @click="saveStaff" :disabled="staffSaving"
                class="btn-primary disabled:opacity-50">
          {{ staffSaving ? '...' : 'Kaydet' }}
        </button>
        <span v-if="staffSaved" class="text-xs text-green-600">Kaydedildi</span>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left px-6 py-3 text-[11px] font-semibold text-muted uppercase">Kullanıcı</th>
            <th class="text-left px-6 py-3 text-[11px] font-semibold text-muted uppercase">Rol</th>
            <th class="text-left px-6 py-3 text-[11px] font-semibold text-muted uppercase">Durum</th>
            <th class="text-left px-6 py-3 text-[11px] font-semibold text-muted uppercase">Yetkiler</th>
            <th class="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="5" class="text-center py-12 text-muted">Yükleniyor...</td></tr>
          <tr v-for="u in users" :key="u.id" class="border-t border-gray-50 hover:bg-gray-50">
            <td class="px-6 py-4 font-semibold">{{ u.username }}</td>
            <td class="px-6 py-4">
              <span :class="u.isAdmin ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'" class="text-xs font-bold px-3 py-1 rounded-full">
                {{ u.isAdmin ? 'Admin' : 'Kasiyer' }}
              </span>
            </td>
            <td class="px-6 py-4">
              <span :class="u.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'" class="text-xs font-bold px-3 py-1 rounded-full">
                {{ u.isActive ? 'Aktif' : 'Pasif' }}
              </span>
              <span v-if="u.twoFactorEnabled" class="chip-success ml-1" title="İki adımlı doğrulama açık">2FA</span>
            </td>
            <td class="px-6 py-4 text-xs text-muted">
              {{ [u.canTakePayment && 'Ödeme', u.canAccessMenu && 'Menü', u.canClearCart && 'Sepet', u.canAccessCashZReport && 'Rapor'].filter(Boolean).join(', ') }}
            </td>
            <td class="px-6 py-4">
              <div class="flex gap-2 justify-end">
                <button @click="openEdit(u)" class="chip-accent">Düzenle</button>
                <button v-if="u.twoFactorEnabled" @click="resetTwoFactor(u)" class="chip-neutral"
                        title="Telefonunu kaybeden kullanıcı için: 2FA kapatılır, yeniden kurabilir">2FA Sıfırla</button>
                <button @click="deleteUser(u)" class="chip-danger">Sil</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <Teleport to="body">
      <div v-if="modal.show" class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <h2 class="modal-title mb-6">{{ modal.editing ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı' }}</h2>
          <div class="space-y-4">
            <div>
              <label class="field-label">Kullanıcı Adı *</label>
              <input v-model="form.username" class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
            </div>
            <div>
              <label class="field-label">Şifre *</label>
              <input v-model="form.password" type="password" class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
            </div>
            <div class="flex gap-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.isAdmin" type="checkbox" class="w-4 h-4"/>
                <span class="text-sm font-semibold">Admin</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.isActive" type="checkbox" class="w-4 h-4"/>
                <span class="text-sm font-semibold">Aktif</span>
              </label>
            </div>
            <div>
              <p class="text-sm font-semibold mb-2">Yetkiler</p>
              <div class="space-y-2">
                <label v-for="p in permissions" :key="p.key" class="flex items-center gap-2 cursor-pointer">
                  <input v-model="form[p.key]" type="checkbox" class="w-4 h-4"/>
                  <span class="text-sm">{{ p.label }}</span>
                </label>
              </div>
            </div>

            <!-- Yönetici onayı: kasada indirim / ikram / personel satışı -->
            <div class="pt-4 border-t border-gray-100">
              <p class="text-sm font-semibold mb-1">Yönetici Onayı</p>
              <p class="text-xs text-muted mb-3">
                Kasada indirim, ikram ve personel satışı bu PIN ile onaylanır.
                Admin kullanıcılar her zaman onaylayabilir.
              </p>
              <label class="flex items-center gap-2 cursor-pointer mb-3">
                <input v-model="form.canApproveAdjustments" type="checkbox" class="w-4 h-4"
                       :disabled="form.isAdmin"/>
                <span class="text-sm">İndirim / ikram onaylayabilir
                  <span v-if="form.isAdmin" class="text-xs text-muted">(admin — zaten yetkili)</span>
                </span>
              </label>

              <div v-if="form.isAdmin || form.canApproveAdjustments">
                <label class="field-label-muted">
                  PIN (4-8 rakam)
                  <span v-if="form.hasManagerPin && !removePin" class="text-green-600 font-normal">
                    — tanımlı; değiştirmek için yenisini yazın
                  </span>
                </label>
                <div class="flex gap-2 items-center">
                  <input v-model="form.managerPin" type="password" inputmode="numeric"
                         maxlength="8" autocomplete="new-password" :disabled="removePin"
                         :placeholder="form.hasManagerPin ? '••••' : 'Örn. 4821'"
                         class="w-40 px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
                  <label v-if="form.hasManagerPin" class="flex items-center gap-1 text-xs text-red-600">
                    <input v-model="removePin" type="checkbox"/> PIN'i kaldır
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div v-if="error" class="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>
          <div class="flex gap-3 mt-6 justify-end">
            <button @click="modal.show = false" class="btn-secondary">İptal</button>
            <button @click="save" :disabled="saving" class="btn-primary disabled:opacity-50">{{ saving ? 'Kaydediliyor...' : 'Kaydet' }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
<script setup>
import { uiAlert, uiConfirm } from '../utils/dialog'
import { ref, onMounted, reactive } from 'vue'
import api from '../api/api'
const users = ref([]); const loading = ref(true); const saving = ref(false); const error = ref('')
const modal = reactive({ show: false, editing: false })
const EMPTY = { id: 0, username: '', password: '', isAdmin: false, isActive: true, canTakePayment: true, canAccessMenu: true, canClearCart: false, canChangeQuantity: false, canAccessCashZReport: false, canApproveAdjustments: false, hasManagerPin: false, managerPin: '' }
const form = reactive({ ...EMPTY })
// PIN kaldırma ayrı bir onay: boş PIN kutusu "değiştirme" anlamına gelir.
const removePin = ref(false)
const permissions = [
  { key: 'canTakePayment', label: 'Ödeme alabilir' },
  { key: 'canAccessMenu', label: 'Menüye erişebilir' },
  { key: 'canClearCart', label: 'Sepeti temizleyebilir' },
  { key: 'canChangeQuantity', label: 'Miktar değiştirebilir' },
  { key: 'canAccessCashZReport', label: 'Kasa/Z-Raporu görebilir' },
]
async function load() { loading.value = true; users.value = (await api.getUsers()).data; loading.value = false }
function openCreate() { Object.assign(form, { ...EMPTY }); removePin.value = false; modal.editing = false; modal.show = true; error.value = '' }
function openEdit(u) { Object.assign(form, { ...EMPTY, ...u, password: '', managerPin: '' }); removePin.value = false; modal.editing = true; modal.show = true; error.value = '' }

// Sunucuya giden gövde. managerPin: null → dokunma, '' → kaldır, rakam → yeni PIN.
function payload() {
  const { hasManagerPin, ...body } = form
  const pin = (form.managerPin || '').trim()
  body.managerPin = removePin.value ? '' : (pin ? pin : null)
  return body
}
async function save() {
  if (!form.username.trim()) { error.value = 'Kullanıcı adı zorunludur.'; return }
  const pin = (form.managerPin || '').trim()
  if (pin && !/^\d{4,8}$/.test(pin)) { error.value = "PIN 4-8 haneli ve yalnızca rakam olmalı."; return }
  saving.value = true; error.value = ''
  try { modal.editing ? await api.updateUser(form.id, payload()) : await api.createUser(payload()); modal.show = false; await load() }
  catch (e) { error.value = e.response?.data?.message || 'Hata oluştu.' } finally { saving.value = false }
}
// Personel satışı indirim oranı
const staffPercent = ref(50); const staffSaving = ref(false); const staffSaved = ref(false)
async function loadStaff() {
  try { staffPercent.value = (await api.getStaffSettings()).data.staffDiscountPercent } catch {}
}
async function saveStaff() {
  const v = Math.min(99, Math.max(1, Math.round(Number(staffPercent.value) || 50)))
  staffPercent.value = v; staffSaving.value = true; staffSaved.value = false
  try {
    await api.saveStaffSettings({ staffDiscountPercent: v })
    staffSaved.value = true; setTimeout(() => { staffSaved.value = false }, 2500)
  } catch (e) { await uiAlert(e.response?.data?.message || 'Kaydedilemedi.') }
  finally { staffSaving.value = false }
}

async function resetTwoFactor(u) {
  if (!await uiConfirm(`"${u.username}" kullanıcısının iki adımlı doğrulaması kapatılsın mı? Bir sonraki girişte yalnızca şifre istenir; kullanıcı ayarlardan yeniden açabilir.`)) return
  try { await api.resetTwoFactor(u.id); await load() }
  catch (e) { await uiAlert(e.response?.data?.message || 'Sıfırlanamadı.') }
}
async function deleteUser(u) { if (!await uiConfirm(`"${u.username}" silinsin mi?`)) return; await api.deleteUser(u.id); await load() }
onMounted(() => { load(); loadStaff() })
</script>
