<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="page-title">Kategoriler</h1>
      <button @click="openCreate" class="btn-primary">+ Yeni Kategori</button>
    </div>
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left px-6 py-3 text-[11px] font-semibold text-muted uppercase">Kategori</th>
            <th class="text-left px-6 py-3 text-[11px] font-semibold text-muted uppercase">Renk</th>
            <th class="text-left px-6 py-3 text-[11px] font-semibold text-muted uppercase">Sıra</th>
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
                <button @click="openEdit(c)" class="chip-accent">Düzenle</button>
                <button @click="deleteCategory(c)" class="chip-danger">Sil</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <Teleport to="body">
      <div v-if="modal.show" class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <h2 class="modal-title mb-6">{{ modal.editing ? 'Kategoriyi Düzenle' : 'Yeni Kategori' }}</h2>
          <div class="space-y-4">
            <div>
              <label class="field-label">Kategori Adı *</label>
              <input v-model="form.name" class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
            </div>
            <div>
              <label class="field-label">Renk</label>
              <div class="flex items-center gap-3">
                <input v-model="form.colorHex" type="color" class="w-12 h-10 rounded-lg border cursor-pointer"/>
                <input v-model="form.colorHex" class="flex-1 px-3 border border-gray-200 rounded-lg text-[13.5px] font-mono h-10 bg-white"/>
              </div>
            </div>
            <div>
              <label class="field-label">Sıra</label>
              <input v-model="form.displayOrder" type="number" class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
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
import { ref, onMounted, reactive } from 'vue'
import api from '../api/api'
const categories = ref([]); const loading = ref(true); const saving = ref(false); const error = ref('')
const modal = reactive({ show: false, editing: false })
const form = reactive({ id: 0, name: '', colorHex: '#3498DB', displayOrder: 0 })
async function load() { loading.value = true; categories.value = (await api.getCategories()).data; loading.value = false }
function openCreate() {
  const nextOrder = categories.value.length
    ? Math.max(...categories.value.map(c => c.displayOrder)) + 1
    : 1
  Object.assign(form, { id: 0, name: '', colorHex: '#3498DB', displayOrder: nextOrder })
  modal.editing = false; modal.show = true; error.value = ''
}
function openEdit(c) { Object.assign(form, { id: c.id, name: c.name, colorHex: c.colorHex, displayOrder: c.displayOrder }); modal.editing = true; modal.show = true; error.value = '' }
async function save() {
  if (!form.name.trim()) { error.value = 'Kategori adı zorunludur.'; return }
  const others = categories.value.filter(c => c.id !== form.id)
  if (others.some(c => c.name.trim().toLowerCase() === form.name.trim().toLowerCase()))
    { error.value = 'Bu isimde bir kategori zaten kayıtlı.'; return }
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
