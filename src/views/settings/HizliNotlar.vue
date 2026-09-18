<template>
  <div class="p-8 max-w-6xl">

    <div class="mb-6">
      <h1 class="text-2xl font-bold text-primary">Hızlı Notlar</h1>
      <p class="text-muted mt-1 text-sm">
        Kasiyerin sipariş satırına tek tıkla ekleyebileceği hazır notlar.
        Kasada serbest metin yazmak her zaman mümkün — bu liste bir kısıt değil, kısayoldur.
      </p>
    </div>

    <div v-if="loading" class="text-muted">Yükleniyor...</div>

    <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

      <!-- YENİ NOT + LİSTE -->
      <div class="bg-white rounded-2xl shadow-sm p-6">
        <h2 class="font-semibold text-primary mb-4">Not Ekle</h2>

        <form @submit.prevent="create" class="flex gap-2">
          <input v-model="newText" type="text" maxlength="40"
                 placeholder="Örn: Şekersiz"
                 class="flex-1 min-w-0 border rounded-lg px-3 py-2 text-sm"/>
          <button type="submit" :disabled="!newText.trim() || saving"
                  class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold
                         disabled:opacity-50 whitespace-nowrap">
            Ekle
          </button>
        </form>

        <p v-if="error" class="text-red-600 text-sm mt-3">{{ error }}</p>

        <div class="mt-6">
          <h3 class="font-semibold text-primary mb-3 text-sm">
            Tanımlı Notlar
            <span class="text-muted font-normal">({{ notes.length }})</span>
          </h3>

          <div v-if="notes.length === 0" class="text-muted text-sm py-6 text-center">
            Henüz not eklenmedi.
          </div>

          <ul v-else class="space-y-2">
            <li v-for="(n, i) in notes" :key="n.id"
                class="flex items-center gap-2 border rounded-lg px-3 py-2">

              <!-- Sıra: kasada bu sırayla görünür -->
              <div class="flex flex-col">
                <button @click="move(i, -1)" :disabled="i === 0"
                        class="text-xs leading-none text-muted disabled:opacity-25"
                        title="Yukarı">▲</button>
                <button @click="move(i, 1)" :disabled="i === notes.length - 1"
                        class="text-xs leading-none text-muted disabled:opacity-25"
                        title="Aşağı">▼</button>
              </div>

              <input v-model="n.text" maxlength="40"
                     @blur="save(n)" @keyup.enter="$event.target.blur()"
                     class="flex-1 min-w-0 bg-transparent text-sm px-1 py-1 outline-none
                            focus:bg-gray-50 rounded"/>

              <label class="flex items-center gap-1.5 text-xs text-muted whitespace-nowrap">
                <input type="checkbox" v-model="n.isActive" @change="save(n)"/>
                Aktif
              </label>

              <button @click="remove(n)"
                      class="text-red-600 text-sm px-2 hover:bg-red-50 rounded"
                      title="Sil">✕</button>
            </li>
          </ul>
        </div>
      </div>

      <!-- ÖNİZLEME -->
      <div class="bg-white rounded-2xl shadow-sm p-6">
        <h2 class="font-semibold text-primary mb-1">Kasada Görünümü</h2>
        <p class="text-muted text-xs mb-4">
          Kasiyer bir ürüne not eklerken bu düğmeleri görür. Pasif notlar kasada çıkmaz.
        </p>

        <div class="border rounded-xl p-4 bg-gray-50">
          <div class="text-sm font-semibold text-primary mb-1">Çay</div>
          <div class="text-xs text-muted mb-3">
            Hazır notlardan seçebilir ya da kendiniz yazabilirsiniz.
          </div>

          <div v-if="activeNotes.length" class="flex flex-wrap gap-2">
            <span v-for="n in activeNotes" :key="n.id"
                  class="px-3 py-1.5 rounded-full border bg-white text-sm">
              {{ n.text }}
            </span>
          </div>
          <div v-else class="text-xs text-muted">
            Aktif not yok — kasiyer yalnızca serbest metin yazabilir.
          </div>

          <div class="mt-4">
            <div class="text-xs text-muted mb-1">Not</div>
            <div class="bg-white border rounded-lg px-3 py-2 text-sm text-muted italic">
              {{ activeNotes.slice(0, 2).map(n => n.text).join(', ') || '—' }}
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../api/api'

const notes   = ref([])
const newText = ref('')
const loading = ref(true)
const saving  = ref(false)
const error   = ref('')

const activeNotes = computed(() => notes.value.filter(n => n.isActive))

async function load() {
  loading.value = true
  try {
    const res = await api.getQuickNotes(true)   // pasifler de yönetilebilmeli
    notes.value = res.data
  } catch (e) {
    error.value = msg(e, 'Notlar yüklenemedi.')
  } finally {
    loading.value = false
  }
}

async function create() {
  const text = newText.value.trim()
  if (!text) return
  saving.value = true
  error.value  = ''
  try {
    const res = await api.createQuickNote({ text, isActive: true })
    notes.value.push(res.data)
    newText.value = ''
  } catch (e) {
    error.value = msg(e, 'Not eklenemedi.')
  } finally {
    saving.value = false
  }
}

async function save(note) {
  const text = (note.text || '').trim()
  if (!text) { await load(); return }   // boş bırakıldıysa eski hâline dön
  error.value = ''
  try {
    await api.updateQuickNote(note.id, { text, isActive: note.isActive })
  } catch (e) {
    error.value = msg(e, 'Not kaydedilemedi.')
    await load()
  }
}

async function remove(note) {
  if (!confirm(`"${note.text}" silinsin mi?\n\nDaha önce yazılmış sipariş notları etkilenmez.`)) return
  try {
    await api.deleteQuickNote(note.id)
    notes.value = notes.value.filter(n => n.id !== note.id)
  } catch (e) {
    error.value = msg(e, 'Not silinemedi.')
  }
}

// Sıralama kasada görünen sırayı belirler.
async function move(index, delta) {
  const target = index + delta
  if (target < 0 || target >= notes.value.length) return

  const list = notes.value
  ;[list[index], list[target]] = [list[target], list[index]]

  try {
    await api.reorderQuickNotes(list.map(n => n.id))
  } catch (e) {
    error.value = msg(e, 'Sıralama kaydedilemedi.')
    await load()
  }
}

function msg(e, fallback) {
  return e?.response?.data?.message || fallback
}

onMounted(load)
</script>
