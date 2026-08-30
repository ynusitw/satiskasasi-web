<template>
  <div class="p-8 max-w-5xl">

    <!-- Başlık -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-primary">Masa Ayarları</h1>
      <p class="text-muted text-sm mt-1">Salon bölümleri ve masa düzenini yapılandırın</p>
    </div>

    <!-- ── Aktif/Pasif Kartı ───────────────────────────────────────────── -->
    <div class="bg-white rounded-2xl shadow-sm p-6 mb-6 border-2 transition-colors"
         :class="aktif ? 'border-accent/30' : 'border-gray-100'">
      <div class="flex items-start justify-between gap-6">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors"
               :class="aktif ? 'bg-accent/10' : 'bg-gray-100'">
            <svg class="w-6 h-6 transition-colors" :class="aktif ? 'text-accent' : 'text-muted'"
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
                    :class="aktif ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'">
                {{ aktif ? '✓ Aktif' : 'Pasif' }}
              </span>
              <span v-if="aktif" class="text-xs text-muted">
                {{ bolumler.length }} bölüm · {{ toplamMasa() }} masa
              </span>
            </div>
          </div>
        </div>

        <!-- Toggle -->
        <button @click="toggleAktif()"
                class="relative inline-flex h-7 items-center rounded-full flex-shrink-0
                       transition-colors duration-300"
                style="width:3.25rem"
                :class="aktif ? 'bg-accent' : 'bg-gray-300'">
          <span class="inline-block h-5 w-5 transform rounded-full bg-white shadow-md
                       transition-transform duration-300"
                :class="aktif ? 'translate-x-7' : 'translate-x-1'"/>
        </button>
      </div>
    </div>

    <!-- ── İçerik (sadece aktifken) ───────────────────────────────────── -->
    <Transition name="slide-down">
      <div v-if="aktif">

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
        <div v-if="bolumler.length" class="space-y-4 mb-6">
          <div v-for="bolum in bolumler" :key="bolum.id"
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
                   class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                <div v-for="masa in bolum.masalar" :key="masa.id"
                     class="border border-gray-200 rounded-xl bg-white
                            hover:border-accent/40 hover:shadow-sm transition-all flex flex-col">

                  <!-- Masa adı -->
                  <div class="flex-1 flex items-center justify-center px-3 py-3">
                    <span class="text-sm font-bold text-primary text-center leading-tight">
                      {{ masa.ad }}
                    </span>
                  </div>

                  <!-- CRUD butonları -->
                  <div class="border-t border-gray-100 grid grid-cols-2">
                    <button @click="openMasaDuzenle(bolum.id, masa)"
                            class="flex items-center justify-center gap-1 py-2 text-xs
                                   font-semibold text-muted hover:text-accent
                                   hover:bg-accent/5 transition-colors rounded-bl-xl">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                                 m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                      Düzenle
                    </button>
                    <button @click="silMasa(bolum.id, masa)"
                            class="flex items-center justify-center gap-1 py-2 text-xs
                                   font-semibold text-muted hover:text-danger
                                   hover:bg-red-50 transition-colors rounded-br-xl
                                   border-l border-gray-100">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0
                                 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0
                                 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                      Sil
                    </button>
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
import { reactive, ref, computed, onMounted, nextTick } from 'vue'
import api from '../../api/api'

// ── Aktif/pasif — API kaynaklı ───────────────────────────────────────────────
const aktif   = ref(false)
const bolumler = ref([])
const loading  = ref(false)

async function loadBolumler() {
  try {
    const [secRes, tblRes] = await Promise.all([
      api.getSections(),
      api.getTables(),
    ])
    const sections = secRes.data ?? []
    const tables   = tblRes.data ?? []
    bolumler.value = sections.map(s => ({
      id:     s.id,
      ad:     s.name,
      masalar: tables
        .filter(t => t.sectionId === s.id)
        .map(t => ({ id: t.id, ad: t.name, durum: t.status })),
    }))
  } catch (e) {
    console.error('[MasaAyarlari] Bölüm/masa yükleme hatası', e)
  }
}

