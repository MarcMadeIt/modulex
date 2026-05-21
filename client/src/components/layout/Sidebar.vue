<template>
  <aside class="sidebar">
    <div class="sidebar-logo">
      module<span style="color: var(--color-primary-orange)">x</span>
    </div>

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

    <div class="sidebar-footer">
      <RouterLink to="/logout" class="sidebar-link">
        <LogOut :size="18" />
        <span>Log ud</span>
      </RouterLink>
    </div>
  </aside>
</template>

<script setup>
import { LogOut } from "../../assets/icons/index.js";

const navItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
  },
  {
    label: "Kurser",
    path: "/courses",
  },
  {
    label: "Indstillinger",
    path: "/settings",
  },
];
</script>
