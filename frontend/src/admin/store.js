// Admin panelinin ortak durumu ve yardımcıları: sayfa başlığı, bildirimler (toast), onay penceresi,
// kenar çubuğundaki kullanıcı ve okunmamış mesaj sayısı, oturum süresi.
import { reactive } from "vue";
import { api, auth } from "../lib/api.js";

export const ui = reactive({
  // Sayfa başlığı ve sağ üstteki butonlar. actions: [{ text, icon, to | href, variant, external }]
  header: { title: "", subtitle: "", actions: [], path: null },
  toasts: [],
  dialog: null, // { title, message, confirmText, variant, resolve }
  user: { name: "Admin", imageUrl: null },
  unread: 0,
});

let router = null;
export const bindRouter = (r) => (router = r);

// path: [{ text, to? }] — verilmezse aktif sayfadan üretilir (AdminLayout)
export function setHeader({ title, subtitle = "", actions = [], path = null }) {
  document.title = `${title} · Admin`;
  Object.assign(ui.header, { title, subtitle, actions, path });
}

// type: "success" | "error" | "warning". options.autohide: false -> kullanıcı kapatana kadar kalır.
let toastId = 0;
export function toast(message, type = "success", options = {}) {
  const id = ++toastId;
  ui.toasts.push({ id, message, type });
  if (options.autohide !== false) setTimeout(() => dismissToast(id), 3500);
}
export function dismissToast(id) {
  const i = ui.toasts.findIndex((t) => t.id === id);
  if (i >= 0) ui.toasts.splice(i, 1);
}

// window.confirm yerine modal. Promise<boolean> döner.
export function confirmDialog({ title, message, confirmText = "Sil", variant = "danger" }) {
  return new Promise((resolve) => {
    ui.dialog = { title, message, confirmText, variant, resolve };
  });
}
export function closeDialog(result) {
  const dialog = ui.dialog;
  ui.dialog = null;
  if (dialog) dialog.resolve(result);
}

// ---------------- Oturum ----------------

let timers = [];
const clearTimers = () => {
  timers.forEach(clearTimeout);
  timers = [];
};

// Oturumu kapatıp girişe döner. expired: giriş ekranında "oturum süresi doldu" notu gösterilir.
export function logout(expired = false) {
  clearTimers();
  auth.clear();
  ui.toasts.splice(0);
  closeDialog(false);
  router.replace({ name: "login", query: expired ? { expired: 1 } : {} });
}

// Token 1 saat geçerli: süre dolunca istek beklemeden girişe dön.
// 5 dakika kala uyar; formda kaydedilmemiş değişiklik varsa kaybolmasın.
const WARN_BEFORE_MS = 5 * 60 * 1000;
export function startSession() {
  clearTimers();
  const expiresAt = auth.expiresAt();
  if (!expiresAt) return;
  timers.push(setTimeout(() => logout(true), Math.max(0, expiresAt - Date.now())));
  const warnIn = expiresAt - WARN_BEFORE_MS - Date.now();
  if (warnIn > 0) {
    timers.push(setTimeout(() => toast(
      "Oturumun 5 dakika içinde sona erecek. Kaydedilmemiş değişikliklerin varsa şimdi kaydet; ardından yeniden giriş yapman gerekecek.",
      "warning", { autohide: false }), warnIn));
  }
}

// Genel hata bildirimi. 401'de oturum zaten kapatıldı; tekrar bildirilmez.
// 404 / 400 için sayfalar kendi mesajlarını gösterir, buraya düşerse backend mesajı toast olur.
export function handleError(err) {
  if (err && err.status === 401) {
    logout(true);
    return;
  }
  console.error(err);
  toast(err && err.message ? err.message : "Beklenmeyen bir hata oluştu.", "error");
}

// ---------------- Kenar çubuğu ----------------

// Kenar çubuğundaki kullanıcı bilgisi; profil kaydedilince de çağrılır.
export function showUser(about) {
  if (!about) return;
  ui.user.name = `${about.firstName || ""} ${about.lastName || ""}`.trim() || "Admin";
  ui.user.imageUrl = about.imageUrl || null;
}

// Menüdeki "Mesajlar" yanında okunmamış sayısı. GET /api/contact-messages/unread-count düz bir sayı döner.
export function refreshUnreadCount() {
  return api.get("/contact-messages/unread-count")
    .then((value) => (ui.unread = Number(value) || 0))
    .catch(() => {});
}
