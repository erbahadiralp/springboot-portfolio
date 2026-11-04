// Vite yapılandırması.
//   public/        -> ana sayfa, hata sayfaları, robots/sitemap: olduğu gibi dist/'e kopyalanır
//   admin/         -> admin panelinin giriş sayfası (Vue uygulaması), /admin/ adresinde
//   src/admin/     -> admin panelinin Vue kodu; derlenince dist/admin/assets/ altına gider
// Geliştirme: `npm run dev` (http://localhost:5173). /api ve /static istekleri backend'e iletilir.
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

// Geliştirme sunucusunda nginx'in yaptığını taklit eder:
//   /                -> public/index.html (ana sayfa)
//   /admin/<sayfa>   -> admin/index.html (sayfaları Vue Router çizer)
function devRewrites() {
  return {
    name: "dev-rewrites",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url.split("?")[0];
        if (path === "/") {
          req.url = "/index.html";
        } else if (path === "/admin") {
          res.writeHead(301, { Location: "/admin/" });
          res.end();
          return;
        } else if (path.startsWith("/admin/") && !/\.[a-z0-9]+$/i.test(path)) {
          req.url = "/admin/index.html";
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [vue(), devRewrites()],
  appType: "mpa",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // public/assets (ana sayfanın dosyaları) ile karışmasın; admin dosyaları /admin altında kalsın
    assetsDir: "admin/assets",
    rollupOptions: {
      input: { admin: resolve(import.meta.dirname, "admin/index.html") },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": BACKEND_URL,
      "/static": BACKEND_URL,
    },
  },
});
