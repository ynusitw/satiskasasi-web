<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-primary">Kullanıcılar</h1>
      <button @click="openCreate" class="px-5 py-2 bg-accent text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors">+ Yeni Kullanıcı</button>
    </div>
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Kullanıcı</th>
            <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Rol</th>
            <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Durum</th>
            <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Yetkiler</th>
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
            </td>
            <td class="px-6 py-4 text-xs text-muted">
              {{ [u.canTakePayment && 'Ödeme', u.canAccessMenu && 'Menü', u.canClearCart && 'Sepet', u.canAccessCashZReport && 'Rapor'].filter(Boolean).join(', ') }}
            </td>
            <td class="px-6 py-4">
              <div class="flex gap-2 justify-end">
                <button @click="openEdit(u)" class="px-3 py-1 text-xs font-bold bg-blue-50 text-accent rounded-lg hover:bg-accent hover:text-white transition-colors">Düzenle</button>
                <button @click="deleteUser(u)" class="px-3 py-1 text-xs font-bold bg-red-50 text-danger rounded-lg hover:bg-danger hover:text-white transition-colors">Sil</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <Teleport to="body">
      <div v-if="modal.show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <h2 class="text-xl font-bold mb-6">{{ modal.editing ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı' }}</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold mb-1">Kullanıcı Adı *</label>
              <input v-model="form.username" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-accent focus:outline-none text-sm"/>
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Şifre *</label>
              <input v-model="form.password" type="password" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-accent focus:outline-none text-sm"/>
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
          </div>
          <div v-if="error" class="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>
          <div class="flex gap-3 mt-6 justify-end">
            <button @click="modal.show = false" class="px-5 py-2 bg-gray-100 rounded-xl text-sm font-bold hover:bg-gray-200">İptal</button>
            <button @click="save" :disabled="saving" class="px-5 py-2 bg-accent text-white rounded-xl text-sm font-bold hover:bg-blue-600 disabled:opacity-50">{{ saving ? 'Kaydediliyor...' : 'Kaydet' }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
<script setup>
import { ref, onMounted, reactive } from 'vue'
import api from '../api/api'
const users = ref([]); const loading = ref(true); const saving = ref(false); const error = ref('')
const modal = reactive({ show: false, editing: false })
const form = reactive({ id: 0, username: '', password: '', isAdmin: false, isActive: true, canTakePayment: true, canAccessMenu: true, canClearCart: false, canChangeQuantity: false, canAccessCashZReport: false })
const permissions = [
  { key: 'canTakePayment', label: 'Ödeme alabilir' },
  { key: 'canAccessMenu', label: 'Menüye erişebilir' },
  { key: 'canClearCart', label: 'Sepeti temizleyebilir' },
  { key: 'canChangeQuantity', label: 'Miktar değiştirebilir' },
  { key: 'canAccessCashZReport', label: 'Kasa/Z-Raporu görebilir' },
]
async function load() { loading.value = true; users.value = (await api.getUsers()).data; loading.value = false }
function openCreate() { Object.assign(form, { id: 0, username: '', password: '', isAdmin: false, isActive: true, canTakePayment: true, canAccessMenu: true, canClearCart: false, canChangeQuantity: false, canAccessCashZReport: false }); modal.editing = false; modal.show = true; error.value = '' }
function openEdit(u) { Object.assign(form, { ...u, password: '' }); modal.editing = true; modal.show = true; error.value = '' }
async function save() {
  if (!form.username.trim()) { error.value = 'Kullanıcı adı zorunludur.'; return }
  saving.value = true; error.value = ''
  try { modal.editing ? await api.updateUser(form.id, form) : await api.createUser(form); modal.show = false; await load() }
  catch { error.value = 'Hata oluştu.' } finally { saving.value = false }
}
async function deleteUser(u) { if (!confirm(`"${u.username}" silinsin mi?`)) return; await api.deleteUser(u.id); await load() }
onMounted(load)
</script>
