<template>
  <div class="min-h-screen bg-gradient-to-br from-primary to-accent
              flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">

      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16
                    bg-gradient-to-br from-accent to-blue-400
                    rounded-2xl text-3xl mb-4 shadow-lg">🏪</div>
        <h1 class="text-2xl font-bold text-primary">SatışKasası</h1>
        <p class="text-muted text-sm mt-1">Yeni İşletme Kaydı</p>
        <p class="text-xs text-green-600 mt-1 font-semibold">
          14 gün ücretsiz deneme!
        </p>
      </div>

      <form @submit.prevent="handleRegister">
        <div class="grid grid-cols-2 gap-4">

          <div class="col-span-2">
            <label class="block text-sm font-semibold text-primary mb-1">
              İşletme Adı *
            </label>
            <input v-model="form.businessName"
                   placeholder="Örn: Ahmet Market"
                   class="w-full px-4 py-3 rounded-xl border border-gray-200
                          focus:border-accent focus:outline-none text-sm"
                   required/>
          </div>

          <div class="col-span-2">
            <label class="block text-sm font-semibold text-primary mb-1">
              Yetkili Adı *
            </label>
            <input v-model="form.contactPerson"
                   placeholder="Ad Soyad"
                   class="w-full px-4 py-3 rounded-xl border border-gray-200
                          focus:border-accent focus:outline-none text-sm"
                   required/>
          </div>

          <div>
            <label class="block text-sm font-semibold text-primary mb-1">
              E-posta *
            </label>
            <input v-model="form.email" type="email"
                   placeholder="ornek@mail.com"
                   class="w-full px-4 py-3 rounded-xl border border-gray-200
                          focus:border-accent focus:outline-none text-sm"
                   required/>
          </div>

          <div>
            <label class="block text-sm font-semibold text-primary mb-1">
              Telefon *
            </label>
            <input v-model="form.phone"
                   placeholder="05xx xxx xx xx"
                   class="w-full px-4 py-3 rounded-xl border border-gray-200
                          focus:border-accent focus:outline-none text-sm"
                   required/>
          </div>

          <div>
            <label class="block text-sm font-semibold text-primary mb-1">
              Şehir
            </label>
            <input v-model="form.city"
                   placeholder="İstanbul"
                   class="w-full px-4 py-3 rounded-xl border border-gray-200
                          focus:border-accent focus:outline-none text-sm"/>
          </div>

          <div>
            <label class="block text-sm font-semibold text-primary mb-1">
              Vergi No
            </label>
            <input v-model="form.taxNumber"
                   placeholder="Vergi numarası"
                   class="w-full px-4 py-3 rounded-xl border border-gray-200
                          focus:border-accent focus:outline-none text-sm"/>
          </div>

          <div class="col-span-2">
            <label class="block text-sm font-semibold text-primary mb-1">
              Adres
            </label>
            <input v-model="form.address"
                   placeholder="İşletme adresi"
                   class="w-full px-4 py-3 rounded-xl border border-gray-200
                          focus:border-accent focus:outline-none text-sm"/>
          </div>

          <div class="col-span-2">
            <label class="block text-sm font-semibold text-primary mb-1">
              Şifre *
            </label>
            <input v-model="form.password" type="password"
                   placeholder="Giriş şifresi"
                   class="w-full px-4 py-3 rounded-xl border border-gray-200
                          focus:border-accent focus:outline-none text-sm"
                   required/>
          </div>
        </div>

        <div v-if="error"
             class="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
          {{ error }}
        </div>

        <div v-if="success"
             class="mt-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm">
          {{ success }}
        </div>

        <button type="submit" :disabled="loading"
                class="w-full mt-6 py-3 bg-accent text-white font-bold
                       rounded-xl hover:bg-blue-600 transition-colors
                       disabled:opacity-50">
          {{ loading ? 'Kayıt yapılıyor...' : 'Ücretsiz Başla' }}
        </button>

        <p class="text-center text-sm text-muted mt-4">
          Zaten hesabınız var mı?
          <RouterLink to="/login" class="text-accent hover:underline">
            Giriş yapın
          </RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter }     from 'vue-router'
import api               from '../api/api'

const router  = useRouter()
const loading = ref(false)
const error   = ref('')
const success = ref('')

const form = reactive({
  businessName: '', contactPerson: '', email: '',
  phone: '', city: '', taxNumber: '',
  address: '', password: ''
})

async function handleRegister() {
  loading.value = true
  error.value   = ''
  success.value = ''
  try {
    const res = await api.register(form)
    success.value = res.data.message +
      ` Deneme bitiş: ${new Date(res.data.trialEndsAt).toLocaleDateString('tr-TR')}`
    setTimeout(() => router.push('/login'), 3000)
  } catch (e) {
    error.value = e.response?.data?.message || 'Kayıt sırasında hata oluştu.'
  } finally {
    loading.value = false
  }
}
</script>