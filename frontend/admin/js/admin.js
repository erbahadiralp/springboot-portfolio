// Admin sayfalarının ortak iskeleti: oturum kontrolü, sidebar, üst çubuk, sayfa başlığı ve UI yardımcıları.
// <body> sonunda senkron yüklenir; sayfanın #page-content'ini iskeletin içine taşır.
(function () {
  const { api } = window;
  const { esc, qs } = window.util;
  const RESOURCES = window.ADMIN_RESOURCES;

  // Oturumu kapatıp girişe döner. expired: giriş ekranında "oturum süresi doldu" notu gösterilir.
  let leaving = false;
  function logout(expired) {
    if (leaving) return;
    leaving = true;
    api.auth.clear();
    location.replace(expired ? "login.html?expired=1" : "login.html");
  }

  if (!api.auth.isLoggedIn()) {
    logout(!!api.auth.getToken()); // token var ama süresi dolmuş
    return;
  }

  // Herhangi bir istek 401 dönerse (token geçersiz / süresi dolmuş) oturumu kapat
  api.onUnauthorized(() => logout(true));

  // Token 1 saat geçerli: süre dolunca istek beklemeden girişe dön.
  // 5 dakika kala uyar; formda kaydedilmemiş değişiklik varsa kaybolmasın.
  const expiresAt = api.auth.expiresAt();
  const WARN_BEFORE_MS = 5 * 60 * 1000;
  if (expiresAt) {
    setTimeout(() => logout(true), Math.max(0, expiresAt - Date.now()));
    const warnIn = expiresAt - WARN_BEFORE_MS - Date.now();
    if (warnIn > 0) {
      setTimeout(() => toast(
        "Oturumun 5 dakika içinde sona erecek. Kaydedilmemiş değişikliklerin varsa şimdi kaydet; ardından yeniden giriş yapman gerekecek.",
        "warning", { autohide: false }), warnIn);
    }
  }

  // ---------------- Menü ----------------

  const resourceLink = (key) => (RESOURCES[key].singleton ? `form.html?r=${key}` : `list.html?r=${key}`);

  const MENU = [
    { title: "genel", items: [{ key: "index", href: "index.html", icon: "grid-1x2", text: "Genel Bakış" }] },
    {
      title: "içerik",
      items: Object.keys(RESOURCES).map((key) => ({
        key,
        href: resourceLink(key),
        icon: RESOURCES[key].icon,
        text: RESOURCES[key].title,
      })),
    },
    {
      title: "diğer",
      items: [
        { key: "messages", href: "messages.html", icon: "envelope", text: "Mesajlar", badge: "unread-badge" },
        { key: "account", href: "account.html", icon: "shield-lock", text: "Hesap Ayarları" },
        { key: "site", href: "../index.html", icon: "globe2", text: "Siteyi Görüntüle", external: true },
      ],
    },
  ];

  // Aktif menü: form/list sayfalarında ?r=, diğerlerinde dosya adı
  const currentKey = qs("r") || (location.pathname.split("/").pop().replace(".html", "") || "index");

  function buildShell() {
    const content = document.getElementById("page-content");
    const app = document.createElement("div");
    app.innerHTML = `
      <aside class="app-sidebar" id="sidebar">
        <a href="index.html" class="sidebar-brand">
          <span class="brand-mark">&gt;_</span>
          <span>admin<span class="brand-sub">portfolio@panel</span></span>
        </a>
        <nav class="sidebar-nav">
          ${MENU.map((group) => `
            <div class="nav-group-title">// ${esc(group.title)}</div>
            ${group.items.map((item) => `
              <a href="${item.href}" class="nav-link-item${item.key === currentKey ? " active" : ""}"${item.external ? ' target="_blank"' : ""}>
                <i class="bi bi-${item.icon}"></i>
                <span>${esc(item.text)}</span>
                ${item.badge ? `<span class="nav-badge" id="${item.badge}" hidden></span>` : ""}
                ${item.external ? '<i class="bi bi-arrow-up-right ext"></i>' : ""}
              </a>`).join("")}`).join("")}
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-user">
            <img class="avatar" id="sidebar-avatar" src="../favicon.png" alt="">
            <div class="min-w-0">
              <div class="name text-truncate" id="sidebar-name">Admin</div>
              <div class="role">~ yönetici</div>
            </div>
            <button type="button" class="icon-btn" id="logout-btn" title="Çıkış yap"><i class="bi bi-box-arrow-right"></i></button>
          </div>
        </div>
      </aside>
      <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
      <div class="app-main">
        <div class="app-topbar">
          <div class="topbar-inner">
            <button type="button" class="icon-btn burger" id="burger" aria-label="Menüyü aç"><i class="bi bi-list"></i></button>
            <div class="path" id="page-path"></div>
            <div class="topbar-actions">
              <button type="button" class="icon-btn" id="theme-btn" title="Tema değiştir"><i class="bi"></i></button>
            </div>
          </div>
        </div>
        <main class="app-content">
          <div class="page-header">
            <div>
              <h1 id="page-title"></h1>
              <p id="page-subtitle"></p>
            </div>
            <div class="page-actions" id="page-actions"></div>
          </div>
          <div id="page-body"></div>
        </main>
      </div>
      <div class="toast-container position-fixed bottom-0 end-0 p-3" id="toast-container"></div>`;
    document.body.insertBefore(app, content);
    app.querySelector("#page-body").appendChild(content);

    document.getElementById("logout-btn").addEventListener("click", () => logout(false));

    // Mobil menü
    const toggleSidebar = (open) => document.body.classList.toggle("sidebar-open", open);
    document.getElementById("burger").addEventListener("click", () => toggleSidebar(true));
    document.getElementById("sidebar-backdrop").addEventListener("click", () => toggleSidebar(false));

    // Tema (site ile aynı "theme" anahtarını kullanır)
    const themeBtn = document.getElementById("theme-btn");
    const renderThemeIcon = () => {
      const dark = document.documentElement.getAttribute("data-bs-theme") === "dark";
      themeBtn.querySelector(".bi").className = `bi bi-${dark ? "sun" : "moon-stars"}`;
    };
    themeBtn.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-bs-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-bs-theme", next);
      localStorage.setItem("theme", next);
      renderThemeIcon();
    });
    renderThemeIcon();

    api.get("/about").then(showUser).catch(() => {});
    refreshUnreadCount();
  }

  // Menüdeki "Mesajlar" yanında okunmamış sayısı; mesajlar sayfası okundu/sil sonrası da çağırır.
  // GET /api/contact-messages/unread-count düz bir sayı döner.
  function refreshUnreadCount() {
    return api.get("/contact-messages/unread-count").then((value) => {
      const count = Number(value) || 0;
      const badge = document.getElementById("unread-badge");
      badge.textContent = count > 99 ? "99+" : String(count);
      badge.hidden = count === 0;
      badge.title = `${count} okunmamış mesaj`;
    }).catch(() => {});
  }

  // Sidebar'daki kullanıcı bilgisi; profil kaydedilince form.js de çağırır.
  function showUser(about) {
    if (!about) return;
    document.getElementById("sidebar-name").textContent = `${about.firstName || ""} ${about.lastName || ""}`.trim() || "Admin";
    if (about.imageUrl) document.getElementById("sidebar-avatar").src = about.imageUrl;
  }

  // ---------------- Yardımcılar ----------------

  // Sayfa başlığı, alt başlık, sağ üstteki aksiyonlar ve üst çubuktaki yol (~/admin/...).
  // path: [{ text, href? }] — verilmezse aktif bölümden üretilir.
  function setHeader({ title, subtitle = "", actions = "", path }) {
    document.title = `${title} · Admin`;
    document.getElementById("page-title").textContent = title;
    document.getElementById("page-subtitle").textContent = subtitle;
    document.getElementById("page-actions").innerHTML = actions;

    const segments = path || (currentKey === "index" ? [] : [{ text: currentKey }]);
    document.getElementById("page-path").innerHTML = `<span class="prompt">~</span>/<a href="index.html">admin</a>${segments
      .map((s, i) => `/${s.href && i < segments.length - 1 ? `<a href="${s.href}">${esc(s.text)}</a>` : `<span class="current">${esc(s.text)}</span>`}`)
      .join("")}`;
  }

  // type: "success" | "error" | "warning". options.autohide: false -> kullanıcı kapatana kadar kalır.
  function toast(message, type = "success", options = {}) {
    const icon = type === "success" ? "check-circle-fill" : "exclamation-triangle-fill";
    const el = document.createElement("div");
    el.className = "toast app-toast align-items-center";
    el.setAttribute("role", "status");
    el.innerHTML = `
      <div class="d-flex">
        <div class="toast-body"><i class="bi bi-${icon} me-2"></i>${esc(message)}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Kapat"></button>
      </div>`;
    document.getElementById("toast-container").appendChild(el);
    el.addEventListener("hidden.bs.toast", () => el.remove());
    new window.bootstrap.Toast(el, { delay: 3500, autohide: options.autohide !== false }).show();
  }

  // Sayfa değişse de gösterilecek bildirim (kaydet -> listeye dön)
  function flash(message) {
    sessionStorage.setItem("flash", message);
  }
  function consumeFlash() {
    const message = sessionStorage.getItem("flash");
    if (message) {
      sessionStorage.removeItem("flash");
      toast(message);
    }
  }

  // window.confirm yerine modal. Promise<boolean> döner.
  function confirmDialog({ title, message, confirmText = "Sil", variant = "danger" }) {
    return new Promise((resolve) => {
      const el = document.createElement("div");
      el.className = "modal fade";
      el.tabIndex = -1;
      el.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${esc(title)}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Kapat"></button>
            </div>
            <div class="modal-body">${esc(message)}</div>
            <div class="modal-footer">
              <button type="button" class="btn btn-soft-secondary" data-bs-dismiss="modal">Vazgeç</button>
              <button type="button" class="btn btn-${variant}" data-confirm>${esc(confirmText)}</button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(el);
      const modal = new window.bootstrap.Modal(el);
      let confirmed = false;
      el.querySelector("[data-confirm]").addEventListener("click", () => {
        confirmed = true;
        modal.hide();
      });
      el.addEventListener("hidden.bs.modal", () => {
        el.remove();
        resolve(confirmed);
      });
      modal.show();
    });
  }

  // Genel hata bildirimi. 401'de api katmanı zaten girişe yönlendirdi; tekrar bildirilmez.
  // 404 / 400 için sayfalar kendi mesajlarını gösterir, buraya düşerse backend mesajı toast olur.
  function handleError(err) {
    if (err && err.status === 401) {
      logout(true);
      return;
    }
    console.error(err);
    toast(err && err.message ? err.message : "Beklenmeyen bir hata oluştu.", "error");
  }

  const loading = () => `
    <div class="state">
      <div class="spinner-border spinner-border-sm me-2" role="status"></div>
      <span class="mono small">yükleniyor...</span>
    </div>`;

  const emptyState = ({ icon, text, action = "" }) => `
    <div class="state">
      <div class="state-icon"><i class="bi bi-${icon}"></i></div>
      <p class="mb-3">${esc(text)}</p>
      ${action}
    </div>`;

  // "5 dk önce", "3 gün önce"; bir haftadan eskiyse tarih
  function relativeTime(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    const minutes = Math.round((Date.now() - date) / 60000);
    if (minutes < 1) return "az önce";
    if (minutes < 60) return `${minutes} dk önce`;
    if (minutes < 60 * 24) return `${Math.round(minutes / 60)} saat önce`;
    if (minutes < 60 * 24 * 7) return `${Math.round(minutes / 1440)} gün önce`;
    return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
  }

  const errorState = (message) => emptyState({ icon: "cloud-slash", text: message || "Veriler yüklenemedi." });

  buildShell();

  window.admin = {
    resourceLink,
    setHeader,
    toast,
    flash,
    consumeFlash,
    confirm: confirmDialog,
    handleError,
    loading,
    emptyState,
    errorState,
    relativeTime,
    showUser,
    refreshUnreadCount,
    logout,
  };
})();
