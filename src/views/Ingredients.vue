<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="page-title">Hammaddeler</h1>
        <p class="page-subtitle">
          Depodaki malzemeler. Ürün reçetesine eklendiklerinde satış anında buradan düşerler.
        </p>
      </div>
      <button @click="openCreate"
              class="btn-primary">
        + Yeni Hammadde
      </button>
    </div>

    <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>

    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
        <input v-model="search" placeholder="Hammadde ara..."
               class="px-3 rounded-lg border border-gray-200 text-[13.5px] w-72 h-10 bg-white"/>
        <span class="text-xs text-muted">{{ filtered.length }} kayıt</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left  px-6 py-3 text-[11px] font-semibold text-muted uppercase">Hammadde</th>
              <th class="text-left  px-6 py-3 text-[11px] font-semibold text-muted uppercase">Birim</th>
              <th class="text-right px-6 py-3 text-[11px] font-semibold text-muted uppercase">Stok</th>
              <th class="text-right px-6 py-3 text-[11px] font-semibold text-muted uppercase">Kritik</th>
              <th class="text-right px-6 py-3 text-[11px] font-semibold text-muted uppercase">Birim Maliyet</th>
              <th class="text-left  px-6 py-3 text-[11px] font-semibold text-muted uppercase">Kullanım</th>
              <th class="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center py-12 text-muted">Yükleniyor...</td>
            </tr>

            <tr v-for="i in filtered" :key="i.id"
                class="border-t border-gray-50 hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4">
                <div class="font-semibold text-primary">{{ i.name }}</div>
                <div v-if="!i.isActive" class="text-xs text-muted">Pasif</div>
              </td>
              <td class="px-6 py-4 text-sm text-muted">{{ i.unit }}</td>
              <td class="px-6 py-4 text-sm text-right font-semibold"
                  :class="i.minimumStock > 0 && i.currentStock <= i.minimumStock
                    ? 'text-danger' : 'text-primary'">
                {{ num(i.currentStock) }}
              </td>
              <td class="px-6 py-4 text-sm text-right text-muted">{{ num(i.minimumStock) }}</td>
              <td class="px-6 py-4 text-sm text-right text-muted">{{ money(i.costPerUnit) }}</td>
              <td class="px-6 py-4 text-sm text-muted">
                {{ i.usedInRecipes ? `${i.usedInRecipes} reçete` : '—' }}
              </td>
              <td class="px-6 py-4 text-right whitespace-nowrap">
                <button @click="openMovement(i)"
                        class="chip-success">
                  Stok Hareketi
                </button>
                <button @click="openEdit(i)"
                        class="chip-accent ml-2">
                  Düzenle
                </button>
                <button @click="remove(i)"
                        class="chip-danger ml-2">
                  Sil
                </button>
              </td>
            </tr>

            <tr v-if="!loading && filtered.length === 0">
              <td colspan="7" class="text-center py-12 text-muted">Henüz hammadde tanımlanmamış</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Hammadde formu -->
    <Teleport to="body">
      <div v-if="modal.show"
           class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
          <h2 class="modal-title mb-1">{{ modal.editing ? 'Hammadde Düzenle' : 'Yeni Hammadde' }}</h2>
          <p class="text-sm text-muted mb-6">Depoda takip edilen malzeme</p>

          <div class="space-y-3">
            <input v-model="form.name" placeholder="Hammadde adı * (Kıyma, Ekmek, Kola)"
                   class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="field-label-muted">Birim</label>
                <select v-model="form.unit"
                        class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white">
                  <option value="adet">adet</option>
                  <option value="gr">gram</option>
                  <option value="kg">kilogram</option>
                  <option value="ml">mililitre</option>
                  <option value="lt">litre</option>
                  <option value="porsiyon">porsiyon</option>
                </select>
              </div>
              <div>
                <label class="field-label-muted">Birim maliyet (₺)</label>
                <input v-model.number="form.costPerUnit" type="number" step="0.0001" min="0"
                       class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="field-label-muted">
                  {{ modal.editing ? 'Stok (hareketle değişir)' : 'Açılış stoğu' }}
                </label>
                <input v-model.number="form.currentStock" type="number" step="0.001"
                       :disabled="modal.editing"
                       class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] disabled:bg-gray-50 disabled:text-muted h-10 bg-white"/>
              </div>
              <div>
                <label class="field-label-muted">Kritik seviye</label>
                <input v-model.number="form.minimumStock" type="number" step="0.001" min="0"
                       class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
              </div>
            </div>

            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.isActive" type="checkbox" class="w-4 h-4"/>
              <span class="text-sm font-semibold">Aktif</span>
            </label>
          </div>

          <div v-if="modalError" class="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
            {{ modalError }}
          </div>

          <div class="flex gap-3 mt-6 justify-end">
            <button @click="modal.show = false"
                    class="btn-secondary">
              Vazgeç
            </button>
            <button @click="save" :disabled="saving"
                    class="btn-primary disabled:opacity-50">
              {{ saving ? 'Kaydediliyor...' : 'Kaydet' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Stok hareketi -->
    <Teleport to="body">
      <div v-if="movement.show"
           class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
          <h2 class="modal-title mb-1">{{ movement.ingredient?.name }}</h2>
          <p class="text-sm text-muted mb-6">
            Mevcut stok: <b>{{ num(movement.ingredient?.currentStock) }}</b> {{ movement.ingredient?.unit }}
          </p>

          <div class="flex rounded-xl overflow-hidden border border-gray-200 mb-4">
            <button v-for="t in movementTypes" :key="t.key" @click="movement.type = t.key"
                    class="flex-1 px-3 py-2 text-xs font-semibold transition-all"
                    :class="movement.type === t.key
                      ? 'bg-accent text-white'
                      : 'bg-white text-muted hover:text-primary hover:bg-gray-50'">
              {{ t.label }}
            </button>
          </div>

          <!-- Sayımda elde kalan girilir, fark otomatik hesaplanır -->
          <label class="field-label-muted">
            {{ movement.type === 'Adjustment' ? 'Sayımda bulunan miktar' : 'Miktar' }}
          </label>
          <input v-model.number="movement.quantity" type="number" step="0.001"
                 class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] mb-1 h-10 bg-white"/>
          <p class="text-xs text-muted mb-3">
            {{ movementHint }}
          </p>

          <input v-model="movement.note" placeholder="Açıklama (fatura no, sebep...)"
                 class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>

          <div v-if="modalError" class="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
            {{ modalError }}
          </div>

          <div class="flex gap-3 mt-6 justify-end">
            <button @click="movement.show = false"
                    class="btn-secondary">
              Vazgeç
            </button>
            <button @click="saveMovement" :disabled="saving"
                    class="btn-primary disabled:opacity-50">
              {{ saving ? 'Kaydediliyor...' : 'Uygula' }}
            </button>
          </div>

          <!-- Hareket geçmişi -->
          <div class="mt-8 pt-6 border-t border-gray-100">
            <h3 class="text-sm font-bold text-primary mb-3">Son Hareketler</h3>
            <div v-if="movement.history.length === 0" class="text-sm text-muted">Hareket yok</div>
            <table v-else class="w-full text-xs">
              <tbody>
                <tr v-for="m in movement.history" :key="m.id" class="border-t border-gray-50">
                  <td class="py-2 text-muted whitespace-nowrap">{{ dateTime(m.date) }}</td>
                  <td class="py-2">{{ typeLabel(m.type) }}</td>
                  <td class="py-2 text-right font-semibold"
                      :class="m.quantity < 0 ? 'text-danger' : 'text-success'">
                    {{ m.quantity > 0 ? '+' : '' }}{{ num(m.quantity) }}
                  </td>
                  <td class="py-2 text-right text-muted">{{ num(m.stockAfter) }}</td>
                  <td class="py-2 pl-3 text-muted truncate max-w-[10rem]">{{ m.note }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '../api/api'

const list    = ref([])
const loading = ref(true)
const saving  = ref(false)
const search  = ref('')
const error   = ref('')
const modalError = ref('')

const movementTypes = [
  { key: 'Purchase',   label: 'Giriş (alım)' },
  { key: 'Waste',      label: 'Fire / zayi'  },
  { key: 'Adjustment', label: 'Sayım'        },
]

const filtered = computed(() => {
  const q = search.value.trim().toLocaleLowerCase('tr')
  return q ? list.value.filter(i => i.name.toLocaleLowerCase('tr').includes(q)) : list.value
})

const modal = reactive({ show: false, editing: false, id: null })
const form  = reactive({
  name: '', unit: 'adet', currentStock: 0, minimumStock: 0, costPerUnit: 0, isActive: true,
})

const movement = reactive({
  show: false, ingredient: null, type: 'Purchase', quantity: 0, note: '', history: [],
})

const movementHint = computed(() => {
  const unit = movement.ingredient?.unit ?? ''
  if (movement.type === 'Adjustment')
    return `Depoda bulunan gerçek miktarı yazın; fark hareket olarak kaydedilir. (Şu an: ${num(movement.ingredient?.currentStock)} ${unit})`
  if (movement.type === 'Waste') return `Zayi olan miktar stoktan düşülür (${unit}).`
  return `Depoya giren miktar stoğa eklenir (${unit}).`
})

function num(v)   { return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 3 }).format(v ?? 0) }
function money(v) { return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0) + ' ₺' }
function dateTime(d) {
  return new Date(d).toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}
