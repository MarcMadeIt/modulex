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

    <div v-if="usingDummyData" class="dummy-data-note">
      Dette er dummydata — backend-data kunne ikke hentes endnu.
    </div>
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

          <button
            class="filter-button filter-button-reset"
            @click="resetDummyData"
          >
            Nulstil data
          </button>
        </div>
      </div>

      <div class="course-grid">
        <AppCard
          v-for="course in filteredCourses"
          :key="course.id"
          class="course-card"
          @click="openCourse(course.id)"
        >
          <div
            class="course-progress-top"
            :style="{ width: course.progress + '%' }"
          />

          <div class="card-header">
            <div class="icon-box">
              <BookOpen />
            </div>

            <span
              class="badge"
              :class="course.completed ? 'badge-success' : 'badge-muted'"
            >
              {{
                course.completed ? "Fuldført" : course.progress + "% gennemført"
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
    </section>
  </div>
</template>

<!-- <script setup>
import { computed, ref, onMounted } from "vue";
import { useRouter } from "vue-router";

import AppCard from "../../components/ui/AppCard.vue";
import AppButton from "../../components/ui/AppButton.vue";

import {
  dummyCourses,
  dummyModules,
  dummyUserProgresses,
} from "../../data/dummyData.js";

import {
  BookOpen,
  Clock3,
  CircleCheck,
  GraduationCap,
  Book,
} from "lucide-vue-next";

const router = useRouter();

const companyName = "Billund Design ApS";
const activeFilter = ref("all");

const courses = ref([]);

onMounted(() => {
  loadCourses();
});
const STORAGE_KEY = "modulex_dummy_data";
const CURRENT_USER_ID = "665000000000000000000002";

function getData() {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (savedData) {
    return JSON.parse(savedData);
  }

  const initialData = {
    courses: dummyCourses,
    modules: dummyModules,
    userProgresses: dummyUserProgresses,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));

  return initialData;
}

function mapCoursesForFrontend(data) {
  return data.courses.map((course, index) => {
    const progressData = data.userProgresses.find(
      (progress) =>
        progress.courseId === course._id && progress.userId === CURRENT_USER_ID,
    );

    const courseModules = data.modules.filter(
      (module) => module.courseId === course._id,
    );

    const progress = progressData ? progressData.progress : 0;

    return {
      id: course._id,
      icon: index % 2 === 0 ? "▣" : "▤",
      title: course.title,
      description: course.description,
      progress,
      completed: progress >= 100,
      moduleCount: courseModules.length,
      totalDuration: getTotalDuration(courseModules),
      modules: courseModules,
    };
  });

  function getTotalDuration(modules) {
    return modules.reduce((total, module) => {
      const minutes = parseInt(module.duration) || 0;
      return total + minutes;
    }, 0);
  }
}

function loadCourses() {
  const data = getData();
  courses.value = mapCoursesForFrontend(data);
}

function resetDummyData() {
  localStorage.removeItem(STORAGE_KEY);
  loadCourses();
}
const filteredCourses = computed(() => {
  if (activeFilter.value === "completed") {
    return courses.value.filter((c) => c.completed);
  }

  if (activeFilter.value === "active") {
    return courses.value.filter((c) => !c.completed);
  }

  return courses.value;
});

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
</script> -->

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import AppCard from "../../components/ui/AppCard.vue";
import AppButton from "../../components/ui/AppButton.vue";

import {
  dummyCourses,
  dummyModules,
  dummyUserProgresses,
} from "../../data/dummyData.js";

import { BookOpen, Clock3, CircleCheck, GraduationCap } from "lucide-vue-next";

const router = useRouter();

const STORAGE_KEY = "modulex_dummy_data";

const activeFilter = ref("all");
const courses = ref([]);
const currentUser = ref(null);
const loading = ref(true);
const usingDummyData = ref(false);

const companyName = computed(() => {
  /*
    BACKEND-USIKKERHED:
    Vi ved endnu ikke præcis hvordan /auth/me returnerer virksomhedsnavn.
    Derfor prøver vi flere mulige felter.
  */
  return (
    currentUser.value?.companyName ||
    currentUser.value?.company?.name ||
    currentUser.value?.businessName ||
    currentUser.value?.email ||
    "din virksomhed"
  );
});

onMounted(() => {
  loadDashboard();
});

async function loadDashboard() {
  loading.value = true;

  try {
    const token = localStorage.getItem("modulex_token");

    if (!token) {
      throw new Error("Ingen token fundet — bruger dummydata");
    }

    const user = await fetchCurrentUser(token);
    const apiCourses = await fetchCourses(token);

    currentUser.value = user;
    courses.value = mapApiCoursesForFrontend(apiCourses);

    usingDummyData.value = false;
  } catch (error) {
    console.warn("Kunne ikke hente backend-data:", error);

    loadDummyDashboard();
    usingDummyData.value = true;
  } finally {
    loading.value = false;
  }
}

async function fetchCurrentUser(token) {
  /*
    BACKEND:
    Swagger viser GET /auth/me.
    Den bør returnere den aktive bruger baseret på JWT-token.
  */
  const response = await fetch("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Kunne ikke hente aktiv bruger");
  }

  return await response.json();
}

