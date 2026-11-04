<!-- Ekleme / düzenleme sayfası: /admin/<kaynak>/new, /admin/<kaynak>/<id>, profilde /admin/profile
     Tekil kaynaklarda (profil) id yoktur; kayıt her zaman GET/PUT /api/<kaynak> ile okunup yazılır.

     Kaydetme akışı:
       1. Seçilen her dosya POST /api/files ile yüklenir; dönen url (/static/...) ilgili alana yazılır.
       2. Kayıt JSON olarak POST (yeni) / PUT (düzenleme) edilir.
     Backend PUT'ta tüm alanları değiştirir; formda olmayan alanların (ör. dokunulmayan dosyalar)
     silinmemesi için gövde, GET ile okunan mevcut kayıtla birleştirilerek gönderilir. -->
<template>
  <StateBox v-if="!resource" text="Bilinmeyen bölüm." />
  <StateBox v-else-if="state === 'loading'" loading />
  <StateBox v-else-if="state === 'missing'" icon="question-circle"
            :text="singleton ? 'Kayıt bulunamadı.' : 'Kayıt bulunamadı; silinmiş olabilir.'">
    <RouterLink v-if="listRoute" :to="listRoute" class="btn btn-soft-primary"><i class="bi bi-arrow-left"></i> Listeye dön</RouterLink>
  </StateBox>
  <StateBox v-else-if="state === 'error'" />
  <ResourceForm v-else ref="form" :key="formKey" :fields="resource.fields" :item="item" :options="resource.form" @submit="save">
    <template #actions>
      <RouterLink v-if="listRoute" :to="listRoute" class="btn btn-soft-secondary">Vazgeç</RouterLink>
      <button type="submit" class="btn btn-primary" :disabled="saving">
        <i class="bi bi-check-lg"></i> {{ isEdit ? "Değişiklikleri kaydet" : "Kaydet" }}
      </button>
    </template>
  </ResourceForm>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import ResourceForm from "../components/ResourceForm.vue";
import StateBox from "../components/StateBox.vue";
import { api } from "../../lib/api.js";
import { RESOURCES } from "../resources.js";
import { confirmDialog, handleError, setHeader, showUser, toast } from "../store.js";

const route = useRoute();
const router = useRouter();
const key = route.params.key || route.meta.key; // profil sayfasında anahtar adreste değil
const id = route.params.id;
const resource = RESOURCES[key];

const singleton = !!resource?.singleton;
const isEdit = singleton || !!id;
const path = singleton || !isEdit ? `/${key}` : `/${key}/${id}`;
const listRoute = resource && !singleton ? { name: "list", params: { key } } : null;
const fileFields = resource ? resource.fields.filter((f) => f.type === "file") : [];

// Yanıtta olup istek DTO'larında olmayan alanlar; gönderilmez.
const READ_ONLY = ["id", "displayOrder"];

const state = ref(isEdit ? "loading" : "ready"); // loading | ready | missing | error
const item = ref({});
const form = ref(null);
const formKey = ref(0); // tekil kayıt kaydedilince form yeni değerlerle baştan kurulur
const saving = ref(false);

// Aynı dosya tekrar yüklenmesin (ör. dosya yüklendi ama kayıt doğrulamadan döndü, kullanıcı düzeltip yeniden kaydetti)
const uploaded = new WeakMap();

function header() {
  if (!resource) return setHeader({ title: "Bulunamadı" });
  if (singleton) return setHeader({ title: resource.title, subtitle: resource.subtitle });
  const titleField = resource.fields.find((f) => f.i18n);
  const name = isEdit && titleField ? item.value[`${titleField.name}Tr`] : null;
  setHeader({
    title: isEdit ? name || `${resource.title} düzenle` : `Yeni ${resource.singular}`,
    subtitle: isEdit ? `${resource.title} · düzenleniyor` : resource.subtitle,
    path: [{ text: key, to: listRoute }, { text: isEdit ? id : "yeni" }],
    actions: [{ text: resource.title, icon: "arrow-left", to: listRoute, variant: "soft-secondary" }],
  });
}

