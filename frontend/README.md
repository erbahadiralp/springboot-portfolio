# Frontend

Portfolyo sitesinin ve admin panelinin frontend'i. Sade HTML/CSS/JS; framework ve build adımı yok. Tüm veri Spring Boot backend'inin REST API'sinden (`fetch`) çekilir. API sözleşmesi [API.md](API.md)'de; backend kodundan çıkarılmıştır, kaynak backend'dir.

## Çalıştırma

Tüm istekler göreli adreslere gider (`/api/...`, `/static/...`); frontend ve backend aynı origin'den sunulmalıdır.

**Docker Compose (önerilen):** proje kökünde `docker compose up -d`. nginx (`../nginx/default.conf`) bu klasörü sunar ve `/api/`, `/static/` isteklerini backend'e iletir. Ayarlar kökteki `.env`'den okunur (örnek: `../.env.example`).

- Canlıda nginx 80 portunu dinler; veritabanı ve backend dışarıya açılmaz.
- Yerelde `.env`'e `NGINX_PORT=3000` ve `COMPOSE_FILE=compose.yaml:compose.dev.yaml` yazılınca:
  - Site: http://localhost:3000
  - Admin: http://localhost:3000/admin/ (ilk kullanıcı `.env`'deki `ADMIN_USERNAME` / `ADMIN_PASSWORD`; yalnızca kullanıcı tablosu boşken uygulanır)
  - Backend (Bruno için): http://localhost:8080, veritabanı: localhost:5432 (ikisi de yalnızca bu makineden erişilebilir)

**Geliştirme sunucusu:** Node.js yeterli, `npm install` gerekmez. Backend ayrıca çalışıyor olmalı (varsayılan `http://localhost:8080`).

```bash
cd frontend
npm start          # veya: node server.js
```

`server.js` statik dosyaları sunar ve `/api/*`, `/static/*` isteklerini backend'e iletir. Farklı adres/port: `BACKEND_URL=http://localhost:9090 PORT=3001 npm start`. Compose'daki nginx 3000 portunu kullanıyorsa `PORT` ile başka port seç.

> Dosyaları doğrudan tarayıcıda (`file://`) açmak çalışmaz; bir HTTP sunucusu gerekir.

`assets/js/config.js`'te tek ayar var: `TURNSTILE_SITE_KEY`. Backend iletişim mesajlarında Turnstile token'ını zorunlu tutup `TURNSTILE_SECRET` ile doğruladığı için bu anahtar **dolu olmalı**; boşsa widget çıkmaz ve iletişim formu gönderilemez. Site key ile secret aynı Cloudflare widget'ına ait olmalı ve widget'ın izinli alan adlarında siteyi açtığın adres (yerelde `localhost`) bulunmalı. Backend ayrıca token'ın üretildiği alan adını `TURNSTILE_ALLOWED_HOSTNAMES` ile kontrol eder (canlıda varsayılan `bahadiralper.com,www.bahadiralper.com`; yerelde `.env`'e `TURNSTILE_ALLOWED_HOSTNAMES=localhost`).

## Oturum

- Giriş: `POST /api/auth/login` → `{ token }`. Token `localStorage`'da (`authToken`) tutulur ve korumalı isteklere `Authorization: Bearer <token>` olarak eklenir.
- Token 1 saat geçerli. Bitmeden 5 dakika önce panelde kalıcı bir uyarı çıkar. Süre dolunca ya da herhangi bir istek 401 dönerse oturum kapanır ve giriş ekranına "oturum süresi doldu" notuyla dönülür.
- Giriş denemeleri nginx'te IP başına dakikada 5 ile sınırlı (429).

## Backend ile davranış notları

