<template>
  <div class="p-6 lg:p-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-primary">Kasa İşlemleri</h1>
      <p class="text-muted text-sm mt-1">Tahsilat ve tediye makbuz yönetimi</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <!-- Makbuz Formu -->
      <div class="bg-white rounded-2xl shadow-sm p-6">
        <h2 class="text-lg font-bold mb-5">Makbuz Kes</h2>

        <div class="flex gap-3 mb-5">
          <button v-for="t in islemTipleri" :key="t.value"
                  @click="form.tip = t.value"
                  class="flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all"
                  :class="form.tip === t.value
                    ? t.activeClass
                    : 'border-gray-200 text-muted hover:border-gray-300'">
            {{ t.icon }} {{ t.label }}
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold mb-1">Cari *</label>
            <select v-model.number="form.cariId"
                    class="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm
                           focus:border-accent focus:outline-none bg-white">
              <option value="">Cari seçin...</option>
              <option v-for="c in store.carilerWithBakiye" :key="c.id" :value="c.id">
                {{ c.unvan }} — {{ bakiyeLabel(c.bakiye) }}
              </option>
            </select>
          </div>

          <!-- Seçili cari bakiye özeti -->
          <div v-if="secilenCari" class="px-4 py-3 rounded-xl text-sm flex items-center justify-between"
               :class="secilenCari.bakiye > 0 ? 'bg-red-50' : secilenCari.bakiye < 0 ? 'bg-green-50' : 'bg-gray-50'">
            <span class="text-muted">Güncel Bakiye</span>
            <span class="font-bold"
                  :class="secilenCari.bakiye > 0 ? 'text-danger' : secilenCari.bakiye < 0 ? 'text-success' : 'text-muted'">
              {{ fmt(Math.abs(secilenCari.bakiye)) }}
              {{ secilenCari.bakiye > 0 ? '▲ Borçlu' : secilenCari.bakiye < 0 ? '▼ Alacaklı' : 'Sıfır' }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-semibold mb-1">Makbuz No</label>
              <input v-model="form.makbuzNo" placeholder="MKB-001"
                     class="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm
                            focus:border-accent focus:outline-none"/>
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Tarih</label>
              <input v-model="form.tarih" type="date"
                     class="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm
                            focus:border-accent focus:outline-none"/>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold mb-1">Tutar (₺) *</label>
            <input v-model.number="form.tutar" type="number" min="0.01" step="0.01"
                   placeholder="0,00"
                   class="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm
                          focus:border-accent focus:outline-none text-lg font-bold"/>
          </div>

          <div>
            <label class="block text-sm font-semibold mb-1">Ödeme Yöntemi</label>
            <div class="grid grid-cols-3 gap-2">
              <button v-for="m in ['Nakit','Kart','Havale']" :key="m"
                      @click="form.odeme = m"
                      class="py-2 rounded-xl text-xs font-bold border-2 transition-all"
                      :class="form.odeme === m
                        ? 'border-accent bg-blue-50 text-accent'
                        : 'border-gray-200 text-muted'">
                {{ m }}
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold mb-1">Açıklama</label>
            <input v-model="form.aciklama" placeholder="Makbuz açıklaması..."
                   class="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm
                          focus:border-accent focus:outline-none"/>
          </div>

          <div v-if="error" class="p-3 bg-red-50 text-danger rounded-xl text-sm">{{ error }}</div>

          <button @click="save"
                  class="w-full py-3 rounded-xl text-sm font-bold text-white transition-colors"
                  :class="form.tip === 'Tahsilat' ? 'bg-success hover:bg-green-600' : 'bg-danger hover:bg-red-600'">
            {{ form.tip === 'Tahsilat' ? '✓ Tahsilat Makbuzu Kes' : '✓ Tediye Makbuzu Kes' }}
          </button>
        </div>
      </div>

      <!-- Son İşlemler (store'dan canlı) -->
      <div class="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h2 class="text-lg font-bold">Son İşlemler</h2>
          <span class="text-xs text-muted">{{ store.kasaIslemleri.length }} kayıt</span>
        </div>
        <div class="divide-y divide-gray-50 overflow-y-auto max-h-[560px]">
          <div v-if="!store.sonKasaIslemleri.length" class="px-6 py-12 text-center text-muted">
            Henüz işlem bulunmuyor
          </div>
          <div v-for="i in store.sonKasaIslemleri" :key="i.id"
               class="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
            <div>
              <div class="flex items-center gap-2 mb-0.5">
                <span class="text-xs font-bold px-2 py-0.5 rounded-full"
                      :class="i.tip === 'Tahsilat'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'">
                  {{ i.tip }}
                </span>
                <span class="text-xs text-muted font-mono">{{ i.makbuzNo }}</span>
              </div>
              <div class="text-sm font-semibold text-primary">{{ i.cariUnvan }}</div>
              <div class="text-xs text-muted">{{ i.tarih }} · {{ i.odeme }}</div>
            </div>
            <div class="text-right">
              <div class="font-bold text-base"
                   :class="i.tip === 'Tahsilat' ? 'text-success' : 'text-danger'">
                {{ i.tip === 'Tahsilat' ? '+' : '-' }}{{ fmt(i.tutar) }}
              </div>
              <div class="text-xs text-muted">{{ i.aciklama }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useCariStore } from '../../stores/cari'

const store = useCariStore()
onMounted(() => store.fetchCariler())

const today = new Date().toISOString().split('T')[0]

const islemTipleri = [
  { value: 'Tahsilat', label: 'Tahsilat', icon: '↓', activeClass: 'border-success bg-green-50 text-success' },
  { value: 'Tediye',   label: 'Tediye',   icon: '↑', activeClass: 'border-danger bg-red-50 text-danger'   },
]

const error = ref('')
const form  = reactive({
  tip: 'Tahsilat', cariId: '', makbuzNo: '', tarih: today,
  tutar: 0, odeme: 'Nakit', aciklama: '',
})

const secilenCari = computed(() =>
  store.carilerWithBakiye.find(c => c.id === form.cariId) || null
)

function fmt(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}

function bakiyeLabel(b) {
  if (b > 0) return `Borçlu ${fmt(b)}`
  if (b < 0) return `Alacaklı ${fmt(Math.abs(b))}`
  return 'Sıfır'
}

function save() {
  if (!form.cariId)      { error.value = 'Cari seçimi zorunludur.'; return }
  if (form.tutar <= 0)   { error.value = 'Tutar sıfırdan büyük olmalıdır.'; return }

  const no       = form.makbuzNo || `MKB-${String(store.kasaIslemleri.length + 1).padStart(3, '0')}`
  const cariUnvan = secilenCari.value?.unvan ?? ''

  store.kasaIslemEkle({ ...form, makbuzNo: no, cariUnvan })

  Object.assign(form, { cariId: '', makbuzNo: '', tutar: 0, aciklama: '' })
  error.value = ''
}
</script>
