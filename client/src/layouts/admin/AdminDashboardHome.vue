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
                    + Send spørgeskema
                </button>

                <button class="create-course-btn"
                        type="button"
                        @click="openCreateCourseForm">
                    + Opret kursus
                </button>
            </div>
        </div>

        <div class="stats-grid">
            <AppCard class="stat-card">
                <div class="card-icon">
                    <Users :size="20" />
                </div>

                <p>KLAR TIL KURSUS</p>
                <h2>{{ klarTilKursus.length }}</h2>
            </AppCard>

            <AppCard class="stat-card">
                <div class="card-icon">
                    <BookOpen :size="20" />
                </div>

                <p>IGANGVÆRENDE KURSUS</p>
                <h2>{{ courses.length }}</h2>
            </AppCard>

            <AppCard class="stat-card">
                <div class="card-icon">
                    <TrendingUp :size="20" />
                </div>

                <p>IGANGVÆRENDE LEADS</p>
                <h2>{{ igangvaerende.length }}</h2>
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
                        Klar til kursus ({{ filteredKlarTilKursus.length }})
                    </button>

                    <button type="button"
                            :class="{ 'admin-tab-active': activeTab === 'leads' }"
                            @click="activeTab = 'leads'">
                        Igangværende ({{ filteredIgangvaerende.length }})
                    </button>
                </div>
            </div>

            <div class="admin-search">
                <input v-model="searchQuery"
                       type="text"
                       placeholder="Søg efter navn, virksomhed eller mail..." />
            </div>

            <!-- KLAR TIL KURSUS: survey besvaret eller aktiveret. Fuld info + alle handlinger. -->
            <template v-if="activeTab === 'partners'">
                <div class="table-header">
                    <span>Partner</span>
                    <span>Status</span>
                    <span>Survey</span>
                    <span>Handlinger</span>
                </div>

                <div class="partner-row"
                     v-for="person in filteredKlarTilKursus"
                     :key="person.id">
                    <div class="partner-info">
                        <strong>{{ person.name || person.email }}</strong>
                        <p>Mail: {{ person.email }}</p>
                        <p v-if="person.company">Virksomhed: {{ person.company }}</p>

                        <small v-if="getAssignedCourseCount(person.id) > 0"
                               class="assigned-count"
                               @click="openAssignModal(person)">
                            {{ getAssignedCourseCount(person.id) }} kursus/kurser tildelt · rediger
                        </small>
                    </div>

                    <span class="status"
                          :class="person.statusClass">
                        {{ person.status }}
                    </span>

                    <button class="survey-btn"
                            type="button"
                            @click="openSurveyAnswers(person)">
                        SE SVAR
                    </button>

                    <div class="lead-action-buttons">
                        <button v-if="person.statusClass === 'active' || person.statusClass === 'approved'"
                                class="survey-btn"
                                type="button"
                                @click="openAssignModal(person)">
                            Rediger kurser
                        </button>

                        <template v-else>
                            <button class="survey-btn"
                                    type="button"
                                    @click="openAssignModal(person)">
                                Tildel kurser
                            </button>

                            <button class="approve-btn"
                                    type="button"
                                    :disabled="getAssignedCourseCount(person.id) === 0"
                                    @click="activateLeadAndSendCourses(person)">
                                Aktiver kunde / send kurser
                            </button>
                        </template>
                    </div>
                </div>

                <div v-if="filteredKlarTilKursus.length === 0"
                     class="empty-state">
                    Ingen klar til kursus matcher din søgning.
                </div>
            </template>

            <!-- IGANGVÆRENDE: survey sendt, afventer svar. Minimal visning. -->
            <template v-if="activeTab === 'leads'">
                <div class="table-header">
                    <span>Lead</span>
                    <span>Status</span>
                    <span>Survey</span>
                    <span>Handling</span>
                </div>

                <div class="partner-row"
                     v-for="lead in filteredIgangvaerende"
                     :key="lead.id">
                    <div class="partner-info">
                        <strong>{{ lead.email }}</strong>
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

                        <small>{{ lead.surveyProgress }}% udfyldt</small>
                    </div>

                    <button class="approve-btn"
                            type="button"
                            @click="handleLeadAction(lead)">
                        {{ lead.action }}
                    </button>
                </div>

                <div v-if="filteredIgangvaerende.length === 0"
                     class="empty-state">
                    Ingen leads i gang lige nu.
                </div>
            </template>
        </div>

        <!-- TILDEL KURSER MODAL -->
        <div v-if="showAssignModal && selectedPartner"
             class="assign-modal-overlay">
            <div class="assign-modal">
                <header class="assign-modal-header">
                    <div>
                        <h2>Tildel kurser til {{ selectedPartner.name || selectedPartner.email }}</h2>
                        <p>Vælg de kurser som denne kunde skal gennemgå.</p>
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
                        <p>
                            {{ selectedSurveyPerson.email }}
                            <span v-if="selectedSurveyPerson.company">
                                · {{ selectedSurveyPerson.company }}
                            </span>
                        </p>
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
                        <p>{{ selectedSurveyPerson.company || "Ikke angivet endnu" }}</p>
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

        <AdminCreateCourseForm v-if="showCreateCourseForm"
                               @close="closeCreateCourseForm" />
    </div>
