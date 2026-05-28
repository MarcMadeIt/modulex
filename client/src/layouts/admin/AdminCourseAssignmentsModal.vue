<template>
    <div class="assignments-overlay">
        <div class="assignments-modal">
            <header class="assignments-header">
                <div>
                    <span>Kursus statistik</span>
                    <h2>{{ course.title }}</h2>
                    <p>{{ course.description }}</p>
                </div>

                <button type="button" @click="closeModal">
                    ×
                </button>
            </header>

            <div class="stats-grid">
                <div class="stat-box">
                    <span>Tildelt til</span>
                    <strong>{{ assignedPartners.length }}</strong>
                    <p>kunder i alt</p>
                </div>

                <div class="stat-box">
                    <span>Gennemført af</span>
                    <strong>{{ completedCount }}</strong>
                    <p>kunder</p>
                </div>
            </div>

            <section class="receiver-section">
                <div class="receiver-header">
                    <h3>Modtagere og status</h3>

                    <input v-model="searchQuery"
                           type="text"
                           placeholder="Søg i modtagere..." />
                </div>

                <div v-if="isLoading" class="empty-state">
                    Henter modtagere og progress...
                </div>

                <div v-else-if="loadError" class="empty-state error">
                    {{ loadError }}
                </div>

                <div v-else-if="filteredAssignedPartners.length > 0" class="receiver-list">
                    <div v-for="partner in filteredAssignedPartners"
                         :key="partner._id || partner.id"
                         class="receiver-card">
                        <div>
                            <strong>
                                {{ partner.contactPerson || partner.name || partner.email }}
                            </strong>

                            <p v-if="partner.companyName || partner.company">
                                {{ partner.companyName || partner.company }}
                            </p>

                            <small>{{ partner.email }}</small>
                        </div>

                        <div class="progress-area">
                            <span class="status-pill"
                                  :class="getProgressStatus(partner).class">
                                {{ getProgressStatus(partner).text }}
                            </span>

                            <ProgressBar class="admin-progress-bar"
                                         :percentage="getPartnerProgress(partner)" />

                            <div class="progress-meta">
                                <strong>{{ getPartnerProgress(partner) }}% færdig</strong>

                                <small>
                                    {{ getCompletedModules(partner) }} /
                                    {{ getTotalModules(partner) }}
                                    moduler
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="empty-state">
                    Kurset er ikke tildelt til nogen kunder endnu.
                </div>
            </section>

            <footer class="assignments-footer">
                <button type="button" @click="closeModal">
                    Luk visning
                </button>
            </footer>
        </div>
    </div>
</template>

