<template>
    <div class="create-lead-overlay">
        <div class="create-lead-modal">
            <header class="create-lead-header">
                <div>
                    <h2>Opret leads</h2>
                    <p>
                        Indtast én email manuelt eller upload en JSON-fil med flere emails.
                    </p>
                </div>

                <button class="create-lead-close"
                        type="button"
                        @click="closeModal">
                    ×
                </button>
            </header>

            <div class="create-lead-body">
                <section class="lead-create-section">
                    <h3>Tilføj manuelt</h3>

                    <div class="manual-email-row">
                        <input v-model="manualEmail"
                               type="email"
                               placeholder="F.eks. kunde@firma.dk"
                               @keyup.enter="addManualLead" />

                        <button class="create-lead-small-btn"
                                type="button"
                                @click="addManualLead">
                            Tilføj
                        </button>
                    </div>

                    <p v-if="manualError"
                       class="lead-error">
                        {{ manualError }}
                    </p>
                </section>

                <section class="lead-create-section">
                    <h3>Upload leads</h3>

                    <label class="upload-leads-box">
                        <strong>Upload leads JSON</strong>
                        <small>Format: [{ "email": "kunde@firma.dk" }]</small>

                        <input type="file"
                               accept="application/json"
                               hidden
                               @change="handleLeadFileUpload" />
                    </label>

                    <details class="json-example">
                        <summary>Se eksempel på JSON-format</summary>

                        <pre>[
  {
    "email": "anna@skiltehuset.dk"
  },
  {
    "email": "mikkel@nordicvisuals.dk"
  },
  {
    "email": "sara@modulexpartner.dk"
  }
]</pre>
                    </details>

                    <p v-if="uploadError"
                       class="lead-error">
                        {{ uploadError }}
                    </p>
                </section>

                <section v-if="pendingLeads.length > 0"
                         class="lead-table-section">
                    <div class="lead-table-top">
                        <h3>Leads klar til survey</h3>
                        <p>{{ selectedLeadCount }} af {{ pendingLeads.length }} valgt</p>
                    </div>

                    <div class="lead-upload-table">
                        <div class="lead-upload-header">
                            <span>Opret</span>
                            <span>Email</span>
                            <span>Kilde</span>
                            <span></span>
                        </div>

                        <div v-for="lead in pendingLeads"
                             :key="lead.id"
                             class="lead-upload-row">
                            <label class="checkbox-cell">
                                <input v-model="lead.selected"
                                       type="checkbox" />
                            </label>

                            <span>{{ lead.email }}</span>

                            <span class="lead-source">
                                {{ lead.source }}
                            </span>

                            <button class="remove-lead-btn"
                                    type="button"
                                    @click="removePendingLead(lead.id)">
                                Fjern
                            </button>
                        </div>
                    </div>
                </section>

                <div v-else
                     class="empty-leads-box">
                    <strong>Ingen leads tilføjet endnu</strong>
                    <p>Tilføj en email manuelt eller upload en JSON-fil.</p>
                </div>
            </div>

            <p v-if="submitError"
               class="lead-error">
                {{ submitError }}
            </p>

            <footer class="create-lead-footer">
                <button class="create-lead-btn create-lead-btn-light"
                        type="button"
                        @click="closeModal">
                    Annuller
                </button>

                <button class="create-lead-btn create-lead-btn-primary"
                        type="button"
                        :disabled="selectedLeadCount === 0 || isSubmitting"
                        @click="sendSurveyToLeads">
                    {{ isSubmitting ? "Sender..." : "Send survey til leads" }}
                </button>
            </footer>
        </div>
    </div>
</template>

