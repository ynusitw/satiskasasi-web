<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="open"
           class="fixed inset-0 z-[200] flex items-center justify-center p-4">

        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"
             @click="$emit('update:open', false)"/>

        <!-- Panel -->
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl
                    max-h-[88vh] flex flex-col overflow-hidden">

          <!-- Başlık -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0
                           002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0
                           001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0
                           00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0
                           00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0
                           00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0
                           00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0
                           001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07
                           2.572-1.065z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <div>
                <h2 class="font-bold text-base text-primary leading-tight">Sistem Ayarları</h2>
                <p class="text-xs text-muted">Tercihler, güvenlik ve destek</p>
              </div>
            </div>
            <button @click="$emit('update:open', false)"
                    class="p-2 rounded-xl hover:bg-gray-100 text-muted hover:text-primary transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Gövde -->
          <div class="flex flex-1 min-h-0">

            <!-- Sol sekme navigasyonu -->
            <nav class="w-44 bg-gray-50 border-r border-gray-100 p-3 flex flex-col gap-1 flex-shrink-0">
              <button v-for="tab in tabs" :key="tab.id"
                      @click="activeTab = tab.id"
                      class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm
                             font-medium transition-all text-left w-full"
                      :class="activeTab === tab.id
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-muted hover:text-primary hover:bg-white'">
                <component :is="tab.icon" class="w-4 h-4 flex-shrink-0"/>
                {{ tab.label }}
              </button>
            </nav>

            <!-- Sağ içerik -->
            <div class="flex-1 overflow-y-auto p-6">

              <!-- ══════════════ GÖRÜNÜM ══════════════ -->
              <section v-if="activeTab === 'ui'">
                <SectionHeader title="Görünüm ve Tema"
                               desc="Aydınlık, karanlık ya da sisteminizin otomatik temasını seçin."/>

                <div class="grid grid-cols-3 gap-3 mb-6">
                  <button v-for="opt in themeOptions" :key="opt.value"
                          @click="settings.theme = opt.value"
                          class="flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all"
                          :class="settings.theme === opt.value
                            ? 'border-accent bg-accent/5 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'">
                    <!-- Önizleme -->
                    <div class="w-20 h-12 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                      <div class="h-3 flex items-center gap-1 px-2" :class="opt.topBg">
                        <div class="w-1.5 h-1.5 rounded-full opacity-60" :class="opt.dotColor"/>
                      </div>
                      <div class="flex-1 h-full p-1.5 gap-1 flex flex-col" :class="opt.bodyBg">
                        <div class="h-1.5 rounded opacity-40" :class="opt.lineBg" style="width:70%"/>
                        <div class="h-1.5 rounded opacity-30" :class="opt.lineBg" style="width:50%"/>
                      </div>
                    </div>
                    <span class="text-xs font-semibold"
                          :class="settings.theme === opt.value ? 'text-accent' : 'text-primary'">
                      {{ opt.label }}
                    </span>
                    <!-- Radio -->
                    <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors"
                         :class="settings.theme === opt.value ? 'border-accent' : 'border-gray-300'">
                      <div v-if="settings.theme === opt.value"
                           class="w-2 h-2 rounded-full bg-accent"/>
                    </div>
                  </button>
                </div>

                <div class="p-3 bg-blue-50 rounded-xl flex gap-2 text-xs text-blue-700">
                  <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span><strong>Sistem Varsayılanı</strong> seçildiğinde bilgisayarınız akşam otomatik karanlık temaya geçerse panel de buna uyum sağlar.</span>
                </div>
              </section>

              <!-- ══════════════ GÜVENLİK ══════════════ -->
              <section v-else-if="activeTab === 'security'">
                <SectionHeader title="Güvenlik ve Oturum Yönetimi"
                               desc="Aktif cihazlarınızı ve güvenlik ayarlarınızı yönetin."/>

                <!-- Aktif Oturumlar -->
                <div class="mb-6">
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="text-sm font-bold text-primary">Aktif Oturumlar</h4>
                    <button @click="logoutAll"
                            :disabled="revoking || sessions.length <= 1"
                            class="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors
                                   disabled:opacity-40 disabled:cursor-not-allowed"
                            :class="revoking
                              ? 'bg-gray-100 text-gray-400'
                              : 'bg-red-50 text-red-600 hover:bg-red-100'">
                      {{ revoking ? 'İşleniyor...' : 'Tüm diğer cihazlardan çıkış yap' }}
                    </button>
                  </div>

                  <!-- Yükleniyor -->
                  <div v-if="sessionsLoading"
                       class="flex items-center justify-center py-8 text-muted text-sm gap-2">
                    <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Oturumlar yükleniyor...
                  </div>

                  <!-- Hata -->
                  <div v-else-if="sessionsError"
                       class="p-3 bg-red-50 rounded-xl text-xs text-red-700">
                    {{ sessionsError }}
                  </div>

                  <!-- Liste -->
                  <div v-else class="space-y-2">
                    <div v-for="s in sessions" :key="s.id"
                         class="flex items-center gap-3 p-3 rounded-xl border border-gray-100
                                bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                           :class="s.isCurrent ? 'bg-accent/15' : 'bg-gray-200'">
                        <component :is="isMobile(s.deviceInfo) ? IconPhone : IconMonitor"
                                   class="w-5 h-5"
                                   :class="s.isCurrent ? 'text-accent' : 'text-muted'"/>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-semibold text-primary truncate">
                            {{ s.deviceInfo ?? 'Bilinmeyen cihaz' }}
                          </span>
                          <span v-if="s.isCurrent"
                                class="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent font-bold flex-shrink-0">
                            Bu cihaz
                          </span>
                        </div>
                        <div class="text-xs text-muted">
                          {{ s.ipAddress ?? '' }}
                          <span v-if="s.createdAt"> · {{ timeAgo(s.createdAt) }}</span>
                        </div>
                      </div>
                      <div class="w-2 h-2 rounded-full flex-shrink-0"
                           :class="s.isCurrent ? 'bg-success' : 'bg-gray-300'"/>
                    </div>
                    <div v-if="!sessions.length" class="text-sm text-muted text-center py-6">
                      Aktif oturum bulunamadı.
                    </div>
                  </div>
                </div>

                <!-- 2FA -->
                <div class="border border-gray-200 rounded-xl p-4">
                  <div class="flex items-start justify-between gap-4">
                    <div>
                      <h4 class="text-sm font-bold text-primary mb-1">İki Adımlı Doğrulama (2FA)</h4>
                      <p class="text-xs text-muted">
                        Google Authenticator veya benzeri bir uygulama ile giriş güvenliğinizi artırın.
                        Finansal verileri korumanın en etkili yolu.
                      </p>
                    </div>
                    <div class="flex-shrink-0">
                      <button @click="show2FAInfo = !show2FAInfo"
                              class="text-xs font-semibold px-3 py-1.5 rounded-lg border
                                     border-gray-200 hover:bg-gray-50 transition-colors text-primary">
                        {{ show2FAInfo ? 'Kapat' : 'Yapılandır' }}
                      </button>
                    </div>
                  </div>
                  <div v-if="show2FAInfo"
                       class="mt-3 p-3 bg-amber-50 rounded-lg text-xs text-amber-800">
                    <strong>Yapım aşamasında:</strong> 2FA kurulumu bir sonraki sürümde aktif olacaktır.
                  </div>
                </div>
              </section>

              <!-- ══════════════ BİLDİRİMLER ══════════════ -->
              <section v-else-if="activeTab === 'notifications'">
                <SectionHeader title="Bildirim Tercihleri"
                               desc="Hangi olaylarda uyarı almak istediğinizi ayarlayın."/>

                <div class="space-y-3 mb-6">
                  <ToggleRow
                    v-model="settings.notifications.zRaporuEmail"
                    title="Z-Raporu E-posta Bildirimi"
                    desc="Gün sonu Z-Raporu alındığında kayıtlı e-posta adresinize özet gönderilir."/>

                  <ToggleRow
                    v-model="settings.notifications.stokUyarisi"
                    title="Kritik Stok Uyarısı"
                    desc="Herhangi bir üründe stok miktarı 5 adedinin altına düştüğünde web panelde bildirim çıkar."/>

                  <ToggleRow
                    v-model="settings.notifications.hataliGirisUyarisi"
                    title="Hatalı Giriş Uyarısı"
                    desc="Hesabınıza hatalı şifre ile giriş denemesi yapıldığında anında bildirim alırsınız."/>
                </div>

                <!-- Son hatalı giriş -->
                <div class="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <h4 class="text-sm font-bold text-primary mb-3">Oturum Güvenlik Logu</h4>

                  <div v-if="attemptsLoading"
                       class="flex items-center gap-2 text-sm text-muted">
                    <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Yükleniyor...
                  </div>

                  <template v-else-if="failedAttempts.length">
                    <div class="space-y-2">
                      <div v-for="(a, i) in failedAttempts.slice(0, 5)" :key="i"
                           class="flex items-center gap-3 text-xs">
                        <span class="w-2 h-2 rounded-full bg-danger flex-shrink-0"/>
                        <span class="text-danger font-semibold">Hatalı giriş</span>
                        <span class="text-muted">{{ a.ipAddress ?? '—' }}</span>
                        <span class="text-muted ml-auto">{{ fmtDate(a.attemptedAt) }}</span>
                      </div>
                    </div>
                    <p v-if="failedAttempts.length > 5"
                       class="text-xs text-muted mt-2">
                      +{{ failedAttempts.length - 5 }} daha fazla deneme
                    </p>
                  </template>

                  <div v-else class="text-sm text-success flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-success flex-shrink-0"/>
                    Son 30 günde hatalı giriş denemesi tespit edilmedi.
                  </div>
                </div>
              </section>

              <!-- ══════════════ DESTEK ══════════════ -->
              <section v-else-if="activeTab === 'support'">
                <SectionHeader title="Destek ve Bakım"
                               desc="Sistem logları, destek talebi ve sürüm notları."/>

                <!-- Aksiyon kartları -->
                <div class="grid grid-cols-2 gap-3 mb-6">
                  <button @click="downloadLogs"
                          class="flex flex-col items-start gap-2 p-4 rounded-xl border-2
                                 border-gray-200 hover:border-accent hover:bg-accent/5
                                 transition-all text-left group">
                    <div class="w-10 h-10 rounded-xl bg-accent/10 group-hover:bg-accent/20
                                flex items-center justify-center transition-colors">
                      <svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                      </svg>
                    </div>
                    <div>
                      <div class="text-sm font-bold text-primary">Sistem Loglarını İndir</div>
                      <div class="text-xs text-muted mt-0.5">JSON formatında uygulama durumu</div>
                    </div>
                  </button>

                  <button @click="openSupportTicket"
                          class="flex flex-col items-start gap-2 p-4 rounded-xl border-2
                                 border-gray-200 hover:border-success hover:bg-success/5
                                 transition-all text-left group">
                    <div class="w-10 h-10 rounded-xl bg-success/10 group-hover:bg-success/20
                                flex items-center justify-center transition-colors">
                      <svg class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172
                                 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9
                                 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
                      </svg>
                    </div>
                    <div>
                      <div class="text-sm font-bold text-primary">Destek Bileti Oluştur</div>
                      <div class="text-xs text-muted mt-0.5">Teknik ekiple iletişime geçin</div>
                    </div>
                  </button>
                </div>

                <!-- Changelog -->
                <div>
                  <h4 class="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                    <svg class="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0
                               00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    Sürüm Notları (Changelog)
                  </h4>
                  <div class="space-y-3">
                    <div v-for="entry in changelog" :key="entry.version"
                         class="relative pl-5 pb-3 border-l-2 border-gray-200 last:pb-0">
                      <div class="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-white border-2"
                           :class="entry.latest ? 'border-accent' : 'border-gray-300'"/>
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-xs font-bold font-mono"
                              :class="entry.latest ? 'text-accent' : 'text-primary'">
                          {{ entry.version }}
                        </span>
                        <span v-if="entry.latest"
                              class="text-xs px-1.5 py-0.5 rounded bg-accent/15 text-accent font-bold">
                          Güncel
                        </span>
                        <span class="text-xs text-muted">{{ entry.date }}</span>
                      </div>
                      <ul class="space-y-0.5">
                        <li v-for="note in entry.notes" :key="note"
                            class="text-xs text-muted flex gap-1.5">
                          <span class="text-accent flex-shrink-0">+</span>{{ note }}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, h, watch } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { useAuthStore }     from '../stores/auth'
