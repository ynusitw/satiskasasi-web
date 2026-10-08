<template>
  <div class="p-6 lg:p-8">

    <!-- Başlık -->
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="page-title">Cari Kartlar</h1>
        <p class="page-subtitle">Müşteri ve tedarikçi hesap yönetimi</p>
      </div>
      <button @click="openCreate"
              class="btn-primary btn-lg flex items-center gap-2">
        <span>+</span> Yeni Cari Ekle
      </button>
    </div>

    <!-- İstatistik Kartları -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <div class="text-xs text-muted mb-1">Toplam Cari</div>
        <div class="text-2xl font-semibold tracking-tight text-primary">{{ store.carilerWithBakiye.length }}</div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <div class="text-xs text-muted mb-1">Borçlu</div>
        <div class="text-2xl font-semibold tracking-tight text-danger">{{ borcluSayisi }}</div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <div class="text-xs text-muted mb-1">Alacaklı</div>
        <div class="text-2xl font-semibold tracking-tight text-primary">{{ alacakliSayisi }}</div>
      </div>
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <div class="text-xs text-muted mb-1">Net Pozisyon</div>
        <div class="text-2xl font-semibold tracking-tight" :class="netBakiye > 0 ? 'text-danger' : netBakiye < 0 ? 'text-success' : 'text-muted'">
          {{ fmt(Math.abs(netBakiye)) }}
        </div>
      </div>
    </div>

    <!-- Arama & Filtre -->
    <div class="flex flex-wrap gap-3 mb-4">
      <input v-model="search" placeholder="Ad, telefon veya vergi no ara..."
             class="flex-1 min-w-48 px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
      <select v-model="filterTip" @change="filterGrup = ''"
              class="px-3 border border-gray-200 rounded-lg text-[13.5px] bg-white h-10">
        <option value="">Tümü</option>
        <option value="Müşteri">Müşteri (alıcı)</option>
        <option value="Tedarikçi">Tedarikçi (satıcı)</option>
      </select>
      <select v-model="filterGrup" class="px-3 border border-gray-200 rounded-lg text-[13.5px] bg-white h-10">
        <option value="">Tüm gruplar</option>
        <option value="none">Grupsuz</option>
        <optgroup v-for="t in ['Müşteri', 'Tedarikçi']" :key="t" :label="t"
                  v-show="!filterTip || filterTip === t">
          <option v-for="g in groups.filter(x => x.type === t)" :key="g.id" :value="g.id">{{ g.name }}</option>
        </optgroup>
      </select>
      <button class="btn-secondary h-10" @click="groupModal.open = true">Grupları yönet</button>
    </div>

    <!-- Tablo -->
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase">Tip</th>
              <th class="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase">Unvan / Ad Soyad</th>
              <th class="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase hidden md:table-cell">Telefon</th>
              <th class="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase hidden lg:table-cell">Vergi / TC No</th>
              <th v-if="loyaltyOn" class="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase">Puan</th>
              <th class="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase">Güncel Bakiye</th>
              <th class="text-right px-5 py-3 text-[11px] font-semibold text-muted uppercase hidden lg:table-cell">Risk Limiti</th>
              <th class="text-left px-5 py-3 text-[11px] font-semibold text-muted uppercase hidden xl:table-cell">Son İşlem</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!filtered.length">
              <td :colspan="loyaltyOn ? 9 : 8" class="text-center py-12 text-muted">Cari bulunamadı</td>
            </tr>
            <tr v-for="c in filtered" :key="c.id"
                class="border-t border-gray-50 hover:bg-gray-50 transition-colors">

              <td class="px-5 py-4">
                <span class="text-xs font-bold px-2.5 py-1 rounded-full"
                      :class="c.tip === 'Müşteri'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'">
                  {{ c.tip }}
                </span>
                <div v-if="groupName(c.grupId)" class="text-[11px] text-muted mt-1">{{ groupName(c.grupId) }}</div>
              </td>

              <td class="px-5 py-4">
                <div class="font-semibold text-primary text-sm">{{ c.unvan }}</div>
                <div v-if="c.email" class="text-xs text-muted">{{ c.email }}</div>
              </td>

              <td class="px-5 py-4 text-sm text-muted hidden md:table-cell whitespace-nowrap">{{ c.telefon || '—' }}</td>
              <td class="px-5 py-4 text-sm font-mono text-muted hidden lg:table-cell">{{ c.vergiNo || '—' }}</td>

              <!-- Sadakat puanı -->
              <td v-if="loyaltyOn" class="px-5 py-4 text-right">
                <button v-if="c.sadakatOnay" class="text-sm font-semibold text-accent hover:underline" @click="openLoyalty(c)">
                  {{ fmtNum(c.puan) }}
                </button>
                <span v-else-if="c.tip === 'Müşteri'" class="text-xs text-muted whitespace-nowrap" title="KVKK onayı yok; puan işlenmez">üye değil</span>
                <span v-else class="text-muted">—</span>
              </td>

              <!-- Canlı bakiye -->
              <td class="px-5 py-4 text-right">
                <span class="text-sm font-bold"
                      :class="c.bakiye > 0 ? 'text-danger' : c.bakiye < 0 ? 'text-success' : 'text-muted'">
                  {{ fmt(Math.abs(c.bakiye)) }}
                </span>
                <div class="text-xs mt-0.5"
                     :class="c.bakiye > 0 ? 'text-danger/70' : c.bakiye < 0 ? 'text-success/70' : 'text-muted'">
                  {{ c.bakiye > 0 ? 'Borçlu' : c.bakiye < 0 ? 'Alacaklı' : 'Sıfır' }}
                </div>
              </td>

              <!-- Risk limiti -->
              <td class="px-5 py-4 text-right text-sm hidden lg:table-cell">
                <span :class="c.riskLimiti > 0 && c.bakiye > c.riskLimiti ? 'text-danger font-bold' : 'text-muted'">
                  {{ c.riskLimiti > 0 ? fmt(c.riskLimiti) : 'Sınırsız' }}
                </span>
                <div v-if="c.riskLimiti > 0 && c.bakiye > c.riskLimiti"
                     class="text-xs text-danger mt-0.5">Limit aşıldı</div>
              </td>

              <!-- Son işlem -->
              <td class="px-5 py-4 hidden xl:table-cell">
                <template v-if="c.sonIslem">
                  <div class="text-xs font-semibold text-primary">{{ c.sonIslem.belgeNo }}</div>
                  <div class="text-xs text-muted">{{ c.sonIslem.tarih }}</div>
                </template>
                <span v-else class="text-muted text-sm">—</span>
              </td>

              <td class="px-5 py-4">
                <div class="flex gap-2 justify-end">
                  <button @click="goEkstre(c)"
                          class="btn-secondary">
                    Ekstre
                  </button>
                  <button @click="openEdit(c)"
                          class="chip-accent">
                    Düzenle
                  </button>
                  <button @click="deleteCari(c)"
                          class="chip-danger">
                    Sil
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="modal.show"
           class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
          <h2 class="modal-title mb-6">
            {{ modal.editing ? 'Cari Düzenle' : 'Yeni Cari Ekle' }}
          </h2>

          <div class="space-y-4">
            <div>
              <label class="field-label">Cari Tipi *</label>
              <div class="flex gap-3">
                <label v-for="t in ['Müşteri','Tedarikçi']" :key="t"
                       class="flex items-center gap-2 cursor-pointer flex-1 border-2 rounded-xl p-3 transition-all"
                       :class="form.tip === t ? 'border-accent bg-blue-50' : 'border-gray-200'">
                  <input type="radio" v-model="form.tip" :value="t" class="accent-accent"/>
                  <span class="text-sm font-semibold">{{ t }}</span>
                </label>
              </div>
            </div>

            <div>
              <label class="field-label">Grup</label>
              <select v-model="form.grupId" class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white">
                <option :value="null">Grupsuz</option>
                <option v-for="g in groups.filter(x => x.type === form.tip)" :key="g.id" :value="g.id">{{ g.name }}</option>
              </select>
            </div>

            <div>
              <label class="field-label">Unvan / Ad Soyad *</label>
              <input v-model="form.unvan" placeholder="Firma adı veya ad soyad"
                     class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="field-label">Telefon</label>
                <input v-model="form.telefon" placeholder="0500 000 0000"
                       class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
              </div>
              <div>
                <label class="field-label">E-posta</label>
                <input v-model="form.email" type="email" placeholder="ornek@mail.com"
                       class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="field-label">Vergi No / TC No</label>
                <input v-model="form.vergiNo" placeholder="0000000000"
                       class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
              </div>
              <div>
                <label class="field-label">Risk Limiti (₺)</label>
                <input v-model.number="form.riskLimiti" type="number" min="0"
                       class="w-full px-3 border border-gray-200 rounded-lg text-[13.5px] h-10 bg-white"/>
              </div>
            </div>

            <label v-if="loyaltyOn && form.tip === 'Müşteri'" class="flex items-start gap-2 p-3 rounded-xl border border-gray-200 cursor-pointer">
              <input v-model="form.sadakatOnay" type="checkbox" class="mt-0.5 accent-accent"/>
              <span class="text-sm">
                <b>Sadakat programı üyesi</b> — müşteri telefonunun ve alışverişlerinin sadakat programı için
                kaydedilmesine onay verdi (KVKK).
                <span v-if="form.onayTarihi" class="block text-xs text-muted mt-0.5">Onay: {{ new Date(form.onayTarihi).toLocaleString('tr-TR') }}</span>
              </span>
            </label>

            <div>
              <label class="field-label">Adres</label>
              <textarea v-model="form.adres" rows="2" placeholder="Açık adres"
                        class="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13.5px] resize-none bg-white"/>
            </div>
          </div>

          <div v-if="error" class="mt-4 p-3 bg-red-50 text-danger rounded-xl text-sm">{{ error }}</div>

          <div class="flex gap-3 mt-6 justify-end">
            <button @click="modal.show = false"
                    class="btn-secondary">
              İptal
            </button>
            <button @click="save"
                    class="btn-primary">
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Grupları yönet -->
    <div v-if="groupModal.open" class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
         @click.self="groupModal.open = false">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-7 max-h-[90vh] overflow-y-auto">
        <h2 class="modal-title mb-1">Cari Grupları</h2>
        <p class="text-xs text-muted mb-5">Müşteri (alıcı) ve tedarikçi (satıcı) altında kendi sınıflarınızı oluşturun; ör. VIP, Toptancı.</p>
        <div v-for="t in ['Müşteri', 'Tedarikçi']" :key="t" class="mb-5">
          <div class="text-xs font-bold uppercase tracking-wide text-muted mb-2">{{ t === 'Müşteri' ? 'Müşteri (alıcı)' : 'Tedarikçi (satıcı)' }}</div>
          <div v-for="g in groups.filter(x => x.type === t)" :key="g.id" class="flex items-center gap-2 mb-1.5">
            <input v-model="g.name" maxlength="60" @change="renameGroup(g)"
                   class="flex-1 px-3 h-9 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
            <button class="btn-ghost btn-sm text-danger" @click="removeGroup(g)">Sil</button>
          </div>
          <div class="flex items-center gap-2">
            <input v-model="newGroup[t]" maxlength="60" :placeholder="t === 'Müşteri' ? 'Yeni grup (ör. VIP)' : 'Yeni grup (ör. Toptancı)'"
                   @keydown.enter="addGroup(t)" class="flex-1 px-3 h-9 border border-dashed border-gray-300 rounded-lg text-[13.5px] bg-white"/>
            <button class="btn-secondary btn-sm" :disabled="!newGroup[t]?.trim()" @click="addGroup(t)">Ekle</button>
          </div>
        </div>
        <div v-if="groupModal.error" class="p-3 rounded-xl bg-red-50 text-red-600 text-sm mb-3">{{ groupModal.error }}</div>
        <div class="flex justify-end"><button class="btn-primary" @click="groupModal.open = false">Tamam</button></div>
      </div>
    </div>

    <!-- Sadakat detayı -->
    <div v-if="loyalty.open" class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
         @click.self="loyalty.open = false">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-7 max-h-[92vh] overflow-y-auto">
        <div v-if="!loyalty.data" class="text-sm text-muted">Yükleniyor...</div>
        <template v-else>
          <h2 class="modal-title">{{ loyalty.data.name }}</h2>
          <p class="text-xs text-muted mb-5">
            {{ loyalty.data.phone || 'telefon yok' }} · üyelik onayı {{ fmtDate(loyalty.data.consentAt) }}
            <template v-if="loyalty.data.lastAt"> · son hareket {{ fmtDate(loyalty.data.lastAt) }}</template>
          </p>
          <div class="grid grid-cols-2 gap-3 mb-5">
            <div class="rounded-xl bg-blue-50 p-4">
              <div class="text-xs font-semibold text-accent uppercase">Puan</div>
              <div class="text-2xl font-semibold text-primary mt-1">{{ fmtNum(loyalty.data.points) }}</div>
              <div class="text-xs text-muted">= {{ fmt(loyalty.data.points) }} indirim</div>
            </div>
            <div class="rounded-xl bg-gray-50 p-4">
              <div class="text-xs font-semibold text-muted uppercase mb-2">Damgalar</div>
              <div v-if="!loyalty.data.stamps.length" class="text-sm text-muted">Damga kartı yok</div>
              <div v-for="st in loyalty.data.stamps" :key="st.cardId" class="mb-1.5">
                <div class="flex justify-between text-sm"><span class="text-primary">{{ st.name }}</span>
                  <b class="text-primary">{{ st.count }} / {{ st.required }}</b></div>
                <div class="h-1.5 bg-white rounded-full overflow-hidden mt-1">
                  <div class="h-full bg-accent rounded-full" :style="{ width: Math.min(100, st.count * 100 / st.required) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="border border-gray-200 rounded-xl p-4 mb-5">
            <div class="text-sm font-semibold text-primary mb-2">Elle düzeltme</div>
            <div class="grid grid-cols-3 gap-2">
              <input v-model.number="loyalty.adj.points" type="number" step="1" placeholder="Puan (+/-)"
                     class="px-3 h-9 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
              <select v-model="loyalty.adj.cardId" class="px-3 h-9 border border-gray-200 rounded-lg text-[13.5px] bg-white">
                <option :value="null">Damga kartı yok</option>
                <option v-for="st in loyalty.data.stamps" :key="st.cardId" :value="st.cardId">{{ st.name }}</option>
              </select>
              <input v-model.number="loyalty.adj.stamps" type="number" step="1" placeholder="Damga (+/-)" :disabled="!loyalty.adj.cardId"
                     class="px-3 h-9 border border-gray-200 rounded-lg text-[13.5px] bg-white"/>
            </div>
            <input v-model="loyalty.adj.note" maxlength="200" placeholder="Açıklama (zorunlu) — ör. hatalı satış düzeltmesi"
                   class="w-full px-3 h-9 border border-gray-200 rounded-lg text-[13.5px] bg-white mt-2"/>
            <div class="flex items-center justify-between mt-2">
              <span class="text-xs text-danger">{{ loyalty.error }}</span>
              <button class="btn-secondary btn-sm" :disabled="loyalty.busy" @click="adjustLoyalty">Uygula</button>
            </div>
          </div>

          <div class="text-sm font-semibold text-primary mb-2">Geçmiş</div>
          <div class="border border-gray-100 rounded-xl divide-y divide-gray-50 max-h-64 overflow-y-auto">
            <div v-if="!loyalty.data.history.length" class="p-4 text-sm text-muted text-center">Hareket yok.</div>
            <div v-for="h in loyalty.data.history" :key="h.id" class="px-4 py-2 flex items-center justify-between gap-3 text-sm">
              <div class="min-w-0">
                <div class="text-primary">{{ TX[h.type] || h.type }}<span v-if="h.card" class="text-muted"> · {{ h.card }}</span></div>
                <div class="text-xs text-muted truncate">{{ fmtDate(h.date) }}<template v-if="h.saleId"> · satış #{{ h.saleId }}</template><template v-if="h.note"> · {{ h.note }}</template></div>
              </div>
              <div class="text-right font-semibold whitespace-nowrap" :class="(h.points || h.stamps) < 0 ? 'text-danger' : 'text-success'">
                <template v-if="h.points">{{ h.points > 0 ? '+' : '' }}{{ fmtNum(h.points) }} puan</template>
                <template v-if="h.stamps">{{ h.stamps > 0 ? '+' : '' }}{{ h.stamps }} damga</template>
              </div>
            </div>
          </div>
          <div class="flex justify-end mt-5"><button class="btn-primary" @click="loyalty.open = false">Kapat</button></div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { uiAlert, uiConfirm } from '../../utils/dialog'
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCariStore } from '../../stores/cari'
import { useModulesStore } from '../../stores/modules'
import { MODULES } from '../../constants/modules'
import api from '../../api/api'

