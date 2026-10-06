import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api/api'

// Okunmamış bildirim sayısı: kenar menüsündeki rozet ve Bildirimler sayfası
// aynı değeri kullanır. Menü dakikada bir tazeler.
export const useNotificationsStore = defineStore('notifications', () => {
  const unread = ref(0)

  async function refresh() {
    try {
      unread.value = (await api.getUnreadNotificationCount()).data?.unread ?? 0
    } catch { /* sessiz: rozet bir sonraki turda düzelir */ }
  }

  function set(n) { unread.value = Math.max(0, n) }

  return { unread, refresh, set }
})
