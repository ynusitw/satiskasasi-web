<template>
  <div class="p-6 lg:p-8">

    <!-- Başlık -->
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="page-title">Cari Kartlar</h1>
        <p class="page-subtitle">Müşteri ve tedarikçi hesap yönetimi</p>
      </div>
      <button @click="openCreate"
              class="btn-primary btn-lg flex items-center gap-2">
        <span>+</span> Yeni Cari Ekle
      </button>
    </div>

    <!-- İstatistik Kartları -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <div class="text-xs text-muted mb-1">Toplam Cari</div>
        <div class="text-2xl font-semibold tracking-tight text-primary">{{ store.carilerWithBakiye.length }}</div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <div class="text-xs text-muted mb-1">Borçlu</div>
        <div class="text-2xl font-semibold tracking-tight text-danger">{{ borcluSayisi }}</div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <div class="text-xs text-muted mb-1">Alacaklı</div>
        <div class="text-2xl font-semibold tracking-tight text-primary">{{ alacakliSayisi }}</div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <div class="text-xs text-muted mb-1">Net Pozisyon</div>
        <div class="text-2xl font-semibold tracking-tight" :class="netBakiye > 0 ? 'text-danger' : netBakiye < 0 ? 'text-success' : 'text-muted'">
          {{ fmt(Math.abs(netBakiye)) }}
        </div>
      </div>
    </div>

    <!-- Arama & Filtre -->
    <div class="flex flex-wrap gap-3 mb-4">
      <input v-model="search" placeholder="Ad, telefon veya vergi no ara..."
             class="flex-1 min-w-48 px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
      <select v-model="filterTip"
              class="px-3 border border-gray-200 rounded-lg text-[13.5px] bg-white h-10">
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
              <th class="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase">Tip</th>
              <th class="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase">Unvan / Ad Soyad</th>
              <th class="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase hidden md:table-cell">Telefon</th>
              <th class="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase hidden lg:table-cell">Vergi / TC No</th>
              <th class="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase">Güncel Bakiye</th>
              <th class="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase hidden lg:table-cell">Risk Limiti</th>
              <th class="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase hidden xl:table-cell">Son İşlem</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!filtered.length">
              <td colspan="8" class="text-center py-12 text-muted">Cari bulunamadı</td>
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

              <td class="px-5 py-4 text-sm text-muted hidden md:table-cell">{{ c.telefon || '—' }}</td>
              <td class="px-5 py-4 text-sm font-mono text-muted hidden lg:table-cell">{{ c.vergiNo || '—' }}</td>

              <!-- Canlı bakiye -->
              <td class="px-5 py-4 text-right">
                <span class="text-sm font-bold"
                      :class="c.bakiye > 0 ? 'text-danger' : c.bakiye < 0 ? 'text-success' : 'text-muted'">
                  {{ fmt(Math.abs(c.bakiye)) }}
                </span>
                <div class="text-xs mt-0.5"
                     :class="c.bakiye > 0 ? 'text-danger/70' : c.bakiye < 0 ? 'text-success/70' : 'text-muted'">
                  {{ c.bakiye > 0 ? 'Borçlu' : c.bakiye < 0 ? 'Alacaklı' : 'Sıfır' }}
                </div>
              </td>

              <!-- Risk limiti -->
              <td class="px-5 py-4 text-right text-sm hidden lg:table-cell">
                <span :class="c.riskLimiti > 0 && c.bakiye > c.riskLimiti ? 'text-danger font-bold' : 'text-muted'">
                  {{ c.riskLimiti > 0 ? fmt(c.riskLimiti) : 'Sınırsız' }}
                </span>
                <div v-if="c.riskLimiti > 0 && c.bakiye > c.riskLimiti"
                     class="text-xs text-danger mt-0.5">Limit aşıldı</div>
              </td>

              <!-- Son işlem -->
              <td class="px-5 py-4 hidden xl:table-cell">
                <template v-if="c.sonIslem">
                  <div class="text-xs font-semibold text-primary">{{ c.sonIslem.belgeNo }}</div>
                  <div class="text-xs text-muted">{{ c.sonIslem.tarih }}</div>
                </template>
                <span v-else class="text-muted text-sm">—</span>
              </td>

              <td class="px-5 py-4">
                <div class="flex gap-2 justify-end">
                  <button @click="goEkstre(c)"
                          class="btn-secondary">
                    Ekstre
                  </button>
                  <button @click="openEdit(c)"
                          class="chip-accent">
                    Düzenle
                  </button>
                  <button @click="deleteCari(c)"
                          class="chip-danger">
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
           class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
          <h2 class="modal-title mb-6">
            {{ modal.editing ? 'Cari Düzenle' : 'Yeni Cari Ekle' }}
          </h2>

          <div class="space-y-4">
            <div>
              <label class="field-label">Cari Tipi *</label>
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
              <label class="field-label">Unvan / Ad Soyad *</label>
              <input v-model="form.unvan" placeholder="Firma adı veya ad soyad"
                     class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="field-label">Telefon</label>
                <input v-model="form.telefon" placeholder="0500 000 0000"
                       class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
              </div>
              <div>
                <label class="field-label">E-posta</label>
                <input v-model="form.email" type="email" placeholder="ornek@mail.com"
                       class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="field-label">Vergi No / TC No</label>
                <input v-model="form.vergiNo" placeholder="0000000000"
                       class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
              </div>
              <div>
                <label class="field-label">Risk Limiti (₺)</label>
                <input v-model.number="form.riskLimiti" type="number" min="0"
                       class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
              </div>
            </div>

            <div>
              <label class="field-label">Adres</label>
              <textarea v-model="form.adres" rows="2" placeholder="Açık adres"
                        class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] resize-none bg-white"/>
            </div>
          </div>

          <div v-if="error" class="mt-4 p-3 bg-red-50 text-danger rounded-xl text-sm">{{ error }}</div>

          <div class="flex gap-3 mt-6 justify-end">
            <button @click="modal.show = false"
                    class="btn-secondary">
              İptal
            </button>
            <button @click="save"
                    class="btn-primary">
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { uiAlert, uiConfirm } from '../../utils/dialog'
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCariStore } from '../../stores/cari'