<script setup>
    import { computed, ref } from "vue";

    const API_URL = import.meta.env.VITE_API_URL;

    const emit = defineEmits(["close", "created"]);

    const manualEmail = ref("");
    const manualError = ref("");
    const uploadError = ref("");
    const submitError = ref("");
    const isSubmitting = ref(false);

    const pendingLeads = ref([]);

    const selectedLeadCount = computed(() => {
        return pendingLeads.value.filter((lead) => lead.selected).length;
    });

    function makeId() {
        return crypto.randomUUID();
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function emailAlreadyExists(email) {
        return pendingLeads.value.some(
            (lead) => lead.email.toLowerCase() === email.toLowerCase()
        );
    }

    function addLeadToTable(email, source) {
        const cleanEmail = email.trim().toLowerCase();

        if (!isValidEmail(cleanEmail)) {
            return false;
        }

        if (emailAlreadyExists(cleanEmail)) {
            return false;
        }

        pendingLeads.value.push({
            id: makeId(),
            email: cleanEmail,
            selected: true,
            source,
        });

        return true;
    }

    function addManualLead() {
        manualError.value = "";

        const email = manualEmail.value.trim();

        if (!email) {
            manualError.value = "Skriv en email først.";
            return;
        }

        if (!isValidEmail(email)) {
            manualError.value = "Email-formatet er ikke korrekt.";
            return;
        }

        if (emailAlreadyExists(email)) {
            manualError.value = "Denne email er allerede tilføjet.";
            return;
        }

        addLeadToTable(email, "Manuel");
        manualEmail.value = "";
    }

    function handleLeadFileUpload(event) {
        uploadError.value = "";

        const file = event.target.files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = () => {
            try {
                const parsedData = JSON.parse(reader.result);

                if (!Array.isArray(parsedData)) {
                    uploadError.value = "Filen skal være et array med emails.";
                    return;
                }

                let addedCount = 0;

                parsedData.forEach((item) => {
                    const email =
                        typeof item === "string"
                            ? item
                            : item.email;

                    if (email && addLeadToTable(email, "Upload")) {
                        addedCount++;
                    }
                });

                if (addedCount === 0) {
                    uploadError.value =
                        "Ingen gyldige nye emails blev fundet i filen.";
                }
            } catch {
                uploadError.value = "Filen kunne ikke læses. Tjek at det er gyldig JSON.";
            }
        };

        reader.readAsText(file);

        event.target.value = "";
    }

    function removePendingLead(leadId) {
        pendingLeads.value = pendingLeads.value.filter(
            (lead) => lead.id !== leadId
        );
    }

    async function sendSurveyToLeads() {
        const selectedLeads = pendingLeads.value.filter((lead) => lead.selected);

        if (selectedLeads.length === 0) return;

        isSubmitting.value = true;
        submitError.value = "";

        // Opretter en lead-user pr. email i MongoDB med status pending_survey.
        // Fejler oprettelser for individuelle emails (fx 409 = duplikat)
        // markeres så admin kan se hvilke der ikke kom igennem.
        const results = await Promise.allSettled(
            selectedLeads.map(async (lead) => {
                const res = await fetch(`${API_URL}/admin/leads`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: lead.email }),
                });

                const body = await res.json().catch(() => ({}));

                if (!res.ok) {
                    throw new Error(
                        body.message || `Kunne ikke oprette ${lead.email}.`,
                    );
                }

                return body.user;
            }),
        );

        const created = results
            .filter((r) => r.status === "fulfilled" && r.value)
            .map((r) => r.value);

        const failed = results
            .map((r, i) => ({ result: r, lead: selectedLeads[i] }))
            .filter(({ result }) => result.status === "rejected");

        isSubmitting.value = false;

        if (failed.length > 0) {
            submitError.value = `${failed.length} af ${selectedLeads.length} kunne ikke oprettes (fx duplikater).`;
        }

        if (created.length > 0) {
            emit("created", created);
        }

        if (failed.length === 0) {
            emit("close");
        }
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
        max-width: 720px;
        max-height: 90vh;
        background: white;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 24px 70px rgba(0, 0, 0, 0.18);
        display: flex;
        flex-direction: column;
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
        gap: 22px;
        overflow-y: auto;
    }

    .lead-create-section {
        display: grid;
        gap: 12px;
    }

        .lead-create-section h3 {
            font-size: 15px;
            margin: 0;
        }

    .manual-email-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 12px;
    }

        .manual-email-row input {
            width: 100%;
            border: 1px solid #eee;
            background: #fafafa;
            border-radius: 12px;
            padding: 14px 16px;
            font-size: 14px;
        }

            .manual-email-row input:focus {
                outline: 1px solid #ff4d26;
            }

    .create-lead-small-btn {
        border: none;
        background: #171717;
        color: white;
        padding: 0 20px;
        border-radius: 12px;
        font-weight: 800;
        cursor: pointer;
    }

    .upload-leads-box {
        border: 1px dashed #ddd;
        background: #fafafa;
        border-radius: 16px;
        padding: 22px;
        display: grid;
        gap: 6px;
        cursor: pointer;
    }

        .upload-leads-box strong {
            color: #171717;
        }

        .upload-leads-box small {
            color: #777;
        }

    .json-example {
        background: #fafafa;
        border-radius: 12px;
        padding: 12px 14px;
    }

        .json-example summary {
            cursor: pointer;
            font-weight: 700;
        }

        .json-example pre {
            margin-top: 12px;
            white-space: pre-wrap;
            font-size: 12px;
            color: #444;
        }

    .lead-error {
        color: #ff4d26;
        font-size: 13px;
        font-weight: 700;
    }

    .lead-table-section {
        display: grid;
        gap: 12px;
    }

    .lead-table-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

        .lead-table-top h3 {
            font-size: 15px;
            margin: 0;
        }

        .lead-table-top p {
            color: #777;
            font-size: 13px;
        }

    .lead-upload-table {
        border: 1px solid #eee;
        border-radius: 16px;
        overflow: hidden;
    }

    .lead-upload-header,
    .lead-upload-row {
        display: grid;
        grid-template-columns: 70px 1fr 110px 90px;
        align-items: center;
        gap: 12px;
    }

    .lead-upload-header {
        background: #f5f5f5;
        padding: 14px 16px;
        font-size: 12px;
        font-weight: 800;
        color: #777;
        text-transform: uppercase;
    }

    .lead-upload-row {
        padding: 14px 16px;
        border-top: 1px solid #f0f0f0;
    }

    .checkbox-cell input {
        width: 18px;
        height: 18px;
    }

    .lead-source {
        color: #777;
        font-size: 13px;
    }

    .remove-lead-btn {
        border: none;
        background: white;
        color: #ff4d26;
        font-weight: 800;
        cursor: pointer;
    }

    .empty-leads-box {
        border: 1px dashed #ddd;
        background: #fafafa;
        border-radius: 16px;
        padding: 26px;
        text-align: center;
    }

        .empty-leads-box strong {
            display: block;
            margin-bottom: 6px;
        }

        .empty-leads-box p {
            color: #777;
        }

    .create-lead-footer {
        padding: 24px 32px 32px;
        display: grid;
        grid-template-columns: 1fr 1.3fr;
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

    .create-lead-btn-primary {
        background: #ff4d26;
        color: white;
    }
</style>