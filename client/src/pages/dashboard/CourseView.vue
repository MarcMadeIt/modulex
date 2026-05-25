<template>
  <div class="course-view">
    <!-- Header -->
    <div class="course-header">
      <button @click="exitCourse" class="btn btn-light">
        <ArrowLeft :size="18" />
        <span>Tilbage til dashboard</span>
      </button>

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
            <BookOpen :size="18" />
            <span>Modul {{ currentIndex + 1 }}</span>
          </div>

          <h2>{{ currentStep.title }}</h2>
          <div v-if="currentStep.duration" class="step-duration">
            ⏱ {{ currentStep.duration }}
          </div>

          <p>
            {{
              currentStep.description ||
              "Gennemgå alle materialer herunder. Når du er klar, skal du bekræfte nederst på siden for at gå videre."
            }}
          </p>
        </div>

        <div class="materials-list">
          <div
            v-for="(material, materialIndex) in currentStep.materials"
            :key="material.id || material._id || materialIndex"
            class="material-section"
          >
            <div class="material-header">
              <div class="material-type">
                <PlayCircle v-if="material.type === 'video'" :size="18" />
                <FileText v-else-if="material.type === 'pdf'" :size="18" />
                <span>{{ material.type === "video" ? "Video" : "PDF" }}</span>
              </div>

              <h3>{{ material.title }}</h3>

              <small v-if="material.duration || material.size">
                {{ material.duration || material.size }}
              </small>
            </div>

            <div
              class="content-box"
              :class="{
                'content-box-pdf': material.type === 'pdf' && material.fileUrl,
              }"
            >
              <template v-if="material.type === 'video' && material.url">
                <iframe
                  class="course-video"
                  :src="material.url"
                  :title="material.title"
                  frameborder="0"
                  allowfullscreen
                ></iframe>
              </template>

              <template v-else-if="material.type === 'pdf' && material.fileUrl">
                <iframe
                  class="course-pdf"
                  :src="material.fileUrl"
                  :title="material.title"
                ></iframe>

                <a :href="material.fileUrl" target="_blank" class="pdf-link">
                  Åbn PDF i ny fane
                </a>
              </template>

              <template v-else>
                <div class="content-placeholder-icon">▤</div>
                <p>{{ material.title }}</p>
                <small>Materiale mangler eller link er ikke sat</small>
              </template>
            </div>
          </div>
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
            <ArrowLeft :size="18" />
            <span>Forrige</span>
          </button>

          <button
            class="course-nav-next"
            @click="nextStep"
            :disabled="!confirmed"
          >
            <span>
              {{ isLastStep ? "Afslut kursus" : "Næste trin" }}
              <ArrowRight :size="18" />
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Completed / fallback -->
    <div v-else class="course-card">
      <div class="course-content">
        <h2>Kursus færdigt 🎉</h2>
        <p>Du har gennemført hele kurset.</p>

        <button class="btn btn-primary" @click="exitCourse">
          Tilbage til dashboard
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

import {
  getCourseById,
  completeCourse,
} from "../../data/dummyCourseService.js";

import {
  PlayCircle,
  FileText,
  ArrowLeft,
  ArrowRight,
  BookOpen,
} from "lucide-vue-next";

const route = useRoute();
const router = useRouter();

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

onMounted(() => {
  const id = route.params.id;

  const foundCourse = getCourseById(id);
  console.log("Found course:", foundCourse);

  if (!foundCourse) {
    course.value = {
      id,
      title: "Demo Course",
      items: [
        { title: "Intro", type: "video" },
        { title: "PDF Guide", type: "pdf" },
        { title: "Quiz", type: "quiz" },
      ],
    };

    loading.value = false;
    return;
  }

  course.value = {
    id: foundCourse.id,
    title: foundCourse.title,
    items: foundCourse.modules
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((module) => {
        return {
          id: module._id || module.id,
          title: module.title,
          description: module.description,
          duration: module.duration,
          materials: module.materials || [],
        };
      }),
  };

  if (course.value.items.length === 0) {
    course.value.items = [
      {
        title: foundCourse.title,
        type: "intro",
        materials: [],
      },
    ];
  }

  loading.value = false;
});

function nextStep() {
  if (!confirmed.value) return;

  if (isLastStep.value) {
    completeCourse(course.value.id);

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
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;

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

/* .content-box {
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
  overflow: hidden;
} */

.materials-list {
  display: grid;
  gap: var(--space-6);
  margin-bottom: var(--space-6);
}

.material-section {
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  background: var(--color-bg-paper);
  overflow: hidden;
}

.material-header {
  padding: 1.2rem 1.4rem;
  border-bottom: 1px solid var(--color-border-light);
  display: grid;
  gap: 0.4rem;
}

.material-type {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-primary-orange);
  font-size: var(--text-xs);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.material-header h3 {
  margin: 0;
  font-size: var(--text-md);
  font-weight: 900;
  color: var(--color-text-primary);
}

.material-header small {
  color: var(--color-text-secondary);
  font-weight: 800;
}

.content-box {
  aspect-ratio: 16 / 9;
  background: var(--color-primary-ultralight);
  border: none;
  border-radius: 0;
  margin-bottom: 0;
}

.content-box-pdf {
  display: block;
  padding: 0;
  aspect-ratio: auto;
  min-height: 520px;
  background: var(--color-bg-paper);
}

.course-pdf {
  width: 100%;
  height: 520px;
  border: none;
  display: block;
}

.pdf-link {
  display: inline-flex;
  margin: 0.8rem 1rem 1rem;
  color: var(--color-primary-orange);
  font-weight: 900;
  text-decoration: none;
}

.course-video {
  width: 100%;
  height: 100%;
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
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
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

.confirm-box-active {
  background: rgba(21, 148, 58, 0.06);
  border-color: rgba(21, 148, 58, 0.25);
}

.confirm-box-active input {
  accent-color: var(--color-success);
}

.course-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;

  border-top: 1px solid var(--color-border-light);
  padding-top: var(--space-6);
  margin-top: var(--space-6);
}

.course-nav-back,
.course-nav-next {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;

  background: transparent;
  border: none;

  color: var(--color-text-primary);

  font-size: var(--text-md);
  font-weight: 700;

  cursor: pointer;
  transition: all 0.2s ease;
}

.course-nav-back:hover:not(:disabled) {
  opacity: 0.7;
}

.course-nav-back:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.course-nav-back {
  background: transparent;
  color: var(--color-primary-medium);
  font-size: var(--text-md);
}

.course-nav-next {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;

  background: var(--color-primary-orange);
  color: white;

  border: none;
  border-radius: var(--radius-md);

  padding: 1rem 1.4rem;

  font-size: var(--text-md);
  font-weight: 800;

  cursor: pointer;

  transition:
    transform 0.2s ease,
    opacity 0.2s ease,
    background 0.2s ease;
}

.course-nav-next svg {
  position: relative;
  top: 3px;
}

.course-nav-next:hover:not(:disabled) {
  transform: translateY(-2px);
}

.course-nav-next:disabled {
  background: #f1f1f1;
  color: #b8b8b8;
  cursor: not-allowed;
}

.step-duration {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: var(--space-3);

  font-size: var(--text-sm);
  font-weight: 800;

  color: var(--color-primary-orange);

  background: rgba(239, 65, 35, 0.08);
  border-radius: 999px;

  padding: 0.45rem 0.85rem;
}
</style>
