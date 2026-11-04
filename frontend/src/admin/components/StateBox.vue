<!-- Yükleniyor / boş liste / hata durumu kutusu -->
<template>
  <div class="state">
    <template v-if="loading">
      <div class="spinner-border spinner-border-sm me-2" role="status"></div>
      <span class="mono small">yükleniyor...</span>
    </template>
    <template v-else>
      <div class="state-icon"><i :class="`bi bi-${icon}`"></i></div>
      <p class="mb-3">{{ text }}</p>
      <slot />
    </template>
  </div>
</template>

<script setup>
defineProps({
  loading: Boolean,
  icon: { type: String, default: "cloud-slash" },
  text: { type: String, default: "Veriler yüklenemedi." },
});
</script>
