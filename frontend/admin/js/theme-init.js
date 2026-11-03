// Tema, sayfa çizilmeden önce uygulanır (site ile aynı "theme" anahtarı). <head> içinde, senkron yüklenmeli.
// Satır içi <script> yerine ayrı dosya: CSP'de script-src 'unsafe-inline' gerekmesin diye.
(function () {
  var theme = localStorage.getItem("theme");
  if (!theme) theme = window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.setAttribute("data-bs-theme", theme);
})();
