<template>
  <div class="dashboard-home">
    <!-- HERO -->
    <section class="dashboard-hero">
      <div class="dashboard-hero-content">


        <h1>
          Velkommen tilbage,
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
            :class="{ active: activeFilter === 'all' }"
            @click="activeFilter = 'all'"
          >
            Alle
          </button>

          <button
            :class="{ active: activeFilter === 'active' }"
            @click="activeFilter = 'active'"
          >
            I gang
          </button>

          <button
            :class="{ active: activeFilter === 'completed' }"
            @click="activeFilter = 'completed'"
          >
            Afsluttede
          </button>
        </div>
      </div>

      <div class="course-grid">
        <AppCard
          v-for="course in filteredCourses"
          :key="course.id"
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

            <span class="badge">
              {{
                course.completed ? "Fuldført" : course.progress + "% gennemført"
              }}
            </span>
          </div>

          <h3>{{ course.title }}</h3>

          <p>{{ course.description }}</p>

          <AppButton variant="text" arrow>
            {{
              course.completed
                ? "Gense"
                : course.progress > 0
                  ? "Fortsæt"
                  : "Start"
            }}
          </AppButton>
        </AppCard>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

import AppCard from "../../components/ui/AppCard.vue";
import AppButton from "../../components/ui/AppButton.vue";

const router = useRouter();

const companyName = "Billund Design ApS";

const activeFilter = ref("all");

const courses = ref([
  {
    id: 1,
    icon: "▣",
    title: "Intro til Modulex Systemer",
    description: "En grundlæggende gennemgang af vores skiltesystemer.",
    progress: 45,
    completed: false,
  },
  {
    id: 2,
    icon: "▤",
    title: "Konfiguration & Bestilling",
    description: "Lær hvordan du bruger vores online værktøjer.",
    progress: 0,
    completed: false,
  },
  {
    id: 3,
    icon: "▣",
    title: "Brand Guidelines",
    description: "Sikr at din virksomhed repræsenterer Modulex korrekt.",
    progress: 100,
    completed: true,
  },
]);

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
  const first = courses.value[0];
  if (first) openCourse(first.id);
}
</script>
