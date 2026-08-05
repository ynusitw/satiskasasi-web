<template>
  <div class="p-8">

    <!-- Başlık -->
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold text-primary">Günlük Ciro</h1>
        <p class="text-muted text-sm mt-1">{{ selectedDate }} tarihine ait satış özeti</p>
      </div>
      <input v-model="selectedDate" type="date"
             class="px-4 py-2 border border-gray-200 rounded-xl text-sm
                    focus:border-accent focus:outline-none"/>
    </div>

    <div v-if="loading" class="text-center py-16 text-muted">Yükleniyor...</div>

    <template v-else-if="report">

      <!-- Özet Kartlar -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-2xl shadow-sm p-5">
          <div class="text-xs text-muted mb-1">Toplam Satış</div>
          <div class="text-2xl font-bold text-primary">{{ fmt(report.grandTotal) }}</div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm p-5">
          <div class="text-xs text-muted mb-1">İşlem Sayısı</div>
          <div class="text-2xl font-bold text-primary">{{ report.saleCount }}</div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm p-5">
          <div class="text-xs text-muted mb-1">Nakit</div>
          <div class="text-2xl font-bold text-success">{{ fmt(report.totalCash) }}</div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm p-5">
          <div class="text-xs text-muted mb-1">Kart</div>
          <div class="text-2xl font-bold text-accent">{{ fmt(report.totalCard) }}</div>
        </div>
      </div>

      <!-- Satış Listesi -->
      <div v-if="report.sales?.length" class="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <span class="font-semibold text-sm">Satış Listesi</span>
          <span class="text-xs text-muted">
            Detay için satıra tıklayın
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left px-5 py-3 text-xs font-bold text-muted uppercase w-16">#</th>
                <th class="text-left px-5 py-3 text-xs font-bold text-muted uppercase">Saat</th>
                <th class="text-left px-5 py-3 text-xs font-bold text-muted uppercase">Kasiyer</th>
                <th class="text-left px-5 py-3 text-xs font-bold text-muted uppercase hidden md:table-cell">Ödeme</th>
                <th class="text-right px-5 py-3 text-xs font-bold text-muted uppercase">Tutar</th>
                <th class="w-10 px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="s in report.sales" :key="s.id">

                <!-- Ana satır — tıklanabilir -->
                <tr @click="toggleExpand(s.id)"
                    class="border-t border-gray-50 cursor-pointer transition-colors select-none"
                    :class="expandedId === s.id
                      ? 'bg-blue-50 hover:bg-blue-50'
                      : 'hover:bg-gray-50'">

                  <td class="px-5 py-3.5 text-sm text-muted font-mono">#{{ s.id }}</td>

                  <td class="px-5 py-3.5 text-sm font-semibold">{{ time(s.saleDate) }}</td>

                  <!-- Kasiyer adı — API'den gelebilecek alan adlarını dene -->
                  <td class="px-5 py-3.5 text-sm">
                    <div class="flex items-center gap-2">
                      <span class="w-6 h-6 rounded-full bg-accent/15 text-accent
                                   flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {{ kasiyerAdi(s).charAt(0).toUpperCase() }}
                      </span>
                      <span>{{ kasiyerAdi(s) }}</span>
                    </div>
                  </td>

                  <td class="px-5 py-3.5 text-sm hidden md:table-cell">
                    <span class="px-2 py-0.5 rounded-full text-xs font-bold"
                          :class="odemeClass(s.paymentMethod)">
                      {{ s.paymentMethod }}
                    </span>
                  </td>

                  <td class="px-5 py-3.5 text-sm font-bold text-right text-success">
                    {{ fmt(s.total) }}
                  </td>

                  <!-- Chevron -->
                  <td class="px-3 py-3.5 text-center">
                    <svg class="w-4 h-4 text-muted mx-auto transition-transform duration-200"
                         :class="expandedId === s.id ? 'rotate-180 text-accent' : ''"
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round"
                            stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </td>
                </tr>

                <!-- Detay satırı — açılır panel -->
                <tr v-if="expandedId === s.id" :key="`detail-${s.id}`">
                  <td colspan="6" class="px-0 py-0 border-t border-blue-100">
                    <div class="bg-blue-50/60 px-5 py-4">

                      <!-- Satış bilgi bandı -->
                      <div class="flex flex-wrap gap-4 mb-4 text-sm">
                        <div class="flex items-center gap-1.5 text-muted">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                          </svg>
                          <span class="font-semibold text-primary">{{ kasiyerAdi(s) }}</span>
                        </div>
                        <div class="flex items-center gap-1.5 text-muted">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          {{ time(s.saleDate) }}
                        </div>
                        <div class="flex items-center gap-1.5 text-muted">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                          </svg>
                          {{ s.paymentMethod }}
                        </div>
                        <div class="ml-auto font-bold text-success text-base">
                          {{ fmt(s.total) }}
                        </div>
                      </div>

                      <!-- Ürün listesi -->
                      <div class="bg-white rounded-xl overflow-hidden border border-blue-100">
                        <!-- Ürünler varsa tablo göster -->
                        <template v-if="saleItems(s).length">
                          <table class="w-full text-sm">
                            <thead class="bg-gray-50 border-b border-gray-100">
                              <tr>
                                <th class="text-left px-4 py-2.5 text-xs font-bold text-muted uppercase">Ürün</th>
                                <th class="text-right px-4 py-2.5 text-xs font-bold text-muted uppercase w-20">Miktar</th>
                                <th class="text-right px-4 py-2.5 text-xs font-bold text-muted uppercase w-28 hidden sm:table-cell">Birim Fiyat</th>
                                <th class="text-right px-4 py-2.5 text-xs font-bold text-muted uppercase w-28">Toplam</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="(item, idx) in saleItems(s)" :key="idx"
                                  class="border-t border-gray-50">
                                <td class="px-4 py-2.5 font-medium">
                                  {{ item.productName ?? item.name ?? item.urunAdi ?? '—' }}
                                </td>
                                <td class="px-4 py-2.5 text-right text-muted">
                                  {{ item.quantity ?? item.miktar ?? 1 }}
                                  {{ item.unit ?? item.birim ?? '' }}
                                </td>
                                <td class="px-4 py-2.5 text-right text-muted hidden sm:table-cell">
                                  {{ fmt(item.unitPrice ?? item.birimFiyat ?? item.price ?? 0) }}
                                </td>
                                <td class="px-4 py-2.5 text-right font-semibold">
                                  {{ fmt(item.total ?? item.amount ?? item.tutar ??
                                    ((item.quantity ?? item.miktar ?? 1) *
                                     (item.unitPrice ?? item.birimFiyat ?? item.price ?? 0))) }}
                                </td>
                              </tr>
                            </tbody>
                            <tfoot class="bg-gray-50 border-t-2 border-gray-200">
                              <tr>
                                <td colspan="3" class="px-4 py-2.5 text-sm font-bold text-right hidden sm:table-cell">
                                  Toplam
                                </td>
                                <td colspan="2" class="px-4 py-2.5 text-sm font-bold sm:hidden">
                                  Toplam
                                </td>
                                <td class="px-4 py-2.5 text-right font-bold text-success">
                                  {{ fmt(s.total) }}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </template>

                        <!-- Ürün bilgisi henüz API'den gelmiyor -->
                        <template v-else>
                          <div class="px-4 py-6 text-center text-muted text-sm">
                            <div class="text-2xl mb-2">🛒</div>
                            <div>Bu satışa ait ürün detayı bulunamadı.</div>
                            <div class="text-xs mt-1 text-muted/60">
                              API yanıtında <code class="bg-gray-100 px-1 rounded">items</code> alanı bekleniyor.
                            </div>
                          </div>
                        </template>
                      </div>

                    </div>
                  </td>
                </tr>

              </template>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="bg-white rounded-2xl shadow-sm p-12 text-center text-muted">
        Bu tarihte satış kaydı bulunamadı.
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import api from '../../api/api'

