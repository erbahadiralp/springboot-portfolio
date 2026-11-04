# springboot-portfolio

Yönetim paneli olan kişisel portfolyo sitesi: [bahadiralper.com](https://bahadiralper.com)

Site içeriği (projeler, deneyimler, eğitim, sertifikalar, yetenekler, CV) Türkçe ve İngilizce olarak admin panelinden yönetilir. Ziyaretçiler iletişim formundan mesaj gönderebilir.

## Teknolojiler

- **Backend:** Java 21, Spring Boot 4, Spring Security (JWT), Spring Data JPA, Flyway, PostgreSQL
- **Frontend:** Vue 3 + Vite (admin paneli), HTML/CSS/JS (ana sayfa)
- **Altyapı:** Docker Compose, nginx, Cloudflare (Tunnel, Access, Turnstile), Dokploy, GitHub Actions

## Yapı

```
backend/      Spring Boot REST API              → backend/README.md
frontend/     Ana sayfa ve Vue admin paneli     → frontend/README.md
nginx/        Siteyi sunan ve /api'yi backend'e ileten nginx (imajı frontend'i de derler)
compose.yaml       Canlı kurulum (dışarıya port açılmaz)
compose.dev.yaml   Yerel ekler: site 3000, backend 8080, veritabanı 5432
```

## Çalıştırma

Docker yeterli:

```bash
cp .env.example .env    # değerleri doldur
docker compose up -d --build
```

Yerelde `.env`'e şunları ekle:

```
COMPOSE_FILE=compose.yaml:compose.dev.yaml
TURNSTILE_ALLOWED_HOSTNAMES=localhost
```

- Site: http://localhost:3000
- Admin: http://localhost:3000/admin/ (kullanıcı `.env`'deki `ADMIN_USERNAME` / `ADMIN_PASSWORD`)

Backend'i IDE'den çalıştırmak, testler ve frontend geliştirme sunucusu için ilgili klasörlerin README'lerine bak.

## Yayın

`main`'e push edilince GitHub Actions testleri ve Docker imajlarını derler. Sunucuda Dokploy compose dosyasını çalıştırır; trafik Cloudflare Tunnel üzerinden gelir, admin paneli Cloudflare Access ile korunur.
