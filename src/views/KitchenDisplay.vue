<template>
  <!-- Mutfak ekranı: tablet / TV tarayıcısında tam ekran çalışır. Oturum yok;
       adresteki istasyon kodu yetkidir. Koyu tema mutfak ışığında okunaklı. -->
  <div class="kds">
    <!-- Başlat: tarayıcılar dokunuş olmadan ses çalmaya izin vermiyor -->
    <div v-if="!started" class="start">
      <div class="start-box">
        <div class="start-title">{{ data?.station?.name || 'Mutfak Ekranı' }}</div>
        <div class="start-sub">{{ data?.businessName }}</div>
        <div v-if="fatal" class="start-error">{{ fatal }}</div>
        <button v-else class="kb kb-primary kb-xl" @click="start">Ekranı Başlat</button>
        <p class="start-hint">
          Başlatınca ekran tam ekrana geçer, yeni siparişte sesli uyarı verir ve
          ekranın kararmasını engeller.
        </p>
      </div>
    </div>

    <template v-else>
      <!-- Üst çubuk -->
      <header class="bar">
        <div class="bar-title">
          <span class="station">{{ data?.station?.name }}</span>
          <span class="biz">{{ data?.businessName }}</span>
        </div>
        <div class="counts">
          <span class="count c-new">Yeni <b>{{ newTickets.length }}</b></span>
          <span class="count c-prep">Hazırlanıyor <b>{{ prepTickets.length }}</b></span>
          <span class="count c-ready">Hazır <b>{{ readyTickets.length }}</b></span>
        </div>
        <div class="bar-right">
          <span class="clock">{{ clock }}</span>
          <button class="kb kb-ghost" @click="recentOpen = true">Geri Al</button>
          <button class="kb kb-ghost" @click="toggleFullscreen">{{ isFullscreen ? 'Küçült' : 'Tam Ekran' }}</button>
        </div>
      </header>

      <div v-if="offline" class="offline">
        Bağlantı yok — son güncelleme {{ lastOkText }}. Yeni siparişler bağlantı gelince görünecek.
      </div>
      <div v-if="actionError" class="offline">{{ actionError }}</div>

      <div class="layout">
        <!-- Hazırlanacaklar -->
        <div class="board">
          <div v-if="!activeTickets.length" class="empty">
            <div class="empty-title">Bekleyen sipariş yok</div>
            <div class="empty-sub">Yeni sipariş geldiğinde burada görünür ve ses çalar.</div>
          </div>

          <article v-for="t in activeTickets" :key="t.id" class="card"
                   :class="[`age-${ageLevel(t)}`, { 'is-new': t.status === 'New', 'is-void': allCancelled(t) }]">
            <div class="card-head">
              <div class="card-head-row">
                <span class="label">{{ t.label }}</span>
                <span class="timer">{{ elapsed(t.createdAt) }}</span>
              </div>
              <div class="card-head-row sub">
                <span class="meta">
                  <span v-if="t.source === 'Quick'" class="tag tag-quick">Kasa</span>
                  <span v-if="t.isAddition" class="tag tag-add">Ek sipariş</span>
                  <span>{{ t.waiter }}</span>
                </span>
                <span class="state" :class="t.status === 'New' ? 's-new' : 's-prep'">
                  {{ t.status === 'New' ? 'YENİ' : 'HAZIRLANIYOR' }}
                </span>
              </div>
            </div>

            <ul class="items">
              <li v-for="i in t.items" :key="i.id" class="item"
                  :class="{ done: i.isDone, void: i.isCancelled }"
                  @click="toggleItem(t, i)">
                <span class="qty">{{ qty(i.quantity) }}</span>
                <div class="item-body">
                  <div class="name">
                    {{ i.productName }}<span v-if="i.variantName" class="variant"> · {{ i.variantName }}</span>
                    <span v-if="i.isCancelled" class="void-tag">İPTAL</span>
                    <span v-else-if="i.isDone" class="done-tag">bitti</span>
                  </div>
                  <div v-if="i.modifiersText" class="mods">{{ i.modifiersText }}</div>
                  <div v-if="i.note" class="note">{{ i.note }}</div>
                </div>
              </li>
            </ul>

            <div class="card-foot">
              <template v-if="allCancelled(t)">
                <div class="void-banner">Sipariş iptal edildi</div>
                <button class="kb kb-danger kb-block" @click="setStatus(t, 'Cancelled')">Kaldır</button>
              </template>
              <template v-else-if="t.status === 'New'">
                <button class="kb kb-ghost" @click="setStatus(t, 'Ready')">Hazır</button>
                <button class="kb kb-primary kb-grow" @click="setStatus(t, 'Preparing')">Başla</button>
              </template>
              <button v-else class="kb kb-success kb-block" @click="setStatus(t, 'Ready')">Hazır</button>
            </div>
          </article>
        </div>

        <!-- Hazır, servis bekliyor -->
        <aside class="ready">
          <div class="ready-title">Hazır — servis bekliyor</div>
          <div v-if="!readyTickets.length" class="ready-empty">Servis bekleyen yok</div>
          <div v-for="t in readyTickets" :key="t.id" class="ready-card">
            <div class="ready-row">
              <span class="label">{{ t.label }}</span>
              <span class="ready-since">{{ elapsed(t.readyAt) }}</span>
            </div>
            <div class="ready-items">
              {{ t.items.filter(i => !i.isCancelled).map(i => `${qty(i.quantity)} ${i.productName}`).join(', ') }}
            </div>
            <div class="ready-actions">
              <button class="kb kb-ghost kb-sm" @click="setStatus(t, 'Preparing')">Geri</button>
              <button class="kb kb-success kb-sm kb-grow" @click="setStatus(t, 'Served')">Servis Edildi</button>
            </div>
          </div>
        </aside>
      </div>

      <!-- Son kapananlar: yanlışlıkla basılanı geri getir -->
      <div v-if="recentOpen" class="drawer-bg" @click="recentOpen = false">
        <div class="drawer" @click.stop>
          <div class="drawer-head">
            <span>Son kapanan siparişler</span>
            <button class="kb kb-ghost kb-sm" @click="recentOpen = false">Kapat</button>
          </div>
          <div v-if="!data?.recent?.length" class="ready-empty">Son 2 saatte kapanan sipariş yok</div>
          <div v-for="t in data?.recent || []" :key="t.id" class="ready-card">
            <div class="ready-row">
              <span class="label">{{ t.label }}</span>
              <span class="ready-since">
                {{ t.status === 'Served' ? 'Servis' : 'İptal' }} · {{ timeOf(t.servedAt || t.readyAt || t.createdAt) }}
              </span>
            </div>
            <div class="ready-items">
              {{ t.items.map(i => `${qty(i.quantity)} ${i.productName}`).join(', ') }}
            </div>
            <div class="ready-actions">
              <button class="kb kb-primary kb-sm kb-grow"
                      @click="restore(t)">
                {{ t.status === 'Served' ? 'Hazır listesine geri al' : 'Ekrana geri getir' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api/api'

const route = useRoute()
const token = route.params.token

const data       = ref(null)
const started    = ref(false)
const fatal      = ref('')
const offline    = ref(false)
const lastOk     = ref(null)
const actionError = ref('')
const recentOpen = ref(false)
const isFullscreen = ref(false)
const now        = ref(Date.now())
let clockOffset  = 0          // sunucu saati − bu cihazın saati
let pollTimer = null, tickTimer = null, wakeLock = null
const seen = new Set()

// ── Veri ────────────────────────────────────────────────────────────
// Sunucu saatleri saat dilimi eki olmadan "yerel" gelir; karşılaştırma
// aynı biçimde yapılsın diye ekleri atıp yerel saat olarak okuruz.
const parse = v => (v ? new Date(String(v).replace(/(Z|[+-]\d\d:\d\d)$/, '')).getTime() : null)

async function load() {
  try {
    const res = await api.getKitchenDisplay(token)
    const d = res.data
    clockOffset = parse(d.serverTime) - Date.now()

    // İlk yüklemeden sonra gelen her yeni bilet sesli uyarı verir.
    const fresh = d.tickets.filter(t => !seen.has(t.id))
    if (data.value && fresh.some(t => t.status === 'New')) chime()
    d.tickets.forEach(t => seen.add(t.id))

    data.value = d
    offline.value = false
    lastOk.value = Date.now()
    fatal.value = ''
  } catch (e) {
    const status = e.response?.status
    if (status === 404 || status === 403) {
      fatal.value = e.response?.data?.message || 'Ekran bağlantısı geçersiz.'
      started.value = false
    } else {
      offline.value = true
    }
  }
}

const tickets = computed(() => data.value?.tickets ?? [])
const newTickets   = computed(() => tickets.value.filter(t => t.status === 'New'))
const prepTickets  = computed(() => tickets.value.filter(t => t.status === 'Preparing'))
const readyTickets = computed(() => tickets.value.filter(t => t.status === 'Ready')
  .sort((a, b) => parse(a.readyAt) - parse(b.readyAt)))
// En eski sipariş solda
const activeTickets = computed(() => tickets.value
  .filter(t => t.status === 'New' || t.status === 'Preparing')
  .sort((a, b) => parse(a.createdAt) - parse(b.createdAt)))

// ── İşlemler ────────────────────────────────────────────────────────
async function setStatus(t, status) {
  const prev = t.status
  t.status = status          // ekran hemen tepki versin
  actionError.value = ''
  try {
    await api.setKitchenTicketStatus(token, t.id, status)
  } catch (e) {
    t.status = prev
    showActionError(e)
  }
  load()
}

async function toggleItem(t, i) {
  if (i.isCancelled || (t.status !== 'New' && t.status !== 'Preparing')) return
  i.isDone = !i.isDone
  try {
    const { data: updated } = await api.setKitchenItemDone(token, i.id, i.isDone)
    Object.assign(t, updated)
  } catch (e) {
    i.isDone = !i.isDone
    showActionError(e)
  }
}

function restore(t) {
  recentOpen.value = false
  setStatus(t, t.status === 'Served' ? 'Ready' : 'Preparing')
}

function showActionError(e) {
  actionError.value = e.response?.data?.message || 'İşlem kaydedilemedi. Bağlantıyı kontrol edin.'
  setTimeout(() => (actionError.value = ''), 4000)
}

// ── Görünüm yardımcıları ────────────────────────────────────────────
const allCancelled = t => t.items.length > 0 && t.items.every(i => i.isCancelled)

function ageLevel(t) {
  const min = (now.value + clockOffset - parse(t.createdAt)) / 60000
  if (min >= (data.value?.lateMinutes ?? 20)) return 'late'
  if (min >= (data.value?.warnMinutes ?? 10)) return 'warn'
  return 'ok'
}

function elapsed(v) {
  const sec = Math.max(0, Math.floor((now.value + clockOffset - parse(v)) / 1000))
  const m = Math.floor(sec / 60), s = sec % 60
  return m >= 60 ? `${Math.floor(m / 60)} sa ${m % 60} dk` : `${m}:${String(s).padStart(2, '0')}`
}

const qty = q => `${Number(q).toLocaleString('tr-TR', { maximumFractionDigits: 3 })}×`
const timeOf = v => new Date(parse(v)).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
const clock = computed(() => new Date(now.value + clockOffset).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }))
const lastOkText = computed(() => (lastOk.value ? new Date(lastOk.value).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '—'))