async function fetchCourses(token) {
  /*
    BACKEND:
    Swagger siger GET /courses = "Get all courses accessible to the authenticated user".
    Vi antager derfor, at endpointet kun returnerer de kurser,
    som Modulex har tildelt denne virksomhed.
  */
  const response = await fetch("/courses", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Kunne ikke hente kurser");
  }

  return await response.json();
}

function mapApiCoursesForFrontend(apiCourses) {
  /*
    BACKEND-USIKKERHED:
    Vi kender ikke endeligt API-format endnu.
    Derfor mapper vi defensivt og accepterer både:
    - id / _id
    - modules / items
    - progress / progressPercentage
  */

  return apiCourses.map((course, index) => {
    const modules = course.modules || course.items || [];
    const progress = course.progress ?? course.progressPercentage ?? 0;

    return {
      id: course._id,
      icon: index % 2 === 0 ? "▣" : "▤",
      title: course.title,
      description: course.description,
      progress,
      completed: course.completed ?? progress >= 100,
      moduleCount: modules.length,
      totalDuration: getTotalDuration(modules),
      modules,
    };
  });
}

function loadDummyDashboard() {
  const data = getDummyData();

  /*
    Midlertidig dummy-user.
    Når Signup/Login er koblet på backend, kommer denne fra /auth/me.
  */
  currentUser.value = {
    id: "6a0f11ec0f551b25ef759773",
    email: "test@test.dk",
    companyName: "Billund Design ApS",
    role: "client",
    status: "active",
  };

  courses.value = mapDummyCoursesForFrontend(data);
}

function getDummyData() {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (savedData) {
    return JSON.parse(savedData);
  }

  const initialData = {
    courses: dummyCourses,
    modules: dummyModules,
    userProgresses: dummyUserProgresses,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));

  return initialData;
}

function mapDummyCoursesForFrontend(data) {
  const userId = currentUser.value?.id;

  /*
    DUMMY-ANTAGELSE:
    Vi bruger userProgresses som "course assignment".
    Dvs. hvis en bruger har progress på et courseId,
    betragter vi kurset som tildelt brugeren.
    
    Når backend er klar, skal dette erstattes af GET /courses.
  */
  const assignedCourseIds = data.userProgresses
    .filter((progress) => progress.userId === userId)
    .map((progress) => progress.courseId);

  return data.courses
    .filter((course) => {
      /*
        Hvis der ikke findes assignments til testbrugeren,
        viser vi alle dummy-kurser, så UI stadig kan testes.
      */
      if (assignedCourseIds.length === 0) return true;

      return assignedCourseIds.includes(course._id);
    })
    .map((course, index) => {
      const progressData = data.userProgresses.find(
        (progress) =>
          progress.courseId === course._id && progress.userId === userId,
      );

      const courseModules = data.modules.filter(
        (module) => module.courseId === course._id,
      );

      const progress = progressData ? progressData.progress : 0;

      return {
        id: course._id,
        icon: index % 2 === 0 ? "▣" : "▤",
        title: course.title,
        description: course.description,
        progress,
        completed: progress >= 100,
        moduleCount: courseModules.length,
        totalDuration: getTotalDuration(courseModules),
        modules: courseModules,
      };
    });
}

function getTotalDuration(modules) {
  return modules.reduce((total, module) => {
    /*
      DUMMYDATA:
      duration ligger som string, fx "8 min".
      parseInt("8 min") bliver 8.
    */
    const minutes = parseInt(module.duration) || 0;
    return total + minutes;
  }, 0);
}

const filteredCourses = computed(() => {
  if (activeFilter.value === "completed") {
    return courses.value.filter((course) => course.completed);
  }

  if (activeFilter.value === "active") {
    return courses.value.filter((course) => !course.completed);
  }

  return courses.value;
});

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

/* temporary reset button */
.filter-button-reset {
  background: var(--color-error-bg);
  color: var(--color-error);
}

.filter-button-reset:hover {
  background: var(--color-error);
  color: white;
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
  bottom: -140px;
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
</style>
