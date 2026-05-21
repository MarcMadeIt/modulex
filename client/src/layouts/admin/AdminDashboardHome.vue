<template>
    <div class="admin-dashboard">
        <div class="admin-header">
            <div>
                <h1>Administration</h1>
                <p>Administrér brugere, kurser og se statistik.</p>
            </div>

            <div class="admin-header-actions">
                <button class="create-lead-btn"
                        type="button"
                        @click="openCreateLeadModal">
                    + Opret lead / kunde
                </button>

                <button class="create-course-btn"
                        type="button">
                    + Opret kursus
                </button>
            </div>
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
                <h2>{{ leads.length }}</h2>
            </AppCard>
        </div>

        <div class="partner-section">
            <div class="partner-section-top">
                <h3 class="table-title">
                    PARTNERE OG LEADS
                </h3>

                <div class="admin-tabs">
                    <button type="button"
                            :class="{ 'admin-tab-active': activeTab === 'partners' }"
                            @click="activeTab = 'partners'">
                        Aktive partnere ({{ filteredPartners.length }})
                    </button>

                    <button type="button"
                            :class="{ 'admin-tab-active': activeTab === 'leads' }"
                            @click="activeTab = 'leads'">
                        Leads & onboarding ({{ filteredLeads.length }})
                    </button>
                </div>
            </div>

            <div class="admin-search">
                <input v-model="searchQuery"
                       type="text"
                       placeholder="Søg efter navn, virksomhed eller mail..." />
            </div>

            <!-- PARTNERE -->
            <template v-if="activeTab === 'partners'">
                <div class="table-header">
                    <span>Partner</span>
                    <span>Status</span>
                    <span>Survey</span>
                    <span>Handlinger</span>
                </div>

                <div class="partner-row"
                     v-for="partner in filteredPartners"
                     :key="partner.id">
                    <div class="partner-info">
                        <strong>{{ partner.name }}</strong>
                        <p>Mail: {{ partner.email }}</p>
                        <p>Virksomhed: {{ partner.company }}</p>

                        <small v-if="getPartnerAssignedCount(partner.id) > 0">
                            {{ getPartnerAssignedCount(partner.id) }} kursus/kurser tildelt
                        </small>
                    </div>

                    <span class="status"
                          :class="partner.statusClass">
                        {{ partner.status }}
                    </span>

                    <button class="survey-btn"
                            type="button"
                            @click="openSurveyAnswers(partner)">
                        SE SVAR
                    </button>

                    <button class="approve-btn"
                            type="button"
                            @click="openAssignModal(partner)">
                        Tildel kurser
                    </button>
                </div>

                <div v-if="filteredPartners.length === 0"
                     class="empty-state">
                    Ingen partnere matcher din søgning.
                </div>
            </template>

            <!-- LEADS -->
            <template v-if="activeTab === 'leads'">
                <div class="table-header">
                    <span>Lead</span>
                    <span>Status</span>
                    <span>Survey</span>
                    <span>Handlinger</span>
                </div>

                <div class="partner-row"
                     v-for="lead in filteredLeads"
                     :key="lead.id">
                    <div class="partner-info">
                        <strong>{{ lead.name }}</strong>
                        <p>Mail: {{ lead.email }}</p>
                        <p>Virksomhed: {{ lead.company }}</p>
                    </div>

                    <span class="status"
                          :class="lead.statusClass">
                        {{ lead.status }}
                    </span>

                    <div class="lead-progress">
                        <div class="lead-progress-bar">
                            <div class="lead-progress-fill"
                                 :style="{ width: lead.surveyProgress + '%' }"></div>
                        </div>

                        <small>
                            {{ lead.surveyProgress }}% udfyldt
                        </small>

                        <button v-if="lead.surveyProgress === 100"
                                class="survey-btn"
                                type="button"
                                @click="openSurveyAnswers(lead)">
                            SE SVAR
                        </button>
                    </div>

                    <div class="lead-actions">
                        <button v-if="lead.surveyProgress < 100"
                                class="approve-btn"
                                type="button"
                                @click="handleLeadAction(lead)">
                            {{ lead.action }}
                        </button>

                        <button v-else
                                class="approve-btn"
                                type="button"
                                @click="approveLeadAsPartner(lead)">
                            Godkend partner
                        </button>
                    </div>
                </div>

                <div v-if="filteredLeads.length === 0"
                     class="empty-state">
                    Ingen leads matcher din søgning.
                </div>
            </template>
        </div>

        <!-- TILDEL KURSER MODAL -->
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

        <!-- SURVEY SVAR MODAL -->
        <div v-if="showSurveyModal && selectedSurveyPerson"
             class="assign-modal-overlay">
            <div class="survey-modal">
                <header class="assign-modal-header">
                    <div>
                        <h2>Survey svar</h2>
                        <p>{{ selectedSurveyPerson.name }} · {{ selectedSurveyPerson.company }}</p>
                    </div>

                    <button class="assign-modal-close"
                            type="button"
                            @click="closeSurveyAnswers">
                        ×
                    </button>
                </header>

                <div class="survey-answer-list">
                    <div class="survey-answer-card">
                        <strong>Hvilken type virksomhed har I?</strong>
                        <p>{{ selectedSurveyPerson.company }}</p>
                    </div>

                    <div class="survey-answer-card">
                        <strong>Hvor meget erfaring har I med Modulex produkter?</strong>
                        <p>Vi har lidt erfaring og ønsker oplæring i bestillingsflowet.</p>
                    </div>

                    <div class="survey-answer-card">
                        <strong>Hvad vil I helst lære først?</strong>
                        <p>Vi vil gerne starte med konfiguration, bestilling og brand guidelines.</p>
                    </div>
                </div>

                <footer class="assign-modal-footer">
                    <button class="assign-btn assign-btn-dark"
                            type="button"
                            @click="closeSurveyAnswers">
                        Luk
                    </button>
                </footer>
            </div>
        </div>

        <CreateLeadModal v-if="showCreateLeadModal"
                         @close="closeCreateLeadModal"
                         @created="handleLeadCreated" />
    </div>
