<template>
  <div class="p-6 lg:p-8">

    <!-- Başlık -->
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold text-primary">Cari Kartlar</h1>
        <p class="text-muted text-sm mt-1">Müşteri ve tedarikçi hesap yönetimi</p>
      </div>
      <button @click="openCreate"
              class="px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-bold
                     hover:bg-blue-600 transition-colors flex items-center gap-2">
        <span>+</span> Yeni Cari Ekle
      </button>
    </div>

    <!-- İstatistik Kartları -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <div class="text-xs text-muted mb-1">Toplam Cari</div>
        <div class="text-2xl font-bold text-primary">{{ cariler.length }}</div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <div class="text-xs text-muted mb-1">Alacaklı</div>
        <div class="text-2xl font-bold text-success">{{ alacakliSayisi }}</div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <div class="text-xs text-muted mb-1">Borçlu</div>
        <div class="text-2xl font-bold text-danger">{{ borcluSayisi }}</div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <div class="text-xs text-muted mb-1">Net Alacak</div>
        <div class="text-2xl font-bold" :class="netBakiye >= 0 ? 'text-success' : 'text-danger'">
          {{ fmt(Math.abs(netBakiye)) }}
        </div>
      </div>
    </div>

    <!-- Arama & Filtre -->
    <div class="flex flex-wrap gap-3 mb-4">
      <input v-model="search" placeholder="🔍 Ad, telefon veya vergi no ara..."
             class="flex-1 min-w-48 px-4 py-2 border border-gray-200 rounded-xl
                    text-sm focus:border-accent focus:outline-none"/>
      <select v-model="filterTip"
              class="px-4 py-2 border border-gray-200 rounded-xl text-sm
                     focus:border-accent focus:outline-none bg-white">
        <option value="">Tümü</option>
        <option value="Müşteri">Müşteri</option>
        <option value="Tedarikçi">Tedarikçi</option>
      </select>
    </div>

    <!-- Tablo -->
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-5 py-3 text-xs font-bold text-muted uppercase">Tip</th>
              <th class="text-left px-5 py-3 text-xs font-bold text-muted uppercase">Unvan / Ad Soyad</th>
              <th class="text-left px-5 py-3 text-xs font-bold text-muted uppercase">Telefon</th>
              <th class="text-left px-5 py-3 text-xs font-bold text-muted uppercase">Vergi / TC No</th>
              <th class="text-right px-5 py-3 text-xs font-bold text-muted uppercase">Güncel Bakiye</th>
              <th class="text-right px-5 py-3 text-xs font-bold text-muted uppercase">Risk Limiti</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!filtered.length">
              <td colspan="7" class="text-center py-12 text-muted">Cari bulunamadı</td>
            </tr>
            <tr v-for="c in filtered" :key="c.id"
                class="border-t border-gray-50 hover:bg-gray-50 transition-colors">
              <td class="px-5 py-4">
                <span class="text-xs font-bold px-2.5 py-1 rounded-full"
                      :class="c.tip === 'Müşteri'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'">
                  {{ c.tip }}
                </span>
              </td>
              <td class="px-5 py-4">
                <div class="font-semibold text-primary text-sm">{{ c.unvan }}</div>
                <div v-if="c.email" class="text-xs text-muted">{{ c.email }}</div>
              </td>
              <td class="px-5 py-4 text-sm text-muted">{{ c.telefon || '—' }}</td>
              <td class="px-5 py-4 text-sm font-mono text-muted">{{ c.vergiNo || '—' }}</td>
              <td class="px-5 py-4 text-right">
                <span class="text-sm font-bold"
                      :class="c.bakiye > 0 ? 'text-danger' : c.bakiye < 0 ? 'text-success' : 'text-muted'">
                  {{ fmt(Math.abs(c.bakiye)) }}
                </span>
                <div class="text-xs text-muted">
                  {{ c.bakiye > 0 ? 'Borçlu' : c.bakiye < 0 ? 'Alacaklı' : 'Sıfır' }}
                </div>
              </td>
              <td class="px-5 py-4 text-right text-sm text-muted">
                <span :class="c.bakiye > c.riskLimiti ? 'text-danger font-bold' : ''">
                  {{ fmt(c.riskLimiti) }}
                </span>
              </td>
              <td class="px-5 py-4">
                <div class="flex gap-2 justify-end">
                  <button @click="goEkstre(c)"
                          class="px-3 py-1 text-xs font-bold bg-gray-100 text-muted
                                 rounded-lg hover:bg-gray-200 transition-colors">
                    Ekstre
                  </button>
                  <button @click="openEdit(c)"
                          class="px-3 py-1 text-xs font-bold bg-blue-50 text-accent
                                 rounded-lg hover:bg-accent hover:text-white transition-colors">
                    Düzenle
                  </button>
                  <button @click="deleteCari(c)"
                          class="px-3 py-1 text-xs font-bold bg-red-50 text-danger
                                 rounded-lg hover:bg-danger hover:text-white transition-colors">
                    Sil
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="modal.show"
           class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
          <h2 class="text-xl font-bold mb-6">
            {{ modal.editing ? 'Cari Düzenle' : 'Yeni Cari Ekle' }}
          </h2>

          <div class="space-y-4">
            <!-- Tip -->
            <div>
              <label class="block text-sm font-semibold mb-2">Cari Tipi *</label>
              <div class="flex gap-3">
                <label v-for="t in ['Müşteri','Tedarikçi']" :key="t"
                       class="flex items-center gap-2 cursor-pointer flex-1 border-2 rounded-xl p-3 transition-all"
                       :class="form.tip === t ? 'border-accent bg-blue-50' : 'border-gray-200'">
                  <input type="radio" v-model="form.tip" :value="t" class="accent-accent"/>
                  <span class="text-sm font-semibold">{{ t }}</span>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold mb-1">Unvan / Ad Soyad *</label>
              <input v-model="form.unvan" placeholder="Firma adı veya ad soyad"
                     class="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm
                            focus:border-accent focus:outline-none"/>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-semibold mb-1">Telefon</label>
                <input v-model="form.telefon" placeholder="0500 000 0000"
                       class="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm
                              focus:border-accent focus:outline-none"/>
              </div>
              <div>
                <label class="block text-sm font-semibold mb-1">E-posta</label>
                <input v-model="form.email" type="email" placeholder="ornek@mail.com"
                       class="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm
                              focus:border-accent focus:outline-none"/>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-semibold mb-1">Vergi No / TC No</label>
                <input v-model="form.vergiNo" placeholder="0000000000"
                       class="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm
                              focus:border-accent focus:outline-none"/>
              </div>
              <div>
                <label class="block text-sm font-semibold mb-1">Risk Limiti (₺)</label>
                <input v-model.number="form.riskLimiti" type="number" min="0"
                       class="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm
                              focus:border-accent focus:outline-none"/>
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold mb-1">Adres</label>
              <textarea v-model="form.adres" rows="2" placeholder="Açık adres"
                        class="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm
                               focus:border-accent focus:outline-none resize-none"/>
            </div>
          </div>

          <div v-if="error" class="mt-4 p-3 bg-red-50 text-danger rounded-xl text-sm">{{ error }}</div>

          <div class="flex gap-3 mt-6 justify-end">
            <button @click="modal.show = false"
                    class="px-5 py-2 bg-gray-100 rounded-xl text-sm font-bold hover:bg-gray-200">
              İptal
            </button>
            <button @click="save"
                    class="px-5 py-2 bg-accent text-white rounded-xl text-sm font-bold
                           hover:bg-blue-600 transition-colors">
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const cariler = ref([
  { id: 1, tip: 'Müşteri',    unvan: 'Ahmet Yılmaz',       telefon: '0532 111 2233', email: 'ahmet@mail.com',    vergiNo: '12345678901', bakiye: 1500.00,  riskLimiti: 5000,  adres: 'Kadıköy, İstanbul' },
  { id: 2, tip: 'Tedarikçi',  unvan: 'ABC Gıda Tic. Ltd.', telefon: '0212 444 5566', email: 'info@abcgida.com',  vergiNo: '9876543210',  bakiye: -2300.50, riskLimiti: 10000, adres: 'Bağcılar, İstanbul' },
  { id: 3, tip: 'Müşteri',    unvan: 'Fatma Demir',         telefon: '0541 999 8877', email: '',                  vergiNo: '98765432109', bakiye: 0,         riskLimiti: 2000,  adres: '' },
  { id: 4, tip: 'Tedarikçi',  unvan: 'XYZ Market A.Ş.',    telefon: '0216 333 4455', email: 'satis@xyz.com',    vergiNo: '1122334455',  bakiye: 4800.00,  riskLimiti: 4000,  adres: 'Ümraniye, İstanbul' },
  { id: 5, tip: 'Müşteri',    unvan: 'Mehmet Kaya',         telefon: '0505 222 3344', email: '',                  vergiNo: '55544433221', bakiye: -750.00,  riskLimiti: 3000,  adres: 'Beşiktaş, İstanbul' },
])

