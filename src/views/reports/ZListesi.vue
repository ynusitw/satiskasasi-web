<template>
  <div class="p-6 lg:p-8">

    <!-- Başlık -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-primary">Z-Listesi</h1>
      <p class="text-muted text-sm mt-1">Z-Raporu geçmişi ve günlük satış özetleri</p>
    </div>

    <!-- Filtre + Z-Al butonu -->
    <div class="flex flex-wrap gap-3 items-end mb-6">
      <div>
        <label class="block text-xs font-semibold text-muted mb-1 uppercase tracking-wide">Başlangıç</label>
        <input v-model="filter.start" type="date"
               class="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-accent focus:outline-none bg-white"/>
      </div>
      <div>
        <label class="block text-xs font-semibold text-muted mb-1 uppercase tracking-wide">Bitiş</label>
        <input v-model="filter.end" type="date"
               class="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-accent focus:outline-none bg-white"/>
      </div>
      <button @click="clearFilter"
              class="px-4 py-2 text-sm text-muted border border-gray-200 rounded-xl
                     hover:border-gray-300 hover:text-primary transition-colors bg-white">
        Filtreyi Temizle
      </button>
      <div class="flex-1"/>
      <button @click="takeZ" :disabled="takingZ"
              class="px-5 py-2 bg-danger text-white text-sm font-bold rounded-xl
                     hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586
                   a1 1 0 01.707.293l5.414 5.414A1 1 0 0121 9.414V19a2 2 0 01-2 2z"/>
        </svg>
        {{ takingZ ? 'İşleniyor...' : 'Z Al' }}
      </button>
    </div>

    <div v-if="loading" class="text-center py-20 text-muted text-sm">Yükleniyor...</div>

    <template v-else>

      <!-- Hata -->
      <div v-if="loadError"
           class="mb-4 p-4 bg-red-50 border border-red-100 text-danger rounded-2xl text-sm">
        Veriler yüklenemedi: {{ loadError }}
      </div>

      <!-- Özet kartlar -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-2xl shadow-sm p-5">
          <div class="text-xs font-bold text-muted uppercase tracking-wide mb-1">Toplam Nakit</div>
          <div class="text-2xl font-bold text-success">{{ fmt(totals.cash) }}</div>
          <div class="text-xs text-muted mt-1">{{ filteredReports.length }} rapor</div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm p-5">
          <div class="text-xs font-bold text-muted uppercase tracking-wide mb-1">Toplam Kart</div>
          <div class="text-2xl font-bold text-accent">{{ fmt(totals.card) }}</div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm p-5">
          <div class="text-xs font-bold text-muted uppercase tracking-wide mb-1">Toplam İndirim</div>
          <div class="text-2xl font-bold text-danger">{{ fmt(totals.discount) }}</div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm p-5">
          <div class="text-xs font-bold text-muted uppercase tracking-wide mb-1">Genel Toplam</div>
          <div class="text-2xl font-bold text-primary">{{ fmt(totals.grand) }}</div>
          <div class="text-xs text-muted mt-1">{{ totals.sales }} işlem</div>
        </div>
      </div>

      <!-- Tablo -->
      <div v-if="!filteredReports.length"
           class="bg-white rounded-2xl shadow-sm p-16 text-center text-muted">
        {{ reports.length ? 'Filtreye uyan Z raporu yok.' : 'Henüz Z raporu bulunmuyor.' }}
      </div>

      <div v-else class="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left  px-6 py-3 text-xs font-bold text-muted uppercase">Tarih</th>
                <th class="text-right px-6 py-3 text-xs font-bold text-muted uppercase">İşlem</th>
                <th class="text-right px-6 py-3 text-xs font-bold text-muted uppercase">Nakit</th>
                <th class="text-right px-6 py-3 text-xs font-bold text-muted uppercase">Kart</th>
                <th class="text-right px-6 py-3 text-xs font-bold text-muted uppercase">İndirim</th>
                <th class="text-right px-6 py-3 text-xs font-bold text-muted uppercase">Toplam</th>
                <th class="text-center px-6 py-3 text-xs font-bold text-muted uppercase">Detay</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="z in filteredReports" :key="z.id"
                  class="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
                <td class="px-6 py-4 text-sm font-semibold text-primary whitespace-nowrap">
                  {{ fmtDate(z.reportDate) }}
                </td>
                <td class="px-6 py-4 text-sm text-right text-muted font-semibold">
                  {{ z.saleCount }}
                </td>
                <td class="px-6 py-4 text-sm text-right text-success font-semibold">
                  {{ fmt(z.totalCash) }}
                </td>
                <td class="px-6 py-4 text-sm text-right text-accent font-semibold">
                  {{ fmt(z.totalCard) }}
                </td>
                <td class="px-6 py-4 text-sm text-right text-danger">
                  {{ fmt(z.totalDiscount) }}
                </td>
                <td class="px-6 py-4 text-sm text-right font-bold text-primary">
                  {{ fmt(z.grandTotal) }}
                </td>
                <td class="px-6 py-4 text-center">
                  <button @click="openDetail(z)"
                          class="px-3 py-1.5 text-xs font-semibold text-accent bg-accent/10
                                 hover:bg-accent hover:text-white rounded-lg transition-all">
                    Detay
                  </button>
                </td>
              </tr>
            </tbody>
            <!-- Toplam satırı -->
            <tfoot v-if="filteredReports.length > 1" class="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td class="px-6 py-3 text-sm font-bold">TOPLAM</td>
                <td class="px-6 py-3 text-sm text-right font-bold text-muted">{{ totals.sales }}</td>
                <td class="px-6 py-3 text-sm text-right font-bold text-success">{{ fmt(totals.cash) }}</td>
                <td class="px-6 py-3 text-sm text-right font-bold text-accent">{{ fmt(totals.card) }}</td>
                <td class="px-6 py-3 text-sm text-right font-bold text-danger">{{ fmt(totals.discount) }}</td>
                <td class="px-6 py-3 text-sm text-right font-bold text-primary">{{ fmt(totals.grand) }}</td>
                <td/>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </template>

    <!-- ── Detay Modal ────────────────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="modal.open"
           class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
           @click.self="modal.open = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">

          <!-- Modal başlık -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <div>
              <h2 class="font-bold text-primary text-lg">
                Günlük Detay — {{ modal.dateLabel }}
              </h2>
              <p class="text-xs text-muted mt-0.5">Satış kalemleri</p>
            </div>
            <button @click="modal.open = false"
                    class="p-2 rounded-xl text-muted hover:text-danger hover:bg-red-50 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Modal içerik -->
          <div class="overflow-y-auto flex-1 px-6 py-4">
            <div v-if="modal.loading" class="py-16 text-center text-muted text-sm">
              Detaylar yükleniyor...
            </div>
            <div v-else-if="modal.error" class="py-8 text-center text-danger text-sm">
              {{ modal.error }}
            </div>
            <template v-else-if="modal.data">
              <!-- Rapor özeti -->
              <div class="grid grid-cols-3 gap-3 mb-5">
                <div class="bg-green-50 rounded-xl p-3 text-center">
                  <div class="text-xs text-muted mb-0.5">Nakit</div>
                  <div class="font-bold text-success text-sm">{{ fmt(modal.zRow?.totalCash) }}</div>
                </div>
                <div class="bg-blue-50 rounded-xl p-3 text-center">
                  <div class="text-xs text-muted mb-0.5">Kart</div>
                  <div class="font-bold text-accent text-sm">{{ fmt(modal.zRow?.totalCard) }}</div>
                </div>
                <div class="bg-gray-50 rounded-xl p-3 text-center">
                  <div class="text-xs text-muted mb-0.5">Toplam</div>
                  <div class="font-bold text-primary text-sm">{{ fmt(modal.zRow?.grandTotal) }}</div>
                </div>
              </div>

              <!-- Satışlar tablosu -->
              <div v-if="dailySales.length" class="overflow-x-auto rounded-xl border border-gray-100">
                <table class="w-full text-sm">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="text-left px-4 py-2.5 text-xs font-bold text-muted uppercase">Ürün</th>
                      <th class="text-right px-4 py-2.5 text-xs font-bold text-muted uppercase">Adet</th>
                      <th class="text-right px-4 py-2.5 text-xs font-bold text-muted uppercase">Birim</th>
                      <th class="text-right px-4 py-2.5 text-xs font-bold text-muted uppercase">Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(s, i) in dailySales" :key="i"
                        class="border-t border-gray-50">
                      <td class="px-4 py-2.5 font-medium text-primary">{{ s.productName ?? s.name ?? '—' }}</td>
                      <td class="px-4 py-2.5 text-right text-muted">{{ s.quantity ?? s.qty ?? '—' }}</td>
                      <td class="px-4 py-2.5 text-right text-muted">{{ fmt(s.unitPrice ?? s.price) }}</td>
                      <td class="px-4 py-2.5 text-right font-semibold text-primary">{{ fmt(s.total ?? s.totalAmount) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="py-8 text-center text-muted text-sm">
                Bu gün için satış kalemi bulunamadı.
              </div>
            </template>
          </div>

          <div class="px-6 py-4 border-t border-gray-100 flex justify-end flex-shrink-0">
            <button @click="modal.open = false"
                    class="px-5 py-2 text-sm text-muted border border-gray-200 rounded-xl
                           hover:border-gray-300 hover:text-primary transition-colors">
              Kapat
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '../../api/api'

const reports    = ref([])
const loading    = ref(true)
const loadError  = ref('')
const takingZ    = ref(false)

const filter = reactive({ start: '', end: '' })

const filteredReports = computed(() => {
  if (!filter.start && !filter.end) return reports.value
  return reports.value.filter(z => {
    const d = z.reportDate?.slice(0, 10) ?? ''
    if (filter.start && d < filter.start) return false
    if (filter.end   && d > filter.end)   return false
    return true
  })
})

const totals = computed(() => ({
  cash:     filteredReports.value.reduce((s, z) => s + (z.totalCash     ?? 0), 0),
  card:     filteredReports.value.reduce((s, z) => s + (z.totalCard     ?? 0), 0),
  discount: filteredReports.value.reduce((s, z) => s + (z.totalDiscount ?? 0), 0),
  grand:    filteredReports.value.reduce((s, z) => s + (z.grandTotal    ?? 0), 0),
  sales:    filteredReports.value.reduce((s, z) => s + (z.saleCount     ?? 0), 0),
}))

function fmt(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
}
function clearFilter() {
  filter.start = ''
  filter.end   = ''
}

async function load() {
  loading.value   = true
  loadError.value = ''
  try {
    const res = await api.getZReports()
    reports.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    console.error('[ZListesi] getZReports hatası:', e?.response?.status, e?.response?.data ?? e?.message)
    loadError.value = e?.response?.data?.message ?? e?.message ?? 'Bilinmeyen hata'
    reports.value = []
  } finally {
    loading.value = false
  }
}

async function takeZ() {
  if (!confirm('Z raporu alınacak. Günlük kasa sayacı sıfırlanır. Devam edilsin mi?')) return
  takingZ.value = true
  try {
    await api.takeZReport()
    await load()
  } catch (e) {
    console.error('[ZListesi] takeZReport hatası:', e?.response?.status, e?.response?.data ?? e?.message)
    alert('Z raporu alınamadı: ' + (e?.response?.data?.message ?? e?.message ?? 'Bilinmeyen hata'))
  } finally {
    takingZ.value = false
  }
}

// ── Detay modal ────────────────────────────────────────────────────────────
const modal = reactive({
  open:      false,
  loading:   false,
  error:     '',
  dateLabel: '',
  data:      null,
  zRow:      null,
})

const dailySales = computed(() => {
  if (!modal.data) return []
  // API response farklı şekillerde gelebilir: array, ya da {sales:[...]}
  if (Array.isArray(modal.data))         return modal.data
  if (Array.isArray(modal.data.sales))   return modal.data.sales
  if (Array.isArray(modal.data.items))   return modal.data.items
  if (Array.isArray(modal.data.details)) return modal.data.details
  return []
})

async function openDetail(zRow) {
  const dateStr = zRow.reportDate?.slice(0, 10) ?? ''
  modal.open      = true
  modal.loading   = true
  modal.error     = ''
  modal.data      = null
  modal.zRow      = zRow
  modal.dateLabel = fmtDate(zRow.reportDate)

  try {
    const res = await api.getDailyReport(dateStr)
    modal.data = res.data
  } catch (e) {
    console.error('[ZListesi] getDailyReport hatası:', e?.response?.status, e?.response?.data ?? e?.message)
    modal.error = e?.response?.data?.message ?? e?.message ?? 'Detaylar yüklenemedi.'
  } finally {
    modal.loading = false
  }
}

onMounted(load)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease }
.fade-enter-from, .fade-leave-to       { opacity: 0 }
</style>
