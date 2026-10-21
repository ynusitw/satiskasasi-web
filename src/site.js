// Uygulamanın hangi adresten açıldığına göre kimlerin girebileceği belirlenir:
//   panel.yenpos.com   -> işletme kullanıcıları (süper admin giremez)
//   yonetim.yenpos.com -> yalnızca süper admin (ADMIN 1)
//   diğerleri (localhost, *.vercel.app) -> kısıtlama yok (geliştirme / yedek erişim)
export const PANEL_URL = 'https://panel.yenpos.com'
export const YONETIM_URL = 'https://yonetim.yenpos.com'

const host = window.location.hostname

export const SITE = host.startsWith('yonetim.') ? 'yonetim' : host.startsWith('panel.') ? 'panel' : 'hepsi'

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