function typeLabel(t) {
  return { Sale: 'Satış', Purchase: 'Giriş', Waste: 'Fire', Adjustment: 'Sayım' }[t] || t
}

async function load() {
  loading.value = true
  try {
    list.value = (await api.getIngredients(true)).data
    error.value = ''
  } catch (e) {
    error.value = e.response?.data?.message || 'Hammaddeler alınamadı.'
  } finally {
    loading.value = false
  }
}
onMounted(load)

function openCreate() {
  Object.assign(form, {
    name: '', unit: 'adet', currentStock: 0, minimumStock: 0, costPerUnit: 0, isActive: true,
  })
  modal.editing = false
  modal.id = null
  modalError.value = ''
  modal.show = true
}

function openEdit(i) {
  Object.assign(form, {
    name: i.name, unit: i.unit, currentStock: i.currentStock,
    minimumStock: i.minimumStock, costPerUnit: i.costPerUnit, isActive: i.isActive,
  })
  modal.editing = true
  modal.id = i.id
  modalError.value = ''
  modal.show = true
}

async function save() {
  if (!form.name.trim()) { modalError.value = 'Hammadde adı gerekli.'; return }
  saving.value = true
  modalError.value = ''
  try {
    if (modal.editing) await api.updateIngredient(modal.id, { ...form })
    else               await api.createIngredient({ ...form })
    modal.show = false
    await load()
  } catch (e) {
    modalError.value = e.response?.data?.message || 'Kaydedilemedi.'
  } finally {
    saving.value = false
  }
}

