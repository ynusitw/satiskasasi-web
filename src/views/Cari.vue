<template>
  <div class="p-8">

    <!-- Başlık -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-primary">Cari / Müşteri Yönetimi</h1>
      <button @click="openCreate" class="px-5 py-2 bg-accent text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors">
        + Yeni Müşteri
      </button>
    </div>

    <!-- Arama -->
    <div class="mb-4">
      <input v-model="search" placeholder="Müşteri ara..." class="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-accent focus:outline-none w-72"/>
    </div>

    <!-- Tablo -->
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Müşteri</th>
            <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Telefon</th>
            <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Bakiye</th>
            <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase">Durum</th>
            <th class="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="5" class="text-center py-12 text-muted">Yükleniyor...</td>
          </tr>
          <tr v-for="c in filtered" :key="c.id" class="border-t border-gray-50 hover:bg-gray-50">
            <td class="px-6 py-4">
              <div class="font-semibold">{{ c.name }}</div>
              <div v-if="c.notes" class="text-xs text-muted mt-0.5 truncate max-w-xs">{{ c.notes }}</div>
            </td>
            <td class="px-6 py-4 text-sm text-muted">{{ c.phone || '—' }}</td>
            <td class="px-6 py-4">
              <span :class="balanceClass(c.balance)" class="font-bold text-sm">
                {{ balanceLabel(c.balance) }}
              </span>
            </td>
            <td class="px-6 py-4">
              <span :class="c.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'"
                    class="text-xs font-bold px-3 py-1 rounded-full">
                {{ c.isActive ? 'Aktif' : 'Pasif' }}
              </span>
            </td>
            <td class="px-6 py-4">
              <div class="flex gap-2 justify-end">
                <button @click="openDetail(c)"
                  class="px-3 py-1 text-xs font-bold bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-colors">
                  Hareketler
                </button>
                <button @click="openEdit(c)"
                  class="px-3 py-1 text-xs font-bold bg-blue-50 text-accent rounded-lg hover:bg-accent hover:text-white transition-colors">
                  Düzenle
                </button>
                <button @click="deleteCari(c)"
                  class="px-3 py-1 text-xs font-bold bg-red-50 text-danger rounded-lg hover:bg-danger hover:text-white transition-colors">
                  Sil
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && filtered.length === 0">
            <td colspan="5" class="text-center py-12 text-muted">Müşteri bulunamadı</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Cari Ekle/Düzenle Modal -->
    <Teleport to="body">
      <div v-if="cariModal.show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <h2 class="text-xl font-bold mb-6">{{ cariModal.editing ? 'Müşteriyi Düzenle' : 'Yeni Müşteri' }}</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold mb-1">Ad Soyad / Firma *</label>
              <input v-model="form.name" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-accent focus:outline-none text-sm"/>
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Telefon</label>
              <input v-model="form.phone" type="tel" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-accent focus:outline-none text-sm"/>
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Notlar</label>
              <textarea v-model="form.notes" rows="2" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-accent focus:outline-none text-sm resize-none"/>
            </div>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.isActive" type="checkbox" class="w-4 h-4"/>
              <span class="text-sm font-semibold">Aktif</span>
            </label>
          </div>
          <div v-if="formError" class="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ formError }}</div>
          <div class="flex gap-3 mt-6 justify-end">
            <button @click="cariModal.show = false" class="px-5 py-2 bg-gray-100 rounded-xl text-sm font-bold hover:bg-gray-200">İptal</button>
            <button @click="saveCari" :disabled="saving" class="px-5 py-2 bg-accent text-white rounded-xl text-sm font-bold hover:bg-blue-600 disabled:opacity-50">
              {{ saving ? 'Kaydediliyor...' : 'Kaydet' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Hareket Detay Modal -->
    <Teleport to="body">
      <div v-if="detailModal.show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

          <!-- Başlık -->
          <div class="px-8 pt-8 pb-4 border-b border-gray-100">
            <div class="flex items-start justify-between">
              <div>
                <h2 class="text-xl font-bold">{{ detailModal.cari?.name }}</h2>
                <div class="text-sm text-muted mt-1">{{ detailModal.cari?.phone || '' }}</div>
              </div>
              <div class="text-right">
                <div class="text-xs text-muted mb-1">Güncel Bakiye</div>
                <div :class="balanceClass(detailModal.cari?.balance)" class="text-xl font-bold">
                  {{ balanceLabel(detailModal.cari?.balance) }}
                </div>
              </div>
            </div>

            <!-- Yeni hareket girişi -->
            <div class="mt-4 p-4 bg-gray-50 rounded-xl">
              <div class="text-sm font-semibold mb-3">Hareket Ekle</div>
              <div class="flex gap-2 mb-3">
                <button @click="txForm.type = 'tahsilat'"
                  :class="txForm.type === 'tahsilat' ? 'bg-green-500 text-white' : 'bg-white text-green-600 border border-green-200'"
                  class="flex-1 py-2 rounded-lg text-xs font-bold transition-colors">
                  ✓ Tahsilat (Ödeme Aldı)
                </button>
                <button @click="txForm.type = 'borc'"
                  :class="txForm.type === 'borc' ? 'bg-red-500 text-white' : 'bg-white text-red-500 border border-red-200'"
                  class="flex-1 py-2 rounded-lg text-xs font-bold transition-colors">
                  + Borç Girişi
                </button>
              </div>
              <div class="flex gap-2">
                <input v-model="txForm.amount" type="number" min="0" step="0.01" placeholder="Tutar"
                  class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-accent focus:outline-none"/>
                <input v-model="txForm.description" placeholder="Açıklama"
                  class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-accent focus:outline-none"/>
                <button @click="addTransaction" :disabled="txSaving"
                  class="px-4 py-2 bg-accent text-white rounded-lg text-sm font-bold hover:bg-blue-600 disabled:opacity-50 whitespace-nowrap">
                  {{ txSaving ? '...' : 'Ekle' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Hareket Listesi -->
          <div class="flex-1 overflow-y-auto px-8 py-4">
            <div v-if="txLoading" class="text-center py-8 text-muted">Yükleniyor...</div>
            <div v-else-if="transactions.length === 0" class="text-center py-8 text-muted">Henüz hareket yok</div>
            <div v-else class="space-y-2">
              <div v-for="tx in transactions" :key="tx.id"
                class="flex items-center justify-between py-3 border-b border-gray-50">
                <div>
                  <div class="text-sm font-semibold">{{ tx.description || (tx.saleId ? 'Satış #' + tx.saleId : 'Manuel') }}</div>
                  <div class="text-xs text-muted">{{ fmtDate(tx.date) }}</div>
                </div>
                <div :class="tx.amount > 0 ? 'text-green-600' : 'text-danger'" class="font-bold text-sm">
                  {{ tx.amount > 0 ? '+' : '' }}{{ money(tx.amount) }}
                </div>
              </div>
            </div>
          </div>

          <div class="px-8 pb-6 pt-4 border-t border-gray-100">
            <button @click="detailModal.show = false" class="w-full py-2 bg-gray-100 rounded-xl text-sm font-bold hover:bg-gray-200">Kapat</button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import api from '../api/api'

const caris      = ref([])
const loading    = ref(true)
const saving     = ref(false)
const formError  = ref('')
const search     = ref('')
const transactions = ref([])
const txLoading  = ref(false)
const txSaving   = ref(false)

const cariModal = reactive({ show: false, editing: false })
const detailModal = reactive({ show: false, cari: null })
const form = reactive({ name: '', phone: '', notes: '', isActive: true })
const txForm = reactive({ type: 'tahsilat', amount: '', description: '' })

const filtered = computed(() =>
  caris.value.filter(c =>
    !search.value ||
    c.name.toLowerCase().includes(search.value.toLowerCase()) ||
    (c.phone || '').includes(search.value)
  )
)

function money(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(Math.abs(v ?? 0)) + ' ₺'
}

function fmtDate(d) {
  return new Date(d).toLocaleString('tr-TR')
}

function balanceClass(b) {
  if (!b || b === 0) return 'text-gray-400'
  return b > 0 ? 'text-danger' : 'text-green-600'
}

function balanceLabel(b) {
  if (!b || b === 0) return '0,00 ₺'
  const label = money(b)
  return b > 0 ? label + ' (Borçlu)' : label + ' (Alacaklı)'
}

async function load() {
  loading.value = true
  caris.value = (await api.getCaris()).data
  loading.value = false
}

function openCreate() {
  Object.assign(form, { name: '', phone: '', notes: '', isActive: true })
  cariModal.editing = false
  cariModal.show = true
  formError.value = ''
}

function openEdit(c) {
  Object.assign(form, { id: c.id, name: c.name, phone: c.phone || '', notes: c.notes || '', isActive: c.isActive })
  cariModal.editing = true
  cariModal.show = true
  formError.value = ''
}

async function saveCari() {
  if (!form.name.trim()) { formError.value = 'Müşteri adı zorunludur.'; return }
  saving.value = true; formError.value = ''
  try {
    cariModal.editing
      ? await api.updateCari(form.id, form)
      : await api.createCari(form)
    cariModal.show = false
    await load()
  } catch (e) {
    formError.value = e.response?.data?.message || 'Hata oluştu.'
  } finally {
    saving.value = false
  }
}

async function deleteCari(c) {
  if (!confirm(`"${c.name}" silinsin mi?`)) return
  try { await api.deleteCari(c.id); await load() }
  catch (e) { alert(e.response?.data?.message || 'Silinemedi.') }
}

async function openDetail(c) {
  detailModal.cari = { ...c }
  detailModal.show = true
  Object.assign(txForm, { type: 'tahsilat', amount: '', description: '' })
  txLoading.value = true
  transactions.value = (await api.getCariTransactions(c.id)).data
  txLoading.value = false
}

async function addTransaction() {
  const amt = parseFloat(txForm.amount)
  if (!amt || amt <= 0) { alert('Geçerli bir tutar girin.'); return }
  const signed = txForm.type === 'tahsilat' ? -amt : amt
  txSaving.value = true
  try {
    const res = await api.addCariTransaction(detailModal.cari.id, {
      amount: signed,
      description: txForm.description || (txForm.type === 'tahsilat' ? 'Tahsilat' : 'Borç Girişi')
    })
    detailModal.cari.balance = res.data.balance
    txForm.amount = ''
    txForm.description = ''
    transactions.value = (await api.getCariTransactions(detailModal.cari.id)).data
    await load()
  } catch (e) {
    alert(e.response?.data?.message || 'Hata oluştu.')
  } finally {
    txSaving.value = false
  }
}

onMounted(load)
</script>
