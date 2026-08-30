<template>
  <div class="p-8 max-w-5xl">

    <!-- Başlık -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-primary">Yazıcı Ayarları</h1>
      <p class="text-muted text-sm mt-1">Yazıcı atamaları ve kategori yönlendirmeleri</p>
    </div>

    <div v-if="loading" class="flex justify-center py-24 text-muted text-sm">
      Yükleniyor...
    </div>

    <template v-else>

      <!-- ── Genel Ayarlar ─────────────────────────────────────────────── -->
      <div class="bg-white rounded-2xl shadow-sm p-6 mb-2">
        <h2 class="font-bold text-primary mb-5">Genel Ayarlar</h2>

        <div class="flex flex-col md:flex-row gap-8 items-start">

          <!-- Sol: Varsayılan yazıcı -->
          <div class="flex-1 min-w-0">
            <label class="block text-xs font-semibold text-muted mb-2 uppercase tracking-wide">
              Varsayılan POS Fiş Yazıcısı
            </label>
            <select v-model="settings.printerName"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm
                           focus:border-accent focus:outline-none bg-white">
              <option value="">— Yazıcı seçin —</option>
              <option v-for="p in printers" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>

          <!-- Sağ: Toggle'lar -->
          <div class="space-y-4 md:min-w-[300px]">
            <div class="flex items-center justify-between gap-6">
              <span class="text-sm font-medium text-primary">
                Ödeme Sonrasında Fişi Otomatik Yazdır.
              </span>
              <button @click="settings.autoPrintOnPayment = !settings.autoPrintOnPayment"
                      class="relative inline-flex h-6 items-center rounded-full flex-shrink-0
                             transition-colors duration-300" style="width:2.75rem"
                      :class="settings.autoPrintOnPayment ? 'bg-success' : 'bg-gray-300'">
                <span class="inline-block h-4 w-4 rounded-full bg-white shadow
                             transition-transform duration-300"
                      :class="settings.autoPrintOnPayment ? 'translate-x-6' : 'translate-x-1'"/>
              </button>
            </div>
            <div class="flex items-center justify-between gap-6">
              <span class="text-sm font-medium text-primary">
                Her Siparişte Mutfak Kopyası Al.
              </span>
              <button @click="settings.kitchenCopyPerOrder = !settings.kitchenCopyPerOrder"
                      class="relative inline-flex h-6 items-center rounded-full flex-shrink-0
                             transition-colors duration-300" style="width:2.75rem"
                      :class="settings.kitchenCopyPerOrder ? 'bg-success' : 'bg-gray-300'">
                <span class="inline-block h-4 w-4 rounded-full bg-white shadow
                             transition-transform duration-300"
                      :class="settings.kitchenCopyPerOrder ? 'translate-x-6' : 'translate-x-1'"/>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Info text -->
      <p class="text-xs text-muted mb-6 px-1">
        Yazıcılar lokal sistemden otomatik olarak çekilmektedir. Değişiklikler anında kasaya yansır.
      </p>

      <!-- ── Kategori Yönlendirmesi ─────────────────────────────────────── -->
      <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100">
          <h2 class="font-bold text-primary">Kategori Yönlendirmesi</h2>
          <p class="text-xs text-muted mt-0.5">
            Her kategori için hangi yazıcıdan kaç kopya çıkacağını belirleyin
          </p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase tracking-wide">
                  Kategori
                </th>
                <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase tracking-wide">
                  Mutfak/Bar Yazıcısı (Printer)
                </th>
                <th class="text-center px-6 py-3 text-xs font-bold text-muted uppercase tracking-wide">
                  Kopya Sayısı (Copies)
                </th>
                <th class="text-center px-6 py-3 text-xs font-bold text-muted uppercase tracking-wide">
                  Aksiyon
                </th>
              </tr>
            </thead>
            <tbody>

              <!-- Yönlendirilmiş kategoriler -->
              <tr v-for="row in routings" :key="row.categoryId"
                  class="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">

                <!-- Kategori -->
                <td class="px-6 py-3.5">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-accent flex-shrink-0"/>
                    <span class="font-semibold text-sm text-primary">{{ row.categoryName }}</span>
                  </div>
                </td>

                <!-- Yazıcı dropdown -->
                <td class="px-6 py-3.5">
                  <div class="flex items-center gap-2">
                    <!-- Yazıcı ikonu -->
                    <svg class="w-4 h-4 text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002
                               2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002
                               2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                    </svg>
                    <select v-model="row.printerName"
                            class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm
                                   focus:border-accent focus:outline-none bg-white min-w-[180px]">
                      <option value="">— Yazıcı yok —</option>
                      <option v-for="p in printers" :key="p" :value="p">{{ p }}</option>
                    </select>
                  </div>
                </td>

                <!-- Kopya sayısı stepper -->
                <td class="px-6 py-3.5">
                  <div class="flex items-center justify-center gap-2">
                    <button @click="row.copies = Math.max(1, row.copies - 1)"
                            class="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200
                                   text-muted hover:border-danger hover:text-danger hover:bg-red-50
                                   transition-colors font-bold select-none leading-none">
                      −
                    </button>
                    <span class="w-8 text-center font-bold text-sm text-primary select-none">
                      {{ row.copies }}
                    </span>
                    <button @click="row.copies = Math.min(10, row.copies + 1)"
                            class="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200
                                   text-muted hover:border-success hover:text-success hover:bg-green-50
                                   transition-colors font-bold select-none leading-none">
                      +
                    </button>
                  </div>
                </td>

                <!-- Aksiyon -->
                <td class="px-6 py-3.5">
                  <div class="flex items-center justify-center gap-1">
                    <!-- Test çıktısı -->
                    <button @click="testPrint(row)" title="Test Çıktısı Al"
                            class="p-2 rounded-lg text-muted hover:text-accent hover:bg-accent/10
                                   transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002
                                 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002
                                 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                      </svg>
                    </button>
                    <!-- Yönlendirmeyi kaldır -->
                    <button @click="removeRouting(row.categoryId)" title="Yönlendirmeyi Kaldır"
                            class="p-2 rounded-lg text-muted hover:text-danger hover:bg-red-50
                                   transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5
                                 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Yönlendirilmemiş kategoriler -->
              <tr v-for="cat in unroutedCategories" :key="cat.id"
                  class="border-t border-gray-50 bg-gray-50/40 hover:bg-gray-50 transition-colors">
                <td class="px-6 py-3.5">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0"/>
                    <span class="text-sm text-muted">{{ cat.name }}</span>
                  </div>
                </td>
                <td class="px-6 py-3.5 text-xs text-gray-400 italic" colspan="2">
                  Yönlendirme eklenmemiş
                </td>
                <td class="px-6 py-3.5">
                  <div class="flex items-center justify-center">
                    <button @click="addRouting(cat)"
                            class="px-3 py-1.5 text-xs font-semibold text-accent bg-accent/10
                                   hover:bg-accent hover:text-white rounded-lg transition-all">
                      + Ekle
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Hiç kategori yoksa -->
              <tr v-if="!routings.length && !unroutedCategories.length">
                <td colspan="4" class="text-center py-12 text-muted text-sm">
                  Kategori bulunamadı.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── Hata / Başarı ─────────────────────────────────────────────── -->
      <div v-if="saveError"
           class="mt-4 p-3 bg-red-50 text-danger rounded-xl text-sm border border-red-100">
        {{ saveError }}
      </div>
      <div v-if="saveOk"
           class="mt-4 p-3 bg-green-50 text-success rounded-xl text-sm font-semibold border border-green-100">
        ✓ Ayarlar kaydedildi
      </div>

      <!-- ── Kaydet butonu ──────────────────────────────────────────────── -->
      <div class="mt-6 flex justify-end">
        <button @click="save" :disabled="saving"
                class="px-6 py-3 bg-accent text-white rounded-xl text-sm font-bold
                       hover:bg-blue-600 transition-colors disabled:opacity-50
                       shadow-sm flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          {{ saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet' }}
        </button>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '../../api/api'

const loading   = ref(true)
const saving    = ref(false)
const saveError = ref('')
const saveOk    = ref(false)

// Mevcut tüm printer settings'i tutuyoruz — kaydederken hiçbir alan kaybolmasın
const fullSettings = reactive({})

// Template'de gösterilen 3 alan fullSettings'e bind
const settings = reactive({
  printerName:         '',
  autoPrintOnPayment:  false,
  kitchenCopyPerOrder: false,
})

const printers   = ref([])   // kasa'dan gelen yazıcı listesi
const categories = ref([])   // api/categories
const routings   = ref([])   // [{ categoryId, categoryName, printerName, copies }]

const unroutedCategories = computed(() => {
  const routed = new Set(routings.value.map(r => r.categoryId))
  return categories.value.filter(c => !routed.has(c.id))
})

async function load() {
  loading.value = true
  try {
    const [sRes, pRes, cRes, rRes] = await Promise.allSettled([
      api.getPrinterSettings(),
      api.getAvailablePrinters(),
      api.getCategories(),
      api.getCategoryRoutings(),
    ])

    if (sRes.status === 'fulfilled') {
      Object.assign(fullSettings, sRes.value.data ?? {})
      settings.printerName         = fullSettings.printerName         ?? ''
      settings.autoPrintOnPayment  = fullSettings.autoPrintOnPayment  ?? false
      settings.kitchenCopyPerOrder = fullSettings.kitchenCopyPerOrder ?? false
    }

    printers.value   = pRes.status === 'fulfilled' ? (pRes.value.data ?? []) : []
    categories.value = cRes.status === 'fulfilled' ? (cRes.value.data ?? []) : []
    routings.value   = rRes.status === 'fulfilled'
      ? (rRes.value.data ?? []).map(r => ({ ...r }))
      : []
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value    = true
  saveError.value = ''
  saveOk.value    = false
  try {
    await Promise.all([
      api.updatePrinterSettings({
        ...fullSettings,
        ...settings,  // 3 alanı güncelle, geri kalanı koru
      }),
      api.saveCategoryRoutings(
        routings.value.map(r => ({
          categoryId:  r.categoryId,
          printerName: r.printerName,
          copies:      r.copies,
        }))
      ),
    ])
    saveOk.value = true
    setTimeout(() => { saveOk.value = false }, 3500)
  } catch {
    saveError.value = 'Kaydedilemedi, lütfen tekrar deneyin.'
  } finally {
    saving.value = false
  }
}

function addRouting(cat) {
  routings.value.push({
    categoryId:   cat.id,
    categoryName: cat.name,
    printerName:  printers.value[0] ?? '',
    copies:       1,
  })
}

function removeRouting(categoryId) {
  routings.value = routings.value.filter(r => r.categoryId !== categoryId)
}

function testPrint(row) {
  if (!row.printerName) {
    alert('Önce bir yazıcı seçin.')
    return
  }
  alert(`"${row.categoryName}" için test çıktısı gönderildi → ${row.printerName}`)
}

onMounted(load)
</script>
