<!-- Form motoru: resources.js'teki alan tanımlarından formu çizer; dosya önizlemesi, sorumluluk listesi,
     doğrulama, backend alan hataları, dil sekmesi ve "kaydedilmemiş değişiklik" takibini yönetir.
     Kaydetme işini çağıran sayfa yapar (submit olayı); bu bileşen değerleri toplar ve hataları gösterir. -->
<template>
  <form novalidate :data-active-lang="activeLang" @submit.prevent="emit('submit')">
    <section v-for="section in sections" :key="section.key" class="form-section">
      <div class="form-section-intro">
        <h2>{{ section.title }}</h2>
        <p v-if="section.description">{{ section.description }}</p>
        <span v-if="section.bilingual" class="lang-indicator"><i class="bi bi-translate"></i> {{ LANG_NAMES[activeLang] }} düzenleniyor</span>
      </div>
      <div class="card form-section-card">
        <div class="card-body">
          <!-- Sorumluluklar: backend PUT'ta hepsini silip gönderilen listeyi sırayla yeniden oluşturur -->
          <template v-if="section.key === 'responsibilities'">
            <div>
              <div v-for="(row, i) in rows" :key="row.uid" class="resp-item">
                <span class="resp-number">{{ String(i + 1).padStart(2, "0") }}</span>
                <div class="flex-grow-1">
                  <div v-for="lang in LANGS" :key="lang" :data-lang-pane="lang">
                    <textarea :id="`resp-${row.uid}-${lang}`" v-model="row[lang]" class="form-control" rows="2"
                              :class="{ 'is-invalid': errors[respKey(row, lang)] }"
                              :placeholder="lang === 'tr' ? 'Bu pozisyonda neler yaptın?' : 'What did you do in this role?'"></textarea>
                    <div class="invalid-feedback">{{ errors[respKey(row, lang)] }}</div>
                  </div>
                </div>
                <div class="resp-actions">
                  <button :id="`mv-${row.uid}--1`" type="button" class="icon-btn" title="Yukarı taşı" aria-label="Yukarı taşı"
                          :disabled="i === 0" @click="moveRow(i, -1)"><i class="bi bi-arrow-up"></i></button>
                  <button :id="`mv-${row.uid}-1`" type="button" class="icon-btn" title="Aşağı taşı" aria-label="Aşağı taşı"
                          :disabled="i === rows.length - 1" @click="moveRow(i, 1)"><i class="bi bi-arrow-down"></i></button>
                  <button type="button" class="icon-btn resp-remove" title="Kaldır" aria-label="Kaldır"
                          @click="rows.splice(i, 1)"><i class="bi bi-trash3"></i></button>
                </div>
              </div>
            </div>
            <p v-if="!rows.length" class="text-muted mono small mb-3">// henüz sorumluluk eklenmedi</p>
            <button type="button" class="btn btn-add w-100" @click="addRow"><i class="bi bi-plus-lg"></i> Sorumluluk ekle</button>
          </template>

          <!-- Dosyalar: seçilen dosya kayıttan önce POST /api/files ile yüklenir (FormView) -->
          <div v-else-if="section.key === 'files'" class="file-grid">
            <div v-for="field in section.fields" :key="field.name" class="file-field">
              <div class="form-label">{{ field.label }}</div>
              <div class="file-preview">
                <template v-if="files[field.name].file">
                  <img v-if="field.kind === 'image'" :src="files[field.name].preview" alt="" class="file-preview-img">
                  <div v-else class="file-preview-doc">
                    <i class="bi bi-file-earmark-pdf-fill"></i><span class="text-truncate">{{ files[field.name].file.name }}</span>
                  </div>
                  <span class="badge file-new-badge">Yeni</span>
                </template>
                <template v-else-if="currentUrl(field)">
                  <img v-if="field.kind === 'image'" :src="currentUrl(field)" alt="" class="file-preview-img">
                  <a v-else :href="currentUrl(field)" target="_blank" class="file-preview-doc">
                    <i class="bi bi-file-earmark-pdf-fill"></i>
                    <span class="text-truncate">{{ (field.nameKey && item[field.nameKey]) || "Mevcut PDF'i aç" }}</span>
                    <i class="bi bi-box-arrow-up-right ms-auto small"></i>
                  </a>
                </template>
                <div v-else class="file-preview-empty">
                  <i :class="`bi bi-${field.kind === 'image' ? 'image' : 'file-earmark'}`"></i>
                  <span>{{ field.kind === "image" ? "Görsel yok" : "Dosya yok" }}</span>
                </div>
              </div>
              <div class="d-flex gap-2 mt-2">
                <label class="btn btn-soft-secondary btn-sm flex-grow-1 mb-0" :for="`f-${field.name}`">
                  <i class="bi bi-upload"></i> {{ files[field.name].file || currentUrl(field) ? "Değiştir" : "Dosya seç" }}
                </label>
                <button v-if="files[field.name].file || currentUrl(field)" type="button" class="btn btn-soft-danger btn-sm"
                        title="Dosyayı kaldır" aria-label="Dosyayı kaldır" @click="removeFile(field)"><i class="bi bi-trash3"></i></button>
              </div>
              <input :id="`f-${field.name}`" type="file" class="visually-hidden" :class="{ 'is-invalid': errors[field.name] }"
                     :accept="UPLOAD_RULES[field.kind].accept" @change="onFileChange(field, $event)">
              <div class="invalid-feedback">{{ errors[field.name] }}</div>
              <div class="form-text">{{ UPLOAD_RULES[field.kind].typeLabel }} · en fazla {{ UPLOAD_RULES[field.kind].sizeLabel }}</div>
              <div v-if="field.help" class="form-text">{{ field.help }}</div>
            </div>
          </div>

          <div v-else class="field-grid">
            <template v-for="field in section.fields" :key="field.name">
              <!-- İki dilli alan: iki kopya çizilir, CSS etkin olmayan dili gizler -->
              <template v-if="field.i18n">
                <div v-for="lang in LANGS" :key="lang" class="field" :class="{ 'field-wide': field.wide }" :data-lang-pane="lang">
                  <label class="form-label" :for="`f-${i18nName(field.name, lang)}`">
                    {{ field.label }}<span v-if="requiredFor(field, lang)"> <span class="req">*</span></span>
                  </label>
                  <FieldInput v-model="values[i18nName(field.name, lang)]" :field="field" :id="`f-${i18nName(field.name, lang)}`"
                              :invalid="!!errors[i18nName(field.name, lang)]" />
                  <div class="invalid-feedback">{{ errors[i18nName(field.name, lang)] }}</div>
                  <div v-if="field.help" class="form-text">{{ field.help }}</div>
                </div>
              </template>

              <!-- Başlangıç / bitiş ayı ve "Devam ediyor". API'ye ayın 1'i (YYYY-MM-01) gider.
                   type=month desteklemeyen tarayıcılarda (ör. masaüstü Firefox) metin kutusu olur; YYYY-AA yazılır. -->
              <div v-else-if="field.type === 'period'" class="field field-wide period-field">
                <div class="period-grid">
                  <div>
                    <label class="form-label" for="f-startDate">Başlangıç <span class="req">*</span></label>
                    <input id="f-startDate" v-model="values.startDate" type="month" class="form-control" placeholder="YYYY-AA"
                           :class="{ 'is-invalid': errors.startDate }">
                    <div class="invalid-feedback">{{ errors.startDate }}</div>
                  </div>
                  <div>
                    <label class="form-label" for="f-endDate">Bitiş</label>
                    <input id="f-endDate" v-model="values.endDate" type="month" class="form-control" placeholder="YYYY-AA"
                           :class="{ 'is-invalid': errors.endDate }" :disabled="values.ongoing">
                    <div class="invalid-feedback">{{ errors.endDate }}</div>
                  </div>
                </div>
                <div class="form-check mt-3">
                  <input id="f-ongoing" v-model="values.ongoing" class="form-check-input" type="checkbox">
                  <label class="form-check-label" for="f-ongoing">Devam ediyor</label>
                </div>
                <div v-if="field.help" class="form-text">{{ field.help }}</div>
              </div>

              <!-- Kategori: backend'de tek dilli metin; Türkçe ad kaydedilir.
                   Listede olmayan eski bir değer varsa kaybolmasın diye seçenek olarak eklenir. -->
              <div v-else-if="field.type === 'category'" class="field">
                <label class="form-label" :for="`f-${field.name}`">{{ field.label }}<span v-if="field.required"> <span class="req">*</span></span></label>
                <select :id="`f-${field.name}`" v-model="values[field.name]" class="form-select" :class="{ 'is-invalid': errors[field.name] }">
                  <option value="">Kategori seçin</option>
                  <option v-for="o in field.options" :key="o.tr" :value="o.tr">{{ o.tr }} · {{ o.en }}</option>
                  <option v-if="unknownCategory[field.name]" :value="unknownCategory[field.name]">{{ unknownCategory[field.name] }} (listede yok)</option>
                </select>
                <div class="invalid-feedback">{{ errors[field.name] }}</div>
              </div>

              <div v-else class="field" :class="{ 'field-wide': field.wide }">
                <label class="form-label" :for="`f-${field.name}`">{{ field.label }}<span v-if="field.required"> <span class="req">*</span></span></label>
                <FieldInput v-model="values[field.name]" :field="field" :id="`f-${field.name}`" :invalid="!!errors[field.name]" />
                <div class="invalid-feedback">{{ errors[field.name] }}</div>
                <div v-if="field.help" class="form-text">{{ field.help }}</div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </section>

    <slot name="before-actions" />

    <div class="form-actions">
      <div v-if="bilingual" class="lang-switch" role="tablist" aria-label="Düzenlenen dil">
        <button v-for="lang in LANGS" :key="lang" type="button" role="tab" :class="{ active: lang === activeLang }"
                :aria-selected="lang === activeLang" @click="activeLang = lang">
          {{ LANG_NAMES[lang] }}
          <span class="lang-status" :class="{ 'has-error': langStatus[lang].hasError }">
            <i v-if="langStatus[lang].hasError" class="bi bi-exclamation-circle-fill"></i>
            <i v-else-if="langStatus[lang].filled === langStatus[lang].total" class="bi bi-check2"></i>
            <template v-else>{{ langStatus[lang].filled }}/{{ langStatus[lang].total }}</template>
          </span>
        </button>
      </div>
      <span v-if="dirty" class="hint">● kaydedilmemiş değişiklikler</span>
      <slot name="actions" />
    </div>
  </form>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from "vue";
