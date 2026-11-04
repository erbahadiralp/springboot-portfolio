// Küçük ortak yardımcılar.
(function () {
  const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

  // "2023-09-01" -> yerel saatle Date. new Date("2023-09-01") UTC'ye göre okur ve bazı saat
  // dilimlerinde bir önceki güne kayar; bu yüzden parçalarından kuruyoruz.
  function parseDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || "");
    return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
  }

  // Başlangıç–bitiş aralığını aktif dilde yazar. endDate yoksa presentLabel ("Günümüz") kullanılır.
  //   withMonth: true  -> "Eyl 2023 – Günümüz" / "Sep 2023 – Present"
  //   withMonth: false -> "2020 – 2024"
  // İki uç aynı yazılıyorsa tek değer döner ("2024").
  function formatPeriod(startDate, endDate, { locale, withMonth, presentLabel }) {
    const format = new Intl.DateTimeFormat(locale, withMonth ? { month: "short", year: "numeric" } : { year: "numeric" });
    const start = parseDate(startDate);
    if (!start) return "";
    const end = parseDate(endDate);
    const from = format.format(start);
    const to = end ? format.format(end) : presentLabel;
    return from === to ? from : `${from} – ${to}`;
  }

  window.util = {
    // API'den gelen her metni HTML'e basmadan önce kaçır (XSS'e karşı).
    esc: (value) => (value == null ? "" : String(value).replace(/[&<>"']/g, (c) => ESCAPES[c])),
    qs: (name) => new URLSearchParams(location.search).get(name),
    parseDate,
    formatPeriod,
  };
})();
