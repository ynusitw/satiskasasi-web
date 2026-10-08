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
    // Mutfaktaki ekran: oturum yok, adresteki istasyon kodu yetkidir.
    path: '/mutfak/:token',
    component: () => import('../views/KitchenDisplay.vue'),
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
  { path: '/reports/indirim-ikram', component: () => import('../views/reports/IndirimIkram.vue') },
  { path: '/reports/masalar',     component: () => import('../views/reports/Masalar.vue'), meta: { module: MODULES.TABLES } },
  { path: '/reports/stoklar',     component: () => import('../views/reports/Stoklar.vue'), meta: { module: MODULES.STOCK } },
  { path: '/reports/karlilik',    component: () => import('../views/reports/Karlilik.vue'), meta: { module: MODULES.STOCK } },
  {
    path: '/recipes',
    component: () => import('../views/RecipeCenter.vue'),
    meta: { module: MODULES.STOCK },
  },
  {
    path: '/ingredients',
    component: () => import('../views/Ingredients.vue'),
    meta: { module: MODULES.STOCK },
  },
  {
    // Garson telefonu: yönetici kabuğu olmadan, telefona göre tam ekran
    path: '/garson',
    component: () => import('../views/Waiter.vue'),
    meta: { module: MODULES.WAITER }
  },
  {
    // Toplu hammadde sayımı ve fark raporu
    path: '/stock-count',
    component: () => import('../views/StockCount.vue'),
    meta: { module: MODULES.STOCK }
  },
  {
    // Tüketim hızına göre tedarikçi bazlı sipariş listesi
    path: '/purchasing',
    component: () => import('../views/PurchaseSuggestions.vue'),
    meta: { module: MODULES.STOCK }
  },
  {
    path: '/modifiers',
    component: () => import('../views/Modifiers.vue'),
  },
  {
    // Saatlik indirim, X al Y öde, sepet indirimi
    path: '/campaigns',
    component: () => import('../views/Campaigns.vue'),
  },
  {
    path: '/users',
    component: () => import('../views/Users.vue'),
  },
  { path: '/notifications', component: () => import('../views/Notifications.vue') },
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
  { path: '/settings/mutfak-ekrani',   component: () => import('../views/settings/KitchenSettings.vue'), meta: { module: MODULES.KITCHEN } },
  { path: '/settings/fis-ayarlari',    redirect: '/settings/receipt' },
  { path: '/settings/receipt',         component: () => import('../views/settings/ReceiptSettings.vue') },
  // Yazıcı ayarları fiş sayfasıyla birleştirildi; eski bağlantılar oraya gider.
  { path: '/settings/yazici-ayarlari', redirect: '/settings/receipt' },
  { path: '/settings/musteri-ekrani',  component: () => import('../views/settings/MusteriEkrani.vue') },
  { path: '/settings/terminal',        component: () => import('../views/settings/TerminalAyarlari.vue') },
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
    redirect: '/superadmin/lisans/aktif',
    meta: { superAdminOnly: true }
  },
  {
    path: '/superadmin/lisans-talepleri',
    redirect: '/superadmin/lisans/bekleyen',
    meta: { superAdminOnly: true }
  },
  // Lisansın tamamı tek sayfada: aktif / bekleyen / reddedilen sekmeleri.
  { path: '/superadmin/lisans', redirect: '/superadmin/lisans/aktif' },
  {
    path: '/superadmin/destek',
    component: () => import('../views/SupportCenter.vue'),
    meta: { superAdminOnly: true }
  },
  {
    path: '/superadmin/lisans/:tab(aktif|bekleyen|reddedilen)',
    component: () => import('../views/licenses/LicenseCenter.vue'),
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

  // Giriş sonrası istenen sayfaya dönülür (ör. garson telefonda /garson açar)
  if (!to.meta.public && !token)
    return to.path === '/' ? '/login' : { path: '/login', query: { next: to.fullPath } }
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