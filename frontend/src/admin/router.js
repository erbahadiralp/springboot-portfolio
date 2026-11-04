// Admin paneli sayfaları (/admin/ altında). nginx, dosya olmayan her /admin/... adresini
// admin/index.html'e yönlendirir; hangi sayfanın çizileceğine buradaki tanımlar karar verir.
import { createRouter, createWebHistory } from "vue-router";
import { auth } from "../lib/api.js";
import AdminLayout from "./components/AdminLayout.vue";
import LoginView from "./views/LoginView.vue";
import DashboardView from "./views/DashboardView.vue";
import ListView from "./views/ListView.vue";
import FormView from "./views/FormView.vue";
import MessagesView from "./views/MessagesView.vue";
import AccountView from "./views/AccountView.vue";
import NotFoundView from "./views/NotFoundView.vue";

// Eski (Vue öncesi) adresler: yer imleri ve tarayıcı geçmişi bozulmasın
const legacy = [
  { path: "/index.html", redirect: "/" },
  { path: "/login.html", redirect: (to) => ({ name: "login", query: to.query }) },
  { path: "/messages.html", redirect: "/messages" },
  { path: "/account.html", redirect: "/account" },
  { path: "/list.html", redirect: (to) => (to.query.r ? `/${to.query.r}` : "/") },
  {
    path: "/form.html",
    redirect: (to) => {
      const { r, id } = to.query;
      if (!r) return "/";
      if (r === "about") return "/profile";
      return id ? `/${r}/${id}` : `/${r}/new`;
    },
  },
];

const router = createRouter({
  history: createWebHistory("/admin/"),
  routes: [
    { path: "/login", name: "login", component: LoginView, meta: { public: true } },
    ...legacy,
    {
      path: "/",
      component: AdminLayout,
      children: [
        { path: "", name: "dashboard", component: DashboardView },
        // Sabit adresler, içerik bölümlerinden (/:key) önce eşleşir
        { path: "messages", name: "messages", component: MessagesView },
        { path: "account", name: "account", component: AccountView },
        // Profil tekil kayıttır: liste yok, tek kayıt düzenlenir (GET/PUT /api/about)
        { path: "profile", name: "profile", component: FormView, meta: { key: "about" } },
        // İçerik bölümleri: /admin/projects, /admin/projects/new, /admin/projects/12
        { path: ":key", name: "list", component: ListView },
        { path: ":key/new", name: "create", component: FormView },
        { path: ":key/:id", name: "edit", component: FormView },
        { path: ":pathMatch(.*)*", name: "not-found", component: NotFoundView },
      ],
    },
  ],
  // Mesajlara #message-<id> ile gelindiğinde kaydırmayı MessagesView yapar (veri yüklenince)
  scrollBehavior: (to, from, saved) => saved || (to.hash ? false : { top: 0 }),
});

// Oturum yoksa ya da süresi dolmuşsa girişe; giriş yapmışken giriş sayfasına gelinirse panoya
router.beforeEach((to) => {
  const loggedIn = auth.isLoggedIn();
  if (!to.meta.public && !loggedIn) {
    const expired = !!auth.getToken(); // token var ama süresi dolmuş
    auth.clear();
    return { name: "login", query: expired ? { expired: 1 } : {} };
  }
  if (to.name === "login" && loggedIn) return { name: "dashboard" };
  return true;
});

export default router;
