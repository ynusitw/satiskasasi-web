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
        <div class="text-2xl font-bold text-danger">{{ fmt(toplamAlis) }}</div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm p-5 col-span-2 lg:col-span-1">
        <div class="text-xs text-muted mb-1">Toplam Satış</div>
        <div class="text-2xl font-bold text-success">{{ fmt(toplamSatis) }}</div>
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
              <th class="text-left px-5 py-3 text-xs font-bold text-muted uppercase hidden lg:table-cell">Açıklama</th>
              <th class="text-right px-5 py-3 text-xs font-bold text-muted uppercase hidden lg:table-cell">Ara Toplam</th>
              <th class="text-right px-5 py-3 text-xs font-bold text-muted uppercase hidden lg:table-cell">KDV</th>
              <th class="text-right px-5 py-3 text-xs font-bold text-muted uppercase">Genel Toplam</th>
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
              <td class="px-5 py-4 text-sm text-muted whitespace-nowrap">{{ f.tarih }}</td>
              <td class="px-5 py-4 text-sm text-muted hidden lg:table-cell">{{ f.aciklama }}</td>
              <td class="px-5 py-4 text-sm text-right text-muted hidden lg:table-cell">{{ fmt(f.araToplam) }}</td>
              <td class="px-5 py-4 text-sm text-right text-muted hidden lg:table-cell">{{ fmt(f.kdvToplam) }}</td>
              <td class="px-5 py-4 text-sm font-bold text-right"
                  :class="f.tip === 'Alış' ? 'text-danger' : 'text-success'">
                {{ fmt(f.genelToplam) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Yeni Fatura Modalı (geniş, ERP stili) -->
    <Teleport to="body">
      <div v-if="modal.show"
           class="fixed inset-0 bg-black/60 z-50 overflow-y-auto">
        <div class="min-h-screen flex items-start justify-center p-4 py-8">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl">

            <!-- Modal Başlık -->
            <div class="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 class="text-xl font-bold text-primary">Yeni Fatura Oluştur</h2>
                <p class="text-xs text-muted mt-0.5">Kalemleri girdikten sonra kaydedin</p>
              </div>
              <button @click="modal.show = false"
                      class="p-2 text-muted hover:text-danger hover:bg-red-50 rounded-xl transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Modal Gövde -->
            <div class="p-8 space-y-8">

              <!-- Fatura Başlık Bilgileri -->
              <div>
                <div class="text-xs font-bold text-muted uppercase tracking-wider mb-3">Fatura Bilgileri</div>
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">

                  <!-- Fatura Tipi -->
                  <div class="col-span-2 lg:col-span-1">
                    <label class="block text-sm font-semibold mb-2">Fatura Tipi *</label>
                    <div class="flex gap-2">
                      <label v-for="t in ['Alış','Satış']" :key="t"
                             class="flex items-center gap-1.5 cursor-pointer flex-1 border-2 rounded-xl px-3 py-2 transition-all"
                             :class="form.tip === t
                               ? t === 'Alış'
                                 ? 'border-danger bg-red-50 text-danger'
                                 : 'border-success bg-green-50 text-success'
                               : 'border-gray-200 text-muted hover:border-gray-300'">
                        <input type="radio" v-model="form.tip" :value="t" class="hidden"/>
                        <span class="text-sm font-bold">{{ t }}</span>
                      </label>
                    </div>
                  </div>

                  <!-- Fatura No -->
                  <div>
                    <label class="block text-sm font-semibold mb-1">Fatura No *</label>
                    <input v-model="form.no" placeholder="FTR-001"
                           class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm
                                  focus:border-accent focus:outline-none"/>
                  </div>

                  <!-- Tarih -->
                  <div>
                    <label class="block text-sm font-semibold mb-1">Tarih *</label>
                    <input v-model="form.tarih" type="date"
                           class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm
                                  focus:border-accent focus:outline-none"/>
                  </div>

                  <!-- Cari -->
                  <div>
                    <label class="block text-sm font-semibold mb-1">Cari *</label>
                    <select v-model="form.cari"
                            class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm
                                   focus:border-accent focus:outline-none bg-white">
                      <option value="">Cari seçin...</option>
                      <option v-for="c in mockCariler" :key="c">{{ c }}</option>
                    </select>
                  </div>

                  <!-- Açıklama -->
                  <div class="col-span-2 lg:col-span-4">
                    <label class="block text-sm font-semibold mb-1">Açıklama</label>
                    <input v-model="form.aciklama" placeholder="Fatura açıklaması (isteğe bağlı)"
                           class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm
                                  focus:border-accent focus:outline-none"/>
                  </div>
                </div>
              </div>

              <!-- Fatura Kalemleri -->
              <div>
                <div class="flex items-center justify-between mb-3">
                  <div class="text-xs font-bold text-muted uppercase tracking-wider">
                    Fatura Kalemleri
                    <span class="ml-2 font-normal normal-case text-muted/70">{{ kalemler.length }} kalem</span>
                  </div>
                  <button @click="yeniKalem"
                          class="flex items-center gap-1.5 px-4 py-2 bg-accent/10 text-accent
                                 rounded-xl text-sm font-bold hover:bg-accent hover:text-white transition-all">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    Yeni Ürün Ekle
                  </button>
                </div>

                <div class="rounded-xl border border-gray-200 overflow-hidden">
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                      <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th class="px-3 py-2.5 text-left text-xs font-bold text-muted w-10">#</th>
                          <th class="px-3 py-2.5 text-left text-xs font-bold text-muted min-w-48">Ürün</th>
                          <th class="px-3 py-2.5 text-right text-xs font-bold text-muted w-24">Miktar</th>
                          <th class="px-3 py-2.5 text-right text-xs font-bold text-muted w-32">Birim Fiyat</th>
                          <th class="px-3 py-2.5 text-center text-xs font-bold text-muted w-24">KDV %</th>
                          <th class="px-3 py-2.5 text-right text-xs font-bold text-muted w-32">Ara Toplam</th>
                          <th class="px-3 py-2.5 text-right text-xs font-bold text-muted w-32">KDV Tutarı</th>
                          <th class="px-3 py-2.5 text-right text-xs font-bold text-muted w-32">Satır Toplamı</th>
                          <th class="px-3 py-2.5 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-if="!kalemler.length">
                          <td colspan="9" class="text-center py-10 text-muted">
                            <div class="text-2xl mb-2">📦</div>
                            <div class="text-sm">"Yeni Ürün Ekle" butonuna basarak kalem girin</div>
                          </td>
                        </tr>
                        <tr v-for="(k, i) in kalemler" :key="k.id"
                            class="border-t border-gray-100 hover:bg-gray-50 transition-colors">

                          <!-- Sıra no -->
                          <td class="px-3 py-2 text-xs text-muted text-center">{{ i + 1 }}</td>

                          <!-- Ürün seçimi -->
                          <td class="px-3 py-2">
                            <select v-model="k.urunAdi" @change="urunSecildi(k)"
                                    class="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm
                                           focus:border-accent focus:outline-none bg-white">
                              <option value="">Ürün seçin...</option>
                              <option v-for="u in mockUrunler" :key="u.id" :value="u.ad">{{ u.ad }}</option>
                            </select>
                          </td>

                          <!-- Miktar -->
                          <td class="px-3 py-2">
                            <input v-model.number="k.miktar" type="number" min="0.001" step="1"
                                   class="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm
                                          focus:border-accent focus:outline-none text-right"/>
                          </td>

                          <!-- Birim Fiyat -->
                          <td class="px-3 py-2">
                            <input v-model.number="k.birimFiyat" type="number" min="0" step="0.01"
                                   class="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm
                                          focus:border-accent focus:outline-none text-right"/>
                          </td>

                          <!-- KDV Oranı -->
                          <td class="px-3 py-2">
                            <select v-model.number="k.kdv"
                                    class="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm
                                           focus:border-accent focus:outline-none bg-white text-center">
                              <option :value="0">%0</option>
                              <option :value="1">%1</option>
                              <option :value="10">%10</option>
                              <option :value="20">%20</option>
                            </select>
                          </td>

                          <!-- Ara Toplam (readonly) -->
                          <td class="px-3 py-2 text-right text-muted tabular-nums">
                            {{ fmtN(kalemAra(k)) }}
                          </td>

                          <!-- KDV Tutarı (readonly) -->
                          <td class="px-3 py-2 text-right text-muted tabular-nums">
                            {{ fmtN(kalemKdvTutar(k)) }}
                          </td>

                          <!-- Satır Toplamı (readonly) -->
                          <td class="px-3 py-2 text-right font-semibold text-primary tabular-nums">
                            {{ fmtN(kalemToplam(k)) }}
                          </td>

                          <!-- Sil -->
                          <td class="px-3 py-2 text-center">
                            <button @click="kalemSil(k.id)"
                                    class="p-1.5 text-gray-300 hover:text-danger hover:bg-red-50
                                           rounded-lg transition-all">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Toplamlar -->
                <div class="flex justify-end mt-4">
                  <div class="bg-gray-50 rounded-xl px-6 py-4 min-w-72 space-y-2 text-sm border border-gray-200">
                    <div class="flex justify-between gap-8">
                      <span class="text-muted">Ara Toplam</span>
                      <span class="tabular-nums font-medium">{{ fmt(araToplam) }}</span>
                    </div>
                    <div class="flex justify-between gap-8">
                      <span class="text-muted">KDV Toplamı</span>
                      <span class="tabular-nums font-medium">{{ fmt(kdvToplam) }}</span>
                    </div>
                    <div class="flex justify-between gap-8 font-bold text-base border-t border-gray-200 pt-3 mt-1">
                      <span>Genel Toplam</span>
                      <span class="tabular-nums"
                            :class="form.tip === 'Alış' ? 'text-danger' : 'text-success'">
                        {{ fmt(genelToplam) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="px-8 py-5 border-t border-gray-100 flex items-center justify-between gap-4">
              <div class="text-sm min-w-0 flex-1">
                <span v-if="error" class="text-danger">{{ error }}</span>
                <span v-else class="text-muted">
                  {{ kalemler.length > 0
                    ? `${kalemler.length} kalem · toplam ${fmt(genelToplam)}`
                    : 'Fatura kalemleri ekleyin' }}
                </span>
              </div>
              <div class="flex gap-3 flex-shrink-0">
                <button @click="modal.show = false"
                        class="px-5 py-2.5 bg-gray-100 rounded-xl text-sm font-bold hover:bg-gray-200">
                  İptal
                </button>
                <button @click="save"
                        class="px-6 py-2.5 bg-accent text-white rounded-xl text-sm font-bold
                               hover:bg-blue-600 transition-colors">
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Risk Limiti Uyarı Modalı -->
    <Teleport to="body">
      <div v-if="riskModal.show"
           class="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
          </div>
          <h3 class="text-lg font-bold text-primary mb-2">Risk Limiti Aşılıyor</h3>
          <p class="text-sm text-muted mb-4">
            <span class="font-semibold text-primary">{{ riskModal.cari }}</span> carisi için
            belirlenen risk limiti aşılmaktadır.
          </p>
          <div class="bg-red-50 rounded-xl p-4 mb-6 text-left space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-muted">Risk Limiti</span>
              <span class="font-semibold">{{ fmt(riskModal.limit) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted">Mevcut Bakiye</span>
              <span class="font-semibold text-danger">{{ fmt(riskModal.mevcutBakiye) }}</span>
            </div>
            <div class="flex justify-between text-sm border-t border-red-200 pt-2">
              <span class="text-muted">İşlem Sonrası</span>
              <span class="font-bold text-danger">{{ fmt(riskModal.yeniBakiye) }}</span>
            </div>
          </div>
          <p class="text-sm font-semibold text-primary mb-6">İşlemi onaylıyor musunuz?</p>
          <div class="flex gap-3">
            <button @click="riskModal.show = false"
                    class="flex-1 py-2.5 bg-gray-100 rounded-xl text-sm font-bold hover:bg-gray-200">
              Vazgeç
            </button>
            <button @click="onaylaVeKaydet"
                    class="flex-1 py-2.5 bg-danger text-white rounded-xl text-sm font-bold
                           hover:bg-red-600 transition-colors">
              Onayla, Kaydet
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

const mockCariler = [
  'Ahmet Yılmaz',
  'ABC Gıda Tic. Ltd.',
  'Fatma Demir',
  'XYZ Market A.Ş.',
  'Mehmet Kaya',
]

const mockUrunler = [
  { id: 1,  ad: 'Ekmek',          fiyat: 5.00,   kdv: 1  },
  { id: 2,  ad: 'Süt 1L',         fiyat: 35.00,  kdv: 1  },
  { id: 3,  ad: 'Çay 500g',       fiyat: 89.90,  kdv: 10 },
  { id: 4,  ad: 'Deterjan',       fiyat: 45.00,  kdv: 20 },
  { id: 5,  ad: 'Makarna 500g',   fiyat: 22.50,  kdv: 1  },
  { id: 6,  ad: 'Zeytinyağı 1L',  fiyat: 180.00, kdv: 10 },
  { id: 7,  ad: 'Şeker 1kg',      fiyat: 28.00,  kdv: 1  },
  { id: 8,  ad: 'Un 1kg',         fiyat: 25.00,  kdv: 1  },
  { id: 9,  ad: 'Temizlik Bezi',  fiyat: 55.00,  kdv: 20 },
  { id: 10, ad: 'Su 5L',          fiyat: 12.00,  kdv: 1  },
]

const cariRiskData = {
  'Ahmet Yılmaz':       { limit: 5000,  bakiye: 1500.00  },
  'ABC Gıda Tic. Ltd.': { limit: 10000, bakiye: -2300.50 },
  'Fatma Demir':        { limit: 2000,  bakiye: 0        },
  'XYZ Market A.Ş.':   { limit: 4000,  bakiye: 4800.00  },
  'Mehmet Kaya':        { limit: 3000,  bakiye: -750.00  },
}

const faturalar = ref([
  {
    id: 1, tip: 'Satış', no: 'STF-001', cari: 'Ahmet Yılmaz',
    tarih: '2026-07-28', aciklama: 'Haziran ayı malları',
    araToplam: 1250.00, kdvToplam: 250.00, genelToplam: 1500.00,
  },
  {
    id: 2, tip: 'Alış', no: 'ALF-001', cari: 'ABC Gıda Tic. Ltd.',
    tarih: '2026-07-25', aciklama: 'Ürün alımı',
    araToplam: 2093.18, kdvToplam: 207.32, genelToplam: 2300.50,
  },
  {
    id: 3, tip: 'Satış', no: 'STF-002', cari: 'Mehmet Kaya',
    tarih: '2026-07-20', aciklama: 'Perakende satış',
    araToplam: 625.00, kdvToplam: 125.00, genelToplam: 750.00,
  },
  {
    id: 4, tip: 'Alış', no: 'ALF-002', cari: 'XYZ Market A.Ş.',
    tarih: '2026-07-15', aciklama: 'Stok takviyesi',
    araToplam: 4363.64, kdvToplam: 436.36, genelToplam: 4800.00,
  },
])

const search    = ref('')
const filterTip = ref('')
const modal     = reactive({ show: false })
const riskModal = reactive({ show: false, cari: '', limit: 0, mevcutBakiye: 0, yeniBakiye: 0 })
const error     = ref('')
const form      = reactive({ tip: 'Satış', no: '', tarih: today, cari: '', aciklama: '' })

// Dinamik kalem listesi
const kalemler = ref([])

// ─── Kalem yardımcı fonksiyonlar ───────────────────────────────────────────
function kalemAra(k)      { return k.miktar * k.birimFiyat }
function kalemKdvTutar(k) { return kalemAra(k) * k.kdv / 100 }
function kalemToplam(k)   { return kalemAra(k) + kalemKdvTutar(k) }

// ─── Fatura toplamları ──────────────────────────────────────────────────────
const araToplam   = computed(() => kalemler.value.reduce((s, k) => s + kalemAra(k),      0))
const kdvToplam   = computed(() => kalemler.value.reduce((s, k) => s + kalemKdvTutar(k), 0))
const genelToplam = computed(() => araToplam.value + kdvToplam.value)

// ─── Liste toplamları ───────────────────────────────────────────────────────
const toplamAlis  = computed(() => faturalar.value.filter(f => f.tip === 'Alış') .reduce((s, f) => s + f.genelToplam, 0))
const toplamSatis = computed(() => faturalar.value.filter(f => f.tip === 'Satış').reduce((s, f) => s + f.genelToplam, 0))

// ─── Filtre ─────────────────────────────────────────────────────────────────
const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return faturalar.value.filter(f => {
    const matchTip = !filterTip.value || f.tip === filterTip.value
    const matchQ   = !q || f.no.toLowerCase().includes(q) || f.cari.toLowerCase().includes(q)
    return matchTip && matchQ
  })
})

// ─── Format ─────────────────────────────────────────────────────────────────
function fmt(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}
function fmtN(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(v ?? 0)
}

// ─── Kalem işlemleri ────────────────────────────────────────────────────────
function yeniKalem() {
  kalemler.value.push({ id: Date.now(), urunAdi: '', miktar: 1, birimFiyat: 0, kdv: 20 })
}

function kalemSil(id) {
  kalemler.value = kalemler.value.filter(k => k.id !== id)
}

function urunSecildi(kalem) {
  const urun = mockUrunler.find(u => u.ad === kalem.urunAdi)
  if (urun) {
    kalem.birimFiyat = urun.fiyat
    kalem.kdv        = urun.kdv
  }
}

// ─── Modal ──────────────────────────────────────────────────────────────────
function openCreate() {
  Object.assign(form, { tip: 'Satış', no: '', tarih: today, cari: '', aciklama: '' })
  kalemler.value = []
  modal.show     = true
  error.value    = ''
}

// ─── Kaydetme / Validasyon ──────────────────────────────────────────────────
function save() {
  if (!form.no.trim())           { error.value = 'Fatura no zorunludur.'; return }
  if (!form.cari)                { error.value = 'Cari seçimi zorunludur.'; return }
  if (!kalemler.value.length)    { error.value = 'En az bir kalem eklenmelidir.'; return }
  if (kalemler.value.some(k => !k.urunAdi))   { error.value = 'Tüm satırlarda ürün seçilmelidir.'; return }
  if (kalemler.value.some(k => k.miktar <= 0)){ error.value = 'Miktar sıfırdan büyük olmalıdır.'; return }
  if (genelToplam.value <= 0)    { error.value = 'Fatura tutarı sıfırdan büyük olmalıdır.'; return }

  // Satış faturası → cari bakiyesi artar → risk limiti kontrolü
  if (form.tip === 'Satış') {
    const data = cariRiskData[form.cari]
    if (data && data.limit > 0) {
      const yeniBakiye = data.bakiye + genelToplam.value
      if (yeniBakiye > data.limit) {
        Object.assign(riskModal, {
          show: true,
          cari: form.cari,
          limit: data.limit,
          mevcutBakiye: data.bakiye,
          yeniBakiye,
        })
        return
      }
    }
  }

  kaydet()
}

function onaylaVeKaydet() {
  riskModal.show = false
  kaydet()
}

function kaydet() {
  faturalar.value.unshift({
    ...form,
    id: Date.now(),
    kalemler: kalemler.value.map(k => ({ ...k })),
    araToplam:   araToplam.value,
    kdvToplam:   kdvToplam.value,
    genelToplam: genelToplam.value,
  })
  modal.show = false
}
</script>
