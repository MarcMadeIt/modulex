<template>
  <div class="app-layout" :class="{ 'app-layout-no-sidebar': !showSidebar }">
    <!--
      Sidebar er kun synlig i admin-området. Klient-/dashboard kører uden
      sidebar — header'en bærer både logo og brugerdata.
    -->
    <Sidebar v-if="showSidebar" />

    <div class="app-main">
      <Header />

      <router-view />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

import Sidebar from "../components/layout/Sidebar.vue";
import Header from "../components/layout/Header.vue";

const route = useRoute();

// Sidebar vises kun under admin-ruterne. Selve /dashboard og dens client-
// undersider får ingen sidebar — det er en bevidst forenkling så klienten
// kun ser kursusoversigten uden ekstra navigation.
const showSidebar = computed(() => route.path.startsWith("/dashboard/admin"));
</script>

<style scoped>
/* Når sidebar er skjult skal app-main ikke bevare sin venstre margin
   (defineret i layout.css som var(--sidebar-width)). */
.app-layout-no-sidebar :deep(.app-main) {
  margin-left: 0;
}
</style>
