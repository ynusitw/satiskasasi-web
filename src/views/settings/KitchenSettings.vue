<template>
  <div class="p-8 max-w-6xl">
    <div class="mb-6">
      <h1 class="page-title">Mutfak Ekranı</h1>
      <p class="page-subtitle">
        Masaya eklenen ürünler ve hızlı satışlar mutfak / bar ekranına düşer. Aşçı
        "Başla" ve "Hazır" der; hazır olunca kasada bildirim çıkar.
      </p>
    </div>

    <div v-if="loading" class="text-muted">Yükleniyor...</div>

    <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
      <!-- ── İstasyonlar ─────────────────────────────────────────────── -->
      <div class="xl:col-span-2 bg-white rounded-2xl shadow-sm p-6">
        <div class="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 class="section-title">İstasyonlar</h2>
            <p class="text-xs text-muted mt-1 max-w-2xl">
              Her istasyonun kendi ekran bağlantısı vardır. Bağlantıyı mutfaktaki tablette ya da
              TV'ye bağlı bilgisayarda açın (veya QR kodu tabletle okutun); oturum açmak gerekmez.
            </p>
          </div>
        </div>

        <div v-if="!stations.length" class="text-sm text-muted border border-dashed border-gray-200 rounded-xl p-5 mb-4">
          Henüz istasyon yok. İlk istasyonu eklediğinizde <strong>tüm kategoriler</strong> ona
          bağlanır; mutfağa gitmeyecek kategorileri (ör. hazır içecekler) aşağıdan çıkarabilirsiniz.
        </div>

        <div class="space-y-3 mb-5">
          <div v-for="s in stations" :key="s.id"
               class="border border-gray-100 rounded-xl p-4 flex flex-col lg:flex-row gap-5">
            <img :src="qrImage(s)" :alt="s.name" width="132" height="132"
                 class="rounded-lg border border-gray-100 flex-shrink-0 self-start"/>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 flex-wrap">
                <input v-if="editingId === s.id" v-model="editName" maxlength="40"
                       class="px-3 border border-gray-200 rounded-lg text-sm h-9 bg-white w-48"
                       @keyup.enter="saveName(s)" @keyup.esc="editingId = null"/>
                <div v-else class="text-lg font-bold text-primary">{{ s.name }}</div>

                <template v-if="auth.isAdmin">
                  <button v-if="editingId === s.id" class="btn-primary btn-sm" @click="saveName(s)">Kaydet</button>
                  <button v-else class="text-xs font-bold text-accent hover:underline"
                          @click="editingId = s.id; editName = s.name">Adı değiştir</button>
                </template>
              </div>

              <div class="flex flex-wrap gap-2 mt-2">
                <span class="chip-neutral">{{ s.categoryCount }} kategori</span>
                <span :class="s.openCount ? 'chip-accent' : 'chip-neutral'">{{ s.openCount }} açık sipariş</span>
                <span class="chip-neutral">Bugün {{ s.todayCount }} sipariş</span>
                <span v-if="s.avgPrepMinutes != null" class="chip-success">
                  Ort. hazırlama {{ fmtMin(s.avgPrepMinutes) }}
                </span>
              </div>

              <label class="field-label mt-4 block">Ekran bağlantısı</label>
              <div class="flex gap-2">
                <input :value="displayUrl(s)" readonly
                       class="flex-1 min-w-0 px-3 border border-gray-200 rounded-lg text-[13px] bg-gray-50 text-muted h-10"/>
                <button class="btn-secondary whitespace-nowrap" @click="copy(s)">
                  {{ copiedId === s.id ? 'Kopyalandı' : 'Kopyala' }}
                </button>
                <a :href="displayUrl(s)" target="_blank" class="btn-primary whitespace-nowrap">Aç</a>
              </div>

              <div v-if="auth.isAdmin" class="flex gap-4 mt-3">
                <button class="text-xs font-bold text-muted hover:text-danger" @click="regenerate(s)">
                  Bağlantıyı Yenile
                </button>
                <button class="text-xs font-bold text-muted hover:text-danger" @click="remove(s)">
                  İstasyonu Sil
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="auth.isAdmin" class="flex gap-2 max-w-md">
          <input v-model="newName" maxlength="40" placeholder="Ör. Mutfak, Bar, Tatlı"
                 class="flex-1 px-3 border border-gray-200 rounded-lg text-sm h-10 bg-white"
                 @keyup.enter="addStation"/>
          <button class="btn-primary whitespace-nowrap" :disabled="!newName.trim() || busy" @click="addStation">
            İstasyon Ekle
          </button>
        </div>
        <div v-if="stationError" class="text-xs text-danger mt-2">{{ stationError }}</div>
      </div>

      <!-- ── Kategori → istasyon ─────────────────────────────────────── -->
      <div class="bg-white rounded-2xl shadow-sm p-6">
        <h2 class="section-title">Hangi ürün nereye düşer?</h2>
        <p class="text-xs text-muted mt-1 mb-4">
          Ürünler kategorisine göre istasyona gider. "Mutfağa gitmez" seçilen kategoriler
          (ör. su, kutu içecek) hiçbir ekranda görünmez.
        </p>

        <div v-if="!categories.length" class="text-sm text-muted text-center py-4">Henüz kategori yok</div>
        <div v-else class="border border-gray-100 rounded-xl divide-y divide-gray-50">
          <div v-for="c in categories" :key="c.id" class="flex items-center gap-3 px-3 py-2.5">
            <span class="w-3 h-3 rounded-full flex-shrink-0" :style="{ background: c.colorHex || '#94A3B8' }"></span>
            <span class="flex-1 text-sm font-semibold text-primary truncate">{{ c.name }}</span>
            <select v-model="c.stationId" :disabled="!auth.isAdmin || !stations.length"
                    class="px-2 border border-gray-200 rounded-lg text-sm h-9 bg-white w-44">
              <option :value="null">Mutfağa gitmez</option>
              <option v-for="s in stations" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
        </div>

        <div v-if="auth.isAdmin && categories.length" class="flex items-center justify-end gap-3 mt-4">
          <span class="text-xs" :class="catError ? 'text-danger' : 'text-muted'">
            {{ catError || (catSaved ? 'Kaydedildi' : '') }}
          </span>
          <button class="btn-primary" :disabled="catSaving || !stations.length" @click="saveCategories">
            {{ catSaving ? 'Kaydediliyor...' : 'Atamaları Kaydet' }}
          </button>
        </div>
      </div>

      <!-- ── Süreler + kullanım ──────────────────────────────────────── -->
      <div class="space-y-6">
        <div class="bg-white rounded-2xl shadow-sm p-6">
          <h2 class="section-title">Bekleme uyarısı</h2>
          <p class="text-xs text-muted mt-1 mb-4">
            Sipariş bu sürelerden uzun beklerse ekrandaki kart önce sarı, sonra kırmızı olur.
          </p>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="field-label">Sarı (dakika)</label>
              <input v-model.number="settings.warnMinutes" type="number" min="1" max="120" :disabled="!auth.isAdmin"
                     class="w-full px-3 border border-gray-200 rounded-lg text-sm h-10 bg-white"/>
            </div>
            <div>
              <label class="field-label">Kırmızı (dakika)</label>
              <input v-model.number="settings.lateMinutes" type="number" min="2" max="180" :disabled="!auth.isAdmin"
                     class="w-full px-3 border border-gray-200 rounded-lg text-sm h-10 bg-white"/>
            </div>
          </div>
          <div v-if="auth.isAdmin" class="flex items-center justify-end gap-3 mt-4">
            <span class="text-xs text-muted">{{ setSaved ? 'Kaydedildi' : '' }}</span>
            <button class="btn-primary" @click="saveSettings">Kaydet</button>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm p-6">
          <h2 class="section-title mb-3">Nasıl çalışır?</h2>
          <ol class="text-sm text-muted space-y-2 list-decimal pl-5">
            <li>Mutfaktaki cihazda istasyonun bağlantısını açın ve <strong>Ekranı Başlat</strong>'a dokunun.</li>
            <li>Masaya ürün eklenince (QR menü siparişi onaylanınca da) kart ekrana düşer ve ses çalar. Hızlı satışlar ödeme alınınca "Sipariş #12" olarak düşer.</li>
            <li>Aşçı <strong>Başla</strong>, bitince <strong>Hazır</strong> der. Tek tek ürünlere dokunarak da işaretlenebilir; hepsi bitince sipariş hazır olur.</li>
            <li>Hazır olunca kasada bildirim çıkar ve masa kartında "Hazır" görünür. Garson götürünce kasadan ya da mutfak ekranından <strong>Servis Edildi</strong> denir. Hesap kapanınca hazır siparişler kendiliğinden servis edilmiş sayılır.</li>
            <li>Kasada silinen ürün ekranda "İPTAL" olarak görünür. Mutfak fişi yazıcısı da çalışmaya devam eder; istemezseniz Fiş &amp; Yazıcı Ayarları'ndan kategori yönlendirmesini kaldırın.</li>
          </ol>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { uiConfirm } from '../../utils/dialog'
