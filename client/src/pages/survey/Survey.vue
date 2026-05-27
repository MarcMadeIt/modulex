<template>
  <div class="app-layout">
    <main class="app-main">
      <div class="survey-wrapper">
        <!-- Loading -->
        <div v-if="loading" class="spinner-wrapper">
          <div class="spinner" />
        </div>

        <!-- Error -->
        <div v-else-if="error" class="error-box">
          {{ error }}
        </div>

        <!-- Contact Form -->
        <div v-else-if="completed" class="survey-card">
          <!-- Progress -->
          <ProgressBar :percentage="100" />

          <!-- Header -->
          <div :class="['survey-header', { 'success': contactSuccess }]">
            <div class="survey-icon">{{ contactSuccess ? '✅' : '📧' }}</div>
            <div>
              <h1 class="survey-title">{{ contactSuccess ? 'Tak, dine oplysninger er sendt' : 'Næste skridt' }}</h1>
              <p class="survey-description">
                {{ contactSuccess ? 'Vi har modtaget dine oplysninger og vender tilbage til dig snarest.' : 'Udfyld dine kontaktoplysninger for at afslutte' }}
              </p>
            </div>
          </div>

          <!-- Contact Form -->
          <div class="contact-form-wrapper">
            <template v-if="contactSuccess">
              <div class="contact-confirmation">
                <div class="confirmation-icon" aria-hidden="true">✓</div>
              </div>
            </template>

            <template v-else>
              <form @submit.prevent="handleContactSubmit">
                <div class="form-group">
                  <label class="input-label" for="contact-email">Email</label>
                  <input
                    id="contact-email"
                    v-model="contactForm.email"
                    type="email"
                    class="input"
                    :class="{ 'input-locked': emailLocked }"
                    :readonly="emailLocked"
                    placeholder="din@email.dk"
                    required
                  />
                  <p v-if="emailLocked" class="input-hint">
                    🔒 Knyttet til din invitation og kan ikke ændres.
                  </p>
                </div>

                <div class="form-group">
                  <label class="input-label" for="contact-company">Virksomhedsnavn</label>
                  <input
                    id="contact-company"
                    v-model="contactForm.companyName"
                    type="text"
                    class="input"
                    placeholder="Navn på virksomhed"
                    required
                  />
                </div>

                <div class="form-group">
                  <label class="input-label" for="contact-person">Kontaktperson</label>
                  <input
                    id="contact-person"
                    v-model="contactForm.contactPerson"
                    type="text"
                    class="input"
                    placeholder="Dit navn"
                    required
                  />
                </div>

                <div class="form-group">
                  <label class="input-label" for="contact-phone">Telefon</label>
                  <input
                    id="contact-phone"
                    v-model="contactForm.phone"
                    type="tel"
                    class="input"
                    placeholder="+45 12 34 56 78"
                    required
                  />
                </div>

                <button type="submit" class="btn btn-primary btn-full">
                  Indsend
                </button>
              </form>

              <div v-if="contactError" class="error-box">
                {{ contactError }}
              </div>
            </template>
          </div>

          <div class="survey-footer">
            <img src="/Modulex_Logo_Full_Colur.jpg" alt="moduleX" class="survey-footer-logo" />
          </div>
        </div>

        <!-- Survey -->
        <div v-else class="survey-card">
          <!-- Progress -->
          <ProgressBar :percentage="progress" />

          <!-- Header -->
          <div class="survey-header">
            <div class="survey-icon">📋</div>
            <div>
              <h1 class="survey-title">Velkommen til Academy</h1>
              <p class="survey-description">
                Svar på et par spørgsmål for at komme i gang
              </p>
            </div>
          </div>

          <!-- Question -->
          <div v-if="currentQuestion">
            <h2 class="survey-question">
              {{ currentQuestion.question }}
            </h2>

            <div class="input-group">
              <button
                v-for="option in currentQuestion.options"
                :key="option.value"
                class="survey-option"
                @click="handleAnswer(option.value)"
              >
                <span>{{ option.label }}</span>

                <span class="survey-arrow">→</span>
              </button>
            </div>
          </div>

          <div class="survey-footer">
            <img src="/Modulex_Logo_Full_Colur.jpg" alt="moduleX" class="survey-footer-logo" />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import ProgressBar from "../../components/ui/ProgressBar.vue";
import { dummyQuestions } from "../../data/surveyQuestions";
const API_URL = import.meta.env.VITE_API_URL;
const route = useRoute();

type SurveyOption = {
  value: string;
  label: string;
};

type Question = {
  id: string;
  question: string;
  type: "single" | "multi";
  options: SurveyOption[];
};

const questions = ref<Question[]>([]);
const step = ref(0);
const answers = ref<Record<string, string>>({});
const loading = ref(true);
const completed = ref(false);
const error = ref<string | null>(null);
const contactError = ref<string | null>(null);
const contactSuccess = ref(false);

// Sættes hvis email kommer med i URL'en (fra invitations-mailen) — så låses feltet.
const emailLocked = ref(false);