import FieldInput from "./FieldInput.vue";
import { UPLOAD_RULES, checkUpload, findSkillCategory } from "../../lib/constants.js";

const props = defineProps({
  fields: { type: Array, required: true },
  item: { type: Object, default: () => ({}) },
  // { order: ["details", "content", ...], sections: { anahtar: { title, description } } }
  options: { type: Object, default: () => ({}) },
});
const emit = defineEmits(["submit"]);

const LANGS = ["tr", "en"];
const LANG_NAMES = { tr: "Türkçe", en: "English" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/\S+$/i;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

// Backend iki dilli alanları "titleTr" / "titleEn" olarak adlandırır
const i18nName = (name, lang) => name + (lang === "tr" ? "Tr" : "En");
const requiredFor = (field, lang) => field.required === true || field.required === lang;
const respKey = (row, lang) => `resp:${row.uid}:${lang}`;
const toMonth = (date) => (date ? String(date).slice(0, 7) : ""); // "2023-09-01" -> "2023-09"

// ---------------- Bölümler ----------------

// Alanlar otomatik olarak bölümlere ayrılır; kaynak tanımı başlık/açıklama/sırayı ezebilir.
const SECTION_DEFAULTS = {
  content: { title: "İçerik", description: "Sitede görünen metinler. Dili alttaki çubuktan değiştirebilirsin." },
  responsibilities: { title: "Sorumluluklar", description: "Her madde sitede ayrı bir satır olarak listelenir." },
  details: { title: "Detaylar", description: "Bağlantılar ve diğer ayarlar." },
  files: { title: "Dosyalar", description: "Değiştirmek istemediğin dosyayı boş bırakabilirsin." },
};
const DEFAULT_ORDER = ["content", "responsibilities", "details", "files"];

function sectionOf(field) {
  if (field.type === "file") return "files";
  if (field.type === "responsibilities") return "responsibilities";
  return field.i18n ? "content" : "details";
}

// Uzun alanlar (textarea, tarih aralığı veya wide: true) iki sütunlu ızgarada tam satır kaplar
const isWide = (field) => field.type === "textarea" || field.type === "period" || field.wide;

// İki sütunlu ızgarada yalnız kalacak kısa alanı tam satır yap (yanında boşluk kalmasın)
function fillRows(fields) {
  const result = [];
  let run = [];
  const flush = () => {
    if (run.length % 2 === 1) run[run.length - 1] = { ...run[run.length - 1], wide: true };
    result.push(...run);
    run = [];
  };
  for (const field of fields) {
    if (isWide(field)) {
      flush();
      result.push({ ...field, wide: true });
    } else {
      run.push(field);
    }
  }
  flush();
  return result;
}

const sections = computed(() => {
  const groups = {};
  for (const field of props.fields) (groups[sectionOf(field)] ||= []).push(field);
  return (props.options.order || DEFAULT_ORDER).filter((key) => groups[key]).map((key) => ({
    key,
    ...SECTION_DEFAULTS[key],
    ...(key === "responsibilities" ? { title: groups[key][0].label } : {}),
    ...(props.options.sections || {})[key],
    bilingual: key === "content" || key === "responsibilities",
    fields: key === "files" || key === "responsibilities" ? groups[key] : fillRows(groups[key]),
  }));
});

const bilingual = computed(() => props.fields.some((f) => f.i18n || f.type === "responsibilities"));

// ---------------- Durum ----------------

const values = reactive({});
const files = reactive({}); // { urlAlanı: { file, removed, preview } }
const rows = ref([]); // sorumluluklar: { uid, tr, en }
const errors = reactive({}); // { inputAdı | "resp:<uid>:<dil>": mesaj }
const unknownCategory = reactive({});
const activeLang = ref("tr");
const dirty = ref(false);
let uid = 0;

function init(item) {
  for (const key of Object.keys(values)) delete values[key];
  for (const key of Object.keys(errors)) delete errors[key];
  for (const field of props.fields) {
    switch (field.type) {
      case "file":
        if (files[field.name]?.preview) URL.revokeObjectURL(files[field.name].preview);
        files[field.name] = { file: null, removed: false, preview: null };
        break;
      case "responsibilities":
        rows.value = (item.responsibilities || []).map((r) => ({ uid: ++uid, tr: r.descriptionTr || "", en: r.descriptionEn || "" }));
        break;
      case "period":
        values.startDate = toMonth(item.startDate);
        values.endDate = toMonth(item.endDate);
        values.ongoing = !!item.startDate && !item.endDate;
        break;
      case "category": {
        const current = item[field.name] || "";
        const known = findSkillCategory(current);
        values[field.name] = known ? known.tr : current;
        unknownCategory[field.name] = current && !known ? current : null;
        break;
      }
      case "password":
        values[field.name] = "";
        break;
      default:
        for (const name of field.i18n ? LANGS.map((l) => i18nName(field.name, l)) : [field.name]) {
          const value = item[name] ?? "";
          values[name] = field.type === "date" ? String(value).slice(0, 10) : String(value);
        }
    }
  }
}
init(props.item);

// Değerler değişince "kaydedilmemiş değişiklik" (ilk doldurma sayılmaz: izleme init'ten sonra başlar)
watch([values, files, rows], () => (dirty.value = true), { deep: true });
// "Devam ediyor" işaretlenince bitiş tarihi hatası silinir
watch(() => values.ongoing, (on) => on && delete errors.endDate);

// Sayfa kapatılırken kaydedilmemiş değişiklik varsa tarayıcı uyarsın
const onBeforeUnload = (e) => dirty.value && e.preventDefault();
window.addEventListener("beforeunload", onBeforeUnload);
onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", onBeforeUnload);
  for (const state of Object.values(files)) if (state.preview) URL.revokeObjectURL(state.preview);
});

