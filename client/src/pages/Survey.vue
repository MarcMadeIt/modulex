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
        <div v-else-if="completed" class="card">
          <h1 class="card-title">Tak for dine svar</h1>
          <p class="card-text">
            Dine svar er blevet sendt til Modulex' kundesupport. Når dit
            personlige onboarding flow er sat sammen vil du modtage en email
            invitiation.
          </p>
        </div>

        <!-- Survey -->
        <div v-else class="card">
          <!-- Progress -->
          <ProgressBar :percentage="progress" />

          <!-- Header -->
          <div>
            <h1>Velkommen til Academy</h1>
            <p>Svar på et par spørgsmål for at komme i gang</p>
          </div>

          <!-- Question -->
          <div v-if="currentQuestion">
            <h2 class="card-title">
              {{ currentQuestion.question }}
            </h2>

            <div class="input-group">
              <button
                v-for="option in currentQuestion.options"
                :key="option"
                class="btn btn-light btn-full survey-option"
                @click="handleAnswer(option)"
              >
                <span>{{ option }}</span>
                <span class="survey-arrow">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import ProgressBar from "../components/ui/ProgressBar.vue";

type Question = {
  id: string;
  question: string;
  options: string[];
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
        id: "q1",
        question: "Hvad vil du gerne lære?",
        options: ["Frontend", "Backend", "UI/UX", "AI"],
      },
      {
        id: "q2",
        question: "Hvor meget erfaring har du?",
        options: ["Begynder", "Mellem", "Erfaren"],
      },
      {
        id: "q3",
        question: "Hvordan lærer du bedst?",
        options: ["Videoer", "Hands-on", "Læsning", "Workshops"],
      },
    ];

    error.value = null; // vi viser stadig UI
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