const router = useRouter()
const store  = useCariStore()

const search    = ref('')
const filterTip = ref('')
const filterGrup = ref('')
const groups    = ref([])
const modules   = useModulesStore()
const loyaltyOn = computed(() => modules.has(MODULES.LOYALTY))
const modal     = reactive({ show: false, editing: false })
const saving    = ref(false)
const error     = ref('')
const form      = reactive({ id: 0, tip: 'Müşteri', unvan: '', telefon: '', email: '', vergiNo: '', riskLimiti: 5000, adres: '', grupId: null, sadakatOnay: false, onayTarihi: null })

onMounted(() => { store.fetchCariler(); loadGroups() })

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return store.carilerWithBakiye.filter(c => {
    const matchTip    = !filterTip.value || c.tip === filterTip.value
    const matchGrup   = !filterGrup.value || (filterGrup.value === 'none' ? !c.grupId : c.grupId === filterGrup.value)
    const matchSearch = !q || c.unvan.toLowerCase().includes(q) ||
      (c.telefon || '').includes(q) || (c.vergiNo || '').includes(q)
    return matchTip && matchGrup && matchSearch
  })
})

const borcluSayisi   = computed(() => store.carilerWithBakiye.filter(c => c.bakiye > 0).length)
const alacakliSayisi = computed(() => store.carilerWithBakiye.filter(c => c.bakiye < 0).length)
const netBakiye      = computed(() => store.carilerWithBakiye.reduce((s, c) => s + c.bakiye, 0))

