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

  // Kasa Yapılandırma — sayfalar henüz oluşturulmadı, placeholder route
  { path: '/settings',                redirect: '/settings/masa-ayarlari' },
  { path: '/settings/masa-ayarlari',   component: () => import('../views/settings/MasaAyarlari.vue') },
  { path: '/settings/fis-ayarlari',    redirect: '/settings/receipt' },
  { path: '/settings/receipt',         component: () => import('../views/settings/ReceiptSettings.vue') },
  { path: '/settings/yazici-ayarlari', component: () => import('../views/settings/YaziciAyarlari.vue') },
  { path: '/settings/musteri-ekrani',  component: { template: '<div class="p-8"><h1 class="text-2xl font-bold text-primary">Müşteri Ekranı Ayarı</h1><p class="text-muted mt-2">Sayfa yapım aşamasında...</p></div>' } },
  { path: '/settings/okc-durum',       component: { template: '<div class="p-8"><h1 class="text-2xl font-bold text-primary">ÖKC Durum</h1><p class="text-muted mt-2">Sayfa yapım aşamasında...</p></div>' } },
  { path: '/settings/terminal',        component: { template: '<div class="p-8"><h1 class="text-2xl font-bold text-primary">Terminal Ayarları</h1><p class="text-muted mt-2">Sayfa yapım aşamasında...</p></div>' } },
  {
    path: '/subscription',
    component: () => import('../views/Subscription.vue'),
  },
  {
    path: '/superadmin',
    component: () => import('../views/SuperAdmin.vue'),
    meta: { superAdminOnly: true }
  },
  {
    path: '/superadmin/gelir',
    component: () => import('../views/SuperAdminGelir.vue'),
    meta: { superAdminOnly: true }
  },
  {
    path: '/superadmin/paketler',
    component: () => import('../views/SuperAdminPaketler.vue'),
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