<template>
  <!-- Alerjen simgesi (QR menü). Ekran okuyucu ve basılı tutunca görünen ad: <title>. -->
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" :stroke="icon.color"
       stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" role="img" :aria-label="label"
       class="allergen-icon">
    <title>{{ label }}</title>
    <path v-for="(d, i) in icon.paths" :key="'p' + i" :d="d"/>
    <circle v-for="(c, i) in icon.circles || []" :key="'c' + i" :cx="c[0]" :cy="c[1]" :r="c[2]"/>
  </svg>
</template>

<script setup>
import { computed } from 'vue'
import { ALLERGENS } from '../constants/allergens'

const props = defineProps({
  code: { type: String, required: true },
  size: { type: Number, default: 18 },
})

// Basit çizgi simgeler (24×24). Her alerjenin kendi rengi var; menüde bir bakışta ayırt edilsin.
const ICONS = {
  gluten: { color: '#B7791F', paths: [   // buğday başağı
    'M12 21V5',
    'M12 18c-2.6 0-4-1.5-4-4 2.6 0 4 1.5 4 4z', 'M12 18c2.6 0 4-1.5 4-4-2.6 0-4 1.5-4 4z',
    'M12 13c-2.6 0-4-1.5-4-4 2.6 0 4 1.5 4 4z', 'M12 13c2.6 0 4-1.5 4-4-2.6 0-4 1.5-4 4z',
    'M12 8c-1.3-1-1.3-3.2 0-4.5 1.3 1.3 1.3 3.5 0 4.5z'] },
  sut: { color: '#2563EB', paths: [       // süt şişesi
    'M9.5 2.5h5', 'M10 2.5v3L8 9v11a1.5 1.5 0 0 0 1.5 1.5h5A1.5 1.5 0 0 0 16 20V9l-2-3.5v-3', 'M8 13h8'] },
  yumurta: { color: '#D97706', paths: [   // yumurta
    'M12 3c-3.4 0-6 5-6 10a6 6 0 0 0 12 0c0-5-2.6-10-6-10z'] },
  findik: { color: '#92400E', paths: [    // fındık
    'M12 8c-3.9 0-7 2.8-7 6.5a7 7 0 0 0 14 0C19 10.8 15.9 8 12 8z', 'M6.5 10c1-3.2 3-5 5.5-5s4.5 1.8 5.5 5', 'M12 5V2.5'] },
  yerfistigi: { color: '#A16207', paths: [ // yer fıstığı
    'M9.2 3.5a4.6 4.6 0 0 0-2.4 8.5c.6.4.8 1.1.6 1.8a4.6 4.6 0 1 0 8.6 2.4c-.1-.7.3-1.3.9-1.6a4.6 4.6 0 1 0-7.7-11.1z'] },
  soya: { color: '#65A30D', paths: [      // soya fasulyesi kabuğu
    'M4.5 18.5C6 11.5 11.5 6 19.5 4.5 18 12.5 12.5 18 5.5 19.5c-.7.1-1.2-.4-1-1z'], circles: [[9, 15, 1.4], [12.5, 11.5, 1.4], [16, 8, 1.4]] },
  balik: { color: '#0284C7', paths: [     // balık
    'M2 7.5l4 4.5-4 4.5', 'M6 12c2.2-3.8 5.6-6 9-6 3.7 0 7 2.8 7 6s-3.3 6-7 6c-3.4 0-6.8-2.2-9-6z'], circles: [[17.5, 11, 0.6]] },
  kabuklu: { color: '#E11D48', paths: [   // deniz kabuğu
    'M12 20L4 10.5a8 8 0 0 1 16 0z', 'M12 20V4.5', 'M12 20L8.2 6', 'M12 20l3.8-14', 'M10 21.5h4'] },
  susam: { color: '#78716C', paths: [     // susam taneleri
    'M7 15c-1.6-2-1.6-4.2 0-6.2 1.6 2 1.6 4.2 0 6.2z',
    'M12.5 20c-1.6-2-1.6-4.2 0-6.2 1.6 2 1.6 4.2 0 6.2z',
    'M16.5 11.5c-1.6-2-1.6-4.2 0-6.2 1.6 2 1.6 4.2 0 6.2z'] },
  hardal: { color: '#CA8A04', paths: [    // hardal şişesi
    'M11 2h2l1 4h-4z', 'M8 6h8l-1 14.5a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 20.5z', 'M8.6 11h6.8'] },
  kereviz: { color: '#16A34A', paths: [   // kereviz sapı
    'M10 22V11', 'M14 22V11', 'M12 22V10',
    'M10 11C7 10 6 7 7 4.5c2 .2 3 2.5 3 6.5z', 'M14 11c3-1 4-4 3-6.5-2 .2-3 2.5-3 6.5z', 'M12 10c-.8-2.5-.8-5 0-7.5.8 2.5.8 5 0 7.5z'] },
  sulfit: { color: '#7C3AED', paths: [    // kadeh (sülfit genelde şarap / kuru meyvede)
    'M8 3h8l-.8 6.2a3.2 3.2 0 0 1-6.4 0z', 'M12 12.5V20', 'M9 21h6'] },
}
const FALLBACK = { color: '#7B8089', paths: ['M12 8v5', 'M12 16.5v.01'], circles: [[12, 12, 9]] }

const icon  = computed(() => ICONS[props.code] || FALLBACK)
const label = computed(() => ALLERGENS.find(a => a.code === props.code)?.label || props.code)
</script>

<style scoped>
.allergen-icon { display: inline-block; vertical-align: middle; flex-shrink: 0; }
</style>
