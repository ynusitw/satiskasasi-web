<template>
  <div class="flex min-h-screen bg-bg">

    <aside v-if="auth.isLoggedIn && route.path !== '/login' && route.path !== '/register'"
           class="fixed left-0 top-0 h-full w-60 bg-primary text-white
                  flex flex-col z-50 shadow-xl">

      <!-- Logo + Tenant -->
      <div class="px-6 py-5 border-b border-white/10">
        <div class="text-2xl mb-1">🏪</div>
        <div class="flex items-center justify-between gap-1">
          <div class="font-bold text-sm">SatışKasası</div>
          <button @click="settingsOpen = true"
                  title="Sistem Ayarları"
                  class="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10
                         transition-all flex-shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          </button>
        </div>
        <div class="text-white/40 text-xs truncate mt-0.5">
          {{ auth.isSuperAdmin ? 'Süper Admin' : auth.tenantName }}
        </div>
      </div>

      <!-- Menü -->
      <nav class="flex-1 py-3 overflow-y-auto">

        <!-- Süper Admin Menüsü -->
        <template v-if="auth.isSuperAdmin">
          <RouterLink to="/superadmin"
            class="flex items-center gap-3 px-6 py-3 text-sm text-white/70
                   hover:text-white hover:bg-white/8 border-l-4
                   border-transparent transition-all"
            active-class="text-white !bg-white/10 !border-accent">
            <span>👑</span><span>Müşteri Yönetimi</span>
          </RouterLink>
          <RouterLink to="/superadmin/gelir"
            class="flex items-center gap-3 px-6 py-3 text-sm text-white/70
                   hover:text-white hover:bg-white/8 border-l-4
                   border-transparent transition-all"
            active-class="text-white !bg-white/10 !border-accent">
            <span>💰</span><span>Gelir Analizi</span>
          </RouterLink>
          <RouterLink to="/superadmin/paketler"
            class="flex items-center gap-3 px-6 py-3 text-sm text-white/70
                   hover:text-white hover:bg-white/8 border-l-4
                   border-transparent transition-all"
            active-class="text-white !bg-white/10 !border-accent">
            <span>📦</span><span>Paket Yönetimi</span>
          </RouterLink>
        </template>

        <!-- Normal Menü -->
        <template v-else>
          <RouterLink v-for="item in menuTop" :key="item.to" :to="item.to"
            class="flex items-center gap-3 px-6 py-3 text-sm text-white/70
                   hover:text-white hover:bg-white/8 border-l-4
                   border-transparent transition-all"
            active-class="text-white !bg-white/10 !border-accent">
            <span>{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </RouterLink>

          <!-- Cari İşlemler Accordion -->
          <div>
            <button @click="cariOpen = !cariOpen"
                    class="w-full flex items-center gap-3 px-6 py-3 text-sm border-l-4
                           border-transparent transition-all"
                    :class="isCariActive
                      ? 'text-white bg-white/10 border-accent'
                      : 'text-white/70 hover:text-white hover:bg-white/8'">
              <span>👤</span>
              <span class="flex-1 text-left">Cari İşlemler</span>
              <svg class="w-4 h-4 transition-transform duration-300"
                   :class="cariOpen ? 'rotate-180' : ''"
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                      stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <div class="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                 :style="{ maxHeight: cariOpen ? '200px' : '0px' }">
              <RouterLink v-for="sub in cariSubMenu" :key="sub.to" :to="sub.to"
                          class="flex items-center gap-2 pl-14 pr-6 py-2 text-sm
                                 text-white/50 hover:text-white hover:bg-white/5
                                 border-l-4 border-transparent transition-all"
                          active-class="!text-white !bg-white/10 !border-accent/60">
                <span class="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0"/>
                {{ sub.label }}
              </RouterLink>
            </div>
          </div>

          <!-- Raporlar Accordion -->
          <div>
            <button @click="reportsOpen = !reportsOpen"
                    class="w-full flex items-center gap-3 px-6 py-3 text-sm border-l-4
                           border-transparent transition-all"
                    :class="isReportsActive
                      ? 'text-white bg-white/10 border-accent'
                      : 'text-white/70 hover:text-white hover:bg-white/8'">
              <span>📈</span>
              <span class="flex-1 text-left">Raporlar</span>
              <svg class="w-4 h-4 transition-transform duration-300"
                   :class="reportsOpen ? 'rotate-180' : ''"
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                      stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            <div class="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                 :style="{ maxHeight: reportsOpen ? '320px' : '0px' }">
              <RouterLink v-for="sub in reportSubMenu" :key="sub.to" :to="sub.to"
                          class="flex items-center gap-2 pl-14 pr-6 py-2 text-sm
                                 text-white/50 hover:text-white hover:bg-white/5
                                 border-l-4 border-transparent transition-all"
                          active-class="!text-white !bg-white/10 !border-accent/60">
                <span class="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0"/>
                {{ sub.label }}
              </RouterLink>
            </div>
          </div>

          <!-- Kasa Yapılandırma Accordion -->
          <div>
            <button @click="kasaYapiOpen = !kasaYapiOpen"
                    class="w-full flex items-center gap-3 px-6 py-3 text-sm border-l-4
                           border-transparent transition-all"
                    :class="isKasaYapiActive
                      ? 'text-white bg-white/10 border-accent'
                      : 'text-white/70 hover:text-white hover:bg-white/8'">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <span class="flex-1 text-left">Kasa Yapılandırma</span>
              <svg class="w-4 h-4 transition-transform duration-300"
                   :class="kasaYapiOpen ? 'rotate-180' : ''"
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                      stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            <div class="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                 :style="{ maxHeight: kasaYapiOpen ? '280px' : '0px' }">
              <RouterLink v-for="sub in kasaYapiSubMenu" :key="sub.to" :to="sub.to"
                          class="flex items-center gap-2 pl-14 pr-6 py-2 text-sm
                                 text-white/50 hover:text-white hover:bg-white/5
                                 border-l-4 border-transparent transition-all"
                          active-class="!text-white !bg-white/10 !border-accent/60">
                <span class="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0"/>
                {{ sub.label }}
              </RouterLink>
            </div>
          </div>

          <RouterLink v-for="item in menuBottom" :key="item.to" :to="item.to"
            class="flex items-center gap-3 px-6 py-3 text-sm text-white/70
                   hover:text-white hover:bg-white/8 border-l-4
                   border-transparent transition-all"
            active-class="text-white !bg-white/10 !border-accent">
            <span>{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </RouterLink>
        </template>
      </nav>

      <!-- Abonelik Durumu (Normal müşteri) -->
      <div v-if="!auth.isSuperAdmin && auth.tenantExpires"
           class="mx-4 mb-2 p-3 bg-white/5 rounded-lg">
        <div class="text-xs text-white/40 mb-1">Abonelik Bitiş</div>
        <div class="text-xs font-bold"
             :class="isExpiringSoon ? 'text-yellow-400' : 'text-white/70'">
          {{ formatDate(auth.tenantExpires) }}
        </div>
        <div v-if="isExpiringSoon"
             class="text-xs text-yellow-400 mt-1">
          ⚠ Yakında bitiyor!
        </div>
      </div>

      <!-- Kullanıcı + Çıkış -->
      <div class="p-4 border-t border-white/10">
        <div class="text-xs text-white/40 mb-1">👤 {{ auth.username }}</div>
        <RouterLink to="/subscription"
          v-if="!auth.isSuperAdmin"
          class="block text-xs text-accent mb-2 hover:underline">
          Abonelik Bilgileri
        </RouterLink>
        <button @click="logout"
                class="w-full py-2 rounded-lg text-sm font-semibold
                       bg-red-500/20 text-red-400 hover:bg-red-500
                       hover:text-white transition-all">
          ⏻ Çıkış Yap
        </button>
      </div>
    </aside>

    <!-- Ayarlar Modal -->
    <SettingsModal v-model:open="settingsOpen"/>

    <!-- İçerik -->
    <main :class="auth.isLoggedIn &&
                  route.path !== '/login' &&
                  route.path !== '/register' ? 'ml-60' : ''"
          class="flex-1">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component"/>
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute }  from 'vue-router'
import { useAuthStore }         from './stores/auth'
import { useSettingsStore }     from './stores/settings'
import SettingsModal            from './components/SettingsModal.vue'

const auth     = useAuthStore()
const router   = useRouter()
const route    = useRoute()
const _settings = useSettingsStore()
_settings.init()

const settingsOpen = ref(false)

const reportsOpen  = ref(false)
const cariOpen     = ref(false)
const kasaYapiOpen = ref(false)

watch(() => route.path, path => {
  if (path.startsWith('/reports'))  reportsOpen.value  = true
  if (path.startsWith('/cari'))     cariOpen.value     = true
  if (path.startsWith('/settings')) kasaYapiOpen.value = true
}, { immediate: true })

const isReportsActive  = computed(() => route.path.startsWith('/reports'))
const isCariActive     = computed(() => route.path.startsWith('/cari'))
const isKasaYapiActive = computed(() => route.path.startsWith('/settings'))

const menuTop = [
  { to: '/',           icon: '📊', label: 'Dashboard'   },
  { to: '/products',   icon: '📦', label: 'Ürünler'     },
  { to: '/categories', icon: '🗂',  label: 'Kategoriler' },
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
  { to: '/reports/masalar',   label: 'Masalar'         },
  { to: '/reports/stoklar',   label: 'Stoklar'         },
]

const kasaYapiSubMenu = [
  { to: '/settings/masa-ayarlari',   label: 'Masa Ayarları'         },
  { to: '/settings/receipt',         label: '🖨 Fiş Tasarımı'       },
  { to: '/settings/yazici-ayarlari', label: 'Yazıcı Ayarları'       },
  { to: '/settings/musteri-ekrani',  label: 'Müşteri Ekranı Ayarı'  },
  { to: '/settings/okc-durum',       label: 'ÖKC Durum'             },
  { to: '/settings/terminal',        label: 'Terminal Ayarları'      },
]

const menuBottom = [
  { to: '/users', icon: '👥', label: 'Kullanıcılar' },
]

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