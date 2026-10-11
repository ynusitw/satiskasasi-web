<template>
  <!-- Pano "Şu an": işletmenin anlık durumu. Kartlar yalnızca ilgili modül açıksa görünür. -->
  <section v-if="live" class="mb-6">
    <div class="flex items-center justify-between mb-3">
      <h2 class="font-semibold text-primary text-[15px] flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-success inline-block animate-pulse"/> Şu an
      </h2>
      <span class="text-[12px] text-muted">{{ clock(live.now) }} itibarıyla · dakikada bir yenilenir</span>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

      <!-- Kasalar -->
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <div class="text-[12.5px] font-medium text-muted">Kasalar</div>
        <div v-if="!live.devices.length" class="text-[17px] font-semibold text-muted mt-1">Lisanslı kasa yok</div>
        <template v-else>
          <div class="text-[20px] font-semibold mt-1"
               :class="offlineCount ? 'text-warning' : 'text-success'">
            {{ live.devices.length - offlineCount }}/{{ live.devices.length }} çevrimiçi
          </div>
          <ul class="mt-2 space-y-1">
            <li v-for="(d, i) in live.devices" :key="i" class="flex items-center justify-between gap-2 text-[12.5px]">
              <span class="flex items-center gap-1.5 min-w-0">
                <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="d.online ? 'bg-success' : 'bg-danger'"/>
                <span class="truncate text-primary">{{ d.name || 'Kasa' }}</span>
              </span>
              <span class="flex-shrink-0" :class="d.online ? 'text-muted' : 'text-danger font-medium'">
                {{ d.lastSeenAt ? ago(d.lastSeenAt) : 'hiç bağlanmadı' }}
              </span>
            </li>
          </ul>
          <div v-if="pendingTotal" class="mt-2 text-[12px] font-semibold text-danger">
            {{ pendingTotal }} kayıt kasada gönderilmeyi bekliyor
          </div>
        </template>
      </div>

      <!-- Masalar -->
      <RouterLink v-if="live.tables" to="/reports/masalar" class="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow">
        <div class="text-[12.5px] font-medium text-muted">Masalar</div>
        <div class="text-[20px] font-semibold text-primary mt-1">
          {{ live.tables.occupied }}/{{ live.tables.total }} dolu
        </div>
        <div class="text-[12.5px] text-muted mt-1">
          Açık adisyonlar <span class="font-semibold text-primary">{{ fmt(live.tables.openTotal) }}</span>
        </div>
        <div v-if="live.tables.oldestOpenedAt" class="text-[12.5px] mt-0.5"
             :class="minutesSince(live.tables.oldestOpenedAt) > 180 ? 'text-warning font-medium' : 'text-muted'">
          En uzun açık masa: {{ duration(live.tables.oldestOpenedAt) }}
        </div>
        <div v-if="live.qrPending" class="mt-2 text-[12px] font-semibold text-warning">
          {{ live.qrPending }} QR sipariş kasa onayı bekliyor
        </div>
      </RouterLink>

      <!-- Mutfak -->
      <RouterLink v-if="live.kitchen" to="/settings/mutfak-ekrani" class="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow">
        <div class="text-[12.5px] font-medium text-muted">Mutfak</div>
        <div class="text-[20px] font-semibold mt-1"
             :class="live.kitchen.waiting ? 'text-primary' : 'text-success'">
          {{ live.kitchen.waiting ? `${live.kitchen.waiting} sipariş hazırlanıyor` : 'Bekleyen sipariş yok' }}
        </div>
        <div v-if="live.kitchen.ready" class="text-[12.5px] text-muted mt-1">
          <span class="font-semibold text-success">{{ live.kitchen.ready }}</span> sipariş hazır, servis bekliyor
        </div>
        <div v-if="live.kitchen.oldestWaitingAt" class="text-[12.5px] mt-0.5"
             :class="minutesSince(live.kitchen.oldestWaitingAt) >= 20 ? 'text-danger font-medium' : 'text-muted'">
          En uzun bekleyen: {{ duration(live.kitchen.oldestWaitingAt) }}
        </div>
      </RouterLink>

      <!-- Rezervasyonlar -->
      <RouterLink v-if="live.reservations" to="/reservations" class="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow">
        <div class="text-[12.5px] font-medium text-muted">Rezervasyonlar <span class="font-normal">· bugün ve önümüzdeki 12 saat</span></div>
        <div class="text-[20px] font-semibold text-primary mt-1">
          {{ live.reservations.count ? `${live.reservations.count} rezervasyon` : 'Rezervasyon yok' }}
        </div>
        <div v-if="live.reservations.count" class="text-[12.5px] text-muted mt-1">{{ live.reservations.guests }} kişi</div>
        <ul v-if="live.reservations.upcoming?.length" class="mt-2 space-y-1">
          <li v-for="(r, i) in live.reservations.upcoming" :key="i" class="text-[12.5px] flex gap-2">
            <span class="font-semibold text-primary w-10 flex-shrink-0">{{ clock(r.startsAt) }}</span>
            <span class="truncate text-muted">{{ r.customerName }} · {{ r.guestCount }} kişi{{ r.tableName ? ' · ' + r.tableName : '' }}</span>
          </li>
        </ul>
      </RouterLink>

      <!-- Mesaidekiler -->
      <RouterLink v-if="live.staff" to="/staff" class="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow">
        <div class="text-[12.5px] font-medium text-muted">Mesaide</div>
        <div class="text-[20px] font-semibold text-primary mt-1">
          {{ live.staff.length ? `${live.staff.length} kişi` : 'Kimse yok' }}
        </div>
        <ul v-if="live.staff.length" class="mt-2 space-y-1">
          <li v-for="s in live.staff.slice(0, 4)" :key="s.userName + s.clockIn"
              class="flex justify-between gap-2 text-[12.5px]">
            <span class="truncate text-primary">{{ s.userName }}</span>
            <span class="text-muted flex-shrink-0">giriş {{ clock(s.clockIn) }}</span>
          </li>
          <li v-if="live.staff.length > 4" class="text-[12px] text-muted">+{{ live.staff.length - 4 }} kişi daha</li>
        </ul>
      </RouterLink>

      <!-- Paket servis -->
      <RouterLink v-if="live.delivery" to="/reports/gunluk" class="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow">
        <div class="text-[12.5px] font-medium text-muted">Paket Servis</div>
        <div class="text-[20px] font-semibold text-primary mt-1">
          {{ live.delivery.count ? `${live.delivery.count} paket` : 'Paket yok' }}
        </div>
        <div class="text-[12.5px] text-muted mt-1">
          Son Z'den bu yana <span class="font-semibold text-primary">{{ fmt(live.delivery.total) }}</span>
        </div>
      </RouterLink>

      <!-- Son Z raporu -->
      <RouterLink to="/reports/z-listesi" class="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow">
        <div class="text-[12.5px] font-medium text-muted">Son Z Raporu</div>
        <template v-if="live.lastZ">
          <div class="text-[20px] font-semibold text-primary mt-1">{{ fmt(live.lastZ.grandTotal) }}</div>
          <div class="text-[12.5px] text-muted mt-1">{{ dateTime(live.lastZ.reportDate) }}</div>
          <div v-if="live.lastZ.countedCash != null" class="text-[12.5px] font-medium mt-0.5" :class="diffClass(live.lastZ.cashDifference)">
            {{ diffLabel(live.lastZ.cashDifference) }}
          </div>
          <div v-else class="text-[12.5px] text-muted mt-0.5">Kasa sayımı yapılmadı</div>
        </template>
        <div v-else class="text-[17px] font-semibold text-muted mt-1">Henüz Z alınmadı</div>
      </RouterLink>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import api from '../api/api'