import api                  from '../api/api'

const props = defineProps({ open: Boolean })
defineEmits(['update:open'])

const settings = useSettingsStore()
const auth     = useAuthStore()

const activeTab   = ref('ui')
const show2FAInfo = ref(false)

// ─── Güvenlik: aktif oturumlar ───────────────────────────────────────────────
const sessions        = ref([])
const sessionsLoading = ref(false)
const sessionsError   = ref(null)
const revoking        = ref(false)

async function loadSessions() {
  sessionsLoading.value = true
  sessionsError.value   = null
  try {
    const res = await api.getSessions()
    sessions.value = Array.isArray(res.data) ? res.data : (res.data?.sessions ?? [])
  } catch {
    sessionsError.value = 'Oturum bilgileri alınamadı.'
  } finally {
    sessionsLoading.value = false
  }
}

// ─── Bildirimler: hatalı giriş denemeleri ───────────────────────────────────
const failedAttempts  = ref([])
const attemptsLoading = ref(false)

async function loadFailedAttempts() {
  attemptsLoading.value = true
  try {
    const res = await api.getFailedAttempts()
    failedAttempts.value = Array.isArray(res.data)
      ? res.data
      : (res.data?.attempts ?? [])
  } catch {
    failedAttempts.value = []
  } finally {
    attemptsLoading.value = false
  }
}

