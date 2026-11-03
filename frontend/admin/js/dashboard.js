// Genel bakış: bölüm sayıları, profil özeti ve son mesajlar.
(function () {
  if (!window.admin) return;
  const { api, admin } = window;
  const { esc } = window.util;
  const RESOURCES = window.ADMIN_RESOURCES;
  const page = document.getElementById("page-content");

  const hour = new Date().getHours();
  const greeting = hour < 6 ? "İyi geceler" : hour < 12 ? "Günaydın" : hour < 18 ? "İyi günler" : "İyi akşamlar";

  admin.setHeader({
    title: "Genel Bakış",
    subtitle: `${greeting}. Sitedeki içeriklerin özeti burada.`,
    actions: '<a href="../index.html" target="_blank" class="btn btn-soft-primary"><i class="bi bi-globe2"></i> Siteyi aç</a>',
  });
  page.innerHTML = admin.loading();

  const TONES = ["primary", "info", "warning", "danger", "success"];
  const listKeys = Object.keys(RESOURCES).filter((k) => !RESOURCES[k].singleton);

  const statCard = (key, count, i) => `
    <div class="col-6 col-md-4 col-xl">
      <a href="list.html?r=${key}" class="card stat-card mb-0">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div class="stat-icon bg-soft-${TONES[i % TONES.length]}"><i class="bi bi-${RESOURCES[key].icon}"></i></div>
            <i class="bi bi-arrow-up-right text-muted small"></i>
          </div>
          <div class="stat-value">${count}</div>
          <div class="stat-label mt-1">${esc(RESOURCES[key].title)}</div>
        </div>
      </a>
    </div>`;

  function profileCard(about) {
    const cv = (lang) => (about[`cvDocumentUrl${lang === "tr" ? "Tr" : "En"}`]
      ? `<span class="badge bg-soft-success"><i class="bi bi-check2"></i> CV ${lang.toUpperCase()}</span>`
      : `<span class="badge bg-soft-warning"><i class="bi bi-exclamation"></i> CV ${lang.toUpperCase()} eksik</span>`);
    return `
      <div class="card h-100 mb-0">
        <div class="card-header"><h4 class="card-title">Profil</h4></div>
        <div class="card-body">
          <div class="d-flex align-items-center gap-3 mb-3">
            ${about.imageUrl
              ? `<img src="${esc(about.imageUrl)}" alt="" style="width: 64px; height: 64px; border-radius: 16px; object-fit: cover;">`
              : '<div class="avatar-initials bg-soft-primary" style="width: 64px; height: 64px;"><i class="bi bi-person fs-4"></i></div>'}
            <div class="min-w-0">
              <div class="fw-bold fs-5">${esc(about.firstName)} ${esc(about.lastName)}</div>
              <div class="text-muted small">${esc(about.shortDescriptionTr)}</div>
            </div>
          </div>
          <div class="d-flex flex-wrap gap-2 mb-4">${cv("tr")}${cv("en")}</div>
          <a href="form.html?r=about" class="btn btn-soft-primary w-100"><i class="bi bi-pencil"></i> Profili düzenle</a>
        </div>
      </div>`;
  }

  // messages: GET /contact-messages?page=0&size=5 yanıtı (en yeni 5 mesaj + toplam sayı)
  function messagesCard(messages) {
    const recent = messages.content;
    return `
      <div class="card h-100 mb-0 overflow-hidden">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h4 class="card-title">Son mesajlar</h4>
          <a href="messages.html" class="btn btn-sm btn-soft-secondary">Tümü <span class="mono">${messages.page.totalElements}</span></a>
        </div>
        ${recent.length
          ? recent.map((m) => `
            <a href="messages.html#message-${m.id}" class="message-link${m.read ? "" : " unread"}">
              <div class="d-flex justify-content-between gap-3">
                <strong class="text-truncate">${m.read ? "" : '<span class="unread-dot" title="Okunmadı"></span>'}${esc(m.fullName)}</strong>
                <span class="timestamp">${esc(admin.relativeTime(m.sentDate))}</span>
              </div>
              <div class="text-muted small text-truncate">${esc(m.subject)} — ${esc(m.message)}</div>
            </a>`).join("")
          : admin.emptyState({ icon: "envelope-open", text: "Henüz mesaj yok." })}
      </div>`;
  }

  async function load() {
    try {
      const [about, messages, ...lists] = await Promise.all([
        api.get("/about"),
        api.get("/contact-messages?page=0&size=5"),
        ...listKeys.map((k) => api.get(`/${k}`)),
      ]);
      page.innerHTML = `
        <div class="row g-3 mb-4">
          ${listKeys.map((k, i) => statCard(k, lists[i].length, i)).join("")}
        </div>
        <div class="row g-3">
          <div class="col-lg-4">${profileCard(about || {})}</div>
          <div class="col-lg-8">${messagesCard(messages)}</div>
        </div>`;
    } catch (err) {
      if (err.status === 401) return;
      admin.handleError(err);
      page.innerHTML = admin.errorState();
    }
  }

  load();
})();
