import { createRouter, createWebHistory } from 'vue-router'
import { useModulesStore } from '../stores/modules'
import { MODULES } from '../constants/modules'

const routes = [
  {
    path: '/login',
    component: () => import('../views/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/menu/:slug',
    component: () => import('../views/PublicMenuView.vue'),
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
  { path: '/reports/masalar',     component: () => import('../views/reports/Masalar.vue'), meta: { module: MODULES.TABLES } },
  { path: '/reports/stoklar',     component: () => import('../views/reports/Stoklar.vue'), meta: { module: MODULES.STOCK } },
  {
    path: '/users',
    component: () => import('../views/Users.vue'),
  },
  { path: '/cari',              redirect: '/cari/kartlar' },
  { path: '/cari/kartlar',   component: () => import('../views/cari/CariKartlar.vue'), meta: { module: MODULES.CARI } },
  { path: '/cari/faturalar', component: () => import('../views/cari/Faturalar.vue'), meta: { module: MODULES.CARI } },
  { path: '/cari/kasa',      component: () => import('../views/cari/KasaIslemleri.vue'), meta: { module: MODULES.CARI } },
  { path: '/cari/ekstre',    component: () => import('../views/cari/Ekstre.vue'), meta: { module: MODULES.CARI } },

  // Kasa Yapılandırma — sayfalar henüz oluşturulmadı, placeholder route
  // Her müşteride açık olan sayfaya yönlenir; masa modülü kapalıysa
  // eski hedef (masa ayarları) yetkisiz sayfaya düşürüyordu.
  { path: '/settings',                redirect: '/settings/receipt' },
  { path: '/settings/masa-ayarlari',   component: () => import('../views/settings/MasaAyarlari.vue'), meta: { module: MODULES.TABLES } },
  { path: '/settings/hizli-notlar',    component: () => import('../views/settings/HizliNotlar.vue'), meta: { module: MODULES.TABLES } },
  { path: '/settings/dijital-menu',    component: () => import('../views/settings/DigitalMenuView.vue'), meta: { module: MODULES.QR_MENU } },
  { path: '/settings/fis-ayarlari',    redirect: '/settings/receipt' },
  { path: '/settings/receipt',         component: () => import('../views/settings/ReceiptSettings.vue') },
  // Yazıcı ayarları fiş sayfasıyla birleştirildi; eski bağlantılar oraya gider.
  { path: '/settings/yazici-ayarlari', redirect: '/settings/receipt' },
  { path: '/settings/musteri-ekrani',  component: { template: '<div class="p-8"><h1 class="text-2xl font-bold text-primary">Müşteri Ekranı Ayarı</h1><p class="text-muted mt-2">Sayfa yapım aşamasında...</p></div>' } },
  { path: '/settings/okc-durum',       component: { template: '<div class="p-8"><h1 class="text-2xl font-bold text-primary">ÖKC Durum</h1><p class="text-muted mt-2">Sayfa yapım aşamasında...</p></div>' }, meta: { module: MODULES.OKC } },
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
  {
    path: '/superadmin/lisanslar',
    component: () => import('../views/LicensesView.vue'),
    meta: { superAdminOnly: true }
  },
  {
    path: '/superadmin/lisans-talepleri',
    component: () => import('../views/LicenseRequestsView.vue'),
    meta: { superAdminOnly: true }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const token       = localStorage.getItem('token')
  const isSuperAdmin= localStorage.getItem('isSuperAdmin') === 'true'

  if (!to.meta.public && !token) return '/login'
  if (to.meta.superAdminOnly && !isSuperAdmin) return '/'

  // Lisans modülü: adres çubuğundan doğrudan girilse de sayfa açılmaz.
  // (Bu, kullanıcı deneyimi içindir; API modülü olmayan isteği zaten reddeder.)
  const required = to.meta.module
  if (required && token && !isSuperAdmin) {
    const modules = useModulesStore()
    // İlk gezinmede sunucudan teyit et — localStorage'daki liste eski olabilir
    // (yönetici modülü kapatmış olabilir).
    await modules.ensureLoaded()
    if (!modules.has(required)) {
      return { path: '/', query: { yetkisiz: required } }
    }
  }
})

export default router