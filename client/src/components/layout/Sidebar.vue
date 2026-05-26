<template>
  <aside class="sidebar">
    <!-- Logo er flyttet op i Header.vue — sidebar kun til navigation. -->
    <nav class="sidebar-nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="sidebar-link"
        active-class="sidebar-link-active"
      >
        <span>{{ item.label }}</span>
        <span>›</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup>
import { computed } from "vue";
import { auth } from "../../stores/auth";

// Adskiller admin- og client-navigation. Admin har sit eget /dashboard/admin
// område med tilhørende sub-routes; client har /dashboard.
// Log ud-knappen er flyttet op i Header.vue så den findes ét sted.
const navItems = computed(() => {
    if (auth.role === "admin") {
        return [
            { label: "Dashboard", path: "/dashboard/admin" },
            { label: "Kurser", path: "/dashboard/admin/courses" },
            { label: "Indstillinger", path: "/settings" },
        ];
    }

    return [
        { label: "Dashboard", path: "/dashboard" },
        { label: "Kurser", path: "/dashboard/courses" },
        { label: "Indstillinger", path: "/settings" },
    ];
});
</script>
