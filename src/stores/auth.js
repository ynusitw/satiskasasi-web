import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api/api'

export const useAuthStore = defineStore('auth', () => {
  const token       = ref(localStorage.getItem('token')       || '')
  const username    = ref(localStorage.getItem('username')    || '')
  const isAdmin     = ref(localStorage.getItem('isAdmin')     === 'true')
  const isSuperAdmin= ref(localStorage.getItem('isSuperAdmin')=== 'true')
  const tenantId    = ref(localStorage.getItem('tenantId')    || '')
  const tenantName  = ref(localStorage.getItem('tenantName')  || '')
  const tenantPlan  = ref(localStorage.getItem('tenantPlan')  || '')
  const tenantExpires = ref(localStorage.getItem('tenantExpires') || '')

  const isLoggedIn  = computed(() => !!token.value)

  async function login(u, p) {
    const res = await api.login({ username: u, password: p })
    const d   = res.data

    token.value        = d.token
    username.value     = d.username
    isAdmin.value      = d.isAdmin
    isSuperAdmin.value = d.isSuperAdmin
    tenantId.value     = d.tenantId
    tenantName.value   = d.tenantName
    tenantPlan.value   = d.tenantPlan
    tenantExpires.value= d.tenantExpires

    localStorage.setItem('token',         d.token)
    localStorage.setItem('username',      d.username)
    localStorage.setItem('isAdmin',       d.isAdmin)
    localStorage.setItem('isSuperAdmin',  d.isSuperAdmin)
    localStorage.setItem('tenantId',      d.tenantId)
    localStorage.setItem('tenantName',    d.tenantName)
    localStorage.setItem('tenantPlan',    d.tenantPlan)
    localStorage.setItem('tenantExpires', d.tenantExpires || '')
  }

  function logout() {
    token.value = ''
    localStorage.clear()
  }

  return {
    token, username, isAdmin, isSuperAdmin,
    tenantId, tenantName, tenantPlan, tenantExpires,
    isLoggedIn, login, logout
  }
})