async function load() {
  loading.value = true
  try {
    const res = await api.getTableSettings()
    aktif.value = res.data?.isActive ?? false
    if (aktif.value) await loadBolumler()
  } catch {
    // endpoint yoksa false kalır, uygulama çalışmaya devam eder
  } finally {
    loading.value = false
  }
}

async function toggleAktif() {
  const newVal = !aktif.value
  aktif.value = newVal   // optimistic update
  try {
    await api.updateTableSettings({ isActive: newVal })
    if (newVal && !bolumler.value.length) await loadBolumler()
  } catch (e) {
    console.error('[MasaAyarlari] toggleAktif hatası:', e?.response?.status, e?.response?.data ?? e?.message)
    aktif.value = !newVal  // hata durumunda geri al
  }
}

function toplamMasa() {
  return bolumler.value.reduce((s, b) => s + b.masalar.length, 0)
}

onMounted(load)

// ── Bölüm Modal ──────────────────────────────────────────────────────────────
const bolumInputRef = ref(null)
const bolumModal    = reactive({ show: false, isEdit: false, id: null, ad: '', saving: false, error: '' })

function openBolumModal(bolum = null) {
  Object.assign(bolumModal, {
    show: true, isEdit: !!bolum,
    id: bolum?.id ?? null, ad: bolum?.ad ?? '', saving: false, error: '',
  })
  nextTick(() => bolumInputRef.value?.focus())
}

async function saveBolum() {
  bolumModal.error = ''
  const ad = bolumModal.ad.trim()
  if (!ad) { bolumModal.error = 'Bölüm adı boş olamaz.'; return }

  const dup = bolumler.value.some(b =>
    b.ad.toLowerCase() === ad.toLowerCase() && b.id !== bolumModal.id
  )
  if (dup) { bolumModal.error = 'Bu isimde bir bölüm zaten var.'; return }

  bolumModal.saving = true
  try {
    if (bolumModal.isEdit) {
      await api.updateSection(bolumModal.id, { name: ad })
      const b = bolumler.value.find(b => b.id === bolumModal.id)
      if (b) b.ad = ad
    } else {
      const res = await api.createSection({ name: ad })
      bolumler.value.push({ id: res.data.id, ad: res.data.name, masalar: [] })
    }
    bolumModal.show = false
  } catch {
    bolumModal.error = 'İşlem sırasında hata oluştu.'
  } finally {
    bolumModal.saving = false
  }
}

async function silBolum(bolum) {
  const uyari = bolum.masalar.length > 0
    ? `"${bolum.ad}" bölümünü ve içindeki ${bolum.masalar.length} masayı silmek istediğinize emin misiniz?`
    : `"${bolum.ad}" bölümünü silmek istediğinize emin misiniz?`
  if (!confirm(uyari)) return
  try {
    await api.deleteSection(bolum.id)
    bolumler.value = bolumler.value.filter(b => b.id !== bolum.id)
  } catch {
    alert('Bölüm silinemedi.')
  }
}

// ── Tek Masa Modal ────────────────────────────────────────────────────────────
const masaInputRef = ref(null)
const masaModal    = reactive({ show: false, isEdit: false, bolumId: null, id: null, ad: '', saving: false, error: '' })

function openMasaModal(bolumId) {
  Object.assign(masaModal, { show: true, isEdit: false, bolumId, id: null, ad: '', saving: false, error: '' })
  nextTick(() => masaInputRef.value?.focus())
}

function openMasaDuzenle(bolumId, masa) {
  Object.assign(masaModal, { show: true, isEdit: true, bolumId, id: masa.id, ad: masa.ad, saving: false, error: '' })
  nextTick(() => masaInputRef.value?.focus())
}

