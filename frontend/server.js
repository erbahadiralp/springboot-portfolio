// Bağımlılıksız geliştirme sunucusu.
// - frontend klasöründeki statik dosyaları sunar
// - /api/* ve /static/* isteklerini backend'e (Spring Boot) iletir, böylece CORS gerekmez
//
// Kullanım: node server.js
// Ortam değişkenleri: PORT (varsayılan 3000), BACKEND_URL (varsayılan http://localhost:8080)
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const BACKEND_URL = new URL(process.env.BACKEND_URL || "http://localhost:8080");
const ROOT = __dirname;
const PROXY_PREFIXES = ["/api/", "/static/"];

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
};

function proxy(req, res) {
  const upstream = http.request(
    {
      hostname: BACKEND_URL.hostname,
      port: BACKEND_URL.port || 80,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: BACKEND_URL.host },
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode, upstreamRes.headers);
      upstreamRes.pipe(res);
    }
  );
  upstream.on("error", () => {
    res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ message: `Backend'e ulaşılamadı (${BACKEND_URL.origin})` }));
  });
  req.pipe(upstream);
}

// nginx'teki error_page'in karşılığı: errors/<kod>.html, doğru durum koduyla
function sendErrorPage(res, status) {
  fs.readFile(path.join(ROOT, "errors", `${status}.html`), (err, content) => {
    res.writeHead(status, { "Content-Type": err ? "text/plain; charset=utf-8" : MIME_TYPES[".html"] });
    res.end(err ? String(status) : content);
  });
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  if (urlPath.endsWith("/")) urlPath += "index.html";

  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT + path.sep) || path.basename(filePath) === "server.js") {
    return sendErrorPage(res, 403);
  }

  fs.readFile(filePath, (err, content) => {
    if (err) return sendErrorPage(res, 404);
    const type = MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(content);
  });
}

http
  .createServer((req, res) => {
    if (PROXY_PREFIXES.some((p) => req.url.startsWith(p))) return proxy(req, res);
    serveStatic(req, res);
  })
  .listen(PORT, () => {
    console.log(`Frontend: http://localhost:${PORT}`);
    console.log(`Admin:    http://localhost:${PORT}/admin/`);
    console.log(`/api ve /static istekleri -> ${BACKEND_URL.origin}`);
  });
