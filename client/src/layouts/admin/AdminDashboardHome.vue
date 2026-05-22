<template>
    <div class="admin-dashboard">
        <div class="admin-header">
            <div>
                <h1>Administration</h1>
                <p>Administrér brugere, kurser og se statistik.</p>
            </div>

            <button class="create-course-btn"
                    type="button"
                    @click="showCreateCourseModal= true">
                Opret kursus
            </button>
        </div>

        <div class="stats-grid">
            <AppCard class="stat-card">
                <div class="card-icon">
                    <Users :size="20" />
                </div>

                <p>AKTIVE PARTNERE</p>
                <h2>{{ partners.length }}</h2>
            </AppCard>

            <AppCard class="stat-card">
                <div class="card-icon">
                    <BookOpen :size="20" />
                </div>

                <p>AKTIVE KURSER</p>
                <h2>{{ courses.length }}</h2>
            </AppCard>

            <AppCard class="stat-card">
                <div class="card-icon">
                    <TrendingUp :size="20" />
                </div>

                <p>NYE LEADS</p>
                <h2>8</h2>
            </AppCard>
        </div>

        <div class="partner-section">
            <h3 class="table-title">
                PARTNERE OG LEADS
            </h3>

            <div class="table-header">
                <span>Partner</span>
                <span>Status</span>
                <span>Survey</span>
                <span>Handlinger</span>
            </div>

            <div class="partner-row"
                 v-for="partner in partners"
                 :key="partner.id">
                <div class="partner-info">
                    <strong>{{ partner.name }}</strong>
                    <p>{{ partner.company }}</p>

                    <small v-if="getPartnerAssignedCount(partner.id) > 0">
                        {{ getPartnerAssignedCount(partner.id) }} kursus/kurser tildelt
                    </small>
                </div>

                <span class="status"
                      :class="partner.statusClass">
                    {{ partner.status }}
                </span>

                <button class="survey-btn"
                        type="button">
                    SE SVAR
                </button>

                <button class="approve-btn"
                        type="button"
                        @click="handlePartnerAction(partner)">
                    {{ partner.action }}
                </button>
            </div>
        </div>

        <div v-if="showAssignModal && selectedPartner"
             class="assign-modal-overlay">
            <div class="assign-modal">
                <header class="assign-modal-header">
                    <div>
                        <h2>Tildel kurser til {{ selectedPartner.name }}</h2>
                        <p>Vælg de kurser som denne partner skal gennemgå.</p>
                    </div>

                    <button class="assign-modal-close"
                            type="button"
                            @click="closeAssignModal">
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
                            @click="closeAssignModal">
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
        <AdminCreateCourseForm
    v-if="showCreateCourseModal"
    @close="showCreateCourseModal = false"
/>
    </div>
</template>

<script setup>
    import { computed, ref } from "vue";

    import AppCard from "../../components/ui/AppCard.vue";
    import AdminCreateCourseForm from "./AdminCreateCourseForm.vue";

    import {
        Users,
        BookOpen,
        TrendingUp,
    } from "lucide-vue-next";

    import {
        dummyPartners,
        dummyCourses,
        dummyCourseAssignments,
    } from "../../data/dummyData.js";

    const ASSIGNMENTS_KEY = "modulex_course_assignments";

    const courses = ref(
        dummyCourses.map((course, index) => {
            return {
                id: course._id,
                icon: index % 2 === 0 ? "▣" : "▤",
                title: course.title,
                description: course.description,
            };
        })
    );

    const partners = ref([...dummyPartners]);

    const showAssignModal = ref(false);
    const selectedPartner = ref(null);
    const selectedCourseIds = ref([]);
    const courseSearch = ref("");
    const refreshKey = ref(0);
    const showCreateCourseModal = ref(false);

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

    function getAssignments() {
        const savedAssignments = localStorage.getItem(ASSIGNMENTS_KEY);

        if (savedAssignments) {
            return JSON.parse(savedAssignments);
        }

        localStorage.setItem(
            ASSIGNMENTS_KEY,
            JSON.stringify(dummyCourseAssignments)
        );

        return dummyCourseAssignments;
    }

    function saveAssignments(assignments) {
        localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
    }

    function getPartnerAssignedCount(partnerId) {
        refreshKey.value;

        const assignments = getAssignments();

        return assignments[partnerId]?.length || 0;
    }

    function handlePartnerAction(partner) {
        if (partner.action === "Godkend Partner") {
            partner.status = "I gang";
            partner.statusClass = "active";
            partner.action = "Tildel kurser";
            return;
        }

        if (partner.action === "Tildel kurser") {
            openAssignModal(partner);
            return;
        }

        alert(`Viser partner: ${partner.name}`);
    }

    function openAssignModal(partner) {
        const assignments = getAssignments();

        selectedPartner.value = partner;
        selectedCourseIds.value = assignments[partner.id] || [];
        courseSearch.value = "";
        showAssignModal.value = true;
    }

    function closeAssignModal() {
        showAssignModal.value = false;
        selectedPartner.value = null;
        selectedCourseIds.value = [];
        courseSearch.value = "";
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
        if (!selectedPartner.value) return;

        const assignments = getAssignments();

        assignments[selectedPartner.value.id] = selectedCourseIds.value;

        saveAssignments(assignments);

        refreshKey.value++;

        closeAssignModal();
    }
