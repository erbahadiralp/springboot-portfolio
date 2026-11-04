// Admin panelinin giriş noktası (admin/index.html).
import { createApp } from "vue";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.min.css";
import "./admin.css";
import App from "./App.vue";
import router from "./router.js";
import { bindRouter, logout } from "./store.js";
import { onUnauthorized, setLanguage } from "../lib/api.js";

// Admin paneli Türkçe: backend doğrulama mesajları da Türkçe gelsin
setLanguage("tr");
bindRouter(router);
// Herhangi bir istek 401 dönerse (token geçersiz / süresi dolmuş) oturumu kapat
onUnauthorized(() => logout(true));

createApp(App).use(router).mount("#app");
