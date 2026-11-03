// Frontend ayarları.
// API adresi ayar değildir: istekler her zaman göreli "/api/..." ve "/static/..." adreslerine gider (bkz. api.js).
window.APP_CONFIG = {
  // Cloudflare Turnstile site key (gizli değildir). Backend iletişim mesajlarında token'ı zorunlu tutar
  // (TURNSTILE_SECRET ile doğrular); boş bırakılırsa widget çıkmaz ve iletişim formu gönderilemez.
  TURNSTILE_SITE_KEY: "0x4AAAAAACr34BJK85vbkZJR",
};
