<template>
  <div class="p-8">

    <!-- Başlık -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-primary">Paket Yönetimi</h1>
        <p class="text-muted text-sm mt-1">Plan fiyatlarını ve özelliklerini yönetin</p>
      </div>
      <button @click="openAdd"
              class="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl
                     text-sm font-semibold hover:bg-blue-600 transition-colors shadow-sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Yeni Paket
      </button>
    </div>

    <!-- Plan Kartları -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
      <div v-for="plan in store.plans" :key="plan.id"
           class="bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-all"
           :class="plan.isActive ? colorBorder(plan.color) : 'border-gray-200 opacity-60'">

        <!-- Kart başlığı -->
        <div class="px-6 pt-6 pb-4 border-b border-gray-100">
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full flex-shrink-0"
                    :class="colorDot(plan.color)"/>
              <span class="font-bold text-lg text-primary">{{ plan.name }}</span>
            </div>
            <span class="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                  :class="plan.isActive
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-500'">
              {{ plan.isActive ? 'Aktif' : 'Pasif' }}
            </span>
          </div>

          <!-- Fiyat -->
          <div class="flex items-end gap-1 mb-2">
            <span class="text-3xl font-bold" :class="colorText(plan.color)">
              {{ fmt(plan.price) }}
            </span>
            <span class="text-muted text-sm mb-1">/ay</span>
          </div>

          <p class="text-sm text-muted">{{ plan.description }}</p>
        </div>

        <!-- Özellikler -->
        <div class="px-6 py-4">
          <ul class="space-y-2">
            <li v-for="feat in plan.features" :key="feat"
                class="flex items-start gap-2 text-sm text-muted">
              <svg class="w-4 h-4 flex-shrink-0 mt-0.5" :class="colorText(plan.color)"
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                      stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
              {{ feat }}
            </li>
          </ul>
        </div>

        <!-- Abone sayısı + Aksiyonlar -->
        <div class="px-6 pb-5 flex items-center justify-between">
          <div class="text-xs text-muted">
            <span class="font-bold text-primary text-sm">{{ subscriberCount(plan.id) }}</span>
            aktif abone
          </div>
          <div class="flex gap-2">
            <button @click="openEdit(plan)"
                    class="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200
                           hover:border-accent hover:text-accent hover:bg-accent/5 transition-all">
              Düzenle
            </button>
            <button @click="deletePlan(plan)"
                    :disabled="subscriberCount(plan.id) > 0"
                    class="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200
                           transition-all disabled:opacity-30 disabled:cursor-not-allowed
                           hover:border-danger hover:text-danger hover:bg-red-50"
                    :title="subscriberCount(plan.id) > 0 ? 'Aktif abonesi olan paket silinemez' : ''">
              Sil
            </button>
          </div>
        </div>
      </div>

      <!-- Boş durum -->
      <div v-if="!store.plans.length"
           class="col-span-full text-center py-16 text-muted">
        <div class="text-4xl mb-3">📦</div>
        <div class="font-semibold">Henüz paket tanımlanmamış</div>
        <div class="text-sm mt-1">Yeni Paket butonuyla başlayın</div>
      </div>
    </div>

    <!-- Bilgi notu -->
    <div class="p-4 bg-blue-50 rounded-xl flex gap-3 text-sm text-blue-700">
      <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span>
        Paket fiyat değişiklikleri <strong>Gelir Analizi</strong> sayfasına otomatik yansır.
        Aktif abonesi olan paketler silinemez; önce aboneleri farklı pakete taşıyın.
      </span>
    </div>

    <!-- ── Modal ─────────────────────────────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="modal.show"
           class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center
                  justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

          <!-- Modal başlık -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <h2 class="font-bold text-primary">
              {{ modal.isEdit ? 'Paketi Düzenle' : 'Yeni Paket Ekle' }}
            </h2>
            <button @click="modal.show = false"
                    class="p-2 rounded-xl hover:bg-gray-100 text-muted transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Form -->
          <div class="px-6 py-5 space-y-5">

            <!-- Ad -->
            <div>
              <label class="block text-sm font-semibold mb-1.5">Paket Adı</label>
              <input v-model="form.name" type="text" placeholder="ör. Starter, Pro, Enterprise..."
                     class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm
                            focus:border-accent focus:outline-none"/>
            </div>

            <!-- Fiyat -->
            <div>
              <label class="block text-sm font-semibold mb-1.5">Aylık Fiyat (₺)</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-bold">₺</span>
                <input v-model.number="form.price" type="number" min="0" step="1"
                       class="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
                              focus:border-accent focus:outline-none font-bold"/>
              </div>
            </div>

            <!-- Açıklama -->
            <div>
              <label class="block text-sm font-semibold mb-1.5">Açıklama</label>
              <input v-model="form.description" type="text"
                     placeholder="Paketin kısa tanımı..."
                     class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm
                            focus:border-accent focus:outline-none"/>
            </div>

            <!-- Renk -->
            <div>
              <label class="block text-sm font-semibold mb-2">Kart Rengi</label>
              <div class="flex gap-2 flex-wrap">
                <button v-for="c in colorOptions" :key="c.value"
                        @click="form.color = c.value"
                        class="flex items-center gap-2 px-3 py-1.5 rounded-xl border-2
                               text-xs font-bold transition-all"
                        :class="form.color === c.value
                          ? [colorBorder(c.value), colorBg(c.value)]
                          : 'border-gray-200 text-muted hover:border-gray-300'">
                  <span class="w-3 h-3 rounded-full" :class="colorDot(c.value)"/>
                  {{ c.label }}
                </button>
              </div>
            </div>

            <!-- Özellikler -->
            <div>
              <label class="block text-sm font-semibold mb-2">Özellikler</label>
              <div class="space-y-2">
                <div v-for="(feat, i) in form.features" :key="i"
                     class="flex gap-2">
                  <input v-model="form.features[i]" type="text"
                         :placeholder="`Özellik ${i + 1}`"
                         class="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm
                                focus:border-accent focus:outline-none"/>
                  <button @click="removeFeat(i)"
                          class="px-3 py-2 text-danger hover:bg-red-50 rounded-xl transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
              <button @click="addFeat"
                      class="mt-2 flex items-center gap-1.5 text-xs text-accent
                             font-semibold hover:underline">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Özellik Ekle
              </button>
            </div>

            <!-- Aktif toggle -->
            <label class="flex items-center justify-between p-3 rounded-xl
                          bg-gray-50 border border-gray-100 cursor-pointer">
              <div>
                <div class="text-sm font-semibold">Paket Aktif</div>
                <div class="text-xs text-muted">Pasif paketler yeni abonelere sunulmaz</div>
              </div>
              <button @click="form.isActive = !form.isActive"
                      class="relative inline-flex h-6 w-11 items-center rounded-full
                             transition-colors duration-200"
                      :class="form.isActive ? 'bg-accent' : 'bg-gray-300'">
                <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow
                             transition-transform duration-200"
                      :class="form.isActive ? 'translate-x-6' : 'translate-x-1'"/>
              </button>
            </label>

            <!-- Hata -->
            <div v-if="formError" class="p-3 bg-red-50 text-red-600 rounded-xl text-sm">
              {{ formError }}
            </div>
          </div>

          <!-- Butonlar -->
          <div class="px-6 pb-6 flex gap-3 justify-end">
            <button @click="modal.show = false"
                    class="px-5 py-2.5 bg-gray-100 rounded-xl text-sm font-bold hover:bg-gray-200">
              İptal
            </button>
            <button @click="save"
                    class="px-5 py-2.5 bg-accent text-white rounded-xl text-sm
                           font-bold hover:bg-blue-600 transition-colors">
              {{ modal.isEdit ? 'Güncelle' : 'Ekle' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { usePlansStore } from '../stores/plans'
import api              from '../api/api'

const store   = usePlansStore()
const tenants = ref([])

onMounted(async () => {
  try { tenants.value = (await api.getAllTenants()).data } catch {}
})

function subscriberCount(planId) {
  return tenants.value.filter(t => t.plan === planId && t.isActive && !isExpired(t.expiresAt)).length
}

function isExpired(d) { return d ? new Date(d) < new Date() : false }

function fmt(v) {
  return new Intl.NumberFormat('tr-TR').format(v ?? 0) + ' ₺'
}

// ─── Modal / Form ─────────────────────────────────────────────────────────────
const modal     = reactive({ show: false, isEdit: false })
const formError = ref('')
const form      = reactive({
  id: '', name: '', price: 0, description: '', color: 'blue', isActive: true, features: [''],
})

function openAdd() {
  Object.assign(form, { id: '', name: '', price: 0, description: '', color: 'blue', isActive: true, features: [''] })
  formError.value  = ''
  modal.isEdit     = false
  modal.show       = true
}

function openEdit(plan) {
  Object.assign(form, { ...plan, features: [...plan.features] })
  formError.value  = ''
  modal.isEdit     = true
  modal.show       = true
}

function addFeat()      { form.features.push('') }
function removeFeat(i)  { form.features.splice(i, 1) }

function save() {
  formError.value = ''
  if (!form.name.trim())   { formError.value = 'Paket adı zorunludur.'; return }
  if (form.price < 0)      { formError.value = 'Fiyat 0\'dan küçük olamaz.'; return }

  const clean = {
    ...form,
    name:     form.name.trim(),
    features: form.features.filter(f => f.trim()),
  }

  modal.isEdit ? store.guncelle(clean) : store.ekle(clean)
  modal.show = false
}

function deletePlan(plan) {
  if (subscriberCount(plan.id) > 0) return
  if (!confirm(`"${plan.name}" paketini silmek istediğinize emin misiniz?`)) return
  store.sil(plan.id)
}

// ─── Renk sistemi ─────────────────────────────────────────────────────────────
const colorOptions = [
  { value: 'blue',   label: 'Mavi'   },
  { value: 'purple', label: 'Mor'    },
  { value: 'green',  label: 'Yeşil'  },
  { value: 'orange', label: 'Turuncu'},
  { value: 'red',    label: 'Kırmızı'},
  { value: 'gray',   label: 'Gri'    },
]

const borderMap = { blue:'border-blue-400', purple:'border-purple-400', green:'border-green-400', orange:'border-orange-400', red:'border-red-400', gray:'border-gray-400' }
const dotMap    = { blue:'bg-blue-400',     purple:'bg-purple-400',     green:'bg-green-400',     orange:'bg-orange-400',     red:'bg-red-400',     gray:'bg-gray-400'    }
const textMap   = { blue:'text-blue-600',   purple:'text-purple-600',   green:'text-green-600',   orange:'text-orange-600',   red:'text-red-600',   gray:'text-gray-600'  }
const bgMap     = { blue:'bg-blue-50',      purple:'bg-purple-50',      green:'bg-green-50',      orange:'bg-orange-50',      red:'bg-red-50',      gray:'bg-gray-50'     }

function colorBorder(c) { return borderMap[c] ?? borderMap.blue }
function colorDot(c)    { return dotMap[c]    ?? dotMap.blue    }
function colorText(c)   { return textMap[c]   ?? textMap.blue   }
function colorBg(c)     { return bgMap[c]     ?? bgMap.blue     }
</script>
