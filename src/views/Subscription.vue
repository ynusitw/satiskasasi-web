<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold text-primary mb-8">Abonelik Bilgileri</h1>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <!-- Mevcut Plan -->
      <div class="bg-white rounded-2xl p-6 shadow-sm">
        <h2 class="font-bold text-primary mb-4">Mevcut Plan</h2>
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
            <span :class="remainingDays < 7 ? 'text-red-500 font-bold' : 'font-semibold'">
              {{ remainingDays }} gün
            </span>
          </div>
        </div>
      </div>

      <!-- Yenileme -->
      <div class="bg-white rounded-2xl p-6 shadow-sm">
        <h2 class="font-bold text-primary mb-4">Aboneliği Yenile</h2>

        <div v-if="isExpiringSoon"
             class="p-4 bg-yellow-50 rounded-xl text-sm text-yellow-700 mb-4">
          ⚠️ Aboneliğiniz yakında bitiyor. Kesintisiz hizmet için yenileyin.
        </div>

        <p class="text-sm text-muted mb-6">
          Aboneliğinizi yenilemek için lütfen iletişime geçin:
        </p>

        <div class="space-y-3">
          <a href="mailto:admin@genpos.tr"
             class="flex items-center gap-3 p-4 bg-blue-50 rounded-xl
                    text-accent font-semibold text-sm hover:bg-blue-100 transition-colors">
            📧 yekutuk@gmail.com
          </a>
          <a href="tel:+905001234567"
             class="flex items-center gap-3 p-4 bg-green-50 rounded-xl
                    text-green-600 font-semibold text-sm hover:bg-green-100 transition-colors">
            📞 +90 505 406 00 17
          </a>
        </div>

        <div class="mt-6 p-4 bg-gray-50 rounded-xl">
          <p class="text-xs font-bold text-primary mb-2">Yıllık Plan Fiyatları:</p>
          <div class="space-y-1 text-xs text-muted">
            <div class="flex justify-between">
              <span>Basic Plan</span>
              <span class="font-bold text-primary">₺X.XXX / yıl</span>
            </div>
            <div class="flex justify-between">
              <span>Pro Plan</span>
              <span class="font-bold text-primary">₺X.XXX / yıl</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const remainingDays = computed(() => {
  if (!auth.tenantExpires) return 0
  const diff = new Date(auth.tenantExpires) - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
})

const isExpiringSoon = computed(() => remainingDays.value < 7)

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
  if (!d) return 'Belirsiz'
  return new Date(d).toLocaleDateString('tr-TR', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}
</script>