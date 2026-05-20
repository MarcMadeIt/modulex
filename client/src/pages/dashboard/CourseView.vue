<template>
  <div class="course-view">
    <!-- Header -->
    <div class="course-header">
      <button @click="exitCourse" class="btn btn-light">← Forlad</button>

      <div class="course-meta" v-if="course">
        {{ course.title }} • Trin {{ currentIndex + 1 }} af
        {{ course.items.length }}
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="spinner-wrapper">
      <div class="spinner"></div>
    </div>

    <!-- Course content -->
    <div v-else-if="currentStep" class="course-card">
      <div class="course-progress">
        <div
          class="course-progress-fill"
          :style="{ width: progress + '%' }"
        ></div>
      </div>

      <div class="course-content">
        <div class="step-header">
          <div class="step-type">
            {{ currentStep.type }}
          </div>

          <h2>{{ currentStep.title }}</h2>

          <p>
            Gennemgå materialet herunder. Når du er klar, skal du bekræfte
            nederst på siden for at gå videre.
          </p>
        </div>

        <div class="content-box">
          <div class="content-placeholder-icon">▤</div>
          <p>{{ currentStep.title }}</p>
        </div>

        <label class="confirm-box" :class="{ 'confirm-box-active': confirmed }">
          <input type="checkbox" v-model="confirmed" />
          <span>Jeg bekræfter at have set indholdet</span>
        </label>

        <div class="course-nav">
          <button
            class="course-nav-back"
            @click="prevStep"
            :disabled="currentIndex === 0"
          >
            ← Forrige
          </button>

          <button
            class="course-nav-next"
            @click="nextStep"
            :disabled="!confirmed"
          >
            {{ isLastStep ? "Afslut kursus" : "Næste trin" }} →
          </button>
        </div>
      </div>
    </div>

    <!-- Completed / fallback -->
    <div v-else class="course-card">
      <div class="course-content">
        <h2>Kursus færdigt 🎉</h2>
        <p>Du har gennemført hele kurset.</p>
      </div>
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
  max-width: 980px;
  margin: 0 auto;
}

.course-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.course-header .btn {
  background: transparent;
  box-shadow: none;
  border: none;
  color: var(--color-text-secondary);
  font-weight: 800;
}

.course-meta {
  font-size: var(--text-xs);
  font-weight: 900;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.course-card {
  background: var(--color-bg-paper);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.course-progress {
  width: 100%;
  height: 5px;
  background: var(--color-primary-ultralight);
}

.course-progress-fill {
  height: 100%;
  background: var(--color-primary-orange);
  transition: width 0.4s ease;
}

.course-content {
  padding: var(--space-8);
}

.step-header {
  margin-bottom: var(--space-6);
}

.step-type {
  color: var(--color-primary-orange);
  font-size: var(--text-xs);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: var(--space-3);
}

.step-header h2 {
  font-size: 1.9rem;
  font-weight: 900;
  color: var(--color-text-primary);
  margin-bottom: var(--space-3);
}

.step-header p {
  max-width: 760px;
  font-size: var(--text-md);
  line-height: 1.6;
  color: var(--color-primary-medium);
}

.content-box {
  aspect-ratio: 16 / 9;
  background: var(--color-primary-ultralight);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
  color: var(--color-muted);
  font-weight: 800;
}

.content-placeholder-icon {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: var(--color-bg-paper);
  box-shadow: var(--shadow-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-border);
  font-size: 1.5rem;
}

.confirm-box {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  width: 100%;
  padding: 1.35rem 1.5rem;
  margin-bottom: var(--space-8);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(239, 65, 35, 0.22);
  background: rgba(239, 65, 35, 0.05);
  cursor: pointer;
}

.confirm-box input {
  width: 24px;
  height: 24px;
  accent-color: var(--color-primary-orange);
  cursor: pointer;
}

.confirm-box span {
  font-size: var(--text-md);
  font-weight: 900;
  color: var(--color-text-primary);
}

.course-nav {
  border-top: 1px solid var(--color-border-light);
  padding-top: var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.course-nav-back,
.course-nav-next {
  border: none;
  border-radius: var(--radius-md);
  font-weight: 900;
  cursor: pointer;
  transition: 0.2s ease;
}

.course-nav-back {
  background: transparent;
  color: var(--color-primary-medium);
  font-size: var(--text-md);
}

.course-nav-next {
  padding: 1rem 1.5rem;
  background: var(--color-primary-orange);
  color: var(--color-text-light);
  font-size: var(--text-sm);
  box-shadow: var(--shadow-soft);
}

.course-nav-next:disabled,
.course-nav-back:disabled {
  background: var(--color-primary-ultralight);
  color: var(--color-primary-light);
  cursor: not-allowed;
  box-shadow: none;
}
</style>
