<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <h1 class="page-title mb-8">Abonelik Bilgileri</h1>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <!-- Mevcut Plan -->
      <div class="bg-white rounded-2xl p-6 shadow-sm">
        <h2 class="section-title mb-4">Mevcut Plan</h2>
        <div class="space-y-3">
          <div class="flex justify-between py-2 border-b border-gray-100">
            <span class="text-sm text-muted">İşletme</span>
            <span class="font-semibold">{{ auth.tenantName }}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <span class="text-sm text-muted">Plan</span>
            <span :class="planColor"
                  class="font-bold text-sm px-3 py-1 rounded-full">
              {{ planLabel }}
            </span>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <span class="text-sm text-muted">Bitiş Tarihi</span>
            <span :class="isExpiringSoon ? 'text-yellow-500 font-bold' : 'font-semibold'">
              {{ formatDate(auth.tenantExpires) }}
            </span>
          </div>
          <div class="flex justify-between py-2">
            <span class="text-sm text-muted">Kalan Gün</span>
            <span :class="isExpiringSoon ? 'text-red-500 font-bold' : 'font-semibold'">
              {{ remainingDays === null ? 'Süresiz' : remainingDays + ' gün' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Yenileme -->
      <div class="bg-white rounded-2xl p-6 shadow-sm">
        <h2 class="section-title mb-4">Aboneliği Yenile</h2>

        <div v-if="isExpiringSoon"
             class="p-4 bg-yellow-50 rounded-xl text-sm text-yellow-700 mb-4">
          Aboneliğiniz yakında bitiyor. Kesintisiz hizmet için yenileyin.
        </div>

        <p class="text-sm text-muted mb-6">
          Aboneliğinizi yenilemek için lütfen iletişime geçin:
        </p>

        <div class="space-y-3">
          <a href="mailto:info@yenpos.com"
             class="flex items-center gap-3 p-4 bg-blue-50 rounded-xl
                    text-accent font-semibold text-sm hover:bg-blue-100 transition-colors">
            info@yenpos.com
          </a>
          <a href="tel:+905054060017"
             class="flex items-center gap-3 p-4 bg-green-50 rounded-xl
                    text-green-600 font-semibold text-sm hover:bg-green-100 transition-colors">
            0505 406 00 17
          </a>
          <a href="https://wa.me/905054060017?text=Merhaba%2C%20YenPOS%20aboneli%C4%9Fimi%20yenilemek%20istiyorum."
             target="_blank" rel="noopener"
             class="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl
                    text-emerald-700 font-semibold text-sm hover:bg-emerald-100 transition-colors">
            WhatsApp'tan yazın
          </a>
        </div>

        <p class="mt-6 p-4 bg-gray-50 rounded-xl text-xs text-muted leading-relaxed">
          Fiyat, kullandığınız modüllere ve kasa sayısına göre belirlenir.
          Yenileme ya da modül eklemek için bize ulaşın; size özel teklif hazırlayalım.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const remainingDays = computed(() => {
  if (!auth.tenantExpires) return null   // bitiş tarihi yok: süresiz
  const diff = new Date(auth.tenantExpires) - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
})

const isExpiringSoon = computed(() => remainingDays.value !== null && remainingDays.value < 7)

const planLabel = computed(() => {
  const plans = { basic: 'Basic', pro: 'Pro', superadmin: 'Süper Admin' }
  return plans[auth.tenantPlan] || auth.tenantPlan
})

const planColor = computed(() => {
  const colors = {
    basic:      'bg-blue-100 text-blue-600',
    pro:        'bg-purple-100 text-purple-600',
    superadmin: 'bg-yellow-100 text-yellow-600'
  }
  return colors[auth.tenantPlan] || 'bg-gray-100 text-gray-600'
})

function formatDate(d) {
  if (!d) return 'Süresiz'
  return new Date(d).toLocaleDateString('tr-TR', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}
</script>