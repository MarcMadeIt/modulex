<template>
    <div class="assignments-overlay">
        <div class="assignments-modal">
            <header class="assignments-header">
                <div>
                    <span>Kursus statistik</span>
                    <h2>{{ course.title }}</h2>
                    <p>{{ course.description }}</p>
                </div>

                <button type="button"
                        @click="closeModal">
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

                <div v-if="isLoading"
                     class="empty-state">
                    Henter modtagere...
                </div>

                <div v-else-if="loadError"
                     class="empty-state">
                    {{ loadError }}
                </div>

                <div v-else-if="filteredAssignedPartners.length > 0"
                     class="receiver-list">
                    <div v-for="partner in filteredAssignedPartners"
                         :key="partner._id"
                         class="receiver-card">
                        <div>
                            <strong>{{ partner.contactPerson || partner.email }}</strong>
                            <p v-if="partner.companyName">{{ partner.companyName }}</p>
                            <small>{{ partner.email }}</small>
                        </div>

                        <div class="progress-area">
                            <span class="status-pill"
                                  :class="getProgressStatus(partner).class">
                                {{ getProgressStatus(partner).text }}
                            </span>

                            <div class="progress-bar">
                                <div class="progress-fill"
                                     :style="{ width: getPartnerProgress(partner) + '%' }"></div>
                            </div>

                            <strong>{{ getPartnerProgress(partner) }}% færdig</strong>
                        </div>
                    </div>
                </div>

                <div v-else
                     class="empty-state">
                    Kurset er ikke tildelt til nogen kunder endnu.
                </div>
            </section>

            <footer class="assignments-footer">
                <button type="button"
                        @click="closeModal">
                    Luk visning
                </button>
            </footer>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";

const props = defineProps({
  course: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["close"]);

const API_URL = import.meta.env.VITE_API_URL;

const searchQuery = ref("");
const isLoading = ref(true);
const loadError = ref("");

// Modtagere af det viste kursus hentes fra MongoDB.
const assignedPartners = ref([]);

const filteredAssignedPartners = computed(() => {
  const search = searchQuery.value.toLowerCase().trim();

  if (!search) {
    return assignedPartners.value;
  }

  return assignedPartners.value.filter((partner) => {
    const contactPerson = (partner.contactPerson || "").toLowerCase();
    const companyName = (partner.companyName || "").toLowerCase();
    const email = (partner.email || "").toLowerCase();

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

async function loadAssigned() {
  isLoading.value = true;
  loadError.value = "";

  const courseId = props.course?._id || props.course?.id;

  try {
    const res = await fetch(
      `${API_URL}/admin/courses/${courseId}/customers`,
      { credentials: "include" },
    );

    if (!res.ok) throw new Error("Kunne ikke hente modtagere.");

    const data = await res.json();
    assignedPartners.value = Array.isArray(data.customers)
      ? data.customers
      : [];
  } catch (err) {
    loadError.value = err.message || "Kunne ikke hente modtagere.";
    assignedPartners.value = [];
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadAssigned);

function getPartnerProgress(partner) {
  // Indtil UserProgress-data eksponeres pr. (user, course) er det
  // bare en placeholder beregnet ud fra _id, præcis som før.
  const id = String(partner._id || "");
  if (!id) return 0;
  const lastNumber = Number(id.slice(-1));

  if (Number.isNaN(lastNumber)) return 25;
  if (lastNumber % 3 === 0) return 100;
  if (lastNumber % 2 === 0) return 90;

  return 25;
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

    .progress-bar {
        width: 140px;
        height: 7px;
        background: #f1f1f1;
        border-radius: 50px;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: #ff4d26;
    }

    .empty-state {
        padding: 30px;
        text-align: center;
        color: #777;
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
