<template>
  <div
    style="
      min-height: 100vh;
      background-color: #f4f5f6;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: system-ui, sans-serif;
    "
  >
    <div class="card" style="max-width: 560px; width: 100%; text-align: center">
      <div style="margin-bottom: 32px">
        <h1
          style="
            font-size: 2.5rem;
            font-weight: 800;
            color: #333;
            margin: 0;
            font-family: ui-monospace, monospace;
          "
        >
          module<span style="color: #e65c00">x</span>
        </h1>
        <h2
          style="
            font-size: 2rem;
            font-weight: 900;
            color: #111;
            margin: 8px 0 0 0;
          "
        >
          Academy
        </h2>
        <p
          style="
            color: #777;
            font-size: 0.9rem;
            font-weight: 500;
            margin: 6px 0 0 0;
          "
        >
          Tilmeld dig som studerende
        </p>
      </div>

      <form
        @submit.prevent="handleSignup"
        style="
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 20px;
        "
      >
        <div class="input-group">
          <label for="email" class="input-label">Email adresse</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="navn@firma.dk"
            class="input"
            :readonly="emailLocked"
            :style="
              emailLocked
                ? {
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280',
                    cursor: 'not-allowed',
                  }
                : {}
            "
            required
          />
          <p
            v-if="emailLocked"
            style="
              margin-top: 8px;
              font-size: 0.75rem;
              color: #9ca3af;
              font-weight: 500;
            "
          >
            🔒 Email er hentet fra dit registreringslink og kan ikke ændres.
          </p>
        </div>

        <div class="input-group">
          <label for="password" class="input-label">Adgangskode</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="input"
            required
          />

          <div style="margin-top: 10px; line-height: 1.6">
            <p
              :style="{
                fontSize: '0.8rem',
                fontWeight: hasLength ? '700' : '500',
                color: hasLength ? '#10b981' : '#e04f26',
                margin: '0 0 4px 0',
                transition: 'color 0.2s',
              }"
            >
              {{ hasLength ? '✓ Mindst 8 tegn' : '✗ Mindst 8 tegn' }}
            </p>
            <p
              :style="{
                fontSize: '0.8rem',
                fontWeight: hasUpper ? '700' : '500',
                color: hasUpper ? '#10b981' : '#e04f26',
                margin: '0 0 4px 0',
                transition: 'color 0.2s',
              }"
            >
              {{ hasUpper ? '✓ Stort bogstav (A-Z)' : '✗ Stort bogstav (A-Z)' }}
            </p>
            <p
              :style="{
                fontSize: '0.8rem',
                fontWeight: hasNumber ? '700' : '500',
                color: hasNumber ? '#10b981' : '#e04f26',
                margin: '0 0 4px 0',
                transition: 'color 0.2s',
              }"
            >
              {{ hasNumber ? '✓ Tal (0-9)' : '✗ Tal (0-9)' }}
            </p>
            <p
              :style="{
                fontSize: '0.8rem',
                fontWeight: hasSpecial ? '700' : '500',
                color: hasSpecial ? '#10b981' : '#e04f26',
                margin: '0',
                transition: 'color 0.2s',
              }"
            >
              {{ hasSpecial ? '✓ Specialtegn (!@#$%)' : '✗ Specialtegn (!@#$%)' }}
            </p>
          </div>
        </div>

        <div class="input-group">
          <label for="confirmPassword" class="input-label"
            >Gentag adgangskode</label
          >
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            class="input"
            required
          />

          <p
            v-if="confirmPassword"
            :style="{
              marginTop: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: password === confirmPassword ? '#10b981' : '#e04f26',
              textAlign: 'center',
              margin: '8px 0 0 0',
              transition: 'color 0.2s',
            }"
          >
            {{ password === confirmPassword ? '✓ Adgangskoderne matcher' : '✗ Adgangskoderne er ikke ens' }}
          </p>
        </div>

        <p
          v-if="errorMessage"
          style="
            color: #e04f26;
            font-size: 0.85rem;
            fontWeight: 700;
            margin-top: -5px;
            text-align: center;
            padding: 8px;
            backgroundColor: '#fee2e2';
            borderRadius: '4px';
          "
        >
          ⚠️ {{ errorMessage }}
        </p>

        <div style="margin-top: 12px">
          <button
            type="submit"
            class="btn btn-dark btn-full"
            :disabled="!isFormValid"
            :style="{
              opacity: isFormValid ? '1' : '0.5',
              cursor: isFormValid ? 'pointer' : 'not-allowed',
            }"
          >
            <span>Tilmeld</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2.5"
              stroke="currentColor"
              style="width: 16px; height: 16px"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
              />
            </svg>
          </button>
        </div>
      </form>

      <div style="margin-top: 24px">
        <a
          href="/login"
          style="
            color: #e04f26;
            text-decoration: none;
            font-size: 0.875rem;
            font-weight: 700;
          "
        >
          Har du allerede en konto? Log ind her
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { auth } from "../stores/auth";

const API_URL = import.meta.env.VITE_API_URL;
const router = useRouter();
const route = useRoute();

const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const errorMessage = ref("");

// Sættes hvis email kommer med i registreringslinket (?email=...) — så låses feltet,
// og brugeren skal kun vælge et password.
const emailLocked = ref(false);

onMounted(() => {
  const prefillEmail = String(route.query.email ?? "").trim();
  if (prefillEmail) {
    email.value = prefillEmail;
    emailLocked.value = true;
  }
});

const hasLength = computed(() => password.value.length >= 8);
const hasUpper = computed(() => /[A-ZÆØÅ]/.test(password.value));
const hasNumber = computed(() => /\d/.test(password.value));
const hasSpecial = computed(() => /[^A-Za-z0-9ÆØÅæøå]/.test(password.value));

const isPasswordSecure = computed(
  () =>
    hasLength.value && hasUpper.value && hasNumber.value && hasSpecial.value,
);

const isFormValid = computed(
  () =>
    email.value &&
    isPasswordSecure.value &&
    password.value === confirmPassword.value,
);

const handleSignup = async () => {
  errorMessage.value = "";

  if (!isPasswordSecure.value) {
    const missing = [];
    if (!hasLength.value) missing.push("8+ tegn");
    if (!hasUpper.value) missing.push("stort bogstav");
    if (!hasNumber.value) missing.push("tal");
    if (!hasSpecial.value) missing.push("specialtegn");
    errorMessage.value = `Adgangskode mangler: ${missing.join(", ")}`;
    return;
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = "Adgangskoderne stemmer ikke overens.";
    return;
  }
    try {
        const response = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      credentials: "include",   // ← NY: cookien sættes ved signup
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    });
 
    const data = await response.json();
 
    if (!response.ok) {
      errorMessage.value = data.message || "Signup mislykkedes.";
      return;
    }
 
    // Auto-login: brugeren er allerede logget ind via cookien
    auth.setUser(data.user);
    router.push(data.user.role === "admin" ? "/dashboard/admin" : "/dashboard");
  } catch (err) {
    errorMessage.value = "Kunne ikke oprette bruger. Prøv igen senere.";
    console.error("Signup error:", err);
  }
};
</script>