function fmt(v) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0) + ' ₺'
}

function openCreate() {
  Object.assign(form, { id: 0, tip: 'Müşteri', unvan: '', telefon: '', email: '', vergiNo: '', riskLimiti: 5000, adres: '', grupId: null, sadakatOnay: false, onayTarihi: null })
  modal.editing = false; modal.show = true; error.value = ''
}

function openEdit(c) {
  Object.assign(form, { ...c })
  modal.editing = true; modal.show = true; error.value = ''
}

async function save() {
  if (!form.unvan.trim()) { error.value = 'Unvan zorunludur.'; return }
  saving.value = true
  error.value  = ''
  try {
    if (modal.editing) {
      await store.cariGuncelle({ ...form })
    } else {
      await store.cariEkle({ ...form })
    }
    modal.show = false
  } catch {
    error.value = 'İşlem sırasında hata oluştu.'
  } finally {
    saving.value = false
  }
}

async function deleteCari(c) {
  if (!await uiConfirm(`"${c.unvan}" ve tüm işlem geçmişi silinsin mi?`)) return
  try {
    await store.cariSil(c.id)
  } catch {
    await uiAlert('Silme işlemi başarısız.')
  }
}

// ── Gruplar ────────────────────────────────────────────────────────────
const groupModal = reactive({ open: false, error: '' })
const newGroup = reactive({ Müşteri: '', Tedarikçi: '' })
const groupName = id => groups.value.find(g => g.id === id)?.name

