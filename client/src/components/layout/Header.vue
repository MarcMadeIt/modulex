//TO DO: Hent brugerdata og hvis i headeren

<template>
  <header class="dashboard-topbar">
    <AppButton variant="light" @click="$emit('switch-mode')">
      Skift til admin
    </AppButton>

    <div class="notification-button">🔔</div>

    <div class="user-role">
      <div class="user-icon">👤</div>

      <div class="role-text">
        {{ userName }}
        <span>{{ userRole }}</span>
      </div>
    </div>
  </header>
</template>

<script setup>
import AppButton from "../ui/AppButton.vue";

defineProps({
  userName: {
    type: String,
    default: "Laura P.",
  },
  userRole: {
    type: String,
    default: "Partner VP",
  },
});

defineEmits(["switch-mode"]);
</script>
