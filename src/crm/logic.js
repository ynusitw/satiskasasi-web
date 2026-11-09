// Satış CRM'inin kuralları — crm.yenpos.com'daki eski uygulamadan birebir taşındı.
// Kayıtlar artık sunucuda (api/crm); hesaplar (kuyruk, şablon doldurma) burada.

export const STATUSES = ['yeni', 'gonderildi', 'yanitladi', 'demo', 'musteri', 'ret', 'gecersiz']
export const STATUS_LABEL = {
  yeni: 'Yeni', gonderildi: 'Mesaj gönderildi', yanitladi: 'Yanıt verdi', demo: 'Demo planlandı',
  musteri: 'Müşteri', ret: 'RET / istemiyor', gecersiz: 'Numara geçersiz',
}
export const SEGMENT_LABEL = { yeme_icme: 'Yeme-içme', market: 'Market', perakende: 'Perakende' }

export const ISTANBUL_DISTRICTS = ['Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler', 'Bakırköy',
  'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü', 'Beyoğlu', 'Büyükçekmece', 'Çatalca', 'Çekmeköy',
  'Esenler', 'Esenyurt', 'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kadıköy', 'Kâğıthane', 'Kartal',
  'Küçükçekmece', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sarıyer', 'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile',
  'Şişli', 'Tuzla', 'Ümraniye', 'Üsküdar', 'Zeytinburnu']

export const OSM_TYPES = ['Kafe', 'Restoran', 'Fast food', 'Bar', 'Pub', 'Dondurmacı', 'Fırın / Pastane', 'Pastane',
  'Market', 'Bakkal / Market', 'Manav', 'Kasap', 'Tekel', 'Şarküteri']

const FOOD = /kafe|cafe|restoran|restaurant|lokanta|kebap|pide|pastane|fırın|bakery|bar|pub|dondurma|burger|pizza|döner|çay|kahve|coffee/i
const SHOP = /market|bakkal|manav|kasap|tekel|şarküteri|grocery|supermarket|convenience|butcher/i
export const segmentOf = category => FOOD.test(category) ? 'yeme_icme' : SHOP.test(category) ? 'market' : 'perakende'

// Mesajdaki {sorun}: sektöre göre dönüşümlü seçilen dert
const PROBLEMS = {
  yeme_icme: ['yoğun saatlerde masa ve adisyon takibinin karışması', 'gün sonunda kasa ile satışların tutmaması',
    'hangi ürünün reçeteye göre gerçekte ne kadar kazandırdığının görülememesi',
    'iptal, ikram ve sisteme girilmeyen ürünlerin takip edilememesi',
    'işletmede değilken anlık ciro ve kasanın görülememesi', 'internet kesildiğinde kasanın durması'],
  market: ['yoğun saatlerde kasada kuyruk oluşması', 'stok sayımı ve son kullanma tarihi takibi',
    'gün sonu kasa açıkları ve veresiye takibi', 'fiyat değişikliklerinin kasaya geç yansıması'],
  perakende: ["stok takibinin defter veya Excel'de yürümesi", 'gün sonu kasa açıkları',
    'hangi ürünün ne kadar kâr bıraktığının görülememesi'],
}

export const VARIABLES = [
  { key: '{selam}', desc: 'Saate göre: Günaydın / İyi günler / İyi akşamlar' },
  { key: '{isletme}', desc: 'İşletmenin adı' },
  { key: '{semt}', desc: 'Mahalle, yoksa ilçe' },
  { key: '{sorun}', desc: 'Sektöre göre seçilen bir dert (masa takibi, kasa açığı…)' },
  { key: '{gonderen}', desc: "Ayarlar'daki adınız" },
  { key: '{firma}', desc: 'Firma adı' },
  { key: '{link}', desc: 'Kampanya sayfası (WhatsApp’ta afiş önizlemesi çıkar)' },
]

// FNV-1a: aynı işletmeye hep aynı şablon/dert düşsün, işletmeler arasında dağılsın
function hash(s) {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x1000193) }
  return h >>> 0
}

