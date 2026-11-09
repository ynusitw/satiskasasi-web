<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-6xl">
    <div class="flex flex-wrap items-end gap-3 mb-5">
      <div class="flex-1 min-w-60">
        <h1 class="page-title">Mesaj şablonları</h1>
        <p class="page-subtitle">Her işletmeye kendi sektöründen bir şablon dönüşümlü seçilir; böylece mesajlar birbirinin kopyası olmaz.</p>
      </div>
      <button class="btn-ghost" :disabled="!crm.loaded" @click="resetDefaults">Varsayılana dön</button>
      <button class="btn-primary" :disabled="!crm.loaded || saving" @click="save">{{ saved ? 'Kaydedildi' : saving ? 'Kaydediliyor…' : 'Kaydet' }}</button>
    </div>

    <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>
    <div v-if="!crm.loaded" class="py-16 text-center text-sm text-muted">Yükleniyor...</div>

    <div v-else class="grid md:grid-cols-[260px_1fr] gap-5">
      <nav class="flex flex-col gap-4" aria-label="Şablon listesi">
        <div v-for="k in ['ilk', 'takip', 'en']" :key="k" class="flex flex-col gap-1">
          <p class="text-[11px] font-semibold text-muted uppercase tracking-wider px-1">{{ KIND_LABEL[k] }}</p>
          <p v-if="k === 'en'" class="text-xs text-muted px-1">Kendiliğinden gönderilmez; mesaj kartındaki "İngilizce" düğmesiyle seçilir.</p>
          <button v-for="t in list.filter(x => x.kind === k)" :key="t.id" @click="selected = t.id"
                  class="text-left rounded-xl px-3 py-2 min-h-11 text-sm transition-colors"
                  :class="t.id === selected ? 'bg-accent text-white font-semibold' : 'hover:bg-gray-100 text-primary'">
            {{ t.name }}
            <span class="block text-xs opacity-75">{{ t.segment === 'hepsi' ? 'Tüm sektörler' : SEGMENT_LABEL[t.segment] }}</span>
          </button>
          <button v-if="k === 'en' && !list.some(x => x.kind === 'en') && defaultEnglish.length" class="btn-secondary btn-sm justify-start"
                  @click="addDefaultEnglish">Hazır İngilizce şablonu ekle</button>
          <button class="btn-ghost btn-sm justify-start" @click="addTemplate(k)">+ Ekle</button>
        </div>
      </nav>

      <section v-if="current" class="flex flex-col gap-4">
        <div class="crm-card p-5 flex flex-col gap-3">
          <div class="grid sm:grid-cols-2 gap-3">
            <label class="crm-label"><span>Şablon adı</span><input class="crm-field" :value="current.name" @input="edit({ name: $event.target.value })"/></label>
            <label class="crm-label">
              <span>Sektör</span>
              <select class="crm-field" :value="current.segment" @change="edit({ segment: $event.target.value })">
                <option value="hepsi">Tüm sektörler</option>
                <option v-for="(label, key) in SEGMENT_LABEL" :key="key" :value="key">{{ label }}</option>
              </select>
            </label>
          </div>
          <label class="crm-label">
            <span>Mesaj</span>
            <textarea class="crm-area min-h-56" :value="current.body" @input="edit({ body: $event.target.value })"></textarea>
          </label>
          <div class="flex flex-wrap gap-2">
            <button v-for="v in VARIABLES" :key="v.key" class="chip-neutral hover:border-accent" :title="v.desc"
                    @click="edit({ body: current.body + v.key })">{{ v.key }}</button>
          </div>
          <div class="flex justify-end">
            <button class="btn-danger" @click="removeTemplate">Şablonu sil</button>
          </div>
        </div>
        <div class="crm-card p-5">
          <p class="text-[11px] font-semibold text-muted uppercase tracking-wider mb-3">Önizleme · Moda Kahve Evi, Caferağa</p>
          <div class="max-w-md rounded-2xl rounded-tr-sm bg-[#144d37] text-[#e9fbe9] p-4 text-sm leading-relaxed whitespace-pre-line ml-auto">{{ preview }}</div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { uiConfirm } from '../../utils/dialog'
import { crm, loadCrm, crmActions } from '../../crm/store'
import { SEGMENT_LABEL, VARIABLES, KIND_LABEL, toLead, fillTemplate } from '../../crm/logic'
import '../../crm/crm.css'

const sample = toLead({ name: 'Moda Kahve Evi', category: 'Kafe', phone: '05321112233', district: 'Kadıköy', neighborhood: 'Caferağa' }, 'manuel')

const list = ref([])
const selected = ref('')
const saving = ref(false)
const saved = ref(false)
const error = ref('')

// Sunucudaki şablonlar yüklenince düzenleme kopyası alınır; "Kaydet"e kadar sunucuya gitmez
watch(() => crm.loaded, ok => {
  if (!ok) return
  list.value = crm.templates.map(t => ({ ...t }))
  selected.value = list.value[0]?.id ?? ''
}, { immediate: true })

const current = computed(() => list.value.find(t => t.id === selected.value))
const preview = computed(() => current.value
  ? fillTemplate(current.value.body, { ...sample, segment: current.value.segment === 'hepsi' ? 'yeme_icme' : current.value.segment },
    crm.settings, crm.settings.landingUrl || 'https://yenpos.com/kampanya', 0, current.value.kind === 'en') : '')

function edit(patch) {
  saved.value = false
  Object.assign(current.value, patch)
}
const defaultEnglish = computed(() => crm.defaultTemplates.filter(t => t.kind === 'en'))
function addDefaultEnglish() {
  list.value.push(...defaultEnglish.value.map(t => ({ ...t })))
  selected.value = defaultEnglish.value[0].id
  saved.value = false
}
function addTemplate(kind) {
  const t = { id: crypto.randomUUID(), name: { ilk: 'Yeni ilk mesaj', takip: 'Yeni takip', en: 'Yeni İngilizce mesaj' }[kind], kind, segment: 'hepsi',
              body: kind === 'en' ? 'Hi, is this {isletme}? ' : '{selam}, {isletme} ekibine kolay gelsin. ' }
  list.value.push(t)
  selected.value = t.id
  saved.value = false
}
async function removeTemplate() {
  if (!await uiConfirm(`"${current.value.name}" silinsin mi?`)) return
  list.value = list.value.filter(t => t.id !== selected.value)
  selected.value = list.value[0]?.id ?? ''
  saved.value = false
}
async function resetDefaults() {
  if (!await uiConfirm('Tüm şablonlar varsayılana dönsün mü? (Kaydet ile kalıcı olur)')) return
  list.value = crm.defaultTemplates.map(t => ({ ...t }))
  selected.value = list.value[0]?.id ?? ''
  saved.value = false
}
async function save() {
  saving.value = true
  error.value = ''
  try {
    await crmActions.saveTemplates(list.value)
    saved.value = true
  } catch (e) {
    error.value = e.response?.data?.message || 'Kaydedilemedi.'
  } finally {
    saving.value = false
  }
}

onMounted(() => loadCrm())
</script>