- İki dilli alanlar `alanTr` / `alanEn` (ör. `titleTr`). Formda dil sekmesine göre biri gösterilir.
- Kayıtlar JSON gönderilir. Dosya seçildiyse önce `POST /api/files` ile yüklenir (uzun kenarı 1600 px'ten ya da boyutu 1 MB'tan büyük resimler tarayıcıda WebP'ye küçültülür), dönen `/static/...` adresi ilgili alana (`imageUrl`, `pdfUrl`, `cvDocumentUrlTr` …) yazılır, sonra kayıt kaydedilir. Dosya alanındaki çöp kutusu dosyayı kayıttan çıkarır (dosya sunucuda kalır).
- `PUT` tüm alanları değiştirir; form, mevcut kaydı okuyup değişmeyen alanları da geri gönderir.
- Deneyim sorumlulukları güncellemede tamamen değiştirilir; her maddenin TR ve EN metni zorunludur.
- Projeler ve sertifikalar listede oklarla taşınır (`PUT /api/<kaynak>/order`, tüm id'ler). Eğitim ve deneyimler backend'de başlangıç tarihine göre sıralanır.
- Yetenek kategorisi backend'de tek dilli metindir; Türkçe ad kaydedilir, site İngilizcede karşılığını gösterir.
- Mesajlar sayfalıdır (10'ar); yalnızca "okundu yap" var, backend geri almayı desteklemiyor.
- 400 doğrulama hataları ilgili alanın altında, iş kuralı hataları (ör. tarih) bildirim olarak gösterilir; 404'te "kayıt bulunamadı" ekranı/bildirimi çıkar.

## Yapı

```
frontend/
├── index.html              # public site (tek sayfa)
├── assets/
│   ├── css/styles.css
│   └── js/
│       ├── config.js       # ayarlar (Turnstile site key)
│       ├── constants.js    # ortak sabitler: yetenek kategorileri, dosya yükleme kuralları
│       ├── api.js          # tüm backend çağrıları, token, 401 yönetimi
│       ├── i18n.js         # TR/EN çeviriler
│       ├── util.js         # HTML kaçırma, tarih biçimlendirme
│       ├── site.js         # tema, mobil menü
│       └── home.js         # ana sayfa render'ı, iletişim formu, sertifika PDF'leri
├── admin/                  # özel tema (Bootstrap 5.3 iskelet olarak, CDN)
│   ├── index.html          # genel bakış
│   ├── login.html
│   ├── list.html?r=...     # educations | experiences | projects | certificates | skills
│   ├── form.html?r=...&id= # ekleme / düzenleme; form.html?r=about -> profil
│   ├── messages.html       # gelen iletişim mesajları (sayfalı)
│   ├── account.html        # şifre değiştirme
│   ├── js/
│   │   ├── theme-init.js   # açık/koyu tema, sayfa çizilmeden önce
│   │   ├── resources.js    # bölüm tanımları: menü, liste sütunları, form alanları (DTO alan adlarıyla)
│   │   ├── admin.js        # oturum kontrolü, sidebar, başlık, toast/onay modalı
│   │   ├── forms.js        # form motoru (TR/EN alanlar, tarih, dosya kuralları, doğrulama)
│   │   └── *.js            # sayfa scriptleri
│   └── assets/css/admin.css # tema: renkler, tipografi, bileşenler, açık/koyu mod
├── errors/                 # hata sayfaları: 403, 404, 500, 503 (+ errors.css, errors.js)
├── robots.txt, sitemap.xml # arama motorları için
├── server.js               # geliştirme sunucusu: statik dosyalar + /api proxy (nginx bunu dışarıya sunmaz)
└── API.md                  # backend API sözleşmesi (koddan çıkarıldı)
```

nginx yapılandırması kökteki `nginx/` klasöründe: `default.conf` (site, güvenlik başlıkları, önbellek, deneme sınırları, Cloudflare gerçek IP) ve `backend-proxy.inc` (backend'e iletilen konumların ortak ayarları).

Yeni bir alan eklemek için genelde sadece `admin/js/resources.js` (admin) ve `assets/js/home.js` (site) güncellenir. Alan adı backend DTO'sundaki adla aynı olmalı; 400 hataları bu adlarla eşleştirilir.

## nginx (canlı)

`nginx/default.conf` ayrıntıları (gerekçeler dosyadaki yorumlarda):

- HTML, JS ve CSS her açılışta doğrulanır (`no-cache`; değişmediyse 304). Yeni sürüm yayınlanınca ziyaretçi eski JS'i kullanmaz. Yüklenen dosyalar (`/static/`) 30 gün, diğer görseller 7 gün önbellekte kalır.
- Güvenlik başlıkları: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. `/admin/` ve `/api/` için `X-Robots-Tag: noindex`.
- Deneme sınırları (yalnızca POST, IP başına): giriş dakikada 5, iletişim formu dakikada 3. Aşılınca JSON 429.
- Cloudflare'in arkasında gerçek ziyaretçi IP'si `CF-Connecting-IP`'den alınır (yalnızca Cloudflare adreslerinden gelirse). Cloudflare Tunnel kullanılırsa dosyadaki ilgili satır açılmalı.
- `server.js`, `package.json`, `*.md` ve gizli dosyalar (`.env`, `.git`) sunulmaz.
- Hata sayfaları `errors/` altında; 403, 404, 500 ve 502/503/504 için. `/api/` istekleri bunun yerine JSON hata döner.
- TLS bu katmanda değil.
- CDN'den gelen script ve stil dosyaları sabit sürümlü ve `integrity` (SRI) ile yüklenir. İstisnalar: Google Fonts CSS'i, Turnstile script'i ve pdf.js worker'ı; bu üçü yalnızca CSP ile sınırlandırıldı.
