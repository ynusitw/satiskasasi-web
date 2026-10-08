<template>
  <!-- Herkese açık dijital menü, yönetici kabuğunun (sidebar, koyu tema vb.)
       tamamen dışında, kendi bağımsız sayfası olarak render edilir. -->
  <RouterView v-if="isMenuRoute"/>

  <div v-else class="flex min-h-screen bg-bg">

    <aside v-if="auth.isLoggedIn && route.path !== '/login'"
           class="sidebar fixed left-0 top-0 h-full w-64 bg-primary text-white flex flex-col z-50">

      <!-- Marka + işletme -->
      <div class="h-16 px-5 flex items-center gap-3 border-b border-white/[0.06] flex-shrink-0">
        <div class="w-8 h-8 rounded-lg bg-accent flex items-center justify-center
                    text-[13px] font-bold tracking-tight shadow-[0_0_0_1px_rgba(255,255,255,0.12)_inset]">
          SK
        </div>
        <div class="min-w-0 leading-tight">
          <div class="text-[14px] font-semibold tracking-tight">SatışKasası</div>
          <div class="text-[12px] text-white/45 truncate">
            {{ auth.isSuperAdmin ? 'Süper Admin' : auth.tenantName }}
          </div>
        </div>
      </div>

      <!-- Menü -->
      <nav class="flex-1 overflow-y-auto px-3 pb-4">
        <div v-for="section in navSections" :key="section.title">
          <div class="px-3 pt-5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/35">
            {{ section.title }}
          </div>

          <template v-for="item in section.items" :key="item.key ?? item.to">
            <!-- Tek bağlantı -->
            <RouterLink v-if="!item.children" :to="item.to"
                        class="nav-item" :class="isExact(item.to) ? 'nav-item-active' : ''">
              <span class="flex-1">{{ item.label }}</span>
              <span v-if="badgeOf(item)"
                    class="min-w-[20px] h-5 px-1.5 rounded-full bg-accent text-white text-[11px] font-semibold
                           flex items-center justify-center">
                {{ badgeOf(item) > 99 ? '99+' : badgeOf(item) }}
              </span>
            </RouterLink>

            <!-- Açılır grup -->
            <div v-else>
              <button @click="open[item.key] = !open[item.key]"
                      class="nav-item w-full"
                      :class="route.path.startsWith(item.prefix) ? 'text-white' : ''">
                <span class="flex-1 text-left">{{ item.label }}</span>
                <svg class="w-3.5 h-3.5 opacity-50 transition-transform duration-200"
                     :class="open[item.key] ? 'rotate-180' : ''"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              <div class="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                   :style="{ maxHeight: open[item.key] ? item.children.length * 40 + 'px' : '0px' }">
                <div class="ml-3 pl-3 border-l border-white/10 my-0.5">
                  <RouterLink v-for="sub in item.children" :key="sub.to" :to="sub.to"
                              class="nav-sub" active-class="nav-sub-active">
                    {{ sub.label }}
                  </RouterLink>
                </div>
              </div>
            </div>
          </template>
        </div>
      </nav>

      <!-- Abonelik (yakında bitiyorsa öne çıkar) -->
      <RouterLink v-if="!auth.isSuperAdmin && auth.tenantExpires" to="/subscription"
                  class="mx-3 mb-2 px-3 py-2.5 rounded-lg flex items-center justify-between gap-2
                         text-[12px] transition-colors"
                  :class="isExpiringSoon
                    ? 'bg-amber-400/10 text-amber-300 hover:bg-amber-400/15'
                    : 'bg-white/[0.04] text-white/55 hover:bg-white/[0.07] hover:text-white/80'">
        <span>{{ isExpiringSoon ? 'Abonelik yakında bitiyor' : 'Abonelik bitişi' }}</span>
        <span class="font-semibold">{{ formatDate(auth.tenantExpires) }}</span>
      </RouterLink>

      <!-- Kullanıcı -->
      <div class="p-3 border-t border-white/[0.06]">
        <div class="flex items-center gap-3 px-2 py-1.5">
          <div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center
                      text-[12px] font-semibold uppercase flex-shrink-0">
            {{ initials }}
          </div>
          <div class="min-w-0 flex-1 leading-tight">
            <div class="text-[13px] font-medium truncate">{{ auth.username }}</div>
            <div class="text-[11.5px] text-white/40 truncate">
              {{ auth.isSuperAdmin ? 'Süper Admin' : (auth.isAdmin ? 'Yönetici' : 'Kullanıcı') }}
            </div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-1.5 mt-2">
          <button @click="settingsOpen = true"
                  class="py-1.5 rounded-md text-[12px] font-medium text-white/60
                         bg-white/[0.04] hover:bg-white/[0.08] hover:text-white">
            Ayarlar
          </button>
          <button @click="logout"
                  class="py-1.5 rounded-md text-[12px] font-medium text-white/60
                         bg-white/[0.04] hover:bg-red-500/15 hover:text-red-300">
            Çıkış Yap
          </button>
        </div>
      </div>
    </aside>

    <!-- Ayarlar Modal -->
    <SettingsModal v-model:open="settingsOpen"/>

    <!-- İçerik -->
    <main :class="auth.isLoggedIn && route.path !== '/login' ? 'ml-64' : ''"
          class="flex-1">
      <!-- Lisansta olmayan bir modüle gidilmek istendi -->
      <div v-if="deniedModule"
           class="mx-8 mt-6 flex items-center justify-between gap-4 rounded-xl
                  border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <span>
          <strong>{{ deniedModule }}</strong> lisansınızda bulunmuyor.
          Bu özelliği kullanmak için yetkilinizle iletişime geçin.
        </span>
        <button @click="dismissDenied"
                class="text-amber-700 hover:text-amber-900 font-semibold">Kapat</button>
      </div>

      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component"/>
        </Transition>
      </RouterView>
    </main>
  </div>

  <!-- Uygulama içi onay / uyarı pencereleri (utils/dialog.js) -->
  <AppDialog/>
