<template>
  <!-- Masadan sipariş: porsiyon / çeşni / adet / not seçimi (alttan açılan pencere) -->
  <div class="sheet-backdrop" @click="emit('close')">
    <div class="sheet" @click.stop>
      <div class="sheet-head">
        <div class="sheet-title">{{ product.name }}</div>
        <button type="button" class="sheet-close" @click="emit('close')">Kapat</button>
      </div>

      <div class="sheet-body">
        <p v-if="product.description" class="sheet-desc">{{ product.description }}</p>

        <!-- Porsiyon -->
        <section v-if="variants.length" class="opt-group">
          <div class="opt-group-title">Porsiyon <span class="req">zorunlu</span></div>
          <label v-for="v in variants" :key="v.id" class="opt-row">
            <input type="radio" :value="v.id" v-model="variantId"/>
            <span class="opt-name">{{ v.name }}</span>
            <span class="opt-price">{{ fmt(v.price) }}</span>
          </label>
        </section>

        <!-- Çeşniler -->
        <section v-for="g in groups" :key="g.id" class="opt-group">
          <div class="opt-group-title">
            {{ g.name }}
            <span v-if="g.minSelect > 0" class="req">
              {{ g.minSelect === g.maxSelect ? `${g.minSelect} seçim` : `en az ${g.minSelect}` }}
            </span>
            <span v-else-if="g.maxSelect > 1" class="hint">en fazla {{ g.maxSelect }}</span>
            <span v-else class="hint">isteğe bağlı</span>
          </div>
          <label v-for="o in g.options" :key="o.id" class="opt-row"
                 :class="{ 'is-disabled': isDisabled(g, o) }">
            <input :type="g.maxSelect === 1 ? 'radio' : 'checkbox'"
                   :name="`g${g.id}`"
                   :checked="selected[g.id]?.includes(o.id)"
                   :disabled="isDisabled(g, o)"
                   @change="toggle(g, o, $event.target.checked)"/>
            <span class="opt-name">{{ o.name }}</span>
            <span v-if="o.priceDelta" class="opt-price">+{{ fmt(o.priceDelta) }}</span>
          </label>
        </section>

        <section class="opt-group">
          <div class="opt-group-title">Not <span class="hint">isteğe bağlı</span></div>
          <input v-model="note" maxlength="100" class="note-input" placeholder="Ör. az pişmiş, soğansız"/>
        </section>
      </div>

      <div class="sheet-foot">
        <div class="qty">
          <button type="button" @click="qty = Math.max(1, qty - 1)" :disabled="qty <= 1">−</button>
          <span>{{ qty }}</span>
          <button type="button" @click="qty = Math.min(20, qty + 1)" :disabled="qty >= 20">+</button>
        </div>
        <button type="button" class="add-main" :disabled="!!missing" @click="add">
          {{ missing || `Sepete ekle · ${fmt(unitPrice * qty)}` }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

const props = defineProps({ product: { type: Object, required: true } })
const emit = defineEmits(['add', 'close'])

const variants = computed(() => props.product.variants ?? [])
const groups   = computed(() => props.product.modifierGroups ?? [])

const variantId = ref(variants.value.length === 1 ? variants.value[0].id : null)
const qty  = ref(1)
const note = ref('')

// Grup başına seçili seçenekler; varsayılanlar önceden işaretli.
const selected = reactive({})
for (const g of groups.value) {
  const defaults = g.options.filter(o => o.isDefault).map(o => o.id)
  selected[g.id] = g.maxSelect > 0 ? defaults.slice(0, g.maxSelect) : defaults
}

function toggle(g, o, on) {
  const cur = selected[g.id] ?? []
  if (g.maxSelect === 1) { selected[g.id] = on ? [o.id] : []; return }
  selected[g.id] = on ? [...cur, o.id] : cur.filter(id => id !== o.id)
}
function isDisabled(g, o) {
  const cur = selected[g.id] ?? []
  return g.maxSelect > 1 && cur.length >= g.maxSelect && !cur.includes(o.id)
}

const chosenOptions = computed(() =>
  groups.value.flatMap(g => g.options.filter(o => (selected[g.id] ?? []).includes(o.id))))

const unitPrice = computed(() => {
  const v = variants.value.find(x => x.id === variantId.value)
  const base = v ? v.price : props.product.price
  return base + chosenOptions.value.reduce((s, o) => s + (o.priceDelta || 0), 0)
})

// Eksik seçim varsa buton metni neyin eksik olduğunu söyler.
const missing = computed(() => {
  if (variants.value.length && !variantId.value) return 'Porsiyon seçin'
  const g = groups.value.find(g => (selected[g.id] ?? []).length < g.minSelect)
  return g ? `"${g.name}" için seçim yapın` : ''
})

function add() {
  if (missing.value) return
  const v = variants.value.find(x => x.id === variantId.value)
  emit('add', {
    productId: props.product.id,
    name: props.product.name,
    variantId: v?.id ?? null,
    variantName: v?.name ?? null,
    optionIds: chosenOptions.value.map(o => o.id),
    optionNames: chosenOptions.value.map(o => o.name),
    unitPrice: unitPrice.value,
    quantity: qty.value,
    note: note.value.trim() || null,
  })
}

function fmt(v) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}
</script>

