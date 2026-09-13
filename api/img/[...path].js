/*
  Menü görselleri için geçit (proxy).

  Neden var: API ücretsiz bir ngrok tüneli arkasında ve ngrok, tarayıcı
  görünümlü isteklere gerçek yanıt yerine uyarı sayfası döndürüyor. Bunu
  atlatan "ngrok-skip-browser-warning" başlığını <img> etiketi gönderemediği
  için görselleri fetch+blob ile indirmek zorundaydık; o da her görsele bir
  CORS ön-uçuşu (OPTIONS) ekliyordu — yani iki kat gidiş-dönüş.

  Görseller bu geçit üzerinden aynı alan adından servis edilince:
    - CORS ve ön-uçuş ortadan kalkar,
    - Vercel HTTP/2 konuştuğu için istekler çoğullanır (6 bağlantı sınırı yok),
    - sayfa yeniden sade <img loading="lazy"> kullanabilir.

  Başlığı buradan ekliyoruz; ayrıca tarayıcının User-Agent'ını iletmiyoruz ki
  ngrok isteği tarayıcı sanmasın.
*/
export const config = { runtime: 'edge' }

const API = 'https://driving-gladly-outcome.ngrok-free.dev/api/menu'

export default async function handler(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace(/^\/api\/img\//, '')
  if (!path) return new Response('Not found', { status: 404 })

  const target = `${API}/${path}${url.search}`

  let upstream
  try {
    upstream = await fetch(target, {
      headers: {
        'ngrok-skip-browser-warning': '1',
        'user-agent': 'satiskasasi-menu-proxy',
        'accept': 'image/*',
        // Tarayıcının ETag'ini geçirelim ki değişmeyen görsel için
        // gövdesiz 304 dönebilsin.
        ...(request.headers.get('if-none-match')
          ? { 'if-none-match': request.headers.get('if-none-match') }
          : {})
      }
    })
  } catch {
    return new Response('Upstream unavailable', { status: 502 })
  }

  if (upstream.status === 304) {
    return new Response(null, {
      status: 304,
      headers: {
        'ETag': upstream.headers.get('etag') ?? '',
        'Cache-Control': 'public, max-age=60, must-revalidate'
      }
    })
  }

  if (!upstream.ok) {
    return new Response('Not found', { status: upstream.status })
  }

  const type = upstream.headers.get('content-type') ?? ''
  // ngrok uyarı sayfası da 200 döndüğü için içeriğin gerçekten görsel
  // olduğunu doğruluyoruz; aksi halde bozuk resim göstermek yerine 502.
  if (!type.startsWith('image/')) {
    return new Response('Upstream did not return an image', { status: 502 })
  }

  const headers = {
    'Content-Type': type,
    'Cache-Control': 'public, max-age=60, must-revalidate'
  }
  const etag = upstream.headers.get('etag')
  if (etag) headers['ETag'] = etag

  return new Response(upstream.body, { status: 200, headers })
}
