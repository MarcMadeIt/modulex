<template>
  <div class="app-layout">
    <Sidebar />

    <div class="app-main">
      <Header />

      <router-view />
    </div>
  </div>
</template>

<script setup>
import Sidebar from "../components/layout/Sidebar.vue";
import Header from "../components/layout/Header.vue";
</script>
