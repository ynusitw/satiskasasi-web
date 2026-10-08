import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api/api'

export const useCariStore = defineStore('cari', () => {

  const cariler       = ref([])
  const faturalar     = ref([])   // in-memory (API transaction endpoint'i eklenince burası güncellenir)
  const kasaIslemleri = ref([])   // in-memory

  // ─── API yükle ────────────────────────────────────────────────────────────
  async function fetchCariler() {
    try {
      const res = await api.getCaris()
      cariler.value = res.data ?? []
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
        belgeNo:  t.saleId ? `Satış #${t.saleId}` : '',
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
    const res = await api.createCari(cari)
    cariler.value.push(res.data)
  }

  async function cariGuncelle(guncellenen) {
    await api.updateCari(guncellenen.id, guncellenen)
    const idx = cariler.value.findIndex(c => c.id === guncellenen.id)
    if (idx !== -1) cariler.value[idx] = { ...cariler.value[idx], ...guncellenen }
  }

  async function cariSil(id) {
    await api.deleteCari(id)
    cariler.value       = cariler.value.filter(c => c.id !== id)
    faturalar.value     = faturalar.value.filter(f => f.cariId !== id)
    kasaIslemleri.value = kasaIslemleri.value.filter(k => k.cariId !== id)
  }

  // ─── Fatura / Kasa — in-memory (TODO: backend transaction endpoint'i) ────
  function faturaEkle(fatura) {
    faturalar.value.unshift({ ...fatura, id: Date.now() })
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
    faturalar,
    kasaIslemleri,
    carilerWithBakiye,
    sonKasaIslemleri,
    hareketlerByCari,
    loadHareketler,
    bakiyeByCari,
    fetchCariler,
    faturaEkle,
    kasaIslemEkle,
    cariEkle,
    cariGuncelle,
    cariSil,
  }
})