// ── Ses, tam ekran, ekranı uyanık tutma ─────────────────────────────
let audio = null
function chime() {
  if (!audio) return
  const t0 = audio.currentTime
  ;[[988, 0, 0.18], [1319, 0.18, 0.45], [988, 0.75, 0.18], [1319, 0.93, 0.55]].forEach(([f, at, dur]) => {
    const o = audio.createOscillator(), g = audio.createGain()
    o.type = 'sine'; o.frequency.value = f
    g.gain.setValueAtTime(0.0001, t0 + at)
    g.gain.exponentialRampToValueAtTime(0.5, t0 + at + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur)
    o.connect(g).connect(audio.destination)
    o.start(t0 + at); o.stop(t0 + at + dur + 0.05)
  })
}

async function keepAwake() {
  try { wakeLock = await navigator.wakeLock?.request('screen') } catch { /* desteklenmiyor */ }
}
function onVisibility() {
  if (document.visibilityState === 'visible' && started.value) { keepAwake(); load() }
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen?.()
  else document.documentElement.requestFullscreen?.().catch(() => {})
}
function onFullscreenChange() { isFullscreen.value = !!document.fullscreenElement }

function start() {
  try {
    audio = new (window.AudioContext || window.webkitAudioContext)()
    audio.resume?.()
  } catch { audio = null }
  started.value = true
  document.documentElement.requestFullscreen?.().catch(() => {})
  keepAwake()
}