import { ref, reactive, onMounted } from 'vue'
import api from '../../api/api'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()

const loading    = ref(true)
const stations   = ref([])
const categories = ref([])
const settings   = reactive({ warnMinutes: 10, lateMinutes: 20 })

const newName      = ref('')
const busy         = ref(false)
const stationError = ref('')
const editingId    = ref(null)
const editName     = ref('')
const copiedId     = ref(null)

const catSaving = ref(false)
const catSaved  = ref(false)
const catError  = ref('')
const setSaved  = ref(false)

const displayUrl = s => `${window.location.origin}/mutfak/${s.token}`
const qrImage = s =>
  `https://api.qrserver.com/v1/create-qr-code/?size=264x264&margin=8&data=${encodeURIComponent(displayUrl(s))}`

function fmtMin(v) {
  return `${Number(v).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} dk`
}

async function loadStations() {
  stations.value = (await api.getKitchenStations()).data
}
async function loadCategories() {
  categories.value = (await api.getKitchenCategories()).data
}

async function addStation() {
  const name = newName.value.trim()
  if (!name) return
  busy.value = true
  stationError.value = ''
  try {
    const first = stations.value.length === 0
    await api.createKitchenStation({ name, sortOrder: stations.value.length })
    newName.value = ''
    await loadStations()
    if (first) await loadCategories()   // ilk istasyon tüm kategorileri aldı
  } catch (e) {
    stationError.value = e.response?.data?.message || 'İstasyon eklenemedi.'
  } finally {
    busy.value = false
  }
}

