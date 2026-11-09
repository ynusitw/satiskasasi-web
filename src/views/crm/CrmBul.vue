<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-4xl">
    <h1 class="page-title">İşletme bul</h1>
    <p class="page-subtitle mb-5">Bulunan işletmeler listenize eklenir; aynı telefon numarası iki kez eklenmez.</p>

    <p v-if="done" class="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-3 text-sm" role="status">{{ done }}</p>
    <p v-if="error" class="mb-4 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm" role="alert">{{ error }}</p>

    <!-- OpenStreetMap -->
    <section class="crm-card p-5 flex flex-col gap-4 mb-6">
      <div>
        <h2 class="section-title">İlçe tara · OpenStreetMap</h2>
        <p class="text-sm text-muted mt-1">
          Ücretsiz ve anahtarsız. {{ OSM_TYPES.slice(0, 8).join(', ') }} gibi işletmeleri getirir. Yalnız telefonu
          kayıtlı olanlar gösterilir. Bir ilçe ilk kez tarandıktan sonra sonuç saklanır ve sonraki taramalar anında
          gelir; "Canlı güncelle" ücretsiz OpenStreetMap sunucusundan yeniden çeker (1 dakikayı bulabilir, sunucu
          yoğunsa biraz sonra tekrar deneyin). Veri © OpenStreetMap katkıcıları (ODbL).
        </p>
      </div>
      <div class="flex flex-wrap gap-3 items-end">
        <label class="crm-label">
          <span>İstanbul ilçesi</span>
          <select v-model="district" class="crm-field w-56">
            <option v-for="d in ISTANBUL_DISTRICTS" :key="d">{{ d }}</option>
          </select>
        </label>
        <label class="crm-label flex-1 min-w-48">
          <span>ya da başka bir ilçe (ör. Çankaya, Nilüfer)</span>
          <input v-model="other" class="crm-field" placeholder="İlçe adı"/>
        </label>
        <button class="btn-primary" :disabled="scanning" @click="scan(false)">{{ scanning ? 'Taranıyor…' : `${target} tara` }}</button>
        <button class="btn-secondary" :disabled="scanning" title="Saklanan sonuç yerine OpenStreetMap'ten şimdi çeker" @click="scan(true)">Canlı güncelle</button>
      </div>
      <p v-if="info" class="text-sm text-muted" role="status">{{ info }}</p>
      <template v-if="found?.length">
        <LeadPreview :leads="found"/>
        <div class="flex flex-wrap gap-3">
          <button class="btn-primary" :disabled="adding" @click="add(found, () => (found = null))">
            {{ found.length }} işletmeyi listeye ekle
          </button>
          <button v-if="mobileOf(found).length" class="btn-secondary" :disabled="adding"
                  @click="add(mobileOf(found), () => (found = null))">
            Yalnız cep (WhatsApp) olan {{ mobileOf(found).length }} işletmeyi ekle
          </button>
        </div>
      </template>
    </section>

    <!-- CSV -->
    <section class="crm-card p-5 flex flex-col gap-4 mb-6">
      <div>
        <h2 class="section-title">Liste yükle · CSV</h2>
        <p class="text-sm text-muted mt-1">
          Excel'den "CSV olarak kaydet" ile aldığınız listeler. Sütun adları: isim / name, telefon / phone,
          kategori, ilçe, mahalle.
        </p>
      </div>
      <label class="btn-secondary self-start cursor-pointer">
        Dosya seç
        <input type="file" accept=".csv,text/csv" class="sr-only" @change="readCsv"/>
      </label>
      <template v-if="csvLeads?.length">
        <LeadPreview :leads="csvLeads"/>
        <div class="flex flex-wrap gap-3">
          <button class="btn-primary" :disabled="adding" @click="add(csvLeads, () => (csvLeads = null))">
            {{ csvLeads.length }} işletmeyi listeye ekle
          </button>
          <button v-if="mobileOf(csvLeads).length" class="btn-secondary" :disabled="adding"
                  @click="add(mobileOf(csvLeads), () => (csvLeads = null))">
            Yalnız cep (WhatsApp) olan {{ mobileOf(csvLeads).length }} işletmeyi ekle
          </button>
        </div>
      </template>
    </section>

    <!-- Elle -->
    <section class="crm-card p-5 flex flex-col gap-4">
      <div>
        <h2 class="section-title">Elle ekle</h2>
        <p class="text-sm text-muted mt-1">Google Haritalar'da ya da yolda gördüğünüz işletmeler için.</p>
      </div>
      <form class="grid sm:grid-cols-2 gap-3" @submit.prevent="addManual">
        <label class="crm-label"><span>İşletme adı</span><input v-model="manual.name" required class="crm-field"/></label>
        <label class="crm-label"><span>Telefon</span><input v-model="manual.phone" required class="crm-field" placeholder="0532 111 22 33" inputmode="tel"/></label>
        <label class="crm-label">
          <span>Tür</span>
          <select v-model="manual.category" class="crm-field">
            <option v-for="c in ['Kafe', 'Restoran', 'Fast food', 'Pastane', 'Market', 'Bakkal / Market', 'Kasap', 'Manav', 'Mağaza']" :key="c">{{ c }}</option>
          </select>
        </label>
        <label class="crm-label"><span>İlçe</span><input v-model="manual.district" class="crm-field"/></label>
        <label class="crm-label"><span>Mahalle / semt</span><input v-model="manual.neighborhood" class="crm-field"/></label>
        <div class="flex items-end"><button class="btn-primary w-full" :disabled="adding">Ekle</button></div>
      </form>
    </section>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, reactive, ref } from 'vue'
