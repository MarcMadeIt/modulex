<template>
  <div class="dashboard-home">
    <!-- HERO -->
    <section class="dashboard-hero">
      <div class="dashboard-hero-content">
        <h1>
          Velkommen,
          <span>{{ companyName }}</span>
        </h1>
        <p>
          Du er godt på vej til at blive Modulex certificeret partner. Færdiggør
          dine åbne moduler for at få adgang til bestillingsportalen.
        </p>

        <AppButton arrow @click="goToFirstCourse"> Fortsæt træning </AppButton>
      </div>

      <div class="dashboard-hero-pattern">
        <span v-for="n in 12" :key="n"></span>
      </div>
    </section>

    <!-- COURSES -->
    <section class="course-section">
      <div class="course-section-header">
        <div class="section-title">
          <span class="section-icon">🎓</span>
          <h2>Dine kurser</h2>
        </div>

        <div class="course-filters">
          <button
            class="filter-button"
            :class="{ active: activeFilter === 'all' }"
            @click="activeFilter = 'all'"
          >
            Alle
          </button>

          <button
            class="filter-button"
            :class="{ active: activeFilter === 'active' }"
            @click="activeFilter = 'active'"
          >
            I gang
          </button>

          <button
            class="filter-button"
            :class="{ active: activeFilter === 'completed' }"
            @click="activeFilter = 'completed'"
          >
            Afsluttede
          </button>
        </div>
      </div>

      <div v-if="errorMessage" class="dashboard-error">
        {{ errorMessage }}
      </div>

      <div v-if="loading" class="spinner-wrapper">
        <div class="spinner"></div>
      </div>

      <div v-else-if="filteredCourses.length > 0" class="course-grid">
        <AppCard
          v-for="course in filteredCourses"
          :key="course.id"
          class="course-card"
          @click="openCourse(course.id)"
        >
          <!-- <div
            class="course-progress-top"
            :style="{ width: course.progress + '%' }"
          /> -->
          <ProgressBar :percentage="course.progress" />

          <div class="card-header">
            <div class="icon-box">
              <BookOpen />
            </div>

            <span
              class="badge"
              :class="course.completed ? 'badge-success' : 'badge-muted'"
            >
              {{
                course.completed ? "Fuldført" : `${course.progress}% gennemført`
              }}
            </span>
          </div>

          <h3 class="card-title">
            {{ course.title }}
          </h3>

          <p class="card-text">
            {{ course.description }}
          </p>
          <div class="course-card-meta">
            <span>{{ course.moduleCount }} moduler</span>
            <span class="meta-dot">•</span>
            <span>{{ course.totalDuration }} min</span>
          </div>

          <div class="card-actions">
            <AppButton variant="text" arrow>
              {{
                course.completed
                  ? "Gense"
                  : course.progress > 0
                    ? "Fortsæt"
                    : "Start"
              }}
            </AppButton>
          </div>
        </AppCard>
      </div>

      <div v-else class="empty-state">
        Der er endnu ikke tildelt kurser til denne bruger.
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { useRouter } from "vue-router";

import { auth } from "../../stores/auth";
import AppCard from "../../components/ui/AppCard.vue";
import AppButton from "../../components/ui/AppButton.vue";
import ProgressBar from "../../components/ui/ProgressBar.vue";

import {
  BookOpen,
  Clock3,
  CircleCheck,
  GraduationCap,
  Book,
} from "lucide-vue-next";

const router = useRouter();
const API_URL = import.meta.env.VITE_API_URL;

const activeFilter = ref("all");
const courses = ref([]);
const currentUser = ref(null);
const loading = ref(true);
const errorMessage = ref("");

const companyName = computed(() => {
  return (
    currentUser.value?.companyName ||
    currentUser.value?.company ||
    currentUser.value?.name ||
    currentUser.value?.contactPerson ||
    currentUser.value?.email ||
    "din virksomhed"
  );
});

const filteredCourses = computed(() => {
  if (activeFilter.value === "completed") {
    return courses.value.filter((course) => course.completed);
  }

  if (activeFilter.value === "active") {
    return courses.value.filter((course) => !course.completed);
  }

  return courses.value;
});

onMounted(() => {
  loadDashboard();
});

