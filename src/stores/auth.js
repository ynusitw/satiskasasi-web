import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api/api'
export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const username = ref(localStorage.getItem('username') || '')
  const isAdmin = ref(localStorage.getItem('isAdmin') === 'true')
  const isLoggedIn = computed(() => !!token.value)
  async function login(u, p) {
    const res = await api.login({ username: u, password: p })
    token.value = res.data.token
    username.value = res.data.username
    isAdmin.value = res.data.isAdmin
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('username', res.data.username)
    localStorage.setItem('isAdmin', res.data.isAdmin)
  }
  function logout() {
    token.value = ''; username.value = ''; isAdmin.value = false
    localStorage.clear()
  }
  return { token, username, isAdmin, isLoggedIn, login, logout }
})
