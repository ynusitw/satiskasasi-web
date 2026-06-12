<template>
  <div class="bg-white rounded-2xl p-5 shadow-sm">
    <div :class="['w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3', color]">{{ icon }}</div>
    <div class="text-xs font-semibold text-muted uppercase tracking-wide mb-1">{{ label }}</div>
    <div class="text-2xl font-bold text-primary">{{ value }}</div>
    <div v-if="sub" class="text-xs text-muted mt-1">{{ sub }}</div>
  </div>
</template>
<script setup>
defineProps({ label: String, value: [String, Number], icon: String, color: String, sub: String })
</script>
