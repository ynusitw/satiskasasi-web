<template>
  <div class="flex min-h-screen bg-bg">
    <aside v-if="auth.isLoggedIn && route.path !== '/login'"
           class="fixed left-0 top-0 h-full w-60 bg-primary text-white flex flex-col z-50 shadow-xl">
      <div class="px-6 py-5 border-b border-white/10">
        <div class="text-2xl mb-1">🏪</div>
        <div class="font-bold text-sm">SatışKasası</div>
        <div class="text-white/40 text-xs">Yönetim Paneli</div>
      </div>
      <nav class="flex-1 py-3">
        <RouterLink v-for="item in menu" :key="item.to" :to="item.to"
          class="flex items-center gap-3 px-6 py-3 text-sm text-white/70 hover:text-white hover:bg-white/8 border-l-4 border-transparent transition-all"
          active-class="text-white !bg-white/10 !border-accent">
          <span>{{ item.icon }}</span><span>{{ item.label }}</span>
        </RouterLink>
      </nav>
      <div class="p-4 border-t border-white/10">
        <div class="text-xs text-white/40 mb-2">👤 {{ auth.username }}</div>
        <button @click="logout" class="w-full py-2 rounded-lg text-sm font-semibold bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all">⏻ Çıkış Yap</button>
      </div>
    </aside>
    <main :class="auth.isLoggedIn && route.path !== '/login' ? 'ml-60' : ''" class="flex-1">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in"><component :is="Component"/></Transition>
      </RouterView>
    </main>
  </div>
</template>
<script setup>
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const menu = [
  { to: '/', icon: '📊', label: 'Dashboard' },
  { to: '/products', icon: '📦', label: 'Ürünler' },
  { to: '/categories', icon: '🗂', label: 'Kategoriler' },
  { to: '/reports', icon: '📈', label: 'Raporlar' },
  { to: '/users', icon: '👥', label: 'Kullanıcılar' },
]
function logout() { auth.logout(); router.push('/login') }
</script>