</template>

<script setup>
    import { computed, ref } from "vue";

    import AppCard from "../../components/ui/AppCard.vue";
    import CreateLeadModal from "./CreateLeadModal.vue";

    import {
        Users,
        BookOpen,
        TrendingUp,
    } from "lucide-vue-next";

    import {
        dummyPartners,
        dummyLeads,
        dummyCourses,
        dummyCourseAssignments,
    } from "../../data/dummyData.js";

    const ASSIGNMENTS_KEY = "modulex_course_assignments";
    const LEADS_KEY = "modulex_dummy_leads";
    const PARTNERS_KEY = "modulex_dummy_partners";

    const activeTab = ref("partners");
    const searchQuery = ref("");

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

    const partners = ref(getSavedPartners());
    const leads = ref(getSavedLeads());

    const showAssignModal = ref(false);
    const selectedPartner = ref(null);
    const selectedCourseIds = ref([]);
    const courseSearch = ref("");
    const refreshKey = ref(0);

    const showCreateLeadModal = ref(false);

    const showSurveyModal = ref(false);
    const selectedSurveyPerson = ref(null);

    const filteredPartners = computed(() => {
        const search = searchQuery.value.toLowerCase().trim();

        if (!search) {
            return partners.value;
        }

        return partners.value.filter((partner) => {
            return (
                partner.name.toLowerCase().includes(search) ||
                partner.company.toLowerCase().includes(search) ||
                partner.email.toLowerCase().includes(search)
            );
        });
    });

    const filteredLeads = computed(() => {
        const search = searchQuery.value.toLowerCase().trim();

        if (!search) {
            return leads.value;
        }

        return leads.value.filter((lead) => {
            return (
                lead.name.toLowerCase().includes(search) ||
                lead.company.toLowerCase().includes(search) ||
                lead.email.toLowerCase().includes(search)
            );
        });
    });

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

    function getSavedPartners() {
        const savedPartners = localStorage.getItem(PARTNERS_KEY);

        if (savedPartners) {
            return JSON.parse(savedPartners);
        }

        localStorage.setItem(PARTNERS_KEY, JSON.stringify(dummyPartners));

        return [...dummyPartners];
    }

    function savePartners() {
        localStorage.setItem(PARTNERS_KEY, JSON.stringify(partners.value));
    }

    function getSavedLeads() {
        const savedLeads = localStorage.getItem(LEADS_KEY);

        if (savedLeads) {
            return JSON.parse(savedLeads);
        }

        localStorage.setItem(LEADS_KEY, JSON.stringify(dummyLeads));

        return [...dummyLeads];
    }

    function saveLeads() {
        localStorage.setItem(LEADS_KEY, JSON.stringify(leads.value));
    }

    function openCreateLeadModal() {
        showCreateLeadModal.value = true;
    }

    function closeCreateLeadModal() {
        showCreateLeadModal.value = false;
    }

    function handleLeadCreated(newLead) {
        leads.value.unshift(newLead);
        saveLeads();
        activeTab.value = "leads";
    }

    function handleLeadAction(lead) {
        if (lead.action === "Send survey") {
            lead.status = "Afventer svar";
            lead.statusClass = "waiting";
            lead.surveyProgress = 35;
            lead.action = "Simuler svar";
            saveLeads();
            return;
        }

        if (lead.action === "Simuler svar") {
            lead.status = "Survey besvaret";
            lead.statusClass = "lead-ready";
            lead.surveyProgress = 100;
            lead.action = "Godkend partner";
            saveLeads();
        }
    }

    function approveLeadAsPartner(lead) {
        partners.value.unshift({
            id: lead.id,
            name: lead.name,
            email: lead.email,
            company: lead.company,
            status: "I gang",
            statusClass: "active",
            action: "Tildel kurser",
        });

        leads.value = leads.value.filter((item) => item.id !== lead.id);

        savePartners();
        saveLeads();

        activeTab.value = "partners";
    }

    function openSurveyAnswers(person) {
        selectedSurveyPerson.value = person;
        showSurveyModal.value = true;
    }

    function closeSurveyAnswers() {
        selectedSurveyPerson.value = null;
        showSurveyModal.value = false;
    }

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

    .admin-header-actions {
        display: flex;
        gap: 12px;
    }

    .create-course-btn,
    .create-lead-btn {
        border: none;
        padding: 14px 24px;
        border-radius: 10px;
        cursor: pointer;
        font-weight: 700;
    }

    .create-course-btn {
        background: #171717;
        color: white;
    }

    .create-lead-btn {
        background: white;
        color: #171717;
        border: 1px solid #ddd;
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

    .partner-section-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 24px;
        margin-bottom: 20px;
    }

    .table-title {
        margin: 0;
    }

    .admin-tabs {
        background: #f5f5f5;
        border-radius: 12px;
        padding: 4px;
        display: flex;
        gap: 4px;
    }

        .admin-tabs button {
            border: none;
            background: transparent;
            padding: 10px 16px;
            border-radius: 9px;
            font-weight: 800;
            cursor: pointer;
        }

    .admin-tab-active {
        background: white !important;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
    }

    .admin-search {
        margin-bottom: 20px;
    }

        .admin-search input {
            width: 100%;
            border: 1px solid #eee;
            background: #fafafa;
            border-radius: 12px;
            padding: 14px 16px;
            font-size: 14px;
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
        margin-bottom: 3px;
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

    .active {
        color: #ff5b2e;
    }

    .approved {
        color: #22c55e;
    }

    .waiting {
        color: #ca8a04;
    }

    .lead-ready {
        color: #a855f7;
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

    .lead-progress {
        display: grid;
        gap: 8px;
        width: fit-content;
    }

    .lead-progress-bar {
        width: 120px;
        height: 7px;
        background: #f1f1f1;
        border-radius: 50px;
        overflow: hidden;
    }

    .lead-progress-fill {
        height: 100%;
        background: #ff4d26;
    }

    .lead-progress small {
        color: #777;
        font-size: 11px;
        font-weight: 700;
    }

    .lead-actions {
        display: flex;
        align-items: center;
    }

    .empty-state {
        padding: 32px;
        color: #777;
        text-align: center;
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

    .assign-modal,
    .survey-modal {
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

    .assign-course-list,
    .survey-answer-list {
        padding: 24px 32px;
        display: grid;
        gap: 16px;
        overflow-y: auto;
    }

    .assign-course-card,
    .survey-answer-card {
        width: 100%;
        border: 1px solid #eee;
        background: white;
        border-radius: 14px;
        padding: 18px 20px;
        text-align: left;
    }

    .assign-course-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
    }

        .assign-course-card strong,
        .survey-answer-card strong {
            font-size: 15px;
            color: #171717;
        }

        .assign-course-card p,
        .survey-answer-card p {
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