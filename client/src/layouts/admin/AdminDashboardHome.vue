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
                <h2>{{ aktiveKursustildelinger }}</h2>
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

            <div v-if="successMessage"
                 class="success-message">
                {{ successMessage }}
            </div>

            <div v-if="loadError"
                 class="error-message">
                {{ loadError }}
            </div>

            <div v-if="isLoading"
                 class="empty-state">
                Henter data fra serveren...
            </div>

            <!-- KLAR TIL KURSUS: survey besvaret eller aktiveret. Fuld info + alle handlinger. -->
            <template v-if="!isLoading && activeTab === 'partners'">
                <div class="table-header">
                    <span>Partner</span>
                    <span>Status</span>
                    <span>Survey</span>
                    <span>Handlinger</span>
                </div>

                <div class="partner-row"
                     v-for="person in filteredKlarTilKursus"
                     :key="person._id">
                    <div class="partner-info">
                        <strong>{{ person.contactPerson || person.email }}</strong>
                        <p>Mail: {{ person.email }}</p>
                        <p v-if="person.companyName">Virksomhed: {{ person.companyName }}</p>

                        <small v-if="getAssignedCourseCount(person._id) > 0"
                               class="assigned-count"
                               @click="openAssignModal(person)">
                            {{ getAssignedCourseCount(person._id) }} kursus/kurser tildelt · rediger
                        </small>
                    </div>

                    <span class="status"
                          :class="statusClassFor(person.status)">
                        {{ statusLabelFor(person.status) }}
                    </span>

                    <button class="survey-btn"
                            type="button"
                            @click="openSurveyAnswers(person)">
                        SE SVAR
                    </button>

                    <div class="lead-action-buttons">
                        <!--
                            Én knap fra start. Når der ikke er tildelt kurser endnu
                            kalder den modalen ("Tildel kurser"). Når der allerede er
                            tildelt kurser bliver det til "Gensend kursus" og kalder
                            resend-endpointet på serveren.
                        -->
                        <button v-if="getAssignedCourseCount(person._id) === 0"
                                class="approve-btn"
                                type="button"
                                @click="openAssignModal(person)">
                            Tildel kurser
                        </button>

                        <button v-else
                                class="resend-btn"
                                type="button"
                                :disabled="resendingForId === person._id"
                                @click="resendCoursesFor(person)">
                            {{ resendingForId === person._id ? "Sender..." : "Gensend kursus" }}
                        </button>

                        <button class="delete-btn"
                                type="button"
                                title="Slet kunde"
                                :disabled="deletingForId === person._id"
                                @click="deleteCustomer(person)">
                            <Trash2 :size="16" />
                        </button>
                    </div>
                </div>

                <div v-if="filteredKlarTilKursus.length === 0"
                     class="empty-state">
                    Ingen klar til kursus matcher din søgning.
                </div>
            </template>

            <!-- IGANGVÆRENDE: survey sendt, afventer svar. Minimal visning. -->
            <template v-if="!isLoading && activeTab === 'leads'">
                <div class="table-header">
                    <span>Lead</span>
                    <span>Status</span>
                    <span>Survey</span>
                    <span>Handlinger</span>
                </div>

                <div class="partner-row"
                     v-for="lead in filteredIgangvaerende"
                     :key="lead._id">
                    <div class="partner-info">
                        <strong>{{ lead.email }}</strong>
                        <p>Oprettet: {{ formatDate(lead.createdAt) }}</p>
                    </div>

                    <span class="status waiting">
                        Survey sendt
                    </span>

                    <div class="lead-progress">
                        <small>Afventer svar</small>
                    </div>

                    <div class="lead-action-buttons">
                        <button class="delete-btn"
                                type="button"
                                title="Slet lead"
                                :disabled="deletingForId === lead._id"
                                @click="deleteCustomer(lead)">
                            <Trash2 :size="16" />
                        </button>
                    </div>
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
                        <h2>Tildel kurser til {{ selectedPartner.contactPerson || selectedPartner.email }}</h2>
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
                            :key="course._id"
                            class="assign-course-card"
                            :class="{
              'assign-course-card-active': selectedCourseIds.includes(course._id)
            }"
                            type="button"
                            @click="toggleCourse(course._id)">
                        <div>
                            <strong>{{ course.title }}</strong>
                            <p>{{ course.description }}</p>
                        </div>

                        <span class="assign-icon">
                            {{ selectedCourseIds.includes(course._id) ? "✓" : "+" }}
                        </span>
                    </button>

                    <div v-if="filteredCourses.length === 0"
                         class="empty-state">
                        Ingen kurser fundet.
                    </div>
                </div>

                <p v-if="assignError"
                   class="lead-error assign-error">
                    {{ assignError }}
                </p>

                <footer class="assign-modal-footer">
                    <button class="assign-btn assign-btn-light"
                            type="button"
                            @click="closeAssignModal">
                        Annuller
                    </button>

                    <button class="assign-btn assign-btn-dark"
                            type="button"
                            :disabled="isSavingAssignment"
                            @click="saveAssignedCourses">
                        {{ isSavingAssignment ? "Gemmer..." : "Gem ændringer" }}
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
                            <span v-if="selectedSurveyPerson.companyName">
                                · {{ selectedSurveyPerson.companyName }}
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
                    <div v-if="loadingSurvey"
                         class="empty-state">
                        Henter survey-svar...
                    </div>

                    <template v-else>
                        <div v-if="surveyAnswers.length === 0"
                             class="empty-state">
                            Ingen survey-svar registreret endnu.
                        </div>

                        <div v-for="(answer, index) in surveyAnswers"
                             :key="answer.questionId || index"
                             class="survey-answer-card">
                            <strong>{{ answer.questionId }}</strong>
                            <p>{{ formatAnswer(answer.answer) }}</p>
                        </div>
                    </template>
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

        <!-- BEKRÆFT SLETNING MODAL -->
        <div v-if="showDeleteModal && pendingDeletePerson"
             class="assign-modal-overlay"
             @click.self="closeDeleteModal">
            <div class="confirm-modal">
                <header class="assign-modal-header">
                    <div>
                        <h2>Slet kunde?</h2>
                        <p>
                            Du er ved at slette
                            <strong>{{ pendingDeletePerson.contactPerson || pendingDeletePerson.email }}</strong>.
                            Alle kursustildelinger og survey-svar fjernes også.
                            Handlingen kan ikke fortrydes.
                        </p>
                    </div>

                    <button class="assign-modal-close"
                            type="button"
                            :disabled="!!deletingForId"
                            @click="closeDeleteModal">
                        ×
                    </button>
                </header>

                <p v-if="deleteError"
                   class="lead-error assign-error">
                    {{ deleteError }}
                </p>

                <footer class="assign-modal-footer">
                    <button class="assign-btn assign-btn-light"
                            type="button"
                            :disabled="!!deletingForId"
                            @click="closeDeleteModal">
                        Annuller
                    </button>

                    <button class="assign-btn assign-btn-danger"
                            type="button"
                            :disabled="!!deletingForId"
                            @click="confirmDelete">
                        {{ deletingForId ? "Sletter..." : "Slet kunde" }}
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
    import { computed, onMounted, ref } from "vue";

    import AppCard from "../../components/ui/AppCard.vue";
    import CreateLeadModal from "./CreateLeadModal.vue";

    import {
        Users,
        BookOpen,
        TrendingUp,
        Trash2,
    } from "lucide-vue-next";

    const API_URL = import.meta.env.VITE_API_URL;

    const activeTab = ref("partners");
    const searchQuery = ref("");

    // Alle data hentes nu fra MongoDB via serveren.
    const customers = ref([]);
    const courses = ref([]);
    // assignmentsByUserId[userId] = string[] med courseIds.
    // Holdes lokalt så Tildel-modalen ved hvad der er valgt.
    const assignmentsByUserId = ref({});

    const isLoading = ref(true);
    const loadError = ref("");
    const successMessage = ref("");

    const showAssignModal = ref(false);
    const selectedPartner = ref(null);
    const selectedCourseIds = ref([]);
    // Holder de oprindelige assignments når modalen åbnes, så vi kan
    // diffe og kun POSTe/DELETE'e det der er ændret.
    const initialSelectedCourseIds = ref([]);
    const courseSearch = ref("");
    const isSavingAssignment = ref(false);
    const assignError = ref("");
    const resendingForId = ref("");
    const deletingForId = ref("");

    const showDeleteModal = ref(false);
    const pendingDeletePerson = ref(null);
    const deleteError = ref("");

    const showCreateLeadModal = ref(false);

    const showSurveyModal = ref(false);
    const selectedSurveyPerson = ref(null);
    const surveyAnswers = ref([]);
    const loadingSurvey = ref(false);

    // Status-mapping mod User.status enum på serveren:
    //   pending_survey   -> Igangværende  (survey sendt, afventer svar)
    //   pending_approval -> Klar til kursus (survey besvaret, klar til tildeling)
    //   pending_activation / active -> Klar til kursus (kurser tildelt / aktiveret)
    const igangvaerende = computed(() => {
        return customers.value.filter(
            (customer) => customer.status === "pending_survey",
        );
    });

    const klarTilKursus = computed(() => {
        return customers.value.filter(
            (customer) => customer.status !== "pending_survey",
        );
    });

    // Sum af UserCourse-tildelinger på tværs af alle kunder.
    // courseCount kommer fra /admin/customers (aggregeret pr. bruger på server-siden),
    // og opdateres lokalt når vi tildeler/fjerner kurser, så tallet er live.
    const aktiveKursustildelinger = computed(() => {
        return customers.value.reduce(
            (sum, customer) => sum + (customer.courseCount || 0),
            0,
        );
    });

    function matchesSearch(person, search) {
        const contactPerson = (person.contactPerson || "").toLowerCase();
        const companyName = (person.companyName || "").toLowerCase();
        const email = (person.email || "").toLowerCase();

        return (
            contactPerson.includes(search) ||
            companyName.includes(search) ||
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
            const title = course.title || "";
            const description = course.description || "";

            return (
                title.toLowerCase().includes(search) ||
                description.toLowerCase().includes(search)
            );
        });
    });

    function statusLabelFor(status) {
        if (status === "pending_approval") return "Survey besvaret";
        if (status === "pending_activation") return "Klar til afsendelse";
        if (status === "active") return "Aktiv";
        return status || "Ukendt";
    }

    function statusClassFor(status) {
        if (status === "pending_approval") return "lead-ready";
        if (status === "pending_activation") return "approved";
        if (status === "active") return "active";
        return "waiting";
    }

    function formatDate(value) {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        return date.toLocaleDateString("da-DK", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }

    function formatAnswer(answer) {
        if (Array.isArray(answer)) return answer.join(", ");
        return String(answer ?? "");
    }

    async function loadCustomers() {
        const res = await fetch(`${API_URL}/admin/customers`, {
            credentials: "include",
        });

        if (!res.ok) throw new Error("Kunne ikke hente kunder.");

        const data = await res.json();
        const list = Array.isArray(data.users) ? data.users : [];

        customers.value = list;

        return list;
    }

    async function loadCourses() {
        const res = await fetch(`${API_URL}/admin/courses`, {
            credentials: "include",
        });

        if (!res.ok) throw new Error("Kunne ikke hente kurser.");

        const data = await res.json();
        courses.value = Array.isArray(data.courses) ? data.courses : [];
    }

    async function loadAll() {
        isLoading.value = true;
        loadError.value = "";

        try {
            await Promise.all([loadCustomers(), loadCourses()]);
        } catch (err) {
            loadError.value = err.message || "Kunne ikke hente data.";
        } finally {
            isLoading.value = false;
        }
    }

    onMounted(loadAll);

    function openCreateLeadModal() {
        showCreateLeadModal.value = true;
    }

    function closeCreateLeadModal() {
        showCreateLeadModal.value = false;
    }

    function handleLeadCreated(newLeads) {
        // CreateLeadModal returnerer rigtige user-objekter fra serveren.
        const leadsToAdd = Array.isArray(newLeads) ? newLeads : [newLeads];

        const filteredNewLeads = leadsToAdd.filter((lead) => {
            return !customers.value.some(
                (existing) => existing._id === lead._id,
            );
        });

        customers.value = [...filteredNewLeads, ...customers.value];

        activeTab.value = "leads";
    }

    async function openSurveyAnswers(person) {
        selectedSurveyPerson.value = person;
        showSurveyModal.value = true;
        surveyAnswers.value = [];

        // pending_survey har endnu ikke svaret.
        if (person.status === "pending_survey") return;

        loadingSurvey.value = true;

        try {
            const res = await fetch(`${API_URL}/survey/${person._id}`, {
                credentials: "include",
            });

            if (res.ok) {
                const data = await res.json();
                surveyAnswers.value = data?.response?.answers || [];
            } else {
                surveyAnswers.value = [];
            }
        } catch {
            surveyAnswers.value = [];
        } finally {
            loadingSurvey.value = false;
        }
    }

    function closeSurveyAnswers() {
        selectedSurveyPerson.value = null;
        showSurveyModal.value = false;
        surveyAnswers.value = [];
    }

    function getAssignedCourseCount(personId) {
        const assigned = assignmentsByUserId.value[personId];
        if (assigned) return assigned.length;

        // Fallback til courseCount der kommer fra /admin/customers
        // (sat på første load, så vi viser korrekt knap fra start).
        const customer = customers.value.find((c) => c._id === personId);
        return customer?.courseCount ?? 0;
    }

    async function openAssignModal(person) {
        selectedPartner.value = person;
        courseSearch.value = "";
        assignError.value = "";
        showAssignModal.value = true;

        // Hent eksisterende tildelinger for denne kunde.
        try {
            const res = await fetch(
                `${API_URL}/admin/customers/${person._id}/courses`,
                { credentials: "include" },
            );

            if (res.ok) {
                const data = await res.json();
                const courseIds = (data.assignments || []).map((a) =>
                    String(a.courseId),
                );

                selectedCourseIds.value = courseIds;
                initialSelectedCourseIds.value = [...courseIds];
                assignmentsByUserId.value[person._id] = courseIds;
            } else {
                selectedCourseIds.value = [];
                initialSelectedCourseIds.value = [];
            }
        } catch {
            selectedCourseIds.value = [];
            initialSelectedCourseIds.value = [];
        }
    }

    function closeAssignModal() {
        showAssignModal.value = false;
        selectedPartner.value = null;
        selectedCourseIds.value = [];
        initialSelectedCourseIds.value = [];
        courseSearch.value = "";
        assignError.value = "";
    }

    function toggleCourse(courseId) {
        if (selectedCourseIds.value.includes(courseId)) {
            selectedCourseIds.value = selectedCourseIds.value.filter(
                (id) => id !== courseId,
            );

            return;
        }

        selectedCourseIds.value.push(courseId);
    }

    async function saveAssignedCourses() {
        if (!selectedPartner.value) return;

        isSavingAssignment.value = true;
        assignError.value = "";

        const partnerId = selectedPartner.value._id;
        const next = new Set(selectedCourseIds.value.map(String));
        const prev = new Set(initialSelectedCourseIds.value.map(String));

        const toAdd = [...next].filter((id) => !prev.has(id));
        const toRemove = [...prev].filter((id) => !next.has(id));

        try {
            await Promise.all([
                ...toAdd.map((courseId) =>
                    fetch(`${API_URL}/admin/assign-course`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId: partnerId, courseId }),
                    }).then(async (res) => {
                        // 409 = allerede tildelt, det er fint.
                        if (!res.ok && res.status !== 409) {
                            const body = await res.json().catch(() => ({}));
                            throw new Error(
                                body.message || "Kunne ikke tildele kursus.",
                            );
                        }
                    }),
                ),
                ...toRemove.map((courseId) =>
                    fetch(
                        `${API_URL}/admin/customers/${partnerId}/courses/${courseId}`,
                        { method: "DELETE", credentials: "include" },
                    ).then(async (res) => {
                        if (!res.ok && res.status !== 404) {
                            const body = await res.json().catch(() => ({}));
                            throw new Error(
                                body.message || "Kunne ikke fjerne kursus.",
                            );
                        }
                    }),
                ),
            ]);

            // Opdater lokal cache så knappen straks viser "Gensend kursus".
            assignmentsByUserId.value = {
                ...assignmentsByUserId.value,
                [partnerId]: [...next],
            };

            // Opdater også courseCount på den enkelte customer.
            customers.value = customers.value.map((c) =>
                c._id === partnerId ? { ...c, courseCount: next.size } : c,
            );

            const partnerLabel =
                selectedPartner.value.contactPerson ||
                selectedPartner.value.email;
            const partnerEmail = selectedPartner.value.email;
            const wasFirstAssignment = prev.size === 0 && next.size > 0;

            closeAssignModal();

            if (wasFirstAssignment) {
                // Første gang kunden får kurser tildelt -> send kursus-mail
                // automatisk så de får signup-linket. Knappen skifter til
                // "Gensend kursus" derefter.
                try {
                    const res = await fetch(
                        `${API_URL}/admin/customers/${partnerId}/resend-courses`,
                        { method: "POST", credentials: "include" },
                    );
                    const body = await res.json().catch(() => ({}));
                    if (!res.ok) {
                        throw new Error(body.message || "Mail-afsending fejlede.");
                    }
                    if (body.status) {
                        customers.value = customers.value.map((c) =>
                            c._id === partnerId ? { ...c, status: body.status } : c,
                        );
                    }
                    showSuccess(
                        `${next.size} kursus/kurser tildelt. Kursusmail sendt til ${partnerEmail}.`,
                    );
                } catch (err) {
                    loadError.value =
                        err.message ||
                        "Kurserne blev tildelt, men mailen kunne ikke sendes.";
                }
            } else {
                showSuccess(
                    `${next.size} kursus/kurser tildelt til ${partnerLabel}.`,
                );
            }
        } catch (err) {
            assignError.value = err.message || "Noget gik galt under tildeling.";
        } finally {
            isSavingAssignment.value = false;
        }
    }

    // Åbner bekræftelses-modalen i stedet for window.confirm.
    function deleteCustomer(person) {
        pendingDeletePerson.value = person;
        deleteError.value = "";
        showDeleteModal.value = true;
    }

    function closeDeleteModal() {
        if (deletingForId.value) return;
        showDeleteModal.value = false;
        pendingDeletePerson.value = null;
        deleteError.value = "";
    }

    async function confirmDelete() {
        const person = pendingDeletePerson.value;
        if (!person) return;

        const label = person.contactPerson || person.email;
        deletingForId.value = person._id;
        deleteError.value = "";

        try {
            const res = await fetch(
                `${API_URL}/admin/customers/${person._id}`,
                { method: "DELETE", credentials: "include" },
            );

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || "Sletning fejlede.");
            }

            customers.value = customers.value.filter(
                (c) => c._id !== person._id,
            );

            // Ryd op i lokal assignments cache så vi ikke peger
            // på en bruger som ikke længere findes.
            if (assignmentsByUserId.value[person._id]) {
                const next = { ...assignmentsByUserId.value };
                delete next[person._id];
                assignmentsByUserId.value = next;
            }

            showSuccess(`${label} er slettet.`);
            showDeleteModal.value = false;
            pendingDeletePerson.value = null;
        } catch (err) {
            deleteError.value = err.message || "Kunne ikke slette kunden.";
        } finally {
            deletingForId.value = "";
        }
    }

    async function resendCoursesFor(person) {
        resendingForId.value = person._id;

        try {
            const res = await fetch(
                `${API_URL}/admin/customers/${person._id}/resend-courses`,
                { method: "POST", credentials: "include" },
            );

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data.message || "Gensending fejlede.");
            }

            // Serveren rykker fx pending_approval -> pending_activation
            // når mailen er sendt; opdater lokalt så status-pillen passer.
            if (data.status) {
                customers.value = customers.value.map((c) =>
                    c._id === person._id ? { ...c, status: data.status } : c,
                );
            }

            showSuccess(
                `Kursusmail gensendt til ${person.email}.`,
            );
        } catch (err) {
            loadError.value = err.message || "Kunne ikke gensende kursusmail.";
        } finally {
            resendingForId.value = "";
        }
    }

    let successTimeout = null;
    function showSuccess(message) {
        successMessage.value = message;
        if (successTimeout) clearTimeout(successTimeout);
        successTimeout = setTimeout(() => {
            successMessage.value = "";
        }, 3500);
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

    .create-lead-btn {
        border: none;
        padding: 14px 24px;
        border-radius: 10px;
        cursor: pointer;
        font-weight: 700;
        background: #171717;
        color: white;
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

    .success-message {
        background: #ecfdf3;
        color: #128a3d;
        border-radius: 12px;
        padding: 12px 16px;
        margin-bottom: 16px;
        font-weight: 700;
    }

    .error-message {
        background: #fff3ed;
        color: #ff4d26;
        border-radius: 12px;
        padding: 12px 16px;
        margin-bottom: 16px;
        font-weight: 700;
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

    .resend-btn {
        background: #f5f5f5;
        color: #444;
        border: 1px solid #e5e5e5;
        padding: 12px 18px;
        border-radius: 10px;
        font-weight: 600;
        width: fit-content;
        height: fit-content;
        justify-self: start;
        cursor: pointer;
    }

        .resend-btn:hover:not(:disabled) {
            background: #ececec;
        }

        .resend-btn:disabled {
            opacity: 0.45;
            cursor: not-allowed;
        }

    .lead-action-buttons {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        justify-self: start;
    }

    .delete-btn {
        width: 36px;
        height: 36px;
        background: transparent;
        color: #dc2626;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
    }

        .delete-btn:hover:not(:disabled) {
            background: #fef2f2;
        }

        .delete-btn:disabled {
            opacity: 0.45;
            cursor: not-allowed;
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

    .lead-progress small {
        color: #777;
        font-size: 11px;
        font-weight: 700;
    }

    .lead-created {
        font-size: 12px;
        color: #777;
        font-weight: 600;
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

    .confirm-modal {
        width: 100%;
        max-width: 460px;
        background: white;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 24px 70px rgba(0, 0, 0, 0.18);
        display: flex;
        flex-direction: column;
    }

        .confirm-modal .assign-modal-header {
            padding: 32px 32px 24px;
        }

            .confirm-modal .assign-modal-header p strong {
                color: #171717;
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

    .assign-error {
        padding: 0 32px 12px;
        margin: 0;
    }

    .lead-error {
        color: #ff4d26;
        font-size: 13px;
        font-weight: 700;
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

        .assign-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
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

    .assign-btn-danger {
        background: #dc2626;
        color: white;
    }

        .assign-btn-danger:hover:not(:disabled) {
            background: #b91c1c;
        }
</style>
