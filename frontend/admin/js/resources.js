// Admin panelindeki içerik bölümlerinin tanımları. Menü, liste (list.html) ve form (form.html)
// sayfaları bu tanımlardan üretilir; yeni bir alan eklemek için genelde sadece burası değişir.
//
// Kaynak:
//   title, singular, icon (Bootstrap Icons adı), subtitle
//   singleton: true  -> liste yok, tek kayıt düzenlenir (GET/PUT /api/<key>)
//   reorderable: true -> listede yukarı/aşağı taşıma okları ve "Sıra" sütunu (PUT /api/<key>/order)
//   columns          -> liste tablosu. i18n: true ise TR üstte, EN altta gösterilir.
//   fields           -> form alanları (ayrıntılar: forms.js)
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
(function () {
  const { esc, formatPeriod, parseDate } = window.util;
  const { SKILL_CATEGORIES, findSkillCategory } = window.APP_CONSTANTS;

  const thumb = (url) => (url
    ? `<img src="${esc(url)}" alt="" class="thumb">`
    : '<div class="thumb thumb-empty"><i class="bi bi-image"></i></div>');

  const tags = (csv) => (csv || "").split(",").map((t) => t.trim()).filter(Boolean)
    .map((t) => `<span class="badge bg-soft-primary tag me-1">${esc(t)}</span>`).join("");

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
    esc(formatPeriod(item.startDate, item.endDate, { locale: "tr-TR", withMonth, presentLabel: "Günümüz" }));

  window.ADMIN_RESOURCES = {
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
        { key: "responsibilities", label: "Sorumluluk", render: (item) => `<span class="badge bg-soft-secondary mono">${(item.responsibilities || []).length}</span>` },
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
            item.link ? `<a href="${esc(item.link)}" target="_blank" class="me-2" title="Kaynak kod" data-stop><i class="bi bi-github"></i></a>` : "",
            item.demoUrl ? `<a href="${esc(item.demoUrl)}" target="_blank" title="Demo" data-stop><i class="bi bi-box-arrow-up-right"></i></a>` : "",
          ].join(""),
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
        { key: "issueDate", label: "Tarih", render: (item) => esc(dateCell(item.issueDate)) },
        {
          key: "pdfUrl",
          label: "PDF",
          render: (item) => (item.pdfUrl
            ? `<a href="${esc(item.pdfUrl)}" target="_blank" data-stop title="PDF'i aç"><i class="bi bi-file-earmark-pdf-fill fs-5" style="color: var(--danger)"></i></a>`
            : '<span class="text-muted">—</span>'),
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
        { key: "category", label: "Kategori", render: (item) => esc(categoryCell(item.category)) },
      ],
      fields: [
        { name: "name", label: "Yetenek adı", i18n: true, required: true, maxLength: 100 },
        // Backend'de tek dilli metin; seçilen kategorinin Türkçe adı kaydedilir, site dile göre çevirir.
        { name: "category", label: "Kategori", type: "category", required: true, options: SKILL_CATEGORIES },
      ],
    },
  };
})();