const today        = new Date().toISOString().split('T')[0]
const selectedDate = ref(today)
const report       = ref(null)
const loading      = ref(false)
const expandedId   = ref(null)

// ─── Format yardımcıları ─────────────────────────────────────────────────────
function fmt(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}
function time(d) {
  return new Date(d).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

// Kasiyeri API'den gelebilecek farklı alan adlarına göre çöz
function kasiyerAdi(s) {
  return s.userName
    ?? s.cashierName
    ?? s.user?.name
    ?? s.user?.username
    ?? s.operatorName
    ?? 'Bilinmiyor'
}

// Ürün kalemlerini API'den gelebilecek farklı alan adlarına göre çöz
function saleItems(s) {
  return s.items ?? s.saleItems ?? s.lines ?? s.products ?? []
}

// Ödeme yöntemi badge rengi
function odemeClass(method) {
  const m = (method ?? '').toLowerCase()
  if (m.includes('nakit') || m.includes('cash'))   return 'bg-green-100 text-green-700'
  if (m.includes('kart')  || m.includes('card'))   return 'bg-blue-100 text-blue-700'
  if (m.includes('havale')|| m.includes('transfer')) return 'bg-purple-100 text-purple-700'
  return 'bg-gray-100 text-gray-600'
}

// ─── Expand/collapse ─────────────────────────────────────────────────────────
function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

// ─── Veri yükleme ────────────────────────────────────────────────────────────
async function load() {
  loading.value  = true
  expandedId.value = null
  try {
    report.value = (await api.getDailyReport(selectedDate.value)).data
  } catch {
    report.value = null
  } finally {
    loading.value = false
  }
}

watch(selectedDate, load)
onMounted(load)
</script>
