import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api/api'

export const useCariStore = defineStore('cari', () => {

  const cariler       = ref([])
  const kasaIslemleri = ref([])   // bu oturumda kesilen makbuzlar (kayıt sunucuda)

  // Sunucu alanları ↔ panelin cari kartı alanları
  const fromApi = c => ({
    ...c,
    unvan: c.name, telefon: c.phone, email: c.email, vergiNo: c.taxNo,
    adres: c.address, riskLimiti: c.riskLimit ?? 0, tip: c.type || 'Müşteri', notlar: c.notes,
    grupId: c.groupId ?? null, puan: c.loyaltyPoints ?? 0, sadakatOnay: !!c.loyaltyConsentAt, onayTarihi: c.loyaltyConsentAt,
  })
  const toApi = f => ({
    name: (f.unvan || '').trim(), phone: f.telefon, email: f.email, taxNo: f.vergiNo,
    address: f.adres, riskLimit: Number(f.riskLimiti) || 0, type: f.tip, notes: f.notlar,
    groupId: f.grupId || null, loyaltyConsent: !!f.sadakatOnay,
  })

  // ─── API yükle ────────────────────────────────────────────────────────────
  async function fetchCariler() {
    try {
      const res = await api.getCaris()
      cariler.value = (res.data ?? []).map(fromApi)
    } catch (e) {
      console.error('[CariStore] fetchCariler hatası', e)
    }
  }

  // ─── Hareketler: sunucudaki cari hesap kayıtları ─────────────────────────
  // Kasadaki açık hesap satışları, kasadan devreden bakiye ve paneldeki
  // tahsilat / tediye burada. Bakiye: artı = müşterinin borcu.
  const islemler = ref({})   // cariId → hareket listesi

  function tipOf(t) {
    const d = t.description || ''
    if (t.saleId) return 'Açık Hesap Satışı'
    if (d.startsWith('İptal:')) return 'Fatura İptali'
    if (d.startsWith('Satış faturası')) return 'Satış Faturası'
    if (d.startsWith('Alış faturası')) return 'Alış Faturası'
    if (d.startsWith('Kasadan devreden')) return 'Devir'
    if (d.startsWith('Tediye')) return 'Tediye'
    return t.amount > 0 ? 'Borç' : 'Tahsilat'
  }

  async function loadHareketler(cariId) {
    if (!cariId) return
    const res = await api.getCariTransactions(cariId)
    const list = (res.data?.transactions ?? [])
      .map(t => ({
        id:       `t-${t.id}`,
        date:     t.date,
        tarih:    new Date(t.date).toLocaleDateString('tr-TR'),
        belgeNo:  t.saleId ? `Satış #${t.saleId}`
                  : t.invoiceId ? ((t.description || '').match(/faturası (\S+)/)?.[1] ?? '') : '',
        tip:      tipOf(t),
        aciklama: t.description,
        borc:     t.amount > 0 ? t.amount : 0,
        alacak:   t.amount < 0 ? -t.amount : 0,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    let running = 0
    list.forEach(e => { running += e.borc - e.alacak; e.kalanBakiye = running })
    islemler.value = { ...islemler.value, [cariId]: list }
  }

  function hareketlerByCari(cariId) {
    return islemler.value[cariId] ?? []
  }

  function bakiyeByCari(cariId) {
    return cariler.value.find(c => c.id === cariId)?.balance ?? 0
  }

  function sonIslemByCari(cariId) {
    const h = islemler.value[cariId]
    return h?.length ? h[h.length - 1] : null
  }

  const carilerWithBakiye = computed(() =>
    cariler.value.map(c => ({
      ...c,
      bakiye:   c.balance ?? 0,
      sonIslem: sonIslemByCari(c.id),
    }))
  )

  const sonKasaIslemleri = computed(() =>
    [...kasaIslemleri.value].sort((a, b) => b.tarih.localeCompare(a.tarih))
  )

  // ─── Cari CRUD — API + in-memory ─────────────────────────────────────────
  async function cariEkle(cari) {
    const res = await api.createCari(toApi(cari))
    cariler.value.push(fromApi(res.data))
  }

  async function cariGuncelle(guncellenen) {
    const res = await api.updateCari(guncellenen.id, toApi(guncellenen))
    const idx = cariler.value.findIndex(c => c.id === guncellenen.id)
    if (idx !== -1) cariler.value[idx] = fromApi(res.data)
  }

  // Hareketi olan cari sunucuda pasife alınır (geçmiş korunur); listeden kalkar.
  async function cariSil(id) {
    await api.deleteCari(id)
    cariler.value = cariler.value.filter(c => c.id !== id)
  }

  // Tahsilat bakiyeyi düşürür, tediye (müşteriye ödeme) artırır; sunucuya yazılır.
  async function kasaIslemEkle(islem) {
    const tutar = Number(islem.tutar) || 0
    const not = [islem.aciklama, islem.makbuzNo, islem.odeme].filter(Boolean).join(' · ')
    await api.addCariTransaction(islem.cariId, {
      amount: islem.tip === 'Tahsilat' ? tutar : -tutar,
      description: `${islem.tip}${not ? ': ' + not : ''}`,
    })
    kasaIslemleri.value.unshift({ ...islem, id: Date.now() })
    await fetchCariler()
    if (islemler.value[islem.cariId]) await loadHareketler(islem.cariId)
  }

  return {
    cariler,
    kasaIslemleri,
    carilerWithBakiye,
    sonKasaIslemleri,
    hareketlerByCari,
    loadHareketler,
    bakiyeByCari,
    fetchCariler,
    kasaIslemEkle,
    cariEkle,
    cariGuncelle,
    cariSil,
  }
})
