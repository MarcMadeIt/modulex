<template>
    <div class="dashboard-home">
        <div class="dashboard-admin-actions">
            <AppButton variant="primary"
                       arrow
                       @click="openCreateCourseForm">
                Opret kursus
            </AppButton>
        </div>

        <section class="dashboard-hero">
            <div class="dashboard-hero-content">
                <h1>
                    Velkommen tilbage,
                    <span>{{ companyName }}</span>
                </h1>

                <p>
                    Du er godt på vej til at blive Modulex certificeret partner.
                    Færdiggør dine åbne moduler for at få adgang til
                    bestillingsportalen.
                </p>

                <AppButton arrow>
                    Fortsæt træning
                </AppButton>
            </div>

            <div class="dashboard-hero-pattern">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
            </div>
        </section>

        <section class="course-section">
            <div class="course-section-header">
                <div class="section-title">
                    <span class="section-icon">🎓</span>
                    <h2>Dine kurser</h2>
                </div>

                <div class="course-filters">
                    <button class="filter-button"
                            :class="{ 'filter-button-active': activeFilter === 'all' }"
                            @click="activeFilter = 'all'">
                        Alle
                    </button>

                    <button class="filter-button"
                            :class="{ 'filter-button-active': activeFilter === 'active' }"
                            @click="activeFilter = 'active'">
                        I gang
                    </button>

                    <button class="filter-button"
                            :class="{ 'filter-button-active': activeFilter === 'completed' }"
                            @click="activeFilter = 'completed'">
                        Afsluttede
                    </button>
                </div>
            </div>

            <div class="course-grid">
                <AppCard v-for="course in filteredCourses"
                         :key="course.id">
                    <div class="course-progress-top"
                         :style="{ width: `${course.progress}%` }"></div>

                    <div class="card-header">
                        <div class="icon-box">
                            {{ course.icon }}c
                        </div>

                        <span class="badge"
                              :class="course.completed ? 'badge-success' : 'badge-muted'">
                            {{
                course.completed
                  ? "Fuldført"
                  : `${course.progress}% gennemført`
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

        <AdminCreateCourseForm v-if="showCreateCourseForm"
                               @close="closeCreateCourseForm" />
    </div>
</template>

<script setup>
    import { computed, ref } from "vue";

    import AppCard from "../components/ui/AppCard.vue";
    import AppButton from "../components/ui/AppButton.vue";
    import AdminCreateCourseForm from "./admin/AdminCreateCourseForm.vue";

    const companyName = "Billund Design ApS";

    const activeFilter = ref("all");
    const showCreateCourseForm = ref(false);

    const courses = [
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
    ];

    const filteredCourses = computed(() => {
        if (activeFilter.value === "completed") {
            return courses.filter((course) => course.completed);
        }

        if (activeFilter.value === "active") {
            return courses.filter((course) => !course.completed);
        }

        return courses;
    });

    const openCreateCourseForm = () => {
        showCreateCourseForm.value = true;
    };

    const closeCreateCourseForm = () => {
        showCreateCourseForm.value = false;
    };
</script>