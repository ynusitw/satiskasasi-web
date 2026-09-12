<template>
  <div class="min-h-screen bg-bg">
    <div v-if="loading" class="flex items-center justify-center min-h-screen text-muted">
      Menü yükleniyor...
    </div>

    <div v-else-if="notFound" class="flex flex-col items-center justify-center min-h-screen text-center p-8">
      <div class="text-5xl mb-3">🔍</div>
      <div class="font-bold text-lg text-primary">Menü bulunamadı</div>
      <div class="text-sm text-muted mt-1">Bağlantıyı kontrol edin.</div>
    </div>

    <div v-else>
      <!-- İşletme başlığı -->
      <div class="bg-primary text-white px-5 pt-8 pb-6 text-center">
        <div class="text-2xl font-bold">{{ menu.businessName }}</div>
        <div v-if="menu.address || menu.phone" class="text-xs text-white/70 mt-1">
          {{ [menu.address, menu.phone].filter(Boolean).join(' · ') }}
        </div>
      </div>

      <!-- Kategori sekmeleri -->
      <div class="sticky top-0 bg-bg z-10 border-b border-gray-100 shadow-sm">
        <div class="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
          <button @click="selectedCategoryId = null"
                  class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors"
                  :class="selectedCategoryId === null
                    ? 'bg-accent text-white'
                    : 'bg-white text-muted border border-gray-200'">
            Tümü
          </button>
          <button v-for="c in menu.categories" :key="c.id"
                  @click="selectedCategoryId = c.id"
                  class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors"
                  :class="selectedCategoryId === c.id
                    ? 'bg-accent text-white'
                    : 'bg-white text-muted border border-gray-200'">
            <span v-if="c.iconGlyph">{{ c.iconGlyph }}</span> {{ c.name }}
          </button>
        </div>
      </div>

      <!-- Ürünler -->
      <div class="p-4 space-y-6 max-w-2xl mx-auto">
        <div v-for="c in visibleCategories" :key="c.id">
          <h2 class="font-bold text-primary text-lg mb-3 flex items-center gap-2">
            <span v-if="c.iconGlyph">{{ c.iconGlyph }}</span>{{ c.name }}
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div v-for="p in c.products" :key="p.id"
                 class="bg-white rounded-2xl shadow-sm p-3 flex items-center gap-3">
              <img v-if="p.imageBase64" :src="p.imageBase64" alt=""
                   class="w-16 h-16 rounded-xl object-cover flex-shrink-0"/>
              <div v-else
                   class="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center
                          text-2xl flex-shrink-0">🍽️</div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-primary truncate">{{ p.name }}</div>
                <div class="text-accent font-bold mt-0.5">{{ fmt(p.price) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="visibleCategories.length === 0" class="text-center py-16 text-muted">
          Bu kategoride ürün yok
        </div>
      </div>

      <div class="text-center text-xs text-muted py-6">
        SatışKasası ile oluşturuldu
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api/api'

const route = useRoute()
const loading = ref(true)
const notFound = ref(false)
const menu = ref({ businessName: '', address: '', phone: '', categories: [] })
const selectedCategoryId = ref(null)

const visibleCategories = computed(() => {
  const withProducts = menu.value.categories.filter(c => c.products.length > 0)
  return selectedCategoryId.value === null
    ? withProducts
    : withProducts.filter(c => c.id === selectedCategoryId.value)
})

function fmt(v) {
  return new Intl.NumberFormat('tr-TR').format(v ?? 0) + ' ₺'
}

onMounted(async () => {
  try {
    const res = await api.getPublicMenu(route.params.slug)
    menu.value = res.data
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
