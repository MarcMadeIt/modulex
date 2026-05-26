<script setup>
    import { computed, onBeforeUnmount, onMounted, ref } from "vue";

    const emit = defineEmits(["close"]);
    const API_URL = import.meta.env.VITE_API_URL;

    const courseTitle = ref("");
    const courseDescription = ref("");
    const pdfContent = ref([]);
    const youtubeContent = ref([]);
    const isLoadingPdfs = ref(false);
    const isLoadingYoutube = ref(false);
    const isSaving = ref(false);
    const pdfError = ref("");
    const youtubeError = ref("");
    const submitError = ref("");

    const lessons = ref([
        {
            id: makeLocalId(),
            title: "",
            duration: "",
            materials: [],
        },
    ]);

    function makeLocalId() {
        return Date.now() + Math.random();
    }

    function addLesson() {
        lessons.value.push({
            id: makeLocalId(),
            title: "",
            duration: "",
            materials: [],
        });
    }

    function removeLesson(lessonId) {
        lessons.value = lessons.value.filter((lesson) => lesson.id !== lessonId);
    }

    function addMaterial(lesson, type) {
        lesson.materials.push({
            id: makeLocalId(),
            type,
            title: "",
            youtubeUrl: "",
            contentId: "",
            url: "",
            description: "",
        });
    }

    function removeMaterial(lesson, materialId) {
        lesson.materials = lesson.materials.filter(
            (material) => material.id !== materialId
        );
    }

    function moveMaterialUp(lesson, index) {
        if (index === 0) return;

        const materials = lesson.materials;
        const materialToMove = materials[index];

        materials.splice(index, 1);
        materials.splice(index - 1, 0, materialToMove);
    }

    function moveMaterialDown(lesson, index) {
        if (index === lesson.materials.length - 1) return;

        const materials = lesson.materials;
        const materialToMove = materials[index];

        materials.splice(index, 1);
        materials.splice(index + 1, 0, materialToMove);
    }

    function closeModal() {
        if (isSaving.value) return;

        emit("close");
    }

    function handleKeydown(event) {
        if (event.key === "Escape") {
            closeModal();
        }
    }

    onMounted(() => {
        window.addEventListener("keydown", handleKeydown);
        fetchPdfContent();
        fetchYoutubeContent();
    });

    onBeforeUnmount(() => {
        window.removeEventListener("keydown", handleKeydown);
    });

    function getYoutubeEmbedUrl(url) {
        if (!url) return "";

        const cleanUrl = url.trim();
        let videoId = "";

        if (cleanUrl.includes("youtube.com/watch?v=")) {
            videoId = cleanUrl.split("v=")[1]?.split("&")[0];
        }

        if (cleanUrl.includes("youtu.be/")) {
            videoId = cleanUrl.split("youtu.be/")[1]?.split("?")[0];
        }

        if (cleanUrl.includes("youtube.com/embed/")) {
            videoId = cleanUrl.split("embed/")[1]?.split("?")[0];
        }

        return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    }

    function getMaterialYoutubePreviewUrl(material) {
        return getYoutubeEmbedUrl(material.youtubeUrl);
    }

    function hasInvalidYoutubeUrl(material) {
        return material.youtubeUrl.trim() !== "" && !getMaterialYoutubePreviewUrl(material);
    }

    async function fetchPdfContent() {
        if (!API_URL) {
            pdfError.value = "VITE_API_URL mangler. Kan ikke hente PDF'er fra backend.";
            return;
        }

        isLoadingPdfs.value = true;
        pdfError.value = "";

        try {
            const response = await fetch(`${API_URL}/admin/content?type=pdf`, {
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Kunne ikke hente PDF'er fra backend.");
            }

            const data = await response.json();
            pdfContent.value = Array.isArray(data.content) ? data.content : [];
        } catch (error) {
            pdfError.value =
                error instanceof Error
                    ? error.message
                    : "Kunne ikke hente PDF'er fra backend.";
        } finally {
            isLoadingPdfs.value = false;
        }
    }

    async function fetchYoutubeContent() {
        if (!API_URL) {
            youtubeError.value =
                "VITE_API_URL mangler. Kan ikke hente YouTube-links fra backend.";
            return;
        }

        isLoadingYoutube.value = true;
        youtubeError.value = "";

        try {
            const response = await fetch(`${API_URL}/admin/content?type=youtube`, {
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Kunne ikke hente YouTube-links fra backend.");
            }

            const data = await response.json();
            youtubeContent.value = Array.isArray(data.content) ? data.content : [];
        } catch (error) {
            youtubeError.value =
                error instanceof Error
                    ? error.message
                    : "Kunne ikke hente YouTube-links fra backend.";
        } finally {
            isLoadingYoutube.value = false;
        }
    }

    function selectPdfContent(material) {
        const selectedPdf = pdfContent.value.find(
            (item) => item._id === material.contentId || item.id === material.contentId
        );

        if (!selectedPdf) {
            material.url = "";
            material.description = "";
            return;
        }

        material.title = selectedPdf.title;
        material.url = getBackendAssetUrl(selectedPdf.url);
        material.description = selectedPdf.description || "";
    }

    function selectYoutubeContent(material) {
        const selectedVideo = youtubeContent.value.find(
            (item) => item._id === material.contentId || item.id === material.contentId
        );

        if (!selectedVideo) {
            material.youtubeUrl = "";
            material.description = "";
            return;
        }

        material.title = selectedVideo.title;
        material.youtubeUrl = selectedVideo.url;
        material.description = selectedVideo.description || "";
    }

    function getBackendAssetUrl(url) {
        return url || "";
    }

    function isMaterialValid(material) {
        const hasTitle = material.title.trim() !== "";

        if (material.type === "video") {
            return hasTitle && getYoutubeEmbedUrl(material.youtubeUrl) !== "";
        }

        if (material.type === "pdf") {
            return hasTitle && material.url;
        }

        return false;
    }

    const isFormValid = computed(() => {
        const hasCourseTitle = courseTitle.value.trim() !== "";
        const hasCourseDescription = courseDescription.value.trim() !== "";

        const hasValidLessons = lessons.value.every((lesson) => {
            const hasLessonTitle = lesson.title.trim() !== "";
            const hasDuration = lesson.duration.trim() !== "";
            const hasMaterials = lesson.materials.length > 0;
            const allMaterialsValid = lesson.materials.every((material) =>
                isMaterialValid(material)
            );

            return hasLessonTitle && hasDuration && hasMaterials && allMaterialsValid;
        });

        return hasCourseTitle && hasCourseDescription && hasValidLessons;
    });

    function buildCoursePayload() {
        return {
            title: courseTitle.value.trim(),
            description: courseDescription.value.trim(),

            modules: lessons.value.map((lesson, index) => {
                return {
                    title: lesson.title.trim(),
                    description: "",
                    order: index + 1,
                    duration: lesson.duration.trim(),

                    materials: lesson.materials.map((material) => {
                        if (material.type === "video") {
                            return {
                                type: "youtube",
                                title: material.title.trim(),
                                url: getYoutubeEmbedUrl(material.youtubeUrl),
                                expectedDuration: parseInt(lesson.duration, 10) || undefined,
                            };
                        }

                        return {
                            type: "pdf",
                            title: material.title.trim(),
                            url: material.url,
                        };
                    }),
                };
            }),
        };
    }

    async function createCourseInBackend(newCourse) {
        const courseResponse = await fetch(`${API_URL}/admin/courses`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: newCourse.title,
                description: newCourse.description,
            }),
        });

        if (!courseResponse.ok) {
            throw new Error("Kurset kunne ikke oprettes i backend.");
        }

        const courseData = await courseResponse.json();
        const courseId = courseData.course?._id || courseData.course?.id;

        if (!courseId) {
            throw new Error("Backend returnerede ikke et kursus-id.");
        }

        for (const module of newCourse.modules) {
            const moduleResponse = await fetch(`${API_URL}/admin/courses/${courseId}/modules`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: module.title,
                    description: module.description,
                    order: module.order,
                    materials: module.materials,
                }),
            });

            if (!moduleResponse.ok) {
                throw new Error("Et modul kunne ikke oprettes i backend.");
            }
        }

        return courseData.course;
    }

    async function createNewCourse() {
        if (!isFormValid.value || isSaving.value) return;

        isSaving.value = true;
        submitError.value = "";

        const newCourse = buildCoursePayload();

        try {
            if (!API_URL) {
                throw new Error("VITE_API_URL mangler. Kan ikke gemme til backend.");
            }

            await createCourseInBackend(newCourse);
        } catch (error) {
            submitError.value =
                error instanceof Error
                    ? error.message
                    : "Kurset kunne ikke oprettes i backend.";
            return;
        } finally {
            isSaving.value = false;
        }

        emit("close");
    }
