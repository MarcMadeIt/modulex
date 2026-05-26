<template>
    <div class="courses-dashboard">
        <div class="courses-header">
            <div>
                <h1>Kursusbibliotek</h1>
                <p>Administrér træningsmoduler, opret nye moduler og tildel til partnere.</p>
            </div>

            <button class="create-course-btn"
                    type="button"
                    @click="openCreateCourse">
                + Opret kursus
            </button>
        </div>

        <div v-if="selectedCourseIds.length > 0"
             class="bulk-assign-box">
            <div class="bulk-info">
                <div class="bulk-icon">▣</div>

                <div>
                    <strong>{{ selectedCourseIds.length }} kurser markeret</strong>
                    <p>Vælg en eller flere kunder/partnere nedenfor for tildeling.</p>
                </div>
            </div>

            <div class="bulk-actions">
                <div class="receiver-select-wrapper">
                    <button class="receiver-select-button"
                            type="button"
                            @click="toggleReceiverDropdown">
                        {{
              selectedPartnerIds.length > 0
                ? selectedPartnerIds.length + " modtager(e) valgt"
                : "Vælg modtagere..."
                        }}
                        <span>▾</span>
                    </button>

                    <div v-if="showReceiverDropdown"
                         class="receiver-dropdown">
                        <input v-model="receiverSearch"
                               type="text"
                               placeholder="Søg kunde eller virksomhed..." />

                        <div class="receiver-list">
                            <label v-for="partner in filteredPartnersForDropdown"
                                   :key="partner._id"
                                   class="receiver-option">
                                <input v-model="selectedPartnerIds"
                                       type="checkbox"
                                       :value="partner._id" />

                                <div>
                                    <strong>{{ partner.contactPerson || partner.email }}</strong>
                                    <p v-if="partner.companyName">{{ partner.companyName }}</p>
                                    <small>{{ partner.email }}</small>
                                </div>
                            </label>

                            <div v-if="filteredPartnersForDropdown.length === 0"
                                 class="receiver-empty">
                                Ingen kunder matcher søgningen.
                            </div>

                            <div v-if="partnersError"
                                 class="receiver-empty">
                                {{ partnersError }}
                            </div>
                        </div>
                    </div>
                </div>

                <button class="assign-to-customers-btn"
                        type="button"
                        :disabled="selectedPartnerIds.length === 0"
                        @click="assignSelectedCoursesToPartners">
                    Tildel til kunder
                </button>

                <button class="cancel-bulk-btn"
                        type="button"
                        @click="clearBulkSelection">
                    Annuller
                </button>
            </div>
        </div>

        <div v-if="successMessage"
             class="success-message">
            {{ successMessage }}
        </div>

        <div class="courses-card">
            <div class="courses-toolbar">
                <input v-model="searchQuery"
                       type="text"
                       placeholder="Søg i kurser efter titel eller beskrivelse..." />

                <button class="toolbar-btn"
                        type="button"
                        @click="toggleAllCourses">
                    {{ allVisibleCoursesSelected ? "Afmarkér alle" : "Markér alle" }}
                </button>
            </div>

            <div class="courses-table-header">
                <span></span>
                <span>Kursus</span>
                <span>Beskrivelse</span>
                <span>Moduler</span>
                <span>Handlinger</span>
            </div>

            <div v-for="course in filteredCourses"
                 :key="course.id"
                 class="courses-table-row">
                <label class="checkbox-cell">
                    <input v-model="selectedCourseIds"
                           type="checkbox"
                           :value="course.id" />
                </label>

                <div class="course-title-cell">
                    <div class="course-icon">▣</div>

                    <div>
                        <strong>{{ course.title }}</strong>
                    </div>
                </div>

                <p class="course-description">
                    {{ course.description }}
                </p>

                <span class="lesson-count">
                    {{ course.moduleCount }} stk
                </span>

                <div class="course-actions">
                    <button type="button"
                            title="Se tildeling"
                            @click="openAssignments(course)">
                        👥
                    </button>

                    <button type="button"
                            title="Redigér kursus"
                            @click="openEditCourse(course)">
                        ✎
                    </button>

                    <button type="button"
                            title="Duplikér kursus"
                            @click="openDuplicateCourse(course)">
                        ⧉
                    </button>

                    <button type="button"
                            title="Slet kursus"
                            class="delete-btn"
                            @click="removeCourse(course.id)">
                        🗑
                    </button>
                </div>
            </div>

            <div v-if="coursesError"
                 class="empty-state">
                {{ coursesError }}
            </div>

            <div v-else-if="isLoadingCourses"
                 class="empty-state">
                Henter kurser...
            </div>

            <div v-else-if="filteredCourses.length === 0"
                 class="empty-state">
                Ingen kurser matcher din søgning.
            </div>
        </div>

        <AdminCreateCourseForm v-if="showCreateCourseForm"
                               @close="closeCreateCourse" />

        <AdminEditCourseModal v-if="showEditModal && selectedCourseData"
                              :course-data="selectedCourseData"
                              :mode="editMode"
                              @close="closeEditModal"
                              @saved="handleCourseSaved" />

        <AdminCourseAssignmentsModal v-if="showAssignmentsModal && selectedCourse"
                                     :course="selectedCourse"
                                     @close="closeAssignments" />
    </div>
