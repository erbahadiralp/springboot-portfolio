// Liste sayfası: list.html?r=<kaynak>
(function () {
  if (!window.admin) return;
  const { api, admin } = window;
  const { esc, qs } = window.util;

  const key = qs("r");
  const resource = window.ADMIN_RESOURCES[key];
  const page = document.getElementById("page-content");

  if (!resource || resource.singleton) {
    admin.setHeader({ title: "Bulunamadı" });
    page.innerHTML = admin.errorState("Bilinmeyen bölüm.");
    return;
  }

  admin.setHeader({
    title: resource.title,
    subtitle: resource.subtitle,
    actions: `<a href="form.html?r=${key}" class="btn btn-primary"><i class="bi bi-plus-lg"></i> Yeni ${esc(resource.singular)}</a>`,
  });
  admin.consumeFlash();

  page.innerHTML = `
    <div class="card overflow-hidden">
      <div class="list-toolbar">
        <div class="search-box">
          <i class="bi bi-search"></i>
          <input type="search" class="form-control" placeholder="Ara..." id="search" aria-label="Ara">
        </div>
        <span class="count" id="count"></span>
      </div>
      <div id="list">${admin.loading()}</div>
    </div>`;

  const listEl = document.getElementById("list");
  const searchEl = document.getElementById("search");
  const countEl = document.getElementById("count");
  let items = [];

  // Projeler ve sertifikalar: sıra admin tarafından oklarla değiştirilir (PUT /api/<key>/order).
  const reorderable = !!resource.reorderable;
  let savingOrder = false;

  // İlk iki dilli sütun satırın "adı"dır; kalın gösterilir.
  const mainColumn = resource.columns.find((c) => c.i18n);

  function cell(column, item) {
    if (column.render) return column.render(item);
    if (column.i18n) {
      const tr = item[`${column.key}Tr`];
      const en = item[`${column.key}En`];
      const cls = column === mainColumn ? ' class="cell-main"' : "";
      return `<span${cls}>${esc(tr) || '<span class="text-muted">—</span>'}</span>${en && en !== tr ? `<span class="cell-sub">${esc(en)}</span>` : ""}`;
    }
    return esc(item[column.key]);
  }

  // Aramada eşleşecek metin: tüm sütunların ham değerleri
  const searchText = (item) => resource.columns
    .flatMap((c) => (c.i18n ? [item[`${c.key}Tr`], item[`${c.key}En`]] : [item[c.key]]))
    .filter((v) => typeof v === "string" || typeof v === "number")
    .join(" ")
    .toLocaleLowerCase("tr");

  function render() {
    const term = searchEl.value.trim().toLocaleLowerCase("tr");
    const visible = term ? items.filter((item) => searchText(item).includes(term)) : items;
    countEl.textContent = term ? `${visible.length} / ${items.length} kayıt` : `${items.length} kayıt`;

    if (!items.length) {
      listEl.innerHTML = admin.emptyState({
        icon: resource.icon,
        text: `Henüz ${resource.singular} eklenmedi.`,
        action: `<a href="form.html?r=${key}" class="btn btn-primary"><i class="bi bi-plus-lg"></i> İlk ${esc(resource.singular)} kaydını ekle</a>`,
      });
      return;
    }
    if (!visible.length) {
      listEl.innerHTML = admin.emptyState({ icon: "search", text: "Aramanızla eşleşen kayıt yok." });
      return;
    }

    listEl.innerHTML = `
      <div class="table-responsive">
        <table class="table table-hover table-clickable">
          <thead>
            <tr>
              ${reorderable ? '<th style="width: 64px">Sıra</th>' : ""}
              ${resource.columns.map((c) => `<th${c.width ? ` style="width: ${c.width}"` : ""}>${esc(c.label)}</th>`).join("")}
              <th class="text-end">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            ${visible.map((item) => {
              const position = items.indexOf(item);
              return `
              <tr data-id="${item.id}">
                ${reorderable ? `<td><span class="mono">${position + 1}</span></td>` : ""}
                ${resource.columns.map((c) => `<td>${cell(c, item)}</td>`).join("")}
                <td class="row-actions">
                  ${reorderable && !term ? `
                  <span class="move-buttons">
                    <button type="button" class="btn btn-sm btn-soft-secondary" data-move="-1" data-id="${item.id}" title="Yukarı taşı" aria-label="Yukarı taşı"${position === 0 ? " disabled" : ""}><i class="bi bi-arrow-up"></i></button>
                    <button type="button" class="btn btn-sm btn-soft-secondary" data-move="1" data-id="${item.id}" title="Aşağı taşı" aria-label="Aşağı taşı"${position === items.length - 1 ? " disabled" : ""}><i class="bi bi-arrow-down"></i></button>
                  </span>` : ""}
                  <a href="form.html?r=${key}&id=${item.id}" class="btn btn-sm btn-soft-primary" title="Düzenle"><i class="bi bi-pencil"></i></a>
                  <button type="button" class="btn btn-sm btn-soft-danger" data-delete="${item.id}" title="Sil"><i class="bi bi-trash"></i></button>
                </td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>`;
  }

  async function load() {
    try {
      items = await api.get(`/${key}`);
      render();
    } catch (err) {
      if (err.status === 401) return;
      admin.handleError(err);
      listEl.innerHTML = admin.errorState();
    }
  }

  // Sırayı ekranda hemen değiştirir, sonra tüm listeyi yeni sırasıyla gönderir (PUT /order, 204).
  // Backend tüm id'leri tekrarsız ve eksiksiz ister; liste başka yerden değiştiyse 400 döner ve liste yenilenir.
  async function move(id, direction) {
    if (savingOrder) return;
    const from = items.findIndex((x) => String(x.id) === id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= items.length) return;

    const previous = items.slice();
    items.splice(to, 0, items.splice(from, 1)[0]);
    render();
    focusMoveButton(id, direction);

    savingOrder = true;
    try {
      await api.put(`/${key}/order`, { ids: items.map((x) => x.id) });
    } catch (err) {
      items = previous;
      render();
      if (err.status === 401) return;
      admin.toast(`Sıralama kaydedilemedi: ${err.message}`, "error");
      if (err.status === 400) load(); // kayıtlar değişmiş olabilir: güncel listeyi al
    } finally {
      savingOrder = false;
    }
  }

  // Klavyeyle art arda taşınabilsin; ok uçta pasif kaldıysa öbür oka geç
  function focusMoveButton(id, direction) {
    const button = listEl.querySelector(`[data-move="${direction}"][data-id="${id}"]`);
    const other = listEl.querySelector(`[data-move="${-direction}"][data-id="${id}"]`);
    (button && !button.disabled ? button : other)?.focus();
  }

  // Satıra tıklayınca düzenle; sil/taşı butonları ve satırdaki linkler hariç
  listEl.addEventListener("click", async (e) => {
    const moveBtn = e.target.closest("[data-move]");
    if (moveBtn) {
      move(moveBtn.dataset.id, Number(moveBtn.dataset.move));
      return;
    }
    const deleteBtn = e.target.closest("[data-delete]");
    if (deleteBtn) {
      const item = items.find((x) => String(x.id) === deleteBtn.dataset.delete);
      const name = item && mainColumn ? item[`${mainColumn.key}Tr`] || "" : "";
      const ok = await admin.confirm({
        title: `${resource.singular[0].toLocaleUpperCase("tr")}${resource.singular.slice(1)} silinsin mi?`,
        message: `${name ? `"${name}" ` : "Bu kayıt "}kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
      });
      if (!ok) return;
      try {
        await api.delete(`/${key}/${item.id}`);
        items = items.filter((x) => x.id !== item.id);
        render();
        admin.toast("Kayıt silindi.");
      } catch (err) {
        if (err.status === 401) return;
        if (err.status === 404) {
          // Zaten silinmiş: listeden de çıkar
          items = items.filter((x) => x.id !== item.id);
          render();
          admin.toast("Kayıt zaten silinmiş.", "error");
          return;
        }
        admin.handleError(err);
      }
      return;
    }
    if (e.target.closest("a, button, [data-stop]")) return;
    const row = e.target.closest("tr[data-id]");
    if (row) location.href = `form.html?r=${key}&id=${row.dataset.id}`;
  });

  searchEl.addEventListener("input", render);
  load();
})();