async function remove(i) {
  if (!confirm(`${i.name} silinsin mi?`)) return
  try {
    await api.deleteIngredient(i.id)
    await load()
  } catch (e) {
    alert(e.response?.data?.message || 'Silinemedi.')
  }
}

async function openMovement(i) {
  Object.assign(movement, {
    show: true, ingredient: i, type: 'Purchase', quantity: 0, note: '', history: [],
  })
  modalError.value = ''
  try {
    movement.history = (await api.getIngredientMovements(i.id)).data
  } catch { movement.history = [] }
}

async function saveMovement() {
  saving.value = true
  modalError.value = ''
  try {
    // Sayımda girilen sayı "elde kalan"dır; diğerlerinde eklenen/düşen miktar.
    const body = movement.type === 'Adjustment'
      ? { type: movement.type, countedStock: movement.quantity, note: movement.note }
      : {
          type: movement.type,
          quantity: movement.type === 'Waste'
            ? -Math.abs(movement.quantity)
            : Math.abs(movement.quantity),
          note: movement.note,
        }

    await api.createIngredientMovement(movement.ingredient.id, body)
    movement.show = false
    await load()
  } catch (e) {
    modalError.value = e.response?.data?.message || 'Hareket kaydedilemedi.'
  } finally {
    saving.value = false
  }
}
</script>
