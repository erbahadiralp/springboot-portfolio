<!-- Giriş yapılmış sayfaların ortak iskeleti: kenar çubuğu, üst çubuk, sayfa başlığı,
     bildirimler ve onay penceresi. Sayfalar başlığı store.setHeader() ile ayarlar. -->
<template>
  <aside class="app-sidebar">
    <RouterLink :to="{ name: 'dashboard' }" class="sidebar-brand">
      <span class="brand-mark">&gt;_</span>
      <span>admin<span class="brand-sub">portfolio@panel</span></span>
    </RouterLink>
    <nav class="sidebar-nav">
      <template v-for="group in menu" :key="group.title">
        <div class="nav-group-title">// {{ group.title }}</div>
        <template v-for="item in group.items" :key="item.key">
          <a v-if="item.external" :href="item.href" target="_blank" class="nav-link-item">
            <i :class="`bi bi-${item.icon}`"></i>
            <span>{{ item.text }}</span>
            <i class="bi bi-arrow-up-right ext"></i>
          </a>
          <RouterLink v-else :to="item.to" class="nav-link-item" :class="{ active: item.key === activeKey }">
            <i :class="`bi bi-${item.icon}`"></i>
            <span>{{ item.text }}</span>
            <span v-if="item.badge && ui.unread" class="nav-badge" :title="`${ui.unread} okunmamış mesaj`">
              {{ ui.unread > 99 ? "99+" : ui.unread }}
            </span>
          </RouterLink>
        </template>
      </template>
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <img class="avatar" :src="ui.user.imageUrl || '/favicon.png'" alt="">
        <div class="min-w-0">
          <div class="name text-truncate">{{ ui.user.name }}</div>
          <div class="role">~ yönetici</div>
        </div>
        <button type="button" class="icon-btn" title="Çıkış yap" @click="logout(false)"><i class="bi bi-box-arrow-right"></i></button>
      </div>
    </div>
  </aside>
  <div class="sidebar-backdrop" @click="sidebarOpen = false"></div>

  <div class="app-main">
    <div class="app-topbar">
      <div class="topbar-inner">
        <button type="button" class="icon-btn burger" aria-label="Menüyü aç" @click="sidebarOpen = true"><i class="bi bi-list"></i></button>
        <div class="path">
          <span class="prompt">~</span>/<RouterLink :to="{ name: 'dashboard' }">admin</RouterLink><template
            v-for="(segment, i) in pathSegments" :key="i">/<RouterLink
              v-if="segment.to && i < pathSegments.length - 1" :to="segment.to">{{ segment.text }}</RouterLink><span
              v-else class="current">{{ segment.text }}</span></template>
        </div>
        <div class="topbar-actions">
          <button type="button" class="icon-btn" title="Tema değiştir" @click="toggleTheme">
            <i :class="`bi bi-${dark ? 'sun' : 'moon-stars'}`"></i>
          </button>
        </div>
      </div>
    </div>
    <main class="app-content">
      <div class="page-header">
        <div>
          <h1>{{ ui.header.title }}</h1>
          <p>{{ ui.header.subtitle }}</p>
        </div>
        <div class="page-actions">
          <template v-for="action in ui.header.actions" :key="action.text">
            <a v-if="action.href" :href="action.href" :target="action.external ? '_blank' : null" :class="`btn btn-${action.variant || 'primary'}`">
              <i :class="`bi bi-${action.icon}`"></i> {{ action.text }}
            </a>
            <RouterLink v-else :to="action.to" :class="`btn btn-${action.variant || 'primary'}`">
              <i :class="`bi bi-${action.icon}`"></i> {{ action.text }}
            </RouterLink>
          </template>
        </div>
      </div>
      <!-- Aynı bileşenle başka bir kayda geçildiğinde (ör. projeler -> eğitim) sayfa baştan kurulur -->
      <RouterView :key="route.path" />
    </main>
  </div>

  <div class="toast-container position-fixed bottom-0 end-0 p-3">
    <div v-for="t in ui.toasts" :key="t.id" class="toast app-toast align-items-center show" role="status">
      <div class="d-flex">
        <div class="toast-body">
          <i :class="`bi bi-${t.type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'} me-2`"></i>{{ t.message }}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" aria-label="Kapat" @click="dismissToast(t.id)"></button>
      </div>
    </div>
  </div>

  <template v-if="ui.dialog">
    <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" @click.self="closeDialog(false)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ ui.dialog.title }}</h5>
            <button type="button" class="btn-close" aria-label="Kapat" @click="closeDialog(false)"></button>
          </div>
          <div class="modal-body">{{ ui.dialog.message }}</div>
          <div class="modal-footer">
            <button type="button" class="btn btn-soft-secondary" @click="closeDialog(false)">Vazgeç</button>
            <button ref="confirmButton" type="button" :class="`btn btn-${ui.dialog.variant}`" @click="closeDialog(true)">
              {{ ui.dialog.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show"></div>
  </template>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { api } from "../../lib/api.js";
import { RESOURCES, resourceRoute } from "../resources.js";
import { closeDialog, dismissToast, logout, refreshUnreadCount, showUser, startSession, ui } from "../store.js";

const route = useRoute();

const menu = [
  { title: "genel", items: [{ key: "dashboard", to: { name: "dashboard" }, icon: "grid-1x2", text: "Genel Bakış" }] },
  {
    title: "içerik",
    items: Object.keys(RESOURCES).map((key) => ({ key, to: resourceRoute(key), icon: RESOURCES[key].icon, text: RESOURCES[key].title })),
  },
  {
    title: "diğer",
    items: [
      { key: "messages", to: { name: "messages" }, icon: "envelope", text: "Mesajlar", badge: true },
      { key: "account", to: { name: "account" }, icon: "shield-lock", text: "Hesap Ayarları" },
      { key: "site", href: "/", icon: "globe2", text: "Siteyi Görüntüle", external: true },
    ],
  },
];

// Aktif menü: içerik sayfalarında kaynak adı, diğerlerinde sayfa adı
const activeKey = computed(() => route.params.key || route.meta.key || route.name);

// Üst çubuktaki yol (~/admin/...). Sayfa vermediyse aktif bölümden üretilir.
const pathSegments = computed(() => ui.header.path
  || (route.name === "dashboard" ? [] : [{ text: route.params.key || route.name }]));

// Mobil menü: açıkken body'ye sınıf eklenir (admin.css), sayfa değişince kapanır
const sidebarOpen = ref(false);
watch(sidebarOpen, (open) => document.body.classList.toggle("sidebar-open", open));
watch(() => route.fullPath, () => (sidebarOpen.value = false));

// Tema: site ile aynı "theme" anahtarı (theme-init.js sayfa açılırken uygular)
const dark = ref(document.documentElement.getAttribute("data-bs-theme") === "dark");
function toggleTheme() {
  dark.value = !dark.value;
  const theme = dark.value ? "dark" : "light";
  document.documentElement.setAttribute("data-bs-theme", theme);
  localStorage.setItem("theme", theme);
}

// Onay penceresi: açılınca onay butonuna odaklan, Esc ile kapat
const confirmButton = ref(null);
watch(() => ui.dialog, async (dialog) => {
  document.body.classList.toggle("modal-open", !!dialog);
  if (dialog) {
    await nextTick();
    confirmButton.value?.focus();
  }
});
const onKeydown = (e) => {
  if (e.key === "Escape" && ui.dialog) closeDialog(false);
};

onMounted(() => {
  startSession();
  api.get("/about").then(showUser).catch(() => {});
  refreshUnreadCount();
  document.addEventListener("keydown", onKeydown);
});
onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKeydown);
  document.body.classList.remove("sidebar-open", "modal-open");
});
</script>
