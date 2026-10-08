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
  const isAuthEndpoint = config.url?.includes('auth/login') || config.url?.includes('auth/2fa/verify')
  if (token && !isAuthEndpoint) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    const isLoginEndpoint = err.config?.url?.includes('auth/login') || err.config?.url?.includes('auth/2fa/verify')
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
  // Rezervasyonlar
  getReservations:      (date)      => api.get('reservations', { params: { date } }),
  createReservation:    (d)         => api.post('reservations', d),
  updateReservation:    (id, d)     => api.put(`reservations/${id}`, d),
  setReservationStatus: (id, status) => api.post(`reservations/${id}/status`, { status }),
  deleteReservation:    (id)        => api.delete(`reservations/${id}`),

  // Garson telefonu
  waiterFloor: ()          => api.get('waiter/floor'),
  waiterMenu:  ()          => api.get('waiter/menu'),
  waiterTable: (id)        => api.get(`waiter/table/${id}`),
  waiterAdd:   (id, d)     => api.post(`waiter/table/${id}/add`, d),

  // Toplu stok sayımı
  getStockCounts:        ()          => api.get('stock-counts'),
  getStockCount:         (id)        => api.get(`stock-counts/${id}`),
  createStockCount:      (d)         => api.post('stock-counts', d),
  saveStockCountLines:   (id, lines) => api.put(`stock-counts/${id}/lines`, lines),
  completeStockCount:    (id)        => api.post(`stock-counts/${id}/complete`),
  deleteStockCount:      (id)        => api.delete(`stock-counts/${id}`),

  // Sunucu durumu (süper yönetici)
  getSystemStatus:     ()      => api.get('system/status'),

  // Destek talepleri (müşteri ↔ süper yönetici)
  getSupportTickets:   ()      => api.get('support'),
  getSupportTicket:    (id)    => api.get(`support/${id}`),
  createSupportTicket: (d)     => api.post('support', d),
  replySupport:        (id, d) => api.post(`support/${id}/reply`, d),
  closeSupport:        (id)    => api.post(`support/${id}/close`),
  getSupportOpenCount: ()      => api.get('support/open-count'),

  // İki adımlı doğrulama
  verifyTwoFactor:  (d)  => api.post('auth/2fa/verify', d),
  getTwoFactor:     ()   => api.get('auth/2fa/status'),
  setupTwoFactor:   ()   => api.post('auth/2fa/setup'),
  enableTwoFactor:  (d)  => api.post('auth/2fa/enable', d),
  disableTwoFactor: (d)  => api.post('auth/2fa/disable', d),
  resetTwoFactor:   (id) => api.post(`auth/2fa/reset/${id}`),

  // Tenant
  register:          (d)  => api.post('tenants/register', d),
  getMyTenant:       ()   => api.get('tenants/me'),
  getAllTenants:      ()   => api.get('tenants'),
  updateSubscription:(id, d) => api.put(`tenants/${id}/subscription`, d),
  deleteTenant:      (id) => api.delete(`tenants/${id}`),
  updateMenuSettings: (d) => api.put('tenants/me/menu-settings', d),

  // Lisans
  getLicenses:        ()       => api.get('licenses'),
  // status: 'pending' (varsayılan) | 'rejected' | 'all'
  getLicenseRequests: (status)  => api.get('licenses/requests', { params: { status } }),
  reopenLicenseRequest: (id)    => api.post(`licenses/requests/${id}/reopen`),
  approveLicense:     (id, d)  => api.post(`licenses/requests/${id}/approve`, d),

  // ── Aşama 2: personel satışı ve indirim/ikram raporu ─────────────
  // Bildirim merkezi
  getNotifications:          (take = 50) => api.get('notifications', { params: { take } }),
  getUnreadNotificationCount: ()  => api.get('notifications/unread-count'),
  markNotificationRead:      (id) => api.post(`notifications/${id}/read`),
  markAllNotificationsRead:  ()   => api.post('notifications/read-all'),
  getNotificationSettings:   ()   => api.get('notifications/settings'),
  saveNotificationSettings:  (d)  => api.put('notifications/settings', d),
  sendTestNotification:      ()   => api.post('notifications/test'),
  // İşletmenin kendi e-posta sunucusu (şifre boş gönderilirse kayıtlı olan korunur)
  saveSmtpSettings:          (d)  => api.put('notifications/smtp', d),
  deleteSmtpSettings:        ()   => api.delete('notifications/smtp'),
  getCancellationSettings:  ()  => api.get('settings/cancellations'),
  saveCancellationSettings: (d) => api.put('settings/cancellations', d),
  getStaffSettings:   ()        => api.get('settings/staff'),
  saveStaffSettings:  (d)       => api.put('settings/staff', d),
  getAdjustmentsReport: (params) => api.get('reports/adjustments', { params }),
  // Ürün başına ciro, reçeteden maliyet, kâr ve marj
  getProfitability: (params) => api.get('reports/profitability', { params }),
  // Satış Raporları / Masalar / Stoklar / İptaller
  getSalesReport:        (params) => api.get('reports/sales', { params }),
  getTablesReport:       (params) => api.get('reports/tables', { params }),
  getStockReport:        ()       => api.get('reports/stock'),
  getCancellationsReport:(params) => api.get('reports/cancellations', { params }),

  // ── Aşama 3: hammadde, reçete ve çeşniler ──────────────────────────
  getIngredients:     (includeInactive) =>
    api.get('ingredients', { params: { includeInactive } }),
  createIngredient:   (d)      => api.post('ingredients', d),
  updateIngredient:   (id, d)  => api.put(`ingredients/${id}`, d),
  deleteIngredient:   (id)     => api.delete(`ingredients/${id}`),
  // Depoya giriş / fire / sayım. Stok yalnızca hareketle değişir.
  createIngredientMovement: (id, d) => api.post(`ingredients/${id}/movement`, d),
  getIngredientMovements:   (id)    => api.get(`ingredients/${id}/movements`),
  // Yalnızca reçeteyi yazar; ürünün diğer alanlarına dokunmaz.
  saveRecipe: (productId, d) => api.put(`products/${productId}/recipe`, d),
  // Kampanyalar
  getCampaigns:    ()      => api.get('campaigns'),
  createCampaign:  (d)     => api.post('campaigns', d),
  updateCampaign:  (id, d) => api.put(`campaigns/${id}`, d),
  toggleCampaign:  (id)    => api.post(`campaigns/${id}/toggle`),
  deleteCampaign:  (id)    => api.delete(`campaigns/${id}`),

  // Sipariş önerisi ve tedarikçiler
  getPurchaseSuggestions: ()        => api.get('purchasing/suggestions'),
  savePurchasingSettings: (d)       => api.put('purchasing/settings', d),
  savePurchasingItem:     (kind, id, d) => api.put(`purchasing/items/${kind}/${id}`, d),
  receivePurchase:        (d)       => api.post('purchasing/receive', d),
  createSupplier:         (d)       => api.post('purchasing/suppliers', d),
  updateSupplier:         (id, d)   => api.put(`purchasing/suppliers/${id}`, d),
  deleteSupplier:         (id)      => api.delete(`purchasing/suppliers/${id}`),

  // ── Cihazlar ve müşteri ekranı ─────────────────────────────────────
  getDeviceSettings:   ()  => api.get('settings/devices'),
  saveDeviceSettings:  (d) => api.put('settings/devices', d),
  // İşletmenin kasaları: cihaz bilgisi, son bağlantı, bekleyen kayıt
  getTenantTerminals:  ()  => api.get('settings/devices/kasalar'),
  getCustomerDisplay:  ()  => api.get('settings/customer-display'),
  saveCustomerDisplay: (d) => api.put('settings/customer-display', d),

  getModifierGroups:   (includeInactive) =>
    api.get('modifiers', { params: { includeInactive } }),
  createModifierGroup: (d)     => api.post('modifiers', d),
  updateModifierGroup: (id, d) => api.put(`modifiers/${id}`, d),
  deleteModifierGroup: (id)    => api.delete(`modifiers/${id}`),

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
  getPublicMenu: (slug, masa) => api.get(`menu/${slug}`, { timeout: 60000, params: masa ? { masa } : undefined }),
  placeQrOrder: (slug, d) => api.post(`menu/${slug}/order`, d, { timeout: 30000 }),
  getQrOrderStatus: (slug, code) => api.get(`menu/${slug}/order/${code}`),

  // Masadan sipariş yönetimi (panel)
  getQrOrderSettings:  ()   => api.get('qrorders/settings'),
  saveQrOrderSettings: (d)  => api.put('qrorders/settings', d),
  getQrOrderTables:    ()   => api.get('qrorders/tables'),
  regenerateQrToken:   (id) => api.post(`qrorders/tables/${id}/token`),
  getQrOrders:         (take = 50) => api.get('qrorders', { params: { take } }),

  // Mutfak ekranı — mutfaktaki cihaz (oturumsuz, istasyon koduyla)
  getKitchenDisplay:      (token) => api.get(`kitchen/display/${token}`),
  setKitchenTicketStatus: (token, id, status) => api.post(`kitchen/display/${token}/tickets/${id}/status`, { status }),
  setKitchenItemDone:     (token, itemId, done) => api.post(`kitchen/display/${token}/items/${itemId}/done`, { done }),
  // Mutfak ekranı — panel ayarları
  getKitchenStations:     ()        => api.get('kitchen/stations'),
  createKitchenStation:   (d)       => api.post('kitchen/stations', d),
  updateKitchenStation:   (id, d)   => api.put(`kitchen/stations/${id}`, d),
  deleteKitchenStation:   (id)      => api.delete(`kitchen/stations/${id}`),
  regenerateKitchenToken: (id)      => api.post(`kitchen/stations/${id}/token`),
  getKitchenCategories:   ()        => api.get('kitchen/categories'),
  saveKitchenCategories:  (list)    => api.put('kitchen/categories', list),
  getKitchenSettings:     ()        => api.get('kitchen/settings'),
  saveKitchenSettings:    (d)       => api.put('kitchen/settings', d),

  // Dijital Menü yapılandırması (öne çıkanlar + kategori görselleri)
  getMenuConfig:  ()  => api.get('menu/config'),
  saveMenuConfig: (d) => api.put('menu/config', d),

  // Dashboard
  dashboard: () => api.get('reports/dashboard'),
  // Pano satış trendi: range=period (Z dönemi) | week | month | year
  getTrend: (range) => api.get('reports/trend', { params: { range } }),

  // Ürünler
  getProducts:    ()       => api.get('products'),
  // Pasifler dahil — yalnızca ürün yönetim ekranı kullanır
  getProductsAll: ()       => api.get('products?includeInactive=true'),
  // Web menüde kullanılan büyük fotoğraf; liste yanıtında yalnızca küçüğü var.
  getProductLargeImage: (id) => api.get(`products/${id}/image`, { params: { size: 'large' } }),
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
  // Faturalar (cari ve stoğa işlenir; silinmez, iptal edilir)
  getInvoices:        ()        => api.get('invoices'),
  getInvoice:         (id)      => api.get(`invoices/${id}`),
  getNextInvoiceNo:   (type)    => api.get('invoices/next-no', { params: { type } }),
  createInvoice:      (d)       => api.post('invoices', d),
  cancelInvoice:      (id, d)   => api.post(`invoices/${id}/cancel`, d),

  // Tahsilat (amount > 0 bakiyeyi düşürür) ya da tediye (amount < 0)
  addCariTransaction: (id, d)   => api.post(`cari/${id}/payment`, d),

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