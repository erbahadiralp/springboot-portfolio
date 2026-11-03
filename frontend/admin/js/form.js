// Ekleme / düzenleme sayfası: form.html?r=<kaynak>[&id=<id>]
// Tekil kaynaklarda (profil) id yoktur; kayıt her zaman GET/PUT /api/<kaynak> ile okunup yazılır.
//
// Kaydetme akışı:
//   1. Seçilen her dosya POST /api/files ile yüklenir; dönen url (/static/...) ilgili alana yazılır.
//   2. Kayıt JSON olarak POST (yeni) / PUT (düzenleme) edilir.
// Backend PUT'ta tüm alanları değiştirir; formda olmayan alanların (ör. dokunulmayan dosyalar)
// silinmemesi için gövde, GET ile okunan mevcut kayıtla birleştirilerek gönderilir.
(function () {
  if (!window.admin) return;
  const { api, admin, forms } = window;
  const { esc, qs } = window.util;

  const key = qs("r");
  const id = qs("id");
  const resource = window.ADMIN_RESOURCES[key];
  const page = document.getElementById("page-content");

  if (!resource) {
    admin.setHeader({ title: "Bulunamadı" });
    page.innerHTML = admin.errorState("Bilinmeyen bölüm.");
    return;
  }

  const singleton = !!resource.singleton;
  const isEdit = singleton || !!id;
  const path = singleton ? `/${key}` : isEdit ? `/${key}/${id}` : `/${key}`;
  const listUrl = singleton ? null : `list.html?r=${key}`;
  const fileFields = resource.fields.filter((f) => f.type === "file");

  // Yanıtta olup istek DTO'larında olmayan alanlar; gönderilmez.
  const READ_ONLY = ["id", "displayOrder"];

  // Aynı dosya tekrar yüklenmesin (ör. dosya yüklendi ama kayıt doğrulamadan döndü, kullanıcı düzeltip yeniden kaydetti)
  const uploaded = new WeakMap();

  function header(item) {
    if (singleton) {
      admin.setHeader({ title: resource.title, subtitle: resource.subtitle });
      return;
    }
    const titleField = resource.fields.find((f) => f.i18n);
    const name = isEdit && titleField ? item[`${titleField.name}Tr`] : null;
    admin.setHeader({
      title: isEdit ? name || `${resource.title} düzenle` : `Yeni ${resource.singular}`,
      subtitle: isEdit ? `${resource.title} · düzenleniyor` : resource.subtitle,
      path: [{ text: key, href: listUrl }, { text: isEdit ? id : "yeni" }],
      actions: `<a href="${listUrl}" class="btn btn-soft-secondary"><i class="bi bi-arrow-left"></i> ${esc(resource.title)}</a>`,
    });
  }

  // Büyük resimleri yüklemeden önce küçültür: uzun kenar en fazla 1600 px, WebP. Site hızlı açılsın,
  // 5 MB'lık bir telefon fotoğrafı olduğu gibi sunulmasın. Küçültme işe yaramazsa (ya da tarayıcı
  // desteklemezse) orijinal dosya döner.
  const MAX_IMAGE_DIMENSION = 1600;
  const SHRINK_ABOVE_BYTES = 1024 * 1024;
  async function shrinkImage(file) {
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
      if (scale === 1 && file.size <= SHRINK_ABOVE_BYTES) return file;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
      // toBlob WebP'yi desteklemiyorsa PNG döner; o durumda ya da sonuç büyükse orijinali kullan
      if (!blob || blob.type !== "image/webp" || blob.size >= file.size) return file;
      const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
      return new File([blob], name, { type: "image/webp" });
    } catch {
      return file;
    }
  }

  // Dosyaları yükler, url'leri data'ya yazar. Hata olursa ilgili dosya alanında gösterir ve false döner.
  async function uploadFiles(form, data, files) {
    for (const [field, file] of Object.entries(files)) {
      const def = fileFields.find((f) => f.name === field);
      try {
        let result = uploaded.get(file);
        if (!result) {
          const toSend = def.kind === "image" ? await shrinkImage(file) : file;
          result = await api.upload(toSend);
          uploaded.set(file, result);
        }
        data[field] = result.url;
        if (def.nameKey) data[def.nameKey] = result.originalFileName || file.name;
      } catch (err) {
        if (err.status === 401) return false; // api katmanı girişe yönlendirdi
        const message = err.status === 400 || err.status === 413 ? err.message : `Dosya yüklenemedi: ${err.message}`;
        forms.setError(form, field, message);
        forms.focusField(form, form.elements[field]);
        admin.toast(`${def.label}: ${message}`, "error");
        return false;
      }
    }
    return true;
  }

  // İstek gövdesi: mevcut kayıt + formdaki değerler, salt okunur alanlar hariç
  function buildBody(item, data, removed) {
    const body = { ...item, ...data };
    for (const field of removed) {
      body[field] = null;
      const def = fileFields.find((f) => f.name === field);
      if (def && def.nameKey) body[def.nameKey] = null;
    }
    for (const k of READ_ONLY) delete body[k];
    return body;
  }

  function render(item) {
    header(item);
    page.innerHTML = `
      <form id="resource-form" novalidate>
        ${forms.render(resource.fields, item, resource.form)}
        <div class="form-actions">
          ${forms.langSwitch(resource.fields)}
          <span class="hint" data-dirty-hint hidden>● kaydedilmemiş değişiklikler</span>
          ${listUrl ? `<a href="${listUrl}" class="btn btn-soft-secondary">Vazgeç</a>` : ""}
          <button type="submit" class="btn btn-primary"><i class="bi bi-check-lg"></i> ${isEdit ? "Değişiklikleri kaydet" : "Kaydet"}</button>
        </div>
      </form>`;

    const form = document.getElementById("resource-form");
    const state = forms.bind(form, resource.fields);
    const submitBtn = form.querySelector("button[type=submit]");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!forms.validate(form, resource.fields)) return;
      const { data, files, removed } = forms.collect(form, resource.fields);

      submitBtn.disabled = true;
      try {
        if (!(await uploadFiles(form, data, files))) return;
        const body = buildBody(item, data, removed);
        const saved = isEdit ? await api.put(path, body) : await api.post(path, body);
        state.markClean();
        if (singleton) {
          render(saved);
          if (key === "about") admin.showUser(saved);
          admin.toast("Değişiklikler kaydedildi.");
        } else {
          admin.flash(isEdit ? "Değişiklikler kaydedildi." : "Kayıt eklendi.");
          location.href = listUrl;
        }
      } catch (err) {
        handleSaveError(form, err);
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  function handleSaveError(form, err) {
    if (err.status === 401) return; // api katmanı oturumu kapatıp girişe yönlendirdi
    if (err.status === 404) {
      admin.toast("Bu kayıt artık yok; başka bir yerden silinmiş olabilir.", "error");
      return;
    }
    if (err.status === 400) {
      if (err.fieldErrors) {
        // Doğrulama hatası: her mesaj ilgili alanın yanında
        const unmatched = forms.showServerErrors(form, err.fieldErrors);
        admin.toast(unmatched.length ? `Kaydedilemedi: ${unmatched.join(" · ")}` : "Kaydedilemedi: işaretli alanları düzeltin.", "error");
        return;
      }
      // İş kuralı hatası (ör. "Bitiş tarihi Başlangıç tarihinden önce olamaz")
      if (/tarih/i.test(err.message) && form.elements.endDate) {
        forms.setError(form, "endDate", err.message);
        forms.focusField(form, form.elements.endDate);
      }
      admin.toast(err.message, "error");
      return;
    }
    admin.handleError(err);
  }

  async function init() {
    if (!isEdit) return render({});
    page.innerHTML = admin.loading();
    try {
      render((await api.get(path)) || {});
    } catch (err) {
      header({});
      if (err.status === 401) return;
      if (err.status === 404) {
        page.innerHTML = admin.emptyState({
          icon: "question-circle",
          text: singleton ? "Kayıt bulunamadı." : "Kayıt bulunamadı; silinmiş olabilir.",
          action: listUrl ? `<a href="${listUrl}" class="btn btn-soft-primary"><i class="bi bi-arrow-left"></i> Listeye dön</a>` : "",
        });
        return;
      }
      admin.handleError(err);
      page.innerHTML = admin.errorState();
    }
  }

  init();
})();
