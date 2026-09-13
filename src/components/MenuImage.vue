<template>
  <!-- Görsel yüklenene kadar aynı kutuyu kaplayan sıcak tonlu yer tutucu kalır. -->
  <div ref="el" class="menu-img" :class="{ 'is-loaded': objectUrl }"
       :style="objectUrl ? { backgroundImage: `url(${objectUrl})` } : null"
       role="img" :aria-label="alt"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

/*
  Menü görselleri neden <img src> ile değil de fetch ile indiriliyor:
  API ücretsiz bir ngrok tüneli arkasında ve ngrok, tanımadığı tarayıcıya
  gerçek yanıt yerine uyarı sayfası döndürüyor. Bunu atlatan
  "ngrok-skip-browser-warning" başlığını yalnızca fetch/XHR gönderebilir.

  Tembel yükleme ise menü açılışını hafifletiyor: görseller artık menü
  JSON'unda gelmiyor, yalnızca ekrana yaklaşanlar indiriliyor.
*/
const props = defineProps({
  src:   { type: String, required: true },
  alt:   { type: String, default: '' },
  eager: { type: Boolean, default: false }   // ilk ekranda görünenler için
})

const el        = ref(null)
const objectUrl = ref('')
let observer = null
let url      = null
let disposed = false

async function load() {
  try {
    const res = await fetch(props.src, { headers: { 'ngrok-skip-browser-warning': '1' } })
    if (!res.ok) return
    const blob = await res.blob()
    // ngrok uyarı sayfası da 200 döndüğü için içeriğin gerçekten görsel
    // olduğunu doğruluyoruz.
    if (disposed || !blob.type.startsWith('image/')) return
    release()
    url = URL.createObjectURL(blob)
    objectUrl.value = url
  } catch {
    // Görsel gelmezse yer tutucu kalır; menü çalışmaya devam eder.
  }
}

function release() {
  if (url) { URL.revokeObjectURL(url); url = null }
}

// Ekranda zaten görünen (ya da az aşağıdaki) görseller gözlemciyi
// beklemeden indirilir: hem ilk ekran daha çabuk dolar, hem de
// IntersectionObserver'ın çalışmadığı ortamlarda görseller kaybolmaz.
function nearViewport() {
  const r = el.value?.getBoundingClientRect()
  if (!r) return false
  return r.top < (window.innerHeight || 0) + 400 && r.bottom > -400
}

onMounted(() => {
  if (props.eager || typeof IntersectionObserver === 'undefined' || nearViewport()) {
    load(); return
  }
  observer = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) {
      observer.disconnect(); observer = null
      load()
    }
  }, { rootMargin: '400px' })   // görünmeden önce indirmeye başla
  observer.observe(el.value)
})

onUnmounted(() => {
  disposed = true
  observer?.disconnect()
  release()
})
</script>

<style scoped>
/* Yer tutucu rengi her zaman görünür kalmalı — opacity ile soldurulursa
   görsel inene kadar kutu boş/şeffaf görünür. */
.menu-img {
  background-color: #F3ECE3;
  background-size: cover;
  background-position: center;
}
</style>
