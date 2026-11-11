<template>
  <!-- Telefon bildirimleri (Web Push): bu cihazı aç/kapat, tür seçimi, deneme, kayıtlı cihazlar -->
  <section class="bg-white rounded-2xl shadow-sm p-5 sm:p-6 mb-6" aria-labelledby="push-title">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0 flex-1">
        <h2 id="push-title" class="section-title">Telefon Bildirimleri</h2>
        <p class="text-xs text-muted mt-1 max-w-xl leading-relaxed">
          Kasa farkı, eksik satış, stok ve güvenlik uyarıları panel kapalıyken de bu telefona / bilgisayara gelir.
          Bildirime dokununca ilgili sayfa açılır.
        </p>
      </div>
      <div v-if="ready && cfg.enabled && supported && !iosNeedsInstall" class="flex flex-wrap gap-2">
        <button v-if="!thisDevice" class="btn-primary" :disabled="busy" @click="enable">
          {{ busy ? 'Açılıyor…' : 'Bu cihaza bildirim gönder' }}
        </button>
        <template v-else>
          <button class="btn-secondary" :disabled="busy" @click="test">{{ testing ? 'Gönderiliyor…' : 'Deneme bildirimi gönder' }}</button>
          <button class="btn-ghost text-danger" :disabled="busy" @click="disable">Bu cihazda kapat</button>
        </template>
      </div>
    </div>

    <p v-if="msg" class="mt-3 text-sm rounded-xl px-3 py-2" :class="msgOk ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'" role="status">{{ msg }}</p>

    <!-- Durum / yönerge -->
    <div v-if="ready" class="mt-4">
      <p v-if="!cfg.enabled" class="text-sm text-muted">Telefon bildirimleri bu sunucuda henüz açılmadı.</p>
      <p v-else-if="!supported && !isIosDevice" class="text-sm text-muted">
        Bu tarayıcı bildirimleri desteklemiyor. Telefonda Chrome / Safari, bilgisayarda Chrome / Edge kullanın.
      </p>
      <div v-else-if="iosNeedsInstall" class="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
        <p class="font-semibold">iPhone'da bildirim için paneli ana ekrana ekleyin:</p>
        <ol class="list-decimal ml-5 mt-1.5 space-y-0.5">
          <li>Safari'de alttaki <b>Paylaş</b> düğmesine dokunun (yukarı ok olan kare).</li>
          <li><b>Ana Ekrana Ekle</b>'yi seçin, sonra <b>Ekle</b>.</li>
          <li>Ana ekrandaki <b>YenPOS</b> simgesinden açıp bu sayfaya gelin ve "Bu cihaza bildirim gönder"e dokunun.</li>
        </ol>
        <p class="text-xs mt-2 opacity-80">iOS 16.4 ve sonrası gerekir.</p>
      </div>
      <p v-else-if="permission === 'denied'" class="text-sm text-amber-700">
        Bu tarayıcıda bildirim izni kapatılmış. Adres çubuğundaki kilit simgesinden (ya da telefonun ayarlarından)
        bu site için bildirimlere izin verip sayfayı yenileyin.
      </p>
      <p v-else-if="thisDevice" class="text-sm text-green-700 font-semibold">✓ Bu cihaz bildirim alıyor.</p>
    </div>

    <!-- Kayıtlı cihazlar ve tür seçimi -->
    <div v-if="devices.length" class="mt-5 border-t border-gray-100 pt-4">
      <p class="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">Bildirim alan cihazlar</p>
      <ul class="flex flex-col gap-3">
        <li v-for="d in devices" :key="d.id" class="rounded-xl border border-gray-100 p-3">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span class="font-semibold text-primary text-sm">{{ d.deviceName || 'Cihaz' }}</span>
            <span v-if="d.endpoint === thisEndpoint" class="chip-success">Bu cihaz</span>
            <span class="text-xs text-muted">{{ d.userName }} · {{ since(d.createdAt) }}</span>
            <button v-if="d.endpoint !== thisEndpoint" class="ml-auto text-xs font-semibold text-danger hover:underline" @click="remove(d)">Kaldır</button>
          </div>
          <div class="flex flex-wrap gap-1.5 mt-2.5" role="group" :aria-label="`${d.deviceName} için bildirim türleri`">
            <label v-for="t in cfg.types" :key="t"
                   class="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-xs font-semibold cursor-pointer select-none"
                   :class="d.types.includes(t) ? 'border-accent bg-blue-50 text-accent' : 'border-gray-200 text-muted'">
              <input type="checkbox" class="sr-only" :checked="d.types.includes(t)" @change="toggleType(d, t)"/>
              {{ LABELS[t] || t }}
            </label>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '../api/api'
