# Site dosyaları ve nginx ayarları imajın içine kopyalanır.
# Bind mount yerine imaj kullanmanın sebebi: Dokploy her deploy'da repo klasörünü silip yeniden indirir;
# mount edilen klasörü gören eski konteyner boş klasöre bakakalır. İmaj her deploy'da yeniden derlenir.
# Build context proje kökü (compose.yaml). Hangi dosyaların gireceği: Dockerfile.dockerignore
FROM nginx:stable

COPY nginx/default.conf nginx/backend-proxy.inc /etc/nginx/conf.d/
COPY frontend/ /usr/share/nginx/html/
