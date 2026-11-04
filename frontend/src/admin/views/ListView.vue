<!-- Liste sayfası: /admin/<kaynak>. Arama, silme ve (projeler / sertifikalar için) sıralama. -->
<template>
  <StateBox v-if="!resource" text="Bilinmeyen bölüm." />
  <div v-else class="card overflow-hidden">
    <div class="list-toolbar">
      <div class="search-box">
        <i class="bi bi-search"></i>
        <input v-model="search" type="search" class="form-control" placeholder="Ara..." aria-label="Ara">
      </div>
      <span class="count">{{ countText }}</span>
    </div>

    <StateBox v-if="state === 'loading'" loading />
    <StateBox v-else-if="state === 'error'" />
    <StateBox v-else-if="!items.length" :icon="resource.icon" :text="`Henüz ${resource.singular} eklenmedi.`">
      <RouterLink :to="createRoute" class="btn btn-primary"><i class="bi bi-plus-lg"></i> İlk {{ resource.singular }} kaydını ekle</RouterLink>
    </StateBox>
    <StateBox v-else-if="!visible.length" icon="search" text="Aramanızla eşleşen kayıt yok." />
    <div v-else class="table-responsive">
      <table class="table table-hover table-clickable">
        <thead>
          <tr>
            <th v-if="reorderable" style="width: 64px">Sıra</th>
            <th v-for="c in resource.columns" :key="c.key" :style="c.width ? { width: c.width } : null">{{ c.label }}</th>
            <th class="text-end">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          <!-- Satıra tıklayınca düzenle; butonlar ve satırdaki linkler kendi işini yapar -->
          <tr v-for="item in visible" :key="item.id" @click="openRow($event, item)">
            <td v-if="reorderable"><span class="mono">{{ items.indexOf(item) + 1 }}</span></td>
            <td v-for="c in resource.columns" :key="c.key">
              <RenderCell v-if="c.render" :content="c.render(item)" />
              <template v-else-if="c.i18n">
                <span :class="{ 'cell-main': c === mainColumn }">
                  <template v-if="item[`${c.key}Tr`]">{{ item[`${c.key}Tr`] }}</template>
                  <span v-else class="text-muted">—</span>
                </span>
                <span v-if="item[`${c.key}En`] && item[`${c.key}En`] !== item[`${c.key}Tr`]" class="cell-sub">{{ item[`${c.key}En`] }}</span>
              </template>
              <template v-else>{{ item[c.key] }}</template>
            </td>
            <td class="row-actions">
              <span v-if="reorderable && !term" class="move-buttons">
                <button :id="`mv-${item.id}--1`" type="button" class="btn btn-sm btn-soft-secondary" title="Yukarı taşı" aria-label="Yukarı taşı"
                        :disabled="items.indexOf(item) === 0" @click="move(item, -1)"><i class="bi bi-arrow-up"></i></button>
                <button :id="`mv-${item.id}-1`" type="button" class="btn btn-sm btn-soft-secondary" title="Aşağı taşı" aria-label="Aşağı taşı"
                        :disabled="items.indexOf(item) === items.length - 1" @click="move(item, 1)"><i class="bi bi-arrow-down"></i></button>
              </span>
              <RouterLink :to="{ name: 'edit', params: { key, id: item.id } }" class="btn btn-sm btn-soft-primary" title="Düzenle">
                <i class="bi bi-pencil"></i>
              </RouterLink>
              <button type="button" class="btn btn-sm btn-soft-danger" title="Sil" @click="remove(item)"><i class="bi bi-trash"></i></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import RenderCell from "../components/RenderCell.js";
import StateBox from "../components/StateBox.vue";
import { api } from "../../lib/api.js";
import { RESOURCES } from "../resources.js";
import { confirmDialog, handleError, setHeader, toast } from "../store.js";

const route = useRoute();
const router = useRouter();
const key = route.params.key;
const resource = RESOURCES[key] && !RESOURCES[key].singleton ? RESOURCES[key] : null;
const createRoute = { name: "create", params: { key } };

