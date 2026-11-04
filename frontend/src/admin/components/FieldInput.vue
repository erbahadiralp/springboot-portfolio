<!-- Tek bir form kontrolü (metin, textarea, tarih, e-posta, URL, şifre).
     Tek kök öğedir: Bootstrap'in ".is-invalid ~ .invalid-feedback" kuralı için hata metni hemen ardından gelir. -->
<template>
  <textarea v-if="field.type === 'textarea'" :id="id" v-model="model" class="form-control" :class="{ 'is-invalid': invalid }"
            :rows="field.rows || 3" :placeholder="field.placeholder"></textarea>
  <input v-else-if="field.type === 'date'" :id="id" v-model="model" type="date" class="form-control"
         :class="{ 'is-invalid': invalid }" style="max-width: 220px;">
  <input v-else-if="field.type === 'password'" :id="id" v-model="model" type="password" class="form-control"
         :class="{ 'is-invalid': invalid }" autocomplete="new-password">
  <input v-else :id="id" v-model="model" :type="field.type === 'email' || field.type === 'url' ? field.type : 'text'"
         class="form-control" :class="{ 'is-invalid': invalid }" :placeholder="field.placeholder">
</template>

<script setup>
defineProps({
  field: { type: Object, required: true },
  id: { type: String, required: true },
  invalid: Boolean,
});
const model = defineModel({ type: String, default: "" });
</script>
