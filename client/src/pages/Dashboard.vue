<template>
    <div class="dashboard-home">
        <div class="dashboard-admin-actions">
            <button class="btn btn-primary"
                    type="button"
                    @click="openCreateCourseForm">
                Opret kursus
            </button>

            <AppButton variant="light"
                       @click="resetData">
                Nulstil dummy data
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
                    Færdiggør dine åbne moduler for at få adgang til bestillingsportalen.
                </p>

                <AppButton arrow
                           @click="goToFirstCourse">
                    Fortsæt træning
                </AppButton>
            </div>

            <div class="dashboard-hero-pattern">
                <span v-for="n in 8"
                      :key="n"></span>
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

            <div v-if="filteredCourses.length > 0"
                 class="course-grid">
                <AppCard v-for="course in filteredCourses"
                         :key="course.id"
                         @click="openCourse(course.id)">
                    <div class="course-progress-top"
                         :style="{ width: course.progress + '%' }"></div>

                    <div class="card-header">
                        <div class="icon-box">
                            {{ course.icon }}c
                        </div>

                        <span class="badge"
                              :class="course.completed ? 'badge-success' : 'badge-muted'">
                            {{
                course.completed
                  ? "Fuldført"
                  : course.progress + "% gennemført"
                            }}
                        </span>
                    </div>

                    <h3 class="card-title">
                        {{ course.title }}
                    </h3>

                    <p class="card-text">
                        {{ course.description || "Ingen beskrivelse endnu." }}
                    </p>

                    <p class="card-text">
                        Moduler: {{ course.moduleCount }}
                    </p>

                    <div class="card-actions">
                        <AppButton variant="text"
                                   arrow>
                            {{ getCourseButtonText(course) }}
                        </AppButton>
                    </div>

                    <div class="dummy-crud-actions">
                        <button class="btn btn-light"
                                type="button"
                                @click.stop="setProgress(course.id, 50)">
                            Sæt til 50%
                        </button>

                        <button class="btn btn-primary"
                                type="button"
                                @click.stop="markAsComplete(course.id)">
                            Markér færdig
                        </button>
                    </div>
                </AppCard>
            </div>

            <div v-else
                 class="empty-state">
                <h3>Ingen kurser fundet</h3>
                <p>Opret et nyt kursus for at få det vist her.</p>
            </div>
        </section>

        <section class="survey-preview-section">
            <h2>{{ survey.title }}</h2>
            <p>{{ survey.description }}</p>

            <div class="survey-question-list">
                <div v-for="question in survey.questions"
                     :key="question.id"
                     class="survey-question-card">
                    <strong>{{ question.label }}</strong>
                    <p>Type: {{ question.type }}</p>

                    <ul v-if="question.options">
                        <li v-for="option in question.options"
                            :key="option">
                            {{ option }}
                        </li>
                    </ul>
                </div>
            </div>
        </section>

        <AdminCreateCourseForm v-if="showCreateCourseForm"
                               @close="closeCreateCourseForm" />
    </div>
</template>

<script setup>
    import { computed, ref } from "vue";
    import { useRouter } from "vue-router";

    import AppCard from "../components/ui/AppCard.vue";
    import AppButton from "../components/ui/AppButton.vue";
    import AdminCreateCourseForm from "../layouts/admin/AdminCreateCourseForm.vue";

    import {
        getCourses,
        getSurvey,
        completeCourse,
        updateCourseProgress,
        resetDummyData,
    } from "../data/dummyCourseService.js";

    const router = useRouter();

    const companyName = "Billund Design ApS";

    const activeFilter = ref("all");
    const showCreateCourseForm = ref(false);

    const survey = ref(getSurvey());
    const courses = ref(getCourses());

    const filteredCourses = computed(() => {
        if (activeFilter.value === "completed") {
            return courses.value.filter((course) => course.completed);
        }

        if (activeFilter.value === "active") {
            return courses.value.filter((course) => !course.completed);
        }

        return courses.value;
    });

    function refreshCourses() {
        courses.value = getCourses();
    }

    function openCourse(id) {
        router.push(`/dashboard/course/${id}`);
    }

    function goToFirstCourse() {
        const first = courses.value.find((course) => !course.completed);

        if (first) {
            openCourse(first.id);
            return;
        }

        if (courses.value[0]) {
            openCourse(courses.value[0].id);
        }
    }

    function getCourseButtonText(course) {
        if (course.completed) {
            return "Gense";
        }

        if (course.progress > 0) {
            return "Fortsæt";
        }

        return "Start";
    }

    function markAsComplete(courseId) {
        courses.value = completeCourse(courseId);
    }

    function setProgress(courseId, progress) {
        courses.value = updateCourseProgress(courseId, progress);
    }

    function resetData() {
        resetDummyData();
        survey.value = getSurvey();
        refreshCourses();
    }

    function openCreateCourseForm() {
        showCreateCourseForm.value = true;
    }

    function closeCreateCourseForm() {
        showCreateCourseForm.value = false;
        refreshCourses();
    }
</script>