</template>

<script setup>
    import { computed, ref } from "vue";

    import AppCard from "../../components/ui/AppCard.vue";
    import CreateLeadModal from "./CreateLeadModal.vue";
    import AdminCreateCourseForm from "./AdminCreateCourseForm.vue";

    import {
        Users,
        BookOpen,
        TrendingUp,
    } from "lucide-vue-next";

    import {
        dummyPartners,
        dummyLeads,
        dummyCourseAssignments,
    } from "../../data/dummyData.js";

    import { getCourses } from "../../data/dummyCourseService.js";

    const ASSIGNMENTS_KEY = "modulex_course_assignments";
    const LEADS_KEY = "modulex_dummy_leads";
    const PARTNERS_KEY = "modulex_dummy_partners";

    const activeTab = ref("partners");
    const searchQuery = ref("");

    const courses = ref(getCourses());

    const partners = ref(getSavedPartners());
    const leads = ref(getSavedLeads());

    const showAssignModal = ref(false);
    const selectedPartner = ref(null);
    const selectedCourseIds = ref([]);
    const courseSearch = ref("");
    const refreshKey = ref(0);
    const showCreateCourseModal = ref(false);

    const showCreateLeadModal = ref(false);
    const showCreateCourseForm = ref(false);

    const showSurveyModal = ref(false);
    const selectedSurveyPerson = ref(null);

    // Status-baseret opdeling. Matcher User.status enum på serveren:
    //   pending_survey   -> Igangværende  (survey sendt, afventer svar)
    //   pending_approval -> Klar til kursus (survey besvaret, klar til kursustildeling)
    //   pending_activation / active -> Klar til kursus (sendt + aktiveret kunde)
    const igangvaerende = computed(() => {
        return leads.value.filter((lead) => !hasSurveyAnswers(lead));
    });

    const klarTilKursus = computed(() => {
        const besvaredeLeads = leads.value.filter((lead) => hasSurveyAnswers(lead));
        return [...besvaredeLeads, ...partners.value];
    });

    function matchesSearch(person, search) {
        const name = (person.name || "").toLowerCase();
        const company = (person.company || "").toLowerCase();
        const email = (person.email || "").toLowerCase();

        return (
            name.includes(search) ||
            company.includes(search) ||
            email.includes(search)
        );
    }

    const filteredIgangvaerende = computed(() => {
        const search = searchQuery.value.toLowerCase().trim();

        if (!search) return igangvaerende.value;

        return igangvaerende.value.filter((lead) => matchesSearch(lead, search));
    });

    const filteredKlarTilKursus = computed(() => {
        const search = searchQuery.value.toLowerCase().trim();

        if (!search) return klarTilKursus.value;

        return klarTilKursus.value.filter((person) => matchesSearch(person, search));
    });

    const filteredCourses = computed(() => {
        const search = courseSearch.value.toLowerCase().trim();

        if (!search) return courses.value;

        return courses.value.filter((course) => {
            return (
                course.title.toLowerCase().includes(search) ||
                course.description.toLowerCase().includes(search)
            );
        });
    });

    function hasSurveyAnswers(lead) {
        return lead.hasSurveyAnswers || lead.surveyProgress === 100;
    }

    function normalizeLead(lead) {
        // Surveyen sendes altid ved leadoprettelse (Send spørgeskema -> nodemailer),
        // så leads i Igangværende har altid surveySent=true. Den eneste lead-handling
        // herfra er "Simuler svar" (til test).
        return {
            id: lead.id || crypto.randomUUID(),
            email: lead.email || "",
            name: lead.name || "",
            company: lead.company || "",
            status: lead.status || "Survey sendt",
            statusClass: lead.statusClass || "waiting",
            surveyProgress: lead.surveyProgress ?? 35,
            action: "Simuler svar",
            surveySent: true,
            hasSurveyAnswers:
                lead.hasSurveyAnswers ?? lead.surveyProgress === 100,
        };
    }

    function refreshCourses() {
        courses.value = getCourses();
    }

    function openCreateCourseForm() {
        showCreateCourseForm.value = true;
    }

    function closeCreateCourseForm() {
        showCreateCourseForm.value = false;
        refreshCourses();
    }

    function getSavedPartners() {
        const savedPartners = localStorage.getItem(PARTNERS_KEY);

        if (savedPartners) return JSON.parse(savedPartners);

        localStorage.setItem(PARTNERS_KEY, JSON.stringify(dummyPartners));

        return [...dummyPartners];
    }

    function savePartners() {
        localStorage.setItem(PARTNERS_KEY, JSON.stringify(partners.value));
    }

    function getSavedLeads() {
        const savedLeads = localStorage.getItem(LEADS_KEY);

        if (savedLeads) {
            return JSON.parse(savedLeads).map((lead) => normalizeLead(lead));
        }

        const initialLeads = dummyLeads.map((lead) => {
            return normalizeLead({
                ...lead,
                name: "",
                company: "",
                status: "Survey sendt",
                statusClass: "waiting",
                surveyProgress: 35,
                action: "Simuler svar",
                surveySent: true,
                hasSurveyAnswers: false,
            });
        });

        localStorage.setItem(LEADS_KEY, JSON.stringify(initialLeads));

        return initialLeads;
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

    function handleLeadCreated(newLeads) {
        const leadsToAdd = Array.isArray(newLeads) ? newLeads : [newLeads];

        const normalizedLeads = leadsToAdd
            .map((lead) => normalizeLead(lead))
            .filter((lead) => {
                return !leads.value.some(
                    (existingLead) =>
                        existingLead.email.toLowerCase() === lead.email.toLowerCase()
                );
            });

        leads.value.unshift(...normalizedLeads);

        saveLeads();

        activeTab.value = "leads";
    }

    function handleLeadAction(lead) {
        // "Send survey" -> markér som sendt, vis Simuler svar herefter.
        if (lead.action === "Send survey") {
            lead.status = "Survey sendt";
            lead.statusClass = "waiting";
            lead.surveyProgress = 0;
            lead.action = "Simuler svar";
            lead.surveySent = true;

            saveLeads();
            return;
        }

        // "Simuler svar" -> simulér at kunden har udfyldt surveyen og
        // ryk leadet over i "Klar til kursus" tab.
        if (lead.action === "Simuler svar") {
            const emailName = lead.email.split("@")[0];
            const emailDomain = lead.email.split("@")[1] || "ukendt.dk";

            lead.name = emailName;
            lead.company = emailDomain;
            lead.status = "Survey besvaret";
            lead.statusClass = "lead-ready";
            lead.surveyProgress = 100;
            lead.action = "Afventer kursustildeling";
            lead.hasSurveyAnswers = true;

            saveLeads();

            activeTab.value = "partners";
        }
        // Simulér at kunden har udfyldt surveyen og ryk leadet
        // over i "Klar til kursus" tab. Bruges kun til test.
        const emailName = lead.email.split("@")[0];
        const emailDomain = lead.email.split("@")[1] || "ukendt.dk";

        lead.name = emailName;
        lead.company = emailDomain;
        lead.status = "Survey besvaret";
        lead.statusClass = "lead-ready";
        lead.surveyProgress = 100;
        lead.action = "Afventer kursustildeling";
        lead.hasSurveyAnswers = true;

        saveLeads();

        activeTab.value = "partners";

    }

    function activateLeadAndSendCourses(lead) {
        const assignedCourseCount = getAssignedCourseCount(lead.id);

        if (assignedCourseCount === 0) {
            alert("Du skal først tildele mindst ét kursus til kunden.");
            return;
        }

        partners.value.unshift({
            id: lead.id,
            name: lead.name || lead.email,
            email: lead.email,
            company: lead.company || "Ikke angivet",
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

        if (savedAssignments) return JSON.parse(savedAssignments);

        localStorage.setItem(
            ASSIGNMENTS_KEY,
            JSON.stringify(dummyCourseAssignments)
        );

        return dummyCourseAssignments;
    }

    function saveAssignments(assignments) {
        localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
    }

    function getAssignedCourseCount(personId) {
        refreshKey.value;

        const assignments = getAssignments();

        return assignments[personId]?.length || 0;
    }

    function openAssignModal(person) {
        const assignments = getAssignments();

        selectedPartner.value = person;
        selectedCourseIds.value = assignments[person.id] || [];
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

    .assigned-count {
        cursor: pointer;
    }

        .assigned-count:hover {
            text-decoration: underline;
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

        .approve-btn:disabled {
            opacity: 0.45;
            cursor: not-allowed;
        }

    .lead-action-buttons {
        display: grid;
        gap: 8px;
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