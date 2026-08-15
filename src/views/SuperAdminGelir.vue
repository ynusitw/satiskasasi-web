<template>
  <div class="p-8">

    <!-- Başlık -->
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold text-primary">Gelir Analizi</h1>
        <p class="text-muted text-sm mt-1">Plan bazlı abone gelir özeti</p>
      </div>
      <div class="flex items-center gap-3">
        <!-- Plan fiyat göstergesi -->
        <div class="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm text-xs text-muted border border-gray-100">
          <template v-for="(p, i) in plansStore.plans" :key="p.id">
            <span v-if="i > 0" class="text-gray-300">|</span>
            <span class="font-bold text-primary">{{ p.name }}</span>
            <span>{{ fmt(p.price) }}/ay</span>
          </template>
        </div>
        <button @click="load"
                class="px-4 py-2 bg-accent text-white rounded-xl text-sm
                       font-semibold hover:bg-blue-600 transition-colors">
          ↻ Yenile
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-24 text-muted text-sm">
      Yükleniyor...
    </div>

    <template v-else>

      <!-- ── Özet Kartlar ───────────────────────────────────────────────── -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        <div class="bg-white rounded-2xl shadow-sm p-5">
          <div class="text-xs text-muted mb-1">Aylık Gelir (MRR)</div>
          <div class="text-2xl font-bold text-success">{{ fmt(mrr) }}</div>
          <div class="text-xs text-muted mt-1">{{ activeCount }} aktif abone</div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm p-5">
          <div class="text-xs text-muted mb-1">Yıllık Gelir (ARR)</div>
          <div class="text-2xl font-bold text-primary">{{ fmt(arr) }}</div>
          <div class="text-xs text-muted mt-1">MRR × 12</div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm p-5">
          <div class="text-xs text-muted mb-1">Bu Ay Sona Erecek</div>
          <div class="text-2xl font-bold"
               :class="expiringSoon.length > 0 ? 'text-warning' : 'text-muted'">
            {{ expiringSoon.length }}
          </div>
          <div class="text-xs text-muted mt-1">abone riski</div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm p-5">
          <div class="text-xs text-muted mb-1">Kayıp Potansiyel</div>
          <div class="text-2xl font-bold text-danger">{{ fmt(churnRisk) }}</div>
          <div class="text-xs text-muted mt-1">sona erecek MRR</div>
        </div>

      </div>

      <!-- ── Plan Dağılımı ─────────────────────────────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

        <!-- Plan dağılım kartları — store'dan dinamik -->
        <div v-for="plan in plansStore.plans" :key="plan.id"
             class="bg-white rounded-2xl shadow-sm p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full" :class="dotMap[plan.color] ?? 'bg-gray-400'"/>
              <span class="font-bold text-primary">{{ plan.name }} Plan</span>
            </div>
            <span class="text-xs font-bold px-2.5 py-1 rounded-full"
                  :class="(bgMap[plan.color] ?? 'bg-gray-100') + ' ' + (textMap[plan.color] ?? 'text-gray-600')">
              {{ fmt(plan.price) }}/ay
            </span>
          </div>
          <div class="flex items-end gap-3 flex-wrap">
            <div>
              <div class="text-3xl font-bold" :class="textMap[plan.color] ?? 'text-gray-600'">
                {{ planActiveCount(plan.id) }}
              </div>
              <div class="text-xs text-muted">aktif abone</div>
            </div>
            <div class="text-muted text-sm mb-1">× {{ fmt(plan.price) }} =</div>
            <div>
              <div class="text-3xl font-bold text-success">
                {{ fmt(planActiveCount(plan.id) * plan.price) }}
              </div>
              <div class="text-xs text-muted">aylık</div>
            </div>
          </div>
          <div class="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-500"
                 :class="dotMap[plan.color] ?? 'bg-gray-400'"
                 :style="{ width: totalActive ? (planActiveCount(plan.id) / totalActive * 100) + '%' : '0%' }"/>
          </div>
          <div class="text-xs text-muted mt-1">
            Toplam abonelerin %{{ totalActive ? Math.round(planActiveCount(plan.id) / totalActive * 100) : 0 }}'i
          </div>
        </div>

      </div>

      <!-- ── Abone Tablosu ──────────────────────────────────────────────── -->
      <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-4 flex-wrap">
          <h3 class="font-bold text-sm flex-1">Abone Detayları</h3>
          <input v-model="search"
                 placeholder="İşletme veya e-posta ara..."
                 class="px-4 py-2 border border-gray-200 rounded-xl text-sm
                        focus:border-accent focus:outline-none w-60"/>
          <!-- Plan filtresi -->
          <div class="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button v-for="f in filters" :key="f.value"
                    @click="planFilter = f.value"
                    class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    :class="planFilter === f.value
                      ? 'bg-white shadow-sm text-primary'
                      : 'text-muted hover:text-primary'">
              {{ f.label }}
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left px-5 py-3 text-xs font-bold text-muted uppercase">İşletme</th>
                <th class="text-left px-5 py-3 text-xs font-bold text-muted uppercase">Plan</th>
                <th class="text-right px-5 py-3 text-xs font-bold text-muted uppercase">Aylık Katkı</th>
                <th class="text-left px-5 py-3 text-xs font-bold text-muted uppercase hidden md:table-cell">Abonelik Bitiş</th>
                <th class="text-left px-5 py-3 text-xs font-bold text-muted uppercase hidden lg:table-cell">Kalan Süre</th>
                <th class="text-left px-5 py-3 text-xs font-bold text-muted uppercase">Durum</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!filtered.length">
                <td colspan="6" class="text-center py-12 text-muted text-sm">
                  Sonuç bulunamadı.
                </td>
              </tr>
              <tr v-for="t in filtered" :key="t.id"
                  class="border-t border-gray-50 hover:bg-gray-50 transition-colors">

                <!-- İşletme -->
                <td class="px-5 py-3.5">
                  <div class="font-semibold text-primary text-sm">{{ t.businessName }}</div>
                  <div class="text-xs text-muted">{{ t.email }}</div>
                </td>

                <!-- Plan -->
                <td class="px-5 py-3.5">
                  <span class="text-xs font-bold px-2.5 py-1 rounded-full"
                        :class="t.plan === 'pro'
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-blue-100 text-blue-600'">
                    {{ t.plan === 'pro' ? 'Pro' : 'Basic' }}
                  </span>
                </td>

                <!-- Aylık katkı -->
                <td class="px-5 py-3.5 text-right">
                  <span class="font-bold text-sm"
                        :class="revenueOf(t) > 0 ? 'text-success' : 'text-muted'">
                    {{ revenueOf(t) > 0 ? fmt(revenueOf(t)) : '—' }}
                  </span>
                </td>

                <!-- Bitiş tarihi -->
                <td class="px-5 py-3.5 hidden md:table-cell">
                  <span class="text-sm"
                        :class="isExpired(t.expiresAt)   ? 'text-danger font-bold' :
                                isDueSoon(t.expiresAt)   ? 'text-warning font-bold' : 'text-muted'">
                    {{ formatDate(t.expiresAt) }}
                  </span>
                </td>

                <!-- Kalan süre -->
                <td class="px-5 py-3.5 hidden lg:table-cell">
                  <span class="text-xs font-semibold"
                        :class="isExpired(t.expiresAt) ? 'text-danger' :
                                isDueSoon(t.expiresAt)  ? 'text-warning' : 'text-muted'">
                    {{ remainingDays(t.expiresAt) }}
                  </span>
                </td>

                <!-- Durum -->
                <td class="px-5 py-3.5">
                  <span class="text-xs font-bold px-2.5 py-1 rounded-full"
                        :class="statusClass(t)">
                    {{ statusLabel(t) }}
                  </span>
                </td>

              </tr>
            </tbody>

            <!-- Footer toplamı -->
            <tfoot v-if="filtered.length" class="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td colspan="2" class="px-5 py-3 text-sm font-bold">
                  {{ filtered.length }} abone
                </td>
                <td class="px-5 py-3 text-right font-bold text-success text-sm">
                  {{ fmt(filteredMrr) }}/ay
                </td>
                <td colspan="3" class="px-5 py-3 text-xs text-muted hidden md:table-cell">
                  Yıllık {{ fmt(filteredMrr * 12) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api             from '../api/api'
import { usePlansStore } from '../stores/plans'

const plansStore = usePlansStore()

const tenants   = ref([])
const loading   = ref(true)
const search    = ref('')
const planFilter = ref('all')

const filters = [
  { value: 'all',    label: 'Tümü'    },
  { value: 'basic',  label: 'Basic'   },
  { value: 'pro',    label: 'Pro'     },
  { value: 'expiring', label: '⚠ Sona Eriyor' },
]

async function load() {
  loading.value = true
  try {
    tenants.value = (await api.getAllTenants()).data
  } finally {
    loading.value = false
  }
}

// ─── Yardımcılar ─────────────────────────────────────────────────────────────
function isExpired(d)  { return d ? new Date(d) < new Date() : false }
function isDueSoon(d) {
  if (!d) return false
  const diff = new Date(d) - new Date()
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000
}
function isActive(t) { return t.isActive && !isExpired(t.expiresAt) }

function revenueOf(t) {
  return isActive(t) ? plansStore.priceOf(t.plan) : 0
}

function remainingDays(d) {
  if (!d) return '—'
  const diff = new Date(d) - new Date()
  if (diff < 0) return 'Süresi doldu'
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Bugün bitiyor'
  return `${days} gün`
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('tr-TR')
}

function statusLabel(t) {
  if (!t.isActive)           return 'Pasif'
  if (isExpired(t.expiresAt)) return 'Süresi Doldu'
  if (isDueSoon(t.expiresAt)) return '⚠ Sona Eriyor'
  return 'Aktif'
}

function statusClass(t) {
  if (!t.isActive)           return 'bg-gray-100 text-gray-500'
  if (isExpired(t.expiresAt)) return 'bg-red-100 text-danger'
  if (isDueSoon(t.expiresAt)) return 'bg-yellow-100 text-warning'
  return 'bg-green-100 text-success'
}

function fmt(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0 }).format(v ?? 0) + ' ₺'
}