const day = 864e5
const notSkipped = (l, now) => !l.skippedUntil || new Date(l.skippedUntil).getTime() <= now
const sameDay = (v, d = new Date()) => {
  if (!v) return false
  const x = new Date(v)
  return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth() && x.getDate() === d.getDate()
}

/** Bugünün WhatsApp kuyruğu: önce takip zamanı gelenler, sonra yeni cep telefonlular; günlük sınıra kadar. */
export function todayQueue(state) {
  const { settings: s, leads } = state
  const now = Date.now()
  let sent = 0
  for (const l of leads) for (const h of l.history) if ((h.type === 'mesaj' || h.type === 'takip') && sameDay(h.at)) sent++
  const remaining = Math.max(0, s.dailyLimit - sent)
  const follow = leads.filter(l => l.status === 'gonderildi' && l.phoneType === 'mobile' && l.followUps < s.maxFollowUps
    && l.lastContactAt && now - new Date(l.lastContactAt).getTime() >= day * s.followUpDays && notSkipped(l, now))
  const fresh = leads.filter(l => l.status === 'yeni' && l.phoneType === 'mobile' && notSkipped(l, now))
  return {
    items: [...follow.map(lead => ({ lead, kind: 'takip' })), ...fresh.map(lead => ({ lead, kind: 'ilk' }))].slice(0, remaining),
    remaining, sent,
  }
}

/** WhatsApp'ı olmayan yeni işletmeler (sabit hat, 0850 / 444): telefonla aranacak. */
export const callList = state => {
  const now = Date.now()
  return state.leads.filter(l => l.status === 'yeni' && l.phone && l.phoneType !== 'mobile' && notSkipped(l, now))
}

export function counts(state) {
  const by = st => state.leads.filter(l => l.status === st).length
  return {
    total: state.leads.length,
    mobileNew: state.leads.filter(l => l.status === 'yeni' && l.phoneType === 'mobile').length,
    sent: by('gonderildi'), replied: by('yanitladi'), demo: by('demo'), customer: by('musteri'), ret: by('ret'),
  }
}

/** İşletmenin sektörüne uygun şablonlar (yoksa "Tüm sektörler"). */
export function templatesFor(lead, kind, templates) {
  const own = templates.filter(t => t.kind === kind && t.segment === lead.segment)
  return own.length ? own : templates.filter(t => t.kind === kind && t.segment === 'hepsi')
}

export function pickTemplate(lead, kind, templates, offset = 0) {
  const list = templatesFor(lead, kind, templates)
  return list.length ? list[(hash(lead.key + kind) + offset) % list.length] : null
}

function greeting(d = new Date()) {
  const h = d.getHours()
  return h < 11 ? 'Günaydın' : h < 18 ? 'İyi günler' : 'İyi akşamlar'
}

/** Şablonu işletmeye göre doldurur; ret cümlesi sona eklenir. */
export function fillTemplate(body, lead, settings, link, offset = 0) {
  const semt = (lead.neighborhood || '').replace(/\s+(Mahallesi|Mah\.?)$/i, '') || lead.district || 'bölgenizdeki'
  const problems = PROBLEMS[lead.segment] ?? PROBLEMS.perakende
  const text = body.replaceAll('{selam}', greeting())
    .replaceAll('{isletme}', lead.name)
    .replaceAll('{semt}', semt)
    .replaceAll('{sorun}', problems[(hash(lead.key) + offset) % problems.length])
    .replaceAll('{gonderen}', settings.senderName || settings.companyName)
    .replaceAll('{firma}', settings.companyName)
    .replaceAll('{link}', link)
  return settings.optOutText ? `${text}\n\n${settings.optOutText}` : text
}

/** Türkiye telefonu: +90 ile 10 hane; cep (5xx) / sabit (2xx-4xx) / diğer. */
export function parsePhone(raw) {
  if (!raw) return null
  let t = String(raw).split(/[;,/]| - /)[0].replace(/\D/g, '')
  if (!t) return null
  if (/^444\d{4}$/.test(t)) return { phone: t, type: 'other' }
  if (t.startsWith('0090')) t = t.slice(4)
  else if (t.startsWith('90') && t.length === 12) t = t.slice(2)
  else if (t.startsWith('0') && t.length === 11) t = t.slice(1)
  if (t.length !== 10) return null
  const type = /^5[0-9]/.test(t) ? 'mobile' : /^[234]/.test(t) ? 'landline' : 'other'
  return { phone: `+90${t}`, type }
}