// Büyük resimleri yüklemeden önce küçültür: uzun kenar en fazla 1600 px, WebP. Site hızlı açılsın,
// 5 MB'lık bir telefon fotoğrafı olduğu gibi sunulmasın. Küçültme işe yaramazsa (ya da tarayıcı
// desteklemezse) orijinal dosya döner.
const MAX_IMAGE_DIMENSION = 1600;
const SHRINK_ABOVE_BYTES = 1024 * 1024;
async function shrinkImage(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= SHRINK_ABOVE_BYTES) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
    // toBlob WebP'yi desteklemiyorsa PNG döner; o durumda ya da sonuç büyükse orijinali kullan
    if (!blob || blob.type !== "image/webp" || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return file;
  }
}

// Dosyaları yükler, url'leri data'ya yazar. Hata olursa ilgili dosya alanında gösterir ve false döner.
async function uploadFiles(data, files) {
  for (const [field, file] of Object.entries(files)) {
    const def = fileFields.find((f) => f.name === field);
    try {
      let result = uploaded.get(file);
      if (!result) {
        result = await api.upload(def.kind === "image" ? await shrinkImage(file) : file);
        uploaded.set(file, result);
      }
      data[field] = result.url;
      if (def.nameKey) data[def.nameKey] = result.originalFileName || file.name;
    } catch (err) {
      if (err.status === 401) return false; // oturum kapatıldı
      const message = err.status === 400 || err.status === 413 ? err.message : `Dosya yüklenemedi: ${err.message}`;
      form.value.setError(field, message);
      form.value.focusField(field);
      toast(`${def.label}: ${message}`, "error");
      return false;
    }
  }
  return true;
}

// İstek gövdesi: mevcut kayıt + formdaki değerler, salt okunur alanlar hariç
function buildBody(data, removed) {
  const body = { ...item.value, ...data };
  for (const field of removed) {
    body[field] = null;
    const def = fileFields.find((f) => f.name === field);
    if (def && def.nameKey) body[def.nameKey] = null;
  }
  for (const k of READ_ONLY) delete body[k];
  return body;
}

async function save() {
  if (!form.value.validate()) return;
  const { data, files, removed } = form.value.collect();
  saving.value = true;
  try {
    if (!(await uploadFiles(data, files))) return;
    const body = buildBody(data, removed);
    const saved = isEdit ? await api.put(path, body) : await api.post(path, body);
    form.value.markClean();
    if (singleton) {
      item.value = saved || {};
      formKey.value++;
      if (key === "about") showUser(saved);
      toast("Değişiklikler kaydedildi.");
    } else {
      toast(isEdit ? "Değişiklikler kaydedildi." : "Kayıt eklendi.");
      router.push(listRoute);
    }
  } catch (err) {
    handleSaveError(err);
  } finally {
    saving.value = false;
  }
}

function handleSaveError(err) {
  if (err.status === 401) return; // oturum kapatılıp girişe yönlendirildi
  if (err.status === 404) {
    toast("Bu kayıt artık yok; başka bir yerden silinmiş olabilir.", "error");
    return;
  }
  if (err.status === 400) {
    if (err.fieldErrors) {
      // Doğrulama hatası: her mesaj ilgili alanın yanında
      const unmatched = form.value.showServerErrors(err.fieldErrors);
      toast(unmatched.length ? `Kaydedilemedi: ${unmatched.join(" · ")}` : "Kaydedilemedi: işaretli alanları düzeltin.", "error");
      return;
    }
    // İş kuralı hatası (ör. "Bitiş tarihi Başlangıç tarihinden önce olamaz")
    if (/tarih/i.test(err.message) && form.value.setError("endDate", err.message)) form.value.focusField("endDate");
    toast(err.message, "error");
    return;
  }
  handleError(err);
}

// Kaydedilmemiş değişiklik varken başka sayfaya geçilirse sor (oturum kapanırken sorulmaz)
onBeforeRouteLeave((to) => {
  if (to.name === "login" || !form.value?.isDirty()) return true;
  return confirmDialog({
    title: "Değişiklikler kaydedilmedi",
    message: "Bu sayfadan çıkarsan kaydetmediğin değişiklikler kaybolacak.",
    confirmText: "Kaydetmeden çık",
  });
});

onMounted(async () => {
  header();
  if (!resource || !isEdit) return;
  try {
    item.value = (await api.get(path)) || {};
    state.value = "ready";
    header();
  } catch (err) {
    if (err.status === 401) return;
    if (err.status === 404) {
      state.value = "missing";
      return;
    }
    handleError(err);
    state.value = "error";
  }
});
</script>
