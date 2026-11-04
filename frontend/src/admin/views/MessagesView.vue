<!-- İletişim formundan gelen mesajlar: sayfalı liste, okundu işaretleme, silme.
     Backend mesajları en yeni önce ve sayfalı döner (GET /api/contact-messages?page=&size=, size en fazla 50);
     cevap: { content, page: { number (0'dan), size, totalElements, totalPages } }
     "Okunmadı yap" yok: backend yalnızca PATCH /{id}/read (okundu yap) sunuyor. -->
<template>
  <div class="card overflow-hidden">
    <div class="list-toolbar">
      <span class="count">{{ summary }}</span>
    </div>

    <StateBox v-if="state === 'loading'" loading />
    <StateBox v-else-if="state === 'error'" />
    <StateBox v-else-if="!result.content.length" icon="envelope-open" text="Henüz mesaj gelmedi." />
    <template v-else>
      <div v-for="m in result.content" :id="`message-${m.id}`" :key="m.id" class="message-item" :class="{ unread: !m.read }">
        <div class="avatar-initials bg-soft-primary">{{ initials(m.fullName) }}</div>
        <div class="flex-grow-1 min-w-0">
          <div class="d-flex flex-wrap justify-content-between gap-2">
            <div class="min-w-0">
              <span v-if="!m.read" class="unread-dot" title="Okunmadı"></span>
              <strong>{{ m.fullName }}</strong>
              <a :href="`mailto:${m.email}`" class="text-muted small ms-1">{{ m.email }}</a>
              <span v-if="!m.read" class="badge bg-soft-primary ms-1">Yeni</span>
            </div>
            <span class="timestamp" :title="new Date(m.sentDate).toLocaleString('tr-TR')">{{ relativeTime(m.sentDate) }}</span>
          </div>
          <div v-if="m.subject" class="message-subject mt-1">{{ m.subject }}</div>
          <p class="message-body mb-2 mt-1">{{ m.message }}</p>
          <div class="message-actions">
            <a :href="`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || ''}`)}`" class="btn btn-sm btn-soft-primary">
              <i class="bi bi-reply"></i> Yanıtla
            </a>
            <button v-if="!m.read" type="button" class="btn btn-sm btn-soft-secondary" :disabled="busy.has(m.id)" @click="markRead(m)">
              <i class="bi bi-envelope-open"></i> Okundu yap
            </button>
            <button type="button" class="btn btn-sm btn-soft-danger" @click="remove(m)"><i class="bi bi-trash"></i> Sil</button>
          </div>
        </div>
      </div>
    </template>

    <div v-if="state === 'ready' && result.page.totalPages > 1" class="pager">
      <button type="button" class="btn btn-sm btn-soft-secondary" :disabled="result.page.number === 0" @click="load(current - 1, true)">
        <i class="bi bi-chevron-left"></i> Önceki
      </button>
      <span class="count">{{ pageInfo }}</span>
      <button type="button" class="btn btn-sm btn-soft-secondary" :disabled="result.page.number >= result.page.totalPages - 1" @click="load(current + 1, true)">
        Sonraki <i class="bi bi-chevron-right"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import StateBox from "../components/StateBox.vue";
import { api } from "../../lib/api.js";
import { relativeTime } from "../../lib/dates.js";
import { confirmDialog, handleError, refreshUnreadCount, setHeader, toast } from "../store.js";

const PAGE_SIZE = 10;
const route = useRoute();
const router = useRouter();

const state = ref("loading");
const result = ref(null);
const busy = reactive(new Set()); // "okundu yap" isteği süren mesajlar
// Adres çubuğunda 1'den başlar (?page=2), API'de 0'dan
let current = Math.max(0, (parseInt(route.query.page, 10) || 1) - 1);

const initials = (name) => (name || "?").split(/\s+/).filter(Boolean).slice(0, 2)
  .map((w) => w[0].toLocaleUpperCase("tr")).join("");

const summary = computed(() => {
  if (state.value !== "ready" || !result.value.page.totalElements) return "";
  const unread = result.value.content.filter((m) => !m.read).length;
  return `${result.value.page.totalElements} mesaj${unread ? ` · bu sayfada ${unread} okunmamış` : ""}`;
});

const pageInfo = computed(() => {
  const { content, page: { number, size, totalElements, totalPages } } = result.value;
  return `Sayfa ${number + 1} / ${totalPages} · ${number * size + 1}–${number * size + content.length} / ${totalElements}`;
});

async function load(pageNo, scrollTop = false) {
  try {
    const data = await api.get(`/contact-messages?page=${pageNo}&size=${PAGE_SIZE}`);
    // Silmeden sonra son sayfa boşaldıysa bir önceki sayfaya geç
    if (!data.content.length && pageNo > 0 && data.page.totalPages > 0) {
      return load(Math.min(pageNo - 1, data.page.totalPages - 1), scrollTop);
    }
    result.value = data;
    current = data.page.number;
    state.value = "ready";
    router.replace({ query: current > 0 ? { page: current + 1 } : {}, hash: route.hash });
    await nextTick();
    if (scrollTop) window.scrollTo({ top: 0, behavior: "smooth" });
    else if (route.hash) document.querySelector(route.hash)?.scrollIntoView({ block: "center" });
  } catch (err) {
    if (err.status === 401) return;
    handleError(err);
    state.value = "error";
  }
}

async function markRead(message) {
  busy.add(message.id);
  try {
    // Gövdesiz PATCH; güncel mesajı döner
    Object.assign(message, await api.patch(`/contact-messages/${message.id}/read`));
    refreshUnreadCount();
  } catch (err) {
    if (err.status === 401) return;
    if (err.status === 404) {
      toast("Bu mesaj artık yok; başka bir yerden silinmiş olabilir.", "error");
      refreshUnreadCount();
      load(current);
      return;
    }
    handleError(err);
  } finally {
    busy.delete(message.id);
  }
}

async function remove(message) {
  const ok = await confirmDialog({
    title: "Mesaj silinsin mi?",
    message: `${message.fullName} adlı kişinin "${message.subject || "konusuz"}" mesajı kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
  });
  if (!ok) return;
  try {
    await api.delete(`/contact-messages/${message.id}`);
    toast("Mesaj silindi.");
  } catch (err) {
    if (err.status === 401) return;
    if (err.status !== 404) return handleError(err);
    toast("Mesaj zaten silinmiş.", "error");
  }
  refreshUnreadCount();
  load(current);
}

onMounted(() => {
  setHeader({ title: "Mesajlar", subtitle: "İletişim formundan gelen mesajlar, en yeni en üstte" });
  load(current);
});
</script>