</script>

<template>
    <div class="modal-overlay"
         @click.self="closeModal">
        <div class="modal">
            <header class="modal-header">
                <div>
                    <h1>Opret nyt kursus</h1>
                    <p>Definer kursusindhold og lektioner.</p>
                </div>

                <button class="modal-close"
                        type="button"
                        @click="closeModal">
                    ×
                </button>
            </header>

            <div class="modal-body">
                <section class="form-section">
                    <h2 class="form-section-title">Kursus info</h2>

                    <div class="form-group">
                        <input v-model="courseTitle"
                               class="input"
                               type="text"
                               placeholder="Kursus titel" />
                    </div>

                    <div class="form-group">
                        <textarea v-model="courseDescription"
                                  class="input textarea"
                                  placeholder="Kort beskrivelse af kurset..."></textarea>
                    </div>
                </section>

                <section class="form-section">
                    <h2 class="form-section-title">Lektioner / trin</h2>

                    <article v-for="lesson in lessons"
                             :key="lesson.id"
                             class="lesson-card">
                        <div class="form-group">
                            <label class="input-label">Titel på trin</label>

                            <input v-model="lesson.title"
                                   class="input"
                                   type="text"
                                   placeholder="F.eks. Se video og læs guide" />
                        </div>

                        <div class="form-group">
                            <label class="input-label">Varighed / omfang</label>

                            <input v-model="lesson.duration"
                                   class="input"
                                   type="text"
                                   placeholder="F.eks. 12 min" />
                        </div>

                        <div class="lesson-materials-header">
                            <div>
                                <h3>Materialer til dette trin</h3>
                                <p>Tilføj én eller flere videoer/PDF’er til samme trin.</p>
                            </div>

                            <div class="material-add-actions">
                                <button class="btn btn-light"
                                        type="button"
                                        @click="addMaterial(lesson, 'video')">
                                    + Video
                                </button>

                                <button class="btn btn-light"
                                        type="button"
                                        @click="addMaterial(lesson, 'pdf')">
                                    + PDF
                                </button>
                            </div>
                        </div>

                        <div v-if="lesson.materials.length === 0"
                             class="material-empty-state">
                            <strong>Ingen materialer endnu</strong>
                            <p>Klik på + Video eller + PDF for at tilføje materiale til trinnet.</p>
                        </div>

                        <div v-for="(material, materialIndex) in lesson.materials"
                             :key="material.id"
                             class="material-card">
                            <div class="material-card-top">
                                <div>
                                    <strong>
                                        {{ materialIndex + 1 }}. {{ material.type === "video" ? "Video" : "PDF" }}
                                    </strong>

                                    <p>
                                        {{
                      material.type === "video"
                        ? "YouTube-link"
                        : "PDF-fil"
                                        }}
                                    </p>
                                </div>

                                <div class="material-order-actions">
                                    <button type="button"
                                            :disabled="materialIndex === 0"
                                            @click="moveMaterialUp(lesson, materialIndex)">
                                        ↑
                                    </button>

                                    <button type="button"
                                            :disabled="materialIndex === lesson.materials.length - 1"
                                            @click="moveMaterialDown(lesson, materialIndex)">
                                        ↓
                                    </button>

                                    <button type="button"
                                            class="remove-material-btn"
                                            @click="removeMaterial(lesson, material.id)">
                                        Fjern
                                    </button>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="input-label">Titel på materiale</label>

                                <input v-model="material.title"
                                       class="input"
                                       type="text"
                                       placeholder="F.eks. Introduktionsvideo eller produktguide" />
                            </div>

                            <div v-if="material.type === 'video'"
                                 class="form-group">
                                <label class="input-label">YouTube fra content-systemet</label>

                                <select v-model="material.contentId"
                                        class="input"
                                        :disabled="isLoadingYoutube || youtubeContent.length === 0"
                                        @change="selectYoutubeContent(material)">
                                    <option value="">
                                        {{ isLoadingYoutube ? "Henter YouTube-links..." : "Vælg en video" }}
                                    </option>

                                    <option v-for="video in youtubeContent"
                                            :key="video._id || video.id"
                                            :value="video._id || video.id">
                                        {{ video.title }}
                                    </option>
                                </select>

                                <p v-if="youtubeError"
                                   class="form-alert form-alert-error">
                                    {{ youtubeError }}
                                </p>

                                <p v-else-if="!isLoadingYoutube && youtubeContent.length === 0"
                                   class="form-alert">
                                    Ingen YouTube-links fundet i backend endnu.
                                </p>

                                <label class="input-label">YouTube-link</label>

                                <input v-model="material.youtubeUrl"
                                       class="input"
                                       type="url"
                                       placeholder="Indsæt YouTube-link her..." />

                                <div v-if="getMaterialYoutubePreviewUrl(material)"
                                     class="video-preview">
                                    <iframe :src="getMaterialYoutubePreviewUrl(material)"
                                            title="YouTube video preview"
                                            frameborder="0"
                                            allowfullscreen></iframe>
                                </div>

                                <div v-else
                                     class="upload-placeholder">
                                    <span class="upload-icon">▶</span>
                                    <strong>
                                        {{
                                            hasInvalidYoutubeUrl(material)
                                                ? "Linket er ikke en direkte YouTube-video"
                                                : "Indsæt et YouTube-link"
                                        }}
                                    </strong>
                                    <small>
                                        {{
                                            hasInvalidYoutubeUrl(material)
                                                ? "Brug watch, youtu.be eller embed-link for at oprette kurset"
                                                : "Videoen vises automatisk her"
                                        }}
                                    </small>

                                    <a v-if="hasInvalidYoutubeUrl(material)"
                                       class="pdf-preview-link"
                                       :href="material.youtubeUrl"
                                       target="_blank"
                                       rel="noopener noreferrer">
                                        Åbn link
                                    </a>
                                </div>
                            </div>

                            <div v-if="material.type === 'pdf'"
                                 class="form-group">
                                <label class="input-label">PDF fra content-systemet</label>

                                <select v-model="material.contentId"
                                        class="input"
                                        :disabled="isLoadingPdfs || pdfContent.length === 0"
                                        @change="selectPdfContent(material)">
                                    <option value="">
                                        {{ isLoadingPdfs ? "Henter PDF'er..." : "Vælg en PDF" }}
                                    </option>

                                    <option v-for="pdf in pdfContent"
                                            :key="pdf._id || pdf.id"
                                            :value="pdf._id || pdf.id">
                                        {{ pdf.title }}
                                    </option>
                                </select>

                                <p v-if="pdfError"
                                   class="form-alert form-alert-error">
                                    {{ pdfError }}
                                </p>

                                <p v-else-if="!isLoadingPdfs && pdfContent.length === 0"
                                   class="form-alert">
                                    Ingen PDF'er fundet i backend endnu.
                                </p>

                                <a v-if="material.url"
                                   class="pdf-preview-link"
                                   :href="material.url"
                                   target="_blank"
                                   rel="noopener noreferrer">
                                    Åbn valgt PDF
                                </a>
                            </div>
                        </div>

                        <button v-if="lessons.length > 1"
                                class="btn btn-text"
                                type="button"
                                @click="removeLesson(lesson.id)">
                            Fjern trin
                        </button>
                    </article>

                    <button class="add-lesson-btn"
                            type="button"
                            @click="addLesson">
                        + Tilføj trin til kursus
                    </button>
                </section>
            </div>

            <footer class="modal-footer">
                <p v-if="submitError"
                   class="form-alert form-alert-error">
                    {{ submitError }}
                </p>

                <button class="btn btn-light"
                        type="button"                        
                        :disabled="isSaving"
                        @click="closeModal">
                    Annuller
                </button>

                <button class="btn btn-primary"
                        type="button"
                        :disabled="!isFormValid || isSaving"
                        @click="createNewCourse">
                    {{ isSaving ? "Opretter..." : "Opret kursus nu" }}
                </button>
            </footer>
        </div>
    </div>