</template>

<script setup>
    import { computed, onMounted, ref } from "vue";

    import AdminCreateCourseForm from "./AdminCreateCourseForm.vue";
    import AdminEditCourseModal from "./AdminEditCourseModal.vue";
    import AdminCourseAssignmentsModal from "./AdminCourseAssignmentsModal.vue";

    import { getCourseForAdmin } from "../../data/dummyCourseService.js";

    const API_URL = import.meta.env.VITE_API_URL;

    const courses = ref([]);
    const coursesError = ref("");
    const isLoadingCourses = ref(true);

    const partners = ref([]);
    const partnersError = ref("");

    function mapCourseFromApi(course) {
        return {
            id: course._id,
            title: course.title,
            description: course.description,
            moduleCount: course.moduleCount ?? 0,
        };
    }

    async function loadCourses() {
        isLoadingCourses.value = true;
        coursesError.value = "";

        try {
            const res = await fetch(`${API_URL}/admin/courses`, {
                credentials: "include",
            });

            if (!res.ok) throw new Error("Kunne ikke hente kurser.");

            const data = await res.json();
            courses.value = Array.isArray(data.courses)
                ? data.courses.map(mapCourseFromApi)
                : [];
        } catch (err) {
            coursesError.value = err.message || "Kunne ikke hente kurser.";
            courses.value = [];
        } finally {
            isLoadingCourses.value = false;
        }
    }

    async function loadPartners() {
        try {
            const res = await fetch(`${API_URL}/admin/customers`, {
                credentials: "include",
            });

            if (!res.ok) throw new Error("Kunne ikke hente kunder.");

            const data = await res.json();
            partners.value = Array.isArray(data.users) ? data.users : [];
        } catch (err) {
            partnersError.value = err.message || "Kunne ikke hente kunder.";
        }
    }

    onMounted(() => {
        loadCourses();
        loadPartners();
    });

    const searchQuery = ref("");
    const receiverSearch = ref("");

    const selectedCourseIds = ref([]);
    const selectedPartnerIds = ref([]);

    const showReceiverDropdown = ref(false);
    const successMessage = ref("");

    const showCreateCourseForm = ref(false);
    const showEditModal = ref(false);
    const showAssignmentsModal = ref(false);

    const selectedCourse = ref(null);
    const selectedCourseData = ref(null);
    const editMode = ref("edit");

    const filteredCourses = computed(() => {
        const search = searchQuery.value.toLowerCase().trim();

        if (!search) {
            return courses.value;
        }

        return courses.value.filter((course) => {
            const title = course.title || "";
            const description = course.description || "";

            return (
                title.toLowerCase().includes(search) ||
                description.toLowerCase().includes(search)
            );
        });
    });

    const filteredPartnersForDropdown = computed(() => {
        const search = receiverSearch.value.toLowerCase().trim();

        if (!search) {
            return partners.value;
        }

        return partners.value.filter((partner) => {
            const contactPerson = partner.contactPerson || "";
            const companyName = partner.companyName || "";
            const email = partner.email || "";

            return (
                contactPerson.toLowerCase().includes(search) ||
                companyName.toLowerCase().includes(search) ||
                email.toLowerCase().includes(search)
            );
        });
    });

    const allVisibleCoursesSelected = computed(() => {
        if (filteredCourses.value.length === 0) {
            return false;
        }

        return filteredCourses.value.every((course) =>
            selectedCourseIds.value.includes(course.id)
        );
    });

    async function refreshCourses() {
        await loadCourses();
    }

    function toggleAllCourses() {
        if (allVisibleCoursesSelected.value) {
            selectedCourseIds.value = selectedCourseIds.value.filter((courseId) => {
                return !filteredCourses.value.some((course) => course.id === courseId);
            });

            return;
        }

        const visibleCourseIds = filteredCourses.value.map((course) => course.id);

        selectedCourseIds.value = Array.from(
            new Set([...selectedCourseIds.value, ...visibleCourseIds])
        );
    }

    function toggleReceiverDropdown() {
        showReceiverDropdown.value = !showReceiverDropdown.value;
    }

    async function assignSelectedCoursesToPartners() {
        if (selectedCourseIds.value.length === 0) return;
        if (selectedPartnerIds.value.length === 0) return;

        const pairs = [];
        for (const partnerId of selectedPartnerIds.value) {
            for (const courseId of selectedCourseIds.value) {
                pairs.push({ userId: partnerId, courseId });
            }
        }

        // 409 (allerede tildelt) er ikke en fejl her — vi tæller den bare ikke
        // som en ny tildeling. Andre fejlkoder lader vi boble op til UI'et.
        const results = await Promise.all(
            pairs.map(async ({ userId, courseId }) => {
                try {
                    const res = await fetch(`${API_URL}/admin/assign-course`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId, courseId }),
                    });

                    if (res.ok) return "created";
                    if (res.status === 409) return "duplicate";
                    return "error";
                } catch {
                    return "error";
                }
            })
        );

        const created = results.filter((r) => r === "created").length;
        const failed = results.filter((r) => r === "error").length;

        if (failed > 0) {
            successMessage.value = `${created} tildelinger oprettet, ${failed} fejlede.`;
        } else {
            successMessage.value = `${selectedCourseIds.value.length} kursus/kurser er tildelt til ${selectedPartnerIds.value.length} kunde/kunder.`;
        }

        selectedCourseIds.value = [];
        selectedPartnerIds.value = [];
        receiverSearch.value = "";
        showReceiverDropdown.value = false;

        setTimeout(() => {
            successMessage.value = "";
        }, 3500);
    }

    function clearBulkSelection() {
        selectedCourseIds.value = [];
        selectedPartnerIds.value = [];
        receiverSearch.value = "";
        showReceiverDropdown.value = false;
    }

    function openCreateCourse() {
        showCreateCourseForm.value = true;
    }

    function closeCreateCourse() {
        showCreateCourseForm.value = false;
        refreshCourses();
    }

    function openEditCourse(course) {
        const data = getCourseForAdmin(course.id);
        if (!data) {
            alert("Redigering for MongoDB-kurser er endnu ikke understøttet.");
            return;
        }
        selectedCourseData.value = data;
        editMode.value = "edit";
        showEditModal.value = true;
    }

    function openDuplicateCourse(course) {
        const data = getCourseForAdmin(course.id);
        if (!data) {
            alert("Duplikering for MongoDB-kurser er endnu ikke understøttet.");
            return;
        }
        selectedCourseData.value = data;
        editMode.value = "duplicate";
        showEditModal.value = true;
    }

    function closeEditModal() {
        showEditModal.value = false;
        selectedCourseData.value = null;
    }

    function handleCourseSaved() {
        closeEditModal();
        refreshCourses();
    }

    function openAssignments(course) {
        selectedCourse.value = course;
        showAssignmentsModal.value = true;
    }

    function closeAssignments() {
        showAssignmentsModal.value = false;
        selectedCourse.value = null;
    }

    async function removeCourse(courseId) {
        const shouldDelete = confirm("Er du sikker på, at du vil slette kurset?");

        if (!shouldDelete) return;

        try {
            const res = await fetch(`${API_URL}/admin/courses/${courseId}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!res.ok) throw new Error("Kunne ikke slette kurset.");

            await loadCourses();
        } catch (err) {
            coursesError.value = err.message || "Kunne ikke slette kurset.";
        }
    }
</script>

<style scoped>
    .courses-dashboard {
        padding: 40px;
    }

    .courses-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 36px;
    }

        .courses-header h1 {
            font-size: 38px;
            margin-bottom: 8px;
        }

        .courses-header p {
            color: #444;
        }

    .create-course-btn {
        background: #171717;
        color: white;
        border: none;
        padding: 14px 24px;
        border-radius: 10px;
        font-weight: 800;
        cursor: pointer;
    }

    .bulk-assign-box {
        background: #fff8e7;
        border: 1px solid #fde7a4;
        border-radius: 22px;
        padding: 22px 26px;
        margin-bottom: 34px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 24px;
    }

    .bulk-info {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .bulk-icon {
        width: 46px;
        height: 46px;
        background: #fff0c8;
        color: #ff4d26;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .bulk-info strong {
        display: block;
        margin-bottom: 4px;
    }

    .bulk-info p {
        color: #ff4d26;
        font-size: 14px;
    }

    .bulk-actions {
        display: flex;
        align-items: center;
        gap: 14px;
        position: relative;
    }

    .receiver-select-wrapper {
        position: relative;
    }

    .receiver-select-button {
        min-width: 250px;
        background: white;
        border: 1px solid #ffb4a3;
        color: #171717;
        border-radius: 10px;
        padding: 13px 16px;
        font-weight: 800;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        gap: 20px;
    }

    .receiver-dropdown {
        position: absolute;
        top: calc(100% + 10px);
        right: 0;
        width: 330px;
        max-height: 330px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 45px rgba(0, 0, 0, 0.14);
        padding: 14px;
        z-index: 50;
    }

        .receiver-dropdown input {
            width: 100%;
            border: 1px solid #eee;
            background: #fafafa;
            border-radius: 10px;
            padding: 12px 14px;
            margin-bottom: 12px;
        }

    .receiver-list {
        max-height: 250px;
        overflow-y: auto;
        display: grid;
        gap: 8px;
    }

    .receiver-option {
        display: grid;
        grid-template-columns: 24px 1fr;
        gap: 12px;
        align-items: start;
        padding: 10px;
        border-radius: 10px;
        cursor: pointer;
    }

        .receiver-option:hover {
            background: #fafafa;
        }

        .receiver-option input {
            width: 18px;
            height: 18px;
            margin-top: 2px;
        }

        .receiver-option strong {
            display: block;
            font-size: 14px;
        }

        .receiver-option p {
            color: #777;
            font-size: 13px;
            margin: 3px 0;
        }

        .receiver-option small {
            color: #999;
        }

    .receiver-empty {
        padding: 18px;
        text-align: center;
        color: #777;
    }

    .assign-to-customers-btn {
        background: #ff4d26;
        color: white;
        border: none;
        border-radius: 10px;
        padding: 14px 22px;
        font-weight: 800;
        cursor: pointer;
    }

        .assign-to-customers-btn:disabled {
            opacity: 0.45;
            cursor: not-allowed;
        }

    .cancel-bulk-btn {
        border: none;
        background: transparent;
        color: #999;
        font-weight: 800;
        cursor: pointer;
    }

    .success-message {
        background: #ecfdf3;
        color: #128a3d;
        border-radius: 14px;
        padding: 14px 18px;
        font-weight: 800;
        margin-bottom: 24px;
    }

    .courses-card {
        background: white;
        border-radius: 22px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
        overflow: hidden;
    }

    .courses-toolbar {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        padding: 24px;
    }

        .courses-toolbar input {
            width: 420px;
            max-width: 100%;
            border: none;
            background: #f8f8f8;
            border-radius: 12px;
            padding: 14px 18px;
        }

    .toolbar-btn {
        background: white;
        border: 1px solid #ddd;
        border-radius: 10px;
        padding: 12px 18px;
        font-weight: 700;
        cursor: pointer;
    }

    .courses-table-header,
    .courses-table-row {
        display: grid;
        grid-template-columns: 50px 1.4fr 2fr 0.7fr 0.9fr;
        align-items: center;
        column-gap: 30px;
    }

    .courses-table-header {
        background: #fafafa;
        padding: 18px 24px;
        color: #9ca3af;
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.12em;
    }

    .courses-table-row {
        padding: 22px 24px;
        border-bottom: 1px solid #f2f2f2;
    }

    .checkbox-cell input {
        width: 18px;
        height: 18px;
    }

    .course-title-cell {
        display: flex;
        align-items: center;
        gap: 14px;
    }

    .course-icon {
        width: 42px;
        height: 42px;
        border-radius: 10px;
        background: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .course-title-cell strong {
        display: block;
        margin-bottom: 5px;
    }

    .course-title-cell small {
        color: #9ca3af;
    }

    .course-description {
        color: #444;
        font-size: 13px;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .lesson-count {
        width: fit-content;
        background: #f5f5f5;
        border-radius: 10px;
        padding: 7px 12px;
        font-weight: 800;
    }

    .course-actions {
        display: flex;
        gap: 12px;
    }

        .course-actions button {
            border: none;
            background: transparent;
            cursor: pointer;
            font-size: 16px;
        }

    .delete-btn {
        color: #ff4d26;
    }

    .empty-state {
        padding: 32px;
        text-align: center;
        color: #777;
    }
</style>