// Modal açıldığında veya sekme değiştiğinde veri yükle
watch(() => props.open, open => {
  if (open) {
    loadSessions()
    loadFailedAttempts()
  }
})

watch(activeTab, tab => {
  if (tab === 'security'      && !sessions.value.length)      loadSessions()
  if (tab === 'notifications' && !failedAttempts.value.length) loadFailedAttempts()
})

// ─── SVG ikon bileşenleri (inline, CDN yok) ──────────────────────────────────
const IconPalette = { render: () => h('svg', { fill:'none', stroke:'currentColor', viewBox:'0 0 24 24' },
  [h('path', { 'stroke-linecap':'round','stroke-linejoin':'round','stroke-width':'2',
    d:'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01'
  })]
)}

const IconShield = { render: () => h('svg', { fill:'none', stroke:'currentColor', viewBox:'0 0 24 24' },
  [h('path', { 'stroke-linecap':'round','stroke-linejoin':'round','stroke-width':'2',
    d:'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
  })]
)}

const IconBell = { render: () => h('svg', { fill:'none', stroke:'currentColor', viewBox:'0 0 24 24' },
  [h('path', { 'stroke-linecap':'round','stroke-linejoin':'round','stroke-width':'2',
    d:'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
  })]
)}

const IconLifebuoy = { render: () => h('svg', { fill:'none', stroke:'currentColor', viewBox:'0 0 24 24' },
  [h('path', { 'stroke-linecap':'round','stroke-linejoin':'round','stroke-width':'2',
    d:'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z'
  })]
)}

