import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'satiskasasi_cari_v1'

// ─── Başlangıç (mock) verisi ─────────────────────────────────────────────────
// Yalnızca localStorage'da hiç kayıt yoksa kullanılır.
const MOCK_CARILER = [
  { id: 1, tip: 'Müşteri',   unvan: 'Ahmet Yılmaz',       telefon: '0532 111 2233', email: 'ahmet@mail.com',   vergiNo: '12345678901', riskLimiti: 5000,  adres: 'Kadıköy, İstanbul'  },
  { id: 2, tip: 'Tedarikçi', unvan: 'ABC Gıda Tic. Ltd.', telefon: '0212 444 5566', email: 'info@abcgida.com', vergiNo: '9876543210',  riskLimiti: 10000, adres: 'Bağcılar, İstanbul' },
  { id: 3, tip: 'Müşteri',   unvan: 'Fatma Demir',         telefon: '0541 999 8877', email: '',                 vergiNo: '98765432109', riskLimiti: 2000,  adres: ''                   },
  { id: 4, tip: 'Tedarikçi', unvan: 'XYZ Market A.Ş.',    telefon: '0216 333 4455', email: 'satis@xyz.com',   vergiNo: '1122334455',  riskLimiti: 4000,  adres: 'Ümraniye, İstanbul' },
  { id: 5, tip: 'Müşteri',   unvan: 'Mehmet Kaya',         telefon: '0505 222 3344', email: '',                 vergiNo: '55544433221', riskLimiti: 3000,  adres: 'Beşiktaş, İstanbul'},
]

const MOCK_FATURALAR = [
  { id: 1, tip: 'Satış', no: 'STF-001', cariId: 1, cariUnvan: 'Ahmet Yılmaz',       tarih: '2026-06-01', aciklama: 'Haziran malları',  araToplam: 1666.67, kdvToplam:  333.33, genelToplam: 2000.00, kalemler: [] },
  { id: 2, tip: 'Satış', no: 'STF-002', cariId: 1, cariUnvan: 'Ahmet Yılmaz',       tarih: '2026-07-10', aciklama: 'Temmuz siparişi',  araToplam:  625.00, kdvToplam:  125.00, genelToplam:  750.00, kalemler: [] },
  { id: 3, tip: 'Alış',  no: 'ALF-001', cariId: 2, cariUnvan: 'ABC Gıda Tic. Ltd.', tarih: '2026-06-05', aciklama: 'Stok alımı',       araToplam: 4545.45, kdvToplam:  454.55, genelToplam: 5000.00, kalemler: [] },
  { id: 4, tip: 'Alış',  no: 'ALF-002', cariId: 2, cariUnvan: 'ABC Gıda Tic. Ltd.', tarih: '2026-07-01', aciklama: 'Ürün alımı',       araToplam: 2093.18, kdvToplam:  207.32, genelToplam: 2300.50, kalemler: [] },
  { id: 5, tip: 'Alış',  no: 'ALF-003', cariId: 4, cariUnvan: 'XYZ Market A.Ş.',   tarih: '2026-07-01', aciklama: 'Market malları',    araToplam: 4363.64, kdvToplam:  436.36, genelToplam: 4800.00, kalemler: [] },
  { id: 6, tip: 'Satış', no: 'STF-003', cariId: 5, cariUnvan: 'Mehmet Kaya',        tarih: '2026-07-05', aciklama: 'Perakende satış',  araToplam:  625.00, kdvToplam:  125.00, genelToplam:  750.00, kalemler: [] },
]

const MOCK_KASA = [
  { id: 1, tip: 'Tahsilat', makbuzNo: 'MKB-001', cariId: 1, cariUnvan: 'Ahmet Yılmaz',       tarih: '2026-06-15', tutar: 500.00,  odeme: 'Nakit',  aciklama: 'Nakit tahsilat' },
  { id: 2, tip: 'Tahsilat', makbuzNo: 'MKB-002', cariId: 1, cariUnvan: 'Ahmet Yılmaz',       tarih: '2026-07-20', tutar: 750.00,  odeme: 'Kart',   aciklama: 'Kart tahsilat'  },
  { id: 3, tip: 'Tediye',   makbuzNo: 'MKB-003', cariId: 2, cariUnvan: 'ABC Gıda Tic. Ltd.', tarih: '2026-06-20', tutar: 4000.00, odeme: 'Havale', aciklama: 'Havale ödemesi' },
  { id: 4, tip: 'Tediye',   makbuzNo: 'MKB-004', cariId: 2, cariUnvan: 'ABC Gıda Tic. Ltd.', tarih: '2026-07-15', tutar: 5601.00, odeme: 'Havale', aciklama: 'Kısmi ödeme'    },
  { id: 5, tip: 'Tahsilat', makbuzNo: 'MKB-005', cariId: 5, cariUnvan: 'Mehmet Kaya',        tarih: '2026-07-28', tutar: 1500.00, odeme: 'Kart',   aciklama: 'Kart tahsilat'  },
]