// Her dil için doluluk ("3/4" ya da ✓) ve hata işareti
const langStatus = computed(() => Object.fromEntries(LANGS.map((lang) => {
  const names = props.fields.filter((f) => f.i18n).map((f) => i18nName(f.name, lang));
  const texts = [...names.map((n) => values[n]), ...rows.value.map((r) => r[lang])];
  const errorKeys = [...names, ...rows.value.map((r) => respKey(r, lang))];
  return [lang, {
    filled: texts.filter((v) => String(v || "").trim()).length,
    total: texts.length,
    hasError: errorKeys.some((k) => errors[k]),
  }];
})));

// ---------------- Sorumluluklar ----------------

async function addRow() {
  const row = { uid: ++uid, tr: "", en: "" };
  rows.value.push(row);
  await nextTick();
  document.getElementById(`resp-${row.uid}-${activeLang.value}`)?.focus();
}

// Klavyeyle art arda taşınabilsin; ok uçta pasif kaldıysa öbür oka geç
async function moveRow(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= rows.value.length) return;
  const [row] = rows.value.splice(index, 1);
  rows.value.splice(target, 0, row);
  await nextTick();
  const same = document.getElementById(`mv-${row.uid}-${direction}`);
  (same && !same.disabled ? same : document.getElementById(`mv-${row.uid}-${-direction}`))?.focus();
}

