<template>
  <header class="dashboard-topbar">
    <!--
      Logo'et er flyttet hertil fra sidebar'en. På klient-/dashboard er
      sidebar'en skjult, så headeren bærer både brand-identitet og brugerdata.
    -->
    <RouterLink to="/dashboard" class="topbar-logo">
      module<span class="topbar-logo-accent">x</span>
    </RouterLink>

    <div class="topbar-right">
      <!--
        Kun admin-brugere ser knappen. Den vises kun når admin er på en
        ikke-admin side (typisk /dashboard) så de hurtigt kan hoppe tilbage
        til admin-området. Skjult på selve /dashboard/admin.
      -->
      <AppButton
        v-if="auth.role === 'admin' && route.path !== '/dashboard/admin'"
        variant="light"
        @click="goToAdmin"
      >
        Skift til admin
      </AppButton>

      <div class="notification-button">🔔</div>

      <button
        type="button"
        class="logout-button"
        title="Log ud"
        @click="handleLogout"
      >
        <LogOut :size="20" />
      </button>

      <div class="user-role">
        <div class="user-icon">👤</div>

        <div class="role-text">
          {{ displayName }}
          <span>{{ displayRole }}</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { LogOut } from "lucide-vue-next";
import AppButton from "../ui/AppButton.vue";
import { auth } from "../../stores/auth";

const route = useRoute();
const router = useRouter();

// Læs brugerdata direkte fra /auth/me-svaret der ligger på auth.state.user.
// Falder gracefully tilbage til email eller en kort label hvis felterne
// endnu ikke er populeret (fx for admin-brugere uden kontaktperson).
const displayName = computed(() => {
  const user = auth.state.user;
  if (!user) return "";
  return (
    user.contactPerson ||
    user.companyName ||
    user.email ||
    ""
  );
});

const displayRole = computed(() => {
  const user = auth.state.user;
  if (!user) return "";
  if (user.role === "admin") return "Administrator";
  // For klienter er companyName mest informativt som "rolle"-linje;
  // hvis kontaktperson også er vist ovenfor undgår vi at duplikere.
  if (user.companyName && user.companyName !== displayName.value) {
    return user.companyName;
  }
  return "Partner";
});

function goToAdmin() {
  router.push("/dashboard/admin");
}

async function handleLogout() {
  await auth.logout();
  router.push("/login");
}
</script>

<style scoped>
.dashboard-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4, 16px);
}

.topbar-logo {
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: inherit;
  text-decoration: none;
}

/* Lidt større logo på desktop. Bryder ved samme breakpoint som
   responsive.css bruger til at vippe sidebar/topbar over til desktop-layout. */
@media (min-width: 901px) {
  .topbar-logo {
    font-size: 2.5rem;
  }
}

.topbar-logo-accent {
  color: var(--color-primary-orange);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-3, 12px);
  margin-left: auto;
}

/* Matcher .notification-button-styling fra layout.css (48×48 paper-baggrund,
   blød skygge) — bare som en faktisk knap med hover/active-affordance. */
.logout-button {
  width: 48px;
  height: 48px;
  border: none;
  background-color: var(--color-bg-paper);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary, #555);
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.logout-button:hover {
  color: var(--color-primary-orange, #ff4d26);
  background-color: var(--color-bg-light, #fff7f4);
}

.logout-button:active {
  transform: translateY(1px);
}
</style>