// ─── localStorage yardımcıları ───────────────────────────────────────────────
function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn('[CariStore] localStorage okunamadı, mock veri kullanılıyor:', e)
  }
  return null
}

function saveStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('[CariStore] localStorage yazılamadı:', e)
  }
}

// ─── Store ───────────────────────────────────────────────────────────────────
export const useCariStore = defineStore('cari', () => {

  // Kaydedilmiş veriyi oku; yoksa mock ile başla
  const saved = loadStorage()

  const cariler       = ref(saved?.cariler       ?? MOCK_CARILER)
  const faturalar     = ref(saved?.faturalar     ?? MOCK_FATURALAR)
  const kasaIslemleri = ref(saved?.kasaIslemleri ?? MOCK_KASA)

  // Her değişiklikte localStorage'a yaz
  watch(
    [cariler, faturalar, kasaIslemleri],
    () => saveStorage({
      cariler:       cariler.value,
      faturalar:     faturalar.value,
      kasaIslemleri: kasaIslemleri.value,
    }),
    { deep: true }
  )

  // ─── Cari hareket hesaplama ────────────────────────────────────────────────
  function hareketlerByCari(cariId) {
    const events = []

    faturalar.value
      .filter(f => f.cariId === cariId)
      .forEach(f => events.push({
        id:       `f-${f.id}`,
        tarih:    f.tarih,
        belgeNo:  f.no,
        tip:      f.tip === 'Satış' ? 'Satış Faturası' : 'Alış Faturası',
        aciklama: f.aciklama,
        borc:     f.genelToplam,
        alacak:   0,
      }))

    kasaIslemleri.value
      .filter(k => k.cariId === cariId)
      .forEach(k => events.push({
        id:       `k-${k.id}`,
        tarih:    k.tarih,
        belgeNo:  k.makbuzNo,
        tip:      k.tip,
        aciklama: k.aciklama,
        borc:     0,
        alacak:   k.tutar,
      }))

    events.sort((a, b) => a.tarih.localeCompare(b.tarih))

    let running = 0
    events.forEach(e => {
      running = running + e.borc - e.alacak
      e.kalanBakiye = running
    })

    return events
  }

  function bakiyeByCari(cariId) {
    const h = hareketlerByCari(cariId)
    return h.length ? h[h.length - 1].kalanBakiye : 0
  }

  function sonIslemByCari(cariId) {
    const h = hareketlerByCari(cariId)
    return h.length ? h[h.length - 1] : null
  }

  const carilerWithBakiye = computed(() =>
    cariler.value.map(c => ({
      ...c,
      bakiye:   bakiyeByCari(c.id),
      sonIslem: sonIslemByCari(c.id),
    }))
  )

  const sonKasaIslemleri = computed(() =>
    [...kasaIslemleri.value].sort((a, b) => b.tarih.localeCompare(a.tarih))
  )

  // ─── Mutasyonlar ──────────────────────────────────────────────────────────
  function faturaEkle(fatura) {
    faturalar.value.unshift({ ...fatura, id: Date.now() })
  }

  function kasaIslemEkle(islem) {
    kasaIslemleri.value.unshift({ ...islem, id: Date.now() })
  }

  function cariEkle(cari) {
    cariler.value.push({ ...cari, id: Date.now() })
  }

  function cariGuncelle(guncellenen) {
    const idx = cariler.value.findIndex(c => c.id === guncellenen.id)
    if (idx !== -1) cariler.value[idx] = { ...guncellenen }
  }

  function cariSil(id) {
    cariler.value       = cariler.value.filter(c => c.id !== id)
    faturalar.value     = faturalar.value.filter(f => f.cariId !== id)
    kasaIslemleri.value = kasaIslemleri.value.filter(k => k.cariId !== id)
  }

  // Tüm veriyi sıfırla (mock'a dön)
  function resetToMock() {
    cariler.value       = MOCK_CARILER
    faturalar.value     = MOCK_FATURALAR
    kasaIslemleri.value = MOCK_KASA
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    cariler,
    faturalar,
    kasaIslemleri,
    carilerWithBakiye,
    sonKasaIslemleri,
    hareketlerByCari,
    bakiyeByCari,
    faturaEkle,
    kasaIslemEkle,
    cariEkle,
    cariGuncelle,
    cariSil,
    resetToMock,
  }
})
