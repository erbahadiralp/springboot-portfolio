<!-- Hesap ayarları: şifre değiştirme (PUT /api/auth/password -> 204). İçerik formlarıyla aynı motoru kullanır. -->
<template>
  <ResourceForm ref="form" :fields="FIELDS" :options="OPTIONS" @submit="save">
    <template #before-actions>
      <div class="card mb-4">
        <div class="card-body">
          <div class="form-label mb-2">Yeni şifre kuralları</div>
          <ul class="list-unstyled mb-0 small">
            <li v-for="rule in rules" :key="rule.text" :class="rule.ok ? 'text-success' : 'text-muted'">
              <i :class="`bi bi-${rule.ok ? 'check-circle-fill' : 'circle'} me-2`"></i>{{ rule.text }}
            </li>
          </ul>
        </div>
      </div>
    </template>
    <template #actions>
      <button type="submit" class="btn btn-primary" :disabled="saving"><i class="bi bi-shield-check"></i> Şifreyi değiştir</button>
    </template>
  </ResourceForm>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import ResourceForm from "../components/ResourceForm.vue";
import { api } from "../../lib/api.js";
import { confirmDialog, handleError, setHeader, toast } from "../store.js";

// Kurallar ChangePasswordRequestDTO.newPassword'den:
//   @Size(min = 12, max = 72), @Pattern("^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$")
const PASSWORD_RULES = [
  { text: "En az 12, en fazla 72 karakter", test: (v) => v.length >= 12 && v.length <= 72 },
  { text: "En az bir küçük harf (a-z)", test: (v) => /[a-z]/.test(v) },
  { text: "En az bir büyük harf (A-Z)", test: (v) => /[A-Z]/.test(v) },
  { text: "En az bir sembol (harf ve rakam dışında bir karakter)", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const FIELDS = [
  { name: "currentPassword", label: "Mevcut şifre", type: "password", required: true, wide: true },
  {
    name: "newPassword", label: "Yeni şifre", type: "password", required: true,
    minLength: 12, minLengthMessage: "Şifre en az 12 karakter olmalı",
    maxLength: 72,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$/,
    patternMessage: "Şifre en az bir küçük harf, bir büyük harf ve bir sembol içermeli",
  },
  { name: "confirmPassword", label: "Yeni şifre (tekrar)", type: "password", required: true, match: "newPassword", matchMessage: "Şifreler eşleşmiyor." },
];

const OPTIONS = {
  sections: { details: { title: "Şifre değiştir", description: "Değişiklik bir sonraki girişte geçerli olur; açık oturumun kapanmaz. Güçlü ve bu siteye özel bir şifre seç." } },
};

const form = ref(null);
const saving = ref(false);

// Yazarken her kuralın karşılanıp karşılanmadığını göster
const rules = computed(() => {
  const value = form.value?.values.newPassword || "";
  return PASSWORD_RULES.map((r) => ({ text: r.text, ok: !!value && r.test(value) }));
});

async function save() {
  if (!form.value.validate()) return;
  const { currentPassword, newPassword } = form.value.collect().data;
  saving.value = true;
  try {
    await api.put("/auth/password", { currentPassword, newPassword });
    await form.value.reset();
    toast("Şifreniz değiştirildi.");
  } catch (err) {
    if (err.status === 401) return; // girişe yönlendirildi
    if (err.status === 400 && err.fieldErrors) {
      form.value.showServerErrors(err.fieldErrors);
    } else if (err.status === 400) {
      // "Mevcut şifre hatalı"
      form.value.setError("currentPassword", err.message);
      form.value.focusField("currentPassword");
    } else {
      handleError(err);
    }
  } finally {
    saving.value = false;
  }
}

onBeforeRouteLeave((to) => {
  if (to.name === "login" || !form.value?.isDirty()) return true;
  return confirmDialog({
    title: "Değişiklikler kaydedilmedi",
    message: "Bu sayfadan çıkarsan yazdığın şifreler kaybolacak.",
    confirmText: "Kaydetmeden çık",
  });
});

onMounted(() => setHeader({ title: "Hesap Ayarları", subtitle: "Admin paneli giriş bilgileri" }));
</script>
