<template>
  <aside class="sidebar">
    <div class="sidebar-logo">
      module<span style="color: var(--color-primary-orange)">x</span>
    </div>

    <nav class="sidebar-nav">
      <!--
        exact-active-class i stedet for active-class: ellers ville fx
        "/dashboard/admin" highlighte når man er på "/dashboard/admin/courses"
        fordi RouterLink default'er til prefix-match.
      -->
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="sidebar-link"
        active-class=""
        exact-active-class="sidebar-link-active"
      >
        <span>{{ item.label }}</span>
        <span>›</span>
      </RouterLink>
    </nav>

        <div class="sidebar-footer">
            <button type="button" class="sidebar-link" @click="handleLogout">
                <span>Log ud</span>
            </button>
        </div>
    </aside>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { auth } from "../../stores/auth";

const router = useRouter();

// Adskiller admin- og client-navigation. Admin har sit eget /dashboard/admin
// område med tilhørende sub-routes; client har /dashboard.
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

const handleLogout = async () => {
    await auth.logout();
    router.push("/login");
};
</script>