async function saveMasa() {
  masaModal.error = ''
  const ad = masaModal.ad.trim()
  if (!ad) { masaModal.error = 'Masa adı boş olamaz.'; return }

  const bolum = bolumler.value.find(b => b.id === masaModal.bolumId)
  const dup   = bolum?.masalar.some(m =>
    m.ad.toLowerCase() === ad.toLowerCase() && m.id !== masaModal.id
  )
  if (dup) { masaModal.error = 'Bu bölümde aynı isimde masa var.'; return }

  masaModal.saving = true
  try {
    if (masaModal.isEdit) {
      await api.updateTable(masaModal.id, { name: ad, sectionId: masaModal.bolumId })
      const m = bolum?.masalar.find(m => m.id === masaModal.id)
      if (m) m.ad = ad
    } else {
      const res = await api.createTable({ name: ad, sectionId: masaModal.bolumId })
      bolum?.masalar.push({ id: res.data.id, ad: res.data.name, durum: res.data.status })
    }
    masaModal.show = false
  } catch {
    masaModal.error = 'İşlem sırasında hata oluştu.'
  } finally {
    masaModal.saving = false
  }
}

async function silMasa(bolumId, masa) {
  if (!confirm(`"${masa.ad}" masasını silmek istediğinize emin misiniz?`)) return
  try {
    await api.deleteTable(masa.id)
    const b = bolumler.value.find(b => b.id === bolumId)
    if (b) b.masalar = b.masalar.filter(m => m.id !== masa.id)
  } catch {
    alert('Masa silinemedi.')
  }
}

// ── Toplu Masa Modal ──────────────────────────────────────────────────────────
const topluModal = reactive({ show: false, bolumId: null, onek: '', baslangic: 1, adet: 5, saving: false, error: '' })

function openTopluModal(bolumId) {
  const bolum    = bolumler.value.find(b => b.id === bolumId)
  const mevcutMax = bolum?.masalar
    .map(m => parseInt(m.ad.replace(/\D/g, '')) || 0)
    .reduce((a, b) => Math.max(a, b), 0) ?? 0
  Object.assign(topluModal, {
    show: true, bolumId,
    onek: bolum?.ad ?? '',
    baslangic: mevcutMax + 1,
    adet: 5, saving: false, error: '',
  })
}

const topluOnizleme = computed(() => {
  const onek      = topluModal.onek.trim()
  const baslangic = Math.max(1, topluModal.baslangic || 1)
  const adet      = Math.min(50, Math.max(1, topluModal.adet || 1))
  return Array.from({ length: adet }, (_, i) => `${onek} ${baslangic + i}`.trim())
})

async function saveToplu() {
  topluModal.error = ''
  if (!topluOnizleme.value.length) return

  const bolum      = bolumler.value.find(b => b.id === topluModal.bolumId)
  const mevcutAdlar = new Set(bolum?.masalar.map(m => m.ad.toLowerCase()) ?? [])
  const cakisan    = topluOnizleme.value.filter(ad => mevcutAdlar.has(ad.toLowerCase()))
  if (cakisan.length) { topluModal.error = `Bu isimler zaten var: ${cakisan.join(', ')}`; return }

  topluModal.saving = true
  try {
    const sonuclar = await Promise.all(
      topluOnizleme.value.map(ad =>
        api.createTable({ name: ad, sectionId: topluModal.bolumId })
      )
    )
    sonuclar.forEach(res => {
      bolum?.masalar.push({ id: res.data.id, ad: res.data.name, durum: res.data.status })
    })
    topluModal.show = false
  } catch {
    topluModal.error = 'Masalar eklenirken hata oluştu.'
  } finally {
    topluModal.saving = false
  }
}

// ── Yardımcılar ───────────────────────────────────────────────────────────────
function bolumAdi(id) {
  return bolumler.value.find(b => b.id === id)?.ad ?? ''
}
</script>

<style scoped>
.slide-down-enter-active { transition: opacity .25s ease, transform .25s ease; }
.slide-down-leave-active { transition: opacity .2s ease,  transform .2s ease; }
.slide-down-enter-from,
.slide-down-leave-to     { opacity: 0; transform: translateY(-8px); }
</style>
