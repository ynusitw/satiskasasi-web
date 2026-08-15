<template>
  <div class="p-8 max-w-5xl">

    <!-- Başlık -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-primary">Masa Ayarları</h1>
      <p class="text-muted text-sm mt-1">Salon bölümleri ve masa düzenini yapılandırın</p>
    </div>

    <!-- ── Aktif/Pasif Kartı ───────────────────────────────────────────── -->
    <div class="bg-white rounded-2xl shadow-sm p-6 mb-6 border-2 transition-colors"
         :class="store.aktif ? 'border-accent/30' : 'border-gray-100'">
      <div class="flex items-start justify-between gap-6">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors"
               :class="store.aktif ? 'bg-accent/10' : 'bg-gray-100'">
            <svg class="w-6 h-6 transition-colors" :class="store.aktif ? 'text-accent' : 'text-muted'"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0
                       01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1
                       1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1
                       1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0
                       011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/>
            </svg>
          </div>
          <div>
            <div class="font-bold text-primary">Masa Yönetimi</div>
            <p class="text-sm text-muted mt-0.5 max-w-lg">
              Aktif edildiğinde kasada masa seçimi yapılabilir. Bölüm ve
              masa oluşturma, yeniden adlandırma ve silme işlemleri bu sayfadan yapılır.
            </p>
            <div class="flex items-center gap-3 mt-2">
              <span class="text-xs font-bold px-2.5 py-1 rounded-full transition-colors"
                    :class="store.aktif ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'">
                {{ store.aktif ? '✓ Aktif' : 'Pasif' }}
              </span>
              <span v-if="store.aktif" class="text-xs text-muted">
                {{ store.bolumler.length }} bölüm · {{ store.toplamMasa() }} masa
              </span>
            </div>
          </div>
        </div>

        <!-- Toggle -->
        <button @click="store.aktif = !store.aktif"
                class="relative inline-flex h-7 items-center rounded-full flex-shrink-0
                       transition-colors duration-300"
                style="width:3.25rem"
                :class="store.aktif ? 'bg-accent' : 'bg-gray-300'">
          <span class="inline-block h-5 w-5 transform rounded-full bg-white shadow-md
                       transition-transform duration-300"
                :class="store.aktif ? 'translate-x-7' : 'translate-x-1'"/>
        </button>
      </div>
    </div>

    <!-- ── İçerik (sadece aktifken) ───────────────────────────────────── -->
    <Transition name="slide-down">
      <div v-if="store.aktif">

        <!-- Araç çubuğu -->
        <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
          <p class="text-xs text-muted">
            Önce bölüm oluşturun, sonra bölüm içine masa ekleyin.
          </p>
          <button @click="openBolumModal()"
                  class="flex items-center gap-2 px-4 py-2 bg-primary text-white
                         rounded-xl text-sm font-semibold hover:bg-primary/80
                         transition-colors shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Bölüm Ekle
          </button>
        </div>

        <!-- Bölüm kartları -->
        <div v-if="store.bolumler.length" class="space-y-4 mb-6">
          <div v-for="bolum in store.bolumler" :key="bolum.id"
               class="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">

            <!-- Bölüm başlığı -->
            <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0
                             01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2
                             2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                  </svg>
                </div>
                <div>
                  <span class="font-bold text-primary">{{ bolum.ad }}</span>
                  <span class="ml-2 text-xs text-muted">{{ bolum.masalar.length }} masa</span>
                </div>
              </div>
              <div class="flex items-center gap-1">
                <!-- Tek masa ekle -->
                <button @click="openMasaModal(bolum.id)"
                        title="Masa Ekle"
                        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                               text-accent bg-accent/10 hover:bg-accent hover:text-white
                               rounded-lg transition-all">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  Masa Ekle
                </button>
                <!-- Toplu masa ekle -->
                <button @click="openTopluModal(bolum.id)"
                        title="Toplu Masa Ekle"
                        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                               text-purple-600 bg-purple-50 hover:bg-purple-600 hover:text-white
                               rounded-lg transition-all">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                  </svg>
                  Toplu Ekle
                </button>
                <!-- Bölüm düzenle -->
                <button @click="openBolumModal(bolum)"
                        class="p-1.5 rounded-lg text-muted hover:text-primary
                               hover:bg-gray-200 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                             m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <!-- Bölüm sil -->
                <button @click="silBolum(bolum)"
                        class="p-1.5 rounded-lg text-muted hover:text-danger
                               hover:bg-red-50 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0
                             01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1
                             1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Masa grid'i -->
            <div class="p-4">
              <div v-if="bolum.masalar.length"
                   class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                <div v-for="masa in bolum.masalar" :key="masa.id"
                     class="border border-gray-200 rounded-xl hover:border-accent/40
                            transition-all group bg-gray-50 hover:bg-white">
                  <div class="px-3 py-2.5 flex items-center justify-between gap-1">
                    <span class="text-sm font-semibold text-primary truncate">{{ masa.ad }}</span>
                    <div class="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button @click="openMasaDuzenle(bolum.id, masa)"
                              class="p-1 rounded text-muted hover:text-accent transition-colors">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0
                                   002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828
                                   15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                      <button @click="store.masaSil(bolum.id, masa.id)"
                              class="p-1 rounded text-muted hover:text-danger transition-colors">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Bölüm boş -->
              <div v-else
                   class="py-6 flex flex-col items-center gap-2 text-muted text-sm">
                <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0
                           01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1
                           1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1
                           1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0
                           011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/>
                </svg>
                Bu bölümde henüz masa yok
              </div>
            </div>

          </div>
        </div>

        <!-- Hiç bölüm yok -->
        <div v-else
             class="bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-200
                    py-16 flex flex-col items-center gap-3 text-muted mb-6">
          <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2
                     2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0
                     012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
          <div class="font-semibold">Henüz bölüm tanımlanmadı</div>
          <div class="text-sm">Önce bir bölüm oluşturun (ör. İç Mekan, Bahçe, VIP)</div>
          <button @click="openBolumModal()"
                  class="mt-2 px-5 py-2 bg-primary text-white rounded-xl
                         text-sm font-semibold hover:bg-primary/80 transition-colors">
            İlk Bölümü Ekle
          </button>
        </div>

      </div>
    </Transition>

    <!-- ════════════════════════════════════════════════════════════════════
         MODALLER
    ════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">

      <!-- Bölüm ekle/düzenle -->
      <div v-if="bolumModal.show"
           class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center
                  justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
          <div class="px-6 pt-6 pb-1">
            <h2 class="font-bold text-primary mb-1">
              {{ bolumModal.isEdit ? 'Bölüm Adını Düzenle' : 'Yeni Bölüm Ekle' }}
            </h2>
            <p class="text-xs text-muted mb-4">
              ör. İç Mekan, Bahçe, Teras, VIP Salon
            </p>
            <input ref="bolumInputRef"
                   v-model="bolumModal.ad"
                   type="text" placeholder="Bölüm adı..."
                   maxlength="40"
                   class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                          focus:border-accent focus:outline-none font-semibold"
                   @keyup.enter="saveBolum"
                   @keyup.esc="bolumModal.show = false"/>
            <p v-if="bolumModal.error" class="mt-1.5 text-xs text-danger">{{ bolumModal.error }}</p>
          </div>
          <div class="px-6 py-5 flex gap-3 justify-end">
            <button @click="bolumModal.show = false"
                    class="px-5 py-2.5 bg-gray-100 rounded-xl text-sm font-bold hover:bg-gray-200">
              İptal
            </button>
            <button @click="saveBolum"
                    class="px-5 py-2.5 bg-primary text-white rounded-xl text-sm
                           font-bold hover:bg-primary/80 transition-colors">
              {{ bolumModal.isEdit ? 'Kaydet' : 'Oluştur' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Tek masa ekle/düzenle -->
      <div v-if="masaModal.show"
           class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center
                  justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
          <div class="px-6 pt-6 pb-1">
            <h2 class="font-bold text-primary mb-1">
              {{ masaModal.isEdit ? 'Masa Adını Düzenle' : 'Masa Ekle' }}
            </h2>
            <p class="text-xs text-muted mb-4">
              Bölüm: <strong>{{ bolumAdi(masaModal.bolumId) }}</strong>
            </p>
            <input ref="masaInputRef"
                   v-model="masaModal.ad"
                   type="text" placeholder="ör. Masa 1, B3, VIP-1..."
                   maxlength="30"
                   class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                          focus:border-accent focus:outline-none font-semibold"
                   @keyup.enter="saveMasa"
                   @keyup.esc="masaModal.show = false"/>
            <p v-if="masaModal.error" class="mt-1.5 text-xs text-danger">{{ masaModal.error }}</p>
          </div>
          <div class="px-6 py-5 flex gap-3 justify-end">
            <button @click="masaModal.show = false"
                    class="px-5 py-2.5 bg-gray-100 rounded-xl text-sm font-bold hover:bg-gray-200">
              İptal
            </button>
            <button @click="saveMasa"
                    class="px-5 py-2.5 bg-accent text-white rounded-xl text-sm
                           font-bold hover:bg-blue-600 transition-colors">
              {{ masaModal.isEdit ? 'Kaydet' : 'Ekle' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Toplu masa ekle -->
      <div v-if="topluModal.show"
           class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center
                  justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div class="px-6 pt-6 pb-1">
            <h2 class="font-bold text-primary mb-1">Toplu Masa Ekle</h2>
            <p class="text-xs text-muted mb-5">
              Bölüm: <strong>{{ bolumAdi(topluModal.bolumId) }}</strong>
            </p>

            <div class="space-y-4">
              <!-- Ön ek -->
              <div>
                <label class="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">
                  Masa Adı Ön Eki
                </label>
                <input v-model="topluModal.onek"
                       type="text" placeholder="ör. Masa, M, Bahçe"
                       maxlength="20"
                       class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm
                              focus:border-accent focus:outline-none"/>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <!-- Başlangıç numarası -->
                <div>
                  <label class="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">
                    Başlangıç No
                  </label>
                  <input v-model.number="topluModal.baslangic"
                         type="number" min="1" max="999"
                         class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm
                                focus:border-accent focus:outline-none text-center font-bold"/>
                </div>

                <!-- Adet -->
                <div>
                  <label class="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wide">
                    Eklenecek Adet
                  </label>
                  <input v-model.number="topluModal.adet"
                         type="number" min="1" max="50"
                         class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm
                                focus:border-accent focus:outline-none text-center font-bold"/>
                </div>
              </div>

              <!-- Önizleme -->
              <div v-if="topluOnizleme.length"
                   class="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div class="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                  Önizleme — {{ topluOnizleme.length }} masa eklenecek
                </div>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="ad in topluOnizleme" :key="ad"
                        class="text-xs px-2.5 py-1 bg-accent/10 text-accent
                               rounded-lg font-semibold">
                    {{ ad }}
                  </span>
                </div>
              </div>

              <p v-if="topluModal.error" class="text-xs text-danger">{{ topluModal.error }}</p>
            </div>
          </div>

          <div class="px-6 py-5 flex gap-3 justify-end">
            <button @click="topluModal.show = false"
                    class="px-5 py-2.5 bg-gray-100 rounded-xl text-sm font-bold hover:bg-gray-200">
              İptal
            </button>
            <button @click="saveToplu"
                    :disabled="!topluOnizleme.length"
                    class="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm
                           font-bold hover:bg-purple-700 transition-colors
                           disabled:opacity-40 disabled:cursor-not-allowed">
              {{ topluOnizleme.length }} Masa Ekle
            </button>
          </div>
        </div>
      </div>

    </Teleport>
  </div>
</template>

<script setup>
import { reactive, ref, computed, nextTick } from 'vue'
import { useMasalarStore } from '../../stores/masalar'

const store = useMasalarStore()

const bolumInputRef = ref(null)
const masaInputRef  = ref(null)

// ── Bölüm Modal ──────────────────────────────────────────────────────────────
const bolumModal = reactive({ show: false, isEdit: false, id: null, ad: '', error: '' })

function openBolumModal(bolum = null) {
  Object.assign(bolumModal, {
    show: true, isEdit: !!bolum,
    id:   bolum?.id  ?? null,
    ad:   bolum?.ad  ?? '',
    error: '',
  })
  nextTick(() => bolumInputRef.value?.focus())
}

function saveBolum() {
  bolumModal.error = ''
  const ad = bolumModal.ad.trim()
  if (!ad) { bolumModal.error = 'Bölüm adı boş olamaz.'; return }

  const dup = store.bolumler.some(b =>
    b.ad.toLowerCase() === ad.toLowerCase() && b.id !== bolumModal.id
  )
  if (dup) { bolumModal.error = 'Bu isimde bir bölüm zaten var.'; return }

  bolumModal.isEdit
    ? store.bolumGuncelle(bolumModal.id, ad)
    : store.bolumEkle(ad)
  bolumModal.show = false
}

function silBolum(bolum) {
  const masaSayisi = bolum.masalar.length
  const uyari = masaSayisi > 0
    ? `"${bolum.ad}" bölümünü ve içindeki ${masaSayisi} masayı silmek istediğinize emin misiniz?`
    : `"${bolum.ad}" bölümünü silmek istediğinize emin misiniz?`
  if (!confirm(uyari)) return
  store.bolumSil(bolum.id)
}

// ── Tek Masa Modal ────────────────────────────────────────────────────────────
const masaModal = reactive({
  show: false, isEdit: false, bolumId: null, id: null, ad: '', error: '',
})

function openMasaModal(bolumId) {
  Object.assign(masaModal, { show: true, isEdit: false, bolumId, id: null, ad: '', error: '' })
  nextTick(() => masaInputRef.value?.focus())
}

function openMasaDuzenle(bolumId, masa) {
  Object.assign(masaModal, { show: true, isEdit: true, bolumId, id: masa.id, ad: masa.ad, error: '' })
  nextTick(() => masaInputRef.value?.focus())
}

function saveMasa() {
  masaModal.error = ''
  const ad = masaModal.ad.trim()
  if (!ad) { masaModal.error = 'Masa adı boş olamaz.'; return }

  const bolum = store.bolumler.find(b => b.id === masaModal.bolumId)
  const dup = bolum?.masalar.some(m =>
    m.ad.toLowerCase() === ad.toLowerCase() && m.id !== masaModal.id
  )
  if (dup) { masaModal.error = 'Bu bölümde aynı isimde masa var.'; return }

  masaModal.isEdit
    ? store.masaGuncelle(masaModal.bolumId, masaModal.id, ad)
    : store.masaEkle(masaModal.bolumId, ad)
  masaModal.show = false
}

// ── Toplu Masa Modal ──────────────────────────────────────────────────────────
const topluModal = reactive({
  show: false, bolumId: null, onek: 'Masa', baslangic: 1, adet: 5, error: '',
})

function openTopluModal(bolumId) {
  const bolum = store.bolumler.find(b => b.id === bolumId)
  // Başlangıç numarasını mevcut masaların sonuna ayarla
  const mevcutMax = bolum?.masalar
    .map(m => parseInt(m.ad.replace(/\D/g, '')) || 0)
    .reduce((a, b) => Math.max(a, b), 0) ?? 0

  Object.assign(topluModal, {
    show: true, bolumId,
    onek: 'Masa',
    baslangic: mevcutMax + 1,
    adet: 5,
    error: '',
  })
}

const topluOnizleme = computed(() => {
  const onek = topluModal.onek.trim()
  const baslangic = Math.max(1, topluModal.baslangic || 1)
  const adet = Math.min(50, Math.max(1, topluModal.adet || 1))
  return Array.from({ length: adet }, (_, i) =>
    `${onek} ${baslangic + i}`.trim()
  )
})

function saveToplu() {
  topluModal.error = ''
  if (!topluOnizleme.value.length) return

  const bolum = store.bolumler.find(b => b.id === topluModal.bolumId)
  const mevcutAdlar = new Set(bolum?.masalar.map(m => m.ad.toLowerCase()) ?? [])
  const cakisan = topluOnizleme.value.filter(ad => mevcutAdlar.has(ad.toLowerCase()))

  if (cakisan.length) {
    topluModal.error = `Bu isimler zaten var: ${cakisan.join(', ')}`
    return
  }

  store.topluMasaEkle(topluModal.bolumId, topluOnizleme.value)
  topluModal.show = false
}

// ── Yardımcılar ───────────────────────────────────────────────────────────────
function bolumAdi(id) {
  return store.bolumler.find(b => b.id === id)?.ad ?? ''
}
</script>

<style scoped>
.slide-down-enter-active { transition: opacity .25s ease, transform .25s ease; }
.slide-down-leave-active { transition: opacity .2s ease,  transform .2s ease; }
.slide-down-enter-from,
.slide-down-leave-to     { opacity: 0; transform: translateY(-8px); }
</style>
