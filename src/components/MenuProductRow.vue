<template>
  <!-- Dijital menüde tek ürün satırı. Pasif ürünler gizlenmez, soluk gösterilir. -->
  <div class="product-row is-clickable"
       :class="{ 'is-inactive': isInactive }"
       @click="emit('open', product)">
    <div v-if="hasImage" class="product-thumb">
      <MenuImage :src="imageUrl" :alt="product.name" class="thumb-img"/>
    </div>
    <div class="product-body">
      <div v-if="campaign || product.isFeaturedOnMenu || isInactive" class="badges">
        <span v-if="isInactive" class="badge is-off">{{ product.isSoldOut ? 'Tükendi' : 'Şu anda mevcut değil' }}</span>
        <span v-if="campaign" class="badge is-camp">{{ campaign.name }} · {{ campaign.label }}</span>
        <span v-else-if="product.isFeaturedOnMenu && !isInactive" class="badge">Öne çıkan</span>
      </div>
      <div class="product-head">
        <div class="product-name">{{ product.name }}</div>
        <span class="price-pill">
          <span v-if="campaign" class="price-old">{{ listLabel }}</span>{{ priceLabel }}
        </span>
      </div>
      <div v-if="product.description" class="product-desc">{{ product.description }}</div>
      <div v-if="labels.length || (orderable && !isInactive)" class="product-foot">
        <span v-if="labels.length" class="product-allergens">Alerjen: {{ labels.join(', ') }}</span>
        <!-- Masadan sipariş açıksa -->
        <button v-if="orderable && !isInactive" type="button" class="add-btn"
                @click.stop="emit('add', product)">
          Ekle
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { allergenLabels } from '../constants/allergens'
import MenuImage from './MenuImage.vue'
import { discountedPrice } from '../utils/campaign'

const props = defineProps({
  product:  { type: Object, required: true },
  imageUrl: { type: String, default: '' },  // küçük görselin adresi (üst sayfa üretir)
  orderable: { type: Boolean, default: false } // masadan sipariş açık mı
})
const emit  = defineEmits(['open', 'add'])

// Şu an geçerli saatlik kampanya (pasif üründe gösterilmez)
const campaign = computed(() => props.product.isActive === false ? null : props.product.campaign)

// Porsiyonlu üründe en düşük porsiyon fiyatı "… den başlayan" olarak gösterilir.
function label(priceOf) {
  const v = props.product.variants
  if (v?.length) {
    const min = Math.min(...v.map(x => priceOf(x.price)))
    return fmt(min) + (v.length > 1 ? "'den" : '')
  }
  return fmt(priceOf(props.product.price))
}
const priceLabel = computed(() => label(p => discountedPrice(campaign.value, p)))
const listLabel  = computed(() => label(p => p))

// Görsel artık menü yanıtında gelmiyor; API yalnızca var/yok bilgisi veriyor.
const hasImage = computed(() => !!props.product.hasImage && !!props.imageUrl)

const labels = computed(() => allergenLabels(props.product.allergens))

// Yalnızca API açıkça false derse pasif say — alanı göndermeyen eski bir API
// sürümü karşımıza çıkarsa ürünler yanlışlıkla "mevcut değil" görünmesin.
const isInactive = computed(() => props.product.isActive === false)

function fmt(v) {
  return new Intl.NumberFormat('tr-TR').format(v ?? 0) + ' ₺'
}
</script>

<style scoped>
/* Renkler üst sayfadaki .menu-page üzerinde tanımlı CSS değişkenlerinden
   miras alınır. Yönetici panelinin koyu teması "bg-white", <input> gibi
   çıplak seçicileri ezdiği için burada yalnızca kendi class isimlerimiz var. */
.product-row {
  display: flex; gap: 14px; align-items: stretch;
  background: #fff; border-radius: 22px; padding: 12px;
  box-shadow: 0 2px 10px rgba(19,34,58,0.06);
}
.product-thumb {
  position: relative; width: 104px; height: 104px; border-radius: 16px; overflow: hidden;
  background: var(--soft, #EDE8DF); flex-shrink: 0; align-self: flex-start;
}
.product-thumb .thumb-img { width: 100%; height: 100%; }
.product-body { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.badges { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 5px; }
.badge {
  font-size: 10.5px; font-weight: 800; padding: 3px 8px; border-radius: 999px;
  background: var(--brand-soft, #E3F4E8); color: var(--brand-dark, #15803D);
}
.badge.is-camp { background: #FEF3C7; color: #92400E; }
.badge.is-off  { background: #F1F1F1; color: #6B7280; }
.product-head { display: flex; align-items: flex-start; gap: 8px; }
.product-name {
  flex: 1; min-width: 0; font-weight: 800; font-size: 15.5px; line-height: 1.25;
  color: var(--ink, #13223A);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.price-pill {
  flex-shrink: 0; font-weight: 800; font-size: 13.5px; white-space: nowrap;
  color: var(--brand-dark, #15803D); background: var(--brand-soft, #E3F4E8);
  padding: 4px 10px; border-radius: 999px;
}
.price-old { font-size: 11.5px; font-weight: 600; color: var(--ink-muted, #7B8089); text-decoration: line-through; margin-right: 4px; }
.product-desc {
  font-size: 12.5px; margin-top: 5px; line-height: 1.4;
  color: var(--ink-muted, #7B8089);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.product-foot { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: auto; padding-top: 8px; }
.product-allergens { font-size: 10.5px; color: var(--ink-muted, #7B8089); }
.add-btn {
  margin-left: auto;
  height: 36px; padding: 0 18px; border-radius: 999px; border: none;
  background: var(--brand, #16A34A); color: white;
  font-size: 13.5px; font-weight: 800; cursor: pointer;
  box-shadow: 0 2px 8px rgba(22,163,74,0.3);
}
.add-btn:active { transform: scale(.96); }

.product-row.is-clickable { cursor: pointer; transition: transform .12s ease, box-shadow .12s ease; }
.product-row.is-clickable:active { transform: scale(.985); }
@media (hover: hover) {
  .product-row.is-clickable:hover { box-shadow: 0 6px 18px rgba(19,34,58,0.1); }
}

/* Pasif / tükenen ürün */
.product-row.is-inactive { background: #FBFAF7; }
.product-row.is-inactive .product-thumb { filter: grayscale(1); opacity: .55; }
.product-row.is-inactive .product-name,
.product-row.is-inactive .product-desc { color: #9CA3AF; }
.product-row.is-inactive .price-pill { color: #9CA3AF; background: #F1F1F1; }
</style>
