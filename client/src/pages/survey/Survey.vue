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

        <!-- Completed -->
        <div v-else-if="completed" class="survey-completed">
          <h1 class="survey-completed-title">Tak for dine svar</h1>
          <p class="survey-completed-text">
            Dine svar er blevet sendt til Modulex' kundesupport. Når dit
            personlige onboarding flow er sat sammen vil du modtage en email
            invitiation.
          </p>
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

const currentQuestion = computed(() => questions.value[step.value]);

const progress = computed(() => {
  if (!questions.value.length) return 0;
  return ((step.value + 1) / questions.value.length) * 100;
});

onMounted(() => {
  fetchQuestions();
});

async function fetchQuestions() {
  try {
    loading.value = true;
    error.value = null;

    const res = await fetch("/survey/questions");

    if (!res.ok) {
      throw new Error("API ikke klar");
    }

    const data = await res.json();
    questions.value = data;
  } catch (err) {
    console.warn("Bruger dummy data (API ikke klar)");

    // 👇 DUMMY DATA FALLBACK
    questions.value = [
      {
        id: "business_type",
        question: "Hvilken type virksomhed driver I?",
        type: "single",
        options: [
          { value: "sign_maker", label: "Skiltemager" },
          { value: "reseller", label: "Forhandler" },
          { value: "agency", label: "Bureau" },
          { value: "other", label: "Andet" },
        ],
      },
      {
        id: "company_size",
        question: "Hvor mange medarbejdere er I?",
        type: "single",
        options: [
          { value: "1-5", label: "1-5" },
          { value: "6-20", label: "6-20" },
          { value: "21-50", label: "21-50" },
          { value: "50+", label: "50+" },
        ],
      },

      {
        id: "product_interest",
        question: "Hvilke produktområder er I interesserede i?",
        type: "multi",
        options: [
          { value: "interior", label: "Interior signs" },
          { value: "exterior", label: "Exterior signs" },
          { value: "safety", label: "Safety signs" },
          { value: "wayfinding", label: "Wayfinding systems" },
        ],
      },

      {
        id: "experience_level",
        question: "Hvor meget erfaring har I med modulære skiltesystemer?",
        type: "single",
        options: [
          { value: "none", label: "Ingen" },
          { value: "some", label: "Lidt" },
          { value: "experienced", label: "Erfaren" },
        ],
      },

      {
        id: "expected_volume",
        question: "Forventet årligt salgsvolumen?",
        type: "single",
        options: [
          { value: "small", label: "Under 100k EUR" },
          { value: "medium", label: "100k - 500k EUR" },
          { value: "large", label: "Over 500k EUR" },
        ],
      },
    ];

    error.value = null;
  } finally {
    loading.value = false;
  }
}

async function handleAnswer(option: string) {
  const q = currentQuestion.value;
  if (!q) return;

  answers.value[q.id] = option;

  const isLast = step.value === questions.value.length - 1;

  if (isLast) {
    await submitSurvey();
    completed.value = true;
    return;
  }

  step.value++;
}

async function submitSurvey() {
  try {
    await fetch("/survey/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ answers: answers.value }),
    });
  } catch (err) {
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
</style>
