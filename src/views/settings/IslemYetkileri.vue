<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-5xl">
    <h1 class="page-title">İşlem Yetkileri</h1>
    <p class="page-subtitle mb-6">
      Kasadaki her işlemin kimin tarafından, hangi onayla yapılacağını seçin. Değişiklik kasalara
      birkaç dakika içinde geçer.
    </p>

    <!-- Seçeneklerin anlamı -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
      <div v-for="m in modes" :key="m.value" class="bg-white rounded-2xl shadow-sm p-4">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full" :class="m.dot"/>
          <span class="font-semibold text-[14px] text-primary">{{ m.label }}</span>
        </div>
        <p class="text-xs text-muted mt-1.5 leading-relaxed">{{ m.help }}</p>
      </div>
    </div>

    <div v-if="loading" class="bg-white rounded-2xl shadow-sm py-12 text-center text-muted">Yükleniyor...</div>
    <div v-else-if="loadError" class="p-4 bg-red-50 text-red-600 rounded-xl text-sm">{{ loadError }}</div>

    <template v-else>
      <p v-if="!auth.isAdmin" class="mb-4 p-3 bg-amber-50 text-amber-700 rounded-xl text-sm">
        Bu ayarları yalnızca işletme yöneticisi değiştirebilir.
      </p>

      <div v-for="g in groups" :key="g.name" class="bg-white rounded-2xl shadow-sm mb-5 overflow-hidden">
        <div class="px-6 py-3.5 border-b border-gray-100">
          <h2 class="section-title">{{ g.name }}</h2>
        </div>
        <div v-for="p in g.items" :key="p.key"
             class="px-6 py-4 border-t border-gray-50 first:border-t-0 flex flex-wrap items-center gap-x-6 gap-y-3">
          <div class="min-w-0 flex-1" style="min-width: 220px">
            <div class="font-semibold text-[14px] text-primary">
              {{ p.label }}
              <span v-if="isChanged(p)" class="ml-1.5 text-[11px] font-semibold text-amber-600">değişti</span>
            </div>
            <div class="text-xs text-muted mt-0.5">{{ p.description }}</div>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <!-- Şifresiz / Yönetici / Özel şifre -->
            <div class="flex rounded-xl overflow-hidden border border-gray-200">
              <button v-for="m in modes" :key="m.value" type="button" :disabled="!auth.isAdmin"
                      @click="setMode(p, m.value)"
                      class="px-3.5 h-9 text-[12.5px] font-semibold transition-colors disabled:cursor-not-allowed"
                      :class="p.mode === m.value ? m.active : 'bg-white text-muted hover:text-primary hover:bg-gray-50'">
                {{ m.label }}
              </button>
            </div>

            <!-- Özel şifre seçiliyse şifre kutusu -->
            <div v-if="p.mode === 'Pin'" class="flex items-center gap-2">
              <input v-model="p.pin" type="password" inputmode="numeric" maxlength="8" autocomplete="new-password"
                     :disabled="!auth.isAdmin"
                     :placeholder="p.hasPin ? 'Şifre tanımlı • değiştir' : '4-8 rakam'"
                     class="w-44 px-3 border rounded-lg text-[13.5px] h-9 bg-white"
                     :class="pinError(p) ? 'border-red-300' : 'border-gray-200'"/>
              <span v-if="p.hasPin && !p.pin" class="text-[11.5px] text-green-600 font-semibold">tanımlı</span>
            </div>
          </div>
          <div v-if="pinError(p)" class="w-full text-xs text-red-600 -mt-1">{{ pinError(p) }}</div>
        </div>
      </div>

      <!-- Kaydet çubuğu -->
      <div v-if="auth.isAdmin" class="sticky bottom-4 flex items-center justify-end gap-3 bg-white rounded-2xl shadow-lg px-5 py-3">
        <span class="text-sm text-muted mr-auto">
          {{ changedCount ? `${changedCount} işlemde değişiklik var` : 'Değişiklik yok' }}
        </span>
        <button type="button" class="btn-secondary" :disabled="!changedCount || saving" @click="reset">Vazgeç</button>
        <button type="button" class="btn-primary disabled:opacity-50" :disabled="!changedCount || saving || hasErrors" @click="save">
          {{ saving ? 'Kaydediliyor...' : 'Kaydet' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '../../api/api'
import { uiAlert } from '../../utils/dialog'
import { useAuthStore } from '../../stores/auth'
import { useModulesStore } from '../../stores/modules'
import { MODULES } from '../../constants/modules'

const auth = useAuthStore()
const modulesStore = useModulesStore()

const modes = [
  { value: 'Free', label: 'Şifresiz', dot: 'bg-green-500', active: 'bg-green-600 text-white',
    help: 'Kasaya giriş yapmış her kullanıcı bu işlemi doğrudan yapar.' },
  { value: 'Manager', label: 'Yönetici', dot: 'bg-blue-500', active: 'bg-accent text-white',
    help: 'Yönetici ve onay yetkilisi kullanıcılar kendileri yapar; diğer kullanıcılardan yönetici PIN’i istenir (Kullanıcılar sayfasında tanımlanır).' },
  { value: 'Pin', label: 'Özel şifre', dot: 'bg-amber-500', active: 'bg-amber-500 text-white',
    help: 'İşleme özel bir şifre belirlenir; yalnızca bu şifreyi bilen yapar. Yönetici de bu şifreyi girer.' },
]

// Modülü olmayan işletmede ilgisiz işlemler gösterilmez
const moduleOf = {
  'table.item_cancel': MODULES.TABLES, 'table.cancel': MODULES.TABLES,
  'manage.reservations': MODULES.TABLES, 'cari.cards': MODULES.CARI,
}

const items = ref([])
const original = ref({})
const loading = ref(true)
const loadError = ref('')
const saving = ref(false)

const groups = computed(() => {
  const out = []
  for (const p of items.value) {
    const mod = moduleOf[p.key]
    if (mod && !auth.isSuperAdmin && !modulesStore.has(mod)) continue
    let g = out.find(x => x.name === p.group)
    if (!g) out.push(g = { name: p.group, items: [] })
    g.items.push(p)
  }
  return out
})

function isChanged(p) {
  return p.mode !== original.value[p.key] || !!p.pin
}
const changedCount = computed(() => items.value.filter(isChanged).length)

function pinError(p) {
  if (p.mode !== 'Pin') return ''
  if (p.pin && !/^\d{4,8}$/.test(p.pin)) return 'Şifre 4-8 haneli rakam olmalı.'
  if (!p.pin && !p.hasPin) return 'Bu işlem için bir şifre belirleyin.'
  return ''
}
const hasErrors = computed(() => items.value.some(p => isChanged(p) && pinError(p)))

function setMode(p, mode) {
  p.mode = mode
  if (mode !== 'Pin') p.pin = ''
}

function apply(data) {
  items.value = data.map(p => ({ ...p, pin: '' }))
  original.value = Object.fromEntries(data.map(p => [p.key, p.mode]))
}

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    apply((await api.getActionPolicies()).data || [])
  } catch (e) {
    loadError.value = e?.response?.status === 404
      ? 'Sunucu henüz güncellenmemiş; bu sayfa API yayınlandıktan sonra çalışır.'
      : (e?.response?.data?.message || 'İşlem yetkileri alınamadı.')
  } finally {
    loading.value = false
  }
}

function reset() {
  for (const p of items.value) { p.mode = original.value[p.key]; p.pin = '' }
}

async function save() {
  saving.value = true
  try {
    const updates = items.value.filter(isChanged)
      .map(p => ({ key: p.key, mode: p.mode, pin: p.mode === 'Pin' && p.pin ? p.pin : null }))
    apply((await api.saveActionPolicies(updates)).data || [])
  } catch (e) {
    await uiAlert(e?.response?.status === 403
      ? 'Bu ayarları yalnızca işletme yöneticisi değiştirebilir.'
      : (e?.response?.data?.message || 'Kaydedilemedi.'))
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
