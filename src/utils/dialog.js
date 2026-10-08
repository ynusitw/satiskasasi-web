// Uygulama içi onay / uyarı / metin isteme pencereleri.
//
// Tarayıcının confirm/alert/prompt kutuları yerine kullanılır: panelin
// tasarımında görünür, tarayıcı otomatik doldurması karışmaz. Tek pencere
// App.vue'da (AppDialog) çizilir; buradaki fonksiyonlar Promise döner:
//   if (!(await uiConfirm('Silinsin mi?'))) return
//   await uiAlert('Kaydedilemedi.')
//   const name = await uiPrompt('Sayım adı', 'Ekim sayımı')   // vazgeçilirse null
import { reactive } from 'vue'

export const dialogState = reactive({
  open: false,
  kind: 'confirm',        // confirm | alert | prompt
  title: '',
  message: '',
  confirmText: 'Tamam',
  cancelText: 'Vazgeç',
  danger: false,
  value: '',
  placeholder: '',
  requireText: null,      // prompt: yalnızca bu metin yazılınca onaylanır
  multiline: false,
  resolve: null,
})

// Geri alınamaz işlemler kırmızı düğmeyle gösterilir
const DANGER = /\b(sil|silin|silinsin|silinecek|kald[ıi]r|iptal|s[ıi]f[ıi]rla|reddet|kapat)/i

function open(kind, message, opts = {}) {
  // Açık pencere varsa önceki "vazgeç" sayılır
  if (dialogState.resolve) dialogState.resolve(dialogState.kind === 'confirm' ? false : dialogState.kind === 'prompt' ? null : undefined)
  return new Promise(resolve => {
    Object.assign(dialogState, {
      open: true,
      kind,
      title: opts.title ?? (kind === 'alert' ? 'Uyarı' : kind === 'prompt' ? '' : 'Onay'),
      message: String(message ?? ''),
      confirmText: opts.confirmText ?? (kind === 'alert' ? 'Tamam' : kind === 'prompt' ? 'Tamam' : 'Evet'),
      cancelText: opts.cancelText ?? 'Vazgeç',
      danger: opts.danger ?? (kind !== 'alert' && DANGER.test(`${opts.title ?? ''} ${message}`)),
      value: opts.defaultValue ?? '',
      placeholder: opts.placeholder ?? '',
      requireText: opts.requireText ?? null,
      multiline: !!opts.multiline,
      resolve,
    })
  })
}

export const uiConfirm = (message, opts) => open('confirm', message, opts)
export const uiAlert = (message, opts) => open('alert', message, opts)
export const uiPrompt = (message, defaultValue = '', opts = {}) => open('prompt', message, { ...opts, defaultValue })

/** Pencereyi kapatır; confirm → true/false, prompt → metin/null, alert → undefined. */
export function closeDialog(ok) {
  const { kind, resolve, value } = dialogState
  dialogState.open = false
  dialogState.resolve = null
  if (!resolve) return
  if (kind === 'confirm') resolve(!!ok)
  else if (kind === 'prompt') resolve(ok ? value : null)
  else resolve()
}
