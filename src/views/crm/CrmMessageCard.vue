<template>
  <!-- Kuyruktaki tek işletme: şablondan doldurulmuş mesaj, WhatsApp'ta aç, gönderildi işareti -->
  <article class="crm-card p-4 md:p-5 flex flex-col gap-3">
    <header class="flex flex-wrap items-start gap-x-3 gap-y-1">
      <div class="min-w-0 flex-1">
        <h3 class="text-lg font-bold text-primary leading-tight truncate">{{ lead.name }}</h3>
        <p class="text-sm text-muted">{{ lead.category }}</p>
        <p class="text-sm text-muted flex flex-wrap items-center gap-x-2">
          <span>{{ addressOf(lead) || place || 'Adres bilinmiyor' }}</span>
          <a class="text-accent underline underline-offset-2" :href="mapUrl(lead)" target="_blank" rel="noopener">Haritada aç</a>
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <span v-if="kind === 'takip'" class="chip-accent">Takip mesajı</span>
        <span class="chip-neutral">{{ SEGMENT_LABEL[lead.segment] }}</span>
        <span class="chip-neutral font-mono">{{ formatPhone(lead.phone) }}</span>
      </div>
    </header>

    <label class="sr-only" :for="`msg-${lead.id}`">{{ lead.name }} için mesaj</label>
    <textarea :id="`msg-${lead.id}`" v-model="text" class="crm-area min-h-44 resize-y"></textarea>
    <p v-if="error" class="text-sm text-danger">{{ error }}</p>

    <!-- WhatsApp açıldıktan sonra: gönderdiniz mi? -->
    <div v-if="opened" class="flex flex-wrap items-center gap-2 rounded-xl bg-gray-50 p-3">
      <div class="text-sm flex-1 min-w-48 flex flex-col gap-1">
        <p v-if="crm.settings.autoCopyPoster && posterCopied === true" class="text-success">
          Afiş panoda: WhatsApp'ta mesajı gönderin, sonra
          <kbd class="rounded bg-white px-1.5 font-mono text-xs">Ctrl+V</kbd> ve Enter ile afişi de gönderin.
        </p>
        <p v-if="crm.settings.autoCopyPoster && posterCopied === false" class="text-amber-700">
          Afiş kendiliğinden kopyalanamadı; yukarıdaki "Afişi kopyala" düğmesini kullanın.
        </p>
        <p class="text-muted">Mesajı WhatsApp'ta gönderdiniz mi?</p>
      </div>
      <button class="btn-primary" :disabled="busy" @click="act(() => crmActions.markSent(lead.id, text))">Gönderdim</button>
      <button class="btn-secondary" :disabled="busy" @click="act(() => crmActions.setStatus(lead.id, 'gecersiz'))">Numara WhatsApp'ta yok</button>
      <button class="btn-ghost" @click="opened = false">Vazgeç</button>
    </div>

    <div v-else class="flex flex-wrap gap-2">
      <button class="btn-primary" @click="openWhatsApp">WhatsApp'ta aç</button>
      <button class="btn-secondary" :disabled="alternatives < 2 && edited === null" @click="nextTemplate">Başka şablon</button>
      <button v-if="kind === 'ilk' && hasEnglish" class="btn-secondary" :aria-pressed="english" @click="toggleEnglish">
        {{ english ? 'Türkçe' : 'İngilizce' }}
      </button>
      <button v-if="crm.aiEnabled" class="btn-secondary" :disabled="aiBusy" @click="personalize">
        {{ aiBusy ? 'Yazılıyor…' : 'AI ile kişiselleştir' }}
      </button>
      <span class="flex-1"></span>
      <button class="btn-ghost" :disabled="busy" @click="act(() => crmActions.skip(lead.id, 1))">Yarına ertele</button>
      <button class="btn-danger" :disabled="busy" @click="act(() => crmActions.setStatus(lead.id, 'ret'))">Listeden çıkar</button>
    </div>
  </article>
</template>

<script setup>
import { computed, ref } from 'vue'
import api from '../../api/api'
import { crm, crmActions } from '../../crm/store'
import { SEGMENT_LABEL, addressOf, mapUrl, formatPhone, whatsappUrl, pickTemplate, fillTemplate,
         templatesFor, copyPoster, EN_OPT_OUT } from '../../crm/logic'

const props = defineProps({ lead: Object, kind: String, link: String })

const offset = ref(0)
const english = ref(false)        // İngilizce şablon yalnız elle seçilir
const edited = ref(null)          // elle ya da yapay zekâyla değiştirilmiş metin
const opened = ref(false)
const posterCopied = ref(null)
const busy = ref(false)
const aiBusy = ref(false)
const error = ref('')

const place = computed(() => [props.lead.neighborhood, props.lead.district].filter(Boolean).join(', '))
const hasEnglish = computed(() => crm.templates.some(t => t.kind === 'en'))
const activeKind = computed(() => english.value ? 'en' : props.kind)
const template = computed(() => pickTemplate(props.lead, activeKind.value, crm.templates, offset.value))
const generated = computed(() => template.value
  ? fillTemplate(template.value.body, props.lead, crm.settings, props.link, offset.value, english.value) : '')
const alternatives = computed(() => templatesFor(props.lead, activeKind.value, crm.templates).length)
const text = computed({
  get: () => edited.value ?? generated.value,
  set: v => { edited.value = v },
})

function nextTemplate() {
  edited.value = null
  offset.value++
}

function toggleEnglish() {
  edited.value = null
  offset.value = 0
  english.value = !english.value
}

function openWhatsApp() {
  if (!props.lead.phone) return
  if (crm.settings.autoCopyPoster) {
    posterCopied.value = null
    copyPoster().then(ok => { posterCopied.value = ok })
  }
  window.open(whatsappUrl(props.lead.phone, text.value, crm.settings.openWith), '_blank', 'noopener')
  opened.value = true
}

async function act(fn) {
  busy.value = true
  error.value = ''
  try { await fn() } catch (e) { error.value = e.response?.data?.message || 'Kaydedilemedi. Bağlantıyı kontrol edin.' }
  finally { busy.value = false }
}

async function personalize() {
  aiBusy.value = true
  error.value = ''
  try {
    const opt = english.value ? EN_OPT_OUT : crm.settings.optOutText
    const draft = text.value.replace(opt, '').trim()
    const { data } = await api.crmAi({ name: props.lead.name, category: props.lead.category, place: place.value, draft })
    edited.value = opt ? `${data.text}\n\n${opt}` : data.text
  } catch (e) {
    error.value = e.response?.data?.message || 'Yapay zekâya ulaşılamadı.'
  } finally {
    aiBusy.value = false
  }
}
</script>