const IconMonitor = { render: () => h('svg', { fill:'none', stroke:'currentColor', viewBox:'0 0 24 24' },
  [h('path', { 'stroke-linecap':'round','stroke-linejoin':'round','stroke-width':'2',
    d:'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
  })]
)}

const IconPhone = { render: () => h('svg', { fill:'none', stroke:'currentColor', viewBox:'0 0 24 24' },
  [h('path', { 'stroke-linecap':'round','stroke-linejoin':'round','stroke-width':'2',
    d:'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z'
  })]
)}

// ─── Veri ────────────────────────────────────────────────────────────────────
const tabs = [
  { id: 'ui',            label: 'Görünüm',    icon: IconPalette  },
  { id: 'security',      label: 'Güvenlik',   icon: IconShield   },
  { id: 'notifications', label: 'Bildirimler',icon: IconBell     },
  { id: 'support',       label: 'Destek',     icon: IconLifebuoy },
]

const themeOptions = [
  {
    value: 'light', label: 'Açık Tema',
    topBg: 'bg-gray-200', bodyBg: 'bg-white', lineBg: 'bg-gray-400', dotColor: 'bg-gray-500',
  },
  {
    value: 'dark', label: 'Koyu Tema',
    topBg: 'bg-gray-800', bodyBg: 'bg-gray-900', lineBg: 'bg-gray-500', dotColor: 'bg-gray-400',
  },
  {
    value: 'system', label: 'Sistem',
    topBg: 'bg-gradient-to-r from-gray-800 to-gray-200',
    bodyBg: 'bg-gradient-to-r from-gray-900 to-white',
    lineBg: 'bg-gray-500', dotColor: 'bg-gray-500',
  },
]

