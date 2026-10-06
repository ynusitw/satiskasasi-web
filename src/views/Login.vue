<template>
  <div class="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-white">

    <!-- Marka paneli (geniş ekranda) -->
    <div class="hidden lg:flex relative overflow-hidden bg-primary text-white p-12 flex-col justify-between">
      <div class="absolute inset-0 pointer-events-none
                  bg-[radial-gradient(60%_50%_at_20%_15%,rgba(37,99,235,0.35),transparent_70%)]"/>
      <div class="absolute inset-0 pointer-events-none opacity-[0.07]
                  bg-[linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)]
                  bg-[size:44px_44px]"/>

      <div class="relative flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-[14px] font-bold">SK</div>
        <span class="text-[16px] font-semibold tracking-tight">SatışKasası</span>
      </div>

      <div class="relative max-w-md">
        <h2 class="text-[34px] leading-[1.15] font-semibold tracking-tight">
          İşletmenizi tek panelden yönetin.
        </h2>
        <p class="text-white/60 text-[15px] mt-4 leading-relaxed">
          Satışlar, stok, masalar, cari hesaplar ve raporlar — kasanızla anlık senkronize.
        </p>
      </div>

      <div class="relative text-[12.5px] text-white/40">
        © {{ new Date().getFullYear() }} SatışKasası
      </div>
    </div>

    <!-- Form -->
    <div class="flex items-center justify-center p-6 sm:p-12 bg-white">
      <div class="w-full max-w-[360px]">
        <div class="lg:hidden flex items-center gap-3 mb-10">
          <div class="w-9 h-9 rounded-lg bg-accent text-white flex items-center justify-center text-[14px] font-bold">SK</div>
          <span class="text-[16px] font-semibold tracking-tight text-primary">SatışKasası</span>
        </div>

        <h1 class="text-[26px] font-semibold text-primary">Giriş yapın</h1>
        <p class="text-muted text-[14px] mt-1.5 mb-8">Yönetim paneline erişmek için bilgilerinizi girin.</p>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-[13px] font-medium text-primary mb-1.5">Kullanıcı adı</label>
            <input v-model="form.username" type="text" autocomplete="username" autofocus
                   class="w-full h-11 px-3.5 rounded-lg border border-gray-200 bg-white text-[14px]" required/>
          </div>
          <div>
            <label class="block text-[13px] font-medium text-primary mb-1.5">Şifre</label>
            <input v-model="form.password" type="password" autocomplete="current-password"
                   class="w-full h-11 px-3.5 rounded-lg border border-gray-200 bg-white text-[14px]" required/>
          </div>

          <div v-if="error"
               class="px-3.5 py-2.5 rounded-lg bg-red-50 text-danger text-[13px] border border-red-100">
            {{ error }}
          </div>

          <button type="submit" :disabled="loading"
                  class="w-full h-11 rounded-lg bg-accent text-white text-[14px] font-semibold
                         hover:bg-blue-600 disabled:opacity-60">
            {{ loading ? 'Giriş yapılıyor...' : 'Giriş yap' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
const auth = useAuthStore()
const router = useRouter()
const form = reactive({ username: '', password: '' })
const loading = ref(false)
const error = ref('')
async function handleLogin() {
  loading.value = true; error.value = ''
  try { await auth.login(form.username, form.password); router.push('/') }
  catch (e) { error.value = e.response?.data?.message || e.message || 'Bağlantı hatası.' }
  finally { loading.value = false }
}
</script>
