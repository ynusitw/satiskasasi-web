<template>
  <!-- Dijital menüde tek ürün satırı. Pasif ürünler gizlenmez, soluk gösterilir. -->
  <div class="product-row" :class="{ 'is-inactive': isInactive }">
    <div class="product-thumb">
      <img v-if="product.imageBase64" :src="product.imageBase64" :alt="product.name"/>
    </div>
    <div class="product-body">
      <div class="product-name">{{ product.name }}</div>
      <div v-if="product.description" class="product-desc">{{ product.description }}</div>
      <div v-if="labels.length" class="product-allergens">
        Alerjen: {{ labels.join(', ') }}
      </div>
      <div class="product-foot">
        <span class="price-tag">{{ fmt(product.price) }}</span>
        <span v-if="isInactive" class="unavailable">Şu anda mevcut değil</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { allergenLabels } from '../constants/allergens'

const props = defineProps({ product: { type: Object, required: true } })

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
   miras alınır (CSS değişkenleri scoped stilden bağımsız olarak kalıtılır).
   Yönetici panelinin koyu teması "bg-white", <input> gibi çıplak seçicileri
   ezdiği için burada da yalnızca kendi class isimlerimiz kullanılıyor. */
.product-row {
  display: flex; gap: 12px; align-items: flex-start;
  background: white; border-radius: 16px; padding: 10px;
  border: 1px solid rgba(0,0,0,0.05);
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.product-thumb {
  width: 76px; height: 76px; border-radius: 12px; overflow: hidden;
  background: #F3ECE3; flex-shrink: 0;
}
.product-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.product-body { flex: 1; min-width: 0; }
.product-name {
  font-weight: 700; font-size: 14px; line-height: 1.3;
  color: var(--ink, #1F2937);
}
.product-desc {
  font-size: 12px; margin-top: 2px; line-height: 1.35;
  color: var(--ink-muted, #8B8378);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.product-allergens {
  font-size: 10.5px; margin-top: 3px; opacity: .85;
  color: var(--ink-muted, #8B8378);
}
.product-foot {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 5px;
}
.price-tag {
  font-weight: 800; font-size: 13.5px;
  color: var(--brand-dark, #92400E);
}
.unavailable {
  font-size: 10.5px; font-weight: 700; color: #9CA3AF;
  background: #F3F4F6; padding: 2px 7px; border-radius: 999px;
}

/* Pasif ürün */
.product-row.is-inactive { background: #FAF7F2; }
.product-row.is-inactive .product-thumb { filter: grayscale(1); opacity: .55; }
.product-row.is-inactive .product-name,
.product-row.is-inactive .product-desc,
.product-row.is-inactive .price-tag { color: #9CA3AF; }
</style>
