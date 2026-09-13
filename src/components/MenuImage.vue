<template>
  <!-- Görsel inene kadar sıcak tonlu yer tutucu görünür (img'in kendi arka planı). -->
  <img class="menu-img" :src="src" :alt="alt"
       :loading="eager ? 'eager' : 'lazy'" decoding="async"
       @error="onError"/>
</template>

<script setup>
/*
  Görseller /api/img geçidi üzerinden, yani sayfayla aynı alan adından
  geliyor. Bu sayede sade <img> kullanılabiliyor: tarayıcının kendi tembel
  yüklemesi, önbelleği ve öncelik sırası devrede; CORS ön-uçuşu yok.

  Doğrudan API'ye gidilseydi ngrok tarayıcı isteklerine uyarı sayfası
  döndürdüğü için görseller hiç yüklenmezdi — bkz. api/img.js.
*/
defineProps({
  src:   { type: String, required: true },
  alt:   { type: String, default: '' },
  eager: { type: Boolean, default: false }   // ilk ekranda görünenler için
})

function onError(e) {
  // Görsel gelmezse kırık resim ikonu yerine yer tutucu kalsın.
  e.target.style.visibility = 'hidden'
}
</script>

<style scoped>
.menu-img {
  display: block;
  background-color: #F3ECE3;
  object-fit: cover;
}
</style>
