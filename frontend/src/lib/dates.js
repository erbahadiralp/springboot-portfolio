// Tarih yardımcıları (ana sayfa ve admin paneli aynı biçimi kullanır).

// "2023-09-01" -> yerel saatle Date. new Date("2023-09-01") UTC'ye göre okur ve bazı saat
// dilimlerinde bir önceki güne kayar; bu yüzden parçalarından kuruyoruz.
export function parseDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || "");
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
}

// Başlangıç–bitiş aralığını verilen dilde yazar. endDate yoksa presentLabel ("Günümüz") kullanılır.
//   withMonth: true  -> "Eyl 2023 – Günümüz" / "Sep 2023 – Present"
//   withMonth: false -> "2020 – 2024"
// İki uç aynı yazılıyorsa tek değer döner ("2024").
export function formatPeriod(startDate, endDate, { locale, withMonth, presentLabel }) {
  const format = new Intl.DateTimeFormat(locale, withMonth ? { month: "short", year: "numeric" } : { year: "numeric" });
  const start = parseDate(startDate);
  if (!start) return "";
  const end = parseDate(endDate);
  const from = format.format(start);
  const to = end ? format.format(end) : presentLabel;
  return from === to ? from : `${from} – ${to}`;
}

// "5 dk önce", "3 gün önce"; bir haftadan eskiyse tarih
export function relativeTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  const minutes = Math.round((Date.now() - date) / 60000);
  if (minutes < 1) return "az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)} saat önce`;
  if (minutes < 60 * 24 * 7) return `${Math.round(minutes / 1440)} gün önce`;
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}
