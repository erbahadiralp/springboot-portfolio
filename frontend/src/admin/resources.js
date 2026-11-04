// Admin panelindeki içerik bölümlerinin tanımları. Menü, liste (ListView) ve form (FormView)
// bu tanımlardan üretilir; yeni bir alan eklemek için genelde sadece burası değişir.
//
// Kaynak:
//   title, singular, icon (Bootstrap Icons adı), subtitle
//   singleton: true  -> liste yok, tek kayıt düzenlenir (GET/PUT /api/<key>)
//   reorderable: true -> listede yukarı/aşağı taşıma okları ve "Sıra" sütunu (PUT /api/<key>/order)
//   columns          -> liste tablosu. i18n: true ise TR üstte, EN altta gösterilir.
//                       render(item): metin ya da Vue h() ile oluşturulmuş öğe döner
//   fields           -> form alanları (ayrıntılar: components/ResourceForm.vue)
//   form             -> { order, sections } form bölümlerinin sırası ve başlık/açıklamaları.
//                       Bölümler: content (iki dilli alanlar), responsibilities, details (diğerleri), files
//
// Alan:
//   name, label, type (text | textarea | url | email | password | date | file | category | responsibilities | period)
//   name             -> backend DTO'sundaki alan adı (API.md). Backend'in 400 "errors" anahtarları da bunlardır.
//   i18n: true       -> nameTr ve nameEn; formda dil sekmesine göre biri gösterilir
//   required         -> true (her iki dil) veya "tr" (sadece TR zorunlu); DTO'daki @NotBlank / @NotNull
//   maxLength, minLength, pattern + patternMessage, rows, help, placeholder  (DTO'daki @Size / @Pattern)
//   wide: true       -> iki sütunlu form ızgarasında tam satır kaplar (textarea'lar zaten öyle)
//   file alanları:   name = kaydın URL alanı (imageUrl, pdfUrl, ...), kind ("image" | "pdf"),
//                    nameKey (orijinal dosya adının yazılacağı alan). Dosya, kayıttan önce POST /api/files ile yüklenir.
//   period:          startDate / endDate (YYYY-MM-DD) için iki ay seçici ve "Devam ediyor" kutusu
import { h } from "vue";
import { formatPeriod, parseDate } from "../lib/dates.js";
import { SKILL_CATEGORIES, findSkillCategory } from "../lib/constants.js";

// Satırın tıklanınca düzenlemeye gitmesini engelleyen bağlantı (yeni sekmede açılır)
const stop = (e) => e.stopPropagation();
const link = (href, icon, title, extra = {}) =>
  h("a", { href, target: "_blank", rel: "noopener", title, onClick: stop, ...extra }, [h("i", { class: `bi bi-${icon}` })]);

const thumb = (url) => (url
  ? h("img", { src: url, alt: "", class: "thumb" })
  : h("div", { class: "thumb thumb-empty" }, [h("i", { class: "bi bi-image" })]));

const tags = (csv) => (csv || "").split(",").map((t) => t.trim()).filter(Boolean)
  .map((t) => h("span", { class: "badge bg-soft-primary tag me-1" }, t));

const dateCell = (value) => {
  const date = parseDate(value);
  return date ? date.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }) : "—";
};

const categoryCell = (value) => {
  const known = findSkillCategory(value);
  return known ? known.tr : value || "—";
};

// Liste sütunu: ana sayfadakiyle aynı biçim, Türkçe
const periodCell = (withMonth) => (item) =>
  formatPeriod(item.startDate, item.endDate, { locale: "tr-TR", withMonth, presentLabel: "Günümüz" });