const contactForm = ref({
  companyName: "",
  contactPerson: "",
  email: "",
  phone: "",
});

const currentQuestion = computed(() => questions.value[step.value]);

const progress = computed(() => {
  if (!questions.value.length) return 0;
  return ((step.value + 1) / questions.value.length) * 100;
});

onMounted(() => {
  fetchQuestions();

  // Forudfyld og lås email-feltet hvis den er sendt med i URL'en (?email=...).
  const prefillEmail = String(route.query.email ?? "").trim();
  if (prefillEmail) {
    contactForm.value.email = prefillEmail;
    emailLocked.value = true;
  }
});

function fetchQuestions() {
  loading.value = true;
  questions.value = dummyQuestions;
  loading.value = false;
}

async function handleAnswer(option: string) {
  const q = currentQuestion.value;
  if (!q) return;

  answers.value[q.id] = option;

  const isLast = step.value === questions.value.length - 1;

  if (isLast) {
    completed.value = true;
    return;
  }

  step.value++;
}

async function handleContactSubmit() {
  contactError.value = null;
  contactSuccess.value = false;

  try {
    const response = await fetch(`${API_URL}/survey`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: contactForm.value.companyName,
        contactPerson: contactForm.value.contactPerson,
        email: contactForm.value.email,
        phone: contactForm.value.phone,
        answers: answers.value,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log("Survey submitted:", data);
    contactSuccess.value = true;
  } catch (err: any) {
    contactError.value = err.message || "Noget gik galt";
    console.error("Kunne ikke submit survey", err);
  }
}
</script>

<style scoped>
.survey-wrapper {
  max-width: 980px;
  margin: 0 auto;
  padding-top: 4rem;
}

.survey-card {
  background: var(--color-bg-paper);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.survey-header {
  display: flex;
  gap: var(--space-5);
  align-items: center;
  padding: var(--space-6);
}

.survey-icon {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-md);
  background: rgba(239, 65, 35, 0.08);

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 2rem;
}

.survey-title {
  font-size: 2.4rem;
  font-weight: 900;
  color: var(--color-text-primary);
}

.survey-description {
  font-size: var(--text-md);
  color: var(--color-primary-medium);
  margin-top: var(--space-2);
}

.survey-question {
  padding-inline: var(--space-6);
  margin-top: var(--space-4);
  margin-bottom: var(--space-5);

  font-size: 2rem;
  font-weight: 900;
}

.input-group {
  padding-inline: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.survey-option {
  width: 100%;
  border: 2px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: 1.6rem 2rem;

  background: white;

  display: flex;
  justify-content: space-between;
  align-items: center;

  font-size: 1.4rem;
  font-weight: 800;

  cursor: pointer;
  transition: 0.2s ease;
}

.survey-option:hover {
  border-color: var(--color-primary-orange);
  transform: translateY(-1px);
}

.survey-arrow {
  color: var(--color-primary-light);
  font-size: 1.6rem;
}

.survey-footer {
  margin-top: var(--space-8);
  border-top: 1px solid var(--color-border-light);

  display: flex;
  justify-content: center;
  align-items: center;

  padding: var(--space-5) var(--space-6);
}

.survey-footer-logo {
  height: 48px;
  width: auto;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.survey-footer-logo:hover {
  opacity: 1;
}

.contact-confirmation {
  padding: var(--space-8) 0;
  text-align: center;
}

.contact-confirmation .confirmation-icon {
  width: 140px;
  height: 140px;
  margin: 0 auto;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.12);
  color: var(--color-primary-green);
  font-size: 4rem;
}

.survey-header.success .survey-icon {
  background: rgba(16, 185, 129, 0.08);
}

.survey-header.success .survey-title {
  color: var(--color-primary-green);
}

.survey-completed {
  max-width: 900px;
  margin: 4rem auto 0;

  background: var(--color-bg-paper);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);

  padding: 5rem 4rem;

  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.survey-completed-title {
  font-size: 2.4rem;
  font-weight: 900;
  color: var(--color-text-primary);

  margin-bottom: var(--space-4);
}

.survey-completed-text {
  max-width: 620px;

  font-size: var(--text-md);
  line-height: 1.7;

  color: var(--color-text-secondary);
}

.contact-form-wrapper {
  padding: var(--space-6);
}

.form-group {
  margin-bottom: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-group:last-of-type {
  margin-bottom: var(--space-6);
}

.input-label {
  font-size: var(--text-xs);
  font-weight: 800;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.input {
  width: 100%;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: 1rem 1.25rem;
  font-size: var(--text-sm);
  background-color: var(--color-primary-ultralight);
  color: var(--color-text-primary);
  transition: 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary-orange);
  background-color: var(--color-bg-paper);
}

.input::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.7;
}

.input-locked {
  background-color: var(--color-primary-ultralight);
  color: var(--color-text-secondary);
  cursor: not-allowed;
}

.input-locked:focus {
  border-color: var(--color-border-light);
  background-color: var(--color-primary-ultralight);
}

.input-hint {
  margin-top: var(--space-2);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}
</style>
