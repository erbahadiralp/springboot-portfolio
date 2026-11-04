# Backend

Portfolyo sitesinin REST API'si. Endpoint'ler ve istek/yanıt biçimleri: [../frontend/API.md](../frontend/API.md)

## Teknolojiler

- Java 21, Spring Boot 4
- Spring Security + JWT (1 saat geçerli token, admin uçları için)
- Spring Data JPA (Hibernate), PostgreSQL, Flyway (`src/main/resources/db/migration`)
- Bean Validation; hata mesajları Türkçe ve İngilizce (`ValidationMessages*.properties`, `Accept-Language`'e göre)
- Cloudflare Turnstile (iletişim formunda bot koruması)

## Çalıştırma

En kolayı proje kökünden Docker Compose ile (kök [README](../README.md)).

IDE'den çalıştırmak için veritabanı yine Compose'dan gelir; kökte `compose.dev.yaml` açıkken (`.env`'de `COMPOSE_FILE=compose.yaml:compose.dev.yaml`):

```bash
docker compose up -d postgres
```

Ardından `PortfolioBackendApplication`'ı şu ortam değişkenleriyle başlat:

| Değişken | Açıklama |
|---|---|
| `JWT_SECRET` | Zorunlu, en az 32 bayt |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | İlk admin kullanıcısı (kullanıcı tablosu boşken oluşturulur) |
| `SPRING_DATASOURCE_PASSWORD` | Veritabanı şifresi; `.env`'deki `DB_PASSWORD` `portfolio123` değilse ver |
| `TURNSTILE_SECRET` | İletişim formu için; boşsa form mesaj kabul etmez |

API http://localhost:8080 adresinde açılır. Yüklenen dosyalar varsayılan olarak `./uploads` klasörüne yazılır (`UPLOAD_DIR`).

## Testler

Testler `localhost:5432` üzerindeki `portfolio_test` veritabanını kullanır. İlk seferde oluştur:

```bash
docker compose exec postgres createdb -U portfolio portfolio_test
```

```bash
./mvnw test
```

Windows'ta `.\mvnw.cmd test`. CI aynı testleri her push'ta kendi geçici veritabanıyla çalıştırır.
