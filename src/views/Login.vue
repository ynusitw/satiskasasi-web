<template>
  <div class="min-h-screen bg-gradient-to-br from-primary to-accent flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent to-blue-400 rounded-2xl text-3xl mb-4 shadow-lg">🏪</div>
        <h1 class="text-2xl font-bold text-primary">SatışKasası</h1>
        <p class="text-muted text-sm mt-1">Yönetim Paneline Giriş</p>
      </div>
      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label class="block text-sm font-semibold text-primary mb-2">Kullanıcı Adı</label>
          <input v-model="form.username" type="text" placeholder="Kullanıcı adınız"
            class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none text-sm" required/>
        </div>
        <div class="mb-6">
          <label class="block text-sm font-semibold text-primary mb-2">Şifre</label>
          <input v-model="form.password" type="password" placeholder="Şifreniz"
            class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:outline-none text-sm" required/>
        </div>
        <div v-if="error" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{{ error }}</div>
        <button type="submit" :disabled="loading"
          class="w-full py-3 bg-accent text-white font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50">
          {{ loading ? 'Giriş yapılıyor...' : 'Giriş Yap' }}
        </button>
      </form>
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
