<template>
  <div class="p-8 max-w-4xl">

    <!-- Başlık -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-primary">Masa Ayarları</h1>
      <p class="text-muted text-sm mt-1">Masalı satış düzenini yapılandırın</p>
    </div>

    <!-- ── Aktif/Pasif Kartı ────────────────────────────────────────────── -->
    <div class="bg-white rounded-2xl shadow-sm p-6 mb-6 border-2 transition-colors"
         :class="store.aktif ? 'border-accent/30' : 'border-gray-100'">
      <div class="flex items-start justify-between gap-6">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors"
               :class="store.aktif ? 'bg-accent/10' : 'bg-gray-100'">
            <svg class="w-6 h-6 transition-colors" :class="store.aktif ? 'text-accent' : 'text-muted'"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M3 10h18M3 6h18M3 14h18M3 18h18"/>
            </svg>
          </div>
          <div>
            <div class="font-bold text-primary">Masa Yönetimi</div>
            <p class="text-sm text-muted mt-0.5 max-w-lg">
              Aktif edildiğinde kasada masa seçimi yapılabilir.
              Masa oluşturma, yeniden adlandırma ve silme işlemleri bu sayfadan yapılır.
            </p>
            <div class="mt-2">
              <span class="text-xs font-bold px-2.5 py-1 rounded-full transition-colors"
                    :class="store.aktif
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-500'">
                {{ store.aktif ? '✓ Aktif' : 'Pasif' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Toggle -->
        <button @click="store.aktif = !store.aktif"
                class="relative inline-flex h-7 w-13 items-center rounded-full
                       transition-colors duration-300 flex-shrink-0"
                style="width:3.25rem"
                :class="store.aktif ? 'bg-accent' : 'bg-gray-300'">
          <span class="inline-block h-5 w-5 transform rounded-full bg-white shadow-md
                       transition-transform duration-300"
                :class="store.aktif ? 'translate-x-7' : 'translate-x-1'"/>
        </button>
      </div>
    </div>

    <!-- ── Masa Listesi (sadece aktifken) ─────────────────────────────── -->
    <Transition name="slide-down">
      <div v-if="store.aktif">

        <!-- Araç çubuğu -->
        <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div class="text-sm font-semibold text-muted">
            {{ store.masalar.length }} masa tanımlı
          </div>
          <button @click="openAdd"
                  class="flex items-center gap-2 px-4 py-2 bg-accent text-white
                         rounded-xl text-sm font-semibold hover:bg-blue-600
                         transition-colors shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Masa Ekle
          </button>
        </div>

        <!-- Masa grid -->
        <div v-if="store.masalar.length"
             class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
          <div v-for="masa in store.masalar" :key="masa.id"
               class="bg-white rounded-2xl shadow-sm border-2 border-gray-100
                      hover:border-accent/30 transition-all group">
            <!-- Masa görsel -->
            <div class="p-4 flex flex-col items-center gap-3">
              <!-- Masa ikonu -->
              <div class="w-14 h-14 rounded-xl bg-gray-50 border-2 border-gray-200
                          flex items-center justify-center group-hover:border-accent/40
                          transition-colors">
                <svg class="w-7 h-7 text-muted group-hover:text-accent transition-colors"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M3 10h18M3 6h18M3 14h18M3 18h18"/>
                </svg>
              </div>
              <!-- Masa adı -->
              <span class="text-sm font-bold text-primary text-center leading-tight">
                {{ masa.ad }}
              </span>
            </div>
            <!-- Aksiyonlar -->
            <div class="border-t border-gray-100 flex">
              <button @click="openEdit(masa)"
                      class="flex-1 py-2 text-xs font-semibold text-muted
                             hover:text-accent hover:bg-accent/5 transition-colors
                             rounded-bl-2xl flex items-center justify-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                           m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                Düzenle
              </button>
              <div class="w-px bg-gray-100"/>
              <button @click="silMasa(masa)"
                      class="flex-1 py-2 text-xs font-semibold text-muted
                             hover:text-danger hover:bg-red-50 transition-colors
                             rounded-br-2xl flex items-center justify-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0
                           01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0
                           00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Sil
              </button>
            </div>
          </div>

          <!-- Hızlı ekle kartı -->
          <button @click="openAdd"
                  class="border-2 border-dashed border-gray-200 rounded-2xl
                         hover:border-accent/50 hover:bg-accent/3 transition-all
                         flex flex-col items-center justify-center gap-2 p-4
                         text-muted hover:text-accent min-h-[140px]">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4"/>
            </svg>
            <span class="text-xs font-semibold">Masa Ekle</span>
          </button>
        </div>

        <!-- Boş durum -->
        <div v-else
             class="bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-200
                    py-16 flex flex-col items-center gap-3 text-muted mb-6">
          <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M3 10h18M3 6h18M3 14h18M3 18h18"/>
          </svg>
          <div class="font-semibold">Henüz masa tanımlanmadı</div>
          <div class="text-sm">Masa Ekle butonuyla başlayın</div>
          <button @click="openAdd"
                  class="mt-2 px-5 py-2 bg-accent text-white rounded-xl
                         text-sm font-semibold hover:bg-blue-600 transition-colors">
            İlk Masayı Ekle
          </button>
        </div>

        <!-- Bilgi notu -->
        <div class="p-4 bg-blue-50 rounded-xl flex gap-3 text-sm text-blue-700">
          <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>
            Burada tanımlanan masalar kasa ekranında satış sırasında seçilebilir.
            Masa özelliğini kapatmak için yukarıdaki anahtarı pasife alın — mevcut masalar silinmez.
          </span>
        </div>

      </div>
    </Transition>

    <!-- ── Modal ─────────────────────────────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="modal.show"
           class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center
                  justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
          <div class="px-6 pt-6 pb-5">
            <h2 class="font-bold text-primary mb-1">
              {{ modal.isEdit ? 'Masa Adını Düzenle' : 'Yeni Masa Ekle' }}
            </h2>
            <p class="text-xs text-muted mb-4">
              {{ modal.isEdit ? 'Masanın yeni adını girin.' : 'Kasada görünecek masa adını girin.' }}
            </p>

            <input ref="inputRef"
                   v-model="modal.ad"
                   type="text"
                   placeholder="ör. Masa 1, Bahçe 3, VIP..."
                   class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                          focus:border-accent focus:outline-none font-semibold"
                   @keyup.enter="save"
                   @keyup.esc="modal.show = false"
                   maxlength="30"/>

            <div v-if="modal.error" class="mt-2 text-xs text-danger">
              {{ modal.error }}
            </div>
          </div>

          <div class="px-6 pb-6 flex gap-3 justify-end">
            <button @click="modal.show = false"
                    class="px-5 py-2.5 bg-gray-100 rounded-xl text-sm
                           font-bold hover:bg-gray-200 transition-colors">
              İptal
            </button>
            <button @click="save"
                    class="px-5 py-2.5 bg-accent text-white rounded-xl text-sm
                           font-bold hover:bg-blue-600 transition-colors">
              {{ modal.isEdit ? 'Kaydet' : 'Ekle' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { reactive, ref, nextTick } from 'vue'
import { useMasalarStore } from '../../stores/masalar'

const store    = useMasalarStore()
const inputRef = ref(null)

const modal = reactive({ show: false, isEdit: false, id: null, ad: '', error: '' })

function openAdd() {
  Object.assign(modal, { show: true, isEdit: false, id: null, ad: '', error: '' })
  nextTick(() => inputRef.value?.focus())
}

function openEdit(masa) {
  Object.assign(modal, { show: true, isEdit: true, id: masa.id, ad: masa.ad, error: '' })
  nextTick(() => inputRef.value?.focus())
}

function save() {
  modal.error = ''
  const ad = modal.ad.trim()
  if (!ad) { modal.error = 'Masa adı boş olamaz.'; return }

  const duplicate = store.masalar.some(m =>
    m.ad.toLowerCase() === ad.toLowerCase() && m.id !== modal.id
  )
  if (duplicate) { modal.error = 'Bu isimde bir masa zaten var.'; return }

  modal.isEdit ? store.guncelle(modal.id, ad) : store.ekle(ad)
  modal.show = false
}

function silMasa(masa) {
  if (!confirm(`"${masa.ad}" masasını silmek istediğinize emin misiniz?`)) return
  store.sil(masa.id)
}
</script>

<style scoped>
.slide-down-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.slide-down-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