async function loadDashboard() {
  loading.value = true;
  errorMessage.value = "";

  try {
    await loadAuthUser();

    const response = await fetch(`${API_URL}/courses`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Kunne ikke hente kurser: HTTP ${response.status}`);
    }

    const data = await response.json();

    console.log("COURSES FROM API:", data);

    const apiCourses = data.courses || data;

    if (!Array.isArray(apiCourses)) {
      throw new Error("API returnerede ikke en gyldig kursusliste.");
    }

    courses.value = mapApiCoursesForFrontend(apiCourses);
  } catch (error) {
    console.error("Dashboard fejl:", error);

    courses.value = [];
    errorMessage.value =
      error.message || "Noget gik galt, da dashboardet skulle indlæses.";
  } finally {
    loading.value = false;
  }
}

async function loadAuthUser() {
  if (!auth.state.ready) {
    await auth.fetchMe();
  }

  if (!auth.state.user) {
    throw new Error("Du er ikke logget ind, eller sessionen er udløbet.");
  }

  currentUser.value = auth.state.user;
}

function mapApiCoursesForFrontend(apiCourses) {
  return apiCourses.map((course) => {
    const apiProgress = Number(course.progressPct) || 0;
    const totalModules = course.totalModules ?? 0;

    const progress = getLocalCourseProgress(
      course._id || course.id,
      apiProgress,
      totalModules,
    );

    return {
      id: course._id || course.id,
      title: course.title,
      description: course.description || "",
      progress,
      completed: progress >= 100,
      moduleCount: totalModules,
      completedModules: course.completedModules ?? 0,
      totalDuration: course.totalDuration ?? 0,
    };
  });
}

function mapModuleForFrontend(module) {
  return {
    id: module._id || module.id,
    courseId: module.courseId,
    title: module.title,
    description: module.description || "",
    order: module.order || 0,
    duration: module.duration || "",
    materials: module.materials || module.contents || [],
    completed: false,
  };
}

function getTotalDuration(modules) {
  return modules.reduce((total, module) => {
    const minutes = parseInt(module.duration) || 0;
    return total + minutes;
  }, 0);
}

function openCourse(id) {
  router.push(`/dashboard/course/${id}`);
}

function goToFirstCourse() {
  const firstActiveCourse =
    courses.value.find((course) => !course.completed) || courses.value[0];

  if (firstActiveCourse) {
    openCourse(firstActiveCourse.id);
  }
}

function getCourseButtonText(course) {
  if (course.completed) return "Gense";
  if (course.progress > 0) return "Fortsæt";
  return "Start";
}

function getLocalCourseProgress(courseId, apiProgress = 0, totalModules = 0) {
  const saved = localStorage.getItem(`modulex_progress_${courseId}`);

  if (!saved || totalModules === 0) {
    return apiProgress;
  }

  try {
    const completedModuleIds = JSON.parse(saved);

    return Math.round((completedModuleIds.length / totalModules) * 100);
  } catch {
    return apiProgress;
  }
}
</script>

<style scoped>
.course-card {
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card);
}

.course-card {
  min-height: 260px;
  padding: var(--space-5);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}

.icon-box {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: rgba(239, 65, 35, 0.08);
  color: var(--color-primary-orange);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
}

.course-card .card-title {
  font-size: var(--text-md);
  margin-bottom: var(--space-3);
}

.course-card .card-text {
  min-height: 48px;
  line-height: 1.5;
}

.course-card-meta {
  display: flex;
  gap: var(--space-4);
  margin-top: var(--space-5);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: 800;
  text-transform: uppercase;
}

.course-card .card-actions {
  margin-top: var(--space-5);
}

.meta-dot {
  opacity: 0.4;
}

.dashboard-hero {
  position: relative;
  overflow: hidden;
  display: flex;
  min-height: 280px;
  padding: 48px 64px;
  border-radius: 32px;
  background: #191919;
  color: #fff;
}

.dashboard-hero-content {
  position: relative;
  z-index: 2;
  max-width: 680px;
}

.dashboard-hero h1 {
  margin: 0 0 20px;
  font-size: clamp(36px, 3.6vw, 56px);
  line-height: 1.05;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.dashboard-hero h1 span {
  color: #ff3b22;
}

.dashboard-hero p {
  max-width: 760px;
  margin: 0 0 40px;
  color: #a6adba;
  font-size: clamp(18px, 1.6vw, 28px);
  line-height: 1.55;
  font-weight: 500;
}

.dashboard-hero-pattern {
  position: absolute;
  right: -72px;
  bottom: -100px;
  z-index: 1;

  width: 48%;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 22px;
  padding: 28px 0;

  opacity: 0.1;
  pointer-events: none;
}

.dashboard-hero-pattern span {
  aspect-ratio: 1;
  border-radius: 14px;
  background: #fff;
  transform: scale(1);
  transition:
    transform 350ms ease,
    opacity 350ms ease;
}

.dashboard-hero:hover .dashboard-hero-pattern span {
  transform: scale(1.08);
  opacity: 1;
}

.dashboard-hero-pattern span:nth-child(1) {
  transition-delay: 50ms;
}

.dashboard-hero-pattern span:nth-child(2) {
  transition-delay: 100ms;
}

.dashboard-hero-pattern span:nth-child(3) {
  transition-delay: 150ms;
}

.dashboard-hero-pattern span:nth-child(4) {
  transition-delay: 200ms;
}

.dashboard-hero-pattern span:nth-child(5) {
  transition-delay: 250ms;
}

.dashboard-hero-pattern span:nth-child(6) {
  transition-delay: 300ms;
}

.dashboard-hero-pattern span:nth-child(7) {
  transition-delay: 350ms;
}

.dashboard-hero-pattern span:nth-child(8) {
  transition-delay: 400ms;
}

.dashboard-hero-pattern span:nth-child(9) {
  transition-delay: 450ms;
}

.dashboard-hero-pattern span:nth-child(10) {
  transition-delay: 500ms;
}

.dashboard-hero-pattern span:nth-child(11) {
  transition-delay: 550ms;
}

.dashboard-hero-pattern span:nth-child(12) {
  transition-delay: 600ms;
}

.dashboard-error {
  margin: 1.5rem 0;
  padding: 1rem 1.2rem;
  border-radius: 12px;
  background: rgba(239, 65, 35, 0.08);
  color: var(--color-primary-orange);
  font-weight: 800;
}

.empty-state {
  padding: 2rem;
  color: var(--color-text-secondary);
  font-weight: 800;
}
</style>
