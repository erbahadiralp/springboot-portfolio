<!-- Giriş: POST /api/auth/login { username, password } -> { token }. Token 1 saat geçerli. -->
<template>
  <div class="auth">
    <div class="auth-form">
      <a href="/" class="brand">
        <span class="brand-mark">&gt;_</span>
        <span>admin</span>
      </a>

      <h1>Tekrar hoş geldin</h1>
      <p class="text-muted mb-4">Portfolyo içeriklerini yönetmek için giriş yap.</p>

      <div v-if="error" class="alert alert-danger py-2" role="alert">{{ error }}</div>
      <div v-else-if="expired" class="alert alert-warning py-2 small" role="status">
        Oturum süren doldu. Devam etmek için yeniden giriş yap.
      </div>

      <form @submit.prevent="login">
        <div class="mb-3">
          <label class="form-label" for="username">Kullanıcı adı</label>
          <input id="username" v-model="username" type="text" class="form-control" autocomplete="username" required autofocus>
        </div>
        <div class="mb-4">
          <label class="form-label" for="password">Şifre</label>
          <input id="password" ref="passwordInput" v-model="password" type="password" class="form-control" autocomplete="current-password" required>
        </div>
        <button type="submit" class="btn btn-primary w-100 py-2" :disabled="busy">Giriş yap <i class="bi bi-arrow-right"></i></button>
      </form>

      <a href="/" class="text-muted small mt-4"><i class="bi bi-arrow-left"></i> Siteye dön</a>
    </div>

    <div class="auth-art" aria-hidden="true">
      <div class="terminal">
        <div class="terminal-bar"><span></span><span></span><span></span></div>
        <div class="terminal-body">
          <div><span class="p">$</span> <span class="hl">ssh admin@bahadiralper.com</span></div>
          <div><span class="ok">✓</span> bağlantı kuruldu</div>
          <div><span class="p">$</span> <span class="hl">portfolio status</span></div>
          <div>eğitim · deneyim · projeler · sertifikalar</div>
          <div><span class="ok">●</span> yayında</div>
          <div><span class="p">$</span> <span class="cursor"></span></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, auth } from "../../lib/api.js";

const route = useRoute();
const router = useRouter();

const username = ref("");
const password = ref("");
const passwordInput = ref(null);
const error = ref("");
const busy = ref(false);
const expired = !!route.query.expired;

async function login() {
  error.value = "";
  if (!username.value.trim() || !password.value) {
    error.value = "Kullanıcı adı ve şifre gerekli.";
    return;
  }
  busy.value = true;
  try {
    const { token } = await api.post("/auth/login", { username: username.value.trim(), password: password.value });
    auth.setToken(token);
    router.replace({ name: "dashboard" });
  } catch (err) {
    // 401: backend "Kullanıcı adı veya şifre hatalı" döner
    error.value = err.status === 401 || err.status === 400
      ? err.message || "Kullanıcı adı veya şifre hatalı."
      : err.status === 429
        ? "Çok fazla giriş denemesi. Lütfen bir dakika bekleyip tekrar deneyin."
        : "Giriş yapılamadı. Sunucuya ulaşılamıyor olabilir.";
    passwordInput.value?.select();
  } finally {
    busy.value = false;
  }
}

onMounted(() => {
  document.title = "Giriş · Admin";
  auth.clear(); // süresi dolmuş token kalmasın (geçerli token varsa router zaten panoya gönderir)
});
</script>
