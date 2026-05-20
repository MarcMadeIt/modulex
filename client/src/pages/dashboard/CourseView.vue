//TODO: `/courses/${id}` skal ændres til rigtig endpoint når backend er klar

<template>
  <div class="course-view">
    <!-- Header -->
    <div class="course-header">
      <button @click="exitCourse" class="btn btn-light">← Forlad</button>

      <div class="course-meta">
        {{ course?.title }} • Trin {{ currentIndex + 1 }} af
        {{ course?.items?.length }}
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="spinner-wrapper">
      <div class="spinner"></div>
    </div>

    <!-- Course content -->
    <div v-else-if="currentStep" class="card">
      <!-- Step info -->
      <div class="step-header">
        <div class="step-type">
          {{ currentStep.type }}
        </div>
        <h2>{{ currentStep.title }}</h2>
        <p>Gennemgå materialet før du fortsætter</p>
      </div>

      <!-- Content placeholder -->
      <div class="content-box">
        <p>{{ currentStep.type }} content: {{ currentStep.title }}</p>
      </div>

      <!-- Confirm -->
      <div class="confirm-box">
        <label class="confirm-box">
          <input type="checkbox" v-model="confirmed" />
          <span class="input-label"
            >Jeg bekræfter at have gennemgået indholdet</span
          >
        </label>
      </div>

      <!-- Navigation -->
      <div class="card-nav">
        <button
          class="btn btn-light"
          @click="prevStep"
          :disabled="currentIndex === 0"
        >
          ← Forrige
        </button>

        <button
          class="btn btn-primary"
          @click="nextStep"
          :disabled="!confirmed"
        >
          {{ isLastStep ? "Afslut kursus" : "Næste" }}
        </button>
      </div>
    </div>

    <!-- Completed -->
    <div v-else class="card">
      <h2 class="card-title">Kursus færdigt 🎉</h2>
      <p class="card-text">Du har gennemført hele kurset.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

//state
const course = ref(null);
const currentIndex = ref(0);
const confirmed = ref(false);
const loading = ref(true);

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

//fetch kursus
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

<style scoped>
.course-view {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

/* =========================
   HEADER
========================= */
.course-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.course-header button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  font-weight: 800;
  color: var(--color-text-secondary);
  background: var(--color-bg-paper);
  border: 1px solid var(--color-border);
  padding: 0.6rem 1rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  box-shadow: var(--shadow-soft);
  transition: 0.2s ease;
}

.course-header button:hover {
  transform: translateY(-1px);
  color: var(--color-text-primary);
}

.course-meta {
  font-size: var(--text-xs);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-secondary);
}

/* =========================
   MAIN CARD OVERRIDE
========================= */
.course-view .card {
  padding: 0;
  overflow: hidden;
}

/* =========================
   CONTENT AREA
========================= */
.course-content {
  padding: var(--space-6);
}

/* STEP HEADER */
.step-header {
  margin-bottom: var(--space-5);
}

.step-header h2 {
  font-size: var(--text-lg);
  font-weight: 900;
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.step-header p {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

/* TYPE BADGE (video/pdf/quiz) */
.step-type {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  font-weight: 800;
  text-transform: uppercase;
  color: var(--color-primary-orange);
  margin-bottom: var(--space-3);
}

/* =========================
   CONTENT PLACEHOLDER
========================= */
.content-box {
  height: 320px;
  border-radius: var(--radius-md);
  border: 1px dashed var(--color-border);
  background: var(--color-primary-ultralight);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-6);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

/* =========================
   CONFIRM BOX
========================= */
.confirm-box {
  margin-bottom: var(--space-6);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-bg-paper);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.confirm-box input {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary-orange);
}

/* =========================
   NAVIGATION
========================= */
.course-nav {
  display: flex;
  justify-content: space-between;
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-border-light);
}

/* override buttons so they feel like modulex */
.course-nav .btn {
  min-width: 140px;
}

/* disabled state override for consistency */
.btn:disabled {
  opacity: 0.4;
  pointer-events: none;
}

/* =========================
   ANIMATIONS (small polish)
========================= */
.course-view button {
  transition: 0.2s ease;
}

.course-view button:active {
  transform: scale(0.98);
}
</style>
