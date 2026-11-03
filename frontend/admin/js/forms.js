// Form motoru: resources.js'teki alan tanımlarından form çizer, dosya önizlemesi, sorumluluk
// listesi, doğrulama, backend alan hataları ve "kaydedilmemiş değişiklik" takibini yönetir.
(function () {
  const { esc } = window.util;
  const LANGS = ["tr", "en"];
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const URL_RE = /^https?:\/\/\S+$/i;
  const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
  const { UPLOAD_RULES, checkUpload, findSkillCategory } = window.APP_CONSTANTS;

  const LANG_NAMES = { tr: "Türkçe", en: "English" };
  // Backend iki dilli alanları "titleTr" / "titleEn" olarak adlandırır
  const LANG_SUFFIX = { tr: "Tr", en: "En" };
  const i18nName = (name, lang) => name + LANG_SUFFIX[lang];
  const requiredFor = (f, lang) => f.required === true || f.required === lang;

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

  // ---------------- Çizim ----------------

  function control(field, name, value) {
    const common = `id="f-${name}" name="${name}" class="form-control"`;
    const placeholder = field.placeholder ? ` placeholder="${esc(field.placeholder)}"` : "";
    switch (field.type) {
      case "textarea":
        return `<textarea ${common} rows="${field.rows || 3}"${placeholder}>${esc(value)}</textarea>`;
      case "date":
        return `<input ${common} type="date" value="${esc(value ? String(value).slice(0, 10) : "")}" style="max-width: 220px;">`;
      case "password":
        return `<input ${common} type="password" autocomplete="new-password">`;
      case "email":
      case "url":
        return `<input ${common} type="${field.type}" value="${esc(value)}"${placeholder}>`;
      default:
        return `<input ${common} type="text" value="${esc(value)}"${placeholder}>`;
    }
  }

  const feedback = (name) => `<div class="invalid-feedback" data-feedback-for="${name}"></div>`;
  const help = (field) => (field.help ? `<div class="form-text">${esc(field.help)}</div>` : "");
  const requiredMark = (on) => (on ? ' <span class="req">*</span>' : "");
  // Uzun alanlar (textarea veya wide: true) iki sütunlu ızgarada tam satır kaplar
  const isWide = (field) => field.type === "textarea" || field.type === "period" || field.wide;
  const wideClass = (field) => (isWide(field) ? " field-wide" : "");

  function renderI18n(field, item) {
    return LANGS.map((lang) => {
      const name = i18nName(field.name, lang);
      return `
        <div class="field${wideClass(field)}" data-lang-pane="${lang}">
          <label class="form-label" for="f-${name}">${esc(field.label)}${requiredMark(requiredFor(field, lang))}</label>
          ${control(field, name, item[name])}
          ${feedback(name)}
          ${help(field)}
        </div>`;
    }).join("");
  }

  function renderSimple(field, item) {
    if (field.type === "period") return renderPeriod(field, item);
    if (field.type === "category") {
      // Backend kategoriyi tek dilli metin olarak tutar; Türkçe ad kaydedilir.
      // Listede olmayan eski bir değer varsa kaybolmasın diye seçenek olarak eklenir.
      const current = item[field.name] || "";
      const known = findSkillCategory(current);
      const selected = known ? known.tr : current;
      const extra = current && !known ? `<option value="${esc(current)}" selected>${esc(current)} (listede yok)</option>` : "";
      return `
        <div class="field">
          <label class="form-label" for="f-${field.name}">${esc(field.label)}${requiredMark(field.required)}</label>
          <select id="f-${field.name}" name="${field.name}" class="form-select">
            <option value="">Kategori seçin</option>
            ${field.options.map((o) => `<option value="${esc(o.tr)}"${o.tr === selected ? " selected" : ""}>${esc(o.tr)} · ${esc(o.en)}</option>`).join("")}
            ${extra}
          </select>
          ${feedback(field.name)}
        </div>`;
    }
    return `
      <div class="field${wideClass(field)}">
        <label class="form-label" for="f-${field.name}">${esc(field.label)}${requiredMark(field.required)}</label>
        ${control(field, field.name, item[field.name])}
        ${feedback(field.name)}
        ${help(field)}
      </div>`;
  }

  // "2023-09-01" -> "2023-09" (input type=month değeri)
  const toMonth = (date) => (date ? String(date).slice(0, 7) : "");

  // Başlangıç / bitiş ay seçicileri ve "Devam ediyor" kutusu. API'ye ayın 1'i (YYYY-MM-01) gider.
  // type=month desteklemeyen tarayıcılarda (ör. masaüstü Firefox) metin kutusu olur; YYYY-AA yazılır.
  function renderPeriod(field, item) {
    const ongoing = !!item.startDate && !item.endDate;
    return `
      <div class="field field-wide period-field">
        <div class="period-grid">
          <div>
            <label class="form-label" for="f-startDate">Başlangıç${requiredMark(true)}</label>
            <input id="f-startDate" name="startDate" type="month" class="form-control" placeholder="YYYY-AA" value="${esc(toMonth(item.startDate))}">
            ${feedback("startDate")}
          </div>
          <div>
            <label class="form-label" for="f-endDate">Bitiş</label>
            <input id="f-endDate" name="endDate" type="month" class="form-control" placeholder="YYYY-AA" value="${esc(toMonth(item.endDate))}"${ongoing ? " disabled" : ""}>
            ${feedback("endDate")}
          </div>
        </div>
        <div class="form-check mt-3">
          <input class="form-check-input" type="checkbox" id="f-ongoing" name="ongoing"${ongoing ? " checked" : ""}>
          <label class="form-check-label" for="f-ongoing">Devam ediyor</label>
        </div>
        ${help(field)}
      </div>`;
  }

  function filePreview(field, url, fileName) {
    if (field.kind === "image") {
      return url
        ? `<img src="${esc(url)}" alt="" class="file-preview-img">`
        : '<div class="file-preview-empty"><i class="bi bi-image"></i><span>Görsel yok</span></div>';
    }
    return url
      ? `<a href="${esc(url)}" target="_blank" class="file-preview-doc">
           <i class="bi bi-file-earmark-pdf-fill"></i>
           <span class="text-truncate">${esc(fileName || "Mevcut PDF'i aç")}</span>
           <i class="bi bi-box-arrow-up-right ms-auto small"></i>
         </a>`
      : '<div class="file-preview-empty"><i class="bi bi-file-earmark"></i><span>Dosya yok</span></div>';
  }

  // Dosya alanı: field.name kaydın URL alanıdır (imageUrl, pdfUrl, ...). Seçilen dosya kayıttan önce
  // POST /api/files ile yüklenir, dönen url bu alana yazılır (form.js).
  function renderFile(field, item) {
    const url = item[field.name];
    return `
      <div class="file-field" data-file-field="${field.name}">
        <div class="form-label">${esc(field.label)}</div>
        <div class="file-preview" data-preview>${filePreview(field, url, field.nameKey ? item[field.nameKey] : null)}</div>
        <div class="d-flex gap-2 mt-2">
          <label class="btn btn-soft-secondary btn-sm flex-grow-1 mb-0" for="f-${field.name}">
            <i class="bi bi-upload"></i> ${url ? "Değiştir" : "Dosya seç"}
          </label>
          <button type="button" class="btn btn-soft-danger btn-sm" data-file-remove title="Dosyayı kaldır" aria-label="Dosyayı kaldır"${url ? "" : " hidden"}><i class="bi bi-trash3"></i></button>
        </div>
        <input id="f-${field.name}" name="${field.name}" type="file" class="visually-hidden"
               accept="${UPLOAD_RULES[field.kind].accept}">
        ${feedback(field.name)}
        <div class="form-text">${esc(`${UPLOAD_RULES[field.kind].typeLabel} · en fazla ${UPLOAD_RULES[field.kind].sizeLabel}`)}</div>
        ${help(field)}
      </div>`;
  }

  // Backend PUT'ta sorumlulukların hepsini silip gönderilen listeyi sırayla yeniden oluşturur; id gönderilmez.
  function responsibilityItem(r = {}) {
    return `
      <div class="resp-item">
        <span class="resp-number" data-resp-number></span>
        <div class="flex-grow-1">
          ${LANGS.map((lang) => `
            <div data-lang-pane="${lang}">
              <textarea class="form-control" rows="2" data-resp-lang="${lang}"
                        placeholder="${lang === "tr" ? "Bu pozisyonda neler yaptın?" : "What did you do in this role?"}">${esc(r[i18nName("description", lang)])}</textarea>
              <div class="invalid-feedback" data-resp-feedback="${lang}"></div>
            </div>`).join("")}
        </div>
        <div class="resp-actions">
          <button type="button" class="icon-btn" data-resp-move="-1" title="Yukarı taşı" aria-label="Yukarı taşı"><i class="bi bi-arrow-up"></i></button>
          <button type="button" class="icon-btn" data-resp-move="1" title="Aşağı taşı" aria-label="Aşağı taşı"><i class="bi bi-arrow-down"></i></button>
          <button type="button" class="icon-btn resp-remove" data-resp-remove title="Kaldır" aria-label="Kaldır"><i class="bi bi-trash3"></i></button>
        </div>
      </div>`;
  }

  function renderResponsibilities(field, item) {
    return `
      <div data-resp-list>${(item.responsibilities || []).map(responsibilityItem).join("")}</div>
      <p class="text-muted mono small mb-3" data-resp-empty>// henüz sorumluluk eklenmedi</p>
      <button type="button" class="btn btn-add w-100" data-resp-add><i class="bi bi-plus-lg"></i> ${esc(field.addText || "Sorumluluk ekle")}</button>`;
  }

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
        result.push(field);
      } else {
        run.push(field);
      }
    }
    flush();
    return result;
  }

  function renderSectionBody(key, fields, item) {
    if (key === "responsibilities") return renderResponsibilities(fields[0], item);
    if (key === "files") return `<div class="file-grid">${fields.map((f) => renderFile(f, item)).join("")}</div>`;
    return `<div class="field-grid">${fillRows(fields).map((f) => (f.i18n ? renderI18n(f, item) : renderSimple(f, item))).join("")}</div>`;
  }

  // options.sections: { anahtar: { title, description } }, options.order: ["details", "content", ...]
  function render(fields, item = {}, options = {}) {
    const groups = {};
    for (const field of fields) (groups[sectionOf(field)] ||= []).push(field);
    const order = options.order || DEFAULT_ORDER;

    return order.filter((key) => groups[key]).map((key) => {
      const meta = {
        ...SECTION_DEFAULTS[key],
        ...(key === "responsibilities" ? { title: groups[key][0].label } : {}),
        ...(options.sections || {})[key],
      };
      const bilingual = key === "content" || key === "responsibilities";
      return `
        <section class="form-section">
          <div class="form-section-intro">
            <h2>${esc(meta.title)}</h2>
            ${meta.description ? `<p>${esc(meta.description)}</p>` : ""}
            ${bilingual ? '<span class="lang-indicator" data-lang-indicator></span>' : ""}
          </div>
          <div class="card form-section-card">
            <div class="card-body">${renderSectionBody(key, groups[key], item)}</div>
          </div>
        </section>`;
    }).join("");
  }

  // İki dilli alan varsa kaydet çubuğuna konacak dil anahtarı
  function langSwitch(fields) {
    if (!fields.some((f) => f.i18n || f.type === "responsibilities")) return "";
    return `
      <div class="lang-switch" role="tablist" aria-label="Düzenlenen dil">
        ${LANGS.map((lang) => `
          <button type="button" role="tab" data-lang="${lang}">
            ${LANG_NAMES[lang]} <span class="lang-status" data-lang-status="${lang}"></span>
          </button>`).join("")}
      </div>`;
  }

  // ---------------- Davranış ----------------

  function bind(form, fields) {
    let dirty = false;
    const hint = form.querySelector("[data-dirty-hint]");
    const setDirty = (value) => {
      dirty = value;
      if (hint) hint.hidden = !value;
    };
    form.addEventListener("input", () => {
      setDirty(true);
      updateLangStatus(form);
    });
    form.addEventListener("change", () => setDirty(true));
    window.addEventListener("beforeunload", (e) => {
      if (dirty) e.preventDefault();
    });

    // Dil sekmesi
    setLang(form, form.dataset.activeLang || "tr");
    form.querySelectorAll(".lang-switch [data-lang]").forEach((btn) => {
      btn.addEventListener("click", () => setLang(form, btn.dataset.lang));
    });

    // Dosya seçilince önizlemeyi güncelle; "kaldır" ile mevcut dosya kayıttan çıkarılır
    for (const field of fields.filter((f) => f.type === "file")) {
      const wrapper = form.querySelector(`[data-file-field="${field.name}"]`);
      const preview = wrapper.querySelector("[data-preview]");
      const removeBtn = wrapper.querySelector("[data-file-remove]");
      removeBtn.addEventListener("click", () => {
        wrapper.querySelector("input").value = "";
        wrapper.dataset.removed = "1";
        removeBtn.hidden = true;
        setError(form, field.name, null);
        preview.innerHTML = filePreview(field, null, null);
        setDirty(true);
      });
      wrapper.querySelector("input").addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        // Kurala uymayan dosya hiç gönderilmez: seçim temizlenir, önceki önizleme kalır.
        const error = checkUpload(field.kind, file);
        setError(form, field.name, error);
        if (error) {
          e.target.value = "";
          return;
        }
        delete wrapper.dataset.removed;
        removeBtn.hidden = false;
        preview.innerHTML = field.kind === "image"
          ? `<img src="${URL.createObjectURL(file)}" alt="" class="file-preview-img">`
          : `<div class="file-preview-doc"><i class="bi bi-file-earmark-pdf-fill"></i><span class="text-truncate">${esc(file.name)}</span></div>`;
        preview.insertAdjacentHTML("beforeend", '<span class="badge file-new-badge">Yeni</span>');
      });
    }

    // "Devam ediyor" işaretliyse bitiş tarihi pasif
    const ongoing = form.elements.ongoing;
    if (ongoing) {
      ongoing.addEventListener("change", () => {
        form.elements.endDate.disabled = ongoing.checked;
        if (ongoing.checked) setError(form, "endDate", null);
      });
    }

    // Sorumluluk listesi
    const list = form.querySelector("[data-resp-list]");
    if (list) {
      const refresh = () => {
        const items = list.querySelectorAll(".resp-item");
        items.forEach((el, i) => {
          el.querySelector("[data-resp-number]").textContent = String(i + 1).padStart(2, "0");
          el.querySelector('[data-resp-move="-1"]').disabled = i === 0;
          el.querySelector('[data-resp-move="1"]').disabled = i === items.length - 1;
        });
        form.querySelector("[data-resp-empty]").hidden = items.length > 0;
        updateLangStatus(form);
      };
      form.querySelector("[data-resp-add]").addEventListener("click", () => {
        list.insertAdjacentHTML("beforeend", responsibilityItem());
        list.lastElementChild.querySelector(`[data-lang-pane="${form.dataset.activeLang}"]`).focus();
        setDirty(true);
        refresh();
      });
      list.addEventListener("click", (e) => {
        const moveBtn = e.target.closest("[data-resp-move]");
        if (moveBtn) {
          const row = moveBtn.closest(".resp-item");
          const direction = Number(moveBtn.dataset.respMove);
          if (direction < 0 && row.previousElementSibling) row.previousElementSibling.before(row);
          if (direction > 0 && row.nextElementSibling) row.nextElementSibling.after(row);
          setDirty(true);
          refresh();
          // Klavyeyle art arda taşınabilsin; uçta pasif kaldıysa öbür oka geç
          const again = row.querySelector(`[data-resp-move="${direction}"]`);
          (again.disabled ? row.querySelector(`[data-resp-move="${-direction}"]`) : again).focus();
          return;
        }
        const btn = e.target.closest("[data-resp-remove]");
        if (!btn) return;
        btn.closest(".resp-item").remove();
        setDirty(true);
        refresh();
      });
      refresh();
    }

    return {
      isDirty: () => dirty,
      markClean: () => setDirty(false),
    };
  }

  function setLang(form, lang) {
    form.dataset.activeLang = lang;
    form.querySelectorAll(".lang-switch [data-lang]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === lang);
      btn.setAttribute("aria-selected", btn.dataset.lang === lang);
    });
    form.querySelectorAll("[data-lang-indicator]").forEach((el) => {
      el.innerHTML = `<i class="bi bi-translate"></i> ${LANG_NAMES[lang]} düzenleniyor`;
    });
    updateLangStatus(form);
  }

  // Her dil için doluluk ("3/4" ya da ✓) ve hata işareti
  function updateLangStatus(form) {
    for (const lang of LANGS) {
      const status = form.querySelector(`[data-lang-status="${lang}"]`);
      if (!status) continue;
      const inputs = [...form.querySelectorAll(`.field[data-lang-pane="${lang}"] .form-control, [data-lang-pane="${lang}"] textarea[data-resp-lang]`)];
      const filled = inputs.filter((el) => el.value.trim()).length;
      const hasError = inputs.some((el) => el.classList.contains("is-invalid"));
      status.className = `lang-status${hasError ? " has-error" : ""}`;
      status.innerHTML = hasError
        ? '<i class="bi bi-exclamation-circle-fill"></i>'
        : filled === inputs.length ? '<i class="bi bi-check2"></i>' : `${filled}/${inputs.length}`;
    }
  }

  // Hatalı alan gizli dildeyse önce o dile geç, sonra odaklan
  function focusField(form, input) {
    const pane = input.closest("[data-lang-pane]");
    if (pane && pane.dataset.langPane !== form.dataset.activeLang) setLang(form, pane.dataset.langPane);
    updateLangStatus(form);
    input.focus({ preventScroll: true });
    input.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  // Formdaki değerler, backend DTO alan adlarıyla.
  //   files:   { urlAlanı: File }  -> yüklenecek yeni dosyalar
  //   removed: [urlAlanı]          -> "kaldır" ile çıkarılan dosyalar
  // Dosya alanlarının mevcut değerleri data'ya konmaz; form.js mevcut kayıtla birleştirir.
  function collect(form, fields) {
    const data = {};
    const files = {};
    const removed = [];
    for (const field of fields) {
      if (field.type === "file") {
        const file = form.elements[field.name].files[0];
        if (file) files[field.name] = file;
        else if (form.querySelector(`[data-file-field="${field.name}"]`).dataset.removed) removed.push(field.name);
      } else if (field.type === "responsibilities") {
        // Tamamen boş satırlar atlanır; yarım dolu satırları validate() yakalar
        data.responsibilities = responsibilityRows(form)
          .map(({ tr, en }) => ({ descriptionTr: tr.value.trim(), descriptionEn: en.value.trim() }))
          .filter((r) => r.descriptionTr || r.descriptionEn);
      } else if (field.type === "period") {
        data.startDate = `${form.elements.startDate.value}-01`;
        data.endDate = form.elements.ongoing.checked ? null : `${form.elements.endDate.value}-01`;
      } else if (field.type === "password") {
        data[field.name] = form.elements[field.name].value;
      } else {
        for (const name of field.i18n ? LANGS.map((l) => i18nName(field.name, l)) : [field.name]) {
          data[name] = form.elements[name].value.trim() || null;
        }
      }
    }
    return { data, files, removed };
  }

  // Sorumluluk satırları (ekrandaki sırayla) ve iki dildeki textarea'ları
  const responsibilityRows = (form) => [...form.querySelectorAll(".resp-item")].map((el) => ({
    el,
    tr: el.querySelector('[data-resp-lang="tr"]'),
    en: el.querySelector('[data-resp-lang="en"]'),
  }));

  function setResponsibilityError(textarea, message) {
    textarea.classList.toggle("is-invalid", !!message);
    const fb = textarea.parentElement.querySelector("[data-resp-feedback]");
    if (fb) fb.textContent = message || "";
  }

  function setError(form, name, message) {
    const input = form.elements[name];
    const fb = form.querySelector(`[data-feedback-for="${name}"]`);
    if (!input || !fb) return false;
    input.classList.toggle("is-invalid", !!message);
    fb.textContent = message || "";
    return true;
  }

  function clearErrors(form) {
    form.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
    form.querySelectorAll("[data-feedback-for], [data-resp-feedback]").forEach((el) => (el.textContent = ""));
  }

  function checkValue(field, value, form, lang) {
    const langSuffix = lang ? ` (${lang.toUpperCase()})` : "";
    const required = lang ? requiredFor(field, lang) : field.required;
    if (!value) return required ? `${field.label}${langSuffix} boş bırakılamaz.` : null;
    if (field.maxLength && value.length > field.maxLength) return `En fazla ${field.maxLength} karakter olabilir.`;
    if (field.minLength && value.length < field.minLength) return field.minLengthMessage || `En az ${field.minLength} karakter olmalıdır.`;
    if (field.pattern && !field.pattern.test(value)) return field.patternMessage || "Geçersiz değer.";
    if (field.type === "email" && !EMAIL_RE.test(value)) return "Geçerli bir e-posta adresi girin.";
    if (field.type === "url" && !URL_RE.test(value)) return "http:// veya https:// ile başlayan bir adres girin.";
    if (field.match && value !== form.elements[field.match].value) return field.matchMessage || "Değerler eşleşmiyor.";
    return null;
  }

  // Tarih alanının hataları: { startDate?: mesaj, endDate?: mesaj }
  function checkPeriod(form) {
    const errors = {};
    const start = form.elements.startDate.value.trim();
    const end = form.elements.endDate.value.trim();
    if (!start) errors.startDate = "Başlangıç tarihini seçin.";
    else if (!MONTH_RE.test(start)) errors.startDate = "Tarih YYYY-AA biçiminde olmalı (ör. 2023-09).";
    if (!form.elements.ongoing.checked) {
      if (!end) errors.endDate = "Bitiş tarihini seçin ya da “Devam ediyor”u işaretleyin.";
      else if (!MONTH_RE.test(end)) errors.endDate = "Tarih YYYY-AA biçiminde olmalı (ör. 2024-06).";
      else if (!errors.startDate && end < start) errors.endDate = "Bitiş tarihi başlangıçtan önce olamaz.";
    }
    return errors;
  }

  // Geçersiz ilk alana odaklanır; geçerliyse true döner.
  function validate(form, fields) {
    clearErrors(form);
    let firstInvalid = null;
    for (const field of fields) {
      if (field.type === "file") continue;
      if (field.type === "responsibilities") {
        // Backend: her maddenin descriptionTr ve descriptionEn alanı @NotBlank
        for (const { tr, en } of responsibilityRows(form)) {
          const hasTr = !!tr.value.trim();
          const hasEn = !!en.value.trim();
          if (hasTr === hasEn) continue; // ikisi de dolu ya da satır tamamen boş (atlanır)
          const missing = hasTr ? en : tr;
          setResponsibilityError(missing, `Bu maddenin ${hasTr ? "İngilizce" : "Türkçe"} metni boş bırakılamaz.`);
          firstInvalid = firstInvalid || missing;
        }
        continue;
      }
      if (field.type === "period") {
        for (const [name, message] of Object.entries(checkPeriod(form))) {
          setError(form, name, message);
          firstInvalid = firstInvalid || form.elements[name];
        }
        continue;
      }
      const targets = field.i18n ? LANGS.map((l) => [i18nName(field.name, l), l]) : [[field.name, null]];
      for (const [name, lang] of targets) {
        const raw = form.elements[name].value;
        const message = checkValue(field, field.type === "password" ? raw : raw.trim(), form, lang);
        if (message) {
          setError(form, name, message);
          firstInvalid = firstInvalid || form.elements[name];
        }
      }
    }
    if (firstInvalid) focusField(form, firstInvalid);
    else updateLangStatus(form);
    return !firstInvalid;
  }

  // Backend'den gelen 400 { alan: mesaj } hatalarını ilgili inputların altına yazar.
  // Alan adları DTO'dakilerdir; sorumluluklar "responsibilities[2].descriptionEn" biçiminde gelir.
  // Formda karşılığı olmayan mesajları döndürür (çağıran toast ile gösterir).
  function showServerErrors(form, errors) {
    if (!errors) return [];
    let first = null;
    const unmatched = [];
    // collect() boş satırları atladığı için backend'deki indeks, dolu satırlar arasındaki sıradır
    const rows = responsibilityRows(form).filter(({ tr, en }) => tr.value.trim() || en.value.trim());
    for (const [name, message] of Object.entries(errors)) {
      const resp = /^responsibilities\[(\d+)\]\.description(Tr|En)$/.exec(name);
      if (resp && rows[Number(resp[1])]) {
        const textarea = rows[Number(resp[1])][resp[2].toLowerCase()];
        setResponsibilityError(textarea, message);
        first = first || textarea;
      } else if (setError(form, name, message)) {
        first = first || form.elements[name];
      } else {
        unmatched.push(`${name}: ${message}`);
      }
    }
    if (first) focusField(form, first);
    else updateLangStatus(form);
    return unmatched;
  }

  window.forms = { render, langSwitch, bind, collect, validate, clearErrors, showServerErrors, setError, focusField };
})();
