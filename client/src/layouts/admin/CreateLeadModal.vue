<template>
    <div class="create-lead-overlay">
        <div class="create-lead-modal">
            <header class="create-lead-header">
                <div>
                    <h2>Opret lead / kunde</h2>
                    <p>Tilføj en ny kunde eller lead til onboarding-flowet.</p>
                </div>

                <button class="create-lead-close"
                        type="button"
                        @click="closeModal">
                    ×
                </button>
            </header>

            <div class="create-lead-body">
                <div class="form-group">
                    <label>Navn</label>

                    <input v-model="name"
                           type="text"
                           placeholder="F.eks. Anna Hansen" />
                </div>

                <div class="form-group">
                    <label>Email</label>

                    <input v-model="email"
                           type="email"
                           placeholder="F.eks. anna@firma.dk" />
                </div>

                <div class="form-group">
                    <label>Virksomhed</label>

                    <input v-model="company"
                           type="text"
                           placeholder="F.eks. Skiltehuset ApS" />
                </div>
            </div>

            <footer class="create-lead-footer">
                <button class="create-lead-btn create-lead-btn-light"
                        type="button"
                        @click="closeModal">
                    Annuller
                </button>

                <button class="create-lead-btn create-lead-btn-dark"
                        type="button"
                        :disabled="!isFormValid"
                        @click="createLead">
                    Opret lead
                </button>
            </footer>
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from "vue";

const emit = defineEmits(["close", "created"]);

const name = ref("");
const email = ref("");
const company = ref("");

const isFormValid = computed(() => {
  return (
    name.value.trim() !== "" &&
    email.value.trim() !== "" &&
    company.value.trim() !== ""
  );
});

function createLead() {
  if (!isFormValid.value) return;

  const newLead = {
    id: crypto.randomUUID(),
    name: name.value.trim(),
    email: email.value.trim(),
    company: company.value.trim(),
    status: "Lead klar",
    statusClass: "lead-ready",
    surveyProgress: 0,
    action: "Send survey",
  };

  emit("created", newLead);
  emit("close");
}

function closeModal() {
  emit("close");
}
</script>

<style scoped>
    .create-lead-overlay {
        position: fixed;
        inset: 0;
        z-index: 1100;
        background: rgba(0, 0, 0, 0.42);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
    }

    .create-lead-modal {
        width: 100%;
        max-width: 520px;
        background: white;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 24px 70px rgba(0, 0, 0, 0.18);
    }

    .create-lead-header {
        padding: 30px 32px 20px;
        display: flex;
        justify-content: space-between;
        gap: 20px;
    }

        .create-lead-header h2 {
            font-size: 22px;
            margin-bottom: 8px;
        }

        .create-lead-header p {
            color: #666;
            line-height: 1.4;
        }

    .create-lead-close {
        border: none;
        background: transparent;
        font-size: 32px;
        cursor: pointer;
        color: #999;
    }

    .create-lead-body {
        padding: 10px 32px 28px;
        display: grid;
        gap: 18px;
    }

    .form-group {
        display: grid;
        gap: 8px;
    }

        .form-group label {
            font-size: 13px;
            font-weight: 800;
            color: #333;
        }

        .form-group input {
            width: 100%;
            border: 1px solid #eee;
            background: #fafafa;
            border-radius: 12px;
            padding: 14px 16px;
            font-size: 14px;
        }

            .form-group input:focus {
                outline: 1px solid #ff4d26;
            }

    .create-lead-footer {
        padding: 24px 32px 32px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        background: #fafafa;
    }

    .create-lead-btn {
        border: none;
        padding: 15px 20px;
        border-radius: 14px;
        font-weight: 800;
        cursor: pointer;
    }

        .create-lead-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

    .create-lead-btn-light {
        background: white;
        color: #222;
        border: 1px solid #eee;
    }

    .create-lead-btn-dark {
        background: #171717;
        color: white;
    }
</style>