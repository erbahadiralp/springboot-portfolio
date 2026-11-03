// Hata sayfalarının küçük davranışları: site ile aynı tema ve dil tercihi, istenen yolun terminalde
// gösterilmesi, "Geri dön" / "Tekrar dene" butonları. Sayfalar JS olmadan da okunabilir (varsayılan İngilizce).
// <head> içinde senkron yüklenir; tema sayfa çizilmeden uygulanır, gerisi DOM hazır olunca.
(function () {
  var root = document.documentElement;
  root.classList.add("js");

  var read = function (key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  };

  // Tema: sitedeki kayıtlı tercih; yoksa CSS sistem tercihini izler
  var theme = read("theme");
  if (theme === "dark" || theme === "light") root.setAttribute("data-theme", theme);

  // Dil: sitedeki kayıtlı tercih (varsayılan site gibi İngilizce)
  var lang = read("lang") === "tr" ? "tr" : "en";
  root.lang = lang;

  document.addEventListener("DOMContentLoaded", function () {
    if (lang === "tr") {
      var items = document.querySelectorAll("[data-tr]");
      for (var i = 0; i < items.length; i++) items[i].textContent = items[i].getAttribute("data-tr");
    }

    // Kullanıcının açmaya çalıştığı yol (textContent: HTML olarak yorumlanmaz)
    var path = decodeURIComponent(location.pathname + location.search);
    var slots = document.querySelectorAll("[data-path]");
    for (var j = 0; j < slots.length; j++) slots[j].textContent = path;

    var back = document.querySelector("[data-back]");
    if (back) {
      back.addEventListener("click", function () {
        // Siteye doğrudan bu adresle gelindiyse geri gidilecek sayfa yok; ana sayfaya git
        if (history.length > 1 && document.referrer.indexOf(location.origin) === 0) history.back();
        else location.href = "/";
      });
    }

    var retry = document.querySelector("[data-retry]");
    if (retry) retry.addEventListener("click", function () { location.reload(); });
  });
})();
