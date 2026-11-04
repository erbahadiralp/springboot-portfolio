// Backend ile konuşan tek katman. Endpoint sözleşmesi: frontend/API.md
// Not: ana sayfa (public/) hâlâ eski public/assets/js/api.js'i kullanıyor; Vue'ya geçince bu dosyayı kullanacak.
const API_BASE = "/api"; // göreli: nginx / Vite aynı origin'den backend'e iletir
const TOKEN_KEY = "authToken";

export class ApiError extends Error {
  constructor(status, message, body) {
    super(message);
    this.status = status;
    this.body = body;
  }

  // Doğrulama hatalarında { alan: mesaj }, yoksa null
  get fieldErrors() {
    return this.body && this.body.errors && typeof this.body.errors === "object" ? this.body.errors : null;
  }
}

// JWT'nin "exp" alanı (ms). Okunamazsa null.
function tokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export const auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
  expiresAt() {
    const token = this.getToken();
    return token ? tokenExpiry(token) : null;
  },
  // Token var ve süresi dolmamış (backend token'ı 1 saat geçerli verir)
  isLoggedIn() {
    const token = this.getToken();
    if (!token) return false;
    const exp = tokenExpiry(token);
    return exp === null || exp > Date.now();
  },
};

// Admin paneli ayarlar: herhangi bir istek 401 dönerse oturum kapatılıp girişe yönlendirilir.
let unauthorizedHandler = null;
export const onUnauthorized = (handler) => (unauthorizedHandler = handler);

// Backend doğrulama mesajlarını bu dile göre yazar (ValidationMessages[_tr].properties)
let language = "tr";
export const setLanguage = (lang) => (language = lang);

// Spring hata gövdesinde "message" olmayabilir; duruma göre anlaşılır bir metin.
function defaultMessage(status) {
  if (status === 401) return "Oturum süresi doldu, yeniden giriş yapın.";
  if (status === 403) return "Bu işlem için yetkiniz yok.";
  if (status === 404) return "Kayıt bulunamadı.";
  if (status === 413) return "Dosya çok büyük.";
  if (status === 429) return "Çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar deneyin.";
  if (status === 400) return "Geçersiz istek.";
  if (status >= 500) return "Sunucu hatası. Lütfen daha sonra tekrar deneyin.";
  return "İstek başarısız.";
}

// options.json -> application/json gövde, options.form -> FormData (multipart)
async function request(method, path, options = {}) {
  const headers = { "Accept-Language": language };
  let body;
  if (options.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.json);
  } else if (options.form !== undefined) {
    body = options.form; // Content-Type'ı (boundary ile) tarayıcı koyar
  }
  const token = auth.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(API_BASE + path, { method, headers, body });
  } catch {
    throw new ApiError(0, "Sunucuya ulaşılamadı.", null);
  }
  const text = await res.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }
  if (!res.ok) {
    const message = (payload && typeof payload === "object" && payload.message) || defaultMessage(res.status);
    const error = new ApiError(res.status, message, typeof payload === "object" ? payload : null);
    // Giriş isteğinin 401'i "yanlış şifre"dir, oturum düşmesi değil.
    if (res.status === 401 && path !== "/auth/login" && unauthorizedHandler) unauthorizedHandler(error);
    throw error;
  }
  return payload;
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, json) => request("POST", path, { json }),
  put: (path, json) => request("PUT", path, { json }),
  patch: (path, json) => request("PATCH", path, json === undefined ? {} : { json }),
  delete: (path) => request("DELETE", path),
  // POST /api/files -> { url: "/static/...", originalFileName }
  upload(file) {
    const form = new FormData();
    form.append("file", file);
    return request("POST", "/files", { form });
  },
};