const state = ref("loading"); // loading | ready | error
const items = ref([]);
const search = ref("");

// Projeler ve sertifikalar: sıra admin tarafından oklarla değiştirilir (PUT /api/<key>/order).
const reorderable = !!resource?.reorderable;
let savingOrder = false;

// İlk iki dilli sütun satırın "adı"dır; kalın gösterilir.
const mainColumn = resource?.columns.find((c) => c.i18n);

// Aramada eşleşecek metin: tüm sütunların ham değerleri
const searchText = (item) => resource.columns
  .flatMap((c) => (c.i18n ? [item[`${c.key}Tr`], item[`${c.key}En`]] : [item[c.key]]))
  .filter((v) => typeof v === "string" || typeof v === "number")
  .join(" ")
  .toLocaleLowerCase("tr");

const term = computed(() => search.value.trim().toLocaleLowerCase("tr"));
const visible = computed(() => (term.value ? items.value.filter((item) => searchText(item).includes(term.value)) : items.value));
const countText = computed(() => {
  if (state.value !== "ready") return "";
  return term.value ? `${visible.value.length} / ${items.value.length} kayıt` : `${items.value.length} kayıt`;
});

async function load() {
  try {
    items.value = await api.get(`/${key}`);
    state.value = "ready";
  } catch (err) {
    if (err.status === 401) return;
    handleError(err);
    state.value = "error";
  }
}

// Sırayı ekranda hemen değiştirir, sonra tüm listeyi yeni sırasıyla gönderir (PUT /order, 204).
// Backend tüm id'leri tekrarsız ve eksiksiz ister; liste başka yerden değiştiyse 400 döner ve liste yenilenir.
async function move(item, direction) {
  if (savingOrder) return;
  const from = items.value.indexOf(item);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= items.value.length) return;

  const previous = items.value.slice();
  items.value.splice(to, 0, items.value.splice(from, 1)[0]);
  focusMoveButton(item.id, direction);

  savingOrder = true;
  try {
    await api.put(`/${key}/order`, { ids: items.value.map((x) => x.id) });
  } catch (err) {
    items.value = previous;
    if (err.status === 401) return;
    toast(`Sıralama kaydedilemedi: ${err.message}`, "error");
    if (err.status === 400) load(); // kayıtlar değişmiş olabilir: güncel listeyi al
  } finally {
    savingOrder = false;
  }
}

// Klavyeyle art arda taşınabilsin; ok uçta pasif kaldıysa öbür oka geç
async function focusMoveButton(id, direction) {
  await nextTick();
  const button = document.getElementById(`mv-${id}-${direction}`);
  (button && !button.disabled ? button : document.getElementById(`mv-${id}-${-direction}`))?.focus();
}

async function remove(item) {
  const name = mainColumn ? item[`${mainColumn.key}Tr`] || "" : "";
  const ok = await confirmDialog({
    title: `${resource.singular[0].toLocaleUpperCase("tr")}${resource.singular.slice(1)} silinsin mi?`,
    message: `${name ? `"${name}" ` : "Bu kayıt "}kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
  });
  if (!ok) return;
  try {
    await api.delete(`/${key}/${item.id}`);
    items.value = items.value.filter((x) => x.id !== item.id);
    toast("Kayıt silindi.");
  } catch (err) {
    if (err.status === 401) return;
    if (err.status === 404) {
      // Zaten silinmiş: listeden de çıkar
      items.value = items.value.filter((x) => x.id !== item.id);
      toast("Kayıt zaten silinmiş.", "error");
      return;
    }
    handleError(err);
  }
}

function openRow(event, item) {
  if (event.target.closest("a, button")) return;
  router.push({ name: "edit", params: { key, id: item.id } });
}

onMounted(() => {
  if (!resource) {
    setHeader({ title: "Bulunamadı" });
    return;
  }
  setHeader({
    title: resource.title,
    subtitle: resource.subtitle,
    actions: [{ text: `Yeni ${resource.singular}`, icon: "plus-lg", to: createRoute }],
  });
  load();
});
</script>
