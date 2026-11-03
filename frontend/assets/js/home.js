// Ana sayfa: verileri API'den çekip bölümleri render eder.
(function () {
  const { t, pick, getLang, setLang, locale } = window.i18n;
  const { esc, formatPeriod } = window.util;
  const { SKILL_CATEGORIES, findSkillCategory } = window.APP_CONSTANTS;
  const $ = (id) => document.getElementById(id);

  const ICONS = {
    location: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>',
    mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>',
    github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>',
    linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15,3 21,3 21,9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line>',
    zoom: '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline>',
    success: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>',
    error: '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>',
  };
  const svg = (name, attrs = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"') =>
    `<svg ${attrs}>${ICONS[name]}</svg>`;

  // ---------------- Bölümler ----------------

  function renderSidebar(about) {
    if (!about) return "";
    const cvUrl = pick(about, "cvDocumentUrl");
    return `
      <div class="profile-image">
        ${about.imageUrl
          ? `<img src="${esc(about.imageUrl)}" alt="${esc(t("ProfilePhoto"))}" class="avatar-img" data-initials="${esc(initials(about))}">`
          : avatarPlaceholder(about)}
      </div>
      <div class="profile-info">
        <h2 class="profile-name">${esc(about.firstName)} ${esc(about.lastName)}</h2>
        <p class="profile-bio">${esc(pick(about, "shortDescription"))}</p>
      </div>
      <div class="social-links">
        <div class="sidebar-subheader">${esc(t("Contact").toLocaleUpperCase(getLang()))}</div>
        <div class="social-link" style="margin-bottom: 0.5rem;">
          ${svg("location", 'class="social-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"')}
          <span>${esc(about.address)}</span>
        </div>
        <a href="mailto:${esc(about.email)}" class="social-link" target="_blank">
          ${svg("mail", 'class="social-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"')}
          <span>${esc(about.email)}</span>
        </a>
        <div class="sidebar-subheader">${esc(t("Links").toLocaleUpperCase(getLang()))}</div>
        <a href="https://github.com/erbahadiralp" class="social-link" target="_blank" style="margin-bottom: 0.5rem;">
          ${svg("github", 'class="social-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"')}
          <span>GitHub</span>
        </a>
        <a href="https://www.linkedin.com/in/bahadiralper/" class="social-link" target="_blank">
          ${svg("linkedin", 'class="social-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"')}
          <span>LinkedIn</span>
        </a>
      </div>
      ${cvUrl ? `
      <div class="download-cv">
        <a href="${esc(cvUrl)}" download="${esc(pick(about, "cvOriginalFileName") || "")}" class="download-button">
          <span style="font-size: 1.2em; font-weight: 300; margin-right: 4px;">&darr;</span>
          <span>${esc(t("DownloadCV"))}</span>
        </a>
      </div>` : ""}`;
  }

  // "Bahadır Alp" + "Er" -> "BE"
  function initials(about) {
    return [about.firstName, about.lastName]
      .map((part) => (part || "").trim().charAt(0))
      .join("")
      .toLocaleUpperCase(getLang());
  }

  const avatarPlaceholder = (about) =>
    `<div class="avatar-img avatar-placeholder" role="img" aria-label="${esc(t("ProfilePhoto"))}">${esc(initials(about))}</div>`;

  // Fotoğraf adresi var ama dosya açılamıyorsa kırık resim yerine yer tutucu göster
  function setupAvatarFallback() {
    const img = document.querySelector(".profile-image img.avatar-img");
    if (!img) return;
    img.addEventListener("error", () => {
      img.outerHTML = `<div class="avatar-img avatar-placeholder" role="img" aria-label="${esc(t("ProfilePhoto"))}">${esc(img.dataset.initials)}</div>`;
    }, { once: true });
  }

  // Eğitim: sadece yıl, deneyim: ay + yıl. Bitiş yoksa "Günümüz / Present".
  const period = (item, withMonth) =>
    formatPeriod(item.startDate, item.endDate, { locale: locale(), withMonth, presentLabel: t("Present") });

  function logoBox(imageUrl, fallbackText, extraStyle = "") {
    return `
      <div class="minimal-logo-box"${extraStyle ? ` style="${extraStyle}"` : ""}>
        ${imageUrl
          ? `<img src="${esc(imageUrl)}" alt="Logo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" />`
          : esc(fallbackText)}
      </div>`;
  }

  function renderEducations(educations) {
    return `<div class="minimal-section">${educations.map((edu) => {
      const school = pick(edu, "institution") || "";
      // "Biruni Üniversitesi" -> "BIR\nÜNİ"; tek kelimeyse ilk 3 harf.
      const words = school.split(" ").filter(Boolean);
      const abbrev = (words.length >= 2 ? `${words[0].slice(0, 3)}\n${words[1].slice(0, 3)}` : school.slice(0, 3))
        .toLocaleUpperCase(getLang());
      return `
        <div class="minimal-row">
          ${logoBox(edu.imageUrl, abbrev, "white-space: pre-line; text-align: center; line-height: 1.2; font-size: 0.75rem;")}
          <div class="minimal-content">
            <div class="minimal-header">
              <div class="minimal-title">${esc(school)}</div>
              <div class="minimal-date">${esc(period(edu, false))}</div>
            </div>
            <div class="minimal-subtitle" style="margin-bottom: 0.5rem;">
              ${esc(pick(edu, "department"))}
              <br />
              <span style="font-size: 0.9em; color:#9ca3af;">${esc(pick(edu, "description"))}</span>
            </div>
          </div>
        </div>`;
    }).join("")}</div>`;
  }

  function renderExperiences(experiences) {
    return `<div class="minimal-section">${experiences.map((exp) => {
      const company = exp.company || "";
      const location = pick(exp, "location");
      const responsibilities = exp.responsibilities || [];
      return `
        <div class="minimal-row">
          ${logoBox(exp.imageUrl, company.slice(0, 2).toLocaleUpperCase(getLang()))}
          <div class="minimal-content">
            <div class="minimal-header">
              <div class="minimal-title">${esc(company)}</div>
              <div class="minimal-date">${esc(period(exp, true))}</div>
            </div>
            <div class="minimal-subtitle">
              ${esc(pick(exp, "title"))}${location ? ` &middot; ${esc(location)}` : ""}
            </div>
            ${responsibilities.length ? `
            <ul class="minimal-list">
              ${responsibilities.map((r) => `<li>${esc(pick(r, "description"))}</li>`).join("")}
            </ul>` : ""}
          </div>
        </div>`;
    }).join("")}</div>`;
  }

  function renderProjects(projects) {
    return `<div class="projects-grid">${projects.map((p) => {
      const title = pick(p, "title");
      const tools = (p.tools || "").split(",").map((x) => x.trim()).filter(Boolean);
      return `
        <div class="project-card">
          ${p.imageUrl ? `
          <div class="project-image-container">
            <img src="${esc(p.imageUrl)}" alt="${esc(title)}" class="project-image" />
          </div>` : ""}
          <div class="project-header">
            <h3 class="project-title">${esc(title)}</h3>
            ${p.demoUrl ? `
            <a href="${esc(p.demoUrl)}" target="_blank" class="project-link" title="${esc(t("Demo"))}" aria-label="${esc(t("Demo"))}">
              ${svg("external", 'width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"')}
            </a>` : ""}
          </div>
          <p class="project-description">${esc(pick(p, "description"))}</p>
          <div class="project-tags">
            ${tools.map((tool) => `<span class="project-tag">${esc(tool)}</span>`).join("")}
          </div>
          ${p.link ? `
          <div class="project-links">
            <a href="${esc(p.link)}" target="_blank" class="project-link secondary">${esc(t("GitHub"))}</a>
          </div>` : ""}
        </div>`;
    }).join("")}</div>`;
  }

  // "2025-03-01" -> "Mar 2025"
  function issueDateLabel(value) {
    const date = window.util.parseDate(value);
    return date ? new Intl.DateTimeFormat(locale(), { month: "short", year: "numeric" }).format(date) : "";
  }

  function renderCertificates(certificates) {
    if (!certificates.length) return `<p class="text-muted">${esc(t("NoCertificates"))}</p>`;
    return `<div class="certificate-grid">${certificates.map((c) => {
      const title = pick(c, "title");
      const issuer = c.issuer;
      const dateRange = issueDateLabel(c.issueDate);
      const thumb = c.pdfUrl
        ? `<a href="${esc(c.pdfUrl)}" data-caption="${esc(title)}${issuer ? ` — ${esc(issuer)}` : ""}" class="certificate-thumb-link">
             <div class="certificate-thumb-wrapper">
               <canvas class="cert-canvas" data-pdf-url="${esc(c.pdfUrl)}"></canvas>
               <div class="cert-overlay">${svg("zoom", 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="cert-zoom-icon"')}</div>
             </div>
           </a>`
        : `<div class="certificate-thumb-wrapper no-pdf">
             ${svg("file", 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="cert-icon-placeholder"')}
           </div>`;
      return `
        <div class="certificate-card">
          ${thumb}
          <div class="certificate-info">
            <h4 class="cert-title">${esc(title)}</h4>
            ${issuer ? `<p class="cert-issuer">${esc(issuer)}</p>` : ""}
            ${dateRange ? `<span class="cert-date">${esc(dateRange)}</span>` : ""}
          </div>
        </div>`;
    }).join("")}</div>`;
  }

  // Kategoriler SKILL_CATEGORIES sırasıyla; listede olmayan bir kategori gelirse olduğu gibi sona eklenir.
  // Kategori içindeki yetenekler API'nin döndüğü sırayla kalır.
  function renderSkills(skills) {
    const groups = new Map(SKILL_CATEGORIES.map((c) => [c.tr, { category: c, items: [] }]));
    for (const skill of skills) {
      const known = findSkillCategory(skill.category);
      const key = known ? known.tr : (skill.category || "").trim();
      if (!groups.has(key)) groups.set(key, { category: { tr: key, en: key }, items: [] });
      groups.get(key).items.push(skill);
    }
    return `<div class="skills-list">${[...groups.values()].filter((g) => g.items.length).map(({ category, items }) => `
      <div class="skill-category">
        <h4 class="skill-category-title">${esc((category[getLang()] || category.tr || "").toLocaleUpperCase(getLang()))}</h4>
        <div class="skill-pills">
          ${items.map((s) => `<span class="skill-pill">${esc(pick(s, "name"))}</span>`).join("")}
        </div>
      </div>`).join("")}</div>`;
  }

  function renderContact() {
    const field = (name, labelKey, tag = "input") => `
      <div class="form-group">
        <label for="contact-${name}" data-i18n="${labelKey}">${esc(t(labelKey))}</label>
        ${tag === "textarea"
          ? `<textarea id="contact-${name}" name="${name}" rows="5"></textarea>`
          : `<input id="contact-${name}" name="${name}"${name === "email" ? ' type="email" autocomplete="email"' : ""}${name === "fullName" ? ' autocomplete="name"' : ""}>`}
        <span class="text-danger" data-error-for="${name}"></span>
      </div>`;
    return `
      <div class="contact-grid">
        <div class="contact-info">
          <h3 data-i18n="ContactMeHeader">${esc(t("ContactMeHeader"))}</h3>
          <p data-i18n="ContactMeSubtext">${esc(t("ContactMeSubtext"))}</p>
        </div>
        <div>
          <div id="contact-alert"></div>
          <form id="contact-form-main" class="contact-form" novalidate>
            ${field("fullName", "FormName")}
            ${field("email", "FormEmail")}
            ${field("subject", "FormSubject")}
            ${field("message", "FormMessage", "textarea")}
            <div class="form-group">
              <div id="turnstile-widget"></div>
              <span class="text-danger" data-error-for="turnstileToken"></span>
            </div>
            <button type="submit" class="submit-btn" data-i18n="FormSendMessage">${esc(t("FormSendMessage"))}</button>
          </form>
        </div>
      </div>`;
  }

  // ---------------- İletişim formu ----------------

  // Backend'deki ContactMessage doğrulamasıyla aynı kurallar.
  const CONTACT_RULES = {
    fullName: { max: 100, required: "Lütfen adınızı ve soyadınızı giriniz.", tooLong: "Ad Soyad 100 karakterden uzun olamaz." },
    email: { max: 100, required: "Lütfen e-posta adresinizi giriniz.", tooLong: "E-posta 100 karakterden uzun olamaz.", email: "Lütfen geçerli bir e-posta adresi giriniz." },
    subject: { max: 200, required: "Lütfen konu giriniz.", tooLong: "Konu 200 karakterden uzun olamaz." },
    message: { max: 5000, required: "Lütfen mesajınızı giriniz.", tooLong: "Mesaj 5000 karakterden uzun olamaz." },
  };

  function validateContact(values) {
    const errors = {};
    for (const [name, rule] of Object.entries(CONTACT_RULES)) {
      const value = values[name];
      if (!value) errors[name] = rule.required;
      else if (value.length > rule.max) errors[name] = rule.tooLong;
      else if (rule.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors[name] = rule.email;
    }
    return errors;
  }

  function showContactAlert(type, message) {
    $("contact-alert").innerHTML = `
      <div class="alert alert-${type}">
        ${svg(type === "success" ? "success" : "error")}
        <span>${esc(message)}</span>
      </div>`;
  }

  // Backend iletişim mesajlarında turnstileToken ister ve Cloudflare'de doğrular; site key yoksa form gönderilemez.
  function setupTurnstile() {
    const siteKey = window.APP_CONFIG.TURNSTILE_SITE_KEY;
    if (!siteKey) {
      console.error("TURNSTILE_SITE_KEY tanımlı değil (assets/js/config.js); iletişim formu backend doğrulamasından geçemez.");
      return;
    }
    const errorSlot = () => document.querySelector('[data-error-for="turnstileToken"]');
    let lastTurnstileError = null; // widget hata alınca kendiliğinden tekrar dener; aynı kod bir kez loglansın
    window.onTurnstileLoad = () => {
      window.turnstile.render("#turnstile-widget", {
        sitekey: siteKey,
        theme: "auto",
        callback: () => {
          lastTurnstileError = null;
          if (errorSlot()) errorSlot().textContent = "";
        },
        // Widget çalışamadıysa (ör. 110200: alan adı widget'ta izinli değil) ziyaretçi göndermeden önce görsün
        "error-callback": (code) => {
          if (code !== lastTurnstileError) {
            console.error("Turnstile hatası:", code);
            lastTurnstileError = code;
          }
          if (errorSlot()) errorSlot().textContent = t("TurnstileMissing");
          return true; // Cloudflare'in kendi konsol hatasını bastır
        },
      });
    };
    // Cloudflare bu dosyayı sürümsüz yayınlar ve sık günceller; SRI eklenirse güncellemede kırılır.
    // Bu yüzden integrity yok, kaynak CSP'de yalnızca challenges.cloudflare.com ile sınırlı.
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad";
    script.async = true;
    document.head.appendChild(script);
  }

  function setupContactForm() {
    const form = $("contact-form-main");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const values = Object.fromEntries(
        Object.keys(CONTACT_RULES).map((name) => [name, form.elements[name].value.trim()])
      );
      const errors = validateContact(values);
      form.querySelectorAll("[data-error-for]").forEach((el) => {
        el.textContent = errors[el.dataset.errorFor] || "";
      });
      if (Object.keys(errors).length) return;

      const siteKey = window.APP_CONFIG.TURNSTILE_SITE_KEY;
      const turnstileToken = siteKey && window.turnstile ? window.turnstile.getResponse() : "";
      const turnstileError = form.querySelector('[data-error-for="turnstileToken"]');
      if (siteKey && !turnstileToken) {
        turnstileError.textContent = t("TurnstileMissing");
        showContactAlert("error", t("TurnstileMissing"));
        return;
      }

      const button = form.querySelector("button[type=submit]");
      button.disabled = true;
      try {
        // 201 Created. turnstileToken zorunlu (@NotBlank); backend Cloudflare'de doğrular.
        await window.api.post("/contact-messages", { ...values, turnstileToken });
        form.reset();
        showContactAlert("success", t("ContactSuccess"));
      } catch (err) {
        console.error(err);
        const fieldErrors = err.fieldErrors;
        if (err.status === 400 && fieldErrors) {
          // Doğrulama hatası: her mesaj ilgili alanın altına. Token hatası teknik mesaj yerine anlaşılır metinle.
          form.querySelectorAll("[data-error-for]").forEach((el) => {
            const name = el.dataset.errorFor;
            el.textContent = fieldErrors[name] ? (name === "turnstileToken" ? t("TurnstileMissing") : fieldErrors[name]) : "";
          });
          const onlyTurnstile = Object.keys(fieldErrors).every((name) => name === "turnstileToken");
          showContactAlert("error", onlyTurnstile ? t("TurnstileMissing") : t("ContactInvalid"));
        } else if (err.status === 429) {
          // nginx deneme sınırı (dakikada 3 mesaj)
          showContactAlert("error", t("ContactTooMany"));
        } else if (err.status === 400) {
          // "Doğrulama başarısız": Cloudflare token'ı reddetti (süresi dolmuş, kullanılmış ya da sahte)
          turnstileError.textContent = t("TurnstileFailed");
          showContactAlert("error", t("TurnstileFailed"));
        } else {
          showContactAlert("error", t("ContactError"));
        }
      } finally {
        button.disabled = false;
        if (siteKey && window.turnstile) window.turnstile.reset();
      }
    });
  }

  // ---------------- Sertifika PDF'leri ----------------

  function renderPdfPage(url, canvas, pageNum) {
    window.pdfjsLib.getDocument({ url, isEvalSupported: false }).promise.then((pdf) => {
      pdf.getPage(pageNum).then((page) => {
        const wrapperWidth = canvas.parentElement.offsetWidth || 280;
        const scale = wrapperWidth / page.getViewport({ scale: 1 }).width;
        const viewport = page.getViewport({ scale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        page.render({ canvasContext: canvas.getContext("2d"), viewport });
      });
    }).catch((e) => console.warn("PDF thumb error:", e));
  }

  function openPdfLightbox(pdfUrl, caption) {
    const container = document.createElement("div");
    container.className = "pdf-fancybox-container";
    container.style.display = "block";
    container.innerHTML = `<div class="pdf-loading-msg">${esc(t("Loading"))}</div>`;
    document.body.appendChild(container);

    let rendered = false;
    function renderAllPages() {
      if (rendered) return;
      rendered = true;
      window.pdfjsLib.getDocument({ url: pdfUrl, isEvalSupported: false }).promise.then((pdf) => {
        container.querySelector(".pdf-loading-msg")?.remove();
        const renderPage = (pageNum) => {
          pdf.getPage(pageNum).then((page) => {
            const canvas = document.createElement("canvas");
            container.appendChild(canvas);
            const width = container.clientWidth > 0 ? container.clientWidth : Math.min(window.innerWidth * 0.88, 960);
            const viewport = page.getViewport({ scale: width / page.getViewport({ scale: 1 }).width });
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            page.render({ canvasContext: canvas.getContext("2d"), viewport });
            if (pageNum < pdf.numPages) renderPage(pageNum + 1);
          });
        };
        renderPage(1);
      }).catch((e) => console.error("PDF load error:", e));
    }

    window.Fancybox.show([{ src: container, type: "inline", caption }], {
      on: {
        reveal: renderAllPages,
        destroy: () => container.remove(),
      },
    });
  }

  function setupCertificates() {
    if (!window.pdfjsLib) return;
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
    document.querySelectorAll(".cert-canvas[data-pdf-url]").forEach((canvas) => {
      renderPdfPage(canvas.dataset.pdfUrl, canvas, 1);
    });
    document.querySelectorAll(".certificate-thumb-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        openPdfLightbox(link.getAttribute("href"), link.dataset.caption || "");
      });
    });
  }

  // ---------------- Yükleme iskeleti ----------------

  const skeletonLines = (n) => Array.from({ length: n }, (_, i) =>
    `<div class="skeleton skeleton-line" style="width: ${[92, 78, 64, 85][i % 4]}%"></div>`).join("");
  const skeletonRow = () => `
    <div class="skeleton-row">
      <div class="skeleton skeleton-box"></div>
      <div class="skeleton-lines">${skeletonLines(3)}</div>
    </div>`;

  function showSkeletons() {
    $("sidebar-content").innerHTML = `
      <div class="skeleton skeleton-avatar"></div>
      ${skeletonLines(2)}`;
    $("about-description").innerHTML = skeletonLines(3);
    for (const id of ["education-list", "experience-list", "project-list", "certificate-list", "skill-list"]) {
      $(id).innerHTML = skeletonRow();
    }
  }

  // ---------------- Başlatma ----------------

  let data = null;

  // API'den gelen veriyi aktif dilde çizer; dil değişince yeniden çağrılır.
  function renderContent() {
    const { about, educations, experiences, projects, certificates, skills } = data;
    $("sidebar-content").innerHTML = renderSidebar(about);
    setupAvatarFallback();
    $("about-description").textContent = pick(about, "description") || "";
    $("education-list").innerHTML = renderEducations(educations);
    $("experience-list").innerHTML = renderExperiences(experiences);
    $("project-list").innerHTML = renderProjects(projects);
    $("certificate-list").innerHTML = renderCertificates(certificates);
    $("skill-list").innerHTML = renderSkills(skills);
    $("footer-name").textContent = about ? `${about.firstName || ""} ${about.lastName || ""}`.trim() : "";
    setupCertificates();
  }

  function applyStaticTranslations() {
    document.documentElement.lang = getLang();
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.classList.toggle("active-lang", btn.dataset.lang === getLang());
    });
  }

  // Sayfa yenilenmeden dil değişir; kaydırma konumu ve formdaki yazılar korunur.
  function setupLanguageButtons() {
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.lang === getLang()) return;
        setLang(btn.dataset.lang);
        applyStaticTranslations();
        if (data) renderContent();
      });
    });
  }

  // Ekrandaki bölümün menü linkini vurgular: üst kenarı ekranın ilk %35'ini geçmiş son bölüm aktiftir.
  function setupScrollSpy() {
    const links = document.querySelectorAll(".nav-link, .mobile-nav-link");
    const sections = [...document.querySelectorAll("section.section[id]")];

    const update = () => {
      const line = window.innerHeight * 0.35;
      let current = sections[0];
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= line) current = section;
      }
      // Kaydırılıp sayfanın en altına gelindiyse son bölüm (kısa olsa bile) aktif olsun
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (window.scrollY > 0 && atBottom) current = sections[sections.length - 1];
      links.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${current.id}`));
    };

    // Tarayıcı scroll olayını kare başına en fazla bir kez gönderir; hesap da 7 bölümlük, ek kısıtlamaya gerek yok.
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  async function load() {
    applyStaticTranslations();
    setupLanguageButtons();
    setupScrollSpy();
    $("footer-year").textContent = new Date().getFullYear();
    showSkeletons();

    const { api } = window;
    try {
      const [about, educations, experiences, projects, certificates, skills] = await Promise.all([
        api.get("/about"),
        api.get("/educations"),
        api.get("/experiences"),
        api.get("/projects"),
        api.get("/certificates"),
        api.get("/skills"),
      ]);
      data = { about, educations, experiences, projects, certificates, skills };
      renderContent();
      $("contact").innerHTML = renderContact();
      setupContactForm();
      setupTurnstile();
    } catch (err) {
      console.error(err);
      for (const id of ["sidebar-content", "education-list", "experience-list", "project-list", "certificate-list", "skill-list"]) {
        $(id).innerHTML = "";
      }
      $("about-description").textContent = t("LoadError");
    }
  }

  document.addEventListener("DOMContentLoaded", load);
})();
