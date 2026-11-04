# Frontend

Portfolyo sitesinin ve admin panelinin frontend'i. Tüm veri Spring Boot backend'inin REST API'sinden çekilir. API sözleşmesi [API.md](API.md)'de; backend kodundan çıkarılmıştır, kaynak backend'dir.

- **Admin paneli:** Vue 3 + Vue Router, Vite ile derlenir (TypeScript yok). `/admin/` adresinde tek sayfalık uygulama.
- **Ana sayfa:** Şimdilik sade HTML/CSS/JS; `public/` altında durur ve derlemede olduğu gibi kopyalanır. Sırada Vue'ya taşınması var.

## Çalıştırma

Tüm istekler göreli adreslere gider (`/api/...`, `/static/...`); frontend ve backend aynı origin'den sunulmalıdır.

**Geliştirme (frontend üzerinde çalışırken):** Node.js gerekir. Backend ayrıca çalışıyor olmalı (varsayılan `http://localhost:8080`; kökte `docker compose up -d` ile `compose.dev.yaml` 8080'i açar).

```bash
cd frontend
npm install        # ilk seferde
npm run dev        # http://localhost:5173 — kaydedince tarayıcı kendiliğinden yenilenir
```

- Site: http://localhost:5173, admin: http://localhost:5173/admin/
- `/api` ve `/static` istekleri backend'e iletilir. Farklı backend adresi: `BACKEND_URL=http://localhost:9090 npm run dev`.
- `npm run build` derlenmiş çıktıyı `dist/`'e yazar (git'e girmez).

**Docker Compose:** proje kökünde `docker compose up -d --build`. nginx imajı (`../nginx/Dockerfile`) önce frontend'i Node ile derler, sonra `dist/`'i sunar; sunucuda Node yoktur. Ayarlar kökteki `.env`'den okunur (örnek: `../.env.example`).

- Canlıda hiçbir port açılmaz; trafik Dokploy / Cloudflare Tunnel üzerinden nginx'e gelir.
- Yerelde `.env`'e `COMPOSE_FILE=compose.yaml:compose.dev.yaml` yazılınca:
  - Site: http://localhost:3000, admin: http://localhost:3000/admin/ (ilk kullanıcı `.env`'deki `ADMIN_USERNAME` / `ADMIN_PASSWORD`; yalnızca kullanıcı tablosu boşken uygulanır)
  - Backend (Bruno için): http://localhost:8080, veritabanı: localhost:5432 (ikisi de yalnızca bu makineden erişilebilir)
  - Frontend değişikliği için imaj yeniden derlenmeli (`docker compose up -d --build nginx`); hızlı çalışmak için `npm run dev`.

`public/assets/js/config.js`'te tek ayar var: `TURNSTILE_SITE_KEY`. Backend iletişim mesajlarında Turnstile token'ını zorunlu tutup `TURNSTILE_SECRET` ile doğruladığı için bu anahtar **dolu olmalı**; boşsa widget çıkmaz ve iletişim formu gönderilemez. Site key ile secret aynı Cloudflare widget'ına ait olmalı ve widget'ın izinli alan adlarında siteyi açtığın adres (yerelde `localhost`) bulunmalı. Backend ayrıca token'ın üretildiği alan adını `TURNSTILE_ALLOWED_HOSTNAMES` ile kontrol eder (canlıda varsayılan `bahadiralper.com,www.bahadiralper.com`; yerelde `.env`'e `TURNSTILE_ALLOWED_HOSTNAMES=localhost`).

## Oturum

- Giriş: `POST /api/auth/login` → `{ token }`. Token `localStorage`'da (`authToken`) tutulur ve korumalı isteklere `Authorization: Bearer <token>` olarak eklenir.
- Token 1 saat geçerli. Bitmeden 5 dakika önce panelde kalıcı bir uyarı çıkar. Süre dolunca ya da herhangi bir istek 401 dönerse oturum kapanır ve giriş ekranına "oturum süresi doldu" notuyla dönülür.
- Giriş denemeleri nginx'te IP başına dakikada 5 ile sınırlı (429).

## Backend ile davranış notları