const search    = ref('')
const filterTip = ref('')
const modal     = reactive({ show: false, editing: false })
const error     = ref('')
const form      = reactive({ id: 0, tip: 'Müşteri', unvan: '', telefon: '', email: '', vergiNo: '', riskLimiti: 5000, adres: '' })

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return cariler.value.filter(c => {
    const matchTip    = !filterTip.value || c.tip === filterTip.value
    const matchSearch = !q || c.unvan.toLowerCase().includes(q) ||
      (c.telefon || '').includes(q) || (c.vergiNo || '').includes(q)
    return matchTip && matchSearch
  })
})

const alacakliSayisi = computed(() => cariler.value.filter(c => c.bakiye < 0).length)
const borcluSayisi   = computed(() => cariler.value.filter(c => c.bakiye > 0).length)
const netBakiye      = computed(() => cariler.value.reduce((s, c) => s + c.bakiye, 0))

function fmt(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}

function openCreate() {
  Object.assign(form, { id: 0, tip: 'Müşteri', unvan: '', telefon: '', email: '', vergiNo: '', riskLimiti: 5000, adres: '' })
  modal.editing = false; modal.show = true; error.value = ''
}

function openEdit(c) {
  Object.assign(form, { ...c })
  modal.editing = true; modal.show = true; error.value = ''
}

function save() {
  if (!form.unvan.trim()) { error.value = 'Unvan zorunludur.'; return }
  if (modal.editing) {
    const idx = cariler.value.findIndex(c => c.id === form.id)
    if (idx !== -1) cariler.value[idx] = { ...form }
  } else {
    cariler.value.push({ ...form, id: Date.now(), bakiye: 0 })
  }
  modal.show = false
}

function deleteCari(c) {
  if (!confirm(`"${c.unvan}" silinsin mi?`)) return
  cariler.value = cariler.value.filter(x => x.id !== c.id)
}

function goEkstre(c) {
  router.push(`/cari/ekstre?id=${c.id}&unvan=${encodeURIComponent(c.unvan)}`)
}
</script>