</template>

<script setup>
import { computed, ref, reactive, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute }  from 'vue-router'
import { useAuthStore }         from './stores/auth'
import { useSettingsStore }     from './stores/settings'
import { useModulesStore }      from './stores/modules'
import { useNotificationsStore } from './stores/notifications'
import { MODULES }              from './constants/modules'
import SettingsModal            from './components/SettingsModal.vue'
import AppDialog                from './components/AppDialog.vue'
import api                      from './api/api'

const auth     = useAuthStore()
const router   = useRouter()
const route    = useRoute()
const _settings = useSettingsStore()
_settings.init()

const modulesStore = useModulesStore()
const notificationsStore = useNotificationsStore()

// Okunmamış bildirim rozeti dakikada bir tazelenir. Süper yöneticide bildirim
// yok; onun rozeti yanıt bekleyen destek talepleri.
let notifTimer = null
const supportOpen = ref(0)
const resetPending = ref(0)
function pollNotifications() {
  if (auth.isLoggedIn && !auth.isSuperAdmin) notificationsStore.refresh()
  if (auth.isLoggedIn && auth.isSuperAdmin)
    api.getSupportOpenCount().then(r => (supportOpen.value = r.data.count)).catch(() => {})
  if (auth.isLoggedIn && auth.isSuperAdmin)
    api.getDataResetPendingCount().then(r => (resetPending.value = r.data.count)).catch(() => {})
}
const badgeOf = item =>
  item.badge === 'notifications' ? notificationsStore.unread
  : item.badge === 'support' ? supportOpen.value
  : item.badge === 'reset' ? resetPending.value
  : 0

// Sayfa yenilendiğinde modül listesi localStorage'dan anında gelir (menü boş
// görünmesin); ardından sunucudan tazelenir ki yöneticinin yaptığı
// değişiklik yeniden giriş beklemeden yansısın.
onMounted(() => {
  if (auth.isLoggedIn && !auth.isSuperAdmin) modulesStore.load()
  pollNotifications()
  notifTimer = setInterval(pollNotifications, 60_000)

  // API bir isteği "modül yok" diye reddettiyse (api.js yayınlar) liste
  // eskimiştir; tazele ki menü de hemen güncellensin.
  window.addEventListener('module-denied', () => modulesStore.load())
})

onUnmounted(() => clearInterval(notifTimer))

// Giriş yapınca rozet hemen dolsun.
watch(() => auth.isLoggedIn, v => { if (v) pollNotifications() })

