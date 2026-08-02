import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    component: () => import('../views/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/register',
    component: () => import('../views/Register.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('../views/Dashboard.vue'),
  },
  {
    path: '/products',
    component: () => import('../views/Products.vue'),
  },
  {
    path: '/categories',
    component: () => import('../views/Categories.vue'),
  },
  { path: '/reports',              redirect: '/reports/gunluk' },
  { path: '/reports/gunluk',      component: () => import('../views/reports/GunlukCiro.vue') },
  { path: '/reports/kasa',        component: () => import('../views/reports/KasaDefteri.vue') },
  { path: '/reports/z-listesi',   component: () => import('../views/reports/ZListesi.vue') },
  { path: '/reports/satis',       component: () => import('../views/reports/SatisRaporlari.vue') },
  { path: '/reports/iptaller',    component: () => import('../views/reports/Iptaller.vue') },
  { path: '/reports/masalar',     component: () => import('../views/reports/Masalar.vue') },
  { path: '/reports/stoklar',     component: () => import('../views/reports/Stoklar.vue') },
  {
    path: '/users',
    component: () => import('../views/Users.vue'),
  },
  { path: '/cari',              redirect: '/cari/kartlar' },
  { path: '/cari/kartlar',   component: () => import('../views/cari/CariKartlar.vue') },
  { path: '/cari/faturalar', component: () => import('../views/cari/Faturalar.vue') },
  { path: '/cari/kasa',      component: () => import('../views/cari/KasaIslemleri.vue') },
  { path: '/cari/ekstre',    component: () => import('../views/cari/Ekstre.vue') },
  {
    path: '/subscription',
    component: () => import('../views/Subscription.vue'),
  },
  {
    path: '/superadmin',
    component: () => import('../views/SuperAdmin.vue'),
    meta: { superAdminOnly: true }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const token       = localStorage.getItem('token')
  const isSuperAdmin= localStorage.getItem('isSuperAdmin') === 'true'

  if (!to.meta.public && !token) return '/login'
  if (to.meta.superAdminOnly && !isSuperAdmin) return '/'
})

export default router