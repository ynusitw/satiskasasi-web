<template>
  <div class="p-8 max-w-7xl">

    <!-- Başlık -->
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold text-primary">Fiş &amp; Yazıcı Ayarları</h1>
        <p class="text-muted text-sm mt-1">
          Kasadan çıkan fişi bu sayfa belirler — tasarım, yazıcı ve yönlendirme
        </p>
      </div>
      <div class="flex gap-3">
        <button @click="load" :disabled="loading || saving"
                class="px-4 py-2 bg-gray-100 text-primary rounded-xl text-sm
                       font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50">
          ↺ Yenile
        </button>
        <button @click="save" :disabled="loading || saving"
                class="px-5 py-2 bg-accent text-white rounded-xl text-sm
                       font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50">
          {{ saving ? 'Kaydediliyor...' : '✓ Kaydet' }}
        </button>
      </div>
    </div>

    <div v-if="error"
         class="mb-4 p-3 bg-red-50 text-danger rounded-xl text-sm border border-red-100">
      {{ error }}
    </div>
    <div v-if="savedOk"
         class="mb-4 p-3 bg-green-50 text-success rounded-xl text-sm font-semibold
                border border-green-100">
      ✓ Ayarlar başarıyla kaydedildi
    </div>

    <div v-if="loading" class="flex justify-center py-24 text-muted text-sm">
      Yükleniyor...
    </div>

    <div v-else class="flex flex-col xl:flex-row gap-6 items-start">

      <!-- ── Sol: Ayarlar ─────────────────────────────────────────────
           İki mantıksal öbek: fişin NE yazacağı (metinler, göster/gizle) ve
           NASIL basılacağı (kağıt, yazıcı, nüsha, otomatik, yönlendirme).
           Önizleme sağda sabit kalır. -->
      <div class="flex-1 min-w-0 grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">

        <!-- Fiş Metinleri: üstte işletme bilgileri, altta alt not -->
        <div class="bg-white rounded-2xl shadow-sm p-6">
          <h2 class="font-bold text-primary text-sm mb-1">Fiş Metinleri</h2>
          <p class="text-xs text-muted mb-4">Fişin üstünde ve altında görünecek bilgiler</p>

          <div class="space-y-3">
            <div v-for="f in businessFields" :key="f.key">
              <label class="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">
                {{ f.label }}
              </label>
              <input v-model="form[f.key]"
                     :placeholder="f.placeholder"
                     class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm
                            focus:border-accent focus:outline-none transition-colors"/>
            </div>
          </div>

          <div class="border-t border-gray-100 mt-5 pt-5 space-y-3">
            <div>
              <label class="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">
                Alt Not 1
              </label>
              <input v-model="form.footerText"
                     placeholder="Bizi tekrar ziyaret edin!"
                     class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm
                            focus:border-accent focus:outline-none"/>
            </div>
            <div>
              <label class="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">
                Alt Not 2
              </label>
              <input v-model="form.footerText2"
                     placeholder="www.ornekmarket.com"
                     class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm
                            focus:border-accent focus:outline-none"/>
            </div>
          </div>
        </div>

        <!-- Yazdırma: kağıt, yazıcı, nüsha ve otomatik yazdırma bir arada -->
        <div class="bg-white rounded-2xl shadow-sm p-6">
          <h2 class="font-bold text-primary text-sm mb-1">Yazdırma</h2>
          <p class="text-xs text-muted mb-4">Fişin hangi yazıcıdan, nasıl basılacağı</p>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-muted mb-2 uppercase tracking-wide">
                Kağıt Genişliği
              </label>
              <div class="flex gap-3">
                <button v-for="w in [58, 80]" :key="w"
                        @click="form.paperWidth = w"
                        class="flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all"
                        :class="form.paperWidth === w
                          ? 'bg-accent text-white border-accent shadow-sm'
                          : 'bg-white text-muted border-gray-200 hover:border-accent/40'">
                  {{ w }} mm
                  <div class="text-xs font-normal mt-0.5 opacity-80">
                    {{ w === 58 ? 'Standart' : 'Geniş Format' }}
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">
                Varsayılan Fiş Yazıcısı
              </label>

              <select v-if="availablePrinters.length"
                      v-model="form.printerName"
                      class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm
                             focus:border-accent focus:outline-none bg-white">
                <option value="">— Yazıcı seçin —</option>
                <option v-for="p in availablePrinters" :key="p" :value="p">{{ p }}</option>
              </select>

              <template v-else>
                <input v-model="form.printerName"
                       placeholder="POS58 Thermal Printer"
                       class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm
                              focus:border-accent focus:outline-none"/>
                <p class="flex items-center gap-1.5 text-xs text-warning mt-1.5 font-medium">
                  <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  </svg>
                  Kasa henüz bağlanmadı — yazıcı adını elle girin
                </p>
              </template>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm font-semibold text-primary">Nüsha Sayısı</div>
                <div class="text-xs text-muted mt-0.5">Esnaf nüshası için artırın</div>
              </div>
              <div class="flex items-center gap-2 ml-6">
                <button @click="form.receiptCopies = Math.max(1, form.receiptCopies - 1)"
                        class="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200
                               text-muted hover:border-danger hover:text-danger hover:bg-red-50
                               transition-colors font-bold select-none leading-none">−</button>
                <span class="w-8 text-center font-bold text-sm text-primary select-none">
                  {{ form.receiptCopies }}
                </span>
                <button @click="form.receiptCopies = Math.min(3, form.receiptCopies + 1)"
                        class="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200
                               text-muted hover:border-success hover:text-success hover:bg-green-50
                               transition-colors font-bold select-none leading-none">+</button>
              </div>
            </div>
          </div>

          <div class="border-t border-gray-100 mt-5 pt-2 divide-y divide-gray-50">
            <div v-for="t in autoPrintOptions" :key="t.key"
                 class="flex items-center justify-between py-3 cursor-pointer"
                 @click="form[t.key] = !form[t.key]">
              <div>
                <div class="text-sm font-semibold text-primary select-none">{{ t.label }}</div>
                <div class="text-xs text-muted mt-0.5 select-none">{{ t.hint }}</div>
              </div>
              <div class="relative inline-flex h-6 items-center rounded-full flex-shrink-0
                          transition-colors duration-300 ml-6" style="width:2.75rem"
                   :class="form[t.key] ? 'bg-accent' : 'bg-gray-300'">
                <span class="inline-block h-4 w-4 rounded-full bg-white shadow
                             transition-transform duration-300"
                      :class="form[t.key] ? 'translate-x-6' : 'translate-x-1'"/>
              </div>
            </div>
          </div>
        </div>


      </div>

      <!-- ──────────────────── Sağ: Canlı Önizleme ────────────────────── -->
      <div class="w-full xl:w-auto xl:flex-shrink-0">
        <div class="sticky top-6">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-xs font-bold text-muted uppercase tracking-wide">Canlı Önizleme</span>
            <span class="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full font-bold">
              {{ form.paperWidth }}mm
            </span>
          </div>

          <!-- Kağıt -->
          <div class="bg-gray-200 rounded-2xl p-5 flex justify-center shadow-inner">
            <div class="bg-white shadow-lg"
                 style="border-radius:3px; min-height:220px"
                 :style="{ width: form.paperWidth === 58 ? '218px' : '300px' }">

              <div class="select-none px-3 py-4"
                   style="font-family:'Courier New',Courier,monospace"
                   :style="{ fontSize: form.paperWidth === 58 ? '9.5px' : '10.5px', lineHeight:'1.55' }">

                <!-- İşletme adı -->
                <div v-if="form.showBusinessName"
                     class="text-center font-bold mb-px"
                     :style="{ fontSize: form.paperWidth === 58 ? '12px' : '14px' }">
                  {{ form.businessName || 'İŞLETME ADI' }}
                </div>

                <!-- Adres -->
                <div v-if="form.showAddress && form.businessAddress"
                     class="text-center text-gray-600 leading-snug mb-px">
                  {{ form.businessAddress }}
                </div>

                <!-- Telefon -->
                <div v-if="form.showPhone && form.businessPhone"
                     class="text-center text-gray-600 mb-px">
                  Tel: {{ form.businessPhone }}
                </div>

                <!-- Başlık ek satır -->
                <div v-if="form.headerExtraLine"
                     class="text-center text-gray-500 italic mb-px">
                  {{ form.headerExtraLine }}
                </div>

                <!-- ─── Ayraç ─── -->
                <div v-if="form.showSeparatorLines"
                     class="border-b border-dashed border-gray-400 my-1.5"/>

                <!-- Tarih & kasiyer -->
                <div v-if="form.showDate"
                     class="flex justify-between text-gray-500 mb-px">
                  <span>{{ previewDate }}</span>
                  <span>{{ previewTime }}</span>
                </div>
                <div class="flex justify-between text-gray-500 mb-0.5">
                  <span>Fiş: #0042</span>
                  <span>Admin</span>
                </div>

                <!-- ─── Ayraç ─── -->
                <div v-if="form.showSeparatorLines"
                     class="border-b border-dashed border-gray-400 my-1.5"/>

                <!-- Ürün listesi -->
                <div class="mb-0.5">
                  <template v-if="form.showProductDetails">
                    <div v-for="item in sampleItems" :key="item.name" class="mb-1">
                      <div class="flex justify-between font-semibold">
                        <span>{{ item.name }}</span>
                        <span>{{ fmt(item.qty * item.price) }}</span>
                      </div>
                      <div class="text-gray-400 pl-1">
                        {{ item.qty }} ad × {{ fmt(item.price) }}
                      </div>
                    </div>
                  </template>
                  <template v-else>
                    <div v-for="item in sampleItems" :key="item.name"
                         class="flex justify-between mb-0.5">
                      <span>{{ item.name }}</span>
                      <span>{{ fmt(item.qty * item.price) }}</span>
                    </div>
                  </template>
                </div>

                <!-- ─── Ayraç ─── -->
                <div v-if="form.showSeparatorLines"
                     class="border-b border-dashed border-gray-400 my-1.5"/>

                <!-- Ara toplam -->
                <div v-if="form.showSubtotal"
                     class="flex justify-between text-gray-600 mb-px">
                  <span>Ara Toplam</span>
                  <span>{{ fmt(subtotal) }}</span>
                </div>

                <!-- İndirim -->
                <div v-if="form.showDiscount"
                     class="flex justify-between text-red-500 mb-px">
                  <span>İndirim</span>
                  <span>-{{ fmt(2.50) }}</span>
                </div>

                <!-- TOPLAM -->
                <div class="border-b-2 border-gray-700 my-1.5"/>
                <div class="flex justify-between font-bold mb-0.5"
                     :style="{ fontSize: form.paperWidth === 58 ? '12px' : '14px' }">
                  <span>TOPLAM</span>
                  <span>{{ fmt(previewTotal) }}</span>
                </div>

                <!-- Ödeme yöntemi -->
                <div v-if="form.showPaymentMethod" class="text-gray-600 mb-0.5">
                  <div class="flex justify-between">
                    <span>NAKİT</span>
                    <span>{{ fmt(previewCash) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Para Üstü</span>
                    <span>{{ fmt(previewCash - previewTotal) }}</span>
                  </div>
                </div>

                <!-- ─── Ayraç ─── -->
                <div v-if="form.showSeparatorLines"
                     class="border-b border-dashed border-gray-400 my-1.5"/>

                <!-- Footer -->
                <template v-if="form.showFooter">
                  <div v-if="form.footerText || form.footerText2"
                       class="text-center text-gray-500 mt-1">
                    <div v-if="form.footerText">{{ form.footerText }}</div>
                    <div v-if="form.footerText2">{{ form.footerText2 }}</div>
                  </div>
                  <div v-else class="text-center text-gray-300 italic mt-1">
                    (Alt not metni)
                  </div>
                </template>

                <div class="text-center text-gray-300 mt-3">✂ - - - - - - - -</div>
              </div>
            </div>
          </div>

          <p class="text-xs text-muted mt-2.5 text-center">
            Örnek verilerle gösterilmektedir
          </p>
        </div>
      </div>

    </div>

    <!-- Tam sayfa genişliğindeki bölümler — önizlemenin altındaki
         boşluğu kullanır, iki kolona sıkışmazlar -->
    <div class="space-y-5 mt-5">
        <!-- Fişte göster/gizle — tam genişlik -->
        <div class="xl:col-span-2 bg-white rounded-2xl shadow-sm p-6">
          <h2 class="font-bold text-primary text-sm mb-1">Fişte Göster / Gizle</h2>
          <p class="text-xs text-muted mb-4">
            Kapattığınız bölüm kasadan çıkan fişte de görünmez
          </p>
          <div class="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1">
            <div v-for="opt in visibilityOptions" :key="opt.key"
                 class="flex items-center justify-between py-2 px-3 rounded-xl
                        hover:bg-gray-50 transition-colors cursor-pointer"
                 @click="form[opt.key] = !form[opt.key]">
              <span class="text-sm text-primary select-none">{{ opt.label }}</span>
              <div class="relative inline-flex h-5 items-center rounded-full flex-shrink-0
                          transition-colors duration-300 ml-3" style="width:2.25rem"
                   :class="form[opt.key] ? 'bg-accent' : 'bg-gray-300'">
                <span class="inline-block h-3.5 w-3.5 rounded-full bg-white shadow
                             transition-transform duration-300"
                      :class="form[opt.key] ? 'translate-x-5' : 'translate-x-0.5'"/>
              </div>
            </div>
          </div>
        </div>

        <!-- Kategori yönlendirmesi — tam genişlik -->
        <div>
          <PrinterRouting ref="routingRef" :printers="availablePrinters"/>
        </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import api from '../../api/api'
import PrinterRouting from '../../components/PrinterRouting.vue'

const loading           = ref(false)
const saving            = ref(false)
const error             = ref('')
const savedOk           = ref(false)
const availablePrinters = ref([])
const routingRef        = ref(null)

const form = reactive({
  businessName:        '',
  businessAddress:     '',
  businessPhone:       '',
  headerExtraLine:     '',
  footerText:          '',
  footerText2:         '',
  paperWidth:          58,
  printerName:         '',
  autoPrintOnPayment:  false,
  autoPrintOnZReport:  false,
  kitchenCopyPerOrder: false,
  receiptCopies:       1,
  showBusinessName:    true,
  showAddress:         true,
  showPhone:           true,
  showDate:            true,
  showSeparatorLines:  true,
  showProductDetails:  true,
  showSubtotal:        true,
  showDiscount:        true,
  showPaymentMethod:   true,
  showFooter:          true,
})

async function load() {
  loading.value = true
  error.value   = ''
  try {
    const [settingsRes, printersRes] = await Promise.allSettled([
      api.getPrinterSettings(),
      api.getAvailablePrinters(),
    ])
    if (settingsRes.status === 'fulfilled') Object.assign(form, settingsRes.value.data)
    else error.value = 'Ayarlar yüklenemedi.'
    if (printersRes.status === 'fulfilled') availablePrinters.value = printersRes.value.data ?? []
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value  = true
  error.value   = ''
  savedOk.value = false
  try {
    // Tek kaydet düğmesi hem fiş ayarlarını hem kategori yönlendirmesini yazar.
    await api.updatePrinterSettings({ ...form })
    await routingRef.value?.save()
    savedOk.value = true
    setTimeout(() => { savedOk.value = false }, 3500)
  } catch {
    error.value = 'Ayarlar kaydedilemedi.'
  } finally {
    saving.value = false
  }
}

onMounted(load)

// ── Önizleme verileri ─────────────────────────────────────────────────────────
const sampleItems = [
  { name: 'Çay',             qty: 2, price: 15.00  },
  { name: 'Kahvaltı Tabağı', qty: 1, price: 120.00 },
  { name: 'Su 0.5L',         qty: 3, price: 8.50   },
]

const subtotal = computed(() =>
  sampleItems.reduce((s, i) => s + i.qty * i.price, 0)
)

const previewTotal = computed(() =>
  form.showDiscount ? subtotal.value - 2.50 : subtotal.value
)

const previewCash = computed(() =>
  Math.ceil(previewTotal.value / 5) * 5
)

const now         = new Date()
const previewDate = now.toLocaleDateString('tr-TR')
const previewTime = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })

function fmt(v) {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v ?? 0) + ' ₺'
}

