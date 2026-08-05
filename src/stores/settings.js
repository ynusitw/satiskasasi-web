import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'satiskasasi_settings_v1'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export const useSettingsStore = defineStore('settings', () => {
  const saved = load()

  const theme = ref(saved?.theme ?? 'system')

  const notifications = ref(saved?.notifications ?? {
    zRaporuEmail:       false,
    stokUyarisi:        true,
    hataliGirisUyarisi: true,
  })

  watch([theme, notifications], () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      theme:         theme.value,
      notifications: notifications.value,
    }))
    applyTheme(theme.value)
  }, { deep: true })

  function applyTheme(t) {
    const html = document.documentElement
    html.classList.remove('theme-dark', 'theme-light')

    if (t === 'dark') {
      html.classList.add('theme-dark')
    } else if (t === 'light') {
      html.classList.add('theme-light')
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        html.classList.add('theme-dark')
      }
    }
  }

  // Sistem teması değişince güncelle
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (theme.value === 'system') {
      document.documentElement.classList.toggle('theme-dark', e.matches)
    }
  })

  function init() {
    applyTheme(theme.value)
  }

  return { theme, notifications, init }
})
