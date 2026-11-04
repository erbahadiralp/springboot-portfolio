# 1. aşama: frontend'i derle (Vue admin paneli + public/ altındaki ana sayfa -> dist/)
# Build context proje kökü (compose.yaml). Hangi dosyaların gireceği: Dockerfile.dockerignore
FROM node:24-alpine AS build
WORKDIR /app

# Önce sadece paket listesi: kod değişse de bağımlılık katmanı önbellekten gelir
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# 2. aşama: derlenmiş dosyaları ve nginx ayarlarını sunan imaj (sunucuda Node yok)
# Bind mount yerine imaj kullanmanın sebebi: Dokploy her deploy'da repo klasörünü silip yeniden indirir;
# mount edilen klasörü gören eski konteyner boş klasöre bakakalır. İmaj her deploy'da yeniden derlenir.
FROM nginx:stable

COPY nginx/default.conf nginx/backend-proxy.inc /etc/nginx/conf.d/
COPY --from=build /app/dist/ /usr/share/nginx/html/