</template>

<style scoped>
    .lesson-materials-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin: 22px 0 14px;
    }

        .lesson-materials-header h3 {
            font-size: 15px;
            margin-bottom: 4px;
        }

        .lesson-materials-header p {
            color: #777;
            font-size: 13px;
        }

    .material-add-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
    }

    .material-empty-state {
        border: 1px dashed #ddd;
        background: #fafafa;
        border-radius: 16px;
        padding: 22px;
        text-align: center;
        margin-bottom: 16px;
    }

        .material-empty-state strong {
            display: block;
            margin-bottom: 6px;
        }

        .material-empty-state p {
            color: #777;
            font-size: 13px;
        }

    .material-card {
        border: 1px solid #eee;
        background: #fafafa;
        border-radius: 16px;
        padding: 18px;
        margin-bottom: 14px;
    }

    .material-card-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 14px;
    }

        .material-card-top strong {
            display: block;
            font-size: 13px;
            text-transform: uppercase;
            color: #ff4d26;
            margin-bottom: 4px;
        }

        .material-card-top p {
            color: #777;
            font-size: 12px;
        }

    .material-order-actions {
        display: flex;
        gap: 6px;
        flex-shrink: 0;
    }

        .material-order-actions button {
            border: none;
            background: white;
            color: #222;
            border-radius: 8px;
            padding: 8px 10px;
            font-weight: 800;
            cursor: pointer;
        }

            .material-order-actions button:disabled {
                opacity: 0.35;
                cursor: not-allowed;
            }

    .remove-material-btn {
        color: #ff4d26 !important;
    }

    .form-alert {
        border: 1px solid #eee;
        background: #fafafa;
        color: #666;
        border-radius: 12px;
        padding: 12px 14px;
        font-size: 13px;
        font-weight: 700;
        margin-top: 10px;
    }

    .form-alert-error {
        border-color: rgba(239, 65, 35, 0.22);
        background: rgba(239, 65, 35, 0.06);
        color: #c9361a;
    }

    .pdf-preview-link {
        display: inline-flex;
        margin-top: 10px;
        color: #ff4d26;
        font-size: 13px;
        font-weight: 800;
        text-decoration: none;
    }

    .pdf-preview-link:hover {
        text-decoration: underline;
    }

    .modal-footer .form-alert {
        grid-column: 1 / -1;
    }
</style>
