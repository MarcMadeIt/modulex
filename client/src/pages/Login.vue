<template>
  <div style="min-height: 100vh; background-color: #f4f5f6; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: system-ui, sans-serif;">
    
    <div class="card" style="max-width: 560px; width: 100%; text-align: center;">
      
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 2.5rem; font-weight: 800; color: #333; margin: 0; font-family: ui-monospace, monospace;">
          module<span style="color: #e65c00;">x</span>
        </h1>
        <h2 style="font-size: 2rem; font-weight: 900; color: #111; margin: 8px 0 0 0;">Academy</h2>
        <p style="color: #777; font-size: 0.9rem; font-weight: 500; margin: 6px 0 0 0;">Log ind på din portal</p>
      </div>

      <form @submit.prevent="handleLogin" style="text-align: left; display: flex; flex-direction: column; gap: 20px;">
        
        <div class="input-group">
          <label for="email" class="input-label">Email adresse</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="navn@email.dk"
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
        </div>

        <div style="margin-top: 12px;">
          <button type="submit" class="btn btn-dark btn-full">
            <span>Login</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 16px; height: 16px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </form>

      <div style="margin-top: 24px;">
        <a href="#" >
          Har du glemt dit login? Tryk her
        </a>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Reaktive variable til at holde styr på input-felterne
const email = ref('')
const password = ref('')

// Funktion der kører når der trykkes på "Login"
const handleLogin = () => {
  console.log('Forsøger login med:', {
    email: email.value,
    password: password.value
  })
}
</script>
