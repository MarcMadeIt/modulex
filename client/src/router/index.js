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
      {
        path: "",
        name: "DashboardHome",
        meta: { roles: ["client", "admin"] }, 
        component: () => import("../pages/dashboard/DashboardHome.vue"),
      },
      {
        path: "admin",
        name: "Admin",
        meta: { roles: ["admin"] }, 
        component: () => import("../layouts/admin/AdminDashboardHome.vue"),
      },
      {
        path: "/dashboardtest",
        name: "Dashboardtest",
        component: () => import("../pages/Dashboard.vue"),
      },
      {
        path: "course/:id",
        name: "CourseView",
        component: () => import("../pages/dashboard/CourseView.vue"),
        props: true,
      },
      {
        path: "courses",
        name: "Courses",
        meta: { roles: ["client", "admin"] },
        component: () => import("../pages/dashboard/DashboardHome.vue"),
      },
    ],
  },
];
 
const router = createRouter({
  history: createWebHistory(),
  routes,
});
 
router.beforeEach((to) => {
  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth);
  if (!requiresAuth) return true;
 
  
  if (!auth.isLoggedIn) {
    return { name: "Login", query: { redirect: to.fullPath } };
  }
 
  
  const roleRule = [...to.matched].reverse().find((r) => r.meta.roles);
  if (roleRule && !roleRule.meta.roles.includes(auth.role)) {
    return auth.role === "admin" ? "/dashboard/admin" : "/dashboard";
  }
 
  return true;
});
 
export default router;