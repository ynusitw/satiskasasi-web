// Satış CRM'inin verisi: sunucudan (api/crm) bir kez yüklenir, işlemler sunucuya
// yazılır ve dönen kayıt yerinde güncellenir. Bütün CRM sayfaları aynı durumu paylaşır.
import { reactive } from 'vue'
import api from '../api/api'

export const crm = reactive({
  loaded: false,
  loading: false,
  error: '',
  leads: [],
  templates: [],
  defaultTemplates: [],
  settings: null,
  aiEnabled: false,
})

export async function loadCrm(force = false) {
  if (crm.loading || (crm.loaded && !force)) return
  crm.loading = true
  crm.error = ''
  try {
    const { data } = await api.crmState()
    Object.assign(crm, data, { loaded: true })
  } catch (e) {
    crm.error = e.response?.data?.message || 'CRM verisi alınamadı. Bağlantıyı kontrol edin.'
  } finally {
    crm.loading = false
  }
}

function replaceLead(updated) {
  const i = crm.leads.findIndex(l => l.id === updated.id)
  if (i >= 0) crm.leads[i] = updated
}

async function change(call) {
  const { data } = await call()
  replaceLead(data)
  return data
}

export const crmActions = {
  markSent: (id, text) => change(() => api.crmMarkSent(id, text)),
  skip: (id, days = 1) => change(() => api.crmSkip(id, days)),
  setStatus: (id, status) => change(() => api.crmSetStatus(id, status)),
  setNotes: (id, text) => change(() => api.crmSetNotes(id, text)),
  async remove(id) {
    await api.crmRemove(id)
    crm.leads = crm.leads.filter(l => l.id !== id)
  },
  /** Yeni adaylar: aynı anahtar / telefon iki kez eklenmez. Sonra liste yeniden yüklenir. */
  async addLeads(leads) {
    const { data } = await api.crmAddLeads(leads)
    await loadCrm(true)
    return data
  },
  async saveTemplates(list) {
    const { data } = await api.crmSaveTemplates(list)
    crm.templates = data
  },
  async saveSettings(s) {
    const { data } = await api.crmSaveSettings(s)
    crm.settings = data
  },
}