import api from '../../api/api'
import { crmActions, loadCrm } from '../../crm/store'
import { ISTANBUL_DISTRICTS, OSM_TYPES, toLead, parseCsv, csvToLeads, addressOf, formatPhone } from '../../crm/logic'
import '../../crm/crm.css'

// Bulunanların özeti ve ilk 100'ü
const LeadPreview = defineComponent({
  props: { leads: Array },
  setup(props) {
    return () => {
      const mobile = props.leads.filter(l => l.phoneType === 'mobile').length
      const land = props.leads.filter(l => l.phoneType === 'landline').length
      return h('div', { class: 'flex flex-col gap-3' }, [
        h('div', { class: 'grid grid-cols-3 gap-3' }, [['Telefonlu', mobile + land], ['Cep (WhatsApp)', mobile], ['Sabit hat (arama)', land]]
          .map(([label, v]) => h('div', { class: 'rounded-xl bg-gray-50 p-3' }, [
            h('p', { class: 'text-xs text-muted' }, label), h('p', { class: 'text-xl font-bold text-primary' }, v)]))),
        h('ul', { class: 'divide-y divide-gray-100 max-h-72 overflow-y-auto rounded-xl border border-gray-100' },
          props.leads.slice(0, 100).map(l => h('li', { class: 'px-3 py-2 flex flex-wrap gap-x-3 text-sm', key: l.key }, [
            h('span', { class: 'flex-1 min-w-40' }, [h('span', { class: 'font-semibold text-primary' }, l.name),
              h('span', { class: 'block text-xs text-muted' }, addressOf(l) || 'Adres yok')]),
            h('span', { class: 'text-muted' }, l.category),
            h('span', { class: 'font-mono' }, formatPhone(l.phone))]))),
      ])
    }
  },
})

const district = ref('Kadıköy')
const other = ref('')
const target = computed(() => other.value.trim() || district.value)
const scanning = ref(false)
const adding = ref(false)
const info = ref('')
const error = ref('')
const done = ref('')
const found = ref(null)
const csvLeads = ref(null)
const manual = reactive({ name: '', phone: '', category: 'Kafe', district: '', neighborhood: '' })

async function scan(live) {
  scanning.value = true
  error.value = ''
  found.value = null
  info.value = live ? "OpenStreetMap'ten canlı çekiliyor, 1 dakikaya kadar sürebilir…" : ''
  try {
    const { data } = await api.crmOsm({ ilce: target.value, canli: live, istanbul: !other.value.trim() })
    const seen = new Set()
    found.value = data.leads.map(r => toLead(r, 'osm'))
      .filter(l => l?.phone && !seen.has(l.phone) && seen.add(l.phone))
    const date = new Date(data.fetchedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    info.value = data.source === 'hazir'
      ? `Saklanan sonuç · ${date} tarihli. Daha yeni kayıtlar için "Canlı güncelle".`
      : `Canlı veri · ${date}`
    if (!found.value.length) error.value = `"${target.value}" için telefonlu işletme bulunamadı. İlçe adını OpenStreetMap'teki gibi yazdığınızdan emin olun.`
  } catch (e) {
    error.value = e.response?.data?.message || 'Tarama başarısız.'
    info.value = ''
  } finally {
    scanning.value = false
  }
}

// WhatsApp'tan yazılabilenler (cep telefonu); sabit hatlar yalnız aranabilir
const mobileOf = leads => leads.filter(l => l.phoneType === 'mobile')

async function add(leads, after) {
  adding.value = true
  error.value = ''
  done.value = ''          // önceki sonucun mesajı yeni işlemle karışmasın
  try {
    const { added, updated } = await crmActions.addLeads(leads)
    const dup = leads.length - added
    done.value = `${added} yeni işletme eklendi` + (dup ? `, ${dup} tanesi zaten listedeydi` : '')
      + (updated ? ` (${updated} kaydın adres/konum bilgisi tamamlandı)` : '') + '.'
    after()
  } catch (e) {
    error.value = e.response?.data?.message || 'Eklenemedi.'
  } finally {
    adding.value = false
  }
}

async function readCsv(ev) {
  const file = ev.target.files?.[0]
  ev.target.value = ''
  if (!file) return
  error.value = ''
  const rows = csvToLeads(parseCsv(await file.text()))
  if (!rows.length) error.value = "Dosyada işletme bulunamadı. İlk satırda 'isim' ve 'telefon' sütunları olmalı."
  csvLeads.value = rows
}

function addManual() {
  const lead = toLead({ ...manual }, 'manuel')
  if (!lead?.phone) { error.value = 'Telefon numarası geçersiz. Örnek: 0532 111 22 33'; return }
  add([lead], () => Object.assign(manual, { name: '', phone: '', district: '', neighborhood: '' }))
}

loadCrm()
</script>