// ---------------- Dosyalar ----------------

// Kaydın mevcut dosyası ("kaldır" denmediyse)
const currentUrl = (field) => (files[field.name].removed ? null : props.item[field.name] || null);

function onFileChange(field, event) {
  const file = event.target.files[0];
  if (!file) return;
  // Kurala uymayan dosya hiç gönderilmez: seçim temizlenir, önceki önizleme kalır.
  const error = checkUpload(field.kind, file);
  setError(field.name, error);
  if (error) {
    event.target.value = "";
    return;
  }
  const state = files[field.name];
  if (state.preview) URL.revokeObjectURL(state.preview);
  state.file = file;
  state.removed = false;
  state.preview = field.kind === "image" ? URL.createObjectURL(file) : null;
}

function removeFile(field) {
  const state = files[field.name];
  if (state.preview) URL.revokeObjectURL(state.preview);
  Object.assign(state, { file: null, removed: true, preview: null });
  const input = document.getElementById(`f-${field.name}`);
  if (input) input.value = "";
  setError(field.name, null);
}

// ---------------- Hatalar ----------------

// Formda karşılığı olan input adları (backend hata anahtarları da bunlardır)
const knownNames = computed(() => new Set([
  ...Object.keys(values),
  ...Object.keys(files),
]));

function setError(name, message) {
  if (!knownNames.value.has(name)) return false;
  if (message) errors[name] = message;
  else delete errors[name];
  return true;
}