<style scoped>
/* Herkese açık menü sayfasının sıcak teması (renkler .menu-page değişkenlerinden).
   Panelin koyu teması çıplak etiketleri ezdiğinden yalnızca kendi class adları. */
.sheet-backdrop {
  position: fixed; inset: 0; z-index: 70;
  background: rgba(28, 20, 12, 0.55);
  display: flex; align-items: flex-end; justify-content: center;
}
.sheet {
  width: 100%; max-width: 560px; max-height: 88vh;
  background: #FFFDFA; border-radius: 20px 20px 0 0;
  display: flex; flex-direction: column;
  box-shadow: 0 -10px 40px rgba(0,0,0,0.25);
}
.sheet-head {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 16px 18px 10px;
}
.sheet-title { font-size: 18px; font-weight: 800; color: var(--ink, #1F2937); }
.sheet-close {
  height: 30px; padding: 0 12px; border-radius: 999px; border: none;
  background: #F3ECE3; color: var(--ink, #1F2937); font-size: 12px; font-weight: 700;
}
.sheet-body { padding: 0 18px 12px; overflow-y: auto; }
.sheet-desc { font-size: 13px; color: var(--ink-muted, #8B8378); margin: 0 0 12px; line-height: 1.45; }
.opt-group { margin-top: 14px; }
.opt-group-title {
  font-size: 13px; font-weight: 800; color: var(--ink, #1F2937); margin-bottom: 6px;
  display: flex; align-items: center; gap: 8px;
}
.req  { font-size: 10.5px; font-weight: 700; color: #92400E; background: #FEF3C7; padding: 2px 7px; border-radius: 999px; }
.hint { font-size: 11px; font-weight: 600; color: var(--ink-muted, #8B8378); }
.opt-row {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 12px; margin-bottom: 6px;
  background: white; border: 1px solid rgba(0,0,0,0.07); border-radius: 12px;
  cursor: pointer;
}
.opt-row input { width: 18px; height: 18px; accent-color: var(--brand, #D97706); }
.opt-row.is-disabled { opacity: .45; cursor: not-allowed; }
.opt-name { flex: 1; font-size: 14px; font-weight: 600; color: var(--ink, #1F2937); }
.opt-price { font-size: 13px; font-weight: 700; color: var(--brand-dark, #92400E); }
.note-input {
  width: 100%; height: 42px; padding: 0 12px; border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.12); background: white !important; color: #1F2937 !important;
  font-size: 14px; outline: none;
}
.note-input:focus { border-color: var(--brand, #D97706); box-shadow: 0 0 0 3px rgba(217,119,6,0.15); }
.sheet-foot {
  display: flex; gap: 10px; align-items: center;
  padding: 12px 18px calc(14px + env(safe-area-inset-bottom));
  border-top: 1px solid rgba(0,0,0,0.06);
}
.qty {
  display: flex; align-items: center; gap: 4px;
  background: #F3ECE3; border-radius: 999px; padding: 4px;
}
.qty button {
  width: 36px; height: 36px; border-radius: 999px; border: none;
  background: white; color: var(--ink, #1F2937); font-size: 18px; font-weight: 800;
}
.qty button:disabled { opacity: .4; }
.qty span { min-width: 24px; text-align: center; font-weight: 800; color: var(--ink, #1F2937); }
.add-main {
  flex: 1; height: 48px; border-radius: 999px; border: none;
  background: var(--brand, #D97706); color: white; font-size: 15px; font-weight: 800;
}
.add-main:disabled { background: #D6CFC5; }
</style>
