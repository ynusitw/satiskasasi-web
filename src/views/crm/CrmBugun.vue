<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-5xl">
    <div class="flex flex-wrap items-end gap-4 mb-5">
      <div class="flex-1 min-w-60">
        <p class="text-sm font-semibold text-accent capitalize">{{ today }}</p>
        <h1 class="page-title">Bugünün listesi</h1>
        <p class="page-subtitle">WhatsApp'tan ulaşılacak işletmeler; önce takip zamanı gelenler, sonra yeniler</p>
      </div>
      <div v-if="crm.loaded" class="w-full md:w-80">
        <div class="flex justify-between text-sm mb-2">
          <span class="text-muted">Günlük hedef</span>
          <span class="font-semibold text-primary">{{ queue.sent }} / {{ crm.settings.dailyLimit }}</span>
        </div>
        <div class="h-3 rounded-full bg-gray-100 overflow-hidden" role="progressbar"
             :aria-valuenow="queue.sent" :aria-valuemax="crm.settings.dailyLimit" aria-label="Bugün gönderilen mesaj">
          <div class="h-full bg-accent rounded-full transition-all"
               :style="{ width: `${Math.min(100, queue.sent / Math.max(1, crm.settings.dailyLimit) * 100)}%` }"></div>
        </div>
      </div>
    </div>

    <div v-if="crm.error" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ crm.error }}</div>
    <div v-if="!crm.loaded" class="py-16 text-center text-sm text-muted">Yükleniyor...</div>

    <template v-else>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <div v-for="[label, value] in summary" :key="label" class="stat-card bg-white rounded-2xl shadow-sm p-4">
          <div class="text-[11px] font-semibold uppercase tracking-wider text-muted">{{ label }}</div>
          <div class="stat-value text-primary mt-1">{{ value }}</div>
        </div>
      </div>

      <p v-if="offHours" class="mb-5 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-4 py-3 text-sm">
        Şu an mesai dışı ({{ crm.settings.workStart }}:00–{{ crm.settings.workEnd }}:00). İşletmeler genelde mesaileri
        içinde gelen mesajlara daha iyi dönüyor.
      </p>

      <!-- Kampanya afişi -->
      <section class="crm-card p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <img :src="POSTER_URL" alt="Kampanya afişi" class="w-24 rounded-lg border border-gray-100 hidden sm:block"/>
        <div class="flex-1 min-w-0">
          <h2 class="section-title">Kampanya afişi</h2>
          <p class="text-sm text-muted leading-relaxed mt-1">
            <template v-if="crm.settings.autoCopyPoster">
              "WhatsApp'ta aç" afişi kendiliğinden panoya kopyalar. Mesajı gönderdikten sonra sohbette
              <kbd class="mx-1 rounded bg-gray-100 px-1.5 font-mono text-xs">Ctrl+V</kbd> ve Enter ile afişi de gönderin.
            </template>
            <template v-else>
              Mesajdaki bağlantı WhatsApp'ta afiş önizlemesiyle açılır. Görseli ayrıca göndermek için kopyalayıp
              sohbete <kbd class="mx-1 rounded bg-gray-100 px-1.5 font-mono text-xs">Ctrl+V</kbd> ile yapıştırın.
            </template>
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button class="btn-secondary" :disabled="posterState === 'busy'" @click="copyPosterNow">
            {{ posterState === 'ok' ? 'Kopyalandı' : posterState === 'err' ? 'Kopyalanamadı' : 'Afişi kopyala' }}
          </button>
          <a class="btn-secondary" :href="POSTER_URL" download="yenpos-kampanya.png">İndir</a>
          <a class="btn-ghost" :href="link" target="_blank" rel="noopener">Kampanya sayfası</a>
        </div>
      </section>

      <h2 class="section-title mb-3">WhatsApp kuyruğu <span class="text-muted font-normal text-sm">· {{ queue.items.length }} işletme</span></h2>

      <div v-if="!queue.items.length" class="crm-card p-8 text-center">
        <template v-if="queue.remaining === 0">
          <p class="text-xl font-bold text-primary">Bugünlük hedef tamam</p>
          <p class="text-sm text-muted mt-2 max-w-md mx-auto">
            Numaranızın güvenliği için günlük sınırı aşmamanız iyi olur. Gelen yanıtları Müşteri Adayları sayfasından işaretleyin.
          </p>
        </template>
        <template v-else>
          <p class="text-xl font-bold text-primary">Kuyruk boş</p>
          <p class="text-sm text-muted mt-2 max-w-md mx-auto">
            WhatsApp'a uygun (cep telefonlu) yeni işletme kalmadı. Yeni bir ilçe tarayın ya da liste yükleyin.
          </p>
          <RouterLink to="/superadmin/crm/bul" class="btn-primary mt-4 inline-flex">İşletme bul</RouterLink>
        </template>
      </div>

      <div class="flex flex-col gap-4">
        <CrmMessageCard v-for="it in queue.items" :key="it.lead.id + it.kind"
                        :lead="it.lead" :kind="it.kind" :link="link"/>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { crm, loadCrm } from '../../crm/store'
import { todayQueue, counts, POSTER_URL, copyPoster, preloadPoster } from '../../crm/logic'
import CrmMessageCard from './CrmMessageCard.vue'
import '../../crm/crm.css'

const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })
const queue = computed(() => todayQueue(crm))
const c = computed(() => counts(crm))
const summary = computed(() => [
  ['Sırada bekleyen', c.value.mobileNew], ['Yanıt bekleniyor', c.value.sent], ['Yanıt verdi', c.value.replied],
  ['Demo', c.value.demo], ['Müşteri', c.value.customer],
])
const link = computed(() => crm.settings?.landingUrl?.trim() || 'https://yenpos.com/kampanya')
const offHours = computed(() => {
  const h = new Date().getHours()
  return h < crm.settings.workStart || h >= crm.settings.workEnd
})

const posterState = ref('')
async function copyPosterNow() {
  posterState.value = 'busy'
  posterState.value = (await copyPoster()) ? 'ok' : 'err'
}

onMounted(() => { loadCrm(true); preloadPoster() })
</script>
