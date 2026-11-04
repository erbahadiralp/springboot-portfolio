// Site ve admin panelinin ortak kullandığı sabitler.
(function () {
  // Yetenek kategorileri. Backend'de kategori tek dilli serbest metindir (SkillRequestDTO.category);
  // admin formu Türkçe adı (tr) kaydeder, site aktif dile çevirir. Listede olmayan bir değer olduğu gibi gösterilir.
  // Ana sayfada kategoriler bu sırayla gösterilir.
  const SKILL_CATEGORIES = [
    { tr: "Programlama Dilleri", en: "Programming Languages" },
    { tr: "Frameworkler & Kütüphaneler", en: "Frameworks & Libraries" },
    { tr: "Veritabanları", en: "Databases" },
    { tr: "Araçlar & Platformlar", en: "Tools & Platforms" },
    { tr: "Diğer", en: "Other" },
  ];

  // Kayıttaki kategori değerine (TR ya da EN adı) karşılık gelen tanım; yoksa null.
  const findSkillCategory = (value) => {
    const v = (value || "").trim().toLocaleLowerCase("tr");
    return SKILL_CATEGORIES.find((c) => c.tr.toLocaleLowerCase("tr") === v || c.en.toLocaleLowerCase("tr") === v) || null;
  };

  // Dosya yükleme kuralları: backend FileStorageService ile aynı (API.md -> "Dosya yükleme").
  // Backend uzantıya ve dosyanın ilk baytlarına bakar; burada uzantı ve boyut önceden denetlenir.
  const MB = 1024 * 1024;
  const UPLOAD_RULES = {
    image: { extensions: ["png", "jpg", "jpeg", "webp"], accept: ".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp", maxBytes: 5 * MB, typeLabel: "PNG, JPEG veya WebP", sizeLabel: "5 MB" },
    pdf: { extensions: ["pdf"], accept: ".pdf,application/pdf", maxBytes: 10 * MB, typeLabel: "PDF", sizeLabel: "10 MB" },
  };

  // Dosya kurala uymuyorsa Türkçe hata mesajı, uyuyorsa null döner.
  function checkUpload(kind, file) {
    const rule = UPLOAD_RULES[kind];
    if (!rule || !file) return null;
    const dot = file.name.lastIndexOf(".");
    const extension = dot >= 0 ? file.name.slice(dot + 1).toLowerCase() : "";
    if (!rule.extensions.includes(extension)) return `Sadece ${rule.typeLabel} dosyası yüklenebilir.`;
    if (file.size === 0) return "Dosya boş.";
    if (file.size > rule.maxBytes) return `Dosya en fazla ${rule.sizeLabel} olabilir.`;
    return null;
  }

  window.APP_CONSTANTS = { SKILL_CATEGORIES, findSkillCategory, UPLOAD_RULES, checkUpload };
})();
