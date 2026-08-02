<template>
  <div class="flex min-h-screen bg-bg">

    <aside v-if="auth.isLoggedIn && route.path !== '/login' && route.path !== '/register'"
           class="fixed left-0 top-0 h-full w-60 bg-primary text-white
                  flex flex-col z-50 shadow-xl">

      <!-- Logo + Tenant -->
      <div class="px-6 py-5 border-b border-white/10">
        <div class="text-2xl mb-1">🏪</div>
        <div class="font-bold text-sm">SatışKasası</div>
        <div class="text-white/40 text-xs truncate">
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
          <RouterLink to="/"
            class="flex items-center gap-3 px-6 py-3 text-sm text-white/70
                   hover:text-white hover:bg-white/8 border-l-4
                   border-transparent transition-all"
            active-class="text-white !bg-white/10 !border-accent">
            <span>📊</span><span>Dashboard</span>
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

const auth   = useAuthStore()
const router = useRouter()
const route  = useRoute()

const reportsOpen = ref(false)
watch(() => route.path, path => {
  if (path.startsWith('/reports')) reportsOpen.value = true
}, { immediate: true })

const isReportsActive = computed(() => route.path.startsWith('/reports'))

const menuTop = [
  { to: '/',           icon: '📊', label: 'Dashboard'     },
  { to: '/products',   icon: '📦', label: 'Ürünler'       },
  { to: '/categories', icon: '🗂',  label: 'Kategoriler'   },
  { to: '/cari',       icon: '👤', label: 'Cari / Müşteri' },
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