// ─── Computed ─────────────────────────────────────────────────────────────────
// Renk map (Paketler sayfasıyla senkron)
const dotMap  = { blue:'bg-blue-400', purple:'bg-purple-400', green:'bg-green-400', orange:'bg-orange-400', red:'bg-red-400', gray:'bg-gray-400' }
const bgMap   = { blue:'bg-blue-100', purple:'bg-purple-100', green:'bg-green-100', orange:'bg-orange-100', red:'bg-red-100', gray:'bg-gray-100' }
const textMap = { blue:'text-blue-600', purple:'text-purple-600', green:'text-green-600', orange:'text-orange-600', red:'text-red-600', gray:'text-gray-600' }

function planActiveCount(planId) {
  return tenants.value.filter(t => isActive(t) && t.plan === planId).length
}

const activeCount = computed(() => tenants.value.filter(isActive).length)
const totalActive = computed(() => activeCount.value)
const basicActive = computed(() => planActiveCount('basic'))
const proActive   = computed(() => planActiveCount('pro'))

const mrr         = computed(() => tenants.value.reduce((s, t) => s + revenueOf(t), 0))
const arr         = computed(() => mrr.value * 12)

const expiringSoon = computed(() => tenants.value.filter(t => isActive(t) && isDueSoon(t.expiresAt)))
const churnRisk    = computed(() => expiringSoon.value.reduce((s, t) => s + revenueOf(t), 0))

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return tenants.value.filter(t => {
    const matchSearch = !q ||
      t.businessName.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q)

    const matchPlan =
      planFilter.value === 'all'      ? true :
      planFilter.value === 'expiring' ? (isActive(t) && isDueSoon(t.expiresAt)) :
      t.plan === planFilter.value

    return matchSearch && matchPlan
  })
})

const filteredMrr = computed(() => filtered.value.reduce((s, t) => s + revenueOf(t), 0))

onMounted(load)
</script>