function clearErrors() {
  for (const key of Object.keys(errors)) delete errors[key];
}

// Hatalı alan gizli dildeyse önce o dile geç, sonra odaklan
async function focusField(key) {
  let id = `f-${key}`;
  const resp = /^resp:(\d+):(tr|en)$/.exec(key);
  if (resp) {
    id = `resp-${resp[1]}-${resp[2]}`;
    activeLang.value = resp[2];
  } else {
    const field = props.fields.find((f) => f.i18n && LANGS.some((l) => i18nName(f.name, l) === key));
    if (field) activeLang.value = LANGS.find((l) => i18nName(field.name, l) === key);
  }
  await nextTick();
  const el = document.getElementById(id);
  if (!el) return;
  el.focus({ preventScroll: true });
  // Gizli dosya inputu kaydırılamaz; kutusuna kaydır
  (el.classList.contains("visually-hidden") ? el.parentElement : el).scrollIntoView({ block: "center", behavior: "smooth" });
}

function checkValue(field, value, lang) {
  const langSuffix = lang ? ` (${lang.toUpperCase()})` : "";
  const required = lang ? requiredFor(field, lang) : field.required;
  if (!value) return required ? `${field.label}${langSuffix} boş bırakılamaz.` : null;
  if (field.maxLength && value.length > field.maxLength) return `En fazla ${field.maxLength} karakter olabilir.`;
  if (field.minLength && value.length < field.minLength) return field.minLengthMessage || `En az ${field.minLength} karakter olmalıdır.`;
  if (field.pattern && !field.pattern.test(value)) return field.patternMessage || "Geçersiz değer.";
  if (field.type === "email" && !EMAIL_RE.test(value)) return "Geçerli bir e-posta adresi girin.";
  if (field.type === "url" && !URL_RE.test(value)) return "http:// veya https:// ile başlayan bir adres girin.";
  if (field.match && value !== values[field.match]) return field.matchMessage || "Değerler eşleşmiyor.";
  return null;
}

// Tarih alanının hataları: { startDate?: mesaj, endDate?: mesaj }
function checkPeriod() {
  const result = {};
  const start = String(values.startDate || "").trim();
  const end = String(values.endDate || "").trim();
  if (!start) result.startDate = "Başlangıç tarihini seçin.";
  else if (!MONTH_RE.test(start)) result.startDate = "Tarih YYYY-AA biçiminde olmalı (ör. 2023-09).";
  if (!values.ongoing) {
    if (!end) result.endDate = "Bitiş tarihini seçin ya da “Devam ediyor”u işaretleyin.";
    else if (!MONTH_RE.test(end)) result.endDate = "Tarih YYYY-AA biçiminde olmalı (ör. 2024-06).";
    else if (!result.startDate && end < start) result.endDate = "Bitiş tarihi başlangıçtan önce olamaz.";
  }
  return result;
}

