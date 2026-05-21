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
        <span v-for="n in 8" :key="n"></span>
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
              {{ course.icon }}
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

<script setup>
import { computed, ref, onMounted } from "vue";
import { useRouter } from "vue-router";

import AppCard from "../../components/ui/AppCard.vue";
import AppButton from "../../components/ui/AppButton.vue";

import {
  dummyCourses,
  dummyModules,
  dummyUserProgresses,
} from "../../data/dummyData.js";

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
      modules: courseModules,
    };
  });
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
</style>
