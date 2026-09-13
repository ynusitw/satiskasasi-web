/*
  Menü görselleri için geçit (proxy).

  Neden var: API ücretsiz bir ngrok tüneli arkasında ve ngrok, tarayıcı
  görünümlü isteklere gerçek yanıt yerine uyarı sayfası döndürüyor. Bunu
  atlatan "ngrok-skip-browser-warning" başlığını <img> etiketi gönderemediği
  için görselleri fetch+blob ile indirmek zorundaydık; o da her görsele bir
  CORS ön-uçuşu (OPTIONS) ekliyordu — yani iki kat gidiş-dönüş. Üstelik tünel
  HTTP/1.1 olduğundan tarayıcı aynı anda yalnızca 6 istek açabiliyordu.

  Görseller bu geçit üzerinden aynı alan adından servis edilince CORS,
  ön-uçuş ve 6 bağlantı sınırı ortadan kalkıyor (Vercel HTTP/2 konuşuyor)
  ve sayfa yeniden sade <img loading="lazy"> kullanabiliyor.

  Yol, dinamik dosya adı yerine sorgu parametresiyle taşınıyor:
    /api/img?p=<slug>/product/12/image&size=thumb
*/
const API = 'https://driving-gladly-outcome.ngrok-free.dev/api/menu'

// Yalnızca menü görseli adreslerine izin ver — geçidin açık bir yönlendirici
// hâline gelmemesi için.
const ALLOWED = /^[A-Za-z0-9._~-]+\/(product|category)\/\d+\/image$/

export default async function handler(req, res) {
  const path = req.query.p
  if (typeof path !== 'string' || !ALLOWED.test(path)) {
    res.status(400).send('Gecersiz yol')
    return
  }

  const size   = req.query.size === 'thumb' ? '?size=thumb' : ''
  const target = `${API}/${path}${size}`

  let upstream
  try {
    upstream = await fetch(target, {
      headers: {
        'ngrok-skip-browser-warning': '1',
        // Tarayıcının User-Agent'ı iletilmiyor; aksi halde ngrok isteği
        // tarayıcı sanıp uyarı sayfası döndürür.
        'user-agent': 'satiskasasi-menu-proxy',
        'accept': 'image/*',
        ...(req.headers['if-none-match']
          ? { 'if-none-match': req.headers['if-none-match'] }
          : {})
      }
    })
  } catch {
    res.status(502).send('API yanit vermedi')
    return
  }

  const etag = upstream.headers.get('etag')
  if (etag) res.setHeader('ETag', etag)
  res.setHeader('Cache-Control', 'public, max-age=60, must-revalidate')

  // Değişmemişse gövdesiz 304 — tekrar ziyaretlerde görsel yeniden inmez.
  if (upstream.status === 304) { res.status(304).end(); return }
  if (!upstream.ok) { res.status(upstream.status).send('Bulunamadi'); return }

  const type = upstream.headers.get('content-type') || ''
  // ngrok uyarı sayfası da 200 döndüğü için içeriğin gerçekten görsel
  // olduğunu doğruluyoruz.
  if (!type.startsWith('image/')) { res.status(502).send('Gorsel gelmedi'); return }

  res.setHeader('Content-Type', type)
  res.status(200).send(Buffer.from(await upstream.arrayBuffer()))
}