onMounted(async () => {
  document.title = 'Mutfak Ekranı'
  await load()
  pollTimer = setInterval(load, 5000)
  tickTimer = setInterval(() => (now.value = Date.now()), 1000)
  document.addEventListener('visibilitychange', onVisibility)
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onUnmounted(() => {
  clearInterval(pollTimer)
  clearInterval(tickTimer)
  document.removeEventListener('visibilitychange', onVisibility)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  try { wakeLock?.release() } catch { /* */ }
  try { audio?.close() } catch { /* */ }
})
</script>

<style scoped>
/* Panelin koyu teması çıplak etiketleri ezdiği için yalnızca kendi class
   adlarımız kullanılır. */
.kds {
  --bg: #0B1220; --panel: #111A2E; --card: #16213A; --line: #24304A;
  --text: #F1F5F9; --muted: #94A3B8;
  --blue: #3B82F6; --green: #16A34A; --amber: #F59E0B; --red: #EF4444;
  position: fixed; inset: 0; overflow: hidden;
  background: var(--bg); color: var(--text);
  font-family: Inter, system-ui, sans-serif;
  display: flex; flex-direction: column;
  -webkit-user-select: none; user-select: none;
}

/* Başlat */
.start { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; }
.start-box { text-align: center; max-width: 440px; }
.start-title { font-size: 34px; font-weight: 800; }
.start-sub { color: var(--muted); margin-top: 4px; min-height: 20px; }
.start-error {
  margin-top: 28px; padding: 16px 18px; border-radius: 14px;
  background: rgba(239,68,68,.12); color: #FCA5A5; font-weight: 600; line-height: 1.5;
}
.start .kb-xl { margin-top: 28px; }
.start-hint { color: var(--muted); font-size: 14px; margin-top: 18px; line-height: 1.5; }

/* Butonlar */
.kb {
  border: none; border-radius: 12px; font-weight: 700; cursor: pointer;
  height: 48px; padding: 0 18px; font-size: 16px; color: white;
  transition: filter .1s ease, transform .05s ease;
}
.kb:active { transform: scale(.98); filter: brightness(.9); }
.kb-primary { background: var(--blue); }
.kb-success { background: var(--green); }
.kb-danger  { background: var(--red); }
.kb-ghost   { background: #1E293B; color: var(--text); }
.kb-sm      { height: 40px; font-size: 14px; padding: 0 14px; }
.kb-xl      { height: 64px; font-size: 20px; padding: 0 40px; border-radius: 16px; }
.kb-block   { width: 100%; }
.kb-grow    { flex: 1; }

/* Üst çubuk */
.bar {
  display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
  padding: 12px 20px; background: var(--panel); border-bottom: 1px solid var(--line);
}
.bar-title { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
.station { font-size: 24px; font-weight: 800; }
.biz { color: var(--muted); font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.counts { display: flex; gap: 8px; flex-wrap: wrap; }
.count { padding: 6px 12px; border-radius: 999px; font-size: 14px; font-weight: 600; background: #1E293B; }
.count b { margin-left: 4px; font-size: 16px; }
.c-new b { color: #93C5FD; } .c-prep b { color: #FCD34D; } .c-ready b { color: #86EFAC; }
.bar-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
.clock { font-size: 26px; font-weight: 800; font-variant-numeric: tabular-nums; margin-right: 6px; }

.offline { background: #7F1D1D; color: #FEE2E2; padding: 10px 20px; font-weight: 600; font-size: 15px; }

/* Yerleşim */
.layout { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 340px; }
.board {
  overflow-y: auto; padding: 16px;
  display: grid; gap: 14px; align-content: start;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
}
.empty { grid-column: 1 / -1; text-align: center; padding: 80px 20px; }
.empty-title { font-size: 26px; font-weight: 800; }
.empty-sub { color: var(--muted); margin-top: 8px; font-size: 16px; }

/* Bilet kartı */
.card {
  background: var(--card); border-radius: 16px; overflow: hidden;
  display: flex; flex-direction: column; border: 2px solid transparent;
}
.card.is-new { border-color: var(--blue); }
.card-head { padding: 12px 14px; background: #1E293B; }
.card.age-warn .card-head { background: #78350F; }
.card.age-late .card-head { background: #991B1B; }
.card.age-late { border-color: var(--red); animation: late 1.6s ease-in-out infinite; }
@keyframes late { 50% { border-color: transparent; } }
.card-head-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.card-head-row.sub { margin-top: 4px; font-size: 13px; color: #CBD5E1; }
.label { font-size: 22px; font-weight: 800; line-height: 1.15; }
.timer { font-size: 22px; font-weight: 800; font-variant-numeric: tabular-nums; }
.meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; min-width: 0; }
.tag { padding: 1px 8px; border-radius: 6px; font-weight: 700; font-size: 12px; }
.tag-quick { background: #4C1D95; color: #DDD6FE; }
.tag-add   { background: #0F766E; color: #CCFBF1; }
.state { font-size: 11px; font-weight: 800; letter-spacing: .06em; padding: 2px 8px; border-radius: 6px; white-space: nowrap; }
.s-new  { background: var(--blue); color: white; }
.s-prep { background: #A16207; color: #FEF9C3; }

.items { list-style: none; margin: 0; padding: 6px 0; flex: 1; }
.item { display: flex; gap: 10px; padding: 9px 14px; cursor: pointer; border-bottom: 1px solid var(--line); }
.item:last-child { border-bottom: none; }
.qty { font-size: 20px; font-weight: 800; min-width: 38px; color: #FDE68A; }
.item-body { flex: 1; min-width: 0; }
.name { font-size: 18px; font-weight: 700; line-height: 1.25; }
.variant { color: #93C5FD; }
.mods { margin-top: 3px; font-size: 15px; font-weight: 600; color: #FCD34D; }
.note {
  margin-top: 4px; font-size: 15px; font-weight: 700; color: #0B1220;
  background: #FDE68A; border-radius: 6px; padding: 2px 8px; display: inline-block;
}
.item.done .name, .item.done .qty { color: var(--muted); text-decoration: line-through; }
.item.done .mods, .item.done .note { opacity: .5; }
.done-tag { margin-left: 8px; font-size: 12px; font-weight: 700; color: #86EFAC; text-decoration: none; display: inline-block; }
.item.void .name, .item.void .qty, .item.void .mods { color: #FCA5A5; text-decoration: line-through; }
.void-tag { margin-left: 8px; font-size: 12px; font-weight: 800; color: white; background: var(--red); padding: 1px 7px; border-radius: 6px; display: inline-block; }

.card-foot { display: flex; gap: 8px; padding: 12px 14px; flex-wrap: wrap; }
.card.is-void { border-color: var(--red); }
.void-banner { width: 100%; text-align: center; font-weight: 800; color: #FCA5A5; padding-bottom: 4px; }

/* Hazır sütunu */
.ready { background: var(--panel); border-left: 1px solid var(--line); overflow-y: auto; padding: 16px; }
.ready-title { font-size: 15px; font-weight: 800; color: #86EFAC; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 12px; }
.ready-empty { color: var(--muted); font-size: 14px; padding: 12px 0; }
.ready-card { background: #14301F; border: 1px solid #166534; border-radius: 14px; padding: 12px; margin-bottom: 10px; }
.ready-row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.ready-row .label { font-size: 19px; }
.ready-since { color: #86EFAC; font-weight: 700; font-variant-numeric: tabular-nums; font-size: 14px; white-space: nowrap; }
.ready-items { color: #CBD5E1; font-size: 14px; margin-top: 4px; line-height: 1.4; }
.ready-actions { display: flex; gap: 8px; margin-top: 10px; }

/* Geri al çekmecesi */
.drawer-bg { position: fixed; inset: 0; background: rgba(0,0,0,.55); display: flex; justify-content: flex-end; z-index: 20; }
.drawer { width: min(420px, 100%); height: 100%; background: var(--panel); padding: 16px; overflow-y: auto; }
.drawer .ready-card { background: var(--card); border-color: var(--line); }
.drawer-head { display: flex; justify-content: space-between; align-items: center; font-size: 18px; font-weight: 800; margin-bottom: 14px; }

/* Dikey tablet: hazır sütunu alta iner */
@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; grid-template-rows: 1fr auto; }
  .ready { border-left: none; border-top: 1px solid var(--line); max-height: 34vh; }
  .clock { font-size: 20px; }
}
</style>