async function loadGroups() {
  try { groups.value = (await api.getCariGroups()).data } catch { /* eski API */ }
}
async function addGroup(type) {
  const name = (newGroup[type] || '').trim()
  if (!name) return
  groupModal.error = ''
  try { await api.createCariGroup({ name, type }); newGroup[type] = ''; await loadGroups() }
  catch (e) { groupModal.error = e.response?.data?.message || 'Eklenemedi.' }
}
async function renameGroup(g) {
  groupModal.error = ''
  try { await api.updateCariGroup(g.id, { name: g.name, type: g.type }) }
  catch (e) { groupModal.error = e.response?.data?.message || 'Kaydedilemedi.'; await loadGroups() }
}
async function removeGroup(g) {
  if (!await uiConfirm(`"${g.name}" grubu silinsin mi? Bu gruptaki cariler grupsuz kalır.`)) return
  try { await api.deleteCariGroup(g.id); await loadGroups(); await store.fetchCariler() }
  catch (e) { groupModal.error = e.response?.data?.message || 'Silinemedi.' }
}

// ── Sadakat detayı ─────────────────────────────────────────────────────
const TX = { Earn: 'Puan kazandı', Redeem: 'Puan kullandı', StampEarn: 'Damga kazandı', StampRedeem: 'Bedava ürün aldı', Expire: 'Süresi doldu', Adjust: 'Düzeltme' }
const loyalty = reactive({ open: false, id: null, data: null, busy: false, error: '', adj: { points: null, cardId: null, stamps: null, note: '' } })
const fmtNum = v => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(v ?? 0)
const fmtDate = v => v ? new Date(v).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