export function formatPhone(p) {
  if (!p) return '—'
  const m = p.match(/^\+90(\d{3})(\d{3})(\d{2})(\d{2})$/)
  return m ? `0${m[1]} ${m[2]} ${m[3]} ${m[4]}` : p
}

export function whatsappUrl(phone, text, mode) {
  const n = phone.replace(/\D/g, '')
  const t = encodeURIComponent(text)
  return mode === 'app' ? `whatsapp://send?phone=${n}&text=${t}` : `https://wa.me/${n}?text=${t}`
}

/** Ham kaydı (OSM / CSV / elle) sunucuya gidecek adaya çevirir; telefonsuz da olabilir. */
export function toLead(raw, source) {
  const name = raw.name?.trim()
  if (!name) return null
  const p = parsePhone(raw.phone)
  const category = raw.category?.trim() || 'İşletme'
  return {
    key: raw.id || `${source}:${p?.phone ?? crypto.randomUUID()}`,
    name, category, segment: raw.segment ?? segmentOf(category),
    phone: p?.phone ?? null, phoneType: p?.type ?? null,
    district: raw.district?.trim() ?? '', neighborhood: raw.neighborhood?.trim() ?? '',
    address: raw.address?.trim() ?? '', lat: raw.lat ?? null, lon: raw.lon ?? null,
    website: raw.website?.trim() ?? '', source,
  }
}

export const addressOf = l => [l.address, l.neighborhood, l.district].filter(Boolean)
  .filter((v, i, a) => a.indexOf(v) === i).join(', ')

export function mapUrl(l) {
  const q = l.lat != null && l.lon != null ? `${l.lat},${l.lon}` : [l.name, l.address, l.district].filter(Boolean).join(' ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

/** CSV: ; ya da , ayraçlı, tırnaklı alanlar; ilk satır başlık. */
export function parseCsv(text) {
  const t = text.replace(/^﻿/, '')
  const first = t.split(/\r?\n/, 1)[0] ?? ''
  const sep = (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ';' : ','
  const rows = []; let row = [], cell = '', quoted = false
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (quoted) {
      if (c === '"' && t[i + 1] === '"') { cell += '"'; i++ } else if (c === '"') quoted = false; else cell += c
    } else if (c === '"') quoted = true
    else if (c === sep) { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++
      row.push(cell); rows.push(row); row = []; cell = ''
    } else cell += c
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  const [head, ...data] = rows.filter(r => r.some(x => x.trim()))
  if (!head) return []
  const keys = head.map(h => h.trim().toLowerCase())
  return data.map(r => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])))
}

const pick = (o, ...keys) => keys.map(k => o[k]).find(v => v) ?? ''
export const csvToLeads = rows => rows.map(r => toLead({
  id: pick(r, 'place_id') || undefined,
  name: pick(r, 'name', 'isim', 'işletme', 'isletme', 'işletme adı', 'firma'),
  category: pick(r, 'category', 'kategori', 'sektör', 'sektor'),
  phone: pick(r, 'phone', 'telefon', 'tel', 'phone_raw', 'cep'),
  district: pick(r, 'district', 'ilçe', 'ilce'),
  neighborhood: pick(r, 'neighborhood', 'mahalle', 'semt'),
  address: pick(r, 'address', 'adres'),
  website: pick(r, 'website', 'web', 'site'),
}, 'csv')).filter(Boolean)

/** Panoya kampanya afişi (WhatsApp'ta Ctrl+V ile gönderilir). */
export const POSTER_URL = '/crm-kampanya-afis.png'
let posterBlob = null
function posterPromise() {
  return (posterBlob ??= fetch(POSTER_URL).then(r => { if (!r.ok) throw new Error('Afiş yüklenemedi'); return r.blob() })
    .catch(e => { posterBlob = null; throw e }))
}
export async function copyPoster() {
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': posterPromise() })])
    return true
  } catch { return false }
}
export const preloadPoster = () => posterPromise().catch(() => {})
