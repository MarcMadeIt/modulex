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
            required
          />
        </div>

        <div class="input-group">
          <label for="password" class="input-label">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="*********"
            class="input"
            required
          />

          <p
            style="
              margin-top: 10px;
              font-size: 0.75rem;
              color: #9ca3af;
              line-height: 1.5;
              font-weight: 500;
            "
          >
            Adgangskoden skal bestå af mindst
            <span
              :style="{
                color: hasLength ? '#10b981' : 'inherit',
                fontWeight: hasLength ? '700' : 'inherit',
                transition: 'color 0.3s',
              }"
              >8 tegn</span
            >,

            <span
              :style="{
                color: hasUpper ? '#10b981' : 'inherit',
                fontWeight: hasUpper ? '700' : 'inherit',
                transition: 'color 0.3s',
              }"
              >stort bogstav</span
            >,

            <span
              :style="{
                color: hasNumber ? '#10b981' : 'inherit',
                fontWeight: hasNumber ? '700' : 'inherit',
                transition: 'color 0.3s',
              }"
              >tal</span
            >
            og

            <span
              :style="{
                color: hasSpecial ? '#10b981' : 'inherit',
                fontWeight: hasSpecial ? '700' : 'inherit',
                transition: 'color 0.3s',
              }"
              >specialtegn (!@#$%)</span
            >.
          </p>
        </div>

        <div class="input-group">
          <label for="confirmPassword" class="input-label"
            >Gentag password</label
          >
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            placeholder="*********"
            class="input"
            required
          />
        </div>

        <p
          v-if="errorMessage"
          style="
            color: #e04f26;
            font-size: 0.8rem;
            font-weight: 600;
            margin-top: -10px;
            text-align: center;
          "
        >
          {{ errorMessage }}
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
          href="#"
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
import { ref, computed } from "vue";

const API_URL = import.meta.env.VITE_API_URL;

const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const errorMessage = ref("");

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
    errorMessage.value = "Adgangskoden opfylder ikke alle sikkerhedskrav.";
    return;
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = "Adgangskoderne stemmer ikke overens!";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

    console.log("Signup successful:", data);
  } catch (err) {
    errorMessage.value = "Kunne ikke oprette bruger. Prøv igen senere.";
    console.error("Signup error:", err);
  }
};
</script>
