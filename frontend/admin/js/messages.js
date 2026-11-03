// İletişim formundan gelen mesajlar: sayfalı liste, okundu işaretleme, silme.
// Backend mesajları en yeni önce ve sayfalı döner (GET /api/contact-messages?page=&size=, size en fazla 50);
// cevap: { content, page: { number (0'dan), size, totalElements, totalPages } }
// "Okunmadı yap" yok: backend yalnızca PATCH /{id}/read (okundu yap) sunuyor.
(function () {
  if (!window.admin) return;
  const { api, admin } = window;
  const { esc, qs } = window.util;
  const { relativeTime } = admin;
  const page = document.getElementById("page-content");
  const PAGE_SIZE = 10;

  admin.setHeader({ title: "Mesajlar", subtitle: "İletişim formundan gelen mesajlar, en yeni en üstte" });
  page.innerHTML = `
    <div class="card overflow-hidden">
      <div class="list-toolbar">
        <span class="count" id="summary"></span>
      </div>
      <div id="list">${admin.loading()}</div>
      <div class="pager" id="pager" hidden>
        <button type="button" class="btn btn-sm btn-soft-secondary" data-page-step="-1"><i class="bi bi-chevron-left"></i> Önceki</button>
        <span class="count" id="page-info"></span>
        <button type="button" class="btn btn-sm btn-soft-secondary" data-page-step="1">Sonraki <i class="bi bi-chevron-right"></i></button>
      </div>
    </div>`;

  const listEl = document.getElementById("list");
  const summaryEl = document.getElementById("summary");
  const pagerEl = document.getElementById("pager");
  const pageInfoEl = document.getElementById("page-info");

  // Adres çubuğunda 1'den başlar (?page=2), API'de 0'dan
  let current = Math.max(0, (parseInt(qs("page"), 10) || 1) - 1);
  let result = null;

  const initials = (name) => (name || "?").split(/\s+/).filter(Boolean).slice(0, 2)
    .map((w) => w[0].toLocaleUpperCase("tr")).join("");

  function messageHtml(m) {
    return `
      <div class="message-item${m.read ? "" : " unread"}" id="message-${m.id}" data-id="${m.id}">
        <div class="avatar-initials bg-soft-primary">${esc(initials(m.fullName))}</div>
        <div class="flex-grow-1 min-w-0">
          <div class="d-flex flex-wrap justify-content-between gap-2">
            <div class="min-w-0">
              ${m.read ? "" : '<span class="unread-dot" title="Okunmadı"></span>'}
              <strong>${esc(m.fullName)}</strong>
              <a href="mailto:${esc(m.email)}" class="text-muted small ms-1">${esc(m.email)}</a>
              ${m.read ? "" : '<span class="badge bg-soft-primary ms-1">Yeni</span>'}
            </div>
            <span class="timestamp" title="${esc(new Date(m.sentDate).toLocaleString("tr-TR"))}">${esc(relativeTime(m.sentDate))}</span>
          </div>
          ${m.subject ? `<div class="message-subject mt-1">${esc(m.subject)}</div>` : ""}
          <p class="message-body mb-2 mt-1">${esc(m.message)}</p>
          <div class="message-actions">
            <a href="mailto:${esc(m.email)}?subject=${encodeURIComponent(`Re: ${m.subject || ""}`)}" class="btn btn-sm btn-soft-primary">
              <i class="bi bi-reply"></i> Yanıtla
            </a>
            ${m.read ? "" : `
            <button type="button" class="btn btn-sm btn-soft-secondary" data-mark-read>
              <i class="bi bi-envelope-open"></i> Okundu yap
            </button>`}
            <button type="button" class="btn btn-sm btn-soft-danger" data-delete><i class="bi bi-trash"></i> Sil</button>
          </div>
        </div>
      </div>`;
  }

  function render() {
    const { content, page: { number: pageNo, size, totalElements, totalPages } } = result;
    const unread = content.filter((m) => !m.read).length;
    summaryEl.textContent = totalElements
      ? `${totalElements} mesaj${unread ? ` · bu sayfada ${unread} okunmamış` : ""}`
      : "";

    listEl.innerHTML = content.length
      ? content.map(messageHtml).join("")
      : admin.emptyState({ icon: "envelope-open", text: "Henüz mesaj gelmedi." });

    pagerEl.hidden = totalPages <= 1;
    const from = pageNo * size + 1;
    const to = pageNo * size + content.length;
    pageInfoEl.textContent = `Sayfa ${pageNo + 1} / ${totalPages} · ${from}–${to} / ${totalElements}`;
    pagerEl.querySelector('[data-page-step="-1"]').disabled = pageNo === 0;
    pagerEl.querySelector('[data-page-step="1"]').disabled = pageNo >= totalPages - 1;
  }

  async function load(pageNo, { scrollTop = false } = {}) {
    try {
      result = await api.get(`/contact-messages?page=${pageNo}&size=${PAGE_SIZE}`);
      // Silmeden sonra son sayfa boşaldıysa bir önceki sayfaya geç
      if (!result.content.length && pageNo > 0 && result.page.totalPages > 0) {
        return load(Math.min(pageNo - 1, result.page.totalPages - 1), { scrollTop });
      }
      current = result.page.number;
      const url = new URL(location.href);
      if (current > 0) url.searchParams.set("page", current + 1);
      else url.searchParams.delete("page");
      history.replaceState(null, "", url);
      render();
      if (scrollTop) window.scrollTo({ top: 0, behavior: "smooth" });
      else if (location.hash) document.querySelector(location.hash)?.scrollIntoView({ block: "center" });
    } catch (err) {
      if (err.status === 401) return;
      admin.handleError(err);
      listEl.innerHTML = admin.errorState();
      pagerEl.hidden = true;
    }
  }

  pagerEl.addEventListener("click", (e) => {
    const step = e.target.closest("[data-page-step]");
    if (step) load(current + Number(step.dataset.pageStep), { scrollTop: true });
  });

  listEl.addEventListener("click", async (e) => {
    const row = e.target.closest(".message-item");
    if (!row) return;
    const id = Number(row.dataset.id);
    const message = result.content.find((m) => m.id === id);

    const markRead = e.target.closest("[data-mark-read]");
    if (markRead) {
      markRead.disabled = true;
      try {
        // Gövdesiz PATCH; güncel mesajı döner
        const updated = await api.patch(`/contact-messages/${id}/read`);
        Object.assign(message, updated);
        render();
        admin.refreshUnreadCount();
      } catch (err) {
        if (err.status === 401) return;
        if (err.status === 404) {
          admin.toast("Bu mesaj artık yok; başka bir yerden silinmiş olabilir.", "error");
          admin.refreshUnreadCount();
          load(current);
          return;
        }
        admin.handleError(err);
        markRead.disabled = false;
      }
      return;
    }

    if (e.target.closest("[data-delete]")) {
      const ok = await admin.confirm({
        title: "Mesaj silinsin mi?",
        message: `${message.fullName} adlı kişinin "${message.subject || "konusuz"}" mesajı kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
      });
      if (!ok) return;
      try {
        await api.delete(`/contact-messages/${id}`);
        admin.toast("Mesaj silindi.");
      } catch (err) {
        if (err.status === 401) return;
        if (err.status !== 404) return admin.handleError(err);
        admin.toast("Mesaj zaten silinmiş.", "error");
      }
      admin.refreshUnreadCount();
      load(current);
    }
  });

  load(current);
})();