// Modülü olmayan bir sayfaya gidilmek istendiğinde yönlendirici panoya
// "?yetkisiz=<kod>" ile döner; kullanıcıya sebebini söyleyelim.
const MODULE_NAMES = {
  [MODULES.QR_MENU]: 'QR Menü',
  [MODULES.TABLES]:  'Masa Yönetimi',
  [MODULES.KITCHEN]: 'Mutfak Ekranı',
  [MODULES.STOCK]:   'Stok Yönetimi',
  [MODULES.CARI]:    'Cari İşlemler',
}
const deniedModule = computed(() => {
  const code = route.query.yetkisiz
  return code ? (MODULE_NAMES[code] ?? code) : null
})
function dismissDenied() {
  const { yetkisiz, ...rest } = route.query
  router.replace({ query: rest })
}

const settingsOpen = ref(false)

// Açılır menü grupları
const open = reactive({ reports: false, cari: false, kasa: false, lisans: false })

watch(() => route.path, path => {
  if (path.startsWith('/reports'))  open.reports = true
  if (path.startsWith('/cari'))     open.cari    = true
  if (path.startsWith('/settings')) open.kasa    = true
  if (path.startsWith('/superadmin/lisans')) open.lisans = true
}, { immediate: true })

// Herkese açık tam sayfa ekranlar (QR menü, mutfak ekranı): panel iskeleti yok
const isMenuRoute      = computed(() => route.path.startsWith('/menu/') || route.path.startsWith('/mutfak/')
                                     || route.path === '/garson')

const lisansSubMenu = [
  { to: '/superadmin/lisans/aktif',      label: 'Aktif Lisanslar'      },
  { to: '/superadmin/lisans/bekleyen',   label: 'Bekleyen Lisanslar'   },
  { to: '/superadmin/lisans/reddedilen', label: 'Reddedilen Lisanslar' },
]

const menuTopAll = [
  { to: '/',            label: 'Genel Bakış'     },
  { to: '/products',    label: 'Ürünler'         },
  { to: '/modifiers',   label: 'Çeşni & Ekstra'  },
  { to: '/campaigns',   label: 'Kampanyalar'     },
  { to: '/reservations', label: 'Rezervasyonlar', module: MODULES.TABLES },
  { to: '/garson',      label: 'Garson Telefonu', module: MODULES.WAITER },
  { to: '/recipes',     label: 'Reçete Merkezi', module: MODULES.STOCK },
  { to: '/ingredients', label: 'Hammaddeler',    module: MODULES.STOCK },
  { to: '/stock-count', label: 'Stok Sayımı',    module: MODULES.STOCK },
  { to: '/purchasing',  label: 'Sipariş Önerisi', module: MODULES.STOCK },
]

const cariSubMenu = [
  { to: '/cari/kartlar',   label: 'Cari Kartlar'               },
  { to: '/cari/faturalar', label: 'Faturalar (Alış/Satış)'     },
  { to: '/cari/kasa',      label: 'Kasa İşlemleri'             },
  { to: '/cari/ekstre',    label: 'Cari Ekstre'                },
]

const reportSubMenu = [
  { to: '/reports/gunluk',    label: 'Günlük Ciro'     },
  { to: '/reports/kasa',      label: 'Kasa Defteri'    },
  { to: '/reports/z-listesi', label: 'Z-Listesi'       },
  { to: '/reports/satis',     label: 'Satış Raporları' },
  { to: '/reports/iptaller',  label: 'İptaller'        },
  { to: '/reports/indirim-ikram', label: 'İndirim & İkram' },
  { to: '/reports/masalar',   label: 'Masalar',         module: MODULES.TABLES },
  { to: '/reports/stoklar',   label: 'Stoklar',         module: MODULES.STOCK  },
  { to: '/reports/karlilik',  label: 'Kârlılık',        module: MODULES.STOCK  },
]

