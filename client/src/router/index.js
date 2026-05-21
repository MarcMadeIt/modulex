import { createRouter, createWebHistory } from "vue-router";
import DashboardLayout from "../layouts/DashboardLayout.vue";

const routes = [
  {
    path: "/",
    redirect: "/login", // Sender automatisk brugere til login som start
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("../pages/Login.vue"),
  },
  {
    path: "/",
    redirect: "/signup", // Sender automatisk brugere til signup som start
  },
  {
    path: "/signup",
    name: "Signup",
    component: () => import("../pages/Signup.vue"),
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("../pages/Login.vue"),
  },
  {
    path: "/dashboard",
    component: DashboardLayout,
    children: [
      {
        path: "",
        name: "DashboardHome",
        component: () => import("../pages/dashboard/DashboardHome.vue"),
      },

      {
        path: "admin",
        name: "Admin",
        component: () => import("../pages/Admin.vue"),
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
    ],
  },
  {
    path: "/survey",
    name: "Survey",
    component: () => import("../pages/survey/Survey.vue"),
  },

];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
