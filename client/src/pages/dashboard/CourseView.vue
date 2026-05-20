<template>
  <div class="course-view">
    <!-- Header -->
    <div class="course-header">
      <button @click="exitCourse" class="back-btn">← Forlad</button>

      <div class="course-meta">
        {{ course?.title }} • Trin {{ currentIndex + 1 }} af
        {{ course?.items?.length }}
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading">Loading course...</div>

    <!-- Course content -->
    <div v-else-if="currentStep">
      <!-- Progress -->
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }" />
      </div>

      <!-- Step info -->
      <div class="step-header">
        <h2>{{ currentStep.title }}</h2>
        <p>Gennemgå materialet før du fortsætter</p>
      </div>

      <!-- Content placeholder -->
      <div class="content-box">
        <p>{{ currentStep.type }} content: {{ currentStep.title }}</p>
      </div>

      <!-- Confirm -->
      <div class="confirm-box">
        <label>
          <input type="checkbox" v-model="confirmed" />
          Jeg bekræfter at have gennemgået indholdet
        </label>
      </div>

      <!-- Navigation -->
      <div class="nav-buttons">
        <button @click="prevStep" :disabled="currentIndex === 0">
          ← Forrige
        </button>

        <button @click="nextStep" :disabled="!confirmed">
          {{ isLastStep ? "Afslut kursus" : "Næste" }}
        </button>
      </div>
    </div>

    <!-- Completed -->
    <div v-else>Kursus færdigt 🎉</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

/* -----------------------------
   STATE
------------------------------*/
const course = ref(null);
const currentIndex = ref(0);
const confirmed = ref(false);
const loading = ref(true);

/* -----------------------------
   COMPUTED
------------------------------*/
const currentStep = computed(() => {
  return course.value?.items?.[currentIndex.value];
});

const isLastStep = computed(() => {
  return course.value
    ? currentIndex.value === course.value.items.length - 1
    : false;
});

const progress = computed(() => {
  if (!course.value) return 0;
  return ((currentIndex.value + 1) / course.value.items.length) * 100;
});

/* -----------------------------
   FETCH COURSE
------------------------------*/
onMounted(async () => {
  const id = route.params.id;

  try {
    const res = await fetch(`/courses/${id}`);
    course.value = await res.json();
  } catch (err) {
    console.error("Could not load course", err);

    // fallback dummy data
    course.value = {
      id,
      title: "Demo Course",
      items: [
        { title: "Intro", type: "video" },
        { title: "PDF Guide", type: "pdf" },
        { title: "Quiz", type: "quiz" },
      ],
    };
  } finally {
    loading.value = false;
  }
});

/* -----------------------------
   ACTIONS
------------------------------*/
function nextStep() {
  if (!confirmed.value) return;

  if (isLastStep.value) {
    router.push("/dashboard");
    return;
  }

  currentIndex.value++;
  confirmed.value = false;
}

function prevStep() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    confirmed.value = true;
  }
}

function exitCourse() {
  router.push("/dashboard");
}
</script>
