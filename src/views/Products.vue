<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-primary">Ürünler</h1>
      <button @click="openCreate" class="px-5 py-2 bg-accent text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors">+ Yeni Ürün</button>
    </div>
    <div class="mb-4 flex gap-3">
      <input v-model="search" placeholder="Ürün ara..." class="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-accent focus:outline-none w-64"/>
      <select v-model="filterCategory" class="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-accent focus:outline-none">
        <option value="">Tüm Kategoriler</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </div>
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Ürün</th>
            <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Barkod</th>
            <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Kategori</th>
            <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Fiyat</th>
            <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Stok</th>
            <th class="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="6" class="text-center py-12 text-muted">Yükleniyor...</td></tr>
          <tr v-for="p in filtered" :key="p.id" class="border-t border-gray-50 hover:bg-gray-50">
            <td class="px-6 py-4 font-semibold">{{ p.name }}</td>
            <td class="px-6 py-4 font-mono text-sm text-muted">{{ p.barcode || '—' }}</td>
            <td class="px-6 py-4 text-sm">
              <span v-if="p.categoryName" class="px-2 py-1 rounded-full text-xs font-bold"
                :style="{ background: (categoryMap[p.categoryId]?.colorHex || '#eee') + '22', color: categoryMap[p.categoryId]?.colorHex || '#666' }">
                {{ p.categoryName }}
              </span>
              <span v-else class="text-muted">—</span>
            </td>
            <td class="px-6 py-4 font-bold text-success">{{ fmt(p.price) }}</td>
            <td class="px-6 py-4">
              <span :class="p.currentStock <= p.minimumStock ? 'text-danger font-bold' : 'text-primary'">{{ p.currentStock }}</span>
            </td>
            <td class="px-6 py-4">
              <div class="flex gap-2 justify-end">
                <button @click="openEdit(p)" class="px-3 py-1 text-xs font-bold bg-blue-50 text-accent rounded-lg hover:bg-accent hover:text-white transition-colors">Düzenle</button>
                <button @click="deleteProduct(p)" class="px-3 py-1 text-xs font-bold bg-red-50 text-danger rounded-lg hover:bg-danger hover:text-white transition-colors">Sil</button>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && filtered.length === 0">
            <td colspan="6" class="text-center py-12 text-muted">Ürün bulunamadı</td>
          </tr>
        </tbody>
      </table>
    </div>
    <Teleport to="body">
      <div v-if="modal.show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 max-h-[90vh] overflow-y-auto">
          <h2 class="text-xl font-bold mb-6">{{ modal.editing ? 'Ürünü Düzenle' : 'Yeni Ürün' }}</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold mb-1">Ürün Adı *</label>
              <input v-model="form.name" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-accent focus:outline-none text-sm"/>
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Barkod</label>
              <input v-model="form.barcode" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-accent focus:outline-none text-sm font-mono"/>
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Kategori</label>
              <select v-model="form.categoryId" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-accent focus:outline-none text-sm">
                <option :value="null">Kategori Seçin</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold mb-1">Fiyat *</label>
                <input v-model="form.price" type="number" step="0.01" min="0" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-accent focus:outline-none text-sm"/>
              </div>
              <div>
                <label class="block text-sm font-semibold mb-1">Stok</label>
                <input v-model="form.currentStock" type="number" min="0" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-accent focus:outline-none text-sm"/>
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Kritik Stok Seviyesi</label>
              <input v-model="form.minimumStock" type="number" min="0" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-accent focus:outline-none text-sm"/>
            </div>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.isActive" type="checkbox" class="w-4 h-4"/>
              <span class="text-sm font-semibold">Aktif</span>
            </label>
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
import { ref, computed, onMounted, reactive } from 'vue'
import api from '../api/api'
const products = ref([]); const categories = ref([]); const loading = ref(true); const saving = ref(false); const error = ref('')
const search = ref(''); const filterCategory = ref('')
const modal = reactive({ show: false, editing: false })
const form = reactive({ id: 0, name: '', barcode: '', categoryId: null, price: 0, vatRate: 0, currentStock: 0, minimumStock: 5, isActive: true })
const categoryMap = computed(() => Object.fromEntries(categories.value.map(c => [c.id, c])))
const filtered = computed(() => products.value.filter(p => {
  const matchSearch = !search.value || p.name.toLowerCase().includes(search.value.toLowerCase()) || (p.barcode || '').includes(search.value)
  const matchCat = !filterCategory.value || p.categoryId === filterCategory.value
  return matchSearch && matchCat
}))
function fmt(v) { return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(v ?? 0) + ' ₺' }
async function load() {
  loading.value = true
  const [prod, cats] = await Promise.all([api.getProducts(), api.getCategories()])
  products.value = prod.data; categories.value = cats.data
  loading.value = false
}
function openCreate() { Object.assign(form, { id: 0, name: '', barcode: '', categoryId: null, price: 0, vatRate: 0, currentStock: 0, minimumStock: 5, isActive: true }); modal.editing = false; modal.show = true; error.value = '' }
function openEdit(p) { Object.assign(form, { ...p }); modal.editing = true; modal.show = true; error.value = '' }
async function save() {
  if (!form.name.trim()) { error.value = 'Ürün adı zorunludur.'; return }
  if (form.price < 0) { error.value = 'Fiyat geçersiz.'; return }
  saving.value = true; error.value = ''
  try { modal.editing ? await api.updateProduct(form.id, form) : await api.createProduct(form); modal.show = false; await load() }
  catch (e) { error.value = e.response?.data?.message || e.response?.data?.title || e.message || 'Hata oluştu.' } finally { saving.value = false }
}
async function deleteProduct(p) {
  if (!confirm(`"${p.name}" silinsin mi?`)) return
  try { await api.deleteProduct(p.id); await load() } catch { alert('Ürün silinemedi.') }
}
onMounted(load)
</script>
