import axios from 'axios'

const api = axios.create({
  baseURL: 'https://driving-gladly-outcome.ngrok-free.dev/api/',
  timeout: 10000,
  headers: { 'ngrok-skip-browser-warning': 'true' }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default {
  // Auth
  login:    (d) => api.post('auth/login', d),

  // Tenant
  register:          (d)  => api.post('tenants/register', d),
  getMyTenant:       ()   => api.get('tenants/me'),
  getAllTenants:      ()   => api.get('tenants'),
  updateSubscription:(id, d) => api.put(`tenants/${id}/subscription`, d),
  deleteTenant:      (id) => api.delete(`tenants/${id}`),

  // Dashboard
  dashboard: () => api.get('reports/dashboard'),

  // Ürünler
  getProducts:    ()       => api.get('products'),
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

  // Raporlar
  getXReport:     ()     => api.get('reports/xreport'),
  takeZReport:    ()     => api.post('reports/zreport'),
  getZReports:    ()     => api.get('reports/zreports'),
  getDailyReport: (date) => api.get(`reports/daily?date=${date}`),
}