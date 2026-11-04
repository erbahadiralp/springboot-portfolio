<template>
  <StateBox icon="question-circle" text="Bu sayfa bulunamadı.">
    <RouterLink :to="{ name: 'dashboard' }" class="btn btn-soft-primary"><i class="bi bi-arrow-left"></i> Genel bakışa dön</RouterLink>
  </StateBox>
</template>

<script setup>
import { onMounted } from "vue";
import StateBox from "../components/StateBox.vue";
import { setHeader } from "../store.js";

onMounted(() => setHeader({ title: "Bulunamadı", path: [{ text: "404" }] }));
</script>