export const RESOURCES = {
  about: {
    singleton: true,
    title: "Profil",
    icon: "person",
    subtitle: "Sitenin kenar çubuğunda ve giriş bölümünde görünen bilgiler",
    form: {
      order: ["details", "content", "files"],
      sections: {
        details: { title: "Kişisel bilgiler", description: "Kenar çubuğunda ve iletişim bölümünde görünür." },
        content: { title: "Tanıtım metinleri", description: "Profil fotoğrafının altındaki kısa açıklama ve ana sayfadaki karşılama metni." },
        files: { title: "Fotoğraf ve CV", description: "CV'ler sitedeki \"CV'mi indir\" butonuna bağlanır; dile göre doğru dosya iner." },
      },
    },
    fields: [
      { name: "firstName", label: "Ad", required: true, maxLength: 50 },
      { name: "lastName", label: "Soyad", required: true, maxLength: 50 },
      { name: "email", label: "E-posta", type: "email", maxLength: 100 },
      { name: "phone", label: "Telefon", maxLength: 50 },
      { name: "address", label: "Adres", wide: true, maxLength: 50 },
      { name: "shortDescription", label: "Kısa açıklama", i18n: true, placeholder: "Yazılım Geliştirici", wide: true },
      { name: "description", label: "Hakkımda", i18n: true, type: "textarea", rows: 7 },
      { name: "imageUrl", label: "Profil fotoğrafı", type: "file", kind: "image" },
      { name: "cvDocumentUrlTr", label: "CV (TR)", type: "file", kind: "pdf", nameKey: "cvOriginalFileNameTr" },
      { name: "cvDocumentUrlEn", label: "CV (EN)", type: "file", kind: "pdf", nameKey: "cvOriginalFileNameEn" },
    ],
  },

  educations: {
    title: "Eğitim",
    singular: "eğitim",
    icon: "mortarboard",
    subtitle: "Okullar ve bölümler; sitede başlangıç tarihine göre yeniden eskiye sıralanır",
    form: { sections: { details: { title: "Tarihler", description: "Sitede sadece yıl olarak gösterilir, örn. “2020 – 2024”." } } },
    columns: [
      { key: "imageUrl", label: "", render: (item) => thumb(item.imageUrl), width: "56px" },
      { key: "institution", label: "Okul", i18n: true },
      { key: "department", label: "Bölüm", i18n: true },
      { key: "startDate", label: "Tarih", render: periodCell(false) },
    ],
    fields: [
      { name: "institution", label: "Okul", i18n: true, required: true, maxLength: 100 },
      { name: "department", label: "Bölüm", i18n: true, maxLength: 100 },
      { name: "period", label: "Tarih", type: "period" },
      { name: "description", label: "Açıklama", i18n: true, type: "textarea", rows: 3 },
      { name: "imageUrl", label: "Logo", type: "file", kind: "image", help: "Logo yoksa sitede okul adının kısaltması gösterilir." },
    ],
  },

  experiences: {
    title: "Deneyim",
    singular: "deneyim",
    icon: "briefcase",
    subtitle: "İş deneyimleri; sitede başlangıç tarihine göre yeniden eskiye sıralanır",
    form: {
      order: ["content", "details", "responsibilities", "files"],
      sections: {
        details: { title: "Şirket ve tarihler", description: "Tarihler sitede ay ve yıl olarak gösterilir, örn. “Eyl 2023 – Günümüz”." },
        responsibilities: { description: "Her madde sitede ayrı bir satır olarak listelenir. Her maddenin Türkçe ve İngilizce metni zorunlu." },
      },
    },
    columns: [
      { key: "imageUrl", label: "", render: (item) => thumb(item.imageUrl), width: "56px" },
      { key: "title", label: "Pozisyon", i18n: true },
      { key: "company", label: "Şirket" },
      { key: "startDate", label: "Tarih", render: periodCell(true) },
      { key: "responsibilities", label: "Sorumluluk", render: (item) => h("span", { class: "badge bg-soft-secondary mono" }, String((item.responsibilities || []).length)) },
    ],
    fields: [
      { name: "title", label: "Pozisyon", i18n: true, required: true, maxLength: 100 },
      { name: "location", label: "Konum", i18n: true, maxLength: 100 },
      { name: "company", label: "Şirket", required: true, maxLength: 100, wide: true },
      { name: "period", label: "Tarih", type: "period" },
      { name: "responsibilities", label: "Sorumluluklar", type: "responsibilities" },
      { name: "imageUrl", label: "Şirket logosu", type: "file", kind: "image" },
    ],
  },

  projects: {
    title: "Projeler",
    singular: "proje",
    icon: "code-square",
    subtitle: "Sitede bu listedeki sırayla gösterilir; oklarla taşıyabilirsin",
    reorderable: true,
    form: { sections: { details: { title: "Teknoloji ve bağlantılar", description: "Teknolojiler sitede etiket olarak görünür." } } },
    columns: [
      { key: "imageUrl", label: "", render: (item) => thumb(item.imageUrl), width: "56px" },
      { key: "title", label: "Proje", i18n: true },
      { key: "tools", label: "Teknolojiler", render: (item) => tags(item.tools) },
      {
        key: "link",
        label: "Bağlantılar",
        render: (item) => [
          item.link ? link(item.link, "github", "Kaynak kod", { class: "me-2" }) : null,
          item.demoUrl ? link(item.demoUrl, "box-arrow-up-right", "Demo") : null,
        ],
      },
    ],
    fields: [
      { name: "title", label: "Başlık", i18n: true, required: true, maxLength: 150 },
      { name: "description", label: "Açıklama", i18n: true, type: "textarea", rows: 4 },
      { name: "tools", label: "Teknolojiler", placeholder: "Java, Spring Boot, PostgreSQL", help: "Virgülle ayırın.", wide: true },
      { name: "link", label: "Kaynak kod linki", type: "url", placeholder: "https://github.com/..." },
      { name: "demoUrl", label: "Demo linki", type: "url", placeholder: "https://..." },
      { name: "imageUrl", label: "Proje görseli", type: "file", kind: "image" },
    ],
  },

  certificates: {
    title: "Sertifikalar",
    singular: "sertifika",
    icon: "patch-check",
    subtitle: "Sitede bu listedeki sırayla gösterilir; oklarla taşıyabilirsin",
    reorderable: true,
    form: {
      sections: {
        details: { title: "Kurum ve tarih", description: "Tarih sitede ay ve yıl olarak gösterilir." },
        files: { title: "Sertifika dosyası", description: "Sitede önizlemesi bu PDF'in ilk sayfasından oluşturulur." },
      },
    },
    columns: [
      { key: "title", label: "Sertifika", i18n: true },
      { key: "issuer", label: "Kurum" },
      { key: "issueDate", label: "Tarih", render: (item) => dateCell(item.issueDate) },
      {
        key: "pdfUrl",
        label: "PDF",
        render: (item) => (item.pdfUrl
          ? h("a", { href: item.pdfUrl, target: "_blank", title: "PDF'i aç", onClick: stop },
            [h("i", { class: "bi bi-file-earmark-pdf-fill fs-5", style: "color: var(--danger)" })])
          : h("span", { class: "text-muted" }, "—")),
      },
    ],
    fields: [
      { name: "title", label: "Başlık", i18n: true, required: true, maxLength: 200 },
      { name: "issuer", label: "Veren kurum", maxLength: 100 },
      { name: "issueDate", label: "Veriliş tarihi", type: "date" },
      { name: "pdfUrl", label: "Sertifika PDF'i", type: "file", kind: "pdf" },
    ],
  },

  skills: {
    title: "Yetenekler",
    singular: "yetenek",
    icon: "lightning-charge",
    subtitle: "Sitede kategoriye göre gruplanır",
    form: { sections: { details: { title: "Kategori", description: "Sitede yetenekler bu kategorilere göre gruplanır." } } },
    columns: [
      { key: "name", label: "Yetenek", i18n: true },
      { key: "category", label: "Kategori", render: (item) => categoryCell(item.category) },
    ],
    fields: [
      { name: "name", label: "Yetenek adı", i18n: true, required: true, maxLength: 100 },
      // Backend'de tek dilli metin; seçilen kategorinin Türkçe adı kaydedilir, site dile göre çevirir.
      { name: "category", label: "Kategori", type: "category", required: true, options: SKILL_CATEGORIES },
    ],
  },
};

// Menüdeki ve panodaki bağlantı: tekil kaynak doğrudan forma, diğerleri listeye gider
export const resourceRoute = (key) =>
  (RESOURCES[key].singleton ? { name: "profile" } : { name: "list", params: { key } });
