// Hesap ayarları: şifre değiştirme (PUT /api/auth/password -> 204). Form, içerik formlarıyla aynı motoru kullanır.
(function () {
  if (!window.admin) return;
  const { api, admin, forms } = window;
  const page = document.getElementById("page-content");

  // Kurallar ChangePasswordRequestDTO.newPassword'den:
  //   @Size(min = 12, max = 72), @Pattern("^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$")
  const PASSWORD_RULES = [
    { text: "En az 12, en fazla 72 karakter", test: (v) => v.length >= 12 && v.length <= 72 },
    { text: "En az bir küçük harf (a-z)", test: (v) => /[a-z]/.test(v) },
    { text: "En az bir büyük harf (A-Z)", test: (v) => /[A-Z]/.test(v) },
    { text: "En az bir sembol (harf ve rakam dışında bir karakter)", test: (v) => /[^A-Za-z0-9]/.test(v) },
  ];

  const FIELDS = [
    { name: "currentPassword", label: "Mevcut şifre", type: "password", required: true, wide: true },
    {
      name: "newPassword", label: "Yeni şifre", type: "password", required: true,
      minLength: 12, minLengthMessage: "Şifre en az 12 karakter olmalı",
      maxLength: 72,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$/,
      patternMessage: "Şifre en az bir küçük harf, bir büyük harf ve bir sembol içermeli",
    },
    { name: "confirmPassword", label: "Yeni şifre (tekrar)", type: "password", required: true, match: "newPassword", matchMessage: "Şifreler eşleşmiyor." },
  ];

  admin.setHeader({ title: "Hesap Ayarları", subtitle: "Admin paneli giriş bilgileri" });
  page.innerHTML = `
    <form id="password-form" novalidate>
      ${forms.render(FIELDS, {}, {
        sections: { details: { title: "Şifre değiştir", description: "Değişiklik bir sonraki girişte geçerli olur; açık oturumun kapanmaz. Güçlü ve bu siteye özel bir şifre seç." } },
      })}
      <div class="card mb-4">
        <div class="card-body">
          <div class="form-label mb-2">Yeni şifre kuralları</div>
          <ul class="list-unstyled mb-0 small" id="password-rules">
            ${PASSWORD_RULES.map((r, i) => `<li data-rule="${i}" class="text-muted"><i class="bi bi-circle me-2"></i>${r.text}</li>`).join("")}
          </ul>
        </div>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary"><i class="bi bi-shield-check"></i> Şifreyi değiştir</button>
      </div>
    </form>`;

  const form = document.getElementById("password-form");
  const state = forms.bind(form, FIELDS);

  // Yazarken her kuralın karşılanıp karşılanmadığını göster
  function updateRules() {
    const value = form.elements.newPassword.value;
    PASSWORD_RULES.forEach((rule, i) => {
      const ok = value && rule.test(value);
      const li = form.querySelector(`[data-rule="${i}"]`);
      li.className = ok ? "text-success" : "text-muted";
      li.querySelector("i").className = `bi bi-${ok ? "check-circle-fill" : "circle"} me-2`;
    });
  }
  form.elements.newPassword.addEventListener("input", updateRules);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!forms.validate(form, FIELDS)) return;
    const { currentPassword, newPassword } = forms.collect(form, FIELDS).data;
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    try {
      await api.put("/auth/password", { currentPassword, newPassword });
      form.reset();
      updateRules();
      state.markClean();
      admin.toast("Şifreniz değiştirildi.");
    } catch (err) {
      if (err.status === 401) return; // girişe yönlendirildi
      if (err.status === 400 && err.fieldErrors) {
        forms.showServerErrors(form, err.fieldErrors);
      } else if (err.status === 400) {
        // "Mevcut şifre hatalı"
        forms.setError(form, "currentPassword", err.message);
        forms.focusField(form, form.elements.currentPassword);
      } else {
        admin.handleError(err);
      }
    } finally {
      button.disabled = false;
    }
  });
})();