const kasaYapiSubMenu = [
  { to: '/settings/dijital-menu',    label: 'Dijital Menü (QR)',  module: MODULES.QR_MENU },
  { to: '/settings/masa-ayarlari',   label: 'Masa Ayarları',         module: MODULES.TABLES  },
  { to: '/settings/mutfak-ekrani',   label: 'Mutfak Ekranı',         module: MODULES.KITCHEN },
  { to: '/settings/hizli-notlar',    label: 'Hızlı Notlar',          module: MODULES.TABLES  },
  { to: '/settings/receipt',         label: 'Fiş & Yazıcı Ayarları' },
  { to: '/settings/musteri-ekrani',  label: 'Müşteri Ekranı Ayarı'  },
  { to: '/settings/terminal',        label: 'Terminal Ayarları'      },
]

// ── Lisans modülüne göre menü ────────────────────────────────────────────
// Etiketsiz öğeler herkese açık. Süper yönetici bir müşteriye bağlı değil,
// her şeyi görür. (Asıl kilit sunucuda — bu yalnızca menüyü sadeleştirir.)
function allowed(item) {
  return !item.module || auth.isSuperAdmin || modulesStore.has(item.module)
}
// Hammaddeler stok modülüne bağlı; modülü olmayan müşteride menüde yok.
const menuTop = computed(() => menuTopAll.filter(allowed))
const visibleReportSubMenu   = computed(() => reportSubMenu.filter(allowed))
const visibleKasaYapiSubMenu = computed(() => kasaYapiSubMenu.filter(allowed))
const showCari               = computed(() => allowed({ module: MODULES.CARI }))

const menuBottom = [
  { to: '/users', label: 'Kullanıcılar' },
  { to: '/staff', label: 'Personel', module: MODULES.STAFF },
]

// Kenar menüsü bölümleri: tek şablon hem müşteri hem süper admin menüsünü çizer.
const navSections = computed(() => {
  if (auth.isSuperAdmin) {
    return [{
      title: 'Yönetim',
      items: [
        { to: '/superadmin',          label: 'Müşteri Yönetimi' },
        { to: '/superadmin/gelir',    label: 'Gelir Analizi'    },
        { to: '/superadmin/paketler', label: 'Paket Yönetimi'   },
        { key: 'lisans', label: 'Lisans', prefix: '/superadmin/lisans', children: lisansSubMenu },
        { to: '/superadmin/destek',   label: 'Destek Talepleri', badge: 'support' },
        { to: '/superadmin/sifirlama', label: 'Sıfırlama Talepleri', badge: 'reset' },
      ],
    }]
  }

  const [home, ...catalog] = menuTop.value
  const sections = [
    { title: 'Genel', items: [home, { to: '/notifications', label: 'Bildirimler', badge: 'notifications' }] },
    { title: 'Katalog', items: catalog },
    { title: 'İşlemler', items: [
      ...(showCari.value ? [{ key: 'cari', label: 'Cari İşlemler', prefix: '/cari', children: cariSubMenu }] : []),
      { key: 'reports', label: 'Raporlar', prefix: '/reports', children: visibleReportSubMenu.value },
    ] },
    { title: 'Yönetim', items: [
      { key: 'kasa', label: 'Kasa Yapılandırma', prefix: '/settings', children: visibleKasaYapiSubMenu.value },
      ...menuBottom.filter(allowed),
    ] },
  ]
  return sections.filter(sec => sec.items.length)
})

// Tek bağlantılarda tam eşleşme: "/superadmin" alt sayfalarda da yanmasın.
function isExact(to) {
  return to === '/' || to === '/superadmin' ? route.path === to : route.path.startsWith(to)
}

const initials = computed(() =>
  (auth.username || '?').trim().slice(0, 2).toLocaleUpperCase('tr'))

const isExpiringSoon = computed(() => {
  if (!auth.tenantExpires) return false
  const diff = new Date(auth.tenantExpires) - new Date()
  return diff < 7 * 24 * 60 * 60 * 1000 // 7 gün
})

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('tr-TR')
}

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.nav-item {
  @apply flex items-center gap-2 px-3 py-[7px] my-px rounded-md text-[13.5px] font-medium
         text-white/60 hover:text-white hover:bg-white/[0.06];
}
.nav-item-active {
  @apply text-white bg-white/10;
  box-shadow: inset 2px 0 0 theme('colors.accent');
}
.nav-sub {
  @apply block px-3 py-[6px] my-px rounded-md text-[13px] text-white/50 hover:text-white hover:bg-white/[0.05];
}
.nav-sub-active {
  @apply text-white bg-white/[0.08] font-medium;
}
</style>
