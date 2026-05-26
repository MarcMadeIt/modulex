import { createRouter, createWebHistory } from "vue-router";
import DashboardLayout from "../layouts/DashboardLayout.vue";
import { auth } from "../stores/auth";
 
const routes = [
  { path: "/", redirect: "/login" },
  {
    path: "/login",
    name: "Login",
    component: () => import("../pages/Login.vue"),
  },
  {
    path: "/signup",
    name: "Signup",
    component: () => import("../pages/Signup.vue"),
  },
  {
    path: "/survey",
    name: "Survey",
    component: () => import("../pages/survey/Survey.vue"),
  },
  {
    path: "/dashboard",
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      // Klient-område. Admin der lander her bliver sendt videre til
      // /dashboard/admin af guarden nedenfor.
      {
        path: "",
        name: "DashboardHome",
        meta: { roles: ["client"] },
        component: () => import("../pages/dashboard/DashboardHome.vue"),
      },
      {
        path: "courses",
        name: "Courses",
        meta: { roles: ["client"] },
        component: () => import("../pages/dashboard/DashboardHome.vue"),
      },
      {
        path: "course/:id",
        name: "CourseView",
        meta: { roles: ["client"] },
        component: () => import("../pages/dashboard/CourseView.vue"),
        props: true,
      },

      // Admin-område. Client der lander her bliver sendt videre til /dashboard.
      {
        path: "admin",
        name: "Admin",
        meta: { roles: ["admin"] },
        component: () => import("../layouts/admin/AdminDashboardHome.vue"),
      },
      {
        path: "admin/courses",
        name: "AdminCourses",
        meta: { roles: ["admin"] },
        component: () => import("../layouts/admin/AdminCoursesDashboard.vue"),
      },

      // Legacy test-route — tilgængelig for begge roller (ikke beskyttet med
      // role-meta), men stadig under requiresAuth via parent.
      {
        path: "/dashboardtest",
        name: "Dashboardtest",
        component: () => import("../pages/Dashboard.vue"),
      },
    ],
  },
];
 
const router = createRouter({
  history: createWebHistory(),
  routes,
});
 
router.beforeEach(async (to) => {
  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth);
  if (!requiresAuth) return true;

  // Vent på at auth-tilstanden er fastlagt (auth.fetchMe har returneret).
  // Ellers kan en hård sideopdatering kortvarigt se "ikke logget ind"
  // før cookien er valideret mod serveren.
  if (!auth.state.ready) {
    await auth.fetchMe();
  }

  // Ikke logget ind -> til login med ?redirect=... så vi sender dem tilbage
  // efter de er logget ind som rette rolle.
  if (!auth.isLoggedIn) {
    return { name: "Login", query: { redirect: to.fullPath } };
  }

  // Forkert rolle -> send brugeren til deres egen dashboard. Vi forsøger ikke
  // at vise indholdet for den anden rolle; client ser kun /dashboard, admin
  // ser kun /dashboard/admin.
  const roleRule = [...to.matched].reverse().find((r) => r.meta.roles);
  if (roleRule && !roleRule.meta.roles.includes(auth.role)) {
    return auth.role === "admin" ? "/dashboard/admin" : "/dashboard";
  }

  return true;
});
 
export default router;