async function saveName(s) {
  const name = editName.value.trim()
  if (!name) return
  try {
    await api.updateKitchenStation(s.id, { name, sortOrder: s.sortOrder })
    s.name = name
    editingId.value = null
  } catch (e) {
    stationError.value = e.response?.data?.message || 'Kaydedilemedi.'
  }
}

async function regenerate(s) {
  if (!await uiConfirm(`${s.name} için yeni bağlantı üretilsin mi?\n\nAçık olan mutfak ekranı çalışmayı bırakır; yeni bağlantıyı o cihazda yeniden açmanız gerekir.`)) return
  try {
    s.token = (await api.regenerateKitchenToken(s.id)).data.token
  } catch (e) {
    stationError.value = e.response?.data?.message || 'Bağlantı yenilenemedi.'
  }
}

async function remove(s) {
  if (!await uiConfirm(`${s.name} istasyonu silinsin mi?\n\nBu istasyona bağlı kategoriler "Mutfağa gitmez" olur ve ekran bağlantısı çalışmayı bırakır. Geçmiş siparişler raporlarda kalır.`)) return
  try {
    await api.deleteKitchenStation(s.id)
    await Promise.all([loadStations(), loadCategories()])
  } catch (e) {
    stationError.value = e.response?.data?.message || 'İstasyon silinemedi.'
  }
}

async function copy(s) {
  try {
    await navigator.clipboard.writeText(displayUrl(s))
    copiedId.value = s.id
    setTimeout(() => (copiedId.value = null), 2000)
  } catch { /* pano izni yok */ }
}

async function saveCategories() {
  catSaving.value = true
  catSaved.value = false
  catError.value = ''
  try {
    await api.saveKitchenCategories(categories.value.map(c => ({ categoryId: c.id, stationId: c.stationId })))
    catSaved.value = true
    setTimeout(() => (catSaved.value = false), 2500)
    await loadStations()
  } catch (e) {
    catError.value = e.response?.data?.message || 'Kaydedilemedi.'
  } finally {
    catSaving.value = false
  }
}

async function saveSettings() {
  const { data } = await api.saveKitchenSettings({ ...settings })
  Object.assign(settings, data)
  setSaved.value = true
  setTimeout(() => (setSaved.value = false), 2500)
}

onMounted(async () => {
  try {
    const [, , s] = await Promise.all([loadStations(), loadCategories(), api.getKitchenSettings()])
    Object.assign(settings, s.data)
  } finally {
    loading.value = false
  }
})
</script>
