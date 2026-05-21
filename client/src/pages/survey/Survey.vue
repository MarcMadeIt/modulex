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
          <div class="survey-header">
            <div class="survey-icon">📧</div>
            <div>
              <h1 class="survey-title">Næste skridt</h1>
              <p class="survey-description">
                Udfyld dine kontaktoplysninger for at afslutte
              </p>
            </div>
          </div>

          <!-- Contact Form -->
          <div class="contact-form-wrapper">
            <form @submit.prevent="handleContactSubmit">
              <div class="form-group">
                <label class="input-label">Virksomhedsnavn</label>
                <input
                  v-model="contactForm.companyName"
                  type="text"
                  class="input"
                  placeholder="Navn på virksomhed"
                  required
                />
              </div>

              <div class="form-group">
                <label class="input-label">Kontaktperson</label>
                <input
                  v-model="contactForm.contactPerson"
                  type="text"
                  class="input"
                  placeholder="Dit navn"
                  required
                />
              </div>

              <div class="form-group">
                <label class="input-label">Email</label>
                <input
                  v-model="contactForm.email"
                  type="email"
                  class="input"
                  placeholder="din@email.dk"
                  required
                />
              </div>

              <div class="form-group">
                <label class="input-label">Telefon</label>
                <input
                  v-model="contactForm.phone"
                  type="tel"
                  class="input"
                  placeholder="+45 12 34 56 78"
                  required
                />
              </div>

              <button type="submit" class="btn btn-primary btn-full">
                Afslut
              </button>
            </form>

            <div v-if="contactError" class="error-box">
              {{ contactError }}
            </div>
          </div>

          <div class="survey-footer">
            <div class="survey-footer-item active">PERSONLIG PROFIL</div>
            <div class="survey-footer-item active">KONTAKTOPLYSNINGER</div>
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
            <div class="survey-footer-item active">PERSONLIG PROFIL</div>

            <div class="survey-footer-item">SKRÆDDERSYET INDHOLD</div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import ProgressBar from "../../components/ui/ProgressBar.vue";
import { dummyQuestions } from "../../data/surveyQuestions";
const API_URL = import.meta.env.VITE_API_URL;

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

  try {
    const response = await fetch(`${API_URL}/survey`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: contactForm.value.email,
        companyName: contactForm.value.companyName,
        contactPerson: contactForm.value.contactPerson,
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
  gap: var(--space-6);

  padding: var(--space-5) var(--space-6);

  color: var(--color-primary-light);
  font-size: var(--text-sm);
  font-weight: 900;
  letter-spacing: 0.08em;
}

.survey-footer-item.active {
  color: var(--color-primary-medium);
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
</style>