- İki dilli alanlar `alanTr` / `alanEn` (ör. `titleTr`). Formda dil sekmesine göre biri gösterilir.
- Kayıtlar JSON gönderilir. Dosya seçildiyse önce `POST /api/files` ile yüklenir (uzun kenarı 1600 px'ten ya da boyutu 1 MB'tan büyük resimler tarayıcıda WebP'ye küçültülür), dönen `/static/...` adresi ilgili alana (`imageUrl`, `pdfUrl`, `cvDocumentUrlTr` …) yazılır, sonra kayıt kaydedilir. Dosya alanındaki çöp kutusu dosyayı kayıttan çıkarır.
- `PUT` tüm alanları değiştirir; form, mevcut kaydı okuyup değişmeyen alanları da geri gönderir.
- Deneyim sorumlulukları güncellemede tamamen değiştirilir; her maddenin TR ve EN metni zorunludur.
- Projeler ve sertifikalar listede oklarla taşınır (`PUT /api/<kaynak>/order`, tüm id'ler). Eğitim ve deneyimler backend'de başlangıç tarihine göre sıralanır.
- Yetenek kategorisi backend'de tek dilli metindir; Türkçe ad kaydedilir, site İngilizcede karşılığını gösterir.
- Mesajlar sayfalıdır (10'ar); yalnızca "okundu yap" var, backend geri almayı desteklemiyor.
- 400 doğrulama hataları ilgili alanın altında, iş kuralı hataları (ör. tarih) bildirim olarak gösterilir; 404'te "kayıt bulunamadı" ekranı/bildirimi çıkar.
- Formda kaydedilmemiş değişiklik varken başka sayfaya geçilirse ya da sekme kapatılırsa onay istenir.

## Yapı

```
frontend/
├── package.json, vite.config.js
├── admin/index.html            # admin panelinin giriş sayfası (Vue uygulamasını yükler)
├── src/
│   ├── lib/                    # site ve admin için ortak modüller
│   │   ├── api.js              # tüm backend çağrıları, token, 401 yönetimi
│   │   ├── constants.js        # yetenek kategorileri, dosya yükleme kuralları
│   │   └── dates.js            # tarih biçimlendirme
│   └── admin/
│       ├── main.js, App.vue, router.js
│       ├── store.js            # ortak durum: sayfa başlığı, bildirim, onay penceresi, oturum süresi
│       ├── resources.js        # bölüm tanımları: menü, liste sütunları, form alanları (DTO alan adlarıyla)
│       ├── admin.css           # tema: renkler, tipografi, bileşenler, açık/koyu mod
│       ├── components/
│       │   ├── AdminLayout.vue # kenar çubuğu, üst çubuk, başlık, bildirimler, onay penceresi
│       │   ├── ResourceForm.vue# form motoru (TR/EN alanlar, tarih, dosya, sorumluluklar, doğrulama)
│       │   └── FieldInput.vue, StateBox.vue, RenderCell.js
│       └── views/              # Login, Dashboard, List, Form, Messages, Account, NotFound
├── public/                     # derlemede olduğu gibi kopyalanır
│   ├── index.html              # ana sayfa (tek sayfa)
│   ├── assets/                 # ana sayfanın CSS ve JS'i (config, i18n, api, home ...)
│   ├── admin/theme-init.js     # açık/koyu tema, sayfa çizilmeden önce
│   ├── errors/                 # hata sayfaları: 403, 404, 500, 503
│   └── robots.txt, sitemap.xml, favicon.png
└── API.md                      # backend API sözleşmesi (koddan çıkarıldı)
```

Admin adresleri: `/admin/` (genel bakış), `/admin/login`, `/admin/<kaynak>` (liste, ör. `/admin/projects`), `/admin/<kaynak>/new`, `/admin/<kaynak>/<id>`, `/admin/profile`, `/admin/messages`, `/admin/account`. Eski `*.html` adresleri yenilerine yönlenir.

Yeni bir alan eklemek için genelde sadece `src/admin/resources.js` (admin) ve `public/assets/js/home.js` (site) güncellenir. Alan adı backend DTO'sundaki adla aynı olmalı; 400 hataları bu adlarla eşleştirilir.

nginx yapılandırması kökteki `nginx/` klasöründe: `default.conf` (site, güvenlik başlıkları, önbellek, deneme sınırları, Cloudflare gerçek IP), `backend-proxy.inc` (backend'e iletilen konumların ortak ayarları) ve frontend'i derleyip sunan `Dockerfile`.

## nginx (canlı)

`nginx/default.conf` ayrıntıları (gerekçeler dosyadaki yorumlarda):

- `/admin/` altında dosya olmayan her adres `admin/index.html`'e düşer; sayfayı Vue Router çizer.
- Admin'in derlenmiş dosyaları (`/admin/assets/`) adlarında içerik hash'i taşıdığı için 1 yıl önbellekte kalır. HTML ve ana sayfanın JS/CSS'i her açılışta doğrulanır (`no-cache`; değişmediyse 304). Yüklenen dosyalar (`/static/`) 30 gün, diğer görseller 7 gün önbellekte kalır.
- Güvenlik başlıkları: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. `/admin/` ve `/api/` için `X-Robots-Tag: noindex`.
- Deneme sınırları (yalnızca POST, IP başına): giriş dakikada 5, iletişim formu dakikada 3. Aşılınca JSON 429.
- Gerçek ziyaretçi IP'si `CF-Connecting-IP`'den alınır (Cloudflare ve Docker ağı adreslerinden gelirse).
- `package.json`, `*.md` ve gizli dosyalar (`.env`, `.git`) sunulmaz.
- Hata sayfaları `errors/` altında; 403, 404, 500 ve 502/503/504 için. `/api/` istekleri bunun yerine JSON hata döner.
- TLS bu katmanda değil.
- Admin paneli Bootstrap ve Bootstrap Icons'ı npm'den alır ve kendi dosyalarıyla sunar. Ana sayfadaki CDN dosyaları sabit sürümlü ve `integrity` (SRI) ile yüklenir; istisnalar (Google Fonts CSS'i, Turnstile script'i ve pdf.js worker'ı) yalnızca CSP ile sınırlandırıldı.
