<template>
  <!-- Uygulama içi onay / uyarı / metin isteme penceresi (utils/dialog.js) -->
  <Teleport to="body">
    <div v-if="d.open" class="fixed inset-0 z-[100] bg-slate-900/45 backdrop-blur-[2px] flex items-center justify-center p-4"
         @mousedown.self="cancel" @keydown.esc.prevent="cancel">
      <div ref="box" role="dialog" aria-modal="true" tabindex="-1"
           class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 outline-none">
        <h2 v-if="d.title" class="modal-title mb-2">{{ d.title }}</h2>
        <p v-if="d.message" class="text-[14px] text-primary leading-relaxed whitespace-pre-line">{{ d.message }}</p>

        <!-- Tarayıcı otomatik doldurması ve parola yöneticileri bu alana karışmaz -->
        <form v-if="d.kind === 'prompt'" class="mt-4" autocomplete="off" @submit.prevent="ok">
          <textarea v-if="d.multiline" ref="input" v-model="d.value" rows="3" :placeholder="d.placeholder"
                    autocomplete="off" spellcheck="false" data-lpignore="true" data-1p-ignore data-form-type="other"
                    class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] bg-white resize-none"></textarea>
          <input v-else ref="input" v-model="d.value" type="text" :name="fieldName" :placeholder="d.placeholder"
                 autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
                 data-lpignore="true" data-1p-ignore data-form-type="other"
                 class="w-full px-3 h-11 border rounded-lg text-[14px] bg-white"
                 :class="d.requireText && d.value && !matches ? 'border-red-300' : 'border-gray-200'"/>
          <p v-if="d.requireText" class="text-xs mt-1.5" :class="matches ? 'text-success' : 'text-muted'">
            {{ matches ? 'Eşleşti.' : `Onaylamak için "${d.requireText}" yazın.` }}
          </p>
        </form>

        <div class="flex justify-end gap-2 mt-6">
          <button v-if="d.kind !== 'alert'" type="button" class="btn-secondary" @click="cancel">{{ d.cancelText }}</button>
          <button ref="okBtn" type="button" :class="d.danger ? 'btn-danger-solid' : 'btn-primary'"
                  :disabled="d.kind === 'prompt' && !canOk" @click="ok">{{ d.confirmText }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { dialogState as d, closeDialog } from '../utils/dialog'

const box = ref(null)
const input = ref(null)
const okBtn = ref(null)
// Her açılışta farklı ad: tarayıcı geçmiş girişlerden öneri getirmesin
const fieldName = ref('')

const norm = s => String(s ?? '').trim().toLocaleLowerCase('tr-TR')
const matches = computed(() => !d.requireText || norm(d.value) === norm(d.requireText))
const canOk = computed(() => matches.value)

function ok() {
  if (d.kind === 'prompt' && !canOk.value) return
  closeDialog(true)
}
function cancel() { closeDialog(false) }

function onKey(e) {
  if (!d.open) return
  if (e.key === 'Escape') { e.preventDefault(); cancel() }
  else if (e.key === 'Enter' && d.kind !== 'prompt' && !e.shiftKey) { e.preventDefault(); ok() }
}

watch(() => d.open, async open => {
  if (open) {
    fieldName.value = 'f' + Math.random().toString(36).slice(2)
    window.addEventListener('keydown', onKey)
    await nextTick()
    if (d.kind === 'prompt') { input.value?.focus(); input.value?.select?.() }
    else okBtn.value?.focus()
  } else {
    window.removeEventListener('keydown', onKey)
  }
})
</script>