// ── Form alan tanımları ───────────────────────────────────────────────────────
const businessFields = [
  { key: 'businessName',    label: 'İşletme Adı',      placeholder: 'Ahmet Market'                            },
  { key: 'businessAddress', label: 'Adres',             placeholder: 'Atatürk Cad. No:5, Beşiktaş / İstanbul' },
  { key: 'businessPhone',   label: 'Telefon',           placeholder: '0212 555 00 00'                          },
  { key: 'headerExtraLine', label: 'Başlık Ek Satır',   placeholder: 'Teşekkürler! Lütfen tekrar gelin.'       },
]

// Otomatik yazdırma anahtarları tek listede — şablonda tekrarlanan
// toggle işaretlemesini çoğaltmamak için.
const autoPrintOptions = [
  { key: 'autoPrintOnPayment',  label: 'Ödeme Sonrası Yazdır',
    hint: 'Satış tamamlanınca fiş otomatik basılır' },
  { key: 'autoPrintOnZReport',  label: 'Z Raporu Sonrası Yazdır',
    hint: 'Gün sonu Z raporu alındığında basılır' },
  { key: 'kitchenCopyPerOrder', label: 'Her Siparişte Mutfak Kopyası',
    hint: 'Masaya ürün gönderildiğinde mutfak fişi de basılır' },
]

const visibilityOptions = [
  { key: 'showBusinessName',   label: 'İşletme Adı'    },
  { key: 'showAddress',        label: 'Adres'           },
  { key: 'showPhone',          label: 'Telefon'         },
  { key: 'showDate',           label: 'Tarih & Saat'    },
  { key: 'showSeparatorLines', label: 'Ayraç Çizgiler'  },
  { key: 'showProductDetails', label: 'Ürün Detayları'  },
  { key: 'showSubtotal',       label: 'Ara Toplam'      },
  { key: 'showDiscount',       label: 'İndirim'         },
  { key: 'showPaymentMethod',  label: 'Ödeme Yöntemi'   },
  { key: 'showFooter',         label: 'Alt Not'          },
]
</script>
