<template>
  <!-- Tutar alanı: sağa hizalı sayı + "₺" (ve isteğe bağlı "/ay") eki -->
  <span class="inline-flex items-center gap-1.5" :class="full ? 'w-full' : ''">
    <input type="number" min="0" step="0.01" :value="modelValue ?? 0"
           class="px-3 border border-gray-200 rounded-lg text-[13.5px] text-right bg-white tabular-nums"
           :class="full ? 'w-full h-10' : 'w-28 h-9'"
           @input="$emit('update:modelValue', $event.target.value === '' ? 0 : Number($event.target.value))"
           @click.stop/>
    <span class="text-[12.5px] text-muted whitespace-nowrap">₺{{ suffix }}</span>
  </span>
</template>

<script setup>
defineProps({
  modelValue: [Number, String],
  suffix: { type: String, default: '' },
  full: Boolean
})
defineEmits(['update:modelValue'])
</script>