// Geçersiz ilk alana odaklanır; geçerliyse true döner.
function validate() {
  clearErrors();
  let first = null;
  const fail = (key, message) => {
    errors[key] = message;
    first = first || key;
  };
  for (const field of props.fields) {
    if (field.type === "file") continue;
    if (field.type === "responsibilities") {
      // Backend: her maddenin descriptionTr ve descriptionEn alanı @NotBlank
      for (const row of rows.value) {
        const hasTr = !!row.tr.trim();
        const hasEn = !!row.en.trim();
        if (hasTr === hasEn) continue; // ikisi de dolu ya da satır tamamen boş (atlanır)
        fail(respKey(row, hasTr ? "en" : "tr"), `Bu maddenin ${hasTr ? "İngilizce" : "Türkçe"} metni boş bırakılamaz.`);
      }
      continue;
    }
    if (field.type === "period") {
      for (const [name, message] of Object.entries(checkPeriod())) fail(name, message);
      continue;
    }
    const targets = field.i18n ? LANGS.map((l) => [i18nName(field.name, l), l]) : [[field.name, null]];
    for (const [name, lang] of targets) {
      const raw = String(values[name] ?? "");
      const message = checkValue(field, field.type === "password" ? raw : raw.trim(), lang);
      if (message) fail(name, message);
    }
  }
  if (first) focusField(first);
  return !first;
}

// Backend'den gelen 400 { alan: mesaj } hatalarını ilgili alanların altına yazar.
// Sorumluluklar "responsibilities[2].descriptionEn" biçiminde gelir.
// Formda karşılığı olmayan mesajları döndürür (çağıran toast ile gösterir).
function showServerErrors(serverErrors) {
  if (!serverErrors) return [];
  let first = null;
  const unmatched = [];
  // collect() boş satırları atladığı için backend'deki indeks, dolu satırlar arasındaki sıradır
  const filledRows = rows.value.filter((r) => r.tr.trim() || r.en.trim());
  for (const [name, message] of Object.entries(serverErrors)) {
    const resp = /^responsibilities\[(\d+)\]\.description(Tr|En)$/.exec(name);
    if (resp && filledRows[Number(resp[1])]) {
      const key = respKey(filledRows[Number(resp[1])], resp[2].toLowerCase());
      errors[key] = message;
      first = first || key;
    } else if (setError(name, message)) {
      first = first || name;
    } else {
      unmatched.push(`${name}: ${message}`);
    }
  }
  if (first) focusField(first);
  return unmatched;
}

// ---------------- Değerler ----------------

// Formdaki değerler, backend DTO alan adlarıyla.
//   files:   { urlAlanı: File }  -> yüklenecek yeni dosyalar
//   removed: [urlAlanı]          -> "kaldır" ile çıkarılan dosyalar
// Dosya alanlarının mevcut değerleri data'ya konmaz; FormView mevcut kayıtla birleştirir.
function collect() {
  const data = {};
  const newFiles = {};
  const removed = [];
  for (const field of props.fields) {
    if (field.type === "file") {
      const state = files[field.name];
      if (state.file) newFiles[field.name] = state.file;
      else if (state.removed) removed.push(field.name);
    } else if (field.type === "responsibilities") {
      // Tamamen boş satırlar atlanır; yarım dolu satırları validate() yakalar
      data.responsibilities = rows.value
        .map((r) => ({ descriptionTr: r.tr.trim(), descriptionEn: r.en.trim() }))
        .filter((r) => r.descriptionTr || r.descriptionEn);
    } else if (field.type === "period") {
      // Ay seçici gün tutmaz: ay değişmediyse kayıttaki tarih aynen gider (ör. 2025-09-30 korunur),
      // değiştiyse ayın 1'i gönderilir.
      const keep = (name) => (values[name] === toMonth(props.item[name]) ? props.item[name] : `${values[name]}-01`);
      data.startDate = keep("startDate");
      data.endDate = values.ongoing ? null : keep("endDate");
    } else if (field.type === "password") {
      data[field.name] = values[field.name];
    } else {
      for (const name of field.i18n ? LANGS.map((l) => i18nName(field.name, l)) : [field.name]) {
        data[name] = String(values[name] ?? "").trim() || null;
      }
    }
  }
  return { data, files: newFiles, removed };
}

// Formu boşaltır / verilen kayıtla yeniden doldurur
async function reset(item = {}) {
  init(item);
  await nextTick();
  dirty.value = false;
}

defineExpose({
  values,
  validate,
  collect,
  setError,
  focusField,
  showServerErrors,
  reset,
  isDirty: () => dirty.value,
  markClean: () => (dirty.value = false),
});
</script>