<script setup>
    import { computed, onMounted, ref } from "vue";

    import ProgressBar from "../../components/ui/ProgressBar.vue";

    const props = defineProps({
        course: {
            type: Object,
            required: true,
        },
    });

    const emit = defineEmits(["close"]);

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

    const searchQuery = ref("");
    const isLoading = ref(true);
    const loadError = ref("");

    const assignedPartners = ref([]);

    const courseId = computed(() => {
        return props.course?._id || props.course?.id || props.course?.courseId;
    });

    const filteredAssignedPartners = computed(() => {
        const search = searchQuery.value.toLowerCase().trim();

        if (!search) {
            return assignedPartners.value;
        }

        return assignedPartners.value.filter((partner) => {
            const contactPerson = String(
                partner.contactPerson || partner.name || ""
            ).toLowerCase();

            const companyName = String(
                partner.companyName || partner.company || ""
            ).toLowerCase();

            const email = String(partner.email || "").toLowerCase();

            return (
                contactPerson.includes(search) ||
                companyName.includes(search) ||
                email.includes(search)
            );
        });
    });

    const completedCount = computed(() => {
        return assignedPartners.value.filter((partner) => {
            return getPartnerProgress(partner) >= 100;
        }).length;
    });

    onMounted(() => {
        loadAssigned();
    });

    function getToken() {
        return (
            localStorage.getItem("token") ||
            localStorage.getItem("authToken") ||
            localStorage.getItem("modulex_token")
        );
    }

    async function apiFetch(path, options = {}) {
        const token = getToken();

        const headers = {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}${path}`, {
            ...options,
            headers,
            credentials: "include",
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || data.error || `API fejl: ${response.status}`);
        }

        return data;
    }

    async function loadAssigned() {
        isLoading.value = true;
        loadError.value = "";

        if (!courseId.value) {
            loadError.value = "CourseId mangler.";
            assignedPartners.value = [];
            isLoading.value = false;
            return;
        }

        try {
            const assignedData = await apiFetch(
                `/admin/courses/${courseId.value}/customers`
            );

            const customers = Array.isArray(assignedData.customers)
                ? assignedData.customers
                : Array.isArray(assignedData.users)
                    ? assignedData.users
                    : Array.isArray(assignedData)
                        ? assignedData
                        : [];

            const customersWithProgress = await Promise.all(
                customers.map(async (customer) => {
                    return enrichCustomerWithCourseProgress(customer);
                })
            );

            assignedPartners.value = customersWithProgress;
        } catch (err) {
            loadError.value = err.message || "Kunne ikke hente modtagere.";
            assignedPartners.value = [];
        } finally {
            isLoading.value = false;
        }
    }

    async function enrichCustomerWithCourseProgress(customer) {
        const customerId =
            customer._id ||
            customer.id ||
            customer.userId ||
            customer.customerId;

        if (!customerId) {
            return {
                ...customer,
                courseProgress: createEmptyProgress(),
            };
        }

        try {
            const data = await apiFetch(`/admin/customers/${customerId}/courses`);

            const assignments = Array.isArray(data.assignments)
                ? data.assignments
                : Array.isArray(data.courses)
                    ? data.courses
                    : Array.isArray(data.assignedCourses)
                        ? data.assignedCourses
                        : Array.isArray(data)
                            ? data
                            : [];

            const matchingAssignment = assignments.find((assignment) => {
                const assignmentCourseId =
                    assignment.courseId ||
                    assignment.course ||
                    assignment._id ||
                    assignment.id ||
                    assignment.course?._id ||
                    assignment.course?.id;

                return String(assignmentCourseId) === String(courseId.value);
            });

            return {
                ...customer,
                courseProgress: matchingAssignment
                    ? normalizeCourseProgress(matchingAssignment)
                    : createEmptyProgress(),
            };
        } catch (error) {
            console.error("Kunne ikke hente progress for kunde:", customerId, error);

            return {
                ...customer,
                courseProgress: createEmptyProgress(),
            };
        }
    }

    function normalizeCourseProgress(progressData) {
        const completedModules = Number(progressData.completedModules ?? 0);
        const totalModules = Number(progressData.totalModules ?? 0);

        let percentage = Number(progressData.percentage ?? 0);

        if (
            (progressData.percentage === undefined || progressData.percentage === null) &&
            totalModules > 0
        ) {
            percentage = Math.round((completedModules / totalModules) * 100);
        }

        if (Number.isNaN(percentage)) {
            percentage = 0;
        }

        return {
            completedModules: Number.isNaN(completedModules) ? 0 : completedModules,
            totalModules: Number.isNaN(totalModules) ? 0 : totalModules,
            percentage: Math.max(0, Math.min(100, Math.round(percentage))),
        };
    }

    function createEmptyProgress() {
        return {
            completedModules: 0,
            totalModules: 0,
            percentage: 0,
        };
    }

    function getPartnerProgress(partner) {
        return partner.courseProgress?.percentage ?? 0;
    }

    function getCompletedModules(partner) {
        return partner.courseProgress?.completedModules ?? 0;
    }

    function getTotalModules(partner) {
        return partner.courseProgress?.totalModules ?? 0;
    }

    function getProgressStatus(partner) {
        const progress = getPartnerProgress(partner);

        if (progress >= 100) {
            return {
                text: "Fuldført",
                class: "completed",
            };
        }

        if (progress > 0) {
            return {
                text: "I gang",
                class: "active",
            };
        }

        return {
            text: "Ikke påbegyndt",
            class: "not-started",
        };
    }

    function closeModal() {
        emit("close");
    }
</script>

<style scoped>
    .assignments-overlay {
        position: fixed;
        inset: 0;
        z-index: 1300;
        background: rgba(0, 0, 0, 0.42);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 32px;
    }

    .assignments-modal {
        width: 100%;
        max-width: 720px;
        max-height: 90vh;
        background: white;
        border-radius: 24px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .assignments-header {
        padding: 34px 40px 28px;
        display: flex;
        justify-content: space-between;
        gap: 24px;
    }

        .assignments-header span {
            color: #ff4d26;
            text-transform: uppercase;
            font-size: 12px;
            font-weight: 900;
        }

        .assignments-header h2 {
            font-size: 28px;
            margin: 8px 0;
        }

        .assignments-header p {
            color: #555;
            line-height: 1.5;
        }

        .assignments-header button {
            width: 42px;
            height: 42px;
            border: none;
            background: #fafafa;
            border-radius: 50%;
            font-size: 28px;
            cursor: pointer;
        }

    .stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 18px;
        padding: 0 40px 28px;
    }

    .stat-box {
        border: 1px solid #eee;
        border-radius: 16px;
        padding: 22px;
    }

        .stat-box span {
            color: #9ca3af;
            text-transform: uppercase;
            font-size: 12px;
            font-weight: 900;
        }

        .stat-box strong {
            display: block;
            font-size: 28px;
            margin: 10px 0;
        }

        .stat-box p {
            color: #777;
        }

    .receiver-section {
        padding: 28px 40px;
        overflow-y: auto;
    }

    .receiver-header {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 16px;
    }

        .receiver-header h3 {
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }

        .receiver-header input {
            border: 1px solid #222;
            border-radius: 12px;
            padding: 12px 14px;
            background: var(--color-input-bg);
        }

    .receiver-list {
        display: grid;
        gap: 12px;
    }

    .receiver-card {
        border: 1px solid #eee;
        border-radius: 16px;
        padding: 18px 20px;
        display: grid;
        grid-template-columns: 1.3fr 1fr;
        gap: 24px;
        align-items: center;
    }

        .receiver-card strong {
            display: block;
            margin-bottom: 6px;
        }

        .receiver-card p,
        .receiver-card small {
            color: #777;
        }

    .progress-area {
        display: grid;
        gap: 8px;
        justify-items: end;
        width: 100%;
    }

    .admin-progress-bar {
        width: 160px;
    }

        .admin-progress-bar :deep(.progress) {
            height: 10px;
            border-radius: 999px;
            background: #f1f1f1;
        }

        .admin-progress-bar :deep(.progress-fill) {
            border-radius: 999px;
        }

    .progress-meta {
        display: grid;
        gap: 2px;
        justify-items: end;
    }

        .progress-meta small {
            color: #777;
            font-size: 12px;
            font-weight: 700;
        }

    .status-pill {
        width: fit-content;
        border-radius: 20px;
        padding: 7px 12px;
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
    }

        .status-pill.active {
            background: #fff3ed;
            color: #ff4d26;
        }

        .status-pill.completed {
            background: #ecfdf3;
            color: #128a3d;
        }

        .status-pill.not-started {
            background: #f4f4f5;
            color: #71717a;
        }

    .empty-state {
        padding: 30px;
        text-align: center;
        color: #777;
    }

        .empty-state.error {
            color: #b91c1c;
        }

    .assignments-footer {
        padding: 24px 40px 32px;
        background: #fafafa;
    }

        .assignments-footer button {
            width: 100%;
            border: none;
            background: #171717;
            color: white;
            border-radius: 14px;
            padding: 16px;
            font-weight: 900;
            cursor: pointer;
        }
</style>