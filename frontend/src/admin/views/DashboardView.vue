<!-- Genel bakış: bölüm sayıları, profil özeti ve son mesajlar. -->
<template>
  <StateBox v-if="state === 'loading'" loading />
  <StateBox v-else-if="state === 'error'" />
  <template v-else>
    <div class="row g-3 mb-4">
      <div v-for="(key, i) in listKeys" :key="key" class="col-6 col-md-4 col-xl">
        <RouterLink :to="{ name: 'list', params: { key } }" class="card stat-card mb-0">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div :class="`stat-icon bg-soft-${TONES[i % TONES.length]}`"><i :class="`bi bi-${RESOURCES[key].icon}`"></i></div>
              <i class="bi bi-arrow-up-right text-muted small"></i>
            </div>
            <div class="stat-value">{{ counts[key] }}</div>
            <div class="stat-label mt-1">{{ RESOURCES[key].title }}</div>
          </div>
        </RouterLink>
      </div>
    </div>

    <div class="row g-3">
      <div class="col-lg-4">
        <div class="card h-100 mb-0">
          <div class="card-header"><h4 class="card-title">Profil</h4></div>
          <div class="card-body">
            <div class="d-flex align-items-center gap-3 mb-3">
              <img v-if="about.imageUrl" :src="about.imageUrl" alt="" style="width: 64px; height: 64px; border-radius: 16px; object-fit: cover;">
              <div v-else class="avatar-initials bg-soft-primary" style="width: 64px; height: 64px;"><i class="bi bi-person fs-4"></i></div>
              <div class="min-w-0">
                <div class="fw-bold fs-5">{{ about.firstName }} {{ about.lastName }}</div>
                <div class="text-muted small">{{ about.shortDescriptionTr }}</div>
              </div>
            </div>
            <div class="d-flex flex-wrap gap-2 mb-4">
              <template v-for="lang in ['Tr', 'En']" :key="lang">
                <span v-if="about[`cvDocumentUrl${lang}`]" class="badge bg-soft-success"><i class="bi bi-check2"></i> CV {{ lang.toUpperCase() }}</span>
                <span v-else class="badge bg-soft-warning"><i class="bi bi-exclamation"></i> CV {{ lang.toUpperCase() }} eksik</span>
              </template>
            </div>
            <RouterLink :to="{ name: 'profile' }" class="btn btn-soft-primary w-100">
              <i class="bi bi-pencil"></i> Profili düzenle
            </RouterLink>
          </div>
        </div>
      </div>

      <div class="col-lg-8">
        <div class="card h-100 mb-0 overflow-hidden">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h4 class="card-title">Son mesajlar</h4>
            <RouterLink :to="{ name: 'messages' }" class="btn btn-sm btn-soft-secondary">Tümü <span class="mono">{{ messages.page.totalElements }}</span></RouterLink>
          </div>
          <template v-if="messages.content.length">
            <RouterLink v-for="m in messages.content" :key="m.id" :to="{ name: 'messages', hash: `#message-${m.id}` }"
                        class="message-link" :class="{ unread: !m.read }">
              <div class="d-flex justify-content-between gap-3">
                <strong class="text-truncate"><span v-if="!m.read" class="unread-dot" title="Okunmadı"></span>{{ m.fullName }}</strong>
                <span class="timestamp">{{ relativeTime(m.sentDate) }}</span>
              </div>
              <div class="text-muted small text-truncate">{{ m.subject }} — {{ m.message }}</div>
            </RouterLink>
          </template>
          <StateBox v-else icon="envelope-open" text="Henüz mesaj yok." />
        </div>
      </div>
    </div>
  </template>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import StateBox from "../components/StateBox.vue";
import { api } from "../../lib/api.js";
import { relativeTime } from "../../lib/dates.js";
import { RESOURCES } from "../resources.js";
import { handleError, setHeader } from "../store.js";

const TONES = ["primary", "info", "warning", "danger", "success"];
const listKeys = Object.keys(RESOURCES).filter((k) => !RESOURCES[k].singleton);

const state = ref("loading");
const about = ref({});
const messages = ref(null); // GET /contact-messages?page=0&size=5 yanıtı (en yeni 5 mesaj + toplam sayı)
const counts = reactive({});

const hour = new Date().getHours();
const greeting = hour < 6 ? "İyi geceler" : hour < 12 ? "Günaydın" : hour < 18 ? "İyi günler" : "İyi akşamlar";

onMounted(async () => {
  setHeader({
    title: "Genel Bakış",
    subtitle: `${greeting}. Sitedeki içeriklerin özeti burada.`,
    actions: [{ text: "Siteyi aç", icon: "globe2", href: "/", external: true, variant: "soft-primary" }],
  });
  try {
    const [aboutData, messagePage, ...lists] = await Promise.all([
      api.get("/about"),
      api.get("/contact-messages?page=0&size=5"),
      ...listKeys.map((k) => api.get(`/${k}`)),
    ]);
    about.value = aboutData || {};
    messages.value = messagePage;
    listKeys.forEach((k, i) => (counts[k] = lists[i].length));
    state.value = "ready";
  } catch (err) {
    if (err.status === 401) return;
    handleError(err);
    state.value = "error";
  }
});
</script>
