<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-4xl">
    <h1 class="page-title">Terazi</h1>
    <p class="page-subtitle mb-6">
      Barkodlu terazi etiketinin biçimi ve tartılı ürünler. Kasaya kabloyla bağlı terazinin
      iletişim ayarları her kasada ayrı yapılır: kasada <b>Menü → Terazi</b>.
    </p>

    <div v-if="loading" class="bg-white rounded-2xl shadow-sm py-12 text-center text-muted">Yükleniyor...</div>

    <template v-else>
      <!-- ── Etiket barkodu ─────────────────────────────────────────── -->
      <div class="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 class="section-title">Barkodlu terazi etiketi</h2>
            <p class="text-xs text-muted mt-1">Kasada okutulan etiket bu biçime uyuyorsa ürün ve ağırlık etiketten okunur.</p>
          </div>
          <label class="flex items-center gap-2 text-[13.5px] font-semibold cursor-pointer">
            <input type="checkbox" v-model="form.enabled" class="w-4 h-4"/> Açık
          </label>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4" :class="form.enabled ? '' : 'opacity-50'">
          <div>
            <label class="field-label-muted">Önek(ler)</label>
            <input v-model="form.prefixes" placeholder="27,28" :disabled="!form.enabled"
                   class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white font-mono"/>
          </div>
          <div>
            <label class="field-label-muted">Ürün kodu uzunluğu</label>
            <select v-model.number="form.codeLength" :disabled="!form.enabled"
                    class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white">
              <option :value="4">4 hane</option>
              <option :value="5">5 hane</option>
              <option :value="6">6 hane</option>
            </select>
          </div>
          <div>
            <label class="field-label-muted">Etikette</label>
            <select v-model="form.valueType" :disabled="!form.enabled" @change="defaultDecimals"
                    class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white">
              <option value="Weight">Ağırlık</option>
              <option value="Price">Tutar</option>
            </select>
          </div>
          <div>
            <label class="field-label-muted">Değer birimi</label>
            <select v-model.number="form.valueDecimals" :disabled="!form.enabled"
                    class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white">
              <template v-if="form.valueType === 'Weight'">
                <option :value="3">gram (1235 = 1,235 kg)</option>
                <option :value="2">10 gram (123 = 1,23 kg)</option>
              </template>
              <template v-else>
                <option :value="2">kuruş (12350 = 123,50 ₺)</option>
                <option :value="1">10 kuruş</option>
                <option :value="0">TL (124 = 124 ₺)</option>
              </template>
            </select>
          </div>
        </div>

        <!-- Biçim şeması -->
        <div class="mt-4 flex items-center gap-1 font-mono text-[13px] flex-wrap" :class="form.enabled ? '' : 'opacity-50'">
          <span class="px-2 py-1 rounded bg-blue-50 text-blue-700">{{ firstPrefix }}</span>
          <span class="px-2 py-1 rounded bg-amber-50 text-amber-700">{{ 'K'.repeat(form.codeLength) }}</span>
          <span class="px-2 py-1 rounded bg-green-50 text-green-700">{{ 'D'.repeat(valueLength) }}</span>
          <span class="px-2 py-1 rounded bg-gray-100 text-muted">C</span>
          <span class="text-[12px] text-muted ml-2 font-sans">
            önek · ürün kodu ({{ form.codeLength }}) · {{ form.valueType === 'Price' ? 'tutar' : 'ağırlık' }} ({{ valueLength }}) · kontrol hanesi
          </span>
        </div>

        <!-- Deneme -->
        <div class="mt-5 pt-4 border-t border-gray-100">
          <label class="field-label-muted">Deneme: etiketteki barkodu yazın</label>
          <input v-model="testCode" inputmode="numeric" maxlength="13" placeholder="ör. 2700012012357"
                 class="w-full sm:w-72 px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white font-mono"/>
          <p v-if="testCode" class="text-[13px] mt-2" :class="testResult.ok ? 'text-success font-medium' : 'text-danger'">
            {{ testResult.text }}
          </p>
        </div>

        <div class="flex items-center gap-3 mt-5">
          <button @click="save" :disabled="saving" class="btn-primary disabled:opacity-50">
            {{ saving ? 'Kaydediliyor...' : 'Kaydet' }}
          </button>
          <span v-if="saved" class="text-[13px] text-success">Kaydedildi — kasalar satış ekranı açılırken alır.</span>
        </div>
      </div>

      <!-- ── Tartılı ürünler ─────────────────────────────────────────── -->
      <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 class="section-title">Tartılı ürünler ({{ weighed.length }})</h2>
            <p class="text-xs text-muted mt-0.5">
              Ürün formunda "Tartılı ürün" işaretlenir. Teraziye yüklemek için listeyi indirip terazinin programıyla aktarın.
            </p>
          </div>
          <button @click="exportCsv" :disabled="!weighed.length" class="btn-secondary disabled:opacity-50">CSV indir</button>
        </div>
        <table v-if="weighed.length" class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-6 py-2.5 text-[11px] font-semibold text-muted uppercase w-28">Terazi kodu</th>
              <th class="text-left px-6 py-2.5 text-[11px] font-semibold text-muted uppercase">Ürün</th>
              <th class="text-right px-6 py-2.5 text-[11px] font-semibold text-muted uppercase">Kg fiyatı</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in weighed" :key="p.id" class="border-t border-gray-50">
              <td class="px-6 py-2.5 font-mono text-[13px]">
                <span v-if="p.scaleCode">{{ p.scaleCode }}</span>
                <span v-else class="text-danger font-sans text-[12px] font-semibold">kod yok</span>
              </td>
              <td class="px-6 py-2.5 text-[13.5px] text-primary">{{ p.name }}</td>
              <td class="px-6 py-2.5 text-right text-[13.5px] font-semibold">{{ fmt(p.price) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="py-10 text-center text-muted text-sm">
          Henüz tartılı ürün yok. Ürünler sayfasında ürünü düzenleyip "Tartılı ürün"ü işaretleyin.
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import api from '../../api/api'
import { uiAlert } from '../../utils/dialog'

const loading = ref(true)
const saving = ref(false)
const saved = ref(false)
const products = ref([])
const testCode = ref('')
const form = reactive({ enabled: false, prefixes: '27,28', codeLength: 5, valueType: 'Weight', valueDecimals: 3 })

const firstPrefix = computed(() => (form.prefixes.split(/[,;\s]+/).find(x => /^\d{2}$/.test(x)) || '27'))
const valueLength = computed(() => 12 - 2 - form.codeLength)
const weighed = computed(() => products.value.filter(p => p.isWeighed)
  .sort((a, b) => (Number(a.scaleCode) || 1e9) - (Number(b.scaleCode) || 1e9) || a.name.localeCompare(b.name, 'tr')))

function defaultDecimals() { form.valueDecimals = form.valueType === 'Price' ? 2 : 3 }

// Kasadaki çözümlemenin aynısı (kasa: ScaleBarcode.TryParse)
const testResult = computed(() => {
  const c = testCode.value.trim()
  if (!/^\d{13}$/.test(c)) return { ok: false, text: '13 haneli rakam olmalı (EAN-13).' }
  const prefixes = form.prefixes.split(/[,;\s]+/).filter(x => /^\d{2}$/.test(x))
  if (!prefixes.includes(c.slice(0, 2))) return { ok: false, text: `Önek ${c.slice(0, 2)} terazi öneki değil; kasa bunu normal barkod olarak arar.` }
  const code = Number(c.slice(2, 2 + form.codeLength))
  const raw = Number(c.slice(2 + form.codeLength, 12))
  const value = raw / Math.pow(10, form.valueDecimals)
  const p = products.value.find(x => x.scaleCode && Number(x.scaleCode) === code)
  if (!p) return { ok: false, text: `Ürün kodu ${code}: bu kodda ürün yok.` }
  if (form.valueType === 'Price') {
    const kg = p.price > 0 ? value / p.price : 0
    return { ok: true, text: `${p.name} · tutar ${fmt(value)} → ${kg.toLocaleString('tr-TR', { maximumFractionDigits: 3 })} kg` }
  }
  return { ok: true, text: `${p.name} · ${value.toLocaleString('tr-TR', { minimumFractionDigits: 3 })} kg → ${fmt(value * p.price)}` }
})

async function save() {
  saving.value = true
  saved.value = false
  try {
    await api.saveScaleSettings({ ...form })
    saved.value = true
  } catch (e) {
    await uiAlert(e.response?.data?.message || 'Ayarlar kaydedilemedi.')
  } finally {
    saving.value = false
  }
}

// Excel'de Türkçe karakterler doğru açılsın diye BOM + noktalı virgül
function exportCsv() {
  const rows = [['Terazi Kodu', 'Ürün', 'Kg Fiyatı', 'Barkod']]
  for (const p of weighed.value)
    rows.push([p.scaleCode || '', p.name, Number(p.price).toFixed(2).replace('.', ','), p.barcode || ''])
  const csv = rows.map(r => r.map(v => /[;"\n]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : v).join(';')).join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `terazi-urunleri-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

function fmt(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}

onMounted(async () => {
  try {
    const [s, p] = await Promise.all([api.getScaleSettings(), api.getProductsLite()])
    Object.assign(form, s.data)
    products.value = p.data
  } catch (e) {
    await uiAlert(e.response?.data?.message || 'Terazi ayarları alınamadı.')
  } finally {
    loading.value = false
  }
})
</script>
