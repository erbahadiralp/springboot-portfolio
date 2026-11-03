# Backend'e (Spring Boot) iletilen her konumun ortak ayarları. default.conf içinden include edilir.
# Uzantısı .conf değil: nginx conf.d/*.conf dosyalarını kendiliğinden yükler, bu dosya tek başına yüklenmemeli.
proxy_pass http://backend:8080;
proxy_http_version 1.1;
proxy_set_header Host $host;
# $remote_addr, real_ip ayarı sayesinde Cloudflare arkasında da ziyaretçinin gerçek IP'sidir.
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_connect_timeout 5s;
proxy_read_timeout 60s;

# Backend'in kendi hata yanıtları (400, 404 ...) olduğu gibi geçer. nginx'in kendisi hata üretirse
# (backend kapalı, deneme sınırı) HTML sayfa yerine JSON döner; site ve admin paneli mesajı JSON'dan okur.
error_page 502 503 504 = @backend_unavailable;
error_page 429 = @too_many_requests;
