<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-5xl">
    <h1 class="page-title">Telefonla aranacaklar</h1>
    <p class="page-subtitle mb-5 max-w-2xl">
      Sabit hatlı işletmeler WhatsApp kullanmaz. Arayıp kısaca tanıtın; ilgilenirse demoya davet edin.
      Ulaşamazsanız 3 gün sonra yeniden listeye gelir.
    </p>

    <div v-if="crm.error" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ crm.error }}</div>
    <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>
    <div v-if="!crm.loaded" class="py-16 text-center text-sm text-muted">Yükleniyor...</div>

    <div v-else-if="!list.length" class="crm-card p-8 text-center">
      <p class="text-xl font-bold text-primary">Aranacak işletme yok</p>
      <p class="text-sm text-muted mt-2">Yeni bir ilçe tarayınca sabit hatlı işletmeler buraya düşer.</p>
      <RouterLink to="/superadmin/crm/bul" class="btn-primary mt-4 inline-flex">İşletme bul</RouterLink>
    </div>

    <section v-else class="crm-card p-4 md:p-5">
      <div class="flex flex-wrap items-end gap-3 mb-2">
        <h2 class="section-title flex-1 min-w-60">
          {{ filtered.length }} işletme <span class="text-muted font-normal text-sm">· en son eklenenler üstte</span>
        </h2>
        <label v-if="districts.length > 1" class="flex items-center gap-2 text-sm text-muted">
          İlçe
          <select v-model="district" class="crm-field w-auto" @change="shown = 15">
            <option value="hepsi">Hepsi ({{ list.length }})</option>
            <option v-for="d in districts" :key="d" :value="d">{{ d }} ({{ list.filter(l => l.district === d).length }})</option>
          </select>
        </label>
      </div>
      <ul class="divide-y divide-gray-100">
        <li v-for="l in filtered.slice(0, shown)" :key="l.id" class="py-3 flex flex-wrap items-center gap-2">
          <div class="flex-1 min-w-48">
            <p class="font-semibold text-primary">{{ l.name }}</p>
            <p class="text-sm text-muted">{{ l.category }}</p>
            <p class="text-sm text-muted">
              {{ addressOf(l) || 'Adres bilinmiyor' }} ·
              <a class="text-accent underline underline-offset-2" :href="mapUrl(l)" target="_blank" rel="noopener">Haritada aç</a>
            </p>
          </div>
          <a class="btn-primary" :href="`tel:${l.phone}`">{{ formatPhone(l.phone) }}</a>
          <button class="btn-secondary" :disabled="busy === l.id" @click="act(l.id, () => crmActions.setStatus(l.id, 'yanitladi'))">İlgileniyor</button>
          <button class="btn-secondary" :disabled="busy === l.id" @click="act(l.id, () => crmActions.skip(l.id, 3))">Ulaşılamadı</button>
          <button class="btn-danger" :disabled="busy === l.id" @click="act(l.id, () => crmActions.setStatus(l.id, 'ret'))">İlgilenmiyor</button>
        </li>
      </ul>
      <div v-if="shown < filtered.length" class="text-center pt-3">
        <button class="btn-secondary" @click="shown += 15">Daha fazla göster ({{ filtered.length - shown }})</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { crm, loadCrm, crmActions } from '../../crm/store'
import { callList, addressOf, mapUrl, formatPhone } from '../../crm/logic'
import '../../crm/crm.css'

const district = ref('hepsi')
const shown = ref(15)
const busy = ref(null)
const error = ref('')

const list = computed(() => callList(crm))
const districts = computed(() => [...new Set(list.value.map(l => l.district).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr')))
const filtered = computed(() => list.value
  .filter(l => district.value === 'hepsi' || l.district === district.value)
  .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))))

async function act(id, fn) {
  busy.value = id
  error.value = ''
  try { await fn() } catch (e) { error.value = e.response?.data?.message || 'Kaydedilemedi.' } finally { busy.value = null }
}

onMounted(() => loadCrm(true))
</script>
