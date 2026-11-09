<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-3xl">
    <h1 class="page-title mb-5">CRM ayarları</h1>
    <div v-if="!crm.loaded" class="py-16 text-center text-sm text-muted">Yükleniyor...</div>

    <template v-else>
      <form class="crm-card p-5 flex flex-col gap-4 mb-6" @submit.prevent="save">
        <h2 class="section-title">Gönderim</h2>
        <div class="grid sm:grid-cols-2 gap-4">
          <label class="crm-label"><span>Adınız (mesajda imza)</span><input v-model="s.senderName" class="crm-field" @input="saved = false"/></label>
          <label class="crm-label"><span>Firma adı</span><input v-model="s.companyName" class="crm-field" @input="saved = false"/></label>
          <label class="crm-label">
            <span>Günlük mesaj sınırı</span>
            <input v-model.number="s.dailyLimit" type="number" min="1" max="200" class="crm-field" @input="saved = false"/>
            <span v-if="s.dailyLimit > 40" class="text-amber-700 text-xs">Yeni bir numarada günde 40'ın üzeri, engellenme riskini artırır.</span>
          </label>
          <label class="crm-label">
            <span>WhatsApp nasıl açılsın?</span>
            <select v-model="s.openWith" class="crm-field" @change="saved = false">
              <option value="web">wa.me bağlantısı (tarayıcı / telefon)</option>
              <option value="app">Masaüstü WhatsApp uygulaması</option>
            </select>
          </label>
          <label class="crm-label">
            <span>Yanıt gelmezse kaç gün sonra takip</span>
            <input v-model.number="s.followUpDays" type="number" min="1" max="30" class="crm-field" @input="saved = false"/>
          </label>
          <label class="crm-label">
            <span>En fazla takip mesajı</span>
            <select v-model.number="s.maxFollowUps" class="crm-field" @change="saved = false">
              <option :value="0">Takip gönderme</option>
              <option :value="1">1</option>
              <option :value="2">2</option>
            </select>
          </label>
          <label class="crm-label"><span>Mesai başlangıcı</span><input v-model.number="s.workStart" type="number" min="0" max="23" class="crm-field" @input="saved = false"/></label>
          <label class="crm-label"><span>Mesai bitişi</span><input v-model.number="s.workEnd" type="number" min="1" max="24" class="crm-field" @input="saved = false"/></label>
        </div>
        <label class="flex items-start gap-3 text-sm cursor-pointer">
          <input v-model="s.autoCopyPoster" type="checkbox" class="mt-0.5 size-5 accent-accent" @change="saved = false"/>
          <span>
            <span class="font-semibold text-primary">"WhatsApp'ta aç" afişi de panoya kopyalasın</span>
            <span class="block text-muted">Mesajı gönderdikten sonra sohbette Ctrl+V ile afişi yapıştırırsınız.</span>
          </span>
        </label>
        <label class="crm-label">
          <span>Mesajdaki bağlantı ({link})</span>
          <input v-model="s.landingUrl" class="crm-field" placeholder="https://yenpos.com/kampanya" @input="saved = false"/>
        </label>
        <label class="crm-label">
          <span>Her mesajın sonuna eklenen ret cümlesi</span>
          <input v-model="s.optOutText" class="crm-field" @input="saved = false"/>
        </label>
        <div v-if="message" class="text-sm" :class="ok ? 'text-success' : 'text-danger'">{{ message }}</div>
        <button class="btn-primary self-start" :disabled="saving">{{ saved ? 'Kaydedildi' : saving ? 'Kaydediliyor…' : 'Kaydet' }}</button>
      </form>

      <section class="crm-card p-5 flex flex-col gap-3 mb-6">
        <h2 class="section-title">Yedek</h2>
        <p class="text-sm text-muted">
          Veriler sunucuda saklanır ve her gece sunucu yedeğine girer; her cihazdan aynı liste görünür. Elinizde
          crm.yenpos.com'dan alınmış eski bir yedek dosyası varsa buradan yükleyebilirsiniz (mevcut CRM verisinin yerine geçer).
        </p>
        <div class="flex flex-wrap gap-2">
          <button class="btn-secondary" :disabled="busy" @click="exportJson">Yedek indir (JSON)</button>
          <label class="btn-secondary cursor-pointer" :class="{ 'opacity-50 pointer-events-none': busy }">
            Yedekten geri yükle
            <input type="file" accept="application/json,.json" class="sr-only" @change="importJson"/>
          </label>
        </div>
        <p v-if="backupMessage" class="text-sm text-muted" role="status">{{ backupMessage }}</p>
      </section>

      <section class="crm-card p-5 text-sm text-muted leading-relaxed">
        <h2 class="section-title mb-2">Numaranızı korumak için</h2>
        <ul class="list-disc pl-5 flex flex-col gap-1">
          <li>WhatsApp Business uygulamasını kullanın; profil fotoğrafı olarak logonuzu, açıklamaya kısa tanıtım ve web sitenizi ekleyin.</li>
          <li>Günde 20-30 mesajla başlayın; yanıt oranı iyiyse yavaşça artırın.</li>
          <li>"RET" ya da "istemiyorum" yazanları hemen "RET" olarak işaretleyin; bir daha mesaj gitmez.</li>
          <li>Ticari ileti için İYS kaydınız olmalı; esnafa gönderimde ret hakkı her mesajda sunulmalı (ret cümlesi kendiliğinden ekleniyor).</li>
        </ul>
      </section>
    </template>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import api from '../../api/api'
import { uiConfirm } from '../../utils/dialog'
import { crm, loadCrm, crmActions } from '../../crm/store'
import '../../crm/crm.css'

const s = reactive({})
const saving = ref(false)
const saved = ref(false)
const message = ref('')
const ok = ref(true)
const busy = ref(false)
const backupMessage = ref('')

watch(() => crm.settings, v => { if (v) Object.assign(s, v) }, { immediate: true })

async function save() {
  saving.value = true
  message.value = ''
  try {
    await crmActions.saveSettings({ ...s })
    Object.assign(s, crm.settings)
    saved.value = true
  } catch (e) {
    message.value = e.response?.data?.message || 'Kaydedilemedi.'
    ok.value = false
  } finally {
    saving.value = false
  }
}

async function exportJson() {
  busy.value = true
  try {
    const { data } = await api.crmExport()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    a.download = `yenpos-crm-yedek-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  } catch (e) {
    backupMessage.value = e.response?.data?.message || 'Yedek alınamadı.'
  } finally {
    busy.value = false
  }
}

async function importJson(ev) {
  const file = ev.target.files?.[0]
  ev.target.value = ''
  if (!file) return
  if (!await uiConfirm('Mevcut CRM verisi yedektekilerle değiştirilecek. Devam edilsin mi?')) return
  busy.value = true
  backupMessage.value = ''
  try {
    const { data } = await api.crmImport(JSON.parse(await file.text()))
    await loadCrm(true)
    backupMessage.value = `Yedek yüklendi: ${data.leads} işletme.`
  } catch (e) {
    backupMessage.value = `Yüklenemedi: ${e.response?.data?.message || e.message}`
  } finally {
    busy.value = false
  }
}

onMounted(() => loadCrm())
</script>