</script>

<style scoped>
    .admin-dashboard {
        padding: 40px;
    }

    .admin-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

        .admin-header h1 {
            font-size: 42px;
            font-weight: 700;
            margin-bottom: 8px;
        }

        .admin-header p {
            color: #666;
        }

    .create-course-btn {
        background: #ff4d26;
        color: white;
        border: none;
        padding: 14px 24px;
        border-radius: 10px;
        cursor: pointer;
        font-weight: 600;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
        margin-top: 40px;
    }

    .stat-card {
        background: white;
        border-radius: 18px;
        padding: 24px;
        min-height: 158px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
    }

        .stat-card p {
            font-size: 12px;
            color: #666;
            margin-bottom: 12px;
        }

        .stat-card h2 {
            font-size: 36px;
            font-weight: 700;
            margin: 0;
        }

    .partner-section {
        background: white;
        border-radius: 18px;
        padding: 24px;
        margin-top: 40px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
    }

    .table-title {
        margin-bottom: 20px;
    }

    .table-header {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr;
        align-items: center;
        background: #f5f5f5;
        margin: 0 -24px;
        padding: 18px 24px;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        color: #666;
        column-gap: 40px;
    }

    .partner-row {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr;
        align-items: center;
        padding: 24px 0;
        border-bottom: 1px solid #f0f0f0;
        column-gap: 40px;
    }

        .partner-row:hover {
            background: #fafafa;
        }

    .partner-info strong {
        display: block;
        font-size: 14px;
        margin-bottom: 4px;
    }

    .partner-info p {
        font-size: 13px;
        color: #777;
    }

    .partner-info small {
        display: block;
        margin-top: 6px;
        color: #ff4d26;
        font-weight: 700;
    }

    .status {
        font-size: 12px;
        font-weight: 700;
        display: inline-flex;
        align-items: center;
        text-transform: uppercase;
        justify-self: start;
    }

    .pending {
        color: #a855f7;
    }

    .active {
        color: #ff5b2e;
    }

    .approved {
        color: #22c55e;
    }

    .survey-btn {
        background: white;
        border: 1px solid #ddd;
        color: #444;
        padding: 10px 18px;
        border-radius: 10px;
        width: fit-content;
        height: fit-content;
        justify-self: start;
        font-weight: 700;
        cursor: pointer;
    }

    .approve-btn {
        background: #ff4d26;
        color: white;
        border: none;
        padding: 12px 18px;
        border-radius: 10px;
        font-weight: 600;
        width: fit-content;
        height: fit-content;
        justify-self: start;
        cursor: pointer;
    }

    .card-icon {
        width: 42px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f5f5;
        border-radius: 12px;
        margin-bottom: 18px;
    }

    .assign-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: rgba(0, 0, 0, 0.42);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
    }

    .assign-modal {
        width: 100%;
        max-width: 620px;
        max-height: 86vh;
        background: white;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 24px 70px rgba(0, 0, 0, 0.18);
        display: flex;
        flex-direction: column;
    }

    .assign-modal-header {
        padding: 32px 32px 20px;
        display: flex;
        justify-content: space-between;
        gap: 24px;
    }

        .assign-modal-header h2 {
            font-size: 22px;
            margin-bottom: 8px;
            color: #171717;
        }

        .assign-modal-header p {
            color: #666;
        }

    .assign-modal-close {
        border: none;
        background: transparent;
        font-size: 32px;
        cursor: pointer;
        color: #999;
    }

    .assign-search {
        padding: 0 32px 24px;
    }

        .assign-search input {
            width: 100%;
            border: none;
            background: #f8f8f8;
            border-radius: 14px;
            padding: 16px 18px;
            font-size: 14px;
        }

    .assign-course-list {
        padding: 24px 32px;
        display: grid;
        gap: 16px;
        overflow-y: auto;
    }

    .assign-course-card {
        width: 100%;
        border: 1px solid #eee;
        background: white;
        border-radius: 14px;
        padding: 18px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        text-align: left;
        cursor: pointer;
    }

        .assign-course-card strong {
            font-size: 15px;
            color: #171717;
        }

        .assign-course-card p {
            margin-top: 6px;
            color: #666;
            font-size: 13px;
            line-height: 1.4;
        }

    .assign-course-card-active {
        border-color: #ff4d26;
        background: rgba(255, 77, 38, 0.04);
    }

    .assign-icon {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: #eee;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #777;
        font-weight: 900;
        flex-shrink: 0;
        margin-left: 16px;
    }

    .assign-course-card-active .assign-icon {
        background: #ff4d26;
        color: white;
    }

    .assign-modal-footer {
        padding: 24px 32px 32px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        background: #fafafa;
    }

    .assign-btn {
        border: none;
        padding: 16px 20px;
        border-radius: 14px;
        font-weight: 800;
        cursor: pointer;
    }

    .assign-btn-light {
        background: white;
        color: #222;
        border: 1px solid #eee;
    }

    .assign-btn-dark {
        background: #171717;
        color: white;
    }
</style>