const live = ref(null)
let timer = null

const offlineCount = computed(() => (live.value?.devices || []).filter(d => !d.online).length)
const pendingTotal = computed(() => (live.value?.devices || []).reduce((s, d) => s + (d.pendingCount || 0), 0))

async function load() {
  try { live.value = (await api.getLiveStatus()).data } catch { /* eski API: bölüm görünmez */ }
}

// Sekme arka plandayken boşuna istek atılmasın
function tick() { if (!document.hidden) load() }
function onVisible() { if (!document.hidden) load() }

onMounted(() => {
  load()
  timer = setInterval(tick, 60000)
  document.addEventListener('visibilitychange', onVisible)
})
onUnmounted(() => {
  clearInterval(timer)
  document.removeEventListener('visibilitychange', onVisible)
})

defineExpose({ load })

function fmt(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}
function clock(d) {
  return new Date(d).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}
function dateTime(d) {
  return new Date(d).toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}
function minutesSince(d) {
  return Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 60000))
}
// "1 sa 20 dk"
function duration(d) {
  const m = minutesSince(d)
  if (m < 1) return "1 dk'dan az"
  if (m < 60) return `${m} dk`
  const h = Math.floor(m / 60)
  return m % 60 ? `${h} sa ${m % 60} dk` : `${h} sa`
}
function ago(d) {
  const m = minutesSince(d)
  if (m < 2) return 'şimdi'
  if (m < 60) return `${m} dk önce`
  if (m < 1440) return `${Math.floor(m / 60)} sa önce`
  return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}
function diffLabel(v) {
  const n = v ?? 0
  if (Math.abs(n) < 0.005) return 'Kasa tam'
  return (n < 0 ? 'Kasa açığı ' : 'Kasa fazlası ') + fmt(Math.abs(n))
}
function diffClass(v) {
  const n = v ?? 0
  return Math.abs(n) < 0.005 ? 'text-success' : n < 0 ? 'text-danger' : 'text-warning'
}
</script>
