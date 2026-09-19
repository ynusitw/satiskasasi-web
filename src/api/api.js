import axios from 'axios'

const api = axios.create({
  baseURL: 'https://driving-gladly-outcome.ngrok-free.dev/api/',
  timeout: 10000,
  headers: { 'ngrok-skip-browser-warning': 'true' }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  // Not: licenses/request ve licenses/status kasadan (WPF) anonim çağrılır,
  // Vue admin panelinden hiç kullanılmaz — burada hariç tutulmalarına gerek
  // yok (ve "licenses/request" alt dizesi "licenses/requests" (süper admin,
  // token gerekli) ile çakışıp yanlışlıkla onu da token'sız bırakıyordu).
  const isAuthEndpoint = config.url?.includes('auth/login')
  if (token && !isAuthEndpoint) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    const isLoginEndpoint = err.config?.url?.includes('auth/login')
    if (err.response?.status === 401 && !isLoginEndpoint) {
      localStorage.clear()
      window.location.href = '/login'
    }
    // Sunucu "bu modül lisansınızda yok" dediyse elimizdeki modül listesi
    // eskimiş demektir (yönetici kapatmış olabilir). App bu olayı dinleyip
    // listeyi tazeler; menü kendiliğinden düzelir. (Depoyu burada doğrudan
    // içe aktarmıyoruz: depo da bu dosyayı kullandığı için döngü olurdu.)
    if (err.response?.status === 403 && err.response?.data?.module) {
      window.dispatchEvent(new CustomEvent('module-denied', {
        detail: err.response.data.module
      }))
    }
    return Promise.reject(err)
  }
)

// Doğrudan <img src> ile yüklenen (XHR olmayan) kaynaklar için mutlak adres.
export const API_BASE = api.defaults.baseURL

