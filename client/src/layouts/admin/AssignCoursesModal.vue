<template>
    <div class="assign-modal-overlay">
        <div class="assign-modal">
            <header class="assign-modal-header">
                <div>
                    <h2>Tildel kurser til {{ partner.name }}</h2>
                    <p>Vælg de kurser som denne partner skal gennemgå.</p>
                </div>

                <button class="assign-modal-close"
                        type="button"
                        @click="closeModal">
                    ×
                </button>
            </header>

            <div class="assign-search">
                <input v-model="courseSearch"
                       type="text"
                       placeholder="Søg i kurser..." />
            </div>

            <div class="assign-course-list">
                <button v-for="course in filteredCourses"
                        :key="course.id"
                        class="assign-course-card"
                        :class="{
            'assign-course-card-active': selectedCourseIds.includes(course.id)
          }"
                        type="button"
                        @click="toggleCourse(course.id)">
                    <div>
                        <strong>{{ course.title }}</strong>
                        <p>{{ course.description }}</p>
                    </div>

                    <span class="assign-icon">
                        {{ selectedCourseIds.includes(course.id) ? "✓" : "+" }}
                    </span>
                </button>
            </div>

            <footer class="assign-modal-footer">
                <button class="assign-btn assign-btn-light"
                        type="button"
                        @click="closeModal">
                    Annuller
                </button>

                <button class="assign-btn assign-btn-dark"
                        type="button"
                        @click="saveAssignedCourses">
                    Gem ændringer
                </button>
            </footer>
        </div>
    </div>
</template>

<script setup>
    import { computed, ref } from "vue";

    import { getCourses } from "../../data/dummyCourseService.js";

    import {
        dummyCourseAssignments,
    } from "../../data/dummyData.js";

    const props = defineProps({
        partner: {
            type: Object,
            required: true,
        },
    });

    const emit = defineEmits(["close", "saved"]);

    // In-memory assignment-map som erstatter den tidligere localStorage-cache.
    // Seedes fra dummyCourseAssignments første gang modulet importeres.
    const assignmentMap = { ...dummyCourseAssignments };

    const courses = ref(getCourses());
    const courseSearch = ref("");

    const selectedCourseIds = ref(getAssignedCourseIds(props.partner.id));

    const filteredCourses = computed(() => {
        const search = courseSearch.value.toLowerCase().trim();

        if (!search) {
            return courses.value;
        }

        return courses.value.filter((course) => {
            return (
                course.title.toLowerCase().includes(search) ||
                course.description.toLowerCase().includes(search)
            );
        });
    });

    function getAssignedCourseIds(partnerId) {
        return assignmentMap[partnerId] || [];
    }

    function toggleCourse(courseId) {
        if (selectedCourseIds.value.includes(courseId)) {
            selectedCourseIds.value = selectedCourseIds.value.filter(
                (id) => id !== courseId
            );

            return;
        }

        selectedCourseIds.value.push(courseId);
    }

    function saveAssignedCourses() {
        assignmentMap[props.partner.id] = selectedCourseIds.value;

        emit("saved");
        emit("close");
    }

    function closeModal() {
        emit("close");
    }
</script>