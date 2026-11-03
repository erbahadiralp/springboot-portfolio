// Giriş: POST /api/auth/login { username, password } -> { token }. Token 1 saat geçerli.
(function () {
  const { api } = window;
  if (api.auth.isLoggedIn()) {
    location.replace("index.html");
    return;
  }
  api.auth.clear(); // süresi dolmuş token kalmasın

  const form = document.getElementById("login-form");
  const alertBox = document.getElementById("login-alert");
  const infoBox = document.getElementById("login-info");
  const button = form.querySelector("button[type=submit]");

  if (new URLSearchParams(location.search).get("expired")) {
    infoBox.textContent = "Oturum süren doldu. Devam etmek için yeniden giriş yap.";
    infoBox.hidden = false;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    alertBox.hidden = true;
    const username = form.elements.username.value.trim();
    const password = form.elements.password.value;
    if (!username || !password) {
      alertBox.textContent = "Kullanıcı adı ve şifre gerekli.";
      alertBox.hidden = false;
      return;
    }
    button.disabled = true;
    try {
      const { token } = await api.post("/auth/login", { username, password });
      api.auth.setToken(token);
      location.href = "index.html";
    } catch (err) {
      // 401: backend "Kullanıcı adı veya şifre hatalı" döner
      alertBox.textContent = err.status === 401 || err.status === 400
        ? err.message || "Kullanıcı adı veya şifre hatalı."
        : err.status === 429
          ? "Çok fazla giriş denemesi. Lütfen bir dakika bekleyip tekrar deneyin."
          : "Giriş yapılamadı. Sunucuya ulaşılamıyor olabilir.";
      alertBox.hidden = false;
      infoBox.hidden = true;
      form.elements.password.select();
    } finally {
      button.disabled = false;
    }
  });
})();