export default {
  // Auth
  login:    (d) => api.post('auth/login', d),

  // Tenant
  register:          (d)  => api.post('tenants/register', d),
  getMyTenant:       ()   => api.get('tenants/me'),
  getAllTenants:      ()   => api.get('tenants'),
  updateSubscription:(id, d) => api.put(`tenants/${id}/subscription`, d),
  deleteTenant:      (id) => api.delete(`tenants/${id}`),
  updateMenuSettings: (d) => api.put('tenants/me/menu-settings', d),

  // Lisans
  getLicenses:        ()       => api.get('licenses'),
  getLicenseRequests: ()       => api.get('licenses/requests'),
  approveLicense:     (id, d)  => api.post(`licenses/requests/${id}/approve`, d),

  // ── Modüler lisanslama ─────────────────────────────────────────────
  getModuleCatalog:   ()        => api.get('modules'),              // seçilebilir modüller
  getMyModules:       ()        => api.get('modules/me'),           // oturumdaki müşterinin aktif modülleri
  getTenantModules:   (tid)     => api.get(`modules/tenant/${tid}`),
  setTenantModules:   (tid, codes) => api.put(`modules/tenant/${tid}`, { moduleCodes: codes }),
  rejectLicense:      (id, d)  => api.post(`licenses/requests/${id}/reject`, d),
  revokeLicense:      (id)     => api.post(`licenses/${id}/revoke`),

  // Paketler
  getPlans:   ()       => api.get('plans'),
  createPlan: (d)      => api.post('plans', d),
  updatePlan: (id, d)  => api.put(`plans/${id}`, d),
  deletePlan: (id)     => api.delete(`plans/${id}`),

  // Dijital Menü (herkese açık)
  // Menü yanıtı fotoğraflar yüzünden büyük ve ngrok tüneli yavaş (~64 KB/sn);
  // 10 sn'lik genel zaman aşımı isteği kesip menüyü "bulunamadı" gösteriyordu.
  getPublicMenu: (slug) => api.get(`menu/${slug}`, { timeout: 60000 }),

  // Dijital Menü yapılandırması (öne çıkanlar + kategori görselleri)
  getMenuConfig:  ()  => api.get('menu/config'),
  saveMenuConfig: (d) => api.put('menu/config', d),

  // Dashboard
  dashboard: () => api.get('reports/dashboard'),

  // Ürünler
  getProducts:    ()       => api.get('products'),
  // Pasifler dahil — yalnızca ürün yönetim ekranı kullanır
  getProductsAll: ()       => api.get('products?includeInactive=true'),
  createProduct:  (d)      => api.post('products', d),
  updateProduct:  (id, d)  => api.put(`products/${id}`, d),
  deleteProduct:  (id)     => api.delete(`products/${id}`),

  // Kategoriler
  getCategories:  ()       => api.get('categories'),
  createCategory: (d)      => api.post('categories', d),
  updateCategory: (id, d)  => api.put(`categories/${id}`, d),
  deleteCategory: (id)     => api.delete(`categories/${id}`),

  // Kullanıcılar
  getUsers:    ()       => api.get('users'),
  createUser:  (d)      => api.post('users', d),
  updateUser:  (id, d)  => api.put(`users/${id}`, d),
  deleteUser:  (id)     => api.delete(`users/${id}`),

  // Cari (Müşteri)
  getCaris:           ()        => api.get('cari'),
  createCari:         (d)       => api.post('cari', d),
  updateCari:         (id, d)   => api.put(`cari/${id}`, d),
  deleteCari:         (id)      => api.delete(`cari/${id}`),
  getCariTransactions:(id)      => api.get(`cari/${id}/transactions`),
  addCariTransaction: (id, d)   => api.post(`cari/${id}/transactions`, d),

  // Bölümler
  // ── Hızlı Notlar (sipariş satırı kısayolları) ──────────────────────
  // includeInactive: yönetim ekranı pasifleri de görsün; kasa yalnızca
  // aktifleri çeker.
  getQuickNotes:    (includeInactive = false) =>
                      api.get(`quicknotes${includeInactive ? '?includeInactive=true' : ''}`),
  createQuickNote:  (d)      => api.post('quicknotes', d),
  updateQuickNote:  (id, d)  => api.put(`quicknotes/${id}`, d),
  deleteQuickNote:  (id)     => api.delete(`quicknotes/${id}`),
  reorderQuickNotes:(ids)    => api.put('quicknotes/order', ids),

  getSections:    ()       => api.get('sections'),
  createSection:  (d)      => api.post('sections', d),
  updateSection:  (id, d)  => api.put(`sections/${id}`, d),
  deleteSection:  (id)     => api.delete(`sections/${id}`),

  // Masalar
  getTables:      ()       => api.get('tables'),
  createTable:    (d)      => api.post('tables', d),
  updateTable:    (id, d)  => api.put(`tables/${id}`, d),
  deleteTable:    (id)     => api.delete(`tables/${id}`),
  setTableStatus: (id, s)  => api.post(`tables/${id}/status`, { status: s }),

  // Yazıcı / Fiş Ayarları
  getPrinterSettings:     ()  => api.get('settings/printer'),
  updatePrinterSettings:  (d) => api.put('settings/printer', d),
  getAvailablePrinters:   ()  => api.get('settings/printer/available'),
  getCategoryRoutings:    ()  => api.get('settings/printer/routing'),
  saveCategoryRoutings:   (d) => api.put('settings/printer/routing', d),
  getTableSettings:       ()  => api.get('settings/tables'),
  updateTableSettings:    (d) => api.put('settings/tables', d),

  // Auth logları
  getFailedAttempts: ()  => api.get('auth/failed-attempts'),
  getSessions:       ()  => api.get('auth/sessions'),
  revokeAllSessions: ()  => api.post('auth/sessions/revoke-all'),

  // Raporlar
  getXReport:     ()     => api.get('reports/xreport'),
  takeZReport:    ()     => api.post('reports/zreport'),
  getZReports:    ()     => api.get('reports/zreports'),
  getDailyReport: (date) => api.get(`reports/daily?date=${date}`),
}