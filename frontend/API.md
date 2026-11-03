# Portfolio Backend API

Bu belge `src/main/java/com/bahadiralper/portfolio` altındaki gerçek koddan (controller, dto, service, exception, security) çıkarıldı. Kaynak backend'dir; burada yazanla kod çelişirse kod doğrudur.

- Tüm adresler göreli: `/api/...` ve `/static/...`. Canlıda nginx aynı alan adından hem frontend'i hem backend'i sunar; geliştirmede `frontend/server.js` aynı işi yapar.
- Gövdeler JSON (`Content-Type: application/json`), dosya yükleme hariç.
- Tarihler `LocalDate` → `"YYYY-MM-DD"`; mesaj tarihi `LocalDateTime` → `"YYYY-MM-DDTHH:mm:ss(.ffffff)"` (saat dilimi yok, sunucu saati; compose'da `TZ: Europe/Istanbul`).
- Bilinmeyen JSON alanları yok sayılır (Spring Boot varsayılanı).

## Yetki

| Kural (SecurityConfig) | |
|---|---|
| `POST /api/auth/login` | herkese açık |
| `POST /api/contact-messages` | herkese açık |
| `GET /api/about`, `GET /api/projects/**`, `GET /api/experiences/**`, `GET /api/educations/**`, `GET /api/certificates/**`, `GET /api/skills/**` | herkese açık |
| `GET /static/**` | herkese açık (yüklenen dosyalar) |
| `GET /actuator/health`, `/error` | herkese açık |
| Geri kalan her şey | `Authorization: Bearer <token>` gerekli |

- Token: JWT (HS), `sub` = kullanıcı adı, geçerlilik **1 saat** (`app.jwt.expiration-ms: 3600000`). Yenileme (refresh) endpoint'i yok; süre dolunca yeniden giriş gerekir.
- Token yok, geçersiz ya da süresi dolmuşsa korumalı endpoint **401 döner, gövde boştur** (`HttpStatusEntryPoint`). Geçersiz token herkese açık endpoint'lerde hataya yol açmaz, istek anonim olarak işlenir.
- Tek kullanıcı vardır (`users.id = 1`). İlk açılışta `ADMIN_USERNAME` / `ADMIN_PASSWORD` ortam değişkenleriyle oluşturulur; tablo doluysa dokunulmaz.

## Hata biçimi

`GlobalExceptionHandler` şu gövdeyi döner:

```json
{ "message": "Doğrulama hatası", "errors": { "titleTr": "Bu alan boş bırakılamaz." } }
```

| Durum | Ne zaman | Gövde |
|---|---|---|
| 400 | `@Valid` doğrulaması (`MethodArgumentNotValidException`) | `message: "Doğrulama hatası"`, `errors`: `{ alanAdı: mesaj }`. Alan adı DTO'daki adıdır; iç içe listelerde `responsibilities[0].descriptionTr` biçiminde. Mesajlar `src/main/resources/ValidationMessages[_tr].properties`'ten gelir; dil isteğin `Accept-Language` başlığına göre seçilir (`tr` → Türkçe, diğerleri → İngilizce, ör. `Bu alan boş bırakılamaz.` / `This field is required.`). DTO'da `message` yazılan kısıtlar (şifre kuralları) her zaman Türkçedir. |
| 400 | `BadRequestException` (iş kuralı) | `message` dolu, `errors: null` |
| 401 | `UnauthorizedException` (yanlış giriş) | `message` dolu, `errors: null` |
| 401 | Token yok / geçersiz / süresi dolmuş | **boş gövde** |
| 404 | `ResourceNotFoundException` | `message` dolu (ör. `"Proje bulunamadı:7"`), `errors: null` |
| 413 | `MaxUploadSizeExceededException` (dosya > 10 MB) | `message: "Dosya boyutu çok büyük (en fazla 10 MB)."`, `errors: null` |

Handler'da karşılığı olmayan durumlar Spring Boot'un varsayılan hata gövdesiyle döner (`{timestamp, status, error, path}`, `message` alanı yok):

- Bozuk JSON, geçersiz tarih biçimi, yanlış tip (`HttpMessageNotReadableException`) → 400
- `/api/files`'a `file` parçası olmadan istek → 400
- 12 MB'tan büyük istek: nginx üzerinden HTML 413 (`client_max_body_size 12m`); doğrudan 8080'e gönderilirse bağlantı yanıtsız kalabilir
- Desteklenmeyen yöntem → 405, bilinmeyen yol → 404 (token yoksa önce 401)
- Beklenmeyen hata (ör. dosya diske yazılamadı) → 500

---

## Auth

### `POST /api/auth/login` — herkese açık

İstek (`LoginRequestDTO`):

| Alan | Tip | Kural |
|---|---|---|
| `username` | string | `@NotBlank` |
| `password` | string | `@NotBlank` |

Cevap `200` (`LoginResponseDTO`): `{ "token": "<jwt>" }`

Hatalar: `400` doğrulama; `401` `{"message": "Kullanıcı adı veya şifre hatalı"}` (kullanıcı yoksa da aynı mesaj).

### `PUT /api/auth/password` — token gerekli

İstek (`ChangePasswordRequestDTO`):

| Alan | Tip | Kural |
|---|---|---|
| `currentPassword` | string | `@NotBlank` |
| `newPassword` | string | `@NotBlank`; `@Size(min=12, max=72)` → "Şifre 12 ile 72 karakter arasında olmalı"; `@Pattern("^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$")` → "Şifre en az bir küçük harf, bir büyük harf ve bir sembol içermeli" |

Cevap: `204`, gövde yok. Mevcut token geçerli kalır.

Hatalar: `400` doğrulama; `400` `{"message": "Mevcut şifre hatalı"}`; `401`.

---

## Hakkımda (tekil kayıt, id = 1)

### `GET /api/about` — herkese açık

Cevap `200` (`AboutResponseDTO`):

```json
{
  "firstName": "Bahadır Alp", "lastName": "Er",
  "address": null, "phone": null, "email": null,
  "descriptionTr": null, "descriptionEn": null,
  "shortDescriptionTr": null, "shortDescriptionEn": null,
  "imageUrl": null,
  "cvDocumentUrlTr": null, "cvOriginalFileNameTr": null,
  "cvDocumentUrlEn": null, "cvOriginalFileNameEn": null
}
```

`id` dönmez. Kayıt yoksa `404` "Hakkımda bulunamadı:1" (migration kaydı oluşturur).

### `PUT /api/about` — token gerekli

Tüm alanları **değiştirir**: gönderilmeyen alan `null` olur. Kısmi güncelleme için önce `GET` ile okunup tüm alanlar geri gönderilmelidir.

İstek (`AboutRequestDTO`):

| Alan | Kural |
|---|---|
| `firstName` | `@NotBlank`, `@Size(max=50)` |
| `lastName` | `@NotBlank`, `@Size(max=50)` |
| `address` | `@Size(max=50)` |
| `phone` | `@Size(max=50)` |
| `email` | `@Size(max=100)` (e-posta biçimi denetlenmez) |
| `descriptionTr`, `descriptionEn`, `shortDescriptionTr`, `shortDescriptionEn` | — (TEXT) |
| `imageUrl` | — (`/api/files`'tan dönen url) |
| `cvDocumentUrlTr`, `cvDocumentUrlEn` | — |
| `cvOriginalFileNameTr`, `cvOriginalFileNameEn` | — |

Cevap `200`: güncel `AboutResponseDTO`. Hatalar: `400`, `401`.

---

## Ortak CRUD kalıbı

`educations`, `experiences`, `projects`, `certificates`, `skills` için:

| Yöntem | Yol | Yetki | Cevap |
|---|---|---|---|
| GET | `/api/<kaynak>` | herkese açık | `200` liste (sıralama aşağıda) |
| GET | `/api/<kaynak>/{id}` | herkese açık | `200` kayıt, `404` |
| POST | `/api/<kaynak>` | token | `201` oluşturulan kayıt; `400` |
| PUT | `/api/<kaynak>/{id}` | token | `200` güncel kayıt; `400`, `404`. Tüm alanları değiştirir. |
| DELETE | `/api/<kaynak>/{id}` | token | `204`; `404` |

`id` ve `displayOrder` istek DTO'larında yoktur; gönderilirse yok sayılır. `{id}` tam sayı değilse Spring varsayılan `400` döner.

### Eğitimler — `/api/educations`

Liste sırası: `startDate` azalan (yeniden eskiye). `displayOrder` yok.

İstek (`EducationRequestDTO`):

| Alan | Kural |
|---|---|
| `institutionTr`, `institutionEn` | `@NotBlank`, `@Size(max=100)` |
| `departmentTr`, `departmentEn` | `@Size(max=100)` |
| `descriptionTr`, `descriptionEn` | — |
| `imageUrl` | — |
| `startDate` | `@NotNull`, `"YYYY-MM-DD"` |
| `endDate` | isteğe bağlı; `startDate`'ten önceyse `400` "Bitiş tarihi Başlangıç tarihinden önce olamaz" |

Cevap (`EducationResponseDTO`): `id` + yukarıdaki alanların hepsi.

Hata mesajı: `404` "Eğitim bulunamadı:{id}".

### Deneyimler — `/api/experiences`

Liste sırası: `startDate` azalan. Sorumluluklar her kaydın içinde, kendi sıralarıyla (`displayOrder`, dönmez) gelir.

İstek (`ExperienceRequestDTO`):

| Alan | Kural |
|---|---|
| `titleTr`, `titleEn` | `@NotBlank`, `@Size(max=100)` |
| `company` | `@NotBlank`, `@Size(max=100)` (tek dilli) |
| `locationTr`, `locationEn` | `@Size(max=100)` |
| `imageUrl` | — |
| `startDate` | `@NotNull` |
| `endDate` | isteğe bağlı; `startDate`'ten önceyse `400` "Bitiş tarihi Başlangıç tarihinden önce olamaz" |
| `responsibilities` | `@NotNull`, `@Valid`; boş liste `[]` olabilir |
| `responsibilities[].descriptionTr` | `@NotBlank` |
| `responsibilities[].descriptionEn` | `@NotBlank` |

Sorumluluk istek DTO'sunda `id` yoktur. `PUT`'ta mevcut sorumlulukların **hepsi silinir** ve gönderilen liste, dizideki sırayla yeniden oluşturulur (id'ler değişir).

Cevap (`ExperienceResponseDTO`): `id`, yukarıdaki alanlar, `responsibilities: [{ id, descriptionTr, descriptionEn }]`.

Hata mesajı: `404` "Deneyim bulunamadı:{id}".

### Projeler — `/api/projects`

Liste sırası: `displayOrder` artan. Yeni kayıt sona eklenir (son `displayOrder` + 1).

İstek (`ProjectRequestDTO`):

| Alan | Kural |
|---|---|
| `titleTr`, `titleEn` | `@NotBlank`, `@Size(max=150)` |
| `descriptionTr`, `descriptionEn` | — |
| `tools` | — (virgülle ayrılmış metin) |
| `link`, `demoUrl` | — (biçim denetlenmez) |
| `imageUrl` | — |

Cevap (`ProjectResponseDTO`): `id`, yukarıdaki alanlar, `displayOrder` (int).

Hata mesajı: `404` "Proje bulunamadı:{id}".

### Sertifikalar — `/api/certificates`

Liste sırası: `displayOrder` artan. Yeni kayıt sona eklenir.

İstek (`CertificateRequestDTO`):

| Alan | Kural |
|---|---|
| `titleTr`, `titleEn` | `@NotBlank`, `@Size(max=200)` |
| `issuer` | `@Size(max=100)` (tek dilli) |
| `issueDate` | isteğe bağlı, `"YYYY-MM-DD"` |
| `pdfUrl` | — |

Cevap (`CertificateResponseDTO`): `id`, yukarıdaki alanlar, `displayOrder`.

Hata mesajı: `404` "Sertifika bulunamadı:{id}".

### Sıralama — `PUT /api/projects/order`, `PUT /api/certificates/order` — token gerekli

İstek (`ReorderRequestDTO`): `{ "ids": [3, 1, 2] }` — `@NotNull`. Liste, mevcut **tüm** kayıtların id'lerini **tekrarsız** ve **eksiksiz** içermeli; dizideki konum yeni `displayOrder` olur (0'dan başlar).

Cevap: `204`. Hatalar: `400` "Tekrar eden id(ler) var." / "Eksik ya da fazla id var" / doğrulama (`ids` null); `401`.

### Yetenekler — `/api/skills`

Liste sırası: belirtilmemiş (`findAll()`, pratikte ekleme sırası).

İstek (`SkillRequestDTO`):

| Alan | Kural |
|---|---|
| `nameTr`, `nameEn` | `@NotBlank`, `@Size(max=100)` |
| `category` | `@NotBlank`, `@Size(max=100)` (tek dilli serbest metin) |

Cevap (`SkillResponseDTO`): `{ id, nameTr, nameEn, category }`.

Hata mesajı: `404` "Skill bulunamadı:{id}".

---

## İletişim mesajları — `/api/contact-messages`

### `POST /api/contact-messages` — herkese açık

İstek (`ContactMessageRequestDTO`):

| Alan | Kural |
|---|---|
| `fullName` | `@NotBlank`, `@Size(max=100)` |
| `email` | `@NotBlank`, `@Email`, `@Size(max=100)` |
| `subject` | `@NotBlank`, `@Size(max=200)` |
| `message` | `@NotBlank`, `@Size(max=5000)` |
| `turnstileToken` | `@NotBlank`, `@Size(max=2048)` — Cloudflare Turnstile widget'ının verdiği token |

Alan doğrulaması geçtikten sonra `TurnstileService` token'ı Cloudflare'in `siteverify` adresinde `TURNSTILE_SECRET` ile doğrular. Cloudflare reddederse, token `TURNSTILE_ALLOWED_HOSTNAMES` dışındaki bir alan adında üretildiyse, secret boşsa ya da Cloudflare'e ulaşılamazsa: `400 {"message": "Doğrulama başarısız. Lütfen tekrar deneyin.", "errors": null}`. Token tek kullanımlıktır ve yaklaşık 5 dakika geçerlidir.

Cevap `201` (`ContactMessageResponseDTO`): `{ id, fullName, email, subject, message, sentDate, read: false }`. Token kaydedilmez.

Hız sınırı backend'de değil, nginx'te: IP başına dakikada 3 istek (anlık 2 fazlası). Aşılırsa `429 {"message": "...", "errors": null}`.

### `GET /api/contact-messages?page=0&size=20` — token gerekli

- `page`: 0'dan başlar, varsayılan 0; negatifse 0 yapılır.
- `size`: varsayılan 20; 50'den büyükse 50, 1'den küçükse 20 yapılır.
- Sıra: `sentDate` azalan (en yeni önce).
- `sentDate` UTC olarak, sonunda `Z` ile gelir; `new Date(sentDate)` tarayıcının saat dilimine doğru çevirir.

Cevap `200`: Spring Data `PagedModel<ContactMessageResponseDTO>` (sabit biçim):

```json
{
  "content": [ { "id": 5, "fullName": "...", "email": "...", "subject": "...", "message": "...", "sentDate": "2026-11-02T07:15:00.123Z", "read": false } ],
  "page": { "size": 20, "number": 0, "totalElements": 14, "totalPages": 1 }
}
```

Sayfa bilgileri `page` nesnesindedir: sayfa numarası `page.number` (0'dan), boyut `page.size`.

### `GET /api/contact-messages/unread-count` — token gerekli

Cevap `200`: düz sayı, ör. `3` (nesne değil).

### `PATCH /api/contact-messages/{id}/read` — token gerekli

Gövde yok. Mesajı **okundu** yapar (geri alma / "okunmadı" yapma endpoint'i yok). Cevap `200`: güncel mesaj. `404` "Mesaj bulunamadı:{id}".

### `DELETE /api/contact-messages/{id}` — token gerekli

Cevap `204`; `404`.

---

## Dosya yükleme

### `POST /api/files` — token gerekli

`multipart/form-data`, tek parça: `file`.

Kurallar (`FileStorageService`):

| Kural | Hata (`400`, `message`) |
|---|---|
| Dosya boş olamaz | "Dosya boş" |
| Ad uzantı içermeli | "Dosya adı geçersiz" |
| Uzantı: `png`, `jpg`, `jpeg`, `webp`, `pdf` (büyük/küçük harf duyarsız) | "Bu dosya türüne izin verilmiyor." |
| PDF en fazla 10 MB | Pratikte Spring sınırı (`max-file-size: 10MB`) önce devreye girer: **413** "Dosya boyutu çok büyük (en fazla 10 MB)." Servisteki "PDF en fazla 10 MB olabilir" (400) mesajına ulaşılmaz. |
| Görsel en fazla 5 MB | "Görsel en fazla 5 MB olabilir" |
| İçerik imzası uzantıyla uyuşmalı (PNG `89 50 4E 47`, JPEG `FF D8 FF`, PDF `%PDF`, WebP `RIFF....WEBP`) | "Dosya içeriği uzantısıyla uyuşmuyor" |

Ayrıca Spring sınırları: dosya 10 MB (aşılırsa `413`, JSON gövdeli, bkz. "Hata biçimi"), istek 12 MB. nginx `client_max_body_size 12m`; bunu aşan istek nginx'in HTML 413 sayfasını alır.

Cevap `201` (`FileUploadResponseDTO`): `{ "url": "/static/<uuid>.<uzantı>", "originalFileName": "cv.pdf" }`.

Dosya kaydı hiçbir kayda bağlanmaz: dönen `url` ilgili alana (`imageUrl`, `pdfUrl`, `cvDocumentUrlTr` …) yazılıp kayıt ayrıca kaydedilmelidir. Kayıt değişse ya da silinse de eski dosya diskte kalır.

### `GET /static/<dosya>` — herkese açık

Yüklenen dosyayı sunar (`WebConfig`, `UPLOAD_DIR`).
