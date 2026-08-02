<template>
  <div class="p-6 lg:p-8">

    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold text-primary">Faturalar</h1>
        <p class="text-muted text-sm mt-1">Alış ve satış faturası yönetimi</p>
      </div>
      <button @click="openCreate"
              class="px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-bold
                     hover:bg-blue-600 transition-colors flex items-center gap-2">
        <span>+</span> Yeni Fatura
      </button>
    </div>

    <!-- Özet Kartlar -->
    <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <div class="text-xs text-muted mb-1">Toplam Fatura</div>
        <div class="text-2xl font-bold text-primary">{{ faturalar.length }}</div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <div class="text-xs text-muted mb-1">Toplam Alış</div>
        <div class="text-2xl font-bold text-danger">
          {{ fmt(faturalar.filter(f=>f.tip==='Alış').reduce((s,f)=>s+f.tutar,0)) }}
        </div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm p-5 col-span-2 lg:col-span-1">
        <div class="text-xs text-muted mb-1">Toplam Satış</div>
        <div class="text-2xl font-bold text-success">
          {{ fmt(faturalar.filter(f=>f.tip==='Satış').reduce((s,f)=>s+f.tutar,0)) }}
        </div>
      </div>
    </div>

    <!-- Filtre -->
    <div class="flex flex-wrap gap-3 mb-4">
      <input v-model="search" placeholder="🔍 Fatura no veya cari ara..."
             class="flex-1 min-w-48 px-4 py-2 border border-gray-200 rounded-xl
                    text-sm focus:border-accent focus:outline-none"/>
      <select v-model="filterTip"
              class="px-4 py-2 border border-gray-200 rounded-xl text-sm
                     focus:border-accent focus:outline-none bg-white">
        <option value="">Tümü</option>
        <option value="Alış">Alış</option>
        <option value="Satış">Satış</option>
      </select>
    </div>

    <!-- Tablo -->
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-5 py-3 text-xs font-bold text-muted uppercase">Tip</th>
              <th class="text-left px-5 py-3 text-xs font-bold text-muted uppercase">Fatura No</th>
              <th class="text-left px-5 py-3 text-xs font-bold text-muted uppercase">Cari</th>
              <th class="text-left px-5 py-3 text-xs font-bold text-muted uppercase">Tarih</th>
              <th class="text-left px-5 py-3 text-xs font-bold text-muted uppercase">Açıklama</th>
              <th class="text-right px-5 py-3 text-xs font-bold text-muted uppercase">Tutar</th>
              <th class="text-right px-5 py-3 text-xs font-bold text-muted uppercase">KDV</th>
              <th class="text-right px-5 py-3 text-xs font-bold text-muted uppercase">Toplam</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!filtered.length">
              <td colspan="8" class="text-center py-12 text-muted">Fatura bulunamadı</td>
            </tr>
            <tr v-for="f in filtered" :key="f.id"
                class="border-t border-gray-50 hover:bg-gray-50 transition-colors">
              <td class="px-5 py-4">
                <span class="text-xs font-bold px-2.5 py-1 rounded-full"
                      :class="f.tip === 'Alış'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'">
                  {{ f.tip }}
                </span>
              </td>
              <td class="px-5 py-4 text-sm font-mono font-semibold">{{ f.no }}</td>
              <td class="px-5 py-4 text-sm font-semibold text-primary">{{ f.cari }}</td>
              <td class="px-5 py-4 text-sm text-muted">{{ f.tarih }}</td>
              <td class="px-5 py-4 text-sm text-muted">{{ f.aciklama }}</td>
              <td class="px-5 py-4 text-sm text-right">{{ fmt(f.tutar) }}</td>
              <td class="px-5 py-4 text-sm text-right text-muted">%{{ f.kdv }}</td>
              <td class="px-5 py-4 text-sm font-bold text-right"
                  :class="f.tip === 'Alış' ? 'text-danger' : 'text-success'">
                {{ fmt(f.tutar * (1 + f.kdv / 100)) }}
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
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
          <h2 class="text-xl font-bold mb-6">Yeni Fatura Oluştur</h2>

          <div class="space-y-4">
            <!-- Fatura Tipi -->
            <div>
              <label class="block text-sm font-semibold mb-2">Fatura Tipi *</label>
              <div class="flex gap-3">
                <label v-for="t in ['Alış','Satış']" :key="t"
                       class="flex items-center gap-2 cursor-pointer flex-1 border-2 rounded-xl p-3 transition-all"
                       :class="form.tip === t ? 'border-accent bg-blue-50' : 'border-gray-200'">
                  <input type="radio" v-model="form.tip" :value="t" class="accent-accent"/>
                  <span class="text-sm font-semibold">{{ t }} Faturası</span>
                </label>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-semibold mb-1">Fatura No *</label>
                <input v-model="form.no" placeholder="FTR-001"
                       class="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm
                              focus:border-accent focus:outline-none"/>
              </div>
              <div>
                <label class="block text-sm font-semibold mb-1">Tarih *</label>
                <input v-model="form.tarih" type="date"
                       class="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm
                              focus:border-accent focus:outline-none"/>
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold mb-1">Cari *</label>
              <select v-model="form.cari"
                      class="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm
                             focus:border-accent focus:outline-none bg-white">
                <option value="">Cari seçin...</option>
                <option v-for="c in mockCariler" :key="c">{{ c }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-semibold mb-1">Açıklama</label>
              <input v-model="form.aciklama" placeholder="Fatura açıklaması"
                     class="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm
                            focus:border-accent focus:outline-none"/>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-semibold mb-1">Tutar (₺) *</label>
                <input v-model.number="form.tutar" type="number" min="0" step="0.01"
                       class="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm
                              focus:border-accent focus:outline-none"/>
              </div>
              <div>
                <label class="block text-sm font-semibold mb-1">KDV (%)</label>
                <select v-model.number="form.kdv"
                        class="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm
                               focus:border-accent focus:outline-none bg-white">
                  <option :value="0">%0</option>
                  <option :value="1">%1</option>
                  <option :value="10">%10</option>
                  <option :value="20">%20</option>
                </select>
              </div>
            </div>

            <div class="bg-gray-50 rounded-xl p-4 text-sm">
              <div class="flex justify-between mb-1">
                <span class="text-muted">Ara Toplam</span>
                <span>{{ fmt(form.tutar) }}</span>
              </div>
              <div class="flex justify-between mb-1">
                <span class="text-muted">KDV (%{{ form.kdv }})</span>
                <span>{{ fmt(form.tutar * form.kdv / 100) }}</span>
              </div>
              <div class="flex justify-between font-bold border-t border-gray-200 pt-2 mt-2">
                <span>Genel Toplam</span>
                <span :class="form.tip === 'Alış' ? 'text-danger' : 'text-success'">
                  {{ fmt(form.tutar * (1 + form.kdv / 100)) }}
                </span>
              </div>
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

const today = new Date().toISOString().split('T')[0]

const mockCariler = ['Ahmet Yılmaz', 'ABC Gıda Tic. Ltd.', 'Fatma Demir', 'XYZ Market A.Ş.', 'Mehmet Kaya']

const faturalar = ref([
  { id: 1, tip: 'Satış', no: 'STF-001', cari: 'Ahmet Yılmaz',       tarih: '2026-07-28', aciklama: 'Haziran ayı malları',     tutar: 1500.00, kdv: 20 },
  { id: 2, tip: 'Alış',  no: 'ALF-001', cari: 'ABC Gıda Tic. Ltd.', tarih: '2026-07-25', aciklama: 'Ürün alımı',              tutar: 2300.50, kdv: 10 },
  { id: 3, tip: 'Satış', no: 'STF-002', cari: 'Mehmet Kaya',        tarih: '2026-07-20', aciklama: 'Perakende satış',         tutar: 750.00,  kdv: 20 },
  { id: 4, tip: 'Alış',  no: 'ALF-002', cari: 'XYZ Market A.Ş.',   tarih: '2026-07-15', aciklama: 'Stok takviyesi',          tutar: 4800.00, kdv: 10 },
])

const search    = ref('')
const filterTip = ref('')
const modal     = reactive({ show: false })
const error     = ref('')
const form      = reactive({ tip: 'Satış', no: '', tarih: today, cari: '', aciklama: '', tutar: 0, kdv: 20 })

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return faturalar.value.filter(f => {
    const matchTip = !filterTip.value || f.tip === filterTip.value
    const matchQ   = !q || f.no.toLowerCase().includes(q) || f.cari.toLowerCase().includes(q)
    return matchTip && matchQ
  })
})

function fmt(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}

function openCreate() {
  Object.assign(form, { tip: 'Satış', no: '', tarih: today, cari: '', aciklama: '', tutar: 0, kdv: 20 })
  modal.show = true; error.value = ''
}

function save() {
  if (!form.no.trim())   { error.value = 'Fatura no zorunludur.'; return }
  if (!form.cari)        { error.value = 'Cari seçimi zorunludur.'; return }
  if (form.tutar <= 0)   { error.value = 'Tutar sıfırdan büyük olmalıdır.'; return }
  faturalar.value.unshift({ ...form, id: Date.now() })
  modal.show = false
}
</script>
