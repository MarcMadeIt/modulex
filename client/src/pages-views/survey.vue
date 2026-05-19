<template>
  <div>
    <!-- Loading -->
    <div v-if="loading">Loading survey...</div>

    <!-- Error -->
    <div v-else-if="error">
      {{ error }}
    </div>

    <!-- Completed -->
    <div v-else-if="completed">Survey completed 🎉</div>

    <!-- Survey -->
    <div v-else-if="currentQuestion">
      <div>
        Question {{ currentQuestionIndex + 1 }} / {{ questions.length }}
      </div>

      <div>
        <div>{{ currentQuestion.icon }}</div>
        <div>{{ currentQuestion.title }}</div>
        <div>{{ currentQuestion.description }}</div>
      </div>

      <h2>
        {{ currentQuestion.question }}
      </h2>

      <div>
        <button
          v-for="option in currentQuestion.options"
          :key="option"
          @click="selectAnswer(option)"
        >
          {{ option }}
        </button>
      </div>

      <div v-if="submitting">Submitting...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";

/* -----------------------
   TOKEN FROM URL
----------------------- */
const route = useRoute();
const token = route.query.token;

/* -----------------------
   STATE
----------------------- */
const questions = ref([]);
const currentQuestionIndex = ref(0);
const answers = ref([]);

const loading = ref(true);
const error = ref("");
const submitting = ref(false);
const completed = ref(false);

/* -----------------------
   CURRENT QUESTION
----------------------- */
const currentQuestion = computed(() => {
  if (!questions.value.length) return null;
  return questions.value[currentQuestionIndex.value];
});

/* -----------------------
   FETCH QUESTIONS
----------------------- */
const fetchQuestions = async () => {
  try {
    loading.value = true;

    const res = await fetch(`/survey/questions?token=${token}`);
    const data = await res.json();

    questions.value = data;
  } catch (err) {
    error.value = "Could not load survey questions";
  } finally {
    loading.value = false;
  }
};

/* -----------------------
   SELECT ANSWER
----------------------- */
const selectAnswer = async (option) => {
  answers.value.push({
    questionId: currentQuestion.value.id,
    answer: option,
  });

  const isLast = currentQuestionIndex.value === questions.value.length - 1;

  if (isLast) {
    await submitSurvey();
    return;
  }

  currentQuestionIndex.value++;
};

/* -----------------------
   SUBMIT SURVEY
----------------------- */
const submitSurvey = async () => {
  try {
    submitting.value = true;

    await fetch("/survey/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        answers: answers.value,
      }),
    });

    completed.value = true;
  } catch (err) {
    error.value = "Failed to submit survey";
  } finally {
    submitting.value = false;
  }
};

/* -----------------------
   INIT
----------------------- */
onMounted(() => {
  if (!token) {
    error.value = "Missing survey token";
    loading.value = false;
    return;
  }

  fetchQuestions();
});
</script>