async function openLoyalty(c) {
  Object.assign(loyalty, { open: true, id: c.id, data: null, error: '', adj: { points: null, cardId: null, stamps: null, note: '' } })
  try { loyalty.data = (await api.getLoyaltyCari(c.id)).data }
  catch (e) { loyalty.open = false; await uiAlert(e.response?.data?.message || 'Sadakat bilgisi alınamadı.') }
}
async function adjustLoyalty() {
  const a = loyalty.adj
  if (!a.points && !(a.cardId && a.stamps)) { loyalty.error = 'Puan ya da damga girin.'; return }
  if (!a.note.trim()) { loyalty.error = 'Açıklama zorunlu.'; return }
  loyalty.busy = true
  loyalty.error = ''
  try {
    await api.adjustLoyalty(loyalty.id, { points: a.points || 0, stampCardId: a.cardId, stamps: a.stamps || 0, note: a.note })
    loyalty.data = (await api.getLoyaltyCari(loyalty.id)).data
    loyalty.adj = { points: null, cardId: null, stamps: null, note: '' }
    await store.fetchCariler()
  } catch (e) {
    loyalty.error = e.response?.data?.message || 'Uygulanamadı.'
  } finally {
    loyalty.busy = false
  }
}

function goEkstre(c) {
  router.push(`/cari/ekstre?id=${c.id}`)
}
</script>
