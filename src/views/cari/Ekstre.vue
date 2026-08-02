<template>
  <div class="p-6 lg:p-8">

    <!-- Başlık + Cari Seçici -->
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold text-primary">Cari Ekstre</h1>
        <p class="text-muted text-sm mt-1">Hesap özeti ve hareket dökümü</p>
      </div>
      <select v-model="secilenCariId"
              class="px-4 py-2 border border-gray-200 rounded-xl text-sm
                     focus:border-accent focus:outline-none bg-white min-w-56">
        <option value="">Cari seçin...</option>
        <option v-for="c in cariler" :key="c.id" :value="c.id">{{ c.unvan }}</option>
      </select>
    </div>

    <div v-if="!secilenCariId" class="bg-white rounded-2xl shadow-sm p-16 text-center text-muted">
      <div class="text-4xl mb-3">📋</div>
      <div class="font-semibold">Ekstre görüntülemek için cari seçin</div>
    </div>

    <template v-else>
      <!-- Cari Bilgi Kartı -->
      <div class="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div class="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div class="flex items-center gap-3 mb-1">
              <span class="text-xs font-bold px-2.5 py-1 rounded-full"
                    :class="secilenCari.tip === 'Müşteri'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-purple-100 text-purple-700'">
                {{ secilenCari.tip }}
              </span>
              <h2 class="text-lg font-bold text-primary">{{ secilenCari.unvan }}</h2>
            </div>
            <div class="text-sm text-muted">{{ secilenCari.telefon }}</div>
            <div class="text-sm text-muted">Vergi No: {{ secilenCari.vergiNo }}</div>
          </div>
          <div class="text-right">
            <div class="text-xs text-muted mb-1">Güncel Bakiye</div>
            <div class="text-3xl font-bold"
                 :class="secilenCari.bakiye > 0 ? 'text-danger' : secilenCari.bakiye < 0 ? 'text-success' : 'text-muted'">
              {{ fmt(Math.abs(secilenCari.bakiye)) }}
            </div>
            <div class="text-sm font-semibold mt-1"
                 :class="secilenCari.bakiye > 0 ? 'text-danger' : 'text-success'">
              {{ secilenCari.bakiye > 0 ? '▲ Borçlu' : secilenCari.bakiye < 0 ? '▼ Alacaklı' : 'Sıfır' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Özet Kartlar -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-white rounded-2xl shadow-sm p-5 text-center">
          <div class="text-xs text-muted mb-1">Toplam Borç</div>
          <div class="text-xl font-bold text-danger">{{ fmt(toplamBorc) }}</div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm p-5 text-center">
          <div class="text-xs text-muted mb-1">Toplam Alacak</div>
          <div class="text-xl font-bold text-success">{{ fmt(toplamAlacak) }}</div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm p-5 text-center">
          <div class="text-xs text-muted mb-1">Net Bakiye</div>
          <div class="text-xl font-bold"
               :class="netBakiye > 0 ? 'text-danger' : netBakiye < 0 ? 'text-success' : 'text-muted'">
            {{ fmt(Math.abs(netBakiye)) }}
          </div>
        </div>
      </div>

      <!-- Hareket Tablosu -->
      <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 class="font-bold">Hareket Dökümü</h3>
          <span class="text-xs text-muted">{{ hareketler.length }} kayıt</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left px-5 py-3 text-xs font-bold text-muted uppercase">Tarih</th>
                <th class="text-left px-5 py-3 text-xs font-bold text-muted uppercase">Belge No</th>
                <th class="text-left px-5 py-3 text-xs font-bold text-muted uppercase">Açıklama</th>
                <th class="text-right px-5 py-3 text-xs font-bold text-muted uppercase">Borç</th>
                <th class="text-right px-5 py-3 text-xs font-bold text-muted uppercase">Alacak</th>
                <th class="text-right px-5 py-3 text-xs font-bold text-muted uppercase">Kalan Bakiye</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!hareketler.length">
                <td colspan="6" class="text-center py-12 text-muted">Hareket kaydı bulunamadı</td>
              </tr>
              <tr v-for="h in hareketler" :key="h.id"
                  class="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                <td class="px-5 py-3 text-sm text-muted whitespace-nowrap">{{ h.tarih }}</td>
                <td class="px-5 py-3 text-sm font-mono text-primary">{{ h.belgeNo }}</td>
                <td class="px-5 py-3 text-sm">{{ h.aciklama }}</td>
                <td class="px-5 py-3 text-sm text-right font-semibold"
                    :class="h.borc > 0 ? 'text-danger' : 'text-muted'">
                  {{ h.borc > 0 ? fmt(h.borc) : '—' }}
                </td>
                <td class="px-5 py-3 text-sm text-right font-semibold"
                    :class="h.alacak > 0 ? 'text-success' : 'text-muted'">
                  {{ h.alacak > 0 ? fmt(h.alacak) : '—' }}
                </td>
                <td class="px-5 py-3 text-sm text-right font-bold"
                    :class="h.kalanBakiye > 0 ? 'text-danger' : h.kalanBakiye < 0 ? 'text-success' : 'text-muted'">
                  {{ fmt(Math.abs(h.kalanBakiye)) }}
                  <span class="text-xs font-normal ml-1">
                    {{ h.kalanBakiye > 0 ? 'B' : h.kalanBakiye < 0 ? 'A' : '' }}
                  </span>
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td colspan="3" class="px-5 py-3 text-sm font-bold">TOPLAM</td>
                <td class="px-5 py-3 text-sm font-bold text-right text-danger">{{ fmt(toplamBorc) }}</td>
                <td class="px-5 py-3 text-sm font-bold text-right text-success">{{ fmt(toplamAlacak) }}</td>
                <td class="px-5 py-3 text-sm font-bold text-right"
                    :class="netBakiye > 0 ? 'text-danger' : 'text-success'">
                  {{ fmt(Math.abs(netBakiye)) }}
                  {{ netBakiye > 0 ? 'B' : netBakiye < 0 ? 'A' : '' }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const cariler = ref([
  { id: 1, tip: 'Müşteri',   unvan: 'Ahmet Yılmaz',       telefon: '0532 111 2233', vergiNo: '12345678901', bakiye:  1500.00 },
  { id: 2, tip: 'Tedarikçi', unvan: 'ABC Gıda Tic. Ltd.', telefon: '0212 444 5566', vergiNo: '9876543210',  bakiye: -2300.50 },
  { id: 3, tip: 'Müşteri',   unvan: 'Fatma Demir',         telefon: '0541 999 8877', vergiNo: '98765432109', bakiye:     0    },
  { id: 4, tip: 'Tedarikçi', unvan: 'XYZ Market A.Ş.',    telefon: '0216 333 4455', vergiNo: '1122334455',  bakiye:  4800.00 },
  { id: 5, tip: 'Müşteri',   unvan: 'Mehmet Kaya',         telefon: '0505 222 3344', vergiNo: '55544433221', bakiye:  -750.00 },
])

const mockHareketler = {
  1: [
    { id: 1, tarih: '2026-06-01', belgeNo: 'STF-001', aciklama: 'Haziran ayı malları',  borc: 2000.00, alacak:    0,    kalanBakiye:  2000.00 },
    { id: 2, tarih: '2026-06-15', belgeNo: 'MKB-001', aciklama: 'Nakit tahsilat',        borc:    0,    alacak:  500.00, kalanBakiye:  1500.00 },
    { id: 3, tarih: '2026-07-10', belgeNo: 'STF-002', aciklama: 'Temmuz siparişi',       borc:  750.00, alacak:    0,    kalanBakiye:  2250.00 },
    { id: 4, tarih: '2026-07-20', belgeNo: 'MKB-002', aciklama: 'Kart ile tahsilat',     borc:    0,    alacak:  750.00, kalanBakiye:  1500.00 },
  ],
  2: [
    { id: 1, tarih: '2026-06-05', belgeNo: 'ALF-001', aciklama: 'Stok alımı',            borc: 5000.00, alacak:    0,    kalanBakiye:  5000.00 },
    { id: 2, tarih: '2026-06-20', belgeNo: 'MKB-003', aciklama: 'Havale ödemesi',        borc:    0,    alacak: 4000.00, kalanBakiye:  1000.00 },
    { id: 3, tarih: '2026-07-01', belgeNo: 'ALF-002', aciklama: 'Ürün alımı',            borc: 2300.50, alacak:    0,    kalanBakiye:  3300.50 },
    { id: 4, tarih: '2026-07-15', belgeNo: 'MKB-004', aciklama: 'Kısmi ödeme',           borc:    0,    alacak: 5600.00, kalanBakiye: -2300.50 },
  ],
  3: [],
  4: [
    { id: 1, tarih: '2026-07-01', belgeNo: 'ALF-003', aciklama: 'Market malları',        borc: 4800.00, alacak:    0,    kalanBakiye:  4800.00 },
  ],
  5: [
    { id: 1, tarih: '2026-07-05', belgeNo: 'STF-003', aciklama: 'Perakende satış',       borc:  750.00, alacak:    0,    kalanBakiye:   750.00 },
    { id: 2, tarih: '2026-07-28', belgeNo: 'MKB-005', aciklama: 'Kart tahsilat',         borc:    0,    alacak: 1500.00, kalanBakiye:  -750.00 },
  ],
}

const secilenCariId = ref('')

// URL'den cari id geliyorsa onu seç
watch(() => route.query.id, (id) => {
  if (id) secilenCariId.value = Number(id)
}, { immediate: true })

const secilenCari = computed(() =>
  cariler.value.find(c => c.id === secilenCariId.value) || null
)

const hareketler = computed(() =>
  secilenCariId.value ? (mockHareketler[secilenCariId.value] || []) : []
)

const toplamBorc   = computed(() => hareketler.value.reduce((s, h) => s + h.borc,   0))
const toplamAlacak = computed(() => hareketler.value.reduce((s, h) => s + h.alacak, 0))
const netBakiye    = computed(() => toplamBorc.value - toplamAlacak.value)

function fmt(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}
</script>
