// Uygulamanın hangi adresten açıldığına göre kimlerin girebileceği belirlenir:
//   panel.yenpos.com   -> işletme kullanıcıları (süper admin giremez)
//   yonetim.yenpos.com -> yalnızca süper admin (ADMIN 1)
//   menu.yenpos.com    -> yalnızca müşterinin açtığı QR menü: menu.yenpos.com/{işletme}
//   diğerleri (localhost, *.vercel.app) -> kısıtlama yok (geliştirme / yedek erişim)
export const PANEL_URL = 'https://panel.yenpos.com'
export const YONETIM_URL = 'https://yonetim.yenpos.com'
export const MENU_URL = 'https://menu.yenpos.com'

const host = window.location.hostname

export const SITE = host.startsWith('yonetim.') ? 'yonetim'
  : host.startsWith('panel.') ? 'panel'
  : host.startsWith('menu.') ? 'menu'
  : 'hepsi'

/**
 * Müşteriye verilen (QR'a basılan) menü adresi. Canlı panelde kısa adres
 * menu.yenpos.com/{işletme}; geliştirme / yedek adreste bu adres + /menu/{işletme}.
 * Eski panel.yenpos.com/menu/{işletme} QR'ları da çalışmaya devam eder.
 */
export function publicMenuUrl(slug) {
  return SITE === 'panel' ? `${MENU_URL}/${slug}` : `${window.location.origin}/menu/${slug}`
}

/** Bu adreste bu kullanıcı girebilir mi? Giremiyorsa kullanıcıya gösterilecek mesajı döner. */
export function loginBlockReason(isSuperAdmin) {
  if (SITE === 'yonetim' && !isSuperAdmin) {
    return `Bu adres yalnızca yönetici girişi içindir. İşletme hesabınızla ${PANEL_URL.replace('https://', '')} adresinden giriş yapın.`
  }
  if (SITE === 'panel' && isSuperAdmin) {
    return `Yönetici hesabı yalnızca ${YONETIM_URL.replace('https://', '')} adresinden giriş yapabilir.`
  }
  return ''
}