const router = useRouter()
const store  = useCariStore()

const search    = ref('')
const filterTip = ref('')
const modal     = reactive({ show: false, editing: false })
const saving    = ref(false)
const error     = ref('')
const form      = reactive({ id: 0, tip: 'Müşteri', unvan: '', telefon: '', email: '', vergiNo: '', riskLimiti: 5000, adres: '' })

onMounted(() => store.fetchCariler())

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return store.carilerWithBakiye.filter(c => {
    const matchTip    = !filterTip.value || c.tip === filterTip.value
    const matchSearch = !q || c.unvan.toLowerCase().includes(q) ||
      (c.telefon || '').includes(q) || (c.vergiNo || '').includes(q)
    return matchTip && matchSearch
  })
})

const borcluSayisi   = computed(() => store.carilerWithBakiye.filter(c => c.bakiye > 0).length)
const alacakliSayisi = computed(() => store.carilerWithBakiye.filter(c => c.bakiye < 0).length)
const netBakiye      = computed(() => store.carilerWithBakiye.reduce((s, c) => s + c.bakiye, 0))

function fmt(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}

function openCreate() {
  Object.assign(form, { id: 0, tip: 'Müşteri', unvan: '', telefon: '', email: '', vergiNo: '', riskLimiti: 5000, adres: '' })
  modal.editing = false; modal.show = true; error.value = ''
}

function openEdit(c) {
  Object.assign(form, { ...c })
  modal.editing = true; modal.show = true; error.value = ''
}

async function save() {
  if (!form.unvan.trim()) { error.value = 'Unvan zorunludur.'; return }
  saving.value = true
  error.value  = ''
  try {
    if (modal.editing) {
      await store.cariGuncelle({ ...form })
    } else {
      await store.cariEkle({ ...form })
    }
    modal.show = false
  } catch {
    error.value = 'İşlem sırasında hata oluştu.'
  } finally {
    saving.value = false
  }
}

async function deleteCari(c) {
  if (!await uiConfirm(`"${c.unvan}" ve tüm işlem geçmişi silinsin mi?`)) return
  try {
    await store.cariSil(c.id)
  } catch {
    await uiAlert('Silme işlemi başarısız.')
  }
}

function goEkstre(c) {
  router.push(`/cari/ekstre?id=${c.id}`)
}
</script>
