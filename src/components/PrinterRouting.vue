<template>
  <!-- Kategori → yazıcı yönlendirmesi. Eskiden ayrı "Yazıcı Ayarları"
       sekmesindeydi; fiş ayarlarıyla birlikte tek sayfada toplandı. -->
  <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-100">
      <h2 class="font-bold text-primary">Kategori Yönlendirmesi</h2>
      <p class="text-xs text-muted mt-0.5">
        Her kategori için hangi yazıcıdan kaç kopya çıkacağını belirleyin.
        Yönlendirilmemiş kategoriler varsayılan fiş yazıcısını kullanır.
      </p>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase tracking-wide">Kategori</th>
            <th class="text-left px-6 py-3 text-xs font-bold text-muted uppercase tracking-wide">Mutfak / Bar Yazıcısı</th>
            <th class="text-center px-6 py-3 text-xs font-bold text-muted uppercase tracking-wide">Kopya</th>
            <th class="text-center px-6 py-3 text-xs font-bold text-muted uppercase tracking-wide">Aksiyon</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in routings" :key="row.categoryId"
              class="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
            <td class="px-6 py-3.5">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-accent flex-shrink-0"/>
                <span class="font-semibold text-sm text-primary">{{ row.categoryName }}</span>
              </div>
            </td>
            <td class="px-6 py-3.5">
              <select v-model="row.printerName"
                      class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                             focus:border-accent focus:outline-none bg-white min-w-[180px]">
                <option value="">— Yazıcı yok —</option>
                <option v-for="p in printers" :key="p" :value="p">{{ p }}</option>
              </select>
            </td>
            <td class="px-6 py-3.5">
              <div class="flex items-center justify-center gap-2">
                <button @click="row.copies = Math.max(1, row.copies - 1)"
                        class="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200
                               text-muted hover:border-danger hover:text-danger hover:bg-red-50
                               transition-colors font-bold select-none leading-none">−</button>
                <span class="w-8 text-center font-bold text-sm text-primary select-none">{{ row.copies }}</span>
                <button @click="row.copies = Math.min(10, row.copies + 1)"
                        class="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200
                               text-muted hover:border-success hover:text-success hover:bg-green-50
                               transition-colors font-bold select-none leading-none">+</button>
              </div>
            </td>
            <td class="px-6 py-3.5">
              <div class="flex items-center justify-center">
                <button @click="removeRouting(row.categoryId)"
                        class="px-3 py-1.5 text-xs font-semibold text-danger bg-red-50
                               hover:bg-danger hover:text-white rounded-lg transition-all">
                  Kaldır
                </button>
              </div>
            </td>
          </tr>

          <tr v-for="cat in unroutedCategories" :key="cat.id"
              class="border-t border-gray-50 bg-gray-50/40 hover:bg-gray-50 transition-colors">
            <td class="px-6 py-3.5">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0"/>
                <span class="text-sm text-muted">{{ cat.name }}</span>
              </div>
            </td>
            <td class="px-6 py-3.5 text-xs text-gray-400 italic" colspan="2">
              Varsayılan yazıcıya basılır
            </td>
            <td class="px-6 py-3.5">
              <div class="flex items-center justify-center">
                <button @click="addRouting(cat)"
                        class="px-3 py-1.5 text-xs font-semibold text-accent bg-accent/10
                               hover:bg-accent hover:text-white rounded-lg transition-all">
                  + Ekle
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="!routings.length && !unroutedCategories.length">
            <td colspan="4" class="text-center py-12 text-muted text-sm">Kategori bulunamadı.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../api/api'

// Yazıcı listesi üst sayfadan gelir (aynı listeyi iki kez çekmemek için).
defineProps({ printers: { type: Array, default: () => [] } })

const categories = ref([])
const routings   = ref([])

const unroutedCategories = computed(() => {
  const routed = new Set(routings.value.map(r => r.categoryId))
  return categories.value.filter(c => !routed.has(c.id))
})

async function load() {
  const [cRes, rRes] = await Promise.allSettled([
    api.getCategories(),
    api.getCategoryRoutings(),
  ])
  categories.value = cRes.status === 'fulfilled' ? (cRes.value.data ?? []) : []
  routings.value   = rRes.status === 'fulfilled'
    ? (rRes.value.data ?? []).map(r => ({ ...r }))
    : []
}

function addRouting(cat) {
  routings.value.push({
    categoryId:   cat.id,
    categoryName: cat.name,
    printerName:  '',
    copies:       1,
  })
}

function removeRouting(categoryId) {
  routings.value = routings.value.filter(r => r.categoryId !== categoryId)
}

// Sayfadaki tek "Kaydet" düğmesi bunu da çağırır.
async function save() {
  await api.saveCategoryRoutings(
    routings.value.map(r => ({
      categoryId:  r.categoryId,
      printerName: r.printerName,
      copies:      r.copies,
    }))
  )
}

defineExpose({ save })
onMounted(load)
</script>