const changelog = [
  {
    version: 'v1.5.0', date: '05 Ağu 2026', latest: true,
    notes: [
      'Kasa Yapılandırma menüsü (6 alt sekme) eklendi',
      'Sistem Ayarları pop-up paneli eklendi',
      'Tema seçimi (Açık / Koyu / Sistem) desteği',
    ],
  },
  {
    version: 'v1.4.0', date: '04 Ağu 2026', latest: false,
    notes: [
      'Günlük Ciro\'ya kasiyer ve müşteri detayı',
      'Satış detayında ürün tablosu genişletildi',
    ],
  },
  {
    version: 'v1.3.0', date: '03 Ağu 2026', latest: false,
    notes: [
      'Cari verilerinde localStorage kalıcılığı',
      'Cari modülü canlı bakiye hesaplama',
    ],
  },
  {
    version: 'v1.2.0', date: '02 Ağu 2026', latest: false,
    notes: [
      'Ürün görseli yükleme (192×192 canvas crop)',
      'Fatura kalemleri (ERP tarzı satır ekleme)',
    ],
  },
  {
    version: 'v1.0.0', date: '01 Ağu 2026', latest: false,
    notes: [
      'Cari Kartlar, Faturalar, Kasa İşlemleri, Ekstre',
      'Günlük Ciro, Z-Listesi, Kasa Defteri raporları',
    ],
  },
]

// ─── Aksiyonlar ──────────────────────────────────────────────────────────────
function isMobile(deviceInfo) {
  const d = (deviceInfo ?? '').toLowerCase()
  return d.includes('iphone') || d.includes('android') || d.includes('mobile') || d.includes('ipad')
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 1)   return 'Az önce'
  if (mins < 60)  return `${mins} dakika önce`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} saat önce`
  const days  = Math.floor(hours / 24)
  return `${days} gün önce`
}

function fmtDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

async function logoutAll() {
  if (!confirm('Diğer tüm cihazlardaki oturumları kapatmak istediğinize emin misiniz?')) return
  revoking.value = true
  try {
    await api.revokeAllSessions()
    await loadSessions()
  } catch {
    alert('İşlem sırasında hata oluştu.')
  } finally {
    revoking.value = false
  }
}

function downloadLogs() {
  const payload = {
    timestamp:   new Date().toISOString(),
    appVersion:  'v1.5.0',
    userAgent:   navigator.userAgent,
    tenant:      auth.tenantName ?? 'bilinmiyor',
    user:        auth.username   ?? 'bilinmiyor',
    localStorage: Object.fromEntries(
      Object.keys(localStorage).map(k => {
        try { return [k, JSON.parse(localStorage.getItem(k))] }
        catch { return [k, localStorage.getItem(k)] }
      })
    ),
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `satiskasasi-log-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function openSupportTicket() {
  const subject = encodeURIComponent('SatışKasası Destek Talebi')
  const body    = encodeURIComponent(
    `Kullanıcı: ${auth.username ?? ''}\nFirma: ${auth.tenantName ?? ''}\nSürüm: v1.5.0\n\nSorun:\n`
  )
  window.location.href = `mailto:destek@satiskasasi.com?subject=${subject}&body=${body}`
}
</script>

<!-- Alt bileşenler -->
<script>
// SectionHeader yardımcı bileşeni
export const SectionHeader = {
  props: ['title', 'desc'],
  template: `
    <div class="mb-5">
      <h3 class="font-bold text-primary mb-1">{{ title }}</h3>
      <p class="text-sm text-muted">{{ desc }}</p>
      <div class="mt-4 border-t border-gray-100"/>
    </div>
  `
}

// ToggleRow yardımcı bileşeni
export const ToggleRow = {
  props: ['modelValue', 'title', 'desc'],
  emits: ['update:modelValue'],
  template: `
    <div class="flex items-start justify-between gap-4 p-4 rounded-xl border border-gray-100
                bg-gray-50 hover:bg-gray-100 transition-colors">
      <div>
        <div class="text-sm font-semibold text-primary">{{ title }}</div>
        <div class="text-xs text-muted mt-0.5">{{ desc }}</div>
      </div>
      <button @click="$emit('update:modelValue', !modelValue)"
              class="relative inline-flex h-6 w-11 items-center rounded-full
                     transition-colors duration-200 ease-in-out flex-shrink-0 mt-0.5"
              :class="modelValue ? 'bg-accent' : 'bg-gray-300'">
        <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow
                     transition-transform duration-200"
              :class="modelValue ? 'translate-x-6' : 'translate-x-1'"/>
      </button>
    </div>
  `
}
</script>

<style scoped>
.modal-fade-enter-active { transition: opacity 0.2s ease; }
.modal-fade-leave-active { transition: opacity 0.15s ease; }
.modal-fade-enter-from,
.modal-fade-leave-to    { opacity: 0; }

.modal-fade-enter-active .relative,
.modal-fade-leave-active .relative {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-fade-enter-from .relative { transform: translateY(-12px); opacity: 0; }
.modal-fade-leave-to  .relative  { transform: translateY(-8px);  opacity: 0; }
</style>
