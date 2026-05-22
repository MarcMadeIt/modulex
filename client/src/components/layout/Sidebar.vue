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
            <button type="button" class="sidebar-link" @click="handleLogout">
                <span>Log ud</span>
            </button>
        </div>
    </aside>
</template>

<script setup>
import { useRouter } from "vue-router";
import { auth } from "../../stores/auth";
const router = useRouter();
const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Kurser', path: '/courses' },
    { label: 'Indstillinger', path: '/settings' }
];
const handleLogout = async () => {
    await auth.logout();
    router.push("/login"); 
};
</script>
