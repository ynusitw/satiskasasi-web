<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-7xl">
    <div class="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div>
        <h1 class="page-title">Fiyat Teklifi</h1>
        <p class="page-subtitle">Modülleri seçin, toplamı görün, indirimle ya da indirimsiz teklif verin</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <RouterLink to="/superadmin/fiyat-listesi" class="btn-secondary">Fiyat listesi</RouterLink>
        <button class="btn-primary" @click="newQuote">+ Yeni teklif</button>
      </div>
    </div>

    <div class="scroll-x flex gap-1 mb-6 border-b border-gray-200">
      <button v-for="t in tabs" :key="t.key" @click="tab = t.key"
              class="px-3 sm:px-5 py-3 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap flex-shrink-0"
              :class="tab === t.key ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-primary'">
        {{ t.label }}
      </button>
    </div>

    <div v-if="loading" class="bg-white rounded-2xl shadow-sm py-12 text-center text-muted">Yükleniyor...</div>
    <div v-else-if="loadError" class="p-4 bg-red-50 text-red-600 rounded-xl text-sm">{{ loadError }}</div>

    <!-- ── Kayıtlı teklifler ─────────────────────────────────────────── -->
    <div v-else-if="tab === 'list'">
      <div class="flex flex-wrap gap-2 mb-4">
        <input v-model="search" placeholder="Müşteri, işletme ya da teklif no ara..."
               class="flex-1 min-w-[200px] px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
        <select v-model="statusFilter" class="px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white">
          <option value="">Tüm durumlar</option>
          <option v-for="s in STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
        </select>
      </div>
      <div v-if="!shownQuotes.length" class="bg-white rounded-2xl shadow-sm py-12 text-center text-muted">
        {{ quotes.length ? 'Aramaya uyan teklif yok.' : 'Henüz teklif yok. "Yeni teklif" ile başlayın.' }}
      </div>
      <div v-else class="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr class="text-[11px] font-semibold text-muted uppercase">
              <th class="text-left px-4 py-3">Teklif</th>
              <th class="text-left px-4 py-3">Müşteri</th>
              <th class="text-right px-4 py-3">Abonelik</th>
              <th class="text-right px-4 py-3">Tek seferlik</th>
              <th class="text-left px-4 py-3">Durum</th>
              <th class="text-left px-4 py-3">Tarih</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="q in shownQuotes" :key="q.id" @click="openQuote(q.id)"
                class="border-t border-gray-100 hover:bg-gray-50/70 cursor-pointer">
              <td class="px-4 py-3 font-mono text-[12.5px] text-primary whitespace-nowrap">{{ q.number }}</td>
              <td class="px-4 py-3">
                <div class="font-semibold text-primary">{{ q.businessName || q.customerName }}</div>
                <div v-if="q.businessName && q.customerName" class="text-xs text-muted">{{ q.customerName }}</div>
              </td>
              <td class="px-4 py-3 text-right font-semibold">{{ money(q.recurringTotal) }}
                <span class="text-xs text-muted font-normal">/{{ q.period === 'yearly' ? 'yıl' : 'ay' }}</span></td>
              <td class="px-4 py-3 text-right">{{ q.oneTimeTotal ? money(q.oneTimeTotal) : '—' }}</td>
              <td class="px-4 py-3"><span class="text-[11px] font-bold px-2 py-0.5 rounded-full" :class="statusClass(q.status)">{{ statusLabel(q.status) }}</span></td>
              <td class="px-4 py-3 text-muted whitespace-nowrap">{{ date(q.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Teklif hazırla ─────────────────────────────────────────────── -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-5 items-start">
      <div class="space-y-5 min-w-0">

        <!-- Müşteri -->
        <section class="bg-white rounded-2xl shadow-sm p-5">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 class="section-title">Müşteri</h2>
            <span v-if="q.id" class="text-xs text-muted">
              <span class="font-mono text-primary">{{ q.number }}</span> · {{ statusLabel(q.status) }}
              <template v-if="q.appliedAt"> · {{ date(q.appliedAt) }} tarihinde uygulandı</template>
            </span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="field-label">Var olan işletme <span class="text-muted font-normal">(isteğe bağlı)</span></label>
              <select v-model="q.tenantId" @change="fillFromTenant"
                      class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white">
                <option :value="null">— Yeni müşteri —</option>
                <option v-for="t in tenants" :key="t.id" :value="t.id">{{ t.businessName }}</option>
              </select>
            </div>
            <div>
              <label class="field-label">İşletme adı</label>
              <input v-model="q.businessName" class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
            </div>
            <div>
              <label class="field-label">Yetkili</label>
              <input v-model="q.customerName" class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
            </div>
            <div>
              <label class="field-label">Telefon</label>
              <input v-model="q.phone" inputmode="tel" class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
            </div>
            <div class="sm:col-span-2">
              <label class="field-label">E-posta</label>
              <input v-model="q.email" type="email" class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
            </div>
          </div>
        </section>

        <!-- Abonelik -->
        <section class="bg-white rounded-2xl shadow-sm p-5">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 class="section-title">Abonelik</h2>
            <div class="flex rounded-lg overflow-hidden border border-gray-200">
              <button v-for="p in PERIODS" :key="p.value" type="button" @click="q.payload.period = p.value"
                      class="px-4 h-9 text-[13px] font-semibold"
                      :class="q.payload.period === p.value ? 'bg-accent text-white' : 'bg-white text-muted hover:text-primary'">
                {{ p.label }}
              </button>
            </div>
          </div>
          <p class="text-xs text-muted mb-4">
            Fiyatlar aylıktır. Yıllık ödemede aylık toplam × {{ q.payload.yearlyMonths }} ay
            <template v-if="q.payload.yearlyMonths < 12">({{ 12 - q.payload.yearlyMonths }} ay bedava)</template>.
          </p>

          <!-- Fiyatlar Fiyat Listesi'nden gelir; yalnız bu teklif için değiştirmek isteğe bağlı -->
          <div class="flex items-center justify-between gap-3 p-3 rounded-xl mb-1"
               :class="q.payload.customPricing ? 'bg-amber-50' : 'bg-gray-50'">
            <div class="min-w-0">
              <div class="text-[13px] font-semibold text-primary">Müşteri için fiyatlandır</div>
              <div class="text-xs text-muted">
                {{ q.payload.customPricing
                  ? 'Bu teklifteki fiyatları değiştirebilirsiniz; Fiyat Listesi etkilenmez.'
                  : 'Fiyatlar Fiyat Listesi\'nden gelir.' }}
              </div>
            </div>
            <button type="button" role="switch" :aria-checked="!!q.payload.customPricing" @click="toggleCustom"
                    class="relative w-11 h-6 rounded-full flex-shrink-0 transition-colors"
                    :class="q.payload.customPricing ? 'bg-amber-500' : 'bg-gray-300'">
              <span class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                    :class="q.payload.customPricing ? 'left-[22px]' : 'left-0.5'"/>
            </button>
          </div>
          <div v-if="listChanged" class="flex flex-wrap items-center gap-2 text-xs text-amber-700 px-1 py-2">
            Fiyat listesi bu teklif kaydedildikten sonra değişti; teklif kaydedildiği andaki fiyatlarla duruyor.
            <button type="button" class="font-semibold underline" @click="applyListPrices">Güncel fiyatları uygula</button>
          </div>

          <div class="divide-y divide-gray-100">
            <label class="flex items-center gap-3 py-3">
              <input type="checkbox" v-model="q.payload.base.on" class="w-4 h-4"/>
              <span class="flex-1 min-w-0">
                <span class="font-semibold text-primary text-[13.5px]">Temel paket</span>
                <span class="block text-xs text-muted">Kasa, yönetim paneli, raporlar, kullanıcılar ve işlem yetkileri</span>
              </span>
              <PriceInput v-if="q.payload.customPricing" v-model="q.payload.base.price" suffix="/ay"/>
              <span v-else class="w-28 text-right text-[13.5px] font-semibold text-primary tabular-nums whitespace-nowrap">{{ money(q.payload.base.price) }}<span class="text-muted font-normal text-[12px]">/ay</span></span>
            </label>

            <div class="flex flex-wrap items-center gap-3 py-3">
              <span class="flex-1 min-w-[180px]">
                <span class="font-semibold text-primary text-[13.5px]">Kasa sayısı</span>
                <span class="block text-xs text-muted">Temel pakette {{ q.payload.devices.included }} kasa dahil; fazlası kasa başına</span>
              </span>
              <input v-model.number="q.payload.devices.count" type="number" min="1" max="100"
                     class="w-20 px-3 h-9 border border-gray-200 rounded-lg text-[13.5px] text-center bg-white"/>
              <PriceInput v-if="q.payload.customPricing" v-model="q.payload.devices.price" suffix="/ay"/>
              <span v-else class="w-28 text-right text-[13.5px] font-semibold text-primary tabular-nums whitespace-nowrap">{{ money(q.payload.devices.price) }}<span class="text-muted font-normal text-[12px]">/ay</span></span>
            </div>

            <label v-for="m in q.payload.modules" :key="m.code" class="flex items-center gap-3 py-3">
              <input type="checkbox" v-model="m.on" class="w-4 h-4"/>
              <span class="flex-1 min-w-0">
                <span class="font-semibold text-[13.5px]" :class="m.on ? 'text-primary' : 'text-muted'">{{ m.name }}</span>
                <span class="block text-xs text-muted">{{ m.description }}</span>
              </span>
              <PriceInput v-if="q.payload.customPricing" v-model="m.price" suffix="/ay"/>
              <span v-else class="w-28 text-right text-[13.5px] font-semibold text-primary tabular-nums whitespace-nowrap">{{ money(m.price) }}<span class="text-muted font-normal text-[12px]">/ay</span></span>
            </label>
          </div>
        </section>

        <!-- Tek seferlik -->
        <section class="bg-white rounded-2xl shadow-sm p-5">
          <h2 class="section-title mb-4">Tek seferlik</h2>
          <label class="flex items-center gap-3 pb-3 border-b border-gray-100">
            <input type="checkbox" v-model="q.payload.setup.on" class="w-4 h-4"/>
            <span class="flex-1 font-semibold text-primary text-[13.5px]">Kurulum ve eğitim</span>
            <PriceInput v-if="q.payload.customPricing" v-model="q.payload.setup.price"/>
            <span v-else class="w-28 text-right text-[13.5px] font-semibold text-primary tabular-nums whitespace-nowrap">{{ money(q.payload.setup.price) }}<span class="text-muted font-normal text-[12px]"></span></span>
          </label>

          <div class="pt-3">
            <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span class="font-semibold text-primary text-[13.5px]">Donanım</span>
              <div class="flex flex-wrap gap-2">
                <select v-if="pricing.hardware.length" @change="addHardware($event)"
                        class="px-3 h-9 border border-gray-200 rounded-lg text-[13px] bg-white">
                  <option value="">Listeden ekle...</option>
                  <option v-for="(h, i) in pricing.hardware" :key="i" :value="i">{{ h.name }} — {{ money(h.price) }}</option>
                </select>
                <button class="btn-secondary btn-sm" @click="q.payload.hardware.push({ name: '', qty: 1, price: 0 })">+ Elle ekle</button>
              </div>
            </div>
            <div v-if="!q.payload.hardware.length" class="text-xs text-muted py-2">Donanım eklenmedi.</div>
            <div v-for="(h, i) in q.payload.hardware" :key="i" class="flex flex-wrap items-center gap-2 py-2">
              <input v-model="h.name" placeholder="Ürün (ör. 80 mm fiş yazıcı)"
                     class="flex-1 min-w-[160px] px-3 h-9 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
              <input v-model.number="h.qty" type="number" min="1" title="Adet"
                     class="w-16 px-2 h-9 border border-gray-200 rounded-lg text-[13.5px] text-center bg-white"/>
              <PriceInput v-model="h.price"/>
              <button class="chip-danger" @click="q.payload.hardware.splice(i, 1)">Sil</button>
            </div>
          </div>
        </section>

        <!-- İndirim + not -->
        <section class="bg-white rounded-2xl shadow-sm p-5">
          <h2 class="section-title mb-4">İndirim ve not</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DiscountInput v-model="q.payload.recurringDiscount" label="Abonelik indirimi"/>
            <DiscountInput v-model="q.payload.oneTimeDiscount" label="Tek seferlik indirim"/>
            <div>
              <label class="field-label">Geçerlilik</label>
              <input v-model="q.validUntil" type="date"
                     class="w-full px-3 h-10 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
            </div>
            <div class="sm:col-span-2">
              <label class="field-label">Teklif notu</label>
              <textarea v-model="q.payload.note" rows="3"
                        class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
            </div>
          </div>
        </section>
      </div>

      <!-- Özet -->
      <aside class="bg-white rounded-2xl shadow-sm p-5 lg:sticky lg:top-6">
        <h2 class="section-title mb-4">Özet</h2>

        <div class="space-y-1.5 text-[13.5px]">
          <div v-for="l in calc.recurringLines" :key="l.key" class="flex justify-between gap-3">
            <span class="text-muted min-w-0 truncate">{{ l.label }}</span>
            <span class="tabular-nums whitespace-nowrap">{{ money(l.monthly) }}</span>
          </div>
          <div v-if="!calc.recurringLines.length" class="text-muted text-xs">Abonelik kalemi seçilmedi.</div>
        </div>

        <div class="mt-3 pt-3 border-t border-gray-100 space-y-1.5 text-[13.5px]">
          <div class="flex justify-between"><span class="text-muted">Aylık toplam</span><span class="tabular-nums">{{ money(calc.monthly) }}</span></div>
          <div v-if="q.payload.period === 'yearly'" class="flex justify-between">
            <span class="text-muted">Yıllık ({{ q.payload.yearlyMonths }} ay)</span><span class="tabular-nums">{{ money(calc.periodSub) }}</span>
          </div>
          <div v-if="calc.recurringDiscount" class="flex justify-between text-success">
            <span>İndirim{{ discountNote(q.payload.recurringDiscount) }}</span><span class="tabular-nums">−{{ money(calc.recurringDiscount) }}</span>
          </div>
          <div class="flex justify-between items-baseline pt-1">
            <span class="font-semibold text-primary">{{ q.payload.period === 'yearly' ? 'Yıllık abonelik' : 'Aylık abonelik' }}</span>
            <span class="text-[22px] font-semibold text-primary tabular-nums whitespace-nowrap">{{ money(calc.recurringTotal) }}</span>
          </div>
          <div class="text-xs text-muted text-right">{{ calc.altText }}</div>
        </div>

        <div v-if="calc.oneTimeLines.length" class="mt-4 pt-3 border-t border-gray-100 space-y-1.5 text-[13.5px]">
          <div v-for="l in calc.oneTimeLines" :key="l.key" class="flex justify-between gap-3">
            <span class="text-muted min-w-0 truncate">{{ l.label }}</span>
            <span class="tabular-nums whitespace-nowrap">{{ money(l.total) }}</span>
          </div>
          <div v-if="calc.oneTimeDiscount" class="flex justify-between text-success">
            <span>İndirim{{ discountNote(q.payload.oneTimeDiscount) }}</span><span class="tabular-nums">−{{ money(calc.oneTimeDiscount) }}</span>
          </div>
          <div class="flex justify-between items-baseline pt-1">
            <span class="font-semibold text-primary">Tek seferlik</span>
            <span class="text-[18px] font-semibold text-primary tabular-nums whitespace-nowrap">{{ money(calc.oneTimeTotal) }}</span>
          </div>
        </div>

        <div class="mt-4 p-3 rounded-xl bg-gray-50 flex justify-between items-baseline gap-2">
          <span class="text-[13px] font-semibold text-primary">İlk ödeme</span>
          <span class="text-[15px] font-semibold text-primary tabular-nums whitespace-nowrap">{{ money(calc.firstPayment) }}</span>
        </div>

        <div class="mt-5 grid grid-cols-2 gap-2">
          <button class="btn-primary col-span-2" :disabled="saving" @click="save">
            {{ saving ? 'Kaydediliyor...' : (q.id ? 'Kaydet' : 'Teklifi kaydet') }}
          </button>
          <button class="btn-secondary" :disabled="saving" @click="printQuote">Yazdır / PDF</button>
          <button class="btn-success" :disabled="saving || !q.id" @click="applyToTenant"
                  :title="q.id ? '' : 'Önce kaydedin'">İşletmeye uygula</button>
        </div>
        <div v-if="q.id" class="mt-3 flex flex-wrap items-center gap-2">
          <span class="text-xs text-muted">Durum:</span>
          <button v-for="s in STATUSES" :key="s.value" @click="setStatus(s.value)"
                  class="px-2.5 h-7 rounded-md text-[12px] font-semibold border"
                  :class="q.status === s.value ? 'bg-accent text-white border-accent' : 'bg-white text-muted border-gray-200 hover:text-primary'">
            {{ s.label }}
          </button>
          <button class="chip-danger ml-auto" @click="remove">Sil</button>
        </div>
        <p v-if="message" class="mt-3 text-xs" :class="messageError ? 'text-danger' : 'text-success'">{{ message }}</p>
      </aside>
    </div>

    <!-- ── Yazdırılan teklif belgesi (yalnız yazdırırken görünür) ─────── -->
    <Teleport to="body">
      <div v-if="q.payload" class="teklif-belgesi">
        <div class="tb-ust">
          <img src="/brand/wordmark-dark.png" alt="YenPOS" class="tb-logo">
          <div class="tb-baslik">
            <div class="tb-tur">FİYAT TEKLİFİ</div>
            <div>{{ q.number || 'Taslak' }}</div>
            <div>Tarih: {{ date(q.createdAt || new Date()) }}</div>
            <div v-if="q.validUntil">Geçerlilik: {{ date(q.validUntil) }}</div>
          </div>
        </div>

        <div class="tb-musteri">
          <div class="tb-etiket">Sayın</div>
          <div class="tb-ad">{{ q.businessName || q.customerName }}</div>
          <div v-if="q.businessName && q.customerName">{{ q.customerName }}</div>
          <div>{{ [q.phone, q.email].filter(Boolean).join(' · ') }}</div>
        </div>

        <template v-if="calc.recurringLines.length">
          <div class="tb-bolum">ABONELİK ({{ q.payload.period === 'yearly' ? 'YILLIK' : 'AYLIK' }})</div>
          <table class="tb-tablo">
            <thead><tr><th>Kalem</th><th class="sag">Aylık</th><th v-if="q.payload.period === 'yearly'" class="sag">Yıllık ({{ q.payload.yearlyMonths }} ay)</th></tr></thead>
            <tbody>
              <tr v-for="l in calc.recurringLines" :key="l.key">
                <td>{{ l.label }}</td>
                <td class="sag">{{ money(l.monthly) }}</td>
                <td v-if="q.payload.period === 'yearly'" class="sag">{{ money(l.monthly * q.payload.yearlyMonths) }}</td>
              </tr>
            </tbody>
          </table>
          <div class="tb-toplamlar">
            <div v-if="calc.recurringDiscount"><span>Ara toplam</span><span>{{ money(calc.periodSub) }}</span></div>
            <div v-if="calc.recurringDiscount"><span>İndirim{{ discountNote(q.payload.recurringDiscount) }}</span><span>−{{ money(calc.recurringDiscount) }}</span></div>
            <div class="tb-genel"><span>{{ q.payload.period === 'yearly' ? 'Yıllık abonelik' : 'Aylık abonelik' }}</span><span>{{ money(calc.recurringTotal) }}</span></div>
          </div>
        </template>

        <template v-if="calc.oneTimeLines.length">
          <div class="tb-bolum">TEK SEFERLİK</div>
          <table class="tb-tablo">
            <thead><tr><th>Kalem</th><th class="sag">Adet</th><th class="sag">Birim</th><th class="sag">Tutar</th></tr></thead>
            <tbody>
              <tr v-for="l in calc.oneTimeLines" :key="l.key">
                <td>{{ l.label }}</td><td class="sag">{{ l.qty }}</td><td class="sag">{{ money(l.unit) }}</td><td class="sag">{{ money(l.total) }}</td>
              </tr>
            </tbody>
          </table>
          <div class="tb-toplamlar">
            <div v-if="calc.oneTimeDiscount"><span>Ara toplam</span><span>{{ money(calc.oneTimeSub) }}</span></div>
            <div v-if="calc.oneTimeDiscount"><span>İndirim{{ discountNote(q.payload.oneTimeDiscount) }}</span><span>−{{ money(calc.oneTimeDiscount) }}</span></div>
            <div class="tb-genel"><span>Tek seferlik toplam</span><span>{{ money(calc.oneTimeTotal) }}</span></div>
          </div>
        </template>

        <div class="tb-ilk"><span>İlk ödeme</span><span>{{ money(calc.firstPayment) }}</span></div>

        <div v-if="q.payload.note" class="tb-not">{{ q.payload.note }}</div>

        <div class="tb-alt">
          YenPOS · Yunus Emre Kütük · 0505 406 00 17 · info@yenpos.com · yenpos.com
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, defineComponent, h } from 'vue'
import api from '../api/api'
import { uiConfirm, uiAlert } from '../utils/dialog'
import PriceInput from '../components/PriceInput.vue'

// ── Küçük alan bileşenleri ────────────────────────────────────────────
const inputCls = 'px-3 h-9 border border-gray-200 rounded-lg text-[13.5px] text-right bg-white tabular-nums'
const DiscountInput = defineComponent({
  props: { modelValue: Object, label: String },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const set = patch => emit('update:modelValue', { ...props.modelValue, ...patch })
    return () => h('div', [
      h('label', { class: 'field-label' }, props.label),
      h('div', { class: 'flex gap-2' }, [
        h('input', {
          type: 'number', min: 0, step: '0.01', value: props.modelValue.value,
          class: inputCls + ' flex-1 h-10 min-w-0',
          onInput: e => set({ value: e.target.value === '' ? 0 : Number(e.target.value) })
        }),
        h('div', { class: 'flex rounded-lg overflow-hidden border border-gray-200' },
          [['percent', '%'], ['amount', '₺']].map(([v, t]) => h('button', {
            type: 'button',
            class: ['w-10 h-10 text-[13px] font-semibold', props.modelValue.type === v ? 'bg-accent text-white' : 'bg-white text-muted'],
            onClick: () => set({ type: v })
          }, t)))
      ])
    ])
  }
})

// ── Durum, biçim ──────────────────────────────────────────────────────
const STATUSES = [
  { value: 'Draft', label: 'Taslak', cls: 'bg-gray-100 text-muted' },
  { value: 'Sent', label: 'Gönderildi', cls: 'bg-blue-50 text-accent' },
  { value: 'Accepted', label: 'Kabul', cls: 'bg-green-50 text-success' },
  { value: 'Rejected', label: 'Red', cls: 'bg-red-50 text-danger' }
]
const PERIODS = [{ value: 'monthly', label: 'Aylık' }, { value: 'yearly', label: 'Yıllık' }]
const statusLabel = s => STATUSES.find(x => x.value === s)?.label ?? s
const statusClass = s => STATUSES.find(x => x.value === s)?.cls ?? ''
const nf = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const money = v => `${nf.format(Number(v) || 0)} ₺`
const date = d => d ? new Date(d).toLocaleDateString('tr-TR') : ''
const r2 = v => Math.round((Number(v) || 0) * 100) / 100
const discountNote = d => d?.type === 'percent' && d.value ? ` (%${d.value})` : ''

// ── Durum ─────────────────────────────────────────────────────────────
const tabs = computed(() => [
  { key: 'edit', label: q.id ? `Teklif ${q.number}` : 'Teklif hazırla' },
  { key: 'list', label: `Kayıtlı teklifler (${quotes.value.length})` }
])
const tab = ref('edit')
const loading = ref(true)
const loadError = ref('')
const pricing = reactive({ baseMonthly: 0, includedDevices: 1, extraDeviceMonthly: 0, setupFee: 0, yearlyMonths: 12,
  validityDays: 15, defaultNote: '', modulePrices: {}, hardware: [], modules: [] })
const tenants = ref([])
const quotes = ref([])
const search = ref('')
const statusFilter = ref('')
const saving = ref(false)
const message = ref('')
const messageError = ref(false)

function addDays(n) {
  const d = new Date(); d.setDate(d.getDate() + (Number(n) || 15))
  return d.toISOString().slice(0, 10)
}

function blankPayload() {
  return {
    period: 'monthly',
    yearlyMonths: pricing.yearlyMonths || 12,
    base: { on: true, price: pricing.baseMonthly },
    devices: { count: pricing.includedDevices || 1, included: pricing.includedDevices || 1, price: pricing.extraDeviceMonthly },
    modules: pricing.modules.map(m => ({ code: m.code, name: m.name, description: m.description, price: pricing.modulePrices[m.code] ?? 0, on: false })),
    setup: { on: pricing.setupFee > 0, price: pricing.setupFee },
    hardware: [],
    recurringDiscount: { type: 'percent', value: 0 },
    oneTimeDiscount: { type: 'percent', value: 0 },
    note: pricing.defaultNote,
    customPricing: false
  }
}

// ── Liste fiyatları / müşteriye özel fiyat ────────────────────────────
const listPrice = code => Number(pricing.modulePrices[code] ?? 0)
function pricesDiffer() {
  const p = q.payload
  if (!p) return false
  return Number(p.base.price) !== Number(pricing.baseMonthly)
    || Number(p.devices.price) !== Number(pricing.extraDeviceMonthly)
    || Number(p.devices.included) !== Number(pricing.includedDevices)
    || Number(p.setup.price) !== Number(pricing.setupFee)
    || Number(p.yearlyMonths) !== Number(pricing.yearlyMonths)
    || p.modules.some(m => Number(m.price) !== listPrice(m.code))
}
// Liste fiyatı kullanan (özel fiyatsız) kayıtlı teklif, liste sonradan değiştiyse uyarı gösterir
const listChanged = computed(() => !!q.payload && !q.payload.customPricing && pricesDiffer())
function applyListPrices() {
  const p = q.payload
  p.base.price = pricing.baseMonthly
  p.devices.price = pricing.extraDeviceMonthly
  p.devices.included = pricing.includedDevices
  p.setup.price = pricing.setupFee
  p.yearlyMonths = pricing.yearlyMonths
  for (const m of p.modules) m.price = listPrice(m.code)
}
async function toggleCustom() {
  const p = q.payload
  if (!p.customPricing) { p.customPricing = true; return }
  if (pricesDiffer() && !(await uiConfirm(
      'Bu teklife özel girdiğiniz fiyatlar silinip Fiyat Listesi\'ndeki fiyatlara dönülsün mü?',
      { title: 'Liste fiyatlarına dön', confirmText: 'Dön' }))) return
  applyListPrices()
  p.customPricing = false
}

const q = reactive({ id: null, number: '', status: 'Draft', customerName: '', businessName: '', phone: '', email: '',
  tenantId: null, validUntil: '', createdAt: null, appliedAt: null, payload: null })

function resetQuote() {
  Object.assign(q, { id: null, number: '', status: 'Draft', customerName: '', businessName: '', phone: '', email: '',
    tenantId: null, validUntil: addDays(pricing.validityDays), createdAt: null, appliedAt: null, payload: blankPayload() })
  message.value = ''
}

// ── Hesap ─────────────────────────────────────────────────────────────
function discountOf(d, base) {
  const v = Math.max(0, Number(d?.value) || 0)
  return r2(Math.min(base, d?.type === 'amount' ? v : base * v / 100))
}
const calc = computed(() => {
  const p = q.payload
  if (!p) return { recurringLines: [], oneTimeLines: [] }
  const recurringLines = []
  if (p.base.on) recurringLines.push({ key: 'base', label: 'Temel paket', monthly: r2(p.base.price) })
  const extra = Math.max(0, (Number(p.devices.count) || 1) - (p.devices.included || 1))
  if (extra > 0) recurringLines.push({ key: 'dev', label: `Ek kasa × ${extra}`, monthly: r2(extra * p.devices.price) })
  for (const m of p.modules.filter(m => m.on)) recurringLines.push({ key: m.code, label: m.name, monthly: r2(m.price) })
  const monthly = r2(recurringLines.reduce((s, l) => s + l.monthly, 0))
  const mult = p.period === 'yearly' ? p.yearlyMonths : 1
  const periodSub = r2(monthly * mult)
  const recurringDiscount = discountOf(p.recurringDiscount, periodSub)
  const recurringTotal = r2(periodSub - recurringDiscount)

  // Diğer dönemin karşılığı (aynı indirim oranıyla) — karşılaştırma için
  const rate = periodSub ? recurringTotal / periodSub : 1
  const altText = p.period === 'yearly'
    ? `Aylık ödemede ${money(r2(monthly * rate))} / ay`
    : `Yıllık ödemede ${money(r2(monthly * p.yearlyMonths * rate))} / yıl`

  const oneTimeLines = []
  if (p.setup.on) oneTimeLines.push({ key: 'setup', label: 'Kurulum ve eğitim', qty: 1, unit: r2(p.setup.price), total: r2(p.setup.price) })
  p.hardware.forEach((h, i) => {
    if (!h.name && !h.price) return
    const qty = Math.max(1, Number(h.qty) || 1)
    oneTimeLines.push({ key: 'hw' + i, label: h.name || 'Donanım', qty, unit: r2(h.price), total: r2(qty * h.price) })
  })
  const oneTimeSub = r2(oneTimeLines.reduce((s, l) => s + l.total, 0))
  const oneTimeDiscount = discountOf(p.oneTimeDiscount, oneTimeSub)
  const oneTimeTotal = r2(oneTimeSub - oneTimeDiscount)

  return { recurringLines, monthly, periodSub, recurringDiscount, recurringTotal, altText,
    oneTimeLines, oneTimeSub, oneTimeDiscount, oneTimeTotal, firstPayment: r2(recurringTotal + oneTimeTotal) }
})

// ── Yükleme ───────────────────────────────────────────────────────────
async function loadPricing() {
  const { data } = await api.getPricing()
  Object.assign(pricing, data)
}
async function loadQuotes() {
  const { data } = await api.getQuotes()
  quotes.value = data
}
onMounted(async () => {
  try {
    await Promise.all([loadPricing(), loadQuotes(),
      api.getAllTenants().then(r => (tenants.value = r.data)).catch(() => {})])
    resetQuote()
  } catch (e) {
    loadError.value = e.response?.data?.message || 'Yüklenemedi.'
  } finally {
    loading.value = false
  }
})

const shownQuotes = computed(() => {
  const s = search.value.trim().toLocaleLowerCase('tr')
  return quotes.value.filter(x =>
    (!statusFilter.value || x.status === statusFilter.value) &&
    (!s || [x.number, x.customerName, x.businessName, x.phone].some(v => (v || '').toLocaleLowerCase('tr').includes(s))))
})

function newQuote() { resetQuote(); tab.value = 'edit' }

async function openQuote(id) {
  try {
    const { data } = await api.getQuote(id)
    // Kayıttan sonra kataloğa eklenen modüller de seçilebilsin (seçilmemiş olarak)
    const payload = data.payload
    const have = new Set(payload.modules.map(m => m.code))
    for (const m of pricing.modules.filter(m => !have.has(m.code)))
      payload.modules.push({ code: m.code, name: m.name, description: m.description, price: pricing.modulePrices[m.code] ?? 0, on: false })
    Object.assign(q, {
      id: data.id, number: data.number, status: data.status, customerName: data.customerName || '',
      businessName: data.businessName || '', phone: data.phone || '', email: data.email || '',
      tenantId: data.tenantId ?? null, validUntil: data.validUntil ? data.validUntil.slice(0, 10) : '',
      createdAt: data.createdAt, appliedAt: data.appliedAt, payload
    })
    message.value = ''
    tab.value = 'edit'
  } catch (e) {
    uiAlert(e.response?.data?.message || 'Teklif açılamadı.')
  }
}

function fillFromTenant() {
  const t = tenants.value.find(x => x.id === q.tenantId)
  if (!t) return
  q.businessName = t.businessName
  if (!q.customerName && t.contactPerson) q.customerName = t.contactPerson
  if (!q.phone && t.phone) q.phone = t.phone
  if (!q.email && t.email) q.email = t.email
}

function addHardware(e) {
  const item = pricing.hardware[Number(e.target.value)]
  if (item) q.payload.hardware.push({ name: item.name, qty: 1, price: item.price })
  e.target.value = ''
}

// ── Kaydet / durum / sil ──────────────────────────────────────────────
function body() {
  return {
    customerName: q.customerName, businessName: q.businessName, phone: q.phone, email: q.email,
    tenantId: q.tenantId, period: q.payload.period,
    recurringTotal: calc.value.recurringTotal, oneTimeTotal: calc.value.oneTimeTotal,
    validUntil: q.validUntil || null,
    // Kalemler o anki fiyatlarıyla saklanır; seçilmeyen modüller saklanmaz
    payload: { ...q.payload, modules: q.payload.modules.filter(m => m.on) }
  }
}

function flash(text, error = false) {
  message.value = text; messageError.value = error
  setTimeout(() => { if (message.value === text) message.value = '' }, 4000)
}

async function save() {
  if (!q.customerName.trim() && !q.businessName.trim()) {
    uiAlert('Müşteri ya da işletme adını yazın.'); return false
  }
  saving.value = true
  try {
    const { data } = q.id ? await api.updateQuote(q.id, body()) : await api.createQuote(body())
    Object.assign(q, { id: data.id, number: data.number, status: data.status, createdAt: data.createdAt })
    await loadQuotes()
    flash('Kaydedildi.')
    return true
  } catch (e) {
    flash(e.response?.data?.message || 'Kaydedilemedi.', true)
    return false
  } finally {
    saving.value = false
  }
}

async function setStatus(status) {
  try {
    const { data } = await api.setQuoteStatus(q.id, { status })
    q.status = data.status
    await loadQuotes()
  } catch (e) { uiAlert(e.response?.data?.message || 'Durum değiştirilemedi.') }
}

async function remove() {
  if (!(await uiConfirm(`${q.number} numaralı teklif silinsin mi?`, { title: 'Teklifi sil', confirmText: 'Sil', danger: true }))) return
  try {
    await api.deleteQuote(q.id)
    await loadQuotes()
    resetQuote()
  } catch (e) { uiAlert(e.response?.data?.message || 'Silinemedi.') }
}

// ── Yazdır ────────────────────────────────────────────────────────────
async function printQuote() {
  // Numara ve tarih belgede görünsün diye önce kaydedilir
  if (!(await save())) return
  const old = document.title
  document.title = `YenPOS Teklif ${q.number} - ${q.businessName || q.customerName}`
  setTimeout(() => {
    window.print()
    document.title = old
    if (q.status === 'Draft') setStatus('Sent')
  }, 50)
}

// ── İşletmeye uygula ──────────────────────────────────────────────────
async function applyToTenant() {
  if (!q.tenantId) {
    uiAlert('Teklifin uygulanacağı işletmeyi "Müşteri" bölümündeki "Var olan işletme" listesinden seçin. ' +
            'İşletme henüz yoksa önce Müşteri Yönetimi\'nden oluşturun.')
    return
  }
  const t = tenants.value.find(x => x.id === q.tenantId)
  const mods = q.payload.modules.filter(m => m.on).map(m => m.name)
  const ok = await uiConfirm(
    `${t?.businessName ?? 'İşletme'} için:\n\n` +
    `• Modüller: ${mods.length ? mods.join(', ') : 'yok (yalnız temel paket)'}\n` +
    `• Bağlanabilecek kasa: ${q.payload.devices.count}\n\n` +
    'İşletmede açık olup bu teklifte olmayan modüller kapatılır.',
    { title: 'Teklifi işletmeye uygula', confirmText: 'Uygula' })
  if (!ok) return
  if (!(await save())) return
  try {
    const { data } = await api.applyQuote(q.id, { tenantId: q.tenantId })
    Object.assign(q, { status: data.quote.status, appliedAt: data.quote.appliedAt })
    await loadQuotes()
    uiAlert(data.message, { title: 'Uygulandı' })
  } catch (e) {
    uiAlert(e.response?.data?.message || 'Uygulanamadı.')
  }
}

</script>

<style>
/* Teklif belgesi: ekranda gizli, yazdırırken sayfanın tek içeriği */
.teklif-belgesi { display: none; }
@media print {
  @page { size: A4; margin: 14mm; }
  body > *:not(.teklif-belgesi) { display: none !important; }
  body { background: #fff !important; }
  .teklif-belgesi { display: block; color: #0f172a; font-family: Inter, Arial, sans-serif; font-size: 11pt; }
  .tb-ust { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; }
  .tb-logo { height: 42px; }
  .tb-baslik { text-align: right; font-size: 10pt; color: #475569; line-height: 1.5; }
  .tb-tur { font-size: 16pt; font-weight: 700; color: #0f172a; letter-spacing: .04em; }
  .tb-musteri { margin: 18px 0 8px; line-height: 1.5; }
  .tb-etiket { font-size: 9pt; color: #64748b; }
  .tb-ad { font-size: 14pt; font-weight: 700; }
  .tb-bolum { margin: 18px 0 6px; font-weight: 700; font-size: 11pt; letter-spacing: .05em; color: #334155; }
  .tb-tablo { width: 100%; border-collapse: collapse; }
  .tb-tablo th { text-align: left; font-size: 9pt; color: #64748b; border-bottom: 1px solid #cbd5e1; padding: 6px 4px; }
  .tb-tablo td { padding: 6px 4px; border-bottom: 1px solid #e2e8f0; }
  .tb-tablo .sag { text-align: right; white-space: nowrap; }
  .tb-toplamlar { margin-left: auto; width: 60%; margin-top: 6px; }
  .tb-toplamlar > div { display: flex; justify-content: space-between; padding: 3px 4px; }
  .tb-genel { font-weight: 700; border-top: 1px solid #0f172a; margin-top: 2px; }
  .tb-ilk { display: flex; justify-content: space-between; margin-top: 18px; padding: 10px 12px; background: #f1f5f9 !important;
            -webkit-print-color-adjust: exact; print-color-adjust: exact; font-weight: 700; font-size: 12pt; }
  .tb-not { margin-top: 16px; white-space: pre-line; font-size: 10pt; color: #334155; }
  .tb-alt { margin-top: 28px; padding-top: 10px; border-top: 1px solid #cbd5e1; font-size: 9pt; color: #64748b; text-align: center; }
}
</style>
