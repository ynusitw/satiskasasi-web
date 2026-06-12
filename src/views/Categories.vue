<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-primary">Kategoriler</h1>
      <button @click="openCreate" class="px-5 py-2 bg-accent text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors">+ Yeni Kategori</button>
    </div>
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Kategori</th>
            <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Renk</th>
            <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Sıra</th>
            <th class="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="4" class="text-center py-12 text-muted">Yükleniyor...</td></tr>
          <tr v-for="c in categories" :key="c.id" class="border-t border-gray-50 hover:bg-gray-50">
            <td class="px-6 py-4 font-semibold flex items-center gap-3">
              <span class="w-4 h-4 rounded-full" :style="{background: c.colorHex}"></span>
              {{ c.name }}
            </td>
            <td class="px-6 py-4 font-mono text-sm text-muted">{{ c.colorHex }}</td>
            <td class="px-6 py-4 text-sm">{{ c.displayOrder }}</td>
            <td class="px-6 py-4">
              <div class="flex gap-2 justify-end">
                <button @click="openEdit(c)" class="px-3 py-1 text-xs font-bold bg-blue-50 text-accent rounded-lg hover:bg-accent hover:text-white transition-colors">Düzenle</button>
                <button @click="deleteCategory(c)" class="px-3 py-1 text-xs font-bold bg-red-50 text-danger rounded-lg hover:bg-danger hover:text-white transition-colors">Sil</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <Teleport to="body">
      <div v-if="modal.show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <h2 class="text-xl font-bold mb-6">{{ modal.editing ? 'Kategoriyi Düzenle' : 'Yeni Kategori' }}</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold mb-1">Kategori Adı *</label>
              <input v-model="form.name" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-accent focus:outline-none text-sm"/>
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Renk</label>
              <div class="flex items-center gap-3">
                <input v-model="form.colorHex" type="color" class="w-12 h-10 rounded-lg border cursor-pointer"/>
                <input v-model="form.colorHex" class="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:border-accent focus:outline-none text-sm font-mono"/>
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Sıra</label>
              <input v-model="form.displayOrder" type="number" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-accent focus:outline-none text-sm"/>
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
const categories = ref([]); const loading = ref(true); const saving = ref(false); const error = ref('')
const modal = reactive({ show: false, editing: false })
const form = reactive({ id: 0, name: '', colorHex: '#3498DB', displayOrder: 0 })
async function load() { loading.value = true; categories.value = (await api.getCategories()).data; loading.value = false }
function openCreate() { Object.assign(form, { id: 0, name: '', colorHex: '#3498DB', displayOrder: 0 }); modal.editing = false; modal.show = true; error.value = '' }
function openEdit(c) { Object.assign(form, { id: c.id, name: c.name, colorHex: c.colorHex, displayOrder: c.displayOrder }); modal.editing = true; modal.show = true; error.value = '' }
async function save() {
  if (!form.name.trim()) { error.value = 'Kategori adı zorunludur.'; return }
  saving.value = true; error.value = ''
  try { modal.editing ? await api.updateCategory(form.id, form) : await api.createCategory(form); modal.show = false; await load() }
  catch (e) { error.value = e.response?.data?.message || e.response?.data?.title || e.message || 'Hata oluştu.' } finally { saving.value = false }
}
async function deleteCategory(c) {
  if (!confirm(`"${c.name}" silinsin mi?`)) return
  try { await api.deleteCategory(c.id); await load() } catch { alert('Bu kategoride ürün var, silinemez.') }
}
onMounted(load)
</script>
