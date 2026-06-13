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
          <RouterLink v-for="item in menu" :key="item.to" :to="item.to"
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
import { computed }             from 'vue'
import { useRouter, useRoute }  from 'vue-router'
import { useAuthStore }         from './stores/auth'

const auth   = useAuthStore()
const router = useRouter()
const route  = useRoute()

const menu = [
  { to: '/',            icon: '📊', label: 'Dashboard'    },
  { to: '/products',    icon: '📦', label: 'Ürünler'      },
  { to: '/categories',  icon: '🗂',  label: 'Kategoriler'  },
  { to: '/reports',     icon: '📈', label: 'Raporlar'     },
  { to: '/users',       icon: '👥', label: 'Kullanıcılar' },
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