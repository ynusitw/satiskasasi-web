import axios from 'axios'
const api = axios.create({ baseURL: 'http://92.4.79.69:5000/api/', timeout: 10000 })
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
api.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401) { localStorage.removeItem('token'); window.location.href = '/login' }
  return Promise.reject(err)
})
export default {
  login: (d) => api.post('auth/login', d),
  dashboard: () => api.get('reports/dashboard'),
  getProducts: () => api.get('products'),
  createProduct: (d) => api.post('products', d),
  updateProduct: (id, d) => api.put(`products/${id}`, d),
  deleteProduct: (id) => api.delete(`products/${id}`),
  getCategories: () => api.get('categories'),
  createCategory: (d) => api.post('categories', d),
  updateCategory: (id, d) => api.put(`categories/${id}`, d),
  deleteCategory: (id) => api.delete(`categories/${id}`),
  getUsers: () => api.get('users'),
  createUser: (d) => api.post('users', d),
  updateUser: (id, d) => api.put(`users/${id}`, d),
  deleteUser: (id) => api.delete(`users/${id}`),
  getXReport: () => api.get('reports/xreport'),
  takeZReport: () => api.post('reports/zreport'),
  getZReports: () => api.get('reports/zreports'),
  getDailyReport: (date) => api.get(`reports/daily?date=${date}`),
}