import { uiConfirm } from '../utils/dialog'
import { pushSupported, isIos, isStandalone, currentSubscription, enablePush, disablePush } from '../utils/push'

const LABELS = {
  CashDifference: 'Kasa farkı', MissingSale: 'Eksik satış', ZReport: 'Z raporu',
  LowStock: 'Kritik stok', FailedLogin: 'Hatalı giriş', Support: 'Destek yanıtı', DataReset: 'Veri sıfırlama',
}

const ready = ref(false)
const cfg = ref({ enabled: false, publicKey: null, types: [] })
const devices = ref([])
const thisEndpoint = ref('')
const busy = ref(false)
const testing = ref(false)
const msg = ref('')
const msgOk = ref(true)
const supported = pushSupported()
const isIosDevice = isIos()
const permission = ref(typeof Notification !== 'undefined' ? Notification.permission : 'default')

const thisDevice = computed(() => !!thisEndpoint.value && devices.value.some(d => d.endpoint === thisEndpoint.value))
// iPhone'da Safari sekmesinde bildirim yok; ana ekrana eklenmiş uygulamada var
const iosNeedsInstall = computed(() => isIosDevice && (!isStandalone() || !supported))

const say = (text, ok = true) => { msg.value = text; msgOk.value = ok }
const since = v => new Date(v).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

async function load() {
  try {
    cfg.value = (await api.pushConfig()).data
    devices.value = (await api.pushDevices()).data
    thisEndpoint.value = (await currentSubscription())?.endpoint || ''
  } catch { /* kart sessizce boş kalır */ }
  ready.value = true
}

async function enable() {
  busy.value = true
  say('')
  try {
    thisEndpoint.value = await enablePush(cfg.value.publicKey)
    devices.value = (await api.pushDevices()).data
    say('Bu cihaz bildirim almaya başladı. "Deneme bildirimi gönder" ile hemen deneyebilirsiniz.')
  } catch (e) {
    permission.value = typeof Notification !== 'undefined' ? Notification.permission : 'default'
    say(e.message === 'denied' ? 'Bildirim izni verilmedi.'
      : e.message === 'dismissed' ? 'İzin penceresi kapatıldı; yeniden deneyin.'
      : e.response?.data?.message || 'Bildirimler açılamadı. Sayfayı yenileyip tekrar deneyin.', false)
  } finally { busy.value = false }
}

async function disable() {
  busy.value = true
  try {
    await disablePush()
    thisEndpoint.value = ''
    devices.value = (await api.pushDevices()).data
    say('Bu cihazda bildirimler kapatıldı.')
  } catch { say('Kapatılamadı.', false) } finally { busy.value = false }
}

async function test() {
  testing.value = true
  say('')
  try {
    const { data } = await api.pushTest()
    say(data.sent ? `Deneme bildirimi ${data.sent} cihaza gönderildi; birkaç saniye içinde gelir.` : 'Bildirim gönderilemedi; cihazı kapatıp yeniden açmayı deneyin.', !!data.sent)
  } catch (e) { say(e.response?.data?.message || 'Gönderilemedi.', false) } finally { testing.value = false }
}

async function toggleType(d, t) {
  const next = d.types.includes(t) ? d.types.filter(x => x !== t) : [...d.types, t]
  const prev = d.types
  d.types = next
  try { await api.pushSetTypes(d.id, next) } catch { d.types = prev; say('Kaydedilemedi.', false) }
}

async function remove(d) {
  if (!await uiConfirm(`"${d.deviceName}" artık bildirim almasın mı?`)) return
  try { await api.pushRemoveDevice(d.id); devices.value = devices.value.filter(x => x.id !== d.id) } catch { say('Kaldırılamadı.', false) }
}

onMounted(load)
</script>
